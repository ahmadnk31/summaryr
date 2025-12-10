/**
 * Test script to verify AWS Textract configuration
 * Run with: npx tsx scripts/test-textract.ts
 */

import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract"
import * as fs from "fs"
import * as path from "path"

async function testTextract() {
  console.log("=== AWS Textract Test ===\n")
  
  // Check environment variables
  console.log("1. Checking environment variables...")
  const region = process.env.AWS_REGION
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  
  console.log("   AWS_REGION:", region || "❌ NOT SET")
  console.log("   AWS_ACCESS_KEY_ID:", accessKeyId ? `${accessKeyId.slice(0, 8)}...` : "❌ NOT SET")
  console.log("   AWS_SECRET_ACCESS_KEY:", secretAccessKey ? "****" : "❌ NOT SET")
  
  if (!region || !accessKeyId || !secretAccessKey) {
    console.error("\n❌ Missing AWS credentials. Please check your .env file.")
    process.exit(1)
  }
  
  // Create Textract client
  console.log("\n2. Creating Textract client...")
  const client = new TextractClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
  console.log("   ✅ Client created for region:", region)
  
  // Create a simple test PDF
  console.log("\n3. Creating test document...")
  
  // Create a minimal valid PDF
  // This is a very simple PDF with just "Hello World" text
  const simplePDF = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 24 Tf 100 700 Td (Hello World) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000359 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
434
%%EOF`

  const pdfBytes = Buffer.from(simplePDF, 'utf-8')
  console.log("   PDF size:", pdfBytes.length, "bytes")
  console.log("   First 4 bytes:", pdfBytes.slice(0, 4).toString())
  
  // Test with Textract
  console.log("\n4. Sending to Textract...")
  
  try {
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: new Uint8Array(pdfBytes),
      },
    })
    
    const response = await client.send(command)
    
    console.log("   ✅ Textract response received!")
    console.log("   Document pages:", response.DocumentMetadata?.Pages)
    console.log("   Blocks found:", response.Blocks?.length || 0)
    
    // Show extracted text
    const lines = response.Blocks?.filter(b => b.BlockType === "LINE").map(b => b.Text) || []
    console.log("   Extracted text:", lines.join(" ") || "(no text found)")
    
    console.log("\n✅ Textract is working correctly!")
    
  } catch (error: any) {
    console.error("\n❌ Textract error:", error.message)
    console.error("   Error type:", error.__type || error.name)
    
    if (error.__type === "AccessDeniedException") {
      console.error("\n   → Your IAM user needs AmazonTextractFullAccess policy")
      console.error("   → Go to IAM Console → Users → Add permissions → Attach AmazonTextractFullAccess")
    } else if (error.__type === "UnsupportedDocumentException") {
      console.error("\n   → The test PDF format is not supported")
      console.error("   → Try uploading a real scanned PDF document")
    } else if (error.message.includes("region")) {
      console.error("\n   → Check if Textract is available in your region:", region)
      console.error("   → Textract is available in: us-east-1, us-east-2, us-west-2, eu-west-1, eu-central-1, ap-southeast-1, ap-southeast-2")
    }
    
    process.exit(1)
  }
}

// Load environment variables from .env
import { config } from "dotenv"
config()

testTextract()
