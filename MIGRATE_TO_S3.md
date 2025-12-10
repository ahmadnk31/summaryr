# Migrating from Supabase Storage to AWS S3 + CloudFront

This guide will help you migrate your existing document storage from Supabase to AWS S3 with CloudFront CDN.

## Why Migrate?

**Benefits of S3 + CloudFront:**
- ✅ **Better Performance** - CloudFront CDN serves files from 450+ edge locations globally
- ✅ **Lower Costs** - S3 pricing is ~50% cheaper than Supabase storage at scale
- ✅ **More Control** - Direct access to AWS features (versioning, lifecycle policies, etc.)
- ✅ **Scalability** - No storage limits
- ✅ **Integration** - Seamless integration with Textract (same AWS account)

**Cost Comparison (1,000 documents, 5GB total, 10,000 downloads/month):**
- Supabase Storage: ~$2.50/month
- S3 + CloudFront: ~$0.63/month
- **Savings: 75%**

## Prerequisites

- ✅ AWS S3 bucket created (see `AWS_S3_CLOUDFRONT_SETUP.md`)
- ✅ CloudFront distribution configured
- ✅ IAM user with S3 permissions
- ✅ Environment variables configured

## Migration Options

### Option 1: Dual Mode (Recommended for Production)

Run both storage systems simultaneously during migration:

1. New uploads go to S3
2. Existing files remain in Supabase
3. Gradually migrate old files
4. No downtime

### Option 2: Full Migration (For New/Small Projects)

Migrate all files at once:

1. Export all files from Supabase
2. Upload to S3
3. Update database references
4. Switch to S3-only mode

## Step-by-Step Migration

### Phase 1: Setup (1 hour)

#### 1.1 Install AWS SDK

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

#### 1.2 Configure Environment Variables

Update `.env.local`:

```bash
# Enable S3 for new uploads
NEXT_PUBLIC_USE_S3=true

# AWS S3 Configuration
AWS_S3_BUCKET=your-app-documents-prod
AWS_CLOUDFRONT_DOMAIN=d1234567890abc.cloudfront.net

# AWS Credentials (already configured for Textract)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

#### 1.3 Deploy Code Changes

```bash
git add .
git commit -m "Add S3 + CloudFront support"
git push
```

### Phase 2: Enable S3 for New Uploads (Immediate)

Once deployed, all new uploads will automatically use S3:

- Upload component detects `NEXT_PUBLIC_USE_S3=true`
- Files are uploaded to S3 via `/api/upload-s3`
- CloudFront serves files with low latency
- Old files still work from Supabase

**Test:**
1. Upload a new document
2. Verify it appears in S3 bucket
3. Check CloudFront URL works
4. Confirm database record created

### Phase 3: Migrate Existing Files (1-7 days depending on volume)

#### 3.1 Create Migration Script

Create `scripts/migrate-to-s3.ts`:

```typescript
import { createClient } from "@/lib/supabase/server"
import { uploadToS3 } from "@/lib/aws-s3"
import { createClient as createAdminClient } from "@supabase/supabase-js"

async function migrateDocuments() {
  // Use admin client for full access
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all documents from database
  const { data: documents, error } = await supabase
    .from("documents")
    .select("*")
    .is("migrated_to_s3", false)
    .limit(100) // Process in batches

  if (error) {
    console.error("Error fetching documents:", error)
    return
  }

  console.log(`Migrating ${documents.length} documents...`)

  for (const doc of documents) {
    try {
      console.log(`Migrating: ${doc.file_name}`)

      // Download from Supabase
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(doc.storage_path)

      if (downloadError || !fileData) {
        console.error(`Failed to download ${doc.file_name}:`, downloadError)
        continue
      }

      // Convert to buffer
      const buffer = Buffer.from(await fileData.arrayBuffer())

      // Upload to S3
      const result = await uploadToS3({
        userId: doc.user_id,
        file: buffer,
        fileName: doc.file_name,
        contentType: fileData.type,
        metadata: {
          migratedFrom: "supabase",
          originalPath: doc.storage_path,
          migratedAt: new Date().toISOString(),
        },
      })

      // Update database with new S3 path
      const { error: updateError } = await supabase
        .from("documents")
        .update({
          storage_path: result.key,
          migrated_to_s3: true,
          s3_url: result.url,
        })
        .eq("id", doc.id)

      if (updateError) {
        console.error(`Failed to update database for ${doc.file_name}:`, updateError)
        continue
      }

      console.log(`✅ Migrated: ${doc.file_name} → ${result.key}`)

      // Optional: Delete from Supabase (only after confirming S3 upload)
      // await supabase.storage.from("documents").remove([doc.storage_path])

    } catch (err) {
      console.error(`Error migrating ${doc.file_name}:`, err)
    }
  }

  console.log("Migration batch complete!")
}

