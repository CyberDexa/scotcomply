# Phase 2: Advanced Licensing (Weeks 4-5)

## 🎯 Phase Overview

**Duration**: 2 weeks (10 days)  
**Goal**: Implement HMO licensing tracking and Repairing Standard compliance tools  
**AI Assistance Target**: 70% code generation  
**Success Criteria**: Complete HMO license management and self-assessment tools integrated with Phase 1 features

---

## 📋 Feature Breakdown

### Feature 1: HMO License Tracking

#### Business Requirements

**HMO Definition (Scotland)**:
- **Standard HMO**: 3+ unrelated people sharing facilities
- **Small HMO**: 5-6 occupants
- **Large HMO**: 7+ occupants

**Licensing Requirements**:
- All HMOs require license from local council
- License duration varies by council (1-3 years)
- Council-specific requirements for fire safety, facilities, management
- Fees vary by council and property size
- Annual safety inspections may be required
- Maximum occupancy limits enforced

#### User Stories

**As a landlord with HMO properties, I want to:**
1. Register my HMO properties and track licensing status
2. Know which council-specific requirements apply to my property
3. Track license expiry and renewal deadlines
4. Calculate licensing fees for my council
5. Upload and store HMO license certificates
6. Track fire safety compliance requirements
7. Receive renewal reminders before license expires
8. Generate compliance reports for inspections

**As a letting agent managing HMOs, I want to:**
1. Manage HMO licenses across multiple properties and councils
2. Bulk upload HMO license data
3. Filter properties by license status and expiry
4. View all HMO requirements by council
5. Track occupancy limits across portfolio
6. Generate council-specific application checklists

#### Technical Requirements

**Database Schema**:
```prisma
model HMOLicense {
  id                   String               @id @default(cuid())
  propertyId           String               @unique  // One HMO license per property
  councilId            String
  
  // HMO Classification
  hmoType              HMOType
  maxOccupancy         Int
  numberOfBedrooms     Int
  numberOfBathrooms    Int
  numberOfKitchens     Int
  numberOfLivingRooms  Int
  
  // License details
  licenseNumber        String?              @unique
  applicationDate      DateTime?
  approvalDate         DateTime?
  expiryDate           DateTime?
  renewalDate          DateTime?            // Calculated: expiryDate - 90 days
  
  // Status
  status               HMOLicenseStatus     @default(NOT_REQUIRED)
  
  // Fees
  applicationFee       Decimal?             @db.Decimal(10, 2)
  annualInspectionFee  Decimal?             @db.Decimal(10, 2)
  
  // Fire Safety
  fireSafetyApproved   Boolean              @default(false)
  fireSafetyInspection DateTime?
  fireSafetyExpiry     DateTime?
  fireAlarms           Int
  fireExtinguishers    Int
  emergencyLighting    Boolean              @default(false)
  fireEscapeRoute      String?              @db.Text
  
  // Management
  managementCompany    String?
  onSiteManagement     Boolean              @default(false)
  emergencyContact     String?
  emergencyPhone       String?
  
  // Documents
  licenseUrl           String?
  floorPlanUrl         String?
  fireSafetyUrl        String?
  
  // Council requirements compliance
  meetsSpaceStandards  Boolean              @default(false)
  meetsFacilityStandards Boolean            @default(false)
  meetsManagementStandards Boolean          @default(false)
  
  // Metadata
  notes                String?              @db.Text
  lastInspectionDate   DateTime?
  nextInspectionDate   DateTime?
  inspectionNotes      String?              @db.Text
  
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  property             Property             @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  council              Council              @relation(fields: [councilId], references: [id])
  requirements         HMORequirement[]
  reminders            Reminder[]
  
  @@index([expiryDate])
  @@index([status])
  @@index([councilId])
  @@map("hmo_licenses")
}

enum HMOType {
  NOT_HMO
  SMALL_HMO        // 5-6 occupants
  LARGE_HMO        // 7+ occupants
}

enum HMOLicenseStatus {
  NOT_REQUIRED
  REQUIRED_NOT_APPLIED
  APPLICATION_IN_PROGRESS
  APPROVED
  RENEWAL_DUE
  EXPIRED
  REJECTED
  UNDER_REVIEW
}

model HMORequirement {
  id                   String               @id @default(cuid())
  hmoLicenseId         String
  
  // Requirement details
  category             HMORequirementCategory
  requirement          String               @db.Text
  description          String?              @db.Text
  
  // Compliance
  isMandatory          Boolean              @default(true)
  isCompliant          Boolean              @default(false)
  complianceDate       DateTime?
  complianceNotes      String?              @db.Text
  
  // Evidence
  evidenceUrl          String?
  evidenceType         String?              // photo, certificate, report
  
  // Metadata
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  hmoLicense           HMOLicense           @relation(fields: [hmoLicenseId], references: [id], onDelete: Cascade)
  
  @@index([hmoLicenseId])
  @@map("hmo_requirements")
}

enum HMORequirementCategory {
  FIRE_SAFETY
  SPACE_STANDARDS
  FACILITIES
  MANAGEMENT
  MAINTENANCE
  HEALTH_SAFETY
  AMENITIES
}

// Extend Council model from Phase 1
model CouncilHMORequirements {
  id                   String               @id @default(cuid())
  councilId            String
  
  // Specific requirements by council
  hmoType              HMOType
  minimumRoomSize      Decimal?             @db.Decimal(5, 2)  // Square meters
  minimumKitchenSize   Decimal?             @db.Decimal(5, 2)
  bathroomRatio        String?              // e.g., "1:4" (1 bathroom per 4 occupants)
  kitchenRatio         String?
  
  // Fire safety requirements
  requiresFireAlarm    Boolean              @default(true)
  alarmsRequired       Int
  requiresEmergencyLighting Boolean         @default(false)
  requiresFireBlankets Boolean              @default(true)
  requiresFireExtinguishers Boolean         @default(true)
  
  // Inspection requirements
  requiresAnnualInspection Boolean          @default(true)
  inspectionFee        Decimal?             @db.Decimal(10, 2)
  
  // Documentation
  requiresFloorPlan    Boolean              @default(true)
  requiresManagementPlan Boolean            @default(true)
  
  // Additional notes
  specificRequirements String?              @db.Text
  
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  council              Council              @relation(fields: [councilId], references: [id])
  
  @@unique([councilId, hmoType])
  @@map("council_hmo_requirements")
}
```

