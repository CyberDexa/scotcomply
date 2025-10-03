# Best Practices Guide - ScotComply Development

## 📋 Overview

This document outlines the best practices implemented in the ScotComply application to ensure code quality, maintainability, and scalability.

---

## ✅ Completed Best Practices

### 1. **Database Setup** ✅
- ✅ Switched from Prisma Postgres to standard PostgreSQL
- ✅ Local PostgreSQL database (`scotcomply`) created
- ✅ Database schema pushed successfully
- ✅ Seeded with 32 Scottish councils and demo data

**Connection Details:**
```bash
Database: scotcomply
Host: localhost:5432
User: olaoluwabayomi
```

**Quick Commands:**
```bash
npm run db:push      # Sync schema
npm run db:seed      # Populate data
npm run db:studio    # GUI for database
```

### 2. **Missing UI Components** ✅
- ✅ Installed `Select` component from shadcn/ui
- ✅ Installed `Switch` component from shadcn/ui

Files created:
- `src/components/ui/select.tsx`
- `src/components/ui/switch.tsx`

### 3. **Environment Validation** ✅
- ✅ Created `src/lib/env.ts` with Zod validation
- ✅ Type-safe environment variable access
- ✅ Startup validation to catch configuration errors early

**Usage:**
```typescript
import { env } from '@/lib/env'

// Type-safe access
const dbUrl = env.DATABASE_URL
const appName = env.APP_NAME
```

### 4. **Docker Configuration** ✅
- ✅ Created `docker-compose.yml` for consistent dev environment
- Note: Using local PostgreSQL instead (port 5432 conflict)

---

## 🔄 In Progress Best Practices

### 5. **TypeScript Strict Mode Errors** 🔄

**Issue:** Implicit `any` types in map/filter callbacks across multiple files.

**Files to Fix:**
1. `src/app/dashboard/properties/page.tsx` (6 errors)
2. `src/app/dashboard/properties/[id]/page.tsx` (3 errors)
3. `src/app/dashboard/properties/[id]/edit/page.tsx` (7 errors)
4. `src/app/dashboard/certificates/page.tsx` (5 errors)
5. `src/server/routers/certificate.ts` (2 errors)

**Solution Pattern:**
```typescript
// ❌ Bad - Implicit any
certificates?.filter((cert) => ...)

// ✅ Good - Explicit type
certificates?.filter((cert: Certificate) => ...)

// ✅ Better - Inferred from Prisma types
import type { Certificate } from '@prisma/client'
certificates?.filter((cert: Certificate) => ...)
```

**Action Items:**
- [ ] Add Prisma type imports to all pages
- [ ] Explicitly type all callback parameters
- [ ] Create type aliases for common patterns

---

## 🎯 Recommended Best Practices

### 6. **Error Boundaries** (Planned)

Create React error boundaries to catch and handle errors gracefully:

```typescript
// src/components/error-boundary.tsx
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>
    }

    return this.props.children
  }
}
```

### 7. **API Error Handling**

```typescript
// Standardized error response
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Usage in tRPC router
.mutation(async ({ ctx, input }) => {
  try {
    // ... operation
  } catch (error) {
    throw new AppError('Failed to create property', 400, 'PROPERTY_CREATE_FAILED')
  }
})
```

### 8. **Logging Strategy**

```typescript
// src/lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
})

// Usage
logger.info({ userId, propertyId }, 'Property created')
logger.error({ error }, 'Database connection failed')
```

### 9. **Input Validation**

All API inputs should use Zod schemas:

```typescript
// src/lib/validations/property.ts
export const createPropertySchema = z.object({
  address: z.string().min(5, 'Address too short'),
  postcode: z.string().regex(/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i, 'Invalid postcode'),
  councilArea: z.string().min(1),
  propertyType: z.enum(['flat', 'house', 'bungalow', 'other']),
  bedrooms: z.number().int().min(0).max(50),
  isHMO: z.boolean().default(false),
  hmoOccupancy: z.number().int().min(3).optional(),
})

// Use in router
.input(createPropertySchema)
```

### 10. **Testing Strategy**

