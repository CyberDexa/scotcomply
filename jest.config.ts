import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/lib/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/lib/trpc.ts',
    '!src/lib/trpc-client.tsx',
    '!src/lib/prisma.ts',
    '!src/lib/auth.ts',
    '!src/lib/email-service.ts',
    '!src/lib/notification-service.ts',
    '!src/lib/env.ts',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/e2e/',
    '<rootDir>/src/__tests__/helpers/',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(jose|openid-client|uuid|@panva)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)
