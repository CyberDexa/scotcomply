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
} from 'lucide-react'

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

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Home className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">ScotComply</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
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
  )
}
