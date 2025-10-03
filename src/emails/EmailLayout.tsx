import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'

interface EmailLayoutProps {
  preview: string
  heading: string
  children: React.ReactNode
}

export const EmailLayout = ({ preview, heading, children }: EmailLayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerTitle}>ScotComply</Heading>
            <Text style={headerSubtitle}>Scottish Compliance Tracking</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>{heading}</Heading>
            {children}
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              This is an automated notification from ScotComply.
            </Text>
            <Text style={footerText}>
              <Link href="http://localhost:3000/dashboard" style={link}>
                View Dashboard
              </Link>
              {' · '}
              <Link href="http://localhost:3000/dashboard/settings" style={link}>
                Notification Settings
              </Link>
            </Text>
            <Text style={footerCopyright}>
              © 2025 ScotComply. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
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
  maxWidth: '600px',
}

const header = {
  padding: '32px 24px',
  backgroundColor: '#4f46e5',
  textAlign: 'center' as const,
}

const headerTitle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px',
}

const headerSubtitle = {
  color: '#e0e7ff',
  fontSize: '14px',
  margin: '0',
}

const content = {
  padding: '24px',
}

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const footer = {
  padding: '0 24px',
}

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '4px 0',
  textAlign: 'center' as const,
}

const footerCopyright = {
  color: '#9ca3af',
  fontSize: '11px',
  margin: '16px 0 0',
  textAlign: 'center' as const,
}

const link = {
  color: '#4f46e5',
  textDecoration: 'underline',
}

export default EmailLayout
