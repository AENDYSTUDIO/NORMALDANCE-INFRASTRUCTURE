import { z } from 'zod';

/**
 * Common validation schemas used across the application
 */

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ID validation
export const idSchema = z.string().min(1, 'ID is required');

export const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid CUID format');

// Wallet address
export const solanaAddressSchema = z
  .string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana address');

export const tonAddressSchema = z
  .string()
  .regex(/^[UEk][Qf][a-zA-Z0-9_-]{46}$/, 'Invalid TON address');

export const walletAddressSchema = z.union([
  solanaAddressSchema,
  tonAddressSchema,
]);

// IPFS CID
export const ipfsCidSchema = z
  .string()
  .regex(/^Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}/, 'Invalid IPFS CID');

// URL validation
export const urlSchema = z.string().url('Invalid URL format');

export const httpUrlSchema = z
  .string()
  .url()
  .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
    message: 'URL must start with http:// or https://',
  });

// Email validation
export const emailSchema = z.string().email('Invalid email format');

// Username validation
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Date validation
export const dateSchema = z.coerce.date();

export const dateRangeSchema = z.object({
  from: dateSchema,
  to: dateSchema,
}).refine((data) => data.from <= data.to, {
  message: 'Start date must be before end date',
  path: ['from'],
});

// Amount validation (for tokens)
export const tokenAmountSchema = z
  .number()
  .positive('Amount must be positive')
  .finite('Amount must be finite');

export const priceSchema = z
  .number()
  .nonnegative('Price must be non-negative')
  .finite('Price must be finite');

// Search query
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
  filters: z.record(z.string()).optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

// File validation
export const fileTypeSchema = z.enum([
  'audio/mpeg',
  'audio/wav',
  'audio/flac',
  'audio/aac',
  'audio/ogg',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const fileSizeSchema = z
  .number()
  .positive()
  .max(100 * 1024 * 1024, 'File size must be less than 100MB');

// Metadata validation
export const metadataSchema = z.record(z.unknown()).optional();

// Status enums
export const trackStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const nftStatusSchema = z.enum(['LISTED', 'SOLD', 'MINTED', 'TRANSFERRED']);
export const userRoleSchema = z.enum(['LISTENER', 'ARTIST', 'CURATOR', 'ADMIN']);
export const userLevelSchema = z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']);