"use client"

import { useState, useEffect } from "react"
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
  const [leftPosition, setLeftPosition] = useState(position.x)

  useEffect(() => {
    // Ensure toolbar doesn't go off screen
    const toolbarWidth = 300 // Approximate max width
    const padding = 16
    const maxLeft = typeof window !== 'undefined' ? window.innerWidth - toolbarWidth / 2 - padding : position.x
    const minLeft = toolbarWidth / 2 + padding
    setLeftPosition(Math.max(minLeft, Math.min(position.x, maxLeft)))
  }, [position.x])

  if (!selectedText) return null

  return (
    <div
      className="fixed z-50 bg-popover border rounded-lg shadow-lg p-1 sm:p-2 flex flex-wrap gap-1 max-w-[calc(100vw-2rem)]"
      style={{
        left: `${leftPosition}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -120%)",
        maxWidth: "calc(100vw - 2rem)",
      }}
    >
      <Button size="sm" variant="ghost" onClick={onCreateFlashcard} className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
        <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Flashcard</span>
      </Button>
      <Button size="sm" variant="ghost" onClick={onCreateQuestion} className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
        <FileQuestion className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Question</span>
      </Button>
      <Button size="sm" variant="ghost" onClick={onSummarize} className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
        <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Summarize</span>
      </Button>
      <Button size="sm" variant="ghost" onClick={onExplain} className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
        <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Explain</span>
      </Button>
      <Button size="sm" variant="ghost" onClick={onCreateNote} className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
        <StickyNote className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Note</span>
      </Button>
    </div>
  )
}
