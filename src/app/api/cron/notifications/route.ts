import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  sendCertificateExpiringEmail, 
  sendRegistrationExpiringEmail,
  sendHMOLicenseExpiringEmail,
  sendFireSafetyAlertEmail,
  getDaysUntilExpiry,
  formatEmailDate,
} from '@/lib/email-service'
import { runNotificationChecks } from '@/lib/notification-service'

/**
 * Automated Notification Cron Job
 * 
 * This API route is triggered by Vercel Cron to send automated email notifications.
 * It checks all users with notifications enabled and sends appropriate alerts based on:
 * - Email notification preferences (enabled/disabled)
 * - Email frequency (daily/weekly/disabled)
 * - Last notification sent timestamp
 * 
 * Security: Requires CRON_SECRET in Authorization header
 * Schedule: Configured in vercel.json (default: daily at 9:00 AM GMT)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('CRON_SECRET not configured')
    return NextResponse.json(
      { error: 'Cron configuration error' },
      { status: 500 }
    )
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('Unauthorized cron request')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  console.log('🔔 Starting automated notification job...')
  const startTime = Date.now()

  try {
    // Run in-app notification checks first
    console.log('📱 Creating in-app notifications...')
    const inAppResults = await runNotificationChecks()
    console.log(`✅ Created ${inAppResults.totalNotifications} in-app notifications`)

    // Get all users with email notifications enabled
    const users = await prisma.user.findMany({
      where: {
        emailNotificationsEnabled: true,
        emailFrequency: {
          not: 'disabled',
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailFrequency: true,
        lastNotificationSent: true,
      },
    })

    console.log(`📧 Found ${users.length} users with notifications enabled`)

    const results = {
      totalUsers: users.length,
      processed: 0,
      skipped: 0,
      certificatesSent: 0,
      registrationsSent: 0,
      hmoSent: 0,
      fireSafetySent: 0,
      errors: [] as string[],
    }

    for (const user of users) {
      try {
        // Check if we should send based on frequency
        const shouldSend = checkSendFrequency(user.emailFrequency, user.lastNotificationSent)

        if (!shouldSend) {
          console.log(`⏭️  Skipping ${user.email} - not due yet`)
          results.skipped++
          continue
        }

        console.log(`📨 Processing notifications for ${user.email}`)

        // Send certificate expiry notifications (30-day window)
        const certCount = await sendCertificateNotifications(user)
        results.certificatesSent += certCount

        // Send registration expiry notifications (60-day window)
        const regCount = await sendRegistrationNotifications(user)
        results.registrationsSent += regCount

        // Send HMO license expiry notifications (60-day window)
        const hmoCount = await sendHMOLicenseNotifications(user)
        results.hmoSent += hmoCount

        // Send fire safety alerts (immediate)
        const fireCount = await sendFireSafetyAlerts(user)
        results.fireSafetySent += fireCount

        // Update lastNotificationSent timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { lastNotificationSent: new Date() },
        })

        results.processed++
        console.log(`✅ Completed notifications for ${user.email}: ${certCount + regCount + hmoCount + fireCount} emails sent`)
      } catch (error) {
        const errorMsg = `Failed to process ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(errorMsg)
        results.errors.push(errorMsg)
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✨ Notification job completed in ${duration}s`)
    console.log(`� In-app notifications: ${inAppResults.totalNotifications}`)
    console.log(`�📊 Email results: ${results.processed} processed, ${results.skipped} skipped`)
    console.log(`📧 Total emails sent: ${results.certificatesSent + results.registrationsSent + results.hmoSent + results.fireSafetySent}`)

    return NextResponse.json({
      success: true,
      inAppNotifications: inAppResults,
      emailResults: results,
      duration: `${duration}s`,
    })
  } catch (error) {
    console.error('❌ Notification job failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Check if notifications should be sent based on frequency and last sent time
 */
function checkSendFrequency(
  frequency: string,
  lastSent: Date | null
): boolean {
  if (frequency === 'disabled') return false
  if (!lastSent) return true // Never sent before

  const now = new Date()
  const lastSentDate = new Date(lastSent)
  const hoursSinceLastSent = (now.getTime() - lastSentDate.getTime()) / (1000 * 60 * 60)

  if (frequency === 'daily') {
    // Send if more than 20 hours have passed (allows for some flexibility)
    return hoursSinceLastSent >= 20
  }

  if (frequency === 'weekly') {
    // Send if more than 6.5 days have passed
    return hoursSinceLastSent >= 156 // 6.5 days
  }

  return false
}

