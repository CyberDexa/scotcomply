import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'
import { hash, compare } from 'bcryptjs'

/**
 * Settings Router
 * Handles user settings and preferences
 */

export const settingsRouter = createTRPCRouter({
  /**
   * Get user settings
   */
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        company: true,
        address: true,
        postcode: true,
        image: true,
        timezone: true,
        language: true,
        theme: true,
        dateFormat: true,
        currency: true,
        emailNotificationsEnabled: true,
        emailFrequency: true,
        notificationPreferences: true,
        createdAt: true,
      },
    })

    return user
  }),

  /**
   * Update profile information
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        address: z.string().optional(),
        postcode: z.string().optional(),
        image: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      })

      return user
    }),

  /**
   * Update notification preferences
   */
  updateNotifications: protectedProcedure
    .input(
      z.object({
        emailNotificationsEnabled: z.boolean().optional(),
        emailFrequency: z.enum(['daily', 'weekly', 'disabled']).optional(),
        notificationPreferences: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      })

      return user
    }),

  /**
   * Update display preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        timezone: z.string().optional(),
        language: z.string().optional(),
        theme: z.enum(['light', 'dark', 'system']).optional(),
        dateFormat: z.string().optional(),
        currency: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      })

      return user
    }),

  /**
   * Change password
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get current user with password
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Verify current password
      const isValid = await compare(input.currentPassword, user.passwordHash)

      if (!isValid) {
        throw new Error('Current password is incorrect')
      }

      // Hash new password
      const newPasswordHash = await hash(input.newPassword, 10)

      // Update password
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { passwordHash: newPasswordHash },
      })

      return { success: true }
    }),

  /**
   * Delete account
   */
  deleteAccount: protectedProcedure
    .input(
      z.object({
        password: z.string(),
        confirmation: z.literal('DELETE MY ACCOUNT'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get user with password
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Verify password
      const isValid = await compare(input.password, user.passwordHash)

      if (!isValid) {
        throw new Error('Password is incorrect')
      }

      // Delete user (cascade deletes will handle related records)
      await ctx.prisma.user.delete({
        where: { id: ctx.session.user.id },
      })

      return { success: true }
    }),

  /**
   * Get account statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const [
      properties,
      certificates,
      registrations,
      hmoLicenses,
      maintenanceRequests,
      notifications,
      assessments,
    ] = await Promise.all([
      ctx.prisma.property.count({ where: { ownerId: userId } }),
      ctx.prisma.certificate.count({ where: { userId } }),
      ctx.prisma.landlordRegistration.count({ where: { userId } }),
      ctx.prisma.hMOLicense.count({ where: { userId } }),
      ctx.prisma.maintenanceRequest.count({ where: { userId } }),
      ctx.prisma.notification.count({ where: { userId } }),
      ctx.prisma.repairingStandardAssessment.count({ where: { userId } }),
    ])

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    })

    return {
      properties,
      certificates,
      registrations,
      hmoLicenses,
      maintenanceRequests,
      notifications,
      assessments,
      accountAge: user
        ? Math.ceil(
            (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        : 0,
    }
  }),
})
