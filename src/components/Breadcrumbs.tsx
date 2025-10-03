'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Auto-generate breadcrumbs from path if items not provided
  const breadcrumbItems = items || generateBreadcrumbs(pathname)

  if (breadcrumbItems.length === 0) {
    return null
  }

  return (
    <nav className={cn('flex items-center space-x-2 text-sm text-muted-foreground mb-4', className)}>
      {/* Home */}
      <Link 
        href="/dashboard" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {/* Breadcrumb Items */}
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1

        return (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4" />
            {item.href && !isLast ? (
              <Link 
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast && 'text-foreground font-medium')}>
                {item.label}
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )
}

// Auto-generate breadcrumbs from pathname
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  
  // Skip if just /dashboard
  if (segments.length <= 1) {
    return []
  }

  const breadcrumbs: BreadcrumbItem[] = []
  let currentPath = ''

  segments.forEach((segment, index) => {
    // Skip 'dashboard' segment
    if (segment === 'dashboard') {
      return
    }

    currentPath += `/${segment}`
    const isLast = index === segments.length - 1

    // Format label
    let label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    // Special formatting for common routes
    if (segment === 'hmo') label = 'HMO'
    if (segment === 'aml') label = 'AML'
    if (segment === 'repairing-standard') label = 'Repairing Standard'
    if (segment === 'email-notifications') label = 'Email Notifications'
    if (segment === 'email-history') label = 'Email History'
    if (segment === 'settings-enhanced') label = 'Settings'

    // Check if segment is an ID (UUID or number)
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || 
                 /^\d+$/.test(segment)

    if (isId) {
      label = 'Details'
    }

    breadcrumbs.push({
      label,
      href: isLast ? undefined : `/dashboard${currentPath}`
    })
  })

  return breadcrumbs
}
