# 🌐 ScotComply Domain Setup Guide

## Your Custom Domain: scotcomply.co.uk

---

## ✅ Step 1: Update Environment Variables in Vercel

**Go to:** https://vercel.com/cyberdexas-projects/scottish-compliance-app/settings/environment-variables

### Update/Add These Variables (with your new domain):

| Variable Name | Value | Environment | Action |
|--------------|-------|-------------|---------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_IGYtlwJKrc21@ep-polished-cell-adnqx7d8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require` | Production | Add/Update |
| `NEXTAUTH_SECRET` | `mMOTOqVzoB9sHbDXo6duqQ3rT+a9nGJ05HISSIcV2R0=` | Production | Add/Update |
| **`NEXTAUTH_URL`** ✨ | **`https://scotcomply.co.uk`** | Production | Add/Update |
| **`EMAIL_FROM`** ✨ | **`noreply@scotcomply.co.uk`** | Production | Add |
| **`APP_URL`** ✨ | **`https://scotcomply.co.uk`** | Production | Add |
| `NODE_ENV` | `production` | Production | Add |

---

## 🌐 Step 2: Add Custom Domain in Vercel

### A. Navigate to Domains Settings
1. Go to: https://vercel.com/cyberdexas-projects/scottish-compliance-app/settings/domains
2. Click **"Add"** button
3. Enter: `scotcomply.co.uk`
4. Click **"Add"**

### B. Vercel Will Provide DNS Configuration

After adding the domain, Vercel will show you DNS records to configure. You'll see something like:

**Option 1: Nameservers (Recommended - Easiest)**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**Option 2: DNS Records**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## 🛒 Step 3: Purchase the Domain (If You Haven't)

### Recommended Registrars for .co.uk domains:

**1. Namecheap** (Recommended)
- URL: https://www.namecheap.com
- Price: ~£8-12/year
- Easy DNS management
- Free WHOIS privacy

**2. GoDaddy**
- URL: https://uk.godaddy.com
- Price: ~£10-15/year
- User-friendly interface

**3. Cloudflare Registrar** (Best Price)
- URL: https://www.cloudflare.com/products/registrar/
- Price: At-cost (~£7/year)
- Requires Cloudflare account

**4. Google Domains (now Squarespace)**
- URL: https://domains.squarespace.com
- Price: ~£10-12/year

---

## ⚙️ Step 4: Configure DNS at Your Registrar

### Option A: Use Vercel Nameservers (Easiest - Recommended)

**At your domain registrar:**

1. Find "Nameservers" or "DNS Settings"
2. Change to "Custom Nameservers"
3. Replace with Vercel's nameservers:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
4. Save changes
5. ✅ Done! Vercel handles everything automatically

**Propagation time:** 1-48 hours (usually 1-2 hours)

---

### Option B: Use Your Registrar's DNS

**At your domain registrar's DNS settings:**

1. **Add A Record:**
   - Type: `A`
   - Name: `@` (or leave blank)
   - Value: `76.76.21.21`
   - TTL: `3600` (or default)

2. **Add CNAME for www:**
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`
   - TTL: `3600` (or default)

3. **Save changes**

**Propagation time:** 1-24 hours (usually 1-2 hours)

---

## 🔍 Step 5: Verify Domain Setup

### Check DNS Propagation:

**Online Tools:**
- https://www.whatsmydns.net/#A/scotcomply.co.uk
- https://dnschecker.org/#A/scotcomply.co.uk

**Command Line:**
```bash
# Check A record
dig scotcomply.co.uk

# Check CNAME for www
dig www.scotcomply.co.uk

