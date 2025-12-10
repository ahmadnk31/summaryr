# Document Structure Preservation Guide

## Overview

AWS Textract now extracts text while **preserving the document's original structure**, including:
- ✅ **Paragraph breaks** - Maintains original paragraph spacing
- ✅ **Page breaks** - Clear separators between pages
- ✅ **Reading order** - Text flows in natural reading sequence
- ✅ **Vertical spacing** - Preserves spacing between sections
- ✅ **Tables** - Formatted tables with rows/columns (when enabled)
- ✅ **Layout** - Multi-column layouts handled correctly

## How Structure Preservation Works

### 1. Paragraph Detection

The system analyzes vertical spacing between lines to detect paragraphs:

```typescript
// Lines with large vertical gaps (>1.5x line height) start new paragraphs
const verticalGap = currentLineTop - previousLineBottom
const isNewParagraph = verticalGap > lineHeight * 1.5

if (isNewParagraph) {
  // Start new paragraph with double line break
  text += "\n\n"
}
```

**Example Output:**
```
This is the first paragraph with multiple lines of text
that are grouped together because they're close.

This is the second paragraph. It starts after a larger
vertical gap in the original document.

This is the third paragraph with its own spacing.
```

### 2. Page Break Markers

Multi-page documents include clear page separators:

```
Page 1 content here...

--- Page Break ---

Page 2 content here...

--- Page Break ---

Page 3 content here...
```

This helps when:
- Creating flashcards from specific pages
- Referencing original page numbers
- Understanding document flow

### 3. Reading Order

Textract automatically detects the correct reading order:
- **Top to bottom** - Respects vertical position
- **Left to right** - Within same vertical area
- **Multi-column** - Handles newspaper/magazine layouts
- **Headers/Footers** - Positioned correctly

**Example Multi-Column Layout:**
```
Header Text Across Page

Column 1 text flows     Column 2 text flows
naturally here with     naturally here with
proper ordering and     proper ordering and
spacing maintained      spacing maintained

Footer Text Across Page
```

### 4. Table Preservation (Optional)

When table detection is enabled, tables are formatted in readable ASCII format:

```
Table 1:
| Header 1         | Header 2         | Header 3         |
|------------------|------------------|------------------|
| Cell 1,1         | Cell 1,2         | Cell 1,3         |
| Cell 2,1         | Cell 2,2         | Cell 2,3         |
| Cell 3,1         | Cell 3,2         | Cell 3,3         |
```

## Configuration Options

### Basic Extraction (Default)

Preserves paragraphs and page breaks:

```typescript
// In app/actions/process-document.ts
const result = await extractTextFromPDF(uint8Array)
// Output: Structured text with paragraphs and page breaks
```

**Best for:**
- General documents
- Books and articles
- Reports and essays
- Study materials

### Advanced Extraction (With Tables)

Includes table structure:

```typescript
// To enable table detection
import { extractTextWithTables } from "@/lib/aws-textract"

const result = await extractTextWithTables(uint8Array)
// Output: Structured text + formatted tables
```

**Best for:**
- Financial reports
- Data sheets
- Scientific papers with tables
- Comparison documents

## Structure Comparison

### Before (Simple Line Extraction)

```
Line 1 of paragraph
Line 2 of paragraph
Line 3 of paragraph
Line 1 of next paragraph
Line 2 of next paragraph
A table cell
Another table cell
More table cells
```

❌ **Problems:**
- No paragraph breaks
- No page indicators
- Tables mixed with text
- Poor readability

### After (Structured Extraction)

```
Line 1 of paragraph Line 2 of paragraph
Line 3 of paragraph

Line 1 of next paragraph Line 2 of next
paragraph

--- Page Break ---

Table 1:
| Column 1    | Column 2    | Column 3    |
|-------------|-------------|-------------|
| Cell data   | Cell data   | Cell data   |
```

✅ **Benefits:**
- Clear paragraph breaks
- Page navigation
- Readable table format
- Preserved structure

## How It Helps Your Use Case

### 1. Better AI-Generated Study Materials

**Flashcards:**
- Each card references correct paragraph/section
- Page numbers help locate original content
- Better context for answers

**Questions:**
- Questions reference specific sections
- Answers include proper context
- Multi-part questions maintain structure

**Summaries:**
- Paragraph structure preserved
- Logical flow maintained
- Section breaks respected

### 2. Document Chat

When chatting with documents:
```
User: "What does the second paragraph on page 3 say?"
AI: *Finds Page 3, locates second paragraph accurately*
```

Page breaks and structure make AI responses more precise.

### 3. Text Selection for Study

When selecting text in the document viewer:
- Paragraphs stay together
- Tables remain structured
- Context is preserved

### 4. Note-Taking

Notes maintain original structure:
```
From Document (Page 2, Paragraph 3):
"The key findings show that [selected text maintains
original paragraph structure and spacing]"
```

## Advanced Features

### Confidence Tracking

Each extraction includes confidence scores:

```typescript
const result = await extractTextFromPDF(documentBytes)
console.log(`Confidence: ${result.confidence}%`)

// Example output:
// Confidence: 98.7%  ✅ High quality
// Confidence: 87.3%  ⚠️ Medium quality
// Confidence: 65.2%  ❌ Low quality - may need review
```

