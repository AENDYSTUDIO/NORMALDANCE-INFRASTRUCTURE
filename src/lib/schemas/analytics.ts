import { z } from 'zod';

// No specific query params for the main dashboard, but schema is here for consistency
export const analyticsDashboardGetSchema = z.object({});

// Schema for the music analytics endpoint
export const musicAnalyticsGetSchema = z.object({
  timeframe: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  limit: z.coerce.number().int().positive().max(50).default(10),
});