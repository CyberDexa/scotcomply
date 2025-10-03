import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'
import { prisma } from '@/lib/prisma'
import { TransactionType, TransactionStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns'

// Input validation schemas
const createTransactionSchema = z.object({
  propertyId: z.string().cuid(),
  tenantId: z.string().cuid().optional().nullable(),
  type: z.nativeEnum(TransactionType),
  category: z.string().min(1),
  amount: z.number().positive(),
  date: z.date(),
  description: z.string().min(1),
  reference: z.string().optional(),
  status: z.nativeEnum(TransactionStatus).default(TransactionStatus.COMPLETED),
  paymentMethod: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
  taxDeductible: z.boolean().default(false),
  vatAmount: z.number().nonnegative().optional(),
  metadata: z.any().optional(),
})

const updateTransactionSchema = z.object({
  id: z.string().cuid(),
  type: z.nativeEnum(TransactionType).optional(),
  category: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.date().optional(),
  description: z.string().min(1).optional(),
  reference: z.string().optional().nullable(),
  status: z.nativeEnum(TransactionStatus).optional(),
  paymentMethod: z.string().optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
  taxDeductible: z.boolean().optional(),
  vatAmount: z.number().nonnegative().optional().nullable(),
  metadata: z.any().optional(),
})

export const transactionRouter = createTRPCRouter({
  // Create a new transaction
  create: protectedProcedure
    .input(createTransactionSchema)
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

      // If tenantId provided, verify tenant exists
      if (input.tenantId) {
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
      }

      const transaction = await prisma.transaction.create({
        data: {
          ...input,
          metadata: input.metadata as any,
        },
        include: {
          property: {
            select: {
              id: true,
              address: true,
              postcode: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return transaction
    }),

  // Get all transactions
  getAll: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().cuid().optional(),
        tenantId: z.string().cuid().optional(),
        type: z.nativeEnum(TransactionType).optional(),
        category: z.string().optional(),
        status: z.nativeEnum(TransactionStatus).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
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

      if (input.propertyId) {
        where.propertyId = input.propertyId
      }

      if (input.tenantId) {
        where.tenantId = input.tenantId
      }

      if (input.type) {
        where.type = input.type
      }

      if (input.category) {
        where.category = input.category
      }

      if (input.status) {
        where.status = input.status
      }

      if (input.startDate || input.endDate) {
        where.date = {}
        if (input.startDate) {
          where.date.gte = input.startDate
        }
        if (input.endDate) {
          where.date.lte = input.endDate
        }
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: {
            property: {
              select: {
                id: true,
                address: true,
                postcode: true,
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.transaction.count({ where }),
      ])

      return {
        transactions,
        total,
        hasMore: input.offset + input.limit < total,
      }
    }),

  // Get a single transaction
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const transaction = await prisma.transaction.findFirst({
        where: {
          id: input.id,
          property: {
            ownerId: userId,
          },
        },
        include: {
          property: {
            select: {
              id: true,
              address: true,
              postcode: true,
              propertyType: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      })

      if (!transaction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        })
      }

      return transaction
    }),

  // Update a transaction
  update: protectedProcedure
    .input(updateTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { id, ...data } = input

      // Verify ownership
      const existing = await prisma.transaction.findFirst({
        where: {
          id,
          property: {
            ownerId: userId,
          },
        },
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        })
      }

      const transaction = await prisma.transaction.update({
        where: { id },
        data: {
          ...data,
          metadata: data.metadata as any,
        },
        include: {
          property: {
            select: {
              id: true,
              address: true,
              postcode: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return transaction
    }),

  // Delete a transaction
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const transaction = await prisma.transaction.findFirst({
        where: {
          id: input.id,
          property: {
            ownerId: userId,
          },
        },
      })

      if (!transaction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        })
      }

      await prisma.transaction.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Get transaction summary for a period
  getSummary: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().cuid().optional(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const where: any = {
        property: {
          ownerId: userId,
        },
        date: {
          gte: input.startDate,
          lte: input.endDate,
        },
        status: TransactionStatus.COMPLETED,
      }

      if (input.propertyId) {
        where.propertyId = input.propertyId
      }

      const transactions = await prisma.transaction.findMany({
        where,
        select: {
          type: true,
          amount: true,
          category: true,
          taxDeductible: true,
          vatAmount: true,
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

      const totalVAT = transactions
        .filter((t) => t.vatAmount)
        .reduce((sum, t) => sum + Number(t.vatAmount), 0)

      // Group by category
      const categoryBreakdown = transactions.reduce((acc: any, t) => {
        const key = `${t.type}_${t.category}`
        if (!acc[key]) {
          acc[key] = {
            type: t.type,
            category: t.category,
            total: 0,
            count: 0,
          }
        }
        acc[key].total += Number(t.amount)
        acc[key].count += 1
        return acc
      }, {})

      return {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        taxDeductibleExpenses,
        totalVAT,
        transactionCount: transactions.length,
        categoryBreakdown: Object.values(categoryBreakdown),
      }
    }),

  // Get income vs expenses trend (monthly)
  getTrend: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().cuid().optional(),
        months: z.number().min(1).max(24).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const now = new Date()
      const startDate = subMonths(now, input.months)

      const where: any = {
        property: {
          ownerId: userId,
        },
        date: {
          gte: startDate,
        },
        status: TransactionStatus.COMPLETED,
      }

      if (input.propertyId) {
        where.propertyId = input.propertyId
      }

      const transactions = await prisma.transaction.findMany({
        where,
        select: {
          type: true,
          amount: true,
          date: true,
        },
        orderBy: {
          date: 'asc',
        },
      })

      // Group by month
      const monthlyData: any = {}

      transactions.forEach((t) => {
        const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            income: 0,
            expenses: 0,
            net: 0,
          }
        }

        const amount = Number(t.amount)
        if (t.type === TransactionType.INCOME) {
          monthlyData[monthKey].income += amount
        } else {
          monthlyData[monthKey].expenses += amount
        }
        monthlyData[monthKey].net = monthlyData[monthKey].income - monthlyData[monthKey].expenses
      })

      return Object.values(monthlyData)
    }),

  // Get top expense categories
  getTopExpenseCategories: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().cuid().optional(),
        startDate: z.date(),
        endDate: z.date(),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const where: any = {
        property: {
          ownerId: userId,
        },
        type: TransactionType.EXPENSE,
        status: TransactionStatus.COMPLETED,
        date: {
          gte: input.startDate,
          lte: input.endDate,
        },
      }

      if (input.propertyId) {
        where.propertyId = input.propertyId
      }

      const transactions = await prisma.transaction.findMany({
        where,
        select: {
          category: true,
          amount: true,
        },
      })

      // Group and sum by category
      const categoryTotals = transactions.reduce((acc: any, t) => {
        if (!acc[t.category]) {
          acc[t.category] = {
            category: t.category,
            total: 0,
            count: 0,
          }
        }
        acc[t.category].total += Number(t.amount)
        acc[t.category].count += 1
        return acc
      }, {})

      // Sort by total and limit
      return Object.values(categoryTotals)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, input.limit)
    }),

  // Get statistics
  getStats: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().cuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const now = new Date()
      const thisMonthStart = startOfMonth(now)
      const thisMonthEnd = endOfMonth(now)
      const thisYearStart = startOfYear(now)
      const thisYearEnd = endOfYear(now)

      const where: any = {
        property: {
          ownerId: userId,
        },
        status: TransactionStatus.COMPLETED,
      }

      if (input.propertyId) {
        where.propertyId = input.propertyId
      }

      const [
        thisMonthTransactions,
        thisYearTransactions,
        allTimeTransactions,
        pendingCount,
      ] = await Promise.all([
        prisma.transaction.findMany({
          where: {
            ...where,
            date: {
              gte: thisMonthStart,
              lte: thisMonthEnd,
            },
          },
          select: {
            type: true,
            amount: true,
          },
        }),
        prisma.transaction.findMany({
          where: {
            ...where,
            date: {
              gte: thisYearStart,
              lte: thisYearEnd,
            },
          },
          select: {
            type: true,
            amount: true,
          },
        }),
        prisma.transaction.findMany({
          where,
          select: {
            type: true,
            amount: true,
          },
        }),
        prisma.transaction.count({
          where: {
            property: {
              ownerId: userId,
            },
            status: TransactionStatus.PENDING,
            ...(input.propertyId && { propertyId: input.propertyId }),
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

      return {
        thisMonth: calculateTotals(thisMonthTransactions),
        thisYear: calculateTotals(thisYearTransactions),
        allTime: calculateTotals(allTimeTransactions),
        pendingTransactions: pendingCount,
      }
    }),

  // Bulk import transactions from CSV data
  bulkImport: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().cuid(),
        transactions: z.array(
          z.object({
            type: z.enum(['INCOME', 'EXPENSE']),
            category: z.string(),
            amount: z.number().positive(),
            date: z.string(), // Will be parsed to date
            description: z.string(),
            reference: z.string().optional(),
            paymentMethod: z.string().optional(),
          })
        ),
      })
    )
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

      const created = await prisma.transaction.createMany({
        data: input.transactions.map((t) => ({
          propertyId: input.propertyId,
          type: t.type as TransactionType,
          category: t.category,
          amount: t.amount,
          date: new Date(t.date),
          description: t.description,
          reference: t.reference,
          paymentMethod: t.paymentMethod,
          status: TransactionStatus.COMPLETED,
          taxDeductible: false,
        })),
      })

      return {
        success: true,
        count: created.count,
      }
    }),
})
