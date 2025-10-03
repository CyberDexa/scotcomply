import * as React from 'react'
import { Text, Button, Section } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface HMOLicenseExpiringEmailProps {
  councilArea: string
  propertyAddress: string
  expiryDate: string
  daysUntilExpiry: number
  licenseNumber: string
  occupancyLimit: number
  hmoId: string
}

export const HMOLicenseExpiringEmail = ({
  councilArea,
  propertyAddress,
  expiryDate,
  daysUntilExpiry,
  licenseNumber,
  occupancyLimit,
  hmoId,
}: HMOLicenseExpiringEmailProps) => {
  return (
    <EmailLayout
      preview={`Your HMO license for ${propertyAddress} expires in ${daysUntilExpiry} days`}
      heading="HMO License Renewal Required"
    >
      <Section style={alertBox}>
        <Text style={alertText}>
          🏠 Your HMO license expires in <strong>{daysUntilExpiry} days</strong>
        </Text>
      </Section>

      <Text style={paragraph}>
        <strong>Property:</strong> {propertyAddress}
      </Text>
      
      <Text style={paragraph}>
        <strong>Council:</strong> {councilArea}
      </Text>
      
      <Text style={paragraph}>
        <strong>License Number:</strong> {licenseNumber}
      </Text>
      
      <Text style={paragraph}>
        <strong>Occupancy Limit:</strong> {occupancyLimit} people
      </Text>
      
      <Text style={paragraph}>
        <strong>Expiry Date:</strong> {expiryDate}
      </Text>

      <Text style={paragraph}>
        Your HMO (House in Multiple Occupation) license is due for renewal. Under Scottish law,
        you must hold a valid HMO license to let property to 3 or more unrelated people.
      </Text>

      <Section style={warningBox}>
        <Text style={warningTitle}>⚠️ Renewal Checklist</Text>
        <Text style={warningText}>
          Before applying for renewal, ensure:<br /><br />
          
          ✓ Fire safety equipment is up to date<br />
          ✓ Gas and electrical certificates are valid<br />
          ✓ Property meets current HMO standards<br />
          ✓ All repairs have been completed<br />
          ✓ Occupancy limits are being maintained
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button
          style={button}
          href={`http://localhost:3000/dashboard/hmo/${hmoId}`}
        >
          View HMO License Details
        </Button>
      </Section>

      <Text style={criticalText}>
        <strong>🚨 CRITICAL:</strong> Operating an HMO without a valid license is a criminal offense
        punishable by fines up to £50,000. You may also face closure orders and be unable to evict tenants.
      </Text>

      <Text style={helpText}>
        Many councils require several weeks to process HMO renewals. Start your application now
        to ensure uninterrupted licensing.
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

const alertBox = {
  backgroundColor: '#eff6ff',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const alertText = {
  color: '#1e40af',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  textAlign: 'center' as const,
}

const warningBox = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fcd34d',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const warningTitle = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const warningText = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
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

const criticalText = {
  backgroundColor: '#fee2e2',
  border: '2px solid #dc2626',
  borderRadius: '8px',
  color: '#991b1b',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '24px 0',
  padding: '16px',
  textAlign: 'center' as const,
}

const helpText = {
  color: '#6b7280',
  fontSize: '14px',
  fontStyle: 'italic',
  lineHeight: '20px',
  margin: '16px 0 0',
}

export default HMOLicenseExpiringEmail
