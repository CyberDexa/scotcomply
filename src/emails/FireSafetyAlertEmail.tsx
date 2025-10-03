import * as React from 'react'
import { Text, Button, Section } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface FireSafetyAlertEmailProps {
  propertyAddress: string
  licenseNumber: string
  councilArea: string
  occupancyLimit: number
  lastInspectionDate?: string
  hmoId: string
}

export const FireSafetyAlertEmail = ({
  propertyAddress,
  licenseNumber,
  councilArea,
  occupancyLimit,
  lastInspectionDate,
  hmoId,
}: FireSafetyAlertEmailProps) => {
  return (
    <EmailLayout
      preview={`Fire safety compliance required for ${propertyAddress}`}
      heading="🔥 Fire Safety Compliance Alert"
    >
      <Section style={criticalBox}>
        <Text style={criticalText}>
          ⚠️ URGENT: Fire Safety Compliance Required
        </Text>
      </Section>

      <Text style={paragraph}>
        Your HMO property has been flagged as fire safety non-compliant. This is a serious
        issue that requires immediate attention.
      </Text>

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
        <strong>Occupancy:</strong> {occupancyLimit} people
      </Text>
      
      {lastInspectionDate && (
        <Text style={paragraph}>
          <strong>Last Inspection:</strong> {lastInspectionDate}
        </Text>
      )}

      <Section style={requirementsBox}>
        <Text style={requirementsTitle}>🔥 Fire Safety Requirements for HMOs</Text>
        <Text style={requirementsText}>
          <strong>Mandatory Equipment:</strong><br />
          • Interlinked smoke alarms in all rooms and hallways<br />
          • Heat detectors in kitchens<br />
          • Carbon monoxide detectors near fuel-burning appliances<br />
          • Fire blanket in kitchen<br />
          • Clear escape routes<br />
          • Emergency lighting (if required)<br />
          • Fire doors (if required)<br /><br />
          
          <strong>Testing:</strong><br />
          • All alarms must be tested regularly<br />
          • Annual professional inspection recommended<br />
          • Records must be maintained
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button
          style={button}
          href={`http://localhost:3000/dashboard/hmo/${hmoId}`}
        >
          Update Fire Safety Status
        </Button>
      </Section>

      <Section style={dangerBox}>
        <Text style={dangerTitle}>🚨 Serious Consequences</Text>
        <Text style={dangerText}>
          Fire safety non-compliance in HMOs can result in:<br /><br />
          
          • Immediate closure orders<br />
          • Criminal prosecution<br />
          • Fines up to £50,000<br />
          • License revocation<br />
          • Inability to operate as HMO<br />
          • Civil liability if incident occurs
        </Text>
      </Section>

      <Text style={actionText}>
        <strong>Required Action:</strong> Contact a qualified fire safety professional immediately
        to assess your property and install necessary equipment. Once compliant, update your
        status in ScotComply.
      </Text>

      <Text style={helpText}>
        Need help? Many councils offer free fire safety advice for landlords. Contact your
        local fire and rescue service for guidance.
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

const criticalBox = {
  backgroundColor: '#fef2f2',
  border: '3px solid #dc2626',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const criticalText = {
  color: '#991b1b',
  fontSize: '20px',
  fontWeight: 'bold',
  lineHeight: '28px',
  margin: '0',
}

const requirementsBox = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fcd34d',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const requirementsTitle = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const requirementsText = {
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
  backgroundColor: '#dc2626',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const dangerBox = {
  backgroundColor: '#fee2e2',
  border: '2px solid #dc2626',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const dangerTitle = {
  color: '#991b1b',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const dangerText = {
  color: '#7f1d1d',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
}

const actionText = {
  backgroundColor: '#dbeafe',
  border: '1px solid #93c5fd',
  borderRadius: '8px',
  color: '#1e40af',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '24px 0',
  padding: '16px',
}

const helpText = {
  color: '#6b7280',
  fontSize: '14px',
  fontStyle: 'italic',
  lineHeight: '20px',
  margin: '16px 0 0',
}

export default FireSafetyAlertEmail
