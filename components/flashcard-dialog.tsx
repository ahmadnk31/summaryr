"use client"

import { useState, useEffect } from "react"
import { useCompletion } from "@ai-sdk/react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface FlashcardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  selectedText: string
  onSuccess: () => void
}

export function FlashcardDialog({ open, onOpenChange, documentId, selectedText, onSuccess }: FlashcardDialogProps) {
  const [front, setFront] = useState("")
  const [back, setBack] = useState("")
  const [inputText, setInputText] = useState(selectedText)

  // Update inputText when selectedText changes
  useEffect(() => {
    if (selectedText) {
      setInputText(selectedText)
    }
  }, [selectedText])

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setFront("")
      setBack("")
    }
  }, [open])

  const { completion, complete, isLoading, stop } = useCompletion({
    api: "/api/ai/flashcard",
    body: {
      text: inputText || selectedText,
      documentId,
    },
    onFinish: () => {
      // Parse the JSON response only if completion exists and is not empty
      if (completion && completion.trim()) {
        try {
          const parsed = JSON.parse(completion.trim())
          if (parsed.front) setFront(parsed.front)
          if (parsed.back) setBack(parsed.back)
        } catch (e) {
          console.error("Error parsing flashcard:", e)
        }
      }
      onSuccess()
      setTimeout(() => {
        onOpenChange(false)
      }, 500)
    },
  })

  // Update state as completion streams
  useEffect(() => {
    if (completion && completion.trim()) {
      try {
        const trimmed = completion.trim()
        // Only try to parse if it looks like JSON (starts with {)
        if (trimmed.startsWith("{")) {
          // Try to find the last complete JSON object
          let jsonStr = trimmed
          // If it doesn't end with }, try to find the last complete object
          if (!trimmed.endsWith("}")) {
            const lastBrace = trimmed.lastIndexOf("}")
            if (lastBrace > 0) {
              jsonStr = trimmed.substring(0, lastBrace + 1)
            }
          }
          const parsed = JSON.parse(jsonStr)
          if (parsed.front) setFront(parsed.front)
          if (parsed.back) setBack(parsed.back)
        }
      } catch (e) {
        // JSON not complete yet, try to extract partial values
        try {
          // Try to extract partial JSON values using regex
          const frontMatch = completion.match(/"front"\s*:\s*"([^"]*)"/)
          const backMatch = completion.match(/"back"\s*:\s*"([^"]*)"/)
          
          if (frontMatch && frontMatch[1]) setFront(frontMatch[1])
          if (backMatch && backMatch[1]) setBack(backMatch[1])
        } catch (regexError) {
          // Ignore regex errors
        }
      }
    }
  }, [completion])

  const handleGenerate = () => {
    // Reset state before generating
    setFront("")
    setBack("")
    complete("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Flashcard</DialogTitle>
          <DialogDescription>AI will create a flashcard from your selected text</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Text to Generate Flashcard From</Label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter or paste text here, or select text from the document..."
              className="mt-2 min-h-24"
              disabled={isLoading}
            />
            {selectedText && selectedText !== inputText && (
              <p className="text-xs text-muted-foreground mt-1">You can edit the selected text above</p>
            )}
          </div>

          {(front || back || isLoading || completion) && (
            <div className="space-y-3">
              {isLoading && !front && !back && (
                <div>
                  <Label>Generating...</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                    <span className="text-muted-foreground">Creating flashcard...</span>
                    <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
                  </div>
                </div>
              )}
              {front && (
                <div>
                  <Label>Front</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg text-sm">{front}</div>
                </div>
              )}
              {back && (
                <div>
                  <Label>Back</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg text-sm">{back}</div>
                </div>
              )}
              {completion && !front && !back && (
                <div>
                  <Label>Raw Response (Debug)</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg text-sm max-h-32 overflow-y-auto">
                    {completion}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {isLoading ? (
              <Button onClick={stop} variant="destructive" className="flex-1">
                Stop
              </Button>
            ) : (
              <Button onClick={handleGenerate} className="flex-1" disabled={!inputText?.trim()}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Flashcard
              </Button>
            )}
            {front && !isLoading && (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
