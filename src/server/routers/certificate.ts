import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'

export const certificateRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        propertyId: z.string(),
        certificateType: z.enum([
          'gas_safety',
          'eicr',
          'epc',
          'pat',
          'fire_safety',
          'legionella',
          'other',
        ]),
        issueDate: z.date(),
        expiryDate: z.date(),
        providerName: z.string(),
        certificateNumber: z.string().optional(),
        fileUrl: z.string().optional(),
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

      const certificate = await ctx.prisma.certificate.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
          status: 'valid',
        },
      })

      return certificate
    }),

  list: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().optional(),
        status: z.enum(['valid', 'expiring', 'expired']).optional(),
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

      const certificates = await ctx.prisma.certificate.findMany({
        where: {
          propertyId: input.propertyId || { in: propertyIds },
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
            },
          },
        },
      })

      return certificates
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const certificate = await ctx.prisma.certificate.findUnique({
        where: { id: input.id },
        include: {
          property: true,
        },
      })

      if (!certificate || certificate.property.ownerId !== ctx.session.user.id) {
        throw new Error('Certificate not found or access denied')
      }

      return certificate
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        certificateType: z
          .enum([
            'gas_safety',
            'eicr',
            'epc',
            'pat',
            'fire_safety',
            'legionella',
            'other',
          ])
          .optional(),
        issueDate: z.date().optional(),
        expiryDate: z.date().optional(),
        providerName: z.string().optional(),
        certificateNumber: z.string().optional(),
        fileUrl: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum(['valid', 'expiring', 'expired']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const certificate = await ctx.prisma.certificate.findUnique({
        where: { id },
        include: { property: true },
      })

      if (!certificate || certificate.property.ownerId !== ctx.session.user.id) {
        throw new Error('Certificate not found or access denied')
      }

      const updated = await ctx.prisma.certificate.update({
        where: { id },
        data,
      })

      return updated
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const certificate = await ctx.prisma.certificate.findUnique({
        where: { id: input.id },
        include: { property: true },
      })

      if (!certificate || certificate.property.ownerId !== ctx.session.user.id) {
        throw new Error('Certificate not found or access denied')
      }

      await ctx.prisma.certificate.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Get expiring certificates (within 30 days)
  getExpiring: protectedProcedure.query(async ({ ctx }) => {
    const userProperties = await ctx.prisma.property.findMany({
      where: { ownerId: ctx.session.user.id },
      select: { id: true },
    })

    const propertyIds = userProperties.map((p) => p.id)

    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const expiringCertificates = await ctx.prisma.certificate.findMany({
      where: {
        propertyId: { in: propertyIds },
        expiryDate: {
          gte: new Date(),
          lte: thirtyDaysFromNow,
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
          },
        },
      },
    })

    return expiringCertificates
  }),
})
