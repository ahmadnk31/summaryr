# Document Rendering Enhancement

This document explains how the enhanced document rendering system works with AWS Textract structured output.

## Overview

The enhanced document viewer properly renders structured text extracted by AWS Textract, including:

- ✅ **Structured Paragraphs** - Properly spaced text blocks
- ✅ **Page Breaks** - Visual separators between pages
- ✅ **Tables** - HTML tables rendered from ASCII table format
- ✅ **Headings** - Automatic heading detection and styling
- ✅ **Responsive Design** - Tables scroll horizontally on mobile

## Components

### FormattedDocumentContent

Located in: `components/formatted-document-content.tsx`

This component parses and renders structured text with the following features:

#### 1. Page Break Detection

Detects page break markers in format:
```
--- Page Break ---
```

Renders as:
```tsx
<div className="my-8 flex items-center gap-4">
  <div className="flex-1 h-px bg-border" />
  <span className="text-xs text-muted-foreground">Page 2</span>
  <div className="flex-1 h-px bg-border" />
</div>
```

#### 2. Table Detection

Detects tables in ASCII format:
```
Table 1: Employee Information
| Name     | Department | Salary |
|----------|------------|--------|
| John Doe | Engineering| $75000 |
| Jane Doe | Marketing  | $65000 |
```

Renders as HTML table with:
- Table title (if present)
- Styled header row with uppercase text
- Hover effects on rows
- Proper borders and spacing
- Horizontal scroll on small screens

#### 3. Heading Detection

Automatically detects headings based on patterns:
- ALL CAPS text (< 100 chars)
- Numbered sections: "1. Introduction"
- Chapter/Section markers: "Chapter 1", "Section 2"
- Title Case without punctuation

Renders as `<h2>` with larger font size and proper spacing.

#### 4. Regular Paragraphs

All other text is rendered as paragraphs with:
- Proper line breaks preserved (`whitespace-pre-wrap`)
- Responsive text sizes (sm → base → lg)
- Leading relaxed for better readability
- Word breaking for long words

## How It Works

### Parsing Flow

```
1. Split by page breaks
   └─→ For each page:
       2. Split by table markers
          └─→ For each section:
              3. Check if section is a table
                 ├─→ YES: Parse and render as HTML table
                 └─→ NO: Split into paragraphs
                         └─→ For each paragraph:
                             4. Check if heading
                                ├─→ YES: Render as <h2>
                                └─→ NO: Render as <p>
       5. Add page break indicator (if not last page)
```

### Table Parsing Algorithm

```typescript
1. Detect lines starting with '|' character
2. Extract table title (line before first '|')
3. Split each line by '|' delimiter
4. Filter out separator lines (containing only -, |, spaces)
5. First remaining line = header row
6. Subsequent lines = data rows
7. Render as <table> with proper styling
```

## Integration

### Before (Plain Text)

```tsx
{doc.extracted_text.split("\n\n").map((paragraph, index) => (
  <p key={index}>{paragraph}</p>
))}
```

Problems:
- Tables render as plain text with pipe characters
- No page break indicators
- No heading detection
- No table borders or styling

### After (Formatted)

```tsx
<FormattedDocumentContent text={doc.extracted_text} />
```

Benefits:
- ✅ Tables render as proper HTML tables
- ✅ Page breaks show as visual dividers
- ✅ Headings automatically styled
- ✅ Responsive and accessible
- ✅ Maintains text selection functionality

## Styling

The component uses Tailwind CSS with theme-aware classes:

- **Tables**: `border-border`, `bg-muted`, `bg-background`
- **Text**: `text-foreground`, `text-muted-foreground`
- **Spacing**: Consistent margins (`my-6`, `mb-4`, `mt-8`)
- **Typography**: Prose classes for readability
- **Responsive**: Text sizes scale up on larger screens

## Limitations & Notes

### What IS Preserved

- ✅ Document structure (paragraphs, pages)
- ✅ Tables with rows and columns
- ✅ Text content and hierarchy
- ✅ Basic formatting (headings, paragraphs)

### What IS NOT Preserved

- ❌ **Background colors** - Text extraction is inherently unformatted
- ❌ **Font colors** - Only available in visual PDF rendering
- ❌ **Font styles** - Bold, italic, underline not preserved
- ❌ **Images** - Text extraction only
- ❌ **Layout** - Multi-column layouts become single column
- ❌ **Complex formatting** - Drop caps, text boxes, etc.

### Why Background Colors Can't Be Extracted

AWS Textract is a **text extraction** service, not a visual PDF renderer. It:

1. Analyzes text blocks, lines, and words
2. Detects tables and form fields
3. Provides bounding boxes and confidence scores
4. Returns **plain text content** with structure

To preserve colors and visual formatting, you would need:
- PDF.js for visual rendering
- Canvas-based PDF viewer
- Trade-off: Larger bundle size, no text selection/indexing

## Usage Example

```tsx
import { FormattedDocumentContent } from "@/components/formatted-document-content"

function MyDocumentViewer({ document }) {
  return (
    <div className="p-4">
      <FormattedDocumentContent text={document.extracted_text} />
    </div>
  )
}
```

## Testing

To test the enhanced rendering:

1. Upload a document with tables
2. Ensure AWS Textract is configured (see `AWS_TEXTRACT_SETUP.md`)
3. View the document in the Documents tab
4. Verify:
   - Tables render as HTML tables
   - Page breaks show visual separators
   - Headings are larger and bold
   - Text selection still works

## Future Enhancements

Possible improvements:

- [ ] Detect and render lists (bullets, numbered)
- [ ] Merge cells in tables
- [ ] Column span/row span support
- [ ] Code block detection and syntax highlighting
- [ ] Image placeholders for extracted image regions
- [ ] Export to formatted PDF or DOCX
- [ ] Custom table themes
- [ ] Print-optimized view

## Related Files

- `components/formatted-document-content.tsx` - Main renderer
- `components/document-viewer.tsx` - Document viewer wrapper
- `lib/aws-textract.ts` - Text extraction with structure
- `app/actions/process-document.ts` - Document processing
- `AWS_TEXTRACT_SETUP.md` - Textract configuration
- `DOCUMENT_STRUCTURE_PRESERVATION.md` - How structure is preserved

## Support

If tables are not rendering correctly:

1. Check that document uses Textract extraction (not unpdf)
2. Verify AWS credentials are configured
3. Check browser console for errors
4. Ensure document contains actual tables
5. Test with a known table-containing PDF

For issues with text selection:

1. Verify `userSelect: "text"` is set on container
2. Check that TextSelectionToolbar is mounted
3. Ensure no overlapping click handlers
