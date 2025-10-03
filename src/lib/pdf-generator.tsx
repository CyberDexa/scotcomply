import React from 'react'
import { pdf } from '@react-pdf/renderer'
import { TribunalReport } from '@/components/repairing-standard/TribunalReport'

interface CheckpointData {
  id: string
  description: string
  category: string
  status: string
  priority: string
  notes?: string
  contractorName?: string
  contractorContact?: string
  cost?: number
  dueDate?: Date
  completedDate?: Date
  evidenceUrl?: string
}

interface AssessmentData {
  id: string
  assessmentDate: Date
  overallStatus: string
  score: number
  property: {
    address: string
    city: string
    postcode: string
  }
  user: {
    name: string
    email: string
  }
  items: CheckpointData[]
  notes?: string
}

/**
 * Format assessment data for PDF generation
 * Ensures all data is properly typed and formatted
 */
export function formatAssessmentData(assessment: any): AssessmentData {
  return {
    id: assessment.id,
    assessmentDate: new Date(assessment.assessmentDate),
    overallStatus: assessment.overallStatus || 'pending',
    score: assessment.score || 0,
    property: {
      address: assessment.property.address,
      city: assessment.property.city || '',
      postcode: assessment.property.postcode || '',
    },
    user: {
      name: assessment.property.user?.name || 'Unknown',
      email: assessment.property.user?.email || '',
    },
    items: assessment.items.map((item: any) => ({
      id: item.id,
      description: item.description,
      category: item.category,
      status: item.status,
      priority: item.priority || 'medium',
      notes: item.notes || undefined,
      contractorName: item.contractorName || undefined,
      contractorContact: item.contractorContact || undefined,
      cost: item.cost ? parseFloat(item.cost.toString()) : undefined,
      dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
      completedDate: item.completedDate ? new Date(item.completedDate) : undefined,
      evidenceUrl: item.evidenceUrl || undefined,
    })),
    notes: assessment.notes || undefined,
  }
}

/**
 * Generate filename for the PDF report
 * Format: tribunal-report-{propertyId}-{date}.pdf
 */
export function generateFilename(propertyAddress: string, assessmentDate: Date): string {
  const date = new Date(assessmentDate).toISOString().split('T')[0]
  const sanitizedAddress = propertyAddress
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 30)
  
  return `tribunal-report-${sanitizedAddress}-${date}.pdf`
}

/**
 * Generate PDF blob from assessment data
 * Returns a Blob that can be downloaded or saved
 */
export async function generateTribunalReportPDF(
  assessment: any
): Promise<Blob> {
  try {
    // Format the data
    const formattedData = formatAssessmentData(assessment)

    // Generate PDF document
    const doc = <TribunalReport data={formattedData} />
    
    // Convert to blob
    const blob = await pdf(doc).toBlob()
    
    return blob
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF report. Please try again.')
  }
}

/**
 * Download PDF report directly in browser
 * Triggers browser download dialog
 */
export async function downloadTribunalReport(assessment: any): Promise<void> {
  try {
    // Generate PDF blob
    const blob = await generateTribunalReportPDF(assessment)
    
    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = generateFilename(
      assessment.property.address,
      assessment.assessmentDate
    )
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading PDF:', error)
    throw new Error('Failed to download PDF report. Please try again.')
  }
}

/**
 * Calculate compliance statistics for summary
 */
export function calculateComplianceStats(items: CheckpointData[]) {
  const applicableItems = items.filter(item => item.status !== 'not_applicable')
  const compliantItems = applicableItems.filter(
    item => item.status === 'compliant' || item.status === 'completed'
  )
  const nonCompliantItems = applicableItems.filter(item => item.status === 'non_compliant')
  const pendingItems = applicableItems.filter(
    item => item.status === 'pending' || item.status === 'in_progress'
  )

  const score = applicableItems.length > 0
    ? Math.round((compliantItems.length / applicableItems.length) * 100)
    : 0

  const totalCost = items.reduce((sum, item) => sum + (item.cost || 0), 0)

  return {
    totalItems: items.length,
    applicableItems: applicableItems.length,
    compliantItems: compliantItems.length,
    nonCompliantItems: nonCompliantItems.length,
    pendingItems: pendingItems.length,
    notApplicableItems: items.length - applicableItems.length,
    score,
    totalCost,
    itemsWithContractors: items.filter(item => item.contractorName).length,
  }
}

/**
 * Validate assessment data before PDF generation
 * Throws error if data is incomplete or invalid
 */
export function validateAssessmentData(assessment: any): void {
  if (!assessment) {
    throw new Error('Assessment data is required')
  }

  if (!assessment.property) {
    throw new Error('Property information is required')
  }

  if (!assessment.items || assessment.items.length === 0) {
    throw new Error('Assessment must have at least one checkpoint')
  }

  if (!assessment.assessmentDate) {
    throw new Error('Assessment date is required')
  }

  // Warn if assessment is not completed
  if (assessment.overallStatus === 'pending' || assessment.overallStatus === 'in_progress') {
    console.warn('Generating report for incomplete assessment')
  }
}
