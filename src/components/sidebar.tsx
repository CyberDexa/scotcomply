'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Building2,
  FileText,
  ClipboardCheck,
  Shield,
  Bell,
  Settings,
  LayoutDashboard,
  CheckSquare,
  FileType,
  Mail,
  ShieldAlert,
  MapPin,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Compliance', href: '/dashboard/compliance', icon: CheckSquare },
  { name: 'Properties', href: '/dashboard/properties', icon: Building2 },
  { name: 'Certificates', href: '/dashboard/certificates', icon: FileText },
  { name: 'Registrations', href: '/dashboard/registrations', icon: ClipboardCheck },
  { name: 'HMO Licenses', href: '/dashboard/hmo', icon: Shield },
  { name: 'AML Screening', href: '/dashboard/aml', icon: ShieldAlert },
  { name: 'Council Intelligence', href: '/dashboard/councils', icon: MapPin },
  { name: 'Templates', href: '/dashboard/templates', icon: FileType },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Email History', href: '/dashboard/email-history', icon: Mail },
  { name: 'Settings', href: '/dashboard/settings-enhanced', icon: Settings },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  const handleLinkClick = () => {
    // Close mobile menu when a link is clicked
    if (onMobileClose) {
      onMobileClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'flex h-full w-64 flex-col border-r bg-card transition-transform duration-300 ease-in-out z-50',
          // Desktop: always visible
          'lg:translate-x-0 lg:relative',
          // Mobile: slide in/out based on mobileOpen state
          'fixed inset-y-0 left-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/dashboard" className="flex items-center space-x-2" onClick={handleLinkClick}>
            <Home className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ScotComply</span>
          </Link>
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
