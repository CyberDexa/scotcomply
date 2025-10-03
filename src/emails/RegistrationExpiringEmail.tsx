import * as React from 'react'
import { Text, Button, Section } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface RegistrationExpiringEmailProps {
  councilArea: string
  propertyAddress: string
  expiryDate: string
  daysUntilExpiry: number
  registrationNumber: string
  registrationId: string
}

export const RegistrationExpiringEmail = ({
  councilArea,
  propertyAddress,
  expiryDate,
  daysUntilExpiry,
  registrationNumber,
  registrationId,
}: RegistrationExpiringEmailProps) => {
  return (
    <EmailLayout
      preview={`Your ${councilArea} landlord registration expires in ${daysUntilExpiry} days`}
      heading="Landlord Registration Renewal Due"
    >
      <Section style={alertBox}>
        <Text style={alertText}>
          ⏰ Your landlord registration with <strong>{councilArea}</strong> Council
          expires in <strong>{daysUntilExpiry} days</strong>
        </Text>
      </Section>

      <Text style={paragraph}>
        <strong>Property:</strong> {propertyAddress}
      </Text>
      
      <Text style={paragraph}>
        <strong>Council:</strong> {councilArea}
      </Text>
      
      <Text style={paragraph}>
        <strong>Registration Number:</strong> {registrationNumber}
      </Text>
      
      <Text style={paragraph}>
        <strong>Expiry Date:</strong> {expiryDate}
      </Text>

      <Text style={paragraph}>
        Under the Antisocial Behaviour etc. (Scotland) Act 2004, all private landlords must be
        registered with their local council. You must renew your registration before it expires
        to continue letting your property legally.
      </Text>

      <Section style={infoBox}>
        <Text style={infoTitle}>💡 Renewal Process</Text>
        <Text style={infoText}>
          1. Log into your council portal<br />
          2. Complete the renewal application<br />
          3. Pay the renewal fee<br />
          4. Upload your registration to ScotComply
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button
          style={button}
          href={`http://localhost:3000/dashboard/registrations/${registrationId}`}
        >
          View Registration Details
        </Button>
      </Section>

      <Text style={warningText}>
        <strong>⚠️ Important:</strong> Operating an unregistered rental property can result in
        fines up to £50,000 and you may be unable to evict tenants.
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
  backgroundColor: '#fffbeb',
  border: '2px solid #f59e0b',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const alertText = {
  color: '#1f2937',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  textAlign: 'center' as const,
}

const infoBox = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #86efac',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const infoTitle = {
  color: '#065f46',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px',
}

const infoText = {
  color: '#047857',
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

const warningText = {
  backgroundColor: '#fee2e2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  color: '#991b1b',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 0',
  padding: '12px',
}

export default RegistrationExpiringEmail
