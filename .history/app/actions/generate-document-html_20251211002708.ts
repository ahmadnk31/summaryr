"use server"

import { createClient } from "@/lib/supabase/server"
import { getDocumentContent } from "./get-document-content"
import { isWebDocument, formatWebDocumentInfo } from "@/lib/web-document-helpers"
import { marked } from 'marked'

// Configure marked for better HTML output
marked.setOptions({
  breaks: true,
  gfm: true
})

// Helper function to detect if content is markdown
function isMarkdownContent(content: string): boolean {
  if (!content || content.length < 50) return false
  
  const markdownPatterns = [
    /^#{1,6}\s+.+$/m, // Headers
    /\*\*[^*]+\*\*/g, // Bold
    /\*[^*]+\*/g, // Italic (but not alone)
    /`[^`]+`/g, // Inline code
    /```[\s\S]*?```/g, // Code blocks
    /^\s*[-*+]\s+.+$/m, // Lists
    /^\s*\d+\.\s+.+$/m, // Numbered lists
    /\[.+?\]\(.+?\)/g, // Links
    /^\s*>.+$/m // Blockquotes
  ]
  
  // Count how many markdown patterns are found
  let patternCount = 0
  const foundPatterns: string[] = []
  for (let i = 0; i < markdownPatterns.length; i++) {
    const pattern = markdownPatterns[i]
    if (pattern.test(content)) {
      patternCount++
      foundPatterns.push(['Headers', 'Bold', 'Italic', 'Inline code', 'Code blocks', 'Lists', 'Numbered lists', 'Links', 'Blockquotes'][i])
    }
  }
  
  // Consider it markdown if we find 2+ patterns, or if it has clear structural markdown
  const hasStructuralMarkdown = /^#{1,6}\s+.+$/m.test(content) || /```[\s\S]*?```/g.test(content)
  
  console.log(`🔍 Markdown detection: ${patternCount} patterns found (${foundPatterns.join(', ')}), structural: ${hasStructuralMarkdown}`)
  
  return patternCount >= 2 || hasStructuralMarkdown
}

// Helper function to preprocess content to ensure proper markdown structure
function preprocessMarkdown(content: string): string {
  const lines = content.split('\n')
  const processed: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Skip empty lines
    if (!trimmed) {
      processed.push(line)
      continue
    }
    
    // If first line looks like a title, make it H1
    if (i === 0 && trimmed.length > 10 && trimmed.length < 120 && !trimmed.match(/^#{1,6}\s/)) {
      processed.push(`# ${trimmed}`)
      continue
    }
    
    // Convert lines that look like headers but aren't markdown
    // E.g., "Quick Start Example:" or "What's Happening"
    if (trimmed.match(/^[A-Z][^.!?]*:?\s*$/) && trimmed.length < 100 && !trimmed.match(/^#{1,6}\s/)) {
      // Check if next line is also short (could be continuation)
      const nextLine = lines[i + 1]?.trim()
      if (!nextLine || nextLine.length > 50) {
        processed.push(`### ${trimmed}`)
        continue
      }
    }
    
    // Preserve lines that already have markdown syntax
    processed.push(line)
  }
  
  return processed.join('\n')
}

// Helper function to render markdown to HTML
function renderMarkdownToHtml(content: string): string {
  try {
    // Preprocess to enhance markdown structure
    const preprocessed = preprocessMarkdown(content)
    
    const result = marked(preprocessed)
    // Handle both sync and async returns
    let html = typeof result === 'string' ? result : preprocessed.replace(/\n/g, '<br>')
    
    // Clean up the HTML to ensure proper structure
    html = html
      .trim()
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/<p>\s*<\/p>/g, '') // Remove empty paragraphs
    
    console.log('📄 Markdown rendered to HTML:', {
      inputLength: content.length,
      outputLength: html.length,
      wasPreprocessed: content !== preprocessed,
      hasHeaders: html.includes('<h1>') || html.includes('<h2>'),
      hasParagraphs: html.includes('<p>'),
      hasLists: html.includes('<ul>') || html.includes('<ol>'),
      hasCode: html.includes('<code>') || html.includes('<pre>'),
      preview: html.substring(0, 300)
    })
    return html
  } catch (error) {
    console.error('❌ Error rendering markdown:', error)
    // Fallback to plain text with line breaks
    return content.replace(/\n/g, '<br>')
  }
}

/**
 * Generate a well-formatted HTML for PDF rendering of web content
 */
