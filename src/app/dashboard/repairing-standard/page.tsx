'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, FileText, CheckCircle2, XCircle, Clock, AlertTriangle, ClipboardCheck } from 'lucide-react'
import { format } from 'date-fns'

export default function RepairingStandardPage() {
  const router = useRouter()
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [creating, setCreating] = useState(false)

  const { data: propertiesData } = trpc.property.list.useQuery({ limit: 100 })
  const properties = propertiesData?.properties || []
  const { data: assessments, isLoading, refetch } = trpc.repairingStandard.getAssessments.useQuery()
  const { data: stats } = trpc.repairingStandard.getAssessmentStats.useQuery()
  const createAssessment = trpc.repairingStandard.createAssessment.useMutation()

  const handleCreateAssessment = async () => {
    if (!selectedProperty) return

    setCreating(true)
    try {
      const assessment = await createAssessment.mutateAsync({
        propertyId: selectedProperty,
      })
      await refetch()
      router.push(`/dashboard/repairing-standard/${assessment.id}`)
    } catch (error) {
      console.error('Failed to create assessment:', error)
    } finally {
      setCreating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      compliant: {
        label: 'Compliant',
        className: 'bg-green-100 text-green-800',
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
      non_compliant: {
        label: 'Non-Compliant',
        className: 'bg-red-100 text-red-800',
        icon: <XCircle className="h-3 w-3" />,
      },
      in_progress: {
        label: 'In Progress',
        className: 'bg-blue-100 text-blue-800',
        icon: <Clock className="h-3 w-3" />,
      },
      pending: {
        label: 'Pending',
        className: 'bg-gray-100 text-gray-800',
        icon: <AlertTriangle className="h-3 w-3" />,
      },
    }
    const status_config = config[status] || config.pending
    return (
      <Badge className={`${status_config.className} flex items-center gap-1`}>
        {status_config.icon}
        {status_config.label}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Repairing Standard Assessments</h1>
        <p className="text-gray-600 mt-2">
          Scottish Repairing Standard 21-point compliance assessments for your properties
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Assessments</CardTitle>
              <FileText className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalAssessments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Compliant</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.compliantAssessments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Non-Compliant</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.nonCompliantAssessments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.pendingAssessments}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create New Assessment */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
              <Plus className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle>Create New Assessment</CardTitle>
              <CardDescription>Start a 21-point repairing standard assessment</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties?.map((property: { id: string; address: string }) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCreateAssessment}
              disabled={!selectedProperty || creating}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Start Assessment
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assessments List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        )}

        {!isLoading && assessments && assessments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No assessments yet</p>
              <p className="text-sm text-gray-500">Create your first repairing standard assessment above</p>
            </CardContent>
          </Card>
        )}

        {!isLoading &&
          assessments?.map((assessment: any) => (
            <Card
              key={assessment.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/repairing-standard/${assessment.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{assessment.property.address}</CardTitle>
                      {getStatusBadge(assessment.overallStatus)}
                    </div>
                    <CardDescription>
                      Assessed on {format(new Date(assessment.assessmentDate), 'dd MMMM yyyy')}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-indigo-600">{assessment.score}%</div>
                    <p className="text-xs text-gray-500 mt-1">Compliance</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-gray-700">
                      {assessment.items.filter((item: { status: string }) => item.status === 'compliant' || item.status === 'completed').length} Compliant
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-gray-700">
                      {assessment.items.filter((item: { status: string }) => item.status === 'non_compliant').length} Non-Compliant
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">
                      {assessment.items.filter((item: { status: string }) => item.status === 'pending' || item.status === 'in_progress').length} Pending
                    </span>
                  </div>
                </div>

                {assessment.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{assessment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
