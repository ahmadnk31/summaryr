"use client"

import { useState, useEffect } from "react"
import { useCompletion } from "@ai-sdk/react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface QuestionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  selectedText: string
  onSuccess: () => void
}

export function QuestionDialog({ open, onOpenChange, documentId, selectedText, onSuccess }: QuestionDialogProps) {
  const [questionText, setQuestionText] = useState<string>("")
  const [answerText, setAnswerText] = useState<string>("")
  const [difficulty, setDifficulty] = useState<string>("")
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
      setQuestionText("")
      setAnswerText("")
      setDifficulty("")
    }
  }, [open])

  const { completion, complete, isLoading, stop } = useCompletion({
    api: "/api/ai/question",
    body: {
      text: inputText || selectedText,
      documentId,
    },
    onFinish: () => {
      // Parse the JSON response only if completion exists and is not empty
      if (completion && completion.trim()) {
        try {
          const parsed = JSON.parse(completion.trim())
          if (parsed.question) setQuestionText(parsed.question)
          if (parsed.answer) setAnswerText(parsed.answer)
          if (parsed.difficulty) setDifficulty(parsed.difficulty)
        } catch (e) {
          console.error("Error parsing question:", e)
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
          if (parsed.question) setQuestionText(parsed.question)
          if (parsed.answer) setAnswerText(parsed.answer)
          if (parsed.difficulty) setDifficulty(parsed.difficulty)
        }
      } catch (e) {
        // JSON not complete yet, try to extract partial values
        try {
          // Try to extract partial JSON values using regex
          const questionMatch = completion.match(/"question"\s*:\s*"([^"]*)"/)
          const answerMatch = completion.match(/"answer"\s*:\s*"([^"]*)"/)
          const difficultyMatch = completion.match(/"difficulty"\s*:\s*"([^"]*)"/)
          
          if (questionMatch && questionMatch[1]) setQuestionText(questionMatch[1])
          if (answerMatch && answerMatch[1]) setAnswerText(answerMatch[1])
          if (difficultyMatch && difficultyMatch[1]) setDifficulty(difficultyMatch[1])
        } catch (regexError) {
          // Ignore regex errors
        }
      }
    }
  }, [completion])

  const handleGenerate = () => {
    // Reset state before generating
    setQuestionText("")
    setAnswerText("")
    setDifficulty("")
    complete("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Question</DialogTitle>
          <DialogDescription>AI will create a study question from your selected text</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Text to Generate Question From</Label>
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

          {(questionText || answerText || difficulty || isLoading || completion) && (
            <div className="space-y-3">
              {isLoading && !questionText && !answerText && (
                <div>
                  <Label>Generating...</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                    <span className="text-muted-foreground">Creating question...</span>
                    <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
                  </div>
                </div>
              )}
              {questionText && (
                <div>
                  <Label>Question</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg text-sm">{questionText}</div>
                </div>
              )}
              {answerText && (
                <div>
                  <Label>Answer</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg text-sm">{answerText}</div>
                </div>
              )}
              {difficulty && (
                <div>
                  <Label>Difficulty</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg text-sm capitalize">{difficulty}</div>
                </div>
              )}
              {completion && !questionText && !answerText && (
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
                Generate Question
              </Button>
            )}
            {questionText && !isLoading && (
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
