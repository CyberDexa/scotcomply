'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Shield, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

// Scottish councils with HMO licensing
const SCOTTISH_COUNCILS = [
  'Aberdeen City',
  'Aberdeenshire',
  'Angus',
  'Argyll and Bute',
  'City of Edinburgh',
  'Clackmannanshire',
  'Dumfries and Galloway',
  'Dundee City',
  'East Ayrshire',
  'East Dunbartonshire',
  'East Lothian',
  'East Renfrewshire',
  'Falkirk',
  'Fife',
  'Glasgow City',
  'Highland',
  'Inverclyde',
  'Midlothian',
  'Moray',
  'North Ayrshire',
  'North Lanarkshire',
  'Orkney Islands',
  'Perth and Kinross',
  'Renfrewshire',
  'Scottish Borders',
  'Shetland Islands',
  'South Ayrshire',
  'South Lanarkshire',
  'Stirling',
  'West Dunbartonshire',
  'West Lothian',
  'Western Isles',
]

// Council-specific annual fees (approximate)
const COUNCIL_FEES: Record<string, number> = {
  'City of Edinburgh': 1095,
  'Glasgow City': 920,
  'Aberdeen City': 890,
  'Dundee City': 850,
  'Fife': 795,
  'Highland': 750,
  'Perth and Kinross': 825,
  'Stirling': 780,
  'Falkirk': 765,
  'Renfrewshire': 810,
  'North Lanarkshire': 795,
  'South Lanarkshire': 795,
  'West Lothian': 750,
  'East Lothian': 730,
  'Midlothian': 715,
  'Angus': 695,
  'Clackmannanshire': 680,
  'East Ayrshire': 665,
  'East Dunbartonshire': 850,
  'East Renfrewshire': 825,
  'Inverclyde': 745,
  'Moray': 700,
  'North Ayrshire': 720,
  'Scottish Borders': 685,
  'South Ayrshire': 710,
  'West Dunbartonshire': 755,
  'Aberdeenshire': 720,
  'Argyll and Bute': 695,
  'Dumfries and Galloway': 675,
  'Orkney Islands': 650,
  'Shetland Islands': 650,
  'Western Isles': 625,
}