function generatePDFHTML(content: string, metadata: any): string {
  console.log('🔍 generatePDFHTML called with:', {
    contentLength: content?.length || 0,
    hasMetadata: !!metadata,
    metadataKeys: metadata ? Object.keys(metadata) : []
  })
  
  const isWeb = metadata?.sourceUrl
  const webInfo = isWeb ? formatWebDocumentInfo(content) : null
  
  let cleanContent = webInfo?.content || content || 'No content available'
  
  console.log('📝 Content after formatting:', {
    cleanContentLength: cleanContent.length,
    isWeb,
    hasWebInfo: !!webInfo
  })
  
  // Separate metadata and main content
  let mainContent = cleanContent
  let metadataSection = ''
  
  if (webInfo?.content) {
    // For web content, extract metadata and main content
    const lines = cleanContent.split('\n')
    const contentStartIndex = lines.findIndex(line => 
      line.includes('Main Content:') || 
      (!line.match(/^(Title|Author|Published|Summary|Key Topics):/i) && line.trim().length > 50)
    )
    
    if (contentStartIndex > 0) {
      // Extract metadata lines
      const metadataLines = lines.slice(0, contentStartIndex)
        .filter(line => line.match(/^(Title|Author|Published|Summary|Key Topics):/i))
      
      metadataSection = metadataLines
        .map(line => {
          const [label, ...rest] = line.split(':')
          return `<div class="metadata-field">
            <strong>${label.trim()}:</strong> ${rest.join(':').trim()}
          </div>`
        })
        .join('\n')
      
      // Extract main content (skip "Main Content:" header if present)
      let contentLines = lines.slice(contentStartIndex)
      if (contentLines[0] && contentLines[0].includes('Main Content:')) {
        contentLines = contentLines.slice(1)
      }
      mainContent = contentLines.join('\n').trim()
    }
  }
  
  // Check if main content should be rendered as markdown
  const isMarkdown = isMarkdownContent(mainContent)
  const shouldRenderAsMarkdown = isMarkdown && mainContent.length > 100
  
  console.log('🎨 Markdown detection:', {
    contentLength: mainContent.length,
    isMarkdown,
    shouldRenderAsMarkdown,
    hasMetadataSection: !!metadataSection,
    preview: mainContent.substring(0, 500)
  })
  
  console.log('📋 Raw content structure:', {
    firstLines: mainContent.split('\n').slice(0, 10),
    hasMarkdownSyntax: {
      headers: /^#{1,6}\s+/m.test(mainContent),
      bold: /\*\*[^*]+\*\*/g.test(mainContent),
      lists: /^\s*[-*+]\s+/m.test(mainContent),
      code: /```/g.test(mainContent)
    }
  })
  
  // Format the main content
  const markdownHtml = shouldRenderAsMarkdown ? renderMarkdownToHtml(mainContent) : null
  const formattedContent = shouldRenderAsMarkdown 
    ? `<div class="markdown-content">${markdownHtml}</div>`
    : mainContent
        .split('\n\n')
        .filter(paragraph => paragraph.trim().length > 0)
        .map(paragraph => `<p class="content-paragraph">${paragraph.trim()}</p>`)
        .join('\n')
  
  console.log('✅ Generated formatted content:', {
    formattedContentLength: formattedContent.length,
    isMarkdown: shouldRenderAsMarkdown,
    htmlPreview: formattedContent.substring(0, 500)
  })
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${webInfo?.displayTitle || 'Document'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: white;
    }
    
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .title {
      font-size: 28px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 10px;
      line-height: 1.3;
    }
    
    .source-info {
      font-size: 14px;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .source-url {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }
    
    .metadata-section {
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 30px 0;
      border-radius: 0 8px 8px 0;
    }
    
    .metadata-field {
      margin-bottom: 12px;
      font-size: 14px;
    }
    
    .metadata-field strong {
      color: #1e40af;
      display: inline-block;
      min-width: 100px;
    }
    
    .main-content-header {
      margin: 40px 0 20px 0;
    }
    
    .main-content-header h2 {
      font-size: 20px;
      color: #1e40af;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
    }
    
    .content-paragraph {
      margin-bottom: 16px;
      font-size: 15px;
      line-height: 1.7;
      text-align: justify;
    }
    
    /* Markdown Content Styles - Apply to both .markdown-content and .content for broader coverage */
    .markdown-content, .content {
      font-size: 15px;
      line-height: 1.7;
    }
    
    /* Headers - target both inside markdown-content and standalone */
    h1, h2, h3, h4, h5, h6,
    .markdown-content h1, .markdown-content h2, .markdown-content h3, 
    .markdown-content h4, .markdown-content h5, .markdown-content h6,
    .content h1, .content h2, .content h3, .content h4, .content h5, .content h6 {
      color: #1e40af !important;
      font-weight: 700 !important;
      margin-top: 24px !important;
      margin-bottom: 12px !important;
      line-height: 1.3 !important;
    }
    
    h1, .markdown-content h1, .content h1 { 
      font-size: 28px !important; 
      border-bottom: 3px solid #e5e7eb !important; 
      padding-bottom: 12px !important; 
      margin-bottom: 16px !important;
    }
    h2, .markdown-content h2, .content h2 { 
      font-size: 22px !important; 
      border-bottom: 2px solid #f1f5f9 !important; 
      padding-bottom: 8px !important;
    }
    h3, .markdown-content h3, .content h3 { font-size: 19px !important; }
    h4, .markdown-content h4, .content h4 { font-size: 16px !important; }
    
    /* Paragraphs */
    p, .markdown-content p, .content p {
      margin-bottom: 16px !important;
      line-height: 1.8 !important;
    }
    
    /* Lists */
    ul, ol, .markdown-content ul, .markdown-content ol, .content ul, .content ol {
      margin: 16px 0 !important;
      padding-left: 32px !important;
      line-height: 1.8 !important;
    }
    
    li, .markdown-content li, .content li {
      margin-bottom: 8px !important;
    }
    
    /* Blockquotes */
    blockquote, .markdown-content blockquote, .content blockquote {
      border-left: 4px solid #3b82f6 !important;
      background: #f8fafc !important;
      margin: 20px 0 !important;
      padding: 16px 24px !important;
      font-style: italic !important;
      color: #4b5563 !important;
    }
    
    /* Code - inline */
    code, .markdown-content code, .content code {
      background: #f1f5f9 !important;
      padding: 3px 8px !important;
      border-radius: 4px !important;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace !important;
      font-size: 13px !important;
      color: #1e40af !important;
      border: 1px solid #e2e8f0 !important;
    }
    
    /* Code blocks */
    pre, .markdown-content pre, .content pre {
      background: #1e293b !important;
      border: 1px solid #334155 !important;
      border-radius: 8px !important;
      padding: 20px !important;
      margin: 20px 0 !important;
      overflow-x: auto !important;
    }
    
    pre code, .markdown-content pre code, .content pre code {
      background: transparent !important;
      padding: 0 !important;
      color: #e2e8f0 !important;
      font-size: 13px !important;
      border: none !important;
      display: block !important;
      white-space: pre !important;
    }
    
    /* Tables */
    table, .markdown-content table, .content table {
      border-collapse: collapse !important;
      width: 100% !important;
      margin: 20px 0 !important;
      border: 1px solid #e2e8f0 !important;
    }
    
    th, td, .markdown-content th, .markdown-content td, .content th, .content td {
      border: 1px solid #e2e8f0 !important;
      padding: 12px 16px !important;
      text-align: left !important;
    }
    
    th, .markdown-content th, .content th {
      background: #f8fafc !important;
      font-weight: 700 !important;
      color: #1e40af !important;
    }
    
    /* Links */
    a, .markdown-content a, .content a {
      color: #2563eb !important;
      text-decoration: underline !important;
      font-weight: 500 !important;
    }
    
    /* Horizontal rules */
    hr, .markdown-content hr, .content hr {
      border: none !important;
      border-top: 2px solid #e5e7eb !important;
      margin: 32px 0 !important;
    }
    
    /* Bold */
    strong, b, .markdown-content strong, .markdown-content b, .content strong, .content b {
      font-weight: 700 !important;
      color: #1f2937 !important;
    }
    
    /* Italic */
    em, i, .markdown-content em, .markdown-content i, .content em, .content i {
      font-style: italic !important;
      color: #4b5563 !important;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .source-url {
        color: #333 !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${webInfo?.displayTitle || 'Document'}</h1>
    ${webInfo?.metadata?.sourceUrl ? `
      <div class="source-info">
        🌐 <a href="${webInfo.metadata.sourceUrl}" class="source-url">${webInfo.metadata.sourceUrl}</a>
      </div>
    ` : ''}
  </div>
  
  ${webInfo?.metadata ? `
    <div class="metadata-section">
      ${webInfo.metadata.author ? `<div class="metadata-field"><strong>Author:</strong> ${webInfo.metadata.author}</div>` : ''}
      ${webInfo.metadata.publishedDate ? `<div class="metadata-field"><strong>Published:</strong> ${webInfo.metadata.publishedDate}</div>` : ''}
      ${webInfo.metadata.wordCount ? `<div class="metadata-field"><strong>Word Count:</strong> ${webInfo.metadata.wordCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} words</div>` : ''}
      ${webInfo.metadata.summary ? `<div class="metadata-field"><strong>Summary:</strong> ${webInfo.metadata.summary}</div>` : ''}
      ${webInfo.metadata?.keyTopics && webInfo.metadata.keyTopics.length > 0 ? `<div class="metadata-field"><strong>Key Topics:</strong> ${webInfo.metadata.keyTopics.join(', ')}</div>` : ''}
    </div>
  ` : metadataSection ? `<div class="metadata-section">${metadataSection}</div>` : ''}
  
  <div class="content">
    ${formattedContent}
  </div>
  
  <div class="footer">
    Generated on ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })} | SummaryR Document Export
  </div>
</body>
</html>`
}

/**
 * Generate formatted HTML for document rendering and PDF export
 */
export async function generateDocumentHTML(documentId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized", html: null }
    }

    // Get document content
    const { content, document, error } = await getDocumentContent(documentId)

    if (error || !document) {
      return { error: error || "Document not found", html: null }
    }

    // Generate HTML
    const html = generatePDFHTML(content || '', {
      sourceUrl: isWebDocument(document) ? document.source_url || 'web' : null,
      title: document.title,
      fileType: document.file_type
    })

    return { 
      html, 
      error: null,
      document: {
        title: document.title,
        fileName: document.file_name,
        isWeb: isWebDocument(document)
      }
    }

  } catch (error) {
    console.error("Error generating document HTML:", error)
    return { 
      error: error instanceof Error ? error.message : "Unknown error",
      html: null 
    }
  }
}
