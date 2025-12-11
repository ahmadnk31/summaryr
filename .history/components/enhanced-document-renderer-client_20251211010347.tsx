"use client"

import { useState } from "react"
import { EnhancedDocumentRenderer } from "@/components/enhanced-document-renderer"
import { FlashcardDialog } from "@/components/flashcard-dialog"
import { QuestionDialog } from "@/components/question-dialog"
import { SummaryDialog } from "@/components/summary-dialog"
import { ExplainDialog } from "@/components/explain-dialog"
import { NoteDialog } from "@/components/note-dialog"
import type { Document } from "@/lib/types"

interface EnhancedDocumentRendererClientProps {
  document: Document
}

export function EnhancedDocumentRendererClient({ document }: EnhancedDocumentRendererClientProps) {
  const [flashcardDialogOpen, setFlashcardDialogOpen] = useState(false)
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false)
  const [explainDialogOpen, setExplainDialogOpen] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [noteStartOffset, setNoteStartOffset] = useState<number | undefined>()
  const [noteEndOffset, setNoteEndOffset] = useState<number | undefined>()

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

  const handleCreateNote = (text: string, startOffset?: number, endOffset?: number) => {
    setSelectedText(text)
    setNoteStartOffset(startOffset)
    setNoteEndOffset(endOffset)
    setNoteDialogOpen(true)
  }

  return (
    <>
      <EnhancedDocumentRenderer
        document={document}
        onCreateFlashcard={handleCreateFlashcard}
        onCreateQuestion={handleCreateQuestion}
        onSummarize={handleSummarize}
        onExplain={handleExplain}
        onCreateNote={handleCreateNote}
      />

      <FlashcardDialog
        open={flashcardDialogOpen}
        onOpenChange={setFlashcardDialogOpen}
        documentId={document.id}
        selectedText={selectedText}
        onSuccess={() => setFlashcardDialogOpen(false)}
      />

      <QuestionDialog
        open={questionDialogOpen}
        onOpenChange={setQuestionDialogOpen}
        documentId={document.id}
        selectedText={selectedText}
        onSuccess={() => setQuestionDialogOpen(false)}
      />

      <SummaryDialog
        open={summaryDialogOpen}
        onOpenChange={setSummaryDialogOpen}
        documentId={document.id}
        selectedText={selectedText}
        onSuccess={() => setSummaryDialogOpen(false)}
      />

      <ExplainDialog
        open={explainDialogOpen}
        onOpenChange={setExplainDialogOpen}
        documentId={document.id}
        selectedText={selectedText}
        onSuccess={() => setExplainDialogOpen(false)}
      />

      <NoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        documentId={document.id}
        selectedText={selectedText}
      />
    </>
  )
}
