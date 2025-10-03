'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { SubjectType } from '@prisma/client'
import { ArrowLeft, Shield, User, Building } from 'lucide-react'
import { toast } from 'sonner'

export default function NewAMLScreeningPage() {
  const router = useRouter()
  const [subjectType, setSubjectType] = useState<SubjectType>(SubjectType.INDIVIDUAL)
  const [formData, setFormData] = useState({
    subjectName: '',
    subjectEmail: '',
    subjectPhone: '',
    dateOfBirth: '',
    nationality: '',
    companyNumber: '',
    notes: '',
  })

  const createScreening = trpc.aml.create.useMutation({
    onSuccess: async (data) => {
      toast.success('Screening created successfully')
      
      // Automatically perform screening
      try {
        await performScreening.mutateAsync({ screeningId: data.id })
        toast.success('Screening completed')
        router.push(`/dashboard/aml/${data.id}`)
      } catch (error) {
        toast.error('Failed to perform screening')
        router.push(`/dashboard/aml/${data.id}`)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create screening')
    },
  })

  const performScreening = trpc.aml.performScreening.useMutation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.subjectName.trim()) {
      toast.error('Subject name is required')
      return
    }

    if (subjectType === SubjectType.INDIVIDUAL && !formData.dateOfBirth) {
      toast.error('Date of birth is required for individuals')
      return
    }

    if (subjectType === SubjectType.COMPANY && !formData.companyNumber) {
      toast.error('Company number is required for companies')
      return
    }

    createScreening.mutate({
      subjectType,
      subjectName: formData.subjectName,
      subjectEmail: formData.subjectEmail || undefined,
      subjectPhone: formData.subjectPhone || undefined,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
      nationality: formData.nationality || undefined,
      companyNumber: formData.companyNumber || undefined,
      notes: formData.notes || undefined,
    })
  }

  const isLoading = createScreening.isPending || performScreening.isPending

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New AML Screening</h1>
          <p className="text-muted-foreground mt-1">
            Screen individuals or companies for AML/sanctions compliance
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Subject Type Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Subject Type</CardTitle>
            <CardDescription>
              Select whether you&apos;re screening an individual or a company
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSubjectType(SubjectType.INDIVIDUAL)}
                className={`p-6 border-2 rounded-lg transition-all ${
                  subjectType === SubjectType.INDIVIDUAL
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
              >
                <User className={`h-12 w-12 mx-auto mb-3 ${
                  subjectType === SubjectType.INDIVIDUAL ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <div className="text-center">
                  <div className="font-semibold mb-1">Individual</div>
                  <div className="text-sm text-muted-foreground">
                    Screen a person (tenant, landlord, etc.)
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSubjectType(SubjectType.COMPANY)}
                className={`p-6 border-2 rounded-lg transition-all ${
                  subjectType === SubjectType.COMPANY
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
              >
                <Building className={`h-12 w-12 mx-auto mb-3 ${
                  subjectType === SubjectType.COMPANY ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <div className="text-center">
                  <div className="font-semibold mb-1">Company</div>
                  <div className="text-sm text-muted-foreground">
                    Screen a business entity
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Subject Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Subject Information</CardTitle>
            <CardDescription>
              Provide details about the {subjectType === SubjectType.INDIVIDUAL ? 'individual' : 'company'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="subjectName">
                {subjectType === SubjectType.INDIVIDUAL ? 'Full Name' : 'Company Name'} *
              </Label>
              <Input
                id="subjectName"
                placeholder={
                  subjectType === SubjectType.INDIVIDUAL
                    ? 'e.g., John Smith'
                    : 'e.g., ABC Properties Ltd'
                }
                value={formData.subjectName}
                onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="subjectEmail">Email</Label>
              <Input
                id="subjectEmail"
                type="email"
                placeholder="email@example.com"
                value={formData.subjectEmail}
                onChange={(e) => setFormData({ ...formData, subjectEmail: e.target.value })}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="subjectPhone">Phone Number</Label>
              <Input
                id="subjectPhone"
                type="tel"
                placeholder="+44 7700 900000"
                value={formData.subjectPhone}
                onChange={(e) => setFormData({ ...formData, subjectPhone: e.target.value })}
              />
            </div>

            {/* Individual-specific fields */}
            {subjectType === SubjectType.INDIVIDUAL && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      required
                    />
                  </div>

                  {/* Nationality */}
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      placeholder="e.g., United Kingdom"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Company-specific fields */}
            {subjectType === SubjectType.COMPANY && (
              <div className="grid grid-cols-2 gap-4">
                {/* Company Number */}
                <div className="space-y-2">
                  <Label htmlFor="companyNumber">Company Number *</Label>
                  <Input
                    id="companyNumber"
                    placeholder="e.g., SC123456"
                    value={formData.companyNumber}
                    onChange={(e) => setFormData({ ...formData, companyNumber: e.target.value })}
                    required
                  />
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="nationality">Country of Registration</Label>
                  <Input
                    id="nationality"
                    placeholder="e.g., Scotland"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional context or notes..."
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Information Notice */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Screening Process</p>
                <p>
                  The screening will check against sanctions lists, PEP databases, and adverse media.
                  Results typically available within seconds. High-risk matches may require Enhanced
                  Due Diligence (EDD).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Shield className="h-4 w-4 mr-2 animate-spin" />
                Screening...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Perform Screening
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
