/**
 * Web Scraping Service using OpenAI for intelligent content extraction
 * Fetches web pages and uses AI to extract structured, meaningful content
 */

import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export interface ScrapedContent {
  title: string
  content: string // Now contains HTML or Markdown
  contentFormat: 'html' | 'markdown'
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
  outputFormat?: 'html' | 'markdown' // New option to choose output format
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
      signal: AbortSignal.timeout(45000),
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
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Page'

    return { html, title }
  } catch (error) {
    console.error(`❌ Fetch error for ${url}:`, error)
    
    if (error instanceof TypeError) {
      const errorMessage = error.message.toLowerCase()
      if (errorMessage.includes('fetch failed') || errorMessage.includes('network')) {
        throw new Error(
          `Network error: Unable to connect to ${url}. This could be due to:\n` +
          `- SSL/TLS certificate issues\n` +
          `- Network connectivity problems\n` +
          `- The server blocking automated requests\n` +
          `- CORS or firewall restrictions\n\n` +
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
    contentType = 'auto',
    outputFormat = 'markdown' // Default to markdown
  } = options

  try {
    const cleanedHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+hidden[^>]*>[\s\S]*?<\/[^>]+>/gi, '')
      .replace(/<div[^>]*(?:ad-|ads-|advertisement|tracking|cookie|banner)[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/\s+/g, ' ')
      .trim()

    console.log(`📄 Cleaned HTML size: ${cleanedHtml.length} (original: ${html.length})`)

    const formatInstructions = outputFormat === 'markdown' 
      ? `Format the content in clean, readable MARKDOWN:
- Use # for main title, ## for sections, ### for subsections
- Use **bold** for emphasis and *italic* for secondary emphasis
- Use \`code\` for inline code and \`\`\`language blocks for code examples
- Use > for blockquotes
- Use - or * for unordered lists, 1. for ordered lists
- Use [text](url) for links
- Preserve all code blocks with proper language tags
- Use --- for horizontal rules between major sections
- Format tables using markdown table syntax if present`
      : `Format the content as clean, semantic HTML:
- Use proper heading tags: <h1> for title, <h2> for sections, <h3> for subsections
- Use <p> for paragraphs
- Use <strong> for bold, <em> for italic
- Use <code> for inline code and <pre><code class="language-x"> for code blocks
- Use <blockquote> for quotes
- Use <ul>/<ol> with <li> for lists
- Use <a href=""> for links
- Use <hr> for horizontal rules between major sections
- Wrap everything in semantic tags, NO bare text`

    const prompt = `
You are an expert web content extractor. Your task is to extract ALL meaningful content from the provided HTML and format it properly.

URL: ${url}

CRITICAL INSTRUCTIONS:
1. Extract EVERYTHING that is actual content - articles, documentation, tutorials, code examples, etc.
2. Do NOT truncate or summarize the main content - preserve it completely
3. Remove only: navigation menus, advertisements, cookie banners, sidebar links, footer links
4. KEEP: All paragraphs, all headings, all lists, all code blocks, all important text
5. ${formatInstructions}
6. For documentation/tutorial pages: include ALL code examples with proper syntax highlighting
7. For articles: include the complete article text with proper formatting
8. Maintain the logical structure and hierarchy
9. Extract metadata if available (author, date, description)
10. ${extractKeyTopics ? 'Identify 8-15 key topics covering all main themes' : 'Skip topics'}
11. ${summarize ? 'Create a comprehensive 3-5 sentence summary' : 'Skip summary'}

HTML Content (cleaned):
${cleanedHtml.substring(0, 150000)}

Respond with a JSON object where the "content" field contains properly formatted ${outputFormat.toUpperCase()}:
{
  "title": "Page title",
  "content": "COMPLETE ${outputFormat} formatted content - do not truncate",
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

CRITICAL: The content field must be valid ${outputFormat.toUpperCase()} with proper formatting. Include ALL content from the page.
`

    const result = await generateText({
      model: openai('gpt-4o'),
      prompt,
      temperature: 0.1,
    })

    let parsedResult: any
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : result.text;
      parsedResult = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      console.error('AI Response:', result.text)
      
      // Fallback: return the raw response formatted as markdown
      return {
        title: html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || 'Untitled Page',
        content: result.text.substring(0, maxContentLength),
        contentFormat: outputFormat,
        url,
        summary: 'Content extracted from web page',
        keyTopics: [],
        contentType: 'general',
        wordCount: result.text.split(/\s+/).length,
        extractedAt: new Date(),
        metadata: {}
      }
    }

    const scrapedContent: ScrapedContent = {
      title: parsedResult.title || 'Untitled Page',
      content: parsedResult.content || '',
      contentFormat: outputFormat,
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
      
      const errorMessage = lastError.message.toLowerCase()
      if (
        errorMessage.includes('http 404') ||
        errorMessage.includes('http 403') ||
        errorMessage.includes('not return html')
      ) {
        throw lastError
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
    
    const { html, title } = await retryWithBackoff(
      () => fetchPageContent(url),
      3,
      1000
    )
    console.log(`✅ Fetched HTML content, title: ${title}`)
    
    const scrapedContent = await extractContentWithAI(html, url, options)
    console.log(`✅ Successfully extracted ${scrapedContent.contentFormat} content: ${scrapedContent.wordCount} words`)
    
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
 * Extract text content for document processing (strips formatting)
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

/**
 * Helper to convert markdown to HTML if needed
 */
export function convertMarkdownToHtml(markdown: string): string {
  // Basic markdown to HTML conversion
  // For production, use a library like 'marked' or 'markdown-it'
  return markdown
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, '<p>$1</p>')
}