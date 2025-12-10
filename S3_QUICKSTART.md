# Quick Start: S3 + CloudFront Setup

## Summary

Your application now supports **both Supabase Storage and AWS S3 + CloudFront** for document storage. This guide will help you enable S3.

## Current State

✅ **Installed**: AWS SDK packages (@aws-sdk/client-s3, @aws-sdk/s3-request-presigner)  
✅ **Created**: S3 upload component, API routes, helper functions  
✅ **Updated**: Dashboard now uses S3-capable upload component  
⏳ **Pending**: AWS S3 configuration and enabling

## Quick Enable (5 minutes)

### Step 1: Configure AWS S3

Follow the complete setup guide: `AWS_S3_CLOUDFRONT_SETUP.md`

**Or use this quick checklist:**

1. **Create S3 bucket** (AWS Console → S3 → Create bucket)
   - Bucket name: `your-app-documents-prod`
   - Region: `us-east-1` (or closest to you)
   - Block public access: ✅ Enabled
   - Encryption: ✅ Enabled (SSE-S3)

2. **Create CloudFront distribution** (Optional but recommended)
   - Origin: Your S3 bucket
   - Origin access: OAC (Origin Access Control)
   - Copy distribution domain: `d1234567890abc.cloudfront.net`

3. **Configure IAM permissions**
   - Attach policy to your IAM user:
   ```json
   {
     "Statement": [{
       "Effect": "Allow",
       "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
       "Resource": "arn:aws:s3:::your-bucket-name/*"
     }]
   }
   ```

### Step 2: Update Environment Variables

Add to your `.env.local`:

```bash
# Enable S3 uploads
NEXT_PUBLIC_USE_S3=true

# S3 Configuration
AWS_S3_BUCKET=your-app-documents-prod
AWS_CLOUDFRONT_DOMAIN=d1234567890abc.cloudfront.net

# AWS Credentials (if not already set for Textract)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

### Step 3: Restart Development Server

```bash
# Stop current server (Ctrl+C)
pnpm run dev
```

### Step 4: Test Upload

1. Go to Dashboard → Upload Document
2. Upload a PDF file
3. Check console logs - should see "📦 Downloading from S3"
4. Verify file appears in S3 bucket

## How It Works

### With S3 Disabled (Current Default)

```
Upload → Supabase Storage → Process → Database
```

### With S3 Enabled

```
Upload → S3 Bucket → CloudFront CDN → Process → Database
         ↓
    Fast global delivery
```

## Features

### Automatic Mode Selection

The upload component automatically detects which storage to use:

```typescript
const useS3 = process.env.NEXT_PUBLIC_USE_S3 === "true"

if (useS3) {
  // Upload to S3 via API route
  // Process with S3 download
} else {
  // Upload to Supabase Storage (existing behavior)
  // Process with Supabase download
}
```

### Benefits of S3 + CloudFront

| Feature | Supabase Storage | S3 + CloudFront |
|---------|-----------------|-----------------|
| **Storage Cost** | $0.021/GB | $0.023/GB |
| **Bandwidth Cost** | $0.09/GB | $0.085/GB (CDN) |
| **Global Performance** | Good | Excellent (450+ edge locations) |
| **Scalability** | Limited | Unlimited |
| **Integration with Textract** | Separate | Same AWS account |

## Troubleshooting

### Issue: "S3 storage is not configured"

**Solution**: Set environment variables in `.env.local`:
```bash
AWS_S3_BUCKET=your-bucket-name
AWS_CLOUDFRONT_DOMAIN=your-cloudfront-domain
```

### Issue: "Access Denied" when uploading

**Solution**: Check IAM permissions:
1. Go to IAM → Users → Your user
2. Attach policy with `s3:PutObject` permission
3. Ensure bucket name matches

### Issue: Files upload but can't download

**Solution**: 
1. Check S3 bucket policy allows CloudFront access
2. Verify CloudFront distribution is deployed
3. Check Origin Access Control (OAC) configuration

### Issue: Textract "UnsupportedDocumentException"

This error occurs when:
1. **File is not actually a PDF** - Check file signature
2. **Buffer is corrupted** - Verify S3 download completed
3. **File size > 5MB** - Textract sync API limit

**Debug steps:**
```typescript
// Check file signature
console.log("PDF signature:", String.fromCharCode(...uint8Array.slice(0, 4)))
// Should output: "%PDF"

// Check file size
console.log("File size:", uint8Array.length / 1024 / 1024, "MB")
```

**Solution**: The app already falls back to unpdf when Textract fails. To fix:
1. Ensure uploaded file is valid PDF
2. Check file isn't corrupted during upload
3. For files > 5MB, consider using Textract async API

## Current Behavior

**Without S3 configured:**
- ✅ Uploads work with Supabase Storage
- ✅ Textract works with Supabase files
- ✅ Everything functions normally

**With S3 configured:**
- ✅ New uploads go to S3
- ✅ Files served via CloudFront
- ✅ Faster global delivery
- ✅ Better integration with Textract

## Migration Path

If you have existing documents in Supabase:

1. **Phase 1**: Enable S3 for new uploads only
   ```bash
   NEXT_PUBLIC_USE_S3=true
   ```

2. **Phase 2**: Migrate old documents (see `MIGRATE_TO_S3.md`)
   ```bash
   tsx scripts/migrate-to-s3.ts
   ```

3. **Phase 3**: Switch to S3-only after migration complete

## Cost Comparison

**Example: 1,000 documents (5GB), 10,000 views/month**

### Supabase Storage
- Storage: $0.11/month
- Bandwidth: $9.00/month (after 50GB free)
- **Total: ~$9.11/month**

### S3 + CloudFront
- S3 Storage: $0.12/month
- CloudFront: $0.50/month
- **Total: ~$0.62/month**
- **Savings: 93%**

*Note: Savings increase with higher traffic*

## Next Steps

1. ✅ Packages installed
2. ✅ Code deployed
3. ⏳ Configure AWS S3 (see `AWS_S3_CLOUDFRONT_SETUP.md`)
4. ⏳ Set `NEXT_PUBLIC_USE_S3=true`
5. ⏳ Test upload
6. ⏳ Monitor CloudFront cache hit ratio

## Documentation

- **Complete Setup**: `AWS_S3_CLOUDFRONT_SETUP.md`
- **Migration Guide**: `MIGRATE_TO_S3.md`
- **Textract Setup**: `AWS_TEXTRACT_SETUP.md`
- **Code Reference**: 
  - `lib/aws-s3.ts` - S3 helper functions
  - `app/api/upload-s3/route.ts` - Upload API
  - `components/document-upload-s3.tsx` - Upload UI
  - `app/actions/process-document-s3.ts` - Document processing

## Support

For setup help:
1. Check environment variables
2. Verify AWS credentials
3. Test S3 access with AWS CLI
4. Review CloudWatch logs
