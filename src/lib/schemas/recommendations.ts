import { z } from 'zod';

export const recommendationsGetSchema = z.object({
  userId: z.string().uuid(),
  limit: z.coerce.number().int().positive().default(10),
  type: z.enum(['track', 'artist', 'playlist', 'nft']).optional(),
});

export const recommendationsPostSchema = z.object({
  userId: z.string().uuid(),
  count: z.number().int().positive().default(10),
  type: z.enum(['personal', 'trending', 'discovery', 'social', 'all']).default('all'),
  filters: z.object({
    genre: z.array(z.string()).optional(),
    artist: z.array(z.string()).optional(),
    minRating: z.number().min(0).max(5).optional(),
    minDuration: z.number().int().positive().optional(),
    maxDuration: z.number().int().positive().optional(),
  }).optional(),
  exclude: z.object({
    liked: z.boolean().optional(),
    skipped: z.boolean().optional(),
  }).optional(),
});
