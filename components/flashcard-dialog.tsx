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
  autoGenerate?: boolean
}

type FlashcardType = "basic" | "definition" | "concept" | "formula" | "vocabulary"

export function FlashcardDialog({ open, onOpenChange, documentId, selectedText, documentText = "", onSuccess, autoGenerate = false }: FlashcardDialogProps) {
  const [quantity, setQuantity] = useState(1)
  const [flashcardType, setFlashcardType] = useState<FlashcardType>("basic")
  const [inputText, setInputText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)
  const [generatedFlashcards, setGeneratedFlashcards] = useState<Array<{ front: string; back: string }>>([])
  const [currentFlashcard, setCurrentFlashcard] = useState<{ front: string; back: string } | null>(null)

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
      setGeneratedFlashcards([])
      setCurrentFlashcard(null)
    }
  }, [open, selectedText, documentText])

  const handleGenerate = async () => {
    if (!inputText.trim()) return

    console.log("Starting flashcard generation, quantity:", quantity)
    
    setIsGenerating(true)
    setGeneratedCount(0)
    setGeneratedFlashcards([])
    setCurrentFlashcard(null)

    try {
      // Generate flashcards one by one
      for (let i = 0; i < quantity; i++) {
        console.log(`Generating flashcard ${i + 1} of ${quantity}`)
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

        console.log("Got response, reading stream...")
        
        // Read the stream and parse JSON objects
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let finalFlashcard: { front: string; back: string } = { front: "", back: "" }

        if (!reader) {
          console.error("No reader available")
          throw new Error("Response body reader not available")
        }

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              console.log("Stream done")
              break
            }
            
            const chunk = decoder.decode(value, { stream: false })
            console.log("Received chunk:", chunk)
            buffer += chunk
            
            // Try to parse the accumulated buffer as JSON
            try {
              const parsed = JSON.parse(buffer)
              console.log("Parsed complete flashcard data:", parsed)
              
              // Update current flashcard with complete or partial data
              if (parsed.front !== undefined) finalFlashcard.front = parsed.front
              if (parsed.back !== undefined) finalFlashcard.back = parsed.back
              
              setCurrentFlashcard({
                front: finalFlashcard.front,
                back: finalFlashcard.back
              })
              console.log("Updated current flashcard:", finalFlashcard)
            } catch (e) {
              // JSON is incomplete, continue accumulating
              // Try to extract partial data from incomplete JSON
              const frontMatch = buffer.match(/"front":"([^"]*(?:\\.[^"]*)*)/)
              const backMatch = buffer.match(/"back":"([^"]*(?:\\.[^"]*)*)/)
              
              if (frontMatch || backMatch) {
                if (frontMatch && frontMatch[1]) {
                  finalFlashcard.front = frontMatch[1].replace(/\\"/g, '"')
                }
                if (backMatch && backMatch[1]) {
                  finalFlashcard.back = backMatch[1].replace(/\\"/g, '"')
                }
                
                setCurrentFlashcard({
                  front: finalFlashcard.front,
                  back: finalFlashcard.back
                })
              }
            }
          }
        }

        // Add final flashcard to list if it has both front and back
        if (finalFlashcard.front && finalFlashcard.back) {
          setGeneratedFlashcards(prev => [...prev, finalFlashcard])
          setCurrentFlashcard(null)
        }

        setGeneratedCount(i + 1)
      }

      // Wait a bit to show final result before closing
      setTimeout(() => {
        onSuccess()
      }, 500)
      
      // Don't auto-close, let user review the flashcards
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

          {isGenerating && !currentFlashcard && generatedFlashcards.length === 0 && (
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

          {(generatedFlashcards.length > 0 || currentFlashcard) && (
            <div className="space-y-3">
              <Label>Generated Flashcards</Label>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {generatedFlashcards.map((flashcard, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden bg-card shadow-sm">
                    <div className="p-4 bg-primary/5 border-b">
                      <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">Front</p>
                      <p className="text-sm font-medium leading-relaxed">{flashcard.front}</p>
                    </div>
                    <div className="p-4 bg-background">
                      <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Back</p>
                      <p className="text-sm leading-relaxed">{flashcard.back}</p>
                    </div>
                  </div>
                ))}
                {currentFlashcard && (currentFlashcard.front || currentFlashcard.back) && (
                  <div className="border-2 border-primary rounded-lg overflow-hidden bg-card shadow-md animate-pulse">
                    <div className="p-4 bg-primary/10 border-b border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide">Front (Streaming...)</p>
                      </div>
                      <p className="text-sm font-medium leading-relaxed min-h-[1.5rem]">
                        {currentFlashcard.front || <span className="text-muted-foreground italic">Generating...</span>}
                      </p>
                    </div>
                    <div className="p-4 bg-background">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Back</p>
                      <p className="text-sm leading-relaxed min-h-[1.5rem]">
                        {currentFlashcard.back || <span className="text-muted-foreground italic">Waiting...</span>}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t flex-shrink-0">
          {!isGenerating && generatedFlashcards.length === 0 ? (
            <>
              <Button
                onClick={handleGenerate}
                className="flex-1"
                disabled={!inputText?.trim()}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate {quantity} Flashcard{quantity > 1 ? "s" : ""}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
            </>
          ) : isGenerating ? (
            <Button onClick={() => {}} className="flex-1" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </Button>
          ) : (
            <>
              <Button onClick={handleGenerate} variant="outline" className="flex-1">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate More
              </Button>
              <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Close
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
