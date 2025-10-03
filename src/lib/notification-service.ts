import { PrismaClient } from '@prisma/client'
import { sendEmail } from './email'
import { render } from '@react-email/components'
import CertificateExpiryEmail from '@/emails/CertificateExpiryEmail'

const prisma = new PrismaClient()

/**
 * Notification Service
 * Handles creation and management of in-app notifications
 */

interface CreateNotificationParams {
  userId: string
  type: 'certificate_expiring' | 'hmo_expiring' | 'registration_expiring' | 'assessment_due' | 'system'
  title: string
  message: string
  link?: string
  priority?: 'low' | 'normal' | 'high' | 'critical'
  metadata?: any
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, link, priority = 'normal', metadata } = params

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link,
      priority,
      metadata,
    },
  })

  // Send email for high/critical priority notifications if user has email notifications enabled
  if (priority === 'high' || priority === 'critical') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, emailNotificationsEnabled: true },
      })

      if (user && user.emailNotificationsEnabled) {
        // Determine email type and template data
        let emailType: 'CERTIFICATE_EXPIRY' | 'REGISTRATION_EXPIRY' | 'HMO_EXPIRY' | 'SYSTEM' = 'SYSTEM'
        let templateData: any = {}

        if (type === 'certificate_expiring' && metadata) {
          emailType = 'CERTIFICATE_EXPIRY'
          templateData = {
            landlordName: user.name,
            propertyAddress: metadata.propertyAddress || 'your property',
            certificateType: metadata.certificateType || 'Certificate',
            expiryDate: metadata.expiryDate ? new Date(metadata.expiryDate).toLocaleDateString() : 'soon',
            daysUntilExpiry: metadata.daysUntilExpiry || 0,
            dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`,
          }
        }

        // Send email
        const html = await render(CertificateExpiryEmail(templateData))
        await sendEmail({
          to: user.email,
          subject: title,
          html,
        })

        // Create email record
        await prisma.email.create({
          data: {
            userId,
            to: user.email,
            from: process.env.EMAIL_FROM || 'noreply@scotcomply.com',
            subject: title,
            body: message,
            htmlBody: html,
            type: emailType,
            status: 'SENT',
            sentAt: new Date(),
            metadata: templateData,
          },
        })
      }
    } catch (error) {
      console.error('Failed to send notification email:', error)
      // Don't fail the notification creation if email fails
    }
  }

  return notification
}

/**
 * Check for expiring certificates and create notifications
 * Runs daily via cron job
 */
export async function checkExpiringCertificates() {
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Get all certificates expiring within 30 days
  const expiringCertificates = await prisma.certificate.findMany({
    where: {
      expiryDate: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
    },
    include: {
      property: true,
    },
  })

  const notificationsCreated = []

  for (const cert of expiringCertificates) {
    const daysUntilExpiry = Math.ceil(
      (cert.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Determine priority based on urgency
    let priority: 'low' | 'normal' | 'high' | 'critical'
    if (daysUntilExpiry <= 7) {
      priority = 'critical'
    } else if (daysUntilExpiry <= 14) {
      priority = 'high'
    } else {
      priority = 'normal'
    }

    // Check if we already created a notification for this certificate recently
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: cert.property.ownerId,
        type: 'certificate_expiring',
        metadata: {
          path: ['certificateId'],
          equals: cert.id,
        },
        createdAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Within last 24 hours
        },
      },
    })

    // Only create notification if one doesn't exist for this certificate in the last 24 hours
    if (!existingNotification) {
      const notification = await createNotification({
        userId: cert.property.ownerId,
        type: 'certificate_expiring',
        title: `${cert.certificateType} Certificate Expiring Soon`,
        message: `Your ${cert.certificateType} certificate for ${cert.property.address} expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}. Please renew to stay compliant.`,
        link: `/dashboard/certificates/${cert.id}`,
        priority,
        metadata: {
          certificateId: cert.id,
          propertyId: cert.propertyId,
          propertyAddress: cert.property.address,
          certificateType: cert.certificateType,
          expiryDate: cert.expiryDate,
          daysUntilExpiry,
        },
      })
      notificationsCreated.push(notification)
    }
  }

  return {
    certificatesChecked: expiringCertificates.length,
    notificationsCreated: notificationsCreated.length,
    notifications: notificationsCreated,
  }
}

/**
 * Check for expiring HMO licenses and create notifications
 */
export async function checkExpiringHMOLicenses() {
  const now = new Date()
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  const expiringLicenses = await prisma.hMOLicense.findMany({
    where: {
      expiryDate: {
        gte: now,
        lte: sixtyDaysFromNow,
      },
    },
    include: {
      property: true,
    },
  })

  const notificationsCreated = []

  for (const license of expiringLicenses) {
    const daysUntilExpiry = Math.ceil(
      (license.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    let priority: 'low' | 'normal' | 'high' | 'critical'
    if (daysUntilExpiry <= 14) {
      priority = 'critical'
    } else if (daysUntilExpiry <= 30) {
      priority = 'high'
    } else {
      priority = 'normal'
    }

    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: license.property.ownerId,
        type: 'hmo_expiring',
        metadata: {
          path: ['licenseId'],
          equals: license.id,
        },
        createdAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
      },
    })

    if (!existingNotification) {
      const notification = await createNotification({
        userId: license.property.ownerId,
        type: 'hmo_expiring',
        title: 'HMO License Expiring Soon',
        message: `Your HMO license for ${license.property.address} expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}. Renew to avoid penalties.`,
        link: `/dashboard/hmo/${license.id}`,
        priority,
        metadata: {
          licenseId: license.id,
          propertyId: license.propertyId,
          expiryDate: license.expiryDate,
          daysUntilExpiry,
        },
      })
      notificationsCreated.push(notification)
    }
  }

  return {
    licensesChecked: expiringLicenses.length,
    notificationsCreated: notificationsCreated.length,
    notifications: notificationsCreated,
  }
}

/**
 * Check for expiring landlord registrations and create notifications
 */
export async function checkExpiringRegistrations() {
  const now = new Date()
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  const expiringRegistrations = await prisma.landlordRegistration.findMany({
    where: {
      expiryDate: {
        gte: now,
        lte: sixtyDaysFromNow,
      },
    },
    include: {
      property: true,
    },
  })

  const notificationsCreated = []

  for (const registration of expiringRegistrations) {
    const daysUntilExpiry = Math.ceil(
      (registration.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    let priority: 'low' | 'normal' | 'high' | 'critical'
    if (daysUntilExpiry <= 14) {
      priority = 'critical'
    } else if (daysUntilExpiry <= 30) {
      priority = 'high'
    } else {
      priority = 'normal'
    }

    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: registration.property.ownerId,
        type: 'registration_expiring',
        metadata: {
          path: ['registrationId'],
          equals: registration.id,
        },
        createdAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
      },
    })

    if (!existingNotification) {
      const notification = await createNotification({
        userId: registration.property.ownerId,
        type: 'registration_expiring',
        title: 'Landlord Registration Expiring Soon',
        message: `Your landlord registration for ${registration.property.address} expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}. Renew to stay compliant.`,
        link: `/dashboard/registrations/${registration.id}`,
        priority,
        metadata: {
          registrationId: registration.id,
          propertyId: registration.propertyId,
          expiryDate: registration.expiryDate,
          daysUntilExpiry,
        },
      })
      notificationsCreated.push(notification)
    }
  }

  return {
    registrationsChecked: expiringRegistrations.length,
    notificationsCreated: notificationsCreated.length,
    notifications: notificationsCreated,
  }
}

/**
 * Check for overdue repairing standard assessments
 */
export async function checkOverdueAssessments() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Get all assessments with non-compliant items that haven't been resolved
  const assessmentsWithIssues = await prisma.repairingStandardAssessment.findMany({
    where: {
      createdAt: {
        lte: thirtyDaysAgo,
      },
      items: {
        some: {
          status: {
            not: 'compliant',
          },
          completedDate: null,
        },
      },
    },
    include: {
      property: true,
      items: {
        where: {
          status: {
            not: 'compliant',
          },
          completedDate: null,
        },
      },
    },
  })

  const notificationsCreated = []

  for (const assessment of assessmentsWithIssues) {
    const daysOverdue = Math.ceil(
      (now.getTime() - assessment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    let priority: 'low' | 'normal' | 'high' | 'critical'
    if (daysOverdue > 90) {
      priority = 'critical'
    } else if (daysOverdue > 60) {
      priority = 'high'
    } else {
      priority = 'normal'
    }

    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: assessment.property.ownerId,
        type: 'assessment_due',
        metadata: {
          path: ['assessmentId'],
          equals: assessment.id,
        },
        createdAt: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Within last 7 days
        },
      },
    })

    if (!existingNotification) {
      const nonCompliantCount = assessment.items.length
      const notification = await createNotification({
        userId: assessment.property.ownerId,
        type: 'assessment_due',
        title: 'Repairing Standard Action Required',
        message: `Your property at ${assessment.property.address} has ${nonCompliantCount} non-compliant item${nonCompliantCount > 1 ? 's' : ''} that ${nonCompliantCount > 1 ? 'are' : 'is'} ${daysOverdue} days overdue. Take action now.`,
        link: `/dashboard/repairing-standard/${assessment.id}`,
        priority,
        metadata: {
          assessmentId: assessment.id,
          propertyId: assessment.propertyId,
          daysOverdue,
          nonCompliantCount,
        },
      })
      notificationsCreated.push(notification)
    }
  }

  return {
    assessmentsChecked: assessmentsWithIssues.length,
    notificationsCreated: notificationsCreated.length,
    notifications: notificationsCreated,
  }
}

/**
 * Run all notification checks
 * This is called by the cron job
 */
export async function runNotificationChecks() {
  const results = {
    certificates: await checkExpiringCertificates(),
    hmoLicenses: await checkExpiringHMOLicenses(),
    registrations: await checkExpiringRegistrations(),
    assessments: await checkOverdueAssessments(),
  }

  const totalNotifications = 
    results.certificates.notificationsCreated +
    results.hmoLicenses.notificationsCreated +
    results.registrations.notificationsCreated +
    results.assessments.notificationsCreated

  return {
    success: true,
    timestamp: new Date(),
    totalNotifications,
    details: results,
  }
}
