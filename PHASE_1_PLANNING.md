# Phase 1: Core Compliance Dashboard (Weeks 1-3)

## 🎯 Phase Overview

**Duration**: 3 weeks (21 days)  
**Goal**: Build foundation compliance tracking system with landlord registration, certificate management, and basic letting agent features  
**AI Assistance Target**: 75% code generation  
**Success Criteria**: Working dashboard with automated reminders deployed to production

---

## 📋 Feature Breakdown

### Feature 1: Landlord Registration Tracker

#### Business Requirements
- Track individual landlord registrations across all 32 Scottish councils
- Manage registration at both landlord and property level
- Calculate council-specific registration fees
- Send automated renewal reminders (3-year cycle)
- Track registration status and application progress

#### User Stories

**As a landlord, I want to:**
1. Register my details with the system
2. Add properties and link them to council registrations
3. Upload my landlord registration certificates
4. See when my registrations expire
5. Receive reminders before expiry (90, 30, 7 days)
6. Calculate registration fees for my council

**As a letting agent, I want to:**
1. Manage multiple landlords and their properties
2. Bulk upload landlord registrations
3. View all registrations in one dashboard
4. Filter by expiry date and council
5. Generate registration status reports

#### Technical Requirements

**Database Schema**:
```prisma
model LandlordRegistration {
  id                   String               @id @default(cuid())
  landlordId           String
  propertyId           String?              // Optional: can register without specific property
  councilId            String
  registrationNumber   String               @unique
  applicationDate      DateTime
  approvalDate         DateTime?
  expiryDate           DateTime
  renewalDate          DateTime             // Calculated: expiryDate - 90 days
  status               RegistrationStatus   @default(PENDING)
  
  // Fee tracking
  applicationFee       Decimal              @db.Decimal(10, 2)
  renewalFee           Decimal              @db.Decimal(10, 2)
  lateFee              Decimal?             @db.Decimal(10, 2)
  
  // Document storage
  certificateUrl       String?
  applicationUrl       String?
  
  // Metadata
  notes                String?              @db.Text
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  landlord             User                 @relation(fields: [landlordId], references: [id], onDelete: Cascade)
  property             Property?            @relation(fields: [propertyId], references: [id])
  council              Council              @relation(fields: [councilId], references: [id])
  reminders            Reminder[]
  
  @@index([expiryDate])
  @@index([landlordId])
  @@index([councilId])
  @@index([status])
  @@map("landlord_registrations")
}

enum RegistrationStatus {
  PENDING
  APPROVED
  EXPIRED
  RENEWAL_DUE
  RENEWAL_SUBMITTED
  REJECTED
}

model Council {
  id                   String               @id @default(cuid())
  name                 String               @unique
  code                 String               @unique  // e.g., "EDI" for Edinburgh
  region               String               // e.g., "Lothian"
  
  // Contact information
  email                String
  phone                String
  website              String
  portalUrl            String?
  
  // Fee structure
  landlordRegFee       Decimal              @db.Decimal(10, 2)
  landlordRenewalFee   Decimal              @db.Decimal(10, 2)
  propertyRegFee       Decimal              @db.Decimal(10, 2)
  lateFeeMultiplier    Decimal              @default(2.0)
  
  // HMO fees (Phase 2)
  hmoSmallFee          Decimal?             @db.Decimal(10, 2)
  hmoLargeFee          Decimal?             @db.Decimal(10, 2)
  
  // Processing times
  avgProcessingDays    Int                  @default(28)
  
  // Requirements
  requiresEPC          Boolean              @default(true)
  requiresGasSafety    Boolean              @default(true)
  requiresEICR         Boolean              @default(true)
  
  // Metadata
  notes                String?              @db.Text
  lastUpdated          DateTime             @updatedAt
  createdAt            DateTime             @default(now())
  
  // Relations
  registrations        LandlordRegistration[]
  properties           Property[]
  hmoLicenses          HMOLicense[]
  
  @@map("councils")
}
```

