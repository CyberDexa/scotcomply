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
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Search,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react'

type CertificateStatus = 'valid' | 'expiring' | 'expired' | undefined

export default function CertificatesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CertificateStatus>(undefined)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)

  const { data: certificates, isLoading, refetch } = trpc.certificate.list.useQuery({
    status: statusFilter,
    limit: 50,
  })

  const exportCertificates = trpc.bulk.exportCertificates.useMutation()
  const deleteCertificate = trpc.certificate.delete.useMutation()

  const { data: expiringCertificates } = trpc.certificate.getExpiring.useQuery()

  // Filter certificates by search query
  const filteredCertificates = certificates?.filter((cert) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      cert.certificateType.toLowerCase().includes(searchLower) ||
      cert.providerName.toLowerCase().includes(searchLower) ||
      cert.property.address.toLowerCase().includes(searchLower) ||
      cert.property.postcode.toLowerCase().includes(searchLower)
    )
  })

  const getCertificateIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'expiring':
        return <Clock className="h-5 w-5 text-orange-600" />
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-600">Valid</Badge>
      case 'expiring':
        return <Badge className="bg-orange-600">Expiring Soon</Badge>
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatCertificateType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
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

  const handleSelectAll = () => {
    if (selectedIds.length === filteredCertificates?.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredCertificates?.map((c: any) => c.id) || [])
    }
  }

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleBulkExport = async () => {
    if (selectedIds.length === 0) return
    
    setIsExporting(true)
    try {
      const result = await exportCertificates.mutateAsync({ certificateIds: selectedIds })
      
      const blob = new Blob([result.csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
      window.URL.revokeObjectURL(url)
      
      alert(`Successfully exported ${result.count} certificates`)
    } catch (error: any) {
      alert(`Export failed: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} certificates? This action cannot be undone.`)) {
      return
    }

    try {
      for (const id of selectedIds) {
        await deleteCertificate.mutateAsync({ id })
      }
      
      alert(`Successfully deleted ${selectedIds.length} certificates`)
      setSelectedIds([])
      refetch()
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Certificates</h2>
          <p className="text-muted-foreground">
            Manage property safety certificates and compliance documents
          </p>
        </div>
        <Link href="/dashboard/certificates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Certificate
          </Button>
        </Link>
      </div>

      {/* Expiring Soon Alert */}
      {expiringCertificates && expiringCertificates.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900">
                {expiringCertificates.length} Certificate{expiringCertificates.length > 1 ? 's' : ''} Expiring Soon
              </CardTitle>
            </div>
            <CardDescription className="text-orange-700">
              Action required within the next 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringCertificates.slice(0, 3).map((cert: any) => (
                <div key={cert.id} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-medium">{formatCertificateType(cert.certificateType)}</span>
                    <span className="text-muted-foreground ml-2">
                      - {cert.property.address}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-orange-700 border-orange-700">
                    {getDaysUntilExpiry(cert.expiryDate)} days
                  </Badge>
                </div>
              ))}
              {expiringCertificates.length > 3 && (
                <p className="text-sm text-muted-foreground mt-2">
                  + {expiringCertificates.length - 3} more
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
                placeholder="Search certificates, properties, or providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as CertificateStatus)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {filteredCertificates && filteredCertificates.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-sm font-medium hover:text-blue-600 transition-colors"
                >
                  {selectedIds.length === filteredCertificates.length ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                  {selectedIds.length === filteredCertificates.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedIds.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.length} selected
                  </span>
                )}
              </div>
              
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleBulkExport}
                    disabled={isExporting}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? 'Exporting...' : 'Export'}
                  </Button>
                  <Button
                    onClick={handleBulkDelete}
                    disabled={deleteCertificate.isPending}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificates List */}
      <Card>
        <CardHeader>
          <CardTitle>All Certificates</CardTitle>
          <CardDescription>
            {filteredCertificates?.length || 0} certificate{filteredCertificates?.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading certificates...</p>
              </div>
            </div>
          ) : filteredCertificates && filteredCertificates.length > 0 ? (
            <div className="space-y-4">
              {filteredCertificates.map((cert: any) => (
                <div
                  key={cert.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-all ${selectedIds.includes(cert.id) ? 'ring-2 ring-blue-600' : ''}`}
                >
                  <button
                    onClick={() => handleSelectOne(cert.id)}
                    className="mt-1"
                  >
                    {selectedIds.includes(cert.id) ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400 hover:text-blue-600" />
                    )}
                  </button>
                  <div className="mt-1">{getCertificateIcon(cert.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {formatCertificateType(cert.certificateType)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {cert.property.address}, {cert.property.postcode}
                        </p>
                      </div>
                      {getStatusBadge(cert.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Provider</div>
                        <div className="font-medium">{cert.providerName}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Issue Date</div>
                        <div className="font-medium">{formatDate(cert.issueDate)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Expiry Date</div>
                        <div className="font-medium">{formatDate(cert.expiryDate)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Days Remaining</div>
                        <div className="font-medium">
                          {getDaysUntilExpiry(cert.expiryDate) > 0
                            ? `${getDaysUntilExpiry(cert.expiryDate)} days`
                            : 'Expired'}
                        </div>
                      </div>
                    </div>
                    {cert.notes && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Notes: {cert.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {cert.documentUrl && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Link href={`/dashboard/certificates/${cert.id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No certificates found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first certificate'}
              </p>
              <Link href="/dashboard/certificates/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Certificate
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
