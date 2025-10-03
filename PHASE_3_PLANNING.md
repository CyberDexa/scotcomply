# Phase 3: Intelligence & Screening (Weeks 6-8)

## 🎯 Phase Overview

**Duration**: 3 weeks (15 days)  
**Goal**: Implement AML/Sanctions screening and Council Intelligence system  
**AI Assistance Target**: 65% code generation (more manual work for API integrations)  
**Success Criteria**: Automated screening workflows, regulatory alert system, and comprehensive reporting dashboard

---

## 📋 Feature Breakdown

### Feature 1: AML/Sanctions Screening

#### Business Requirements

**Scottish AML Requirements for Letting Agents**:
- Money Laundering, Terrorist Financing and Transfer of Funds (Information on the Payer) Regulations 2017
- Letting agents must conduct Customer Due Diligence (CDD) on:
  - Landlords (clients)
  - Tenants (in some cases)
  - Properties with rent > €10,000/month
- Screen against:
  - OFAC (US Office of Foreign Assets Control)
  - EU Sanctions List
  - UN Sanctions List
  - UK HM Treasury Financial Sanctions
  - PEPs (Politically Exposed Persons)
- Record retention: Minimum 5 years after relationship ends
- Annual reviews for ongoing relationships

**Risk-Based Approach**:
- **Low Risk**: Standard residential tenancies < £10k/month
- **Medium Risk**: High-value properties, corporate landlords
- **High Risk**: PEPs, foreign nationals, cash transactions

#### User Stories

**As a letting agent, I want to:**
1. Screen new landlords before onboarding
2. Screen tenants for high-value properties
3. Receive instant risk scores and alerts
4. Maintain AML compliance records
5. Conduct annual reviews of existing clients
6. Generate audit-ready AML reports
7. Be alerted to changes in sanction lists
8. Document enhanced due diligence for high-risk clients

**As an admin/compliance officer, I want to:**
1. View all AML screenings across the agency
2. Review flagged cases and make decisions
3. Track overdue annual reviews
4. Export compliance data for regulators
5. Monitor screening API usage and costs

#### Technical Requirements

