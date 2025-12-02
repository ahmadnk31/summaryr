"use client"

import { useState } from "react"
import { DocumentViewer } from "@/components/document-viewer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, ArrowLeft, BookOpen, FileQuestion, FileText, StickyNote, Lightbulb, Plus, MessageCircle } from "lucide-react"
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">DocStudy</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DocumentViewer
              document={document}
              onCreateFlashcard={handleCreateFlashcard}
              onCreateQuestion={handleCreateQuestion}
              onSummarize={handleSummarize}
              onExplain={handleExplain}
              onCreateNote={handleCreateNote}
            />
          </div>

          <div>
            <Card className="h-[calc(100vh-8rem)] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle>Study Materials</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <Tabs defaultValue="chat" className="w-full">
                  <TabsList className="grid w-full grid-cols-6 sticky top-0 bg-background z-10 mb-4">
                    <TabsTrigger value="chat" className="text-xs">
                      <MessageCircle className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="flashcards" className="text-xs">
                      <BookOpen className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="questions" className="text-xs">
                      <FileQuestion className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="summaries" className="text-xs">
                      <FileText className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="explanations" className="text-xs">
                      <Lightbulb className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="text-xs">
                      <StickyNote className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="chat" className="mt-0 h-[calc(100vh-12rem)]">
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
        onSuccess={handleSuccess}
      />

      <QuestionDialog
        open={questionDialogOpen}
        onOpenChange={setQuestionDialogOpen}
        documentId={document.id}
        selectedText={selectedText}
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
