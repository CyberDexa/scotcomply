/**
 * AML (Anti-Money Laundering) Screening Router
 * 
 * Provides endpoints for:
 * - Initiating AML screenings for individuals and companies
 * - Reviewing screening matches
 * - Managing Enhanced Due Diligence (EDD)
 * - Annual review tracking
 * - Compliance reporting
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc';
import prisma from '@/lib/prisma';
import { 
  SubjectType, 
  ScreeningStatus, 
  RiskLevel, 
  ReviewStatus, 
  MatchType,
  MatchDecision 
} from '@prisma/client';

export const amlRouter = createTRPCRouter({
  /**
   * List all AML screenings with filters
   */
  list: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(ScreeningStatus).optional(),
        riskLevel: z.nativeEnum(RiskLevel).optional(),
        reviewStatus: z.nativeEnum(ReviewStatus).optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, riskLevel, reviewStatus, limit, cursor } = input;

      const screenings = await prisma.aMLScreening.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(status && { status }),
          ...(riskLevel && { riskLevel }),
          ...(reviewStatus && { reviewStatus }),
        },
        include: {
          matches: {
            select: {
              id: true,
              matchType: true,
              matchScore: true,
              reviewStatus: true,
            },
          },
          _count: {
            select: {
              matches: true,
              audits: true,
            },
          },
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | undefined = undefined;
      if (screenings.length > limit) {
        const nextItem = screenings.pop();
        nextCursor = nextItem?.id;
      }

      return {
        screenings,
        nextCursor,
      };
    }),

  /**
   * Get screening statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [
      totalScreenings,
      pendingReview,
      highRisk,
      eddRequired,
      dueForReview,
      screeningsByStatus,
      screeningsByRisk,
    ] = await Promise.all([
      // Total screenings
      prisma.aMLScreening.count({
        where: { userId: ctx.session.user.id },
      }),
      // Pending review
      prisma.aMLScreening.count({
        where: {
          userId: ctx.session.user.id,
          reviewStatus: ReviewStatus.PENDING,
        },
      }),
      // High risk
      prisma.aMLScreening.count({
        where: {
          userId: ctx.session.user.id,
          riskLevel: { in: [RiskLevel.HIGH, RiskLevel.CRITICAL] },
        },
      }),
      // EDD required
      prisma.aMLScreening.count({
        where: {
          userId: ctx.session.user.id,
          eddRequired: true,
          eddCompleted: false,
        },
      }),
      // Due for annual review
      prisma.aMLScreening.count({
        where: {
          userId: ctx.session.user.id,
          nextReviewDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
          },
        },
      }),
      // By status
      prisma.aMLScreening.groupBy({
        by: ['status'],
        where: { userId: ctx.session.user.id },
        _count: true,
      }),
      // By risk level
      prisma.aMLScreening.groupBy({
        by: ['riskLevel'],
        where: { 
          userId: ctx.session.user.id,
          riskLevel: { not: null },
        },
        _count: true,
      }),
    ]);

    return {
      totalScreenings,
      pendingReview,
      highRisk,
      eddRequired,
      dueForReview,
      byStatus: screeningsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byRisk: screeningsByRisk.reduce((acc, item) => {
        if (item.riskLevel) {
          acc[item.riskLevel] = item._count;
        }
        return acc;
      }, {} as Record<string, number>),
    };
  }),

  /**
   * Get single screening by ID with full details
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const screening = await prisma.aMLScreening.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          matches: {
            orderBy: { matchScore: 'desc' },
          },
          audits: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });

      if (!screening) {
        throw new Error('Screening not found');
      }

      return screening;
    }),

  /**
   * Initiate a new AML screening
   */
  create: protectedProcedure
    .input(
      z.object({
        subjectType: z.nativeEnum(SubjectType),
        subjectName: z.string().min(2),
        subjectEmail: z.string().email().optional(),
        subjectPhone: z.string().optional(),
        dateOfBirth: z.date().optional(),
        nationality: z.string().optional(),
        companyNumber: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create screening record
      const screening = await prisma.aMLScreening.create({
        data: {
          userId: ctx.session.user.id,
          subjectType: input.subjectType,
          subjectName: input.subjectName,
          subjectEmail: input.subjectEmail,
          subjectPhone: input.subjectPhone,
          dateOfBirth: input.dateOfBirth,
          nationality: input.nationality,
          companyNumber: input.companyNumber,
          notes: input.notes,
          status: ScreeningStatus.PENDING,
          reviewStatus: ReviewStatus.PENDING,
        },
      });

      // Create audit log
      await prisma.aMLAudit.create({
        data: {
          screeningId: screening.id,
          action: 'SCREENING_INITIATED',
          performedBy: ctx.session.user.id,
          description: `AML screening initiated for ${input.subjectType}: ${input.subjectName}`,
          newValue: input,
        },
      });

      // TODO: Call AML service to perform actual screening
      // For now, return the created screening
      return screening;
    }),

  /**
   * Perform screening (calls external AML service)
   */
  performScreening: protectedProcedure
    .input(z.object({ screeningId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const screening = await prisma.aMLScreening.findFirst({
        where: {
          id: input.screeningId,
          userId: ctx.session.user.id,
        },
      });

      if (!screening) {
        throw new Error('Screening not found');
      }

      if (screening.status !== ScreeningStatus.PENDING) {
        throw new Error('Screening already processed');
      }

      // Update status to IN_PROGRESS
      await prisma.aMLScreening.update({
        where: { id: input.screeningId },
        data: { status: ScreeningStatus.IN_PROGRESS },
      });

      try {
        // TODO: Call external AML service (ComplyAdvantage, etc.)
        // For now, simulate screening with mock data
        const mockMatches = await simulateScreening(screening);

        // Calculate risk score and level
        const { riskScore, riskLevel } = calculateRisk(mockMatches);

        // Update screening with results
        const updatedScreening = await prisma.aMLScreening.update({
          where: { id: input.screeningId },
          data: {
            status: ScreeningStatus.COMPLETED,
            riskScore,
            riskLevel,
            matchFound: mockMatches.length > 0,
            sanctionsMatch: mockMatches.some(m => m.matchType === MatchType.SANCTIONS),
            pepMatch: mockMatches.some(m => m.matchType === MatchType.PEP),
            adverseMedia: mockMatches.some(m => m.matchType === MatchType.ADVERSE_MEDIA),
            reviewStatus: mockMatches.length > 0 ? ReviewStatus.PENDING : ReviewStatus.APPROVED,
            eddRequired: riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL,
            nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          },
        });

        // Create matches
        if (mockMatches.length > 0) {
          await prisma.aMLMatch.createMany({
            data: mockMatches.map(match => ({
              screeningId: input.screeningId,
              ...match,
            })),
          });
        }

        // Audit log
        await prisma.aMLAudit.create({
          data: {
            screeningId: input.screeningId,
            action: 'SCREENING_COMPLETED',
            performedBy: 'SYSTEM',
            description: `Screening completed. Risk: ${riskLevel}, Matches: ${mockMatches.length}`,
            newValue: { riskScore, riskLevel, matchCount: mockMatches.length },
          },
        });

        return updatedScreening;
      } catch (error) {
        // Update status to FAILED
        await prisma.aMLScreening.update({
          where: { id: input.screeningId },
          data: { 
            status: ScreeningStatus.FAILED,
            metadata: { error: (error as Error).message },
          },
        });

        throw error;
      }
    }),

  /**
   * Update screening review status
   */
  updateReviewStatus: protectedProcedure
    .input(
      z.object({
        screeningId: z.string(),
        reviewStatus: z.nativeEnum(ReviewStatus),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const screening = await prisma.aMLScreening.findFirst({
        where: {
          id: input.screeningId,
          userId: ctx.session.user.id,
        },
      });

      if (!screening) {
        throw new Error('Screening not found');
      }

      const updated = await prisma.aMLScreening.update({
        where: { id: input.screeningId },
        data: {
          reviewStatus: input.reviewStatus,
          reviewedAt: new Date(),
          reviewedBy: ctx.session.user.id,
        },
      });

      // Audit log
      await prisma.aMLAudit.create({
        data: {
          screeningId: input.screeningId,
          action: 'REVIEW_STATUS_UPDATED',
          performedBy: ctx.session.user.id,
          description: `Review status changed to ${input.reviewStatus}${input.reviewNotes ? `: ${input.reviewNotes}` : ''}`,
          oldValue: { reviewStatus: screening.reviewStatus },
          newValue: { reviewStatus: input.reviewStatus },
        },
      });

      return updated;
    }),

  /**
   * Review a specific match
   */
  reviewMatch: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        decision: z.nativeEnum(MatchDecision),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const match = await prisma.aMLMatch.findFirst({
        where: { id: input.matchId },
        include: { screening: true },
      });

      if (!match || match.screening.userId !== ctx.session.user.id) {
        throw new Error('Match not found');
      }

      const updated = await prisma.aMLMatch.update({
        where: { id: input.matchId },
        data: {
          decision: input.decision,
          reviewStatus: ReviewStatus.APPROVED,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes,
        },
      });

      // Audit log
      await prisma.aMLAudit.create({
        data: {
          screeningId: match.screeningId,
          action: 'MATCH_REVIEWED',
          performedBy: ctx.session.user.id,
          description: `Match "${match.entityName}" marked as ${input.decision}`,
          newValue: { matchId: input.matchId, decision: input.decision },
        },
      });

      // Check if all matches reviewed
      const pendingMatches = await prisma.aMLMatch.count({
        where: {
          screeningId: match.screeningId,
          reviewStatus: ReviewStatus.PENDING,
        },
      });

      // If all matches reviewed, update screening review status
      if (pendingMatches === 0) {
        await prisma.aMLScreening.update({
          where: { id: match.screeningId },
          data: {
            reviewStatus: ReviewStatus.APPROVED,
            reviewedAt: new Date(),
            reviewedBy: ctx.session.user.id,
          },
        });
      }

      return updated;
    }),

  /**
   * Complete Enhanced Due Diligence (EDD)
   */
  completeEDD: protectedProcedure
    .input(
      z.object({
        screeningId: z.string(),
        eddNotes: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const screening = await prisma.aMLScreening.findFirst({
        where: {
          id: input.screeningId,
          userId: ctx.session.user.id,
        },
      });

      if (!screening) {
        throw new Error('Screening not found');
      }

      if (!screening.eddRequired) {
        throw new Error('EDD not required for this screening');
      }

      const updated = await prisma.aMLScreening.update({
        where: { id: input.screeningId },
        data: {
          eddCompleted: true,
          eddNotes: input.eddNotes,
        },
      });

      // Audit log
      await prisma.aMLAudit.create({
        data: {
          screeningId: input.screeningId,
          action: 'EDD_COMPLETED',
          performedBy: ctx.session.user.id,
          description: 'Enhanced Due Diligence completed',
          newValue: { eddNotes: input.eddNotes },
        },
      });

      return updated;
    }),

  /**
   * Schedule annual review
   */
  scheduleAnnualReview: protectedProcedure
    .input(
      z.object({
        screeningId: z.string(),
        reviewDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const screening = await prisma.aMLScreening.findFirst({
        where: {
          id: input.screeningId,
          userId: ctx.session.user.id,
        },
      });

      if (!screening) {
        throw new Error('Screening not found');
      }

      const updated = await prisma.aMLScreening.update({
        where: { id: input.screeningId },
        data: {
          nextReviewDate: input.reviewDate,
        },
      });

      // Audit log
      await prisma.aMLAudit.create({
        data: {
          screeningId: input.screeningId,
          action: 'ANNUAL_REVIEW_SCHEDULED',
          performedBy: ctx.session.user.id,
          description: `Annual review scheduled for ${input.reviewDate.toLocaleDateString()}`,
          newValue: { nextReviewDate: input.reviewDate },
        },
      });

      return updated;
    }),

  /**
   * Get screenings due for review
   */
  getDueForReview: protectedProcedure
    .input(
      z.object({
        daysAhead: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const dueDate = new Date(Date.now() + input.daysAhead * 24 * 60 * 60 * 1000);

      const screenings = await prisma.aMLScreening.findMany({
        where: {
          userId: ctx.session.user.id,
          nextReviewDate: {
            lte: dueDate,
          },
        },
        include: {
          _count: {
            select: { matches: true },
          },
        },
        orderBy: { nextReviewDate: 'asc' },
      });

      return screenings;
    }),

  /**
   * Delete screening
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const screening = await prisma.aMLScreening.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!screening) {
        throw new Error('Screening not found');
      }

      await prisma.aMLScreening.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

/**
 * Helper Functions
 */

// Simulate AML screening (mock data for development)
async function simulateScreening(screening: any): Promise<any[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const matches = [];

  // Random chance of matches based on name
  const nameHash = screening.subjectName.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const matchProbability = (nameHash % 100) / 100;

  // 30% chance of finding matches
  if (matchProbability < 0.3) {
    // Sanctions match
    if (matchProbability < 0.1) {
      matches.push({
        matchType: MatchType.SANCTIONS,
        entityName: screening.subjectName,
        matchScore: 85 + Math.floor(Math.random() * 15),
        aliases: [],
        listName: 'UN Consolidated List',
        listType: 'sanctions',
        nationality: [screening.nationality || 'Unknown'],
        positions: [],
        reviewStatus: ReviewStatus.PENDING,
      });
    }

    // PEP match
    if (matchProbability >= 0.1 && matchProbability < 0.2) {
      matches.push({
        matchType: MatchType.PEP,
        entityName: screening.subjectName,
        matchScore: 75 + Math.floor(Math.random() * 20),
        aliases: [],
        listName: 'UK PEP Database',
        listType: 'pep',
        nationality: [screening.nationality || 'United Kingdom'],
        positions: ['Former Government Official'],
        reviewStatus: ReviewStatus.PENDING,
      });
    }

    // Adverse media match
    if (matchProbability >= 0.2 && matchProbability < 0.3) {
      matches.push({
        matchType: MatchType.ADVERSE_MEDIA,
        entityName: screening.subjectName,
        matchScore: 60 + Math.floor(Math.random() * 25),
        aliases: [],
        listName: 'Global News Archive',
        listType: 'adverse_media',
        nationality: [screening.nationality || 'Unknown'],
        positions: [],
        reviewStatus: ReviewStatus.PENDING,
      });
    }
  }

  return matches;
}

// Calculate risk score and level based on matches
function calculateRisk(matches: any[]): { riskScore: number; riskLevel: RiskLevel } {
  if (matches.length === 0) {
    return { riskScore: 0, riskLevel: RiskLevel.LOW };
  }

  // Calculate weighted risk score
  let totalScore = 0;
  let maxScore = 0;

  matches.forEach(match => {
    const weight = match.matchType === MatchType.SANCTIONS ? 1.5 :
                   match.matchType === MatchType.PEP ? 1.2 : 1.0;
    
    const weightedScore = match.matchScore * weight;
    totalScore += weightedScore;
    maxScore = Math.max(maxScore, weightedScore);
  });

  const averageScore = totalScore / matches.length;
  const riskScore = Math.min(100, Math.round((averageScore + maxScore) / 2));

  // Determine risk level
  let riskLevel: RiskLevel;
  if (riskScore >= 90 || matches.some((m: any) => m.matchType === MatchType.SANCTIONS && m.matchScore > 85)) {
    riskLevel = RiskLevel.CRITICAL;
  } else if (riskScore >= 70) {
    riskLevel = RiskLevel.HIGH;
  } else if (riskScore >= 40) {
    riskLevel = RiskLevel.MEDIUM;
  } else {
    riskLevel = RiskLevel.LOW;
  }

  return { riskScore, riskLevel };
}
