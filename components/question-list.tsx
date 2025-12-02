"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Eye, EyeOff, Play, Check, X, ArrowRight, FileQuestion, Trophy, Send } from "lucide-react"
import { Label } from "@/components/ui/label"
import type { Question } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface QuestionListProps {
  documentId: string
  refreshKey: number
}

export function QuestionList({ documentId, refreshKey }: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [quizMode, setQuizMode] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState<Set<string>>(new Set())
  const [incorrectAnswers, setIncorrectAnswers] = useState<Set<string>>(new Set())
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])
  const [quizComplete, setQuizComplete] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Map<string, string>>(new Map())
  const [submittedAnswers, setSubmittedAnswers] = useState<Set<string>>(new Set())
  const [answerResults, setAnswerResults] = useState<Map<string, "correct" | "incorrect">>(new Map())

  useEffect(() => {
    loadQuestions()
  }, [documentId, refreshKey])

  const loadQuestions = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })

    if (data) {
      setQuestions(data)
      setQuizQuestions(data)
    }
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("questions").delete().eq("id", id)
    loadQuestions()
  }

  const toggleReveal = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const startQuizMode = () => {
    setQuizMode(true)
    setCurrentIndex(0)
    setRevealed(new Set())
    setCorrectAnswers(new Set())
    setIncorrectAnswers(new Set())
    setQuizComplete(false)
    setQuizQuestions([...questions])
    setUserAnswers(new Map())
    setSubmittedAnswers(new Set())
    setAnswerResults(new Map())
  }

  const exitQuizMode = () => {
    setQuizMode(false)
    setCurrentIndex(0)
    setRevealed(new Set())
    setCorrectAnswers(new Set())
    setIncorrectAnswers(new Set())
    setQuizComplete(false)
    setUserAnswers(new Map())
    setSubmittedAnswers(new Set())
    setAnswerResults(new Map())
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers((prev) => {
      const next = new Map(prev)
      next.set(questionId, answer)
      return next
    })
  }

  const submitAnswer = (questionId: string) => {
    const userAnswer = userAnswers.get(questionId)?.trim().toLowerCase() || ""
    const correctAnswer = questions.find((q) => q.id === questionId)?.answer_text.trim().toLowerCase() || ""
    
    // Simple comparison - can be enhanced with fuzzy matching
    const isCorrect = userAnswer === correctAnswer || 
                      correctAnswer.includes(userAnswer) || 
                      userAnswer.includes(correctAnswer) ||
                      // Check if key terms match (for longer answers)
                      (userAnswer.length > 10 && correctAnswer.length > 10 && 
                       userAnswer.split(/\s+/).some(term => correctAnswer.includes(term)) &&
                       correctAnswer.split(/\s+/).some(term => userAnswer.includes(term)))

    setAnswerResults((prev) => {
      const next = new Map(prev)
      next.set(questionId, isCorrect ? "correct" : "incorrect")
      return next
    })

    setSubmittedAnswers((prev) => new Set(prev).add(questionId))
    // Only auto-reveal answer if incorrect
    if (!isCorrect) {
      setRevealed((prev) => new Set(prev).add(questionId))
    }

    if (isCorrect) {
      setCorrectAnswers((prev) => new Set(prev).add(questionId))
    } else {
      setIncorrectAnswers((prev) => new Set(prev).add(questionId))
    }
  }

  const markAsCorrect = () => {
    if (quizQuestions[currentIndex]) {
      setCorrectAnswers((prev) => new Set(prev).add(quizQuestions[currentIndex].id))
      nextQuestion()
    }
  }

  const markAsIncorrect = () => {
    if (quizQuestions[currentIndex]) {
      setIncorrectAnswers((prev) => new Set(prev).add(quizQuestions[currentIndex].id))
      nextQuestion()
    }
  }

  const nextQuestion = () => {
    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setRevealed(new Set())
    } else {
      setQuizComplete(true)
    }
  }

  const currentQuestion = quizQuestions[currentIndex]
  const isRevealed = currentQuestion && revealed.has(currentQuestion.id)
  // Calculate score based on submitted answers
  const score = Array.from(answerResults.values()).filter((r) => r === "correct").length
  const total = submittedAnswers.size
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0

  if (questions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">No questions yet. Select text to generate one!</p>
    )
  }

  if (quizMode && currentQuestion && !quizComplete) {
    const progress = ((currentIndex + 1) / quizQuestions.length) * 100
    const userAnswer = userAnswers.get(currentQuestion.id) || ""
    const isSubmitted = submittedAnswers.has(currentQuestion.id)
    const result = answerResults.get(currentQuestion.id)

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Question {currentIndex + 1} of {quizQuestions.length}
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={exitQuizMode}>
            Exit Quiz
          </Button>
        </div>

        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-xs">
                {currentQuestion.difficulty}
              </Badge>
            </div>
            <p className="text-base font-semibold mb-4">{currentQuestion.question_text}</p>
            
            {!isSubmitted ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="answer-input">Your Answer</Label>
                  <Textarea
                    id="answer-input"
                    value={userAnswer}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="mt-2 min-h-24"
                  />
                </div>
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => submitAnswer(currentQuestion.id)}
                  className="w-full"
                  disabled={!userAnswer.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Answer
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={cn(
                  "p-4 rounded-lg border-2",
                  result === "correct" 
                    ? "bg-green-50 dark:bg-green-950 border-green-500" 
                    : "bg-red-50 dark:bg-red-950 border-red-500"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {result === "correct" ? (
                      <>
                        <Check className="h-5 w-5 text-green-600" />
                        <p className="font-semibold text-green-700 dark:text-green-300">Correct!</p>
                      </>
                    ) : (
                      <>
                        <X className="h-5 w-5 text-red-600" />
                        <p className="font-semibold text-red-700 dark:text-red-300">Incorrect</p>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Your Answer:</p>
                      <p className="text-sm">{userAnswer || "(No answer provided)"}</p>
                    </div>
                    {result === "incorrect" && isRevealed && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Correct Answer:</p>
                        <p className="text-sm font-medium">{currentQuestion.answer_text}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {result === "incorrect" && !isRevealed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleReveal(currentQuestion.id)}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Show Correct Answer
                  </Button>
                )}

                <div className="flex gap-3">
                  {currentIndex < quizQuestions.length - 1 ? (
                    <Button
                      variant="default"
                      size="lg"
                      onClick={nextQuestion}
                      className="flex-1"
                    >
                      Next Question <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="lg"
                      onClick={() => setQuizComplete(true)}
                      className="flex-1"
                    >
                      Finish Quiz <Trophy className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (quizMode && quizComplete) {
    return (
      <div className="space-y-4 text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold">Quiz Complete!</h3>
        <div className="space-y-2">
          <p className="text-3xl font-bold text-primary">{score} / {total}</p>
          <p className="text-lg font-medium">{percentage}% Correct</p>
        </div>
        <div className="flex gap-2 pt-4">
          <Button onClick={startQuizMode} variant="outline" className="flex-1">
            Retake Quiz
          </Button>
          <Button onClick={exitQuizMode} className="flex-1">
            Review Questions
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={startQuizMode}
        className="w-full"
        variant="default"
      >
        <Play className="h-4 w-4 mr-2" />
        Start Practice Quiz ({questions.length} questions)
      </Button>

      {questions.map((q) => {
        const userAnswer = userAnswers.get(q.id) || ""
        const isSubmitted = submittedAnswers.has(q.id)
        const result = answerResults.get(q.id)
        const isRevealed = revealed.has(q.id)

        return (
          <Card key={q.id} className={cn(
            "transition-all hover:shadow-md",
            isRevealed && "ring-2 ring-primary",
            isSubmitted && result === "correct" && "ring-2 ring-green-500",
            isSubmitted && result === "incorrect" && "ring-2 ring-red-500"
          )}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="secondary" className="text-xs">
                  {q.difficulty}
                </Badge>
              </div>
              <p className="text-sm font-semibold mb-3">{q.question_text}</p>
              
              {!isSubmitted ? (
                <div className="space-y-2 mb-3">
                  <Label htmlFor={`answer-${q.id}`}>Your Answer</Label>
                  <Textarea
                    id={`answer-${q.id}`}
                    value={userAnswer}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-20"
                  />
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => submitAnswer(q.id)}
                    disabled={!userAnswer.trim()}
                    className="w-full"
                  >
                    <Send className="h-3 w-3 mr-2" />
                    Submit Answer
                  </Button>
                </div>
              ) : (
                <div className={cn(
                  "p-3 rounded-lg border-2 mb-3",
                  result === "correct" 
                    ? "bg-green-50 dark:bg-green-950 border-green-500" 
                    : "bg-red-50 dark:bg-red-950 border-red-500"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {result === "correct" ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-semibold text-green-700 dark:text-green-300">Correct!</p>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-red-600" />
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300">Incorrect</p>
                      </>
                    )}
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">Your Answer:</p>
                      <p className="text-sm">{userAnswer || "(No answer provided)"}</p>
                    </div>
                    {result === "incorrect" && isRevealed && (
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Correct Answer:</p>
                        <p className="text-sm font-medium">{q.answer_text}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {isSubmitted && result === "incorrect" && !isRevealed && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleReveal(q.id)}
                  className="w-full mb-3"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Show Correct Answer
                </Button>
              )}

              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  {isSubmitted && result === "incorrect" && !isRevealed && (
                    <Button size="sm" variant="outline" onClick={() => toggleReveal(q.id)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Show Correct Answer
                    </Button>
                  )}
                  {isSubmitted && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSubmittedAnswers((prev) => {
                          const next = new Set(prev)
                          next.delete(q.id)
                          return next
                        })
                        setAnswerResults((prev) => {
                          const next = new Map(prev)
                          next.delete(q.id)
                          return next
                        })
                        setUserAnswers((prev) => {
                          const next = new Map(prev)
                          next.delete(q.id)
                          return next
                        })
                        setRevealed((prev) => {
                          const next = new Set(prev)
                          next.delete(q.id)
                          return next
                        })
                      }}
                    >
                      Try Again
                    </Button>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(q.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
