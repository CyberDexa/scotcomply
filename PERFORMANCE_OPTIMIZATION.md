# 🚀 Performance Optimization Guide

**Date**: October 3, 2025  
**Platform**: ScotComply - Scottish Landlord Compliance Platform

---

## 📊 Current Performance Baseline

### Build Analysis
```
✅ Build: Successful (10.5s)
✅ Routes: 48 pages
✅ First Load JS: 102 KB (shared)
⚠️ Largest Page: 974 KB (repairing-standard assessment form)
```

### Optimization Targets
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| First Contentful Paint | TBD | <1.8s | 🔄 |
| Largest Contentful Paint | TBD | <2.5s | 🔄 |
| Time to Interactive | TBD | <3.8s | 🔄 |
| Cumulative Layout Shift | TBD | <0.1 | 🔄 |
| Total Blocking Time | TBD | <300ms | 🔄 |

---

## 🎯 Optimization Strategies

### 1. Code Splitting & Lazy Loading

#### Heavy Components to Lazy Load
- ✅ PDF renderer (`@react-pdf/renderer`)
- ✅ Chart.js components
- ✅ CSV parser
- ✅ Image upload components
- ✅ Rich text editors (if any)

#### Implementation
```typescript
// Example: Lazy load PDF component
const PDFViewer = dynamic(() => import('./PDFViewer'), {
  ssr: false,
  loading: () => <div>Loading PDF viewer...</div>
})

// Example: Lazy load chart
const ComplianceChart = dynamic(() => import('./ComplianceChart'), {
  loading: () => <Skeleton className="h-[300px]" />
})
```

---

### 2. Image Optimization

#### Current State
- Using `next/image` component
- Formats: AVIF, WebP
- Domains configured

#### Improvements Needed
```typescript
// Add priority for above-fold images
<Image 
  src="/hero.jpg" 
  priority 
  quality={85}
  placeholder="blur"
/>

// Use responsive images
<Image 
  src="/property.jpg"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

---

### 3. Bundle Size Optimization

#### Strategy
- ✅ Implemented code splitting in webpack config
- ✅ Vendor chunking for node_modules
- ✅ Common chunk for shared code
- 🔄 Tree-shaking unused code
- 🔄 Dynamic imports for route-specific code

#### Analysis Commands
```bash
# Analyze bundle
npm run analyze

# Check bundle size
npm run build | grep "First Load JS"
```

---

### 4. Database Query Optimization

#### Current Optimizations
```typescript
// Use select to limit fields
const properties = await prisma.property.findMany({
  select: {
    id: true,
    address: true,
    // Only select needed fields
  }
})

// Use pagination
const properties = await prisma.property.findMany({
  take: 20,
  skip: (page - 1) * 20
})

// Use indexes (check schema)
@@index([userId, createdAt])
```

#### Needed Optimizations
- 🔄 Add database indexes for frequently queried fields
- 🔄 Use connection pooling
- 🔄 Implement query result caching
- 🔄 Optimize N+1 queries with `include`

---

### 5. API Route Optimization

#### tRPC Optimizations
```typescript
// Use batching
const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: '/api/trpc',
          maxURLLength: 2083,
        }),
      ],
    }
  },
})

// Add caching
const { data } = trpc.property.getAll.useQuery(
  undefined,
  { 
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  }
)
```

---

### 6. Font Optimization

#### Current Implementation
```typescript
// next/font for optimal font loading
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Prevent FOIT
  preload: true,
})
```

#### Status
- ✅ Using next/font
- ✅ Font display swap
- ✅ Subset loading

---

### 7. Third-Party Script Optimization

#### Strategy Component
```typescript
import Script from 'next/script'

// Load analytics with optimal strategy
<Script 
  src="https://analytics.com/script.js" 
  strategy="afterInteractive"
/>

// Load non-critical scripts lazily
<Script 
  src="https://widget.com/script.js" 
  strategy="lazyOnload"
/>
```

---

### 8. React Performance Patterns

#### Memoization
```typescript
// Use React.memo for expensive components
const PropertyCard = React.memo(({ property }) => {
  // Component code
})

// Use useMemo for expensive calculations
const sortedProperties = useMemo(
  () => properties.sort((a, b) => a.name.localeCompare(b.name)),
  [properties]
)

// Use useCallback for function props
const handleClick = useCallback(() => {
  // Handler code
}, [dependencies])
```

---

### 9. Suspense Boundaries

#### Implementation
```typescript
// Wrap async components with Suspense
<Suspense fallback={<LoadingSkeleton />}>
  <AsyncComponent />
</Suspense>

// Nested boundaries for granular loading
<Suspense fallback={<PageLoader />}>
  <Header />
  <Suspense fallback={<ContentLoader />}>
    <Content />
  </Suspense>
  <Footer />
</Suspense>
```

---

### 10. Caching Strategy

#### Service Worker Cache
```javascript
// Already implemented in public/sw.js
- Static assets: cache-first
- API calls: network-first
- Pages: cache-first with network fallback
```

#### tRPC Cache
```typescript
// Query invalidation
await utils.property.getAll.invalidate()

// Optimistic updates
await utils.property.create.setData(id, newProperty)
```

---

## 🛠️ Implementation Checklist

### Phase 1: Quick Wins (Day 24)
- [x] Configure bundle analyzer
- [x] Set up ESLint
- [x] Set up Prettier
- [ ] Add lazy loading for PDF components
- [ ] Add lazy loading for charts
- [ ] Optimize images with priority/blur
- [ ] Run bundle analysis
- [ ] Identify largest bundles

### Phase 2: Component Optimization (Day 25)
- [ ] Wrap expensive components with React.memo
- [ ] Add Suspense boundaries
- [ ] Implement loading skeletons
- [ ] Optimize re-renders with useCallback
- [ ] Add useMemo for calculations

### Phase 3: Data Optimization (Day 26)
- [ ] Review database queries
- [ ] Add missing indexes
- [ ] Implement pagination everywhere
- [ ] Optimize tRPC queries
- [ ] Add query caching
- [ ] Test performance improvements

---

## 📈 Monitoring

### Tools
- Lighthouse CI (automated)
- Vercel Analytics (deployment)
- Chrome DevTools Performance tab
- React DevTools Profiler
- Bundle analyzer

### Metrics to Track
1. Core Web Vitals
   - LCP, FID, CLS, FCP, TTI, TBT

2. Bundle Size
   - First Load JS
   - Largest page bundles
   - Chunk sizes

3. API Performance
   - Response times
   - Query counts
   - N+1 queries

---

## 🎯 Success Criteria

✅ **Performance**
- Lighthouse Performance: 90+
- LCP: <2.5s
- FID: <100ms
- CLS: <0.1

✅ **Bundle**
- First Load JS: <100 KB
- No single page >1 MB

✅ **Database**
- Query time: <100ms average
- No N+1 queries
- All indexes in place

---

## 📝 Next Steps

1. Run `npm run analyze` to see current bundle
2. Implement lazy loading for heavy components
3. Add Suspense boundaries
4. Run Lighthouse audit
5. Iterate based on results

---

**Status**: 🚀 Ready to optimize!
