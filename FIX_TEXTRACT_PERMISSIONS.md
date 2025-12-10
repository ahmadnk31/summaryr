# Fix AWS Textract Permissions - Quick Guide

## Problem

```
AccessDeniedException: User: arn:aws:iam::175314215730:user/summaryr 
is not authorized to perform: textract:DetectDocumentText
```

Your IAM user exists but lacks Textract permissions.

## Solution (5 minutes)

### Option 1: AWS Console (Easiest)

1. **Go to IAM Console**:
   - Open: https://console.aws.amazon.com/iam/
   - Or search "IAM" in AWS Console

2. **Find Your User**:
   - Click "Users" in left sidebar
   - Find user: `summaryr`
   - Click on the username

3. **Add Textract Policy**:
   - Click "Add permissions" button
   - Select "Attach policies directly"
   - Search for: `AmazonTextractFullAccess`
   - ✅ Check the box next to it
   - Click "Next" → "Add permissions"

4. **Verify**:
   - You should see `AmazonTextractFullAccess` in the Permissions tab
   - Done! ✅

### Option 2: AWS CLI (Faster if you have CLI)

```bash
# Attach Textract policy to your user
aws iam attach-user-policy \
  --user-name summaryr \
  --policy-arn arn:aws:iam::aws:policy/AmazonTextractFullAccess

# Verify it worked
aws iam list-attached-user-policies --user-name summaryr
```

### Option 3: Custom Policy (Minimal Permissions)

If you want minimal permissions instead of full access:

1. Go to IAM → Users → `summaryr`
2. Click "Add permissions" → "Create inline policy"
3. Switch to JSON tab
4. Paste this:

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

5. Name it: `TextractMinimalAccess`
6. Click "Create policy"

## Testing

After adding permissions, restart your dev server and try uploading again:

```bash
# Kill the current server
# Then restart
pnpm dev
```

Upload a document and check the logs - you should see:
```
✅ Using AWS Textract for PDF extraction...
✅ Textract extraction complete. Confidence: 98.5%
✅ Document processed successfully using textract
```

## File Size Warning

Your document is **6.57MB**, which exceeds the 5MB limit for synchronous Textract.

**What happens:**
- The system still attempts extraction (may work for simple PDFs)
- If it fails, automatically falls back to standard extraction
- No data loss, just a warning

**Options:**

### A. Continue As-Is (Recommended)
- Current setup handles this automatically
- Falls back to standard extraction if needed
- No changes required

### B. Compress Large PDFs

For users uploading large files:

```bash
# Install Ghostscript
brew install ghostscript

# Compress PDF (loses some quality but smaller)
gs -sDEVICE=pdfwrite \
   -dCompatibilityLevel=1.4 \
   -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=compressed.pdf \
   input.pdf
```

### C. Add File Size Warning (Optional)

Let users know before uploading:

```typescript
// In components/document-upload.tsx
if (file.size > 5 * 1024 * 1024) { // 5MB
  toast.warning("Large file detected. Extraction may take longer.")
}
```

## Why This Happened

Your AWS setup:
- ✅ IAM user created: `summaryr`
- ✅ Access keys generated
- ✅ Credentials configured in `.env`
- ❌ Permissions not attached

**Common mistake**: Creating user without attaching policies.

## Verification Checklist

After fixing permissions:

- [ ] IAM user has `AmazonTextractFullAccess` policy attached
- [ ] `.env.local` has correct `AWS_ACCESS_KEY_ID`
- [ ] `.env.local` has correct `AWS_SECRET_ACCESS_KEY`
- [ ] `.env.local` has `AWS_REGION=us-east-1` (or your region)
- [ ] Dev server restarted after adding permissions
- [ ] Test upload shows "Using AWS Textract..." in logs

## Expected Console Output

### Before Fix:
```
❌ AWS Textract error: AccessDeniedException
⚠️  Textract extraction failed, falling back to standard method
✅ Document processed successfully using unpdf-fallback
```

### After Fix:
```
ℹ️  Document size is 6.57MB. For files >5MB, consider using async Textract API.
✅ Using AWS Textract for PDF extraction...
✅ Textract extraction complete. Confidence: 98.5%
✅ Document processed successfully using textract
```

## Still Having Issues?

### 1. Check IAM Permissions

```bash
# List all policies attached to user
aws iam list-attached-user-policies --user-name summaryr

# Should show:
# {
#   "AttachedPolicies": [
#     {
#       "PolicyName": "AmazonTextractFullAccess",
#       "PolicyArn": "arn:aws:iam::aws:policy/AmazonTextractFullAccess"
#     }
#   ]
# }
```

### 2. Verify Credentials

```bash
# Test if credentials work
aws sts get-caller-identity

# Should return your user ARN:
# "Arn": "arn:aws:iam::175314215730:user/summaryr"
```

### 3. Check Environment Variables

```bash
# Make sure these are set
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
echo $AWS_REGION
```

### 4. IAM Policy Propagation

Sometimes AWS takes 1-2 minutes to propagate new permissions. If it still doesn't work:
- Wait 2 minutes
- Restart dev server
- Try again

## Summary

**Quick Fix (2 minutes):**
1. Go to: https://console.aws.amazon.com/iam/
2. Users → `summaryr` → Add permissions
3. Attach `AmazonTextractFullAccess`
4. Restart server: `pnpm dev`
5. Upload document ✅

**About the 6.57MB warning:**
- Just a warning, not an error
- System handles it automatically
- Falls back gracefully if needed
- No action required

You're almost there! Just need to attach the Textract policy. 🎉
