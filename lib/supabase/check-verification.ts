import { createClient } from "@/lib/supabase/server"

/**
 * Check if user's email is verified by checking both:
 * 1. Supabase auth email_confirmed_at
 * 2. email_verifications table verified field
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  const supabase = await createClient()

  // Check Supabase auth email confirmation
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email_confirmed_at) {
    return true
  }

  // Check email_verifications table
  const { data: verification } = await supabase
    .from("email_verifications")
    .select("verified")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  return verification?.verified === true
}

