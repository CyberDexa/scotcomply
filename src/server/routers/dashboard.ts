import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'

/**
 * Unified Dashboard Router
 * Aggregates data from all features for a comprehensive overview
 */
export const dashboardRouter = createTRPCRouter({
  /**
   * Get comprehensive overview statistics
   */
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Parallel queries for all statistics
    const [
      // Properties & Basic Info
      propertiesCount,
      properties,
      
      // Certificates
      totalCertificates,
      expiredCertificates,
      expiringCertificates,
      
      // Registrations
      activeRegistrations,
      expiringRegistrations,
      
      // HMO Licenses
      hmoLicenses,
      expiringHmoLicenses,
      
      // Repairing Standard Assessments
      assessments,
      nonCompliantAssessments,
      
      // Maintenance Requests
      openMaintenanceRequests,
      urgentMaintenanceRequests,
      
      // AML Screenings
      amlScreenings,
      pendingAmlReviews,
      
      // Council Alerts
      unreadAlerts,
      criticalAlerts,
      
      // Notifications
      unreadNotifications,
      
    ] = await Promise.all([
      // Properties
      ctx.prisma.property.count({ where: { ownerId: userId } }),
      ctx.prisma.property.findMany({
        where: { ownerId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          address: true,
          postcode: true,
          propertyType: true,
          councilArea: true,
        }
      }),
      
      // Certificates
      ctx.prisma.certificate.count({ where: { property: { ownerId: userId } } }),
      ctx.prisma.certificate.count({
        where: {
          property: { ownerId: userId },
          expiryDate: { lt: new Date() }
        }
      }),
      ctx.prisma.certificate.count({
        where: {
          property: { ownerId: userId },
          expiryDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        }
      }),
      
      // Registrations
      ctx.prisma.landlordRegistration.count({
        where: {
          property: { ownerId: userId },
          status: 'APPROVED'
        }
      }),
      ctx.prisma.landlordRegistration.count({
        where: {
          property: { ownerId: userId },
          status: 'APPROVED',
          expiryDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
          }
        }
      }),
      
      // HMO Licenses
      ctx.prisma.hMOLicense.count({
        where: { property: { ownerId: userId } }
      }),
      ctx.prisma.hMOLicense.count({
        where: {
          property: { ownerId: userId },
          expiryDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
          }
        }
      }),
      
      // Assessments
      ctx.prisma.repairingStandardAssessment.count({
        where: { property: { ownerId: userId } }
      }),
      ctx.prisma.repairingStandardAssessment.count({
        where: {
          property: { ownerId: userId },
          score: { lt: 80 }
        }
      }),
      
      // Maintenance
      ctx.prisma.maintenanceRequest.count({
        where: {
          property: { ownerId: userId },
          status: { in: ['SUBMITTED', 'IN_PROGRESS', 'SCHEDULED'] }
        }
      }),
      ctx.prisma.maintenanceRequest.count({
        where: {
          property: { ownerId: userId },
          status: { in: ['SUBMITTED', 'IN_PROGRESS'] },
          priority: { in: ['HIGH', 'EMERGENCY'] }
        }
      }),
      
      // AML Screenings
      ctx.prisma.aMLScreening.count({ where: { userId } }),
      ctx.prisma.aMLScreening.count({
        where: {
          userId,
          status: { in: ['REQUIRES_REVIEW'] }
        }
      }),
      
      // Council Alerts
      ctx.prisma.alertAcknowledgement.count({
        where: {
          userId,
          acknowledged: false
        }
      }),
      ctx.prisma.alertAcknowledgement.count({
        where: {
          userId,
          acknowledged: false,
          alert: {
            severity: { in: ['HIGH', 'CRITICAL'] }
          }
        }
      }),
      
      // Notifications
      ctx.prisma.notification.count({
        where: {
          userId,
          read: false
        }
      }),
    ])

    // Calculate overall compliance score
    const totalItems = totalCertificates + activeRegistrations + hmoLicenses + assessments
    const compliantItems = (totalCertificates - expiredCertificates) + 
                          (activeRegistrations - expiringRegistrations) + 
                          (hmoLicenses - expiringHmoLicenses) + 
                          (assessments - nonCompliantAssessments)
    const score = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 100

    return {
      overview: {
        propertiesCount,
        score,
        totalItems,
        compliantItems,
      },
      properties: {
        total: propertiesCount,
        recent: properties,
      },
      certificates: {
        total: totalCertificates,
        expired: expiredCertificates,
        expiringSoon: expiringCertificates,
      },
      registrations: {
        active: activeRegistrations,
        expiringSoon: expiringRegistrations,
      },
      hmo: {
        total: hmoLicenses,
        expiringSoon: expiringHmoLicenses,
      },
      assessments: {
        total: assessments,
        nonCompliant: nonCompliantAssessments,
      },
      maintenance: {
        open: openMaintenanceRequests,
        urgent: urgentMaintenanceRequests,
      },
      aml: {
        total: amlScreenings,
        pendingReview: pendingAmlReviews,
      },
      alerts: {
        unread: unreadAlerts,
        critical: criticalAlerts,
      },
      notifications: {
        unread: unreadNotifications,
      },
    }
  }),

  /**
   * Get upcoming deadlines across all features
   */
  getUpcomingDeadlines: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(365).default(30),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const futureDate = new Date(Date.now() + input.days * 24 * 60 * 60 * 1000)

      // Get all upcoming expiry dates
      const [certificates, registrations, hmoLicenses, assessments] = await Promise.all([
        // Certificate expiries
        ctx.prisma.certificate.findMany({
          where: {
            property: { ownerId: userId },
            expiryDate: {
              gte: new Date(),
              lte: futureDate,
            }
          },
          select: {
            id: true,
            certificateType: true,
            expiryDate: true,
            property: {
              select: {
                id: true,
                address: true,
              }
            }
          },
          orderBy: { expiryDate: 'asc' },
        }),
        
        // Registration expiries
        ctx.prisma.landlordRegistration.findMany({
          where: {
            property: { ownerId: userId },
            expiryDate: {
              gte: new Date(),
              lte: futureDate,
            }
          },
          select: {
            id: true,
            registrationNumber: true,
            expiryDate: true,
            property: {
              select: {
                id: true,
                address: true,
              }
            }
          },
          orderBy: { expiryDate: 'asc' },
        }),
        
        // HMO expiries
        ctx.prisma.hMOLicense.findMany({
          where: {
            property: { ownerId: userId },
            expiryDate: {
              gte: new Date(),
              lte: futureDate,
            }
          },
          select: {
            id: true,
            licenseNumber: true,
            expiryDate: true,
            property: {
              select: {
                id: true,
                address: true,
              }
            }
          },
          orderBy: { expiryDate: 'asc' },
        }),
        
        // Assessment dates (using assessmentDate since dueDate doesn't exist)
        ctx.prisma.repairingStandardAssessment.findMany({
          where: {
            property: { ownerId: userId },
            assessmentDate: {
              gte: new Date(new Date().setDate(new Date().getDate() - 365)), // Last year
              lte: futureDate,
            }
          },
          select: {
            id: true,
            assessmentDate: true,
            overallStatus: true,
            property: {
              select: {
                id: true,
                address: true,
              }
            }
          },
          orderBy: { assessmentDate: 'desc' },
        }),
      ])

      // Combine and format deadlines
      const deadlines = [
        ...certificates.map(cert => ({
          id: cert.id,
          type: 'certificate' as const,
          title: `${cert.certificateType} Certificate`,
          date: cert.expiryDate,
          propertyId: cert.property.id,
          propertyAddress: cert.property.address,
          urgency: getUrgency(cert.expiryDate),
        })),
        ...registrations.map(reg => ({
          id: reg.id,
          type: 'registration' as const,
          title: `Landlord Registration ${reg.registrationNumber}`,
          date: reg.expiryDate,
          propertyId: reg.property.id,
          propertyAddress: reg.property.address,
          urgency: getUrgency(reg.expiryDate),
        })),
        ...hmoLicenses.map(hmo => ({
          id: hmo.id,
          type: 'hmo' as const,
          title: `HMO License ${hmo.licenseNumber}`,
          date: hmo.expiryDate,
          propertyId: hmo.property.id,
          propertyAddress: hmo.property.address,
          urgency: getUrgency(hmo.expiryDate),
        })),
        ...assessments.map(assessment => ({
          id: assessment.id,
          type: 'assessment' as const,
          title: `Repairing Standard Assessment`,
          date: assessment.assessmentDate,
          propertyId: assessment.property.id,
          propertyAddress: assessment.property.address,
          urgency: getUrgency(assessment.assessmentDate),
        })),
      ]

      // Sort by date and limit
      return deadlines
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, input.limit)
    }),

  /**
   * Get recent activity across all features
   */
  getRecentActivity: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Get recent activities from different features
      const [
        recentProperties,
        recentCertificates,
        recentRegistrations,
        recentMaintenanceRequests,
        recentAssessments,
        recentScreenings,
      ] = await Promise.all([
        ctx.prisma.property.findMany({
          where: { ownerId: userId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            address: true,
            createdAt: true,
          }
        }),
        ctx.prisma.certificate.findMany({
          where: { property: { ownerId: userId } },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            certificateType: true,
            createdAt: true,
            property: { select: { address: true } }
          }
        }),
        ctx.prisma.landlordRegistration.findMany({
          where: { property: { ownerId: userId } },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            registrationNumber: true,
            createdAt: true,
            property: { select: { address: true } }
          }
        }),
        ctx.prisma.maintenanceRequest.findMany({
          where: { property: { ownerId: userId } },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            createdAt: true,
            property: { select: { address: true } }
          }
        }),
        ctx.prisma.repairingStandardAssessment.findMany({
          where: { property: { ownerId: userId } },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            createdAt: true,
            property: { select: { address: true } }
          }
        }),
        ctx.prisma.aMLScreening.findMany({
          where: { userId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            subjectName: true,
            createdAt: true,
          }
        }),
      ])

      // Combine and format activities
      const activities = [
        ...recentProperties.map(p => ({
          id: p.id,
          type: 'property' as const,
          title: `Added property: ${p.address}`,
          timestamp: p.createdAt,
        })),
        ...recentCertificates.map(c => ({
          id: c.id,
          type: 'certificate' as const,
          title: `Uploaded ${c.certificateType} for ${c.property.address}`,
          timestamp: c.createdAt,
        })),
        ...recentRegistrations.map(r => ({
          id: r.id,
          type: 'registration' as const,
          title: `Registered ${r.property.address}`,
          timestamp: r.createdAt,
        })),
        ...recentMaintenanceRequests.map(m => ({
          id: m.id,
          type: 'maintenance' as const,
          title: `New maintenance: ${m.title}`,
          timestamp: m.createdAt,
        })),
        ...recentAssessments.map(a => ({
          id: a.id,
          type: 'assessment' as const,
          title: `Started assessment for ${a.property.address}`,
          timestamp: a.createdAt,
        })),
        ...recentScreenings.map(s => ({
          id: s.id,
          type: 'aml' as const,
          title: `AML screening: ${s.subjectName}`,
          timestamp: s.createdAt,
        })),
      ]

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, input.limit)
    }),

  /**
   * Get critical issues requiring immediate attention
   */
  getCriticalIssues: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const issues = []

    // Expired certificates
    const expiredCerts = await ctx.prisma.certificate.count({
      where: {
        property: { ownerId: userId },
        expiryDate: { lt: new Date() }
      }
    })
    if (expiredCerts > 0) {
      issues.push({
        type: 'expired_certificates',
        severity: 'critical' as const,
        count: expiredCerts,
        message: `${expiredCerts} certificate${expiredCerts > 1 ? 's' : ''} expired`,
        action: 'Renew immediately',
        link: '/dashboard/certificates',
      })
    }

    // Pending AML reviews
    const pendingAml = await ctx.prisma.aMLScreening.count({
      where: {
        userId,
        status: 'REQUIRES_REVIEW',
      }
    })
    if (pendingAml > 0) {
      issues.push({
        type: 'pending_aml_review',
        severity: 'high' as const,
        count: pendingAml,
        message: `${pendingAml} AML screening${pendingAml > 1 ? 's' : ''} require review`,
        action: 'Review matches',
        link: '/dashboard/aml',
      })
    }

    // Critical maintenance requests
    const criticalMaintenance = await ctx.prisma.maintenanceRequest.count({
      where: {
        property: { ownerId: userId },
        priority: 'EMERGENCY',
        status: { in: ['SUBMITTED', 'IN_PROGRESS'] }
      }
    })
    if (criticalMaintenance > 0) {
      issues.push({
        type: 'critical_maintenance',
        severity: 'critical' as const,
        count: criticalMaintenance,
        message: `${criticalMaintenance} critical maintenance request${criticalMaintenance > 1 ? 's' : ''}`,
        action: 'Address immediately',
        link: '/dashboard/maintenance',
      })
    }

    // Non-compliant assessments
    const nonCompliant = await ctx.prisma.repairingStandardAssessment.count({
      where: {
        property: { ownerId: userId },
        score: { lt: 80 }
      }
    })
    if (nonCompliant > 0) {
      issues.push({
        type: 'non_compliant_assessment',
        severity: 'high' as const,
        count: nonCompliant,
        message: `${nonCompliant} propert${nonCompliant > 1 ? 'ies' : 'y'} below repairing standard`,
        action: 'Resolve issues',
        link: '/dashboard/repairing-standard',
      })
    }

    // Critical council alerts
    const criticalAlerts = await ctx.prisma.alertAcknowledgement.findMany({
      where: {
        userId,
        acknowledged: false,
        alert: {
          severity: 'CRITICAL',
          status: 'ACTIVE',
        }
      },
      include: {
        alert: {
          select: {
            title: true,
            alertType: true,
          }
        }
      },
      take: 3,
    })
    
    criticalAlerts.forEach(ack => {
      issues.push({
        type: 'critical_alert',
        severity: 'critical' as const,
        count: 1,
        message: ack.alert.title,
        action: 'Review alert',
        link: '/dashboard/councils',
      })
    })

    return issues.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })
  }),

  /**
   * Get portfolio summary statistics
   */
  getPortfolioSummary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const [
      totalProperties,
      totalValue,
      propertyTypes,
      councilDistribution,
      certificateStats,
    ] = await Promise.all([
      ctx.prisma.property.count({ where: { ownerId: userId } }),
      
      // This would come from a property value field if you have it
      Promise.resolve(0),
      
      ctx.prisma.property.groupBy({
        by: ['propertyType'],
        where: { ownerId: userId },
        _count: true,
      }),
      
      ctx.prisma.property.groupBy({
        by: ['councilArea'],
        where: { ownerId: userId },
        _count: true,
      }),
      
      ctx.prisma.certificate.groupBy({
        by: ['certificateType'],
        where: { property: { ownerId: userId } },
        _count: true,
      }),
    ])

    return {
      totalProperties,
      totalValue,
      propertyTypes: propertyTypes.map(pt => ({
        type: pt.propertyType,
        count: pt._count,
      })),
      councilDistribution: councilDistribution.map(cd => ({
        council: cd.councilArea,
        count: cd._count,
      })),
      certificateStats: certificateStats.map(cs => ({
        type: cs.certificateType,
        count: cs._count,
      })),
    }
  }),
})

/**
 * Helper function to calculate urgency based on date
 */
function getUrgency(date: Date): 'overdue' | 'critical' | 'warning' | 'normal' {
  const daysUntil = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  
  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= 7) return 'critical'
  if (daysUntil <= 30) return 'warning'
  return 'normal'
}
