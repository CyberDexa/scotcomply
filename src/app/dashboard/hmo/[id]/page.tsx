'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Shield,
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  Calendar,
  Users,
  Flame,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  TrendingUp,
} from 'lucide-react'

export default function HMODetailPage() {
  const params = useParams()
  const router = useRouter()
  const hmoId = params.id as string

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: license, isLoading } = trpc.hmo.getById.useQuery({ id: hmoId })

  const deleteMutation = trpc.hmo.delete.useMutation({
    onSuccess: () => {
      router.push('/dashboard/hmo')
    },
  })

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({ id: hmoId })
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading license details...</p>
        </div>
      </div>
    )
  }

  if (!license) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">License Not Found</h2>
          <p className="text-gray-600 mb-6">
            The HMO license you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/dashboard/hmo">
            <Button>Back to HMO Licenses</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Helper functions
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getDaysUntilExpiry = () => {
    const today = new Date()
    const expiry = new Date(license.expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDaysActive = () => {
    const applicationDate = new Date(license.applicationDate)
    const today = new Date()
    const diffTime = today.getTime() - applicationDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDaysSinceInspection = () => {
    if (!license.lastInspectionDate) return null
    const inspectionDate = new Date(license.lastInspectionDate)
    const today = new Date()
    const diffTime = today.getTime() - inspectionDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getTotalDuration = () => {
    const applicationDate = new Date(license.applicationDate)
    const expiryDate = new Date(license.expiryDate)
    const diffTime = expiryDate.getTime() - applicationDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getPercentageElapsed = () => {
    const daysActive = getDaysActive()
    const totalDuration = getTotalDuration()
    return Math.min(Math.round((daysActive / totalDuration) * 100), 100)
  }

  const daysUntilExpiry = getDaysUntilExpiry()
  const isExpiringSoon = daysUntilExpiry <= 60 && daysUntilExpiry > 0
  const isExpired = daysUntilExpiry < 0
  const daysSinceInspection = getDaysSinceInspection()
  const inspectionOverdue = daysSinceInspection !== null && daysSinceInspection > 365

  const getStatusBadge = () => {
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

    const statusConfig = config[license.status as keyof typeof config] || config.pending
    const Icon = statusConfig.icon

    return (
      <Badge className={statusConfig.className}>
        <Icon className="mr-1 h-3 w-3" />
        {statusConfig.label}
      </Badge>
    )
  }

  // Council websites for more info
  const getCouncilWebsite = () => {
    const councilWebsites: Record<string, string> = {
      'City of Edinburgh': 'https://www.edinburgh.gov.uk/hmo',
      'Glasgow City': 'https://www.glasgow.gov.uk/hmo',
      'Aberdeen City': 'https://www.aberdeencity.gov.uk/hmo',
      'Dundee City': 'https://www.dundeecity.gov.uk/hmo',
    }
    return councilWebsites[license.councilArea] || '#'
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Link href="/dashboard/hmo">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HMO License Details</h1>
              <p className="text-gray-600 mt-1">
                {license.property.address}, {license.property.postcode}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/hmo/${hmoId}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Expiring/Expired Alert */}
        {isExpired && (
          <Card className="border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 text-lg">License Expired</h3>
                  <p className="text-red-800 mt-1">
                    This license expired {Math.abs(daysUntilExpiry)} days ago. You must renew immediately to remain compliant.
                  </p>
                  <Button variant="destructive" className="mt-3">
                    Renew License Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isExpiringSoon && !isExpired && (
          <Card className="border-yellow-500 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="h-6 w-6 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 text-lg">Renewal Due Soon</h3>
                  <p className="text-yellow-800 mt-1">
                    This license expires in {daysUntilExpiry} days. Start your renewal process soon.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fire Safety Alert */}
        {!license.fireSafetyCompliant && (
          <Card className="border-orange-500 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Flame className="h-6 w-6 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 text-lg">Fire Safety Non-Compliant</h3>
                  <p className="text-orange-800 mt-1">
                    This property is not currently fire safety compliant. Address this immediately to meet HMO requirements.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inspection Overdue Alert */}
        {inspectionOverdue && (
          <Card className="border-orange-500 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="h-6 w-6 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 text-lg">Inspection Overdue</h3>
                  <p className="text-orange-800 mt-1">
                    Last inspection was {daysSinceInspection} days ago. Annual inspections are recommended for HMOs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Active</p>
                  <p className="text-2xl font-bold">{getDaysActive()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Remaining</p>
                  <p className={`text-2xl font-bold ${isExpired ? 'text-red-600' : ''}`}>
                    {isExpired ? 'Expired' : daysUntilExpiry}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time Elapsed</p>
                  <p className="text-2xl font-bold">{getPercentageElapsed()}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Occupancy</p>
                  <p className="text-2xl font-bold">{license.occupancyLimit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* License Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                License Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                {getStatusBadge()}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">License Number</p>
                <p className="font-medium">{license.licenseNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Council Area</p>
                <p className="font-medium">{license.councilArea}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Annual Fee</p>
                <p className="font-medium">£{license.annualFee.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fire Safety Status</p>
                <Badge
                  className={
                    license.fireSafetyCompliant
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }
                >
                  <Flame className="mr-1 h-3 w-3" />
                  {license.fireSafetyCompliant ? 'Compliant' : 'Non-Compliant'}
                </Badge>
              </div>
              {getCouncilWebsite() !== '#' && (
                <div>
                  <a
                    href={getCouncilWebsite()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    Council HMO Information
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Address</p>
                <p className="font-medium">
                  {license.property.address}
                  <br />
                  {license.property.postcode}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Property Type</p>
                <p className="font-medium capitalize">{license.property.propertyType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bedrooms</p>
                <p className="font-medium">{license.property.bedrooms}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Occupancy</p>
                <p className="font-medium">
                  {license.property.hmoOccupancy || 0} / {license.occupancyLimit} people
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      (license.property.hmoOccupancy || 0) > license.occupancyLimit
                        ? 'bg-red-600'
                        : 'bg-green-600'
                    }`}
                    style={{
                      width: `${Math.min(
                        ((license.property.hmoOccupancy || 0) / license.occupancyLimit) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
              <Link href={`/dashboard/properties/${license.property.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View Property Details
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>License Timeline</CardTitle>
            <CardDescription>Key dates and milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>

              {/* Timeline Items */}
              <div className="space-y-8">
                {/* Application */}
                <div className="relative pl-12">
                  <div className="absolute left-2 top-1 h-4 w-4 rounded-full bg-blue-500 border-4 border-white"></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Application Submitted</p>
                    <p className="font-medium">{formatDate(license.applicationDate)}</p>
                  </div>
                </div>

                {/* Last Inspection */}
                {license.lastInspectionDate && (
                  <div className="relative pl-12">
                    <div className="absolute left-2 top-1 h-4 w-4 rounded-full bg-purple-500 border-4 border-white"></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Inspection</p>
                      <p className="font-medium">{formatDate(license.lastInspectionDate)}</p>
                      {daysSinceInspection && (
                        <p className="text-xs text-muted-foreground">{daysSinceInspection} days ago</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Approval */}
                {license.approvalDate && (
                  <div className="relative pl-12">
                    <div className="absolute left-2 top-1 h-4 w-4 rounded-full bg-green-500 border-4 border-white"></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Approved</p>
                      <p className="font-medium">{formatDate(license.approvalDate)}</p>
                    </div>
                  </div>
                )}

                {/* Expiry */}
                <div className="relative pl-12">
                  <div
                    className={`absolute left-2 top-1 h-4 w-4 rounded-full border-4 border-white ${
                      isExpired ? 'bg-red-500' : isExpiringSoon ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}
                  ></div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isExpired ? 'Expired' : 'Expires'}
                    </p>
                    <p className="font-medium">{formatDate(license.expiryDate)}</p>
                    {!isExpired && (
                      <p className="text-xs text-muted-foreground">
                        {daysUntilExpiry} days remaining
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {license.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{license.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete HMO License</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this HMO license? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
