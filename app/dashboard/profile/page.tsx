export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileView } from "@/components/profile-view"
import { DashboardNavbar } from "@/components/dashboard-navbar"

export default async function ProfilePage() {
    const supabase = await createClient()

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/auth/login")
    }

    // Fetch profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

    // Fetch document count
    const { count } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

    // Fetch effective plan tier
    const { data: effectivePlanTier } = await supabase.rpc("get_user_plan_tier", { user_uuid: user.id })
    const planTier = effectivePlanTier || profile?.plan_tier || "free"
    const uploadLimit = planTier === "free" ? 5 : "Unlimited"

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <DashboardNavbar planTier={planTier} />
            <main className="container mx-auto px-4">
                <ProfileView
                    user={{
                        id: user.id,
                        email: user.email,
                        full_name: profile?.full_name
                    }}
                    subscription={{
                        plan_tier: planTier,
                        subscription_status: profile?.subscription_status || 'inactive',
                        stripe_customer_id: profile?.stripe_customer_id
                    }}
                    usage={{
                        documentCount: count || 0,
                        uploadLimit: uploadLimit
                    }}
                />
            </main>
        </div>
    )
}
