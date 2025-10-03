'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Home,
  AlertCircle,
  CheckCircle2,
  Eye,
  Download,
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react'

export default function PropertiesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  
  const { data, isLoading, error, refetch } = trpc.property.list.useQuery({ limit: 50 })
  const exportProperties = trpc.bulk.exportProperties.useMutation()
  const deleteProperty = trpc.property.delete.useMutation()

  const filteredProperties = data?.properties.filter((property) =>
    property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.postcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.councilArea.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      occupied: { variant: 'default' as const, label: 'Occupied' },
      vacant: { variant: 'secondary' as const, label: 'Vacant' },
      notice: { variant: 'destructive' as const, label: 'Notice Period' },
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.vacant
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProperties?.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredProperties?.map(p => p.id) || [])
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
      const result = await exportProperties.mutateAsync({ propertyIds: selectedIds })
      
      // Download CSV
      const blob = new Blob([result.csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
      window.URL.revokeObjectURL(url)
      
      alert(`Successfully exported ${result.count} properties`)
    } catch (error: any) {
      alert(`Export failed: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} properties? This action cannot be undone.`)) {
      return
    }

    try {
      // Delete properties one by one (could be optimized with a bulk delete endpoint)
      for (const id of selectedIds) {
        await deleteProperty.mutateAsync({ id })
      }
      
      alert(`Successfully deleted ${selectedIds.length} properties`)
      setSelectedIds([])
      refetch()
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Properties</h2>
          <p className="text-muted-foreground mt-1">
            Manage your property portfolio and compliance
          </p>
        </div>
        <Link href="/dashboard/properties/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by address, postcode, or council area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {filteredProperties && filteredProperties.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-sm font-medium hover:text-blue-600 transition-colors"
                >
                  {selectedIds.length === filteredProperties.length ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                  {selectedIds.length === filteredProperties.length ? 'Deselect All' : 'Select All'}
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
                    disabled={deleteProperty.isPending}
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

      {/* Properties Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading properties...</p>
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Failed to load properties. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filteredProperties && filteredProperties.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property: any) => (
            <Card key={property.id} className={`hover:shadow-lg transition-all ${selectedIds.includes(property.id) ? 'ring-2 ring-blue-600' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => handleSelectOne(property.id)}
                      className="mt-1"
                    >
                      {selectedIds.includes(property.id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400 hover:text-blue-600" />
                      )}
                    </button>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center">
                        {property.isHMO ? (
                          <Building2 className="mr-2 h-5 w-5 text-orange-600" />
                        ) : (
                          <Home className="mr-2 h-5 w-5 text-blue-600" />
                        )}
                        {property.bedrooms} Bed {property.propertyType}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center mt-1">
                          <MapPin className="mr-1 h-3 w-3" />
                          {property.address}
                        </div>
                        <div className="text-xs mt-1">{property.postcode}</div>
                      </CardDescription>
                    </div>
                  </div>
                  <Badge {...getStatusBadge(property.tenancyStatus)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Council Area</span>
                    <span className="font-medium">{property.councilArea}</span>
                  </div>

                  {property.isHMO && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">HMO Occupancy</span>
                      <Badge variant="outline">{property.hmoOccupancy} persons</Badge>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{property.certificates?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">Certificates</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{property.landlordRegistrations?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">Registrations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{property.hmoLicenses?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">HMO</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Link href={`/dashboard/properties/${property.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No properties found</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              {searchQuery
                ? 'No properties match your search criteria. Try a different search term.'
                : 'Get started by adding your first property to track compliance.'}
            </p>
            <Link href="/dashboard/properties/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {filteredProperties && filteredProperties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{filteredProperties.length}</div>
                <div className="text-sm text-muted-foreground mt-1">Total Properties</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {filteredProperties.filter((p: any) => p.tenancyStatus === 'occupied').length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Occupied</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  {filteredProperties.filter((p: any) => p.isHMO).length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">HMO Properties</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-gray-600">
                  {filteredProperties.reduce((sum: any, p: any) => sum + (p.certificates?.length || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Total Certificates</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
