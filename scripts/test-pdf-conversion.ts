#!/usr/bin/env tsx
/**
 * Test PDF to Image Conversion
 */

import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { convertPdfToImages, getOptimalDPI, estimateConversion, canConvertPdf } from '../lib/pdf-to-image'

// Load environment variables
dotenv.config({ path: '.env' })

async function testPdfConversion() {
  console.log("🧪 Testing PDF to Image Conversion")
  console.log("=".repeat(50))
  
  // Create a simple test PDF buffer (minimal PDF structure)
  const testPdfContent = `%PDF-1.7
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Hello, World!) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000198 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
293
%%EOF`

  const testBuffer = Buffer.from(testPdfContent)
  
  console.log("📋 Test PDF Info:")
  console.log(`   Size: ${testBuffer.length} bytes`)
  console.log(`   Can convert: ${canConvertPdf(testBuffer.length)}`)
  
  const estimate = estimateConversion(testBuffer.length, 1)
  console.log(`   Estimated time: ${estimate.estimatedTimeSeconds}s`)
  console.log(`   Estimated memory: ${estimate.estimatedMemoryMB}MB`)
  console.log(`   Recommendation: ${estimate.recommendation}`)
  
  const optimalDPI = getOptimalDPI(testBuffer.length)
  console.log(`   Optimal DPI: ${optimalDPI}`)
  
  console.log("\n🔄 Converting PDF to images...")
  
  try {
    const result = await convertPdfToImages(testBuffer, {
      density: 150, // Lower DPI for test
      format: 'png'
    })
    
    console.log("\n📊 Conversion Results:")
    console.log(`   Success: ${result.success}`)
    console.log(`   Pages: ${result.pages.length}`)
    console.log(`   Total pages: ${result.totalPages}`)
    
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
    
    if (result.pages.length > 0) {
      console.log("\n📄 Page Details:")
      result.pages.forEach(page => {
        console.log(`   Page ${page.page}: ${page.buffer.length} bytes`)
      })
      
      // Test with a real Textract call (if available)
      const textractAvailable = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
      
      if (textractAvailable) {
        console.log("\n🔍 Testing Textract on converted image...")
        try {
          const { extractTextWithTextract } = await import('../lib/aws-textract')
          const imageResult = await extractTextWithTextract(new Uint8Array(result.pages[0].buffer))
          
          console.log("✅ Textract on image successful!")
          console.log(`   Text: "${imageResult.text.substring(0, 100)}..."`)
          console.log(`   Confidence: ${imageResult.confidence?.toFixed(2)}%`)
        } catch (textractError) {
          console.log("❌ Textract on image failed:", textractError)
        }
      } else {
        console.log("\n⚠️  Textract not available (missing AWS credentials)")
      }
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
  
  console.log("\n✅ PDF to Image conversion test complete")
}

// Run the test
if (require.main === module) {
  testPdfConversion().catch(console.error)
}
