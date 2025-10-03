import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),

  // Email (optional for development)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email(),

  // Cron Jobs
  CRON_SECRET: z.string().optional(),

  // SMS (optional for development)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // File Storage - Cloudflare R2 (optional for development)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().default('scotcomply-documents'),
  R2_PUBLIC_URL: z.string().optional(),

  // AML Screening (optional for development)
  COMPLY_ADVANTAGE_API_KEY: z.string().optional(),
  COMPLY_ADVANTAGE_FUZZINESS: z.string().default('0.8'),

  // App Settings
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().default('ScotComply'),
  APP_URL: z.string().url(),
})

// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables')
}

// Export typed environment variables
export const env = parsed.data

// Type-safe environment access
declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
