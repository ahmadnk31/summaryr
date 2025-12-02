"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, RotateCcw, Play, Check, X, ArrowRight, BookOpen } from "lucide-react"
import type { Flashcard } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FlashcardListProps {
  documentId: string
  refreshKey: number
}

export function FlashcardList({ documentId, refreshKey }: FlashcardListProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [flipped, setFlipped] = useState<Set<string>>(new Set())
  const [studyMode, setStudyMode] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [knownCards, setKnownCards] = useState<Set<string>>(new Set())
  const [studyCards, setStudyCards] = useState<Flashcard[]>([])

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

    if (data) {
      setFlashcards(data)
      setStudyCards(data)
    }
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

  const startStudyMode = () => {
    setStudyMode(true)
    setCurrentIndex(0)
    setFlipped(new Set())
    setKnownCards(new Set())
    setStudyCards([...flashcards])
  }

  const exitStudyMode = () => {
    setStudyMode(false)
    setCurrentIndex(0)
    setFlipped(new Set())
    setKnownCards(new Set())
  }

  const markAsKnown = () => {
    if (studyCards[currentIndex]) {
      setKnownCards((prev) => new Set(prev).add(studyCards[currentIndex].id))
      nextCard()
    }
  }

  const markAsUnknown = () => {
    nextCard()
  }

  const nextCard = () => {
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setFlipped(new Set())
    } else {
      // Study session complete
      exitStudyMode()
    }
  }

  const currentCard = studyCards[currentIndex]

  if (flashcards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">No flashcards yet. Select text to create one!</p>
    )
  }

  if (studyMode && currentCard) {
    const isFlipped = flipped.has(currentCard.id)
    const progress = ((currentIndex + 1) / studyCards.length) * 100

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Card {currentIndex + 1} of {studyCards.length}
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={exitStudyMode}>
            Exit Study Mode
          </Button>
        </div>

        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div
          className={cn(
            "relative cursor-pointer min-h-[200px] rounded-lg border-2 transition-all duration-300",
            isFlipped ? "bg-primary text-primary-foreground" : "bg-card"
          )}
          style={{ perspective: "1000px" }}
          onClick={() => toggleFlip(currentCard.id)}
        >
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center p-6 text-center transition-transform duration-500",
              isFlipped && "rotate-y-180"
            )}
            style={{ 
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
            }}
          >
            <div className="w-full">
              <p className="text-xs uppercase tracking-wide mb-2 opacity-70">Question</p>
              <p className="text-lg font-medium">{currentCard.front_text}</p>
            </div>
          </div>
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center p-6 text-center transition-transform duration-500",
              !isFlipped && "rotate-y-180"
            )}
            style={{ 
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
              transform: isFlipped ? "rotateY(0deg)" : "rotateY(180deg)"
            }}
          >
            <div className="w-full">
              <p className="text-xs uppercase tracking-wide mb-2 opacity-70">Answer</p>
              <p className="text-lg font-medium">{currentCard.back_text}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          {isFlipped ? (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={markAsUnknown}
                className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4 mr-2" />
                Don't Know
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={markAsKnown}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                I Know This
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="lg"
              onClick={() => toggleFlip(currentCard.id)}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Flip Card
            </Button>
          )}
        </div>

        {currentIndex < studyCards.length - 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={nextCard}
            className="w-full"
          >
            Skip <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={startStudyMode}
        className="w-full"
        variant="default"
      >
        <Play className="h-4 w-4 mr-2" />
        Start Study Session ({flashcards.length} cards)
      </Button>

      {flashcards.map((card) => (
        <Card
          key={card.id}
          className={cn(
            "relative transition-all hover:shadow-md",
            flipped.has(card.id) && "ring-2 ring-primary"
          )}
        >
          <CardContent className="pt-6">
            <div
              className={cn(
                "cursor-pointer min-h-32 flex items-center justify-center text-center p-4 rounded-lg transition-colors",
                flipped.has(card.id)
                  ? "bg-primary/10 border-2 border-primary"
                  : "bg-muted hover:bg-muted/80"
              )}
              onClick={() => toggleFlip(card.id)}
            >
              <div className="w-full">
                {!flipped.has(card.id) ? (
                  <>
                    <p className="text-xs uppercase tracking-wide mb-2 text-muted-foreground">Question</p>
                    <p className="text-sm font-medium">{card.front_text}</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs uppercase tracking-wide mb-2 text-muted-foreground">Answer</p>
                    <p className="text-sm font-medium">{card.back_text}</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button size="sm" variant="ghost" onClick={() => toggleFlip(card.id)}>
                <RotateCcw className="h-4 w-4 mr-1" />
                {flipped.has(card.id) ? "Show Question" : "Show Answer"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(card.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
