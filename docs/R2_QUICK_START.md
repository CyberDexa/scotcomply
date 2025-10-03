# Cloudflare R2 - Quick Start (5 Minutes)

## What Just Happened?

✅ **AWS SDK Installed** - S3-compatible client for R2  
✅ **Environment Variables Added** - R2 credentials configuration  
✅ **Storage Functions Implemented** - Upload, download, delete with R2  
✅ **Build Verified** - All code compiles successfully  

## Your Next Steps

### Option 1: Set Up R2 Now (Recommended)

**5-Minute Setup:**

1. **Create Cloudflare Account**  
   → https://cloudflare.com (free tier available)

2. **Navigate to R2**  
   → Dashboard → R2 → Create bucket → Name it `scotcomply-documents`

3. **Generate API Token**  
   → Manage R2 API Tokens → Create API Token  
   → Permissions: Object Read & Write  
   → Copy: Account ID, Access Key ID, Secret Access Key

4. **Update `.env` file:**
   ```bash
   R2_ACCOUNT_ID="paste-here"
   R2_ACCESS_KEY_ID="paste-here"
   R2_SECRET_ACCESS_KEY="paste-here"
   R2_BUCKET_NAME="scotcomply-documents"
   ```

5. **Restart Dev Server**
   ```bash
   # The server is already running in the terminal
   # Press Ctrl+C to stop, then:
   npm run dev
   ```

6. **Test Upload**  
   → http://localhost:3000/dashboard/certificates/new  
   → Upload a test certificate PDF  
   → Check Cloudflare R2 dashboard - file should appear!

### Option 2: Test Without R2 (Development Mode)

The app works in development mode without R2:
- File uploads are simulated (logged to console)
- Files aren't actually stored
- Perfect for testing other features
- Add R2 credentials later when needed

## What Changed?

### `src/lib/storage.ts` - Now R2-Ready

**Before:**
```typescript
export async function uploadFile(file: File, folder: string) {
  // TODO: Implement actual S3/R2 upload
  console.log('Upload file:', file.name)
  return `/uploads/${file.name}`
}
```

**After:**
```typescript
export async function uploadFile(file: File, folder: string) {
  // If R2 configured, upload to cloud storage
  if (r2Client && env.R2_BUCKET_NAME) {
    const buffer = Buffer.from(await file.arrayBuffer())
    await r2Client.send(new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: `${folder}/${timestamp}-${sanitizedName}`,
      Body: buffer,
      ContentType: file.type,
    }))
    return key  // Stored in database
  }
  // Fallback for development
  console.log('⚠️  R2 not configured - simulated upload')
  return `/uploads/${key}`
}
```

### Environment Variables - Added

```bash
# New in .env
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="scotcomply-documents"
R2_PUBLIC_URL=""  # Optional for public access
```

### Automatic Fallback

If R2 credentials aren't set:
- ✅ App still works
- ✅ Uploads are simulated
- ✅ No errors or crashes
- ⚠️  Files not actually stored

## Features Implemented

### 1. Upload Files to R2
```typescript
const url = await uploadFile(file, 'certificates')
// Uploads to: certificates/1696247890123-gas-safety.pdf
```

### 2. Secure Downloads (Signed URLs)
```typescript
const signedUrl = await getSignedUrl(documentUrl, 3600)
// Returns: Temporary URL valid for 1 hour
```

### 3. Delete Files
```typescript
await deleteFile(documentUrl)
// Removes file from R2 bucket
```

### 4. File Validation
```typescript
const { valid, error } = validateFile(file, {
  maxSize: 10 * 1024 * 1024,  // 10MB
  allowedTypes: ['application/pdf', 'image/jpeg', 'image/png']
})
```

## Cost: $0/month (Free Tier)

**Cloudflare R2 Free Tier:**
- 10 GB storage
- 1 million Class A operations (uploads)
- 10 million Class B operations (downloads)
- **ZERO egress fees** (AWS charges $0.09/GB!)

**Expected Usage for ScotComply:**
- ~1-2 GB storage (100 properties, 500 certificates)
- ~1,000 uploads/month
- ~5,000 downloads/month
- **Cost: $0** (well within free tier)

## Security Features

✅ **Private by default** - Files not publicly accessible  
✅ **Signed URLs** - Time-limited access (1 hour)  
✅ **File validation** - Type and size checks  
✅ **Filename sanitization** - Prevents path traversal  
✅ **User authentication** - Only logged-in users can upload  

## Testing the Integration

### Without R2 Credentials (Development Mode)
```bash
npm run dev
# Navigate to: http://localhost:3000/dashboard/certificates/new
# Upload a file - you'll see: "⚠️  R2 not configured - simulated upload"
# File logged to console, not stored
```

### With R2 Credentials (Production Mode)
```bash
# Add credentials to .env
npm run dev
# Navigate to: http://localhost:3000/dashboard/certificates/new
# Upload a file - you'll see: "✓ File uploaded to R2: certificates/..."
# Check Cloudflare R2 dashboard - file appears in bucket!
```

## Troubleshooting

### "R2 not configured" message
- Check all R2 environment variables are set in `.env`
- Restart dev server after updating `.env`
- Verify credentials are correct (copy-paste from Cloudflare)

### Build errors
Already verified! ✅ Build passes with 0 errors

### Files not appearing in R2
- Check bucket name matches exactly (case-sensitive)
- Verify API token has "Object Read & Write" permissions
- Look for errors in browser console

## What's Next?

**Two paths forward:**

### Path A: Complete File Storage (30 min)
1. ✅ Set up R2 account and bucket (5 min)
2. ✅ Add credentials to `.env` (1 min)
3. ✅ Test upload end-to-end (5 min)
4. ✅ Build certificate viewing page with signed URLs (15 min)
5. ✅ Test download flow (5 min)

### Path B: Continue Feature Development
1. ✅ Build Landlord Registration module (Day 4)
2. ✅ Build HMO Licensing module (Day 4)
3. ✅ Add email notifications (Day 5)
4. 🔄 Return to R2 setup later

## Resources

- 📖 **Full Setup Guide**: `CLOUDFLARE_R2_SETUP.md`
- 🔧 **Storage Code**: `src/lib/storage.ts`
- 🌍 **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/

---

**Status**: ✅ R2 integration complete - ready for your credentials!

**Time to set up**: ~5 minutes  
**Current state**: Works with or without R2 (graceful fallback)  
**Next action**: Choose Path A or Path B above
