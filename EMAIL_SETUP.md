# Email Setup with Resend

## Why Resend?
- ✅ **3,000 free emails/month**
- ✅ Simple API (better than SendGrid/SES)
- ✅ No credit card required for free tier
- ✅ Email verification built-in
- ✅ Great developer experience

---

## Quick Setup (10 minutes)

### Step 1: Sign Up for Resend

1. Go to: https://resend.com/signup
2. Sign up with GitHub or email
3. Verify your email

### Step 2: Get API Key

1. Go to: https://resend.com/api-keys
2. Click "Create API Key"
3. Name: `ScotComply Production`
4. Permission: `Sending access`
5. Click "Create"
6. **Copy the API key** (starts with `re_...`)

### Step 3: Verify Your Domain (Important!)

**Option A: Use Resend's Free Domain** (Quick Start)
- Resend provides `onboarding@resend.dev` for testing
- **Limitation**: Can only send to your own email
- Good for: Testing only

**Option B: Verify Your Own Domain** (Production Ready)
1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Enter: `scotcomply.co.uk`
4. Add DNS records (provided by Resend):
   - **SPF** TXT record
   - **DKIM** TXT record
   - **DMARC** TXT record (optional but recommended)
5. Wait 5-10 minutes for DNS propagation
6. Click "Verify Domain"

### Step 4: Add to Environment Variables

**Local Development** (`.env`):
```bash
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="ScotComply <noreply@scotcomply.co.uk>"
```

**Vercel Production**:
1. Go to: https://vercel.com/cyberdexas-projects/scottish-compliance-app/settings/environment-variables
2. Add:
   - Key: `RESEND_API_KEY`
   - Value: `re_your_api_key_here`
   - Environment: Production
3. Add:
   - Key: `EMAIL_FROM`
   - Value: `ScotComply <noreply@scotcomply.co.uk>`
   - Environment: Production
4. **Redeploy** your app

---

## DNS Records for scotcomply.co.uk

If you're using Cloudflare/Namecheap/GoDaddy for DNS, add these records:

### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: Auto
```

### DKIM Record (Resend will provide the exact values)
```
Type: TXT
Name: resend._domainkey
Value: (provided by Resend after adding domain)
TTL: Auto
```

### DMARC Record (Optional but recommended)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@scotcomply.co.uk
TTL: Auto
```

---

## Testing

### Test Locally (Development):
```bash
# Start dev server
npm run dev

# Test forgot password
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'

# Check console for logs
```

### Test on Production:
```bash
# Test forgot password
curl -X POST https://scotcomply.co.uk/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@landlord.com"}'

# Check Vercel logs for success/failure
```

---

## Email Templates

The password reset email includes:
- ✅ Branded header with gradient
- ✅ Clear CTA button
- ✅ Backup plain text link
- ✅ Security notice (1-hour expiry)
- ✅ Professional footer
- ✅ Mobile responsive design

### Preview:
Check `src/lib/email.ts` → `sendPasswordResetEmail()` for the HTML template.

---

## Troubleshooting

### ❌ "Email sending failed: Invalid API key"
**Fix**: 
1. Check `RESEND_API_KEY` in Vercel env vars
2. Ensure it starts with `re_`
3. Create a new API key if needed
4. Redeploy

### ❌ "Domain not verified"
**Fix**:
1. Check DNS records are correct
2. Wait up to 24 hours for DNS propagation
3. Use Resend's free domain for testing: `onboarding@resend.dev`

### ❌ "Can only send to verified email"
**Fix**:
- This happens when using Resend's test domain
- Add recipient email to "Verified Emails" in Resend dashboard
- OR verify your own domain

### ✅ Email not received
**Fix**:
1. Check spam folder
2. Check Resend dashboard for delivery status
3. Check Vercel logs for errors
4. Verify `EMAIL_FROM` matches verified domain

---

## Cost Breakdown

| Usage | Cost | Suitable For |
|-------|------|--------------|
| 0 - 3,000 emails/month | **FREE** | Testing & Early Stage |
| 3,001 - 50,000 | $0.10/1,000 | Growing SaaS |
| 50,001+ | Volume pricing | Enterprise |

**For ScotComply:**
- 100 users × 1 password reset/month = 100 emails
- Well within free tier! ✅

---

## Alternative: Development Fallback

If Resend is not configured, the app will:
1. Log email content to console
2. Continue without sending
3. Still save reset token to database
4. Developers can get link from Vercel logs

This allows development without email setup, but **NOT recommended for production**.

---

## Next Steps

1. ✅ Sign up for Resend
2. ✅ Get API key
3. ✅ Add to Vercel env vars
4. ✅ Verify domain (or use test domain)
5. ✅ Redeploy app
6. ✅ Test password reset
7. 🎉 Enjoy automated password reset emails!

---

## Files Modified

- ✅ `src/lib/email.ts` - Added `sendPasswordResetEmail()` function
- ✅ `src/app/api/auth/forgot-password/route.ts` - Integrated email sending
- ✅ `package.json` - Added `resend` dependency

**Status**: Email integration complete, just needs Resend API key configuration!
