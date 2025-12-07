"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Crown, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface Participant {
  id: string
  user_id: string
  display_name: string
  joined_at: string
  last_active_at: string
  score: number
}

interface PracticeSessionParticipantsProps {
  sessionId: string
  hostUserId: string
}

export function PracticeSessionParticipants({ sessionId, hostUserId }: PracticeSessionParticipantsProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadParticipants()
    getCurrentUser()

    // Subscribe to participants changes
    const channel = supabase
      .channel(`session_${sessionId}_participants`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "practice_session_participants",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          loadParticipants()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)
  }

  const loadParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from("practice_session_participants")
        .select("*")
        .eq("session_id", sessionId)
        .order("score", { ascending: false })

      if (error) throw error
      setParticipants(data || [])
    } catch (error) {
      console.error("Error loading participants:", error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-4 h-4 text-yellow-500" />
    if (index === 1) return <Trophy className="w-4 h-4 text-gray-400" />
    if (index === 2) return <Trophy className="w-4 h-4 text-amber-700" />
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Participants ({participants.length})
        </CardTitle>
        <CardDescription>Practice together in real-time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {participants.map((participant, index) => {
            const isHost = participant.user_id === hostUserId
            const isCurrentUser = participant.user_id === currentUserId
            const isActive = new Date(participant.last_active_at) > new Date(Date.now() - 30000)

            return (
              <div
                key={participant.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  isCurrentUser && "bg-primary/5 border-primary",
                  !isCurrentUser && "bg-card"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {getInitials(participant.display_name)}
                      </span>
                    </div>
                    {isActive && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {participant.display_name}
                        {isCurrentUser && " (You)"}
                      </span>
                      {isHost && (
                        <Badge variant="secondary" className="text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Host
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(participant.joined_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getRankIcon(index)}
                  <span className="text-lg font-bold">{participant.score}</span>
                </div>
              </div>
            )
          })}

          {participants.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No participants yet. Share the session code to invite others!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
