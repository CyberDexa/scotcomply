import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'
import { prisma } from '@/lib/prisma'
import { TransactionType, TransactionStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subYears,
} from 'date-fns'

export const financialRouter = createTRPCRouter({
  // Generate a financial report for a specific period
  generateReport: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().cuid().optional(),
        reportType: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'TAX_YEAR', 'CUSTOM']),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        year: z.number().optional(),
        month: z.number().min(1).max(12).optional(),
        quarter: z.number().min(1).max(4).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify property ownership if propertyId provided
      if (input.propertyId) {
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
      }

      // Determine date range based on report type
      let startDate: Date
      let endDate: Date
      const now = new Date()
      const year = input.year ?? now.getFullYear()

      switch (input.reportType) {
        case 'MONTHLY':
          const month = input.month ?? now.getMonth() + 1
          const date = new Date(year, month - 1, 1)
          startDate = startOfMonth(date)
          endDate = endOfMonth(date)
          break

        case 'QUARTERLY':
          const quarter = input.quarter ?? Math.ceil((now.getMonth() + 1) / 3)
          const quarterDate = new Date(year, (quarter - 1) * 3, 1)
          startDate = startOfQuarter(quarterDate)
          endDate = endOfQuarter(quarterDate)
          break

        case 'ANNUAL':
          startDate = startOfYear(new Date(year, 0, 1))
          endDate = endOfYear(new Date(year, 0, 1))
          break

        case 'TAX_YEAR':
          // UK tax year: April 6th to April 5th
          startDate = new Date(year, 3, 6) // April 6th
          endDate = new Date(year + 1, 3, 5) // April 5th next year
          break

        case 'CUSTOM':
          if (!input.startDate || !input.endDate) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Start and end dates required for custom reports',
            })
          }
          startDate = input.startDate
          endDate = input.endDate
          break
      }

      // Fetch transactions for the period
      const where: any = {
        property: {
          ownerId: userId,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: TransactionStatus.COMPLETED,
      }

      if (input.propertyId) {
        where.propertyId = input.propertyId
      }

      const transactions = await prisma.transaction.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              address: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      })

      // Calculate totals
      const income = transactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const expenses = transactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const taxDeductible = transactions
        .filter((t) => t.type === TransactionType.EXPENSE && t.taxDeductible)
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const vat = transactions
        .filter((t) => t.vatAmount)
        .reduce((sum, t) => sum + Number(t.vatAmount ?? 0), 0)

      // Category breakdown
      const incomeByCategory = transactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((acc: any, t) => {
          if (!acc[t.category]) {
            acc[t.category] = { category: t.category, total: 0, count: 0 }
          }
          acc[t.category].total += Number(t.amount)
          acc[t.category].count += 1
          return acc
        }, {})

      const expensesByCategory = transactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((acc: any, t) => {
          if (!acc[t.category]) {
            acc[t.category] = { category: t.category, total: 0, count: 0 }
          }
          acc[t.category].total += Number(t.amount)
          acc[t.category].count += 1
          return acc
        }, {})

      // Property breakdown (if portfolio-wide)
      const propertyBreakdown = !input.propertyId
        ? transactions.reduce((acc: any, t) => {
            const propId = t.propertyId
            if (!acc[propId]) {
              acc[propId] = {
                propertyId: propId,
                address: t.property.address,
                income: 0,
                expenses: 0,
                net: 0,
              }
            }
            if (t.type === TransactionType.INCOME) {
              acc[propId].income += Number(t.amount)
            } else {
              acc[propId].expenses += Number(t.amount)
            }
            acc[propId].net = acc[propId].income - acc[propId].expenses
            return acc
          }, {})
        : null

      const reportData = {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          type: input.reportType,
        },
        summary: {
          totalIncome: income,
          totalExpenses: expenses,
          netProfit: income - expenses,
          taxDeductibleExpenses: taxDeductible,
          totalVAT: vat,
          transactionCount: transactions.length,
        },
        incomeByCategory: Object.values(incomeByCategory),
        expensesByCategory: Object.values(expensesByCategory),
        propertyBreakdown: propertyBreakdown ? Object.values(propertyBreakdown) : null,
        transactions: transactions.map((t) => ({
          id: t.id,
          date: t.date.toISOString(),
          type: t.type,
          category: t.category,
          amount: Number(t.amount),
          description: t.description,
          property: t.property.address,
          tenant: t.tenant?.name,
        })),
      }

      // Save the report
      const report = await prisma.financialReport.create({
        data: {
          userId,
          propertyId: input.propertyId,
          reportType: input.reportType,
          startDate,
          endDate,
          totalIncome: income,
          totalExpenses: expenses,
          netProfit: income - expenses,
          data: reportData as any,
        },
      })

      return {
        ...report,
        data: reportData,
      }
    }),

  // Get all saved reports
  getReports: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().cuid().optional(),
        reportType: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'TAX_YEAR', 'CUSTOM']).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const where: any = {
        userId,
      }

      if (input.propertyId) {
        where.propertyId = input.propertyId
      }

      if (input.reportType) {
        where.reportType = input.reportType
      }

      const [reports, total] = await Promise.all([
        prisma.financialReport.findMany({
          where,
          include: {
            property: {
              select: {
                id: true,
                address: true,
                postcode: true,
              },
            },
          },
          orderBy: {
            generatedAt: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.financialReport.count({ where }),
      ])

      return {
        reports,
        total,
        hasMore: input.offset + input.limit < total,
      }
    }),

  // Get a single report by ID
  getReportById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const report = await prisma.financialReport.findFirst({
        where: {
          id: input.id,
          userId,
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

      if (!report) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Report not found',
        })
      }

      return report
    }),

  // Delete a report
  deleteReport: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const report = await prisma.financialReport.findFirst({
        where: {
          id: input.id,
          userId,
        },
      })

      if (!report) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Report not found',
        })
      }

      await prisma.financialReport.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Get portfolio financial overview
  getPortfolioOverview: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const now = new Date()
    const thisYearStart = startOfYear(now)
    const lastYearStart = startOfYear(subYears(now, 1))
    const lastYearEnd = endOfYear(subYears(now, 1))

    const where = {
      property: {
        ownerId: userId,
      },
      status: TransactionStatus.COMPLETED,
    }

    const [thisYearTransactions, lastYearTransactions, properties] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          ...where,
          date: {
            gte: thisYearStart,
          },
        },
        select: {
          type: true,
          amount: true,
          propertyId: true,
        },
      }),
      prisma.transaction.findMany({
        where: {
          ...where,
          date: {
            gte: lastYearStart,
            lte: lastYearEnd,
          },
        },
        select: {
          type: true,
          amount: true,
        },
      }),
      prisma.property.findMany({
        where: {
          ownerId: userId,
        },
        select: {
          id: true,
          address: true,
        },
      }),
    ])

    const calculateTotals = (transactions: any[]) => {
      const income = transactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const expenses = transactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.amount), 0)
      return { income, expenses, net: income - expenses }
    }

    const thisYear = calculateTotals(thisYearTransactions)
    const lastYear = calculateTotals(lastYearTransactions)

    // Calculate by property
    const propertyPerformance = properties.map((property) => {
      const propertyTransactions = thisYearTransactions.filter(
        (t) => t.propertyId === property.id
      )
      const totals = calculateTotals(propertyTransactions)
      return {
        propertyId: property.id,
        address: property.address,
        ...totals,
        roi: totals.expenses > 0 ? (totals.net / totals.expenses) * 100 : 0,
      }
    })

    // Sort by net profit
    propertyPerformance.sort((a, b) => b.net - a.net)

    return {
      thisYear,
      lastYear,
      yearOverYearChange: {
        income: lastYear.income > 0 ? ((thisYear.income - lastYear.income) / lastYear.income) * 100 : 0,
        expenses: lastYear.expenses > 0 ? ((thisYear.expenses - lastYear.expenses) / lastYear.expenses) * 100 : 0,
        net: lastYear.net !== 0 ? ((thisYear.net - lastYear.net) / Math.abs(lastYear.net)) * 100 : 0,
      },
      propertyCount: properties.length,
      propertyPerformance,
      topPerformer: propertyPerformance[0] || null,
      bottomPerformer: propertyPerformance[propertyPerformance.length - 1] || null,
    }
  }),

  // Get tax year summary (UK tax year: April 6 - April 5)
  getTaxYearSummary: protectedProcedure
    .input(
      z.object({
        taxYear: z.number().optional(), // e.g., 2024 for 2024-2025 tax year
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const now = new Date()
      const currentMonth = now.getMonth()
      
      // UK tax year starts April 6th
      const taxYearStart = currentMonth >= 3 // April or later
        ? input.taxYear ?? now.getFullYear()
        : input.taxYear ?? now.getFullYear() - 1

      const startDate = new Date(taxYearStart, 3, 6) // April 6th
      const endDate = new Date(taxYearStart + 1, 3, 5) // April 5th next year

      const transactions = await prisma.transaction.findMany({
        where: {
          property: {
            ownerId: userId,
          },
          status: TransactionStatus.COMPLETED,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          type: true,
          amount: true,
          taxDeductible: true,
          vatAmount: true,
          category: true,
        },
      })

      const totalIncome = transactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const totalExpenses = transactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const taxDeductibleExpenses = transactions
        .filter((t) => t.type === TransactionType.EXPENSE && t.taxDeductible)
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const nonDeductibleExpenses = totalExpenses - taxDeductibleExpenses

      const totalVAT = transactions
        .filter((t) => t.vatAmount)
        .reduce((sum, t) => sum + Number(t.vatAmount ?? 0), 0)

      const taxableProfit = totalIncome - taxDeductibleExpenses

      return {
        taxYear: `${taxYearStart}-${taxYearStart + 1}`,
        period: {
          start: startDate,
          end: endDate,
        },
        totalIncome,
        totalExpenses,
        taxDeductibleExpenses,
        nonDeductibleExpenses,
        totalVAT,
        taxableProfit,
        estimatedTax: taxableProfit > 0 ? taxableProfit * 0.2 : 0, // Simplified 20% basic rate
      }
    }),
})
