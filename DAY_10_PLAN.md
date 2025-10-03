# 🎯 Day 10 Plan - PDF Reports & Certificate Integration

## Overview
**Date**: October 3, 2025  
**Day**: 10 of 40 (25% complete)  
**Focus**: PDF Report Generation & Certificate-Assessment Integration  
**Estimated Time**: 8 hours  
**AI Assistance**: 70%

---

## Morning Session (4 hours) - PDF Report Generation

### Objective
Generate professional, tribunal-ready PDF reports from Repairing Standard assessments.

### Tasks

#### 1. Setup PDF Library (30 minutes)
```bash
npm install @react-pdf/renderer
npm install --save-dev @types/react-pdf
```

#### 2. Create PDF Template Component (2 hours)
**File**: `src/components/repairing-standard/TribunalReport.tsx`

**Sections to Include**:
- Cover page with ScotComply branding
- Property details (address, landlord info)
- Assessment summary (date, overall score, status)
- Executive summary (key findings)
- 21-point checklist breakdown by category
  - Each checkpoint with status badge
  - Non-compliant items highlighted
  - Evidence photos embedded
  - Notes and observations
- Contractor information (for repairs)
- Cost breakdown (total repair costs)
- Timeline (when issues found, repair dates)
- Compliance score visualization
- Next steps and recommendations
- Legal disclaimer

#### 3. Build PDF Generator Service (1 hour)
**File**: `src/lib/pdf-generator.ts`

**Functions**:
- `generateTribunalReport(assessmentId)` - Main function
- `formatAssessmentData()` - Data serialization
- `embedEvidencePhotos()` - Image handling
- `calculateCompliance()` - Score calculation
- `generateFilename()` - Timestamp-based naming

#### 4. Add Download Button to UI (30 minutes)
**Location**: Assessment detail page (`/dashboard/repairing-standard/[id]`)

**UI Elements**:
- "Download Report" button (top right)
- Loading state during generation
- Success toast with download link
- Error handling

**Expected Output**:
```
tribunal-report-property-123-2025-10-03.pdf
```

---

## Afternoon Session (4 hours) - Certificate Integration

### Objective
Link certificates to assessment checkpoints and create unified compliance view.

### Tasks

#### 1. Certificate-Checkpoint Mapping (1 hour)
**File**: `src/lib/certificate-checkpoint-mapping.ts`

**Mapping Logic**:
```typescript
const CERTIFICATE_CHECKPOINT_MAP = {
  GAS_SAFETY: ['safe_services_gas'],
  EICR: ['safe_services_electrical'],
  EPC: ['heating_adequate', 'heating_controllable'],
  LEGIONELLA: ['safe_services_water'],
  PAT: ['safe_services_electrical']
}
```

**Functions**:
- `linkCertificatesToAssessment(assessmentId)` - Auto-link
- `getCertificateForCheckpoint(checkpointId)` - Get related cert
- `updateCheckpointFromCertificate(certificateId)` - Auto-populate status

#### 2. Auto-Populate Compliance (1.5 hours)
**Updates**: Repairing Standard router

**New Endpoint**: `syncCertificates`
```typescript
syncCertificates: protectedProcedure
  .input(z.object({ assessmentId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Get assessment with property
    // Find all valid certificates for property
    // Map certificates to checkpoints
    // Update checkpoint status to 'compliant' if cert valid
    // Update checkpoint status to 'non_compliant' if cert expired
    // Return updated assessment
  })
```

**Logic**:
- Gas Safety cert valid → "Gas supply safe" = compliant
- Gas Safety cert expired → "Gas supply safe" = non_compliant
- EICR valid → "Electrical installations safe" = compliant
- EICR expired → "Electrical installations safe" = non_compliant

#### 3. Certificate Warnings in Assessments (1 hour)
**Location**: Assessment wizard component

**UI Enhancements**:
- Warning badge if related certificate expired
- Link to certificate detail
- "Renew Certificate" button
- Expiry countdown (e.g., "Expires in 14 days")
- Visual indicator (icon + color)

