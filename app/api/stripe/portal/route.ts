import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();

        if (!profile?.stripe_customer_id) {
            return new NextResponse("No Stripe customer found", { status: 400 });
        }

        // Ensure APP_URL has protocol
        let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        if (!appUrl.startsWith('http')) {
            appUrl = `http://${appUrl}`;
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: `${appUrl}/pricing`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('[STRIPE_PORTAL_ERROR]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
