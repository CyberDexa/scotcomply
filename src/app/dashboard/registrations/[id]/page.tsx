'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Calendar,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Edit,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react'
import { useState } from 'react'

export default function RegistrationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const registrationId = params.id as string
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: registration, isLoading } = trpc.registration.getById.useQuery({ id: registrationId })
  const deleteMutation = trpc.registration.delete.useMutation({
    onSuccess: () => {
      router.push('/dashboard/registrations')
    },
  })

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this registration? This action cannot be undone.')) return
    
    setIsDeleting(true)
    try {
      await deleteMutation.mutateAsync({ id: registrationId })
    } catch (error) {
      console.error('Failed to delete registration:', error)
      alert('Failed to delete registration')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!registration) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Registration Not Found</h1>
          <p className="text-gray-600 mb-6">The registration you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <Link href="/dashboard/registrations">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Registrations
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Calculate status
  const expiryDate = new Date(registration.expiryDate)
  const today = new Date()
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  const statusConfig = {
    approved: {
      label: 'Approved',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
      iconColor: 'text-green-600',
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800',
      iconColor: 'text-yellow-600',
    },
    expired: {
      label: 'Expired',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-800',
      iconColor: 'text-red-600',
    },
    rejected: {
      label: 'Rejected',
      icon: AlertTriangle,
      color: 'bg-gray-100 text-gray-800',
      iconColor: 'text-gray-600',
    },
  }

  const config = statusConfig[registration.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = config.icon

  // Get council contact info (from seed data structure)
  const getCouncilWebsite = (councilName: string) => {
    const councilUrls: Record<string, string> = {
      'Aberdeen City Council': 'https://www.aberdeencity.gov.uk/services/housing/landlord-registration',
      'City of Edinburgh Council': 'https://www.edinburgh.gov.uk/landlord-registration',
      'Glasgow City Council': 'https://www.glasgow.gov.uk/landlordregistration',
      'Dundee City Council': 'https://www.dundeecity.gov.uk/landlord-registration',
      'Perth and Kinross Council': 'https://www.pkc.gov.uk/landlordregistration',
    }
    return councilUrls[councilName] || `https://www.google.com/search?q=${encodeURIComponent(councilName + ' landlord registration')}`
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/registrations">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Registrations
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {registration.councilArea}
              </h1>
              <p className="text-gray-600">
                Registration #{registration.registrationNumber}
              </p>
            </div>
            
            <Badge className={config.color}>
              <StatusIcon className={`mr-1 h-4 w-4 ${config.iconColor}`} />
              {config.label}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <Link href={`/dashboard/registrations/${registration.id}/edit`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Edit className="mr-2 h-4 w-4" />
              Edit Registration
            </Button>
          </Link>
          
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>

        {/* Expiry Warning */}
        {daysUntilExpiry > 0 && daysUntilExpiry <= 60 && registration.status === 'approved' && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-yellow-900">
                <Clock className="mr-2 h-5 w-5 text-yellow-600" />
                Renewal Required Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-yellow-800 mb-4">
                This registration will expire in <strong>{daysUntilExpiry} days</strong>. Please start the renewal process with {registration.councilArea}.
              </p>
              <div className="flex gap-3">
                <a 
                  href={getCouncilWebsite(registration.councilArea)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit Council Website
                  </Button>
                </a>
                <Link href="/dashboard/registrations/new">
                  <Button size="sm">
                    Add Renewed Registration
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expired Alert */}
        {(daysUntilExpiry < 0 || registration.status === 'expired') && (
          <Card className="mb-6 border-red-500 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-red-900">
                <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
                Registration Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-800 mb-4">
                This registration expired {Math.abs(daysUntilExpiry)} days ago. Operating a rental property without valid registration is illegal in Scotland.
              </p>
              <div className="flex gap-3">
                <a 
                  href={getCouncilWebsite(registration.councilArea)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="destructive" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Renew Now
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Building2 className="mr-2 h-5 w-5 text-blue-600" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">{registration.property.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Postcode</p>
                <p className="font-medium">{registration.property.postcode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Property Type</p>
                <p className="font-medium capitalize">
                  {registration.property.propertyType.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bedrooms</p>
                <p className="font-medium">{registration.property.bedrooms}</p>
              </div>
              <div>
                <Link href={`/dashboard/properties/${registration.property.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Property Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Registration Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                Registration Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Application Date</p>
                <p className="font-medium">
                  {new Date(registration.applicationDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              {registration.approvalDate && (
                <div>
                  <p className="text-sm text-gray-600">Approval Date</p>
                  <p className="font-medium">
                    {new Date(registration.approvalDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Expiry Date</p>
                <p className={`font-medium ${daysUntilExpiry < 0 ? 'text-red-600' : daysUntilExpiry <= 60 ? 'text-yellow-600' : ''}`}>
                  {expiryDate.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              {daysUntilExpiry > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Days Until Expiry</p>
                  <p className={`font-medium text-lg ${
                    daysUntilExpiry <= 60 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {daysUntilExpiry} days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Council Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                Council Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Council Area</p>
                <p className="font-medium">{registration.councilArea}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Registration Number</p>
                <p className="font-medium">{registration.registrationNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Renewal Fee</p>
                <p className="font-medium">£{registration.renewalFee.toFixed(2)}</p>
              </div>
              <div>
                <a 
                  href={getCouncilWebsite(registration.councilArea)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Council Website
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={config.color}>
                  <StatusIcon className={`mr-1 h-3 w-3 ${config.iconColor}`} />
                  {config.label}
                </Badge>
              </div>
              {registration.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {registration.notes}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Added</p>
                <p className="text-sm text-gray-800">
                  {new Date(registration.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              {registration.updatedAt !== registration.createdAt && (
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-sm text-gray-800">
                    {new Date(registration.updatedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Renewal Timeline (for approved registrations) */}
        {registration.status === 'approved' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Clock className="mr-2 h-5 w-5 text-blue-600" />
                Renewal Timeline
              </CardTitle>
              <CardDescription>
                Scottish landlord registrations are valid for 3 years from application date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-32 text-sm text-gray-600">Application</div>
                  <div className="flex-1">
                    <div className="h-2 bg-green-500 rounded"></div>
                  </div>
                  <div className="flex-shrink-0 w-32 text-sm font-medium">
                    {new Date(registration.applicationDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                
                {registration.approvalDate && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-32 text-sm text-gray-600">Approval</div>
                    <div className="flex-1">
                      <div className="h-2 bg-green-500 rounded"></div>
                    </div>
                    <div className="flex-shrink-0 w-32 text-sm font-medium">
                      {new Date(registration.approvalDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-32 text-sm text-gray-600">Expiry</div>
                  <div className="flex-1">
                    <div className={`h-2 rounded ${
                      daysUntilExpiry < 0 ? 'bg-red-500' : daysUntilExpiry <= 60 ? 'bg-yellow-500' : 'bg-gray-300'
                    }`}></div>
                  </div>
                  <div className="flex-shrink-0 w-32 text-sm font-medium">
                    {expiryDate.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {Math.floor((new Date().getTime() - new Date(registration.applicationDate).getTime()) / (1000 * 60 * 60 * 24))}
                      </p>
                      <p className="text-xs text-gray-600">Days Active</p>
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${
                        daysUntilExpiry < 0 ? 'text-red-600' : daysUntilExpiry <= 60 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {daysUntilExpiry > 0 ? daysUntilExpiry : 0}
                      </p>
                      <p className="text-xs text-gray-600">Days Remaining</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {Math.floor(((new Date().getTime() - new Date(registration.applicationDate).getTime()) / (expiryDate.getTime() - new Date(registration.applicationDate).getTime())) * 100)}%
                      </p>
                      <p className="text-xs text-gray-600">Period Elapsed</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
