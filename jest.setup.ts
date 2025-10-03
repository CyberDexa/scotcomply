import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { src, alt, ...rest } = props
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return Object.assign(document.createElement('img'), { src, alt, ...rest })
  },
}))

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret-key-with-minimum-32-characters-required'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.R2_ACCOUNT_ID = 'test-account-id'
process.env.R2_ACCESS_KEY_ID = 'test-access-key'
process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key'
process.env.R2_BUCKET_NAME = 'test-bucket'
process.env.EMAIL_FROM = 'test@example.com'
process.env.SMTP_HOST = 'smtp.test.com'
process.env.SMTP_PORT = '587'
process.env.SMTP_USER = 'test'
process.env.SMTP_PASSWORD = 'test'

// Suppress console errors in tests (optional)
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
