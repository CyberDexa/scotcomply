/**
 * Utility for displaying council data freshness
 */

export interface DataFreshnessInfo {
  text: string
  color: 'green' | 'yellow' | 'red' | 'gray'
  daysAgo: number | null
}

/**
 * Calculate how fresh the council data is based on lastScraped timestamp
 */
export function getDataFreshness(lastScraped: Date | null): DataFreshnessInfo {
  if (!lastScraped) {
    return {
      text: 'Never verified',
      color: 'gray',
      daysAgo: null,
    }
  }

  const now = new Date()
  const scrapedDate = new Date(lastScraped)
  const diffMs = now.getTime() - scrapedDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  let text: string
  let color: 'green' | 'yellow' | 'red' | 'gray'

  if (diffHours < 1) {
    text = 'Just now'
    color = 'green'
  } else if (diffHours < 24) {
    text = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    color = 'green'
  } else if (diffDays === 1) {
    text = 'Yesterday'
    color = 'green'
  } else if (diffDays < 7) {
    text = `${diffDays} days ago`
    color = 'green'
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    text = `${weeks} week${weeks === 1 ? '' : 's'} ago`
    color = 'yellow'
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    text = `${months} month${months === 1 ? '' : 's'} ago`
    color = 'red'
  } else {
    const years = Math.floor(diffDays / 365)
    text = `${years} year${years === 1 ? '' : 's'} ago`
    color = 'red'
  }

  return {
    text,
    color,
    daysAgo: diffDays,
  }
}

/**
 * Get Tailwind CSS classes for the freshness badge
 */
export function getFreshnessClasses(color: DataFreshnessInfo['color']): string {
  const baseClasses = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium'
  
  switch (color) {
    case 'green':
      return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`
    case 'yellow':
      return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`
    case 'red':
      return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`
    case 'gray':
      return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`
  }
}

/**
 * Format the last scraped date for display
 */
export function formatLastScraped(lastScraped: Date | null): string {
  if (!lastScraped) {
    return 'Never'
  }

  return new Date(lastScraped).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
