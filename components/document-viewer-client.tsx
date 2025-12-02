"use client"

import { useState, useEffect } from "react"
import { DocumentViewer } from "@/components/document-viewer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, BookOpen, FileQuestion, FileText, StickyNote, Lightbulb, Plus, MessageCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Document } from "@/lib/types"
import { FlashcardDialog } from "@/components/flashcard-dialog"
import { QuestionDialog } from "@/components/question-dialog"
import { SummaryDialog } from "@/components/summary-dialog"
import { ExplainDialog } from "@/components/explain-dialog"
import { NoteDialog } from "@/components/note-dialog"
import { FlashcardList } from "@/components/flashcard-list"
import { QuestionList } from "@/components/question-list"
import { SummaryList } from "@/components/summary-list"
import { ExplanationList } from "@/components/explanation-list"
import { NoteList } from "@/components/note-list"
import { DocumentChat } from "@/components/document-chat"

interface DocumentViewerClientProps {
  document: Document
}

export function DocumentViewerClient({ document }: DocumentViewerClientProps) {
  const [selectedText, setSelectedText] = useState("")
  const [flashcardDialogOpen, setFlashcardDialogOpen] = useState(false)
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false)
  const [explainDialogOpen, setExplainDialogOpen] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [notePosition, setNotePosition] = useState<{ start?: number; end?: number }>({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleCreateFlashcard = (text: string) => {
    setSelectedText(text)
    setFlashcardDialogOpen(true)
  }

  const handleCreateQuestion = (text: string) => {
    setSelectedText(text)
    setQuestionDialogOpen(true)
  }

  const handleSummarize = (text: string) => {
    setSelectedText(text)
    setSummaryDialogOpen(true)
  }

  const handleExplain = (text: string) => {
    setSelectedText(text)
    setExplainDialogOpen(true)
  }

  const handleCreateNote = (text: string, start?: number, end?: number) => {
    setSelectedText(text)
    setNotePosition({ start, end })
    setNoteDialogOpen(true)
  }

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Summaryr Logo" width={24} height={24} className="h-5 w-5 sm:h-6 sm:w-6" />
              <h1 className="text-lg sm:text-xl font-semibold">Summaryr</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 max-w-7xl">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_350px]">
          <div className="order-2 lg:order-1 min-w-0">
            <DocumentViewer
              document={document}
              onCreateFlashcard={handleCreateFlashcard}
              onCreateQuestion={handleCreateQuestion}
              onSummarize={handleSummarize}
              onExplain={handleExplain}
              onCreateNote={handleCreateNote}
            />
          </div>

          <div className="order-1 lg:order-2 min-w-0">
            <Card className="h-auto lg:h-[calc(100vh-8rem)] flex flex-col w-full">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-base sm:text-lg">Study Materials</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {isMounted ? (
                  <Tabs defaultValue="chat" className="w-full">
                    <TabsList className="flex w-full sm:grid sm:grid-cols-6 overflow-x-auto sticky top-0 bg-background z-10 mb-4 h-auto scrollbar-hide">
                    <TabsTrigger value="chat" className="text-[10px] sm:text-xs p-1.5 sm:p-2 flex-shrink-0">
                      <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="flashcards" className="text-[10px] sm:text-xs p-1.5 sm:p-2 flex-shrink-0">
                      <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="questions" className="text-[10px] sm:text-xs p-1.5 sm:p-2 flex-shrink-0">
                      <FileQuestion className="h-3 w-3 sm:h-4 sm:w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="summaries" className="text-[10px] sm:text-xs p-1.5 sm:p-2 flex-shrink-0">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="explanations" className="text-[10px] sm:text-xs p-1.5 sm:p-2 flex-shrink-0">
                      <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="text-[10px] sm:text-xs p-1.5 sm:p-2 flex-shrink-0">
                      <StickyNote className="h-3 w-3 sm:h-4 sm:w-4" />
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="chat" className="mt-0 h-[400px] sm:h-[500px] lg:h-[calc(100vh-12rem)]">
                    <DocumentChat documentId={document.id} documentText={document.extracted_text} />
                  </TabsContent>

                  <TabsContent value="flashcards" className="mt-0 space-y-3">
                    <Button
                      onClick={() => handleCreateFlashcard("")}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Flashcard
                    </Button>
                    <FlashcardList documentId={document.id} refreshKey={refreshKey} />
                  </TabsContent>

                  <TabsContent value="questions" className="mt-0 space-y-3">
                    <Button
                      onClick={() => handleCreateQuestion("")}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Question
                    </Button>
                    <QuestionList documentId={document.id} refreshKey={refreshKey} />
                  </TabsContent>

                  <TabsContent value="summaries" className="mt-0 space-y-3">
                    <Button
                      onClick={() => handleSummarize("")}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Summary
                    </Button>
                    <SummaryList documentId={document.id} refreshKey={refreshKey} />
                  </TabsContent>

                  <TabsContent value="explanations" className="mt-0 space-y-3">
                    <Button
                      onClick={() => handleExplain("")}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Explanation
                    </Button>
                    <ExplanationList documentId={document.id} refreshKey={refreshKey} />
                  </TabsContent>

                  <TabsContent value="notes" className="mt-0 space-y-3">
                    <Button
                      onClick={() => handleCreateNote("")}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Note
                    </Button>
                    <NoteList documentId={document.id} refreshKey={refreshKey} />
                  </TabsContent>
                </Tabs>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <FlashcardDialog
        open={flashcardDialogOpen}
        onOpenChange={setFlashcardDialogOpen}
        documentId={document.id}
        selectedText={selectedText}
        documentText={document.extracted_text}
        onSuccess={handleSuccess}
      />

      <QuestionDialog
        open={questionDialogOpen}
        onOpenChange={setQuestionDialogOpen}
        documentId={document.id}
        selectedText={selectedText}
        documentText={document.extracted_text}
        onSuccess={handleSuccess}
      />

      <SummaryDialog
        open={summaryDialogOpen}
        onOpenChange={setSummaryDialogOpen}
        documentId={document.id}
        selectedText={selectedText}
        onSuccess={handleSuccess}
      />

      <ExplainDialog
        open={explainDialogOpen}
        onOpenChange={setExplainDialogOpen}
        documentId={document.id}
        selectedText={selectedText}
        onSuccess={handleSuccess}
      />

      <NoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        documentId={document.id}
        selectedText={selectedText}
        positionStart={notePosition.start}
        positionEnd={notePosition.end}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
