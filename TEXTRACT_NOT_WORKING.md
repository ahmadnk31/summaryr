# AWS Textract Not Being Used - Troubleshooting Guide

## Summary

You have AWS Textract credentials configured in `.env`, but documents are being processed with "standard" extraction (unpdf) instead of Textract. This guide will help you diagnose and fix the issue.

## Current Configuration

From your `.env` file:
```bash
AWS_REGION=eu-central-1

```

✅ All AWS credentials are present  
✅ S3 bucket configured  
✅ CloudFront domain configured  

## Why Textract Might Not Be Used

### 1. IAM Permissions Issue

**Most Common Cause**: Your IAM user may not have Textract permissions attached.

**Check:**
```bash
aws textract detect-document-text \
  --document '{"Bytes":"'$(base64 test.pdf)'"}'
```

If you get `AccessDeniedException`, you need to add Textract permissions.

**Fix:**
1. Go to AWS IAM Console
2. Find user: `summaryr` (the one with your access key)
3. Click "Add permissions" → "Attach policies directly"
4. Search for and select: `AmazonTextractFullAccess`
5. Click "Add permissions"

### 2. File Format Issue

**Symptom**: You see `UnsupportedDocumentException`

**Cause**: File is corrupted or not a valid PDF

**Debug in console logs:**
```
PDF signature: %PDF  ✅ Valid
PDF signature: ÿØÿà  ❌ This is a JPEG, not PDF
```

**Fix**: Ensure uploaded file is a valid PDF

### 3. File Size > 5MB

**Symptom**: Warning message about file size

**Textract Limitation**: Synchronous API limited to 5MB

**Your Options:**
- Files < 5MB: Use synchronous Textract (current implementation)
- Files > 5MB: Automatically falls back to unpdf
- Future: Implement async Textract API for large files

### 4. Region Mismatch

**Your Region**: `eu-central-1`

**Check Textract Availability:**
Textract is available in:
- ✅ us-east-1 (N. Virginia)
- ✅ us-east-2 (Ohio)
- ✅ us-west-2 (Oregon)
- ✅ eu-west-1 (Ireland)
- ✅ eu-central-1 (Frankfurt) ← **Your region**

✅ Your region supports Textract

## Diagnostic Steps

### Step 1: Check Server Logs

When you upload a document, look for these logs:

```
=== Textract Configuration ===
File type: pdf
File size: 2.34 MB
Storage type: s3
useTextract param: true
textractAvailable: true  ← Should be true
textractSupported: true  ← Should be true
shouldUseTextract: true  ← Should be true
AWS_REGION: eu-central-1
AWS_ACCESS_KEY_ID exists: true
AWS_SECRET_ACCESS_KEY exists: true
==============================
```

**If `textractAvailable: false`**, environment variables are not loaded.

**If `shouldUseTextract: false`**, check why (useTextract param or file type).

### Step 2: Check Textract Logs

Look for:
```
✅ Using AWS Textract for PDF extraction...
PDF signature: %PDF
```

**If you see**:
```
❌ Textract extraction failed, falling back to standard method
```

Check the error message that follows. Common errors:
- `AccessDeniedException` → IAM permissions
- `UnsupportedDocumentException` → File format issue
- `ProvisionedThroughputExceededException` → Rate limit (rare)

### Step 3: Test AWS CLI

Test if your credentials work with Textract:

```bash
# Set credentials (use your actual values from .env)
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_REGION=eu-central-1

# Test S3 access
aws s3 ls s3://summaryr/

# Test Textract access
aws textract detect-document-text \
  --document '{"S3Object":{"Bucket":"summaryr","Name":"test.pdf"}}' \
  --region eu-central-1
```

**Expected Response** (if working):
```json
{
  "DocumentMetadata": {
    "Pages": 1
  },
  "Blocks": [
    {
      "BlockType": "PAGE",
      "Confidence": 99.99,
      ...
    }
  ]
}
```

**Error Response** (if not working):
```
An error occurred (AccessDeniedException) when calling the DetectDocumentText operation
```

## Quick Fix Checklist

1. **Verify IAM Permissions**
   ```bash
   # Check current policies
   aws iam list-attached-user-policies --user-name summaryr
   
   # Attach Textract policy
   aws iam attach-user-policy \
     --user-name summaryr \
     --policy-arn arn:aws:iam::aws:policy/AmazonTextractFullAccess
   ```

