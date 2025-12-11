"use server"

import { createClient } from "@/lib/supabase/server"
import { scrapeWebPage, extractTextFromScrapedContent, validateUrl } from "@/lib/web-scraper"
import { enhancedWebScraping } from "@/lib/enhanced-web-scraper"
import { uploadToS3, isS3Available } from "@/lib/aws-s3"

interface ProcessWebPageParams {
  url: string
  title?: string
}

export async function processWebPage(params: ProcessWebPageParams) {
  try {
    const { url, title } = params

    // Validate URL first
    const validation = validateUrl(url)
    if (!validation.isValid) {
      return { error: validation.error, success: false }
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "You must be logged in to scrape web pages", success: false }
    }

    console.log(`Processing web page: ${url}`)

    // Step 1: Scrape the web page content using enhanced OpenAI extraction
    const scrapedContent = await enhancedWebScraping(url, {
      maxContentLength: 100000, // Very high limit for comprehensive content extraction
      includeMetadata: true,
      extractKeyTopics: true,
      summarize: true,
    })

    // Step 2: Extract text for document storage
    const extractedText = extractTextFromScrapedContent(scrapedContent)

    // Step 3: Create a virtual file name
    const sanitizedTitle = (title || scrapedContent.title || 'Web Page')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100)
    
    const fileName = `${sanitizedTitle}.txt`
    const fileSize = Buffer.byteLength(extractedText, 'utf8')

    // Step 4: Prepare metadata
    const webMetadata = {
      sourceUrl: url,
      originalTitle: scrapedContent.title,
      contentType: scrapedContent.contentType,
      wordCount: scrapedContent.wordCount,
      author: scrapedContent.metadata.author,
      publishedDate: scrapedContent.metadata.publishedDate,
      keyTopics: scrapedContent.keyTopics,
      summary: scrapedContent.summary,
      scrapedAt: scrapedContent.extractedAt.toISOString(),
    }

    // Step 5: Store the content (try S3 first, fallback to text storage)
    let storagePath = ''
    let storageType: 'text' | 's3' = 'text'

    if (isS3Available()) {
      try {
        // Prepare content with metadata for S3 storage
        const contentWithMetadata = `<!-- WEB_METADATA: ${JSON.stringify(webMetadata)} -->\n\n${extractedText}`
        const textBuffer = Buffer.from(contentWithMetadata, 'utf8')
        
        const s3Result = await uploadToS3({
          userId: user.id,
          file: textBuffer,
          fileName,
          contentType: 'text/plain',
          metadata: {
            sourceUrl: url,
            contentType: scrapedContent.contentType,
            wordCount: scrapedContent.wordCount.toString(),
            scrapedAt: scrapedContent.extractedAt.toISOString(),
          },
        })
        storagePath = s3Result.key
        storageType = 's3'
        console.log(`✅ Stored scraped content in S3: ${s3Result.key}`)
      } catch (s3Error) {
        console.log('⚠️ S3 upload failed, using direct text storage:', s3Error)
        storagePath = `<!-- WEB_METADATA: ${JSON.stringify(webMetadata)} -->\n\n${extractedText}`
        storageType = 'text'
      }
    } else {
      storagePath = `<!-- WEB_METADATA: ${JSON.stringify(webMetadata)} -->\n\n${extractedText}`
      storageType = 'text'
      console.log('📝 Using direct text storage (S3 not configured)')
    }

    // Step 6: Save document record to database

    const { data: document, error: insertError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        title: title || scrapedContent.title || 'Web Page', // Set proper title
        file_name: fileName,
        file_type: 'url', // Use 'url' instead of 'webpage' for compatibility
        file_size: fileSize,
        storage_path: storagePath,
        storage_type: storageType,
        extracted_text: storageType === 'text' 
          ? `<!-- WEB_METADATA: ${JSON.stringify(webMetadata)} -->\n\n${extractedText}` 
          : null, // For S3 storage, content will be loaded dynamically
        upload_date: new Date().toISOString(),
        processing_status: 'completed',
      })
      .select()
      .single()

    if (insertError) {
      console.error("Database insert error:", insertError)
      return { error: `Failed to save document: ${insertError.message}`, success: false }
    }

    console.log(`✅ Web page successfully processed and saved as document: ${document.id}`)

    return { 
      success: true, 
      documentId: document.id,
      scrapedContent: {
        title: scrapedContent.title,
        wordCount: scrapedContent.wordCount,
        summary: scrapedContent.summary,
        keyTopics: scrapedContent.keyTopics,
        contentType: scrapedContent.contentType,
      }
    }

  } catch (error) {
    console.error("Web page processing error:", error)
    
    // Provide user-friendly error messages
    let errorMessage = "Failed to process web page"
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = "Unable to access the webpage. Please check the URL and try again."
      } else if (error.message.includes('timeout')) {
        errorMessage = "The webpage took too long to load. Please try again."
      } else if (error.message.includes('Content extraction failed')) {
        errorMessage = "Unable to extract content from the webpage. The page might be empty or have restricted access."
      } else {
        errorMessage = error.message
      }
    }

    return { error: errorMessage, success: false }
  }
}
