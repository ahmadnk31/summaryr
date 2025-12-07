"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Brain,
  TrendingUp,
  Calendar,
  Target,
  Award,
  BookOpen,
  HelpCircle,
  Activity,
  Clock,
} from "lucide-react"
import { calculateStudyStats, getDueItems, type StudyStats } from "@/lib/spaced-repetition"
import { toast } from "sonner"

interface StudyItem {
  id: string
  repetition_count: number
  easiness_factor: number
  interval_days: number
  next_review_date: string
  last_reviewed_at?: string | null
}

interface ReviewHistoryItem {
  id: string
  item_type: string
  quality: number
  reviewed_at: string
}

export function StudyStatsDashboard() {
  const [flashcards, setFlashcards] = useState<StudyItem[]>([])
  const [questions, setQuestions] = useState<StudyItem[]>([])
  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load flashcards
      const { data: flashcardsData, error: flashcardsError } = await supabase
        .from("flashcards")
        .select("id, repetition_count, easiness_factor, interval_days, next_review_date, last_reviewed_at")
        .eq("user_id", user.id)

      if (flashcardsError) throw flashcardsError
      setFlashcards(flashcardsData || [])

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("id, repetition_count, easiness_factor, interval_days, next_review_date, last_reviewed_at")
        .eq("user_id", user.id)

      if (questionsError) throw questionsError
      setQuestions(questionsData || [])

      // Load review history (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: historyData, error: historyError } = await supabase
        .from("review_history")
        .select("id, item_type, quality, reviewed_at")
        .eq("user_id", user.id)
        .gte("reviewed_at", thirtyDaysAgo.toISOString())
        .order("reviewed_at", { ascending: false })

      if (historyError) throw historyError
      setReviewHistory(historyData || [])
    } catch (error) {
      console.error("Error loading study data:", error)
      toast.error("Failed to load statistics")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading statistics...</div>
  }

  const flashcardStats = calculateStudyStats(flashcards)
  const questionStats = calculateStudyStats(questions)
  const allItems = [...flashcards, ...questions]
  const combinedStats = calculateStudyStats(allItems)

  const dueFlashcards = getDueItems(flashcards)
  const dueQuestions = getDueItems(questions)

  // Calculate review streak
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const reviewDates = reviewHistory.map((r) => {
    const date = new Date(r.reviewed_at)
    date.setHours(0, 0, 0, 0)
    return date.getTime()
  })
  const uniqueDates = [...new Set(reviewDates)].sort((a, b) => b - a)
  let streak = 0
  for (let i = 0; i < uniqueDates.length; i++) {
    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - i)
    if (uniqueDates[i] === expectedDate.getTime()) {
      streak++
    } else {
      break
    }
  }

  // Calculate average quality
  const avgQuality =
    reviewHistory.length > 0
      ? reviewHistory.reduce((sum, r) => sum + r.quality, 0) / reviewHistory.length
      : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Study Statistics</h2>
      </div>

      {/* Overview Cards */}
      <div className="overflow-x-auto -mx-6 px-6 pb-2">
        <div className="flex gap-4 min-w-max md:grid md:grid-cols-2 lg:grid-cols-4 md:min-w-0">
          <Card className="min-w-[250px] md:min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{combinedStats.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {flashcards.length} flashcards, {questions.length} questions
            </p>
          </CardContent>
          </Card>

          <Card className="min-w-[250px] md:min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{combinedStats.dueToday}</div>
            <p className="text-xs text-muted-foreground">
              {dueFlashcards.length} flashcards, {dueQuestions.length} questions
            </p>
          </CardContent>
          </Card>

          <Card className="min-w-[250px] md:min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streak} days</div>
            <p className="text-xs text-muted-foreground">
              {reviewHistory.length} reviews this month
            </p>
          </CardContent>
          </Card>

          <Card className="min-w-[250px] md:min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mastered</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{combinedStats.masteredItems}</div>
              <p className="text-xs text-muted-foreground">
                {((combinedStats.masteredItems / combinedStats.totalItems) * 100 || 0).toFixed(0)}% of
                total
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Stats */}
      <Tabs defaultValue="flashcards" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="flashcards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
                <CardDescription>Your flashcard mastery level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Mastered</span>
                    <span className="font-medium">
                      {flashcardStats.masteredItems} / {flashcardStats.totalItems}
                    </span>
                  </div>
                  <Progress
                    value={(flashcardStats.masteredItems / flashcardStats.totalItems) * 100 || 0}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Avg. Easiness</p>
                    <p className="text-2xl font-bold">{flashcardStats.averageEasiness}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Reviewed Today</p>
                    <p className="text-2xl font-bold">{flashcardStats.reviewedToday}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
                <CardDescription>Recent review quality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center h-24">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">{avgQuality.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Average Quality (0-5)</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Due for review</span>
                    <Badge variant="secondary">{flashcardStats.dueToday}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
                <CardDescription>Your question mastery level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Mastered</span>
                    <span className="font-medium">
                      {questionStats.masteredItems} / {questionStats.totalItems}
                    </span>
                  </div>
                  <Progress
                    value={(questionStats.masteredItems / questionStats.totalItems) * 100 || 0}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Avg. Easiness</p>
                    <p className="text-2xl font-bold">{questionStats.averageEasiness}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Reviewed Today</p>
                    <p className="text-2xl font-bold">{questionStats.reviewedToday}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
                <CardDescription>Recent review quality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center h-24">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">{avgQuality.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Average Quality (0-5)</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Due for review</span>
                    <Badge variant="secondary">{questionStats.dueToday}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Reviews
          </CardTitle>
          <CardDescription>Your latest study sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {reviewHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No reviews yet. Start practicing!</p>
          ) : (
            <div className="space-y-2">
              {reviewHistory.slice(0, 10).map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    {review.item_type === "flashcard" ? (
                      <Brain className="w-4 h-4 text-primary" />
                    ) : (
                      <HelpCircle className="w-4 h-4 text-primary" />
                    )}
                    <span className="text-sm capitalize">{review.item_type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={review.quality >= 4 ? "default" : review.quality >= 3 ? "secondary" : "destructive"}>
                      Quality: {review.quality}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.reviewed_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
