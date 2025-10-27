import { z } from 'zod';
import {
  idSchema,
  priceSchema,
  nftStatusSchema,
  paginationSchema,
  metadataSchema,
} from './common';

/**
 * NFT validation schemas
 */

// NFT metadata
export const nftMetadataSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  image: z.string().url(),
  external_url: z.string().url().optional(),
  attributes: z.array(
    z.object({
      trait_type: z.string(),
      value: z.union([z.string(), z.number()]),
    })
  ).optional(),
  properties: z.record(z.unknown()).optional(),
});

export type NFTMetadata = z.infer<typeof nftMetadataSchema>;

// Create NFT
export const createNFTSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  metadata: nftMetadataSchema,
  price: priceSchema.optional(),
  trackId: idSchema.optional(),
  type: z.enum(['TRACK', 'ALBUM', 'PLAYLIST', 'ARTIST']).default('TRACK'),
});

export type CreateNFTInput = z.infer<typeof createNFTSchema>;

// Mint NFT
export const mintNFTSchema = z.object({
  nftId: idSchema,
  walletAddress: z.string().min(1, 'Wallet address is required'),
});

export type MintNFTInput = z.infer<typeof mintNFTSchema>;

// Transfer NFT
export const transferNFTSchema = z.object({
  nftId: idSchema,
  tokenId: z.string().min(1, 'Token ID is required'),
  fromAddress: z.string().min(1, 'From address is required'),
  toAddress: z.string().min(1, 'To address is required'),
  signature: z.string().min(1, 'Signature is required'),
});

export type TransferNFTInput = z.infer<typeof transferNFTSchema>;

// Purchase NFT
export const purchaseNFTSchema = z.object({
  nftId: idSchema,
  buyerAddress: z.string().min(1, 'Buyer address is required'),
  price: priceSchema,
  transactionHash: z.string().min(1, 'Transaction hash is required'),
});

export type PurchaseNFTInput = z.infer<typeof purchaseNFTSchema>;

// List NFTs
export const listNFTsSchema = paginationSchema.extend({
  ownerId: idSchema.optional(),
  trackId: idSchema.optional(),
  status: nftStatusSchema.optional(),
  type: z.enum(['TRACK', 'ALBUM', 'PLAYLIST', 'ARTIST']).optional(),
  minPrice: priceSchema.optional(),
  maxPrice: priceSchema.optional(),
  search: z.string().optional(),
});

export type ListNFTsInput = z.infer<typeof listNFTsSchema>;

// Get NFT
export const getNFTSchema = z.object({
  id: idSchema.optional(),
  tokenId: z.string().optional(),
}).refine((data) => data.id || data.tokenId, {
  message: 'Either id or tokenId must be provided',
});

export type GetNFTInput = z.infer<typeof getNFTSchema>;

// Update NFT
export const updateNFTSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  price: priceSchema.optional(),
  status: nftStatusSchema.optional(),
});

export type UpdateNFTInput = z.infer<typeof updateNFTSchema>;

// List NFT
export const listNFTForSaleSchema = z.object({
  nftId: idSchema,
  price: priceSchema,
});

export type ListNFTForSaleInput = z.infer<typeof listNFTForSaleSchema>;

// Delist NFT
export const delistNFTSchema = z.object({
  nftId: idSchema,
});

export type DelistNFTInput = z.infer<typeof delistNFTSchema>;