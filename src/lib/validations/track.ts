import { z } from 'zod';
import {
  idSchema,
  ipfsCidSchema,
  priceSchema,
  trackStatusSchema,
  paginationSchema,
  metadataSchema,
} from './common';

/**
 * Track validation schemas
 */

// Track metadata
export const trackMetadataSchema = z.object({
  bpm: z.number().int().positive().optional(),
  key: z.string().optional(),
  albumArt: z.string().url().optional(),
  description: z.string().max(1000).optional(),
  releaseDate: z.string().datetime().optional(),
  fileSize: z.number().positive().optional(),
  mimeType: z.string().optional(),
  bitrate: z.number().positive().optional(),
  year: z.union([z.string(), z.number()]).optional(),
  label: z.string().optional(),
});

export type TrackMetadata = z.infer<typeof trackMetadataSchema>;

// Create track
export const createTrackSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  artistName: z.string().min(1, 'Artist name is required').max(100),
  genre: z.string().min(1, 'Genre is required').max(50),
  duration: z.number().int().positive('Duration must be positive'),
  ipfsHash: ipfsCidSchema,
  metadata: trackMetadataSchema.optional(),
  price: priceSchema.optional(),
  isExplicit: z.boolean().default(false),
  isPublished: z.boolean().default(false),
});

export type CreateTrackInput = z.infer<typeof createTrackSchema>;

// Update track
export const updateTrackSchema = createTrackSchema.partial().extend({
  id: idSchema,
});

export type UpdateTrackInput = z.infer<typeof updateTrackSchema>;

// Get track
export const getTrackSchema = z.object({
  id: idSchema,
});

export type GetTrackInput = z.infer<typeof getTrackSchema>;

// List tracks
export const listTracksSchema = paginationSchema.extend({
  genre: z.string().optional(),
  artistId: idSchema.optional(),
  isPublished: z.coerce.boolean().optional(),
  status: trackStatusSchema.optional(),
  search: z.string().optional(),
  minPrice: priceSchema.optional(),
  maxPrice: priceSchema.optional(),
});

export type ListTracksInput = z.infer<typeof listTracksSchema>;

// Delete track
export const deleteTrackSchema = z.object({
  id: idSchema,
});

export type DeleteTrackInput = z.infer<typeof deleteTrackSchema>;

// Track upload
export const trackUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 100 * 1024 * 1024,
    'File size must be less than 100MB'
  ).refine(
    (file) => [
      'audio/mpeg',
      'audio/wav',
      'audio/flac',
      'audio/aac',
      'audio/ogg',
    ].includes(file.type),
    'Invalid audio file type'
  ),
  metadata: trackMetadataSchema,
});

export type TrackUploadInput = z.infer<typeof trackUploadSchema>;

// Track progress contribution
export const trackProgressContributionSchema = z.object({
  trackId: idSchema,
  amount: z.number().positive('Amount must be positive'),
});

export type TrackProgressContributionInput = z.infer<typeof trackProgressContributionSchema>;

// Track like/unlike
export const trackLikeSchema = z.object({
  trackId: idSchema,
});

export type TrackLikeInput = z.infer<typeof trackLikeSchema>;

// Track comment
export const trackCommentSchema = z.object({
  trackId: idSchema,
  content: z.string().min(1, 'Comment cannot be empty').max(500),
});

export type TrackCommentInput = z.infer<typeof trackCommentSchema>;

// Track play
export const trackPlaySchema = z.object({
  trackId: idSchema,
  duration: z.number().int().nonnegative(),
  completed: z.boolean().default(false),
});

export type TrackPlayInput = z.infer<typeof trackPlaySchema>;