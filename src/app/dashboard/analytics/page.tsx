'use client'

import dynamic from 'next/dynamic'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, TrendingUp, DollarSign, AlertTriangle, Calendar, FileText, BarChart3, Download, FileDown } from 'lucide-react'
import { RiskScoreGauge } from '@/components/analytics/RiskScoreGauge'
import { format } from 'date-fns'

// Lazy load heavy chart components (chart.js is ~200KB)
const ComplianceTrendChart = dynamic(
  () => import('@/components/analytics/ComplianceTrendChart').then(mod => ({ default: mod.ComplianceTrendChart })),
  {
    loading: () => <div className="h-64 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>,
    ssr: false
  }
)

const CostBreakdownChart = dynamic(
  () => import('@/components/analytics/CostBreakdownChart').then(mod => ({ default: mod.CostBreakdownChart })),
  {
    loading: () => <div className="h-64 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>,
    ssr: false
  }
)

export default function AnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = trpc.analytics.getPortfolioStats.useQuery()
  const { data: trends, isLoading: trendsLoading } = trpc.analytics.getComplianceTrends.useQuery()
  const { data: costs, isLoading: costsLoading } = trpc.analytics.getCostSummary.useQuery()
  const { data: risk, isLoading: riskLoading } = trpc.analytics.getRiskAssessment.useQuery()
  const { data: timeline, isLoading: timelineLoading } = trpc.analytics.getExpiryTimeline.useQuery()
  const { data: certBreakdown } = trpc.analytics.getCertificateBreakdown.useQuery()

  // Lazy load export functions (jsPDF is ~300KB)
  const handleExportCSV = async () => {
    if (stats && costs && risk) {
      const { exportToCSV } = await import('@/lib/analytics-export')
      exportToCSV(stats, costs, risk)
    }
  }

  const handleExportPDF = async () => {
    if (stats && costs && risk) {
      const { exportToPDF } = await import('@/lib/analytics-export')
      exportToPDF(stats, costs, risk)
    }
  }

  if (statsLoading || trendsLoading || costsLoading || riskLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights into your compliance portfolio performance
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={!stats || !costs || !risk}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
            disabled={!stats || !costs || !risk}
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Portfolio Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Properties</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalProperties || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Active properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Compliance Items
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalCompliance || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.totalCertificates || 0} certs, {stats?.totalRegistrations || 0} regs,{' '}
              {stats?.totalHMOLicenses || 0} HMOs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Items Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats?.totalExpiring || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Costs (YTD)</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              £{costs?.totalCosts.toLocaleString() || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Compliance fees</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>
                Your portfolio&apos;s compliance risk score based on expiring and expired items
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {risk && <RiskScoreGauge score={risk.riskScore} level={risk.riskLevel} />}

          {/* Risk Factors */}
          {risk && risk.riskFactors.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Risk Factors</h3>
              <div className="space-y-3">
                {risk.riskFactors.map((factor, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      factor.severity === 'critical'
                        ? 'bg-red-50 border-red-500'
                        : 'bg-orange-50 border-orange-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{factor.factor}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {factor.count} item{factor.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            factor.severity === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {factor.points} points
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {risk && risk.riskFactors.length === 0 && (
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-800 font-medium">✓ No risk factors detected</p>
              <p className="text-green-600 text-sm mt-2">Your portfolio is in excellent compliance standing</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Compliance Trends */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Compliance Trends</CardTitle>
                <CardDescription>New compliance items added over the last 6 months</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {trends && <ComplianceTrendChart data={trends} />}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Monthly compliance costs over the last 6 months</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {costs && <CostBreakdownChart data={costs.monthlyBreakdown} />}
          </CardContent>
        </Card>
      </div>

      {/* Cost Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Cost Analysis</CardTitle>
          <CardDescription>Detailed breakdown of compliance costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Registration Fees</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">
                £{costs?.totalRegistrationFees.toLocaleString()}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Avg: £{costs?.averageRegistrationFee.toFixed(0)}
              </p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-600 font-medium">HMO License Fees</p>
              <p className="text-2xl font-bold text-indigo-900 mt-2">
                £{costs?.totalHMOFees.toLocaleString()}
              </p>
              <p className="text-xs text-indigo-600 mt-1">Avg: £{costs?.averageHMOFee.toFixed(0)}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Costs</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                £{costs?.totalCosts.toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 mt-1">All compliance fees</p>
            </div>
          </div>

          {/* Costs by Council */}
          {costs && costs.costsByCouncil.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Costs by Council Area</h3>
              <div className="space-y-2">
                {costs.costsByCouncil
                  .sort((a, b) => b.cost - a.cost)
                  .slice(0, 10)
                  .map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">{item.council}</span>
                      <span className="text-gray-900 font-semibold">
                        £{item.cost.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expiry Timeline */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle>Upcoming Expiries (Next 90 Days)</CardTitle>
              <CardDescription>
                {timeline?.length || 0} compliance items expiring soon
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {timelineLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {!timelineLoading && timeline && timeline.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No items expiring in the next 90 days</p>
            </div>
          )}

          {!timelineLoading && timeline && timeline.length > 0 && (
            <div className="space-y-3">
              {timeline.slice(0, 10).map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`p-4 rounded-lg border-l-4 ${
                    item.daysUntilExpiry <= 7
                      ? 'bg-red-50 border-red-500'
                      : item.daysUntilExpiry <= 30
                        ? 'bg-orange-50 border-orange-500'
                        : 'bg-yellow-50 border-yellow-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                            item.type === 'certificate'
                              ? 'bg-blue-100 text-blue-800'
                              : item.type === 'registration'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {item.type.toUpperCase()}
                        </span>
                        <p className="font-medium text-gray-900">{item.title}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.propertyAddress}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Expires: {format(new Date(item.expiryDate), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p
                        className={`text-2xl font-bold ${
                          item.daysUntilExpiry <= 7
                            ? 'text-red-600'
                            : item.daysUntilExpiry <= 30
                              ? 'text-orange-600'
                              : 'text-yellow-600'
                        }`}
                      >
                        {item.daysUntilExpiry}
                      </p>
                      <p className="text-xs text-gray-600">days left</p>
                    </div>
                  </div>
                </div>
              ))}

              {timeline.length > 10 && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Showing 10 of {timeline.length} expiring items
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificate Type Breakdown */}
      {certBreakdown && certBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Certificate Type Breakdown</CardTitle>
            <CardDescription>Distribution of certificates by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {certBreakdown.map((cert: { type: string; count: number }, index: number) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-900">{cert.count}</p>
                  <p className="text-sm text-blue-600 mt-2">{cert.type}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
