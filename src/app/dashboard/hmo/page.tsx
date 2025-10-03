'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Shield,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Building2,
  Users,
  Flame,
} from 'lucide-react'

type HMOStatus = 'pending' | 'approved' | 'expired' | 'rejected' | undefined

export default function HMOPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<HMOStatus>(undefined)

  const { data: licenses, isLoading } = trpc.hmo.list.useQuery({
    status: statusFilter,
    limit: 50,
  })

  const { data: expiringLicenses } = trpc.hmo.getExpiring.useQuery()
  const { data: propertiesNeeding } = trpc.hmo.getPropertiesNeedingLicense.useQuery()

  // Filter licenses by search query
  const filteredLicenses = licenses?.filter((license) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      license.licenseNumber.toLowerCase().includes(searchLower) ||
      license.councilArea.toLowerCase().includes(searchLower) ||
      license.property.address.toLowerCase().includes(searchLower) ||
      license.property.postcode.toLowerCase().includes(searchLower)
    )
  })

  // Helper functions
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getDaysUntilExpiry = (expiryDate: Date | string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusBadge = (status: string) => {
    const config = {
      approved: {
        label: 'Approved',
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle,
      },
      pending: {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
      },
      expired: {
        label: 'Expired',
        className: 'bg-red-100 text-red-800',
        icon: AlertCircle,
      },
      rejected: {
        label: 'Rejected',
        className: 'bg-gray-100 text-gray-800',
        icon: AlertCircle,
      },
    }

    const statusConfig = config[status as keyof typeof config] || config.pending
    const Icon = statusConfig.icon

    return (
      <Badge className={statusConfig.className}>
        <Icon className="mr-1 h-3 w-3" />
        {statusConfig.label}
      </Badge>
    )
  }

  const getStatusIcon = (status: string) => {
    const config = {
      approved: <CheckCircle className="h-5 w-5 text-green-600" />,
      pending: <Clock className="h-5 w-5 text-yellow-600" />,
      expired: <AlertCircle className="h-5 w-5 text-red-600" />,
      rejected: <AlertCircle className="h-5 w-5 text-gray-600" />,
    }

    return config[status as keyof typeof config] || config.pending
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">HMO Licenses</h1>
            <p className="text-gray-600 mt-1">
              Manage Houses in Multiple Occupation licensing and compliance
            </p>
          </div>
          <Link href="/dashboard/hmo/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add HMO License
            </Button>
          </Link>
        </div>

        {/* Properties Needing License Alert */}
        {propertiesNeeding && propertiesNeeding.length > 0 && (
          <Card className="border-red-500 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-red-900">
                <AlertCircle className="mr-2 h-5 w-5 text-red-600" />
                {propertiesNeeding.length} HMO {propertiesNeeding.length === 1 ? 'Property' : 'Properties'} Without License
              </CardTitle>
              <CardDescription className="text-red-800">
                These properties are marked as HMO but don&apos;t have a valid license
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {propertiesNeeding.slice(0, 3).map((property) => (
                  <div key={property.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-900">
                        {property.address}, {property.postcode}
                      </span>
                    </div>
                    <Link href="/dashboard/hmo/new">
                      <Button size="sm" variant="destructive">
                        Apply for License
                      </Button>
                    </Link>
                  </div>
                ))}
                {propertiesNeeding.length > 3 && (
                  <p className="text-sm text-red-700 mt-2">
                    + {propertiesNeeding.length - 3} more
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expiring Soon Alert */}
        {expiringLicenses && expiringLicenses.length > 0 && (
          <Card className="border-yellow-500 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-yellow-900">
                <Clock className="mr-2 h-5 w-5 text-yellow-600" />
                {expiringLicenses.length} License{expiringLicenses.length !== 1 ? 's' : ''} Expiring Soon
              </CardTitle>
              <CardDescription className="text-yellow-800">
                These licenses will expire within the next 60 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expiringLicenses.slice(0, 3).map((license) => (
                  <div key={license.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-900">
                        {license.councilArea} - {license.property.address}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-yellow-700 border-yellow-700">
                      {getDaysUntilExpiry(license.expiryDate)} days
                    </Badge>
                  </div>
                ))}
                {expiringLicenses.length > 3 && (
                  <p className="text-sm text-yellow-700 mt-2">
                    + {expiringLicenses.length - 3} more
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by license number, council, or property..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => 
                  setStatusFilter(value === 'all' ? undefined : value as HMOStatus)
                }
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Licenses List */}
        <Card>
          <CardHeader>
            <CardTitle>All HMO Licenses</CardTitle>
            <CardDescription>
              {filteredLicenses?.length || 0} license{filteredLicenses?.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading licenses...</p>
                </div>
              </div>
            ) : filteredLicenses && filteredLicenses.length > 0 ? (
              <div className="space-y-4">
                {filteredLicenses.map((license) => (
                  <div
                    key={license.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-1">{getStatusIcon(license.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {license.councilArea} HMO License
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {license.property.address}, {license.property.postcode}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(license.status)}
                          {!license.fireSafetyCompliant && (
                            <Badge className="bg-orange-100 text-orange-800">
                              <Flame className="mr-1 h-3 w-3" />
                              Fire Safety
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">License #</div>
                          <div className="font-medium">{license.licenseNumber}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Occupancy</div>
                          <div className="font-medium flex items-center">
                            <Users className="mr-1 h-3 w-3" />
                            {license.occupancyLimit}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Application</div>
                          <div className="font-medium">{formatDate(license.applicationDate)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Expiry Date</div>
                          <div className="font-medium">{formatDate(license.expiryDate)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Days Remaining</div>
                          <div className={`font-medium ${
                            getDaysUntilExpiry(license.expiryDate) < 0 
                              ? 'text-red-600' 
                              : getDaysUntilExpiry(license.expiryDate) <= 60 
                              ? 'text-yellow-600' 
                              : 'text-green-600'
                          }`}>
                            {getDaysUntilExpiry(license.expiryDate) > 0
                              ? `${getDaysUntilExpiry(license.expiryDate)} days`
                              : 'Expired'}
                          </div>
                        </div>
                      </div>
                      {license.notes && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Notes: {license.notes}
                        </div>
                      )}
                    </div>
                    <Link href={`/dashboard/hmo/${license.id}`}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No HMO licenses found
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || statusFilter
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first HMO license'}
                </p>
                <Link href="/dashboard/hmo/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add HMO License
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