**Database Schema**:
```prisma
model AMLScreening {
  id                   String               @id @default(cuid())
  
  // Subject information
  subjectType          AMLSubjectType
  subjectId            String               // User ID or external reference
  
  // Personal details
  fullName             String
  dateOfBirth          DateTime?
  nationality          String?
  countryOfResidence   String?
  addressLine1         String?
  addressLine2         String?
  city                 String?
  postcode             String?
  
  // Business details (if applicable)
  companyName          String?
  companyNumber        String?
  companyCountry       String?
  
  // Screening details
  screeningDate        DateTime             @default(now())
  screeningProvider    String               @default("ComplyAdvantage")
  screeningReference   String?              @unique
  
  // Risk assessment
  riskLevel            RiskLevel
  riskScore            Int?                 // 0-100
  
  // Results
  sanctionsMatch       Boolean              @default(false)
  pepMatch             Boolean              @default(false)
  adverseMediaMatch    Boolean              @default(false)
  matchCount           Int                  @default(0)
  
  // Status
  status               ScreeningStatus      @default(PENDING)
  reviewedBy           String?
  reviewedAt           DateTime?
  reviewNotes          String?              @db.Text
  
  // Enhanced Due Diligence
  requiresEDD          Boolean              @default(false)
  eddCompleted         Boolean              @default(false)
  eddNotes             String?              @db.Text
  eddDocuments         String[]             // S3 URLs
  
  // Ongoing monitoring
  monitoringEnabled    Boolean              @default(false)
  lastMonitoringCheck  DateTime?
  nextReviewDate       DateTime?
  
  // Metadata
  performedBy          String               // User who initiated screening
  cost                 Decimal?             @db.Decimal(10, 2)
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  performer            User                 @relation("ScreeningPerformer", fields: [performedBy], references: [id])
  reviewer             User?                @relation("ScreeningReviewer", fields: [reviewedBy], references: [id])
  matches              AMLMatch[]
  property             Property?            @relation(fields: [propertyId], references: [id])
  propertyId           String?
  
  @@index([subjectId])
  @@index([riskLevel])
  @@index([status])
  @@index([nextReviewDate])
  @@map("aml_screenings")
}

enum AMLSubjectType {
  LANDLORD
  TENANT
  PROPERTY_OWNER
  COMPANY
  BENEFICIAL_OWNER
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  PROHIBITED
}

enum ScreeningStatus {
  PENDING
  CLEAR
  POTENTIAL_MATCH
  CONFIRMED_MATCH
  UNDER_REVIEW
  APPROVED
  REJECTED
}

model AMLMatch {
  id                   String               @id @default(cuid())
  screeningId          String
  
  // Match details
  matchType            AMLMatchType
  matchScore           Int                  // Confidence score 0-100
  matchCategory        String               // sanctions, pep, adverse-media
  
  // Matched entity
  matchedName          String
  matchedAliases       String[]
  matchedDOB           DateTime?
  matchedCountries     String[]
  
  // List information
  listName             String               // e.g., "OFAC SDN List"
  listType             String
  listedDate           DateTime?
  
  // Additional details
  description          String?              @db.Text
  matchReasons         String[]
  sourceUrls           String[]
  
  // Review
  isReviewed           Boolean              @default(false)
  reviewDecision       ReviewDecision?
  reviewNotes          String?              @db.Text
  reviewedBy           String?
  reviewedAt           DateTime?
  
  // Metadata
  createdAt            DateTime             @default(now())
  
  // Relations
  screening            AMLScreening         @relation(fields: [screeningId], references: [id], onDelete: Cascade)
  reviewer             User?                @relation(fields: [reviewedBy], references: [id])
  
  @@index([screeningId])
  @@map("aml_matches")
}

enum AMLMatchType {
  EXACT
  FUZZY
  PARTIAL
  ALIAS
}

enum ReviewDecision {
  FALSE_POSITIVE
  TRUE_POSITIVE
  REQUIRES_EDD
  REJECT_CLIENT
}

model AMLAuditLog {
  id                   String               @id @default(cuid())
  screeningId          String?
  
  // Audit details
  action               AMLAction
  description          String               @db.Text
  
  // User
  performedBy          String
  performedByName      String
  
  // Metadata
  timestamp            DateTime             @default(now())
  ipAddress            String?
  
  // Relations
  user                 User                 @relation(fields: [performedBy], references: [id])
  screening            AMLScreening?        @relation(fields: [screeningId], references: [id])
  
  @@index([screeningId])
  @@index([timestamp])
  @@map("aml_audit_logs")
}

enum AMLAction {
  SCREENING_INITIATED
  SCREENING_COMPLETED
  MATCH_REVIEWED
  EDD_REQUESTED
  EDD_COMPLETED
  APPROVED
  REJECTED
  ANNUAL_REVIEW_COMPLETED
  MONITORING_ALERT
}
```

**Third-Party API Integration**:
```typescript
// lib/aml/comply-advantage.ts

export class ComplyAdvantageService {
  private apiKey: string;
  private baseUrl = 'https://api.complyadvantage.com';
  
  async screenIndividual(data: {
    name: string;
    dateOfBirth?: Date;
    nationality?: string;
    address?: string;
  }): Promise<AMLScreeningResult> {
    // Call ComplyAdvantage API
    // Map results to our data structure
    // Calculate risk score
    // Return structured results
  }
  
  async screenCompany(data: {
    companyName: string;
    companyNumber?: string;
    country?: string;
  }): Promise<AMLScreeningResult> {
    // Screen company against sanctions
    // Check beneficial owners
    // Return results
  }
  
  async enableOngoingMonitoring(screeningId: string): Promise<void> {
    // Enable webhook notifications
    // Store monitoring reference
  }
  
  async getMonitoringUpdate(reference: string): Promise<MonitoringUpdate> {
    // Check for new matches
    // Return any alerts
  }
}

interface AMLScreeningResult {
  reference: string;
  riskLevel: RiskLevel;
  riskScore: number;
  matches: {
    type: 'sanctions' | 'pep' | 'adverse_media';
    score: number;
    entity: {
      name: string;
      aliases: string[];
      dob?: Date;
      countries: string[];
    };
    list: {
      name: string;
      type: string;
      listedDate?: Date;
    };
    description?: string;
    sources: string[];
  }[];
}
```

