import { Resend } from 'resend'
import { env } from './env'

/**
 * Resend client instance
 * Null if RESEND_API_KEY is not configured (development fallback)
 */
export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

/**
 * Check if email sending is enabled
 */
export const isEmailEnabled = () => {
  return resend !== null
}

/**
 * Send email with Resend
 * Logs to console in development if Resend is not configured
 */
export async function sendEmail({
  to,
  subject,
  html,
  react,
}: {
  to: string | string[]
  subject: string
  html?: string
  react?: React.ReactElement
}) {
  // Development fallback - log instead of sending
  if (!resend) {
    console.log('📧 [Email Preview - Resend Not Configured]')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('HTML:', html?.substring(0, 200) + '...')
    console.log('---')
    return {
      success: true,
      data: { id: 'dev-email-' + Date.now() },
    }
  }

  try {
    const result = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      react,
    })

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    console.error('Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Email types for the application
 */
export enum EmailType {
  CERTIFICATE_EXPIRING = 'certificate_expiring',
  CERTIFICATE_EXPIRED = 'certificate_expired',
  REGISTRATION_EXPIRING = 'registration_expiring',
  REGISTRATION_EXPIRED = 'registration_expired',
  HMO_EXPIRING = 'hmo_expiring',
  HMO_EXPIRED = 'hmo_expired',
  FIRE_SAFETY_ALERT = 'fire_safety_alert',
  INSPECTION_OVERDUE = 'inspection_overdue',
}
