import { initTRPC, TRPCError } from '@trpc/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import prisma from './prisma'
import superjson from 'superjson'

export const createTRPCContext = async () => {
  const session = await getServerSession(authOptions)

  return {
    session,
    prisma,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape
  },
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
      prisma: ctx.prisma,
    },
  })
})

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user || ctx.session.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
      prisma: ctx.prisma,
    },
  })
})
