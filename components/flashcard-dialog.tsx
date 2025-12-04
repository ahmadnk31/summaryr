"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FlashcardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  selectedText: string
  documentText?: string
  onSuccess: () => void
}

type FlashcardType = "basic" | "definition" | "concept" | "formula" | "vocabulary"

export function FlashcardDialog({ open, onOpenChange, documentId, selectedText, documentText = "", onSuccess }: FlashcardDialogProps) {
  const [quantity, setQuantity] = useState(1)
  const [flashcardType, setFlashcardType] = useState<FlashcardType>("basic")
  const [inputText, setInputText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)

  // Initialize inputText when dialog opens
  useEffect(() => {
    if (open) {
      if (selectedText) {
        setInputText(selectedText)
      } else if (documentText) {
        // Use first 2000 chars of document if no selection
        setInputText(documentText.substring(0, 2000))
      }
      setQuantity(1)
      setFlashcardType("basic")
      setGeneratedCount(0)
      setIsGenerating(false)
    }
  }, [open, selectedText, documentText])

  const handleGenerate = async () => {
    if (!inputText.trim()) return

    setIsGenerating(true)
    setGeneratedCount(0)

    try {
      // Generate flashcards one by one
      for (let i = 0; i < quantity; i++) {
        const response = await fetch("/api/ai/flashcard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: inputText,
            documentId,
            type: flashcardType,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to generate flashcard ${i + 1}`)
        }

        // Read the stream
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let accumulatedText = ""

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            accumulatedText += decoder.decode(value, { stream: true })
          }
        }

        setGeneratedCount(i + 1)
      }

      onSuccess()
      setTimeout(() => {
        onOpenChange(false)
      }, 1000)
    } catch (error) {
      console.error("Error generating flashcards:", error)
      alert("Failed to generate flashcards. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Flashcards</DialogTitle>
          <DialogDescription>
            Create flashcards from your text. Use selected text or the entire document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Number of Flashcards</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="mt-2"
                disabled={isGenerating}
              />
            </div>
            <div>
              <Label htmlFor="type">Flashcard Type</Label>
              <Select value={flashcardType} onValueChange={(value) => setFlashcardType(value as FlashcardType)} disabled={isGenerating}>
                <SelectTrigger id="type" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic Q&A</SelectItem>
                  <SelectItem value="definition">Definition</SelectItem>
                  <SelectItem value="concept">Concept Explanation</SelectItem>
                  <SelectItem value="formula">Formula</SelectItem>
                  <SelectItem value="vocabulary">Vocabulary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Text to Generate From</Label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={selectedText ? "Selected text will be used..." : "Enter text or use document content..."}
              className="mt-2 min-h-32 max-h-48 overflow-y-auto break-words"
              disabled={isGenerating}
            />
            {selectedText && (
              <p className="text-xs text-muted-foreground mt-1">
                Using selected text. You can edit it above or use the full document.
              </p>
            )}
            {!selectedText && documentText && (
              <p className="text-xs text-muted-foreground mt-1">
                Using full document content. You can edit it above.
              </p>
            )}
          </div>

          {isGenerating && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Generating flashcards...</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(generatedCount / quantity) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {generatedCount} of {quantity} flashcards created
              </p>
            </div>
          )}

        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t flex-shrink-0">
          <Button
            onClick={handleGenerate}
            className="flex-1"
            disabled={!inputText?.trim() || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate {quantity} Flashcard{quantity > 1 ? "s" : ""}
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating} className="w-full sm:w-auto">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
