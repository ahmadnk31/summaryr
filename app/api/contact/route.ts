import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { render } from "@react-email/render"
import { ContactEmail } from "@/emails/contact-email"
import { createAdminClient } from "@/lib/supabase/admin"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  console.log("Contact form submission started")
  try {
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { name, email, subject, message } = body
    console.log("Contact payload:", { name, email, subject })

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set")
      return NextResponse.json({ error: "Email service not configured (RESEND_API_KEY missing)" }, { status: 500 })
    }

    // Insert into database using Admin Client to bypass RLS/Cookie issues
    const supabase = createAdminClient()
    const { error: dbError } = await supabase
      .from("contacts")
      .insert({
        name,
        email,
        subject,
        message,
        status: 'new'
      })

    if (dbError) {
      console.error("Error saving contact to DB:", dbError)
      // Continue to try sending email even if DB fails
    } else {
      console.log("Contact saved to database successfully")
    }

    let emailHtml
    try {
      emailHtml = await render(ContactEmail({ name, email, subject, message }))
    } catch (renderError) {
      console.error("Error rendering email template:", renderError)
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

    // Ensure "from" email has a valid format if it's just an email
    const fromEmail = fromEmailRaw.includes("<") ? fromEmailRaw : `Summaryr <${fromEmailRaw}>`
    const contactFromEmail = `Summaryr Contact <${contactEmail}>`

    console.log(`Sending email to company (${contactEmail}) from (${fromEmail})`)

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

    console.log("Company email sent successfully")

    // Send confirmation email to the user (from contact@summaryr.com for two-way communication)
    try {
      await resend.emails.send({
        from: fromEmail, // Use the same verified sender
        to: [email],
        subject: "Thank you for contacting Summaryr",
        html: `
            <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Thank you for contacting us!</h2>
              <p style="color: #666;">Hi ${name},</p>
              <p style="color: #666;">We've received your message and will get back to you within 24 hours.</p>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${subject}</p>
                <p style="margin: 0;"><strong>Your Message:</strong></p>
                <p style="color: #666; margin-top: 10px; white-space: pre-wrap;">${message}</p>
              </div>
              <p style="color: #666;">Best regards,<br>The Summaryr Team</p>
            </div>
          `,
      })
      console.log("Confirmation email sent to user")
    } catch (userEmailError) {
      console.error("Error sending confirmation email:", userEmailError)
      // Non-blocking
    }

    return NextResponse.json({ success: true, data: { companyEmail: companyEmailData } })
  } catch (error: any) {
    console.error("Error in contact route:", error)
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 })
  }
}
