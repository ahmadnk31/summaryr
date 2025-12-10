"use client"

import { useState, useEffect } from "react"
import { DocumentViewer } from "@/components/document-viewer"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { BookOpen, FileQuestion, FileText, StickyNote, Lightbulb, Plus, MessageCircle } from "lucide-react"
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
  const [autoGenerateExplain, setAutoGenerateExplain] = useState(false)
  const [autoGenerateSummary, setAutoGenerateSummary] = useState(false)
  const [autoGenerateFlashcard, setAutoGenerateFlashcard] = useState(false)
  const [autoGenerateQuestion, setAutoGenerateQuestion] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleCreateFlashcard = (text: string) => {
    // Use full document text if no text is selected
    const textToUse = text.trim() || document.extracted_text || ""
    setSelectedText(textToUse)
    // Auto-generate when triggered from selection toolbar (text is provided)
    setAutoGenerateFlashcard(!!text.trim())
    setFlashcardDialogOpen(true)
  }

  const handleCreateQuestion = (text: string) => {
    // Use full document text if no text is selected
    const textToUse = text.trim() || document.extracted_text || ""
    setSelectedText(textToUse)
    // Auto-generate when triggered from selection toolbar (text is provided)
    setAutoGenerateQuestion(!!text.trim())
    setQuestionDialogOpen(true)
  }

  const handleSummarize = (text: string) => {
    // Use full document text if no text is selected
    const textToUse = text.trim() || document.extracted_text || ""
    setSelectedText(textToUse)
    // Auto-generate when triggered from selection toolbar (text is provided)
    setAutoGenerateSummary(!!text.trim())
    setSummaryDialogOpen(true)
  }

  const handleExplain = (text: string) => {
    // Use full document text if no text is selected
    const textToUse = text.trim() || document.extracted_text || ""
    setSelectedText(textToUse)
    // Auto-generate when triggered from selection toolbar (text is provided)
    setAutoGenerateExplain(!!text.trim())
    setExplainDialogOpen(true)
  }

  const handleCreateNote = (text: string, start?: number, end?: number) => {
    // Use full document text if no text is selected
    const textToUse = text.trim() || document.extracted_text || ""
    setSelectedText(textToUse)
    setNotePosition({ start, end })
    setNoteDialogOpen(true)
  }

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar 
        showBackButton 
        backHref="/documents" 
        title={document.title}
      />

      <main className="container mx-auto px-4 py-4 sm:py-6 max-w-7xl">
        {/* Mobile layout - stacked */}
        <div className="block lg:hidden space-y-4 sm:space-y-6">
          <div>
            <DocumentViewer
              document={document}
              onCreateFlashcard={handleCreateFlashcard}
              onCreateQuestion={handleCreateQuestion}
              onSummarize={handleSummarize}
              onExplain={handleExplain}
              onCreateNote={handleCreateNote}
            />
          </div>
          <Card className="h-auto flex flex-col w-full">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-base sm:text-lg">Study Materials</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-[600px]">
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

                <TabsContent value="chat" className="mt-0 h-[400px] sm:h-[500px]">
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

        {/* Desktop layout - resizable */}
        <div className="hidden lg:block h-[calc(100vh-4rem)]">
          {isMounted ? (
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={65} minSize={40} maxSize={80} className="min-w-0">
                <div className="h-full overflow-auto pr-2 sm:pr-4">
                  <DocumentViewer
                    document={document}
                    onCreateFlashcard={handleCreateFlashcard}
                    onCreateQuestion={handleCreateQuestion}
                    onSummarize={handleSummarize}
                    onExplain={handleExplain}
                    onCreateNote={handleCreateNote}
                  />
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={35} minSize={20} maxSize={60} className="min-w-0">
            <Card className="h-full flex flex-col w-full">
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
          </ResizablePanel>
        </ResizablePanelGroup>
        ) : null}
        </div>
      </main>

      <FlashcardDialog
        open={flashcardDialogOpen}
        onOpenChange={(open) => {
          setFlashcardDialogOpen(open)
          if (!open) setAutoGenerateFlashcard(false)
        }}
        documentId={document.id}
        selectedText={selectedText}
        documentText={document.extracted_text || ""}
        onSuccess={handleSuccess}
        autoGenerate={autoGenerateFlashcard}
      />

      <QuestionDialog
        open={questionDialogOpen}
        onOpenChange={(open) => {
          setQuestionDialogOpen(open)
          if (!open) setAutoGenerateQuestion(false)
        }}
        documentId={document.id}
        selectedText={selectedText}
        documentText={document.extracted_text || ""}
        onSuccess={handleSuccess}
      />

      <SummaryDialog
        open={summaryDialogOpen}
        onOpenChange={(open) => {
          setSummaryDialogOpen(open)
          if (!open) setAutoGenerateSummary(false)
        }}
        documentId={document.id}
        selectedText={selectedText}
        documentText={document.extracted_text || ""}
        onSuccess={handleSuccess}
        autoGenerate={autoGenerateSummary}
      />

      <ExplainDialog
        open={explainDialogOpen}
        onOpenChange={(open) => {
          setExplainDialogOpen(open)
          if (!open) setAutoGenerateExplain(false)
        }}
        documentId={document.id}
        selectedText={selectedText}
        documentText={document.extracted_text || ""}
        onSuccess={handleSuccess}
        autoGenerate={autoGenerateExplain}
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