**Example**:
```
⚠️ Related Certificate Expiring
Gas Safety Certificate expires in 7 days
[View Certificate] [Renew Now]
```

#### 4. Unified Compliance Dashboard (1.5 hours)
**File**: `src/app/dashboard/compliance/page.tsx`

**Layout**:

**Top Section - Overall Compliance Score**
- Large percentage badge
- Color-coded (green ≥80%, yellow 60-79%, red <60%)
- Breakdown by category

**Middle Section - Quick Stats**
- Total properties
- Compliant properties
- Properties with issues
- Certificates expiring soon

**Main Content - Property Cards**
Each property shows:
- Property address
- Overall compliance score
- Certificate status (5 types with expiry dates)
- Repairing Standard score
- HMO status (if applicable)
- Registration status
- Quick actions (View Details, Generate Report)

**Filters**:
- Compliance level (all, compliant, non-compliant, at-risk)
- Certificate type
- Location

**Expected Result**: Landlord sees ALL compliance data in one dashboard.

---

## Testing Checklist

### PDF Report Testing
- [ ] Generate report for fully compliant assessment
- [ ] Generate report for non-compliant assessment
- [ ] Test with 0 evidence photos
- [ ] Test with 10+ evidence photos
- [ ] Verify all 21 checkpoints included
- [ ] Check page breaks work correctly
- [ ] Verify images render properly
- [ ] Test download on mobile
- [ ] Check file size (should be <5MB)

### Certificate Integration Testing
- [ ] Link Gas Safety cert to assessment
- [ ] Link EICR to assessment
- [ ] Test with expired certificate (should mark non-compliant)
- [ ] Test with valid certificate (should mark compliant)
- [ ] Test sync certificates endpoint
- [ ] Verify warning badges appear
- [ ] Test certificate renewal flow from assessment
- [ ] Check unified dashboard loads all data

---

## Success Criteria

By end of Day 10, the following should work:

✅ **PDF Reports**:
- Landlord can download tribunal-ready PDF from any assessment
- PDF includes all 21 checkpoints with status
- PDF includes evidence photos
- PDF includes contractor and cost info
- PDF is professionally formatted

✅ **Certificate Integration**:
- Certificates auto-populate assessment compliance
- Expired certificates trigger non-compliant status
- Assessment shows warnings for expiring certificates
- Quick links between certificates and assessments

✅ **Unified Dashboard**:
- One page shows all compliance data
- Property cards show cert status + assessment score
- Easy to identify at-risk properties
- Quick actions to fix issues

---

## Files to Create/Modify

### New Files:
1. `src/components/repairing-standard/TribunalReport.tsx` (PDF template)
2. `src/lib/pdf-generator.ts` (PDF service)
3. `src/lib/certificate-checkpoint-mapping.ts` (Mapping logic)
4. `src/app/dashboard/compliance/page.tsx` (Unified dashboard)
5. `src/components/compliance/PropertyComplianceCard.tsx` (Card component)

### Modified Files:
1. `src/server/routers/repairing-standard.ts` (Add syncCertificates endpoint)
2. `src/components/repairing-standard/AssessmentWizard.tsx` (Add cert warnings)
3. `src/app/dashboard/repairing-standard/[id]/page.tsx` (Add download button)

### Estimated Lines of Code:
- PDF generation: ~400 lines
- Certificate integration: ~300 lines
- Unified dashboard: ~400 lines
- **Total**: ~1,100 lines

---

## Expected Outcomes

### For Landlords:
- Can generate professional reports in 2 clicks
- See all compliance data in one place
- Get automatic warnings for expiring certificates
- Quick identification of non-compliant properties
- Ready-to-submit tribunal reports

### For the System:
- Certificates and assessments work together
- Automatic compliance updates
- Reduced manual data entry
- Better data integrity
- Comprehensive compliance tracking

---

## Next Day Preview (Day 11)

After Day 10, we'll build:
- In-app notification center (dropdown with bell icon)
- Real-time notifications for expiring certs, completed assessments
- Notification preferences (email + in-app)
- Notification history page

---

**Let's build Day 10! 🚀**
