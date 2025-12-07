"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PracticeFlashcards } from "@/components/practice-flashcards"
import { PracticeQuestions } from "@/components/practice-questions"
import { StudyStatsDashboard } from "@/components/study-stats-dashboard"
import { CreatePracticeSession } from "@/components/create-practice-session"
import { JoinPracticeSession } from "@/components/join-practice-session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { Brain, HelpCircle, TrendingUp, Users } from "lucide-react"

export default function PracticePage() {
  return (
    <>
      <DashboardNavbar title="Study & Practice" />
      <div className="container mx-auto p-6 max-w-6xl">
        <Tabs defaultValue="flashcards" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="flashcards" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Flashcards</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Questions</span>
            </TabsTrigger>
            <TabsTrigger value="together" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Together</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flashcards" className="mt-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Practice Flashcards</CardTitle>
                <CardDescription>
                  Review flashcards that are due today. Rate each card based on how well you remembered it.
                </CardDescription>
              </CardHeader>
            </Card>
            <PracticeFlashcards />
          </TabsContent>

          <TabsContent value="questions" className="mt-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Practice Questions</CardTitle>
                <CardDescription>
                  Test your knowledge with practice questions. Review the answer and rate your performance.
                </CardDescription>
              </CardHeader>
            </Card>
            <PracticeQuestions />
          </TabsContent>

          <TabsContent value="together" className="mt-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Practice Together
                </CardTitle>
                <CardDescription>
                  Create or join a collaborative study session and practice with friends
                </CardDescription>
              </CardHeader>
            </Card>
            <div className="grid md:grid-cols-2 gap-6">
              <CreatePracticeSession />
              <JoinPracticeSession />
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <StudyStatsDashboard />
          </TabsContent>

          <Card className="mt-8 border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">💡 Study Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Review daily for best results - consistency is key!</li>
                <li>Be honest with your ratings - it helps the algorithm schedule optimally</li>
                <li><strong>Again (0)</strong>: You didn't remember it at all</li>
                <li><strong>Hard (3)</strong>: You remembered but it was difficult</li>
                <li><strong>Good (4)</strong>: You remembered with some thought</li>
                <li><strong>Easy (5)</strong>: You remembered instantly</li>
              </ul>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </>
  )
}
