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

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      const text = selection?.toString().trim()

      if (text && text.length > 0) {
        const range = selection?.getRangeAt(0)
        const rect = range?.getBoundingClientRect()

        if (rect) {
          setSelectedText(text)
          // Use getBoundingClientRect which gives viewport-relative coordinates
          // For fixed positioning, we don't need to add window.scrollY
          setToolbarPosition({
            x: rect.left + rect.width / 2,
            y: rect.top, // Use viewport-relative top position
          })
          setShowToolbar(true)
        }
      } else {
        setShowToolbar(false)
        setSelectedText("")
      }
    }

    globalThis.document.addEventListener("selectionchange", handleSelection)
    return () => globalThis.document.removeEventListener("selectionchange", handleSelection)
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
      <Card className="h-full">
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
