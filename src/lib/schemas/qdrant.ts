import { z } from 'zod';

export const searchCodeGetSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().int().positive().default(5),
});
