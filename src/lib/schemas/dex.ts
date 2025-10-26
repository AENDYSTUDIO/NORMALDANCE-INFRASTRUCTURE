import { z } from 'zod';

export const dexSwapPostSchema = z.object({
  from: z.enum(['TON', 'NDT']),
  to: z.enum(['TON', 'NDT']),
  amount: z.number().positive(),
  slippage: z.number().min(0).max(50).default(0.5),
});

export const dexSwapGetSchema = z.object({
  limit: z.coerce.number().int().positive().default(10),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const dexLiquidityPostSchema = z.object({
  tonAmount: z.number().positive().optional(),
  ndtAmount: z.number().positive().optional(),
});

export const dexLiquidityDeleteSchema = z.object({
  lpTokens: z.number().positive(),
});

export const dexSmartOrdersPostSchema = z.object({
  type: z.string(), // TODO: make enum
  from: z.enum(['TON', 'NDT']),
  to: z.enum(['TON', 'NDT']),
  amount: z.number().positive(),
  targetRate: z.number().positive(),
  triggerCondition: z.string(), // TODO: make enum
  executionType: z.string(), // TODO: make enum
  timeDecay: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
  aiOptimization: z.object({
    enabled: z.boolean().default(true),
    riskTolerance: z.enum(['low', 'medium', 'high']).default('medium'),
    marketAnalysis: z.boolean().default(true),
    gasOptimization: z.boolean().default(true),
    slippageProtection: z.boolean().default(true),
    dynamicAdjustment: z.boolean().default(true),
  }).optional(),
});

export const dexSmartOrdersGetSchema = z.object({
  status: z.string().optional(), // TODO: make enum
  type: z.string().optional(), // TODO: make enum
});

export const dexSmartOrdersDeleteSchema = z.object({
  orderId: z.string().uuid(),
});

export const dexAdvancedSwapPostSchema = z.object({
  from: z.enum(['TON', 'NDT']),
  to: z.enum(['TON', 'NDT']),
  amount: z.number().positive(),
  slippage: z.number().min(0).max(50).default(0.5),
  maxPriceImpact: z.number().min(0).max(100).default(5),
  useAdvancedAMM: z.boolean().default(true),
  enableVolatilityProtection: z.boolean().default(true),
});
