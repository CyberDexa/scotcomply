#!/usr/bin/env node

/**
 * Performance Testing Script
 * 
 * Runs basic performance checks on the built application
 */

const fs = require('fs')
const path = require('path')

const THRESHOLDS = {
  totalBundleSize: 1.5 * 1024 * 1024, // 1.5 MB
  jsSize: 500 * 1024, // 500 KB
  cssSize: 100 * 1024, // 100 KB
  maxChunkSize: 250 * 1024, // 250 KB
}

console.log('🔍 Running Performance Checks...\n')

// Check if .next directory exists
const nextDir = path.join(process.cwd(), '.next')
if (!fs.existsSync(nextDir)) {
  console.error('❌ .next directory not found. Run `npm run build` first.')
  process.exit(1)
}

// Read build manifest
const buildManifestPath = path.join(nextDir, 'build-manifest.json')
if (!fs.existsSync(buildManifestPath)) {
  console.error('❌ build-manifest.json not found')
  process.exit(1)
}

console.log('✅ Production build found\n')

// Analyze static directory
const staticDir = path.join(nextDir, 'static')
if (fs.existsSync(staticDir)) {
  const chunks = fs.readdirSync(path.join(staticDir, 'chunks'), { recursive: true })
  const css = fs.readdirSync(path.join(staticDir, 'css'), { recursive: true })

  let totalJsSize = 0
  let totalCssSize = 0
  let largestChunk = { name: '', size: 0 }

  // Calculate JS size
  chunks.forEach((file) => {
    if (file.endsWith('.js')) {
      const filePath = path.join(staticDir, 'chunks', file)
      const stats = fs.statSync(filePath)
      totalJsSize += stats.size

      if (stats.size > largestChunk.size) {
        largestChunk = { name: file, size: stats.size }
      }
    }
  })

  // Calculate CSS size
  css.forEach((file) => {
    if (file.endsWith('.css')) {
      const filePath = path.join(staticDir, 'css', file)
      const stats = fs.statSync(filePath)
      totalCssSize += stats.size
    }
  })

  // Report results
  console.log('📊 Bundle Analysis:')
  console.log('─────────────────────────────────────────')
  
  // JavaScript
  const jsStatus = totalJsSize <= THRESHOLDS.jsSize ? '✅' : '⚠️'
  console.log(`${jsStatus} JavaScript: ${formatBytes(totalJsSize)} / ${formatBytes(THRESHOLDS.jsSize)}`)
  
  // CSS
  const cssStatus = totalCssSize <= THRESHOLDS.cssSize ? '✅' : '⚠️'
  console.log(`${cssStatus} CSS: ${formatBytes(totalCssSize)} / ${formatBytes(THRESHOLDS.cssSize)}`)
  
  // Total
  const totalSize = totalJsSize + totalCssSize
  const totalStatus = totalSize <= THRESHOLDS.totalBundleSize ? '✅' : '⚠️'
  console.log(`${totalStatus} Total: ${formatBytes(totalSize)} / ${formatBytes(THRESHOLDS.totalBundleSize)}`)
  
  // Largest chunk
  const chunkStatus = largestChunk.size <= THRESHOLDS.maxChunkSize ? '✅' : '⚠️'
  console.log(`${chunkStatus} Largest chunk: ${formatBytes(largestChunk.size)} (${largestChunk.name})`)
  
  console.log('─────────────────────────────────────────\n')

  // Summary
  const allPassed = 
    totalJsSize <= THRESHOLDS.jsSize &&
    totalCssSize <= THRESHOLDS.cssSize &&
    totalSize <= THRESHOLDS.totalBundleSize &&
    largestChunk.size <= THRESHOLDS.maxChunkSize

  if (allPassed) {
    console.log('✅ All performance budgets met!\n')
  } else {
    console.log('⚠️  Some performance budgets exceeded\n')
    console.log('💡 Recommendations:')
    if (totalJsSize > THRESHOLDS.jsSize) {
      console.log('  - Reduce JavaScript bundle size with code splitting')
      console.log('  - Use dynamic imports for large components')
      console.log('  - Remove unused dependencies')
    }
    if (totalCssSize > THRESHOLDS.cssSize) {
      console.log('  - Optimize CSS with Tailwind purge')
      console.log('  - Remove unused styles')
    }
    if (largestChunk.size > THRESHOLDS.maxChunkSize) {
      console.log('  - Split large chunks into smaller pieces')
      console.log('  - Use route-based code splitting')
    }
    console.log('')
  }

  process.exit(allPassed ? 0 : 1)
} else {
  console.error('❌ Static directory not found')
  process.exit(1)
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