**API Endpoints**:
```typescript
// tRPC Router: landlord.ts

export const landlordRouter = router({
  // Create new registration
  createRegistration: protectedProcedure
    .input(z.object({
      propertyId: z.string().optional(),
      councilId: z.string(),
      registrationNumber: z.string(),
      applicationDate: z.date(),
      approvalDate: z.date().optional(),
      expiryDate: z.date(),
      applicationFee: z.number(),
      certificateUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate user owns the property
      // Calculate renewal date (expiryDate - 90 days)
      // Create registration
      // Schedule reminders
      // Return created registration
    }),

  // Get all registrations for current user
  getMyRegistrations: protectedProcedure
    .input(z.object({
      status: z.enum(['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED']).optional(),
      councilId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Fetch registrations with filters
      // Include property and council details
      // Calculate days until expiry
      // Return sorted by expiry date
    }),

  // Calculate registration fee
  calculateFee: protectedProcedure
    .input(z.object({
      councilId: z.string(),
      properties: z.number(), // Number of properties
      isRenewal: z.boolean(),
      isLate: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Fetch council fee structure
      // Calculate total: (landlordFee + propertyFees * properties)
      // Apply late fee multiplier if applicable
      // Return breakdown
    }),

  // Upload registration certificate
  uploadCertificate: protectedProcedure
    .input(z.object({
      registrationId: z.string(),
      fileUrl: z.string(),
      fileType: z.enum(['certificate', 'application']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns registration
      // Update document URL
      // Return success
    }),
});
```

**UI Components**:
- `RegistrationDashboard`: Overview with status cards
- `RegistrationList`: Table with filters and sorting
- `RegistrationForm`: Multi-step form for new registration
- `FeeCalculator`: Interactive fee estimation tool
- `CouncilSelector`: Searchable dropdown with council info
- `ExpiryBadge`: Color-coded expiry indicator (green > 90 days, yellow 30-90, red < 30)

**Business Logic**:
```typescript
// utils/registration.ts

export function calculateRenewalDate(expiryDate: Date): Date {
  // 90 days before expiry
  return subDays(expiryDate, 90);
}

export function getRegistrationStatus(registration: LandlordRegistration): {
  status: string;
  color: 'green' | 'yellow' | 'red' | 'gray';
  daysUntilExpiry: number;
} {
  const today = new Date();
  const daysUntil = differenceInDays(registration.expiryDate, today);
  
  if (daysUntil < 0) {
    return { status: 'Expired', color: 'red', daysUntilExpiry: daysUntil };
  } else if (daysUntil <= 7) {
    return { status: 'Expires this week', color: 'red', daysUntilExpiry: daysUntil };
  } else if (daysUntil <= 30) {
    return { status: 'Expires soon', color: 'yellow', daysUntilExpiry: daysUntil };
  } else if (daysUntil <= 90) {
    return { status: 'Renewal period', color: 'yellow', daysUntilExpiry: daysUntil };
  } else {
    return { status: 'Active', color: 'green', daysUntilExpiry: daysUntil };
  }
}

export function calculateRegistrationFee(
  council: Council,
  propertyCount: number,
  isRenewal: boolean,
  isLate: boolean
): {
  landlordFee: number;
  propertyFees: number;
  subtotal: number;
  lateFee: number;
  total: number;
} {
  const landlordFee = isRenewal ? council.landlordRenewalFee : council.landlordRegFee;
  const propertyFees = council.propertyRegFee * propertyCount;
  const subtotal = landlordFee + propertyFees;
  const lateFee = isLate ? subtotal * (council.lateFeeMultiplier - 1) : 0;
  const total = subtotal + lateFee;
  
  return { landlordFee, propertyFees, subtotal, lateFee, total };
}
```

---

### Feature 2: Certificate Management System

#### Business Requirements
- Track three certificate types: Gas Safety, EICR, EPC
- Each property must have all required certificates
- Different renewal cycles: Gas (1 year), EICR (5 years), EPC (10 years)
- Upload and securely store certificate documents
- Send automated expiry reminders at multiple intervals
- Visual dashboard showing certificate status across portfolio

#### User Stories

**As a landlord, I want to:**
1. Upload certificates for each property
2. See all certificate expiry dates in one place
3. Receive reminders before certificates expire
4. Download/view my uploaded certificates
5. Track which properties need certificate renewals
6. See certificate history for each property

**As a letting agent, I want to:**
1. Manage certificates for multiple properties and landlords
2. Bulk upload certificates
3. Generate compliance reports showing certificate status
4. Filter properties by certificate expiry
5. Export certificate data for audits

#### Technical Requirements