**API Endpoints**:
```typescript
// tRPC Router: hmo.ts

export const hmoRouter = router({
  // Determine if property is HMO
  checkHMOStatus: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      occupants: z.number(),
      areOccupantsRelated: z.boolean(),
    }))
    .query(async ({ ctx, input }) => {
      // Determine HMO type
      // Check if license required
      // Return HMO classification
    }),

  // Create or update HMO license
  upsertLicense: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      councilId: z.string(),
      hmoType: z.enum(['NOT_HMO', 'SMALL_HMO', 'LARGE_HMO']),
      maxOccupancy: z.number(),
      numberOfBedrooms: z.number(),
      numberOfBathrooms: z.number(),
      numberOfKitchens: z.number(),
      licenseNumber: z.string().optional(),
      applicationDate: z.date().optional(),
      expiryDate: z.date().optional(),
      applicationFee: z.number().optional(),
      // ... other fields
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns property
      // Create or update HMO license
      // Calculate renewal date if expiry provided
      // Load council-specific requirements
      // Schedule reminders
      // Return license with requirements
    }),

  // Get HMO license for property
  getByProperty: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Fetch HMO license
      // Include requirements
      // Calculate status and compliance
      // Return with council details
    }),

  // Get all HMO licenses for user
  getAll: protectedProcedure
    .input(z.object({
      status: z.enum(['ALL', 'APPROVED', 'EXPIRING', 'EXPIRED']).optional(),
      councilId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Fetch all HMO licenses for user's properties
      // Apply filters
      // Include property and council details
      // Return sorted by expiry date
    }),

  // Get council HMO requirements
  getCouncilRequirements: protectedProcedure
    .input(z.object({
      councilId: z.string(),
      hmoType: z.enum(['SMALL_HMO', 'LARGE_HMO']),
    }))
    .query(async ({ ctx, input }) => {
      // Fetch council-specific requirements
      // Return categorized requirements list
    }),

  // Calculate HMO license fee
  calculateFee: protectedProcedure
    .input(z.object({
      councilId: z.string(),
      hmoType: z.enum(['SMALL_HMO', 'LARGE_HMO']),
      bedrooms: z.number(),
      isRenewal: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Fetch council fee structure
      // Calculate based on HMO type and size
      // Return fee breakdown
    }),

  // Update requirement compliance
  updateRequirement: protectedProcedure
    .input(z.object({
      requirementId: z.string(),
      isCompliant: z.boolean(),
      complianceNotes: z.string().optional(),
      evidenceUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns HMO license
      // Update requirement
      // Recalculate overall compliance
      // Return updated requirement
    }),

  // Get compliance report
  getComplianceReport: protectedProcedure
    .input(z.object({
      hmoLicenseId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Fetch HMO license with all requirements
      // Calculate compliance percentage by category
      // Identify non-compliant items
      // Return comprehensive report
    }),
});
```

