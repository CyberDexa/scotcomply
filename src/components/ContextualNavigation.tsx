'use client'

import Link from 'next/link'
import { ArrowRight, Home, FileText, ClipboardCheck, Building2, Wrench, Shield, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface RelatedLink {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  description?: string
}

interface ContextualNavigationProps {
  title?: string
  description?: string
  links: RelatedLink[]
  propertyId?: string
  className?: string
}

export function ContextualNavigation({ 
  title = 'Related Actions', 
  description,
  links, 
  propertyId,
  className 
}: ContextualNavigationProps) {
  // If propertyId is provided, add property-specific quick links
  const allLinks = propertyId ? [
    {
      label: 'View Property',
      href: `/dashboard/properties/${propertyId}`,
      icon: Home,
      description: 'See property details'
    },
    {
      label: 'Certificates',
      href: `/dashboard/certificates?property=${propertyId}`,
      icon: FileText,
      description: 'Manage certificates'
    },
    {
      label: 'Registrations',
      href: `/dashboard/registrations?property=${propertyId}`,
      icon: ClipboardCheck,
      description: 'View registrations'
    },
    {
      label: 'HMO License',
      href: `/dashboard/hmo?property=${propertyId}`,
      icon: Building2,
      description: 'Check HMO status'
    },
    {
      label: 'Maintenance',
      href: `/dashboard/maintenance?property=${propertyId}`,
      icon: Wrench,
      description: 'View maintenance'
    },
    {
      label: 'Assessments',
      href: `/dashboard/repairing-standard?property=${propertyId}`,
      icon: Shield,
      description: 'Compliance assessments'
    },
    ...links
  ] : links

  if (allLinks.length === 0) {
    return null
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {allLinks.map((link, index) => {
            const Icon = link.icon || ArrowRight
            
            return (
              <Link
                key={index}
                href={link.href}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-gray-100 group-hover:bg-blue-100 transition-colors">
                    <Icon className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900 group-hover:text-blue-600">
                      {link.label}
                    </p>
                    {link.description && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {link.description}
                      </p>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Quick property context bar (for use in headers)
interface PropertyContextBarProps {
  propertyId: string
  propertyAddress?: string
  className?: string
}

export function PropertyContextBar({ propertyId, propertyAddress, className }: PropertyContextBarProps) {
  return (
    <div className={cn('flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4', className)}>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-blue-600" />
        <div>
          <p className="text-xs text-blue-600 font-medium">Property Context</p>
          {propertyAddress && (
            <p className="text-sm text-gray-900">{propertyAddress}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/properties/${propertyId}`}>
            <Home className="h-3 w-3 mr-1" />
            View Property
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/certificates?property=${propertyId}`}>
            <FileText className="h-3 w-3 mr-1" />
            Certificates
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/maintenance?property=${propertyId}`}>
            <Wrench className="h-3 w-3 mr-1" />
            Maintenance
          </Link>
        </Button>
      </div>
    </div>
  )
}
