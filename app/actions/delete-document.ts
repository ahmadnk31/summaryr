"use server"

import { createClient } from "@/lib/supabase/server"
import { deleteFromS3, isS3Available } from "@/lib/aws-s3"
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
      .select("storage_path, user_id, storage_type")
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
      // Determine storage type:
      // 1. Use explicit storage_type column if available
      // 2. Fall back to path pattern detection (S3 paths start with "documents/")
      const storageType = (document as any).storage_type || 
        (document.storage_path.startsWith("documents/") ? "s3" : "supabase")
      
      const isS3Path = storageType === "s3"
      
      if (isS3Path && isS3Available()) {
        // Delete from S3
        try {
          console.log("🗑️  Deleting from S3:", document.storage_path)
          await deleteFromS3(document.storage_path)
          console.log("✅ Successfully deleted from S3")
        } catch (s3Error) {
          console.error("❌ Error deleting file from S3:", s3Error)
          // Continue with database deletion even if storage deletion fails
        }
      } else {
        // Delete from Supabase Storage
        try {
          console.log("🗑️  Deleting from Supabase Storage:", document.storage_path)
          const { error: storageError } = await supabase.storage
            .from("documents")
            .remove([document.storage_path])

          if (storageError) {
            console.error("❌ Error deleting file from Supabase storage:", storageError)
            // Continue with database deletion even if storage deletion fails
          } else {
            console.log("✅ Successfully deleted from Supabase Storage")
          }
        } catch (supabaseError) {
          console.error("❌ Error with Supabase storage deletion:", supabaseError)
        }
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

