import { z } from 'zod';

export const redundancyPostSchema = z.object({
  action: z.enum(['add-node', 'remove-node', 'replicate-file', 'check-all-nodes-health']),
  nodeId: z.string().optional(),
  sourceCid: z.string().min(1).optional(),
  options: z.object({
    type: z.enum(['ipfs', 'filecoin', 'arweave', 'custom']).optional(),
    endpoint: z.string().url().optional(),
    apiKey: z.string().optional(),
    minReplicas: z.number().int().min(1).optional(),
    forceReplication: z.boolean().optional(),
  }).optional(),
}).superRefine((data, ctx) => {
  if (data.action === 'add-node' && !data.nodeId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'nodeId is required for add-node action',
      path: ['nodeId'],
    });
  }
  if (data.action === 'remove-node' && !data.nodeId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'nodeId is required for remove-node action',
      path: ['nodeId'],
    });
  }
  if (data.action === 'replicate-file' && !data.sourceCid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'sourceCid is required for replicate-file action',
      path: ['sourceCid'],
    });
  }
});

export const redundancyGetSchema = z.object({
  action: z.enum(['get-all-nodes', 'get-available-nodes', 'get-statistics', 'check-node-health', 'get-file-replicas', 'get-replication-status', 'get-active-jobs']),
  nodeId: z.string().optional(),
  sourceCid: z.string().optional(),
  jobId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.action === 'check-node-health' && !data.nodeId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'nodeId is required for check-node-health action',
      path: ['nodeId'],
    });
  }
  if (data.action === 'get-file-replicas' && !data.sourceCid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'sourceCid is required for get-file-replicas action',
      path: ['sourceCid'],
    });
  }
  if (data.action === 'get-replication-status' && !data.jobId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'jobId is required for get-replication-status action',
      path: ['jobId'],
    });
  }
});

export const redundancyDeleteSchema = z.object({
  action: z.enum(['remove-node']),
  nodeId: z.string(),
});
