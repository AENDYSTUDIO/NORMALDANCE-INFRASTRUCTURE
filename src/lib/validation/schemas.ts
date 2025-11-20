// Input validation schemas for NORMAL DANCE API
// Uses Zod for runtime type validation and sanitization

import { z } from "zod";

// Common validation patterns
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .max(254, "Email too long")
  .transform((email) => email.toLowerCase().trim());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain uppercase, lowercase, and number"
  );

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username too long")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, underscores, and hyphens"
  );

export const walletAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format");

export const solanaAddressSchema = z
  .string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana address format");

// User registration schema
export const userRegistrationSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  walletAddress: walletAddressSchema.optional(),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, "Terms must be accepted"),
});

// User login schema
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password required"),
});

// Track upload schema
export const trackUploadSchema = z.object({
  title: z
    .string()
    .min(1, "Title required")
    .max(100, "Title too long")
    .transform((title) => title.trim()),
  artistName: z
    .string()
    .min(1, "Artist name required")
    .max(100, "Artist name too long")
    .transform((name) => name.trim()),
  genre: z.string().min(1, "Genre required").max(50, "Genre too long"),
  description: z
    .string()
    .max(1000, "Description too long")
    .optional()
    .transform((desc) => desc?.trim() || ""),
  isExplicit: z.boolean().default(false),
  price: z
    .number()
    .min(0, "Price cannot be negative")
    .max(1000, "Price too high")
    .optional(),
  tags: z.array(z.string().max(50)).max(10, "Too many tags").optional(),
});

// NFT minting schema
export const nftMintSchema = z.object({
  trackId: z.string().uuid("Invalid track ID"),
  title: z.string().min(1, "Title required").max(100, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  royalties: z
    .number()
    .min(0, "Royalties cannot be negative")
    .max(50, "Royalties too high (max 50%)")
    .default(5),
  attributes: z
    .array(
      z.object({
        trait_type: z.string().max(50),
        value: z.string().max(100),
      })
    )
    .max(20, "Too many attributes")
    .optional(),
});

// Playlist creation schema
export const playlistCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Name required")
    .max(100, "Name too long")
    .transform((name) => name.trim()),
  description: z
    .string()
    .max(500, "Description too long")
    .optional()
    .transform((desc) => desc?.trim() || ""),
  isPublic: z.boolean().default(true),
});

// Comment schema
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment too long")
    .transform((content) => content.trim()),
  trackId: z.string().uuid("Invalid track ID"),
});

// Donation schema
export const donationSchema = z.object({
  tokenId: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid token ID"),
  amount: z
    .number()
    .min(0.001, "Minimum donation 0.001 ETH")
    .max(100, "Maximum donation 100 ETH"),
  message: z
    .string()
    .max(500, "Message too long")
    .optional()
    .transform((msg) => msg?.trim() || ""),
});

// Search schema
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, "Search query required")
    .max(100, "Query too long")
    .transform((query) => query.trim()),
  type: z.enum(["tracks", "artists", "playlists", "all"]).default("all"),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// File upload schema
export const fileUploadSchema = z.object({
  file: z.any(), // File validation handled separately
  type: z.enum(["audio", "image", "document"]),
  maxSize: z.number().optional(), // In bytes
});

// API response schemas
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    pagination: z
      .object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
      })
      .optional(),
  });

// Error response schema
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
});

// Success response schema
export const successResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

// Type exports
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type TrackUpload = z.infer<typeof trackUploadSchema>;
export type NftMint = z.infer<typeof nftMintSchema>;
export type PlaylistCreate = z.infer<typeof playlistCreateSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type Donation = z.infer<typeof donationSchema>;
export type SearchQuery = z.infer<typeof searchSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