**API Endpoints**:
```typescript
// tRPC Router: aml.ts

export const amlRouter = router({
  // Initiate screening
  screenSubject: protectedProcedure
    .input(z.object({
      subjectType: z.enum(['LANDLORD', 'TENANT', 'COMPANY']),
      subjectId: z.string().optional(),
      fullName: z.string(),
      dateOfBirth: z.date().optional(),
      nationality: z.string().optional(),
      address: z.object({
        line1: z.string(),
        line2: z.string().optional(),
        city: z.string(),
        postcode: z.string(),
      }).optional(),
      companyName: z.string().optional(),
      companyNumber: z.string().optional(),
      propertyId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check user has permission (letting agent only)
      // Call screening service
      // Save results to database
      // Create audit log entry
      // Return screening results
    }),

  // Get screening results
  getScreening: protectedProcedure
    .input(z.object({
      screeningId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Fetch screening with matches
      // Return full details
    }),

  // Get all screenings
  getAllScreenings: protectedProcedure
    .input(z.object({
      status: z.enum(['ALL', 'PENDING', 'UNDER_REVIEW', 'CLEAR', 'FLAGGED']).optional(),
      riskLevel: z.nativeEnum(RiskLevel).optional(),
      subjectType: z.nativeEnum(AMLSubjectType).optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Fetch screenings with filters
      // Include match counts
      // Sort by risk level and date
      // Return paginated results
    }),

  // Review a match
  reviewMatch: protectedProcedure
    .input(z.object({
      matchId: z.string(),
      decision: z.enum(['FALSE_POSITIVE', 'TRUE_POSITIVE', 'REQUIRES_EDD', 'REJECT_CLIENT']),
      notes: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Update match review
      // Update screening status if all matches reviewed
      // Create audit log entry
      // Send notifications if needed
      // Return updated match
    }),

  // Complete Enhanced Due Diligence
  completeEDD: protectedProcedure
    .input(z.object({
      screeningId: z.string(),
      notes: z.string(),
      documents: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      // Mark EDD as complete
      // Upload documents
      // Update screening status
      // Create audit log
      // Return updated screening
    }),

  // Schedule annual review
  scheduleAnnualReview: protectedProcedure
    .input(z.object({
      screeningId: z.string(),
      reviewDate: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Set next review date
      // Schedule reminder
      // Return confirmation
    }),

  // Get compliance dashboard
  getComplianceDashboard: protectedProcedure
    .query(async ({ ctx }) => {
      // Count screenings by status
      // Identify overdue reviews
      // Calculate risk distribution
      // Get recent alerts
      // Return dashboard data
    }),

  // Export compliance report
  exportComplianceReport: protectedProcedure
    .input(z.object({
      dateFrom: z.date(),
      dateTo: z.date(),
      includeDetails: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Fetch all screenings in date range
      // Generate PDF report
      // Include audit trail
      // Upload to S3
      // Return report URL
    }),
});
```

**UI Components**:
- `AMLDashboard`: Overview of screenings and risk distribution
- `ScreeningForm`: Initiate new screening
- `ScreeningResults`: Display screening results with match details
- `MatchReviewCard`: Review individual matches
- `RiskBadge`: Visual risk level indicator
- `EDDForm`: Enhanced due diligence documentation
- `ComplianceReport`: Audit-ready report generator
- `OverdueReviewsList`: Track pending annual reviews

