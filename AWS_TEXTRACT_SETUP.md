# AWS Textract Integration Guide

## Overview

AWS Textract has been integrated to provide superior text extraction capabilities, especially for:
- **Scanned documents** (images converted to PDF)
- **PDFs with images** and mixed content
- **Handwritten text** (with limitations)
- **Complex layouts** with tables and forms
- **Low-quality scans** or photos

### Benefits over Standard Extraction

| Feature | Standard (unpdf) | AWS Textract |
|---------|-----------------|--------------|
| **Regular PDFs** | ✅ Good | ✅ Excellent |
| **Scanned PDFs** | ❌ Poor/None | ✅ Excellent (OCR) |
| **Images in PDFs** | ❌ Skipped | ✅ Extracted |
| **Handwriting** | ❌ No | ⚠️ Limited |
| **Tables** | ⚠️ Basic | ✅ Structured |
| **Forms** | ⚠️ Basic | ✅ Key-value pairs |
| **Confidence Scores** | ❌ No | ✅ Yes |
| **Multi-language** | ✅ Yes | ✅ Yes (70+ languages) |

## Setup Instructions

### 1. AWS Account Setup

1. **Create an AWS Account** (if you don't have one):
   - Go to https://aws.amazon.com/
   - Click "Create an AWS Account"
   - Follow the registration process

2. **Create an IAM User** for Textract:
   - Go to AWS IAM Console: https://console.aws.amazon.com/iam/
   - Click "Users" → "Create user"
   - User name: `summaryr-textract-user`
   - Select "Provide user access to the AWS Management Console" if you want console access (optional)
   - Click "Next"

3. **Attach Textract Permissions**:
   - Select "Attach policies directly"
   - Search for and select: `AmazonTextractFullAccess`
   - Alternatively, create a custom policy with minimal permissions:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": [
             "textract:DetectDocumentText",
             "textract:AnalyzeDocument"
           ],
           "Resource": "*"
         }
       ]
     }
     ```
   - Click "Next" → "Create user"

4. **Generate Access Keys**:
   - Click on the user you just created
   - Go to "Security credentials" tab
   - Scroll to "Access keys"
   - Click "Create access key"
   - Choose "Application running outside AWS"
   - Click "Next" → "Create access key"
   - **IMPORTANT**: Copy both `Access Key ID` and `Secret Access Key`
   - Download the CSV file (you won't be able to see the secret key again!)

### 2. Environment Variables

Add these to your `.env` or `.env.local` file:

```env
# AWS Textract Configuration
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1  # or your preferred region

# Optional: Force Textract for all PDFs (default: true)
USE_TEXTRACT=true
```

**Available AWS Regions for Textract:**
- `us-east-1` (N. Virginia) - Recommended, lowest latency
- `us-east-2` (Ohio)
- `us-west-1` (N. California)
- `us-west-2` (Oregon)
- `ca-central-1` (Canada)
- `eu-west-1` (Ireland)
- `eu-west-2` (London)
- `eu-west-3` (Paris)
- `eu-central-1` (Frankfurt)
- `ap-south-1` (Mumbai)
- `ap-northeast-2` (Seoul)
- `ap-southeast-1` (Singapore)
- `ap-southeast-2` (Sydney)
- `ap-northeast-1` (Tokyo)

Choose the region closest to your users for best performance.

### 3. Testing the Integration

After setting up the environment variables:

1. **Restart your dev server**:
   ```bash
   pnpm dev
   ```

2. **Upload a test document**:
   - Go to your dashboard
   - Upload a PDF file
   - Check the console logs for: `"Using AWS Textract for PDF extraction..."`

3. **Test with different document types**:
   - Regular PDF with selectable text
   - Scanned PDF (image-based)
   - Photo of a document
   - PDF with tables

## How It Works

### Automatic Fallback

The system uses a smart fallback mechanism:

```
1. Check if AWS credentials are configured
2. Check if file type is supported by Textract (PDF, PNG, JPG, TIFF)
3. If YES → Try AWS Textract
   - On Success: Use Textract results ✅
   - On Failure: Fall back to standard extraction ⚠️
