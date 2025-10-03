# Performance Testing Guide

This guide covers performance testing for the ScotComply platform using Lighthouse CI, Core Web Vitals monitoring, and bundle analysis.

## 📊 Overview

### Tools Used
- **Lighthouse CI**: Automated performance audits
- **Web Vitals**: Core Web Vitals monitoring
- **Webpack Bundle Analyzer**: Bundle size analysis
- **Next.js Built-in Analytics**: Performance insights

### Performance Targets

#### Core Web Vitals (Google Standards)
- **LCP (Largest Contentful Paint)**: ≤ 2.5s (good)
- **FID (First Input Delay)**: ≤ 100ms (good)
- **CLS (Cumulative Layout Shift)**: ≤ 0.1 (good)

#### Lighthouse Scores
- **Performance**: ≥ 80
- **Accessibility**: ≥ 90
- **Best Practices**: ≥ 90
- **SEO**: ≥ 90

#### Resource Budgets
- **JavaScript**: ≤ 500 KB total
- **CSS**: ≤ 100 KB total
- **Images**: ≤ 300 KB total
- **Fonts**: ≤ 100 KB total
- **Total Page Weight**: ≤ 1.5 MB

---

## 🚀 Quick Start

### 1. Build for Production
```bash
npm run build
```

### 2. Run Lighthouse CI
```bash
npm run perf:lighthouse
```

### 3. Analyze Bundle
```bash
npm run perf:analyze
```

### 4. Run All Performance Tests
```bash
npm run perf:all
```

---

## 📈 Lighthouse CI

### Configuration
Lighthouse CI is configured in `lighthouserc.js`:

```javascript
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/properties',
        'http://localhost:3000/certificates',
        'http://localhost:3000/tenants',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // ... more assertions
      },
    },
  },
}
```

### Running Lighthouse

#### Local Testing
```bash
# Build production version
npm run build

# Run Lighthouse CI
npm run perf:lighthouse
```

#### CI/CD Pipeline
Lighthouse runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

Results are:
- Uploaded as artifacts
- Posted as PR comments
- Stored in temporary public storage

### Interpreting Results

#### Scores
- **90-100**: Green (Excellent)
- **50-89**: Orange (Needs Improvement)
- **0-49**: Red (Poor)

#### Key Metrics
1. **Performance Score**
   - Weighted average of metrics
   - Focus on LCP, TBT, CLS

2. **Accessibility Score**
   - ARIA usage
   - Color contrast
   - Keyboard navigation

3. **Best Practices Score**
   - HTTPS usage
   - Console errors
   - Deprecated APIs

4. **SEO Score**
   - Meta tags
   - Mobile-friendliness
   - Structured data

---

## 🎯 Core Web Vitals

### What Are Core Web Vitals?

1. **LCP (Largest Contentful Paint)**
   - Measures loading performance
   - Target: ≤ 2.5s
   - Affects: User-perceived load speed

2. **FID (First Input Delay)**
   - Measures interactivity
   - Target: ≤ 100ms
   - Affects: Responsiveness to user input

3. **CLS (Cumulative Layout Shift)**
   - Measures visual stability
   - Target: ≤ 0.1
   - Affects: Unexpected layout shifts

### Monitoring Web Vitals

#### Client-Side Reporting
Web Vitals are automatically reported in production using the `web-vitals` library.

Configuration in `src/lib/web-vitals-reporter.ts`:
```typescript
import { reportWebVitals } from '@/lib/web-vitals-reporter'

// Metrics are sent to /api/analytics/web-vitals
```

#### Viewing Metrics

1. **In Development**
   - Open browser console
   - Look for `[Web Vitals]` logs

2. **In Production**
   - Metrics sent to analytics endpoint
   - Can integrate with Google Analytics, Vercel Analytics, etc.

---

## 📦 Bundle Analysis

### Running Bundle Analyzer

```bash
npm run perf:analyze
```

This will:
1. Build the production bundle with `ANALYZE=true`
2. Open interactive bundle visualization
3. Show chunk sizes and dependencies

