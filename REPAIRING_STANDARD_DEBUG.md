# Repairing Standard Page - Debugging Guide

## Current Status
There's a client-side error when trying to access the Repairing Standard page at `https://scotcomply.co.uk/dashboard/repairing-standard`.

## Error Message
> Application error: a client-side exception has occurred while loading scotcomply.co.uk (see the browser console for more information).

## Recent Changes Made

### 1. Error Handling Improvements ✅
- Added explicit `undefined` parameters to tRPC queries that don't require input
- Added error state variables (`propertiesError`, `assessmentsError`, `statsError`)
- Added error display UI with red alert box showing detailed error messages
- Added console.error logging for all query errors

### 2. Loading States ✅
- Created `loading.tsx` - Shows skeleton UI while page loads
- Added animated loading states for cards and assessments

### 3. Error Boundary ✅
- Created `error.tsx` - Catches and displays React errors with:
  - Error message display
  - Error ID (digest)
  - "Try Again" button
  - "Go to Dashboard" button  
  - Common troubleshooting tips

### 4. Null Safety ✅
- Added proper null checks for properties dropdown
- Added fallback "No properties available" option when properties array is empty

## How to Debug Further

### Step 1: Check Browser Console
1. Open https://scotcomply.co.uk/dashboard/repairing-standard
2. Press `F12` or `Cmd+Option+I` (Mac) to open DevTools
3. Go to **Console** tab
4. Look for errors (red text) - screenshot this and share

### Step 2: Check Network Tab
1. In DevTools, go to **Network** tab
2. Reload the page (`Cmd+R` or `Ctrl+R`)
3. Look for failed requests (red status codes like 500, 404, etc.)
4. Click on failed requests to see error details
5. Screenshot and share the error response

### Step 3: Check What Works
Try accessing other dashboard pages to isolate the issue:
- ✅ Dashboard home: `/dashboard`
- ✅ Properties: `/dashboard/properties`
- ✅ Certificates: `/dashboard/certificates`
- ❓ Repairing Standard: `/dashboard/repairing-standard` (currently failing)

### Step 4: Check If It's a Data Issue
The page makes these API calls:
1. `property.list` - Get properties list
2. `repairingStandard.getAssessments` - Get all assessments
3. `repairingStandard.getAssessmentStats` - Get statistics

If one of these fails, you'll see a red error box with the specific error message.

## Possible Causes

### 1. Database Schema Issue ❓
The `RepairingStandardAssessment` table might not exist or have incorrect schema.

**Check:**
```sql
-- Run this in Neon database console
SELECT * FROM "RepairingStandardAssessment" LIMIT 1;
```

If this fails, run the Prisma migration:
```bash
npx prisma migrate deploy
```

### 2. tRPC Query Issue ❓
The queries might be malformed or the router isn't properly exported.

**Verify:**
- Router is exported in `src/server/index.ts` ✅ (confirmed)
- Queries have correct syntax ✅ (confirmed)

### 3. Authentication Issue ❓
User might not be authenticated or session expired.

**Check:**
- Can you access other protected pages? 
- Try logging out and back in

### 4. Vercel Deployment Issue ❓
Recent deployments are failing on Vercel but building locally.

**Latest Successful Deployment:**
- URL: https://scottish-compliance-31qule3y8-cyberdexas-projects.vercel.app
- Age: 7 minutes ago
- Status: ● Ready

**Try:**
1. Access this direct deployment URL
2. If it works, the issue is with the latest code
3. If it fails, the issue is environmental

## Next Steps

Please try this in your browser:

1. **Test the working deployment:**
   - Go to: https://scottish-compliance-31qule3y8-cyberdexas-projects.vercel.app/dashboard/repairing-standard
   - Does it work? If yes, we know the issue is in recent commits
   - If no, it's a data/database issue

2. **Check browser console:**
   - Screenshot any errors you see
   - Share the exact error message

3. **Try creating a property first:**
   - Go to `/dashboard/properties`
   - Create a new property
   - Then try accessing Repairing Standard again

## Files Modified

1. `src/app/dashboard/repairing-standard/page.tsx` - Main page with queries
2. `src/app/dashboard/repairing-standard/error.tsx` - Error boundary (NEW)
3. `src/app/dashboard/repairing-standard/loading.tsx` - Loading state (NEW)

## Commits
- `fa399f7` - Add explicit undefined to queries and error display
- `c5b1562` - Add error boundary and loading state
- `5f22e5a` - Remove .env.vercel from git tracking

## Expected Behavior

When working correctly, the page should:
1. Show loading skeleton while fetching data
2. Display statistics cards (Total, Compliant, Non-Compliant, In Progress)
3. Show "Create New Assessment" card with property dropdown
4. List existing assessments (or "No assessments yet" message)

If any query fails, you should see a **red error box** at the top with the specific error message.