**Business Logic**:
```typescript
// utils/aml.ts

export function calculateRiskLevel(
  matches: AMLMatch[],
  subjectData: {
    nationality?: string;
    transactionValue?: number;
    isPEP?: boolean;
  }
): RiskLevel {
  // Sanctions match = PROHIBITED
  if (matches.some(m => m.matchCategory === 'sanctions' && m.matchScore > 80)) {
    return 'PROHIBITED';
  }
  
  // PEP match = HIGH
  if (matches.some(m => m.matchCategory === 'pep' && m.matchScore > 70)) {
    return 'HIGH';
  }
  
  // High-value transaction
  if (subjectData.transactionValue && subjectData.transactionValue > 10000) {
    return 'HIGH';
  }
  
  // Adverse media with medium confidence = MEDIUM
  if (matches.some(m => m.matchCategory === 'adverse-media' && m.matchScore > 60)) {
    return 'MEDIUM';
  }
  
  // High-risk countries
  const highRiskCountries = ['AF', 'IR', 'KP', 'SY', 'YE'];
  if (subjectData.nationality && highRiskCountries.includes(subjectData.nationality)) {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

export function requiresEDD(screening: AMLScreening, matches: AMLMatch[]): boolean {
  return (
    screening.riskLevel === 'HIGH' ||
    screening.riskLevel === 'PROHIBITED' ||
    screening.pepMatch ||
    matches.some(m => m.reviewDecision === 'REQUIRES_EDD')
  );
}

export function calculateNextReviewDate(
  screeningDate: Date,
  riskLevel: RiskLevel
): Date {
  const reviewIntervals = {
    LOW: 365,        // 1 year
    MEDIUM: 180,     // 6 months
    HIGH: 90,        // 3 months
    PROHIBITED: 30,  // 1 month (if approved with conditions)
  };
  
  return addDays(screeningDate, reviewIntervals[riskLevel]);
}
```

---

### Feature 2: Council Intelligence System

#### Business Requirements

**Council Data Management**:
- Maintain database of all 32 Scottish councils
- Track council-specific requirements for:
  - Landlord registration
  - HMO licensing
  - Certificate requirements
  - Application processes
- Monitor fee changes (typically annual)
- Track contact information and office hours

**Regulatory Monitoring**:
- Scottish Government legislation updates
- Council policy changes
- Industry guidance updates
- Deadline changes
- New requirements

**Alert System**:
- Email digests of relevant changes
- In-app notifications
- Priority alerts for urgent changes
- Council-specific subscriptions

#### User Stories

**As a landlord, I want to:**
1. View all requirements for my council
2. Receive alerts about changes affecting my properties
3. Compare requirements between councils (if I have properties in multiple areas)
4. Access council contact information
5. See upcoming council deadlines

**As a letting agent, I want to:**
1. Monitor requirements across all councils where I operate
2. Receive weekly digest of regulatory changes
3. View historical changes to requirements
4. Export council data for client reports
5. Set up custom alerts for specific councils

**As an admin, I want to:**
1. Update council data when fees/requirements change
2. Create regulatory alerts for users
3. Track which councils have upcoming changes
4. Monitor user engagement with alerts

#### Technical Requirements

