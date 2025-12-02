"use client"

import { Button } from "@/components/ui/button"
import { BookOpen, FileQuestion, FileText, StickyNote, Lightbulb } from "lucide-react"

interface TextSelectionToolbarProps {
  selectedText: string
  position: { x: number; y: number }
  onCreateFlashcard: () => void
  onCreateQuestion: () => void
  onSummarize: () => void
  onExplain: () => void
  onCreateNote: () => void
}

export function TextSelectionToolbar({
  selectedText,
  position,
  onCreateFlashcard,
  onCreateQuestion,
  onSummarize,
  onExplain,
  onCreateNote,
}: TextSelectionToolbarProps) {
  if (!selectedText) return null

  return (
    <div
      className="fixed z-50 bg-popover border rounded-lg shadow-lg p-2 flex gap-1"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -120%)",
      }}
    >
      <Button size="sm" variant="ghost" onClick={onCreateFlashcard} className="gap-2">
        <BookOpen className="h-4 w-4" />
        Flashcard
      </Button>
      <Button size="sm" variant="ghost" onClick={onCreateQuestion} className="gap-2">
        <FileQuestion className="h-4 w-4" />
        Question
      </Button>
      <Button size="sm" variant="ghost" onClick={onSummarize} className="gap-2">
        <FileText className="h-4 w-4" />
        Summarize
      </Button>
      <Button size="sm" variant="ghost" onClick={onExplain} className="gap-2">
        <Lightbulb className="h-4 w-4" />
        Explain
      </Button>
      <Button size="sm" variant="ghost" onClick={onCreateNote} className="gap-2">
        <StickyNote className="h-4 w-4" />
        Note
      </Button>
    </div>
  )
}
