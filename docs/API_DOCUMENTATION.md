# 📡 API Documentation

**ScotComply API Reference**  
**Version**: 1.0.0  
**Base URL**: `/api/trpc`  
**Protocol**: tRPC (Type-safe RPC)

---

## 🔐 Authentication

All API endpoints require authentication via NextAuth.js session.

### Login
```typescript
// Client-side
import { signIn } from 'next-auth/react'

await signIn('credentials', {
  email: 'user@example.com',
  password: 'password123',
  redirect: false
})
```

### Get Session
```typescript
import { useSession } from 'next-auth/react'

const { data: session } = useSession()
// session.user.id, session.user.email, session.user.role
```

---

## 📋 API Routers

### 1. Property Router (`property`)

#### `create`
Create a new property

**Input**:
```typescript
{
  address: string
  postcode: string
  councilArea: string
  propertyType: 'FLAT' | 'HOUSE' | 'BUNGALOW' | 'OTHER'
  bedrooms?: number
  isHMO: boolean
  hmoOccupancy?: number
  tenancyStatus?: 'vacant' | 'occupied' | 'notice_period'
}
```

**Output**:
```typescript
{
  id: string
  address: string
  // ... other fields
}
```

#### `getAll`
Get all properties for current user

**Output**:
```typescript
Property[]
```

#### `getById`
Get single property by ID

**Input**: `{ id: string }`  
**Output**: `Property`

#### `update`
Update property

**Input**:
```typescript
{
  id: string
  data: Partial<PropertyInput>
}
```

#### `delete`
Delete property

**Input**: `{ id: string }`

---

### 2. Certificate Router (`certificate`)

#### `create`
Upload a certificate

**Input**:
```typescript
{
  propertyId: string
  certificateType: 'EPC' | 'GAS_SAFETY' | 'ELECTRICAL' | 'EICR' | 'PAT' | 'FIRE_SAFETY' | 'LEGIONELLA'
  issueDate: Date
  expiryDate: Date
  certificateNumber?: string
  providerName: string
  providerContact?: string
  fileUrl: string
  fileName: string
  notes?: string
}
```

#### `getAll`
Get all certificates

**Input** (optional):
```typescript
{
  propertyId?: string
  type?: CertificateType
  status?: 'valid' | 'expiring' | 'expired'
}
```

#### `getExpiring`
Get expiring certificates

**Input**:
```typescript
{
  days: number (default: 30)
}
```

---

### 3. Dashboard Router (`dashboard`)

#### `getOverview`
Get dashboard overview

**Output**:
```typescript
{
  totalProperties: number
  totalCertificates: number
  validCertificates: number
  expiringCertificates: number
  totalRegistrations: number
  activeRegistrations: number
  totalHMO: number
  expiringHMO: number
  totalAssessments: number
  compliantAssessments: number
  totalMaintenance: number
  openMaintenance: number
  totalScreenings: number
  pendingScreenings: number
  totalAlerts: number
  criticalAlerts: number
  unreadNotifications: number
  complianceScore: number
}
```

#### `getUpcomingDeadlines`
Get upcoming deadlines

**Input**:
```typescript
{
  days: number (default: 30)
  limit: number (default: 10)
}
```

**Output**:
```typescript
Array<{
  id: string
  type: 'certificate' | 'registration' | 'hmo' | 'assessment'
  title: string
  date: Date
  propertyId: string
  propertyAddress: string
  urgency: 'overdue' | 'critical' | 'warning' | 'normal'
}>
```

#### `getRecentActivity`
Get recent activity

**Input**:
```typescript
{
  limit: number (default: 10)
}
```

#### `getCriticalIssues`
Get critical issues requiring attention

**Output**:
```typescript
{
  expiredCertificates: Certificate[]
  pendingAML: AMLScreening[]
  criticalMaintenance: MaintenanceRequest[]
  nonCompliantAssessments: Assessment[]
  criticalAlerts: Alert[]
}
```

#### `getPortfolioSummary`
Get portfolio summary

**Output**:
```typescript
{
  totalValue: number
  propertyTypes: Record<string, number>
  councilAreas: Record<string, number>
  certificateTypes: Record<string, number>
}
```

---

### 4. Search Router (`search`)

#### `globalSearch`
Search across all entities

**Input**:
```typescript
{
  query: string
  entityTypes?: Array<'PROPERTY' | 'CERTIFICATE' | 'REGISTRATION' | 'MAINTENANCE' | 'HMO'>
  limit?: number (default: 20)
}
```

**Output**:
```typescript
{
  results: Array<{
    id: string
    type: EntityType
    title: string
    subtitle?: string
    status?: string
    badge?: string
    date?: Date
    url: string
    relevance?: number
  }>
  total: number
}
```

---

### 5. Analytics Router (`analytics`)

#### `getPortfolioStats`
Overall portfolio statistics

**Output**:
```typescript
{
  properties: { total: number }
  certificates: { total: number, valid: number }
  registrations: { total: number, active: number }
  maintenance: { total: number, open: number }
  assessments: { total: number, compliant: number }
  alerts: { total: number, critical: number }
  overallCompliance: number
}
```

