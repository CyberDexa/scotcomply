'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Home, FileText, Shield, Building2, CheckCircle2, AlertTriangle, 
  Clock, TrendingUp, Search, Download, Settings, Bell, MapPin,
  Wrench, FileCheck, AlertCircle, ExternalLink, ChevronRight,
  BarChart3, Calendar, Users, DollarSign
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function UnifiedDashboard() {
  const router = useRouter()
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7' | '30' | '90'>('30')

  // Fetch all dashboard data
  const { data: overview, isLoading: overviewLoading } = trpc.dashboard.getOverview.useQuery()
  const { data: deadlines, isLoading: deadlinesLoading } = trpc.dashboard.getUpcomingDeadlines.useQuery({ 
    days: parseInt(selectedTimeframe),
    limit: 10,
  })
  const { data: activity, isLoading: activityLoading } = trpc.dashboard.getRecentActivity.useQuery({ limit: 10 })
  const { data: issues, isLoading: issuesLoading } = trpc.dashboard.getCriticalIssues.useQuery()
  const { data: portfolio, isLoading: portfolioLoading } = trpc.dashboard.getPortfolioSummary.useQuery()

  const isLoading = overviewLoading || deadlinesLoading || activityLoading || issuesLoading || portfolioLoading

  // Get compliance score color
  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 75) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'overdue': return 'destructive'
      case 'critical': return 'destructive'
      case 'warning': return 'secondary'
      default: return 'outline'
    }
  }

  // Get severity badge variant
  const getSeverityVariant = (severity: string): 'default' | 'destructive' | 'secondary' | 'outline' => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Your complete compliance overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/search')}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/export')}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Critical Issues Alert */}
      {!issuesLoading && issues && issues.length > 0 && (
        <Alert variant="destructive" className="border-2">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">
            {issues.length} Critical Issue{issues.length > 1 ? 's' : ''} Requiring Attention
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            {issues.slice(0, 3).map((issue, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-t first:border-t-0">
                <div className="flex items-center gap-3">
                  <Badge variant={getSeverityVariant(issue.severity)}>
                    {issue.severity.toUpperCase()}
                  </Badge>
                  <span className="font-medium">{issue.message}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(issue.link)}
                >
                  {issue.action}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ))}
            {issues.length > 3 && (
              <p className="text-sm mt-2">...and {issues.length - 3} more issue{issues.length - 3 > 1 ? 's' : ''}</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overview?.overview.propertiesCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Properties under management
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={!overviewLoading && overview ? getComplianceColor(overview.overview.score) : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <CheckCircle2 className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overview?.overview.score || 0}%</div>
                <p className="text-xs">
                  {overview?.overview.compliantItems || 0} of {overview?.overview.totalItems || 0} items compliant
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {deadlinesLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{deadlines?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  In the next {selectedTimeframe} days
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overview?.notifications.unread || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Unread notifications
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Certificates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Certificates
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard/certificates')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {overviewLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="font-semibold">{overview?.certificates.total || 0}</span>
                </div>
                {overview && overview.certificates.expired > 0 && (
                  <div className="flex items-center justify-between text-red-600">
                    <span className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Expired
                    </span>
                    <span className="font-semibold">{overview.certificates.expired}</span>
                  </div>
                )}
                {overview && overview.certificates.expiringSoon > 0 && (
                  <div className="flex items-center justify-between text-orange-600">
                    <span className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Expiring Soon
                    </span>
                    <span className="font-semibold">{overview.certificates.expiringSoon}</span>
                  </div>
                )}
                <Button 
                  className="w-full mt-2" 
                  size="sm"
                  onClick={() => router.push('/dashboard/certificates/upload')}
                >
                  Upload Certificate
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Registrations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Registrations
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard/registrations')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {overviewLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active</span>
                  <span className="font-semibold">{overview?.registrations.active || 0}</span>
                </div>
                {overview && overview.registrations.expiringSoon > 0 && (
                  <div className="flex items-center justify-between text-orange-600">
                    <span className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Expiring Soon
                    </span>
                    <span className="font-semibold">{overview.registrations.expiringSoon}</span>
                  </div>
                )}
                <Button 
                  className="w-full mt-2" 
                  size="sm"
                  onClick={() => router.push('/dashboard/registrations/new')}
                >
                  New Registration
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* HMO Licenses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                HMO Licenses
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard/hmo')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {overviewLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="font-semibold">{overview?.hmo.total || 0}</span>
                </div>
                {overview && overview.hmo.expiringSoon > 0 && (
                  <div className="flex items-center justify-between text-orange-600">
                    <span className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Expiring Soon
                    </span>
                    <span className="font-semibold">{overview.hmo.expiringSoon}</span>
                  </div>
                )}
                <Button 
                  className="w-full mt-2" 
                  size="sm"
                  onClick={() => router.push('/dashboard/hmo/new')}
                >
                  Apply for License
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Assessments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Assessments
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard/repairing-standard')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {overviewLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="font-semibold">{overview?.assessments.total || 0}</span>
                </div>
                {overview && overview.assessments.nonCompliant > 0 && (
                  <div className="flex items-center justify-between text-red-600">
                    <span className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Non-Compliant
                    </span>
                    <span className="font-semibold">{overview.assessments.nonCompliant}</span>
                  </div>
                )}
                <Button 
                  className="w-full mt-2" 
                  size="sm"
                  onClick={() => router.push('/dashboard/repairing-standard/new')}
                >
                  New Assessment
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard/maintenance')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {overviewLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Open</span>
                  <span className="font-semibold">{overview?.maintenance.open || 0}</span>
                </div>
                {overview && overview.maintenance.urgent > 0 && (
                  <div className="flex items-center justify-between text-red-600">
                    <span className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Urgent
                    </span>
                    <span className="font-semibold">{overview.maintenance.urgent}</span>
                  </div>
                )}
                <Button 
                  className="w-full mt-2" 
                  size="sm"
                  onClick={() => router.push('/dashboard/maintenance/new')}
                >
                  New Request
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* AML Screening */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                AML Screening
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard/aml')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {overviewLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="font-semibold">{overview?.aml.total || 0}</span>
                </div>
                {overview && overview.aml.pendingReview > 0 && (
                  <div className="flex items-center justify-between text-orange-600">
                    <span className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Pending Review
                    </span>
                    <span className="font-semibold">{overview.aml.pendingReview}</span>
                  </div>
                )}
                <Button 
                  className="w-full mt-2" 
                  size="sm"
                  onClick={() => router.push('/dashboard/aml/new')}
                >
                  New Screening
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Deadlines
              </CardTitle>
              <div className="flex gap-1">
                {(['7', '30', '90'] as const).map((days) => (
                  <Button
                    key={days}
                    variant={selectedTimeframe === days ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeframe(days)}
                  >
                    {days}d
                  </Button>
                ))}
              </div>
            </div>
            <CardDescription>Next {selectedTimeframe} days</CardDescription>
          </CardHeader>
          <CardContent>
            {deadlinesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : deadlines && deadlines.length > 0 ? (
              <div className="space-y-3">
                {deadlines.map((deadline) => (
                  <div
                    key={`${deadline.type}-${deadline.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      const routes = {
                        certificate: `/dashboard/certificates`,
                        registration: `/dashboard/registrations`,
                        hmo: `/dashboard/hmo`,
                        assessment: `/dashboard/repairing-standard`,
                      }
                      router.push(routes[deadline.type])
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getUrgencyColor(deadline.urgency)}>
                          {deadline.urgency}
                        </Badge>
                        <span className="font-medium text-sm">{deadline.title}</span>
                      </div>
                      <p className="text-xs text-gray-600">{deadline.propertyAddress}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatDistanceToNow(deadline.date, { addSuffix: true })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(deadline.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No upcoming deadlines in the next {selectedTimeframe} days</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates across your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-2">
                {activity.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Commonly used features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => router.push('/dashboard/properties/new')}
            >
              <Home className="h-6 w-6 mb-2" />
              <span className="text-xs">Add Property</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => router.push('/dashboard/certificates/upload')}
            >
              <FileCheck className="h-6 w-6 mb-2" />
              <span className="text-xs">Upload Certificate</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => router.push('/dashboard/maintenance/new')}
            >
              <Wrench className="h-6 w-6 mb-2" />
              <span className="text-xs">Log Maintenance</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => router.push('/dashboard/aml/new')}
            >
              <Users className="h-6 w-6 mb-2" />
              <span className="text-xs">AML Screening</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => router.push('/dashboard/councils')}
            >
              <MapPin className="h-6 w-6 mb-2" />
              <span className="text-xs">Council Info</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => router.push('/dashboard/analytics')}
            >
              <BarChart3 className="h-6 w-6 mb-2" />
              <span className="text-xs">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
