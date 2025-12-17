'use server'

import { createClient } from "@/lib/supabase/server"
import { getBaseUrl } from "@/lib/url"
import { redirect } from "next/navigation"

import { createAdminClient } from "@/lib/supabase/admin"
import { Resend } from "resend"
import { ResetPasswordEmail } from "@/emails/reset-password-email"
import { render } from "@react-email/render"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function resetPassword(email: string) {
    console.log("Starting customized resetPassword for:", email)
    const supabaseAdmin = createAdminClient()

    // 1. Find user by email to get ID
    // Note: We use listUsers because profiles might not have email index or column depending on schema
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers()

    if (userError) {
        console.error("Error listing users:", userError)
        return { error: "User not found" }
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
        console.error("User not found for email:", email)
        // Return success to prevent email enumeration
        return { success: true }
    }

    // 2. Generate Token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour expiry

    // 3. Save token to profiles
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
            reset_token: token,
            reset_token_expires_at: expiresAt
        })
        .eq('id', user.id)

    if (updateError) {
        console.error("Error saving reset token:", updateError)
        return { error: "Failed to process request" }
    }

    console.log("Saved reset token for user:", user.id)

    // 4. Send Email
    const resetLink = `${getBaseUrl()}/auth/reset-password?token=${token}`

    const emailHtml = await render(ResetPasswordEmail({ resetLink }))
    const fromEmailRaw = process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL || "noreply@summaryr.com"
    const fromEmail = fromEmailRaw.includes("<") ? fromEmailRaw : `Summaryr <${fromEmailRaw}>`

    console.log("Sending email via Resend to:", email)

    try {
        const { error: emailError } = await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: "Reset your Summaryr password",
            html: emailHtml,
        })

        if (emailError) {
            console.error("Resend error:", emailError)
            return { error: "Failed to send email" }
        }

        return { success: true }
    } catch (e: any) {
        console.error("Exception sending email:", e)
        return { error: "Internal server error" }
    }
}

import { PasswordChangedEmail } from "@/emails/password-changed-email"

// ... (existing imports)

export async function updatePassword(token: string, password: string) {
    const supabaseAdmin = createAdminClient()

    // 1. Validate Token
    if (!token) {
        return { error: "Missing token" }
    }

    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, reset_token_expires_at, email') // Added email selection if available, or fetch user details
        .eq('reset_token', token)
        .single()

    if (profileError || !profile) {
        return { error: "Invalid or expired token" }
    }

    const expiresAt = new Date(profile.reset_token_expires_at)
    if (expiresAt < new Date()) {
        return { error: "Token has expired" }
    }

    // 2. Update Password
    const { data: userUpdateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        profile.id,
        { password: password }
    )

    if (updateError) {
        console.error("Error updating password:", updateError)
        return { error: "Failed to update password" }
    }

    // 3. Clear Token
    await supabaseAdmin
        .from('profiles')
        .update({
            reset_token: null,
            reset_token_expires_at: null
        })
        .eq('id', profile.id)

    // 4. Send Confirmation Email
    if (userUpdateData.user.email) {
        const fromEmailRaw = process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL || "noreply@summaryr.com"
        const fromEmail = fromEmailRaw.includes("<") ? fromEmailRaw : `Summaryr <${fromEmailRaw}>`

        try {
            const emailHtml = await render(PasswordChangedEmail())
            await resend.emails.send({
                from: fromEmail,
                to: userUpdateData.user.email,
                subject: "Your Summaryr password has been changed",
                html: emailHtml,
            })
            console.log("Password changed email sent to:", userUpdateData.user.email)
        } catch (emailError) {
            console.error("Failed to send password changed email:", emailError)
            // Don't fail the request if email fails, as password was updated
        }
    }

    return { success: true }
}