/**
 * Send certificate expiry notifications for a user
 */
async function sendCertificateNotifications(user: { id: string; email: string }): Promise<number> {
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const expiringCerts = await prisma.certificate.findMany({
    where: {
      userId: user.id,
      expiryDate: {
        gte: new Date(),
        lte: thirtyDaysFromNow,
      },
    },
    include: {
      property: true,
    },
  })

  let sentCount = 0
  for (const cert of expiringCerts) {
    const daysUntilExpiry = getDaysUntilExpiry(cert.expiryDate)
    const result = await sendCertificateExpiringEmail({
      to: user.email,
      certificateType: cert.certificateType.toUpperCase().replace('_', ' '),
      propertyAddress: cert.property.address,
      expiryDate: formatEmailDate(cert.expiryDate),
      daysUntilExpiry,
      certificateId: cert.id,
    })
    if (result.success) sentCount++
  }

  return sentCount
}

/**
 * Send registration expiry notifications for a user
 */
async function sendRegistrationNotifications(user: { id: string; email: string }): Promise<number> {
  const sixtyDaysFromNow = new Date()
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)

  const expiringRegs = await prisma.landlordRegistration.findMany({
    where: {
      userId: user.id,
      expiryDate: {
        gte: new Date(),
        lte: sixtyDaysFromNow,
      },
    },
    include: {
      property: true,
    },
  })

  let sentCount = 0
  for (const reg of expiringRegs) {
    const daysUntilExpiry = getDaysUntilExpiry(reg.expiryDate)
    const result = await sendRegistrationExpiringEmail({
      to: user.email,
      councilArea: reg.councilArea,
      propertyAddress: reg.property.address,
      expiryDate: formatEmailDate(reg.expiryDate),
      daysUntilExpiry,
      registrationNumber: reg.registrationNumber,
      registrationId: reg.id,
    })
    if (result.success) sentCount++
  }

  return sentCount
}

/**
 * Send HMO license expiry notifications for a user
 */
async function sendHMOLicenseNotifications(user: { id: string; email: string }): Promise<number> {
  const sixtyDaysFromNow = new Date()
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)

  const expiringHMOs = await prisma.hMOLicense.findMany({
    where: {
      userId: user.id,
      expiryDate: {
        gte: new Date(),
        lte: sixtyDaysFromNow,
      },
    },
    include: {
      property: true,
    },
  })

  let sentCount = 0
  for (const hmo of expiringHMOs) {
    const daysUntilExpiry = getDaysUntilExpiry(hmo.expiryDate)
    const result = await sendHMOLicenseExpiringEmail({
      to: user.email,
      councilArea: hmo.councilArea,
      propertyAddress: hmo.property.address,
      expiryDate: formatEmailDate(hmo.expiryDate),
      daysUntilExpiry,
      licenseNumber: hmo.licenseNumber,
      occupancyLimit: hmo.occupancyLimit,
      hmoId: hmo.id,
    })
    if (result.success) sentCount++
  }

  return sentCount
}

/**
 * Send fire safety alerts for a user
 */
async function sendFireSafetyAlerts(user: { id: string; email: string }): Promise<number> {
  const nonCompliantHMOs = await prisma.hMOLicense.findMany({
    where: {
      userId: user.id,
      fireSafetyCompliant: false,
    },
    include: {
      property: true,
    },
  })

  let sentCount = 0
  for (const hmo of nonCompliantHMOs) {
    const result = await sendFireSafetyAlertEmail({
      to: user.email,
      propertyAddress: hmo.property.address,
      licenseNumber: hmo.licenseNumber,
      councilArea: hmo.councilArea,
      occupancyLimit: hmo.occupancyLimit,
      lastInspectionDate: hmo.lastInspectionDate ? formatEmailDate(hmo.lastInspectionDate) : undefined,
      hmoId: hmo.id,
    })
    if (result.success) sentCount++
  }

  return sentCount
}
