import { z } from 'zod';

export const stripeWebhookPostSchema = z.object({
  id: z.string(),
  object: z.literal('event'),
  api_version: z.string().optional(),
  created: z.number(),
  data: z.object({
    object: z.record(z.any()),
  }),
  livemode: z.boolean(),
  pending_webhooks: z.number(),
  request: z.object({
    id: z.string().optional(),
    idempotency_key: z.string().optional(),
  }).optional(),
  type: z.string(),
});
