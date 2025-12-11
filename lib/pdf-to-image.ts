/**
 * PDF to Image Conversion for Textract Compatibility
 * Converts problematic PDFs to images that Textract can process
 */

import { fromBuffer } from 'pdf2pic'

interface PdfToImageOptions {
  density?: number // DPI (default: 200)
  format?: 'png' | 'jpeg' // Output format (default: png)
  quality?: number // JPEG quality 1-100 (default: 90)
  width?: number // Max width in pixels
  height?: number // Max height in pixels
}

interface ConvertedPage {
  page: number
  buffer: Buffer
  width: number
  height: number
}

interface ConversionResult {
  success: boolean
  pages: ConvertedPage[]
  error?: string
  totalPages?: number
}

/**
 * Convert PDF to images for Textract processing
 * This is used as a fallback when Textract rejects the PDF directly
 */
export async function convertPdfToImages(
  pdfBuffer: Buffer | Uint8Array, 
  options: PdfToImageOptions = {}
): Promise<ConversionResult> {
  try {
    const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer)
    
    const {
      density = 200, // Good balance between quality and file size
      format = 'png', // PNG is better for text documents
      quality = 90,
      width = 2000, // Max width to prevent huge files
      height = 2000 // Max height to prevent huge files
    } = options

    console.log(`🖼️  Converting PDF to ${format.toUpperCase()} images (DPI: ${density})...`)

    // Configure pdf2pic with more explicit options
    const convertOptions = {
      density,
      saveFilename: 'page',
      savePath: './', // We'll get buffer directly  
      format,
      width,
      height,
      ...(format === 'jpeg' && { quality }),
      // Add explicit GraphicsMagick/ImageMagick options
      preserveAspectRatio: true,
      // Try different conversion backends
      gm: true, // Use GraphicsMagick if available
    }

    console.log('📐 PDF2PIC Configuration:', {
      density,
      format,
      width,
      height,
      bufferSize: buffer.length
    })

    const convert = fromBuffer(buffer, convertOptions)
    
    // Try converting first page to check if PDF is valid
    try {
      const firstPage = await convert(1, { responseType: 'buffer' })
      
      if (!firstPage.buffer) {
        throw new Error('Failed to convert first page')
      }

      console.log(`✅ First page converted successfully (${firstPage.buffer.length} bytes)`)
      
      // Get total page count by trying to convert until we fail
      const pages: ConvertedPage[] = []
      let pageNum = 1
      let consecutiveEmptyPages = 0
      const maxEmptyPages = 3 // Stop after 3 consecutive empty pages
      const maxAttempts = 100 // Prevent infinite loop
      
      while (pageNum <= maxAttempts && consecutiveEmptyPages < maxEmptyPages) {
        try {
          const pageResult = await convert(pageNum, { responseType: 'buffer' })
          
          if (!pageResult.buffer || pageResult.buffer.length === 0) {
            consecutiveEmptyPages++
            if (consecutiveEmptyPages >= maxEmptyPages) {
              console.log(`⚠️  Stopping after ${consecutiveEmptyPages} consecutive empty pages`)
              break
            }
            pageNum++
            continue
          }
          
          // Reset empty page counter on successful page
          consecutiveEmptyPages = 0
          
          pages.push({
            page: pageNum,
            buffer: pageResult.buffer,
            width: 0, // pdf2pic doesn't return dimensions in buffer mode
            height: 0 // pdf2pic doesn't return dimensions in buffer mode
          })
          
          console.log(`✅ Page ${pageNum} converted (${pageResult.buffer.length} bytes)`)
          pageNum++
          
        } catch (pageError) {
          // No more pages available or conversion failed
          console.log(`ℹ️  Stopped at page ${pageNum} (${pageError})`)
          break
        }
      }
      
      if (pages.length === 0) {
        return {
          success: false,
          pages: [],
          error: 'No pages could be converted'
        }
      }
      
      console.log(`🎉 PDF conversion complete: ${pages.length} pages`)
      
      return {
        success: true,
        pages,
        totalPages: pages.length
      }
      
    } catch (conversionError: any) {
      console.error('PDF conversion failed:', conversionError)
      return {
        success: false,
        pages: [],
        error: conversionError.message || 'PDF conversion failed'
      }
    }
    
  } catch (error: any) {
    console.error('PDF to image conversion error:', error)
    return {
      success: false,
      pages: [],
      error: error.message || 'Unknown conversion error'
    }
  }
}

/**
 * Get optimal DPI based on PDF size and content type
 */
export function getOptimalDPI(fileSizeBytes: number, hasImages: boolean = false): number {
  const sizeMB = fileSizeBytes / (1024 * 1024)
  
  // Smaller files can handle higher DPI
  if (sizeMB < 1) return hasImages ? 300 : 250
  if (sizeMB < 5) return hasImages ? 200 : 200
  if (sizeMB < 10) return hasImages ? 150 : 200
  
  // Large files need lower DPI to prevent timeout
  return hasImages ? 100 : 150
}

/**
 * Estimate conversion time and memory usage
 */
export function estimateConversion(fileSizeBytes: number, pageCount?: number): {
  estimatedTimeSeconds: number
  estimatedMemoryMB: number
  recommendation: string
} {
  const sizeMB = fileSizeBytes / (1024 * 1024)
  const estimatedPages = pageCount || Math.max(1, Math.round(sizeMB * 2)) // Rough estimate
  
  // Conservative estimates
  const timePerPageSeconds = 2 // Seconds per page
  const memoryPerPageMB = 10 // MB per page during processing
  
  const estimatedTimeSeconds = estimatedPages * timePerPageSeconds
  const estimatedMemoryMB = estimatedPages * memoryPerPageMB
  
  let recommendation = ''
  if (estimatedTimeSeconds > 30) {
    recommendation = 'Consider processing async or reducing DPI for faster conversion'
  } else if (estimatedMemoryMB > 500) {
    recommendation = 'High memory usage expected, consider processing pages individually'
  } else {
    recommendation = 'Conversion should complete quickly'
  }
  
  return {
    estimatedTimeSeconds,
    estimatedMemoryMB,
    recommendation
  }
}

/**
 * Check if PDF conversion is likely to succeed
 */
export function canConvertPdf(fileSizeBytes: number): boolean {
  const sizeMB = fileSizeBytes / (1024 * 1024)
  
  // Very large PDFs may timeout or use too much memory
  if (sizeMB > 50) {
    console.warn(`PDF is ${sizeMB.toFixed(1)}MB - conversion may be slow or fail`)
    return false
  }
  
  return true
}
