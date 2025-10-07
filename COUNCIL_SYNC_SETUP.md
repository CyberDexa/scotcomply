# Council Data Sync - Setup & Testing Guide

## 🎯 What This Does

Automatically scrapes all 32 Scottish council websites weekly to detect changes in:
- Landlord registration fees
- HMO license fees  
- Processing times
- Contact information (email, phone)

When changes are detected:
1. ✅ Database is updated automatically
2. 🔔 Alerts are created for users
3. 📊 Change history is recorded
4. 📧 Users are notified (via existing notification system)

## 📅 Schedule

**Every Monday at 3:00 AM GMT**
- Cron expression: `0 3 * * 1`
- Duration: ~10 minutes (2 seconds between each council)
- Priority councils scraped first: Edinburgh, Glasgow, Aberdeen, Dundee, Stirling

## 🔒 Security Setup

The cron job requires authentication to prevent unauthorized access.

### Step 1: Add CRON_SECRET to Vercel

```bash
# Generate a random secret
openssl rand -base64 32

# Add to Vercel (use the generated secret)
npx vercel env add CRON_SECRET production

# When prompted, paste the secret value
# Example: abc123xyz456def789ghi012jkl345mno678pqr901stu234
```

### Step 2: Verify in Vercel Dashboard

1. Go to: https://vercel.com/[your-team]/scottish-compliance-app/settings/environment-variables
2. Confirm `CRON_SECRET` exists in Production
3. Value should be encrypted (hidden)

## 🧪 Testing

### Test Locally

```bash
# 1. Start dev server
npm run dev

# 2. Set CRON_SECRET in .env.local
echo "CRON_SECRET=test-secret-123" >> .env.local

# 3. Call the endpoint
curl http://localhost:3000/api/cron/council-sync \
  -H "Authorization: Bearer test-secret-123"

# Expected response (after ~10 mins):
{
  "success": true,
  "duration": "602.34s",
  "total": 32,
  "successful": 28,
  "failed": 4,
  "changes": 3,
  "alertsCreated": 2,
  "errors": [
    "Some Council: Website unreachable",
    "Another Council: Invalid HTML structure"
  ]
}
```

### Test in Production

```bash
# After deployment, trigger manually with Vercel CLI
npx vercel env pull .env.production  # Get the real CRON_SECRET

# Extract the secret
grep CRON_SECRET .env.production

# Call production endpoint
curl https://scotcomply.co.uk/api/cron/council-sync \
  -H "Authorization: Bearer [your-actual-secret]"
```

### Check Logs

```bash
# View Vercel logs
npx vercel logs scottish-compliance-app --follow

# Look for:
# 🚀 Starting council data sync...
# 📋 Found 32 councils to check
# 🔍 Checking City of Edinburgh Council...
# ✓ No changes for City of Edinburgh Council
# 🔔 Changes detected for Glasgow City Council: [...]
# ✅ Created alert for Glasgow City Council
# ✅ Council sync completed in 589.23s
```

## 📊 Monitoring

### Check Alerts Created

```sql
-- View recent alerts from automated sync
SELECT * FROM "RegulatoryAlert"
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
  AND "source" LIKE '%council%'
ORDER BY "createdAt" DESC;
```

### Check Council Changes

```sql
-- View recent council changes
SELECT 
  c."councilName",
  ch."changeType",
  ch."description",
  ch."impactLevel",
  ch."createdAt"
FROM "CouncilChange" ch
JOIN "CouncilData" c ON c.id = ch."councilId"
WHERE ch."createdAt" >= NOW() - INTERVAL '7 days'
ORDER BY ch."createdAt" DESC;
```

### Check Last Scrape Status

```sql
-- See when each council was last updated
SELECT 
  "councilName",
  "registrationFee",
  "hmoFee",
  "processingTimeDays",
  "updatedAt",
  NOW() - "updatedAt" as "time_since_update"
FROM "CouncilData"
ORDER BY "updatedAt" DESC;
```

## 🔧 How It Works

### 1. Scraper Service (`src/lib/council-scraper.ts`)