**UI Components**:
- `HMODashboard`: Overview of all HMO properties
- `HMOStatusBadge`: Visual license status indicator
- `HMOLicenseForm`: Multi-step HMO license application
- `HMORequirementsList`: Checklist of council requirements
- `HMOFeeCalculator`: Interactive fee estimation
- `HMOComplianceChart`: Visual compliance breakdown
- `FireSafetyChecklist`: Fire safety requirements tracker
- `CouncilRequirementsView`: Display council-specific rules

**Business Logic**:
```typescript
// utils/hmo.ts

export function determineHMOType(
  occupants: number,
  areRelated: boolean
): HMOType {
  if (areRelated || occupants < 3) {
    return 'NOT_HMO';
  } else if (occupants <= 6) {
    return 'SMALL_HMO';
  } else {
    return 'LARGE_HMO';
  }
}

export function calculateHMOCompliance(
  license: HMOLicense,
  requirements: HMORequirement[]
): {
  overallCompliance: number;
  byCategory: Record<HMORequirementCategory, { total: number; compliant: number; percentage: number }>;
  mandatoryCompliance: number;
  nonCompliantMandatory: HMORequirement[];
} {
  const mandatory = requirements.filter(r => r.isMandatory);
  const mandatoryCompliant = mandatory.filter(r => r.isCompliant).length;
  const mandatoryCompliance = mandatory.length > 0 
    ? (mandatoryCompliant / mandatory.length) * 100 
    : 100;
  
  const totalCompliant = requirements.filter(r => r.isCompliant).length;
  const overallCompliance = requirements.length > 0
    ? (totalCompliant / requirements.length) * 100
    : 0;
  
  // Group by category
  const categories = Object.values(HMORequirementCategory);
  const byCategory = categories.reduce((acc, category) => {
    const categoryReqs = requirements.filter(r => r.category === category);
    const categoryCompliant = categoryReqs.filter(r => r.isCompliant).length;
    
    acc[category] = {
      total: categoryReqs.length,
      compliant: categoryCompliant,
      percentage: categoryReqs.length > 0 
        ? (categoryCompliant / categoryReqs.length) * 100 
        : 0,
    };
    return acc;
  }, {} as Record<HMORequirementCategory, { total: number; compliant: number; percentage: number }>);
  
  return {
    overallCompliance,
    byCategory,
    mandatoryCompliance,
    nonCompliantMandatory: mandatory.filter(r => !r.isCompliant),
  };
}

export function getHMOStatus(license: HMOLicense): {
  status: string;
  color: 'green' | 'yellow' | 'red' | 'gray';
  action: string;
} {
  if (license.status === 'EXPIRED') {
    return {
      status: 'Expired',
      color: 'red',
      action: 'Renew immediately',
    };
  }
  
  if (!license.expiryDate) {
    return {
      status: 'No License',
      color: 'gray',
      action: 'Apply for license',
    };
  }
  
  const daysUntilExpiry = differenceInDays(license.expiryDate, new Date());
  
  if (daysUntilExpiry < 0) {
    return {
      status: 'Expired',
      color: 'red',
      action: 'Renew immediately',
    };
  } else if (daysUntilExpiry <= 30) {
    return {
      status: 'Expires soon',
      color: 'red',
      action: 'Renew now',
    };
  } else if (daysUntilExpiry <= 90) {
    return {
      status: 'Renewal period',
      color: 'yellow',
      action: 'Plan renewal',
    };
  } else {
    return {
      status: 'Active',
      color: 'green',
      action: 'Maintain compliance',
    };
  }
}
```

