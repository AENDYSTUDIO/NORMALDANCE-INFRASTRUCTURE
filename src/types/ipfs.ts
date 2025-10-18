/**
 * IPFS-related type definitions
 */

export interface IPFSMetadata {
  title: string;
  artist: string;
  genre: string;
  duration: number;
  albumArt?: string;
  description?: string;
  releaseDate: string;
  bpm?: number;
  key?: string;
  isExplicit: boolean;
  fileSize: number;
  mimeType: string;
  bitrate?: number;
  year?: string | number;
  label?: string;
}

export interface IPFSUploadResult {
  cid: string;
  size: number;
  pinSize?: number;
  timestamp: Date;
  metadata: IPFSMetadata;
}

export interface IPFSGateway {
  url: string;
  priority: number;
  timeout: number;
}

export interface IPFSReplicationStatus {
  success: boolean;
  failedNodes: string[];
  successfulNodes: string[];
  totalNodes: number;
}

export interface IPFSFileHealth {
  health: 'healthy' | 'degraded' | 'unhealthy';
  replicationFactor: number;
  lastChecked: Date;
  availableGateways: string[];
  unavailableGateways: string[];
}

export interface IPFSChunkManifest {
  chunks: string[];
  totalChunks: number;
  totalSize: number;
  metadata: IPFSMetadata;
  type: 'chunked-audio' | 'chunked-video' | 'chunked-file';
  timestamp: string;
  compression: 'none' | 'gzip' | 'brotli';
}

export interface FilecoinDeal {
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  dealId?: string;
  storageProvider?: string;
  price?: string;
  duration?: string;
  cid: string;
}