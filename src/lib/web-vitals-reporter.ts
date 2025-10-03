/**
 * Web Vitals Reporter
 * 
 * Reports Core Web Vitals metrics for monitoring
 * Usage: Import and call reportWebVitals() in _app.tsx
 */

import type { Metric } from 'web-vitals'
import { CORE_WEB_VITALS_THRESHOLDS, evaluateMetric } from './performance-config'

export type WebVitalsMetric = {
  id: string
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  navigationType: string
}

/**
 * Send metric to analytics endpoint
 */
function sendToAnalytics(metric: WebVitalsMetric) {
  // In production, send to your analytics service
  // Examples: Google Analytics, Vercel Analytics, custom endpoint
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric)
  }

  // Example: Send to custom endpoint
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const body = JSON.stringify(metric)
    const url = '/api/analytics/web-vitals'
    
    // Use sendBeacon for reliability (survives page unload)
    navigator.sendBeacon(url, body)
  }
}

/**
 * Report Web Vitals metrics
 * 
 * Import in _app.tsx:
 * ```tsx
 * import { reportWebVitals } from '@/lib/web-vitals-reporter'
 * 
 * export function reportWebVitals(metric: NextWebVitalsMetric) {
 *   reportWebVitals(metric)
 * }
 * ```
 */
export function reportWebVitals(metric: Metric) {
  const { name, value, id, delta, navigationType } = metric
  
  // Determine rating based on thresholds
  let rating: 'good' | 'needs-improvement' | 'poor' = 'good'
  
  if (name in CORE_WEB_VITALS_THRESHOLDS) {
    rating = evaluateMetric(name as keyof typeof CORE_WEB_VITALS_THRESHOLDS, value)
  }

  const webVitalsMetric: WebVitalsMetric = {
    id,
    name,
    value: Math.round(name === 'CLS' ? value * 1000 : value), // CLS scaled
    rating,
    delta: Math.round(delta),
    navigationType,
  }

  sendToAnalytics(webVitalsMetric)
}

/**
 * Log performance marks and measures
 */
export function logPerformanceMarks() {
  if (typeof window === 'undefined' || !window.performance) {
    return
  }

  const entries = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  
  if (entries.length > 0) {
    const navigation = entries[0]
    
    console.log('[Performance] Navigation Timing:', {
      'DNS Lookup': `${(navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2)}ms`,
      'TCP Connection': `${(navigation.connectEnd - navigation.connectStart).toFixed(2)}ms`,
      'Request Time': `${(navigation.responseStart - navigation.requestStart).toFixed(2)}ms`,
      'Response Time': `${(navigation.responseEnd - navigation.responseStart).toFixed(2)}ms`,
      'DOM Processing': `${(navigation.domComplete - navigation.domInteractive).toFixed(2)}ms`,
      'Load Complete': `${(navigation.loadEventEnd - navigation.loadEventStart).toFixed(2)}ms`,
      'Total Time': `${(navigation.loadEventEnd - navigation.fetchStart).toFixed(2)}ms`,
    })
  }
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics() {
  if (typeof window === 'undefined' || !window.performance) {
    return null
  }

  const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  const paint = window.performance.getEntriesByType('paint')

  return {
    navigation: {
      dnsLookup: navigation?.domainLookupEnd - navigation?.domainLookupStart,
      tcpConnection: navigation?.connectEnd - navigation?.connectStart,
      requestTime: navigation?.responseStart - navigation?.requestStart,
      responseTime: navigation?.responseEnd - navigation?.responseStart,
      domProcessing: navigation?.domComplete - navigation?.domInteractive,
      loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
    },
    paint: {
      firstPaint: paint.find((entry) => entry.name === 'first-paint')?.startTime,
      firstContentfulPaint: paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime,
    },
  }
}
