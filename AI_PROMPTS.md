# AI Automation Prompts for ScotComply Development

## 🤖 Introduction

This document contains battle-tested AI prompts for accelerating ScotComply development. These prompts are optimized for Cursor IDE, GitHub Copilot, ChatGPT, and Claude.

**Usage Tips**:
1. Always provide context (what you're building, tech stack)
2. Be specific about requirements
3. Request type-safe solutions
4. Ask for error handling
5. Iterate based on results

---

## 🗄️ Database & Schema Generation

### Prompt 1: Create Prisma Schema
```
Create a Prisma schema for [FEATURE_NAME] with the following requirements:

Context:
- Project: Scottish letting compliance management system
- Database: PostgreSQL
- ORM: Prisma
- Naming: snake_case for tables, camelCase for fields

Requirements:
1. Fields needed: [LIST SPECIFIC FIELDS]
2. Relationships: [DESCRIBE RELATIONS]
3. Indexes on: [FIELDS THAT WILL BE QUERIED OFTEN]
4. Enums for: [STATUS FIELDS, CATEGORIES]
5. Include:
   - Soft delete capability (deleted_at field)
   - Timestamps (createdAt, updatedAt)
   - Proper foreign key constraints
   - Cascade deletes where appropriate

Constraints:
- All monetary values: Decimal @db.Decimal(10, 2)
- All URLs: String
- All text fields: String @db.Text
- All arrays: Use [] notation

Example structure to follow:
```prisma
model Example {
  id          String   @id @default(cuid())
  name        String
  status      Status   @default(ACTIVE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([status])
  @@map("examples")
}
```

Generate the complete schema with proper typing and relations.
```

### Prompt 2: Generate Prisma Migration
```
I need to create a Prisma migration for [FEATURE].

Current schema changes:
[PASTE NEW/MODIFIED SCHEMA]

Requirements:
1. Generate migration name: add_[feature]_tables
2. Ensure foreign keys are properly created
3. Verify indexes are added
4. Check for any breaking changes

Provide:
1. The migration command to run
2. Any warnings about data loss
3. Rollback strategy if needed
```

---

## 🔌 API Development (tRPC)

### Prompt 3: Create tRPC Router
```
Create a tRPC router for [FEATURE] with full CRUD operations.

Context:
- Framework: Next.js 14 with tRPC v10
- Validation: Zod schemas
- Database: Prisma
- Auth: NextAuth.js with protectedProcedure

Requirements:

Endpoints needed:
1. create[Entity]: Create new record
2. getById: Get single record by ID
3. getAll: Get all records with filtering
4. update: Update existing record
5. delete: Soft delete record

Specifications:
- All inputs validated with Zod
- Protected procedures (require authentication)
- Verify user owns the resource before mutations
- Include proper error handling with try/catch
- Return properly typed responses
- Add pagination for list queries (take/skip)
- Include related data where appropriate

Input validations:
[DESCRIBE REQUIRED/OPTIONAL FIELDS]

Example structure:
```typescript
export const [feature]Router = router({
  create: protectedProcedure
    .input(z.object({
      // input schema
    }))
    .mutation(async ({ ctx, input }) => {
      // implementation
    }),
  
  getAll: protectedProcedure
    .input(z.object({
      // filters
    }))
    .query(async ({ ctx, input }) => {
      // implementation
    }),
});
```

Generate complete router with all endpoints, proper typing, and error handling.
```

### Prompt 4: Create Zod Validation Schema
```
Create comprehensive Zod validation schemas for [ENTITY].

Entity fields:
[LIST ALL FIELDS WITH TYPES]

Requirements:
1. Create base schema
2. Create create/update variants
3. Add custom error messages
4. Include:
   - Required field validations
   - String min/max lengths
   - Email format validation
   - Date validations
   - Number min/max ranges
   - Enum validations
   - Optional field handling

Example format:
```typescript
const baseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export const createSchema = baseSchema;
export const updateSchema = baseSchema.partial();
```

Include validation for Scottish-specific requirements (e.g., postcode format).
```

---

## 🎨 UI Component Generation

### Prompt 5: Create React Component
```
Create a React component for [COMPONENT_NAME].

Tech Stack:
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui components
- React Hook Form
- TanStack Query (React Query)

Component Requirements:
1. Purpose: [DESCRIBE WHAT IT DOES]
2. Props: [LIST EXPECTED PROPS]
3. Features:
   - [LIST SPECIFIC FEATURES]
4. UI Elements:
   - [LIST UI COMPONENTS NEEDED]

Requirements:
- Fully typed with TypeScript
- Mobile responsive (Tailwind breakpoints)
- Accessible (WCAG 2.1 AA)
- Loading states
- Error states
- Empty states
- Use shadcn/ui components where possible

Example structure:
```typescript
'use client';

interface [Component]Props {
  // props
}

export function [Component]({ prop1, prop2 }: [Component]Props) {
  // component logic
  
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}
```

Generate complete component with proper typing, error handling, and responsive design.
```

### Prompt 6: Create Form with React Hook Form
```
Create a form component for [FORM_PURPOSE] using React Hook Form and Zod.

Form Fields:
[LIST ALL FIELDS WITH TYPES]

Requirements:
1. Use React Hook Form with zodResolver
2. Include field-level validation
3. Show error messages below fields
4. Loading state during submission
5. Success/error toast notifications
6. Proper TypeScript typing
7. Use shadcn/ui form components

Validation Rules:
[DESCRIBE VALIDATION FOR EACH FIELD]

Features:
- Multi-step form (if applicable)
- File upload (if applicable)
- Auto-save draft (if applicable)

Structure:
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  // schema
});

type FormData = z.infer<typeof formSchema>;

export function [Form]({ onSubmit }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });
  
  // implementation
}
```

Generate complete form with validation, error handling, and submission logic.
```

### Prompt 7: Create Dashboard Layout
```
Create a dashboard layout for [FEATURE_NAME].

Layout Structure:
- Header: Logo, navigation, user menu
- Sidebar: Main navigation links
- Main Content Area: [DESCRIBE CONTENT]
- Footer: (optional)

Components to include:
1. [LIST COMPONENTS]

Requirements:
- Responsive (mobile: drawer menu, desktop: sidebar)
- Collapsible sidebar on desktop
- Active route highlighting
- Breadcrumbs
- Use Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui components

Features:
- Smooth transitions
- Keyboard navigation
- ARIA labels for accessibility

Generate complete layout with all navigation logic and responsive behavior.
```

---

## 🧪 Testing & Quality

### Prompt 8: Generate Unit Tests
```
Generate unit tests for [FUNCTION/COMPONENT] using Vitest.

Code to test:
```typescript
[PASTE CODE HERE]
```

Requirements:
1. Test all functions/methods
2. Test edge cases
3. Test error handling
4. Mock external dependencies
5. Aim for >80% coverage

Test scenarios to cover:
- Happy path
- Invalid inputs
- Null/undefined handling
- Edge cases specific to Scottish compliance domain

Generate comprehensive test suite with clear test descriptions.
```

### Prompt 9: Generate Integration Tests
```
Create integration tests for [FEATURE] using Playwright.

User Flow:
1. [DESCRIBE STEP-BY-STEP USER JOURNEY]

Requirements:
- Test on desktop and mobile viewports
- Test form submissions
- Test navigation
- Test error scenarios
- Include assertions for UI state
- Use Playwright best practices

Generate complete test file with proper setup and teardown.
```

---

## 🔧 Business Logic & Utilities

### Prompt 10: Create Utility Function
```
Create a utility function for [PURPOSE].

Context: Scottish letting compliance application

Function Requirements:
- Name: [function_name]
- Input: [DESCRIBE INPUTS WITH TYPES]
- Output: [DESCRIBE OUTPUT WITH TYPE]
- Logic: [DESCRIBE BUSINESS RULES]

Scottish Compliance Rules:
[LIST SPECIFIC SCOTTISH REGULATIONS]

Requirements:
1. Fully typed with TypeScript
2. Handle edge cases
3. Add JSDoc comments
4. Include error handling
5. Write unit tests

Example:
```typescript
/**
 * Calculate landlord registration fee for Scottish council
 * @param councilId - Council identifier
 * @param propertyCount - Number of properties
 * @param isRenewal - Whether this is a renewal
 * @returns Fee breakdown with total
 */
export function calculateRegistrationFee(
  councilId: string,
  propertyCount: number,
  isRenewal: boolean
): FeeBreakdown {
  // implementation
}
```

Generate function with full implementation, types, and tests.
```

### Prompt 11: Calculate Scottish Compliance Dates
```
Create utility functions for calculating compliance dates in Scotland.

Requirements:

Functions needed:
1. calculateRenewalDate(expiryDate, noticeMonths) - Calculate when renewal should start
2. calculateReminderDates(expiryDate) - Return array of reminder dates (90, 30, 7 days, day of)
3. isExpiringSoon(expiryDate, threshold) - Check if date is within threshold
4. formatScottishDate(date) - Format date for Scottish users (DD/MM/YYYY)

Scottish-specific rules:
- Landlord registration: 3 years
- Gas Safety Certificate: 1 year
- EICR: 5 years
- EPC: 10 years
- HMO license: Varies by council (1-3 years)

Use date-fns library for date manipulation.

Generate all functions with full TypeScript typing and tests.
```

---

## 📧 Communication & Notifications

### Prompt 12: Create Email Template
```
Create a React Email template for [EMAIL_PURPOSE].

Context: Scottish compliance reminder email

Content needed:
- Subject line
- Email body with:
  - Greeting
  - Main message
  - [SPECIFIC CONTENT]
  - Call-to-action button
  - Footer with unsubscribe link

Data to include:
[LIST DYNAMIC DATA FIELDS]

Requirements:
- Use React Email components
- Mobile responsive
- Scottish professional tone
- Clear call-to-action
- Include company branding

Generate complete email template with proper styling.
```

### Prompt 13: Create Notification System
```
Create a notification service for ScotComply.

Requirements:

Notification Types:
1. Email (via Resend)
2. SMS (via Twilio)
3. In-app notifications

Features:
- Send individual notifications
- Send batch notifications
- Schedule future notifications
- Retry failed notifications
- Track delivery status
- User notification preferences

Structure:
```typescript
class NotificationService {
  async sendEmail(to, template, data) {}
  async sendSMS(to, message) {}
  async sendInApp(userId, notification) {}
  async scheduleSend(when, notification) {}
  async batchSend(notifications) {}
}
```

Generate complete service with error handling and logging.
```

---

## 🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scottish Compliance Domain-Specific

### Prompt 14: Generate Council Data
```
Generate seed data for Scottish councils (32 local authorities).

For each council, provide:
1. id: cuid()
2. name: Full council name
3. code: 3-letter code
4. region: Geographic region
5. email: Contact email
6. phone: Contact number
7. website: Council website
8. landlordRegFee: Registration fee (Decimal)
9. landlordRenewalFee: Renewal fee (Decimal)
10. propertyRegFee: Per-property fee (Decimal)

Format as Prisma seed data:
```typescript
const councils = [
  {
    id: 'council1',
    name: 'City of Edinburgh Council',
    code: 'EDI',
    // ... other fields
  },
  // ... 31 more councils
];
```

Research actual fees and contact info for accuracy.
```

### Prompt 15: Create HMO Classification Logic
```
Create a function to determine HMO classification under Scottish law.

Scottish HMO Rules:
- Standard HMO: 3+ unrelated people sharing facilities
- Small HMO: 5-6 occupants
- Large HMO: 7+ occupants
- Not HMO: Related occupants OR <3 occupants

Function Requirements:
```typescript
interface HMOClassification {
  isHMO: boolean;
  hmoType: 'NOT_HMO' | 'SMALL_HMO' | 'LARGE_HMO';
  requiresLicense: boolean;
  reasoning: string;
}

function classifyHMO(
  occupants: number,
  areRelated: boolean
): HMOClassification {
  // implementation
}
```

Include edge cases:
- Family with lodger
- Student accommodation
- Supported accommodation

Generate complete function with tests.
```

### Prompt 16: Create Repairing Standard Checklist
```
Generate the complete 21-point Scottish Repairing Standard checklist.

For each point, provide:
1. Point number (1-21)
2. Category (STRUCTURE_EXTERIOR, WATER_DRAINAGE, etc.)
3. Title (short description)
4. Description (full legal requirement)
5. isCritical (whether failure is critical)
6. Evidence required (what landlord needs to provide)

Format as TypeScript constant:
```typescript
export const REPAIRING_STANDARD_POINTS = [
  {
    point: 1,
    category: 'STRUCTURE_EXTERIOR',
    title: 'Structure and Exterior',
    description: 'Property structure must be wind and watertight...',
    isCritical: true,
    evidenceRequired: ['Photos of exterior', 'Structural survey'],
  },
  // ... 20 more points
];
```

Base on official Scottish Government guidance.
```

---

## 🔒 Security & Data Protection

### Prompt 17: Implement Data Encryption
```
Create encryption utilities for sensitive data in ScotComply.

Requirements:
- Encrypt personal data before storing
- Decrypt when retrieving
- Use industry-standard algorithms
- Key management via environment variables

Fields to encrypt:
- User phone numbers
- Tenant personal information
- Financial data

Generate:
1. encrypt(plaintext): ciphertext
2. decrypt(ciphertext): plaintext
3. hashPassword(password): hash
4. verifyPassword(password, hash): boolean

Use Node.js crypto module. Include proper error handling.
```

### Prompt 18: Implement GDPR Data Export
```
Create a GDPR-compliant data export function for ScotComply users.

Requirements:
- Export all user data in JSON format
- Include:
  - User profile
  - Properties
  - Registrations
  - Certificates
  - HMO licenses
  - Assessments
  - AML screenings (if applicable)
  - Alert preferences

Function signature:
```typescript
async function exportUserData(userId: string): Promise<UserDataExport> {
  // implementation
}
```

Generate complete function with proper data anonymization and formatting.
```

---

## 🚀 Deployment & DevOps

### Prompt 19: Create GitHub Actions CI/CD
```
Create GitHub Actions workflow for ScotComply.

Pipeline stages:
1. Lint (ESLint)
2. Type check (TypeScript)
3. Unit tests (Vitest)
4. Integration tests (Playwright)
5. Build check
6. Deploy to Vercel (on main branch)

Requirements:
- Run on PR and push to main
- Cache dependencies
- Parallel jobs where possible
- Report test results
- Fail fast on errors

Generate complete .github/workflows/ci.yml file.
```

### Prompt 20: Create Environment Configuration
```
Create environment variable configuration for ScotComply.

Environments: Development, Staging, Production

Variables needed:
1. Database connection
2. NextAuth secret
3. API keys (Resend, Twilio, ComplyAdvantage)
4. AWS S3/R2 credentials
5. App URLs
6. Feature flags

Generate:
1. .env.example file with all variables
2. Environment validation using Zod
3. Type-safe env access helper

Include proper comments and security warnings.
```

---

## 💡 General Prompting Tips

### Effective Prompt Structure
```
[CONTEXT]
What are you building, what tech stack, what's the goal?

[REQUIREMENTS]
Specific features, constraints, business rules

[TECHNICAL SPECS]
Frameworks, libraries, patterns to use

[QUALITY CRITERIA]
Type safety, error handling, testing, accessibility

[EXAMPLE]
Show desired structure or similar code

Generate [DESIRED OUTPUT] following all requirements above.
```

### Follow-up Prompts
After initial generation, refine with:
- "Add error handling for [specific case]"
- "Optimize this for performance"
- "Add TypeScript types for [specific area]"
- "Make this more accessible"
- "Add loading and empty states"
- "Write tests for this code"

---

## 🎯 Scottish Compliance Quick Reference

### Key Compliance Deadlines
- Landlord Registration: 3 years
- Gas Safety Certificate: Annual (12 months)
- EICR: 5 years
- EPC: 10 years
- HMO License: 1-3 years (council-specific)
- Letting Agent Registration: Annual
- CPD Requirement: 12 hours/year

### Important URLs
- Scottish Government Landlord Registration: landlordregistrationscotland.gov.uk
- Repairing Standard: gov.scot/repairing-standard
- Letting Agent Code of Practice: lettingagentcode.gov.scot

### Scottish Councils (32)
Aberdeen, Aberdeenshire, Angus, Argyll & Bute, Clackmannanshire, Dumfries & Galloway, Dundee, East Ayrshire, East Dunbartonshire, East Lothian, East Renfrewshire, Edinburgh, Eilean Siar, Falkirk, Fife, Glasgow, Highland, Inverclyde, Midlothian, Moray, North Ayrshire, North Lanarkshire, Orkney, Perth & Kinross, Renfrewshire, Scottish Borders, Shetland, South Ayrshire, South Lanarkshire, Stirling, West Dunbartonshire, West Lothian

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Usage**: Use with Cursor, Copilot, ChatGPT, or Claude for maximum productivity
