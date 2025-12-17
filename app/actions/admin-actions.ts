'use server'

import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"
import { getBaseUrl } from "@/lib/url"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function replyToContact(contactId: string, replyMessage: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()

    if (!profile?.is_admin) {
        return { error: "Unauthorized" }
    }

    // Get contact details
    const { data: contact, error: fetchError } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .single()

    if (fetchError || !contact) {
        return { error: "Contact not found" }
    }

    // Send email via Resend
    // We use the same from address logic as contact form
    const contactEmail = process.env.CONTACT_EMAIL || "contact@summaryr.com"
    const fromEmailRaw = process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL || contactEmail
    // Ensure we send FROM the business address
    const fromEmail = fromEmailRaw.includes("<") ? fromEmailRaw : `Summaryr Support <${fromEmailRaw}>`

    try {
        const { error: emailError } = await resend.emails.send({
            from: fromEmail,
            to: contact.email,
            subject: `Re: ${contact.subject}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <p>Hi ${contact.name},</p>
                    <p>${replyMessage.replace(/\n/g, "<br>")}</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eaeaea;" />
                    <p style="color: #666; font-size: 12px;">
                        On ${new Date(contact.created_at).toLocaleDateString()}, you wrote:<br/>
                        ${contact.message}
                    </p>
                </div>
            `
        })

        if (emailError) {
            console.error("Resend error:", emailError)
            return { error: "Failed to send email" }
        }

        // Update contact status
        const { error: updateError } = await supabase
            .from("contacts")
            .update({ status: 'replied', replied_at: new Date().toISOString() })
            .eq("id", contactId)

        if (updateError) {
            return { error: "Email sent but leaked to update database status" }
        }

        return { success: true }
    } catch (e) {
        console.error("Exception replying to contact:", e)
        return { error: "Internal server error" }
    }
}