---

### Feature 2: Repairing Standard Compliance

#### Business Requirements

**Scottish Repairing Standard**:
- Applies to all residential lettings in Scotland
- Landlord's legal duty to ensure property meets standard
- Tenant can apply to tribunal if standard not met
- 21-point standard covering structure, facilities, and safety

**21 Repairing Standard Points**:
1. Structure and exterior
2. Water, drainage, sanitary facilities
3. Heating
4. Gas safety
5. Electrical safety
6. Common areas
7. Fixtures and fittings
8. Ventilation
9. Natural and artificial lighting
10. Access and security
11. (And 10 more specific points)

#### User Stories

**As a landlord, I want to:**
1. Complete a self-assessment against the 21-point standard
2. Track compliance for each property
3. Upload evidence of compliance (photos, certificates)
4. Record repair issues and track resolution
5. Generate tribunal-ready compliance reports
6. Document communication with tenants about repairs
7. Track repair costs and contractors
8. Receive alerts for non-compliance

**As a letting agent, I want to:**
1. Conduct assessments for multiple properties
2. Schedule regular compliance reviews
3. Generate landlord compliance reports
4. Track repair requests from tenants
5. Monitor landlord response times
6. Export compliance data for audits

#### Technical Requirements

**Database Schema**:
```prisma
model RepairingStandardAssessment {
  id                   String               @id @default(cuid())
  propertyId           String
  assessedBy           String               // User ID
  
  // Assessment details
  assessmentDate       DateTime
  nextAssessmentDate   DateTime?            // Recommended: annual
  
  // Overall status
  overallCompliant     Boolean              @default(false)
  complianceScore      Int                  // 0-21 (number of compliant points)
  
  // Critical issues
  hasCriticalIssues    Boolean              @default(false)
  criticalIssueCount   Int                  @default(0)
  
  // Tenant information
  tenantNotified       Boolean              @default(false)
  tenantNotificationDate DateTime?
  
  // Documents
  reportUrl            String?              // Generated PDF report
  
  // Metadata
  notes                String?              @db.Text
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  property             Property             @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  assessor             User                 @relation(fields: [assessedBy], references: [id])
  checkpoints          RepairingStandardCheckpoint[]
  issues               RepairIssue[]
  
  @@index([propertyId])
  @@index([assessmentDate])
  @@map("repairing_standard_assessments")
}

model RepairingStandardCheckpoint {
  id                   String               @id @default(cuid())
  assessmentId         String
  
  // Checkpoint details
  standardPoint        Int                  // 1-21
  category             RepairingStandardCategory
  title                String
  description          String               @db.Text
  
  // Compliance
  isCompliant          Boolean
  complianceLevel      ComplianceLevel?
  
  // Evidence
  evidenceNotes        String?              @db.Text
  evidencePhotos       String[]             // Array of S3 URLs
  evidenceCertificates String[]
  
  // Issues
  hasIssue             Boolean              @default(false)
  issueDescription     String?              @db.Text
  isCritical           Boolean              @default(false)
  
  // Action required
  actionRequired       String?              @db.Text
  estimatedCost        Decimal?             @db.Decimal(10, 2)
  targetCompletionDate DateTime?
  
  // Metadata
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  assessment           RepairingStandardAssessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  relatedIssue         RepairIssue?         @relation(fields: [relatedIssueId], references: [id])
  relatedIssueId       String?
  
  @@index([assessmentId])
  @@map("repairing_standard_checkpoints")
}

enum RepairingStandardCategory {
  STRUCTURE_EXTERIOR
  WATER_DRAINAGE
  HEATING
  GAS_SAFETY
  ELECTRICAL_SAFETY
  COMMON_AREAS
  FIXTURES_FITTINGS
  VENTILATION
  LIGHTING
  ACCESS_SECURITY
  OTHER
}

enum ComplianceLevel {
  FULLY_COMPLIANT
  PARTIALLY_COMPLIANT
  NON_COMPLIANT
  NOT_APPLICABLE
}

model RepairIssue {
  id                   String               @id @default(cuid())
  assessmentId         String?              // Optional: can be independent issue
  propertyId           String
  
  // Issue details
  title                String
  description          String               @db.Text
  category             RepairingStandardCategory
  severity             IssueSeverity
  
  // Status
  status               RepairStatus         @default(REPORTED)
  
  // Dates
  reportedDate         DateTime             @default(now())
  acknowledgedDate     DateTime?
  scheduledDate        DateTime?
  completedDate        DateTime?
  verifiedDate         DateTime?
  
  // Costs
  estimatedCost        Decimal?             @db.Decimal(10, 2)
  actualCost           Decimal?             @db.Decimal(10, 2)
  
  // Contractor
  contractorName       String?
  contractorPhone      String?
  contractorEmail      String?
  
  // Evidence
  beforePhotos         String[]             // S3 URLs
  afterPhotos          String[]
  invoiceUrl           String?
  
  // Tenant communication
  reportedBy           String?              // tenant name
  tenantNotified       Boolean              @default(false)
  tenantSatisfied      Boolean?
  
  // Tribunal
  tribunalCase         Boolean              @default(false)
  tribunalReference    String?
  tribunalDocuments    String[]
  
  // Metadata
  notes                String?              @db.Text
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  property             Property             @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  assessment           RepairingStandardAssessment? @relation(fields: [assessmentId], references: [id])
  checkpoints          RepairingStandardCheckpoint[]
  timeline             RepairTimeline[]
  
  @@index([propertyId])
  @@index([status])
  @@index([severity])
  @@map("repair_issues")
}

enum IssueSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL          // Urgent safety issue
  EMERGENCY         // Immediate response required
}

enum RepairStatus {
  REPORTED
  ACKNOWLEDGED
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  VERIFIED
  DISPUTED
  TRIBUNAL
}

model RepairTimeline {
  id                   String               @id @default(cuid())
  issueId              String
  
  // Timeline entry
  date                 DateTime             @default(now())
  eventType            RepairEventType
  description          String               @db.Text
  
  // User
  userId               String?
  userName             String
  
  // Documents
  attachments          String[]
  
  // Metadata
  createdAt            DateTime             @default(now())
  
  // Relations
  issue                RepairIssue          @relation(fields: [issueId], references: [id], onDelete: Cascade)
  
  @@index([issueId])
  @@map("repair_timeline")
}

enum RepairEventType {
  REPORTED
  ACKNOWLEDGED
  SCHEDULED
  CONTRACTOR_ASSIGNED
  WORK_STARTED
  WORK_COMPLETED
  PAYMENT_MADE
  TENANT_NOTIFIED
  VERIFIED
  DISPUTE_RAISED
  TRIBUNAL_FILED
  NOTE_ADDED
}
```

