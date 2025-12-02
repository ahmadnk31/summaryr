import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { render } from "@react-email/render"
import { ContactEmail } from "@/emails/contact-email"

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

    const { name, email, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    let emailHtml
    try {
      emailHtml = await render(ContactEmail({ name, email, subject, message }))
    } catch (renderError) {
      console.error("Error rendering email template:", renderError)
      // Fallback to simple HTML if template rendering fails
      emailHtml = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `
    }

    // Get email addresses from environment variables
    const contactEmail = process.env.CONTACT_EMAIL || "contact@summaryr.com"
    const fromEmailRaw = process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL || contactEmail
    const fromEmail = fromEmailRaw.includes("<") ? fromEmailRaw : `Summaryr <${fromEmailRaw}>`
    const contactFromEmail = `Summaryr Contact <${contactEmail}>`

    // Send email to the company (internal notification)
    const { data: companyEmailData, error: companyEmailError } = await resend.emails.send({
      from: fromEmail,
      to: [contactEmail],
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: emailHtml,
    })

    if (companyEmailError) {
      console.error("Error sending email to company:", companyEmailError)
      return NextResponse.json({ error: `Failed to send email: ${companyEmailError.message}` }, { status: 500 })
    }

    // Send confirmation email to the user (from contact@summaryr.com for two-way communication)
    const { data: userEmailData, error: userEmailError } = await resend.emails.send({
      from: contactFromEmail,
      to: [email],
      subject: "Thank you for contacting Summaryr",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Thank you for contacting us!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">We've received your message and will get back to you within 24 hours.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #333; font-size: 14px; margin: 0 0 10px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="color: #333; font-size: 14px; margin: 0;"><strong>Your Message:</strong></p>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 10px; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-top: 20px;">Best regards,<br>The Summaryr Team</p>
        </div>
      `,
    })

    if (userEmailError) {
      console.error("Error sending confirmation email to user:", userEmailError)
      // Don't fail the request if confirmation email fails, but log it
    }

    return NextResponse.json({ success: true, data: { companyEmail: companyEmailData, userEmail: userEmailData } })
  } catch (error) {
    console.error("Error sending contact email:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
