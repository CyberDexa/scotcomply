# Council List Issue - Troubleshooting Guide

## Problem Summary
The production site shows **no councils** because Vercel is connected to an **empty database** (different from the one you seeded locally).

## Root Cause
There are **TWO different databases**:
1. **Local database** (in `.env.production.local`): Has 32 councils ✅
2. **Vercel's database**: Empty (0 councils) ❌

## Immediate Fix Steps

### Step 1: Find the Correct Database URL
1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Find `DATABASE_URL`
3. **Copy the exact value**

### Step 2: Seed the Correct Database
1. In your terminal, run:
```bash
cd /Users/olaoluwabayomi/Desktop/ComplyScot/04_MY_PROJECTS/active/scottish-compliance-app

# Set the DATABASE_URL from Vercel
export DATABASE_URL="<paste-the-url-from-vercel-here>"

# Seed it
npx tsx prisma/seed/index.ts
```

### Step 3: Verify
1. Go to: https://scotcomply.co.uk/api/debug/councils
2. Should show: `"count": 32`
3. Then go to: https://scotcomply.co.uk/dashboard/councils/compare
4. Should see: 32 council buttons

## Alternative: Update Vercel's DATABASE_URL
If the local database is the correct one:
1. Copy DATABASE_URL from `.env.production.local`
2. Update it in Vercel Dashboard → Environment Variables
3. Redeploy the app

## Database Keep-Alive Issue
**Problem**: Neon free tier auto-pauses after 5 minutes.

**Current Status**: 
- ✅ GitHub Action created: `.github/workflows/database-keep-alive.yml`
- ❌ API endpoint not deployed yet (404 error)
- ✅ CRON_SECRET added to GitHub secrets

**Next Steps**:
1. Wait for `/api/keep-alive` to deploy (check deployment logs)
2. Manually trigger workflow: https://github.com/CyberDexa/scotcomply/actions/workflows/database-keep-alive.yml
3. Click "Run workflow" button

## Long-term Solution
When you have customers:
- Upgrade to **Neon Scale** ($19/month) for always-on database
- OR migrate to **Vercel Postgres** ($20/month)

## Files Created Today
- `/api/debug/councils` - Test database connection
- `/api/keep-alive` - Keep database awake (not deployed yet)
- `/api/seed/councils` - Seed councils via API (has import error)
- `.github/workflows/database-keep-alive.yml` - Auto-ping database

## Current State
- ✅ Password reset emails: Working
- ✅ Local development: Working  
- ✅ Production authentication: Working
- ❌ Production councils: Not showing (wrong database)
- ⏳ Keep-alive cron: Waiting for API deployment
