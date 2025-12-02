import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Resend } from "resend"
import { render } from "@react-email/render"
import { VerificationEmail } from "@/emails/verification-email"
import { getBaseUrl } from "@/lib/url"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    console.log("Send verification request for email:", email)

    if (!email) {
      console.error("Email is missing from request body")
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    const supabase = createAdminClient()

    // Check if user exists - use listUsers and filter by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      console.error("Error listing users:", userError)
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 })
    }

    // Find user by email
    const user = users?.find(u => u.email === email)
    
    if (!user) {
      console.error("User not found for email:", email)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("User found:", user.id, "Email confirmed:", user.email_confirmed_at)

    // Check if verification entry exists in email_verifications table
    const { data: existingVerification, error: checkError } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing verification:", checkError)
    }

    // If verified in email_verifications table, return error
    if (existingVerification?.verified === true) {
      console.log("User already verified in email_verifications table")
      return NextResponse.json({ 
        error: "Email already verified",
        message: "Your email has already been verified. You can sign in to your account."
      }, { status: 400 })
    }

    console.log("Existing verification entry:", existingVerification ? "exists" : "not found", "Verified:", existingVerification?.verified)

    // Only check email_verifications table - ignore Supabase email_confirmed_at
    // If entry doesn't exist or is not verified, proceed with sending verification email

    // Use existing token if available and not expired, otherwise generate new one
    let token: string
    let expiresAt: Date

    if (existingVerification && !existingVerification.verified) {
      const existingExpiresAt = new Date(existingVerification.expires_at)
      // Use existing token if not expired, otherwise generate new one
      if (existingExpiresAt > new Date()) {
        token = existingVerification.token
        expiresAt = existingExpiresAt
      } else {
        // Token expired, generate new one
        token = crypto.randomBytes(32).toString("hex")
        expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours

        // Update existing entry with new token
        const { error: updateError } = await supabase
          .from("email_verifications")
          .update({
            token,
            expires_at: expiresAt.toISOString(),
          })
          .eq("id", existingVerification.id)

        if (updateError) {
          console.error("Error updating verification token:", updateError)
          return NextResponse.json({ error: "Failed to update verification token" }, { status: 500 })
        }
      }
    } else {
      // No existing entry, create new one
      token = crypto.randomBytes(32).toString("hex")
      expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours

      const { error: dbError } = await supabase
        .from("email_verifications")
        .insert({
          user_id: user.id,
          email: user.email!,
          token,
          expires_at: expiresAt.toISOString(),
          verified: false,
        })

      if (dbError) {
        console.error("Error saving verification token:", dbError)
        return NextResponse.json({ error: "Failed to create verification token" }, { status: 500 })
      }
    }

    // Generate verification URL
    const baseUrl = getBaseUrl()
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`

    // Render email template
    let emailHtml
    try {
      emailHtml = await render(VerificationEmail({ 
        name: user.user_metadata?.full_name || "User",
        verificationUrl 
      }))
    } catch (renderError) {
      console.error("Error rendering email template:", renderError)
      // Fallback HTML
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Verify Your Email</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Hi ${user.user_metadata?.full_name || "there"},</p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Please click the button below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color:rgb(26, 26, 26); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">Or copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px;">This link will expire in 24 hours.</p>
        </div>
      `
    }

    // Get email addresses from environment - use noreply for authentication emails
    const fromEmailRaw = process.env.FROM_EMAIL || process.env.NOREPLY_EMAIL || "noreply@summaryr.com"
    const fromEmail = fromEmailRaw.includes("<") ? fromEmailRaw : `Summaryr <${fromEmailRaw}>`

    // Send verification email
    const { data, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "Verify your Summaryr account",
      html: emailHtml,
    })

    if (emailError) {
      console.error("Error sending verification email:", emailError)
      return NextResponse.json({ error: `Failed to send email: ${emailError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Verification email sent" })
  } catch (error) {
    console.error("Error in send-verification:", error)
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 })
  }
}

