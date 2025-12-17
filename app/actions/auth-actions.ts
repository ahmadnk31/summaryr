'use server'

import { createClient } from "@/lib/supabase/server"
import { getBaseUrl } from "@/lib/url"
import { redirect } from "next/navigation"

export async function resetPassword(email: string) {
    const supabase = await createClient()
    const callbackUrl = `${getBaseUrl()}/auth/callback?next=/auth/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl,
    })

    if (error) {
        console.error("Reset password error:", error)
        return { error: error.message }
    }

    return { success: true }
}

export async function updatePassword(password: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}
