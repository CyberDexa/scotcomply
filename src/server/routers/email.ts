import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'
import { sendEmail } from '@/lib/email'
import { render } from '@react-email/components'
import CertificateExpiryEmail from '@/emails/CertificateExpiryEmail'
import WelcomeEmail from '@/emails/WelcomeEmail'

/**
 * Email Router
 * Handles email sending, scheduling, and history
 */

export const emailRouter = createTRPCRouter({
  /**
   * Send an email
   */
  send: protectedProcedure
    .input(
      z.object({
        to: z.string().email(),
        subject: z.string(),
        type: z.enum([
          'CERTIFICATE_EXPIRY',
          'REGISTRATION_EXPIRY',
          'HMO_EXPIRY',
          'INSPECTION_REMINDER',
          'ASSESSMENT_DUE',
          'WELCOME',
          'PASSWORD_RESET',
          'DOCUMENT_SHARED',
          'SYSTEM',
        ]),
        templateData: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create email record
      const email = await ctx.prisma.email.create({
        data: {
          userId: ctx.session.user.id,
          to: input.to,
          from: process.env.EMAIL_FROM || 'noreply@scotcomply.com',
          subject: input.subject,
          body: '', // Will be generated from template
          type: input.type,
          status: 'PENDING',
        },
      })

      try {
        // Generate email HTML from template
        let html = ''
        
        switch (input.type) {
          case 'CERTIFICATE_EXPIRY':
            html = await render(CertificateExpiryEmail(input.templateData))
            break
          case 'WELCOME':
            html = await render(WelcomeEmail(input.templateData))
            break
          default:
            html = `<p>${input.subject}</p>`
        }

        // Send email
        const result = await sendEmail({
          to: input.to,
          subject: input.subject,
          html,
        })

        // Update email record
        if (result.success) {
          await ctx.prisma.email.update({
            where: { id: email.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              htmlBody: html,
            },
          })
        } else {
          await ctx.prisma.email.update({
            where: { id: email.id },
            data: {
              status: 'FAILED',
              errorMessage: result.error,
            },
          })
        }

        return {
          success: result.success,
          emailId: email.id,
        }
      } catch (error: any) {
        // Update email record with error
        await ctx.prisma.email.update({
          where: { id: email.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        })

        throw new Error('Failed to send email: ' + error.message)
      }
    }),

  /**
   * Schedule an email for later
   */
  schedule: protectedProcedure
    .input(
      z.object({
        to: z.string().email(),
        subject: z.string(),
        type: z.enum([
          'CERTIFICATE_EXPIRY',
          'REGISTRATION_EXPIRY',
          'HMO_EXPIRY',
          'INSPECTION_REMINDER',
          'ASSESSMENT_DUE',
          'WELCOME',
          'PASSWORD_RESET',
          'DOCUMENT_SHARED',
          'SYSTEM',
        ]),
        scheduledFor: z.date(),
        templateData: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const email = await ctx.prisma.email.create({
        data: {
          userId: ctx.session.user.id,
          to: input.to,
          from: process.env.EMAIL_FROM || 'noreply@scotcomply.com',
          subject: input.subject,
          body: '',
          type: input.type,
          status: 'SCHEDULED',
          scheduledFor: input.scheduledFor,
          metadata: input.templateData || {},
        },
      })

      return email
    }),

  /**
   * Get email history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(['PENDING', 'SENT', 'FAILED', 'SCHEDULED'])
          .optional(),
        type: z
          .enum([
            'CERTIFICATE_EXPIRY',
            'REGISTRATION_EXPIRY',
            'HMO_EXPIRY',
            'INSPECTION_REMINDER',
            'ASSESSMENT_DUE',
            'WELCOME',
            'PASSWORD_RESET',
            'DOCUMENT_SHARED',
            'SYSTEM',
          ])
          .optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        userId: ctx.session.user.id,
      }

      if (input.status) {
        where.status = input.status
      }

      if (input.type) {
        where.type = input.type
      }

      const emails = await ctx.prisma.email.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      })

      let nextCursor: string | undefined = undefined
      if (emails.length > input.limit) {
        const nextItem = emails.pop()
        nextCursor = nextItem!.id
      }

      return {
        emails,
        nextCursor,
      }
    }),

  /**
   * Get email statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const [total, sent, failed, pending, scheduled] = await Promise.all([
      ctx.prisma.email.count({ where: { userId } }),
      ctx.prisma.email.count({ where: { userId, status: 'SENT' } }),
      ctx.prisma.email.count({ where: { userId, status: 'FAILED' } }),
      ctx.prisma.email.count({ where: { userId, status: 'PENDING' } }),
      ctx.prisma.email.count({ where: { userId, status: 'SCHEDULED' } }),
    ])

    return {
      total,
      sent,
      failed,
      pending,
      scheduled,
    }
  }),

  /**
   * Resend a failed email
   */
  resend: protectedProcedure
    .input(z.object({ emailId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const email = await ctx.prisma.email.findUnique({
        where: { id: input.emailId },
      })

      if (!email) {
        throw new Error('Email not found')
      }

      if (email.userId !== ctx.session.user.id) {
        throw new Error('Access denied')
      }

      try {
        const result = await sendEmail({
          to: email.to,
          subject: email.subject,
          html: email.htmlBody || email.body,
        })

        if (result.success) {
          await ctx.prisma.email.update({
            where: { id: email.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              errorMessage: null,
            },
          })
        } else {
          await ctx.prisma.email.update({
            where: { id: email.id },
            data: {
              status: 'FAILED',
              errorMessage: result.error,
            },
          })
        }

        return {
          success: result.success,
          error: result.error,
        }
      } catch (error: any) {
        throw new Error('Failed to resend email: ' + error.message)
      }
    }),

  /**
   * Delete an email from history
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const email = await ctx.prisma.email.findUnique({
        where: { id: input.id },
      })

      if (!email) {
        throw new Error('Email not found')
      }

      if (email.userId !== ctx.session.user.id) {
        throw new Error('Access denied')
      }

      await ctx.prisma.email.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})