#### `getComplianceTrends`
Compliance trends over time

**Output**:
```typescript
Array<{
  month: string
  score: number
  certificates: number
  registrations: number
  assessments: number
}>
```

#### `getCostSummary`
Cost analysis

**Output**:
```typescript
{
  totalCost: number
  byCategory: Record<string, number>
  byMonth: Array<{ month: string, cost: number }>
}
```

#### `getExpiryTimeline`
Certificate expiry timeline

**Output**:
```typescript
Array<{
  month: string
  expiringCount: number
  types: Record<CertificateType, number>
}>
```

#### `getRiskAssessment`
Risk assessment

**Output**:
```typescript
{
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  factors: Array<{
    category: string
    level: string
    description: string
  }>
}
```

#### `getCertificateBreakdown`
Certificate type breakdown

**Output**:
```typescript
Record<CertificateType, {
  total: number
  valid: number
  expiring: number
  expired: number
}>
```

---

### 6. Bulk Router (`bulk`)

#### `parseCSV`
Parse and validate CSV

**Input**:
```typescript
{
  csvContent: string
  entityType: 'properties' | 'certificates' | 'registrations'
}
```

**Output**:
```typescript
{
  valid: any[]
  errors: Array<{
    row: number
    field: string
    message: string
  }>
}
```

#### `importProperties`
Bulk import properties

**Input**:
```typescript
{
  properties: PropertyImportData[]
}
```

**Output**:
```typescript
{
  jobId: string
  totalRows: number
  status: 'PENDING'
}
```

#### `exportProperties`
Export properties to CSV

**Output**:
```typescript
{
  csv: string
  count: number
}
```

---

### 7. Notification Router (`notification`)

#### `getUnreadCount`
Get unread notification count

**Output**: `{ count: number }`

#### `getRecent`
Get recent notifications

**Input**:
```typescript
{
  limit: number (default: 10)
}
```

#### `markAsRead`
Mark notification as read

**Input**: `{ notificationId: string }`

#### `markAllAsRead`
Mark all notifications as read

---

### 8. AML Screening Router (`aml`)

#### `create`
Create AML screening

**Input**:
```typescript
{
  subjectName: string
  subjectType: 'INDIVIDUAL' | 'COMPANY'
  dateOfBirth?: Date
  companyNumber?: string
  address?: string
  checkType: 'IDENTITY' | 'SANCTIONS' | 'PEP' | 'FULL'
}
```

#### `getAll`
Get all screenings

#### `getById`
Get screening by ID

**Input**: `{ id: string }`

#### `updateStatus`
Update screening status

**Input**:
```typescript
{
  id: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'REQUIRES_REVIEW'
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  findings?: string
}
```

---

### 9. Council Intelligence Router (`council`)

#### `getAll`
Get all councils

#### `getById`
Get council details

**Input**: `{ id: string }`

#### `getAlerts`
Get council alerts

**Input**:
```typescript
{
  councilId?: string
  severity?: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status?: 'ACTIVE' | 'RESOLVED'
}
```

#### `acknowledgeAlert`
Acknowledge alert

**Input**:
```typescript
{
  alertId: string
  notes?: string
}
```

#### `compareCouncils`
Compare multiple councils

**Input**:
```typescript
{
  councilIds: string[]
  metrics: Array<'fees' | 'requirements' | 'processing_times'>
}
```

---

## 🔧 Usage Examples

### Client-Side (React)

```typescript
'use client'
import { trpc } from '@/lib/trpc-client'

export function PropertyList() {
  const { data: properties, isLoading } = trpc.property.getAll.useQuery()
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <ul>
      {properties?.map(property => (
        <li key={property.id}>{property.address}</li>
      ))}
    </ul>
  )
}
```

### Mutations

```typescript
const createProperty = trpc.property.create.useMutation({
  onSuccess: () => {
    // Refetch properties list
    utils.property.getAll.invalidate()
  }
})

const handleSubmit = (data: PropertyInput) => {
  createProperty.mutate(data)
}
```

### Server-Side

```typescript
import { createCaller } from '@/server'
import { getServerSession } from 'next-auth'

export async function GET() {
  const session = await getServerSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  const caller = await createCaller(session)
  const properties = await caller.property.getAll()
  
  return Response.json(properties)
}
```

---

## 📊 Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🚀 Rate Limiting

Currently no rate limiting implemented. For production:

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for')
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return new Response('Too Many Requests', { status: 429 })
  }
}
```

---

## 🔐 Security Best Practices

1. **Always validate input** - Use Zod schemas
2. **Check ownership** - Verify user owns the resource
3. **Use transactions** - For multi-step operations
4. **Sanitize output** - Remove sensitive fields
5. **Log errors** - But never log sensitive data

---

## 📚 Additional Resources

- [tRPC Documentation](https://trpc.io)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [NextAuth.js](https://next-auth.js.org)

---

**Last Updated**: October 3, 2025  
**API Version**: 1.0.0
