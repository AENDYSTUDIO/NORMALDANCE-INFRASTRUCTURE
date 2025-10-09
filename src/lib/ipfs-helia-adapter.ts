import { type Helia } from '@helia/interface';
import { unixfs } from '@helia/unixfs';
import { createHelia } from 'helia';
import { type IPFSTrackMetadata } from './ipfs';
import { createLogger } from '../utils/logger';

const logger = createLogger('ipfs-helia');

// Singleton instance for Helia
let heliaInstance: Helia | null = null;
let unixfsInstance: ReturnType<typeof unixfs> | null = null;

/**
 * Get or create Helia instance with UnixFS
 */
async function getHelia(): Promise<{ helia: Helia, fs: ReturnType<typeof unixfs> }> {
  if (!heliaInstance || !unixfsInstance) {
    try {
      logger.info('Initializing Helia IPFS instance...');
      heliaInstance = await createHelia({
        // Add security-focused configuration
        start: true,
        libp2p: {
          connectionManager: {
            maxConnections: 50,
            minConnections: 10,
          }
        }
      });
      unixfsInstance = unixfs(heliaInstance);
      logger.info('Helia IPFS instance initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Helia:', error);
      throw new Error(`Helia initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return { helia: heliaInstance, fs: unixfsInstance };
}

/**
 * Upload file to IPFS using Helia with enhanced security
 */
export async function uploadToIPFSHelia(
  file: File | Buffer,
  metadata?: IPFSTrackMetadata
): Promise<{ cid: string; size: number }> {
 try {
    // Validate input parameters
    if (!file) {
      throw new Error('File is required');
    }
    
    // File size validation (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    const fileSize = file instanceof File ? file.size : (file as Buffer).length;
    
    if (fileSize > maxSize) {
      throw new Error(`File size ${fileSize} exceeds maximum allowed size of ${maxSize} bytes`);
    }
    
    logger.info(`Starting Helia IPFS upload for file size: ${fileSize} bytes`);
    
    const { fs } = await getHelia();
    
    // Validate and convert file/buffer to Uint8Array
    let fileBytes: Uint8Array;
    
    if (file instanceof File) {
      // Additional validation for File objects
      if (!file.type || file.type === '') {
        logger.warn('File has no MIME type, proceeding with caution');
      }
      
      const arrayBuffer = await file.arrayBuffer();
      fileBytes = new Uint8Array(arrayBuffer);
    } else if (Buffer.isBuffer(file)) {
      fileBytes = new Uint8Array(file);
    } else {
      throw new Error('Unsupported file type: expected File or Buffer');
    }
    
    // Sanitize metadata if provided
    const sanitizedMetadata = metadata ? {
      title: metadata.title?.substring(0, 255) || '',
      artist: metadata.artist?.substring(0, 255) || '',
      genre: metadata.genre?.substring(0, 100) || '',
      duration: typeof metadata.duration === 'number' && metadata.duration > 0 ? metadata.duration : 0,
      format: metadata.format?.substring(0, 50) || '',
      sampleRate: typeof metadata.sampleRate === 'number' ? metadata.sampleRate : 44100,
      bitDepth: typeof metadata.bitDepth === 'number' ? metadata.bitDepth : 16,
    } : undefined;
    
    let resultCid: string;
    let resultSize: number;
    
    if (sanitizedMetadata) {
      // Create secure metadata object
      const metadataWithFile = {
        ...sanitizedMetadata,
        file: file instanceof File ? file.name.substring(0, 255) : 'buffer',
        timestamp: new Date().toISOString(),
        version: '1.0',
      };
      
      // Add metadata to IPFS
      const metadataBytes = new TextEncoder().encode(JSON.stringify(metadataWithFile));
      const metadataCid = await fs.addBytes(metadataBytes);
      
      // Add file to IPFS
      const fileCid = await fs.addBytes(fileBytes);
      
      // Create combined object with validation
      const combined = {
        metadata: metadataCid.toString(),
        file: fileCid.toString(),
        type: 'track',
        checksum: await calculateChecksum(fileBytes),
        createdAt: new Date().toISOString(),
      };
      
      const combinedBytes = new TextEncoder().encode(JSON.stringify(combined));
      const combinedCid = await fs.addBytes(combinedBytes);
      
      resultCid = combinedCid.toString();
      resultSize = combinedBytes.length;
    } else {
      // Just add the file with basic metadata
      const cid = await fs.addBytes(fileBytes);
      resultCid = cid.toString();
      resultSize = fileBytes.length;
    }
    
    logger.info(`Helia IPFS upload successful: ${resultCid} (${resultSize} bytes)`);
    
    return { cid: resultCid, size: resultSize };
  } catch (error) {
    logger.error('Helia IPFS upload failed:', error);
    throw new Error(`Failed to upload to Helia IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload file with progress using Helia
 */
export async function uploadToIPFSHeliaWithProgress(
  file: File,
  metadata: IPFSTrackMetadata,
  onProgress?: (progress: number) => void
): Promise<{ cid: string; size: number }> {
  try {
    // For now, we'll implement basic upload with progress reporting
    // Helia chunking can be more complex than the legacy client
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
    const totalSize = file.size;
    
    if (file.size > CHUNK_SIZE) {
      console.log(`Large file detected, using chunking (${file.size} bytes)`);
      
      // For large files, we'll process in chunks but upload as a single unit for now
      // Helia handles chunking internally, so we can just upload the whole file
      if (onProgress) {
        onProgress(50); // Simulate progress since Helia handles internal chunking
      }
      
      const result = await uploadToIPFSHelia(file, metadata);
      
      if (onProgress) {
        onProgress(10);
      }
      
      return result;
    } else {
      // For smaller files, just upload normally
      if (onProgress) {
        onProgress(30);
      }
      
      const result = await uploadToIPFSHelia(file, metadata);
      
      if (onProgress) {
        onProgress(100);
      }
      
      return result;
    }
  } catch (error) {
    console.error('Helia IPFS upload with progress failed:', error);
    throw new Error(`Failed to upload to Helia IPFS with progress: ${error}`);
  }
}

/**
 * Get file from IPFS using Helia with enhanced security
 */
export async function getFileFromIPFSHelia(cid: string): Promise<Buffer> {
  try {
    // Validate CID
    if (!cid || typeof cid !== 'string' || cid.trim().length === 0) {
      throw new Error('Invalid CID provided');
    }
    
    logger.info(`Fetching file from Helia IPFS: ${cid}`);
    
    const { fs } = await getHelia();
    
    // Get the file content with size limit
    const stream = fs.cat(cid);
    const chunks: Uint8Array[] = [];
    let totalSize = 0;
    const maxSize = 100 * 1024 * 1024; // 100MB limit
    
    for await (const chunk of stream) {
      totalSize += chunk.length;
      
      // Check size limit
      if (totalSize > maxSize) {
        throw new Error(`File size ${totalSize} exceeds maximum allowed size of ${maxSize} bytes`);
      }
      
      chunks.push(chunk);
    }
    
    // Combine all chunks into a single Uint8Array
    const combined = new Uint8Array(totalSize);
    
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Convert Uint8Array to Buffer
    const fileData = Buffer.from(combined);
    logger.info(`File retrieved successfully: ${fileData.length} bytes`);
    
    return fileData;
  } catch (error) {
    logger.error('Failed to fetch file from Helia IPFS:', error);
    throw new Error(`Failed to fetch file from Helia IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get metadata from IPFS using Helia
 */
export async function getMetadataFromIPFSHelia(cid: string): Promise<any> {
  try {
    console.log(`Fetching metadata from Helia IPFS: ${cid}`);
    
    const fileData = await getFileFromIPFSHelia(cid);
    const metadataString = fileData.toString();
    const metadataJson = JSON.parse(metadataString);
    
    console.log('Metadata retrieved successfully');
    return metadataJson;
  } catch (error) {
    console.error('Failed to fetch metadata from Helia IPFS:', error);
    throw new Error(`Failed to fetch metadata from Helia IPFS: ${error}`);
  }
}

/**
 * Pin file using Helia
 */
export async function pinFileHelia(cid: string): Promise<boolean> {
  try {
    const { helia } = await getHelia();
    
    // Pin the CID using Helia's pinning functionality
    await helia.pins.add(cid);
    console.log(`File pinned successfully via Helia: ${cid}`);
    
    return true;
  } catch (error) {
    console.error('Failed to pin file via Helia:', error);
    return false;
  }
}

/**
 * Unpin file using Helia
 */
export async function unpinFileHelia(cid: string): Promise<boolean> {
  try {
    const { helia } = await getHelia();
    
    // Remove pin for the CID
    await helia.pins.rm(cid);
    console.log(`File unpinned successfully via Helia: ${cid}`);
    
    return true;
  } catch (error) {
    console.error('Failed to unpin file via Helia:', error);
    return false;
 }
}

/**
 * Check file availability using Helia with enhanced security
 */
export async function checkFileAvailabilityHelia(cid: string): Promise<{
  available: boolean;
  gateways: string[];
}> {
  try {
    // Validate CID
    if (!cid || typeof cid !== 'string' || cid.trim().length === 0) {
      return {
        available: false,
        gateways: [],
      };
    }
    
    const { fs } = await getHelia();
    
    // Try to get the file (this will fail if the CID doesn't exist)
    let available = false;
    
    try {
      const stream = fs.cat(cid);
      
      // Try to read the first chunk to verify the file exists
      // Set a timeout for this operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout checking file availability')), 10000);
      });
      
      const readPromise = (async () => {
        for await (const chunk of stream) {
          // If we get here, the file is available
          available = true;
          break; // We only need to verify it exists, not read the whole thing
        }
      })();
      
      await Promise.race([readPromise, timeoutPromise]);
    } catch (error) {
      // If there's an error, the file is not available
      available = false;
      logger.warn(`File availability check failed for CID ${cid}:`, error);
    }
    
    // Check via public gateways as a secondary verification with timeout
    const gateways = [
      'https://ipfs.io/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
    ];
    
    const availableGateways: string[] = [];
    
    if (available) {
      // If Helia could access it, check which gateways also have it
      const gatewayPromises = gateways.map(async (gateway) => {
        try {
          const url = `${gateway}${cid}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch(url, { 
            method: 'HEAD',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            return gateway;
          }
        } catch (error) {
          logger.warn(`Gateway ${gateway} not available:`, error);
        }
        return null;
      });
      
      const results = await Promise.all(gatewayPromises);
      availableGateways.push(...results.filter(Boolean) as string[]);
    }
    
    return {
      available,
      gateways: availableGateways,
    };
  } catch (error) {
    logger.error('Failed to check file availability via Helia:', error);
    return {
      available: false,
      gateways: [],
    };
  }
}

/**
 * Calculate checksum for data integrity
 */
async function calculateChecksum(data: Uint8Array): Promise<string> {
  // Simple checksum calculation - in production use crypto.hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Cleanup unpinned files using Helia with enhanced security
 */
export async function cleanupHeliaFiles(): Promise<{
  pinnedCount: number;
  cleanedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  
  try {
    logger.info('Starting cleanup of unpinned files using Helia...');
    
    const { helia } = await getHelia();
    
    // Get all pinned CIDs
    const pinnedCids: string[] = [];
    try {
      for await (const { cid } of helia.pins.ls()) {
        pinnedCids.push(cid.toString());
      }
    } catch (error) {
      errors.push(`Failed to list pinned files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    logger.info(`Found ${pinnedCids.length} pinned files in Helia`);
    
    // For now, just return the count
    // In a production environment, you might want to:
    // 1. Check file age and remove old files
    // 2. Check file usage in your database
    // 3. Implement a retention policy
    
    return {
      pinnedCount: pinnedCids.length,
      cleanedCount: 0, // No cleanup implemented yet
      errors,
    };
  } catch (error) {
    const errorMsg = `Failed to cleanup Helia files: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg);
    errors.push(errorMsg);
    
    return {
      pinnedCount: 0,
      cleanedCount: 0,
      errors,
    };
  }
}