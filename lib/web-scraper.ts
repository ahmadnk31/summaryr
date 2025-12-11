/**
 * Web Scraping Service using OpenAI for intelligent content extraction
 * Fetches web pages and uses AI to extract structured, meaningful content
 */

import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export interface ScrapedContent {
  title: string
  content: string
  url: string
  summary: string
  keyTopics: string[]
  contentType: 'article' | 'documentation' | 'blog' | 'news' | 'academic' | 'general'
  wordCount: number
  extractedAt: Date
  metadata: {
    author?: string
    publishedDate?: string
    description?: string
    language?: string
  }
}

export interface ScrapeOptions {
  maxContentLength?: number
  includeMetadata?: boolean
  extractKeyTopics?: boolean
  summarize?: boolean
  contentType?: 'auto' | 'article' | 'documentation' | 'blog' | 'news' | 'academic'
}

/**
 * Fetch raw HTML content from a URL
 */
async function fetchPageContent(url: string): Promise<{ html: string; title: string }> {
  try {
    console.log(`🌐 Fetching URL: ${url}`)
    
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are supported')
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(45000), // Increased timeout for larger pages
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      throw new Error('URL does not return HTML content')
    }

    const html = await response.text()
    console.log(`✅ Successfully fetched ${html.length} bytes`)
    
    // Extract basic title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Page'

    return { html, title }
  } catch (error) {
    console.error(`❌ Fetch error for ${url}:`, error)
    
    if (error instanceof TypeError) {
      const errorMessage = error.message.toLowerCase()
      if (errorMessage.includes('fetch failed') || errorMessage.includes('network')) {
        throw new Error(
          `Network error: Unable to connect to ${url}. This could be due to:
` +
          `- SSL/TLS certificate issues
` +
          `- Network connectivity problems
` +
          `- The server blocking automated requests
` +
          `- CORS or firewall restrictions

` +
          `Try using a publicly accessible URL or check if the site is reachable.`
        )
      }
      throw new Error(`Connection failed: ${error.message}`)
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout: The page took too long to load (>45s)`)
    }
    
    throw error
  }
}

/**
 * Use OpenAI to extract and structure content from HTML
 */
async function extractContentWithAI(
  html: string, 
  url: string, 
  options: ScrapeOptions = {}
): Promise<ScrapedContent> {
  const {
    maxContentLength = 5000000,
    includeMetadata = true,
    extractKeyTopics = true,
    summarize = true,
    contentType = 'auto'
  } = options

  try {
    // Step 1: Aggressively clean HTML
    let cleanedHtml = html
      // Remove script and style tags
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove SVG and canvas
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
      .replace(/<canvas[^>]*>[\s\S]*?<\/canvas>/gi, '')
      // Remove images (keep alt text)
      .replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, ' $1 ')
      .replace(/<img[^>]*>/gi, '')
      // Remove nav, footer, header, aside
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      // Remove hidden elements
      .replace(/<[^>]+(?:hidden|display:\s*none)[^>]*>[\s\S]*?<\/[^>]+>/gi, '')
      // Remove forms and inputs
      .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
      .replace(/<input[^>]*>/gi, '')
      .replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '')
      // Remove iframes and embeds
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/<embed[^>]*>/gi, '')
      .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')

    // Step 2: Extract text content while preserving structure
    // Convert block elements to newlines
    cleanedHtml = cleanedHtml
      .replace(/<\/?(div|p|br|h[1-6]|li|tr|td|th|section|article|blockquote)[^>]*>/gi, '\n')
      .replace(/<\/?(ul|ol|table|thead|tbody)[^>]*>/gi, '\n\n')
      // Convert code blocks to preserve them
      .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n')
      .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
      // Remove remaining HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      // Clean up whitespace
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()

    console.log(`📄 Extracted text size: ${cleanedHtml.length} chars (original HTML: ${html.length})`)

    // Step 3: Limit content to fit within token limits (~4 chars per token, leave room for prompt)
    const maxChars = 60000 // ~15k tokens for content, leaving room for prompt and response
    if (cleanedHtml.length > maxChars) {
      console.log(`⚠️ Content too large (${cleanedHtml.length}), truncating to ${maxChars} chars`)
      cleanedHtml = cleanedHtml.substring(0, maxChars) + '\n\n[Content truncated due to size...]'
    }

    const prompt = `You are an expert web content extractor. Extract the main content from this text.

URL: ${url}

TEXT CONTENT:
${cleanedHtml}

Extract and return a JSON object with:
{
  "title": "Page title",
  "content": "The complete main content text (preserve all important information)",
  "summary": "2-3 sentence summary",
  "keyTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "contentType": "documentation|article|blog|news|academic|general",
  "metadata": {
    "author": "author or null",
    "publishedDate": "date or null",
    "description": "description or null",
    "language": "en"
  }
}

IMPORTANT: Preserve ALL the main content. Include code examples, explanations, and all text sections.
Return ONLY valid JSON without markdown code blocks.`

    const result = await generateText({
      model: openai('gpt-4o-mini'), // Using gpt-4o-mini for higher rate limits
      prompt,
      temperature: 0.1,
    })

    // Parse the AI response
    let parsedResult: any
    try {
      // Clean up the response to extract JSON
      let jsonString = result.text
      
      // Remove markdown code blocks if present
      jsonString = jsonString.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
      
      // Try to find JSON object
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonString = jsonMatch[0]
      }
      
      // Fix common JSON issues - escape newlines in string values
      // This handles cases where the content field has unescaped newlines
      jsonString = jsonString.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
      
      // But we need to restore actual JSON structure newlines
      // Parse by trying multiple approaches
      try {
        parsedResult = JSON.parse(jsonString)
      } catch {
        // Try a more aggressive cleanup - remove control characters
        const cleanJson = jsonString
          .replace(/[\x00-\x1F\x7F]/g, (char) => {
            if (char === '\n' || char === '\\n') return '\\n'
            if (char === '\r' || char === '\\r') return '\\r'
            if (char === '\t' || char === '\\t') return '\\t'
            return ''
          })
        parsedResult = JSON.parse(cleanJson)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      console.error('AI Response (first 500 chars):', result.text.substring(0, 500))
      
      // Fallback: use the extracted text directly
      // Extract title from the response if possible
      const titleMatch = result.text.match(/"title":\s*"([^"]+)"/)
      const contentMatch = result.text.match(/"content":\s*"([\s\S]*?)(?:","summary"|$)/)
      
      return {
        title: titleMatch?.[1] || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || 'Untitled Page',
        content: contentMatch?.[1] || result.text.substring(0, maxContentLength),
        url,
        summary: 'Content extracted from web page',
        keyTopics: [],
        contentType: 'general',
        wordCount: result.text.split(/\s+/).length,
        extractedAt: new Date(),
        metadata: {}
      }
    }

    // Construct the final result
    const scrapedContent: ScrapedContent = {
      title: parsedResult.title || 'Untitled Page',
      content: parsedResult.content || '',
      url,
      summary: parsedResult.summary || '',
      keyTopics: Array.isArray(parsedResult.keyTopics) ? parsedResult.keyTopics : [],
      contentType: parsedResult.contentType || 'general',
      wordCount: (parsedResult.content || '').split(/\s+/).filter((word: string) => word.length > 0).length,
      extractedAt: new Date(),
      metadata: {
        author: parsedResult.metadata?.author || null,
        publishedDate: parsedResult.metadata?.publishedDate || null,
        description: parsedResult.metadata?.description || null,
        language: parsedResult.metadata?.language || 'en',
      }
    }

    return scrapedContent
  } catch (error) {
    console.error('OpenAI content extraction failed:', error)
    throw new Error(`Content extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Helper function to retry an operation with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on certain errors
      const errorMessage = lastError.message.toLowerCase()
      if (
        errorMessage.includes('http 404') ||
        errorMessage.includes('http 403') ||
        errorMessage.includes('not return html')
      ) {
        throw lastError // Don't retry permanent failures
      }
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1)
        console.log(`⏳ Retry ${attempt}/${maxRetries - 1} after ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

/**
 * Main scraping function that combines fetching and AI extraction
 */
export async function scrapeWebPage(url: string, options: ScrapeOptions = {}): Promise<ScrapedContent> {
  try {
    console.log(`Starting to scrape: ${url}`)
    
    // Step 1: Fetch the HTML content with retry logic
    const { html, title } = await retryWithBackoff(
      () => fetchPageContent(url),
      3, // Max 3 attempts
      1000 // Start with 1s delay
    )
    console.log(`✅ Fetched HTML content, title: ${title}`)
    
    // Step 2: Extract content using OpenAI
    const scrapedContent = await extractContentWithAI(html, url, options)
    console.log(`✅ Successfully extracted content: ${scrapedContent.wordCount} words`)
    
    return scrapedContent
  } catch (error) {
    console.error(`❌ Web scraping failed for ${url}:`, error)
    throw error
  }
}

/**
 * Validate if a URL is scrapeable
 */
export function validateUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const urlObj = new URL(url)
    
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Only HTTP and HTTPS URLs are supported' }
    }
    
    // Block some non-scrapeable domains
    const blockedDomains = ['localhost', '127.0.0.1', '0.0.0.0']
    if (blockedDomains.some(domain => urlObj.hostname.includes(domain))) {
      return { isValid: false, error: 'Local URLs are not supported' }
    }
    
    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' }
  }
}

/**
 * Extract text content for document processing
 */
export function extractTextFromScrapedContent(content: ScrapedContent): string {
  const sections = []
  
  if (content.title) {
    sections.push(`Title: ${content.title}`)
  }
  
  if (content.metadata.author) {
    sections.push(`Author: ${content.metadata.author}`)
  }
  
  if (content.metadata.publishedDate) {
    sections.push(`Published: ${content.metadata.publishedDate}`)
  }
  
  if (content.summary) {
    sections.push(`Summary: ${content.summary}`)
  }
  
  if (content.keyTopics.length > 0) {
    sections.push(`Key Topics: ${content.keyTopics.join(', ')}`)
  }
  
  sections.push(`\nMain Content:\n${content.content}`)
  
  return sections.join('\n\n')
}
