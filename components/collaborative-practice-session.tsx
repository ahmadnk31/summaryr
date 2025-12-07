"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PracticeSessionParticipants } from "@/components/practice-session-participants"
import { calculateNextReview, SpacedRepetitionData } from "@/lib/spaced-repetition"
import { getSoundManager } from "@/lib/sounds"
import { Clock, Brain, RotateCw, Volume2, VolumeX, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type QualityRating = 0 | 3 | 4 | 5

interface Flashcard {
  id: string
  front: string
  back: string
  easiness_factor: number
  interval_days: number
  repetition_count: number
}

interface Question {
  id: string
  question: string
  answer: string
  easiness_factor: number
  interval_days: number
  repetition_count: number
}

interface Session {
  id: string
  host_user_id: string
  session_name: string
  session_type: "flashcards" | "questions"
  session_code: string
  document_id: string | null
  is_active: boolean
}

interface CollaborativePracticeSessionProps {
  sessionCode: string
}

export function CollaborativePracticeSession({ sessionCode }: CollaborativePracticeSessionProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [items, setItems] = useState<(Flashcard | Question)[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionEnded, setSessionEnded] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadSession()
    getCurrentUser()
  }, [sessionCode])

  useEffect(() => {
    if (!session) return

    // Subscribe to session changes
    const channel = supabase
      .channel(`session_${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "practice_sessions",
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const updatedSession = payload.new as Session
          setSession(updatedSession)
          if (!updatedSession.is_active) {
            setSessionEnded(true)
            toast.info("Session has ended")
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUserId(user?.id || null)
  }

  const loadSession = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("session_code", sessionCode.toUpperCase())
        .single()

      if (sessionError || !sessionData) {
        toast.error("Session not found")
        router.push("/practice")
        return
      }

      setSession(sessionData)
      await loadItems(sessionData)
    } catch (error) {
      console.error("Error loading session:", error)
      toast.error("Failed to load session")
    } finally {
      setLoading(false)
    }
  }

  const loadItems = async (sessionData: Session) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from(sessionData.session_type)
        .select("*")
        .eq("user_id", user.id)

      if (sessionData.document_id) {
        query = query.eq("document_id", sessionData.document_id)
      }

      const { data, error } = await query

      if (error) throw error
      setItems((data || []).sort(() => Math.random() - 0.5))
    } catch (error) {
      console.error("Error loading items:", error)
    }
  }

  const handleFlip = () => {
    setShowAnswer(!showAnswer)
    if (soundEnabled) getSoundManager().playFlip()
  }

  const handleQuality = async (quality: QualityRating) => {
    if (!session || !userId) return

    const currentItem = items[currentIndex]
    if (!currentItem) return

    // Play sound
    if (soundEnabled) {
      const soundManager = getSoundManager()
      if (quality === 5) soundManager.playPerfect()
      else if (quality === 4) soundManager.playGood()
      else if (quality === 3) soundManager.playHard()
      else soundManager.playAgain()
    }

    const currentData: SpacedRepetitionData = {
      easinessFactor: currentItem.easiness_factor,
      intervalDays: currentItem.interval_days,
      repetitionCount: currentItem.repetition_count,
      nextReviewDate: new Date(),
    }

    const reviewResult = calculateNextReview(quality, currentData)

    // Update item in database
    await supabase
      .from(session.session_type)
      .update({
        easiness_factor: reviewResult.easinessFactor,
        interval_days: reviewResult.intervalDays,
        repetition_count: reviewResult.repetitionCount,
        last_reviewed_at: new Date().toISOString(),
        next_review_date: reviewResult.nextReviewDate.toISOString(),
      })
      .eq("id", currentItem.id)

    // Record response
    const { data: participant } = await supabase
      .from("practice_session_participants")
      .select("id")
      .eq("session_id", session.id)
      .eq("user_id", userId)
      .single()

    if (participant) {
      await supabase.from("practice_session_responses").insert({
        session_id: session.id,
        participant_id: participant.id,
        item_id: currentItem.id,
        item_type: session.session_type === "flashcards" ? "flashcard" : "question",
        quality,
        response_time_ms: 0,
      })

      // Update participant score
      const pointsEarned = quality === 5 ? 100 : quality === 4 ? 75 : quality === 3 ? 50 : 0
      await supabase.rpc("increment_participant_score", {
        p_session_id: session.id,
        p_user_id: userId,
        p_points: pointsEarned,
      })
    }

    // Move to next item
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
    } else {
      // Session complete
      toast.success("Practice session complete!")
      setSessionEnded(true)
    }
  }

  const endSession = async () => {
    if (!session || !userId || userId !== session.host_user_id) return

    await supabase
      .from("practice_sessions")
      .update({ is_active: false })
      .eq("id", session.id)

    toast.success("Session ended")
    router.push("/practice")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Not Found</CardTitle>
          <CardDescription>The session you're looking for doesn't exist or has ended.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (sessionEnded || !session.is_active) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Ended</CardTitle>
            <CardDescription>Thank you for practicing together!</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/practice")}>Back to Practice</Button>
          </CardContent>
        </Card>
        <PracticeSessionParticipants sessionId={session.id} hostUserId={session.host_user_id} />
      </div>
    )
  }

  const currentItem = items[currentIndex]
  const isFlashcard = session.session_type === "flashcards"
  const progress = items.length > 0 ? ((currentIndex + 1) / items.length) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{session.session_name}</h1>
          <p className="text-muted-foreground">
            Session Code: <span className="font-mono font-bold">{session.session_code}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          {userId === session.host_user_id && (
            <Button variant="destructive" onClick={endSession}>
              End Session
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  {isFlashcard ? "Flashcard" : "Question"} {currentIndex + 1} of {items.length}
                </CardTitle>
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  {Math.round(progress)}%
                </Badge>
              </div>
              <Progress value={progress} className="h-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {currentItem ? (
                <>
                  <div
                    className="min-h-[200px] flex items-center justify-center p-8 bg-primary/5 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={handleFlip}
                  >
                    <p className="text-2xl text-center">
                      {showAnswer
                        ? (isFlashcard ? (currentItem as Flashcard).back : (currentItem as Question).answer)
                        : (isFlashcard ? (currentItem as Flashcard).front : (currentItem as Question).question)}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleFlip}
                    className="w-full"
                  >
                    <RotateCw className="w-4 h-4 mr-2" />
                    {showAnswer ? "Show Question" : "Show Answer"}
                  </Button>

                  {showAnswer && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Button
                        onClick={() => handleQuality(0)}
                        variant="outline"
                        className="border-red-500/50 hover:bg-red-500/10"
                      >
                        Again
                      </Button>
                      <Button
                        onClick={() => handleQuality(3)}
                        variant="outline"
                        className="border-orange-500/50 hover:bg-orange-500/10"
                      >
                        Hard
                      </Button>
                      <Button
                        onClick={() => handleQuality(4)}
                        variant="outline"
                        className="border-blue-500/50 hover:bg-blue-500/10"
                      >
                        Good
                      </Button>
                      <Button
                        onClick={() => handleQuality(5)}
                        variant="outline"
                        className="border-green-500/50 hover:bg-green-500/10"
                      >
                        Perfect
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-muted-foreground">No items to practice</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <PracticeSessionParticipants sessionId={session.id} hostUserId={session.host_user_id} />
        </div>
      </div>
    </div>
  )
}
