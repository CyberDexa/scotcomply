import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'
import { prisma } from '@/lib/prisma'
import { LeaseStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { addDays, isBefore } from 'date-fns'

// Input validation schemas
const createLeaseSchema = z.object({
  tenantId: z.string().cuid(),
  propertyId: z.string().cuid(),
  startDate: z.date(),
  endDate: z.date(),
  rentAmount: z.number().positive(),
  paymentDay: z.number().min(1).max(31),
  paymentFrequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY']).default('MONTHLY'),
  depositAmount: z.number().nonnegative(),
  documentUrl: z.string().url().optional(),
  terms: z.any().optional(),
})

const updateLeaseSchema = z.object({
  id: z.string().cuid(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  rentAmount: z.number().positive().optional(),
  paymentDay: z.number().min(1).max(31).optional(),
  paymentFrequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY']).optional(),
  depositAmount: z.number().nonnegative().optional(),
  status: z.nativeEnum(LeaseStatus).optional(),
  documentUrl: z.string().url().optional().nullable(),
  terms: z.any().optional(),
  renewalDate: z.date().optional().nullable(),
  noticeGiven: z.boolean().optional(),
  noticeDate: z.date().optional().nullable(),
})

export const leaseRouter = createTRPCRouter({
  // Create a new lease
  create: protectedProcedure
    .input(createLeaseSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify property ownership
      const property = await prisma.property.findFirst({
        where: {
          id: input.propertyId,
          ownerId: userId,
        },
      })

      if (!property) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Property not found or access denied',
        })
      }

      // Verify tenant exists and belongs to this property
      const tenant = await prisma.tenant.findFirst({
        where: {
          id: input.tenantId,
          propertyId: input.propertyId,
        },
      })

      if (!tenant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tenant not found for this property',
        })
      }

      // Check for overlapping active leases
      const overlappingLease = await prisma.lease.findFirst({
        where: {
          propertyId: input.propertyId,
          status: {
            in: [LeaseStatus.ACTIVE, LeaseStatus.EXPIRING_SOON],
          },
          OR: [
            {
              startDate: { lte: input.endDate },
              endDate: { gte: input.startDate },
            },
          ],
        },
      })

      if (overlappingLease) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A lease already exists for this property during the specified period',
        })
      }

      // Determine initial status
      const now = new Date()
      const twoMonthsFromEnd = addDays(input.endDate, -60)
      let status: LeaseStatus = LeaseStatus.DRAFT

      if (isBefore(now, input.startDate)) {
        status = LeaseStatus.DRAFT
      } else if (isBefore(now, twoMonthsFromEnd)) {
        status = LeaseStatus.ACTIVE
      } else if (isBefore(now, input.endDate)) {
        status = LeaseStatus.EXPIRING_SOON
      } else {
        status = LeaseStatus.EXPIRED
      }

      const lease = await prisma.lease.create({
        data: {
          tenantId: input.tenantId,
          propertyId: input.propertyId,
          startDate: input.startDate,
          endDate: input.endDate,
          rentAmount: input.rentAmount,
          paymentDay: input.paymentDay,
          paymentFrequency: input.paymentFrequency,
          depositAmount: input.depositAmount,
          documentUrl: input.documentUrl,
          terms: input.terms,
          status,
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          property: {
            select: {
              id: true,
              address: true,
              postcode: true,
            },
          },
        },
      })

      return lease
    }),

  // Get all leases for the user's properties
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(LeaseStatus).optional(),
        propertyId: z.string().cuid().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const where: any = {
        property: {
          ownerId: userId,
        },
      }

      if (input.status) {
        where.status = input.status
      }

      if (input.propertyId) {
        where.propertyId = input.propertyId
      }

      const [leases, total] = await Promise.all([
        prisma.lease.findMany({
          where,
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            property: {
              select: {
                id: true,
                address: true,
                postcode: true,
              },
            },
          },
          orderBy: {
            startDate: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.lease.count({ where }),
      ])

      return {
        leases,
        total,
        hasMore: input.offset + input.limit < total,
      }
    }),

  // Get a single lease by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const lease = await prisma.lease.findFirst({
        where: {
          id: input.id,
          property: {
            ownerId: userId,
          },
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
          property: {
            select: {
              id: true,
              address: true,
              postcode: true,
              propertyType: true,
              bedrooms: true,
            },
          },
        },
      })

      if (!lease) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lease not found',
        })
      }

      return lease
    }),

  // Get expiring leases (within 60 days)
  getExpiring: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(60),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const now = new Date()
      const expiryDate = addDays(now, input.days)

      const leases = await prisma.lease.findMany({
        where: {
          property: {
            ownerId: userId,
          },
          status: {
            in: [LeaseStatus.ACTIVE, LeaseStatus.EXPIRING_SOON],
          },
          endDate: {
            gte: now,
            lte: expiryDate,
          },
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          property: {
            select: {
              id: true,
              address: true,
              postcode: true,
            },
          },
        },
        orderBy: {
          endDate: 'asc',
        },
      })

      return leases
    }),

  // Update a lease
  update: protectedProcedure
    .input(updateLeaseSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { id, ...data } = input

      // Verify ownership
      const existingLease = await prisma.lease.findFirst({
        where: {
          id,
          property: {
            ownerId: userId,
          },
        },
      })

      if (!existingLease) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lease not found',
        })
      }

      const lease = await prisma.lease.update({
        where: { id },
        data,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          property: {
            select: {
              id: true,
              address: true,
              postcode: true,
            },
          },
        },
      })

      return lease
    }),

  // Give notice on a lease
  giveNotice: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        noticeDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const lease = await prisma.lease.findFirst({
        where: {
          id: input.id,
          property: {
            ownerId: userId,
          },
        },
      })

      if (!lease) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lease not found',
        })
      }

      const updated = await prisma.lease.update({
        where: { id: input.id },
        data: {
          noticeGiven: true,
          noticeDate: input.noticeDate,
          status: LeaseStatus.EXPIRING_SOON,
        },
      })

      return updated
    }),

  // Renew a lease
  renew: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        newEndDate: z.date(),
        newRentAmount: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const lease = await prisma.lease.findFirst({
        where: {
          id: input.id,
          property: {
            ownerId: userId,
          },
        },
      })

      if (!lease) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lease not found',
        })
      }

      // Create new lease
      const newLease = await prisma.lease.create({
        data: {
          tenantId: lease.tenantId,
          propertyId: lease.propertyId,
          startDate: lease.endDate,
          endDate: input.newEndDate,
          rentAmount: input.newRentAmount ?? lease.rentAmount,
          paymentDay: lease.paymentDay,
          paymentFrequency: lease.paymentFrequency,
          depositAmount: lease.depositAmount,
          status: LeaseStatus.ACTIVE,
          documentUrl: lease.documentUrl,
          terms: lease.terms as any,
        },
      })

      // Update old lease status
      await prisma.lease.update({
        where: { id: input.id },
        data: {
          status: LeaseStatus.RENEWED,
        },
      })

      return newLease
    }),

  // Delete a lease
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const lease = await prisma.lease.findFirst({
        where: {
          id: input.id,
          property: {
            ownerId: userId,
          },
        },
      })

      if (!lease) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lease not found',
        })
      }

      // Only allow deletion of draft leases
      if (lease.status !== LeaseStatus.DRAFT) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only draft leases can be deleted. Please terminate active leases instead.',
        })
      }

      await prisma.lease.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Get lease statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const [total, active, expiring, expired] = await Promise.all([
      prisma.lease.count({
        where: {
          property: {
            ownerId: userId,
          },
        },
      }),
      prisma.lease.count({
        where: {
          property: {
            ownerId: userId,
          },
          status: LeaseStatus.ACTIVE,
        },
      }),
      prisma.lease.count({
        where: {
          property: {
            ownerId: userId,
          },
          status: LeaseStatus.EXPIRING_SOON,
        },
      }),
      prisma.lease.count({
        where: {
          property: {
            ownerId: userId,
          },
          status: LeaseStatus.EXPIRED,
        },
      }),
    ])

    return {
      total,
      active,
      expiring,
      expired,
    }
  }),
})
