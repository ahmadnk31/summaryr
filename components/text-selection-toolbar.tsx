"use client"

import { useState, useEffect, useRef } from "react"
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
  const [adjustedPosition, setAdjustedPosition] = useState({ x: position.x, y: position.y, showAbove: true })
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Get actual toolbar dimensions if available
    const toolbarElement = toolbarRef.current
    const toolbarWidth = toolbarElement?.offsetWidth || 320
    const toolbarHeight = toolbarElement?.offsetHeight || 50
    const padding = 16
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Adjust horizontal position to stay within viewport
    const maxLeft = viewportWidth - toolbarWidth / 2 - padding
    const minLeft = toolbarWidth / 2 + padding
    const adjustedX = Math.max(minLeft, Math.min(position.x, maxLeft))

    // Adjust vertical position to stay within viewport
    const spaceAbove = position.y
    const spaceBelow = viewportHeight - position.y
    
    // Determine if toolbar should be above or below selection
    // When showing above, transform moves it up by 120% of its height
    const spaceNeededAbove = toolbarHeight * 1.2 + padding
    const showAbove = spaceAbove >= spaceNeededAbove
    
    // Adjust Y position based on available space
    let adjustedY = position.y
    if (showAbove) {
      // Position above - no adjustment needed, transform handles it
      adjustedY = position.y
    } else {
      // Position below - transform moves it down by 20%
      if (spaceBelow < toolbarHeight * 1.2 + padding) {
        // Not enough space below, position at bottom of viewport
        adjustedY = viewportHeight - toolbarHeight - padding
      } else {
        // Enough space below, position normally
        adjustedY = position.y
      }
    }

    setAdjustedPosition({ 
      x: adjustedX, 
      y: adjustedY,
      showAbove 
    })
  }, [position.x, position.y])

  if (!selectedText) return null

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[9999] bg-popover border rounded-lg shadow-lg p-1 sm:p-2 flex flex-wrap gap-1 max-w-[calc(100vw-2rem)]"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        transform: adjustedPosition.showAbove ? "translate(-50%, -120%)" : "translate(-50%, 20%)",
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
