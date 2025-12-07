"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogIn, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function JoinPracticeSession() {
  const [sessionCode, setSessionCode] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const joinSession = async () => {
    if (!sessionCode.trim()) {
      toast.error("Please enter a session code")
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Find the session
      const { data: session, error: sessionError } = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("session_code", sessionCode.toUpperCase())
        .eq("is_active", true)
        .single()

      if (sessionError || !session) {
        toast.error("Session not found or has ended")
        return
      }

      // Check if session is full
      const { count } = await supabase
        .from("practice_session_participants")
        .select("*", { count: "exact", head: true })
        .eq("session_id", session.id)

      if (count && count >= session.max_participants) {
        toast.error("Session is full")
        return
      }

      // Check if already joined
      const { data: existingParticipant } = await supabase
        .from("practice_session_participants")
        .select("*")
        .eq("session_id", session.id)
        .eq("user_id", user.id)
        .single()

      if (existingParticipant) {
        // Already joined, just navigate
        router.push(`/practice/session/${sessionCode.toUpperCase()}`)
        return
      }

      // Join the session
      const { error: joinError } = await supabase
        .from("practice_session_participants")
        .insert({
          session_id: session.id,
          user_id: user.id,
          display_name: displayName.trim() || user.email?.split("@")[0] || "Anonymous",
        })

      if (joinError) throw joinError

      toast.success("Joined session!")
      router.push(`/practice/session/${sessionCode.toUpperCase()}`)
    } catch (error) {
      console.error("Error joining session:", error)
      toast.error("Failed to join session")
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
    setSessionCode(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="w-5 h-5" />
          Join Practice Session
        </CardTitle>
        <CardDescription>
          Enter a session code to join a collaborative study session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="session-code">Session Code</Label>
          <Input
            id="session-code"
            placeholder="ABC123"
            value={sessionCode}
            onChange={handleCodeChange}
            className="font-mono text-2xl text-center uppercase"
            maxLength={6}
          />
          <p className="text-xs text-muted-foreground">
            Enter the 6-character code shared by the host
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="display-name">Display Name (Optional)</Label>
          <Input
            id="display-name"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={joinSession} 
          disabled={loading || sessionCode.length !== 6} 
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Joining...
            </>
          ) : (
            "Join Session"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
