import jsPDF from 'jspdf'
import { format } from 'date-fns'

interface PortfolioStats {
  totalProperties: number
  totalCertificates: number
  totalRegistrations: number
  totalHMOLicenses: number
  expiringCertificates: number
  expiringRegistrations: number
  expiringHMOLicenses: number
  totalCompliance: number
  totalExpiring: number
}

interface RiskData {
  riskScore: number
  riskLevel: string
  totalProperties: number
  riskFactors: Array<{
    factor: string
    count: number
    severity: string
    points: number
  }>
  summary: {
    expiredCertificates: number
    expiredRegistrations: number
    expiredHMOLicenses: number
    expiringCertificates: number
    expiringRegistrations: number
    expiringHMOLicenses: number
    nonCompliantHMOs: number
  }
}

interface CostData {
  totalCosts: number
  totalRegistrationFees: number
  totalHMOFees: number
  averageRegistrationFee: number
  averageHMOFee: number
  costsByCouncil: Array<{ council: string; cost: number }>
  monthlyBreakdown: Array<{
    month: string
    registrationCost: number
    hmoCost: number
    total: number
  }>
}

/**
 * Export analytics data as CSV
 */
export function exportToCSV(
  stats: PortfolioStats,
  costs: CostData,
  risk: RiskData
) {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm')
  
  // Create CSV content
  let csv = 'ScotComply Analytics Report\n'
  csv += `Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}\n\n`
  
  // Portfolio Overview
  csv += 'PORTFOLIO OVERVIEW\n'
  csv += 'Metric,Value\n'
  csv += `Total Properties,${stats.totalProperties}\n`
  csv += `Total Certificates,${stats.totalCertificates}\n`
  csv += `Total Registrations,${stats.totalRegistrations}\n`
  csv += `Total HMO Licenses,${stats.totalHMOLicenses}\n`
  csv += `Total Compliance Items,${stats.totalCompliance}\n`
  csv += `Items Expiring Soon,${stats.totalExpiring}\n\n`
  
  // Risk Assessment
  csv += 'RISK ASSESSMENT\n'
  csv += `Risk Score,${risk.riskScore}\n`
  csv += `Risk Level,${risk.riskLevel.toUpperCase()}\n\n`
  
  if (risk.riskFactors.length > 0) {
    csv += 'Risk Factors,Count,Severity,Points\n'
    risk.riskFactors.forEach(factor => {
      csv += `"${factor.factor}",${factor.count},${factor.severity},${factor.points}\n`
    })
    csv += '\n'
  }
  
  // Cost Summary
  csv += 'COST SUMMARY\n'
  csv += 'Category,Amount (GBP)\n'
  csv += `Total Registration Fees,${costs.totalRegistrationFees.toFixed(2)}\n`
  csv += `Total HMO Fees,${costs.totalHMOFees.toFixed(2)}\n`
  csv += `Total Costs,${costs.totalCosts.toFixed(2)}\n`
  csv += `Average Registration Fee,${costs.averageRegistrationFee.toFixed(2)}\n`
  csv += `Average HMO Fee,${costs.averageHMOFee.toFixed(2)}\n\n`
  
  // Costs by Council
  if (costs.costsByCouncil.length > 0) {
    csv += 'COSTS BY COUNCIL\n'
    csv += 'Council,Cost (GBP)\n'
    costs.costsByCouncil
      .sort((a, b) => b.cost - a.cost)
      .forEach(item => {
        csv += `"${item.council}",${item.cost.toFixed(2)}\n`
      })
    csv += '\n'
  }
  
  // Monthly Breakdown
  csv += 'MONTHLY COST BREAKDOWN\n'
  csv += 'Month,Registration Fees,HMO Fees,Total\n'
  costs.monthlyBreakdown.forEach(month => {
    csv += `"${month.month}",${month.registrationCost.toFixed(2)},${month.hmoCost.toFixed(2)},${month.total.toFixed(2)}\n`
  })
  
  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `scotcomply_analytics_${timestamp}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export analytics report as PDF
 */
export function exportToPDF(
  stats: PortfolioStats,
  costs: CostData,
  risk: RiskData
) {
  const doc = new jsPDF()
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm')
  let y = 20
  
  // Header
  doc.setFontSize(20)
  doc.setTextColor(79, 70, 229) // Indigo
  doc.text('ScotComply Analytics Report', 20, y)
  y += 10
  
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128) // Gray
  doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, y)
  y += 15
  
  // Portfolio Overview Section
  doc.setFontSize(14)
  doc.setTextColor(31, 41, 55) // Dark gray
  doc.text('Portfolio Overview', 20, y)
  y += 8
  
  doc.setFontSize(10)
  doc.setTextColor(75, 85, 99)
  doc.text(`Total Properties: ${stats.totalProperties}`, 25, y)
  y += 6
  doc.text(`Total Certificates: ${stats.totalCertificates}`, 25, y)
  y += 6
  doc.text(`Total Registrations: ${stats.totalRegistrations}`, 25, y)
  y += 6
  doc.text(`Total HMO Licenses: ${stats.totalHMOLicenses}`, 25, y)
  y += 6
  doc.text(`Total Compliance Items: ${stats.totalCompliance}`, 25, y)
  y += 6
  doc.text(`Items Expiring Soon: ${stats.totalExpiring}`, 25, y)
  y += 12
  
  // Risk Assessment Section
  doc.setFontSize(14)
  doc.setTextColor(31, 41, 55)
  doc.text('Risk Assessment', 20, y)
  y += 8
  
  doc.setFontSize(10)
  const riskColor = risk.riskLevel === 'low' ? [34, 197, 94] :
                    risk.riskLevel === 'medium' ? [234, 179, 8] :
                    risk.riskLevel === 'high' ? [249, 115, 22] :
                    [239, 68, 68]
  
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2])
  doc.text(`Risk Score: ${risk.riskScore} (${risk.riskLevel.toUpperCase()})`, 25, y)
  y += 8
  
  if (risk.riskFactors.length > 0) {
    doc.setTextColor(75, 85, 99)
    doc.text('Risk Factors:', 25, y)
    y += 6
    
    risk.riskFactors.forEach(factor => {
      doc.setFontSize(9)
      doc.text(`• ${factor.factor}: ${factor.count} item(s) - ${factor.points} points`, 30, y)
      y += 5
    })
    y += 6
  }
  y += 6
  
  // Cost Summary Section
  doc.setFontSize(14)
  doc.setTextColor(31, 41, 55)
  doc.text('Cost Summary', 20, y)
  y += 8
  
  doc.setFontSize(10)
  doc.setTextColor(75, 85, 99)
  doc.text(`Total Registration Fees: £${costs.totalRegistrationFees.toLocaleString()}`, 25, y)
  y += 6
  doc.text(`Total HMO Fees: £${costs.totalHMOFees.toLocaleString()}`, 25, y)
  y += 6
  doc.text(`Total Costs: £${costs.totalCosts.toLocaleString()}`, 25, y)
  y += 6
  doc.text(`Average Registration Fee: £${costs.averageRegistrationFee.toFixed(0)}`, 25, y)
  y += 6
  doc.text(`Average HMO Fee: £${costs.averageHMOFee.toFixed(0)}`, 25, y)
  y += 12
  
  // Costs by Council (top 10)
  if (costs.costsByCouncil.length > 0) {
    doc.setFontSize(14)
    doc.setTextColor(31, 41, 55)
    doc.text('Top Costs by Council', 20, y)
    y += 8
    
    doc.setFontSize(9)
    doc.setTextColor(75, 85, 99)
    
    costs.costsByCouncil
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)
      .forEach((item, index) => {
        if (y > 270) {
          doc.addPage()
          y = 20
        }
        doc.text(`${index + 1}. ${item.council}: £${item.cost.toLocaleString()}`, 25, y)
        y += 5
      })
  }
  
  // Save PDF
  doc.save(`scotcomply_analytics_${timestamp}.pdf`)
}
