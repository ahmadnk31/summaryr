import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const { priceId, planName } = await req.json();
        const supabase = await createClient();

        // 1. Get the current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 2. Get user profile (and check for existing stripe_customer_id)
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id, email')
            .eq('id', user.id)
            .single();

        let stripeCustomerId = profile?.stripe_customer_id;

        // 3. Create Stripe Customer if doesn't exist
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email || profile?.email || undefined,
                metadata: {
                    supabase_user_id: user.id,
                },
            });
            stripeCustomerId = customer.id;

            // Update profile with new customer ID
            await supabase
                .from('profiles')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('id', user.id);
        }

        let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        if (!appUrl.startsWith('http')) {
            appUrl = `http://${appUrl}`;
        }

        // 4. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                userId: user.id,
                planName: planName, // 'pro' or 'team'
            },
            success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/payment/cancelled`,
            allow_promotion_codes: true,
            billing_address_collection: 'required',
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('[STRIPE_CHECKOUT_ERROR]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
