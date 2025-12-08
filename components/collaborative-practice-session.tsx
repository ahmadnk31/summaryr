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
  front_text: string
  back_text: string
  easiness_factor: number
  interval_days: number
  repetition_count: number
}

interface Question {
  id: string
  question_text: string
  answer_text: string
  question_type: 'multiple_choice' | 'short_answer' | 'true_false' | 'essay' | 'fill_blank'
  options?: string[]
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
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [userAnswer, setUserAnswer] = useState("")
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
            toast.info("Host has ended the session")
            // Redirect to practice page after 2 seconds
            setTimeout(() => {
              router.push("/practice")
            }, 2000)
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Please sign in to join the session")
        router.push("/auth/login")
        return
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("session_code", sessionCode.toUpperCase())
        .single()

      if (sessionError || !sessionData) {
        console.error("Session error:", sessionError)
        toast.error("Session not found")
        router.push("/practice")
        return
      }

      // Check if session is still active
      if (!sessionData.is_active) {
        toast.error("This session has ended")
        router.push("/practice")
        return
      }

      // Auto-join if not already a participant
      await ensureParticipant(sessionData.id, user)

      setSession(sessionData)
      await loadItems(sessionData)
    } catch (error) {
      console.error("Error loading session:", error)
      toast.error("Failed to load session")
    } finally {
      setLoading(false)
    }
  }

  const ensureParticipant = async (sessionId: string, user: any) => {
    try {
      // Check if already a participant
      const { data: existing } = await supabase
        .from("practice_session_participants")
        .select("id")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .single()

      if (existing) {
        console.log("Already a participant")
        return
      }

      // Add as participant
      const { error } = await supabase
        .from("practice_session_participants")
        .insert({
          session_id: sessionId,
          user_id: user.id,
          display_name: user.email?.split("@")[0] || "Anonymous",
        })

      if (error) {
        console.error("Error joining as participant:", error)
      } else {
        console.log("Successfully joined as participant")
        toast.success("Joined session!")
      }
    } catch (error) {
      console.error("Error ensuring participant:", error)
    }
  }

  const loadItems = async (sessionData: Session) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error("No user found")
        return
      }

      // In collaborative sessions, load items from the HOST's collection
      // This ensures all participants see the same flashcards/questions
      let query = supabase
        .from(sessionData.session_type)
        .select("*")
        .eq("user_id", sessionData.host_user_id) // Load host's items, not current user's

      if (sessionData.document_id) {
        query = query.eq("document_id", sessionData.document_id)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error loading items from database:", error)
        throw error
      }

      console.log(`Loaded ${data?.length || 0} ${sessionData.session_type} from host's collection`)
      
      if (!data || data.length === 0) {
        const isHost = user.id === sessionData.host_user_id
        if (isHost) {
          toast.error(`No ${sessionData.session_type} found. Please create some first.`)
        } else {
          toast.error(`The host hasn't created any ${sessionData.session_type} yet.`)
        }
        setItems([])
        return
      }

      setItems((data || []).sort(() => Math.random() - 0.5))
    } catch (error) {
      console.error("Error loading items:", error)
      toast.error(`Failed to load ${sessionData.session_type}`)
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
      setSelectedOption(null)
      setUserAnswer("")
    } else {
      // Session complete
      toast.success("Practice session complete!")
      setSessionEnded(true)
    }
  }

  const endSession = async () => {
    if (!session || !userId || userId !== session.host_user_id) {
      console.error("Cannot end session:", { session, userId, hostUserId: session?.host_user_id })
      toast.error("Only the host can end the session")
      return
    }

    try {
      console.log("Ending session:", { sessionId: session.id, userId, isActive: session.is_active })
      
      // End the session (this will trigger real-time update for all participants)
      const { data, error } = await supabase
        .from("practice_sessions")
        .update({ is_active: false })
        .eq("id", session.id)
        .select()

      if (error) {
        console.error("Error updating session:", error)
        throw error
      }

      console.log("Session updated successfully:", data)

      // Optional: Remove all participants (cleanup)
      const { error: deleteError } = await supabase
        .from("practice_session_participants")
        .delete()
        .eq("session_id", session.id)

      if (deleteError) {
        console.error("Error removing participants:", deleteError)
        // Don't throw - session is already ended
      }

      toast.success("Session ended")
      router.push("/practice")
    } catch (error) {
      console.error("Error ending session:", error)
      toast.error("Failed to end session")
    }
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
          {userId === session.host_user_id ? (
            <Button variant="destructive" onClick={endSession}>
              End Session
            </Button>
          ) : (
            <Button variant="outline" onClick={() => router.push("/practice")}>
              Leave Session
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
            <CardContent className="space-y-4 overflow-x-hidden">
              {currentItem ? (
                <>
                  {/* Question Text */}
                  <div className="p-6 bg-secondary/50 rounded-lg overflow-hidden">
                    <p className="text-lg break-words">
                      {isFlashcard ? (currentItem as Flashcard).front_text : (currentItem as Question).question_text}
                    </p>
                  </div>

                  {/* Render different UI based on question type */}
                  {!showAnswer && !isFlashcard && (
                    <>
                      {(currentItem as Question).question_type === 'multiple_choice' && (currentItem as Question).options && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Select your answer:</p>
                          <div className="grid grid-cols-1 gap-2">
                            {(currentItem as Question).options!.map((option, idx) => (
                              <Button
                                key={idx}
                                variant={selectedOption === option ? "default" : "outline"}
                                className="justify-start text-left h-auto py-3 px-4 whitespace-normal break-words min-h-[44px]"
                                onClick={() => setSelectedOption(option)}
                              >
                                <span className="font-semibold mr-2 flex-shrink-0">{String.fromCharCode(65 + idx)}.</span>
                                <span className="flex-1">{option}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {(currentItem as Question).question_type === 'true_false' && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Select your answer:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant={selectedOption === 'True' ? "default" : "outline"}
                              className="py-6"
                              onClick={() => setSelectedOption('True')}
                            >
                              True
                            </Button>
                            <Button
                              variant={selectedOption === 'False' ? "default" : "outline"}
                              className="py-6"
                              onClick={() => setSelectedOption('False')}
                            >
                              False
                            </Button>
                          </div>
                        </div>
                      )}

                      {(currentItem as Question).question_type === 'fill_blank' && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Type your answer:</p>
                          <input
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Your answer..."
                            className="w-full p-3 rounded-lg border border-input bg-background"
                          />
                        </div>
                      )}

                      {((currentItem as Question).question_type === 'short_answer' || (currentItem as Question).question_type === 'essay') && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Type your answer:</p>
                          <textarea
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Your answer..."
                            rows={(currentItem as Question).question_type === 'essay' ? 6 : 3}
                            className="w-full p-3 rounded-lg border border-input bg-background resize-none"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Show answer section */}
                  {showAnswer && (
                    <div className="space-y-4">
                      <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg overflow-hidden">
                        <p className="text-sm text-muted-foreground mb-2">Correct Answer:</p>
                        <p className="text-lg font-semibold break-words">
                          {isFlashcard ? (currentItem as Flashcard).back_text : (currentItem as Question).answer_text}
                        </p>
                      </div>
                      {!isFlashcard && (userAnswer || selectedOption) && (
                        <div className="p-6 bg-secondary rounded-lg overflow-hidden">
                          <p className="text-sm text-muted-foreground mb-2">Your Answer:</p>
                          <p className="text-lg break-words">{selectedOption || userAnswer}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show Answer Button (for flashcards or after answering questions) */}
                  {!showAnswer && (isFlashcard || selectedOption || userAnswer) && (
                    <Button
                      variant="outline"
                      onClick={handleFlip}
                      className="w-full"
                    >
                      <RotateCw className="w-4 h-4 mr-2" />
                      Show Answer
                    </Button>
                  )}

                  {/* Rating buttons */}
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
                <div className="text-center py-12 space-y-4">
                  <Brain className="w-16 h-16 mx-auto text-muted-foreground/50" />
                  <div>
                    <p className="text-lg font-medium text-muted-foreground">
                      No {session.session_type} available
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {userId === session.host_user_id ? (
                        // Message for host
                        session.document_id 
                          ? `Create ${session.session_type} from your document to start practicing.`
                          : `You need to create some ${session.session_type} before starting this session.`
                      ) : (
                        // Message for participants
                        <>
                          The host hasn't created any {session.session_type} yet.
                          <br />
                          <span className="text-xs">Waiting for the host to add study materials...</span>
                        </>
                      )}
                    </p>
                  </div>
                  {userId === session.host_user_id && (
                    <Button 
                      variant="outline" 
                      onClick={() => router.push("/documents")}
                    >
                      Go to Documents
                    </Button>
                  )}
                </div>
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