2. **Restart Dev Server**
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   pnpm run dev
   ```

3. **Upload Test Document**
   - Upload a small PDF (< 5MB)
   - Check server console for Textract logs
   - Verify extraction method in response

4. **Check Results**
   - Should see: `Document processed successfully using textract`
   - Not: `Document processed successfully using unpdf`

## Expected Behavior

### With Textract Working:

```
=== Upload Flow ===
1. Upload PDF → S3
2. Download from S3 → Buffer
3. Check: shouldUseTextract = true
4. Call AWS Textract DetectDocumentText
5. Extract text with structure (paragraphs, tables)
6. Save to database with method: "textract"
7. Display formatted content with tables

Console:
✅ Using AWS Textract for PDF extraction...
PDF signature: %PDF
✅ Textract extraction complete. Confidence: 98.45%
Document processed successfully using textract
```

### With Textract Failing:

```
=== Upload Flow ===
1. Upload PDF → S3
2. Download from S3 → Buffer
3. Check: shouldUseTextract = true
4. Call AWS Textract DetectDocumentText
5. ❌ AccessDeniedException
6. Fallback to unpdf
7. Save to database with method: "unpdf-fallback"

Console:
✅ Using AWS Textract for PDF extraction...
❌ Textract extraction failed, falling back to standard method: AccessDeniedException
Document processed successfully using unpdf-fallback
```

## Comparison: Textract vs Standard

| Feature | Textract | unpdf (Standard) |
|---------|----------|------------------|
| **Text Extraction** | ✅ Excellent | ✅ Good |
| **Tables** | ✅ Detected & formatted | ❌ Plain text |
| **Scanned PDFs** | ✅ OCR supported | ❌ No OCR |
| **Structure** | ✅ Paragraphs, pages, confidence | ⚠️ Basic |
| **Forms** | ✅ Key-value pairs | ❌ No detection |
| **Cost** | $1.50/1,000 pages | Free |
| **Speed** | ~2-3 seconds | ~1 second |

## Verification

After fixing permissions, upload a document and verify:

### In Database:
```sql
SELECT 
  title,
  file_type,
  extraction_method,  -- Should show "textract"
  extracted_text      -- Should have "--- Tables ---" if tables present
FROM documents
ORDER BY upload_date DESC
LIMIT 1;
```

### In UI:
- Tables should render as HTML tables
- Not as plain text with | characters
- Page breaks should show visual dividers

## Still Not Working?

### Enable Verbose Logging

Add to `app/actions/process-document-s3.ts`:

```typescript
console.log("=== TEXTRACT DEBUG ===")
console.log("Full env AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID)
console.log("Full env AWS_REGION:", process.env.AWS_REGION)
console.log("isTextractAvailable():", isTextractAvailable())
console.log("getTextractSupportedFormats():", getTextractSupportedFormats())
console.log("File type check:", fileType, "in", getTextractSupportedFormats())
```

### Test Credentials Directly

Create `scripts/test-textract.ts`:

```typescript
import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract"
import fs from "fs"

async function testTextract() {
  const client = new TextractClient({
    region: "eu-central-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  const pdfBytes = fs.readFileSync("test.pdf")

  const command = new DetectDocumentTextCommand({
    Document: {
      Bytes: pdfBytes,
    },
  })

  try {
    const response = await client.send(command)
    console.log("✅ Textract working!")
    console.log("Blocks:", response.Blocks?.length)
  } catch (error) {
    console.error("❌ Textract error:", error)
  }
}

testTextract()
```

Run:
```bash
tsx scripts/test-textract.ts
```

## Next Steps

1. ✅ Fix IAM permissions (most common issue)
2. ✅ Restart dev server
3. ✅ Upload test PDF
4. ✅ Check console logs
5. ✅ Verify "textract" extraction method
6. ✅ Check table rendering in UI

## Related Documentation

- `AWS_TEXTRACT_SETUP.md` - Complete Textract setup
- `FIX_TEXTRACT_PERMISSIONS.md` - Permission troubleshooting
- `DOCUMENT_RENDERING.md` - How formatted content is displayed
- `lib/aws-textract.ts` - Textract implementation

## Support

If still not working after following this guide:
1. Share full console logs (with Textract debug info)
2. Share AWS CLI test results
3. Verify IAM user has correct policies attached
4. Check CloudWatch logs for Textract API calls
