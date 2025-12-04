"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TextSelectionToolbar } from "@/components/text-selection-toolbar"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Document } from "@/lib/types"

interface DocumentViewerProps {
  document: Document
  onCreateFlashcard: (text: string) => void
  onCreateQuestion: (text: string) => void
  onSummarize: (text: string) => void
  onExplain: (text: string) => void
  onCreateNote: (text: string, start?: number, end?: number) => void
}

export function DocumentViewer({
  document: doc,
  onCreateFlashcard,
  onCreateQuestion,
  onSummarize,
  onExplain,
  onCreateNote,
}: DocumentViewerProps) {
  const [selectedText, setSelectedText] = useState("")
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 })
  const [showToolbar, setShowToolbar] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const showToolbarRef = useRef(false)

  // Keep ref in sync with state
  useEffect(() => {
    showToolbarRef.current = showToolbar
  }, [showToolbar])

  useEffect(() => {
    const handleSelection = () => {
      // Clear any pending hide timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = null
      }

      const selection = window.getSelection()
      if (!selection) {
        setShowToolbar(false)
        setSelectedText("")
        return
      }

      const text = selection.toString().trim()

      // Check if selection has valid ranges and text
      if (text && text.length > 0 && selection.rangeCount > 0) {
        try {
          const range = selection.getRangeAt(0)
          
          // Check if range is collapsed (no actual selection)
          if (range.collapsed) {
            // Delay hiding to prevent flickering during selection extension
            hideTimeoutRef.current = setTimeout(() => {
              const currentSelection = window.getSelection()
              const currentText = currentSelection?.toString().trim()
              if (!currentText || currentText.length === 0 || currentSelection?.rangeCount === 0) {
                setShowToolbar(false)
                setSelectedText("")
              }
            }, 100)
            return
          }

          const rect = range.getBoundingClientRect()

          // Always update position when we have text, even if rect dimensions are small
          // This ensures the toolbar follows the selection as it extends
          if (rect) {
            setSelectedText(text)
            
            // Get container bounds to constrain toolbar within document viewer
            const containerElement = containerRef.current
            let containerRect: DOMRect | null = null
            
            if (containerElement) {
              containerRect = containerElement.getBoundingClientRect()
            }
            
            // Calculate position based on the selection
            // Use the center horizontally, but prefer the end of selection vertically
            // This keeps the toolbar near where the user is actively selecting
            let x = rect.left + rect.width / 2
            let y = rect.bottom
            
            // If we have container bounds, constrain to container
            if (containerRect) {
              // Constrain horizontal position to container
              const containerLeft = containerRect.left
              const containerRight = containerRect.right
              const containerTop = containerRect.top
              const containerBottom = containerRect.bottom
              
              // Clamp x to container bounds with padding
              const padding = 50
              x = Math.max(containerLeft + padding, Math.min(x, containerRight - padding))
              
              // Clamp y to container bounds
              // If selection extends beyond container, use the visible part
              if (y > containerBottom) {
                y = Math.min(rect.top, containerBottom - 100) // Keep toolbar visible
              }
              if (y < containerTop) {
                y = Math.max(rect.bottom, containerTop + 100) // Keep toolbar visible
              }
              
              // Ensure y is within container bounds
              y = Math.max(containerTop + 50, Math.min(y, containerBottom - 50))
            } else {
              // Fallback to viewport if container not found
              const viewportWidth = window.innerWidth
              const viewportHeight = window.innerHeight
              
              x = Math.max(50, Math.min(x, viewportWidth - 50))
              
              if (y > viewportHeight) {
                y = Math.min(rect.top, viewportHeight - 100)
              }
              if (y < 0) {
                y = Math.max(rect.bottom, 100)
              }
            }
            
            setToolbarPosition({ x, y })
            setShowToolbar(true)
          } else if (text.length > 0) {
            // If we have text but invalid rect, keep toolbar visible
            // This handles cases where the rect might be temporarily invalid during selection extension
            setSelectedText(text)
            // Don't update position if rect is invalid, keep previous position
            // Only show toolbar if it's not already showing to avoid flickering
            if (!showToolbarRef.current) {
              setShowToolbar(true)
            }
          }
        } catch (error) {
          // If getRangeAt fails, check if we still have text
          // This can happen during rapid selection changes
          if (text && text.length > 0) {
            // Keep toolbar visible if we have text
            setSelectedText(text)
            if (!showToolbarRef.current) {
              setShowToolbar(true)
            }
          } else {
            setShowToolbar(false)
            setSelectedText("")
          }
        }
      } else {
        // Only hide toolbar if there's truly no selection after a delay
        // This prevents the toolbar from disappearing during selection extension
        hideTimeoutRef.current = setTimeout(() => {
          const currentSelection = window.getSelection()
          const currentText = currentSelection?.toString().trim()
          if (!currentText || currentText.length === 0 || !currentSelection || currentSelection.rangeCount === 0) {
            setShowToolbar(false)
            setSelectedText("")
          }
        }, 150)
      }
    }

    globalThis.document.addEventListener("selectionchange", handleSelection)
    return () => {
      globalThis.document.removeEventListener("selectionchange", handleSelection)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  const handleCreateFlashcard = () => {
    onCreateFlashcard(selectedText)
    setShowToolbar(false)
    window.getSelection()?.removeAllRanges()
  }

  const handleCreateQuestion = () => {
    onCreateQuestion(selectedText)
    setShowToolbar(false)
    window.getSelection()?.removeAllRanges()
  }

  const handleSummarize = () => {
    onSummarize(selectedText)
    setShowToolbar(false)
    window.getSelection()?.removeAllRanges()
  }

  const handleExplain = () => {
    onExplain(selectedText)
    setShowToolbar(false)
    window.getSelection()?.removeAllRanges()
  }

  const handleCreateNote = () => {
    const selection = window.getSelection()
    if (selection && contentRef.current) {
      const range = selection.getRangeAt(0)
      const preSelectionRange = range.cloneRange()
      preSelectionRange.selectNodeContents(contentRef.current)
      preSelectionRange.setEnd(range.startContainer, range.startOffset)
      const start = preSelectionRange.toString().length
      const end = start + selectedText.length

      onCreateNote(selectedText, start, end)
    } else {
      onCreateNote(selectedText)
    }
    setShowToolbar(false)
    window.getSelection()?.removeAllRanges()
  }

  return (
    <>
      <Card ref={containerRef} className="h-full relative">
        <CardHeader>
          <CardTitle>{doc.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {doc.file_type.toUpperCase()} • {new Date(doc.upload_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </CardHeader>
        <CardContent className="overflow-hidden p-0">
          <ScrollArea className="h-[400px] sm:h-[500px] lg:h-[calc(100vh-16rem)]">
            <div
              ref={contentRef}
              className="prose prose-sm sm:prose-base dark:prose-invert max-w-none select-text px-2 sm:px-4 lg:px-6 py-6"
              style={{ userSelect: "text" }}
            >
              {doc.extracted_text.split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-4 leading-relaxed text-sm sm:text-base lg:text-lg break-words whitespace-pre-wrap">
                  {paragraph}
                </p>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {showToolbar && (
        <TextSelectionToolbar
          selectedText={selectedText}
          position={toolbarPosition}
          containerRef={containerRef}
          onCreateFlashcard={handleCreateFlashcard}
          onCreateQuestion={handleCreateQuestion}
          onSummarize={handleSummarize}
          onExplain={handleExplain}
          onCreateNote={handleCreateNote}
        />
      )}
    </>
  )
}
