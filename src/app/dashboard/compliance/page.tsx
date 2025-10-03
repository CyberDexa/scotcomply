'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Loader2, 
  Home, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Building2,
  ShieldCheck,
  Download,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react'
import { getCertificateTypeName, isCertificateExpired, isCertificateExpiringSoon, getDaysUntilExpiry } from '@/lib/certificate-checkpoint-mapping'

type ComplianceFilter = 'all' | 'compliant' | 'non-compliant' | 'pending'

export default function ComplianceDashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [complianceFilter, setComplianceFilter] = useState<ComplianceFilter>('all')

  const { data: propertyData, isLoading } = trpc.property.list.useQuery({ limit: 100 })
  const { data: assessments } = trpc.repairingStandard.getAssessments.useQuery()
  const { data: hmoLicenses } = trpc.hmo.list.useQuery({ limit: 100 })

  const properties = propertyData?.properties || []

  const syncCertificates = trpc.repairingStandard.syncCertificates.useMutation()

  const handleSyncCertificates = async (assessmentId: string) => {
    try {
      await syncCertificates.mutateAsync({ assessmentId })
      alert('Certificates synced successfully!')
    } catch (error) {
      alert('Failed to sync certificates')
    }
  }

  // Get compliance data for each property
  const getPropertyCompliance = (propertyId: string) => {
    const property = properties?.find((p: any) => p.id === propertyId)
    if (!property) return null

    // Get latest assessment
    const propertyAssessments = assessments?.filter((a: any) => a.propertyId === propertyId) || []
    const latestAssessment = propertyAssessments[0] // Already ordered by date

    // Get HMO status
    const hmoLicense = hmoLicenses?.find((h: any) => h.propertyId === propertyId)

    // Certificate status
    const certificates = property.certificates || []
    const expiredCerts = certificates.filter((c: any) => isCertificateExpired(new Date(c.expiryDate)))
    const expiringSoonCerts = certificates.filter((c: any) => 
      !isCertificateExpired(new Date(c.expiryDate)) && 
      isCertificateExpiringSoon(new Date(c.expiryDate))
    )
    const validCerts = certificates.filter((c: any) => 
      !isCertificateExpired(new Date(c.expiryDate)) && 
      !isCertificateExpiringSoon(new Date(c.expiryDate))
    )

    // Overall compliance status
    let overallStatus: 'compliant' | 'non-compliant' | 'pending' = 'pending'
    
    if (latestAssessment) {
      if (latestAssessment.score >= 80 && expiredCerts.length === 0) {
        overallStatus = 'compliant'
      } else if (expiredCerts.length > 0 || (latestAssessment.score < 80 && latestAssessment.score > 0)) {
        overallStatus = 'non-compliant'
      }
    } else if (expiredCerts.length > 0) {
      overallStatus = 'non-compliant'
    }

    return {
      property,
      latestAssessment,
      hmoLicense,
      certificates: {
        total: certificates.length,
        expired: expiredCerts.length,
        expiringSoon: expiringSoonCerts.length,
        valid: validCerts.length,
        items: certificates,
      },
      overallStatus,
    }
  }

  // Filter properties
  const filteredProperties = properties?.filter((property: any) => {
    const compliance = getPropertyCompliance(property.id)
    if (!compliance) return false

    // Search filter
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      property.address.toLowerCase().includes(searchLower) ||
      property.city?.toLowerCase().includes(searchLower) ||
      property.postcode?.toLowerCase().includes(searchLower)

    if (searchQuery && !matchesSearch) return false

    // Compliance filter
    if (complianceFilter !== 'all' && compliance.overallStatus !== complianceFilter.replace('-', '_')) {
      return false
    }

    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-100 text-green-800">Compliant</Badge>
      case 'non-compliant':
      case 'non_compliant':
        return <Badge className="bg-red-100 text-red-800">Non-Compliant</Badge>
      case 'pending':
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
    }
  }

  const getCertificateStatusIcon = (cert: any) => {
    const expired = isCertificateExpired(new Date(cert.expiryDate))
    const expiringSoon = !expired && isCertificateExpiringSoon(new Date(cert.expiryDate))

    if (expired) {
      return <XCircle className="h-4 w-4 text-red-600" />
    } else if (expiringSoon) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
    return <CheckCircle2 className="h-4 w-4 text-green-600" />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  // Calculate overall statistics
  const totalProperties = properties?.length || 0
  const compliantProperties = filteredProperties?.filter((p: any) => getPropertyCompliance(p.id)?.overallStatus === 'compliant').length || 0
  const nonCompliantProperties = filteredProperties?.filter((p: any) => getPropertyCompliance(p.id)?.overallStatus === 'non-compliant').length || 0
  const pendingProperties = filteredProperties?.filter((p: any) => getPropertyCompliance(p.id)?.overallStatus === 'pending').length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-600 mt-1">Unified view of all compliance requirements</p>
        </div>
        <Link href="/dashboard/properties/new">
          <Button>
            <Home className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Properties</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalProperties}</p>
              </div>
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliant</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{compliantProperties}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Non-Compliant</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{nonCompliantProperties}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-3xl font-bold text-gray-600 mt-1">{pendingProperties}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by address, city, or postcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={complianceFilter} onValueChange={(value) => setComplianceFilter(value as ComplianceFilter)}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  <SelectItem value="compliant">Compliant Only</SelectItem>
                  <SelectItem value="non-compliant">Non-Compliant Only</SelectItem>
                  <SelectItem value="pending">Pending Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Cards */}
      {filteredProperties && filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProperties.map((property: any) => {
            const compliance = getPropertyCompliance(property.id)
            if (!compliance) return null

            return (
              <Card key={property.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{property.address}</CardTitle>
                      <CardDescription>
                        {property.city && `${property.city}, `}
                        {property.postcode}
                      </CardDescription>
                    </div>
                    {getStatusBadge(compliance.overallStatus)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Repairing Standard Assessment */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="font-medium text-sm">Repairing Standard</p>
                        {compliance.latestAssessment ? (
                          <p className="text-xs text-gray-600">
                            Score: {compliance.latestAssessment.score}% | {new Date(compliance.latestAssessment.assessmentDate).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-600">No assessment yet</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {compliance.latestAssessment && (
                        <>
                          <Link href={`/dashboard/repairing-standard/${compliance.latestAssessment.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSyncCertificates(compliance.latestAssessment.id)}
                            disabled={syncCertificates.isPending}
                          >
                            {syncCertificates.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                      {!compliance.latestAssessment && (
                        <Link href={`/dashboard/repairing-standard/new?propertyId=${property.id}`}>
                          <Button size="sm">Start</Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Certificates */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">Certificates</p>
                      <Link href={`/dashboard/certificates/new?propertyId=${property.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Add Certificate
                        </Button>
                      </Link>
                    </div>
                    
                    {compliance.certificates.total > 0 ? (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-red-50 rounded">
                            <p className="text-lg font-bold text-red-600">{compliance.certificates.expired}</p>
                            <p className="text-xs text-red-700">Expired</p>
                          </div>
                          <div className="p-2 bg-yellow-50 rounded">
                            <p className="text-lg font-bold text-yellow-600">{compliance.certificates.expiringSoon}</p>
                            <p className="text-xs text-yellow-700">Expiring Soon</p>
                          </div>
                          <div className="p-2 bg-green-50 rounded">
                            <p className="text-lg font-bold text-green-600">{compliance.certificates.valid}</p>
                            <p className="text-xs text-green-700">Valid</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          {compliance.certificates.items.slice(0, 3).map((cert: any) => (
                            <div key={cert.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                              <div className="flex items-center gap-2">
                                {getCertificateStatusIcon(cert)}
                                <span className="font-medium">{getCertificateTypeName(cert.certificateType as any)}</span>
                              </div>
                              <span className="text-gray-600">
                                {isCertificateExpired(new Date(cert.expiryDate))
                                  ? `Expired ${Math.abs(getDaysUntilExpiry(new Date(cert.expiryDate)))}d ago`
                                  : `${getDaysUntilExpiry(new Date(cert.expiryDate))}d left`
                                }
                              </span>
                            </div>
                          ))}
                          {compliance.certificates.total > 3 && (
                            <Link href={`/dashboard/properties/${property.id}`}>
                              <Button variant="ghost" size="sm" className="w-full h-7 text-xs">
                                View all {compliance.certificates.total} certificates
                              </Button>
                            </Link>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-600 py-2">No certificates added</p>
                    )}
                  </div>

                  {/* HMO Status */}
                  {compliance.hmoLicense && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-medium text-sm">HMO License</p>
                          <p className="text-xs text-gray-600">
                            {compliance.hmoLicense.status === 'approved' ? 'Approved' : 
                             compliance.hmoLicense.status === 'pending' ? 'Application Pending' : 
                             compliance.hmoLicense.status === 'expired' ? 'Expired' :
                             'Rejected'}
                          </p>
                        </div>
                      </div>
                      <Link href={`/dashboard/hmo/${compliance.hmoLicense.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Link href={`/dashboard/properties/${property.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View Property
                      </Button>
                    </Link>
                    {compliance.latestAssessment && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // This would trigger PDF download
                          alert('PDF download feature - coming soon!')
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || complianceFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Get started by adding your first property'
              }
            </p>
            {!searchQuery && complianceFilter === 'all' && (
              <Link href="/dashboard/properties/new">
                <Button>
                  <Home className="mr-2 h-4 w-4" />
                  Add Your First Property
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
