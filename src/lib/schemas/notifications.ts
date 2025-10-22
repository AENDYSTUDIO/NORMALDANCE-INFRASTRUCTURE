import { z } from 'zod';

export const notificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['LIKE', 'COMMENT', 'FOLLOW', 'REWARD', 'SYSTEM']),
  message: z.string().min(1),
  url: z.string().url().optional(),
});

export const notificationQuerySchema = z.object({
  userId: z.string().uuid(),
  limit: z.coerce.number().int().positive().default(10),
  offset: z.coerce.number().int().nonnegative().default(0),
  unreadOnly: z.enum(['true', 'false']).default('false').transform(val => val === 'true'),
});