**Database Schema**:
```prisma
// Extend Council model from Phase 1
model Council {
  // ... existing fields from Phase 1
  
  // Enhanced contact information
  address              String?
  officeHours          String?
  emergencyPhone       String?
  
  // Online services
  onlinePortalUrl      String?
  applicationPortalUrl String?
  paymentPortalUrl     String?
  
  // Social media (for updates)
  twitterHandle        String?
  facebookUrl          String?
  
  // Processing
  typicalResponseDays  Int?
  applicationsPerYear  Int?
  
  // Monitoring
  websiteLastChecked   DateTime?
  feesLastUpdated      DateTime?
  requirementsLastUpdated DateTime?
  
  // Relations
  changes              CouncilChange[]
  alerts               RegulatoryAlert[]
  
  // ... existing relations
}

model CouncilChange {
  id                   String               @id @default(cuid())
  councilId            String
  
  // Change details
  changeType           CouncilChangeType
  effectiveDate        DateTime
  announcedDate        DateTime             @default(now())
  
  // What changed
  changeCategory       String               // fees, requirements, process, contact
  changeSummary        String               @db.Text
  changeDetails        String?              @db.Text
  
  // Impact
  impactLevel          ImpactLevel          @default(MEDIUM)
  affectedUsers        Int?                 // Estimated number of affected properties
  
  // Sources
  sourceUrl            String?
  sourceDocument       String?              // S3 URL
  
  // Notifications
  notificationSent     Boolean              @default(false)
  notificationSentAt   DateTime?
  
  // Metadata
  createdBy            String
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  council              Council              @relation(fields: [councilId], references: [id])
  creator              User                 @relation(fields: [createdBy], references: [id])
  alerts               RegulatoryAlert[]
  
  @@index([councilId])
  @@index([effectiveDate])
  @@map("council_changes")
}

enum CouncilChangeType {
  FEE_INCREASE
  FEE_DECREASE
  NEW_REQUIREMENT
  REQUIREMENT_CHANGE
  PROCESS_CHANGE
  DEADLINE_CHANGE
  CONTACT_UPDATE
  POLICY_UPDATE
  SYSTEM_UPDATE
}

enum ImpactLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model RegulatoryAlert {
  id                   String               @id @default(cuid())
  
  // Alert details
  alertType            AlertType
  title                String
  summary              String               @db.Text
  fullDetails          String?              @db.Text
  
  // Scope
  scope                AlertScope
  councilId            String?              // If council-specific
  affectedTypes        String[]             // landlord, letting_agent, hmo
  
  // Urgency
  priority             AlertPriority        @default(NORMAL)
  effectiveDate        DateTime?
  deadlineDate         DateTime?
  
  // Content
  actionRequired       String?              @db.Text
  relevantLinks        String[]
  attachmentUrls       String[]
  
  // Status
  status               AlertStatus          @default(ACTIVE)
  publishedAt          DateTime             @default(now())
  expiresAt            DateTime?
  
  // Tracking
  viewCount            Int                  @default(0)
  acknowledgeCount     Int                  @default(0)
  
  // Metadata
  createdBy            String
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  council              Council?             @relation(fields: [councilId], references: [id])
  creator              User                 @relation(fields: [createdBy], references: [id])
  councilChange        CouncilChange?       @relation(fields: [councilChangeId], references: [id])
  councilChangeId      String?
  acknowledgements     AlertAcknowledgement[]
  
  @@index([scope, status])
  @@index([publishedAt])
  @@index([councilId])
  @@map("regulatory_alerts")
}

enum AlertType {
  LEGISLATION_CHANGE
  COUNCIL_POLICY
  FEE_CHANGE
  DEADLINE_CHANGE
  NEW_REQUIREMENT
  GUIDANCE_UPDATE
  INDUSTRY_NEWS
  SYSTEM_UPDATE
}

enum AlertScope {
  NATIONAL          // Affects all of Scotland
  REGIONAL          // Affects multiple councils
  COUNCIL_SPECIFIC  // Single council
}

enum AlertPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum AlertStatus {
  DRAFT
  ACTIVE
  EXPIRED
  ARCHIVED
}

model AlertAcknowledgement {
  id                   String               @id @default(cuid())
  alertId              String
  userId               String
  
  acknowledgedAt       DateTime             @default(now())
  notes                String?              @db.Text
  
  // Relations
  alert                RegulatoryAlert      @relation(fields: [alertId], references: [id], onDelete: Cascade)
  user                 User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([alertId, userId])
  @@index([userId])
  @@map("alert_acknowledgements")
}

model UserAlertPreferences {
  id                   String               @id @default(cuid())
  userId               String               @unique
  
  // Email preferences
  emailEnabled         Boolean              @default(true)
  emailFrequency       EmailFrequency       @default(WEEKLY)
  
  // Alert type preferences
  legislationChanges   Boolean              @default(true)
  councilPolicies      Boolean              @default(true)
  feeChanges           Boolean              @default(true)
  deadlineChanges      Boolean              @default(true)
  newRequirements      Boolean              @default(true)
  guidanceUpdates      Boolean              @default(false)
  industryNews         Boolean              @default(false)
  
  // Council subscriptions
  subscribedCouncils   String[]             // Council IDs
  
  // In-app preferences
  showInAppAlerts      Boolean              @default(true)
  alertPriorityFilter  AlertPriority        @default(NORMAL)
  
  // Metadata
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  user                 User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_alert_preferences")
}

enum EmailFrequency {
  IMMEDIATE
  DAILY
  WEEKLY
  MONTHLY
  NEVER
}

model CouncilWebsiteScrape {
  id                   String               @id @default(cuid())
  councilId            String
  
  // Scrape details
  url                  String
  scrapedAt            DateTime             @default(now())
  
  // Results
  success              Boolean
  changesDetected      Boolean              @default(false)
  changeDescription    String?              @db.Text
  
  // Content hash
  contentHash          String               // To detect changes
  
  // Error handling
  error                String?              @db.Text
  
  // Metadata
  nextScrapeDate       DateTime
  
  // Relations
  council              Council              @relation(fields: [councilId], references: [id])
  
  @@index([councilId, scrapedAt])
  @@map("council_website_scrapes")
}
```

