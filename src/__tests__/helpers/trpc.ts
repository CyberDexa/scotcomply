import { type Session } from 'next-auth'
import { type PrismaClient } from '@prisma/client'
import { mockDeep, type DeepMockProxy } from 'jest-mock-extended'

export type MockContext = {
  session: Session | null
  prisma: DeepMockProxy<PrismaClient>
}

export const createMockContext = (session?: Session | null): MockContext => {
  return {
    session: session ?? null,
    prisma: mockDeep<PrismaClient>(),
  }
}

export const createMockSession = (overrides?: Partial<Session>): Session => {
  return {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'LANDLORD',
      ...overrides?.user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  }
}
