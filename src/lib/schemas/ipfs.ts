import { z } from 'zod';

export const ipfsUploadPostSchema = z.object({
  file: z.any(), // File object, validation will be done manually for now
  metadata: z.object({
    title: z.string().min(1),
    artist: z.string().min(1),
    genre: z.string().min(1),
    duration: z.number().positive(),
    releaseDate: z.string().datetime(),
    isExplicit: z.boolean().default(false),
  }).passthrough(), // Allow other fields in metadata
});

export const ipfsUploadGetSchema = z.object({
  cid: z.string().min(1),
});

export const ipfsMonitorGetSchema = z.object({
  cid: z.string().min(1),
  action: z.enum(['health', 'download']).optional(),
});
