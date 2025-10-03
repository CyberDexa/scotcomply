'use client'

import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, AlertTriangle, Calendar, CheckCircle, Clock, Home, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface QuickFilter {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  href: string
  count?: number
}

export function QuickFilters() {
  // Get expiring items (30 days)
  const { data: expiringItems } = trpc.search.getExpiringItems.useQuery({ days: 30 })
  
  // Get non-compliant items
  const { data: nonCompliantItems } = trpc.search.getNonCompliantItems.useQuery()

  const filters: QuickFilter[] = [
    {
      id: 'expiring-soon',
      title: 'Expiring Soon',
      description: 'Items expiring in 30 days',
      icon: Clock,
      color: 'bg-amber-500',
      href: '/dashboard/search?filter=expiring',
      count: expiringItems?.total || 0,
    },
    {
      id: 'non-compliant',
      title: 'Non-Compliant',
      description: 'Expired certificates & registrations',
      icon: AlertCircle,
      color: 'bg-red-500',
      href: '/dashboard/search?filter=non-compliant',
      count: nonCompliantItems?.total || 0,
    },
    {
      id: 'all-properties',
      title: 'All Properties',
      description: 'View all your properties',
      icon: Home,
      color: 'bg-blue-500',
      href: '/dashboard/properties',
    },
    {
      id: 'critical-alerts',
      title: 'Critical Alerts',
      description: 'High priority notifications',
      icon: AlertTriangle,
      color: 'bg-orange-500',
      href: '/dashboard/notifications?priority=critical',
    },
    {
      id: 'upcoming-renewals',
      title: 'Upcoming Renewals',
      description: 'Registrations due for renewal',
      icon: Calendar,
      color: 'bg-purple-500',
      href: '/dashboard/registrations?status=expiring',
    },
    {
      id: 'recent-updates',
      title: 'Recent Updates',
      description: 'Recently modified items',
      icon: TrendingUp,
      color: 'bg-green-500',
      href: '/dashboard/search?sort=recent',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Filters</CardTitle>
        <CardDescription>Access commonly used filters and views</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filters.map((filter) => {
            const Icon = filter.icon
            return (
              <Link key={filter.id} href={filter.href}>
                <div className="group relative overflow-hidden rounded-lg border p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-lg', filter.color)}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate">{filter.title}</h3>
                        {filter.count !== undefined && (
                          <Badge
                            variant={filter.count > 0 ? 'default' : 'secondary'}
                            className={cn(
                              filter.count > 0 && filter.id === 'non-compliant' && 'bg-red-500',
                              filter.count > 0 && filter.id === 'expiring-soon' && 'bg-amber-500'
                            )}
                          >
                            {filter.count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{filter.description}</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-5 transition-opacity" />
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Expiring Items Detail Component
export function ExpiringItemsCard() {
  const { data: expiringItems, isLoading } = trpc.search.getExpiringItems.useQuery({ days: 30 })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Expiring Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!expiringItems || expiringItems.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Expiring Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p>All items are up to date!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Expiring Soon
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            {expiringItems.total} items
          </Badge>
        </CardTitle>
        <CardDescription>Items expiring in the next 30 days</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-green-50">
            <div className="text-2xl font-bold text-green-700">{expiringItems.certificates.length}</div>
            <div className="text-xs text-muted-foreground">Certificates</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-50">
            <div className="text-2xl font-bold text-purple-700">{expiringItems.registrations.length}</div>
            <div className="text-xs text-muted-foreground">Registrations</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-red-50">
            <div className="text-2xl font-bold text-red-700">{expiringItems.hmoLicenses.length}</div>
            <div className="text-xs text-muted-foreground">HMO Licenses</div>
          </div>
        </div>

        <Link href="/dashboard/search?filter=expiring">
          <Button variant="outline" className="w-full">
            View All Expiring Items
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

// Non-Compliant Items Card
export function NonCompliantItemsCard() {
  const { data: nonCompliantItems, isLoading } = trpc.search.getNonCompliantItems.useQuery()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Non-Compliant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!nonCompliantItems || nonCompliantItems.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Non-Compliant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p>All items are compliant!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          Non-Compliant
          <Badge variant="destructive">{nonCompliantItems.total} items</Badge>
        </CardTitle>
        <CardDescription>Expired certificates, registrations, and licenses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-red-50">
            <div className="text-2xl font-bold text-red-700">{nonCompliantItems.expiredCertificates.length}</div>
            <div className="text-xs text-muted-foreground">Certificates</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-red-50">
            <div className="text-2xl font-bold text-red-700">{nonCompliantItems.expiredRegistrations.length}</div>
            <div className="text-xs text-muted-foreground">Registrations</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-red-50">
            <div className="text-2xl font-bold text-red-700">{nonCompliantItems.expiredHMO.length}</div>
            <div className="text-xs text-muted-foreground">HMO Licenses</div>
          </div>
        </div>

        <Link href="/dashboard/search?filter=non-compliant">
          <Button variant="destructive" className="w-full">
            View All Non-Compliant Items
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
