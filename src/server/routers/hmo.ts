import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'

export const hmoRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        propertyId: z.string(),
        licenseNumber: z.string(),
        applicationDate: z.date(),
        approvalDate: z.date().optional(),
        expiryDate: z.date(),
        occupancyLimit: z.number().int().min(3), // HMO minimum is 3 occupants
        councilArea: z.string(),
        status: z.enum(['pending', 'approved', 'expired', 'rejected']),
        annualFee: z.number().min(0),
        fireSafetyCompliant: z.boolean(),
        lastInspectionDate: z.date().optional(),
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

      // Verify property is marked as HMO
      if (!property.isHMO) {
        throw new Error('Property must be marked as HMO to apply for license')
      }

      const license = await ctx.prisma.hMOLicense.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      })

      return license
    }),

  list: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().optional(),
        councilArea: z.string().optional(),
        status: z.enum(['pending', 'approved', 'expired', 'rejected']).optional(),
        fireSafetyCompliant: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get all HMO properties owned by the user
      const userProperties = await ctx.prisma.property.findMany({
        where: { 
          ownerId: ctx.session.user.id,
          isHMO: true,
        },
        select: { id: true },
      })

      const propertyIds = userProperties.map((p: any) => p.id)

      const licenses = await ctx.prisma.hMOLicense.findMany({
        where: {
          propertyId: input.propertyId || { in: propertyIds },
          ...(input.councilArea && { councilArea: input.councilArea }),
          ...(input.status && { status: input.status }),
          ...(input.fireSafetyCompliant !== undefined && { 
            fireSafetyCompliant: input.fireSafetyCompliant 
          }),
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
              bedrooms: true,
              hmoOccupancy: true,
            },
          },
        },
      })

      return licenses
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const license = await ctx.prisma.hMOLicense.findUnique({
        where: { id: input.id },
        include: {
          property: true,
        },
      })

      if (!license || license.userId !== ctx.session.user.id) {
        throw new Error('HMO license not found or access denied')
      }

      return license
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        licenseNumber: z.string().optional(),
        applicationDate: z.date().optional(),
        approvalDate: z.date().optional(),
        expiryDate: z.date().optional(),
        occupancyLimit: z.number().int().min(3).optional(),
        status: z.enum(['pending', 'approved', 'expired', 'rejected']).optional(),
        annualFee: z.number().min(0).optional(),
        fireSafetyCompliant: z.boolean().optional(),
        lastInspectionDate: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const license = await ctx.prisma.hMOLicense.findUnique({
        where: { id },
      })

      if (!license || license.userId !== ctx.session.user.id) {
        throw new Error('HMO license not found or access denied')
      }

      const updated = await ctx.prisma.hMOLicense.update({
        where: { id },
        data,
      })

      return updated
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const license = await ctx.prisma.hMOLicense.findUnique({
        where: { id: input.id },
      })

      if (!license || license.userId !== ctx.session.user.id) {
        throw new Error('HMO license not found or access denied')
      }

      await ctx.prisma.hMOLicense.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Get expiring licenses (within 60 days)
  getExpiring: protectedProcedure.query(async ({ ctx }) => {
    const userProperties = await ctx.prisma.property.findMany({
      where: { 
        ownerId: ctx.session.user.id,
        isHMO: true,
      },
      select: { id: true },
    })

    const propertyIds = userProperties.map((p: any) => p.id)

    const sixtyDaysFromNow = new Date()
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)

    const expiringLicenses = await ctx.prisma.hMOLicense.findMany({
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

    return expiringLicenses
  }),

  // Get stats for dashboard
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userProperties = await ctx.prisma.property.findMany({
      where: { 
        ownerId: ctx.session.user.id,
        isHMO: true,
      },
      select: { id: true },
    })

    const propertyIds = userProperties.map((p: any) => p.id)

    const [total, approved, pending, expiring, expired, fireSafetyNonCompliant] = await Promise.all([
      // Total licenses
      ctx.prisma.hMOLicense.count({
        where: { propertyId: { in: propertyIds } },
      }),
      // Approved licenses
      ctx.prisma.hMOLicense.count({
        where: {
          propertyId: { in: propertyIds },
          status: 'approved',
        },
      }),
      // Pending licenses
      ctx.prisma.hMOLicense.count({
        where: {
          propertyId: { in: propertyIds },
          status: 'pending',
        },
      }),
      // Expiring soon (60 days)
      ctx.prisma.hMOLicense.count({
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
      ctx.prisma.hMOLicense.count({
        where: {
          propertyId: { in: propertyIds },
          status: 'expired',
        },
      }),
      // Fire safety non-compliant
      ctx.prisma.hMOLicense.count({
        where: {
          propertyId: { in: propertyIds },
          fireSafetyCompliant: false,
        },
      }),
    ])

    return {
      total,
      approved,
      pending,
      expiring,
      expired,
      fireSafetyNonCompliant,
    }
  }),

  // Get properties needing HMO license
  getPropertiesNeedingLicense: protectedProcedure.query(async ({ ctx }) => {
    // Get all HMO properties
    const hmoProperties = await ctx.prisma.property.findMany({
      where: {
        ownerId: ctx.session.user.id,
        isHMO: true,
      },
      include: {
        hmoLicenses: {
          where: {
            status: { in: ['approved', 'pending'] },
          },
        },
      },
    })

    // Filter properties without valid licenses
    const needingLicense = hmoProperties.filter(
      (property) => property.hmoLicenses.length === 0
    )

    return needingLicense
  }),
})
