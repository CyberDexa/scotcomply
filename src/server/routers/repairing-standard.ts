import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'
import { REPAIRING_STANDARD_CHECKPOINTS } from '@/lib/repairing-standard-constants'

/**
 * Repairing Standard Assessment Router
 */
export const repairingStandardRouter = createTRPCRouter({
  /**
   * Create new assessment for a property
   */
  createAssessment: protectedProcedure
    .input(
      z.object({
        propertyId: z.string(),
        assessmentDate: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify property ownership
      const property = await ctx.prisma.property.findUnique({
        where: { id: input.propertyId },
      })

      if (!property || property.ownerId !== userId) {
        throw new Error('Property not found or access denied')
      }

      // Create assessment with all 21 checkpoints as repair items
      const assessment = await ctx.prisma.repairingStandardAssessment.create({
        data: {
          userId,
          propertyId: input.propertyId,
          assessmentDate: input.assessmentDate || new Date(),
          notes: input.notes,
          overallStatus: 'pending',
          score: 0,
          items: {
            create: REPAIRING_STANDARD_CHECKPOINTS.map((checkpoint) => ({
              category: checkpoint.category,
              description: `${checkpoint.title}: ${checkpoint.description}`,
              status: 'pending',
              priority: 'medium',
            })),
          },
        },
        include: {
          items: true,
          property: true,
        },
      })

      return assessment
    }),

  /**
   * Get all assessments for user
   */
  getAssessments: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const assessments = await ctx.prisma.repairingStandardAssessment.findMany({
      where: { userId },
      include: {
        property: true,
        items: true,
      },
      orderBy: {
        assessmentDate: 'desc',
      },
    })

    return assessments
  }),

  /**
   * Get single assessment with details
   */
  getAssessment: protectedProcedure
    .input(z.object({ assessmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const assessment = await ctx.prisma.repairingStandardAssessment.findUnique({
        where: { id: input.assessmentId },
        include: {
          property: {
            include: {
              certificates: {
                orderBy: {
                  expiryDate: 'desc',
                },
              },
            },
          },
          items: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })

      if (!assessment || assessment.userId !== userId) {
        throw new Error('Assessment not found or access denied')
      }

      return assessment
    }),

  /**
   * Get assessments by property
   */
  getPropertyAssessments: protectedProcedure
    .input(z.object({ propertyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const assessments = await ctx.prisma.repairingStandardAssessment.findMany({
        where: {
          userId,
          propertyId: input.propertyId,
        },
        include: {
          items: true,
        },
        orderBy: {
          assessmentDate: 'desc',
        },
      })

      return assessments
    }),

  /**
   * Update checkpoint/repair item status
   */
  updateCheckpoint: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        status: z.enum(['pending', 'compliant', 'non_compliant', 'in_progress', 'completed']),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        notes: z.string().optional(),
        evidenceUrl: z.string().optional(),
        dueDate: z.date().optional(),
        cost: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { itemId, ...updateData } = input

      // Verify ownership
      const item = await ctx.prisma.repairItem.findUnique({
        where: { id: itemId },
        include: {
          assessment: true,
        },
      })

      if (!item || item.assessment.userId !== userId) {
        throw new Error('Repair item not found or access denied')
      }

      // Update the item
      const updatedItem = await ctx.prisma.repairItem.update({
        where: { id: itemId },
        data: {
          ...updateData,
          completedDate: updateData.status === 'completed' ? new Date() : item.completedDate,
        },
      })

      // Recalculate assessment score
      await recalculateAssessmentScore(ctx.prisma, item.assessmentId)

      return updatedItem
    }),

  /**
   * Add new repair item (beyond the 21-point checklist)
   */
  addRepairItem: protectedProcedure
    .input(
      z.object({
        assessmentId: z.string(),
        category: z.string(),
        description: z.string(),
        status: z.enum(['pending', 'compliant', 'non_compliant', 'in_progress', 'completed']).default('pending'),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        notes: z.string().optional(),
        dueDate: z.date().optional(),
        cost: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const assessment = await ctx.prisma.repairingStandardAssessment.findUnique({
        where: { id: input.assessmentId },
      })

      if (!assessment || assessment.userId !== userId) {
        throw new Error('Assessment not found or access denied')
      }

      const repairItem = await ctx.prisma.repairItem.create({
        data: input,
      })

      // Recalculate score
      await recalculateAssessmentScore(ctx.prisma, input.assessmentId)

      return repairItem
    }),

  /**
   * Delete repair item
   */
  deleteRepairItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const item = await ctx.prisma.repairItem.findUnique({
        where: { id: input.itemId },
        include: {
          assessment: true,
        },
      })

      if (!item || item.assessment.userId !== userId) {
        throw new Error('Repair item not found or access denied')
      }

      const assessmentId = item.assessmentId

      await ctx.prisma.repairItem.delete({
        where: { id: input.itemId },
      })

      // Recalculate score
      await recalculateAssessmentScore(ctx.prisma, assessmentId)

      return { success: true }
    }),

  /**
   * Get compliance score for assessment
   */
  getComplianceScore: protectedProcedure
    .input(z.object({ assessmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const assessment = await ctx.prisma.repairingStandardAssessment.findUnique({
        where: { id: input.assessmentId },
        include: {
          items: true,
        },
      })

      if (!assessment || assessment.userId !== userId) {
        throw new Error('Assessment not found or access denied')
      }

      const totalItems = assessment.items.length
      const compliantItems = assessment.items.filter(
        (item: { status: string }) => item.status === 'compliant' || item.status === 'completed'
      ).length
      const nonCompliantItems = assessment.items.filter((item: { status: string }) => item.status === 'non_compliant').length
      const pendingItems = assessment.items.filter((item: { status: string }) => item.status === 'pending' || item.status === 'in_progress').length

      const compliancePercentage = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0

      // Group by category
      const byCategory = assessment.items.reduce(
        (acc: Record<string, { total: number; compliant: number; nonCompliant: number; pending: number }>, item: { category: string; status: string }) => {
          const category = item.category
          if (!acc[category]) {
            acc[category] = {
              total: 0,
              compliant: 0,
              nonCompliant: 0,
              pending: 0,
            }
          }
          acc[category].total++
          if (item.status === 'compliant' || item.status === 'completed') {
            acc[category].compliant++
          } else if (item.status === 'non_compliant') {
            acc[category].nonCompliant++
          } else {
            acc[category].pending++
          }
          return acc
        },
        {} as Record<string, { total: number; compliant: number; nonCompliant: number; pending: number }>
      )

      return {
        totalItems,
        compliantItems,
        nonCompliantItems,
        pendingItems,
        compliancePercentage,
        overallStatus: assessment.overallStatus,
        byCategory,
      }
    }),

  /**
   * Update assessment overall status
   */
  updateAssessmentStatus: protectedProcedure
    .input(
      z.object({
        assessmentId: z.string(),
        overallStatus: z.enum(['pending', 'in_progress', 'compliant', 'non_compliant', 'completed']),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const assessment = await ctx.prisma.repairingStandardAssessment.findUnique({
        where: { id: input.assessmentId },
      })

      if (!assessment || assessment.userId !== userId) {
        throw new Error('Assessment not found or access denied')
      }

      const updated = await ctx.prisma.repairingStandardAssessment.update({
        where: { id: input.assessmentId },
        data: {
          overallStatus: input.overallStatus,
          notes: input.notes ?? assessment.notes,
        },
      })

      return updated
    }),

  /**
   * Get summary statistics
   */
  getAssessmentStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const [totalAssessments, compliantAssessments, nonCompliantAssessments, pendingAssessments] =
      await Promise.all([
        ctx.prisma.repairingStandardAssessment.count({ where: { userId } }),
        ctx.prisma.repairingStandardAssessment.count({
          where: { userId, overallStatus: 'compliant' },
        }),
        ctx.prisma.repairingStandardAssessment.count({
          where: { userId, overallStatus: 'non_compliant' },
        }),
        ctx.prisma.repairingStandardAssessment.count({
          where: { userId, overallStatus: { in: ['pending', 'in_progress'] } },
        }),
      ])

    return {
      totalAssessments,
      compliantAssessments,
      nonCompliantAssessments,
      pendingAssessments,
    }
  }),

  /**
   * Sync certificates to assessment checkpoints
   * Auto-populates checkpoint status based on certificate validity
   */
  syncCertificates: protectedProcedure
    .input(z.object({ assessmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Get assessment with property
      const assessment = await ctx.prisma.repairingStandardAssessment.findUnique({
        where: { id: input.assessmentId },
        include: {
          property: {
            include: {
              certificates: {
                orderBy: { expiryDate: 'desc' },
              },
            },
          },
          items: true,
        },
      })

      if (!assessment || assessment.userId !== userId) {
        throw new Error('Assessment not found or access denied')
      }

      const today = new Date()
      const updates: any[] = []

      // Certificate to checkpoint keyword mapping
      // Maps certificate types to keywords that appear in item descriptions
      const certificateMapping: Record<string, string[]> = {
        GAS_SAFETY: ['gas', 'boiler', 'carbon monoxide'],
        EICR: ['electrical'],
        EPC: ['heating', 'hot water'],
        PAT: ['electrical'],
        LEGIONELLA: ['water supply'],
      }

      // Process each certificate type
      for (const cert of assessment.property.certificates) {
        const keywords = certificateMapping[cert.certificateType] || []
        const isExpired = new Date(cert.expiryDate) < today
        const newStatus = isExpired ? 'non_compliant' : 'compliant'

        // Find matching items by keywords in description
        for (const keyword of keywords) {
          const matchingItems = assessment.items.filter((i: { description: string }) =>
            i.description.toLowerCase().includes(keyword.toLowerCase())
          )

          for (const item of matchingItems) {
            if (item.status !== newStatus) {
              updates.push(
                ctx.prisma.repairItem.update({
                  where: { id: item.id },
                  data: {
                    status: newStatus,
                    notes: isExpired
                      ? `${cert.certificateType} certificate expired on ${new Date(cert.expiryDate).toLocaleDateString()}`
                      : `${cert.certificateType} certificate valid until ${new Date(cert.expiryDate).toLocaleDateString()}`,
                  },
                })
              )
            }
          }
        }
      }

      // Execute all updates
      await Promise.all(updates)

      // Recalculate score
      await recalculateAssessmentScore(ctx.prisma, input.assessmentId)

      // Return updated assessment
      return await ctx.prisma.repairingStandardAssessment.findUnique({
        where: { id: input.assessmentId },
        include: {
          property: true,
          items: true,
        },
      })
    }),
})

/**
 * Helper function to recalculate assessment score
 */
async function recalculateAssessmentScore(prisma: any, assessmentId: string) {
  const assessment = await prisma.repairingStandardAssessment.findUnique({
    where: { id: assessmentId },
    include: {
      items: true,
    },
  })

  if (!assessment) return

  const totalItems = assessment.items.length
  const compliantItems = assessment.items.filter(
    (item: any) => item.status === 'compliant' || item.status === 'completed'
  ).length

  const score = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0

  // Determine overall status based on compliance
  let overallStatus = assessment.overallStatus
  if (score === 100) {
    overallStatus = 'compliant'
  } else if (score === 0) {
    overallStatus = 'pending'
  } else if (assessment.items.some((item: any) => item.status === 'non_compliant')) {
    overallStatus = 'non_compliant'
  } else {
    overallStatus = 'in_progress'
  }

  await prisma.repairingStandardAssessment.update({
    where: { id: assessmentId },
    data: {
      score,
      overallStatus,
    },
  })
}
