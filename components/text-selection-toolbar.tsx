"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { BookOpen, FileQuestion, FileText, StickyNote, Lightbulb } from "lucide-react"

interface TextSelectionToolbarProps {
  selectedText: string
  position: { x: number; y: number }
  containerRef?: React.RefObject<HTMLElement>
  onCreateFlashcard: () => void
  onCreateQuestion: () => void
  onSummarize: () => void
  onExplain: () => void
  onCreateNote: () => void
}

export function TextSelectionToolbar({
  selectedText,
  position,
  containerRef,
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

    // Use requestAnimationFrame to ensure DOM is updated before calculating dimensions
    requestAnimationFrame(() => {
      // Get actual toolbar dimensions if available
      const toolbarElement = toolbarRef.current
      if (!toolbarElement) return
      
      const toolbarWidth = toolbarElement.offsetWidth || 320
      const toolbarHeight = toolbarElement.offsetHeight || 50
      const padding = 16
      
      // Get container bounds if available, otherwise use viewport
      let containerRect: DOMRect | null = null
      if (containerRef?.current) {
        containerRect = containerRef.current.getBoundingClientRect()
      }
      
      const boundsWidth = containerRect ? containerRect.width : window.innerWidth
      const boundsHeight = containerRect ? containerRect.height : window.innerHeight
      const boundsLeft = containerRect ? containerRect.left : 0
      const boundsTop = containerRect ? containerRect.top : 0
      const boundsRight = containerRect ? containerRect.right : window.innerWidth
      const boundsBottom = containerRect ? containerRect.bottom : window.innerHeight

      // Adjust horizontal position to stay within container/viewport
      // Ensure toolbar is always fully visible horizontally
      const halfToolbarWidth = toolbarWidth / 2
      const relativeX = position.x - boundsLeft
      const maxLeft = boundsWidth - halfToolbarWidth - padding
      const minLeft = halfToolbarWidth + padding
      const adjustedRelativeX = Math.max(minLeft, Math.min(relativeX, maxLeft))
      const adjustedX = adjustedRelativeX + boundsLeft

      // Adjust vertical position to stay within container/viewport
      const relativeY = position.y - boundsTop
      const spaceAbove = relativeY
      const spaceBelow = boundsHeight - relativeY
      
      // Determine if toolbar should be above or below selection
      // When showing above, transform moves it up by 120% of its height
      const spaceNeededAbove = toolbarHeight * 1.2 + padding
      const spaceNeededBelow = toolbarHeight * 1.2 + padding
      const showAbove = spaceAbove >= spaceNeededAbove
      
      // Adjust Y position based on available space
      let adjustedRelativeY = relativeY
      
      if (showAbove) {
        // Position above - ensure it doesn't go above container
        const minY = toolbarHeight * 1.2 + padding
        adjustedRelativeY = Math.max(minY, relativeY)
      } else {
        // Position below - ensure it doesn't go below container
        const maxY = boundsHeight - toolbarHeight * 1.2 - padding
        if (spaceBelow < spaceNeededBelow) {
          // Not enough space below, try to position above if possible
          if (spaceAbove >= spaceNeededAbove) {
            adjustedRelativeY = Math.max(toolbarHeight * 1.2 + padding, relativeY)
          } else {
            // Not enough space either way, position at bottom of container
            adjustedRelativeY = Math.max(padding, boundsHeight - toolbarHeight * 1.2 - padding)
          }
        } else {
          // Enough space below, position normally but clamp to container
          adjustedRelativeY = Math.min(maxY, Math.max(padding, relativeY))
        }
      }
      
      const adjustedY = adjustedRelativeY + boundsTop

      // Final check: ensure toolbar is completely within bounds
      const finalX = Math.max(boundsLeft + padding + halfToolbarWidth, Math.min(adjustedX, boundsRight - padding - halfToolbarWidth))
      const finalY = Math.max(boundsTop + padding, Math.min(adjustedY, boundsBottom - padding))

      setAdjustedPosition({ 
        x: finalX, 
        y: finalY,
        showAbove 
      })
    })
  }, [position.x, position.y, containerRef])

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
