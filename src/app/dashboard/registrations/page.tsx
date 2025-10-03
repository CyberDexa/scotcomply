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
  Search,
  Building2,
  Download,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react'

type RegistrationStatus = 'pending' | 'approved' | 'expired' | 'rejected' | undefined

export default function RegistrationsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus>(undefined)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)

  const { data: registrations, isLoading, refetch } = trpc.registration.list.useQuery({
    status: statusFilter,
    limit: 50,
  })

  const exportRegistrations = trpc.bulk.exportRegistrations.useMutation()
  const deleteRegistration = trpc.registration.delete.useMutation()

  const { data: expiringRegistrations } = trpc.registration.getExpiring.useQuery()

  // Filter registrations by search query
  const filteredRegistrations = registrations?.filter((reg: any) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      reg.registrationNumber.toLowerCase().includes(searchLower) ||
      reg.councilArea.toLowerCase().includes(searchLower) ||
      reg.property.address.toLowerCase().includes(searchLower) ||
      reg.property.postcode.toLowerCase().includes(searchLower)
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

  const handleSelectAll = () => {
    if (selectedIds.length === filteredRegistrations?.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredRegistrations?.map((r: any) => r.id) || [])
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
      const result = await exportRegistrations.mutateAsync({ registrationIds: selectedIds })
      
      const blob = new Blob([result.csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
      window.URL.revokeObjectURL(url)
      
      alert(`Successfully exported ${result.count} registrations`)
    } catch (error: any) {
      alert(`Export failed: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} registrations? This action cannot be undone.`)) {
      return
    }

    try {
      for (const id of selectedIds) {
        await deleteRegistration.mutateAsync({ id })
      }
      
      alert(`Successfully deleted ${selectedIds.length} registrations`)
      setSelectedIds([])
      refetch()
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`)
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Landlord Registrations</h1>
            <p className="text-gray-600 mt-1">
              Manage your landlord registration applications across all council areas
            </p>
          </div>
          <Link href="/dashboard/registrations/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Registration
            </Button>
          </Link>
        </div>

        {/* Expiring Soon Alert */}
        {expiringRegistrations && expiringRegistrations.length > 0 && (
          <Card className="border-yellow-500 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-yellow-900">
                <Clock className="mr-2 h-5 w-5 text-yellow-600" />
                {expiringRegistrations.length} Registration{expiringRegistrations.length !== 1 ? 's' : ''} Expiring Soon
              </CardTitle>
              <CardDescription className="text-yellow-800">
                These registrations will expire within the next 60 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expiringRegistrations.slice(0, 3).map((reg: any) => (
                  <div key={reg.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-900">
                        {reg.councilArea} - {reg.property.address}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-yellow-700 border-yellow-700">
                      {getDaysUntilExpiry(reg.expiryDate)} days
                    </Badge>
                  </div>
                ))}
                {expiringRegistrations.length > 3 && (
                  <p className="text-sm text-yellow-700 mt-2">
                    + {expiringRegistrations.length - 3} more
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
                  placeholder="Search by registration number, council, or property..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => 
                  setStatusFilter(value === 'all' ? undefined : value as RegistrationStatus)
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

        {/* Bulk Actions Toolbar */}
        {filteredRegistrations && filteredRegistrations.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-sm font-medium hover:text-blue-600 transition-colors"
                  >
                    {selectedIds.length === filteredRegistrations.length ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                    {selectedIds.length === filteredRegistrations.length ? 'Deselect All' : 'Select All'}
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
                      disabled={deleteRegistration.isPending}
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

        {/* Registrations List */}
        <Card>
          <CardHeader>
            <CardTitle>All Registrations</CardTitle>
            <CardDescription>
              {filteredRegistrations?.length || 0} registration{filteredRegistrations?.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading registrations...</p>
                </div>
              </div>
            ) : filteredRegistrations && filteredRegistrations.length > 0 ? (
              <div className="space-y-4">
                {filteredRegistrations.map((reg: any) => (
                  <div
                    key={reg.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-all ${selectedIds.includes(reg.id) ? 'ring-2 ring-blue-600' : ''}`}
                  >
                    <button
                      onClick={() => handleSelectOne(reg.id)}
                      className="mt-1"
                    >
                      {selectedIds.includes(reg.id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400 hover:text-blue-600" />
                      )}
                    </button>
                    <div className="mt-1">{getStatusIcon(reg.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {reg.councilArea} Registration
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {reg.property.address}, {reg.property.postcode}
                          </p>
                        </div>
                        {getStatusBadge(reg.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Registration #</div>
                          <div className="font-medium">{reg.registrationNumber}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Application Date</div>
                          <div className="font-medium">{formatDate(reg.applicationDate)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Expiry Date</div>
                          <div className="font-medium">{formatDate(reg.expiryDate)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Days Remaining</div>
                          <div className={`font-medium ${
                            getDaysUntilExpiry(reg.expiryDate) < 0 
                              ? 'text-red-600' 
                              : getDaysUntilExpiry(reg.expiryDate) <= 60 
                              ? 'text-yellow-600' 
                              : 'text-green-600'
                          }`}>
                            {getDaysUntilExpiry(reg.expiryDate) > 0
                              ? `${getDaysUntilExpiry(reg.expiryDate)} days`
                              : 'Expired'}
                          </div>
                        </div>
                      </div>
                      {reg.notes && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Notes: {reg.notes}
                        </div>
                      )}
                    </div>
                    <Link href={`/dashboard/registrations/${reg.id}`}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No registrations found
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || statusFilter
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first landlord registration'}
                </p>
                <Link href="/dashboard/registrations/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Registration
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