**Web Scraping Service** (for automated council monitoring):
```typescript
// lib/scraping/council-monitor.ts

export class CouncilMonitorService {
  async scrapeCouncilWebsite(councilId: string): Promise<ScrapeResult> {
    // Fetch council website
    // Parse relevant sections
    // Compare with previous scrape
    // Detect changes in fees, requirements
    // Return results
  }
  
  async detectChanges(
    current: string,
    previous: string
  ): Promise<{
    hasChanges: boolean;
    changes: string[];
  }> {
    // Compare content
    // Identify specific changes
    // Return structured results
  }
  
  async scheduleAllScrapes(): Promise<void> {
    // Queue scrape jobs for all councils
    // Typically run weekly
  }
}
```

**API Endpoints**:
```typescript
// tRPC Router: council-intelligence.ts

export const councilIntelligenceRouter = router({
  // Get council details
  getCouncil: publicProcedure
    .input(z.object({
      councilId: z.string(),
    }))
    .query(async ({ input }) => {
      // Fetch full council details
      // Include recent changes
      // Return comprehensive data
    }),

  // Compare councils
  compareCouncils: publicProcedure
    .input(z.object({
      councilIds: z.array(z.string()),
    }))
    .query(async ({ input }) => {
      // Fetch multiple councils
      // Compare fees and requirements
      // Return comparison data
    }),

  // Get regulatory alerts
  getAlerts: protectedProcedure
    .input(z.object({
      scope: z.nativeEnum(AlertScope).optional(),
      priority: z.nativeEnum(AlertPriority).optional(),
      status: z.nativeEnum(AlertStatus).optional(),
      councilId: z.string().optional(),
      unacknowledgedOnly: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Fetch alerts with filters
      // Filter by user's councils if applicable
      // Check acknowledgement status
      // Return sorted by priority and date
    }),

  // Acknowledge alert
  acknowledgeAlert: protectedProcedure
    .input(z.object({
      alertId: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create acknowledgement record
      // Increment alert acknowledge count
      // Return confirmation
    }),

  // Get council changes
  getCouncilChanges: protectedProcedure
    .input(z.object({
      councilId: z.string().optional(),
      changeType: z.nativeEnum(CouncilChangeType).optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
    }))
    .query(async ({ input }) => {
      // Fetch changes with filters
      // Include related alerts
      // Sort by date (most recent first)
      // Return changes
    }),

  // Update alert preferences
  updateAlertPreferences: protectedProcedure
    .input(z.object({
      emailEnabled: z.boolean().optional(),
      emailFrequency: z.nativeEnum(EmailFrequency).optional(),
      subscribedCouncils: z.array(z.string()).optional(),
      alertTypes: z.object({
        legislationChanges: z.boolean().optional(),
        councilPolicies: z.boolean().optional(),
        feeChanges: z.boolean().optional(),
        // ... other types
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Update or create preferences
      // Return updated preferences
    }),

  // Get alert preferences
  getAlertPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      // Fetch user's alert preferences
      // Return with defaults if not set
    }),

  // Get intelligence dashboard
  getIntelligenceDashboard: protectedProcedure
    .query(async ({ ctx }) => {
      // Get user's councils
      // Fetch recent alerts for those councils
      // Get upcoming deadlines
      // Get recent changes
      // Calculate engagement stats
      // Return dashboard data
    }),

  // Create alert (admin only)
  createAlert: adminProcedure
    .input(z.object({
      alertType: z.nativeEnum(AlertType),
      title: z.string(),
      summary: z.string(),
      fullDetails: z.string().optional(),
      scope: z.nativeEnum(AlertScope),
      councilId: z.string().optional(),
      priority: z.nativeEnum(AlertPriority),
      effectiveDate: z.date().optional(),
      deadlineDate: z.date().optional(),
      actionRequired: z.string().optional(),
      relevantLinks: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create alert
      // Send notifications based on user preferences
      // Return created alert
    }),
});
```

