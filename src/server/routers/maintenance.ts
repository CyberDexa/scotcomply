import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'

/**
 * Maintenance Router
 * Handles maintenance request CRUD operations
 */

export const maintenanceRouter = createTRPCRouter({
  /**
   * Create a maintenance request
   */
  create: protectedProcedure
    .input(
      z.object({
        propertyId: z.string(),
        tenantId: z.string().optional(),
        category: z.enum([
          'PLUMBING',
          'ELECTRICAL',
          'HEATING',
          'APPLIANCES',
          'STRUCTURAL',
          'DOORS_WINDOWS',
          'FLOORING',
          'WALLS_CEILING',
          'PEST_CONTROL',
          'SECURITY',
          'GARDEN',
          'OTHER',
        ]),
        priority: z
          .enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'])
          .default('MEDIUM'),
        title: z.string().min(1).max(200),
        description: z.string().min(1),
        location: z.string().optional(),
        images: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify property ownership
      const property = await ctx.prisma.property.findUnique({
        where: { id: input.propertyId },
      })

      if (!property) {
        throw new Error('Property not found')
      }

      if (property.ownerId !== ctx.session.user.id) {
        throw new Error('Access denied')
      }

      const request = await ctx.prisma.maintenanceRequest.create({
        data: {
          userId: ctx.session.user.id,
          propertyId: input.propertyId,
          tenantId: input.tenantId,
          category: input.category,
          priority: input.priority,
          title: input.title,
          description: input.description,
          location: input.location,
          images: input.images || [],
          status: 'SUBMITTED',
        },
        include: {
          property: true,
          tenant: true,
        },
      })

      // Create notification for landlord
      await ctx.prisma.notification.create({
        data: {
          userId: ctx.session.user.id,
          type: 'system',
          title: 'New Maintenance Request',
          message: `New ${input.category.toLowerCase().replace('_', ' ')} request for ${property.address}`,
          link: `/dashboard/maintenance/${request.id}`,
          priority: input.priority === 'EMERGENCY' ? 'critical' : 'normal',
        },
      })

      return request
    }),

  /**
   * Get all maintenance requests
   */
  list: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().optional(),
        status: z
          .enum([
            'SUBMITTED',
            'ACKNOWLEDGED',
            'SCHEDULED',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELLED',
          ])
          .optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        userId: ctx.session.user.id,
      }

      if (input.propertyId) {
        where.propertyId = input.propertyId
      }

      if (input.status) {
        where.status = input.status
      }

      if (input.priority) {
        where.priority = input.priority
      }

      const requests = await ctx.prisma.maintenanceRequest.findMany({
        where,
        include: {
          property: true,
          tenant: true,
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        take: input.limit,
      })

      return requests
    }),

  /**
   * Get maintenance request by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const request = await ctx.prisma.maintenanceRequest.findUnique({
        where: { id: input.id },
        include: {
          property: true,
          tenant: true,
          notes: {
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!request) {
        throw new Error('Maintenance request not found')
      }

      if (request.userId !== ctx.session.user.id) {
        throw new Error('Access denied')
      }

      return request
    }),

  /**
   * Update maintenance request
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        category: z
          .enum([
            'PLUMBING',
            'ELECTRICAL',
            'HEATING',
            'APPLIANCES',
            'STRUCTURAL',
            'DOORS_WINDOWS',
            'FLOORING',
            'WALLS_CEILING',
            'PEST_CONTROL',
            'SECURITY',
            'GARDEN',
            'OTHER',
          ])
          .optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).optional(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().min(1).optional(),
        location: z.string().optional(),
        assignedTo: z.string().optional(),
        estimatedCost: z.number().optional(),
        actualCost: z.number().optional(),
        scheduledDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.maintenanceRequest.findUnique({
        where: { id: input.id },
      })

      if (!request) {
        throw new Error('Maintenance request not found')
      }

      if (request.userId !== ctx.session.user.id) {
        throw new Error('Access denied')
      }

      const { id, ...updateData } = input

      return await ctx.prisma.maintenanceRequest.update({
        where: { id },
        data: updateData,
        include: {
          property: true,
          tenant: true,
        },
      })
    }),

  /**
   * Update maintenance request status
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          'SUBMITTED',
          'ACKNOWLEDGED',
          'SCHEDULED',
          'IN_PROGRESS',
          'COMPLETED',
          'CANCELLED',
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.maintenanceRequest.findUnique({
        where: { id: input.id },
      })

      if (!request) {
        throw new Error('Maintenance request not found')
      }

      if (request.userId !== ctx.session.user.id) {
        throw new Error('Access denied')
      }

      const updateData: any = {
        status: input.status,
      }

      // Set completedAt when marking as completed
      if (input.status === 'COMPLETED') {
        updateData.completedAt = new Date()
      }

      return await ctx.prisma.maintenanceRequest.update({
        where: { id: input.id },
        data: updateData,
        include: {
          property: true,
          tenant: true,
        },
      })
    }),

  /**
   * Add note to maintenance request
   */
  addNote: protectedProcedure
    .input(
      z.object({
        maintenanceRequestId: z.string(),
        content: z.string().min(1),
        images: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.maintenanceRequest.findUnique({
        where: { id: input.maintenanceRequestId },
      })

      if (!request) {
        throw new Error('Maintenance request not found')
      }

      if (request.userId !== ctx.session.user.id) {
        throw new Error('Access denied')
      }

      return await ctx.prisma.maintenanceNote.create({
        data: {
          maintenanceRequestId: input.maintenanceRequestId,
          userId: ctx.session.user.id,
          content: input.content,
          images: input.images || [],
        },
      })
    }),

  /**
   * Get maintenance statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const [
      total,
      submitted,
      inProgress,
      completed,
      emergency,
      avgCompletionTime,
    ] = await Promise.all([
      ctx.prisma.maintenanceRequest.count({ where: { userId } }),
      ctx.prisma.maintenanceRequest.count({
        where: { userId, status: 'SUBMITTED' },
      }),
      ctx.prisma.maintenanceRequest.count({
        where: { userId, status: { in: ['ACKNOWLEDGED', 'SCHEDULED', 'IN_PROGRESS'] } },
      }),
      ctx.prisma.maintenanceRequest.count({
        where: { userId, status: 'COMPLETED' },
      }),
      ctx.prisma.maintenanceRequest.count({
        where: { userId, priority: 'EMERGENCY' },
      }),
      ctx.prisma.maintenanceRequest.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          completedAt: { not: null },
        },
        select: {
          createdAt: true,
          completedAt: true,
        },
      }),
    ])

    // Calculate average completion time in days
    let avgDays = 0
    if (avgCompletionTime.length > 0) {
      const totalDays = avgCompletionTime.reduce((sum: number, req: any) => {
        const days = Math.ceil(
          (req.completedAt!.getTime() - req.createdAt.getTime()) /
            (1000 * 60 * 60 * 24)
        )
        return sum + days
      }, 0)
      avgDays = Math.round(totalDays / avgCompletionTime.length)
    }

    return {
      total,
      submitted,
      inProgress,
      completed,
      emergency,
      avgCompletionDays: avgDays,
    }
  }),

  /**
   * Delete maintenance request
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.maintenanceRequest.findUnique({
        where: { id: input.id },
      })

      if (!request) {
        throw new Error('Maintenance request not found')
      }

      if (request.userId !== ctx.session.user.id) {
        throw new Error('Access denied')
      }

      await ctx.prisma.maintenanceRequest.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})
