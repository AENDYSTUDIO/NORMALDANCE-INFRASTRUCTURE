import { z } from 'zod';
import {
  idSchema,
  emailSchema,
  usernameSchema,
  passwordSchema,
  walletAddressSchema,
  userRoleSchema,
  userLevelSchema,
  paginationSchema,
} from './common';

/**
 * User validation schemas
 */

// Register user
export const registerUserSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  displayName: z.string().min(1).max(100).optional(),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;

// Login user
export const loginUserSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginUserInput = z.infer<typeof loginUserSchema>;

// Update user profile
export const updateUserProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  banner: z.string().url().optional(),
  isArtist: z.boolean().optional(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

// Connect wallet
export const connectWalletSchema = z.object({
  walletAddress: walletAddressSchema,
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required'),
});

export type ConnectWalletInput = z.infer<typeof connectWalletSchema>;

// Get user
export const getUserSchema = z.object({
  id: idSchema.optional(),
  username: usernameSchema.optional(),
  email: emailSchema.optional(),
}).refine((data) => data.id || data.username || data.email, {
  message: 'At least one of id, username, or email must be provided',
});

export type GetUserInput = z.infer<typeof getUserSchema>;

// List users
export const listUsersSchema = paginationSchema.extend({
  role: userRoleSchema.optional(),
  level: userLevelSchema.optional(),
  isArtist: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export type ListUsersInput = z.infer<typeof listUsersSchema>;

// Follow user
export const followUserSchema = z.object({
  userId: idSchema,
});

export type FollowUserInput = z.infer<typeof followUserSchema>;

// Update user balance
export const updateUserBalanceSchema = z.object({
  userId: idSchema,
  currency: z.enum(['NDT', 'TON']),
  amount: z.number(),
  operation: z.enum(['set', 'add', 'subtract']),
  reason: z.string().min(1, 'Reason is required'),
});

export type UpdateUserBalanceInput = z.infer<typeof updateUserBalanceSchema>;

// User statistics
export const getUserStatsSchema = z.object({
  userId: idSchema,
  period: z.enum(['day', 'week', 'month', 'year', 'all']).default('all'),
});

export type GetUserStatsInput = z.infer<typeof getUserStatsSchema>;