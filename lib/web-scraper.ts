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
    // Pre-process HTML to remove obvious non-content and reduce size
    const cleanedHtml = html
      // Remove script and style tags
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove SVG content
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
      // Remove nav, footer, header (usually navigation)
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      // Remove hidden elements
      .replace(/<[^>]+hidden[^>]*>[\s\S]*?<\/[^>]+>/gi, '')
      // Remove common ad/tracking elements
      .replace(/<div[^>]*(?:ad-|ads-|advertisement|tracking|cookie|banner)[^>]*>[\s\S]*?<\/div>/gi, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()

    console.log(`📄 Cleaned HTML size: ${cleanedHtml.length} (original: ${html.length})`)

    const prompt = `
You are an expert web content extractor. Your task is to extract ALL meaningful content from the provided HTML.

URL: ${url}

CRITICAL INSTRUCTIONS:
1. Extract EVERYTHING that is actual content - articles, documentation, tutorials, code examples, etc.
2. Do NOT truncate or summarize the main content - preserve it completely
3. Remove only: navigation menus, advertisements, cookie banners, sidebar links, footer links
4. KEEP: All paragraphs, all headings, all lists, all code blocks, all important text
5. Preserve the logical structure with headings and sections
6. For documentation/tutorial pages: include ALL code examples and explanations
7. For articles: include the complete article text
8. Extract metadata if available (author, date, description)
9. ${extractKeyTopics ? 'Identify 8-15 key topics covering all main themes' : 'Skip topics'}
10. ${summarize ? 'Create a comprehensive 3-5 sentence summary' : 'Skip summary'}

HTML Content (cleaned):
${cleanedHtml.substring(0, 150000)}

Respond with a JSON object:
{
  "title": "Page title",
  "content": "COMPLETE extracted content - do not truncate",
  "summary": "3-5 sentence summary",
  "keyTopics": ["topic1", "topic2", ...],
  "contentType": "article|documentation|blog|news|academic|general",
  "metadata": {
    "author": "Author if found or null",
    "publishedDate": "Date if found or null",
    "description": "Meta description or null",
    "language": "en"
  }
}

IMPORTANT: The content field should contain ALL the main text from the page. Do not limit or truncate it.
`

    const result = await generateText({
      model: openai('gpt-4o'), // Using more capable model for comprehensive extraction
      prompt,
      temperature: 0.1,
    })

    // Parse the AI response
    let parsedResult: any
    try {
      // Clean up the response to extract JSON
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : result.text;
      parsedResult = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      console.error('AI Response:', result.text)
      
      // Fallback: extract content manually
      return {
        title: html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || 'Untitled Page',
        content: result.text.substring(0, maxContentLength),
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