**Database Schema**:
```prisma
model Certificate {
  id                   String               @id @default(cuid())
  propertyId           String
  type                 CertificateType
  
  // Certificate details
  certificateNumber    String?
  issuerName           String
  issuerCompany        String?
  issuerRegistration   String?              // Gas Safe number, NICEIC number, etc.
  
  // Dates
  issueDate            DateTime
  expiryDate           DateTime
  nextInspectionDate   DateTime?            // For gas safety
  
  // Status
  status               CertificateStatus    @default(VALID)
  
  // Document storage
  documentUrl          String
  documentKey          String               // S3/R2 key for deletion
  fileSize             Int
  mimeType             String
  
  // EPC specific
  epcRating            String?              // A, B, C, D, E, F, G
  epcScore             Int?                 // 1-100
  
  // Gas Safety specific
  appliancesTested     Int?
  appliancesPassed     Int?
  remedialWorkRequired Boolean?
  
  // EICR specific
  circuitsTested       Int?
  defectsFound         Int?
  overallAssessment    String?              // Satisfactory, Unsatisfactory
  
  // Metadata
  notes                String?              @db.Text
  uploadedBy           String
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  property             Property             @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  uploader             User                 @relation(fields: [uploadedBy], references: [id])
  reminders            Reminder[]
  
  @@index([propertyId, type])
  @@index([expiryDate])
  @@index([status])
  @@map("certificates")
}

enum CertificateType {
  GAS_SAFETY
  EICR
  EPC
}

enum CertificateStatus {
  VALID
  EXPIRING_SOON      // Within 30 days
  EXPIRED
  RENEWAL_SCHEDULED
  PENDING_UPLOAD
}

model Property {
  id                   String               @id @default(cuid())
  ownerId              String               // Landlord or letting agent
  
  // Address
  addressLine1         String
  addressLine2         String?
  city                 String
  county               String?
  postcode             String
  
  // Property details
  propertyType         PropertyType
  bedrooms             Int
  bathrooms            Int
  isHMO                Boolean              @default(false)
  maxOccupancy         Int?
  
  // Council
  councilId            String
  
  // Tenancy
  isRented             Boolean              @default(false)
  tenancyStartDate     DateTime?
  tenancyEndDate       DateTime?
  monthlyRent          Decimal?             @db.Decimal(10, 2)
  
  // Metadata
  notes                String?              @db.Text
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  owner                User                 @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  council              Council              @relation(fields: [councilId], references: [id])
  certificates         Certificate[]
  registrations        LandlordRegistration[]
  hmoLicenses          HMOLicense[]
  repairingAssessments RepairingStandardAssessment[]
  
  @@index([ownerId])
  @@index([councilId])
  @@index([postcode])
  @@map("properties")
}

enum PropertyType {
  FLAT
  HOUSE
  BUNGALOW
  MAISONETTE
  STUDIO
  ROOM
}
```

**API Endpoints**:
```typescript
// tRPC Router: certificate.ts

export const certificateRouter = router({
  // Upload new certificate
  create: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      type: z.enum(['GAS_SAFETY', 'EICR', 'EPC']),
      certificateNumber: z.string().optional(),
      issuerName: z.string(),
      issuerCompany: z.string().optional(),
      issuerRegistration: z.string().optional(),
      issueDate: z.date(),
      expiryDate: z.date(),
      documentUrl: z.string(),
      documentKey: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
      // Type-specific fields
      epcRating: z.string().optional(),
      epcScore: z.number().optional(),
      appliancesTested: z.number().optional(),
      circuitsTested: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns property
      // Create certificate
      // Calculate reminder dates
      // Schedule reminders
      // Return created certificate
    }),

  // Get certificates for a property
  getByProperty: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify user has access to property
      // Fetch all certificates
      // Group by type
      // Calculate status for each
      // Return with compliance status
    }),

  // Get all expiring certificates
  getExpiring: protectedProcedure
    .input(z.object({
      days: z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      // Fetch certificates expiring in next X days
      // Include property and owner details
      // Sort by expiry date
      // Return grouped by urgency
    }),

  // Get compliance overview
  getComplianceOverview: protectedProcedure
    .query(async ({ ctx }) => {
      // Get all user's properties
      // Check certificate status for each
      // Calculate compliance percentage
      // Identify properties needing attention
      // Return dashboard data
    }),

  // Generate signed upload URL
  getUploadUrl: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      fileName: z.string(),
      fileType: z.string(),
      fileSize: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns property
      // Generate S3 pre-signed URL
      // Return upload URL and key
    }),

  // Delete certificate
  delete: protectedProcedure
    .input(z.object({
      certificateId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns certificate
      // Delete from S3
      // Soft delete from database
      // Cancel scheduled reminders
      // Return success
    }),
});
```

