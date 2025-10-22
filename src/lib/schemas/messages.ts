import { z } from 'zod';

export const messageSchema = z.object({
  senderId: z.string().uuid(),
  recipientId: z.string().uuid(),
  content: z.string().min(1),
});

export const messageQuerySchema = z.object({
  userId: z.string().uuid(),
  otherUserId: z.string().uuid(),
  limit: z.coerce.number().int().positive().default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});
