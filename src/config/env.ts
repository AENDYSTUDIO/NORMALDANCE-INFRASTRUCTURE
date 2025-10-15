/**
 * Environment Variables Validation
 * Validates all required environment variables at application startup
 * Provides type-safe access to env vars throughout the application
 */

import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

// Environment schema with validation
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  
  // Solana
  NEXT_PUBLIC_SOLANA_RPC_URL: z.string().url('SOLANA_RPC_URL must be a valid URL'),
  SOLANA_RPC_TIMEOUT: z.coerce.number().positive().default(8000),
  
  // Solana Program IDs (optional in development)
  NEXT_PUBLIC_NDT_PROGRAM_ID: z.string().optional(),
  NEXT_PUBLIC_NDT_MINT_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_TRACKNFT_PROGRAM_ID: z.string().optional(),
  NEXT_PUBLIC_STAKING_PROGRAM_ID: z.string().optional(),
  
  // IPFS
  NEXT_PUBLIC_IPFS_GATEWAY: z.string().url().default('https://ipfs.io'),
  PINATA_JWT: z.string().optional(),
  PINATA_API_KEY: z.string().optional(),
  PINATA_SECRET_KEY: z.string().optional(),
  IPFS_BACKEND: z.enum(['helia', 'legacy']).default('helia'),
  
  // Redis (optional in development)
  REDIS_URL: z.string().optional(),
  
  // Sentry (optional)
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  
  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEB_APP_URL: z.string().url().optional(),
  TELEGRAM_WEBHOOK_URL: z.string().url().optional(),
  
  // OAuth (optional)
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),
  
  // AI/ML (optional)
  OPENAI_API_KEY: z.string().optional(),
  LANGGRAPH_API_KEY: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  
  // Upstash (optional)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Analytics (optional)
  MIXPANEL_TOKEN: z.string().optional(),
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: z.string().optional(),
  
  // Logging
  DISABLE_LOGGING: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
})

// Infer TypeScript type from schema
export type Env = z.infer<typeof envSchema>

// Validate environment variables
function validateEnv(): Env {
  try {
    const parsed = envSchema.parse(process.env)
    
    // Additional production checks
    if (parsed.NODE_ENV === 'production') {
      const productionRequired = [
        'NEXTAUTH_SECRET',
        'DATABASE_URL',
        'NEXT_PUBLIC_SOLANA_RPC_URL',
      ]
      
      const missing = productionRequired.filter(key => !process.env[key])
      
      if (missing.length > 0) {
        throw new Error(
          `Missing required environment variables for production: ${missing.join(', ')}`
        )
      }
      
      // Warn about missing optional but recommended vars
      const recommended = [
        'SENTRY_DSN',
        'REDIS_URL',
        'PINATA_JWT',
      ]
      
      const missingRecommended = recommended.filter(key => !process.env[key])
      
      if (missingRecommended.length > 0) {
        logger.warn(
          'Missing recommended environment variables for production',
          { missing: missingRecommended }
        )
      }
    }
    
    logger.info('Environment variables validated successfully', {
      nodeEnv: parsed.NODE_ENV,
      hasDatabase: !!parsed.DATABASE_URL,
      hasSentry: !!parsed.SENTRY_DSN,
      hasRedis: !!parsed.REDIS_URL,
    })
    
    return parsed
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => {
        return `${err.path.join('.')}: ${err.message}`
      }).join('\n')
      
      logger.error('Environment validation failed', error, {
        errors: errorMessages
      })
      
      console.error('❌ Environment Validation Errors:\n', errorMessages)
      
      // In development, continue with warnings
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Continuing in development mode despite validation errors')
        return envSchema.parse({
          ...process.env,
          // Provide safe defaults for development
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-secret-min-32-characters-long!',
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        })
      }
      
      // In production, fail fast
      throw new Error('Invalid environment variables. Check logs for details.')
    }
    
    throw error
  }
}

// Export validated environment
export const env = validateEnv()

// Helper function to check if a variable exists
export function hasEnvVar(key: keyof Env): boolean {
  return env[key] !== undefined && env[key] !== null && env[key] !== ''
}

// Helper to get env var with fallback
export function getEnvVar<T extends keyof Env>(
  key: T,
  fallback: Env[T]
): NonNullable<Env[T]> {
  return (env[key] ?? fallback) as NonNullable<Env[T]>
}