**UI Components**:
- `CertificateDashboard`: Overview with status grid
- `CertificateCard`: Individual certificate display with status
- `CertificateUpload`: Drag-and-drop upload with validation
- `CertificateList`: Filterable table of all certificates
- `ComplianceScore`: Visual indicator of overall compliance
- `PropertyCertificateView`: All certificates for one property
- `ExpiryCalendar`: Calendar view of upcoming expirations

**Business Logic**:
```typescript
// utils/certificates.ts

export function getCertificateRenewalCycle(type: CertificateType): number {
  const cycles = {
    GAS_SAFETY: 365,    // 1 year
    EICR: 1825,         // 5 years
    EPC: 3650,          // 10 years
  };
  return cycles[type];
}

export function calculateReminderDates(expiryDate: Date): Date[] {
  return [
    subDays(expiryDate, 90),  // 3 months
    subDays(expiryDate, 30),  // 1 month
    subDays(expiryDate, 7),   // 1 week
    expiryDate,                // Day of expiry
  ];
}

export function getCertificateStatus(certificate: Certificate): {
  status: CertificateStatus;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  daysUntilExpiry: number;
} {
  const today = new Date();
  const daysUntil = differenceInDays(certificate.expiryDate, today);
  
  if (daysUntil < 0) {
    return { 
      status: 'EXPIRED', 
      urgency: 'critical', 
      daysUntilExpiry: daysUntil 
    };
  } else if (daysUntil <= 7) {
    return { 
      status: 'EXPIRING_SOON', 
      urgency: 'critical', 
      daysUntilExpiry: daysUntil 
    };
  } else if (daysUntil <= 30) {
    return { 
      status: 'EXPIRING_SOON', 
      urgency: 'high', 
      daysUntilExpiry: daysUntil 
    };
  } else if (daysUntil <= 90) {
    return { 
      status: 'VALID', 
      urgency: 'medium', 
      daysUntilExpiry: daysUntil 
    };
  } else {
    return { 
      status: 'VALID', 
      urgency: 'low', 
      daysUntilExpiry: daysUntil 
    };
  }
}

export function checkPropertyCompliance(property: Property): {
  isCompliant: boolean;
  missingCertificates: CertificateType[];
  expiringCertificates: Certificate[];
  expiredCertificates: Certificate[];
} {
  const required: CertificateType[] = ['GAS_SAFETY', 'EICR', 'EPC'];
  const certificates = property.certificates;
  
  // Group by type, get most recent
  const latestCerts = required.map(type => 
    certificates
      .filter(c => c.type === type)
      .sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime())[0]
  );
  
  const missing = required.filter((type, i) => !latestCerts[i]);
  const expiring = latestCerts
    .filter(c => c && getCertificateStatus(c).urgency !== 'low')
    .filter(Boolean) as Certificate[];
  const expired = latestCerts
    .filter(c => c && getCertificateStatus(c).status === 'EXPIRED')
    .filter(Boolean) as Certificate[];
  
  return {
    isCompliant: missing.length === 0 && expired.length === 0,
    missingCertificates: missing,
    expiringCertificates: expiring,
    expiredCertificates: expired,
  };
}
```

---

### Feature 3: Basic Letting Agent Features

#### Business Requirements
- Track Letting Agent Registration renewal (annual)
- Log and track CPD (Continuing Professional Development) hours
- Minimum 12 CPD hours required per year
- Dashboard showing CPD progress and registration status

#### User Stories

**As a letting agent, I want to:**
1. Track my letting agent registration renewal date
2. Log CPD training hours as I complete them
3. See my progress towards 12-hour annual requirement
4. Receive reminders for registration renewal
5. Export CPD records for audits
6. Categorize CPD activities by topic

#### Technical Requirements

