/**
 * Core Web Vitals Configuration
 * 
 * Defines performance thresholds based on Google's Core Web Vitals
 * https://web.dev/vitals/
 */

export const CORE_WEB_VITALS_THRESHOLDS = {
  // Largest Contentful Paint (LCP)
  // Measures loading performance
  LCP: {
    good: 2500,      // ≤ 2.5s
    needsImprovement: 4000,  // 2.5s - 4s
    poor: 4001,      // > 4s
  },

  // First Input Delay (FID)
  // Measures interactivity
  FID: {
    good: 100,       // ≤ 100ms
    needsImprovement: 300,   // 100ms - 300ms
    poor: 301,       // > 300ms
  },

  // Cumulative Layout Shift (CLS)
  // Measures visual stability
  CLS: {
    good: 0.1,       // ≤ 0.1
    needsImprovement: 0.25,  // 0.1 - 0.25
    poor: 0.26,      // > 0.25
  },

  // First Contentful Paint (FCP)
  // Measures perceived loading speed
  FCP: {
    good: 1800,      // ≤ 1.8s
    needsImprovement: 3000,  // 1.8s - 3s
    poor: 3001,      // > 3s
  },

  // Time to Interactive (TTI)
  // Measures time until page is fully interactive
  TTI: {
    good: 3800,      // ≤ 3.8s
    needsImprovement: 7300,  // 3.8s - 7.3s
    poor: 7301,      // > 7.3s
  },

  // Total Blocking Time (TBT)
  // Measures main thread blocking
  TBT: {
    good: 200,       // ≤ 200ms
    needsImprovement: 600,   // 200ms - 600ms
    poor: 601,       // > 600ms
  },

  // Speed Index
  // Measures how quickly content is visually displayed
  SPEED_INDEX: {
    good: 3400,      // ≤ 3.4s
    needsImprovement: 5800,  // 3.4s - 5.8s
    poor: 5801,      // > 5.8s
  },
}

export const RESOURCE_BUDGETS = {
  // JavaScript
  javascript: {
    total: 500 * 1024,        // 500 KB total
    mainBundle: 250 * 1024,   // 250 KB main bundle
    perChunk: 100 * 1024,     // 100 KB per chunk
  },

  // CSS
  css: {
    total: 100 * 1024,        // 100 KB total
    perFile: 50 * 1024,       // 50 KB per file
  },

  // Images
  images: {
    total: 300 * 1024,        // 300 KB total
    perImage: 100 * 1024,     // 100 KB per image
  },

  // Fonts
  fonts: {
    total: 100 * 1024,        // 100 KB total
    perFont: 30 * 1024,       // 30 KB per font
  },

  // Overall page weight
  pageWeight: {
    total: 1500 * 1024,       // 1.5 MB total
    firstLoad: 1000 * 1024,   // 1 MB first load
  },
}

export const PERFORMANCE_TARGETS = {
  lighthouse: {
    performance: 80,      // Minimum score of 80
    accessibility: 90,    // Minimum score of 90
    bestPractices: 90,    // Minimum score of 90
    seo: 90,              // Minimum score of 90
  },

  // Request counts
  requests: {
    total: 50,            // Max 50 requests
    javascript: 15,       // Max 15 JS files
    css: 5,               // Max 5 CSS files
    images: 20,           // Max 20 images
    fonts: 5,             // Max 5 fonts
    thirdParty: 10,       // Max 10 third-party requests
  },
}

/**
 * Evaluate a metric against thresholds
 */
export function evaluateMetric(
  metric: keyof typeof CORE_WEB_VITALS_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = CORE_WEB_VITALS_THRESHOLDS[metric]
  
  if (value <= thresholds.good) {
    return 'good'
  } else if (value <= thresholds.needsImprovement) {
    return 'needs-improvement'
  } else {
    return 'poor'
  }
}

/**
 * Format metric value for display
 */
export function formatMetricValue(
  metric: keyof typeof CORE_WEB_VITALS_THRESHOLDS,
  value: number
): string {
  // CLS is dimensionless
  if (metric === 'CLS') {
    return value.toFixed(3)
  }
  
  // Everything else is in milliseconds
  if (value < 1000) {
    return `${Math.round(value)}ms`
  }
  
  return `${(value / 1000).toFixed(2)}s`
}

/**
 * Get color for metric rating
 */
export function getMetricColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  const colors = {
    good: '#0cce6b',
    'needs-improvement': '#ffa400',
    poor: '#ff4e42',
  }
  return colors[rating]
}
