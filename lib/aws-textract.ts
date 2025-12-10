/**
 * AWS Textract Integration for Enhanced Text Extraction
 * Provides OCR capabilities for scanned documents, images, and PDFs
 */

import { TextractClient, DetectDocumentTextCommand, AnalyzeDocumentCommand } from "@aws-sdk/client-textract"

// Initialize Textract client
export function getTextractClient() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
    throw new Error("AWS credentials not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION in your environment variables.")
  }

  return new TextractClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  })
}

interface TextractResult {
  text: string
  confidence?: number
  blocks?: any[]
  error?: string
  message?: string
}

/**
 * Extract tables from Textract blocks in a readable format
 */
function extractTables(blocks: any[]): string[] {
  const tables: string[] = []
  const tableBlocks = blocks.filter((block: any) => block.BlockType === "TABLE")

  tableBlocks.forEach((tableBlock: any, tableIndex: number) => {
    const cells: { [key: string]: string } = {}
    let maxRow = 0
    let maxCol = 0

    // Find all cells in this table
    const cellBlocks = blocks.filter((block: any) => {
      return (
        block.BlockType === "CELL" &&
        tableBlock.Relationships?.some((rel: any) => 
          rel.Type === "CHILD" && rel.Ids?.includes(block.Id)
        )
      )
    })

    // Build cell grid
    cellBlocks.forEach((cell: any) => {
      const rowIndex = cell.RowIndex || 1
      const colIndex = cell.ColumnIndex || 1
      maxRow = Math.max(maxRow, rowIndex)
      maxCol = Math.max(maxCol, colIndex)

      // Get cell text from WORD blocks
      let cellText = ""
      if (cell.Relationships) {
        const wordIds = cell.Relationships.find((rel: any) => rel.Type === "CHILD")?.Ids || []
        const words = blocks.filter((block: any) => wordIds.includes(block.Id) && block.BlockType === "WORD")
        cellText = words.map((word: any) => word.Text || "").join(" ")
      }

      cells[`${rowIndex}-${colIndex}`] = cellText
    })

    // Format table as text
    let tableText = `Table ${tableIndex + 1}:\n`
    const columnWidths: number[] = []

    // Calculate column widths
    for (let col = 1; col <= maxCol; col++) {
      let maxWidth = 0
      for (let row = 1; row <= maxRow; row++) {
        const cellText = cells[`${row}-${col}`] || ""
        maxWidth = Math.max(maxWidth, cellText.length)
      }
      columnWidths.push(Math.min(maxWidth + 2, 30)) // Cap at 30 chars
    }

    // Build table rows
    for (let row = 1; row <= maxRow; row++) {
      const rowCells: string[] = []
      for (let col = 1; col <= maxCol; col++) {
        const cellText = (cells[`${row}-${col}`] || "").substring(0, 30)
        rowCells.push(cellText.padEnd(columnWidths[col - 1]))
      }
      tableText += "| " + rowCells.join(" | ") + " |\n"
      
      // Add separator after header row
      if (row === 1) {
        tableText += "|" + columnWidths.map(w => "-".repeat(w + 2)).join("|") + "|\n"
      }
    }

    tables.push(tableText)
  })

  return tables
}

/**
 * Extract structured text from Textract blocks while preserving layout
 * Groups text by pages and maintains paragraph structure
 */
function extractStructuredText(blocks: any[]): string {
  // Group blocks by page
  const pageBlocks: { [key: number]: any[] } = {}
  
  blocks.forEach((block: any) => {
    if (block.BlockType === "LINE") {
      const page = block.Page || 1
      if (!pageBlocks[page]) {
        pageBlocks[page] = []
      }
      pageBlocks[page].push(block)
    }
  })

  // Sort pages
  const sortedPages = Object.keys(pageBlocks)
    .map(Number)
    .sort((a, b) => a - b)

  const pageTexts: string[] = []

  sortedPages.forEach((pageNum) => {
    const lines = pageBlocks[pageNum]
    
    // Sort lines by vertical position (top to bottom)
    lines.sort((a: any, b: any) => {
      const topA = a.Geometry?.BoundingBox?.Top || 0
      const topB = b.Geometry?.BoundingBox?.Top || 0
      return topA - topB
    })

    // Group lines into paragraphs based on vertical spacing
    const paragraphs: string[][] = []
    let currentParagraph: string[] = []
    let lastTop = 0

    lines.forEach((line: any, index: number) => {
      const text = line.Text || ""
      const top = line.Geometry?.BoundingBox?.Top || 0
      const height = line.Geometry?.BoundingBox?.Height || 0

      // If vertical gap is significant (more than 1.5x line height), start new paragraph
      const verticalGap = top - (lastTop + height)
      const isNewParagraph = index > 0 && verticalGap > height * 1.5

      if (isNewParagraph && currentParagraph.length > 0) {
        paragraphs.push([...currentParagraph])
        currentParagraph = []
      }

      currentParagraph.push(text)
      lastTop = top
    })

    // Add last paragraph
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph)
    }

    // Join paragraphs with double line breaks
    const pageText = paragraphs
      .map((para) => para.join(" ")) // Join lines within paragraph with space
      .filter((para) => para.trim().length > 0)
      .join("\n\n") // Separate paragraphs with double newline

    if (pageText.trim()) {
      pageTexts.push(pageText)
    }
  })

  // Join pages with page separator
  return pageTexts.join("\n\n--- Page Break ---\n\n")
}

