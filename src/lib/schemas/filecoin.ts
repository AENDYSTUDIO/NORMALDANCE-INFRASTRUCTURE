import { z } from 'zod';

export const filecoinPostSchema = z.object({
  action: z.enum(['create-deal', 'calculate-cost', 'check-availability']),
  ipfsCid: z.string().min(1).optional(),
  options: z.object({
    duration: z.number().int().positive().optional(),
    replicationFactor: z.number().int().min(1).optional(),
    renew: z.boolean().optional(),
    sizeInBytes: z.number().int().positive().optional(),
    durationInDays: z.number().int().positive().optional(),
  }).optional(),
}).superRefine((data, ctx) => {
  if (data.action === 'create-deal' && !data.ipfsCid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ipfsCid is required for create-deal action',
      path: ['ipfsCid'],
    });
  }
  if (data.action === 'calculate-cost') {
    if (!data.options?.sizeInBytes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'sizeInBytes is required for calculate-cost action',
        path: ['options', 'sizeInBytes'],
      });
    }
    if (!data.options?.durationInDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'durationInDays is required for calculate-cost action',
        path: ['options', 'durationInDays'],
      });
    }
  }
  if (data.action === 'check-availability' && !data.ipfsCid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ipfsCid is required for check-availability action',
      path: ['ipfsCid'],
    });
  }
});

export const filecoinGetSchema = z.object({
  dealId: z.string().optional(),
  ipfsCid: z.string().optional(),
});

export const filecoinDeleteSchema = z.object({
  dealId: z.string(),
});