"use server"

import { createClient } from "@/lib/supabase/server"
import { downloadFromS3, isS3Available } from "@/lib/aws-s3"

/**
 * Get document content, downloading from S3 if necessary
 */
export async function getDocumentContent(documentId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized", content: null }
    }

    // Get document info
    const { data: document, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single()

    if (error || !document) {
      return { error: "Document not found", content: null }
    }

    // If extracted_text is already available, return it
    if (document.extracted_text) {
      return { 
        content: document.extracted_text,
        document,
        error: null 
      }
    }

    // If storage_type is 's3', download from S3
    if (document.storage_type === 's3' && document.storage_path && isS3Available()) {
      try {
        const buffer = await downloadFromS3(document.storage_path)
        const content = buffer.toString('utf-8')
        
        // Update the database with the content for faster future access
        await supabase
          .from("documents")
          .update({ extracted_text: content })
          .eq("id", documentId)

        return { 
          content,
          document: { ...document, extracted_text: content },
          error: null 
        }
      } catch (s3Error) {
        console.error("Failed to download from S3:", s3Error)
        return { error: "Failed to load document content", content: null }
      }
    }

    // If no content available
    return { 
      content: null,
      document,
      error: "No content available" 
    }

  } catch (error) {
    console.error("Error getting document content:", error)
    return { 
      error: error instanceof Error ? error.message : "Unknown error",
      content: null 
    }
  }
}