# Alternative (using nslookup)
nslookup scotcomply.co.uk
nslookup www.scotcomply.co.uk
```

### Expected Results:
```
scotcomply.co.uk → 76.76.21.21
www.scotcomply.co.uk → cname.vercel-dns.com
```

---

## 🔐 Step 6: SSL Certificate (Automatic)

Vercel automatically provisions SSL certificates once DNS is configured:

1. **Wait for DNS propagation** (1-48 hours)
2. Vercel detects the domain
3. **Automatic SSL certificate** via Let's Encrypt
4. **HTTPS enabled** automatically
5. **HTTP → HTTPS redirect** enabled

**Check SSL Status:**
- Visit: https://scotcomply.co.uk
- Look for 🔒 padlock in browser

---

## 📋 Complete Setup Checklist

### In Vercel Dashboard:
- [ ] Add environment variables (with scotcomply.co.uk URLs)
- [ ] Add custom domain: scotcomply.co.uk
- [ ] Note DNS configuration provided by Vercel

### At Domain Registrar:
- [ ] Purchase scotcomply.co.uk (if not owned)
- [ ] Update nameservers to Vercel's (Option A - recommended)
  - OR -
- [ ] Add A and CNAME records (Option B)

### Verification:
- [ ] Wait for DNS propagation (check with whatsmydns.net)
- [ ] Verify scotcomply.co.uk resolves to 76.76.21.21
- [ ] Check SSL certificate is active (🔒 in browser)
- [ ] Test https://scotcomply.co.uk loads your app
- [ ] Test https://www.scotcomply.co.uk redirects properly

### Final Steps:
- [ ] Test signup/signin on new domain
- [ ] Verify email notifications use noreply@scotcomply.co.uk
- [ ] Update any marketing materials with new domain
- [ ] Share with users! 🎉

---

## 🚀 After Domain is Live

### Update Your Documentation:

**README.md:**
```markdown
## 🌐 Live Application
- **Production:** https://scotcomply.co.uk
- **Repository:** https://github.com/CyberDexa/scotcomply
```

### Test Everything:
1. Visit https://scotcomply.co.uk
2. Click "Get Started" → Create account
3. Sign in with new account
4. Test dashboard features
5. Verify all pages load correctly

---

## 💰 Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Domain (scotcomply.co.uk) | £7-15 | Annual |
| Vercel Hosting | FREE | Forever (Hobby plan) |
| SSL Certificate | FREE | Automatic renewal |
| Neon PostgreSQL | FREE | Monthly (0.5GB free tier) |
| **Total** | **£7-15/year** | - |

---

## 🔧 Troubleshooting

### Domain not resolving after 24 hours:
- Verify nameservers are correct
- Check DNS records are exactly as specified
- Clear DNS cache: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder` (macOS)

### SSL certificate not working:
- Wait 24-48 hours for full DNS propagation
- Verify domain shows "Valid Configuration" in Vercel
- Check Vercel dashboard for SSL status

### www not redirecting:
- Ensure CNAME record for www is added
- Wait for DNS propagation
- Vercel automatically redirects www → apex

---

## 📞 Support Resources

**Vercel Documentation:**
- Custom Domains: https://vercel.com/docs/custom-domains
- DNS Configuration: https://vercel.com/docs/custom-domains/dns-records

**Domain Registrars:**
- Namecheap Support: https://www.namecheap.com/support/
- GoDaddy Support: https://uk.godaddy.com/help

**DNS Tools:**
- DNS Checker: https://dnschecker.org
- What's My DNS: https://www.whatsmydns.net

---

## ✨ Benefits of Custom Domain

✅ **Professional branding:** scotcomply.co.uk vs long Vercel URL  
✅ **Better SEO:** Custom domains rank better  
✅ **Trust:** Users trust .co.uk domains more  
✅ **Memorable:** Easy for users to remember  
✅ **Email:** Can set up email@scotcomply.co.uk later  
✅ **Marketing:** Clean URL for business cards, ads  

---

**Next Step:** Purchase scotcomply.co.uk and follow the setup steps above! 🚀

**Last Updated:** October 3, 2025  
**Domain:** scotcomply.co.uk  
**Status:** Ready to configure
