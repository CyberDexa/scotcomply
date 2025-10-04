'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight, FileText, ExternalLink } from 'lucide-react'
import { REPAIRING_STANDARD_CATEGORIES, REPAIRING_STANDARD_CHECKPOINTS } from '@/lib/repairing-standard-constants'
import { getCertificatesForCheckpoint, isCertificateExpired, isCertificateExpiringSoon, getDaysUntilExpiry, getCertificateTypeName } from '@/lib/certificate-checkpoint-mapping'

interface AssessmentWizardProps {
  assessmentId: string
  onComplete?: () => void
}

export function AssessmentWizard({ assessmentId, onComplete }: AssessmentWizardProps) {
  const [currentCheckpoint, setCurrentCheckpoint] = useState(0)
  const [localUpdates, setLocalUpdates] = useState<Record<string, { status: string; notes: string; priority: string }>>({})

  const { data: assessment, isLoading, refetch } = trpc.repairingStandard.getAssessment.useQuery({ assessmentId })
  const { data: score } = trpc.repairingStandard.getComplianceScore.useQuery({ assessmentId })
  const updateCheckpoint = trpc.repairingStandard.updateCheckpoint.useMutation()

  const currentItem = assessment?.items[currentCheckpoint]
  const checkpoint = REPAIRING_STANDARD_CHECKPOINTS[currentCheckpoint]
  const categoryName = checkpoint ? REPAIRING_STANDARD_CATEGORIES[checkpoint.category as keyof typeof REPAIRING_STANDARD_CATEGORIES] : ''

  const handleUpdateCheckpoint = async (status: string) => {
    if (!currentItem) return

    const localUpdate = localUpdates[currentItem.id] || { status, notes: '', priority: 'medium' }
    
    await updateCheckpoint.mutateAsync({
      itemId: currentItem.id,
      status: status as 'pending' | 'compliant' | 'non_compliant' | 'in_progress' | 'completed',
      notes: localUpdate.notes || undefined,
      priority: localUpdate.priority as 'low' | 'medium' | 'high' | 'critical',
    })

    await refetch()

    // Move to next checkpoint if available
    if (currentCheckpoint < (assessment?.items.length || 0) - 1) {
      setCurrentCheckpoint(currentCheckpoint + 1)
    } else if (onComplete) {
      onComplete()
    }
  }

  const updateLocalNotes = (notes: string) => {
    if (!currentItem) return
    setLocalUpdates({
      ...localUpdates,
      [currentItem.id]: {
        ...localUpdates[currentItem.id],
        status: currentItem.status,
        notes,
        priority: localUpdates[currentItem.id]?.priority || 'medium',
      },
    })
  }

  const updateLocalPriority = (priority: string) => {
    if (!currentItem) return
    setLocalUpdates({
      ...localUpdates,
      [currentItem.id]: {
        ...localUpdates[currentItem.id],
        status: currentItem.status,
        notes: localUpdates[currentItem.id]?.notes || '',
        priority,
      },
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'non_compliant':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />
      case 'pending':
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      compliant: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      non_compliant: 'bg-red-100 text-red-800',
      in_progress: 'bg-blue-100 text-blue-800',
      pending: 'bg-gray-100 text-gray-800',
    }
    return variants[status] || variants.pending
  }

  if (isLoading || !assessment || !currentItem || !checkpoint) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  const progress = ((currentCheckpoint + 1) / assessment.items.length) * 100

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                Checkpoint {currentCheckpoint + 1} of {assessment.items.length}
              </span>
              <span className="font-semibold text-indigo-600">{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Score */}
      {score && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-indigo-600">{score.compliancePercentage}%</p>
                <p className="text-sm text-gray-600 mt-1">Compliant</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{score.compliantItems}</p>
                <p className="text-sm text-gray-600 mt-1">Passed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{score.nonCompliantItems}</p>
                <p className="text-sm text-gray-600 mt-1">Failed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-600">{score.pendingItems}</p>
                <p className="text-sm text-gray-600 mt-1">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Checkpoint */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <Badge className="mb-2 bg-indigo-100 text-indigo-800">
                {categoryName}
              </Badge>
              <CardTitle className="text-2xl">{checkpoint.title}</CardTitle>
              <CardDescription className="text-base mt-2">{checkpoint.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(currentItem.status)}
              <Badge className={getStatusBadge(currentItem.status)}>
                {currentItem.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
          
          {/* Certificate Warnings */}
          {assessment.property.certificates && assessment.property.certificates.length > 0 && (() => {
            const checkpointIndex = currentCheckpoint + 1 // 1-indexed
            const relevantCertTypes = getCertificatesForCheckpoint(checkpointIndex)
            const relevantCerts = assessment.property.certificates.filter((cert: any) => 
              relevantCertTypes.includes(cert.certificateType as any)
            )
            
            if (relevantCerts.length === 0) return null
            
            return (
              <div className="mt-4 space-y-2">
                {relevantCerts.map((cert: any) => {
                  const expired = isCertificateExpired(new Date(cert.expiryDate))
                  const expiringSoon = !expired && isCertificateExpiringSoon(new Date(cert.expiryDate))
                  const daysUntilExpiry = getDaysUntilExpiry(new Date(cert.expiryDate))
                  
                  return (
                    <div
                      key={cert.id}
                      className={`p-3 rounded-lg border-2 flex items-start justify-between ${
                        expired
                          ? 'bg-red-50 border-red-200'
                          : expiringSoon
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className={`h-5 w-5 mt-0.5 ${
                          expired
                            ? 'text-red-600'
                            : expiringSoon
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`} />
                        <div>
                          <p className={`font-semibold text-sm ${
                            expired
                              ? 'text-red-900'
                              : expiringSoon
                              ? 'text-yellow-900'
                              : 'text-green-900'
                          }`}>
                            {getCertificateTypeName(cert.certificateType as any)}
                          </p>
                          <p className={`text-xs mt-1 ${
                            expired
                              ? 'text-red-700'
                              : expiringSoon
                              ? 'text-yellow-700'
                              : 'text-green-700'
                          }`}>
                            {expired
                              ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                              : expiringSoon
                              ? `Expires in ${daysUntilExpiry} days`
                              : `Valid until ${new Date(cert.expiryDate).toLocaleDateString()}`
                            }
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => window.open(`/dashboard/certificates/${cert.id}`, '_blank')}
                      >
                        View
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Buttons */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Assessment Result</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                className="h-16 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleUpdateCheckpoint('compliant')}
                disabled={updateCheckpoint.isPending}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Compliant
              </Button>
              <Button
                size="lg"
                variant="destructive"
                className="h-16"
                onClick={() => handleUpdateCheckpoint('non_compliant')}
                disabled={updateCheckpoint.isPending}
              >
                <XCircle className="mr-2 h-5 w-5" />
                Non-Compliant
              </Button>
            </div>
          </div>

          {/* Priority Selector */}
          <div>
            <Label htmlFor="priority" className="text-base font-semibold mb-2 block">
              Priority Level
            </Label>
            <Select
              value={localUpdates[currentItem.id]?.priority || currentItem.priority}
              onValueChange={updateLocalPriority}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - No immediate action required</SelectItem>
                <SelectItem value="medium">Medium - Address within 30 days</SelectItem>
                <SelectItem value="high">High - Address within 7 days</SelectItem>
                <SelectItem value="critical">Critical - Immediate action required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-base font-semibold mb-2 block">
              Notes & Observations
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any observations, measurements, or details about this checkpoint..."
              rows={4}
              value={localUpdates[currentItem.id]?.notes || currentItem.notes || ''}
              onChange={(e) => updateLocalNotes(e.target.value)}
              className="resize-none"
            />
          </div>

          {/* Existing Item Info */}
          {currentItem.notes && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Previous Notes:</p>
              <p className="text-sm text-blue-700">{currentItem.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentCheckpoint(Math.max(0, currentCheckpoint - 1))}
              disabled={currentCheckpoint === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <span className="text-sm text-gray-600">
              Checkpoint {currentCheckpoint + 1} of {assessment.items.length}
            </span>

            <Button
              onClick={() => setCurrentCheckpoint(Math.min(assessment.items.length - 1, currentCheckpoint + 1))}
              disabled={currentCheckpoint === assessment.items.length - 1}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Checkpoint List Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Overview</CardTitle>
          <CardDescription>Quick navigation to any checkpoint</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
            {assessment.items.map((item: any, index: number) => (
              <button
                key={item.id}
                onClick={() => setCurrentCheckpoint(index)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  index === currentCheckpoint
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  {getStatusIcon(item.status)}
                  <span className="text-xs font-medium text-gray-700">{index + 1}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
