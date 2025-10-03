'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save } from 'lucide-react'

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
  'Na h-Eileanan Siar Council',
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

export default function NewPropertyPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const createProperty = trpc.property.create.useMutation({
    onSuccess: () => {
      router.push('/dashboard/properties')
      router.refresh()
    },
    onError: (error) => {
      setError(error.message)
      setIsSubmitting(false)
    },
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    const data = {
      address: formData.get('address') as string,
      postcode: (formData.get('postcode') as string).toUpperCase(),
      councilArea: formData.get('councilArea') as string,
      propertyType: formData.get('propertyType') as 'flat' | 'house' | 'bungalow' | 'other',
      bedrooms: parseInt(formData.get('bedrooms') as string),
      isHMO: formData.get('isHMO') === 'true',
      hmoOccupancy: formData.get('isHMO') === 'true' 
        ? parseInt(formData.get('hmoOccupancy') as string)
        : undefined,
    }

    createProperty.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/properties">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add New Property</h2>
          <p className="text-muted-foreground mt-1">
            Enter property details to start tracking compliance
          </p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
          <CardDescription>
            Provide the basic details for this property
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">
                Property Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                name="address"
                placeholder="123 Main Street, Edinburgh"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Postcode */}
            <div className="space-y-2">
              <Label htmlFor="postcode">
                Postcode <span className="text-red-500">*</span>
              </Label>
              <Input
                id="postcode"
                name="postcode"
                placeholder="EH1 2NG"
                required
                disabled={isSubmitting}
                className="uppercase"
              />
            </div>

            {/* Council Area */}
            <div className="space-y-2">
              <Label htmlFor="councilArea">
                Council Area <span className="text-red-500">*</span>
              </Label>
              <select
                id="councilArea"
                name="councilArea"
                required
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a council...</option>
                {SCOTTISH_COUNCILS.map((council) => (
                  <option key={council} value={council}>
                    {council}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Property Type */}
              <div className="space-y-2">
                <Label htmlFor="propertyType">
                  Property Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="propertyType"
                  name="propertyType"
                  required
                  disabled={isSubmitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select type...</option>
                  <option value="flat">Flat</option>
                  <option value="house">House</option>
                  <option value="bungalow">Bungalow</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Bedrooms */}
              <div className="space-y-2">
                <Label htmlFor="bedrooms">
                  Number of Bedrooms <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  min="0"
                  max="20"
                  required
                  disabled={isSubmitting}
                  placeholder="3"
                />
              </div>
            </div>

            {/* HMO Status */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="isHMO">House in Multiple Occupation (HMO)</Label>
                <select
                  id="isHMO"
                  name="isHMO"
                  disabled={isSubmitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onChange={(e) => {
                    const hmoOccupancy = document.getElementById('hmoOccupancy') as HTMLInputElement
                    if (hmoOccupancy) {
                      hmoOccupancy.disabled = e.target.value !== 'true'
                      if (e.target.value !== 'true') {
                        hmoOccupancy.value = ''
                      }
                    }
                  }}
                >
                  <option value="false">No - Standard Residential Property</option>
                  <option value="true">Yes - HMO Property</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Properties with 3 or more unrelated tenants typically require HMO licensing
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hmoOccupancy">Maximum Occupancy (if HMO)</Label>
                <Input
                  id="hmoOccupancy"
                  name="hmoOccupancy"
                  type="number"
                  min="3"
                  max="50"
                  disabled={true}
                  placeholder="e.g., 4"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Property
                  </>
                )}
              </Button>
              <Link href="/dashboard/properties">
                <Button type="button" variant="outline" disabled={isSubmitting}>
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
