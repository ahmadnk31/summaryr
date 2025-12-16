"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PracticeFlashcards } from "@/components/practice-flashcards"
import { PracticeQuestions } from "@/components/practice-questions"
import { StudyStatsDashboard } from "@/components/study-stats-dashboard"
import { CreatePracticeSession } from "@/components/create-practice-session"
import { JoinPracticeSession } from "@/components/join-practice-session"
import { UserSessionsList } from "@/components/user-sessions-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { Brain, HelpCircle, TrendingUp, Users, Lock } from "lucide-react"
import Link from "next/link"

interface PracticeViewProps {
    planTier: string;
}

export function PracticeView({ planTier }: PracticeViewProps) {
    const isTeamPlan = planTier === 'team';

    return (
        <>
            <DashboardNavbar title="Study & Practice" planTier={planTier} />
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
                            {isTeamPlan ? <Users className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
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
                        {isTeamPlan ? (
                            <>
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
                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    <CreatePracticeSession />
                                    <JoinPracticeSession />
                                </div>
                                <UserSessionsList />
                            </>
                        ) : (
                            <Card className="border-primary/50 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lock className="w-5 h-5 text-primary" />
                                        Team Feature Locked
                                    </CardTitle>
                                    <CardDescription>
                                        Collaborative practice is available on the Team plan.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                                    <Users className="h-16 w-16 text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-bold mb-2">Practice with Friends</h3>
                                    <p className="text-muted-foreground mb-6 max-w-md">
                                        Upgrade to the Team plan to create real-time study sessions, compete on leaderboards, and share decks instantly.
                                    </p>
                                    <Link href="/pricing" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                        Upgrade to Team
                                    </Link>
                                </CardContent>
                            </Card>
                        )}
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
