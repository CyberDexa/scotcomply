'use client'

import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { QuickFilters, ExpiringItemsCard, NonCompliantItemsCard } from '@/components/search/QuickFilters'
import { 
  Building2, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Plus,
  TrendingUp,
  ArrowRight,
  Shield,
  Flame
} from 'lucide-react'

export default function DashboardPage() {
  // Fetch real data
  const { data: propertiesData, isLoading: loadingProperties } = trpc.property.list.useQuery({ limit: 100 })
  const { data: certificates, isLoading: loadingCerts } = trpc.certificate.list.useQuery({ limit: 100 })
  const { data: expiringCerts } = trpc.certificate.getExpiring.useQuery()
  const { data: registrationStats, isLoading: loadingRegStats } = trpc.registration.getStats.useQuery()
  const { data: expiringRegs } = trpc.registration.getExpiring.useQuery()
  const { data: hmoStats, isLoading: loadingHMOStats } = trpc.hmo.getStats.useQuery()
  const { data: expiringHMOs } = trpc.hmo.getExpiring.useQuery()
  const { data: propertiesNeedingHMO } = trpc.hmo.getPropertiesNeedingLicense.useQuery()

  const properties = propertiesData?.properties || []
  const allCertificates = certificates || []
  const expiringSoon = expiringCerts || []
  const expiredCount = allCertificates.filter((cert: any) => cert.status === 'expired').length
  const expiringRegsCount = expiringRegs?.length || 0
  const expiringHMOsCount = expiringHMOs?.length || 0
  const propertiesNeedingHMOCount = propertiesNeedingHMO?.length || 0

  const stats = [
    {
      title: 'Total Properties',
      value: loadingProperties ? '...' : properties.length.toString(),
      icon: Building2,
      description: properties.length === 0 ? 'No properties added yet' : `${properties.filter((p: any) => p.tenancyStatus === 'occupied').length} occupied`,
      trend: '+0%',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      href: '/dashboard/properties',
    },
    {
      title: 'Active Certificates',
      value: loadingCerts ? '...' : allCertificates.filter((c: any) => c.status === 'valid').length.toString(),
      icon: FileText,
      description: allCertificates.length === 0 ? 'No certificates yet' : `${allCertificates.length} total`,
      trend: '+0%',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      href: '/dashboard/certificates',
    },
    {
      title: 'Registrations',
      value: loadingRegStats ? '...' : (registrationStats?.approved || 0).toString(),
      icon: CheckCircle2,
      description: loadingRegStats ? 'Loading...' : `${registrationStats?.total || 0} total`,
      trend: '+0%',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      href: '/dashboard/registrations',
    },
    {
      title: 'HMO Licenses',
      value: loadingHMOStats ? '...' : (hmoStats?.approved || 0).toString(),
      icon: Shield,
      description: loadingHMOStats ? 'Loading...' : `${hmoStats?.total || 0} total`,
      trend: '+0%',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      href: '/dashboard/hmo',
    },
  ]

  const upcomingTasks = [
    {
      title: 'Add Your First Property',
      description: 'Start by adding properties to your portfolio',
      priority: 'high',
      dueDate: 'Today',
      type: 'setup',
      show: properties.length === 0,
      href: '/dashboard/properties/new',
    },
    {
      title: 'Upload Certificates',
      description: 'Add Gas Safety, EICR, and EPC certificates',
      priority: 'high',
      dueDate: 'This week',
      type: 'certificates',
      show: allCertificates.length === 0 && properties.length > 0,
      href: '/dashboard/certificates/new',
    },
    {
      title: 'Register Properties',
      description: 'Register your properties with local councils',
      priority: 'high',
      dueDate: 'This week',
      type: 'registration',
      show: properties.length > 0 && (registrationStats?.total || 0) === 0,
      href: '/dashboard/registrations/new',
    },
    {
      title: 'HMO Properties Need Licensing',
      description: `${propertiesNeedingHMOCount} HMO ${propertiesNeedingHMOCount === 1 ? 'property' : 'properties'} without license`,
      priority: 'high',
      dueDate: 'Urgent',
      type: 'hmo-needed',
      show: propertiesNeedingHMOCount > 0,
      href: '/dashboard/hmo/new',
    },
    {
      title: 'Fire Safety Non-Compliance',
      description: `${hmoStats?.fireSafetyNonCompliant || 0} HMO ${(hmoStats?.fireSafetyNonCompliant || 0) === 1 ? 'property' : 'properties'} need attention`,
      priority: 'high',
      dueDate: 'Urgent',
      type: 'fire-safety',
      show: (hmoStats?.fireSafetyNonCompliant || 0) > 0,
      href: '/dashboard/hmo',
    },
    {
      title: 'Renew Expiring Certificates',
      description: `${expiringSoon.length} certificate${expiringSoon.length !== 1 ? 's' : ''} expiring soon`,
      priority: 'high',
      dueDate: 'Within 30 days',
      type: 'renewal',
      show: expiringSoon.length > 0,
      href: '/dashboard/certificates',
    },
    {
      title: 'Renew Expiring Registrations',
      description: `${expiringRegsCount} registration${expiringRegsCount !== 1 ? 's' : ''} expiring soon`,
      priority: 'high',
      dueDate: 'Within 60 days',
      type: 'reg-renewal',
      show: expiringRegsCount > 0,
      href: '/dashboard/registrations',
    },
    {
      title: 'Renew Expiring HMO Licenses',
      description: `${expiringHMOsCount} HMO license${expiringHMOsCount !== 1 ? 's' : ''} expiring soon`,
      priority: 'high',
      dueDate: 'Within 60 days',
      type: 'hmo-renewal',
      show: expiringHMOsCount > 0,
      href: '/dashboard/hmo',
    },
    {
      title: 'Address Expired Certificates',
      description: `${expiredCount} certificate${expiredCount !== 1 ? 's' : ''} expired`,
      priority: 'high',
      dueDate: 'Urgent',
      type: 'expired',
      show: expiredCount > 0,
      href: '/dashboard/certificates',
    },
    {
      title: 'Address Expired Registrations',
      description: `${registrationStats?.expired || 0} registration${(registrationStats?.expired || 0) !== 1 ? 's' : ''} expired`,
      priority: 'high',
      dueDate: 'Urgent',
      type: 'reg-expired',
      show: (registrationStats?.expired || 0) > 0,
      href: '/dashboard/registrations',
    },
    {
      title: 'Address Expired HMO Licenses',
      description: `${hmoStats?.expired || 0} HMO license${(hmoStats?.expired || 0) !== 1 ? 's' : ''} expired`,
      priority: 'high',
      dueDate: 'Urgent',
      type: 'hmo-expired',
      show: (hmoStats?.expired || 0) > 0,
      href: '/dashboard/hmo',
    },
  ].filter((task) => task.show)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-1">
            Manage your Scottish letting compliance from one place
          </p>
        </div>
        <Link href="/dashboard/properties/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Filters */}
      <QuickFilters />

      {/* Compliance Status Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <ExpiringItemsCard />
        <NonCompliantItemsCard />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>
              {upcomingTasks.length > 0 ? 'Action Items' : 'Getting Started'}
            </CardTitle>
            <CardDescription>
              {upcomingTasks.length > 0 
                ? 'Tasks requiring your attention'
                : 'Complete these tasks to set up your compliance tracking'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task, index) => (
                <Link key={index} href={task.href}>
                  <div className="flex items-start space-x-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">{task.title}</p>
                        <Badge
                          variant={task.priority === 'high' ? 'destructive' : 'secondary'}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {task.dueDate}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No urgent actions required
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Certificates</CardTitle>
            <CardDescription>
              Latest uploaded safety certificates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allCertificates.length > 0 ? (
              <div className="space-y-3">
                {allCertificates.slice(0, 5).map((cert: any) => (
                  <Link key={cert.id} href={`/dashboard/certificates`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {cert.certificateType.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cert.property.address}
                          </p>
                        </div>
                      </div>
                      <Badge variant={cert.status === 'valid' ? 'default' : cert.status === 'expiring' ? 'secondary' : 'destructive'}>
                        {cert.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
                {allCertificates.length > 5 && (
                  <Link href="/dashboard/certificates">
                    <Button variant="ghost" className="w-full">
                      View all {allCertificates.length} certificates
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No certificates yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start adding certificates to track compliance
                </p>
                <Link href="/dashboard/certificates/new">
                  <Button className="mt-4" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Certificate
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/properties/new">
              <Button variant="outline" className="h-20 w-full flex-col space-y-2">
                <Building2 className="h-6 w-6" />
                <span className="text-xs">Add Property</span>
              </Button>
            </Link>
            <Link href="/dashboard/certificates/new">
              <Button variant="outline" className="h-20 w-full flex-col space-y-2">
                <FileText className="h-6 w-6" />
                <span className="text-xs">Upload Certificate</span>
              </Button>
            </Link>
            <Link href="/dashboard/registrations/new">
              <Button variant="outline" className="h-20 w-full flex-col space-y-2">
                <CheckCircle2 className="h-6 w-6" />
                <span className="text-xs">Register Property</span>
              </Button>
            </Link>
            <Link href="/dashboard/hmo/new">
              <Button variant="outline" className="h-20 w-full flex-col space-y-2">
                <Shield className="h-6 w-6" />
                <span className="text-xs">Add HMO License</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