**API Endpoints**:
```typescript
// tRPC Router: repairing-standard.ts

export const repairingStandardRouter = router({
  // Create new assessment
  createAssessment: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      assessmentDate: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns property
      // Create assessment with 21 standard checkpoints
      // Return assessment with all checkpoints
    }),

  // Get assessment for property
  getByProperty: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      latest: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Fetch assessment(s) for property
      // Include checkpoints and issues
      // Calculate compliance score
      // Return assessment data
    }),

  // Update checkpoint
  updateCheckpoint: protectedProcedure
    .input(z.object({
      checkpointId: z.string(),
      isCompliant: z.boolean(),
      complianceLevel: z.enum(['FULLY_COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT', 'NOT_APPLICABLE']),
      evidenceNotes: z.string().optional(),
      evidencePhotos: z.array(z.string()).optional(),
      hasIssue: z.boolean(),
      issueDescription: z.string().optional(),
      isCritical: z.boolean().optional(),
      actionRequired: z.string().optional(),
      estimatedCost: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Update checkpoint
      // If has issue, create RepairIssue
      // Recalculate assessment compliance score
      // Return updated checkpoint
    }),

  // Create repair issue
  createIssue: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      assessmentId: z.string().optional(),
      title: z.string(),
      description: z.string(),
      category: z.nativeEnum(RepairingStandardCategory),
      severity: z.nativeEnum(IssueSeverity),
      reportedBy: z.string().optional(),
      beforePhotos: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create repair issue
      // Add timeline entry (REPORTED)
      // Send notification to landlord
      // Return created issue
    }),

  // Update issue status
  updateIssue: protectedProcedure
    .input(z.object({
      issueId: z.string(),
      status: z.nativeEnum(RepairStatus),
      notes: z.string().optional(),
      scheduledDate: z.date().optional(),
      contractorName: z.string().optional(),
      actualCost: z.number().optional(),
      afterPhotos: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Update issue
      // Add timeline entry
      // Update assessment if needed
      // Send notifications
      // Return updated issue
    }),

  // Get issues for property
  getIssuesByProperty: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      status: z.nativeEnum(RepairStatus).optional(),
      severity: z.nativeEnum(IssueSeverity).optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Fetch issues with filters
      // Include timeline
      // Sort by severity and date
      // Return issues
    }),

  // Generate tribunal report
  generateTribunalReport: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
      issueIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Fetch assessment with all checkpoints
      // Fetch specified issues with timeline
      // Generate PDF report with:
      //   - Property details
      //   - Assessment results
      //   - Evidence photos
      //   - Issue history and timeline
      //   - Communication logs
      // Upload to S3
      // Return report URL
    }),

  // Get compliance overview
  getComplianceOverview: protectedProcedure
    .query(async ({ ctx }) => {
      // Get all properties with latest assessments
      // Calculate compliance for each
      // Identify properties with critical issues
      // Return dashboard data
    }),
});
```

