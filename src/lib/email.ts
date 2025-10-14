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
  console.log('📧 sendEmail called with:', { to, subject, hasHtml: !!html, hasReact: !!react })
  console.log('📧 Resend client configured:', !!resend)
  console.log('📧 EMAIL_FROM:', env.EMAIL_FROM)
  
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
    console.log('📧 Calling resend.emails.send...')
    const result = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      react,
    })

    console.log('📧 Resend API Response:', JSON.stringify(result, null, 2))

    if (result.error) {
      console.error('📧 Resend returned an error:', result.error)
      return {
        success: false,
        error: result.error.message || 'Email sending failed',
      }
    }

    console.log('✅ Email sent successfully! ID:', result.data?.id)

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    console.error('📧 Exception in sendEmail:', error)
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

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({
  email,
  resetUrl,
  userName = 'User',
}: {
  email: string
  resetUrl: string
  userName?: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">ScotComply</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Scottish Landlord Compliance</p>
        </div>

        <!-- Content -->
        <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          
          <h2 style="color: #1f2937; margin: 0 0 20px 0;">Reset Your Password</h2>
          
          <p style="color: #4b5563; margin: 0 0 20px 0;">
            Hello${userName !== 'User' ? ` ${userName}` : ''},
          </p>
          
          <p style="color: #4b5563; margin: 0 0 20px 0;">
            We received a request to reset your password for your ScotComply account. Click the button below to create a new password:
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
            Or copy and paste this link into your browser:
          </p>
          
          <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; margin: 10px 0 20px 0;">
            <a href="${resetUrl}" style="color: #2563eb; text-decoration: none; font-size: 14px;">
              ${resetUrl}
            </a>
          </div>

          <!-- Security Info -->
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⚠️ Security Notice:</strong><br>
              This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
            Thanks,<br>
            The ScotComply Team
          </p>

        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0 0 10px 0;">
            © ${new Date().getFullYear()} ScotComply. All rights reserved.
          </p>
          <p style="margin: 0;">
            <a href="https://scotcomply.co.uk" style="color: #2563eb; text-decoration: none;">Visit our website</a>
          </p>
        </div>

      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Reset Your ScotComply Password',
    html,
  })
}
