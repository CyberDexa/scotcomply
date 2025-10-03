import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'
import { prisma } from '@/lib/prisma'
import { WorkflowAction, WorkflowTrigger } from '@prisma/client'
import { TRPCError } from '@trpc/server'

export const workflowRouter = createTRPCRouter({
  // Create a new workflow
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        trigger: z.nativeEnum(WorkflowTrigger),
        conditions: z.record(z.string(), z.any()).optional(),
        active: z.boolean().default(true),
        steps: z.array(
          z.object({
            action: z.nativeEnum(WorkflowAction),
            config: z.record(z.string(), z.any()),
            order: z.number().int().min(0),
            delay: z.number().int().min(0).optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.create({
        data: {
          name: input.name,
          description: input.description,
          trigger: input.trigger,
          conditions: input.conditions as any,
          active: input.active,
          steps: {
            create: input.steps.map((step) => ({
              action: step.action,
              config: step.config as any,
              order: step.order,
              delay: step.delay,
            })),
          },
        },
        include: {
          steps: {
            orderBy: { order: 'asc' },
          },
        },
      })

      return workflow
    }),

  // Get all workflows
  getAll: protectedProcedure
    .input(
      z.object({
        active: z.boolean().optional(),
        trigger: z.nativeEnum(WorkflowTrigger).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {}

      if (input.active !== undefined) {
        where.active = input.active
      }

      if (input.trigger) {
        where.trigger = input.trigger
      }

      const [workflows, total] = await Promise.all([
        prisma.workflow.findMany({
          where,
          include: {
            steps: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.workflow.count({ where }),
      ])

      return {
        workflows,
        total,
        hasMore: input.offset + input.limit < total,
      }
    }),

  // Get workflow by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUnique({
        where: {
          id: input.id,
        },
        include: {
          steps: {
            orderBy: { order: 'asc' },
          },
        },
      })

      if (!workflow) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workflow not found',
        })
      }

      return workflow
    }),

  // Update workflow
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        conditions: z.record(z.string(), z.any()).optional(),
        active: z.boolean().optional(),
        steps: z
          .array(
            z.object({
              id: z.string().cuid().optional(),
              action: z.nativeEnum(WorkflowAction),
              config: z.record(z.string(), z.any()),
              order: z.number().int().min(0),
              delay: z.number().int().min(0).optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUnique({
        where: {
          id: input.id,
        },
      })

      if (!workflow) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workflow not found',
        })
      }

      // If updating steps, delete old ones and create new ones
      if (input.steps) {
        await prisma.workflowStep.deleteMany({
          where: { workflowId: input.id },
        })
      }

      const updated = await prisma.workflow.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          conditions: input.conditions as any,
          active: input.active,
          ...(input.steps && {
            steps: {
              create: input.steps.map((step) => ({
                action: step.action,
                config: step.config as any,
                order: step.order,
                delay: step.delay,
              })),
            },
          }),
        },
        include: {
          steps: {
            orderBy: { order: 'asc' },
          },
        },
      })

      return updated
    }),

  // Delete workflow
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUnique({
        where: {
          id: input.id,
        },
      })

      if (!workflow) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workflow not found',
        })
      }

      await prisma.workflow.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Toggle workflow active status
  toggleActive: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        active: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUnique({
        where: {
          id: input.id,
        },
      })

      if (!workflow) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workflow not found',
        })
      }

      const updated = await prisma.workflow.update({
        where: { id: input.id },
        data: { active: input.active },
      })

      return updated
    }),

  // Get workflow statistics
  getStats: protectedProcedure.query(async () => {
    const [totalWorkflows, activeWorkflows] = await Promise.all([
      prisma.workflow.count({ where: {} }),
      prisma.workflow.count({
        where: { active: true },
      }),
    ])

    return {
      totalWorkflows,
      activeWorkflows,
      inactiveWorkflows: totalWorkflows - activeWorkflows,
    }
  }),

  // Get workflow templates
  getTemplates: protectedProcedure.query(async () => {
    // Predefined workflow templates
    const templates = [
      {
        id: 'certificate-expiry-reminder',
        name: 'Certificate Expiry Reminder',
        description: 'Send email reminders when certificates are about to expire',
        trigger: WorkflowTrigger.CERTIFICATE_EXPIRING,
        steps: [
          {
            action: WorkflowAction.SEND_EMAIL,
            order: 0,
            delay: 0,
            config: {
              template: 'CERTIFICATE_EXPIRY',
              to: '{{owner.email}}',
              subject: 'Certificate Expiring Soon: {{certificate.type}}',
            },
          },
          {
            action: WorkflowAction.CREATE_TASK,
            order: 1,
            delay: 0,
            config: {
              title: 'Renew {{certificate.type}}',
              description: 'Certificate expires on {{certificate.expiryDate}}',
              dueDate: '{{certificate.expiryDate}}',
            },
          },
        ],
      },
      {
        id: 'lease-renewal',
        name: 'Lease Renewal Process',
        description: 'Automate lease renewal notifications and tasks',
        trigger: WorkflowTrigger.LEASE_EXPIRING,
        steps: [
          {
            action: WorkflowAction.SEND_EMAIL,
            order: 0,
            delay: 0,
            config: {
              template: 'LEASE_EXPIRING',
              to: '{{owner.email}}',
              subject: 'Lease Expiring: {{property.address}}',
            },
          },
          {
            action: WorkflowAction.SEND_NOTIFICATION,
            order: 1,
            delay: 7,
            config: {
              type: 'LEASE_EXPIRING',
              message: 'Lease renewal needed for {{property.address}}',
            },
          },
        ],
      },
      {
        id: 'rent-overdue',
        name: 'Rent Overdue Notifications',
        description: 'Send notifications when rent is overdue',
        trigger: WorkflowTrigger.PAYMENT_OVERDUE,
        steps: [
          {
            action: WorkflowAction.SEND_EMAIL,
            order: 0,
            delay: 0,
            config: {
              template: 'RENT_OVERDUE',
              to: '{{tenant.email}}',
              subject: 'Rent Payment Overdue',
            },
          },
          {
            action: WorkflowAction.SEND_NOTIFICATION,
            order: 1,
            delay: 0,
            config: {
              type: 'RENT_OVERDUE',
              message: 'Rent is overdue for {{property.address}}',
            },
          },
          {
            action: WorkflowAction.CREATE_TASK,
            order: 2,
            delay: 7,
            config: {
              title: 'Follow up on overdue rent',
              description: 'Tenant: {{tenant.name}}, Property: {{property.address}}',
            },
          },
        ],
      },
      {
        id: 'tenant-move-in',
        name: 'Tenant Move-In Checklist',
        description: 'Automate tasks when a new tenant moves in',
        trigger: WorkflowTrigger.TENANT_MOVE_IN,
        steps: [
          {
            action: WorkflowAction.SEND_EMAIL,
            order: 0,
            delay: 0,
            config: {
              template: 'WELCOME',
              to: '{{tenant.email}}',
              subject: 'Welcome to {{property.address}}',
            },
          },
          {
            action: WorkflowAction.CREATE_TASK,
            order: 1,
            delay: 0,
            config: {
              title: 'Complete inventory check',
              description: 'Property: {{property.address}}',
            },
          },
          {
            action: WorkflowAction.GENERATE_DOCUMENT,
            order: 2,
            delay: 0,
            config: {
              documentType: 'INVENTORY',
            },
          },
        ],
      },
      {
        id: 'maintenance-workflow',
        name: 'Maintenance Request Workflow',
        description: 'Automate maintenance request handling',
        trigger: WorkflowTrigger.MAINTENANCE_CREATED,
        steps: [
          {
            action: WorkflowAction.SEND_NOTIFICATION,
            order: 0,
            delay: 0,
            config: {
              type: 'MAINTENANCE_REQUEST',
              message: 'New maintenance request: {{maintenance.title}}',
            },
          },
          {
            action: WorkflowAction.CREATE_TASK,
            order: 1,
            delay: 0,
            config: {
              title: 'Review maintenance request',
              description: '{{maintenance.description}}',
            },
          },
        ],
      },
    ]

    return templates
  }),
})