**Database Schema**:
```prisma
model LettingAgentRegistration {
  id                   String               @id @default(cuid())
  agentId              String               @unique
  
  // Registration details
  registrationNumber   String               @unique
  registrationBody     String               @default("SafeAgent Scotland")
  
  // Dates
  registrationDate     DateTime
  expiryDate           DateTime             // Annual renewal
  renewalDate          DateTime             // 60 days before expiry
  
  // Status
  status               RegistrationStatus   @default(APPROVED)
  
  // Membership details
  membershipLevel      String?              // Standard, Premium, etc.
  annualFee            Decimal              @db.Decimal(10, 2)
  
  // Documents
  certificateUrl       String?
  
  // Metadata
  notes                String?              @db.Text
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  agent                User                 @relation(fields: [agentId], references: [id], onDelete: Cascade)
  reminders            Reminder[]
  
  @@index([expiryDate])
  @@map("letting_agent_registrations")
}

model CPDRecord {
  id                   String               @id @default(cuid())
  agentId              String
  
  // Activity details
  activityTitle        String
  provider             String
  category             CPDCategory
  description          String?              @db.Text
  
  // Hours
  hoursCompleted       Decimal              @db.Decimal(4, 2)
  
  // Date
  completionDate       DateTime
  year                 Int                  // For annual tracking
  
  // Verification
  certificateUrl       String?
  verificationCode     String?
  isVerified           Boolean              @default(false)
  
  // Metadata
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  agent                User                 @relation(fields: [agentId], references: [id], onDelete: Cascade)
  
  @@index([agentId, year])
  @@index([completionDate])
  @@map("cpd_records")
}

enum CPDCategory {
  LEGAL_COMPLIANCE
  PROPERTY_MANAGEMENT
  TENANT_RELATIONS
  FINANCIAL_MANAGEMENT
  MARKETING_LETTINGS
  HEALTH_SAFETY
  DISPUTE_RESOLUTION
  PROFESSIONAL_ETHICS
  TECHNOLOGY_SYSTEMS
  OTHER
}
```

**API Endpoints**:
```typescript
// tRPC Router: agent.ts

export const agentRouter = router({
  // Get agent registration
  getRegistration: protectedProcedure
    .query(async ({ ctx }) => {
      // Fetch agent registration
      // Calculate days until expiry
      // Return with status
    }),

  // Update registration
  updateRegistration: protectedProcedure
    .input(z.object({
      registrationNumber: z.string(),
      expiryDate: z.date(),
      certificateUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Update or create registration
      // Calculate renewal date
      // Schedule reminders
      // Return updated registration
    }),

  // Add CPD record
  addCPDRecord: protectedProcedure
    .input(z.object({
      activityTitle: z.string(),
      provider: z.string(),
      category: z.enum([
        'LEGAL_COMPLIANCE',
        'PROPERTY_MANAGEMENT',
        'TENANT_RELATIONS',
        // ... other categories
      ]),
      description: z.string().optional(),
      hoursCompleted: z.number().min(0.5).max(24),
      completionDate: z.date(),
      certificateUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create CPD record
      // Calculate year from completion date
      // Return created record
    }),

  // Get CPD summary
  getCPDSummary: protectedProcedure
    .input(z.object({
      year: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const year = input.year || new Date().getFullYear();
      
      // Fetch all CPD records for year
      // Calculate total hours
      // Group by category
      // Calculate progress towards 12 hours
      // Return summary
    }),

  // Get CPD records
  getCPDRecords: protectedProcedure
    .input(z.object({
      year: z.number().optional(),
      category: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Fetch CPD records with filters
      // Sort by completion date (desc)
      // Return records
    }),

  // Delete CPD record
  deleteCPDRecord: protectedProcedure
    .input(z.object({
      recordId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns record
      // Delete record
      // Return success
    }),
});
```

**UI Components**:
- `AgentDashboard`: Registration status and CPD overview
- `CPDProgress`: Circular progress indicator for 12-hour requirement
- `CPDForm`: Add new CPD activity form
- `CPDList`: Table of CPD activities with category filters
- `CPDCategoryChart`: Breakdown of CPD hours by category
- `RegistrationCard`: Agent registration status display

