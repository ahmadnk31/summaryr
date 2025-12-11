/**
 * Enhanced web scraping with multiple extraction strategies
 */

import { scrapeWebPage, ScrapedContent, ScrapeOptions } from "./web-scraper"

/**
 * Enhanced scraping that tries multiple strategies for comprehensive content extraction
 */
export async function enhancedWebScraping(url: string, options: ScrapeOptions = {}): Promise<ScrapedContent> {
  try {
    console.log(`🌐 Starting enhanced web scraping for: ${url}`)

    // First attempt: Standard AI-powered extraction
    const primaryResult = await scrapeWebPage(url, {
      ...options,
      maxContentLength: 100000, // Very high limit
    })

    console.log(`✅ Primary extraction completed: ${primaryResult.wordCount} words`)

    // Check if we got sufficient content
    if (primaryResult.wordCount > 200) {
      return primaryResult
    }

    console.log(`⚠️ Primary extraction yielded limited content (${primaryResult.wordCount} words), trying fallback...`)

    // Fallback: More aggressive extraction prompt
    const fallbackResult = await scrapeWebPage(url, {
      ...options,
      maxContentLength: 150000,
      // Note: We could modify the web-scraper to accept custom prompts here
    })

    console.log(`✅ Fallback extraction completed: ${fallbackResult.wordCount} words`)

    // Return the result with more content
    return fallbackResult.wordCount > primaryResult.wordCount ? fallbackResult : primaryResult

  } catch (error) {
    console.error(`❌ Enhanced web scraping failed for ${url}:`, error)
    throw error
  }
}

/**
 * Pre-process HTML to improve extraction quality
 */
export function preprocessHTML(html: string): string {
  // Remove script and style tags completely
  let processed = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
  
  // Remove comments
  processed = processed.replace(/<!--[\s\S]*?-->/g, '')
  
  // Remove common non-content elements
  const nonContentSelectors = [
    'nav', 'header', 'footer', 'aside', '.sidebar', '.navigation', 
    '.menu', '.ads', '.advertisement', '.cookie', '.popup', '.modal',
    '.social-share', '.social-media', '.related-posts', '.comments'
  ]
  
  // This is a simple approach - in a real implementation you'd use a proper HTML parser
  nonContentSelectors.forEach(selector => {
    // Remove elements that are likely non-content
    const regex = new RegExp(`<${selector}[^>]*>[\\s\\S]*?<\\/${selector}>`, 'gi')
    processed = processed.replace(regex, '')
  })
  
  return processed
}

/**
 * Extract readable content using readability-style heuristics
 */
export function extractReadableContent(html: string): string {
  // This is a simplified version - you might want to use a library like mozilla/readability
  const content = html
    // Extract content from common article containers
    .match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ||
    html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ||
    html.match(/<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ||
    html.match(/<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ||
    html
  
  // Remove HTML tags and clean up
  return content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}
