import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer'

// Register fonts (optional - using default for now)
// Font.register({ family: 'Inter', src: '/fonts/Inter-Regular.ttf' })

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#4a4a4a',
  },
  coverInfo: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  coverInfoText: {
    fontSize: 12,
    marginBottom: 8,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1a1a1a',
    borderBottom: '2px solid #2563eb',
    paddingBottom: 4,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
    color: '#333',
  },
  text: {
    fontSize: 11,
    marginBottom: 6,
    lineHeight: 1.5,
    color: '#333',
  },
  boldText: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '30%',
    fontWeight: 'bold',
    fontSize: 11,
    color: '#555',
  },
  value: {
    width: '70%',
    fontSize: 11,
    color: '#333',
  },
  summaryBox: {
    padding: 15,
    backgroundColor: '#f0f9ff',
    borderRadius: 4,
    marginBottom: 15,
    border: '1px solid #2563eb',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e40af',
  },
  scoreBox: {
    padding: 20,
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
    marginBottom: 15,
    textAlign: 'center',
    border: '2px solid #16a34a',
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 5,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#555',
  },
  categoryContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fafafa',
    borderRadius: 4,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e40af',
  },
  checkpointItem: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderLeft: '3px solid #e5e7eb',
  },
  checkpointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkpointText: {
    fontSize: 11,
    width: '70%',
    color: '#333',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusCompliant: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusNonCompliant: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  statusPending: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  statusInProgress: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  statusNotApplicable: {
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
  },
  checkpointDetails: {
    marginTop: 6,
    fontSize: 10,
    color: '#666',
  },
  contractorBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 4,
    border: '1px solid #fbbf24',
  },
  contractorTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#92400e',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #e5e7eb',
  },
  costLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
  },
  costValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
  disclaimer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    border: '1px solid #fbbf24',
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#92400e',
  },
  disclaimerText: {
    fontSize: 9,
    lineHeight: 1.6,
    color: '#78350f',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 9,
    color: '#9ca3af',
  },
})

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

const CATEGORY_NAMES: Record<string, string> = {
  structure: 'Structure and Exterior',
  weathertight: 'Weathertight',
  safe_services: 'Safe Services',
  heating: 'Heating and Hot Water',
  fire_safety: 'Fire Safety',
  noise: 'Noise Insulation',
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'compliant':
    case 'completed':
      return styles.statusCompliant
    case 'non_compliant':
      return styles.statusNonCompliant
    case 'in_progress':
      return styles.statusInProgress
    case 'not_applicable':
      return styles.statusNotApplicable
    default:
      return styles.statusPending
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'compliant':
      return 'Compliant'
    case 'non_compliant':
      return 'Non-Compliant'
    case 'in_progress':
      return 'In Progress'
    case 'completed':
      return 'Completed'
    case 'not_applicable':
      return 'Not Applicable'
    default:
      return 'Pending'
  }
}

const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatCurrency = (amount: number | undefined) => {
  if (!amount) return '£0.00'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount)
}

