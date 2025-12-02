import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Resend } from "resend"
import { render } from "@react-email/render"
import { WelcomeEmail } from "@/emails/welcome-email"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Find verification record
    const { data: verification, error: verificationError } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("token", token)
      .eq("verified", false)
      .single()

    if (verificationError || !verification) {
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 })
    }

    // Check if token is expired
    const expiresAt = new Date(verification.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: "Verification token has expired" }, { status: 400 })
    }

    // Verify the user's email in Supabase
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      verification.user_id,
      {
        email_confirm: true,
      }
    )

    if (updateError) {
      console.error("Error updating user email confirmation:", updateError)
      return NextResponse.json({ error: "Failed to verify email" }, { status: 500 })
    }

    // Mark verification as completed
    const { error: markVerifiedError } = await supabase
      .from("email_verifications")
      .update({ verified: true })
      .eq("token", token)

    if (markVerifiedError) {
      console.error("Error marking verification as complete:", markVerifiedError)
      // Don't fail the request, email is already verified
    }

    // Send welcome email
    try {
      if (process.env.RESEND_API_KEY) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                        "http://localhost:3000"
        const dashboardUrl = `${baseUrl}/dashboard`

        // Get user details for welcome email
        const { data: { user } } = await supabase.auth.admin.getUserById(verification.user_id)
        
        if (user) {
          let welcomeEmailHtml
          try {
            welcomeEmailHtml = await render(WelcomeEmail({
              name: user.user_metadata?.full_name || "there",
              dashboardUrl,
            }))
          } catch (renderError) {
            console.error("Error rendering welcome email template:", renderError)
            // Fallback HTML
            welcomeEmailHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Welcome to Summaryr!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">Hi ${user.user_metadata?.full_name || "there"},</p>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">Thank you for verifying your email address. Your account is now active and ready to use!</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${dashboardUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a>
                </div>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">Happy studying!<br />The Summaryr Team</p>
              </div>
            `
          }

          const fromEmailRaw = process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL || "noreply@summaryr.com"
          const fromEmail = fromEmailRaw.includes("<") ? fromEmailRaw : `Summaryr <${fromEmailRaw}>`

          await resend.emails.send({
            from: fromEmail,
            to: [verification.email],
            subject: "Welcome to Summaryr! 🎉",
            html: welcomeEmailHtml,
          })
        }
      }
    } catch (welcomeEmailError) {
      console.error("Error sending welcome email:", welcomeEmailError)
      // Don't fail verification if welcome email fails
    }

    // Redirect to success page
    const url = new URL("/auth/verify-email-success", request.url)
    return NextResponse.redirect(url)
  } catch (error) {
    console.error("Error in verify-email:", error)
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 })
  }
}

