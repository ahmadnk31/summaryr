"use server"

import { createClient } from "@/lib/supabase/server"
import { isTextractAvailable, extractTextFromPDF, getTextractSupportedFormats } from "@/lib/aws-textract"
import { downloadFromS3, isS3Available } from "@/lib/aws-s3"

interface ProcessDocumentParams {
  storagePath: string
  fileName: string
  fileType: string
  fileSize: number
  useTextract?: boolean
  storageType?: "s3" | "supabase" // Which storage backend to use
}

export async function processDocument({ 
  storagePath, 
  fileName, 
  fileType, 
  fileSize, 
  useTextract = true,
  storageType = "supabase" // Default to supabase for backward compatibility
}: ProcessDocumentParams) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "You must be logged in to process documents" }
    }

    // Download the file from storage to process it
    let uint8Array: Uint8Array
    
    if (storageType === "s3" && isS3Available()) {
      console.log("📦 Downloading from S3:", storagePath)
      try {
        const buffer = await downloadFromS3(storagePath)
        console.log("✅ Downloaded from S3, size:", buffer.length, "bytes")
        // Convert Buffer to Uint8Array
        uint8Array = new Uint8Array(buffer)
        console.log("✅ Converted to Uint8Array, length:", uint8Array.length)
      } catch (s3Error) {
        console.error("❌ S3 download failed:", s3Error)
        throw s3Error
      }
    } else {
      console.log("📦 Downloading from Supabase Storage:", storagePath)
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(storagePath)

      if (downloadError || !fileData) {
        return { error: "Failed to download file for processing" }
      }
      
      const arrayBuffer = await fileData.arrayBuffer()
      uint8Array = new Uint8Array(arrayBuffer)
    }

    let extractedText = ""
    let extractionMethod = "standard"

    // Check if we should use AWS Textract
    const textractAvailable = isTextractAvailable()
    const textractSupported = getTextractSupportedFormats().includes(fileType)
    const shouldUseTextract = useTextract && textractAvailable && textractSupported

    console.log("=== Textract Configuration ===")
    console.log("File type:", fileType)
    console.log("File size:", (fileSize / (1024 * 1024)).toFixed(2), "MB")
    console.log("Storage type:", storageType)
    console.log("useTextract param:", useTextract)
    console.log("textractAvailable:", textractAvailable)
    console.log("textractSupported:", textractSupported)
    console.log("shouldUseTextract:", shouldUseTextract)
    console.log("AWS_REGION:", process.env.AWS_REGION)
    console.log("AWS_ACCESS_KEY_ID exists:", !!process.env.AWS_ACCESS_KEY_ID)
    console.log("AWS_SECRET_ACCESS_KEY exists:", !!process.env.AWS_SECRET_ACCESS_KEY)
    console.log("==============================")

    if (fileType === "pdf") {
      if (shouldUseTextract) {
        try {
          console.log("✅ Using AWS Textract for PDF extraction...")
          console.log("Buffer size:", uint8Array.length, "bytes (", (uint8Array.length / 1024 / 1024).toFixed(2), "MB)")
          console.log("First 10 bytes:", Array.from(uint8Array.slice(0, 10)))
          console.log("Last 10 bytes:", Array.from(uint8Array.slice(-10)))
          
          // Validate PDF signature (should start with %PDF)
          const pdfSignature = String.fromCharCode(...uint8Array.slice(0, 4))
          console.log("PDF signature:", pdfSignature)
          
          if (pdfSignature !== "%PDF") {
            throw new Error(`Invalid PDF file format - got signature: ${pdfSignature}`)
          }
          
          // Check if PDF ends properly (should end with %%EOF)
          const pdfEnd = String.fromCharCode(...uint8Array.slice(-10))
          console.log("PDF ending contains:", pdfEnd.includes("%%EOF") ? "%%EOF ✅" : "No %%EOF ⚠️")
          
          // Create a fresh copy of the buffer for Textract
          // This ensures we're not passing a reference that might be modified
          const textractBuffer = new Uint8Array(uint8Array)
          
          // If stored in S3, pass bucket and key so Textract can read directly from S3
          // This can help with certain PDF formats that don't work with direct bytes
          const textractOptions: { 
            s3Bucket?: string; 
            s3Key?: string;
          } = {}
          
          if (storageType === "s3" && process.env.AWS_S3_BUCKET) {
            textractOptions.s3Bucket = process.env.AWS_S3_BUCKET
            textractOptions.s3Key = storagePath
            console.log("📌 Passing S3 source to Textract:", textractOptions.s3Bucket, "/", textractOptions.s3Key)
          }
          
          const result = await extractTextFromPDF(textractBuffer, textractOptions)
          
          // Check if Textract returned an error (like UnsupportedDocumentException)
          if (result.error) {
            console.warn(`⚠️  ${result.error}: ${result.message}`)
            // If image conversion also failed, fall back to unpdf
            throw new Error(result.message || result.error)
          }
          
          extractedText = result.text
          extractionMethod = "textract"
          console.log(`✅ Textract extraction complete. Confidence: ${result.confidence?.toFixed(2)}%`)
        } catch (textractError) {
          console.warn("❌ Textract extraction failed, falling back to standard method:", textractError)
          // Fall back to standard extraction
          const { extractText } = await import("unpdf")
          const result = await extractText(uint8Array, { mergePages: true })
          extractedText = result.text
          extractionMethod = "unpdf-fallback"
        }
      } else {
        console.log("⚠️  Skipping Textract, using standard extraction")
        console.log("Reason: useTextract=" + useTextract + ", available=" + textractAvailable + ", supported=" + textractSupported)
        // Standard PDF extraction
        const { extractText } = await import("unpdf")
        const result = await extractText(uint8Array, { mergePages: true })
        extractedText = result.text
        extractionMethod = "unpdf"
      }
    } else if (fileType === "docx") {
      const mammoth = await import("mammoth")
      const buffer = Buffer.from(uint8Array)
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else if (fileType === "epub") {
      // EPUB files are ZIP archives containing HTML/XHTML files
      const JSZip = await import("jszip")
      const zip = new JSZip.default()
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
              .replace(/\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/g, "")
              .replace(/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\//g, "")
              .replace(/\s+/g, " ")
              .trim()
            
            if (text && text.length > 10) {
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
        storage_type: storageType, // Track which storage backend is used
      })
      .select()
      .single()

    if (dbError) {
      return { error: dbError.message }
    }

    console.log(`Document processed successfully using ${extractionMethod}`)
    return { 
      success: true, 
      documentId: data.id,
      extractionMethod 
    }
  } catch (err) {
    console.error("Process error:", err)
    return { error: err instanceof Error ? err.message : "Failed to process document" }
  }
}
