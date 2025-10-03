import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'

export const notificationRouter = createTRPCRouter({
  /**
   * Get all notifications for current user
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
        unreadOnly: z.boolean().optional(),
        type: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const notifications = await ctx.prisma.notification.findMany({
        where: {
          userId,
          ...(input.unreadOnly && { read: false }),
          ...(input.type && { type: input.type }),
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
      })

      let nextCursor: typeof input.cursor | undefined = undefined
      if (notifications.length > input.limit) {
        const nextItem = notifications.pop()
        nextCursor = nextItem!.id
      }

      return {
        notifications,
        nextCursor,
      }
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const count = await ctx.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    })

    return { count }
  }),

  /**
   * Get recent notifications (for bell dropdown)
   */
  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const notifications = await ctx.prisma.notification.findMany({
        where: {
          userId,
        },
        take: input.limit,
        orderBy: {
          createdAt: 'desc',
        },
      })

      return notifications
    }),

  /**
   * Mark single notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.notificationId },
      })

      if (!notification || notification.userId !== userId) {
        throw new Error('Notification not found or access denied')
      }

      const updated = await ctx.prisma.notification.update({
        where: { id: input.notificationId },
        data: {
          read: true,
          readAt: new Date(),
        },
      })

      return updated
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id

    await ctx.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    return { success: true }
  }),

  /**
   * Delete notification
   */
  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.notificationId },
      })

      if (!notification || notification.userId !== userId) {
        throw new Error('Notification not found or access denied')
      }

      await ctx.prisma.notification.delete({
        where: { id: input.notificationId },
      })

      return { success: true }
    }),

  /**
   * Delete all read notifications
   */
  deleteAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id

    await ctx.prisma.notification.deleteMany({
      where: {
        userId,
        read: true,
      },
    })

    return { success: true }
  }),

  /**
   * Create notification (internal use / for testing)
   */
  createNotification: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        title: z.string(),
        message: z.string(),
        link: z.string().optional(),
        priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const notification = await ctx.prisma.notification.create({
        data: {
          ...input,
          userId,
        },
      })

      return notification
    }),

  /**
   * Get notification preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    let preferences = await ctx.prisma.notificationPreference.findUnique({
      where: { userId },
    })

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await ctx.prisma.notificationPreference.create({
        data: {
          userId,
        },
      })
    }

    return preferences
  }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailEnabled: z.boolean().optional(),
        inAppEnabled: z.boolean().optional(),
        certificateExpiryEnabled: z.boolean().optional(),
        assessmentDueEnabled: z.boolean().optional(),
        hmoExpiryEnabled: z.boolean().optional(),
        registrationExpiryEnabled: z.boolean().optional(),
        systemAlertsEnabled: z.boolean().optional(),
        emailFrequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Ensure preferences exist
      let preferences = await ctx.prisma.notificationPreference.findUnique({
        where: { userId },
      })

      if (!preferences) {
        preferences = await ctx.prisma.notificationPreference.create({
          data: { userId },
        })
      }

      // Update preferences
      const updated = await ctx.prisma.notificationPreference.update({
        where: { userId },
        data: input,
      })

      return updated
    }),
})
