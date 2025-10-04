import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/lib/trpc'
import { hash } from 'bcryptjs'
import { sendEmail } from '@/lib/email'
import WelcomeEmail from '@/emails/WelcomeEmail'
import { env } from '@/lib/env'

export const userRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
        role: z.enum(['LANDLORD', 'AGENT']).default('LANDLORD'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      })

      if (existingUser) {
        throw new Error('User already exists')
      }

      const passwordHash = await hash(input.password, 12)

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.name,
          role: input.role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      })

      // Send welcome email asynchronously (don't block registration if it fails)
      console.log('📧 Attempting to send welcome email to:', user.email)
      console.log('📧 User name:', user.name)
      console.log('📧 Dashboard URL:', `${env.APP_URL}/dashboard`)
      
      sendEmail({
        to: user.email,
        subject: 'Welcome to ScotComply - Your Scottish Compliance Platform',
        react: WelcomeEmail({
          name: user.name,
          dashboardUrl: `${env.APP_URL}/dashboard`,
        }),
      })
        .then((result) => {
          if (result.success) {
            console.log('✅ Welcome email sent successfully to:', user.email, 'Email ID:', result.data?.id)
          } else {
            console.error('❌ Failed to send welcome email to:', user.email, 'Error:', result.error)
          }
        })
        .catch((error) => {
          console.error('❌ Exception while sending welcome email to:', user.email, error)
        })

      return user
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        landlordProfile: true,
        agentProfile: true,
      },
    })

    return user
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        phoneNumber: z.string().optional(),
        address: z.string().optional(),
        businessName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name: input.name,
        },
      })

      if (ctx.session.user.role === 'LANDLORD' && (input.phoneNumber || input.address)) {
        await ctx.prisma.landlordProfile.upsert({
          where: { userId: ctx.session.user.id },
          create: {
            userId: ctx.session.user.id,
            phoneNumber: input.phoneNumber || '',
            address: input.address || '',
            businessName: input.businessName,
          },
          update: {
            phoneNumber: input.phoneNumber,
            address: input.address,
            businessName: input.businessName,
          },
        })
      }

      return user
    }),

  /**
   * Get current user's notification preferences
   */
  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        emailNotificationsEnabled: true,
        emailFrequency: true,
        lastNotificationSent: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }),

  /**
   * Update notification preferences
   */
  updateNotificationPreferences: protectedProcedure
    .input(
      z.object({
        emailNotificationsEnabled: z.boolean().optional(),
        emailFrequency: z.enum(['daily', 'weekly', 'disabled']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          emailNotificationsEnabled: true,
          emailFrequency: true,
          lastNotificationSent: true,
        },
      })

      return {
        success: true,
        preferences: updated,
      }
    }),
})
