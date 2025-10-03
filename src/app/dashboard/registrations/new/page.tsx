'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'

// Scottish Councils list
const SCOTTISH_COUNCILS = [
  'Aberdeen City Council',
  'Aberdeenshire Council',
  'Angus Council',
  'Argyll and Bute Council',
  'City of Edinburgh Council',
  'Clackmannanshire Council',
  'Comhairle nan Eilean Siar',
  'Dumfries and Galloway Council',
  'Dundee City Council',
  'East Ayrshire Council',
  'East Dunbartonshire Council',
  'East Lothian Council',
  'East Renfrewshire Council',
  'Falkirk Council',
  'Fife Council',
  'Glasgow City Council',
  'Highland Council',
  'Inverclyde Council',
  'Midlothian Council',
  'Moray Council',
  'North Ayrshire Council',
  'North Lanarkshire Council',
  'Orkney Islands Council',
  'Perth and Kinross Council',
  'Renfrewshire Council',
  'Scottish Borders Council',
  'Shetland Islands Council',
  'South Ayrshire Council',
  'South Lanarkshire Council',
  'Stirling Council',
  'West Dunbartonshire Council',
  'West Lothian Council',
]

// Default renewal fees by council (in GBP)
const COUNCIL_FEES: Record<string, number> = {
  'Aberdeen City Council': 88,
  'Aberdeenshire Council': 77,
  'Angus Council': 88,
  'Argyll and Bute Council': 77,
  'City of Edinburgh Council': 89,
  'Clackmannanshire Council': 77,
  'Comhairle nan Eilean Siar': 77,
  'Dumfries and Galloway Council': 77,
  'Dundee City Council': 89,
  'East Ayrshire Council': 77,
  'East Dunbartonshire Council': 77,
  'East Lothian Council': 77,
  'East Renfrewshire Council': 77,
  'Falkirk Council': 89,
  'Fife Council': 77,
  'Glasgow City Council': 90,
  'Highland Council': 77,
  'Inverclyde Council': 77,
  'Midlothian Council': 77,
  'Moray Council': 77,
  'North Ayrshire Council': 77,
  'North Lanarkshire Council': 77,
  'Orkney Islands Council': 77,
  'Perth and Kinross Council': 88,
  'Renfrewshire Council': 77,
  'Scottish Borders Council': 77,
  'Shetland Islands Council': 77,
  'South Ayrshire Council': 77,
  'South Lanarkshire Council': 77,
  'Stirling Council': 77,
  'West Dunbartonshire Council': 77,
  'West Lothian Council': 77,
}

