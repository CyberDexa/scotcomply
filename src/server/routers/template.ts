import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'

/**
 * Template Router
 * Handles CRUD operations for document templates
 */

export const templateRouter = createTRPCRouter({
  /**
   * Get all templates for current user
   */
  list: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        includeDefaults: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        OR: [
          { userId: ctx.session.user.id },
          ...(input.includeDefaults ? [{ isDefault: true }] : []),
        ],
      }

      if (input.category) {
        where.category = input.category
      }

      return await ctx.prisma.documentTemplate.findMany({
        where,
        orderBy: [
          { isDefault: 'desc' }, // Show default templates first
          { createdAt: 'desc' },
        ],
      })
    }),

  /**
   * Get template by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.prisma.documentTemplate.findUnique({
        where: { id: input.id },
      })

      if (!template) {
        throw new Error('Template not found')
      }

      // Allow access to default templates or own templates
      if (!template.isDefault && template.userId !== ctx.session.user.id) {
        throw new Error('Access denied')
      }

      return template
    }),

  /**
   * Create new template
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        category: z.enum([
          'tenant_notices',
          'compliance_reports',
          'maintenance',
          'legal',
          'custom',
        ]),
        content: z.string().min(1),
        variables: z.array(z.string()).optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.documentTemplate.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          description: input.description,
          category: input.category,
          content: input.content,
          variables: input.variables || [],
          metadata: input.metadata || {},
        },
      })
    }),

  /**
   * Update template
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        category: z
          .enum([
            'tenant_notices',
            'compliance_reports',
            'maintenance',
            'legal',
            'custom',
          ])
          .optional(),
        content: z.string().min(1).optional(),
        variables: z.array(z.string()).optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.documentTemplate.findUnique({
        where: { id: input.id },
      })

      if (!template) {
        throw new Error('Template not found')
      }

      if (template.userId !== ctx.session.user.id) {
        throw new Error('Access denied')
      }

      const { id, ...data } = input
      return await ctx.prisma.documentTemplate.update({
        where: { id: input.id },
        data,
      })
    }),

  /**
   * Delete template
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.documentTemplate.findUnique({
        where: { id: input.id },
      })

      if (!template) {
        throw new Error('Template not found')
      }

      if (template.userId !== ctx.session.user.id) {
        throw new Error('Access denied')
      }

      if (template.isDefault) {
        throw new Error('Cannot delete default templates')
      }

      await ctx.prisma.documentTemplate.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  /**
   * Duplicate template
   */
  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.documentTemplate.findUnique({
        where: { id: input.id },
      })

      if (!template) {
        throw new Error('Template not found')
      }

      // Allow duplicating default templates or own templates
      if (!template.isDefault && template.userId !== ctx.session.user.id) {
        throw new Error('Access denied')
      }

      return await ctx.prisma.documentTemplate.create({
        data: {
          userId: ctx.session.user.id,
          name: `${template.name} (Copy)`,
          description: template.description,
          category: template.category,
          content: template.content,
          variables: template.variables as any,
          metadata: template.metadata as any,
          isPublic: false,
          isDefault: false,
        },
      })
    }),

  /**
   * Render template with variables
   */
  render: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        variables: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.documentTemplate.findUnique({
        where: { id: input.templateId },
      })

      if (!template) {
        throw new Error('Template not found')
      }

      // Allow rendering default templates or own templates
      if (!template.isDefault && template.userId !== ctx.session.user.id) {
        throw new Error('Access denied')
      }

      // Replace variables in content
      let renderedContent = template.content

      Object.keys(input.variables).forEach((key) => {
        const placeholder = `{{${key}}}`
        const value = input.variables[key]
        renderedContent = renderedContent.replace(
          new RegExp(placeholder, 'g'),
          value
        )
      })

      // Increment usage count
      await ctx.prisma.documentTemplate.update({
        where: { id: template.id },
        data: { usageCount: template.usageCount + 1 },
      })

      return {
        content: renderedContent,
        name: template.name,
        category: template.category,
      }
    }),

  /**
   * Get template categories with counts
   */
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    const templates = await ctx.prisma.documentTemplate.findMany({
      where: {
        OR: [{ userId: ctx.session.user.id }, { isDefault: true }],
      },
      select: {
        category: true,
      },
    })

    const categoryCounts: Record<string, number> = {}
    templates.forEach((t) => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1
    })

    return [
      {
        id: 'tenant_notices',
        name: 'Tenant Notices',
        count: categoryCounts['tenant_notices'] || 0,
      },
      {
        id: 'compliance_reports',
        name: 'Compliance Reports',
        count: categoryCounts['compliance_reports'] || 0,
      },
      {
        id: 'maintenance',
        name: 'Maintenance',
        count: categoryCounts['maintenance'] || 0,
      },
      { id: 'legal', name: 'Legal', count: categoryCounts['legal'] || 0 },
      { id: 'custom', name: 'Custom', count: categoryCounts['custom'] || 0 },
    ]
  }),
})
