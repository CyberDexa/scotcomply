'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, Download } from 'lucide-react'
import { AssessmentWizard } from '@/components/repairing-standard/AssessmentWizard'

export default function AssessmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const { data: assessment, isLoading } = trpc.repairingStandard.getAssessment.useQuery({
    assessmentId,
  })

  const handleDownloadReport = async () => {
    if (!assessment) return

    try {
      setIsGeneratingPDF(true)
      
      // Lazy load PDF generator (reduces initial bundle by ~500KB)
      const { downloadTribunalReport, validateAssessmentData } = await import('@/lib/pdf-generator')
      
      // Validate assessment data
      validateAssessmentData(assessment)
      
      // Generate and download PDF
      await downloadTribunalReport(assessment)
      
      alert('PDF report downloaded successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate PDF report')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Assessment not found</p>
            <Button onClick={() => router.push('/dashboard/repairing-standard')} className="mt-4">
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/repairing-standard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessments
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{assessment.property.address}</h1>
          <p className="text-gray-600 mt-2">Repairing Standard Assessment</p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={handleDownloadReport}
          disabled={isGeneratingPDF}
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download Tribunal Report
            </>
          )}
        </Button>
      </div>

      {/* Assessment Wizard */}
      <AssessmentWizard
        assessmentId={assessmentId}
        onComplete={() => {
          router.push('/dashboard/repairing-standard')
        }}
      />
    </div>
  )
}
