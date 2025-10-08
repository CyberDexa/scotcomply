/**
 * Council Intelligence Router
 * 
 * Provides endpoints for:
 * - Council data management and comparison
 * - Regulatory alerts and notifications
 * - Council changes tracking
 * - Alert preferences and acknowledgements
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc';
import prisma from '@/lib/prisma';
import { 
  AlertType,
  AlertCategory,
  AlertSeverity,
  AlertStatus,
  ChangeType,
  ImpactLevel,
} from '@prisma/client';

export const councilRouter = createTRPCRouter({
  /**
   * Get all councils with optional filtering
   */
  listCouncils: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(32),
      })
    )
    .query(async ({ input }) => {
      const { search, limit } = input;

      const councils = await prisma.councilData.findMany({
        where: search
          ? {
              OR: [
                { councilName: { contains: search, mode: 'insensitive' } },
                { councilArea: { contains: search, mode: 'insensitive' } },
              ],
            }
          : undefined,
        include: {
          _count: {
            select: {
              alerts: true,
              changes: true,
            },
          },
        },
        take: limit,
        orderBy: { councilName: 'asc' },
      });

      return councils;
    }),

  /**
   * Get council by ID with full details
   */
  getCouncilById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const council = await prisma.councilData.findUnique({
        where: { id: input.id },
        include: {
          alerts: {
            where: { status: AlertStatus.ACTIVE },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          changes: {
            orderBy: { effectiveDate: 'desc' },
            take: 10,
          },
          _count: {
            select: {
              alerts: true,
              changes: true,
            },
          },
        },
      });

      if (!council) {
        throw new Error('Council not found');
      }

      return council;
    }),

  /**
   * Compare multiple councils
   */
  compareCouncils: protectedProcedure
    .input(
      z.object({
        councilIds: z.array(z.string()).min(2).max(5),
      })
    )
    .query(async ({ input }) => {
      const councils = await prisma.councilData.findMany({
        where: {
          id: { in: input.councilIds },
        },
        include: {
          _count: {
            select: {
              alerts: true,
              changes: true,
            },
          },
        },
        orderBy: { councilName: 'asc' },
      });

      return councils;
    }),

  /**
   * Get council statistics
   */
  getCouncilStats: protectedProcedure.query(async () => {
    const [
      totalCouncils,
      activeAlerts,
      recentChanges,
      avgRegistrationFee,
      avgHMOFee,
      avgProcessingTime,
    ] = await Promise.all([
      prisma.councilData.count(),
      prisma.regulatoryAlert.count({
        where: { status: AlertStatus.ACTIVE },
      }),
      prisma.councilChange.count({
        where: {
          effectiveDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      prisma.councilData.aggregate({
        _avg: { registrationFee: true },
      }),
      prisma.councilData.aggregate({
        _avg: { hmoFee: true },
        where: { hmoFee: { not: null } },
      }),
      prisma.councilData.aggregate({
        _avg: { processingTimeDays: true },
      }),
    ]);

    return {
      totalCouncils,
      activeAlerts,
      recentChanges,
      avgRegistrationFee: avgRegistrationFee._avg.registrationFee || 0,
      avgHMOFee: avgHMOFee._avg.hmoFee || 0,
      avgProcessingTime: Math.round(avgProcessingTime._avg.processingTimeDays || 0),
    };
  }),

  // ==================== ALERTS ====================

  /**
   * Get all alerts with filtering
   */
  listAlerts: protectedProcedure
    .input(
      z.object({
        councilId: z.string().optional(),
        alertType: z.nativeEnum(AlertType).optional(),
        category: z.nativeEnum(AlertCategory).optional(),
        severity: z.nativeEnum(AlertSeverity).optional(),
        status: z.nativeEnum(AlertStatus).optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { councilId, alertType, category, severity, status, limit, cursor } = input;

      const alerts = await prisma.regulatoryAlert.findMany({
        where: {
          ...(councilId && { councilId }),
          ...(alertType && { alertType }),
          ...(category && { category }),
          ...(severity && { severity }),
          ...(status && { status }),
        },
        include: {
          council: {
            select: {
              id: true,
              councilName: true,
            },
          },
          acknowledgements: {
            where: { userId: ctx.session.user.id },
            select: {
              id: true,
              readAt: true,
              dismissedAt: true,
            },
          },
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      let nextCursor: string | undefined = undefined;
      if (alerts.length > limit) {
        const nextItem = alerts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        alerts,
        nextCursor,
      };
    }),

  /**
   * Create new alert
   */
  createAlert: protectedProcedure
    .input(
      z.object({
        councilId: z.string().optional(),
        alertType: z.nativeEnum(AlertType),
        category: z.nativeEnum(AlertCategory),
        title: z.string().min(5),
        description: z.string().min(10),
        effectiveDate: z.date(),
        expiryDate: z.date().optional(),
        severity: z.nativeEnum(AlertSeverity).default(AlertSeverity.INFO),
        priority: z.number().min(1).max(5).default(3),
        sourceUrl: z.string().url().optional(),
        sourceType: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const alert = await prisma.regulatoryAlert.create({
        data: {
          councilId: input.councilId,
          alertType: input.alertType,
          category: input.category,
          title: input.title,
          description: input.description,
          effectiveDate: input.effectiveDate,
          expiryDate: input.expiryDate,
          severity: input.severity,
          priority: input.priority,
          sourceUrl: input.sourceUrl,
          sourceType: input.sourceType,
          status: AlertStatus.ACTIVE,
        },
        include: {
          council: true,
        },
      });

      // TODO: Trigger notification service

      return alert;
    }),

  /**
   * Update alert status
   */
  updateAlertStatus: protectedProcedure
    .input(
      z.object({
        alertId: z.string(),
        status: z.nativeEnum(AlertStatus),
      })
    )
    .mutation(async ({ input }) => {
      const alert = await prisma.regulatoryAlert.update({
        where: { id: input.alertId },
        data: { status: input.status },
      });

      return alert;
    }),

  /**
   * Acknowledge alert (mark as read)
   */
  acknowledgeAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.string(),
        dismissed: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const acknowledgement = await prisma.alertAcknowledgement.upsert({
        where: {
          alertId_userId: {
            alertId: input.alertId,
            userId: ctx.session.user.id,
          },
        },
        create: {
          alertId: input.alertId,
          userId: ctx.session.user.id,
          acknowledged: true,
          dismissedAt: input.dismissed ? new Date() : null,
        },
        update: {
          dismissedAt: input.dismissed ? new Date() : null,
        },
      });

      // Increment view count
      await prisma.regulatoryAlert.update({
        where: { id: input.alertId },
        data: {
          viewCount: { increment: 1 },
        },
      });

      return acknowledgement;
    }),

  /**
   * Get unread alerts count
   */
  getUnreadAlertsCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await prisma.regulatoryAlert.count({
      where: {
        status: AlertStatus.ACTIVE,
        acknowledgements: {
          none: {
            userId: ctx.session.user.id,
          },
        },
      },
    });

    return count;
  }),

  // ==================== COUNCIL CHANGES ====================

  /**
   * Get council changes
   */
  listChanges: protectedProcedure
    .input(
      z.object({
        councilId: z.string().optional(),
        changeType: z.nativeEnum(ChangeType).optional(),
        fromDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const { councilId, changeType, fromDate, limit } = input;

      const changes = await prisma.councilChange.findMany({
        where: {
          ...(councilId && { councilId }),
          ...(changeType && { changeType }),
          ...(fromDate && {
            effectiveDate: { gte: fromDate },
          }),
        },
        include: {
          council: {
            select: {
              id: true,
              councilName: true,
            },
          },
        },
        take: limit,
        orderBy: { effectiveDate: 'desc' },
      });

      return changes;
    }),

  /**
   * Create council change record
   */
  createChange: protectedProcedure
    .input(
      z.object({
        councilId: z.string(),
        changeType: z.nativeEnum(ChangeType),
        field: z.string(),
        oldValue: z.string().optional(),
        newValue: z.string(),
        title: z.string().min(5),
        description: z.string().optional(),
        impactLevel: z.nativeEnum(ImpactLevel).default(ImpactLevel.LOW),
        affectsExisting: z.boolean().default(false),
        effectiveDate: z.date(),
        sourceUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const change = await prisma.councilChange.create({
        data: input,
        include: {
          council: true,
        },
      });

      // Auto-create alert for significant changes
      if (input.impactLevel === ImpactLevel.HIGH || input.impactLevel === ImpactLevel.CRITICAL) {
        await prisma.regulatoryAlert.create({
          data: {
            councilId: input.councilId,
            alertType: AlertType.POLICY_UPDATE,
            category: AlertCategory.GENERAL,
            title: input.title,
            description: input.description || `${input.field} changed from ${input.oldValue} to ${input.newValue}`,
            effectiveDate: input.effectiveDate,
            severity: input.impactLevel === ImpactLevel.CRITICAL ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
            priority: input.impactLevel === ImpactLevel.CRITICAL ? 5 : 4,
            sourceUrl: input.sourceUrl,
            status: AlertStatus.ACTIVE,
          },
        });
      }

      return change;
    }),

  /**
   * Get upcoming changes (future effective dates)
   */
  getUpcomingChanges: protectedProcedure
    .input(
      z.object({
        daysAhead: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const futureDate = new Date(Date.now() + input.daysAhead * 24 * 60 * 60 * 1000);

      const changes = await prisma.councilChange.findMany({
        where: {
          effectiveDate: {
            gte: new Date(),
            lte: futureDate,
          },
        },
        include: {
          council: {
            select: {
              id: true,
              councilName: true,
            },
          },
        },
        orderBy: { effectiveDate: 'asc' },
      });

      return changes;
    }),

  // ==================== ALERT PREFERENCES ====================

  /**
   * Get user alert preferences
   */
  getAlertPreferences: protectedProcedure.query(async ({ ctx }) => {
    let preferences = await prisma.alertPreference.findUnique({
      where: { userId: ctx.session.user.id },
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.alertPreference.create({
        data: {
          userId: ctx.session.user.id,
        },
      });
    }

    return preferences;
  }),

  /**
   * Update alert preferences
   */
  updateAlertPreferences: protectedProcedure
    .input(
      z.object({
        emailEnabled: z.boolean().optional(),
        inAppEnabled: z.boolean().optional(),
        immediateAlerts: z.boolean().optional(),
        dailyDigest: z.boolean().optional(),
        weeklyDigest: z.boolean().optional(),
        feeChangeAlerts: z.boolean().optional(),
        requirementAlerts: z.boolean().optional(),
        deadlineAlerts: z.boolean().optional(),
        policyChangeAlerts: z.boolean().optional(),
        systemAlerts: z.boolean().optional(),
        minSeverity: z.nativeEnum(AlertSeverity).optional(),
        councilFilter: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const preferences = await prisma.alertPreference.upsert({
        where: { userId: ctx.session.user.id },
        create: {
          userId: ctx.session.user.id,
          ...input,
          councilFilter: input.councilFilter ? input.councilFilter : undefined,
        },
        update: {
          ...input,
          councilFilter: input.councilFilter ? input.councilFilter : undefined,
        },
      });

      return preferences;
    }),

  // ==================== ANALYTICS ====================

  /**
   * Get alert analytics
   */
  getAlertAnalytics: protectedProcedure.query(async () => {
    const [
      totalAlerts,
      activeAlerts,
      criticalAlerts,
      alertsByType,
      alertsBySeverity,
      alertsByCouncil,
    ] = await Promise.all([
      prisma.regulatoryAlert.count(),
      prisma.regulatoryAlert.count({
        where: { status: AlertStatus.ACTIVE },
      }),
      prisma.regulatoryAlert.count({
        where: {
          status: AlertStatus.ACTIVE,
          severity: AlertSeverity.CRITICAL,
        },
      }),
      prisma.regulatoryAlert.groupBy({
        by: ['alertType'],
        _count: true,
        where: { status: AlertStatus.ACTIVE },
      }),
      prisma.regulatoryAlert.groupBy({
        by: ['severity'],
        _count: true,
        where: { status: AlertStatus.ACTIVE },
      }),
      prisma.regulatoryAlert.groupBy({
        by: ['councilId'],
        _count: true,
        where: {
          status: AlertStatus.ACTIVE,
          councilId: { not: null },
        },
        take: 10,
        orderBy: { _count: { councilId: 'desc' } },
      }),
    ]);

    return {
      totalAlerts,
      activeAlerts,
      criticalAlerts,
      byType: alertsByType.reduce((acc, item) => {
        acc[item.alertType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: alertsBySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count;
        return acc;
      }, {} as Record<string, number>),
      topCouncils: alertsByCouncil,
    };
  }),

  /**
   * Delete alert
   */
  deleteAlert: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.regulatoryAlert.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Delete change record
   */
  deleteChange: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.councilChange.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Update council data (Admin only)
   */
  updateCouncil: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          registrationFee: z.number().optional(),
          renewalFee: z.number().nullable().optional(),
          hmoFee: z.number().nullable().optional(),
          processingTimeDays: z.number().optional(),
          contactEmail: z.string().nullable().optional(),
          contactPhone: z.string().nullable().optional(),
          landlordRegUrl: z.string().nullable().optional(),
          hmoLicenseUrl: z.string().nullable().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role !== 'ADMIN') {
        throw new Error('Admin access required');
      }

      // Build update data, filtering out undefined values and converting null to { set: null }
      const updateData: any = {};
      
      if (input.data.registrationFee !== undefined) {
        updateData.registrationFee = input.data.registrationFee;
      }
      if (input.data.renewalFee !== undefined) {
        updateData.renewalFee = input.data.renewalFee === null ? { set: null } : input.data.renewalFee;
      }
      if (input.data.hmoFee !== undefined) {
        updateData.hmoFee = input.data.hmoFee === null ? { set: null } : input.data.hmoFee;
      }
      if (input.data.processingTimeDays !== undefined) {
        updateData.processingTimeDays = input.data.processingTimeDays;
      }
      if (input.data.contactEmail !== undefined) {
        updateData.contactEmail = input.data.contactEmail === null ? { set: null } : input.data.contactEmail;
      }
      if (input.data.contactPhone !== undefined) {
        updateData.contactPhone = input.data.contactPhone === null ? { set: null } : input.data.contactPhone;
      }
      if (input.data.landlordRegUrl !== undefined) {
        updateData.landlordRegUrl = input.data.landlordRegUrl === null ? { set: null } : input.data.landlordRegUrl;
      }
      if (input.data.hmoLicenseUrl !== undefined) {
        updateData.hmoLicenseUrl = input.data.hmoLicenseUrl === null ? { set: null } : input.data.hmoLicenseUrl;
      }

      const council = await prisma.councilData.update({
        where: { id: input.id },
        data: updateData,
      });

      return council;
    }),
});
