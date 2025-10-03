'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  AlertTriangle,
  UserPlus,
  FileText,
  TrendingUp,
  Filter,
  Search,
} from 'lucide-react'
import { ScreeningStatus, RiskLevel, ReviewStatus } from '@prisma/client'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function AMLDashboardPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<ScreeningStatus | 'ALL'>('ALL')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = trpc.aml.getStats.useQuery()

  // Fetch screenings
  const { data: screeningsData, isLoading: screeningsLoading } = trpc.aml.list.useQuery({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    riskLevel: riskFilter === 'ALL' ? undefined : riskFilter,
    limit: 50,
  })

  const screenings = screeningsData?.screenings || []

  // Filter by search term
  const filteredScreenings = screenings.filter(s =>
    s.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.subjectEmail && s.subjectEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AML Screening</h1>
          <p className="text-muted-foreground mt-1">
            Anti-Money Laundering & Sanctions Compliance
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/aml/new')} size="lg">
          <UserPlus className="h-4 w-4 mr-2" />
          New Screening
        </Button>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Screenings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Screenings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats?.totalScreenings || 0}</div>
                <Shield className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Pending Review */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats?.pendingReview || 0}</div>
                <Clock className="h-8 w-8 text-yellow-500 opacity-70" />
              </div>
            </CardContent>
          </Card>

          {/* High Risk */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                High Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-red-600">{stats?.highRisk || 0}</div>
                <AlertCircle className="h-8 w-8 text-red-500 opacity-70" />
              </div>
            </CardContent>
          </Card>

          {/* EDD Required */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                EDD Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats?.eddRequired || 0}</div>
                <FileText className="h-8 w-8 text-orange-500 opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Breakdown */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Status Overview</CardTitle>
            <CardDescription>Breakdown by screening status and risk level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* By Status */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">By Status</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byStatus || {}).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(status as ScreeningStatus)}
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Risk */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">By Risk Level</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byRisk || {}).map(([risk, count]) => (
                    <div key={risk} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getRiskBadge(risk as RiskLevel)}
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <CardTitle>Screenings</CardTitle>
          <CardDescription>View and manage all AML screenings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REQUIRES_REVIEW">Requires Review</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Risk Levels</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Screenings List */}
          {screeningsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredScreenings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No screenings found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/dashboard/aml/new')}
              >
                Create your first screening
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredScreenings.map((screening) => (
                <div
                  key={screening.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/aml/${screening.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{screening.subjectName}</h3>
                        <Badge variant="outline">{screening.subjectType}</Badge>
                        {getStatusBadge(screening.status)}
                        {screening.riskLevel && getRiskBadge(screening.riskLevel)}
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        {screening.subjectEmail && (
                          <span>{screening.subjectEmail}</span>
                        )}
                        <span>
                          Screened: {new Date(screening.screeningDate).toLocaleDateString()}
                        </span>
                        {screening.matches && screening.matches.length > 0 && (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            {screening.matches.length} match{screening.matches.length !== 1 ? 'es' : ''}
                          </span>
                        )}
                      </div>

                      {/* Match indicators */}
                      {screening.status === ScreeningStatus.COMPLETED && (
                        <div className="flex items-center gap-3 mt-2">
                          {screening.sanctionsMatch && (
                            <Badge variant="destructive">Sanctions</Badge>
                          )}
                          {screening.pepMatch && (
                            <Badge variant="secondary">PEP</Badge>
                          )}
                          {screening.adverseMedia && (
                            <Badge variant="secondary">Adverse Media</Badge>
                          )}
                          {screening.eddRequired && !screening.eddCompleted && (
                            <Badge variant="outline" className="border-orange-500 text-orange-600">
                              EDD Required
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {screening.riskScore !== null && (
                        <div className="text-right">
                          <div className="text-2xl font-bold">{screening.riskScore}</div>
                          <div className="text-xs text-muted-foreground">Risk Score</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper functions
function getStatusBadge(status: ScreeningStatus) {
  const config = {
    [ScreeningStatus.PENDING]: { label: 'Pending', variant: 'secondary' as const },
    [ScreeningStatus.IN_PROGRESS]: { label: 'In Progress', variant: 'default' as const },
    [ScreeningStatus.COMPLETED]: { label: 'Completed', variant: 'outline' as const },
    [ScreeningStatus.FAILED]: { label: 'Failed', variant: 'destructive' as const },
    [ScreeningStatus.REQUIRES_REVIEW]: { label: 'Requires Review', variant: 'secondary' as const },
  }

  const { label, variant } = config[status] || config[ScreeningStatus.PENDING]
  return <Badge variant={variant}>{label}</Badge>
}

function getRiskBadge(risk: RiskLevel) {
  const config = {
    [RiskLevel.LOW]: { label: 'Low Risk', className: 'bg-green-100 text-green-800' },
    [RiskLevel.MEDIUM]: { label: 'Medium Risk', className: 'bg-yellow-100 text-yellow-800' },
    [RiskLevel.HIGH]: { label: 'High Risk', className: 'bg-orange-100 text-orange-800' },
    [RiskLevel.CRITICAL]: { label: 'Critical Risk', className: 'bg-red-100 text-red-800' },
  }

  const { label, className } = config[risk] || config[RiskLevel.LOW]
  return <Badge className={className}>{label}</Badge>
}
