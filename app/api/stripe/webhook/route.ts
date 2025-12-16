import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

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

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;
                const subscriptionId = session.subscription as string;
                const planName = session.metadata?.planName || 'pro';

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
                    .eq('stripe_customer_id', sub.customer as string); // customer is string ID

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