**UI Components**:
- `AssessmentWizard`: Guided 21-point assessment flow
- `CheckpointCard`: Individual standard point with compliance toggle
- `EvidenceUploader`: Photo upload with preview
- `ComplianceScoreRing`: Visual score indicator (e.g., 18/21)
- `IssueTracker`: Repair issue management dashboard
- `IssueTimeline`: Visual timeline of repair progress
- `TribunalReportGenerator`: Generate compliance documentation
- `PropertyComplianceCard`: At-a-glance property status

**Business Logic**:
```typescript
// utils/repairing-standard.ts

export const REPAIRING_STANDARD_POINTS = [
  {
    point: 1,
    category: 'STRUCTURE_EXTERIOR',
    title: 'Structure and Exterior',
    description: 'Property structure sound, no disrepair affecting health/safety...',
    criticalIfFailing: true,
  },
  // ... all 21 points
];

export function calculateComplianceScore(
  checkpoints: RepairingStandardCheckpoint[]
): {
  score: number;
  percentage: number;
  compliantPoints: number;
  totalPoints: number;
  criticalIssues: number;
} {
  const compliantPoints = checkpoints.filter(c => c.isCompliant).length;
  const totalPoints = checkpoints.length;
  const percentage = (compliantPoints / totalPoints) * 100;
  const criticalIssues = checkpoints.filter(c => c.isCritical && !c.isCompliant).length;
  
  return {
    score: compliantPoints,
    percentage: Math.round(percentage),
    compliantPoints,
    totalPoints,
    criticalIssues,
  };
}

export function getRepairUrgency(issue: RepairIssue): {
  urgency: string;
  color: string;
  responseTime: string;
} {
  const urgencyMap = {
    EMERGENCY: {
      urgency: 'Emergency',
      color: 'red',
      responseTime: '24 hours',
    },
    CRITICAL: {
      urgency: 'Critical',
      color: 'red',
      responseTime: '3 days',
    },
    HIGH: {
      urgency: 'High',
      color: 'orange',
      responseTime: '7 days',
    },
    MEDIUM: {
      urgency: 'Medium',
      color: 'yellow',
      responseTime: '14 days',
    },
    LOW: {
      urgency: 'Low',
      color: 'green',
      responseTime: '30 days',
    },
  };
  
  return urgencyMap[issue.severity];
}
```

