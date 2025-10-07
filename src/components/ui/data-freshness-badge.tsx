'use client'

import { Clock } from 'lucide-react'
import { getDataFreshness, getFreshnessClasses } from '@/lib/data-freshness'

interface DataFreshnessBadgeProps {
  lastScraped: Date | null
  showIcon?: boolean
  className?: string
}

export function DataFreshnessBadge({
  lastScraped,
  showIcon = true,
  className = '',
}: DataFreshnessBadgeProps) {
  const freshness = getDataFreshness(lastScraped)
  const badgeClasses = getFreshnessClasses(freshness.color)

  return (
    <span className={`${badgeClasses} ${className}`}>
      {showIcon && <Clock className="h-3 w-3" />}
      <span>Verified {freshness.text}</span>
    </span>
  )
}
