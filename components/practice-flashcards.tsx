"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, CheckCircle2, XCircle, RotateCw, Volume2, VolumeX } from "lucide-react"
import { calculateNextReview, getDueItems, QualityPresets, type StudyStats } from "@/lib/spaced-repetition"
import { toast } from "sonner"
import { useSounds } from "@/lib/sounds"

interface Flashcard {
  id: string
  front_text: string
  back_text: string
  repetition_count: number
  easiness_factor: number
  interval_days: number
  next_review_date: string
  last_reviewed_at?: string | null
}

interface PracticeSessionProps {
  documentId?: string
}

export function PracticeFlashcards({ documentId }: PracticeSessionProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [dueFlashcards, setDueFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const supabase = createClient()
  const sounds = useSounds()

  useEffect(() => {
    loadFlashcards()
  }, [documentId])

  const loadFlashcards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", user.id)
        .order("next_review_date", { ascending: true })

      if (documentId) {
        query = query.eq("document_id", documentId)
      }

      const { data, error } = await query

      if (error) throw error

      setFlashcards(data || [])
      const due = getDueItems(data || [])
      setDueFlashcards(due)
      setSessionComplete(due.length === 0)
    } catch (error) {
      console.error("Error loading flashcards:", error)
      toast.error("Failed to load flashcards")
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (quality: number) => {
    const currentCard = dueFlashcards[currentIndex]
    if (!currentCard) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Calculate next review schedule
      const reviewResult = calculateNextReview(quality, {
        repetitionCount: currentCard.repetition_count,
        easinessFactor: currentCard.easiness_factor,
        intervalDays: currentCard.interval_days,
        nextReviewDate: new Date(currentCard.next_review_date),
      })

      // Update flashcard in database
      const { error: updateError } = await supabase
        .from("flashcards")
        .update({
          repetition_count: reviewResult.repetitionCount,
          easiness_factor: reviewResult.easinessFactor,
          interval_days: reviewResult.intervalDays,
          next_review_date: reviewResult.nextReviewDate.toISOString(),
          last_reviewed_at: reviewResult.lastReviewedAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentCard.id)

      if (updateError) throw updateError

      // Save review history
      await supabase.from("review_history").insert({
        user_id: user.id,
        item_type: "flashcard",
        item_id: currentCard.id,
        quality,
      })

      // Play sound based on quality
      if (soundEnabled) {
        if (quality === QualityPresets.PERFECT) {
          sounds.playPerfect()
        } else if (quality === QualityPresets.GOOD) {
          sounds.playGood()
        } else if (quality === QualityPresets.HARD) {
          sounds.playHard()
        } else if (quality === QualityPresets.AGAIN) {
          sounds.playAgain()
        }
      }

      // Move to next card
      if (currentIndex + 1 >= dueFlashcards.length) {
        setSessionComplete(true)
        if (soundEnabled) sounds.playComplete()
        toast.success("Practice session complete!")
      } else {
        setCurrentIndex(currentIndex + 1)
        setShowAnswer(false)
      }
    } catch (error) {
      console.error("Error saving review:", error)
      toast.error("Failed to save review")
    }
  }

  const handleShowAnswer = () => {
    setShowAnswer(true)
    if (soundEnabled) sounds.playFlip()
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading flashcards...</div>
  }

  if (flashcards.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No flashcards found. Generate some flashcards first!</p>
        </CardContent>
      </Card>
    )
  }

  if (sessionComplete) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-2xl font-bold mb-2">Great job!</h3>
          <p className="text-muted-foreground mb-6">
            You've completed all flashcards due for review today.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">Total Cards</p>
              <p className="text-2xl font-bold">{flashcards.length}</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">Reviewed</p>
              <p className="text-2xl font-bold">{dueFlashcards.length}</p>
            </div>
          </div>
          <Button onClick={() => loadFlashcards()}>
            <RotateCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentCard = dueFlashcards[currentIndex]
  const progress = ((currentIndex + 1) / dueFlashcards.length) * 100

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <span className="font-medium">
            Practice Session: {currentIndex + 1} / {dueFlashcards.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Disable sounds" : "Enable sounds"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </Button>
          <Badge variant="secondary">
            {currentCard.repetition_count} reviews
          </Badge>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="min-h-[300px]">
        <CardHeader>
          <CardTitle className="text-center">
            {showAnswer ? "Answer" : "Question"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[200px] p-8">
          <p className="text-lg text-center">
            {showAnswer ? currentCard.back_text : currentCard.front_text}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {!showAnswer ? (
            <Button
              className="w-full"
              onClick={handleShowAnswer}
            >
              Show Answer
            </Button>
          ) : (
            <div className="w-full space-y-2">
              <p className="text-sm text-center text-muted-foreground mb-3">
                How well did you know it?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => handleReview(QualityPresets.AGAIN)}
                >
                  <XCircle className="w-4 h-4" />
                  Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleReview(QualityPresets.HARD)}
                >
                  Hard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleReview(QualityPresets.GOOD)}
                >
                  Good
                </Button>
                <Button
                  className="flex items-center gap-2"
                  onClick={() => handleReview(QualityPresets.PERFECT)}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Easy
                </Button>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