**UI Components**:
- `CouncilCard`: Display council information
- `CouncilComparison`: Side-by-side council comparison
- `AlertFeed`: Stream of regulatory alerts
- `AlertCard`: Individual alert display
- `AlertPreferences`: Manage notification settings
- `CouncilChangesTimeline`: Visual history of changes
- `IntelligenceDashboard`: Overview of relevant updates
- `DeadlineCalendar`: Upcoming council deadlines

**Business Logic**:
```typescript
// utils/council-intelligence.ts

export function getRelevantCouncils(user: User, properties: Property[]): string[] {
  // Extract unique council IDs from user's properties
  return [...new Set(properties.map(p => p.councilId))];
}

export function filterAlertsByRelevance(
  alerts: RegulatoryAlert[],
  userType: 'landlord' | 'letting_agent',
  councils: string[]
): RegulatoryAlert[] {
  return alerts.filter(alert => {
    // National alerts relevant to everyone
    if (alert.scope === 'NATIONAL') return true;
    
    // Council-specific alerts
    if (alert.scope === 'COUNCIL_SPECIFIC' && alert.councilId) {
      return councils.includes(alert.councilId);
    }
    
    // Check affected types
    if (alert.affectedTypes.length > 0) {
      return alert.affectedTypes.includes(userType);
    }
    
    return false;
  });
}

export function calculateAlertUrgency(alert: RegulatoryAlert): {
  isUrgent: boolean;
  daysUntilDeadline: number | null;
  urgencyMessage: string;
} {
  if (!alert.deadlineDate) {
    return {
      isUrgent: alert.priority === 'URGENT' || alert.priority === 'HIGH',
      daysUntilDeadline: null,
      urgencyMessage: alert.priority === 'URGENT' ? 'Action required' : 'For information',
    };
  }
  
  const daysUntil = differenceInDays(alert.deadlineDate, new Date());
  
  if (daysUntil < 0) {
    return {
      isUrgent: true,
      daysUntilDeadline: daysUntil,
      urgencyMessage: 'Deadline passed',
    };
  } else if (daysUntil <= 7) {
    return {
      isUrgent: true,
      daysUntilDeadline: daysUntil,
      urgencyMessage: `${daysUntil} days remaining`,
    };
  } else if (daysUntil <= 30) {
    return {
      isUrgent: alert.priority === 'HIGH' || alert.priority === 'URGENT',
      daysUntilDeadline: daysUntil,
      urgencyMessage: `${daysUntil} days remaining`,
    };
  } else {
    return {
      isUrgent: false,
      daysUntilDeadline: daysUntil,
      urgencyMessage: `Deadline: ${format(alert.deadlineDate, 'dd MMM yyyy')}`,
    };
  }
}
```

---

## 📅 Week-by-Week Development Plan

### Week 6: AML/Sanctions Screening (Days 32-36)

**Day 32-33: AML Backend Setup**
- [ ] Implement AML database schema
- [ ] Create Prisma migrations
- [ ] Set up ComplyAdvantage API integration
- [ ] Build screening service wrapper
- [ ] Implement risk calculation logic
- [ ] Create audit logging system

**Day 34-36: AML UI & Workflows**
- [ ] Create screening initiation form
- [ ] Build screening results display
- [ ] Implement match review interface
- [ ] Create EDD documentation form
- [ ] Build compliance dashboard
- [ ] Add annual review tracking
- [ ] Test complete AML workflow

**Deliverables**:
- Working AML screening
- Match review process
- Compliance reporting
- Audit trail

---

### Week 7: Council Intelligence (Days 37-41)

