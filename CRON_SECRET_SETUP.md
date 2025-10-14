# Quick Fix: GitHub Actions Setup for RSS Monitor

## The Issue
Vercel already has a `CRON_SECRET` variable set. You just need to use the **same value** in GitHub Actions.

---

## ✅ Simple Solution (2 steps)

### **Step 1: Get the CRON_SECRET from Vercel**

**Option A: If you can see it on Vercel**
1. Go to: https://vercel.com/cyberdexas-projects/scottish-compliance-app/settings/environment-variables
2. Find `CRON_SECRET`
3. Click the eye icon to reveal it
4. Copy the value

**Option B: If Vercel hides it (common for security)**
1. Generate a new secure secret:
   ```bash
   openssl rand -hex 32
   ```
2. Copy the generated value (example: `a1b2c3d4e5f6...`)
3. Update CRON_SECRET on Vercel with this new value:
   - Go to Vercel → Environment Variables
   - Edit CRON_SECRET
   - Paste the new value
   - Save
   - **Important**: Redeploy your app after changing

### **Step 2: Add the Same Secret to GitHub**

1. Go to: https://github.com/CyberDexa/scotcomply/settings/secrets/actions
2. Click **"New repository secret"**
3. Fill in:
   - **Name**: `CRON_SECRET`
   - **Value**: (paste the same value from Step 1)
4. Click **"Add secret"**

---

## 🧪 Test It Works

### **Option 1: Test from Terminal** (After deployment finishes)

```bash
# Replace YOUR_SECRET with your actual CRON_SECRET
./test-rss-monitor.sh YOUR_SECRET
```

You should see: `✅ SUCCESS! The CRON_SECRET works!`

### **Option 2: Test from GitHub Actions**

1. Go to: https://github.com/CyberDexa/scotcomply/actions
2. Click **"RSS Monitor Cron Job"** (left sidebar)
3. Click **"Run workflow"** (green button on right)
4. Wait 30 seconds
5. Refresh and click on the workflow run
6. Check logs - should show successful API call

---

## 🔐 Recommended: Generate Fresh Secret for Both

If you're unsure what the current CRON_SECRET is, here's the cleanest approach:

```bash
# Generate a new secure secret
openssl rand -hex 32
```

This will output something like:
```
7f3a9b2c8d1e4f6a5c8b9d2e3f4a6c8b9d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5
```

Then:
1. **Update Vercel**: Set this as CRON_SECRET (Environment Variables)
2. **Add to GitHub**: Set this as CRON_SECRET (Repository Secrets)
3. **Redeploy** your Vercel app
4. **Test** the GitHub Action

---

## ⚠️ Important Notes

- Both secrets **must match exactly**
- After changing Vercel env vars, **redeploy the app**
- GitHub Actions will fail until deployment completes
- First test might take a few minutes (cold start)

---

## 🐛 Troubleshooting

### "401 Unauthorized"
**Cause**: Secrets don't match
**Fix**: Make sure Vercel and GitHub have the exact same CRON_SECRET

### "404 Not Found"
**Cause**: Deployment not finished or URL wrong
**Fix**: 
1. Check Vercel deployment status
2. Wait for deployment to complete
3. Verify URL in GitHub Actions workflow matches your Vercel domain

### "500 Internal Server Error"
**Cause**: App error (database connection, etc.)
**Fix**: Check Vercel function logs for details

---

## ✨ After Setup

Once working, your RSS monitor will:
- ✅ Run automatically every day at 9 AM GMT
- ✅ Monitor council news feeds
- ✅ Create alerts for landlord-related articles
- ✅ All completely FREE via GitHub Actions

---

## Need Help?

Run the test script to diagnose:
```bash
./test-rss-monitor.sh YOUR_CRON_SECRET
```

It will tell you exactly what's wrong and how to fix it.
