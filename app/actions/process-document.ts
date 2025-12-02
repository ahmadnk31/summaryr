"use server"

import { createClient } from "@/lib/supabase/server"

interface ProcessDocumentParams {
  storagePath: string
  fileName: string
  fileType: string
  fileSize: number
}

export async function processDocument({ storagePath, fileName, fileType, fileSize }: ProcessDocumentParams) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "You must be logged in to process documents" }
    }

    // Download the file from storage to process it
    const { data: fileData, error: downloadError } = await supabase.storage.from("documents").download(storagePath)

    if (downloadError || !fileData) {
      return { error: "Failed to download file for processing" }
    }

    // Read file content
    const arrayBuffer = await fileData.arrayBuffer()
    let extractedText = ""

    if (fileType === "pdf") {
      const { extractText } = await import("unpdf")
      const result = await extractText(new Uint8Array(arrayBuffer), { mergePages: true })
      extractedText = result.text
    } else if (fileType === "docx") {
      const mammoth = await import("mammoth")
      const buffer = Buffer.from(arrayBuffer)
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else if (fileType === "epub") {
      // EPUB files are ZIP archives containing HTML/XHTML files
      // We'll extract and parse the content files
      const JSZip = await import("jszip")
      const zip = new JSZip.default()
      const uint8Array = new Uint8Array(arrayBuffer)
      const zipFile = await zip.loadAsync(uint8Array)
      
      // Find the OPF file which contains the manifest
      let opfContent = ""
      for (const [path, file] of Object.entries(zipFile.files)) {
        if (!file.dir && path.endsWith(".opf")) {
          opfContent = await file.async("string")
          break
        }
      }
      
      if (!opfContent) {
        return { error: "Could not find OPF file in EPUB" }
      }
      
      // Extract text from HTML/XHTML content files
      const textParts: string[] = []
      
      // Find all HTML/XHTML files in the manifest
      const htmlFileRegex = /<item[^>]+href="([^"]+\.(?:html|xhtml|htm))"[^>]*>/gi
      const matches = [...opfContent.matchAll(htmlFileRegex)]
      
      for (const match of matches) {
        const filePath = match[1]
        // Find the file in the ZIP (handle relative paths)
        for (const [path, file] of Object.entries(zipFile.files)) {
          if (!file.dir && (path.endsWith(filePath) || path.includes(filePath))) {
            const htmlContent = await file.async("string")
            // Basic HTML tag removal and text extraction
            let text = htmlContent
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
            
            // Filter out path-like strings and other artifacts
            text = text
              .replace(/\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/g, "") // Remove path-like strings like /input/import-1/
              .replace(/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\//g, "") // Remove path-like strings at start
              .replace(/\s+/g, " ") // Clean up multiple spaces again
              .trim()
            
            if (text && text.length > 10) { // Only add if text is meaningful (more than 10 chars)
              textParts.push(text)
            }
            break
          }
        }
      }
      
      extractedText = textParts.join("\n\n") || "No text content found in EPUB"
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return { error: "No text could be extracted from the document" }
    }

    const { data, error: dbError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        title: fileName.replace(/\.[^/.]+$/, ""),
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        extracted_text: extractedText,
        page_count: 1,
        storage_path: storagePath,
      })
      .select()
      .single()

    if (dbError) {
      return { error: dbError.message }
    }

    return { success: true, documentId: data.id }
  } catch (err) {
    console.error("Process error:", err)
    return { error: err instanceof Error ? err.message : "Failed to process document" }
  }
}