// Run migration
migrateDocuments().catch(console.error)
```

#### 3.2 Add Database Column

Add migration tracking column:

```sql
-- Add column to track migration status
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS migrated_to_s3 BOOLEAN DEFAULT FALSE;

-- Add column for S3 URL
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS s3_url TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_migrated 
ON documents(migrated_to_s3);
```

#### 3.3 Run Migration Script

```bash
# Run migration in batches
tsx scripts/migrate-to-s3.ts

# Check progress
psql $DATABASE_URL -c "SELECT COUNT(*) FROM documents WHERE migrated_to_s3 = true;"
```

#### 3.4 Monitor Progress

```sql
-- Check migration status
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN migrated_to_s3 THEN 1 ELSE 0 END) as migrated,
  SUM(CASE WHEN migrated_to_s3 THEN 0 ELSE 1 END) as remaining
FROM documents;
```

### Phase 4: Update Document Viewer (Optional)

If you want to serve old documents via CloudFront:

```typescript
// In document-viewer.tsx or API route
function getDocumentUrl(doc: Document): string {
  if (doc.migrated_to_s3 && doc.s3_url) {
    // Use CloudFront URL
    return doc.s3_url
  } else {
    // Use Supabase URL (for old files)
    const supabase = createClient()
    const { data } = supabase.storage
      .from("documents")
      .getPublicUrl(doc.storage_path)
    return data.publicUrl
  }
}
```

### Phase 5: Cleanup (After 30 days)

Once all files are migrated and tested:

#### 5.1 Verify All Files Migrated

```sql
SELECT * FROM documents WHERE migrated_to_s3 = false;
```

#### 5.2 Delete from Supabase Storage (Optional)

```bash
# Create cleanup script
tsx scripts/cleanup-supabase-storage.ts
```

#### 5.3 Remove Supabase Storage Fallback

Update code to only use S3:
- Remove Supabase storage imports
- Remove fallback logic
- Update error messages

## Rollback Plan

If you need to rollback:

### Immediate Rollback

```bash
# Disable S3 uploads
NEXT_PUBLIC_USE_S3=false

# Deploy
git revert HEAD
git push
```

### Partial Rollback

Keep migrated files in S3, but disable new uploads:

```bash
NEXT_PUBLIC_USE_S3=false
# Keep existing S3 files accessible
```

## Testing Checklist

After migration:

- [ ] Upload new document → Goes to S3
- [ ] View new document → Served from CloudFront
- [ ] View old document → Still works (Supabase or S3)
- [ ] Download document → Fast globally
- [ ] Delete document → Removed from S3
- [ ] Text extraction works → Textract integration intact
- [ ] CloudFront cache hit ratio > 80%

## Monitoring

### S3 Metrics

```bash
# Check S3 usage
aws s3 ls s3://your-bucket/documents/ --recursive --summarize

# Check CloudFront stats
aws cloudfront get-distribution-stats --distribution-id YOUR_DIST_ID
```

### Database Queries

```sql
-- Migration progress
SELECT 
  COUNT(*) FILTER (WHERE migrated_to_s3) as migrated,
  COUNT(*) FILTER (WHERE NOT migrated_to_s3) as pending,
  COUNT(*) as total
