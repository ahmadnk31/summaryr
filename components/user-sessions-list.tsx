"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Copy, Users, Clock, Trash2, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Session {
  id: string
  session_code: string
  session_name: string
  session_type: "flashcards" | "questions"
  is_active: boolean
  created_at: string
  expires_at: string
  participant_count?: number
}

export function UserSessionsList() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Please sign in to view your sessions")
        return
      }

      // Get sessions with participant count
      const { data: sessionsData, error } = await supabase
        .from("practice_sessions")
        .select(`
          *,
          practice_session_participants(count)
        `)
        .eq("host_user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading sessions:", error)
        throw error
      }

      // Transform the data to include participant count
      const transformedSessions = sessionsData?.map((session: any) => ({
        ...session,
        participant_count: session.practice_session_participants?.[0]?.count || 0,
      })) || []

      setSessions(transformedSessions)
    } catch (error) {
      console.error("Error loading sessions:", error)
      toast.error("Failed to load sessions")
    } finally {
      setLoading(false)
    }
  }

  const copySessionLink = (code: string) => {
    const link = `${window.location.origin}/practice/session/${code}`
    navigator.clipboard.writeText(link)
    toast.success("Session link copied to clipboard!")
  }

  const deleteSession = async (sessionId: string) => {
    try {
      console.log("Attempting to delete session:", sessionId)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Please sign in to delete sessions")
        return
      }

      const { data, error } = await supabase
        .from("practice_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("host_user_id", user.id) // Ensure user owns the session
        .select()

      if (error) {
        console.error("Supabase delete error:", error)
        throw error
      }

      if (!data || data.length === 0) {
        toast.error("Session not found or you don't have permission")
        return
      }

      console.log("Session deleted successfully:", data)
      toast.success("Session deleted")
      loadSessions()
    } catch (error) {
      console.error("Error deleting session:", error)
      toast.error(`Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const endSession = async (sessionId: string) => {
    try {
      console.log("Attempting to end session:", sessionId)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Please sign in to end sessions")
        return
      }

      // Get session to verify ownership
      const { data: session, error: fetchError } = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("id", sessionId)
        .single()

      if (fetchError) {
        console.error("Error fetching session:", fetchError)
        throw new Error("Could not find session")
      }

      if (session.host_user_id !== user.id) {
        toast.error("Only the host can end this session")
        return
      }

      console.log("Updating session to inactive:", { 
        sessionId, 
        currentUserId: user.id,
        hostUserId: session.host_user_id,
        isActive: session.is_active 
      })

      const { data, error } = await supabase
        .from("practice_sessions")
        .update({ is_active: false })
        .eq("id", sessionId)
        .select()

      if (error) {
        console.error("Supabase update error:", error)
        throw error
      }

      console.log("Session ended successfully:", data)

      // Also remove participants for cleanup
      await supabase
        .from("practice_session_participants")
        .delete()
        .eq("session_id", sessionId)

      toast.success("Session ended")
      loadSessions()
    } catch (error) {
      console.error("Error ending session:", error)
      toast.error(`Failed to end session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Sessions</CardTitle>
          <CardDescription>Loading your practice sessions...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Sessions</CardTitle>
          <CardDescription>You haven't created any sessions yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create a session from the "Together" tab to start practicing with others!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Sessions</CardTitle>
            <CardDescription>
              {sessions.length} session{sessions.length !== 1 ? "s" : ""} created
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSessions}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{session.session_name}</h4>
                  <Badge variant={session.is_active ? "default" : "secondary"}>
                    {session.is_active ? "Active" : "Ended"}
                  </Badge>
                  <Badge variant="outline">
                    {session.session_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {session.participant_count} participant{session.participant_count !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                  </span>
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {session.session_code}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {session.is_active && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copySessionLink(session.session_code)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/practice/session/${session.session_code}`, "_blank")}
                    >
                      Join
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => endSession(session.id)}
                    >
                      End
                    </Button>
                  </>
                )}
                {!session.is_active && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSession(session.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
