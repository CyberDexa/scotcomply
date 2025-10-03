# ScotComply - Technology Stack & Architecture Decisions

## 🏗️ Architecture Overview

**Architecture Pattern**: Full-Stack Monolith with Serverless Components  
**Deployment Model**: Edge-first with CDN distribution  
**Data Strategy**: PostgreSQL primary, Redis cache, S3 object storage

---

## 🎨 Frontend Stack

### Core Framework
**Next.js 14.x (App Router)**
- **Why**: 
  - Server-side rendering for SEO and performance
  - API routes for backend logic (monolithic approach)
  - Edge runtime support for global performance
  - Built-in optimization (images, fonts, code splitting)
  - Excellent TypeScript support
- **Alternatives Considered**: 
  - React SPA + separate backend (rejected: added complexity)
  - Remix (rejected: smaller ecosystem)

### Language
**TypeScript 5.x (Strict Mode)**
- **Why**:
  - Type safety reduces bugs in compliance logic
  - Better IDE support and autocomplete
  - Easier refactoring as codebase grows
  - Industry standard for production apps
- **Configuration**:
  ```json
  {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true
  }
  ```

### UI Framework & Styling
**Tailwind CSS 3.x + shadcn/ui**
- **Why Tailwind**:
  - Rapid development with utility classes
  - Consistent design system
  - Excellent mobile-responsive utilities
  - Tiny production bundle (tree-shaking)
  - Easy dark mode support
- **Why shadcn/ui**:
  - Radix UI primitives (accessible by default)
  - Customizable components (copy-paste, not npm install)
  - Beautiful default styling
  - WCAG 2.1 AA compliant out of the box
- **Component Library**:
  ```
  - Button, Input, Select, Checkbox, Radio
  - Dialog, Dropdown, Popover, Tooltip
  - Table, Card, Badge, Alert
  - Calendar, Date Picker
  - Toast notifications
  ```

### State Management
**React Context + Zustand**
- **React Context**: For auth state, theme, user preferences
- **Zustand**: For complex client state (dashboard filters, form state)
- **Why Not Redux**: Overkill for our app size, Zustand simpler

### Data Fetching
**TanStack Query (React Query) v5**
- **Why**:
  - Automatic caching and background refetching
  - Optimistic updates for better UX
  - Built-in loading and error states
  - Server state synchronization
  - Prefetching support
- **Configuration**:
  ```typescript
  staleTime: 5 minutes (certificate data)
  cacheTime: 30 minutes
  refetchOnWindowFocus: true (important for compliance data)
  ```

### Form Management
**React Hook Form + Zod**
- **React Hook Form**: Performance-optimized forms with minimal re-renders
- **Zod**: Schema validation with TypeScript inference
- **Why**: 
  - Complex forms with conditional fields (HMO licenses, etc.)
  - Type-safe validation
  - Great error handling
  - Easy integration with APIs

### Charts & Data Visualization
**Recharts + date-fns**
- **Recharts**: Certificate expiry timelines, compliance dashboards
- **date-fns**: Date manipulation (renewal calculations)
- **Why**: Simple API, responsive, good TypeScript support

---

## 🖥️ Backend Stack

### API Layer
**Next.js API Routes + tRPC**
- **Next.js API Routes**: RESTful endpoints for simple operations
- **tRPC**: Type-safe API calls for complex operations
- **Why tRPC**:
  - End-to-end type safety (frontend knows API types)
  - No API documentation needed (types are the docs)
  - Reduced boilerplate
  - Perfect for monolithic Next.js apps
- **API Structure**:
  ```
  /api/
    ├── auth/         # Authentication endpoints
    ├── landlords/    # Landlord registration
    ├── certificates/ # Certificate management
    ├── hmo/          # HMO licenses
    ├── aml/          # AML screening
    └── webhooks/     # Third-party webhooks
  
  /trpc/
    ├── routers/
    │   ├── landlord.ts
    │   ├── certificate.ts
    │   ├── agent.ts
    │   └── council.ts
  ```

### Database
**PostgreSQL 15+ (Serverless)**
- **Provider**: Supabase or Neon
- **Why PostgreSQL**:
  - ACID compliance (critical for compliance data)
  - JSON/JSONB support for flexible council requirements
  - Full-text search for council intelligence
  - Mature, battle-tested
  - Excellent TypeScript ORM support
