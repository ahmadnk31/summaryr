import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/welcome-email';
import { CancellationEmail } from '@/emails/cancellation-email';
import { getBaseUrl } from '@/lib/url';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error(`[STRIPE_WEBHOOK_ERROR] Signature verification failed: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    // Initialize Supabase Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[STRIPE_WEBHOOK_ERROR] Missing Supabase environment variables');
        return new NextResponse("Server Configuration Error", { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        console.log(`[STRIPE_WEBHOOK] Processing event: ${event.type} [${event.id}]`);

        // Get safe base URL for emails
        let baseUrl = 'http://localhost:3000';
        try {
            baseUrl = getBaseUrl();
        } catch (e) {
            console.error('[STRIPE_WEBHOOK_WARN] Failed to get base URL, defaulting to localhost:', e);
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;
                const subscriptionId = session.subscription as string;
                const planName = session.metadata?.planName || 'pro';
                const customerEmail = session.customer_details?.email as string;
                const customerName = session.customer_details?.name as string || "User";

                console.log(`[STRIPE_WEBHOOK] Checkout completed for User: ${userId}, Plan: ${planName}`);

                if (userId && subscriptionId) {
                    // Retrieve subscription to get status
                    const sub = await stripe.subscriptions.retrieve(subscriptionId);

                    const { error } = await supabaseAdmin
                        .from('profiles')
                        .update({
                            stripe_subscription_id: subscriptionId,
                            subscription_status: sub.status,
                            plan_tier: planName,
                            stripe_customer_id: session.customer as string // Ensure this is set
                        })
                        .eq('id', userId);

                    if (error) {
                        console.error('[STRIPE_WEBHOOK_ERROR] Failed to update profile (checkout):', error);
                        throw error;
                    }
                    console.log(`[STRIPE_WEBHOOK] Profile updated for User: ${userId}`);

                    // Send Welcome Email
                    if (customerEmail) {
                        try {
                            const { error: emailError } = await resend.emails.send({
                                from: 'Summaryr Support <support@summaryr.com>',
                                to: customerEmail,
                                subject: `Welcome to Summaryr ${planName.charAt(0).toUpperCase() + planName.slice(1)}!`,
                                react: WelcomeEmail({
                                    name: customerName,
                                    dashboardUrl: `${baseUrl}/dashboard`,
                                    planName: planName
                                })
                            });

                            if (emailError) {
                                console.error('[STRIPE_WEBHOOK_ERROR] Failed to send welcome email:', emailError);
                            } else {
                                console.log(`[STRIPE_WEBHOOK] Welcome email sent to ${customerEmail}`);
                            }
                        } catch (emailErr) {
                            console.error('[STRIPE_WEBHOOK_ERROR] Exception sending welcome email:', emailErr);
                        }
                    }

                } else {
                    console.error('[STRIPE_WEBHOOK_ERROR] Missing userId or subscriptionId in session metadata');
                }
                break;
            }

            case 'customer.subscription.updated': {
                const sub = event.data.object as Stripe.Subscription;
                console.log(`[STRIPE_WEBHOOK] Subscription updated: ${sub.id}, Status: ${sub.status}`);

                const { error, count } = await supabaseAdmin
                    .from('profiles')
                    .update({
                        subscription_status: sub.status,
                    })
                    .eq('stripe_customer_id', sub.customer as string);

                if (error) {
                    console.error('[STRIPE_WEBHOOK_ERROR] Failed to update profile (sub update):', error);
                } else if (count === 0) {
                    console.warn(`[STRIPE_WEBHOOK_WARN] No profile found for customer: ${sub.customer}`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object as Stripe.Subscription;
                console.log(`[STRIPE_WEBHOOK] Subscription deleted: ${sub.id}`);

                // Fetch customer to get email if not expandable in event
                let customerEmail = '';
                let customerName = 'User';

                try {
                    const customer = await stripe.customers.retrieve(sub.customer as string);
                    if (!customer.deleted) {
                        customerEmail = customer.email as string;
                        customerName = customer.name as string || 'User';
                    }
                } catch (e) {
                    console.error('Failed to fetch customer for email', e);
                }

                const { error } = await supabaseAdmin
                    .from('profiles')
                    .update({
                        subscription_status: 'canceled',
                        plan_tier: 'free'
                    })
                    .eq('stripe_customer_id', sub.customer as string);

                if (error) {
                    console.error('[STRIPE_WEBHOOK_ERROR] Failed to update profile (sub delete):', error);
                }

                // Send Cancellation Email
                if (customerEmail) {
                    try {
                        const { error: emailError } = await resend.emails.send({
                            from: 'Summaryr Support <support@summaryr.com>',
                            to: customerEmail,
                            subject: 'We\'re sorry to see you go',
                            react: CancellationEmail({
                                name: customerName,
                                pricingUrl: `${baseUrl}/pricing`
                            })
                        });

                        if (emailError) {
                            console.error('[STRIPE_WEBHOOK_ERROR] Failed to send cancellation email:', emailError);
                        } else {
                            console.log(`[STRIPE_WEBHOOK] Cancellation email sent to ${customerEmail}`);
                        }
                    } catch (emailErr) {
                        console.error('[STRIPE_WEBHOOK_ERROR] Exception sending cancellation email:', emailErr);
                    }
                }

                break;
            }

            default:
                console.log(`[STRIPE_WEBHOOK] Unhandled event type: ${event.type}`);
        }
    } catch (error) {
        console.error('[STRIPE_WEBHOOK_ERROR] Handler execution failed:', error);
        return new NextResponse("Webhook Handler Error", { status: 500 });
    }

    return new NextResponse("Webhook Received", { status: 200 });
}
