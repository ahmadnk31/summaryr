"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteDocument(documentId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "You must be logged in to delete documents" }
    }

    // First, get the document to check ownership and get storage path
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("storage_path, user_id")
      .eq("id", documentId)
      .single()

    if (fetchError || !document) {
      return { error: "Document not found" }
    }

    // Verify ownership
    if (document.user_id !== user.id) {
      return { error: "You don't have permission to delete this document" }
    }

    // Delete from storage if storage_path exists
    if (document.storage_path) {
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([document.storage_path])

      if (storageError) {
        console.error("Error deleting file from storage:", storageError)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId)
      .eq("user_id", user.id) // Extra safety check

    if (deleteError) {
      return { error: deleteError.message }
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    console.error("Delete error:", err)
    return { error: err instanceof Error ? err.message : "Failed to delete document" }
  }
}