### Layout Analysis

The system analyzes:
- **Vertical gaps** - Detects paragraph breaks
- **Horizontal position** - Handles columns
- **Font size changes** - Identifies headers (in metadata)
- **Indentation** - Preserves list structure

### Custom Paragraph Threshold

Adjust paragraph detection sensitivity:

```typescript
// In lib/aws-textract.ts, modify:
const isNewParagraph = verticalGap > height * 1.5  // Default

// More sensitive (more paragraphs):
const isNewParagraph = verticalGap > height * 1.0

// Less sensitive (fewer paragraphs):
const isNewParagraph = verticalGap > height * 2.0
```

## Example Outputs

### Academic Paper

```
Abstract

This paper examines the effects of...
with significant implications for...

--- Page Break ---

1. Introduction

The field of study has long recognized...
Previous research has shown that...

Recent developments include...

2. Methodology

Our approach involved three main steps...

--- Page Break ---

Table 1: Experimental Results
| Condition | Mean | SD | p-value |
|-----------|------|----|---------
| A         | 4.2  | 0.8| 0.023   |
| B         | 5.1  | 0.6| 0.001   |
```

### Technical Documentation

```
Overview

This documentation covers the API endpoints
and authentication methods.

Authentication

All requests must include an API key in the
header as shown below:

  Authorization: Bearer YOUR_API_KEY

Rate Limits

- Free tier: 100 requests/hour
- Pro tier: 1000 requests/hour
- Enterprise: Unlimited

--- Page Break ---

API Endpoints

GET /api/users
  Retrieves user information

POST /api/users
  Creates a new user
```

### Novel/Book

```
Chapter 1

The morning sun cast long shadows across
the empty street. Sarah walked slowly,
her mind racing with yesterday's events.

"I can't believe this is happening," she
thought to herself.

--- Page Break ---

Chapter 2

Meanwhile, across town, Detective Morrison
was reviewing the case files. Something
didn't add up.

He picked up his phone and dialed.
```

## Best Practices

### 1. Document Preparation

For best structure preservation:
- **Scan at 300+ DPI** - Higher quality = better detection
- **Straight alignment** - Use document scanner not phone
- **Good lighting** - No shadows on text
- **Flat pages** - No curled edges

### 2. Post-Processing

After extraction, you can:
```typescript
const text = result.text
  .replace(/--- Page Break ---/g, '\n\n[Page Break]\n\n')  // Custom markers
  .replace(/\n{3,}/g, '\n\n')  // Normalize excessive spacing
  .trim()
```

### 3. Validation

Check extraction quality:
```typescript
if (result.confidence && result.confidence < 85) {
  console.warn('Low confidence extraction - manual review recommended')
  // Alert user or flag for review
}
```

## Troubleshooting

### Issue: Too many/few paragraph breaks

**Solution:** Adjust threshold in `extractStructuredText()`:
```typescript
// Increase multiplier for fewer breaks
const isNewParagraph = verticalGap > height * 2.0  // Less sensitive

// Decrease multiplier for more breaks
const isNewParagraph = verticalGap > height * 1.2  // More sensitive
```

### Issue: Tables not extracted

**Solution:** Enable table detection:
```typescript
import { extractTextWithTables } from "@/lib/aws-textract"
const result = await extractTextWithTables(documentBytes)
```

Note: Tables increase processing time and cost.

### Issue: Multi-column layout mixed up

**Solution:** Textract handles this automatically, but for complex layouts:
- Ensure high-quality scan
- Check column detection in blocks
- May need custom post-processing

### Issue: Page breaks missing

**Solution:** Check if document has multiple pages:
```typescript
const blocks = result.blocks
const pages = new Set(blocks.map(b => b.Page))
console.log(`Document has ${pages.size} pages`)
```

## Cost Considerations

Structure preservation doesn't add cost for basic extraction.

**With tables:**
- Basic: $1.50 per 1,000 pages
- With tables: $10 per 1,000 pages (6.7x more)

**Recommendation:**
- Use basic extraction for most documents
- Enable tables only when needed (financial docs, data sheets)

## Summary

✅ **Structure preservation is now automatic!**

**What you get:**
- Paragraphs separated by double newlines
- Page breaks clearly marked
- Reading order maintained
- Tables formatted (when enabled)
- Confidence scores for quality

**Benefits:**
- Better AI-generated content
- More accurate document chat
- Clearer study materials
- Preserved original context
- Professional formatting

**No configuration needed** - works automatically with AWS Textract! 🎉

## Quick Reference

| Feature | Enabled By Default | How to Enable |
|---------|-------------------|---------------|
| Paragraph breaks | ✅ Yes | Automatic |
| Page breaks | ✅ Yes | Automatic |
| Reading order | ✅ Yes | Automatic |
| Table detection | ❌ No | Use `extractTextWithTables()` |
| Form detection | ❌ No | Set `detectForms: true` |
| Confidence scores | ✅ Yes | Check `result.confidence` |

Your documents now maintain their original structure automatically! 📄✨
