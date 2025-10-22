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

export const trackContributionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  message: z.string().max(500).optional(),
})

export const trackProgressSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
})

export const trackQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().max(100).optional(),
  genre: z.string().max(30).optional(),
  artistId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'playCount', 'likeCount', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const trackStreamQuerySchema = z.object({
  id: z.string().uuid(),
});

export const trackStreamPostSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  duration: z.number().int().optional(),
  completed: z.boolean().optional(),
  position: z.number().int().optional(),
});

// ============================================
// NFT SCHEMAS
// ============================================

export const nftSchema = z.object({
  tokenId: z.string().min(1, 'Token ID is required'),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  metadata: z.record(z.unknown()).optional(),
  price: z.number().min(0).optional(),
  trackId: z.string().uuid().optional(),
})

export const nftMintSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  trackId: z.string().uuid(),
  price: z.number().min(0).optional(),
})

export const nftUpdateSchema = nftSchema.partial();

export const nftBurnSchema = z.object({
  nftId: z.string().uuid(),
  ownerAddress: z.string().regex(/^[A-Za-z0-9]{32,44}$/, 'Invalid wallet address'),
  quantity: z.number().int().positive().default(1),
});

export const nftTransferSchema = z.object({
  nftId: z.string().uuid(),
  fromAddress: z.string().regex(/^[A-Za-z0-9]{32,44}$/, 'Invalid wallet address'),
  toAddress: z.string().regex(/^[A-Za-z0-9]{32,44}$/, 'Invalid wallet address'),
  quantity: z.number().int().positive().default(1),
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

export const userRoleSchema = z.object({
  role: z.enum(["LISTENER", "ARTIST", "CURATOR", "ADMIN"]),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().max(100).optional(),
  artist: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
});

// ============================================
// WALLET SCHEMAS
// ============================================

export const walletAddressSchema = z.string()
  .regex(/^[A-Za-z0-9]{32,44}$/, 'Invalid Solana wallet address')

export const tonWalletAddressSchema = z.string()
  .regex(/^[A-Za-z0-9_-]{48}$/, 'Invalid TON wallet address')

export const signatureSchema = z.object({
  message: z.string().min(1),
  signature: z.string().min(1),
  publicKey: walletAddressSchema,
})

// ============================================
// PAYMENT SCHEMAS
// ============================================

export const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['SOL', 'TON', 'NDT', 'USD']),
  description: z.string().max(200).optional(),
})

export const donationSchema = z.object({
  memorialId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['TON', 'SOL']).default('TON'),
  message: z.string().max(500).optional(),
  isAnonymous: z.boolean().default(false),
})

// ============================================
// TELEGRAM SCHEMAS
// ============================================

export * from './telegram';

// ============================================
// PLAYLIST SCHEMAS
// ============================================

export const playlistSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
  coverImage: z.string().url().optional(),
})

export const playlistUpdateSchema = playlistSchema.partial()

export const addTrackToPlaylistSchema = z.object({
  playlistId: z.string().uuid(),
  trackId: z.string().uuid(),
  position: z.number().int().nonnegative().optional(),
})

// ============================================
// STAKING SCHEMAS
// ============================================

export const stakeSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  tokenId: z.string().uuid(),
  duration: z.number().int().positive().optional(), // in days
})

export const unstakeSchema = z.object({
  stakeId: z.string().uuid(),
})

// ============================================
// CLUB SCHEMAS
// ============================================

export const clubSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000),
  price: z.number().positive('Price must be positive'),
  maxMembers: z.number().int().positive().max(1000).default(100),
  imageUrl: z.string().url().optional(),
})

export const joinClubSchema = z.object({
  clubId: z.string().uuid(),
  paymentAmount: z.number().positive(),
})

export const leaveClubSchema = z.object({
  // No body needed - uses session user
})

// ============================================
// CHAT SCHEMAS
// ============================================

export const chatMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  chatType: z.enum(['genre', 'club', 'country']),
  metadata: z.record(z.unknown()).optional(),
})

export const chatVoteSchema = z.object({
  messageId: z.string().uuid(),
  voteType: z.enum(['approve', 'reject', 'boost', 'fund']),
})

export const chatReportSchema = z.object({
  messageId: z.string().uuid(),
  reason: z.string().min(10, 'Reason too short').max(500, 'Reason too long'),
})

// ============================================
// ANTI-PIRATE / PLAYBACK SCHEMAS
// ============================================

export const playbackStartSchema = z.object({
  trackId: z.string().uuid('Invalid track ID'),
  deviceId: z.string().min(1, 'Device ID required'),
  walletAddress: z.string().regex(/^[A-Za-z0-9]{32,44}$/, 'Invalid wallet address'),
  isBackground: z.boolean().optional(),
  isOffline: z.boolean().optional(),
})

export const playbackPauseSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  pausedTime: z.number().positive('Invalid pause time'),
  reason: z.string().max(100).optional(),
})

// ============================================
// DEX SCHEMAS
// ============================================

export * from './dex';

// ============================================
// IPFS SCHEMAS
// ============================================

export * from './ipfs';

// ============================================
// SOLANA SCHEMAS
// ============================================

export * from './solana';

// ============================================
// FILECOIN SCHEMAS
// ============================================

export * from './filecoin';

// ============================================
// REDUNDANCY SCHEMAS
// ============================================

export * from './redundancy';

// ============================================
// CLUB SCHEMAS
// ============================================

export * from './club';

// ============================================
// ANALYTICS SCHEMAS
// ============================================

export * from './analytics';

// ============================================
// NOTIFICATIONS SCHEMAS
// ============================================

export * from './notifications';
export * from './notificationSettings';

// ============================================
// MESSAGES SCHEMAS
// ============================================

export * from './messages';


export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; details?: z.ZodError }

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
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      
      return {
        success: false,
        error: errorMessage,
        details: error,
      }
    }
    
    return {
      success: false,
      error: 'Validation failed',
    }
  }
}

// Export types for TypeScript
export type TrackInput = z.infer<typeof trackSchema>
export type TrackUpdate = z.infer<typeof trackUpdateSchema>
export type TrackQuery = z.infer<typeof trackQuerySchema>
export type NFTInput = z.infer<typeof nftSchema>
export type NFTMint = z.infer<typeof nftMintSchema>
export type UserInput = z.infer<typeof userSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>
export type PaymentInput = z.infer<typeof paymentSchema>
export type DonationInput = z.infer<typeof donationSchema>
export type TelegramUser = z.infer<typeof telegramUserSchema>
export type PlaylistInput = z.infer<typeof playlistSchema>
export type StakeInput = z.infer<typeof stakeSchema>
export type ClubInput = z.infer<typeof clubSchema>
export type ChatMessageInput = z.infer<typeof chatMessageSchema>
export type SwapInput = z.infer<typeof swapSchema>
export type LiquidityInput = z.infer<typeof liquiditySchema>