- **Why Serverless**:
  - Automatic scaling
  - Pay-per-use pricing
  - Connection pooling built-in
  - No server management

### ORM
**Prisma 5.x**
- **Why**:
  - Type-safe database queries
  - Automatic migrations
  - Excellent VS Code integration
  - Generated client with autocomplete
  - Built-in connection pooling
- **Schema-first approach**:
  ```prisma
  model LandlordRegistration {
    id          String   @id @default(cuid())
    landlordId  String
    propertyId  String
    councilId   String
    registrationNumber String
    expiryDate  DateTime
    status      RegistrationStatus
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    
    landlord    User     @relation(fields: [landlordId], references: [id])
    property    Property @relation(fields: [propertyId], references: [id])
    council     Council  @relation(fields: [councilId], references: [id])
    
    @@index([expiryDate])
    @@index([landlordId])
  }
  ```

### Caching
**Redis (Upstash)**
- **Why**:
  - Session storage
  - Rate limiting
  - Cache council data (updated quarterly)
  - Job queue for reminders
- **Why Upstash**:
  - Serverless Redis
  - Durable storage
  - Built-in REST API
  - Pay-per-request pricing

### File Storage
**AWS S3 or Cloudflare R2**
- **Use Cases**:
  - Certificate PDFs (Gas, EICR, EPC)
  - HMO application documents
  - Repairing Standard evidence photos
  - Tribunal documentation
- **Why S3/R2**:
  - Industry standard
  - Cheap storage (R2 no egress fees)
  - Pre-signed URLs for secure uploads
  - CDN integration
- **Structure**:
  ```
  buckets/
    ├── certificates/
    │   ├── {userId}/
    │   │   ├── gas/
    │   │   ├── eicr/
    │   │   └── epc/
    ├── hmo-documents/
    └── repairing-evidence/
  ```

---

## 🔐 Authentication & Authorization

### Auth Provider
**NextAuth.js v5 (Auth.js)**
- **Providers**:
  - Email/Password (primary for letting agents)
  - Magic Link (email-only login for landlords)
  - Google OAuth (optional convenience)
- **Why NextAuth.js**:
  - Native Next.js integration
  - Secure session management
  - Built-in CSRF protection
  - Customizable callbacks
  - Multi-provider support

### Session Management
- **Strategy**: JWT with refresh tokens
- **Storage**: Encrypted cookies (httpOnly, secure, sameSite)
- **Expiry**: 30 days with rolling refresh
- **Multi-device**: Supported with device tracking

### Authorization
**Role-Based Access Control (RBAC)**
```typescript
enum Role {
  ADMIN = 'admin',
  LETTING_AGENT = 'letting_agent',
  LANDLORD = 'landlord',
  PROPERTY_MANAGER = 'property_manager'
}

// Permissions matrix
const permissions = {
  admin: ['*'],
  letting_agent: [
    'properties:read:all',
    'properties:write:all',
    'certificates:read:all',
    'certificates:write:all',
    'aml:execute'
  ],
  landlord: [
    'properties:read:own',
    'properties:write:own',
    'certificates:read:own',
    'certificates:write:own'
  ],
  property_manager: [
    'properties:read:assigned',
    'certificates:read:assigned'
  ]
}
```

---

## 📬 Communication Services

### Email
**Resend or SendGrid**
- **Use Cases**:
  - Certificate expiry reminders
  - Registration renewal notices
  - Regulatory alert digests
  - Account notifications
- **Why Resend**:
  - Modern API
  - React Email templates (type-safe)
  - Excellent deliverability
  - Generous free tier
- **Template Engine**: React Email
  ```tsx
  <Email>
    <Head>
      <title>Certificate Expiring Soon</title>
    </Head>
    <Body>
      <Container>
        <Heading>Your Gas Safety Certificate expires in 30 days</Heading>
        <Text>Property: {propertyAddress}</Text>
        <Button href={bookingUrl}>Book Inspection</Button>
      </Container>
    </Body>
  </Email>
  ```

### SMS
**Twilio**
- **Use Cases**:
  - Urgent expiry reminders (7 days, day-of)
  - High-priority regulatory alerts
  - Two-factor authentication (optional)
