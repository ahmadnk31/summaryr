"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, Loader2, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { processDocument } from "@/app/actions/process-document"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function DocumentUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const router = useRouter()

  const handleFileUpload = useCallback(
    async (file: File) => {
      const fileType = file.name.split(".").pop()?.toLowerCase()
      if (!["pdf", "docx", "epub"].includes(fileType || "")) {
        setError("Please upload a PDF, DOCX, or EPUB file")
        return
      }

      setIsUploading(true)
      setError(null)
      setSelectedFile(file)

      try {
        const supabase = createClient()

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError("You must be logged in to upload documents")
          setIsUploading(false)
          return
        }

        const timestamp = Date.now()
        const filePath = `${user.id}/${timestamp}-${file.name}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

        if (uploadError) {
          setError(`Storage upload failed: ${uploadError.message}`)
          setIsUploading(false)
          return
        }

        // Call server action with just the storage path and file metadata
        const result = await processDocument({
          storagePath: filePath,
          fileName: file.name,
          fileType: fileType || "",
          fileSize: file.size,
        })

        if (result?.error) {
          setError(result.error)
          setIsUploading(false)
        } else if (result?.success && result?.documentId) {
          router.push(`/documents/${result.documentId}`)
        }
      } catch (err) {
        console.error("Upload error:", err)
        setError(err instanceof Error ? err.message : "Failed to upload document")
        setIsUploading(false)
      }
    },
    [router]
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        handleFileUpload(file)
      }
    },
    [handleFileUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/epub+zip": [".epub"],
    },
    maxFiles: 1,
    disabled: isUploading,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>Upload a PDF, DOCX, or EPUB file to extract text and create study materials</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />

          <div className="rounded-full bg-primary/10 p-4">
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
          </div>

          <div className="text-center">
            {isUploading ? (
              <>
                <p className="text-sm font-medium mb-1">Processing document...</p>
                {selectedFile && (
                  <p className="text-xs text-muted-foreground truncate max-w-xs">{selectedFile.name}</p>
                )}
              </>
            ) : isDragActive ? (
              <>
                <p className="text-sm font-medium mb-1 text-primary">Drop the file here</p>
                <p className="text-xs text-muted-foreground">Release to upload</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium mb-1">
                  Drag and drop a file here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">Supported formats: PDF, DOCX, EPUB</p>
              </>
            )}
          </div>

          {!isUploading && (
            <Button variant="outline" type="button">
              <FileText className="mr-2 h-4 w-4" />
              Select File
            </Button>
          )}

          {selectedFile && !isUploading && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate max-w-xs">{selectedFile.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFile(null)
                  setError(null)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive text-center bg-destructive/10 px-4 py-2 rounded-md">
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