export default function NewRegistrationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    propertyId: '',
    councilArea: '',
    registrationNumber: '',
    applicationDate: new Date().toISOString().split('T')[0],
    approvalDate: '',
    expiryDate: '',
    status: 'pending' as 'pending' | 'approved' | 'expired' | 'rejected',
    renewalFee: 77,
    notes: '',
  })

  // Fetch user's properties
  const { data: propertiesData } = trpc.property.list.useQuery({ limit: 100 })
  const properties = propertiesData?.properties || []

  const createMutation = trpc.registration.create.useMutation({
    onSuccess: () => {
      router.push('/dashboard/registrations')
    },
    onError: (error) => {
      setError(error.message)
      setIsLoading(false)
    },
  })

  const handleCouncilChange = (councilArea: string) => {
    const fee = COUNCIL_FEES[councilArea] || 77
    setFormData({
      ...formData,
      councilArea,
      renewalFee: fee,
    })
  }

  const handlePropertyChange = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId)
    if (property) {
      setFormData({
        ...formData,
        propertyId,
        councilArea: property.councilArea,
        renewalFee: COUNCIL_FEES[property.councilArea] || 77,
      })
    }
  }

  const handleStatusChange = (status: string) => {
    const newFormData = { ...formData, status: status as typeof formData.status }
    
    // If approved, set approval date to today if not set
    if (status === 'approved' && !formData.approvalDate) {
      newFormData.approvalDate = new Date().toISOString().split('T')[0]
    }
    
    setFormData(newFormData)
  }

  const handleApplicationDateChange = (date: string) => {
    // Auto-calculate expiry date (3 years from application)
    const appDate = new Date(date)
    const expiryDate = new Date(appDate)
    expiryDate.setFullYear(expiryDate.getFullYear() + 3)
    
    setFormData({
      ...formData,
      applicationDate: date,
      expiryDate: expiryDate.toISOString().split('T')[0],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!formData.propertyId) {
      setError('Please select a property')
      setIsLoading(false)
      return
    }

    if (!formData.councilArea) {
      setError('Please select a council area')
      setIsLoading(false)
      return
    }

    if (!formData.registrationNumber) {
      setError('Please enter a registration number')
      setIsLoading(false)
      return
    }

    try {
      await createMutation.mutateAsync({
        propertyId: formData.propertyId,
        councilArea: formData.councilArea,
        registrationNumber: formData.registrationNumber,
        applicationDate: new Date(formData.applicationDate),
        approvalDate: formData.approvalDate ? new Date(formData.approvalDate) : undefined,
        expiryDate: new Date(formData.expiryDate),
        status: formData.status,
        renewalFee: formData.renewalFee,
        notes: formData.notes || undefined,
      })
    } catch (err) {
      // Error handled by onError
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/registrations">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Registrations
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Add Landlord Registration
          </h1>
          <p className="text-gray-600">
            Register your property with the local council authority
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Error</h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Registration Details</CardTitle>
              <CardDescription>
                Enter the details of your landlord registration application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Selection */}
              <div className="space-y-2">
                <Label htmlFor="property">Property *</Label>
                <Select
                  value={formData.propertyId}
                  onValueChange={handlePropertyChange}
                  required
                >
                  <SelectTrigger id="property">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No properties available
                      </SelectItem>
                    ) : (
                      properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.address}, {property.postcode}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select the property for this registration
                </p>
              </div>

              {/* Council Area */}
              <div className="space-y-2">
                <Label htmlFor="council">Council Area *</Label>
                <Select
                  value={formData.councilArea}
                  onValueChange={handleCouncilChange}
                  required
                >
                  <SelectTrigger id="council">
                    <SelectValue placeholder="Select council area" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOTTISH_COUNCILS.map((council) => (
                      <SelectItem key={council} value={council}>
                        {council}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Auto-filled from property, or select manually
                </p>
              </div>

              {/* Registration Number */}
              <div className="space-y-2">
                <Label htmlFor="regNumber">Registration Number *</Label>
                <Input
                  id="regNumber"
                  value={formData.registrationNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, registrationNumber: e.target.value })
                  }
                  placeholder="e.g., 123456/789/01234"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the registration number provided by the council
                </p>
              </div>

              {/* Application Date */}
              <div className="space-y-2">
                <Label htmlFor="appDate">Application Date *</Label>
                <Input
                  id="appDate"
                  type="date"
                  value={formData.applicationDate}
                  onChange={(e) => handleApplicationDateChange(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Date when the application was submitted
                </p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                  required
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Current status of the registration
                </p>
              </div>

              {/* Approval Date (conditional) */}
              {(formData.status === 'approved' || formData.approvalDate) && (
                <div className="space-y-2">
                  <Label htmlFor="approvalDate">Approval Date</Label>
                  <Input
                    id="approvalDate"
                    type="date"
                    value={formData.approvalDate}
                    onChange={(e) =>
                      setFormData({ ...formData, approvalDate: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Date when the registration was approved
                  </p>
                </div>
              )}

              {/* Expiry Date */}
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Registration typically expires 3 years from application date
                </p>
              </div>

              {/* Renewal Fee */}
              <div className="space-y-2">
                <Label htmlFor="fee">Renewal Fee (£) *</Label>
                <Input
                  id="fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.renewalFee}
                  onChange={(e) =>
                    setFormData({ ...formData, renewalFee: parseFloat(e.target.value) })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Auto-filled based on council area (typically £77-£90)
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional notes or comments..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-6 flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Registration'}
            </Button>
            <Link href="/dashboard/registrations" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
