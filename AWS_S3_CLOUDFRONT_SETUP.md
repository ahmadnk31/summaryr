# AWS S3 + CloudFront Setup Guide

This guide will help you set up AWS S3 for document storage with CloudFront CDN for fast global delivery.

## Overview

**Why S3 + CloudFront?**
- ✅ **Scalable** - Handle unlimited document storage
- ✅ **Fast** - CloudFront CDN delivers content from edge locations worldwide
- ✅ **Cost-effective** - Pay only for what you use
- ✅ **Secure** - Encryption at rest and in transit
- ✅ **Reliable** - 99.99% availability SLA

## Prerequisites

- AWS Account with billing enabled
- AWS CLI installed (optional but recommended)
- IAM user with appropriate permissions

## Step 1: Create S3 Bucket

### Using AWS Console

1. **Go to S3 Console**
   - Navigate to https://console.aws.amazon.com/s3/
   - Click "Create bucket"

2. **Configure Bucket**
   - **Bucket name**: `your-app-documents-prod` (must be globally unique)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
   - **Block all public access**: ✅ Enable (we'll use CloudFront for public access)
   - **Bucket Versioning**: Enable (optional, for backup)
   - **Encryption**: Enable server-side encryption with Amazon S3 managed keys (SSE-S3)
   - **Object Lock**: Disable
   
3. **Click "Create bucket"**

### Using AWS CLI

```bash
aws s3api create-bucket \
  --bucket your-app-documents-prod \
  --region us-east-1 \
  --create-bucket-configuration LocationConstraint=us-east-1

aws s3api put-bucket-encryption \
  --bucket your-app-documents-prod \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

## Step 2: Configure S3 Bucket Policy

### Allow CloudFront Access

1. **Go to Bucket → Permissions → Bucket Policy**

2. **Add this policy** (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR-ACCOUNT-ID:distribution/YOUR-DISTRIBUTION-ID"
        }
      }
    }
  ]
}
```

**Note**: You'll update the `SourceArn` after creating CloudFront distribution in Step 3.

## Step 3: Create CloudFront Distribution

### Using AWS Console

1. **Go to CloudFront Console**
   - Navigate to https://console.aws.amazon.com/cloudfront/
   - Click "Create distribution"

2. **Origin Settings**
   - **Origin domain**: Select your S3 bucket from dropdown
   - **Origin access**: Origin access control settings (recommended)
   - **Create new OAC**: Click "Create control setting"
     - Name: `S3-documents-OAC`
     - Sign requests: Yes
     - Click "Create"
   - **Origin path**: Leave empty (or use `/documents` if you want)

3. **Default Cache Behavior**
   - **Viewer protocol policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP methods**: GET, HEAD, OPTIONS
   - **Cache policy**: CachingOptimized
   - **Origin request policy**: CORS-S3Origin (if you need CORS)
   - **Response headers policy**: SimpleCORS (if you need CORS)

4. **Settings**
   - **Price class**: Use all edge locations (or choose specific regions)
   - **Alternate domain name (CNAME)**: `cdn.yourdomain.com` (optional)
   - **Custom SSL certificate**: Select if using custom domain
   - **Default root object**: Leave empty
   - **IPv6**: Enabled

5. **Click "Create distribution"**

6. **Update S3 Bucket Policy**
   - Copy the distribution ARN from the CloudFront distribution details
   - Go back to S3 bucket policy and update the `SourceArn` with your distribution ARN

### Using AWS CLI

```bash
# Create Origin Access Control
aws cloudfront create-origin-access-control \
  --origin-access-control-config '{
    "Name": "S3-documents-OAC",
    "Description": "OAC for document bucket",
    "SigningProtocol": "sigv4",
    "SigningBehavior": "always",
    "OriginAccessControlOriginType": "s3"
  }'

# Create CloudFront distribution (save this to distribution-config.json first)
aws cloudfront create-distribution \
  --distribution-config file://distribution-config.json
```

## Step 4: Configure IAM User Permissions

### Create IAM Policy for S3 + CloudFront Access

1. **Go to IAM Console**
   - Navigate to Policies → Create policy

2. **Add this JSON policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3DocumentAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:HeadObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "arn:aws:cloudfront::YOUR-ACCOUNT-ID:distribution/YOUR-DISTRIBUTION-ID"
    }
  ]
}
```

3. **Name the policy**: `DocumentStorageAccess`

4. **Attach to IAM User**
   - Go to IAM → Users → Select your user (e.g., `summaryr`)
   - Click "Add permissions" → "Attach policies directly"
   - Search for `DocumentStorageAccess` and select it
   - Click "Add permissions"

## Step 5: Configure Environment Variables

### Update `.env.local`

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1

# AWS S3 Configuration
AWS_S3_BUCKET=your-app-documents-prod

# AWS CloudFront Configuration (optional but recommended)
AWS_CLOUDFRONT_DOMAIN=d1234567890abc.cloudfront.net
# OR if using custom domain:
# AWS_CLOUDFRONT_DOMAIN=cdn.yourdomain.com

# AWS Textract (if using)
# (already configured from previous setup)
```

### Get CloudFront Domain

1. Go to CloudFront Console
2. Click on your distribution
3. Copy the "Domain name" (e.g., `d1234567890abc.cloudfront.net`)
4. Add it to your `.env.local` as `AWS_CLOUDFRONT_DOMAIN`

