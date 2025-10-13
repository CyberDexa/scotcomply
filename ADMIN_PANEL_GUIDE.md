# Admin Panel Guide - Council Management

**Version**: 1.0  
**Last Updated**: 8 October 2025  
**Access Level**: Admin Only

## 📋 Overview

The Admin Panel provides powerful tools for managing the Council Intelligence System. It allows administrators to manually control council data synchronization, override scraped data, and monitor the freshness of council information across all 32 Scottish councils.

**Location**: `/dashboard/admin/councils`

**Access Requirements**:
- User role must be `ADMIN`
- Only visible to users with admin privileges
- Protected by NextAuth session validation

---

## 🎯 Features

### 1. **Council Overview Dashboard**

**Stats Cards**:
- **Total Councils**: 32 Scottish councils
- **Fresh Data**: Councils scraped within last 7 days (🟢 Green)
- **Aging Data**: Councils scraped 7-30 days ago (🟡 Yellow)
- **Stale/Never**: Councils with data older than 30 days or never scraped (🔴 Red)

**Data Table**:
- Searchable list of all councils
- Real-time freshness indicators
- Last scraped timestamp
- Current fees (registration, HMO)
- Processing time in days
- Action buttons per council

---

### 2. **Manual Sync Operations**

#### **Single Council Sync**

**How to Use**:
1. Find the council in the table (use search if needed)
2. Click the **"Sync"** button next to the council
3. Wait for the operation to complete (loading spinner shows progress)
4. Toast notification confirms success or shows error

**What Happens**:
- Council website is scraped immediately
- Data is updated in database
- `lastScraped` timestamp is set to current time
- Changes are detected and logged
- Alerts are created for significant changes (fee increases)

**Response Time**: 2-5 seconds per council

**API Endpoint**: `POST /api/admin/sync-council`

**Payload**:
```json
{
  "councilId": "cm1ubzr3w0002h6lvs64rsmso"
}
```

**Success Response**:
```json
{
  "success": true,
  "councilName": "City of Edinburgh Council",
  "changes": [
    "Registration fee changed from £88 to £95"
  ],
  "changesDetected": 1,
  "scrapedData": {
    "registrationFee": 95,
    "renewalFee": 72,
    "processingTimeDays": 28
  }
}
```

---

#### **Bulk Sync All Councils**

**How to Use**:
1. Click the **"Sync All"** button at the top of the page
2. Confirm the operation (this can take several minutes)
3. Monitor progress via console logs (if dev tools open)
4. Toast notification confirms completion

**What Happens**:
- All 32 councils are processed sequentially
- Priority councils processed first:
  - City of Edinburgh Council
  - Glasgow City Council
  - Aberdeen City Council
  - Dundee City Council
  - Stirling Council
- 2-second delay between each council (rate limiting)
- Comprehensive results summary returned
- Individual errors logged per council

**Response Time**: 2-3 minutes for all 32 councils

**API Endpoint**: `POST /api/admin/sync-all-councils`

**Success Response**:
```json
{
  "success": true,
  "results": {
    "total": 32,
    "successful": 30,
    "failed": 2,
    "changes": 5,
    "alertsCreated": 3,
    "errors": [
      {
        "council": "Some Council",
        "error": "Timeout after 30 seconds"
      }
    ]
  }
}
```

**⚠️ Important Notes**:
- Maximum duration: 5 minutes (300 seconds)
- Skips councils without `landlordRegUrl`
- Creates alerts only for fee changes
- Uses `FEE_CHANGE` alert type and `FEES` category
- Sets alert severity to `MEDIUM` by default

---

### 3. **Data Override (Edit Dialog)**

**How to Use**:
1. Find the council in the table
2. Click the **"Edit"** (pencil icon) button
3. Modify any of the editable fields:
   - Registration Fee
   - Renewal Fee
   - HMO Fee
   - Processing Time (days)
   - Contact Email
   - Contact Phone
   - Landlord Registration URL
   - HMO License URL
4. Click **"Save Changes"**
5. Toast notification confirms success

**When to Use**:
- Scraped data is incorrect
- Manual data entry from phone calls/emails
- Temporary fixes while scraper is being debugged
- Council website is down but data is known

**What Happens**:
- Data is updated immediately in database
- `updatedAt` timestamp is automatically set
- No alerts are created (manual override)
- Changes are not logged as "council changes"

**tRPC Mutation**: `council.updateCouncil`

**Payload Example**:
```typescript
{
  id: "cm1ubzr3w0002h6lvs64rsmso",
  data: {
    registrationFee: 95,
    renewalFee: 72,
    hmoFee: 150,
    processingTimeDays: 28,
    contactEmail: "landlord@edinburgh.gov.uk",
    contactPhone: "+44 131 529 7454",
    landlordRegUrl: "https://www.edinburgh.gov.uk/landlord-registration",
    hmoLicenseUrl: "https://www.edinburgh.gov.uk/hmo-licensing"
  }
}
```

