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

interface WelcomeEmailProps {
  name: string
  dashboardUrl: string
}

export default function WelcomeEmail({
  name = 'Landlord',
  dashboardUrl = 'https://scotcomply.com/dashboard',
}: WelcomeEmailProps) {
  const previewText = 'Welcome to ScotComply - Your Scottish Letting Compliance Platform'

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🏠 Welcome to ScotComply!</Heading>
          
          <Text style={text}>
            Hello {name},
          </Text>

          <Text style={text}>
            Thank you for joining ScotComply, Scotland&apos;s leading compliance platform for
            landlords and letting agents. We&apos;re here to help you stay on top of all your
            legal obligations and keep your properties compliant.
          </Text>

          <Section style={featureBox}>
            <Heading style={h2}>What You Can Do with ScotComply:</Heading>
            <Text style={feature}>✅ Track all safety certificates (Gas, EICR, EPC)</Text>
            <Text style={feature}>✅ Manage landlord registrations across all councils</Text>
            <Text style={feature}>✅ Monitor HMO licenses and renewals</Text>
            <Text style={feature}>✅ Conduct Repairing Standard assessments</Text>
            <Text style={feature}>✅ Generate compliance reports and documents</Text>
            <Text style={feature}>✅ Receive automated expiry reminders</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Go to Your Dashboard
            </Button>
          </Section>

          <Hr style={hr} />

          <Section style={infoBox}>
            <Heading style={h3}>Getting Started:</Heading>
            <Text style={listItem}>
              1. <strong>Add Your Properties</strong> - Start by adding your rental properties to the system
            </Text>
            <Text style={listItem}>
              2. <strong>Upload Certificates</strong> - Add your existing safety certificates
            </Text>
            <Text style={listItem}>
              3. <strong>Set Up Registrations</strong> - Enter your landlord registration details
            </Text>
            <Text style={listItem}>
              4. <strong>Enable Notifications</strong> - Configure how you&apos;d like to receive reminders
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={supportBox}>
            <Heading style={h3}>Need Help?</Heading>
            <Text style={supportText}>
              Our team is here to help you get started. If you have any questions or need
              assistance, don&apos;t hesitate to reach out:
            </Text>
            <Text style={supportText}>
              📧 Email: support@scotcomply.com<br />
              📱 Phone: 0800 123 4567<br />
              💬 Live Chat: Available in your dashboard
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You&apos;re receiving this email because you created an account on ScotComply.
            To manage your notification preferences,{' '}
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
  fontSize: '28px',
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
  fontSize: '18px',
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

const feature = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
}

const featureBox = {
  backgroundColor: '#F0F9FF',
  borderLeft: '4px solid #3B82F6',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 40px',
}

const infoBox = {
  backgroundColor: '#F9FAFB',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 40px',
}

const supportBox = {
  backgroundColor: '#FEF2F2',
  borderLeft: '4px solid #EF4444',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 40px',
}

const supportText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
}

const listItem = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '12px 0',
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
  padding: '14px 40px',
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
  lineHeight: '18px',
  textAlign: 'center' as const,
  margin: '8px 0',
  padding: '0 40px',
}
