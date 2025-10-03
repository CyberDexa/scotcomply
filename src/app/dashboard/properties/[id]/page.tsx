'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  FileText, 
  ClipboardCheck,
  Shield,
  Edit,
  Trash2,
  Plus,
  Calendar,
  AlertCircle,
  Wrench
} from 'lucide-react'

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState<'overview' | 'certificates' | 'registrations' | 'hmo' | 'maintenance'>('overview')

  const { data: property, isLoading, error } = trpc.property.getById.useQuery({ id })
  const { data: maintenanceRequests } = trpc.maintenance.list.useQuery({ propertyId: id })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading property details...</p>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground">
                Property not found or you don&apos;t have permission to view it.
              </p>
            <Link href="/dashboard/properties">
              <Button className="mt-4">Back to Properties</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'certificates', label: 'Certificates', icon: FileText, count: property.certificates?.length },
    { id: 'registrations', label: 'Registrations', icon: ClipboardCheck, count: property.landlordRegistrations?.length },
    { id: 'hmo', label: 'HMO Licensing', icon: Shield, count: property.hmoLicenses?.length, hidden: !property.isHMO },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, count: maintenanceRequests?.length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/properties">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-3xl font-bold tracking-tight">
                {property.bedrooms} Bed {property.propertyType}
              </h2>
              {property.isHMO && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  HMO
                </Badge>
              )}
            </div>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4" />
              {property.address}, {property.postcode}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/properties/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="text-red-600 hover:text-red-700"
            onClick={() => {
              if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
                // TODO: Implement delete mutation
                console.log('Delete property:', id)
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-8">
          {tabs.filter(tab => !tab.hidden).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 border-b-2 pb-4 px-1 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <Badge variant="secondary" className="ml-1">{tab.count}</Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Property Type</div>
                  <div className="font-medium capitalize">{property.propertyType}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Bedrooms</div>
                  <div className="font-medium">{property.bedrooms}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Postcode</div>
                  <div className="font-medium">{property.postcode}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tenancy Status</div>
                  <Badge variant={property.tenancyStatus === 'occupied' ? 'default' : 'secondary'}>
                    {property.tenancyStatus}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground mb-2">Council Area</div>
                <div className="font-medium">{property.councilArea}</div>
              </div>
              {property.isHMO && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">HMO Occupancy Limit</div>
                    <div className="font-medium">{property.hmoOccupancy} persons</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Certificates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{property.certificates?.length || 0}</span>
                    <Badge variant={property.certificates && property.certificates.length > 0 ? 'default' : 'secondary'}>
                      {property.certificates && property.certificates.length > 0 ? 'Active' : 'None'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Registrations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{property.landlordRegistrations?.length || 0}</span>
                    <Badge variant={property.landlordRegistrations && property.landlordRegistrations.length > 0 ? 'default' : 'secondary'}>
                      {property.landlordRegistrations && property.landlordRegistrations.length > 0 ? 'Registered' : 'Pending'}
                    </Badge>
                  </div>
                </div>

                {property.isHMO && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">HMO License</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{property.hmoLicenses?.length || 0}</span>
                      <Badge variant={property.hmoLicenses && property.hmoLicenses.length > 0 ? 'default' : 'destructive'}>
                        {property.hmoLicenses && property.hmoLicenses.length > 0 ? 'Licensed' : 'Required'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'certificates' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Certificates</CardTitle>
                <CardDescription>Manage property safety certificates</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Certificate
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {property.certificates && property.certificates.length > 0 ? (
              <div className="space-y-4">
                {property.certificates.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium capitalize">{cert.certificateType.replace('_', ' ')}</div>
                      <div className="text-sm text-muted-foreground">
                        Issued: {new Date(cert.issueDate).toLocaleDateString()} | 
                        Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Provider: {cert.providerName}
                      </div>
                    </div>
                    <Badge variant={cert.status === 'valid' ? 'default' : 'destructive'}>
                      {cert.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No certificates added yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'registrations' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Landlord Registrations</CardTitle>
                <CardDescription>Council registration status</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Registration
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {property.landlordRegistrations && property.landlordRegistrations.length > 0 ? (
              <div className="space-y-4">
                {property.landlordRegistrations.map((reg) => (
                  <div key={reg.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{reg.councilArea}</div>
                      <Badge variant={reg.status === 'approved' ? 'default' : 'secondary'}>
                        {reg.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Registration: {reg.registrationNumber}</div>
                      <div>Expires: {new Date(reg.expiryDate).toLocaleDateString()}</div>
                      <div>Renewal Fee: £{reg.renewalFee}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No registrations added yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'hmo' && property.isHMO && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>HMO Licensing</CardTitle>
                <CardDescription>Houses in Multiple Occupation licensing</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add HMO License
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {property.hmoLicenses && property.hmoLicenses.length > 0 ? (
              <div className="space-y-4">
                {property.hmoLicenses.map((hmo) => (
                  <div key={hmo.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium">License {hmo.licenseNumber}</div>
                      <Badge variant={hmo.status === 'approved' ? 'default' : 'secondary'}>
                        {hmo.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Occupancy Limit</div>
                        <div className="font-medium">{hmo.occupancyLimit} persons</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Annual Fee</div>
                        <div className="font-medium">£{hmo.annualFee}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Expires</div>
                        <div className="font-medium">{new Date(hmo.expiryDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Fire Safety</div>
                        <Badge variant={hmo.fireSafetyCompliant ? 'default' : 'destructive'}>
                          {hmo.fireSafetyCompliant ? 'Compliant' : 'Action Needed'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">No HMO license added yet</p>
                <p className="text-xs text-muted-foreground">
                  HMO properties require licensing from the local council
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'maintenance' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Maintenance Requests</CardTitle>
                <CardDescription>Track property maintenance issues</CardDescription>
              </div>
              <Link href={`/dashboard/maintenance/new?propertyId=${id}`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Request
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {maintenanceRequests && maintenanceRequests.length > 0 ? (
              <div className="space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Open Requests</div>
                    <div className="text-2xl font-bold">
                      {maintenanceRequests.filter((r: any) => ['SUBMITTED', 'ACKNOWLEDGED', 'SCHEDULED', 'IN_PROGRESS'].includes(r.status)).length}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Emergency</div>
                    <div className="text-2xl font-bold text-red-600">
                      {maintenanceRequests.filter((r: any) => r.priority === 'EMERGENCY' && r.status !== 'COMPLETED').length}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Completed</div>
                    <div className="text-2xl font-bold text-green-600">
                      {maintenanceRequests.filter((r: any) => r.status === 'COMPLETED').length}
                    </div>
                  </div>
                </div>

                {/* Recent Requests */}
                <div className="space-y-3">
                  {maintenanceRequests.slice(0, 5).map((request: any) => {
                    const getPriorityColor = (priority: string) => {
                      switch (priority) {
                        case 'EMERGENCY': return 'destructive'
                        case 'HIGH': return 'orange'
                        case 'MEDIUM': return 'yellow'
                        case 'LOW': return 'secondary'
                        default: return 'secondary'
                      }
                    }
                    
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'COMPLETED': return 'default'
                        case 'IN_PROGRESS': return 'blue'
                        case 'SCHEDULED': return 'purple'
                        case 'SUBMITTED': return 'secondary'
                        case 'CANCELLED': return 'destructive'
                        default: return 'secondary'
                      }
                    }

                    return (
                      <div key={request.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Wrench className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{request.title}</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {request.description}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Badge variant={getPriorityColor(request.priority) as any}>
                              {request.priority}
                            </Badge>
                            <Badge variant={getStatusColor(request.status) as any}>
                              {request.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                            <div className="capitalize">
                              {request.category.replace('_', ' ').toLowerCase()}
                            </div>
                            {request.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {request.location}
                              </div>
                            )}
                          </div>
                          <Link href={`/dashboard/maintenance/${request.id}`}>
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {maintenanceRequests.length > 5 && (
                  <div className="text-center pt-4">
                    <Link href={`/dashboard/maintenance?propertyId=${id}`}>
                      <Button variant="outline">
                        View All {maintenanceRequests.length} Requests
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">No maintenance requests yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Track and manage property maintenance issues here
                </p>
                <Link href={`/dashboard/maintenance/new?propertyId=${id}`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Request
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
