"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Edit } from "lucide-react"
import type { Note } from "@/lib/types"
import { EditNoteDialog } from "@/components/edit-note-dialog"
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

interface NoteListProps {
  documentId: string
  refreshKey: number
}

export function NoteList({ documentId, refreshKey }: NoteListProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadNotes()
  }, [documentId, refreshKey])

  const loadNotes = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })

    if (data) setNotes(data)
  }

  const handleDeleteClick = (id: string) => {
    setNoteToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return

    const supabase = createClient()
    await supabase.from("notes").delete().eq("id", noteToDelete)
    setDeleteDialogOpen(false)
    setNoteToDelete(null)
    loadNotes()
  }

  if (notes.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No notes yet. Select text to create one!</p>
  }

  return (
    <>
      <div className="space-y-3">
        {notes.map((note) => (
          <Card key={note.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{note.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {note.selected_text && (
                <div className="mb-3 p-2 bg-muted/50 rounded text-xs italic">
                  &quot;{note.selected_text.substring(0, 100)}
                  {note.selected_text.length > 100 ? "..." : ""}&quot;
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              <div className="flex items-center justify-end gap-2 mt-4">
                <Button size="sm" variant="ghost" onClick={() => setEditingNote(note)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(note.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingNote && (
        <EditNoteDialog
          open={!!editingNote}
          onOpenChange={(open) => !open && setEditingNote(null)}
          note={editingNote}
          onSuccess={() => {
            loadNotes()
            setEditingNote(null)
          }}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this note.
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
    </>
  )
}
