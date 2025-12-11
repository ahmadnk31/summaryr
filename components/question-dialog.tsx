"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface QuestionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  selectedText: string
  documentText?: string
  onSuccess: () => void
  autoGenerate?: boolean
}

type QuestionType = "multiple_choice" | "short_answer" | "true_false" | "essay" | "fill_blank"

export function QuestionDialog({ open, onOpenChange, documentId, selectedText, documentText = "", onSuccess, autoGenerate = false }: QuestionDialogProps) {
  const [quantity, setQuantity] = useState(1)
  const [questionType, setQuestionType] = useState<QuestionType>("short_answer")
  const [inputText, setInputText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)
  const [generatedQuestions, setGeneratedQuestions] = useState<Array<{ question: string; answer: string; options?: string[]; difficulty?: string }>>([])
  const [currentQuestion, setCurrentQuestion] = useState<{ question: string; answer: string; options?: string[]; difficulty?: string } | null>(null)

  // Initialize inputText when dialog opens
  useEffect(() => {
    if (open) {
      // Use selected text if available, otherwise use full document text
      if (selectedText && selectedText.trim()) {
        setInputText(selectedText)
      } else if (documentText && documentText.trim()) {
        // Use full document text if no selection
        setInputText(documentText)
      } else {
        setInputText("")
      }
      setQuantity(1)
      setQuestionType("short_answer")
      setGeneratedCount(0)
      setIsGenerating(false)
      setGeneratedQuestions([])
      setCurrentQuestion(null)
    }
  }, [open, selectedText, documentText])

  const handleGenerate = async () => {
    if (!inputText.trim()) return

    console.log("Starting question generation, quantity:", quantity)
    
    setIsGenerating(true)
    setGeneratedCount(0)
    setGeneratedQuestions([])
    setCurrentQuestion(null)

    try {
      // Generate questions one by one
      for (let i = 0; i < quantity; i++) {
        console.log(`Generating question ${i + 1} of ${quantity}`)
        const response = await fetch("/api/ai/question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: inputText,
            documentId,
            type: questionType,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to generate question ${i + 1}`)
        }

        console.log("Got response, reading stream...")
        
        // Read the stream and parse JSON objects
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let finalQuestion: { question: string; answer: string; options?: string[]; difficulty?: string } = { question: "", answer: "" }

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
              console.log("Parsed complete question data:", parsed)
              
              // Update current question with complete or partial data
              if (parsed.question !== undefined) finalQuestion.question = parsed.question
              if (parsed.answer !== undefined) finalQuestion.answer = parsed.answer
              if (parsed.options !== undefined) finalQuestion.options = parsed.options
              if (parsed.difficulty !== undefined) finalQuestion.difficulty = parsed.difficulty
              
              setCurrentQuestion({
                question: finalQuestion.question,
                answer: finalQuestion.answer,
                options: finalQuestion.options,
                difficulty: finalQuestion.difficulty
              })
              console.log("Updated current question:", finalQuestion)
            } catch (e) {
              // JSON is incomplete, continue accumulating
              // Try to extract partial data from incomplete JSON
              const questionMatch = buffer.match(/"question":"([^"]*(?:\\.[^"]*)*)/)
              const answerMatch = buffer.match(/"answer":"([^"]*(?:\\.[^"]*)*)/)
              
              if (questionMatch || answerMatch) {
                if (questionMatch && questionMatch[1]) {
                  finalQuestion.question = questionMatch[1].replace(/\\"/g, '"')
                }
                if (answerMatch && answerMatch[1]) {
                  finalQuestion.answer = answerMatch[1].replace(/\\"/g, '"')
                }
                
                setCurrentQuestion({
                  question: finalQuestion.question,
                  answer: finalQuestion.answer,
                  options: finalQuestion.options,
                  difficulty: finalQuestion.difficulty
                })
              }
            }
          }
        }

        // Add final question to list if it has both question and answer
        if (finalQuestion.question && finalQuestion.answer) {
          setGeneratedQuestions(prev => [...prev, finalQuestion])
          setCurrentQuestion(null)
        }

        setGeneratedCount(i + 1)
      }

      // Wait a bit to show final result before closing
      setTimeout(() => {
        onSuccess()
      }, 500)
      
      // Don't auto-close, let user review the questions
    } catch (error) {
      console.error("Error generating questions:", error)
      alert("Failed to generate questions. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Questions</DialogTitle>
          <DialogDescription>
            Create study questions from your text. Use selected text or the entire document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Number of Questions</Label>
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
              <Label htmlFor="type">Question Type</Label>
              <Select value={questionType} onValueChange={(value) => setQuestionType(value as QuestionType)} disabled={isGenerating}>
                <SelectTrigger id="type" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_answer">Short Answer</SelectItem>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="essay">Essay Question</SelectItem>
                  <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
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

          {isGenerating && !currentQuestion && generatedQuestions.length === 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Generating questions...</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(generatedCount / quantity) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {generatedCount} of {quantity} questions created
              </p>
            </div>
          )}

          {(generatedQuestions.length > 0 || currentQuestion) && (
            <div className="space-y-3">
              <Label>Generated Questions</Label>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {generatedQuestions.map((q, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden bg-card shadow-sm">
                    <div className="p-4 bg-primary/5 border-b">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide">Question {index + 1}</p>
                        {q.difficulty && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {q.difficulty}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{q.question}</p>
                    </div>
                    {q.options && q.options.length > 0 && (
                      <div className="p-4 bg-muted/30 border-b">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Options</p>
                        <ul className="space-y-1.5">
                          {q.options.map((opt, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="font-semibold text-primary min-w-[1.5rem]">{String.fromCharCode(65 + i)}.</span>
                              <span>{opt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="p-4 bg-background">
                      <p className="text-xs font-semibold text-green-600 mb-2 uppercase tracking-wide">Answer</p>
                      <p className="text-sm leading-relaxed font-medium text-green-700">{q.answer}</p>
                    </div>
                  </div>
                ))}
                {currentQuestion && (currentQuestion.question || currentQuestion.answer) && (
                  <div className="border-2 border-primary rounded-lg overflow-hidden bg-card shadow-md animate-pulse">
                    <div className="p-4 bg-primary/10 border-b border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                          Question {generatedQuestions.length + 1} (Streaming...)
                        </p>
                      </div>
                      <p className="text-sm font-medium leading-relaxed min-h-[1.5rem]">
                        {currentQuestion.question || <span className="text-muted-foreground italic">Generating...</span>}
                      </p>
                    </div>
                    {currentQuestion.options && currentQuestion.options.length > 0 && (
                      <div className="p-4 bg-muted/30 border-b border-primary/20">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Options</p>
                        <ul className="space-y-1.5">
                          {currentQuestion.options.map((opt, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="font-semibold text-primary min-w-[1.5rem]">{String.fromCharCode(65 + i)}.</span>
                              <span>{opt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="p-4 bg-background">
                      <p className="text-xs font-semibold text-green-600 mb-2 uppercase tracking-wide">Answer</p>
                      <p className="text-sm leading-relaxed font-medium text-green-700 min-h-[1.5rem]">
                        {currentQuestion.answer || <span className="text-muted-foreground italic">Waiting...</span>}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t flex-shrink-0">
          {!isGenerating && generatedQuestions.length === 0 ? (
            <>
              <Button
                onClick={handleGenerate}
                className="flex-1"
                disabled={!inputText?.trim()}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate {quantity} Question{quantity > 1 ? "s" : ""}
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
