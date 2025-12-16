import { PricingTable } from "@/components/pricing-table";
import { DashboardNavbar } from "@/components/dashboard-navbar";
import { createClient } from "@/lib/supabase/server";

export default async function PricingPage(
    props: {
        searchParams: Promise<{ [key: string]: string | string[] | undefined }>
    }
) {
    const searchParams = await props.searchParams;
    const plan = searchParams.plan as string | undefined;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let currentPlan = "free";

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("plan_tier")
            .eq("id", user.id)
            .single();
        if (profile?.plan_tier) {
            currentPlan = profile.plan_tier;
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <DashboardNavbar planTier={currentPlan} />
            <main className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
                    <p className="text-muted-foreground text-lg">Choose the plan that's right for you</p>
                </div>
                <PricingTable currentPlan={currentPlan} highlightedPlan={plan} />
            </main>
        </div>
    );
}
