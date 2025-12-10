"use client"

import React from "react"

interface FormattedDocumentContentProps {
  text: string
}

/**
 * Enhanced document content renderer that handles:
 * - Structured paragraphs
 * - Page breaks
 * - Tables (ASCII formatted from Textract)
 * - Code blocks
 * - Proper spacing and typography
 */
export function FormattedDocumentContent({ text }: FormattedDocumentContentProps) {
  const renderContent = () => {
    const elements: React.ReactNode[] = []
    
    // Split by page breaks first
    const pages = text.split(/\n\n---\s*Page\s*Break\s*---\n\n/gi)
    
    pages.forEach((pageContent, pageIndex) => {
      // Check if this page contains tables
      const tableSections = pageContent.split(/\n\n---\s*Tables?\s*---\n\n/gi)
      
      tableSections.forEach((section, sectionIndex) => {
        // Check if this section is a table
        if (isTableContent(section)) {
          elements.push(renderTable(section, `${pageIndex}-${sectionIndex}-table`))
        } else {
          // Regular text content - split into paragraphs
          const paragraphs = section.split("\n\n").filter(p => p.trim().length > 0)
          
          paragraphs.forEach((paragraph, pIndex) => {
            const trimmed = paragraph.trim()
            if (trimmed.length === 0) return
            
            // Check if paragraph looks like a heading (short, possibly ALL CAPS or Title Case)
            if (isHeading(trimmed)) {
              elements.push(
                <h2 
                  key={`${pageIndex}-${sectionIndex}-${pIndex}-h`}
                  className="text-xl sm:text-2xl font-bold mt-8 mb-4 text-foreground break-words"
                >
                  {trimmed}
                </h2>
              )
            } else {
              elements.push(
                <p 
                  key={`${pageIndex}-${sectionIndex}-${pIndex}-p`}
                  className="mb-4 leading-relaxed text-sm sm:text-base lg:text-lg text-foreground/90 break-words whitespace-pre-wrap"
                >
                  {trimmed}
                </p>
              )
            }
          })
        }
      })
      
      // Add page break indicator (except for last page)
      if (pageIndex < pages.length - 1) {
        elements.push(
          <div 
            key={`page-break-${pageIndex}`}
            className="my-8 flex items-center gap-4"
          >
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium px-3 py-1 bg-muted rounded-full">
              Page {pageIndex + 2}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )
      }
    })
    
    return elements
  }
  
  return (
    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
      {renderContent()}
    </div>
  )
}

/**
 * Check if text looks like a table (contains table borders)
 */
function isTableContent(text: string): boolean {
  const lines = text.trim().split("\n")
  // Check if we have lines with | characters (table format)
  const tableLines = lines.filter(line => line.trim().match(/^\|.*\|$/))
  return tableLines.length > 2 // At least header + separator + 1 data row
}

/**
 * Check if text looks like a heading
 */
function isHeading(text: string): boolean {
  // Short text (< 100 chars) that might be a heading
  if (text.length > 100) return false
  
  // Check for common heading patterns
  const headingPatterns = [
    /^[A-Z][A-Z\s]{2,}$/, // ALL CAPS
    /^\d+\.\s+[A-Z]/, // Numbered section like "1. Introduction"
    /^Chapter\s+\d+/i, // "Chapter 1"
    /^Section\s+\d+/i, // "Section 1"
    /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/, // Title Case without punctuation
  ]
  
  return headingPatterns.some(pattern => pattern.test(text.trim()))
}

/**
 * Render a table with proper formatting
 */
function renderTable(tableText: string, key: string): React.ReactNode {
  const lines = tableText.trim().split("\n").filter(line => line.trim().length > 0)
  
  // Extract table title if present (line before first |)
  let tableTitle = ""
  let tableStartIndex = 0
  
  if (lines[0] && !lines[0].trim().startsWith("|")) {
    tableTitle = lines[0].trim()
    tableStartIndex = 1
  }
  
  // Find the actual table rows (lines with |)
  const tableLines = lines.slice(tableStartIndex).filter(line => line.trim().startsWith("|"))
  
  if (tableLines.length < 2) {
    // Not enough lines for a table, render as regular text
    return (
      <p key={key} className="mb-4 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
        {tableText}
      </p>
    )
  }
  
  // Parse table rows
  const rows = tableLines
    .filter(line => !line.match(/^\|[-\s|]+\|$/)) // Remove separator lines
    .map(line => {
      return line
        .split("|")
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0)
    })
  
  if (rows.length === 0) return null
  
  const headerRow = rows[0]
  const dataRows = rows.slice(1)
  
  return (
    <div key={key} className="my-6 overflow-x-auto">
      {tableTitle && (
        <p className="text-sm font-semibold text-muted-foreground mb-2">
          {tableTitle}
        </p>
      )}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              {headerRow.map((cell, cellIndex) => (
                <th
                  key={`${key}-header-${cellIndex}`}
                  className="px-3 py-2 text-left text-xs font-medium text-foreground uppercase tracking-wider border-r border-border last:border-r-0"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {dataRows.map((row, rowIndex) => (
              <tr 
                key={`${key}-row-${rowIndex}`}
                className="hover:bg-muted/30 transition-colors"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${key}-cell-${rowIndex}-${cellIndex}`}
                    className="px-3 py-2 text-sm text-foreground/90 border-r border-border last:border-r-0"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