### Analyzing Results

#### What to Look For
- Large dependencies (> 100 KB)
- Duplicate packages
- Unused exports
- Code splitting opportunities

#### Common Issues

1. **Large Bundle Size**
   - Solution: Code splitting, lazy loading
   - Use dynamic imports: `const Component = dynamic(() => import('./Component'))`

2. **Duplicate Dependencies**
   - Solution: Check package-lock.json for version conflicts
   - Use `npm dedupe`

3. **Unused Code**
   - Solution: Enable tree-shaking
   - Use ES modules instead of CommonJS

### Bundle Size Targets

```javascript
{
  "script": "≤ 500 KB",
  "stylesheet": "≤ 100 KB",
  "image": "≤ 300 KB",
  "font": "≤ 100 KB",
  "total": "≤ 1.5 MB"
}
```

---

## 🔧 Performance Optimization

### 1. Image Optimization

```tsx
import Image from 'next/image'

// Use Next.js Image component
<Image
  src="/certificate.jpg"
  width={800}
  height={600}
  alt="Certificate"
  loading="lazy"
  quality={75}
/>
```

### 2. Code Splitting

```tsx
import dynamic from 'next/dynamic'

// Lazy load heavy components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Spinner />,
  ssr: false,
})
```

### 3. Font Optimization

```tsx
// In _app.tsx or layout
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})
```

### 4. Reduce JavaScript Execution

- Use `useMemo` and `useCallback` appropriately
- Avoid large third-party libraries
- Use Web Workers for heavy computations

### 5. Optimize CSS

- Use Tailwind's purge feature
- Minimize custom CSS
- Use CSS modules for component styles

---

## 📊 Performance Budget

Performance budgets are defined in `performance-budget.json`:

```json
{
  "path": "/*",
  "timings": [
    { "metric": "first-contentful-paint", "budget": 2000 },
    { "metric": "largest-contentful-paint", "budget": 2500 },
    { "metric": "cumulative-layout-shift", "budget": 0.1 }
  ],
  "resourceSizes": [
    { "resourceType": "script", "budget": 500 },
    { "resourceType": "stylesheet", "budget": 100 }
  ]
}
```

### Enforcing Budgets

Budgets are enforced in:
1. Lighthouse CI assertions
2. GitHub Actions workflow
3. Pre-commit hooks (optional)

---

## 🐛 Troubleshooting

### Lighthouse Fails to Start Server

**Problem**: Server doesn't start before Lighthouse runs

**Solution**: Ensure production build exists
```bash
npm run build
npm run start # Verify it works
npm run perf:lighthouse
```

### Poor Performance Scores

**Common Causes**:
1. **Unoptimized images**: Use Next.js Image component
2. **Large JavaScript bundles**: Enable code splitting
3. **Render-blocking resources**: Defer non-critical CSS/JS
4. **No caching**: Implement proper cache headers

### High CLS (Layout Shift)

**Common Causes**:
1. Images without dimensions
2. Ads or embeds
3. Dynamically injected content

**Solutions**:
- Always specify image dimensions
- Reserve space for dynamic content
- Use `aspect-ratio` CSS property

---

## 📋 Checklist

### Before Deployment

- [ ] Run `npm run perf:lighthouse` and achieve target scores
- [ ] Run `npm run perf:analyze` and verify bundle sizes
- [ ] Check Core Web Vitals in development
- [ ] Verify all images are optimized
- [ ] Ensure code splitting is implemented
- [ ] Test on slow network (Lighthouse throttling)
- [ ] Verify accessibility score ≥ 90

### After Deployment

- [ ] Monitor real-user Core Web Vitals
- [ ] Set up performance alerts
- [ ] Track performance trends over time
- [ ] Run lighthouse monthly for regression detection

---

## 🔗 Resources

- [Web Vitals Documentation](https://web.dev/vitals/)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

---

## 📞 Support

For performance-related questions:
1. Check this documentation
2. Review Lighthouse reports
3. Analyze bundle size
4. Consult Next.js performance docs
