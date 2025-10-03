import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface CertificateExpiryEmailProps {
  landlordName: string
  propertyAddress: string
  certificateType: string
  expiryDate: string
  daysUntilExpiry: number
  dashboardUrl: string
}

export default function CertificateExpiryEmail({
  landlordName = 'Landlord',
  propertyAddress = '123 Main Street, Edinburgh',
  certificateType = 'Gas Safety Certificate',
  expiryDate = '15 October 2025',
  daysUntilExpiry = 14,
  dashboardUrl = 'https://scotcomply.com/dashboard',
}: CertificateExpiryEmailProps) {
  const previewText = `${certificateType} expiring in ${daysUntilExpiry} days`

  const getUrgencyColor = () => {
    if (daysUntilExpiry <= 7) return '#DC2626' // red-600
    if (daysUntilExpiry <= 14) return '#EA580C' // orange-600
    return '#CA8A04' // yellow-600
  }

  const urgencyColor = getUrgencyColor()

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🏠 ScotComply</Heading>
          
          <Text style={text}>
            Hello {landlordName},
          </Text>

          <Section style={{...alertBox, borderColor: urgencyColor}}>
            <Heading style={{...h2, color: urgencyColor}}>
              Certificate Expiring Soon
            </Heading>
            <Text style={alertText}>
              Your {certificateType} for <strong>{propertyAddress}</strong> will expire in{' '}
              <strong style={{color: urgencyColor}}>{daysUntilExpiry} days</strong> on {expiryDate}.
            </Text>
          </Section>

          {daysUntilExpiry <= 7 && (
            <Section style={warningBox}>
              <Text style={warningText}>
                ⚠️ <strong>Urgent Action Required</strong> - This certificate is expiring very soon.
                Operating without valid certificates is illegal under Scottish law and may result in fines.
              </Text>
            </Section>
          )}

          <Text style={text}>
            To maintain compliance with Scottish letting regulations, please renew this certificate as soon as possible.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              View Dashboard
            </Button>
          </Section>

          <Hr style={hr} />

          <Section style={infoBox}>
            <Heading style={h3}>What You Need to Do:</Heading>
            <Text style={listItem}>1. Contact a qualified professional to arrange renewal</Text>
            <Text style={listItem}>2. Schedule the inspection/assessment</Text>
            <Text style={listItem}>3. Upload the new certificate to ScotComply once received</Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This is an automated reminder from ScotComply. To manage your notification preferences,{' '}
            <Link href={`${dashboardUrl}/settings`} style={link}>
              visit your settings
            </Link>
            .
          </Text>

          <Text style={footer}>
            © {new Date().getFullYear()} ScotComply - Scottish Letting Compliance Platform
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
  padding: '0',
}

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 15px',
  padding: '0',
}

const h3 = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 10px',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  margin: '16px 0',
  padding: '0 40px',
}

const alertBox = {
  backgroundColor: '#FEF2F2',
  borderLeft: '4px solid',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 40px',
}

const alertText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
}

const warningBox = {
  backgroundColor: '#FFFBEB',
  borderLeft: '4px solid #F59E0B',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 40px',
}

const warningText = {
  color: '#92400E',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const infoBox = {
  backgroundColor: '#F0F9FF',
  borderLeft: '4px solid #3B82F6',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 40px',
}

const listItem = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#4F46E5',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 40px',
}

const link = {
  color: '#4F46E5',
  textDecoration: 'underline',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  margin: '8px 0',
  padding: '0 40px',
}