```typescript
// Generic scraper for any council
scrapeCouncilWebsite(councilName, url)

// Extracts data using pattern matching
extractFee($, ['landlord registration fee', 'registration fee'])
extractEmail($)  // Finds emails in mailto: links
extractPhone($)  // Detects UK phone patterns

// Custom scrapers for complex sites
customScrapers = {
  'City of Edinburgh Council': scrapeEdinburghCouncil,
  'Glasgow City Council': scrapeGlasgowCouncil
}

// Detects what changed
detectChanges(oldData, newData)
// Returns: ["Registration fee changed from £88 to £95"]
```

### 2. Cron Job (`src/app/api/cron/council-sync/route.ts`)

```typescript
// Runs every Monday at 3 AM
GET /api/cron/council-sync

// For each council:
1. Scrape website
2. Compare with database
3. If changes found:
   - Update CouncilData
   - Create CouncilChange record
   - Create RegulatoryAlert if significant
4. Log results
```

### 3. Alert Generation Logic

**Fee Changes:**
- >20% increase → HIGH severity alert
- 10-20% increase → MEDIUM severity alert  
- <10% increase → LOW severity alert

**Other Changes:**
- Processing time → MEDIUM severity
- Contact info → LOW severity
- Policy changes → MEDIUM severity

## 🚨 Error Handling

The cron job is resilient:
- ✅ Continues if one council fails
- ✅ Logs all errors for review
- ✅ Returns summary of successes/failures
- ✅ Rate limited (2s between requests)
- ✅ Priority councils scraped first

Example error log:
```
❌ Failed to scrape Orkney Islands Council: Website unreachable
❌ Error processing Shetland Islands Council: Timeout after 30s
```

## 📈 Performance

**Expected Results:**
- Total time: ~10 minutes (32 councils × 2s = 64s minimum)
- Success rate: 85-95% (some councils have complex/changing sites)
- Changes detected: 0-5 per week typically
- Alerts created: 0-3 per week

**Optimization:**
- Priority councils first (high traffic areas)
- 2 second delays prevent rate limiting
- 5 minute max execution time (Vercel free tier limit)

## 🔄 Manual Sync

If you need to sync immediately (don't wait for Monday 3 AM):

```bash
# Option 1: Call the endpoint directly
curl https://scotcomply.co.uk/api/cron/council-sync \
  -H "Authorization: Bearer [CRON_SECRET]"

# Option 2: Use Vercel dashboard
# Go to Deployments → Functions → council-sync → Invoke

# Option 3: Build admin panel (Task 6)
# Dashboard → Admin → Councils → "Sync Now" button
```

## 🎯 Next Steps

1. ✅ Deploy to production
2. ✅ Add CRON_SECRET to Vercel
3. ⏳ Monitor first sync (next Monday 3 AM)
4. ⏳ Review alerts created
5. ⏳ Adjust scraper patterns if needed
6. ⏳ Add custom scrapers for failed councils
7. ⏳ Build admin panel for manual control (Task 6)

## 📝 Notes

- **Rate Limiting**: 2 seconds between councils prevents server bans
- **Timeout**: Each council has 30s max scrape time
- **Retries**: No automatic retries (failed councils logged for manual review)
- **Custom Scrapers**: Add to `customScrapers` object if generic scraper fails
- **Vercel Logs**: Retained for 30 days on free tier
- **Cost**: £0/month (serverless, ~10 min/week execution)

## 🐛 Troubleshooting

**"Unauthorized" error:**
- Check `CRON_SECRET` is set in Vercel
- Verify `Authorization: Bearer [secret]` header is correct

**No changes detected:**
- Normal! Most weeks have no changes
- Check `updatedAt` to confirm scraping is running

**High failure rate (>20%):**
- Check Vercel logs for specific errors
- Review failed councils and create custom scrapers
- Some councils may have temporary outages

**Timeout errors:**
- Increase `maxDuration` in route.ts (max 300s on free tier)
- Reduce number of councils per run
- Add pagination/chunking for large batches

## 📚 Related Files

- `/src/lib/council-scraper.ts` - Scraping service
- `/src/app/api/cron/council-sync/route.ts` - Cron job endpoint
- `/vercel.json` - Cron schedule configuration
- `/prisma/schema.prisma` - Database models (CouncilData, RegulatoryAlert, CouncilChange)
- `/COUNCIL_INTELLIGENCE_STATUS.md` - Current state documentation
