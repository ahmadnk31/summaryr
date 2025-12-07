"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { Summary } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SummaryListProps {
  documentId: string
  refreshKey: number
}

export function SummaryList({ documentId, refreshKey }: SummaryListProps) {
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [summaryToDelete, setSummaryToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadSummaries()
  }, [documentId, refreshKey])

  const loadSummaries = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("summaries")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })

    if (data) setSummaries(data)
  }

  const handleDeleteClick = (id: string) => {
    setSummaryToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!summaryToDelete) return

    const supabase = createClient()
    await supabase.from("summaries").delete().eq("id", summaryToDelete)
    setDeleteDialogOpen(false)
    setSummaryToDelete(null)
    loadSummaries()
  }

  if (summaries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">No summaries yet. Select text to create one!</p>
    )
  }

  return (
    <div className="space-y-3">
      {summaries.map((summary) => (
        <Card key={summary.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-3">
              <Badge variant="secondary" className="text-xs">
                {summary.summary_type}
              </Badge>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0 text-sm">{children}</p>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-2 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-sm">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-sm">{children}</ol>,
                  li: ({ children }) => <li className="ml-4">{children}</li>,
                  code: ({ children, className }) =>
                    className ? (
                      <code className="bg-background px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                    ) : (
                      <code className="bg-background px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                    ),
                  pre: ({ children }) => (
                    <pre className="bg-background p-2 rounded-lg overflow-x-auto mb-3 text-xs">
                      {children}
                    </pre>
                  ),
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-muted-foreground pl-3 italic my-3 text-sm">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {summary.summary_text}
              </ReactMarkdown>
            </div>
            <div className="flex justify-end mt-4">
              <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(summary.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Summary?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this summary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
