"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Loader2, X, Cloud, Link as LinkIcon, Globe } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { processDocument } from "@/app/actions/process-document-s3"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface DocumentUploadS3Props {
  planTier?: string
  documentCount?: number
}

export function DocumentUploadS3({ planTier = 'free', documentCount = 0 }: DocumentUploadS3Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [url, setUrl] = useState("")
  const router = useRouter()

  const isLimitReached = planTier === 'free' && documentCount >= 5

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (isLimitReached) {
        setError("Free plan limit reached (5 documents). Please upgrade to upload more.")
        return
      }

      const fileType = file.name.split(".").pop()?.toLowerCase()
      if (!["pdf", "docx", "epub"].includes(fileType || "")) {
        setError("Please upload a PDF, DOCX, or EPUB file")
        return
      }

      setIsUploading(true)
      setError(null)
      setSelectedFile(file)
      setUploadProgress(0)

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
        setUploadProgress(20)

        // Try S3 upload first via API route
        const formData = new FormData()
        formData.append("file", file)
        formData.append("userId", user.id)
        formData.append("fileName", file.name)

        const uploadResponse = await fetch("/api/upload-s3", {
          method: "POST",
          body: formData,
        })

        if (uploadResponse.ok) {
          // S3 upload successful
          const { key } = await uploadResponse.json()
          console.log("✅ S3 upload successful, key:", key)
          setUploadProgress(60)

          // Process document with S3 storage type
          const result = await processDocument({
            storagePath: key,
            fileName: file.name,
            fileType: fileType || "",
            fileSize: file.size,
            storageType: "s3",
          })

          if (result?.error) {
            setError(result.error)
            setIsUploading(false)
          } else if (result?.success && result?.documentId) {
            setUploadProgress(100)
            router.push(`/documents/${result.documentId}`)
          }
        } else {
          // S3 not available or failed, fallback to Supabase Storage
          const errorData = await uploadResponse.json().catch(() => ({}))
          console.log("⚠️  S3 upload failed or not configured:", uploadResponse.status, errorData)
          console.log("📦 Falling back to Supabase Storage")
          const filePath = `${user.id}/${timestamp}-${file.name}`

          const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            })

          if (uploadError) {
            setError(`Storage upload failed: ${uploadError.message}`)
            setIsUploading(false)
            return
          }

          setUploadProgress(60)

          // Process document with Supabase storage type
          const result = await processDocument({
            storagePath: filePath,
            fileName: file.name,
            fileType: fileType || "",
            fileSize: file.size,
            storageType: "supabase",
          })

          if (result?.error) {
            setError(result.error)
            setIsUploading(false)
          } else if (result?.success && result?.documentId) {
            setUploadProgress(100)
            router.push(`/documents/${result.documentId}`)
          }
        }
      } catch (err) {
        console.error("Upload error:", err)
        setError(err instanceof Error ? err.message : "Failed to upload document")
        setIsUploading(false)
        setUploadProgress(0)
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

  const handleUrlSubmit = useCallback(async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL")
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      setError("Please enter a valid URL")
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const response = await fetch("/api/scrape-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to scrape URL")
      }

      const { documentId } = await response.json()
      setUploadProgress(100)
      router.push(`/documents/${documentId}`)
    } catch (err) {
      console.error("URL scraping error:", err)
      setError(err instanceof Error ? err.message : "Failed to scrape URL")
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [url, router])

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
        <CardTitle className="flex items-center gap-2">
          Upload Document
          <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
            <Cloud className="h-3 w-3" />
            Smart Storage
          </span>
        </CardTitle>
        <CardDescription>
          Upload a PDF, DOCX, or EPUB file to extract text and create study materials
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50",
            isUploading && "opacity-50 cursor-not-allowed",
            isLimitReached && "opacity-75 cursor-not-allowed border-destructive/50 bg-destructive/5"
          )}
        >
          <input {...getInputProps()} disabled={isLimitReached} />

          <div className="rounded-full bg-primary/10 p-4">
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : isLimitReached ? (
              <Loader2 className="h-8 w-8 text-muted-foreground" /> // Or a lock icon
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
          </div>

          <div className="text-center">
            {isLimitReached ? (
              <>
                <p className="text-sm font-medium mb-1 text-destructive">Upload limit reached</p>
                <p className="text-xs text-muted-foreground">Free plan is limited to 5 documents</p>
              </>
            ) : isUploading ? (
              <>
                <p className="text-sm font-medium mb-1">
                  {uploadProgress < 60 ? "Uploading..." : "Processing document..."}
                </p>
                {selectedFile && (
                  <p className="text-xs text-muted-foreground truncate max-w-xs mb-2">
                    {selectedFile.name}
                  </p>
                )}
                <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
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
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, DOCX, EPUB • Intelligent storage selection
                </p>
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
              <span className="text-sm text-muted-foreground truncate max-w-xs">
                {selectedFile.name}
              </span>
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
            <div className="text-sm text-destructive text-center bg-destructive/10 px-4 py-2 rounded-md max-w-md">
              {error}
            </div>
          )}
        </div>


      </CardContent>
    </Card>
  )
}