**Validation**:
- Admin role required
- All fields are optional (only update what you provide)
- Null values are properly handled with `{ set: null }`

---

## 🔍 Data Freshness Indicators

The admin panel uses color-coded badges to show data freshness:

| Color | Status | Age | Action Required |
|-------|--------|-----|-----------------|
| 🟢 **Green** | Fresh | < 7 days | None - data is current |
| 🟡 **Yellow** | Aging | 7-30 days | Consider manual sync |
| 🔴 **Red** | Stale | > 30 days or never | **Manual sync required** |
| ⚫ **Gray** | Never | No `lastScraped` | **Initial sync needed** |

**Component**: `DataFreshnessBadge`

**Logic**:
```typescript
const daysSince = Math.floor(
  (Date.now() - lastScraped.getTime()) / (1000 * 60 * 60 * 24)
)

if (daysSince < 7) return 'fresh'    // Green
if (daysSince < 30) return 'aging'   // Yellow
return 'stale'                        // Red
```

---

## 🛡️ Security & Access Control

### **Role-Based Access**

**Required Role**: `ADMIN`

**Enforcement Points**:
1. **Page Level** (`/dashboard/admin/councils/page.tsx`):
   - Rendered only if session exists
   - Could add explicit role check redirect

2. **API Routes**:
   ```typescript
   const session = await getServerSession(authOptions)
   
   if (!session?.user) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   }
   
   if (session.user.role !== 'ADMIN') {
     return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
   }
   ```

3. **tRPC Mutation**:
   ```typescript
   if (ctx.session.user.role !== 'ADMIN') {
     throw new Error('Admin access required')
   }
   ```

### **Navigation Link**

**Location**: Header dropdown menu

**Visibility**: Only shown to users with `role === 'ADMIN'`

**Icon**: Shield (🛡️)

**Code**:
```tsx
{session?.user?.role === 'ADMIN' && (
  <DropdownMenuItem asChild>
    <Link href="/dashboard/admin/councils">
      <Shield className="mr-2 h-4 w-4" />
      Admin Panel
    </Link>
  </DropdownMenuItem>
)}
```

---

## 📊 Technical Architecture

### **Frontend Stack**

- **Framework**: Next.js 15.5.4 (App Router)
- **UI Components**: shadcn/ui
- **State Management**: React hooks (useState)
- **Data Fetching**: tRPC
- **Notifications**: shadcn toast
- **Styling**: Tailwind CSS

### **Backend Stack**

- **API Routes**: Next.js API handlers
- **Authentication**: NextAuth
- **Database**: PostgreSQL + Prisma ORM
- **Web Scraping**: Cheerio (via `council-scraper` lib)

### **Key Components**

```
src/app/dashboard/admin/councils/
└── page.tsx (450 lines)
    ├── Stats cards
    ├── Search input
    ├── Council table
    ├── Edit dialog
    └── Sync buttons

src/app/api/admin/
├── sync-council/route.ts (118 lines)
└── sync-all-councils/route.ts (154 lines)

src/server/routers/
└── council.ts
    └── updateCouncil mutation (lines 622-680)

src/components/
├── ui/table.tsx (shadcn)
├── ui/toast.tsx (shadcn)
└── ui/toaster.tsx (shadcn)

src/hooks/
└── use-toast.ts
```

---

## 🔧 Troubleshooting

### **Issue: "Unauthorized" Error**

**Symptoms**: Can't access admin panel, redirected to login

**Causes**:
- Not logged in
- Session expired

**Solution**:
1. Sign in again
2. Check that session is active
3. Verify cookies are enabled

---

### **Issue: "Admin access required" Error**

**Symptoms**: Can access dashboard but not admin panel

**Causes**:
- User role is not `ADMIN`
- Need to be promoted to admin

**Solution**:
1. Check user role in database:
   ```sql
   SELECT id, name, email, role FROM "User" WHERE email = 'your@email.com';
   ```