- **Why Twilio**:
  - Industry leader
  - UK number support
  - Reliable delivery
  - Detailed analytics

### Push Notifications
**Web Push API (native)**
- **Use Cases**:
  - Real-time dashboard updates
  - Instant compliance alerts
- **Implementation**: Service Workers + Push API

---

## 🔍 Third-Party Integrations

### AML/Sanctions Screening
**ComplyAdvantage or Dow Jones Risk & Compliance**
- **Features**:
  - Real-time sanctions screening
  - PEP database access
  - Adverse media monitoring
  - Ongoing monitoring
- **Why ComplyAdvantage**:
  - Modern API
  - UK-focused
  - Good pricing for small businesses
  - Comprehensive coverage

### Payment Processing
**Stripe**
- **Use Cases**:
  - Subscription billing
  - Tiered pricing management
  - Invoice generation
- **Why Stripe**:
  - Industry standard
  - Excellent developer experience
  - Built-in tax handling
  - Strong UK support

### PDF Generation
**react-pdf or Puppeteer**
- **Use Cases**:
  - Tribunal documentation bundles
  - Compliance reports
  - Certificate summaries
- **Why react-pdf**:
  - React components as PDFs
  - Good for structured documents
- **Why Puppeteer** (alternative):
  - HTML to PDF
  - Better for complex layouts
  - Chromium-based rendering

---

## 🚀 Deployment & Infrastructure

### Hosting
**Vercel (Recommended)**
- **Why**:
  - Native Next.js support
  - Edge network globally
  - Automatic previews for PRs
  - Zero-config deployment
  - Built-in analytics
  - Generous free tier
- **Configuration**:
  - Primary region: London (ldn1)
  - Edge functions for API routes
  - ISR for council data pages

**Alternative: Railway or Fly.io**
- Use if need more control or custom containers

### Database Hosting
**Supabase (Recommended)**
- **Why**:
  - Managed PostgreSQL
  - Built-in auth (can use instead of NextAuth)
  - Real-time subscriptions
  - Auto-generated REST API
  - Row-level security
  - Generous free tier

**Alternative: Neon**
- Serverless PostgreSQL
- Instant branching (great for preview environments)
- Cheaper at scale

### CDN & Asset Delivery
**Vercel Edge Network + Cloudflare (optional)**
- Static assets served from edge
- Automatic image optimization
- Brotli compression

### Monitoring & Logging
**Sentry + Vercel Analytics**
- **Sentry**: Error tracking and performance monitoring
- **Vercel Analytics**: Web vitals, page performance
- **Logtail** (optional): Structured logging

### CI/CD
**GitHub Actions + Vercel**
- **Pipeline**:
  ```yaml
  1. Lint (ESLint + Prettier)
  2. Type check (TypeScript)
  3. Unit tests (Vitest)
  4. Integration tests (Playwright)
  5. Build check
  6. Deploy to preview (Vercel)
  7. E2E tests on preview
  8. Deploy to production (main branch)
  ```

---

## 🧪 Testing Strategy

### Unit Testing
**Vitest**
- Component tests
- Utility function tests
- API route logic tests
- **Why Vitest**: Fast, Vite-native, Jest-compatible API

### Integration Testing
**Playwright**
- User flow testing
- Multi-browser testing (Chromium, Firefox, Safari)
- Mobile responsive testing
- **Why Playwright**: Fast, reliable, great dev experience

### E2E Testing
**Playwright + test database**
- Critical paths:
  - User registration → property creation → certificate upload
  - Reminder generation and delivery
  - Compliance dashboard accuracy
  - Payment flow

### Test Coverage Goals
- Unit tests: 80%+ coverage
- Integration tests: All critical user flows
- E2E tests: Main conversion paths

---

## 📊 Database Design Principles

### Schema Design
- **Normalization**: 3NF for core entities
- **Denormalization**: Council data for performance
- **Soft deletes**: Keep audit trail
- **Timestamps**: All tables have createdAt/updatedAt
- **Indexes**: On foreign keys, date fields, search fields

### Data Integrity
- Foreign key constraints
- Check constraints for enums
- Unique constraints on registration numbers
- NOT NULL for required fields

