import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'

export const propertyRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        address: z.string().min(5),
        postcode: z.string().regex(/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i),
        councilArea: z.string(),
        propertyType: z.enum(['flat', 'house', 'bungalow', 'other']),
        bedrooms: z.number().int().min(0),
        isHMO: z.boolean().default(false),
        hmoOccupancy: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const property = await ctx.prisma.property.create({
        data: {
          ...input,
          ownerId: ctx.session.user.id,
        },
      })

      return property
    }),

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const properties = await ctx.prisma.property.findMany({
        where: {
          ownerId: ctx.session.user.id,
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          certificates: {
            orderBy: {
              expiryDate: 'asc',
            },
          },
          landlordRegistrations: {
            orderBy: {
              expiryDate: 'asc',
            },
          },
          hmoLicenses: true,
        },
      })

      let nextCursor: typeof input.cursor | undefined = undefined
      if (properties.length > input.limit) {
        const nextItem = properties.pop()
        nextCursor = nextItem!.id
      }

      return {
        properties,
        nextCursor,
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const property = await ctx.prisma.property.findUnique({
        where: { id: input.id },
        include: {
          certificates: true,
          landlordRegistrations: true,
          hmoLicenses: true,
          repairingAssessments: {
            include: {
              items: true,
            },
          },
        },
      })

      if (!property || property.ownerId !== ctx.session.user.id) {
        throw new Error('Property not found')
      }

      return property
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        address: z.string().optional(),
        postcode: z.string().optional(),
        councilArea: z.string().optional(),
        propertyType: z.enum(['flat', 'house', 'bungalow', 'other']).optional(),
        bedrooms: z.number().int().min(0).optional(),
        isHMO: z.boolean().optional(),
        hmoOccupancy: z.number().int().optional(),
        tenancyStatus: z.enum(['vacant', 'occupied', 'notice']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const property = await ctx.prisma.property.findUnique({
        where: { id },
      })

      if (!property || property.ownerId !== ctx.session.user.id) {
        throw new Error('Property not found')
      }

      const updated = await ctx.prisma.property.update({
        where: { id },
        data,
      })

      return updated
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const property = await ctx.prisma.property.findUnique({
        where: { id: input.id },
      })

      if (!property || property.ownerId !== ctx.session.user.id) {
        throw new Error('Property not found')
      }

      await ctx.prisma.property.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})
