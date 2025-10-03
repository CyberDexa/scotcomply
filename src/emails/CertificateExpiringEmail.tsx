import * as React from 'react'
import { Text, Button, Section } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface CertificateExpiringEmailProps {
  certificateType: string
  propertyAddress: string
  expiryDate: string
  daysUntilExpiry: number
  certificateId: string
}

export const CertificateExpiringEmail = ({
  certificateType,
  propertyAddress,
  expiryDate,
  daysUntilExpiry,
  certificateId,
}: CertificateExpiringEmailProps) => {
  const urgency = daysUntilExpiry <= 7 ? 'urgent' : daysUntilExpiry <= 14 ? 'high' : 'medium'
  
  return (
    <EmailLayout
      preview={`Your ${certificateType} certificate expires in ${daysUntilExpiry} days`}
      heading="Certificate Expiring Soon"
    >
      <Section style={alertBox(urgency)}>
        <Text style={alertText}>
          ⚠️ Your <strong>{certificateType}</strong> certificate will expire in{' '}
          <strong>{daysUntilExpiry} days</strong>
        </Text>
      </Section>

      <Text style={paragraph}>
        <strong>Property:</strong> {propertyAddress}
      </Text>
      
      <Text style={paragraph}>
        <strong>Certificate Type:</strong> {certificateType}
      </Text>
      
      <Text style={paragraph}>
        <strong>Expiry Date:</strong> {expiryDate}
      </Text>

      <Text style={paragraph}>
        To maintain compliance with Scottish letting regulations, you must renew this certificate
        before it expires. Non-compliance can result in fines and legal action.
      </Text>

      {urgency === 'urgent' && (
        <Text style={urgentWarning}>
          <strong>⚠️ URGENT:</strong> This certificate expires in less than 7 days! 
          Arrange renewal immediately to avoid compliance violations.
        </Text>
      )}

      <Section style={buttonContainer}>
        <Button
          style={button}
          href={`http://localhost:3000/dashboard/certificates/${certificateId}`}
        >
          View Certificate Details
        </Button>
      </Section>

      <Text style={helpText}>
        Need help finding a contractor? Visit your dashboard for recommended providers in your area.
      </Text>
    </EmailLayout>
  )
}

// Styles
const paragraph = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '12px 0',
}

const alertBox = (urgency: 'urgent' | 'high' | 'medium') => ({
  backgroundColor: urgency === 'urgent' ? '#fef2f2' : urgency === 'high' ? '#fffbeb' : '#f0fdf4',
  border: `2px solid ${urgency === 'urgent' ? '#ef4444' : urgency === 'high' ? '#f59e0b' : '#10b981'}`,
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
})

const alertText = {
  color: '#1f2937',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  textAlign: 'center' as const,
}

const urgentWarning = {
  backgroundColor: '#fee2e2',
  border: '2px solid #dc2626',
  borderRadius: '8px',
  color: '#991b1b',
  fontSize: '15px',
  fontWeight: 'bold',
  lineHeight: '22px',
  margin: '24px 0',
  padding: '16px',
}

const buttonContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const helpText = {
  color: '#6b7280',
  fontSize: '14px',
  fontStyle: 'italic',
  lineHeight: '20px',
  margin: '24px 0 0',
}

export default CertificateExpiringEmail
