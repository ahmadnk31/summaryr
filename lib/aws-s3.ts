/**
 * AWS S3 Integration for Document Storage
 * Provides secure file upload, download, and management with CloudFront CDN
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// Initialize S3 client
export function getS3Client() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
    throw new Error("AWS credentials not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION in your environment variables.")
  }

  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  })
}

/**
 * Check if S3 is properly configured
 */
export function isS3Available(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION &&
    process.env.AWS_S3_BUCKET
  )
}

/**
 * Get the S3 bucket name
 */
export function getBucketName(): string {
  const bucket = process.env.AWS_S3_BUCKET
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET not configured in environment variables")
  }
  return bucket
}

/**
 * Get CloudFront URL if configured, otherwise return S3 URL
 */
export function getCDNUrl(key: string): string {
  const cloudFrontDomain = process.env.AWS_CLOUDFRONT_DOMAIN
  
  if (cloudFrontDomain) {
    // Use CloudFront for faster delivery
    return `https://${cloudFrontDomain}/${key}`
  } else {
    // Fall back to S3 direct URL
    const bucket = getBucketName()
    const region = process.env.AWS_REGION
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
  }
}

interface UploadOptions {
  userId: string
  file: Buffer | Uint8Array
  fileName: string
  contentType: string
  metadata?: Record<string, string>
}

/**
 * Upload a file to S3
 */
export async function uploadToS3(options: UploadOptions): Promise<{ key: string; url: string }> {
  const { userId, file, fileName, contentType, metadata = {} } = options
  
  const s3Client = getS3Client()
  const bucket = getBucketName()
  
  // Create a unique key with timestamp
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
  const key = `documents/${userId}/${timestamp}-${sanitizedFileName}`
  
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file,
    ContentType: contentType,
    Metadata: {
      ...metadata,
      uploadedAt: new Date().toISOString(),
      originalFileName: fileName,
    },
    // Enable server-side encryption
    ServerSideEncryption: "AES256",
    // Cache for 1 year (CloudFront will handle invalidation if needed)
    CacheControl: "max-age=31536000",
  })
  
  await s3Client.send(command)
  
  const url = getCDNUrl(key)
  
  return { key, url }
}

/**
 * Download a file from S3 as Buffer
 */
export async function downloadFromS3(key: string): Promise<Buffer> {
  const s3Client = getS3Client()
  const bucket = getBucketName()
  
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })
  
  const response = await s3Client.send(command)
  
  if (!response.Body) {
    throw new Error("No file content received from S3")
  }
  
  // Convert stream to buffer
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as any) {
    chunks.push(chunk)
  }
  
  return Buffer.concat(chunks)
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  const s3Client = getS3Client()
  const bucket = getBucketName()
  
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  })
  
  await s3Client.send(command)
}

/**
 * Check if a file exists in S3
 */
export async function fileExistsInS3(key: string): Promise<boolean> {
  try {
    const s3Client = getS3Client()
    const bucket = getBucketName()
    
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    })
    
    await s3Client.send(command)
    return true
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return false
    }
    throw error
  }
}

/**
 * Generate a presigned URL for temporary access (useful for private files)
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const s3Client = getS3Client()
  const bucket = getBucketName()
  
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })
  
  // Generate a presigned URL that expires after the specified time
  const url = await getSignedUrl(s3Client, command, { expiresIn })
  
  return url
}

/**
 * Get file metadata from S3
 */
export async function getFileMetadata(key: string): Promise<{
  size: number
  contentType: string
  lastModified: Date
  metadata: Record<string, string>
}> {
  const s3Client = getS3Client()
  const bucket = getBucketName()
  
  const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  })
  
  const response = await s3Client.send(command)
  
  return {
    size: response.ContentLength || 0,
    contentType: response.ContentType || "application/octet-stream",
    lastModified: response.LastModified || new Date(),
    metadata: response.Metadata || {},
  }
}

/**
 * Generate upload presigned URL (for client-side direct upload)
 */
export async function generateUploadUrl(
  userId: string,
  fileName: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; key: string; url: string }> {
  const s3Client = getS3Client()
  const bucket = getBucketName()
  
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
  const key = `documents/${userId}/${timestamp}-${sanitizedFileName}`
  
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: "AES256",
    CacheControl: "max-age=31536000",
  })
  
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn })
  const url = getCDNUrl(key)
  
  return { uploadUrl, key, url }
}

/**
 * Upload file with progress tracking (for large files)
 */
export async function uploadLargeFile(
  options: UploadOptions,
  onProgress?: (progress: number) => void
): Promise<{ key: string; url: string }> {
  // For files > 100MB, consider using multipart upload
  const fileSize = options.file.length
  const threshold = 100 * 1024 * 1024 // 100MB
  
  if (fileSize > threshold) {
    // TODO: Implement multipart upload for very large files
    console.log("Large file detected, consider implementing multipart upload")
  }
  
  // For now, use regular upload
  const result = await uploadToS3(options)
  
  if (onProgress) {
    onProgress(100)
  }
  
  return result
}
