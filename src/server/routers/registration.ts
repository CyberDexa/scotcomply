import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'

export const registrationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        propertyId: z.string(),
        councilArea: z.string(),
        registrationNumber: z.string(),
        applicationDate: z.date(),
        approvalDate: z.date().optional(),
        expiryDate: z.date(),
        status: z.enum(['pending', 'approved', 'expired', 'rejected']),
        renewalFee: z.number().min(0),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify property ownership
      const property = await ctx.prisma.property.findUnique({
        where: { id: input.propertyId },
      })

      if (!property || property.ownerId !== ctx.session.user.id) {
        throw new Error('Property not found or access denied')
      }

      const registration = await ctx.prisma.landlordRegistration.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      })

      return registration
    }),

  list: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().optional(),
        councilArea: z.string().optional(),
        status: z.enum(['pending', 'approved', 'expired', 'rejected']).optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get all properties owned by the user
      const userProperties = await ctx.prisma.property.findMany({
        where: { ownerId: ctx.session.user.id },
        select: { id: true },
      })

      const propertyIds = userProperties.map((p) => p.id)

      const registrations = await ctx.prisma.landlordRegistration.findMany({
        where: {
          propertyId: input.propertyId || { in: propertyIds },
          ...(input.councilArea && { councilArea: input.councilArea }),
          ...(input.status && { status: input.status }),
        },
        take: input.limit,
        orderBy: {
          expiryDate: 'asc',
        },
        include: {
          property: {
            select: {
              id: true,
              address: true,
              postcode: true,
              councilArea: true,
              propertyType: true,
            },
          },
        },
      })

      return registrations
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const registration = await ctx.prisma.landlordRegistration.findUnique({
        where: { id: input.id },
        include: {
          property: true,
        },
      })

      if (!registration || registration.userId !== ctx.session.user.id) {
        throw new Error('Registration not found or access denied')
      }

      return registration
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        registrationNumber: z.string().optional(),
        applicationDate: z.date().optional(),
        approvalDate: z.date().optional(),
        expiryDate: z.date().optional(),
        status: z.enum(['pending', 'approved', 'expired', 'rejected']).optional(),
        renewalFee: z.number().min(0).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const registration = await ctx.prisma.landlordRegistration.findUnique({
        where: { id },
      })

      if (!registration || registration.userId !== ctx.session.user.id) {
        throw new Error('Registration not found or access denied')
      }

      const updated = await ctx.prisma.landlordRegistration.update({
        where: { id },
        data,
      })

      return updated
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const registration = await ctx.prisma.landlordRegistration.findUnique({
        where: { id: input.id },
      })

      if (!registration || registration.userId !== ctx.session.user.id) {
        throw new Error('Registration not found or access denied')
      }

      await ctx.prisma.landlordRegistration.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Get expiring registrations (within 60 days)
  getExpiring: protectedProcedure.query(async ({ ctx }) => {
    const userProperties = await ctx.prisma.property.findMany({
      where: { ownerId: ctx.session.user.id },
      select: { id: true },
    })

    const propertyIds = userProperties.map((p) => p.id)

    const sixtyDaysFromNow = new Date()
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)

    const expiringRegistrations = await ctx.prisma.landlordRegistration.findMany({
      where: {
        propertyId: { in: propertyIds },
        expiryDate: {
          gte: new Date(),
          lte: sixtyDaysFromNow,
        },
        status: { not: 'expired' },
      },
      orderBy: {
        expiryDate: 'asc',
      },
      include: {
        property: {
          select: {
            id: true,
            address: true,
            postcode: true,
            councilArea: true,
          },
        },
      },
    })

    return expiringRegistrations
  }),

  // Get stats for dashboard
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userProperties = await ctx.prisma.property.findMany({
      where: { ownerId: ctx.session.user.id },
      select: { id: true },
    })

    const propertyIds = userProperties.map((p) => p.id)

    const [total, approved, pending, expiring, expired] = await Promise.all([
      // Total registrations
      ctx.prisma.landlordRegistration.count({
        where: { propertyId: { in: propertyIds } },
      }),
      // Approved registrations
      ctx.prisma.landlordRegistration.count({
        where: {
          propertyId: { in: propertyIds },
          status: 'approved',
        },
      }),
      // Pending registrations
      ctx.prisma.landlordRegistration.count({
        where: {
          propertyId: { in: propertyIds },
          status: 'pending',
        },
      }),
      // Expiring soon (60 days)
      ctx.prisma.landlordRegistration.count({
        where: {
          propertyId: { in: propertyIds },
          expiryDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
          status: 'approved',
        },
      }),
      // Expired
      ctx.prisma.landlordRegistration.count({
        where: {
          propertyId: { in: propertyIds },
          status: 'expired',
        },
      }),
    ])

    return {
      total,
      approved,
      pending,
      expiring,
      expired,
    }
  }),
})
