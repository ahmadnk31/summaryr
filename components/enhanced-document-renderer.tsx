"use client"

import { useState, useRef, useEffect } from "react"
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
import { TextSelectionToolbar } from "@/components/text-selection-toolbar"
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
  onCreateFlashcard: (text: string) => void
  onCreateQuestion: (text: string) => void
  onSummarize: (text: string) => void
  onExplain: (text: string) => void
  onCreateNote: (text: string, startOffset?: number, endOffset?: number) => void
}

export function EnhancedDocumentRenderer({ 
  document,
  onCreateFlashcard,
  onCreateQuestion,
  onSummarize,
  onExplain,
  onCreateNote
}: EnhancedDocumentRendererProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const showToolbarRef = useRef(false)

  // Keep ref in sync with state
  useEffect(() => {
    showToolbarRef.current = showToolbar
  }, [showToolbar])

  // Handle text selection
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleSelection = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = null
      }

      const selection = window.getSelection()
      const text = selection?.toString().trim()

      if (text && text.length > 0 && selection && selection.rangeCount > 0) {
        try {
          const range = selection.getRangeAt(0)
          
          // Check if selection is within our content area
          const contentElement = contentRef.current
          if (contentElement && !contentElement.contains(range.commonAncestorContainer)) {
            // Selection is outside our content, ignore it
            return
          }
          
          const rect = range.getBoundingClientRect()

          if (rect && rect.width > 0 && rect.height > 0) {
            setSelectedText(text)
            
            // Get container bounds to constrain toolbar within document viewer
            const containerElement = containerRef.current
            let containerRect: DOMRect | null = null
            
            if (containerElement) {
              containerRect = containerElement.getBoundingClientRect()
            }
            
            // Calculate position based on the selection
            let x = rect.left + rect.width / 2
            let y = rect.bottom
            
            // If we have container bounds, constrain to container
            if (containerRect) {
              const containerLeft = containerRect.left
              const containerRight = containerRect.right
              const containerTop = containerRect.top
              const containerBottom = containerRect.bottom
              
              // Clamp x to container bounds with padding
              const padding = 50
              x = Math.max(containerLeft + padding, Math.min(x, containerRight - padding))
              
              // Clamp y to container bounds
              if (y > containerBottom) {
                y = Math.min(rect.top, containerBottom - 100)
              }
              if (y < containerTop) {
                y = Math.max(rect.bottom, containerTop + 100)
              }
              
              y = Math.max(containerTop + 50, Math.min(y, containerBottom - 50))
            } else {
              // Fallback to viewport if container not found
              const viewportWidth = window.innerWidth
              const viewportHeight = window.innerHeight
              
              x = Math.max(50, Math.min(x, viewportWidth - 50))
              
              if (y > viewportHeight) {
                y = Math.min(rect.top, viewportHeight - 100)
              }
              if (y < 0) {
                y = Math.max(rect.bottom, 100)
              }
            }
            
            setToolbarPosition({ x, y })
            setShowToolbar(true)
          } else if (text.length > 0) {
            setSelectedText(text)
            if (!showToolbarRef.current) {
              setShowToolbar(true)
            }
          }
        } catch (error) {
          if (text && text.length > 0) {
            setSelectedText(text)
            if (!showToolbarRef.current) {
              setShowToolbar(true)
            }
          } else {
            setShowToolbar(false)
            setSelectedText("")
          }
        }
      } else {
        // Only hide if we're really losing selection
        hideTimeoutRef.current = setTimeout(() => {
          const currentSelection = window.getSelection()
          const currentText = currentSelection?.toString().trim()
          if (!currentText || currentText.length === 0 || !currentSelection || currentSelection.rangeCount === 0) {
            setShowToolbar(false)
            setSelectedText("")
          }
        }, 150)
      }
    }

    globalThis.document.addEventListener("selectionchange", handleSelection)
    return () => {
      globalThis.document.removeEventListener("selectionchange", handleSelection)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  // Toolbar action handlers
  const handleCreateFlashcard = () => {
    onCreateFlashcard(selectedText)
    // Delay hiding toolbar and clearing selection to allow dialog to open
    setTimeout(() => {
      setShowToolbar(false)
      window.getSelection()?.removeAllRanges()
    }, 100)
  }

  const handleCreateQuestion = () => {
    onCreateQuestion(selectedText)
    setTimeout(() => {
      setShowToolbar(false)
      window.getSelection()?.removeAllRanges()
    }, 100)
  }

  const handleSummarize = () => {
    onSummarize(selectedText)
    setTimeout(() => {
      setShowToolbar(false)
      window.getSelection()?.removeAllRanges()
    }, 100)
  }

  const handleExplain = () => {
    onExplain(selectedText)
    setTimeout(() => {
      setShowToolbar(false)
      window.getSelection()?.removeAllRanges()
    }, 100)
  }

  const handleCreateNote = () => {
    const selection = window.getSelection()
    if (selection && contentRef.current) {
      const range = selection.getRangeAt(0)
      const preSelectionRange = range.cloneRange()
      preSelectionRange.selectNodeContents(contentRef.current)
      preSelectionRange.setEnd(range.startContainer, range.startOffset)
      const start = preSelectionRange.toString().length
      const end = start + selectedText.length

      onCreateNote(selectedText, start, end)
    } else {
      onCreateNote(selectedText)
    }
    setTimeout(() => {
      setShowToolbar(false)
      window.getSelection()?.removeAllRanges()
    }, 100)
  }
  
  const isWeb = isWebDocument(document)
  const webInfo = isWeb && document.extracted_text ? formatWebDocumentInfo(document.extracted_text) : null
  const content = webInfo?.content || document.extracted_text || 'No content available'

  const handleViewRendered = async () => {
    window.open(`/api/documents/${document.id}/render`, '_blank', 'noopener,noreferrer')
  }

  const handleDownloadPDF = async () => {
    setIsLoading(true)
    try {
      // Fetch the HTML content from the server
      const response = await fetch(`/api/documents/${document.id}/render?format=html`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`)
      }

      const html = await response.text()
      
      // Open a new window with the HTML content for printing/saving as PDF
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Pop-up blocked. Please allow pop-ups and try again.')
      }
      
      // Write the HTML content with print-specific styles
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${document.title || document.file_name || 'Document'}</title>
            <style>
              @media print {
                body { margin: 0; padding: 20mm; }
                @page { margin: 20mm; }
              }
            </style>
          </head>
          <body>
            ${html}
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    } catch (error) {
      console.error('PDF download error:', error)
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    // Print the current page directly without opening a new tab
    window.print()
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
    <>
      <Card ref={containerRef} className="h-full overflow-x-auto w-full max-w-4xl mx-auto sm:rounded-lg shadow-sm bg-background">
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 mb-2">
                {isWeb ? (
                  <>
                    <ExternalLink className="h-5 w-5 text-blue-500" />
                    <span className="truncate overflow-x-auto block max-w-full">
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
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
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
              <div className="mt-3 space-y-2 max-w-full break-words">
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
                
                <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-muted-foreground">
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
                    <p className="text-xs sm:text-sm font-medium mb-2">Key Topics</p>
                    <div className="flex flex-wrap gap-1 overflow-x-auto max-w-full">
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
          <div className="flex flex-row flex-wrap items-center gap-2 ml-0 sm:ml-4 mt-4 sm:mt-0">
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

  <CardContent className="pt-0 max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-16rem)] overflow-y-auto">
        <div className="border-t mb-6" />
        {/* Rendered content */}
        <div
          ref={contentRef}
          className="max-w-full sm:max-w-none select-text text-xs sm:text-base leading-relaxed break-words"
          style={{ userSelect: "text" }}
        >
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
              <div className="space-y-4 sm:space-y-6">
                {/* Render metadata sections first */}
                {metadataSections.length > 0 && (
                  <div className="space-y-2 sm:space-y-4">
                    {metadataSections.map((section, index) => {
                      if (section.content.match(/^(Title|Author|Published|Key Topics):/i)) {
                        const [label, ...rest] = section.content.split(':')
                        return (
                          <div key={index} className="flex gap-2 text-xs sm:text-sm flex-wrap">
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
                          <div key={index} className="p-2 sm:p-4 bg-muted/30 rounded-lg border">
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
                      <h3 className="text-base sm:text-lg font-semibold text-primary border-b pb-2 mb-4">
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

    {showToolbar && (
      <TextSelectionToolbar
        selectedText={selectedText}
        position={toolbarPosition}
        containerRef={containerRef as React.RefObject<HTMLElement>}
        onCreateFlashcard={handleCreateFlashcard}
        onCreateQuestion={handleCreateQuestion}
        onSummarize={handleSummarize}
        onExplain={handleExplain}
        onCreateNote={handleCreateNote}
      />
    )}
  </>
  )
}
