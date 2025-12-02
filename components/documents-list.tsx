"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { FileText, Trash2, Loader2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { deleteDocument } from "@/app/actions/delete-document"
import type { Document } from "@/lib/types"
import { useRouter } from "next/navigation"

interface DocumentsListProps {
  documents: Document[]
}

export function DocumentsList({ documents: initialDocuments }: DocumentsListProps) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)
  const router = useRouter()

  // Update documents when initialDocuments changes
  useEffect(() => {
    setDocuments(initialDocuments)
  }, [initialDocuments])

  const handleDeleteClick = (e: React.MouseEvent, documentId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDocumentToDelete(documentId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return

    setDeletingId(documentToDelete)
    setDeleteDialogOpen(false)

    const result = await deleteDocument(documentToDelete)

    if (result?.error) {
      alert(result.error)
      setDeletingId(null)
      setDocumentToDelete(null)
      return
    }

    // Remove from local state
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentToDelete))
    setDeletingId(null)
    setDocumentToDelete(null)
    
    // Refresh the page to update the list
    router.refresh()
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">No documents yet</p>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your first document to get started!
        </p>
        <Button asChild>
          <Link href="/dashboard">
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
          >
            <FileText className="h-6 w-6 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{doc.title}</p>
              <p className="text-xs text-muted-foreground">
                {doc.file_type.toUpperCase()} • {new Date(doc.upload_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href={`/documents/${doc.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => handleDeleteClick(e, doc.id)}
                disabled={deletingId === doc.id}
                title="Delete document"
                type="button"
              >
                {deletingId === doc.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone and will
              also delete all associated flashcards, questions, summaries, notes, and explanations.
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

