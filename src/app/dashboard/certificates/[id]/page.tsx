'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  Building2,
  User,
  Phone,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'

export default function CertificateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const certificateId = params.id as string
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const { data: certificate, isLoading } = trpc.certificate.getById.useQuery({ id: certificateId })
  const deleteMutation = trpc.certificate.delete.useMutation({
    onSuccess: () => {
      router.push('/dashboard/certificates')
    },
  })

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this certificate?')) return
    
    setIsDeleting(true)
    try {
      await deleteMutation.mutateAsync({ id: certificateId })
    } catch (error) {
      console.error('Failed to delete certificate:', error)
      alert('Failed to delete certificate')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = async () => {
    if (!certificate?.documentUrl) return
    
    setIsDownloading(true)
    try {
      // Import getSignedUrl dynamically to avoid SSR issues
      const { getSignedUrl } = await import('@/lib/storage')
      const signedUrl = await getSignedUrl(certificate.documentUrl)
      
      // Open in new tab or trigger download
      window.open(signedUrl, '_blank')
    } catch (error) {
      console.error('Failed to download certificate:', error)
      alert('Failed to download certificate')
    } finally {
      setIsDownloading(false)
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

  if (!certificate) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Certificate Not Found</h1>
          <p className="text-gray-600 mb-6">The certificate you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <Link href="/dashboard/certificates">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Certificates
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Calculate status
  const expiryDate = new Date(certificate.expiryDate)
  const today = new Date()
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  let status: 'valid' | 'expiring' | 'expired' = 'valid'
  if (daysUntilExpiry < 0) status = 'expired'
  else if (daysUntilExpiry <= 30) status = 'expiring'

  const statusConfig = {
    valid: {
      label: 'Valid',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
      iconColor: 'text-green-600',
    },
    expiring: {
      label: `Expires in ${daysUntilExpiry} days`,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800',
      iconColor: 'text-yellow-600',
    },
    expired: {
      label: `Expired ${Math.abs(daysUntilExpiry)} days ago`,
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-800',
      iconColor: 'text-red-600',
    },
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/certificates">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Certificates
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {certificate.certificateType.replace(/_/g, ' ')}
              </h1>
              <p className="text-gray-600">
                {certificate.property.address}, {certificate.property.postcode}
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
          <Button 
            onClick={handleDownload}
            disabled={isDownloading || !certificate.documentUrl}
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? 'Downloading...' : 'Download Certificate'}
          </Button>
          
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>

        {/* Certificate Details */}
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
                <p className="font-medium">{certificate.property.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Postcode</p>
                <p className="font-medium">{certificate.property.postcode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Property Type</p>
                <p className="font-medium capitalize">
                  {certificate.property.propertyType.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <Link href={`/dashboard/properties/${certificate.property.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Property Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Certificate Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                Certificate Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Certificate Type</p>
                <p className="font-medium capitalize">
                  {certificate.certificateType.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Issue Date</p>
                <p className="font-medium">
                  {new Date(certificate.issueDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expiry Date</p>
                <p className={`font-medium ${status === 'expired' ? 'text-red-600' : ''}`}>
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
                    daysUntilExpiry <= 30 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {daysUntilExpiry} days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Provider Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="mr-2 h-5 w-5 text-blue-600" />
                Provider Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Provider Name</p>
                <p className="font-medium">{certificate.providerName}</p>
              </div>
              {certificate.providerContact && (
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <p className="font-medium flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-gray-400" />
                    {certificate.providerContact}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                Document Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {certificate.documentUrl && (
                <div>
                  <p className="text-sm text-gray-600">Document</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isDownloading ? 'Loading...' : 'View Document'}
                  </Button>
                </div>
              )}
              {certificate.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {certificate.notes}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Added</p>
                <p className="text-sm text-gray-800">
                  {new Date(certificate.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert for Expiring/Expired */}
        {status !== 'valid' && (
          <Card className={`mt-6 border-2 ${
            status === 'expired' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <AlertTriangle className={`mr-2 h-5 w-5 ${
                  status === 'expired' ? 'text-red-600' : 'text-yellow-600'
                }`} />
                {status === 'expired' ? 'Certificate Expired' : 'Certificate Expiring Soon'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                {status === 'expired'
                  ? 'This certificate has expired and needs to be renewed immediately to maintain compliance.'
                  : 'This certificate will expire soon. Please arrange for renewal to maintain compliance.'}
              </p>
              <Link href="/dashboard/certificates/new">
                <Button variant={status === 'expired' ? 'destructive' : 'default'}>
                  Upload Renewed Certificate
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