/**
 * Extract text from a document using AWS Textract
 * Supports: PDF, PNG, JPG, JPEG, TIFF
 */
export async function extractTextWithTextract(
  documentBytes: Uint8Array,
  options: {
    detectTables?: boolean
    detectForms?: boolean
    s3Bucket?: string
    s3Key?: string
  } = {}
): Promise<TextractResult> {
  try {
    const client = getTextractClient()
    
    // Debug: Log buffer info
    const sizeInMB = documentBytes.length / (1024 * 1024)
    console.log("=== Textract Debug ===")
    console.log("Buffer type:", documentBytes.constructor.name)
    console.log("Buffer length:", documentBytes.length, "bytes (", sizeInMB.toFixed(2), "MB)")
    console.log("First 4 bytes (hex):", Array.from(documentBytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' '))
    
    // Check PDF version
    const pdfHeader = String.fromCharCode(...documentBytes.slice(0, 8))
    console.log("PDF Header:", pdfHeader)
    
    // Validate PDF signature: %PDF = 0x25 0x50 0x44 0x46
    const isPDF = documentBytes[0] === 0x25 && documentBytes[1] === 0x50 && 
                  documentBytes[2] === 0x44 && documentBytes[3] === 0x46
    
    // Validate JPEG signature: 0xFF 0xD8 0xFF
    const isJPEG = documentBytes[0] === 0xFF && documentBytes[1] === 0xD8 && documentBytes[2] === 0xFF
    
    // Validate PNG signature: 0x89 0x50 0x4E 0x47
    const isPNG = documentBytes[0] === 0x89 && documentBytes[1] === 0x50 && 
                  documentBytes[2] === 0x4E && documentBytes[3] === 0x47
    
    // Validate TIFF signature: 0x49 0x49 or 0x4D 0x4D
    const isTIFF = (documentBytes[0] === 0x49 && documentBytes[1] === 0x49) || 
                   (documentBytes[0] === 0x4D && documentBytes[1] === 0x4D)
    
    console.log("Format detection - PDF:", isPDF, "JPEG:", isJPEG, "PNG:", isPNG, "TIFF:", isTIFF)
    
    if (!isPDF && !isJPEG && !isPNG && !isTIFF) {
      const headerHex = Array.from(documentBytes.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')
      console.error("Unknown file format! Header bytes:", headerHex)
      throw new Error(`Unsupported document format. Expected PDF/JPEG/PNG/TIFF but got unknown format (header: ${headerHex})`)
    }
    
    // Additional PDF analysis to understand Textract rejection
    if (isPDF) {
      try {
        // Check for common PDF issues that cause Textract to fail
        const pdfString = String.fromCharCode(...documentBytes.slice(0, Math.min(1024, documentBytes.length)))
        
        // Check PDF version (Textract supports 1.3-1.7)
        const versionMatch = pdfString.match(/%PDF-(\d+\.\d+)/)
        const pdfVersion = versionMatch ? versionMatch[1] : 'unknown'
        console.log("PDF Version:", pdfVersion)
        
        // Check for encryption
        const hasEncryption = pdfString.includes('/Encrypt') || pdfString.includes('/Filter')
        console.log("Encryption detected:", hasEncryption)
        
        // Check for linearization (web-optimized)
        const isLinearized = pdfString.includes('/Linearized')
        console.log("Linearized PDF:", isLinearized)
        
        // Check for XFA forms (unsupported by Textract)
        const hasXFA = pdfString.includes('/XFA') || pdfString.includes('xfa:')
        console.log("XFA forms detected:", hasXFA)
        
        // Check for embedded JavaScript (can cause issues)
        const hasJavaScript = pdfString.includes('/JavaScript') || pdfString.includes('/JS')
        console.log("JavaScript detected:", hasJavaScript)
        
        // Check for digital signatures (can cause issues)
        const hasSignature = pdfString.includes('/Sig') || pdfString.includes('/ByteRange')
        console.log("Digital signature detected:", hasSignature)
        
        if (hasEncryption) {
          console.warn("⚠️  PDF has encryption - this often causes UnsupportedDocumentException")
        }
        if (hasXFA) {
          console.warn("⚠️  PDF has XFA forms - not supported by Textract")
        }
        if (parseFloat(pdfVersion) > 1.7) {
          console.warn(`⚠️  PDF version ${pdfVersion} may not be supported (Textract supports 1.3-1.7)`)
        }
      } catch (e) {
        console.log("PDF analysis failed:", e)
      }
    }
    
    // Prepare document source
    // If S3 bucket and key are provided, try S3Object first (better for multi-page PDFs)
    // Fall back to direct bytes if S3 fails
    const useS3Source = !!(options.s3Bucket && options.s3Key)
    
    // Create a fresh Uint8Array for direct bytes (always needed as fallback)
    const arrayBuffer = new ArrayBuffer(documentBytes.length)
    const cleanBytes = new Uint8Array(arrayBuffer)
    cleanBytes.set(documentBytes)
    
    let documentSource: { Bytes?: Uint8Array; S3Object?: { Bucket: string; Name: string } }
    
    if (useS3Source) {
      console.log("Will try S3 source first:", options.s3Bucket, "/", options.s3Key)
      documentSource = {
        S3Object: {
          Bucket: options.s3Bucket!,
          Name: options.s3Key!,
        },
      }
    } else {
      console.log("Using direct bytes, length:", cleanBytes.length)
      documentSource = { Bytes: cleanBytes }
    }
    console.log("======================")
    
    // Helper function to try Textract with a given document source
    const tryTextract = async (source: typeof documentSource, sourceType: string) => {
      console.log(`Attempting Textract with ${sourceType}...`)
      
      if (options.detectTables || options.detectForms) {
        // Use AnalyzeDocument for advanced features (tables, forms, etc.)
        const featureTypes: string[] = []
        if (options.detectTables) featureTypes.push("TABLES")
        if (options.detectForms) featureTypes.push("FORMS")

        const command = new AnalyzeDocumentCommand({
          Document: source,
          FeatureTypes: featureTypes as any,
        })

        const response = await client.send(command)
        const blocks = response.Blocks || []

        // Extract text preserving structure (includes tables if detected)
        let text = extractStructuredText(blocks)

        // If tables were detected, append them in a structured format
        if (options.detectTables) {
          const tables = extractTables(blocks)
          if (tables.length > 0) {
            text += "\n\n--- Tables ---\n\n" + tables.join("\n\n")
          }
        }

        // Calculate average confidence
        const confidenceScores = blocks
          .filter((block: any) => block.Confidence !== undefined)
          .map((block: any) => block.Confidence || 0)
        const averageConfidence =
          confidenceScores.length > 0 ? confidenceScores.reduce((a: number, b: number) => a + b, 0) / confidenceScores.length : undefined

        return {
          text,
          confidence: averageConfidence,
          blocks: blocks,
        }
      } else {
        // Use DetectDocumentText for simple text extraction (faster and cheaper)
        const command = new DetectDocumentTextCommand({
          Document: source,
        })

        const response = await client.send(command)
        const blocks = response.Blocks || []

        // Extract text preserving structure (paragraphs, spacing, layout)
        const text = extractStructuredText(blocks)

        // Calculate average confidence
        const confidenceScores = blocks
          .filter((block: any) => block.Confidence !== undefined)
          .map((block: any) => block.Confidence || 0)
        const averageConfidence =
          confidenceScores.length > 0 ? confidenceScores.reduce((a: number, b: number) => a + b, 0) / confidenceScores.length : undefined

        return {
          text,
          confidence: averageConfidence,
          blocks: blocks,
        }
      }
    }

    // Try S3 source first if available, fall back to bytes
    if (useS3Source) {
      try {
        return await tryTextract(documentSource, "S3 source")
      } catch (s3Error: any) {
        console.warn("S3 source failed:", s3Error.message || s3Error)
        console.log("Falling back to direct bytes...")
        return await tryTextract({ Bytes: cleanBytes }, "direct bytes")
      }
    } else {
      return await tryTextract(documentSource, "direct bytes")
    }
  } catch (error: any) {
    console.error("AWS Textract error:", error)
    
    // Don't throw for UnsupportedDocumentException - try PDF-to-image conversion
    if (error?.Code === 'UnsupportedDocumentException' || error?.__type === 'UnsupportedDocumentException') {
      console.log("📄 PDF format not supported by Textract - trying image conversion...")
      console.log("   Common causes: Encrypted PDFs, XFA forms, digital signatures, complex layouts")
      
      // Try PDF-to-image conversion as a fallback
      try {
        const { convertPdfToImages, getOptimalDPI } = await import('./pdf-to-image')
        const buffer = Buffer.from(documentBytes)
        
        console.log("🔄 Converting PDF to images for Textract compatibility...")
        const optimalDPI = getOptimalDPI(buffer.length)
        
        const conversion = await convertPdfToImages(buffer, {
          density: optimalDPI,
          format: 'png'
        })
        
        if (!conversion.success || conversion.pages.length === 0) {
          console.warn("❌ PDF to image conversion failed:", conversion.error)
          return {
            text: "",
            confidence: 0,
            error: "UnsupportedDocumentException",
            message: "PDF format not supported and image conversion failed"
          }
        }
        
        // Filter out empty images (can happen with simple test PDFs)
        const validPages = conversion.pages.filter(page => page.buffer.length > 100)
        if (validPages.length === 0) {
          console.warn("❌ All converted images are empty or too small")
          return {
            text: "",
            confidence: 0,
            error: "UnsupportedDocumentException",
            message: "PDF converted to images but all images are empty"
          }
        }
        
        console.log(`✅ Converted PDF to ${conversion.pages.length} images`)
        
        // Process each valid page image with Textract
        let allText = ""
        let totalConfidence = 0
        let pageCount = 0
        
        for (const page of validPages) {
          try {
            console.log(`🖼️  Processing page ${page.page} with Textract...`)
            
            const imageResult = await extractTextWithTextract(new Uint8Array(page.buffer), {
              detectTables: options.detectTables,
              detectForms: options.detectForms
            })
            
            if (imageResult.text) {
              allText += `\n--- Page ${page.page} ---\n${imageResult.text}\n`
              if (imageResult.confidence) {
                totalConfidence += imageResult.confidence
              }
              pageCount++
            }
            
          } catch (pageError) {
            console.warn(`⚠️  Failed to process page ${page.page}:`, pageError)
            // Continue with other pages
          }
        }
        
        const averageConfidence = pageCount > 0 ? totalConfidence / pageCount : undefined
        
        if (allText) {
          console.log(`✅ Image-based extraction complete: ${pageCount}/${validPages.length} valid pages processed`)
          return {
            text: allText.trim(),
            confidence: averageConfidence,
            blocks: []
          }
        } else {
          console.warn("❌ No text extracted from any page images")
          return {
            text: "",
            confidence: 0,
            error: "UnsupportedDocumentException",
            message: "PDF format not supported and image extraction failed"
          }
        }
        
      } catch (conversionError: any) {
        console.error("❌ PDF to image conversion error:", conversionError)
        return {
          text: "",
          confidence: 0,
          error: "UnsupportedDocumentException", 
          message: "PDF format not supported by AWS Textract and conversion failed"
        }
      }
    }
    
    // For other errors, still throw
    throw new Error(`Textract extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Extract text from multi-page PDF using Textract
 * For documents larger than 5MB or >1 page, consider using async StartDocumentTextDetection
 */
export async function extractTextFromPDF(
  documentBytes: Uint8Array, 
  options?: { s3Bucket?: string; s3Key?: string }
): Promise<TextractResult> {
  // Check file size (Textract synchronous limit is 5MB)
  const sizeInMB = documentBytes.length / (1024 * 1024)

  if (sizeInMB > 5) {
    console.warn(`Document size is ${sizeInMB.toFixed(2)}MB. For files >5MB, consider using async Textract API.`)
    // For now, still attempt synchronous extraction
    // In production, you'd want to use StartDocumentTextDetection for async processing
  }

  return extractTextWithTextract(documentBytes, {
    detectTables: false,
    detectForms: false,
    s3Bucket: options?.s3Bucket,
    s3Key: options?.s3Key,
  })
}

/**
 * Extract text and detect tables from a document
 */
export async function extractTextWithTables(documentBytes: Uint8Array): Promise<TextractResult> {
  return extractTextWithTextract(documentBytes, {
    detectTables: true,
    detectForms: false,
  })
}

/**
 * Check if AWS Textract is configured and available
 */
export function isTextractAvailable(): boolean {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION)
}

/**
 * Get supported file types for Textract
 */
export function getTextractSupportedFormats(): string[] {
  return ["pdf", "png", "jpg", "jpeg", "tiff", "tif"]
}