export default function NewHMOLicensePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [propertyId, setPropertyId] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [councilArea, setCouncilArea] = useState('')
  const [annualFee, setAnnualFee] = useState<number | ''>('')
  const [occupancyLimit, setOccupancyLimit] = useState<number | ''>('')
  const [status, setStatus] = useState<'pending' | 'approved' | 'expired' | 'rejected'>('pending')
  const [fireSafetyCompliant, setFireSafetyCompliant] = useState(false)
  const [applicationDate, setApplicationDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [approvalDate, setApprovalDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [lastInspectionDate, setLastInspectionDate] = useState('')
  const [notes, setNotes] = useState('')

  // Fetch properties (HMO only)
  const { data: propertiesData, isLoading: loadingProperties } = trpc.property.list.useQuery({
    limit: 100,
  })

  // Get HMO properties only
  const hmoProperties = propertiesData?.properties?.filter((p: { isHMO: boolean }) => p.isHMO) || []

  // Mutation
  const createMutation = trpc.hmo.create.useMutation({
    onSuccess: () => {
      router.push('/dashboard/hmo')
    },
    onError: (err) => {
      setError(err.message)
      setIsSubmitting(false)
    },
  })

  // Handle property selection
  const handlePropertyChange = (propertyId: string) => {
    setPropertyId(propertyId)
    const property = hmoProperties.find((p: { id: string }) => p.id === propertyId)
    if (property) {
      // Auto-fill council area from property
      const council = SCOTTISH_COUNCILS.find(
        (c) => c.toLowerCase() === (property as { councilArea?: string }).councilArea?.toLowerCase()
      )
      if (council) {
        setCouncilArea(council)
        // Auto-fill annual fee
        setAnnualFee(COUNCIL_FEES[council] || 750)
      }
    }
  }

  // Handle council change
  const handleCouncilChange = (council: string) => {
    setCouncilArea(council)
    // Auto-fill annual fee
    setAnnualFee(COUNCIL_FEES[council] || 750)
  }

  // Handle application date change
  const handleApplicationDateChange = (date: string) => {
    setApplicationDate(date)
    // Auto-calculate expiry (5 years from application)
    if (date) {
      const appDate = new Date(date)
      appDate.setFullYear(appDate.getFullYear() + 5)
      setExpiryDate(appDate.toISOString().split('T')[0])
    }
  }

  // Handle status change
  const handleStatusChange = (newStatus: 'pending' | 'approved' | 'expired' | 'rejected') => {
    setStatus(newStatus)
    // If approved and no approval date set, set to today
    if (newStatus === 'approved' && !approvalDate) {
      setApprovalDate(new Date().toISOString().split('T')[0])
    }
  }

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    // Validation
    if (!propertyId) {
      setError('Please select a property')
      setIsSubmitting(false)
      return
    }
    if (!licenseNumber) {
      setError('Please enter a license number')
      setIsSubmitting(false)
      return
    }
    if (!councilArea) {
      setError('Please select a council area')
      setIsSubmitting(false)
      return
    }
    if (!occupancyLimit || occupancyLimit < 3) {
      setError('Occupancy limit must be at least 3 for HMO properties')
      setIsSubmitting(false)
      return
    }
    if (annualFee === '' || annualFee < 0) {
      setError('Please enter a valid annual fee')
      setIsSubmitting(false)
      return
    }

    try {
      await createMutation.mutateAsync({
        propertyId,
        licenseNumber,
        councilArea,
        annualFee: Number(annualFee),
        occupancyLimit: Number(occupancyLimit),
        status,
        fireSafetyCompliant,
        applicationDate: new Date(applicationDate),
        approvalDate: approvalDate ? new Date(approvalDate) : undefined,
        expiryDate: new Date(expiryDate),
        lastInspectionDate: lastInspectionDate ? new Date(lastInspectionDate) : undefined,
        notes: notes || undefined,
      })
    } catch (err) {
      // Error handled by mutation
      console.error(err)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/hmo">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add HMO License</h1>
            <p className="text-gray-600 mt-1">
              Register a House in Multiple Occupation license
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="border-red-500 bg-red-50">
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
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                HMO License Details
              </CardTitle>
              <CardDescription>
                Enter the details of your HMO license application or approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Selection */}
              <div className="space-y-2">
                <Label htmlFor="property">Property *</Label>
                <Select
                  value={propertyId}
                  onValueChange={handlePropertyChange}
                  disabled={loadingProperties}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property..." />
                  </SelectTrigger>
                  <SelectContent>
                    {hmoProperties.length > 0 ? (
                      hmoProperties.map((property: {
                        id: string
                        address: string
                        postcode: string
                        bedrooms: number
                      }) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.address}, {property.postcode} ({property.bedrooms} bedrooms)
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground">
                        No HMO properties found. Please mark properties as HMO first.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only properties marked as HMO are shown
                </p>
              </div>

              {/* License Number */}
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number *</Label>
                <Input
                  id="licenseNumber"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g., HMO/2024/12345"
                  required
                />
              </div>

              {/* Council Area & Annual Fee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="council">Council Area *</Label>
                  <Select value={councilArea} onValueChange={handleCouncilChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select council..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SCOTTISH_COUNCILS.map((council) => (
                        <SelectItem key={council} value={council}>
                          {council}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualFee">Annual Fee (£) *</Label>
                  <Input
                    id="annualFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={annualFee}
                    onChange={(e) => setAnnualFee(e.target.value ? Number(e.target.value) : '')}
                    placeholder="750.00"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-filled based on council
                  </p>
                </div>
              </div>

              {/* Occupancy Limit */}
              <div className="space-y-2">
                <Label htmlFor="occupancyLimit">Maximum Occupancy *</Label>
                <Input
                  id="occupancyLimit"
                  type="number"
                  min="3"
                  value={occupancyLimit}
                  onChange={(e) => setOccupancyLimit(e.target.value ? Number(e.target.value) : '')}
                  placeholder="5"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 3 people for HMO properties
                </p>
              </div>

              {/* Fire Safety Compliance */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fireSafety"
                  checked={fireSafetyCompliant}
                  onCheckedChange={(checked) => setFireSafetyCompliant(checked as boolean)}
                />
                <Label
                  htmlFor="fireSafety"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Fire safety compliant
                </Label>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">License Status *</Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    handleStatusChange(value as 'pending' | 'approved' | 'expired' | 'rejected')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="applicationDate">Application Date *</Label>
                  <Input
                    id="applicationDate"
                    type="date"
                    value={applicationDate}
                    onChange={(e) => handleApplicationDateChange(e.target.value)}
                    required
                  />
                </div>
                {status === 'approved' && (
                  <div className="space-y-2">
                    <Label htmlFor="approvalDate">Approval Date</Label>
                    <Input
                      id="approvalDate"
                      type="date"
                      value={approvalDate}
                      onChange={(e) => setApprovalDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-calculated (5 years from application)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastInspection">Last Inspection Date</Label>
                  <Input
                    id="lastInspection"
                    type="date"
                    value={lastInspectionDate}
                    onChange={(e) => setLastInspectionDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes or requirements..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end mt-6">
            <Link href="/dashboard/hmo">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Create HMO License
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