### Backup Strategy
- **Frequency**: Daily automated backups
- **Retention**: 30 days point-in-time recovery
- **Testing**: Monthly restore testing
- **Export**: Weekly CSV exports to S3

---

## 🔒 Security Measures

### Application Security
- [x] HTTPS only (TLS 1.3)
- [x] HSTS headers
- [x] CSP headers
- [x] CSRF protection (NextAuth.js)
- [x] Rate limiting (Upstash Redis)
- [x] Input sanitization (Zod)
- [x] SQL injection prevention (Prisma)
- [x] XSS prevention (React escaping)

### Data Security
- [x] Encryption at rest (database level)
- [x] Encryption in transit (TLS)
- [x] Encrypted backups
- [x] Pre-signed URLs for file uploads (expire in 1 hour)
- [x] GDPR compliance (data export, deletion)

### Authentication Security
- [x] Bcrypt password hashing (cost factor 12)
- [x] Password requirements: 12+ chars, complexity
- [x] Rate limiting on login attempts
- [x] Account lockout after 5 failed attempts
- [x] Email verification required
- [x] Optional 2FA via SMS

---

## 📈 Performance Targets

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Application Performance
- **Time to Interactive**: < 3s on 4G
- **API Response Time**: < 500ms (p95)
- **Database Query Time**: < 100ms (p95)
- **Page Load Time**: < 2s

### Optimization Strategies
- Next.js Image optimization
- Code splitting by route
- Lazy loading for non-critical components
- Redis caching for council data
- Database query optimization (indexes)
- Edge caching for static content

---

## 💰 Cost Estimates (Monthly)

### Development & Testing
- **Vercel**: Free (Hobby tier during dev)
- **Supabase**: Free (during development)
- **Upstash Redis**: Free tier
- **Total**: £0/month

### Production (100 users)
- **Vercel Pro**: £20/month
- **Supabase Pro**: £25/month
- **Upstash Redis**: £10/month
- **AWS S3**: £5/month (50GB storage)
- **Resend Email**: £10/month (10k emails)
- **Twilio SMS**: £20/month (200 SMS)
- **Sentry**: £26/month
- **Stripe**: 1.5% + £0.20 per transaction
- **ComplyAdvantage**: £200/month (50 checks)
- **Total**: ~£320/month + variable costs

### Production (1000 users)
- Estimated: £800-1200/month

---

## 🎯 Technology Decision Summary

| Category | Technology | Reason |
|----------|-----------|---------|
| **Frontend Framework** | Next.js 14 | SSR, performance, monolithic |
| **Language** | TypeScript | Type safety, maintainability |
| **UI Library** | shadcn/ui + Tailwind | Accessibility, customization |
| **Database** | PostgreSQL (Supabase) | ACID, mature, serverless |
| **ORM** | Prisma | Type safety, migrations |
| **Auth** | NextAuth.js | Next.js native, flexible |
| **Email** | Resend | Modern API, React templates |
| **SMS** | Twilio | Reliable, UK support |
| **File Storage** | Cloudflare R2 | Cost-effective, no egress fees |
| **Caching** | Upstash Redis | Serverless, pay-per-use |
| **Payments** | Stripe | Industry standard |
| **Hosting** | Vercel | Next.js optimized, edge network |
| **Monitoring** | Sentry | Error tracking, performance |
| **Testing** | Vitest + Playwright | Fast, reliable, comprehensive |

---

## 🔄 Future Considerations

### Potential Additions (Post-Launch)
- **Mobile App**: React Native or Flutter
- **API for Third Parties**: Public API for integrations
- **White-Label Solution**: Custom branding for agencies
- **AI-Powered Features**:
  - Predictive compliance risk scoring
  - Automated council requirement parsing
  - Smart reminder optimization
- **Advanced Analytics**: Business intelligence dashboard

### Scalability Path
- **Current**: Monolithic Next.js app (good to 10k users)
- **Phase 2** (10k-100k users): 
  - Separate API backend (tRPC → GraphQL)
  - Database read replicas
  - Redis cluster
- **Phase 3** (100k+ users):
  - Microservices architecture
  - Message queue (RabbitMQ/Kafka)
  - Multi-region deployment

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Next Review**: After Phase 1 completion
