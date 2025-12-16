import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PracticeView } from "@/components/practice-view"

export default async function PracticePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user's plan tier
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_tier")
    .eq("id", user.id)
    .single()

  const planTier = profile?.plan_tier || 'free'

  return <PracticeView planTier={planTier} />
}
