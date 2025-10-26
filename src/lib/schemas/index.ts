/**
 * Centralized Zod Schemas for API Validation
 * All API endpoints should use these schemas for input validation
 */

import { z } from 'zod'

// ============================================
// TRACK SCHEMAS
// ============================================

export const trackSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  artistName: z.string().min(1, 'Artist name is required').max(50, 'Artist name too long'),
  genre: z.string().min(1, 'Genre is required').max(30, 'Genre too long'),
  duration: z.number().int().positive('Duration must be positive'),
  ipfsHash: z.string().min(1, 'IPFS hash is required').regex(/^Qm[a-zA-Z0-9]{44}$/, 'Invalid IPFS hash'),
  metadata: z.record(z.unknown()).optional(),
  price: z.number().min(0, 'Price cannot be negative').optional(),
  isExplicit: z.boolean().default(false),
  isPublished: z.boolean().default(false),
})

export const trackUpdateSchema = trackSchema.partial()

export const trackQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().max(100).optional(),
  genre: z.string().max(30).optional(),
  artistId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'playCount', 'likeCount', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// ============================================
// USER SCHEMAS
// ============================================

export const userSchema = z.object({
  email: z.string().email('Invalid email'),
  username: z.string().min(3, 'Username too short').max(30, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, _ and -'),
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  wallet: z.string().regex(/^[A-Za-z0-9]{32,44}$/, 'Invalid wallet address').optional(),
})

export const userUpdateSchema = userSchema.partial()

// ============================================
// PAYMENT SCHEMAS
// ============================================

export const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['SOL', 'TON', 'NDT', 'USD"]),
})

// ============================================
// VALIDATION HELPERS
// ============================================

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; details?: z.ZodError }
}

export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}"
      ).join(', ')
      
      return {
        success: false,
        error: errorMessage,
        details: error,
    }
  }
}

// Export types for TypeScript
export type TrackInput = z.infer<typeof trackSchema>
export type TrackUpdate = z.infer<typeof trackUpdateSchema>
export type UserInput = z.infer<typeof userSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>
export type PaymentInput = z.infer<typeof paymentSchema>
