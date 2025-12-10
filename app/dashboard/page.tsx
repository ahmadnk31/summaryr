import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DocumentUploadS3 } from "@/components/document-upload-s3"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, BookOpen, StickyNote, ArrowRight, TrendingUp, Clock, User, FileQuestion, Sparkles } from "lucide-react"
import Link from "next/link"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Access your documents, flashcards, questions, and study materials. Upload new documents and create AI-powered study materials.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Check if user exists in email_verifications table and is verified
  const { data: verification } = await supabase
    .from("email_verifications")
    .select("verified")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // User must exist in email_verifications table and be verified
  if (!verification || verification.verified !== true) {
    redirect("/auth/verify-email-required")
  }

  // Fetch recent documents
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("upload_date", { ascending: false })
    .limit(5)

  // Fetch stats
  const { count: documentCount } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { count: flashcardCount } = await supabase
    .from("flashcards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { count: noteCount } = await supabase
    .from("notes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { count: summaryCount } = await supabase
    .from("summaries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { count: questionCount } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Get user's full name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()

  const userName = profile?.full_name || user.email?.split("@")[0] || "User"

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <DashboardNavbar userName={userName} />

      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold truncate">Welcome back, {userName}!</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">Upload documents and create study materials with AI</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 px-4 pb-2 mb-8">
          <div className="flex gap-4 min-w-max md:grid md:grid-cols-2 lg:grid-cols-4 md:min-w-0 md:gap-6">
          <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors group min-w-[280px] md:min-w-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold mb-1">{documentCount || 0}</div>
                  <p className="text-xs text-muted-foreground">Total documents</p>
                </div>
                <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href="/documents">
                    View All
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors group min-w-[280px] md:min-w-0">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div>
                <div className="text-3xl font-bold mb-1">{flashcardCount || 0}</div>
                <p className="text-xs text-muted-foreground">Study cards created</p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors group min-w-[280px] md:min-w-0">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Notes</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <StickyNote className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div>
                <div className="text-3xl font-bold mb-1">{noteCount || 0}</div>
                <p className="text-xs text-muted-foreground">Personal notes</p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors group min-w-[280px] md:min-w-0">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Summaries</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                <Sparkles className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div>
                <div className="text-3xl font-bold mb-1">{summaryCount || 0}</div>
                <p className="text-xs text-muted-foreground">AI summaries</p>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DocumentUploadS3 />

          <Card className="h-full overflow-hidden">
            <CardHeader className="overflow-hidden">
              <div className="flex items-center justify-between gap-2 overflow-hidden">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center gap-2 truncate">
                    <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate">Recent Documents</span>
                  </CardTitle>
                  <CardDescription className="mt-1 truncate">
                    Your latest uploaded documents
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
                  <Link href="/documents" className="flex items-center gap-1 whitespace-nowrap">
                    <span className="hidden sm:inline">View All</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-hidden">
              {documents && documents.length > 0 ? (
                <div className="space-y-2 overflow-hidden">
                  {documents.map((doc, index) => (
                    <Link
                      key={doc.id}
                      href={`/documents/${doc.id}`}
                      className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all group w-full overflow-hidden max-w-full"
                    >
                      <div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="font-medium truncate group-hover:text-primary transition-colors text-sm" title={doc.title}>
                          {doc.title.length > 25 ? `${doc.title.substring(0, 25)}...` : doc.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium flex-shrink-0">
                            {doc.file_type.toUpperCase()}
                          </span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {new Date(doc.upload_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="hidden sm:block h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No documents yet</p>
                  <p className="text-xs text-muted-foreground">
                    Upload your first document to get started!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
