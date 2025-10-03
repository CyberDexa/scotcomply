import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'
import { startOfMonth, endOfMonth, subMonths, format, differenceInDays } from 'date-fns'

/**
 * Analytics Router
 * Provides data analysis endpoints for compliance tracking, cost analysis, and risk assessment
 */
export const analyticsRouter = createTRPCRouter({
  /**
   * Get portfolio overview statistics
   */
  getPortfolioStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const [
      totalProperties,
      totalCertificates,
      totalRegistrations,
      totalHMOLicenses,
      expiringCertificates,
      expiringRegistrations,
      expiringHMOLicenses,
    ] = await Promise.all([
      ctx.prisma.property.count({ where: { ownerId: userId } }),
      ctx.prisma.certificate.count({ where: { userId } }),
      ctx.prisma.landlordRegistration.count({ where: { userId } }),
      ctx.prisma.hMOLicense.count({ where: { userId } }),
      ctx.prisma.certificate.count({
        where: {
          userId,
          expiryDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      ctx.prisma.landlordRegistration.count({
        where: {
          userId,
          expiryDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      ctx.prisma.hMOLicense.count({
        where: {
          userId,
          expiryDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    return {
      totalProperties,
      totalCertificates,
      totalRegistrations,
      totalHMOLicenses,
      expiringCertificates,
      expiringRegistrations,
      expiringHMOLicenses,
      totalCompliance: totalCertificates + totalRegistrations + totalHMOLicenses,
      totalExpiring: expiringCertificates + expiringRegistrations + expiringHMOLicenses,
    }
  }),

  /**
   * Get compliance trends over the last 6 months
   */
  getComplianceTrends: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const months = []
    const now = new Date()

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i)
      months.push({
        label: format(date, 'MMM yyyy'),
        startDate: startOfMonth(date),
        endDate: endOfMonth(date),
      })
    }

    const trends = await Promise.all(
      months.map(async (month) => {
        const [certificates, registrations, hmoLicenses] = await Promise.all([
          ctx.prisma.certificate.count({
            where: {
              userId,
              createdAt: {
                gte: month.startDate,
                lte: month.endDate,
              },
            },
          }),
          ctx.prisma.landlordRegistration.count({
            where: {
              userId,
              createdAt: {
                gte: month.startDate,
                lte: month.endDate,
              },
            },
          }),
          ctx.prisma.hMOLicense.count({
            where: {
              userId,
              createdAt: {
                gte: month.startDate,
                lte: month.endDate,
              },
            },
          }),
        ])

        return {
          month: month.label,
          certificates,
          registrations,
          hmoLicenses,
          total: certificates + registrations + hmoLicenses,
        }
      })
    )

    return trends
  }),

  /**
   * Get cost summary and breakdown
   */
  getCostSummary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Get all registrations with renewal fees
    const registrations = await ctx.prisma.landlordRegistration.findMany({
      where: { userId },
      select: {
        renewalFee: true,
        councilArea: true,
        createdAt: true,
      },
    })

    // Get all HMO licenses with annual fees
    const hmoLicenses = await ctx.prisma.hMOLicense.findMany({
      where: { userId },
      select: {
        annualFee: true,
        councilArea: true,
        createdAt: true,
      },
    })

    // Calculate totals
    const totalRegistrationFees = registrations.reduce(
      (sum, reg) => sum + reg.renewalFee,
      0
    )
    const totalHMOFees = hmoLicenses.reduce((sum, hmo) => sum + hmo.annualFee, 0)
    const totalCosts = totalRegistrationFees + totalHMOFees

    // Group by council area
    const costsByCouncil: Record<string, number> = {}
    
    registrations.forEach((reg) => {
      costsByCouncil[reg.councilArea] = (costsByCouncil[reg.councilArea] || 0) + reg.renewalFee
    })
    
    hmoLicenses.forEach((hmo) => {
      costsByCouncil[hmo.councilArea] = (costsByCouncil[hmo.councilArea] || 0) + hmo.annualFee
    })

    // Calculate monthly breakdown (last 6 months)
    const monthlyBreakdown = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i)
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)
      const monthLabel = format(date, 'MMM yyyy')

      const monthRegistrations = registrations.filter(
        (r) => r.createdAt >= monthStart && r.createdAt <= monthEnd
      )
      const monthHMOs = hmoLicenses.filter(
        (h) => h.createdAt >= monthStart && h.createdAt <= monthEnd
      )

      const registrationCost = monthRegistrations.reduce((sum, r) => sum + r.renewalFee, 0)
      const hmoCost = monthHMOs.reduce((sum, h) => sum + h.annualFee, 0)

      monthlyBreakdown.push({
        month: monthLabel,
        registrationCost,
        hmoCost,
        total: registrationCost + hmoCost,
      })
    }

    return {
      totalCosts,
      totalRegistrationFees,
      totalHMOFees,
      averageRegistrationFee:
        registrations.length > 0 ? totalRegistrationFees / registrations.length : 0,
      averageHMOFee: hmoLicenses.length > 0 ? totalHMOFees / hmoLicenses.length : 0,
      costsByCouncil: Object.entries(costsByCouncil).map(([council, cost]) => ({
        council,
        cost,
      })),
      monthlyBreakdown,
    }
  }),

  /**
   * Get expiry timeline for next 90 days
   */
  getExpiryTimeline: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const now = new Date()
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    const [certificates, registrations, hmoLicenses] = await Promise.all([
      ctx.prisma.certificate.findMany({
        where: {
          userId,
          expiryDate: {
            gte: now,
            lte: ninetyDaysFromNow,
          },
        },
        include: {
          property: true,
        },
        orderBy: {
          expiryDate: 'asc',
        },
      }),
      ctx.prisma.landlordRegistration.findMany({
        where: {
          userId,
          expiryDate: {
            gte: now,
            lte: ninetyDaysFromNow,
          },
        },
        include: {
          property: true,
        },
        orderBy: {
          expiryDate: 'asc',
        },
      }),
      ctx.prisma.hMOLicense.findMany({
        where: {
          userId,
          expiryDate: {
            gte: now,
            lte: ninetyDaysFromNow,
          },
        },
        include: {
          property: true,
        },
        orderBy: {
          expiryDate: 'asc',
        },
      }),
    ])

    // Combine and format all expiring items
    const timeline = [
      ...certificates.map((cert) => ({
        id: cert.id,
        type: 'certificate' as const,
        title: cert.certificateType.toUpperCase().replace('_', ' '),
        propertyAddress: cert.property.address,
        expiryDate: cert.expiryDate,
        daysUntilExpiry: differenceInDays(cert.expiryDate, now),
        status: cert.status,
      })),
      ...registrations.map((reg) => ({
        id: reg.id,
        type: 'registration' as const,
        title: `Landlord Registration - ${reg.councilArea}`,
        propertyAddress: reg.property.address,
        expiryDate: reg.expiryDate,
        daysUntilExpiry: differenceInDays(reg.expiryDate, now),
        status: reg.status,
      })),
      ...hmoLicenses.map((hmo) => ({
        id: hmo.id,
        type: 'hmo' as const,
        title: `HMO License - ${hmo.councilArea}`,
        propertyAddress: hmo.property.address,
        expiryDate: hmo.expiryDate,
        daysUntilExpiry: differenceInDays(hmo.expiryDate, now),
        status: hmo.status,
      })),
    ].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)

    return timeline
  }),

  /**
   * Get risk assessment score
   */
  getRiskAssessment: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const now = new Date()

    // Get all compliance items
    const [
      expiredCertificates,
      expiredRegistrations,
      expiredHMOLicenses,
      expiringCertificates,
      expiringRegistrations,
      expiringHMOLicenses,
      nonCompliantHMOs,
      totalProperties,
    ] = await Promise.all([
      ctx.prisma.certificate.count({
        where: { userId, expiryDate: { lt: now } },
      }),
      ctx.prisma.landlordRegistration.count({
        where: { userId, expiryDate: { lt: now } },
      }),
      ctx.prisma.hMOLicense.count({
        where: { userId, expiryDate: { lt: now } },
      }),
      ctx.prisma.certificate.count({
        where: {
          userId,
          expiryDate: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      ctx.prisma.landlordRegistration.count({
        where: {
          userId,
          expiryDate: {
            gte: now,
            lte: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      ctx.prisma.hMOLicense.count({
        where: {
          userId,
          expiryDate: {
            gte: now,
            lte: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      ctx.prisma.hMOLicense.count({
        where: { userId, fireSafetyCompliant: false },
      }),
      ctx.prisma.property.count({ where: { ownerId: userId } }),
    ])

    // Calculate risk score (0-100, lower is better)
    let riskScore = 0
    const riskFactors = []

    // Expired items (critical risk - 30 points each)
    if (expiredCertificates > 0) {
      riskScore += expiredCertificates * 30
      riskFactors.push({
        factor: 'Expired Certificates',
        count: expiredCertificates,
        severity: 'critical' as const,
        points: expiredCertificates * 30,
      })
    }
    if (expiredRegistrations > 0) {
      riskScore += expiredRegistrations * 30
      riskFactors.push({
        factor: 'Expired Registrations',
        count: expiredRegistrations,
        severity: 'critical' as const,
        points: expiredRegistrations * 30,
      })
    }
    if (expiredHMOLicenses > 0) {
      riskScore += expiredHMOLicenses * 30
      riskFactors.push({
        factor: 'Expired HMO Licenses',
        count: expiredHMOLicenses,
        severity: 'critical' as const,
        points: expiredHMOLicenses * 30,
      })
    }

    // Fire safety non-compliance (critical risk - 25 points each)
    if (nonCompliantHMOs > 0) {
      riskScore += nonCompliantHMOs * 25
      riskFactors.push({
        factor: 'Fire Safety Non-Compliance',
        count: nonCompliantHMOs,
        severity: 'critical' as const,
        points: nonCompliantHMOs * 25,
      })
    }

    // Expiring soon (high risk - 10 points each)
    if (expiringCertificates > 0) {
      riskScore += expiringCertificates * 10
      riskFactors.push({
        factor: 'Expiring Certificates (30 days)',
        count: expiringCertificates,
        severity: 'high' as const,
        points: expiringCertificates * 10,
      })
    }
    if (expiringRegistrations > 0) {
      riskScore += expiringRegistrations * 10
      riskFactors.push({
        factor: 'Expiring Registrations (60 days)',
        count: expiringRegistrations,
        severity: 'high' as const,
        points: expiringRegistrations * 10,
      })
    }
    if (expiringHMOLicenses > 0) {
      riskScore += expiringHMOLicenses * 10
      riskFactors.push({
        factor: 'Expiring HMO Licenses (60 days)',
        count: expiringHMOLicenses,
        severity: 'high' as const,
        points: expiringHMOLicenses * 10,
      })
    }

    // Cap at 100
    riskScore = Math.min(riskScore, 100)

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical'
    if (riskScore === 0) riskLevel = 'low'
    else if (riskScore <= 25) riskLevel = 'medium'
    else if (riskScore <= 50) riskLevel = 'high'
    else riskLevel = 'critical'

    return {
      riskScore,
      riskLevel,
      totalProperties,
      riskFactors,
      summary: {
        expiredCertificates,
        expiredRegistrations,
        expiredHMOLicenses,
        expiringCertificates,
        expiringRegistrations,
        expiringHMOLicenses,
        nonCompliantHMOs,
      },
    }
  }),

  /**
   * Get certificate type breakdown
   */
  getCertificateBreakdown: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const certificates = await ctx.prisma.certificate.groupBy({
      by: ['certificateType'],
      where: { userId },
      _count: {
        certificateType: true,
      },
    })

    return certificates.map((cert) => ({
      type: cert.certificateType.toUpperCase().replace('_', ' '),
      count: cert._count.certificateType,
    }))
  }),
})