2. Update role to admin (database access required):
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
   ```

---

### **Issue: Sync Fails with Timeout**

**Symptoms**: Loading spinner runs forever, then error toast

**Causes**:
- Council website is down
- Network connectivity issues
- Scraper pattern outdated

**Solution**:
1. Check if council website is accessible
2. Try again in a few minutes
3. Check console for specific error message
4. Use Edit dialog to manually update data
5. Report scraper issues for that council

---

### **Issue: No Changes Detected**

**Symptoms**: Sync completes but says "0 changes"

**Causes**:
- Council data hasn't changed since last sync
- Scraper is correctly identifying unchanged data

**Solution**:
- This is normal! No action needed
- Only alerts are created when fees actually change

---

### **Issue: Bulk Sync is Slow**

**Symptoms**: "Sync All" takes 2-3 minutes

**Causes**:
- This is expected behavior
- 32 councils × 2-second delay = ~64 seconds minimum
- Plus actual scraping time per council

**Solution**:
- Be patient! The operation will complete
- Monitor progress in browser dev tools console
- Consider syncing individual councils if only specific ones need updates

---

## 📈 Best Practices

### **When to Use Manual Sync**

✅ **DO use manual sync when**:
- Data is stale (red badge)
- User reports incorrect fee
- Major policy change announced
- Testing scraper after fixes
- Before important deadlines

❌ **DON'T use manual sync when**:
- Data is fresh (green badge)
- Automated cron job runs soon (Monday 3 AM)
- No specific need to update

### **When to Use Edit Dialog**

✅ **DO use edit dialog when**:
- Scraper is broken for specific council
- Data confirmed via phone/email
- Temporary fix until scraper repaired
- Council website structure changed

❌ **DON'T use edit dialog when**:
- Scraper is working correctly
- Data can be synced normally
- Making bulk changes (use database directly)

### **Performance Optimization**

**For Best Results**:
1. Sync individual councils instead of bulk when possible
2. Only sync stale data (red/gray badges)
3. Avoid running bulk sync during peak hours
4. Let automated cron job handle routine updates

**Monitoring**:
- Check stats cards regularly
- Keep "Stale/Never" count low
- Aim for most councils in "Fresh" status

---

## 🚨 Error Handling

### **Client-Side Errors**

**Toast Notifications**:
- ✅ **Success**: Green toast with success message
- ❌ **Error**: Red toast with error details
- ⏳ **Loading**: Spinner in button during operation

**Error Types**:
```typescript
try {
  const response = await fetch('/api/admin/sync-council', {
    method: 'POST',
    body: JSON.stringify({ councilId })
  })
  
  if (!response.ok) {
    throw new Error('Sync failed')
  }
  
  const data = await response.json()
  
  if (!data.success) {
    toast({
      title: "Sync Failed",
      description: data.error || "Unknown error",
      variant: "destructive"
    })
  } else {
    toast({
      title: "Sync Complete",
      description: `${data.councilName} updated successfully`
    })
  }
} catch (error) {
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive"
  })
}
```

### **Server-Side Errors**

**Logged to Console**:
```typescript
console.error('❌ Admin sync failed:', error)
```

**Returned to Client**:
```json
{
  "success": false,
  "error": "Council not found"
}
```

**HTTP Status Codes**:
- `200`: Success
- `400`: Bad request (missing councilId, no URL)
- `401`: Unauthorized (no session)
- `403`: Forbidden (not admin)
- `404`: Council not found
- `500`: Server error (scraping failed, database error)

---

## 📝 Changelog

### **Version 1.0** (8 October 2025)
- ✨ Initial release
- ✅ Admin dashboard with council table
- ✅ Manual sync (single + bulk)
- ✅ Edit dialog for data overrides
- ✅ Real-time freshness indicators
- ✅ Toast notifications
- ✅ Role-based access control
- 🐛 Fixed enum values in sync operations
- 🐛 Fixed null handling in Prisma updates

---

## 🔮 Future Enhancements

**Planned Features**:
- [ ] Sync history log (who synced what and when)
- [ ] Batch edit for multiple councils
- [ ] Export council data to CSV
- [ ] Scraper health dashboard
- [ ] Automated retry for failed syncs
- [ ] Email notifications for admins
- [ ] Council comparison view
- [ ] Change diff viewer
- [ ] Rollback capability
- [ ] Scraper pattern editor

---

## 📞 Support

**For Technical Issues**:
1. Check this guide first
2. Review console errors
3. Check database logs
4. Contact development team

**For Access Issues**:
1. Verify user role in database
2. Contact system administrator

**For Scraper Issues**:
1. Report council name and error
2. Provide screenshot of error
3. Include timestamp of failure

---

## ✅ Quick Reference

| Action | Location | Time | Requirements |
|--------|----------|------|--------------|
| Sync one council | Admin panel | 2-5s | Admin role |
| Sync all councils | Admin panel | 2-3min | Admin role |
| Edit council data | Admin panel | Instant | Admin role |
| View freshness | Admin panel | Real-time | Admin role |
| Access admin panel | Header menu | - | Admin role |

**Keyboard Shortcuts**: None currently

**Mobile Support**: Responsive design works on all devices

**Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

---

*For questions or issues, please refer to the main project documentation or contact the development team.*
