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
import { ArrowLeft, Upload, FileText, Loader2 } from 'lucide-react'

const CERTIFICATE_TYPES = [
  { value: 'gas_safety', label: 'Gas Safety Certificate', validityYears: 1 },
  { value: 'eicr', label: 'EICR (Electrical)', validityYears: 5 },
  { value: 'epc', label: 'EPC (Energy Performance)', validityYears: 10 },
  { value: 'pat', label: 'PAT Testing', validityYears: 1 },
  { value: 'fire_safety', label: 'Fire Safety Certificate', validityYears: 1 },
  { value: 'legionella', label: 'Legionella Risk Assessment', validityYears: 2 },
  { value: 'other', label: 'Other Certificate', validityYears: 1 },
]

export default function NewCertificatePage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    propertyId: '',
    certificateType: 'gas_safety',
    issueDate: '',
    expiryDate: '',
    providerName: '',
    providerContact: '',
    notes: '',
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Fetch user's properties for selection
  const { data: propertiesData, isLoading: loadingProperties } = trpc.property.list.useQuery({
    limit: 100,
  })

  const createMutation = trpc.certificate.create.useMutation({
    onSuccess: () => {
      router.push('/dashboard/certificates')
    },
    onError: (error) => {
      alert('Error creating certificate: ' + error.message)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        alert('Only PDF, JPG, and PNG files are allowed')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleCertificateTypeChange = (value: string) => {
    const certType = CERTIFICATE_TYPES.find((ct) => ct.value === value)
    setFormData({ ...formData, certificateType: value })

    // Auto-calculate expiry date if issue date is set
    if (formData.issueDate && certType) {
      const issueDate = new Date(formData.issueDate)
      const expiryDate = new Date(issueDate)
      expiryDate.setFullYear(expiryDate.getFullYear() + certType.validityYears)
      setFormData({
        ...formData,
        certificateType: value,
        expiryDate: expiryDate.toISOString().split('T')[0],
      })
    }
  }

  const handleIssueDateChange = (date: string) => {
    const certType = CERTIFICATE_TYPES.find((ct) => ct.value === formData.certificateType)
    setFormData({ ...formData, issueDate: date })

    // Auto-calculate expiry date
    if (date && certType) {
      const issueDate = new Date(date)
      const expiryDate = new Date(issueDate)
      expiryDate.setFullYear(expiryDate.getFullYear() + certType.validityYears)
      setFormData({
        ...formData,
        issueDate: date,
        expiryDate: expiryDate.toISOString().split('T')[0],
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.propertyId) {
      alert('Please select a property')
      return
    }
    if (!formData.issueDate) {
      alert('Please enter an issue date')
      return
    }
    if (!formData.expiryDate) {
      alert('Please enter an expiry date')
      return
    }
    if (!formData.providerName.trim()) {
      alert('Please enter the provider name')
      return
    }

    // For now, create without file upload (will add S3 integration later)
    // TODO: Upload file to S3 and get URL
    let documentUrl = undefined
    if (selectedFile) {
      // Placeholder - will implement S3 upload in next step
      console.log('File to upload:', selectedFile.name)
      documentUrl = undefined // Will be S3 URL
    }

    createMutation.mutate({
      propertyId: formData.propertyId,
      certificateType: formData.certificateType as any,
      issueDate: new Date(formData.issueDate),
      expiryDate: new Date(formData.expiryDate),
      providerName: formData.providerName,
      certificateNumber: formData.providerContact || undefined,
      fileUrl: documentUrl,
      notes: formData.notes || undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/certificates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add Certificate</h2>
          <p className="text-muted-foreground">Upload a new safety certificate</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Certificate Details</CardTitle>
          <CardDescription>
            Upload safety certificates for your properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Selection */}
            <div className="space-y-2">
              <Label htmlFor="propertyId">Property *</Label>
              {loadingProperties ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading properties...
                </div>
              ) : propertiesData?.properties.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No properties found.{' '}
                  <Link href="/dashboard/properties/new" className="text-primary underline">
                    Add a property first
                  </Link>
                </div>
              ) : (
                <Select
                  value={formData.propertyId}
                  onValueChange={(value: string) => setFormData({ ...formData, propertyId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property..." />
                  </SelectTrigger>
                  <SelectContent>
                    {propertiesData?.properties.map((property: any) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.address}, {property.postcode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Certificate Type */}
            <div className="space-y-2">
              <Label htmlFor="certificateType">Certificate Type *</Label>
              <Select
                value={formData.certificateType}
                onValueChange={handleCertificateTypeChange}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CERTIFICATE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} (Valid {type.validityYears}yr{type.validityYears > 1 ? 's' : ''})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => handleIssueDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  min={formData.issueDate || undefined}
                  required
                />
              </div>
            </div>

            {/* Provider Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="providerName">Provider / Inspector Name *</Label>
                <Input
                  id="providerName"
                  value={formData.providerName}
                  onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                  placeholder="e.g., John Smith Gas Services"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="providerContact">Provider Contact</Label>
                <Input
                  id="providerContact"
                  value={formData.providerContact}
                  onChange={(e) => setFormData({ ...formData, providerContact: e.target.value })}
                  placeholder="Phone or email"
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Certificate Document</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file" className="cursor-pointer">
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          setSelectedFile(null)
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload certificate</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, JPG, or PNG (Max 10MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes or comments..."
                rows={3}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending || !propertiesData?.properties.length}
                className="flex-1"
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {createMutation.isPending ? 'Adding Certificate...' : 'Add Certificate'}
              </Button>
              <Link href="/dashboard/certificates" className="flex-1">
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