**Day 37-38: Council Intelligence Backend**
- [ ] Extend council database schema
- [ ] Create council changes tracking
- [ ] Implement regulatory alerts system
- [ ] Build alert preferences
- [ ] Create web scraping service (basic)
- [ ] Set up alert notifications

**Day 39-41: Council Intelligence UI**
- [ ] Create council comparison tool
- [ ] Build alert feed
- [ ] Implement alert preferences page
- [ ] Create intelligence dashboard
- [ ] Add council changes timeline
- [ ] Build deadline calendar
- [ ] Test notification system

**Deliverables**:
- Council comparison tool
- Alert system working
- Notification preferences
- Intelligence dashboard

---

### Week 8: Integration & Launch (Days 42-46)

**Day 42-43: System Integration**
- [ ] Integrate AML with property/landlord management
- [ ] Connect alerts to compliance dashboard
- [ ] Unified notification system across all phases
- [ ] Cross-reference council data across features
- [ ] Comprehensive dashboard integration
- [ ] End-to-end testing of all features

**Day 44-45: Testing & Optimization**
- [ ] Full application testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing
- [ ] User acceptance testing
- [ ] Bug fixes and polish

**Day 46: Launch & Documentation**
- [ ] Production deployment
- [ ] User documentation
- [ ] Admin training materials
- [ ] Monitoring setup
- [ ] Backup verification
- [ ] Launch announcement
- [ ] Post-launch monitoring

**Deliverables**:
- Fully integrated application
- All 3 phases working together
- Production deployment
- Complete documentation

---

## ✅ Phase 3 Success Criteria

### Functional Requirements
- [ ] AML screening working with real API
- [ ] Risk assessment accurate
- [ ] Match review process functional
- [ ] EDD documentation working
- [ ] Compliance reports generation
- [ ] Council comparison tool working
- [ ] Alert system delivering notifications
- [ ] Users can customize alert preferences
- [ ] Council changes tracked
- [ ] All features integrated seamlessly

### Technical Requirements
- [ ] Third-party API integration secure
- [ ] API usage tracked and optimized
- [ ] Web scraping functional (basic)
- [ ] Notification system reliable
- [ ] Database performance maintained
- [ ] Security audit passed
- [ ] GDPR compliance verified
- [ ] Backup and recovery tested

### User Experience
- [ ] AML process is clear
- [ ] Alerts are relevant and actionable
- [ ] Council comparison is intuitive
- [ ] Dashboard shows all compliance data
- [ ] Mobile experience excellent
- [ ] Performance fast across all features

---

## 🔗 Full System Integration

### Unified Dashboard
```
┌─────────────────────────────────────────────────────────┐
│  ScotComply Compliance Dashboard                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Properties  │  │  Compliance │  │  Alerts     │     │
│  │    12       │  │     95%     │  │     3 New   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Urgent Actions Required:                         │  │
│  │  • Gas cert expiring (7 days) - 123 Main St      │  │
│  │  • HMO renewal due - 456 High St                 │  │
│  │  • AML review overdue - Landlord Smith           │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │  Certifications  │  │  Registrations   │            │
│  │  [Phase 1]       │  │  [Phase 1]       │            │
│  └──────────────────┘  └──────────────────┘            │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │  HMO Licenses    │  │  Repairing Std   │            │
│  │  [Phase 2]       │  │  [Phase 2]       │            │
│  └──────────────────┘  └──────────────────┘            │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │  AML Screenings  │  │  Council Updates │            │
│  │  [Phase 3]       │  │  [Phase 3]       │            │
│  └──────────────────┘  └──────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

### Data Flow Integration
1. **Property → All Features**: Single property links to all compliance data
2. **Certificates → Repairing Standard**: Certificate expiry triggers assessment reminder
3. **HMO License → Certificates**: HMO requires valid certificates
4. **AML → Properties**: High-value properties require screening
5. **Council Alerts → All Features**: Council changes affect all compliance areas
6. **Reminders → Unified System**: All expiries in one notification system

---

**Phase 3 Document Version**: 1.0  
**Last Updated**: October 2025  
**Status**: Ready for Development