**Business Logic**:
```typescript
// utils/cpd.ts

export function calculateCPDProgress(records: CPDRecord[], year: number): {
  totalHours: number;
  requiredHours: number;
  percentage: number;
  isComplete: boolean;
  hoursRemaining: number;
  byCategory: Record<CPDCategory, number>;
} {
  const yearRecords = records.filter(r => r.year === year);
  const totalHours = yearRecords.reduce((sum, r) => sum + Number(r.hoursCompleted), 0);
  const requiredHours = 12;
  const percentage = Math.min((totalHours / requiredHours) * 100, 100);
  const isComplete = totalHours >= requiredHours;
  const hoursRemaining = Math.max(requiredHours - totalHours, 0);
  
  // Group by category
  const byCategory = yearRecords.reduce((acc, record) => {
    const category = record.category;
    acc[category] = (acc[category] || 0) + Number(record.hoursCompleted);
    return acc;
  }, {} as Record<CPDCategory, number>);
  
  return {
    totalHours,
    requiredHours,
    percentage,
    isComplete,
    hoursRemaining,
    byCategory,
  };
}

export function getRecommendedCPDCategories(
  completedRecords: CPDRecord[]
): CPDCategory[] {
  // Suggest categories with fewer hours
  const categoryHours = completedRecords.reduce((acc, record) => {
    acc[record.category] = (acc[record.category] || 0) + Number(record.hoursCompleted);
    return acc;
  }, {} as Record<CPDCategory, number>);
  
  const allCategories = Object.values(CPDCategory);
  return allCategories
    .filter(cat => (categoryHours[cat] || 0) < 2)
    .slice(0, 3);
}
```

---

## 🔔 Unified Reminder System

### Architecture

**Database Schema**:
```prisma
model Reminder {
  id                   String               @id @default(cuid())
  userId               String
  
  // Reminder target
  entityType           ReminderEntityType
  entityId             String
  
  // Schedule
  scheduledFor         DateTime
  sentAt               DateTime?
  
  // Status
  status               ReminderStatus       @default(PENDING)
  
  // Content
  title                String
  message              String               @db.Text
  
  // Channels
  sendEmail            Boolean              @default(true)
  sendSMS              Boolean              @default(false)
  sendPush             Boolean              @default(false)
  
  // Metadata
  attempts             Int                  @default(0)
  lastAttemptAt        DateTime?
  error                String?              @db.Text
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  user                 User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([scheduledFor, status])
  @@index([userId])
  @@map("reminders")
}

enum ReminderEntityType {
  LANDLORD_REGISTRATION
  CERTIFICATE
  AGENT_REGISTRATION
  HMO_LICENSE
  CPD_REQUIREMENT
}

enum ReminderStatus {
  PENDING
  SENT
  FAILED
  CANCELLED
}
```

**Reminder Service**:
```typescript
// lib/reminders/reminder-service.ts

export class ReminderService {
  async scheduleReminders(
    entity: { type: ReminderEntityType; id: string; expiryDate: Date },
    userId: string,
    userPreferences: { email: boolean; sms: boolean }
  ) {
    const reminderDates = this.calculateReminderDates(entity.expiryDate);
    
    const reminders = reminderDates.map(date => ({
      userId,
      entityType: entity.type,
      entityId: entity.id,
      scheduledFor: date,
      title: this.getReminderTitle(entity.type, date, entity.expiryDate),
      message: this.getReminderMessage(entity.type, date, entity.expiryDate),
      sendEmail: userPreferences.email,
      sendSMS: userPreferences.sms && this.isUrgent(date, entity.expiryDate),
    }));
    
    await prisma.reminder.createMany({ data: reminders });
  }
  
  private calculateReminderDates(expiryDate: Date): Date[] {
    return [
      subDays(expiryDate, 90),
      subDays(expiryDate, 30),
      subDays(expiryDate, 7),
      expiryDate,
    ].filter(date => isAfter(date, new Date()));
  }
  
  private isUrgent(reminderDate: Date, expiryDate: Date): boolean {
    // SMS only for 7-day and expiry day reminders
    return differenceInDays(expiryDate, reminderDate) <= 7;
  }
  
  async sendDueReminders() {
    const dueReminders = await prisma.reminder.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: new Date() },
      },
      include: { user: true },
    });
    
    for (const reminder of dueReminders) {
      await this.sendReminder(reminder);
    }
  }
  
  private async sendReminder(reminder: Reminder & { user: User }) {
    try {
      if (reminder.sendEmail) {
        await this.sendEmail(reminder);
      }
      
      if (reminder.sendSMS && reminder.user.phone) {
        await this.sendSMS(reminder);
      }
      
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: 'FAILED',
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
          error: error.message,
        },
      });
    }
  }
}
```

