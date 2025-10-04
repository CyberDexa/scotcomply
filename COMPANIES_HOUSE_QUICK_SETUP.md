# 🎯 Quick Setup: Get Your FREE Companies House API Key

## ⏱️ Takes 3 Minutes

### Step 1: Register (1 minute)
1. Go to: https://developer.company-information.service.gov.uk/
2. Click **"Register"** (top right corner)
3. Fill in:
   - Email address
   - Choose password  
   - First & last name
4. Check your email and click verification link

### Step 2: Create Application (1 minute)
1. Sign in: https://developer.company-information.service.gov.uk/
2. Click **"Your applications"** (top menu)
3. Click **"Create an application"**
4. Fill in:
   ```
   Application name: ScotComply
   Description: Company verification for Scottish letting compliance
   ```
5. Click **"Create"**

### Step 3: Get Your API Key (30 seconds)
1. You'll see your new application listed
2. Click on **"ScotComply"**
3. Your API key is displayed (looks like: `abc123def456...`)
4. **Copy it** (click the copy button)

### Step 4: Add to Vercel (30 seconds)
1. Go to: https://vercel.com/cyberdexas-projects/scottish-compliance-app/settings/environment-variables
2. Click **"Add New"**
3. Enter:
   - **Name:** `COMPANIES_HOUSE_API_KEY`
   - **Value:** [paste your API key]
   - **Environment:** Production ✓
4. Click **"Save"**

### Step 5: Deploy (automatic)
Your app will automatically redeploy with the new API key!

---

## ✅ Done!

Your AML screening now uses:
- ✅ Real UK company data
- ✅ Real sanctions lists (OFAC, UN, EU)
- ✅ Free forever (600 requests per 5 minutes)

---

## 🧪 Test It

Try screening these real UK companies:

```
Company Number: 00000006   → Barclays Bank PLC
Company Number: 01234567   → Any real UK company
```

Or search by name in your app!

---

## 💰 Cost

**Companies House API:** £0 (100% FREE)  
**Sanctions Lists:** £0 (100% FREE open-source)  
**Total:** £0 Forever!

---

## 📞 Need Help?

**Companies House API Support:**
- Email: enquiries@companieshouse.gov.uk
- Docs: https://developer-specs.company-information.service.gov.uk/

**Or just ask me!** 🚀
