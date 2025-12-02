"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Eye, EyeOff } from "lucide-react"
import type { Question } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface QuestionListProps {
  documentId: string
  refreshKey: number
}

export function QuestionList({ documentId, refreshKey }: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadQuestions()
  }, [documentId, refreshKey])

  const loadQuestions = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })

    if (data) setQuestions(data)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("questions").delete().eq("id", id)
    loadQuestions()
  }

  const toggleReveal = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (questions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">No questions yet. Select text to generate one!</p>
    )
  }

  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <Card key={q.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-2">
              <Badge variant="secondary" className="text-xs">
                {q.difficulty}
              </Badge>
            </div>
            <p className="text-sm font-medium mb-3">{q.question_text}</p>
            {revealed.has(q.id) && (
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded">{q.answer_text}</p>
            )}
            <div className="flex items-center justify-between mt-4">
              <Button size="sm" variant="ghost" onClick={() => toggleReveal(q.id)}>
                {revealed.has(q.id) ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Hide Answer
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Show Answer
                  </>
                )}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(q.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
