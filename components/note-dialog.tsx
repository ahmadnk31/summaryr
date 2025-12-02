"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

interface NoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  selectedText: string
  positionStart?: number
  positionEnd?: number
  onSuccess: () => void
}

export function NoteDialog({
  open,
  onOpenChange,
  documentId,
  selectedText,
  positionStart,
  positionEnd,
  onSuccess,
}: NoteDialogProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return

    setIsCreating(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("notes").insert({
        user_id: user.id,
        document_id: documentId,
        title: title.trim(),
        content: content.trim(),
        selected_text: selectedText || null,
        position_start: positionStart ?? null,
        position_end: positionEnd ?? null,
      })

      if (error) throw error

      onSuccess()
      onOpenChange(false)
      setTitle("")
      setContent("")
    } catch (error) {
      console.error("Error creating note:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Note</DialogTitle>
          <DialogDescription>Add your thoughts and insights about the selected text</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {selectedText && (
            <div>
              <Label>Selected Text</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg text-sm max-h-32 overflow-y-auto">{selectedText}</div>
            </div>
          )}

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your notes here..."
              className="mt-2 min-h-32"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !title.trim() || !content.trim()}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Note"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
