# RSS Monitor Setup with GitHub Actions

## Why GitHub Actions?
- ✅ **Completely FREE** (unlimited cron jobs)
- ✅ **No additional services** needed
- ✅ **Already integrated** with your repo
- ✅ **Manual trigger** option available
- ✅ **View logs** directly in GitHub

---

## Quick Setup (5 minutes)

### Step 1: Add Secret to GitHub Repository

1. Go to: https://github.com/CyberDexa/scotcomply/settings/secrets/actions
2. Click **"New repository secret"**
3. Fill in:
   - **Name**: `CRON_SECRET`
   - **Value**: `scotcomply_cron_2024_a8f9e3c1b5d7f2e4a6c8b9d1f3e5a7c9`
4. Click **"Add secret"**

### Step 2: Add Secret to Vercel Environment Variables

1. Go to: https://vercel.com/cyberdexas-projects/scottish-compliance-app/settings/environment-variables
2. Click **"Add New"**
3. Fill in:
   - **Key**: `CRON_SECRET`
   - **Value**: `scotcomply_cron_2024_a8f9e3c1b5d7f2e4a6c8b9d1f3e5a7c9`
   - **Environment**: Production (check the box)
4. Click **"Save"**
5. **Important**: Redeploy your app for the env var to take effect

### Step 3: Verify It Works

**Option A: Wait for Automatic Run**
- The workflow will run automatically tomorrow at 9 AM GMT

**Option B: Test Manually Now**
1. Go to: https://github.com/CyberDexa/scotcomply/actions
2. Click **"RSS Monitor Cron Job"** (left sidebar)
3. Click **"Run workflow"** dropdown (right side)
4. Click green **"Run workflow"** button
5. Wait 30 seconds, refresh page
6. Click on the workflow run to see logs

---

## How It Works

```
GitHub Actions (Free, Unlimited)
       ↓ (Every day at 9 AM GMT)
       ↓ (Sends authenticated GET request)
       ↓
https://your-vercel-app.vercel.app/api/cron/rss-monitor
       ↓ (Verifies CRON_SECRET)
       ↓ (If valid)
       ↓
RSS Monitor Endpoint
       ↓ (Fetches RSS feeds from councils)
       ↓ (Analyzes for landlord-related news)
       ↓ (Creates alerts in database)
       ↓
User sees new alerts in dashboard
```

---

## Current Cron Jobs Setup

### Vercel Cron Jobs (2/2 - Free Tier Limit):
1. ✅ **Council Sync** - Every Monday at 3 AM
   - Scrapes council websites for fee/requirement changes
   - Core feature - automated intelligence gathering

2. ✅ **Notifications** - Every day at 9 AM
   - Sends email notifications to users
   - User engagement feature

### GitHub Actions (Unlimited - Free):
3. ✅ **RSS Monitor** - Every day at 9 AM
   - Monitors council news feeds
   - Creates alerts for landlord-related articles

---

## Monitoring & Logs

### View GitHub Actions Logs:
1. Go to: https://github.com/CyberDexa/scotcomply/actions
2. Click on any workflow run
3. Expand "Trigger RSS Monitor" to see detailed logs

### View Vercel Logs:
1. Go to: https://vercel.com/cyberdexas-projects/scottish-compliance-app
2. Click **Deployments** → Latest deployment
3. Click **Functions** → Find the `/api/cron/rss-monitor` log

---

## Troubleshooting

### ❌ Workflow fails with "401 Unauthorized"
**Fix**: Check that `CRON_SECRET` matches in both:
- GitHub repo secrets
- Vercel environment variables

### ❌ Workflow fails with "404 Not Found"
**Fix**: Verify your Vercel deployment URL is correct in `.github/workflows/rss-monitor-cron.yml`

### ❌ No workflow runs visible
**Fix**: 
1. Make sure the file is pushed to GitHub
2. Check that Actions are enabled: Repo Settings → Actions → General → Allow all actions

---

## Cost Comparison

| Service | Cost | Cron Jobs | Setup Time |
|---------|------|-----------|------------|
| **Vercel Free** | $0 | 2 max | 0 min (built-in) |
| **Vercel Pro** | $20/month | Unlimited | 0 min (built-in) |
| **GitHub Actions** | $0 | Unlimited | 5 min (one-time) |
| **cron-job.org** | $0 | 2 free | 10 min (per job) |
| **EasyCron** | $0 | 1 free | 10 min (per job) |

**Recommendation**: Use GitHub Actions (free, unlimited, integrated)

---

## When to Upgrade Vercel

Consider upgrading to Vercel Pro ($20/month) when:
- ✅ You have 10+ paying customers ($200+ MRR)
- ✅ Need faster build times
- ✅ Want all crons on Vercel (simpler management)
- ✅ Need more bandwidth/function executions

Until then, **GitHub Actions is the perfect free solution!**

---

## Next Steps

1. ✅ Add `CRON_SECRET` to GitHub (Step 1 above)
2. ✅ Add `CRON_SECRET` to Vercel (Step 2 above)
3. ✅ Test manually (Step 3 above)
4. 🎉 Enjoy automated RSS monitoring for free!

---

## Files Modified

- ✅ `.github/workflows/rss-monitor-cron.yml` - GitHub Actions workflow
- ✅ `vercel.json` - Reduced to 2 cron jobs for free tier

**Status**: Ready to use! Just add the secrets and you're done.
