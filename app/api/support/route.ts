import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { render } from "@react-email/render"
import { SupportEmail } from "@/emails/support-email"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { name, email, category, subject, message } = body

    if (!name || !email || !category || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    const categoryLabels: Record<string, string> = {
      technical: "Technical Issue",
      billing: "Billing Question",
      feature: "Feature Request",
      bug: "Bug Report",
      other: "Other",
    }

    let emailHtml
    try {
      emailHtml = await render(SupportEmail({ name, email, category, subject, message }))
    } catch (renderError) {
      console.error("Error rendering email template:", renderError)
      // Fallback to simple HTML if template rendering fails
      emailHtml = `
        <h2>New Support Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Category:</strong> ${categoryLabels[category] || category}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `
    }

    // Get email addresses from environment variables
    const supportEmail = process.env.SUPPORT_EMAIL || "support@summaryr.com"
    const fromEmailRaw = process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL || supportEmail
    const fromEmail = fromEmailRaw.includes("<") ? fromEmailRaw : `Summaryr <${fromEmailRaw}>`
    const supportFromEmail = `Summaryr Support <${supportEmail}>`

    // Send email to support team (internal notification)
    const { data: supportEmailData, error: supportEmailError } = await resend.emails.send({
      from: fromEmail,
      to: [supportEmail],
      replyTo: email,
      subject: `[${categoryLabels[category] || category}] ${subject}`,
      html: emailHtml,
    })

    if (supportEmailError) {
      console.error("Error sending email to support team:", supportEmailError)
      return NextResponse.json({ error: `Failed to send email: ${supportEmailError.message}` }, { status: 500 })
    }

    // Send confirmation email to the user (from support@summaryr.com for two-way communication)
    const { data: userEmailData, error: userEmailError } = await resend.emails.send({
      from: supportFromEmail,
      to: [email],
      subject: "Support Request Received",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Support Request Received</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">We've received your support request and will get back to you within 24 hours.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #333; font-size: 14px; margin: 0 0 10px 0;"><strong>Category:</strong> ${categoryLabels[category] || category}</p>
            <p style="color: #333; font-size: 14px; margin: 0 0 10px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="color: #333; font-size: 14px; margin: 0;"><strong>Your Message:</strong></p>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 10px; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-top: 20px;">Best regards,<br>The Summaryr Support Team</p>
        </div>
      `,
    })

    if (userEmailError) {
      console.error("Error sending confirmation email to user:", userEmailError)
      // Don't fail the request if confirmation email fails, but log it
    }

    return NextResponse.json({ success: true, data: { supportEmail: supportEmailData, userEmail: userEmailData } })
  } catch (error) {
    console.error("Error sending support email:", error)
    return NextResponse.json({ error: "Failed to send support request" }, { status: 500 })
  }
}
