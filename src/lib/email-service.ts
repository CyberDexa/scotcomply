import { render } from '@react-email/render'
import { sendEmail, EmailType } from '@/lib/email'
import { CertificateExpiringEmail } from '@/emails/CertificateExpiringEmail'
import { RegistrationExpiringEmail } from '@/emails/RegistrationExpiringEmail'
import { HMOLicenseExpiringEmail } from '@/emails/HMOLicenseExpiringEmail'
import { FireSafetyAlertEmail } from '@/emails/FireSafetyAlertEmail'

/**
 * Send certificate expiring notification
 */
export async function sendCertificateExpiringEmail({
  to,
  certificateType,
  propertyAddress,
  expiryDate,
  daysUntilExpiry,
  certificateId,
}: {
  to: string
  certificateType: string
  propertyAddress: string
  expiryDate: string
  daysUntilExpiry: number
  certificateId: string
}) {
  const emailHtml = await render(
    CertificateExpiringEmail({
      certificateType,
      propertyAddress,
      expiryDate,
      daysUntilExpiry,
      certificateId,
    })
  )

  return sendEmail({
    to,
    subject: `Certificate Expiring: ${certificateType} - ${daysUntilExpiry} days remaining`,
    html: emailHtml,
  })
}

/**
 * Send registration expiring notification
 */
export async function sendRegistrationExpiringEmail({
  to,
  councilArea,
  propertyAddress,
  expiryDate,
  daysUntilExpiry,
  registrationNumber,
  registrationId,
}: {
  to: string
  councilArea: string
  propertyAddress: string
  expiryDate: string
  daysUntilExpiry: number
  registrationNumber: string
  registrationId: string
}) {
  const emailHtml = await render(
    RegistrationExpiringEmail({
      councilArea,
      propertyAddress,
      expiryDate,
      daysUntilExpiry,
      registrationNumber,
      registrationId,
    })
  )

  return sendEmail({
    to,
    subject: `Landlord Registration Renewal: ${councilArea} - ${daysUntilExpiry} days remaining`,
    html: emailHtml,
  })
}

/**
 * Send HMO license expiring notification
 */
export async function sendHMOLicenseExpiringEmail({
  to,
  councilArea,
  propertyAddress,
  expiryDate,
  daysUntilExpiry,
  licenseNumber,
  occupancyLimit,
  hmoId,
}: {
  to: string
  councilArea: string
  propertyAddress: string
  expiryDate: string
  daysUntilExpiry: number
  licenseNumber: string
  occupancyLimit: number
  hmoId: string
}) {
  const emailHtml = await render(
    HMOLicenseExpiringEmail({
      councilArea,
      propertyAddress,
      expiryDate,
      daysUntilExpiry,
      licenseNumber,
      occupancyLimit,
      hmoId,
    })
  )

  return sendEmail({
    to,
    subject: `HMO License Renewal: ${propertyAddress} - ${daysUntilExpiry} days remaining`,
    html: emailHtml,
  })
}

/**
 * Send fire safety alert
 */
export async function sendFireSafetyAlertEmail({
  to,
  propertyAddress,
  licenseNumber,
  councilArea,
  occupancyLimit,
  lastInspectionDate,
  hmoId,
}: {
  to: string
  propertyAddress: string
  licenseNumber: string
  councilArea: string
  occupancyLimit: number
  lastInspectionDate?: string
  hmoId: string
}) {
  const emailHtml = await render(
    FireSafetyAlertEmail({
      propertyAddress,
      licenseNumber,
      councilArea,
      occupancyLimit,
      lastInspectionDate,
      hmoId,
    })
  )

  return sendEmail({
    to,
    subject: `🔥 URGENT: Fire Safety Compliance Required - ${propertyAddress}`,
    html: emailHtml,
  })
}

/**
 * Format date for email display
 */
export function formatEmailDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Calculate days until expiry
 */
export function getDaysUntilExpiry(expiryDate: Date | string): number {
  const today = new Date()
  const expiry = new Date(expiryDate)
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}