**Cron Job**:
```typescript
// app/api/cron/send-reminders/route.ts

import { NextResponse } from 'next/server';
import { ReminderService } from '@/lib/reminders/reminder-service';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  const reminderService = new ReminderService();
  await reminderService.sendDueReminders();
  
  return NextResponse.json({ success: true });
}
```

**Vercel Cron Configuration**:
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/send-reminders",
    "schedule": "0 9 * * *"  // Every day at 9am
  }]
}
```

---

## 🎨 UI/UX Design Specifications

### Design System

**Color Palette**:
```typescript
const colors = {
  // Status colors
  success: '#10b981',      // Green - compliant
  warning: '#f59e0b',      // Amber - expiring soon
  danger: '#ef4444',       // Red - expired
  info: '#3b82f6',         // Blue - informational
  
  // Compliance colors
  compliant: '#10b981',
  partialCompliance: '#f59e0b',
  nonCompliant: '#ef4444',
  
  // Brand colors (Scottish theme)
  primary: '#1e40af',      // Deep blue (Scottish flag)
  secondary: '#7c3aed',    // Purple
  accent: '#0891b2',       // Cyan
};
```

**Typography**:
- Headings: Inter (sans-serif)
- Body: Inter
- Monospace: JetBrains Mono (for numbers, dates)

**Dashboard Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo | Navigation | User Menu                  │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │  Compliance Overview                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │
│  │  │  95%     │  │  3 Props │  │  2 Expir │         │  │
│  │  │ Compliant│  │  Tracked │  │  Soon    │         │  │
│  │  └──────────┘  └──────────┘  └──────────┘         │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Upcoming Renewals                                 │  │
│  │  [Table with next 5 expiring items]               │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌────────────────────┐  ┌────────────────────────┐    │
│  │  Properties         │  │  Recent Activity       │    │
│  │  [Property list]    │  │  [Activity feed]       │    │
│  └────────────────────┘  └────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Key Pages

1. **Dashboard** (`/dashboard`)
   - Compliance overview cards
   - Upcoming renewals list
   - Quick actions
   - Property summary

2. **Properties** (`/properties`)
   - Property list with compliance status
   - Add property button
   - Filter and search
   - Bulk actions

3. **Certificates** (`/certificates`)
   - Certificate grid by type
   - Upload new certificate
   - Filter by property/status
   - Calendar view

4. **Registrations** (`/registrations`)
   - Landlord registration list
   - Registration form
   - Fee calculator
   - Council information

5. **Agent Profile** (`/agent`) (Letting agents only)
   - Registration status
   - CPD progress
   - CPD log
   - Add CPD record

---

## 📅 Week-by-Week Development Plan

### Week 1: Foundation (Days 1-7)

**Day 1-2: Project Setup**
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Tailwind CSS and shadcn/ui
- [ ] Configure Prisma with PostgreSQL
- [ ] Set up NextAuth.js
- [ ] Create base UI components (Button, Input, Card, etc.)
- [ ] Set up tRPC

**Day 3-4: Database & Auth**
- [ ] Design and implement database schema
- [ ] Create Prisma migrations
- [ ] Seed council data (32 Scottish councils)
- [ ] Implement authentication flow
- [ ] Create user registration and login pages
- [ ] Set up user roles (landlord, agent, admin)

**Day 5-7: Core UI Framework**
- [ ] Build dashboard layout
- [ ] Create navigation components
- [ ] Implement responsive design
- [ ] Build property management CRUD
- [ ] Create property list and detail pages
- [ ] Set up file upload infrastructure (S3/R2)

**Deliverables**:
- Working authentication
- Property management system
- Basic dashboard layout

---

### Week 2: Landlord Registration (Days 8-14)

**Day 8-9: Landlord Registration Backend**
- [ ] Implement landlord registration tRPC router
- [ ] Create registration CRUD operations
- [ ] Build fee calculator logic
- [ ] Set up reminder scheduling

**Day 10-12: Landlord Registration UI**
- [ ] Create registration form (multi-step)
- [ ] Build council selector with search
- [ ] Implement fee calculator UI
- [ ] Create registration list view
- [ ] Build registration detail page
- [ ] Add certificate upload for registrations

**Day 13-14: Testing & Polish**
- [ ] Test all registration flows
- [ ] Add form validation
- [ ] Implement error handling
- [ ] Create success/error notifications
- [ ] Test fee calculator with all councils
- [ ] Bug fixes

**Deliverables**:
- Complete landlord registration tracker
- Working fee calculator
- Document upload functionality

---

### Week 3: Certificates & Agent Features (Days 15-21)

**Day 15-16: Certificate Backend**
- [ ] Implement certificate tRPC router
- [ ] Create certificate CRUD operations
- [ ] Build expiry calculation logic
- [ ] Set up reminder scheduling for certificates
- [ ] Implement compliance checking

**Day 17-18: Certificate UI**
- [ ] Create certificate upload form
- [ ] Build certificate list/grid view
- [ ] Implement certificate detail page
- [ ] Create compliance dashboard
- [ ] Build expiry calendar view
- [ ] Add certificate filtering and search

**Day 19-20: Agent Features**
- [ ] Implement agent registration tracking
- [ ] Build CPD recording system
- [ ] Create CPD progress dashboard
- [ ] Implement CPD category tracking
- [ ] Build agent profile page

**Day 21: Reminder System & Launch Prep**
- [ ] Set up email service (Resend)
- [ ] Set up SMS service (Twilio)
- [ ] Implement reminder sending logic
- [ ] Create email templates
- [ ] Set up cron job for reminders
- [ ] Test reminder delivery
- [ ] Phase 1 testing and bug fixes

**Deliverables**:
- Complete certificate management
- Agent registration and CPD tracking
- Working reminder system
- Phase 1 production deployment

---

## ✅ Phase 1 Success Criteria

### Functional Requirements
- [ ] Users can register and log in
- [ ] Landlords can add and manage properties
- [ ] Landlords can track registration for all 32 councils
- [ ] Fee calculator works accurately for all councils
- [ ] Users can upload and manage 3 certificate types
- [ ] System tracks certificate expiry dates
- [ ] Letting agents can track registration and CPD
- [ ] Reminders are sent automatically at correct intervals
- [ ] All data is securely stored and retrieved

### Technical Requirements
- [ ] Application deployed to production
- [ ] Database migrations working correctly
- [ ] Authentication secure and working
- [ ] File uploads working with S3/R2
- [ ] Email delivery working
- [ ] SMS delivery working (optional for Phase 1)
- [ ] Responsive design on mobile
- [ ] No critical bugs
- [ ] Page load time < 2 seconds

### User Experience
- [ ] Intuitive navigation
- [ ] Clear error messages
- [ ] Loading states for all async operations
- [ ] Success confirmations for actions
- [ ] Compliance status clearly visible
- [ ] Easy certificate upload process

---

## 🎯 AI Prompting Strategy for Phase 1

### Prompt Templates

**1. Database Schema Generation**:
```
Create a Prisma schema for [feature]. Requirements:
- [List specific fields and relationships]
- Include proper indexes for [specific queries]
- Add enums for [status fields]
- Include soft delete functionality
- Add timestamps (createdAt, updatedAt)
- Follow naming convention: snake_case for table names, camelCase for fields

Consider:
- Data integrity constraints
- Foreign key relationships
- Query performance optimization
```

**2. tRPC Router Generation**:
```
Create a tRPC router for [feature] with the following endpoints:
- [List endpoints with inputs and outputs]

Requirements:
- Use Zod for input validation
- Include proper error handling
- Verify user permissions (user owns the resource)
- Include pagination for list queries
- Return properly typed responses

Use the following Prisma models: [list models]
```

**3. React Component Generation**:
```
Create a React component for [feature] using:
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Hook Form for forms
- TanStack Query for data fetching

Component requirements:
- [List specific UI elements]
- Responsive design
- Loading and error states
- Form validation with Zod
- Accessible (WCAG 2.1 AA)

tRPC endpoint to use: [endpoint name]
```

### Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] Database queries are optimized
- [ ] User permissions are checked
- [ ] Input validation is comprehensive
- [ ] Error handling is robust
- [ ] Components are accessible
- [ ] Mobile responsive
- [ ] Loading states implemented
- [ ] Success/error feedback shown

---

**Phase 1 Document Version**: 1.0  
**Last Updated**: October 2025  
**Next Phase**: Phase 2 Planning (HMO Licensing & Repairing Standard)
