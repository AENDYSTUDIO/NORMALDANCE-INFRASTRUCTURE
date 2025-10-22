import { z } from 'zod';

export const clubJoinPostSchema = z.object({
  // No body needed for now, as club ID is from params and payment is handled internally
  // If payment amount is to be specified by user, add it here:
  // paymentAmount: z.number().positive('Payment amount must be positive').optional(),
});

export const clubLeavePostSchema = z.object({
  // No body needed - uses session user
});
