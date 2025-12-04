"use client"

import { useState, useEffect } from "react"
import { useCompletion } from "@ai-sdk/react"
import ReactMarkdown from "react-markdown"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ExplainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  selectedText: string
  documentText?: string
  onSuccess: () => void
}

export function ExplainDialog({ open, onOpenChange, documentId, selectedText, documentText = "", onSuccess }: ExplainDialogProps) {
  const [inputText, setInputText] = useState("")

  // Update inputText when dialog opens or selectedText/documentText changes
  useEffect(() => {
    if (open) {
      // Use selected text if available, otherwise use full document text
      const textToUse = selectedText.trim() || documentText.trim() || ""
      setInputText(textToUse)
    }
  }, [open, selectedText, documentText])

  const { completion, complete, isLoading, stop, error, setCompletion } = useCompletion({
    api: "/api/ai/explain",
    body: {
      text: inputText || selectedText || documentText,
      documentId,
    },
    onFinish: () => {
      onSuccess()
    },
    onError: (error) => {
      console.error("Error in explain dialog:", error)
    },
  })

  // Reset completion when dialog closes
  useEffect(() => {
    if (!open && setCompletion) {
      setCompletion("")
    }
  }, [open, setCompletion])

  const handleGenerate = () => {
    complete("")
  }

  // Debug logging
  if (error) {
    console.error("Explain dialog error:", error)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Explain Text</DialogTitle>
          <DialogDescription>AI will explain your selected text in simple terms</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div>
            <Label>Text to Explain</Label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter or paste text here, or select text from the document..."
              className="mt-2 min-h-24 max-h-32 overflow-y-auto break-words"
              disabled={isLoading}
            />
            {selectedText && selectedText !== inputText && (
              <p className="text-xs text-muted-foreground mt-1">You can edit the selected text above</p>
            )}
            {!selectedText && documentText && (
              <p className="text-xs text-muted-foreground mt-1">Using full document content. You can edit it above.</p>
            )}
          </div>

          <div>
            <Label>Explanation</Label>
            <div className="mt-2 p-4 bg-muted rounded-lg text-sm max-h-[400px] overflow-y-auto min-h-[100px] prose prose-sm dark:prose-invert max-w-none break-words">
              {error ? (
                <span className="text-destructive">Error: {error.message || "Failed to generate explanation"}</span>
              ) : isLoading && !completion ? (
                <span className="text-muted-foreground">Generating...</span>
              ) : completion ? (
                <>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-4 last:mb-0 break-words">{children}</p>,
                      h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 break-words">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0 break-words">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-2 first:mt-0 break-words">{children}</h3>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1 break-words">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1 break-words">{children}</ol>,
                      li: ({ children }) => <li className="ml-4 break-words">{children}</li>,
                      code: ({ children, className }) =>
                        className ? (
                          <code className="bg-background px-1 py-0.5 rounded text-xs font-mono break-all">{children}</code>
                        ) : (
                          <code className="bg-background px-1 py-0.5 rounded text-xs font-mono break-all">{children}</code>
                        ),
                      pre: ({ children }) => (
                        <pre className="bg-background p-3 rounded-lg overflow-x-auto mb-4 break-all whitespace-pre-wrap">
                          {children}
                        </pre>
                      ),
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-muted-foreground pl-4 italic my-4">{children}</blockquote>
                      ),
                    }}
                  >
                    {completion}
                  </ReactMarkdown>
                  {isLoading && <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />}
                </>
              ) : (
                <span className="text-muted-foreground">Click "Generate Explanation" to get started</span>
              )}
            </div>
          </div>

        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t flex-shrink-0">
          {isLoading ? (
            <Button onClick={stop} variant="destructive" className="flex-1">
              Stop
            </Button>
          ) : (
            <Button onClick={handleGenerate} className="flex-1" disabled={!inputText?.trim()}>
              <Sparkles className="mr-2 h-4 w-4" />
              {completion ? "Regenerate Explanation" : "Generate Explanation"}
            </Button>
          )}
          {completion && !isLoading && (
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

