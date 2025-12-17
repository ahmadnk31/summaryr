"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { sendTeamInvite } from "@/app/actions/team-actions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Users, UserPlus, Copy, Check, Trash2, LogOut } from "lucide-react"

interface Team {
    id: string
    name: string
    owner_id: string
}

interface Member {
    id: string
    user_id: string
    role: string
    joined_at: string
    profile: {
        email: string
        full_name: string
    }
}

interface Invite {
    id: string
    email: string
    token: string
    status: string
    created_at: string
}

export function TeamManagement({ userId, planTier }: { userId: string, planTier: string }) {
    const [team, setTeam] = useState<Team | null>(null)
    const [members, setMembers] = useState<Member[]>([])
    const [invites, setInvites] = useState<Invite[]>([])
    const [loading, setLoading] = useState(true)
    const [inviteEmail, setInviteEmail] = useState("")
    const [teamName, setTeamName] = useState("")
    const [creating, setCreating] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        loadTeamData()
    }, [])

    const loadTeamData = async () => {
        try {
            setLoading(true)

            // Check if user owns a team
            const { data: ownedTeam } = await supabase
                .from("teams")
                .select("*")
                .eq("owner_id", userId)
                .single()

            if (ownedTeam) {
                setTeam(ownedTeam)
                await loadMembersAndInvites(ownedTeam.id)
                return
            }

            // Check if user is a member of a team
            const { data: membership } = await supabase
                .from("team_members")
                .select("team_id, teams(*)")
                .eq("user_id", userId)
                .single()

            if (membership && membership.teams) {
                // @ts-ignore
                setTeam(membership.teams)
                // @ts-ignore
                await loadMembersAndInvites(membership.team_id)
            }

        } catch (error) {
            console.error("Error loading team:", error)
        } finally {
            setLoading(false)
        }
    }

    const loadMembersAndInvites = async (teamId: string) => {
        // Load Members
        const { data: membersData } = await supabase
            .from("team_members")
            .select(`
        *,
        profile:user_id (email, full_name)
      `)
            .eq("team_id", teamId)

        if (membersData) {
            // @ts-ignore
            setMembers(membersData)
        }

        // Load Invites (Only if owner)
        const { data: teamsData } = await supabase.from('teams').select('owner_id').eq('id', teamId).single();

        if (teamsData?.owner_id === userId) {
            const { data: invitesData } = await supabase
                .from("team_invites")
                .select("*")
                .eq("team_id", teamId)
                .eq("status", "pending")

            if (invitesData) setInvites(invitesData)
        }
    }

    const createTeam = async () => {
        if (!teamName.trim()) return
        setCreating(true)
        try {
            const { data, error } = await supabase
                .from("teams")
                .insert({
                    name: teamName,
                    owner_id: userId
                })
                .select()
                .single()

            if (error) throw error

            // Add owner as member
            await supabase.from("team_members").insert({
                team_id: data.id,
                user_id: userId,
                role: "owner"
            })

            setTeam(data)
            await loadMembersAndInvites(data.id)
            toast.success("Team created successfully!")
        } catch (error) {
            console.error(error)
            toast.error("Failed to create team")
        } finally {
            setCreating(false)
        }
    }

    const createInvite = async () => {
        if (!inviteEmail.trim() || !team) return

        try {
            const result = await sendTeamInvite(team.id, inviteEmail)

            if (result.error) {
                toast.error(result.error)
                return
            }

            if (result.warning) {
                toast.warning(result.warning)
            } else {
                toast.success("Invite sent successfully!")
            }

            setInviteEmail("")
            await loadMembersAndInvites(team.id)
        } catch (error) {
            console.error(error)
            toast.error("Failed to process invite")
        }
    }

    const copyInviteLink = (token: string) => {
        const link = `${window.location.origin}/team/invite/${token}`
        navigator.clipboard.writeText(link)
        toast.success("Invite link copied!")
    }

    const removeMember = async (memberId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return
        try {
            await supabase.from("team_members").delete().eq("id", memberId)
            if (team) await loadMembersAndInvites(team.id)
            toast.success("Member removed")
        } catch (error) {
            toast.error("Failed to remove member")
        }
    }

    const deleteInvite = async (inviteId: string) => {
        try {
            await supabase.from("team_invites").delete().eq("id", inviteId)
            if (team) await loadMembersAndInvites(team.id)
            toast.success("Invite revoked")
        } catch (error) {
            toast.error("Failed to revoke invite")
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    if (!team) {
        if (planTier !== 'team') {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle>Team Management</CardTitle>
                        <CardDescription>Upgrade to Team plan to create your own organization.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" disabled>Upgrade Required</Button>
                    </CardContent>
                </Card>
            )
        }

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Create Your Team</CardTitle>
                    <CardDescription>Start collaborating by creating an organization.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Input
                            placeholder="Team Name (e.g. Acme Corp)"
                            value={teamName}
                            onChange={e => setTeamName(e.target.value)}
                        />
                        <Button onClick={createTeam} disabled={creating || !teamName}>
                            {creating ? "Creating..." : "Create Team"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const isOwner = team.owner_id === userId

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-xl">{team.name}</CardTitle>
                            <CardDescription>Manage your team members and settings</CardDescription>
                        </div>
                        {isOwner && <Badge>Owner</Badge>}
                        {!isOwner && <Badge variant="secondary">Member</Badge>}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Invite Section (Owner Only) */}
                    {isOwner && (
                        <div className="space-y-4 border-b pb-6">
                            <h3 className="font-semibold flex items-center gap-2"><UserPlus className="w-4 h-4" /> Invite Members</h3>
                            <div className="flex gap-4">
                                <Input
                                    placeholder="Colleague's Email"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                />
                                <Button onClick={createInvite}>Invite</Button>
                            </div>

                            {invites.length > 0 && (
                                <div className="space-y-2 mt-4">
                                    <Label>Pending Invites</Label>
                                    {invites.map(invite => (
                                        <div key={invite.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                                            <span className="text-sm">{invite.email}</span>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => copyInviteLink(invite.token)}>
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => deleteInvite(invite.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Members List */}
                    <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Team Members</h3>
                        <div className="space-y-2">
                            {members.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-3 border rounded-md">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                                            {member.profile?.full_name?.[0] || member.profile?.email?.[0] || "?"}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{member.profile?.full_name || member.profile?.email || "Unknown"}</p>
                                            <p className="text-xs text-muted-foreground">{member.profile?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{member.role}</Badge>
                                        {isOwner && member.role !== 'owner' && (
                                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeMember(member.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