4. If NO → Use standard extraction methods
```

### Supported File Types

**With Textract:**
- PDF (all types, including scanned)
- PNG images
- JPG/JPEG images
- TIFF images

**Without Textract:**
- PDF (text-based only)
- DOCX (Microsoft Word)
- EPUB (eBooks)

### Document Size Limits

| Method | Synchronous | Asynchronous |
|--------|-------------|--------------|
| **File Size** | Up to 5 MB | Up to 500 MB |
| **Pages** | Up to 1 page | Up to 3,000 pages |
| **Processing** | Real-time | Job-based (minutes) |

**Note**: Current implementation uses synchronous processing. For large documents, the system will warn but still attempt extraction.

## Advanced Features

### 1. Table Detection

To enable table detection (slightly slower, more expensive):

```typescript
// In lib/aws-textract.ts
export async function extractTextWithTables(documentBytes: Uint8Array) {
  return extractTextWithTextract(documentBytes, {
    detectTables: true,  // Extract tables with structure
    detectForms: false,
  })
}
```

### 2. Form/Key-Value Pair Detection

For forms with labeled fields:

```typescript
return extractTextWithTextract(documentBytes, {
  detectTables: false,
  detectForms: true,  // Extract form fields and values
})
```

### 3. Confidence Scores

Textract returns confidence scores for extracted text:

```typescript
const result = await extractTextFromPDF(documentBytes)
console.log(`Extraction confidence: ${result.confidence}%`)
```

Use this to:
- Alert users about low-quality extractions
- Retry with different settings
- Request manual verification

## Pricing (as of December 2024)

### DetectDocumentText API (Simple text extraction)
- **First 1 million pages/month**: $1.50 per 1,000 pages
- **Over 1 million pages**: $0.60 per 1,000 pages

### AnalyzeDocument API (With tables/forms)
- **First 1 million pages/month**: $10 per 1,000 pages (tables) or $50 per 1,000 pages (forms)
- **Over 1 million pages**: Lower rates apply

**Example Cost Calculation:**
- 100 documents/day × 30 days = 3,000 documents/month
- Using DetectDocumentText: 3,000 × $0.0015 = **$4.50/month**
- Very affordable for most use cases!

**Free Tier:**
- AWS Free Tier includes 1,000 pages/month for 3 months
- Perfect for testing and small deployments

## Troubleshooting

### Issue: "AWS credentials not configured"

**Solution**: Ensure environment variables are set correctly:
```bash
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
echo $AWS_REGION
```

If empty, add them to `.env.local` and restart the server.

### Issue: "Textract extraction failed"

**Possible causes:**
1. **Invalid credentials**: Check IAM permissions
2. **Region mismatch**: Ensure region supports Textract
3. **File too large**: >5MB needs async processing
4. **Unsupported format**: Check file type

**Check logs** for specific error messages.

### Issue: "Document too large"

For files >5MB, you have options:
1. **Compress the PDF** before uploading
2. **Split into smaller files**
3. **Implement async processing** (requires more code)

### Issue: Low extraction quality

**Improve quality by:**
- Using higher resolution scans (300+ DPI recommended)
- Ensuring good lighting for photos
- Using contrast enhancement
- Pre-processing images (deskew, denoise)

## Performance Optimization

### 1. Caching

Consider caching Textract results:
```typescript
// Store extraction in a separate cache table
await supabase.from('textract_cache').insert({
  document_hash: calculateHash(documentBytes),
  extracted_text: result.text,
  confidence: result.confidence,
  extracted_at: new Date()
})
```

### 2. Async Processing for Large Documents

For better UX with large files:
1. Upload document → Return immediately
2. Process in background job
3. Notify user when complete

### 3. Regional Optimization

Deploy to the same AWS region as Textract for lowest latency.

## Security Best Practices

### 1. IAM Permissions

✅ **DO:**
- Use minimal required permissions
- Create separate IAM users per environment (dev/staging/prod)
- Rotate access keys regularly
- Use IAM roles in production (if deployed to AWS)

❌ **DON'T:**
- Use root account credentials
- Share credentials across projects
- Commit credentials to Git
- Use overly permissive policies

### 2. Environment Variables

```env
# ✅ Good - Specific to environment
AWS_ACCESS_KEY_ID=AKIA...DEV123
AWS_SECRET_ACCESS_KEY=secret_key_for_dev

# ❌ Bad - Production keys in dev
AWS_ACCESS_KEY_ID=AKIA...PROD456  # Never do this!
```

### 3. Document Privacy

- Textract processes documents in AWS
- Documents are NOT stored by AWS Textract
- Data in transit is encrypted (HTTPS)
- Consider data residency requirements

## Alternative: Google Cloud Vision API

If you prefer Google Cloud Platform:

```bash
pnpm add @google-cloud/vision
```

Similar setup with `GOOGLE_APPLICATION_CREDENTIALS`.

## Monitoring & Logging

Track usage in CloudWatch:
- **Success rate**: % of successful extractions
- **Confidence scores**: Average quality
- **Processing time**: Latency metrics
- **Cost tracking**: Monthly spend

## Summary

✅ **You've successfully integrated AWS Textract!**

**What you can now do:**
- Upload scanned PDFs and get searchable text
- Extract text from images (photos of documents)
- Handle complex layouts with tables
- Get confidence scores for quality assurance
- Fall back gracefully when Textract isn't available

**Next steps:**
1. Set up AWS credentials (see Setup Instructions)
2. Test with various document types
3. Monitor usage and costs
4. Consider enabling table/form detection for specific use cases

**Need help?** Check the troubleshooting section or AWS Textract documentation:
https://docs.aws.amazon.com/textract/

---

## Quick Start Checklist

- [ ] Create AWS account
- [ ] Create IAM user with Textract permissions
- [ ] Generate access keys
- [ ] Add AWS credentials to `.env.local`
- [ ] Restart development server
- [ ] Test with sample PDF upload
- [ ] Verify console shows "Using AWS Textract..."
- [ ] Check extraction quality
- [ ] Monitor AWS billing dashboard

🎉 **Ready to extract text like a pro!**
