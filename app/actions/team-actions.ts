'use server'

import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"
import { TeamInviteEmail } from "@/emails/team-invite-email"
import { getBaseUrl } from "@/lib/url"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendTeamInvite(teamId: string, email: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    // 1. Verify ownership and get team details
    const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("name, owner_id")
        .eq("id", teamId)
        .single()

    if (teamError || !team) {
        return { error: "Team not found" }
    }

    if (team.owner_id !== user.id) {
        return { error: "Unauthorized: You must be the team owner to invite members." }
    }

    // 2. Check for existing pending invite
    const { data: existingInvite } = await supabase
        .from("team_invites")
        .select("id")
        .eq("team_id", teamId)
        .eq("email", email)
        .eq("status", "pending")
        .single()

    if (existingInvite) {
        return { error: "Invite already pending for this email" }
    }

    // 3. Create Invite Record
    const { data: invite, error: createError } = await supabase
        .from("team_invites")
        .insert({
            team_id: teamId,
            email: email,
        })
        .select()
        .single()

    if (createError) {
        console.error("Error creating invite:", createError)
        return { error: "Failed to create invite record" }
    }

    // 4. Send Email
    const inviteLink = `${getBaseUrl()}/team/invite/${invite.token}`

    // Get inviter's profile for the name
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    const inviterName = profile?.full_name || user.email || "A team member"

    try {
        const { error: emailError } = await resend.emails.send({
            from: "Summaryr <noreply@summaryr.com>",
            to: email,
            subject: `Join ${team.name} on Summaryr`,
            react: TeamInviteEmail({
                teamName: team.name,
                inviterName: inviterName,
                inviteLink: inviteLink,
                userEmail: email
            })
        })

        if (emailError) {
            console.error("Error sending invite email:", emailError)
            // Note: We don't rollback the DB insert here, as the user can retry sending or copy the link manually.
            return { success: true, warning: "Invite created but failed to send email. You can copy the link manually." }
        }

        return { success: true }
    } catch (e) {
        console.error("Exception sending email:", e)
        return { success: true, warning: "Invite created but failed to send email. You can copy the link manually." }
    }
}