## Step 6: Install Required Packages

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Step 7: Test the Setup

### Test S3 Upload

```typescript
import { uploadToS3, getCDNUrl } from '@/lib/aws-s3'

const testFile = Buffer.from('Hello, World!')
const result = await uploadToS3({
  userId: 'test-user',
  file: testFile,
  fileName: 'test.txt',
  contentType: 'text/plain'
})

console.log('Upload successful!')
console.log('S3 Key:', result.key)
console.log('CDN URL:', result.url)
```

### Test CloudFront Delivery

1. Upload a test file
2. Open the CDN URL in your browser
3. Verify file downloads correctly
4. Check response headers for CloudFront markers:
   - `x-cache: Hit from cloudfront` (after first request)
   - `x-amz-cf-id: unique-request-id`

## Architecture Overview

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ Upload
       ▼
┌─────────────────┐
│   Next.js API   │
│  (Server Action)│
└──────┬──────────┘
       │
       │ PutObject
       ▼
┌─────────────────┐     ┌──────────────────┐
│   AWS S3        │────▶│  CloudFront CDN  │
│  (Storage)      │     │  (Edge Caching)  │
└─────────────────┘     └────────┬─────────┘
                                 │
                                 │ Cached Delivery
                                 ▼
                          ┌─────────────┐
                          │  End Users  │
                          │  Worldwide  │
                          └─────────────┘
```

## Features Enabled

### 1. Fast Global Delivery
- CloudFront caches files at 450+ edge locations
- First request retrieves from S3
- Subsequent requests served from edge cache
- Typical latency: < 100ms globally

### 2. Secure Storage
- Server-side encryption (AES-256)
- HTTPS only access
- Origin Access Control (OAC) prevents direct S3 access
- Signed URLs for temporary access

### 3. Cost Optimization
- First 50GB storage: $0.023/GB
- CloudFront data transfer: $0.085/GB (first 10TB)
- S3 PUT: $0.005 per 1,000 requests
- CloudFront requests: $0.0075 per 10,000 requests

### Example Cost for 1,000 Documents
- Storage (1,000 × 5MB): 5GB = $0.12/month
- Uploads (1,000 documents): $0.005
- Downloads via CloudFront (10,000 views): $0.50
- **Total: ~$0.63/month**

## Monitoring & Analytics

### CloudFront Monitoring

1. **Go to CloudFront Console**
2. Click on your distribution
3. View "Monitoring" tab for:
   - Requests
   - Bytes downloaded
   - Error rate
   - Cache hit ratio

### S3 Metrics

1. **Go to S3 Console**
2. Click on your bucket
3. "Metrics" tab shows:
   - Storage size
   - Number of objects
   - Request metrics

## Security Best Practices

### 1. Enable Bucket Versioning
```bash
aws s3api put-bucket-versioning \
  --bucket your-app-documents-prod \
  --versioning-configuration Status=Enabled
```

### 2. Enable Access Logging
```bash
aws s3api put-bucket-logging \
  --bucket your-app-documents-prod \
  --bucket-logging-status '{
    "LoggingEnabled": {
      "TargetBucket": "your-logs-bucket",
      "TargetPrefix": "s3-access-logs/"
    }
  }'
```

### 3. Set Lifecycle Policies (Optional)
```bash
# Delete files older than 90 days in staging
aws s3api put-bucket-lifecycle-configuration \
  --bucket your-app-documents-prod \
  --lifecycle-configuration file://lifecycle.json
```

## Troubleshooting

### Issue: 403 Forbidden from CloudFront

**Solution**: 
1. Check S3 bucket policy includes CloudFront OAC
2. Verify distribution ARN in bucket policy is correct
3. Wait 5-10 minutes for CloudFront to propagate

### Issue: Slow First Access

**Solution**: This is normal behavior
- First request fetches from S3 (slower)
- Subsequent requests served from edge cache (fast)
- Consider pre-warming cache for popular files

### Issue: Files Not Updating

**Solution**: CloudFront caching
1. Create invalidation:
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR-DISTRIBUTION-ID \
  --paths "/*"
```
2. Or use versioned URLs (recommended)

## Advanced: Custom Domain

### Using Your Own Domain for CloudFront

1. **Create SSL Certificate in ACM**
   - Must be in `us-east-1` region
   - Add `cdn.yourdomain.com`

2. **Add CNAME to CloudFront Distribution**
   - CloudFront → Edit → Alternate domain names
   - Add `cdn.yourdomain.com`
   - Select SSL certificate

3. **Update DNS**
   - Add CNAME record: `cdn.yourdomain.com` → `d1234567890abc.cloudfront.net`

## Migration from Supabase Storage

See `MIGRATE_TO_S3.md` for step-by-step migration guide.

## Next Steps

1. ✅ Install AWS SDK packages
2. ✅ Update document upload component
3. ✅ Update document processing action
4. ✅ Update document viewer for CDN URLs
5. ✅ Test upload and download
6. ✅ Monitor CloudFront cache hit ratio

## Support

For issues:
1. Check CloudWatch logs
2. Verify IAM permissions
3. Test with AWS CLI
4. Check CloudFront distribution status
5. Review S3 bucket policy

## Related Documentation

- `lib/aws-s3.ts` - S3 client and helper functions
- `AWS_TEXTRACT_SETUP.md` - Textract integration
- `MIGRATE_TO_S3.md` - Migration guide from Supabase
