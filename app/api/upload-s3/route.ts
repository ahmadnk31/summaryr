import { NextRequest, NextResponse } from "next/server"
import { uploadToS3, isS3Available } from "@/lib/aws-s3"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Check if S3 is available
    if (!isS3Available()) {
      return NextResponse.json(
        { error: "S3 storage is not configured" },
        { status: 503 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const fileName = formData.get("fileName") as string

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const fileType = fileName.split(".").pop()?.toLowerCase()
    if (!["pdf", "docx", "epub"].includes(fileType || "")) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, DOCX, and EPUB are supported." },
        { status: 400 }
      )
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Determine content type
    const contentTypeMap: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      epub: "application/epub+zip",
    }
    const contentType = (fileType && contentTypeMap[fileType]) || "application/octet-stream"

    // Upload to S3
    const result = await uploadToS3({
      userId: user.id,
      file: buffer,
      fileName: fileName,
      contentType: contentType,
      metadata: {
        uploadedBy: user.id,
        originalSize: file.size.toString(),
      },
    })

    return NextResponse.json({
      success: true,
      key: result.key,
      url: result.url,
    })
  } catch (error) {
    console.error("S3 upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 }
    )
  }
}
