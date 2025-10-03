'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Loader2 } from 'lucide-react'

const SCOTTISH_COUNCILS = [
  'Aberdeen City Council',
  'Aberdeenshire Council',
  'Angus Council',
  'Argyll and Bute Council',
  'City of Edinburgh Council',
  'Clackmannanshire Council',
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
  'Western Isles Council (Comhairle nan Eilean Siar)',
]

const PROPERTY_TYPES = ['flat', 'house', 'bungalow', 'maisonette', 'studio', 'other']

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  // Fetch existing property data
  const { data: property, isLoading: isLoadingProperty } = trpc.property.getById.useQuery({ id })

  const [formData, setFormData] = useState({
    address: '',
    postcode: '',
    councilArea: '',
    propertyType: 'flat' as string,
    bedrooms: 1,
    isHMO: false,
    hmoOccupancy: null as number | null,
  })

  // Populate form when property data loads
  useEffect(() => {
    if (property) {
      setFormData({
        address: property.address,
        postcode: property.postcode,
        councilArea: property.councilArea,
        propertyType: property.propertyType,
        bedrooms: property.bedrooms,
        isHMO: property.isHMO,
        hmoOccupancy: property.hmoOccupancy,
      })
    }
  }, [property])

  const updateMutation = trpc.property.update.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/properties/${id}`)
    },
    onError: (error) => {
      alert('Error updating property: ' + error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.address.trim()) {
      alert('Please enter a property address')
      return
    }
    if (!formData.postcode.trim()) {
      alert('Please enter a postcode')
      return
    }
    if (!formData.councilArea) {
      alert('Please select a council area')
      return
    }
    if (formData.bedrooms < 1) {
      alert('Bedrooms must be at least 1')
      return
    }
    if (formData.isHMO && (!formData.hmoOccupancy || formData.hmoOccupancy < 3)) {
      alert('HMO properties must have an occupancy of at least 3 persons')
      return
    }

    updateMutation.mutate({
      id,
      address: formData.address,
      postcode: formData.postcode.toUpperCase(),
      councilArea: formData.councilArea,
      propertyType: formData.propertyType as 'flat' | 'house' | 'bungalow' | 'other',
      bedrooms: formData.bedrooms,
      isHMO: formData.isHMO,
      hmoOccupancy: formData.isHMO && formData.hmoOccupancy ? formData.hmoOccupancy : undefined,
    })
  }

  if (isLoadingProperty) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading property...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">Property not found</p>
          <Link href="/dashboard/properties">
            <Button>Back to Properties</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/properties/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Property</h2>
          <p className="text-muted-foreground">Update property details and settings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
          <CardDescription>
            Update the details for this property
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Property Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street, Edinburgh"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode *</Label>
                  <Input
                    id="postcode"
                    value={formData.postcode}
                    onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                    placeholder="EH1 1AA"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="councilArea">Council Area *</Label>
                  <Select
                    value={formData.councilArea}
                    onValueChange={(value) => setFormData({ ...formData, councilArea: value })}
                    required
                  >
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Number of Bedrooms *</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="1"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isHMO">House in Multiple Occupation (HMO)</Label>
                    <p className="text-sm text-muted-foreground">
                      Property with 3 or more unrelated tenants
                    </p>
                  </div>
                  <Switch
                    id="isHMO"
                    checked={formData.isHMO}
                    onCheckedChange={(checked) => 
                      setFormData({ 
                        ...formData, 
                        isHMO: checked,
                        hmoOccupancy: checked ? (formData.hmoOccupancy || 3) : null
                      })
                    }
                  />
                </div>

                {formData.isHMO && (
                  <div className="space-y-2 pl-4 border-l-2 border-primary">
                    <Label htmlFor="hmoOccupancy">Maximum Occupancy *</Label>
                    <Input
                      id="hmoOccupancy"
                      type="number"
                      min="3"
                      value={formData.hmoOccupancy || 3}
                      onChange={(e) => setFormData({ ...formData, hmoOccupancy: parseInt(e.target.value) || 3 })}
                      placeholder="Maximum number of occupants"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      HMO properties require licensing from your local council
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {updateMutation.isPending ? 'Updating...' : 'Update Property'}
              </Button>
              <Link href={`/dashboard/properties/${id}`} className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