---

## 📅 Week-by-Week Development Plan

### Week 4: HMO Licensing (Days 22-26)

**Day 22-23: HMO Backend**
- [ ] Extend database schema for HMO licensing
- [ ] Create Prisma migrations
- [ ] Seed council HMO requirements data
- [ ] Implement HMO tRPC router
- [ ] Build HMO type determination logic
- [ ] Create HMO fee calculator
- [ ] Set up HMO reminder scheduling

**Day 24-26: HMO UI**
- [ ] Create HMO dashboard
- [ ] Build HMO license form
- [ ] Implement requirements checklist
- [ ] Create fire safety tracker
- [ ] Build compliance report view
- [ ] Add HMO filtering to property list
- [ ] Test HMO flows end-to-end

**Deliverables**:
- Complete HMO license tracking
- Council-specific requirements loaded
- Fee calculator working
- Compliance reporting

---

### Week 5: Repairing Standard (Days 27-31)

**Day 27-28: Repairing Standard Backend**
- [ ] Implement repairing standard database schema
- [ ] Create Prisma migrations
- [ ] Seed 21-point standard data
- [ ] Implement repairing standard tRPC router
- [ ] Build assessment logic
- [ ] Create issue tracking system
- [ ] Implement tribunal report generation

**Day 29-30: Repairing Standard UI**
- [ ] Create assessment wizard (21-point walkthrough)
- [ ] Build checkpoint cards with evidence upload
- [ ] Implement issue tracker dashboard
- [ ] Create issue timeline view
- [ ] Build compliance score visualization
- [ ] Add tribunal report generator UI
- [ ] Create property compliance overview

**Day 31: Testing & Integration**
- [ ] Test complete assessment flow
- [ ] Test issue creation and tracking
- [ ] Verify tribunal report generation
- [ ] Integration testing with Phase 1 features
- [ ] Bug fixes and polish
- [ ] Phase 2 deployment

**Deliverables**:
- Complete self-assessment tool
- Issue tracking system
- Tribunal documentation
- Integration with certificates (Phase 1)

---

## ✅ Phase 2 Success Criteria

### Functional Requirements
- [ ] Users can determine if property is HMO
- [ ] HMO licenses can be tracked with expiry reminders
- [ ] Council-specific HMO requirements are displayed
- [ ] HMO compliance can be tracked by category
- [ ] Fire safety requirements are managed
- [ ] 21-point repairing standard assessment works
- [ ] Evidence can be uploaded for each checkpoint
- [ ] Repair issues can be tracked from report to completion
- [ ] Tribunal reports can be generated
- [ ] Integration with Phase 1 certificate system

### Technical Requirements
- [ ] Database schema properly migrated
- [ ] All API endpoints working
- [ ] File uploads for evidence photos
- [ ] PDF generation for tribunal reports
- [ ] Reminders integrated with Phase 1 system
- [ ] Mobile responsive
- [ ] Performance maintained (< 2s loads)

### User Experience
- [ ] Assessment wizard is intuitive
- [ ] Compliance status is clearly visual
- [ ] Issue tracking is easy to use
- [ ] Evidence upload is straightforward
- [ ] Reports are professional quality

---

## 🔗 Integration with Phase 1

### Data Connections
1. **Property → HMO License**: One-to-one relationship
2. **Property → Assessments**: One-to-many relationship
3. **Council → HMO Requirements**: Extend council data
4. **Reminder System**: Unified for all expiry types
5. **Certificate Integration**: Link gas/EICR to repairing standard

### UI Integration
- Add HMO status to property cards
- Show compliance score on dashboard
- Include repairing issues in property detail view
- Unified reminders list showing all types
- Cross-link certificates to assessment checkpoints

### Workflow Integration
- Certificate expiry triggers assessment reminder
- Non-compliant assessment creates repair issues
- HMO license renewal checks certificate validity
- Dashboard shows combined compliance overview

---

**Phase 2 Document Version**: 1.0  
**Last Updated**: October 2025  
**Next Phase**: Phase 3 Planning (AML/Sanctions & Council Intelligence)
