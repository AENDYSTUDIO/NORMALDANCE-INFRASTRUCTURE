import { z } from 'zod';

export const solanaWebhookPostSchema = z.object({
  transaction: z.string(),
  status: z.enum(['success', 'failed']),
  signature: z.string(),
  timestamp: z.number(),
  // Add other fields as needed based on Solana webhook payload
});
