import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Check, XCircle } from "lucide-react"

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(`/auth/login?next=/team/invite/${token}`)
    }

    // Use Admin Client to Fetch Invite (Bypass RLS, as invitee cannot see it yet)
    const supabaseAdmin = createAdminClient()
    const { data: invite, error } = await supabaseAdmin
        .from("team_invites")
        .select("*, teams(name)")
        .eq("token", token)
        .eq("status", "pending")
        .single()

    if (!invite || error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-red-200">
                    <CardHeader className="text-center">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <CardTitle>Invalid or Expired Invite</CardTitle>
                        <CardDescription>This invite link is no longer valid.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild className="w-full"><Link href="/dashboard">Go to Dashboard</Link></Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    // Accept Invite Action
    async function acceptInvite() {
        "use server"
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Use Admin client to bypass RLS for joining
        const supabaseAdmin = createAdminClient()

        // Add to members
        const { error: memberError } = await supabaseAdmin.from("team_members").insert({
            team_id: invite.team_id,
            user_id: user.id
        })

        if (memberError) {
            console.error("Error adding member:", memberError)
            return
        }

        // Update invite status
        const { error: updateError } = await supabaseAdmin.from("team_invites").update({ status: 'accepted' }).eq("id", invite.id)

        if (updateError) {
            console.error("Error updating invite:", updateError)
        }

        redirect("/dashboard/profile")
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Join Team {invite.teams?.name}</CardTitle>
                    <CardDescription>You have been invited to join this team organization.</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="mb-4">By joining, you will gain access to all Team features.</p>
                    <p className="text-sm text-muted-foreground">Logged in as: {user.email}</p>
                </CardContent>
                <CardFooter>
                    <form action={acceptInvite} className="w-full">
                        <Button type="submit" className="w-full">Accept Invitation</Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}