FROM documents;

-- Storage breakdown
SELECT 
  CASE 
    WHEN migrated_to_s3 THEN 'S3'
    ELSE 'Supabase'
  END as storage,
  COUNT(*) as count,
  SUM(file_size) / 1024 / 1024 as size_mb
FROM documents
GROUP BY migrated_to_s3;
```

## Cost Analysis

Track costs before and after:

### Supabase Storage Costs

```
Storage: $0.021/GB/month
Bandwidth: $0.09/GB (after 50GB free)
```

### S3 + CloudFront Costs

```
S3 Storage: $0.023/GB/month
S3 PUT: $0.005/1,000 requests
CloudFront: $0.085/GB (first 10TB)
CloudFront Requests: $0.0075/10,000
```

### Example (1TB storage, 10TB transfer/month)

**Supabase:**
- Storage: 1,000 × $0.021 = $21/month
- Bandwidth: 10,000 × $0.09 = $900/month
- **Total: $921/month**

**S3 + CloudFront:**
- S3 Storage: 1,000 × $0.023 = $23/month
- CloudFront: 10,000 × $0.085 = $850/month
- **Total: $873/month**
- **Savings: $48/month (5%)**

*Note: Savings increase with better cache hit ratio*

## Troubleshooting

### Issue: Files not appearing in S3

**Check:**
1. AWS credentials correct
2. S3 bucket name matches env var
3. IAM permissions include `s3:PutObject`
4. API route `/api/upload-s3` working

### Issue: CloudFront returns 403

**Fix:**
1. Update S3 bucket policy
2. Add CloudFront OAC
3. Wait 5-10 minutes for propagation

### Issue: Slow downloads

**Check:**
1. CloudFront cache hit ratio (should be > 70%)
2. TTL settings
3. Origin response time

### Issue: Migration script fails

**Common causes:**
1. File not found in Supabase
2. S3 quota exceeded
3. Network timeout
4. Permissions issue

**Solution:**
```bash
# Resume from last successful document
tsx scripts/migrate-to-s3.ts --resume
```

## Best Practices

1. **Test in staging first**
   - Full end-to-end testing
   - Monitor for 24-48 hours

2. **Migrate in batches**
   - Process 100-1000 files at a time
   - Monitor S3 request rates

3. **Keep Supabase files for 30 days**
   - Safety net for rollback
   - Verify all migrations successful

4. **Monitor CloudFront cache ratio**
   - Target: > 80% cache hit ratio
   - Adjust TTL if needed

5. **Set up alerts**
   - S3 request errors
   - CloudFront 5xx errors
   - Migration failures

## Timeline

**Small Project (< 1,000 documents):**
- Setup: 1-2 hours
- Migration: 1-2 hours
- Testing: 1-2 hours
- **Total: 4-6 hours**

**Medium Project (1,000-10,000 documents):**
- Setup: 2-4 hours
- Migration: 1-2 days
- Testing: 1 day
- **Total: 3-4 days**

**Large Project (> 10,000 documents):**
- Setup: 4-8 hours
- Migration: 3-7 days
- Testing: 2-3 days
- **Total: 1-2 weeks**

## Support

For help with migration:
1. Check CloudWatch logs
2. Review S3 access logs
3. Test with AWS CLI
4. Check migration script output

## Next Steps

1. [ ] Complete AWS setup (see `AWS_S3_CLOUDFRONT_SETUP.md`)
2. [ ] Configure environment variables
3. [ ] Deploy code with S3 support
4. [ ] Test new uploads
5. [ ] Run migration script
6. [ ] Monitor for 30 days
7. [ ] Cleanup Supabase storage
8. [ ] Remove fallback code

## Related Documentation

- `AWS_S3_CLOUDFRONT_SETUP.md` - Initial setup guide
- `lib/aws-s3.ts` - S3 helper functions
- `app/api/upload-s3/route.ts` - Upload API endpoint
- `components/document-upload-s3.tsx` - Upload component
