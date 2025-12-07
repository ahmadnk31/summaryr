"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, CheckCircle2, XCircle, RotateCw, HelpCircle, Volume2, VolumeX } from "lucide-react"
import { calculateNextReview, getDueItems, QualityPresets } from "@/lib/spaced-repetition"
import { toast } from "sonner"
import { useSounds } from "@/lib/sounds"

interface Question {
  id: string
  question_text: string
  answer_text: string
  difficulty: string
  repetition_count: number
  easiness_factor: number
  interval_days: number
  next_review_date: string
  last_reviewed_at?: string | null
}

interface PracticeSessionProps {
  documentId?: string
}

export function PracticeQuestions({ documentId }: PracticeSessionProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [dueQuestions, setDueQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [userAnswer, setUserAnswer] = useState("")
  const [loading, setLoading] = useState(true)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const supabase = createClient()
  const sounds = useSounds()

  useEffect(() => {
    loadQuestions()
  }, [documentId])

  const loadQuestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from("questions")
        .select("*")
        .eq("user_id", user.id)
        .order("next_review_date", { ascending: true })

      if (documentId) {
        query = query.eq("document_id", documentId)
      }

      const { data, error } = await query

      if (error) throw error

      setQuestions(data || [])
      const due = getDueItems(data || [])
      setDueQuestions(due)
      setSessionComplete(due.length === 0)
    } catch (error) {
      console.error("Error loading questions:", error)
      toast.error("Failed to load questions")
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (quality: number) => {
    const currentQuestion = dueQuestions[currentIndex]
    if (!currentQuestion) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Calculate next review schedule
      const reviewResult = calculateNextReview(quality, {
        repetitionCount: currentQuestion.repetition_count,
        easinessFactor: currentQuestion.easiness_factor,
        intervalDays: currentQuestion.interval_days,
        nextReviewDate: new Date(currentQuestion.next_review_date),
      })

      // Update question in database
      const { error: updateError } = await supabase
        .from("questions")
        .update({
          repetition_count: reviewResult.repetitionCount,
          easiness_factor: reviewResult.easinessFactor,
          interval_days: reviewResult.intervalDays,
          next_review_date: reviewResult.nextReviewDate.toISOString(),
          last_reviewed_at: reviewResult.lastReviewedAt.toISOString(),
        })
        .eq("id", currentQuestion.id)

      if (updateError) throw updateError

      // Save review history
      await supabase.from("review_history").insert({
        user_id: user.id,
        item_type: "question",
        item_id: currentQuestion.id,
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

      // Move to next question
      if (currentIndex + 1 >= dueQuestions.length) {
        setSessionComplete(true)
        if (soundEnabled) sounds.playComplete()
        toast.success("Practice session complete!")
      } else {
        setCurrentIndex(currentIndex + 1)
        setShowAnswer(false)
        setUserAnswer("")
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
    return <div className="flex items-center justify-center p-8">Loading questions...</div>
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No questions found. Generate some questions first!</p>
        </CardContent>
      </Card>
    )
  }

  if (sessionComplete) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-2xl font-bold mb-2">Excellent work!</h3>
          <p className="text-muted-foreground mb-6">
            You've completed all questions due for review today.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">Total Questions</p>
              <p className="text-2xl font-bold">{questions.length}</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">Reviewed</p>
              <p className="text-2xl font-bold">{dueQuestions.length}</p>
            </div>
          </div>
          <Button onClick={() => loadQuestions()}>
            <RotateCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentQuestion = dueQuestions[currentIndex]
  const progress = ((currentIndex + 1) / dueQuestions.length) * 100

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <span className="font-medium">
            Practice Session: {currentIndex + 1} / {dueQuestions.length}
          </span>
        </div>
        <div className="flex gap-2">
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
            {currentQuestion.repetition_count} reviews
          </Badge>
          <Badge variant="outline">
            {currentQuestion.difficulty}
          </Badge>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="min-h-[400px]">
        <CardHeader>
          <CardTitle className="text-center">Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 bg-secondary/50 rounded-lg">
            <p className="text-lg">{currentQuestion.question_text}</p>
          </div>

          {showAnswer && (
            <div className="space-y-4">
              <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Correct Answer:</p>
                <p className="text-lg">{currentQuestion.answer_text}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {!showAnswer ? (
            <Button
              className="w-full"
              size="lg"
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