```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// Example test
import { describe, it, expect } from 'vitest'
import { createPropertySchema } from '@/lib/validations/property'

describe('Property Validation', () => {
  it('should validate correct property data', () => {
    const data = {
      address: '123 Main St',
      postcode: 'EH1 1AA',
      councilArea: 'City of Edinburgh Council',
      propertyType: 'flat',
      bedrooms: 2,
      isHMO: false,
    }
    expect(createPropertySchema.parse(data)).toEqual(data)
  })
})
```

### 11. **Performance Optimization**

```typescript
// Use React Query for caching
const { data } = trpc.property.list.useQuery(
  { limit: 50 },
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  }
)

// Use Next.js Image component
import Image from 'next/image'
<Image src="/logo.png" alt="Logo" width={200} height={50} />

// Use dynamic imports for heavy components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Spinner />,
})
```

### 12. **Security Best Practices**

```typescript
// Rate limiting (install express-rate-limit)
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}

// SQL injection protection (Prisma handles this)
// XSS protection (React escapes by default)
// CSRF protection (NextAuth handles this)
```

### 13. **Code Organization**

```
src/
├── app/                    # Next.js pages (App Router)
├── components/
│   ├── ui/                # Reusable UI components
│   ├── forms/             # Form components
│   └── layout/            # Layout components
├── lib/
│   ├── validations/       # Zod schemas
│   ├── utils/             # Helper functions
│   └── constants/         # Constants and configs
├── server/
│   ├── routers/           # tRPC routers
│   ├── services/          # Business logic
│   └── middleware/        # Auth, logging, etc.
└── types/                 # Shared TypeScript types
```

### 14. **Git Workflow**

```bash
# Feature branch workflow
git checkout -b feature/certificate-upload
git commit -m "feat: add certificate upload functionality"
git push origin feature/certificate-upload

# Commit message format
# feat: new feature
# fix: bug fix
# docs: documentation changes
# style: formatting changes
# refactor: code refactoring
# test: adding tests
# chore: maintenance tasks
```

### 15. **Documentation Standards**

```typescript
/**
 * Creates a new property for the authenticated user.
 *
 * @param input - Property creation data
 * @param input.address - Full property address
 * @param input.postcode - UK postcode format
 * @param input.councilArea - One of 32 Scottish councils
 * @returns Created property with generated ID
 * @throws {AppError} If user is not authenticated or validation fails
 *
 * @example
 * ```typescript
 * const property = await createProperty({
 *   address: "123 Main St, Edinburgh",
 *   postcode: "EH1 1AA",
 *   councilArea: "City of Edinburgh Council",
 *   propertyType: "flat",
 *   bedrooms: 2,
 * })
 * ```
 */
```

---

## 📊 Current Status

### ✅ Completed
- [x] Database setup and seeding
- [x] UI components installation
- [x] Environment validation
- [x] Docker configuration

### 🔄 In Progress
- [ ] TypeScript strict mode fixes (21 errors remaining)

### 📅 Planned
- [ ] Error boundaries
- [ ] Logging system
- [ ] Testing framework
- [ ] Performance monitoring
- [ ] Security hardening

---

## 🎯 Next Steps

1. **Fix TypeScript Errors** (Priority: High)
   - Add explicit types to all callbacks
   - Import Prisma types where needed
   - Enable strict mode checks in CI/CD

2. **Add Error Boundaries** (Priority: Medium)
   - Wrap main layout components
   - Add error reporting (Sentry?)
   - Create user-friendly error pages

3. **Set Up Testing** (Priority: Medium)
   - Install Vitest
   - Write unit tests for utilities
   - Add integration tests for API routes

4. **Performance Audit** (Priority: Low)
   - Run Lighthouse audit
   - Optimize bundle size
   - Add performance monitoring

---

## 📚 Resources

- [Next.js Best Practices](https://nextjs.org/docs/app/building-your-application/optimizing)
- [tRPC Best Practices](https://trpc.io/docs/server/best-practices)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

**Last Updated:** October 2, 2025
**Maintainer:** ScotComply Development Team
