"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, RotateCcw } from "lucide-react"
import type { Flashcard } from "@/lib/types"

interface FlashcardListProps {
  documentId: string
  refreshKey: number
}

export function FlashcardList({ documentId, refreshKey }: FlashcardListProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [flipped, setFlipped] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadFlashcards()
  }, [documentId, refreshKey])

  const loadFlashcards = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("flashcards")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })

    if (data) setFlashcards(data)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("flashcards").delete().eq("id", id)
    loadFlashcards()
  }

  const toggleFlip = (id: string) => {
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (flashcards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">No flashcards yet. Select text to create one!</p>
    )
  }

  return (
    <div className="space-y-3">
      {flashcards.map((card) => (
        <Card key={card.id} className="relative">
          <CardContent className="pt-6">
            <div
              className="cursor-pointer min-h-24 flex items-center justify-center text-center"
              onClick={() => toggleFlip(card.id)}
            >
              <p className="text-sm">{flipped.has(card.id) ? card.back_text : card.front_text}</p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button size="sm" variant="ghost" onClick={() => toggleFlip(card.id)}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Flip
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(card.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
