"use client"

import { useState, useEffect } from "react"
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
import type { Note } from "@/lib/types"

interface EditNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note: Note
  onSuccess: () => void
}

export function EditNoteDialog({ open, onOpenChange, note, onSuccess }: EditNoteDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
    }
  }, [note])

  const handleUpdate = async () => {
    if (!title.trim() || !content.trim()) return

    setIsUpdating(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("notes")
        .update({
          title: title.trim(),
          content: content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", note.id)

      if (error) throw error

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating note:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
          <DialogDescription>Update your note content</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {note.selected_text && (
            <div>
              <Label>Selected Text</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg text-sm max-h-32 overflow-y-auto">{note.selected_text}</div>
            </div>
          )}

          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="edit-content">Content</Label>
            <Textarea
              id="edit-content"
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
          <Button onClick={handleUpdate} disabled={isUpdating || !title.trim() || !content.trim()}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Note"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