export const TribunalReport: React.FC<{ data: AssessmentData }> = ({ data }) => {
  // Group items by category
  const itemsByCategory = data.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, CheckpointData[]>)

  // Calculate statistics
  const totalItems = data.items.length
  const applicableItems = data.items.filter(item => item.status !== 'not_applicable')
  const compliantItems = applicableItems.filter(
    item => item.status === 'compliant' || item.status === 'completed'
  )
  const nonCompliantItems = applicableItems.filter(item => item.status === 'non_compliant')
  const totalCost = data.items.reduce((sum, item) => sum + (item.cost || 0), 0)
  const itemsWithContractors = data.items.filter(item => item.contractorName)

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.title}>Repairing Standard Assessment</Text>
          <Text style={styles.subtitle}>Tribunal Report</Text>
          
          <View style={styles.coverInfo}>
            <Text style={styles.coverInfoText}>Property: {data.property.address}</Text>
            <Text style={styles.coverInfoText}>Assessment Date: {formatDate(data.assessmentDate)}</Text>
            <Text style={styles.coverInfoText}>Landlord: {data.user.name}</Text>
            <Text style={styles.coverInfoText}>Report Generated: {formatDate(new Date())}</Text>
          </View>

          <View style={{ marginTop: 40, textAlign: 'center' }}>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>
              Compliance Score
            </Text>
            <Text style={{ fontSize: 48, fontWeight: 'bold', color: data.score >= 80 ? '#16a34a' : '#dc2626' }}>
              {data.score}%
            </Text>
            <Text style={{ fontSize: 14, marginTop: 10, color: data.score >= 80 ? '#16a34a' : '#dc2626' }}>
              {data.score >= 80 ? 'COMPLIANT' : 'NON-COMPLIANT'}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          ScotComply - Scottish Landlord Compliance Platform
        </Text>
      </Page>

      {/* Executive Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Assessment Overview</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Property Address:</Text>
              <Text style={styles.value}>{data.property.address}, {data.property.city}, {data.property.postcode}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Assessment Date:</Text>
              <Text style={styles.value}>{formatDate(data.assessmentDate)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Overall Status:</Text>
              <Text style={styles.value}>{data.overallStatus.toUpperCase()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Compliance Score:</Text>
              <Text style={styles.value}>{data.score}%</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.subsectionTitle}>Key Findings</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Total Checkpoints:</Text>
              <Text style={styles.value}>{totalItems}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Applicable Items:</Text>
              <Text style={styles.value}>{applicableItems.length}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Compliant Items:</Text>
              <Text style={styles.value}>{compliantItems.length}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Non-Compliant Items:</Text>
              <Text style={styles.value}>{nonCompliantItems.length}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Items Not Applicable:</Text>
              <Text style={styles.value}>{totalItems - applicableItems.length}</Text>
            </View>
          </View>

          {totalCost > 0 && (
            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>Cost Summary</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Total Estimated Costs:</Text>
                <Text style={[styles.value, styles.boldText]}>{formatCurrency(totalCost)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Items with Contractors:</Text>
                <Text style={styles.value}>{itemsWithContractors.length}</Text>
              </View>
            </View>
          )}

          {data.notes && (
            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>General Notes</Text>
              <Text style={styles.text}>{data.notes}</Text>
            </View>
          )}
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber}`} fixed />
      </Page>

      {/* Detailed Checklist by Category */}
      {Object.entries(itemsByCategory).map(([category, items], categoryIndex) => (
        <Page key={category} size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {categoryIndex + 1}. {CATEGORY_NAMES[category] || category}
            </Text>
            
            {items.map((item, index) => (
              <View key={item.id} style={styles.checkpointItem}>
                <View style={styles.checkpointHeader}>
                  <Text style={styles.checkpointText}>
                    {categoryIndex + 1}.{index + 1} {item.description}
                  </Text>
                  <View style={[styles.statusBadge, getStatusColor(item.status)]}>
                    <Text>{getStatusLabel(item.status)}</Text>
                  </View>
                </View>

                {item.priority && (
                  <Text style={styles.checkpointDetails}>
                    Priority: {item.priority.toUpperCase()}
                  </Text>
                )}

                {item.notes && (
                  <Text style={styles.checkpointDetails}>
                    Notes: {item.notes}
                  </Text>
                )}

                {(item.dueDate || item.completedDate) && (
                  <View style={styles.checkpointDetails}>
                    {item.dueDate && (
                      <Text>Due Date: {formatDate(item.dueDate)}</Text>
                    )}
                    {item.completedDate && (
                      <Text>Completed: {formatDate(item.completedDate)}</Text>
                    )}
                  </View>
                )}

                {(item.contractorName || item.cost) && (
                  <View style={styles.contractorBox}>
                    <Text style={styles.contractorTitle}>Contractor Information</Text>
                    {item.contractorName && (
                      <Text style={styles.checkpointDetails}>
                        Contractor: {item.contractorName}
                      </Text>
                    )}
                    {item.contractorContact && (
                      <Text style={styles.checkpointDetails}>
                        Contact: {item.contractorContact}
                      </Text>
                    )}
                    {item.cost && (
                      <View style={styles.costRow}>
                        <Text style={styles.costLabel}>Estimated Cost:</Text>
                        <Text style={styles.costValue}>{formatCurrency(item.cost)}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>

          <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber}`} fixed />
        </Page>
      ))}

      {/* Legal Disclaimer */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal Information</Text>
          
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerTitle}>⚠️ Important Legal Notice</Text>
            <Text style={styles.disclaimerText}>
              This report is generated based on the information provided by the landlord and recorded in the ScotComply system.
              It is intended as a summary of the property&apos;s compliance with the Repairing Standard under the Housing (Scotland) Act 2006.
              {'\n\n'}
              This report should not be considered as legal advice. For specific legal questions regarding your obligations under the 
              Repairing Standard or in relation to First-tier Tribunal proceedings, you should seek independent legal advice.
              {'\n\n'}
              The landlord is responsible for ensuring the accuracy of all information recorded in this assessment. 
              Evidence photos, contractor information, and repair documentation should be retained for tribunal purposes.
              {'\n\n'}
              ScotComply Ltd accepts no liability for any decisions made based on this report.
            </Text>
          </View>

          <View style={[styles.section, { marginTop: 30 }]}>
            <Text style={styles.subsectionTitle}>About the Repairing Standard</Text>
            <Text style={styles.text}>
              The Repairing Standard is the minimum standard that all landlords in Scotland must meet for their properties. 
              It covers the structure and exterior of the property, installations for the supply of water, gas and electricity, 
              heating, sanitary installations, common parts, safety of gas and electrical installations, fire safety, and more.
            </Text>
            <Text style={styles.text}>
              If a tenant believes their home does not meet the Repairing Standard, they can apply to the First-tier Tribunal 
              for Scotland (Housing and Property Chamber). The Tribunal has the power to require a landlord to carry out work 
              to meet the standard.
            </Text>
          </View>

          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.subsectionTitle}>Contact Information</Text>
            <Text style={styles.text}>
              Generated by: ScotComply{'\n'}
              Website: www.scotcomply.com{'\n'}
              Support: support@scotcomply.com
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          This report was generated on {formatDate(new Date())} using ScotComply
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber}`} fixed />
      </Page>
    </Document>
  )
}
