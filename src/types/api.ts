/**
 * API response type definitions
 */

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: APIMeta;
}

export interface APIError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface APIMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasMore?: boolean;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  meta: Required<APIMeta>;
}

export interface TrackResponse {
  id: string;
  title: string;
  artistName: string;
  artistId: string;
  genre: string;
  duration: number;
  playCount: number;
  likeCount: number;
  ipfsHash: string;
  audioUrl: string;
  coverImage?: string;
  metadata?: TrackMetadataResponse;
  price?: number;
  isExplicit: boolean;
  isPublished: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface TrackMetadataResponse {
  bpm?: number;
  key?: string;
  albumArt?: string;
  description?: string;
  releaseDate?: string;
  fileSize?: number;
  mimeType?: string;
  bitrate?: number;
  year?: string | number;
  label?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  wallet?: string;
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  balance: number;
  tonBalance: number;
  isArtist: boolean;
  isActive: boolean;
  role: 'LISTENER' | 'ARTIST' | 'CURATOR' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface NFTResponse {
  id: string;
  tokenId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  metadata: NFTMetadataResponse;
  price?: number;
  status: 'LISTED' | 'SOLD' | 'MINTED' | 'TRANSFERRED';
  type: 'TRACK' | 'ALBUM' | 'PLAYLIST' | 'ARTIST';
  ownerId: string;
  owner: UserResponse;
  trackId?: string;
  track?: TrackResponse;
  createdAt: string;
  updatedAt: string;
}

export interface NFTMetadataResponse {
  name: string;
  description?: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: Record<string, unknown>;
}

export interface PlaylistResponse {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  isPublic: boolean;
  playCount: number;
  userId: string;
  user: UserResponse;
  tracks: TrackResponse[];
  trackCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StatsResponse {
  totalTracks: number;
  totalUsers: number;
  totalPlays: number;
  totalNFTs: number;
  totalVolume: number;
  activeUsers: number;
  period: 'day' | 'week' | 'month' | 'year' | 'all';
}

export interface TransactionResponse {
  id: string;
  type: string;
  amount: number;
  from: string;
  to: string;
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  blockNumber?: number;
  fee?: number;
}