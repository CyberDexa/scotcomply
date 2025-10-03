# Cloudflare R2 Setup Guide

This guide will help you set up Cloudflare R2 for file storage in the Scottish Compliance App.

## Why Cloudflare R2?

- ✅ **Zero Egress Fees** - No charges for downloading files
- ✅ **S3-Compatible API** - Works with AWS SDK
- ✅ **Better UK Performance** - Cloudflare's global network
- ✅ **Cost-Effective** - ~$0.015/GB/month storage
- ✅ **Automatic Backups** - Built-in redundancy

## Prerequisites

- Cloudflare account (free tier available)
- Payment method added to Cloudflare account

## Step-by-Step Setup

### 1. Create Cloudflare Account

1. Go to [cloudflare.com](https://www.cloudflare.com)
2. Sign up for a free account
3. Add a payment method (R2 requires this, but has generous free tier)

### 2. Create R2 Bucket

1. Log into Cloudflare Dashboard
2. Navigate to **R2** in the left sidebar
3. Click **Create bucket**
4. Configure:
   - **Bucket name**: `scotcomply-documents` (or your preferred name)
   - **Location**: Automatic (Cloudflare will optimize)
5. Click **Create bucket**

### 3. Generate API Tokens

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Configure:
   - **Token name**: `scotcomply-app`
   - **Permissions**: Object Read & Write
   - **TTL**: Never expires (or set expiry date)
   - **Bucket**: Select your bucket or choose "Apply to all buckets"
4. Click **Create API Token**
5. **IMPORTANT**: Copy the credentials immediately (they won't be shown again):
   - Access Key ID
   - Secret Access Key
   - Account ID

### 4. Configure Public Access (Optional)

If you want files to be publicly accessible without signed URLs:

1. In your bucket settings, go to **Settings**
2. Under **Public Access**, click **Allow Access**
3. Note the public bucket URL (e.g., `https://pub-xxxxx.r2.dev`)

**Security Note**: For sensitive compliance documents, it's recommended to keep the bucket private and use signed URLs instead.

### 5. Update Environment Variables

Add your R2 credentials to `.env`:

```bash
# File Storage - Cloudflare R2 (S3-compatible)
R2_ACCOUNT_ID="your-account-id-here"
R2_ACCESS_KEY_ID="your-access-key-here"
R2_SECRET_ACCESS_KEY="your-secret-key-here"
R2_BUCKET_NAME="scotcomply-documents"
R2_PUBLIC_URL=""  # Leave empty if bucket is private (recommended)
```

### 6. Restart Development Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### 7. Test File Upload

1. Navigate to: http://localhost:3000/dashboard/certificates/new
2. Fill in the certificate form
3. Upload a test PDF or image file
4. Check console for upload confirmation
5. Verify in Cloudflare R2 dashboard that file appears in bucket

## Verification Checklist

- [ ] Cloudflare account created
- [ ] R2 bucket created
- [ ] API tokens generated
- [ ] Credentials added to `.env`
- [ ] Development server restarted
- [ ] Test file uploaded successfully
- [ ] File visible in R2 dashboard

## Cost Estimation

### Free Tier (Included)
- **Storage**: 10 GB/month
- **Class A operations**: 1 million/month (uploads, lists)
- **Class B operations**: 10 million/month (downloads, reads)

### Paid Tier (After free tier)
- **Storage**: $0.015/GB/month (~$0.50 for 32GB)
- **Class A operations**: $4.50/million
- **Class B operations**: $0.36/million
- **Egress**: **FREE** (this is the big advantage!)

### Expected Costs for ScotComply
- **100 properties** with ~500 certificates
- **Storage**: ~1-2 GB (well within free tier)
- **Operations**: Minimal (uploads + occasional downloads)
- **Estimated monthly cost**: **$0** (within free tier)

## Security Best Practices

### 1. Keep Bucket Private
- Don't enable public access unless absolutely necessary
- Use signed URLs (already implemented) for file access
- Signed URLs expire after 1 hour by default

### 2. Rotate API Keys
- Regenerate API tokens every 90 days
- Use separate tokens for development vs production
- Never commit `.env` file to Git

### 3. File Validation
Already implemented in `src/lib/storage.ts`:
- ✅ File type validation (PDF, JPG, PNG only)
- ✅ File size limit (10MB max)
- ✅ Filename sanitization (removes unsafe characters)

### 4. Access Control
- Only authenticated users can upload files
- Files are associated with user accounts (via certificates)
- Consider adding bucket lifecycle rules to delete old files

## Troubleshooting

### Error: "Access Denied"
- Verify API credentials in `.env`
- Check token has "Object Read & Write" permissions
- Ensure token is applied to correct bucket

### Error: "Bucket not found"
- Verify `R2_BUCKET_NAME` matches exactly (case-sensitive)
- Check bucket exists in R2 dashboard

### Files not uploading
- Check browser console for errors
- Verify file meets validation rules (size, type)
- Test R2 connection with curl:

```bash
# Test R2 connectivity
curl -X PUT "https://<ACCOUNT_ID>.r2.cloudflarestorage.com/<BUCKET_NAME>/test.txt" \
  -H "Authorization: Bearer <ACCESS_KEY>" \
  -d "test content"
```

### Development mode still showing "R2 not configured"
- Ensure all R2 environment variables are set
- Restart dev server after updating `.env`
- Check `src/lib/env.ts` validation passes

## Development vs Production

### Development (.env.local)
```bash
R2_BUCKET_NAME="scotcomply-dev"
R2_PUBLIC_URL=""  # Private bucket with signed URLs
```

### Production (.env.production)
```bash
R2_BUCKET_NAME="scotcomply-prod"
R2_PUBLIC_URL=""  # Keep private for security
```

**Recommendation**: Use separate buckets for dev and production to avoid accidentally modifying production files during development.

## File Access Patterns

### Upload Flow
1. User submits certificate form with file
2. File validated client-side (size, type)
3. File uploaded to R2 via `uploadFile()`
4. R2 returns file key (e.g., `certificates/1234567890-gas-safety.pdf`)
5. Key stored in database as `documentUrl`

### Download Flow
1. User clicks to view certificate
2. App calls `getSignedUrl(documentUrl)`
3. Signed URL generated (expires in 1 hour)
4. User redirected to signed URL
5. R2 serves file directly to user

### Benefits of Signed URLs
- ✅ Files remain private (not publicly accessible)
- ✅ Time-limited access (URLs expire)
- ✅ No bandwidth through your server
- ✅ Cloudflare's global CDN for fast delivery

## Next Steps

Once R2 is configured:

1. ✅ Test certificate upload end-to-end
2. ✅ Verify files appear in R2 dashboard
3. ✅ Test file download with signed URLs
4. 🔲 Set up bucket lifecycle rules (optional)
5. 🔲 Configure CORS if needed for direct browser uploads
6. 🔲 Move to Landlord Registration module (Day 4)

## Support

- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/
- **AWS SDK S3 Client**: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/
- **Cloudflare Community**: https://community.cloudflare.com/

---

**Status**: R2 integration code is complete. Just add your credentials to `.env` to activate!
