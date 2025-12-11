"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ExternalLink, 
  Calendar, 
  User, 
  Hash, 
  FileText, 
  Download,
  Eye,
  Printer
} from "lucide-react"
import { isWebDocument, formatWebDocumentInfo } from "@/lib/web-document-helpers"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import type { Document } from "@/lib/types"

// Helper function to format numbers consistently (avoiding hydration mismatch)
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Helper function to detect if content is markdown
const isMarkdownContent = (content: string): boolean => {
  // Simple heuristics to detect markdown
  const markdownPatterns = [
    /^#{1,6}\s+.+$/m, // Headers
    /\*\*[^*]+\*\*/g, // Bold
    /\*[^*]+\*/g, // Italic
    /`[^`]+`/g, // Inline code
    /```[\s\S]*?```/g, // Code blocks
    /^\s*[-*+]\s+/m, // Lists
    /^\s*\d+\.\s+/m, // Numbered lists
    /\[.+\]\(.+\)/g, // Links
    /^\s*>.+$/m // Blockquotes
  ]
  
  return markdownPatterns.some(pattern => pattern.test(content))
}

interface EnhancedDocumentRendererProps {
  document: Document
}

export function EnhancedDocumentRenderer({ document }: EnhancedDocumentRendererProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const isWeb = isWebDocument(document)
  const webInfo = isWeb && document.extracted_text ? formatWebDocumentInfo(document.extracted_text) : null
  const content = webInfo?.content || document.extracted_text || 'No content available'

  const handleViewRendered = async () => {
    window.open(`/api/documents/${document.id}/render`, '_blank', 'noopener,noreferrer')
  }

  const handleDownloadPDF = async () => {
    setIsLoading(true)
    try {
      // First try to download the PDF from the server
      const response = await fetch(`/api/documents/${document.id}/render?format=pdf`)
      
      if (response.ok) {
        // If server PDF generation worked, download it
        const blob = await response.blob()
        const url = globalThis.window.URL.createObjectURL(blob)
        const link = globalThis.document.createElement('a')
        link.href = url
        link.download = `${document.title || document.file_name || 'document'}.pdf`
        globalThis.document.body.appendChild(link)
        link.click()
        globalThis.document.body.removeChild(link)
        globalThis.window.URL.revokeObjectURL(url)
      } else {
        // If server PDF generation failed, fall back to client-side print
        console.warn('Server PDF generation failed, opening print dialog')
        const printWindow = globalThis.window.open(`/api/documents/${document.id}/render?format=html`, '_blank', 'noopener,noreferrer')
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print()
          }
        }
      }
    } catch (error) {
      console.error('PDF download error:', error)
      // Fallback to print dialog
      const printWindow = globalThis.window.open(`/api/documents/${document.id}/render?format=html`, '_blank', 'noopener,noreferrer')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = async () => {
    const printWindow = window.open(`/api/documents/${document.id}/render?format=html`, '_blank', 'noopener,noreferrer')
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  // Parse content into sections while preserving markdown structure
  const parseContentSections = (text: string) => {
    const sections: { type: 'metadata' | 'content', content: string }[] = []
    const lines = text.split('\n')
    
    let currentSection = ''
    let inMainContent = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()
      
      // Check for metadata fields at the beginning
      if (trimmedLine.match(/^(Title|Author|Published|Summary|Key Topics):/i) && !inMainContent) {
        if (currentSection.trim()) {
          sections.push({ type: 'metadata', content: currentSection.trim() })
          currentSection = ''
        }
        sections.push({ type: 'metadata', content: trimmedLine })
      }
      // Check for main content marker
      else if (trimmedLine.includes('Main Content:')) {
        if (currentSection.trim()) {
          sections.push({ type: 'metadata', content: currentSection.trim() })
        }
        currentSection = ''
        inMainContent = true
      }
      // Collect main content (preserve original formatting for markdown)
      else if (inMainContent || (!trimmedLine.match(/^(Title|Author|Published|Summary|Key Topics):/i) && trimmedLine.length > 0)) {
        inMainContent = true
        currentSection += line + '\n'
      }
    }
    
    // Add final section
    if (currentSection.trim()) {
      sections.push({ type: inMainContent ? 'content' : 'metadata', content: currentSection.trim() })
    }
    
    return sections
  }

  const contentSections = parseContentSections(content)

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 mb-2">
              {isWeb ? (
                <>
                  <ExternalLink className="h-5 w-5 text-blue-500" />
                  <span className="truncate">
                    {webInfo?.displayTitle || document.title || 'Web Content'}
                  </span>
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="truncate">{document.title || document.file_name}</span>
                </>
              )}
            </CardTitle>
            
            {/* Document metadata */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">
                {isWeb ? 'Web Page' : document.file_type.toUpperCase()}
              </Badge>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(document.upload_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              {webInfo?.metadata?.wordCount && (
                <>
                  <span>•</span>
                  <span>{formatNumber(webInfo.metadata.wordCount)} words</span>
                </>
              )}
            </div>

            {/* Web-specific metadata */}
            {isWeb && webInfo?.metadata && (
              <div className="mt-3 space-y-2">
                {webInfo.metadata.sourceUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-3 w-3 text-blue-500" />
                    <a 
                      href={webInfo.metadata.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate max-w-md"
                    >
                      {webInfo.metadata.sourceUrl}
                    </a>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {webInfo.metadata.author && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{webInfo.metadata.author}</span>
                    </div>
                  )}
                  
                  {webInfo.metadata.contentType && (
                    <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      <span className="capitalize">{webInfo.metadata.contentType}</span>
                    </div>
                  )}
                </div>

                {webInfo.metadata.summary && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">Summary</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">{webInfo.metadata.summary}</p>
                  </div>
                )}

                {webInfo.metadata.keyTopics && webInfo.metadata.keyTopics.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Key Topics</p>
                    <div className="flex flex-wrap gap-1">
                      {webInfo.metadata.keyTopics.slice(0, 8).map((topic, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {webInfo.metadata.keyTopics.length > 8 && (
                        <Badge variant="outline" className="text-xs">
                          +{webInfo.metadata.keyTopics.length - 8} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewRendered}
              title="View formatted version"
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">View formatted</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              title="Print document"
            >
              <Printer className="h-4 w-4" />
              <span className="sr-only">Print</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isLoading}
              title="Download as PDF"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Download PDF</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="border-t mb-6" />
        
        {/* Rendered content */}
        <div className="max-w-none">
          {(() => {
            // Separate metadata and main content
            const metadataSections = contentSections.filter(section => section.type === 'metadata')
            const contentSection = contentSections.find(section => section.type === 'content')
            const mainContent = contentSection?.content || ''
            
            const hasMarkdown = isMarkdownContent(mainContent)
            
            console.log('EnhancedDocumentRenderer:', {
              totalSections: contentSections.length,
              metadataSections: metadataSections.length,
              hasContentSection: !!contentSection,
              mainContentLength: mainContent.length,
              hasMarkdown,
              contentPreview: mainContent.substring(0, 200)
            })
            
            return (
              <div className="space-y-6">
                {/* Render metadata sections first */}
                {metadataSections.length > 0 && (
                  <div className="space-y-4">
                    {metadataSections.map((section, index) => {
                      if (section.content.match(/^(Title|Author|Published|Key Topics):/i)) {
                        const [label, ...rest] = section.content.split(':')
                        return (
                          <div key={index} className="flex gap-2 text-sm">
                            <span className="font-semibold text-primary min-w-[80px]">
                              {label.trim()}:
                            </span>
                            <span className="text-muted-foreground">
                              {rest.join(':').trim()}
                            </span>
                          </div>
                        )
                      }
                      if (section.content.match(/^Summary:/i)) {
                        const [, ...rest] = section.content.split(':')
                        return (
                          <div key={index} className="p-4 bg-muted/30 rounded-lg border">
                            <h4 className="font-semibold text-primary mb-2">Summary</h4>
                            <p className="text-sm leading-relaxed">
                              {rest.join(':').trim()}
                            </p>
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                )}
                
                {/* Render main content */}
                {mainContent && (
                  <div className="mt-6">
                    <div>
                      <h3 className="text-lg font-semibold text-primary border-b pb-2 mb-4">
                        Content
                      </h3>
                      <MarkdownRenderer content={mainContent} />
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {contentSections.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No content available to display</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
