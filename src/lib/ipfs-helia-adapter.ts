import { type Helia } from '@helia/interface';
import { unixfs } from '@helia/unixfs';
import { createHelia } from 'helia';
import { type IPFSTrackMetadata } from './ipfs';

// Singleton instance for Helia
let heliaInstance: Helia | null = null;
let unixfsInstance: ReturnType<typeof unixfs> | null = null;

/**
 * Get or create Helia instance with UnixFS
 */
async function getHelia(): Promise<{ helia: Helia, fs: ReturnType<typeof unixfs> }> {
  if (!heliaInstance || !unixfsInstance) {
    heliaInstance = await createHelia();
    unixfsInstance = unixfs(heliaInstance);
  }
  
  return { helia: heliaInstance, fs: unixfsInstance };
}

/**
 * Upload file to IPFS using Helia
 */
export async function uploadToIPFSHelia(
  file: File | Buffer,
  metadata?: IPFSTrackMetadata
): Promise<{ cid: string; size: number }> {
 try {
    console.log('Starting Helia IPFS upload...');
    
    const { fs } = await getHelia();
    
    // Convert file/buffer to Uint8Array
    let fileBytes: Uint8Array;
    
    if (file instanceof File) {
      // Convert File to ArrayBuffer then to Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      fileBytes = new Uint8Array(arrayBuffer);
    } else if (Buffer.isBuffer(file)) {
      // Convert Buffer to Uint8Array
      fileBytes = new Uint8Array(file);
    } else {
      throw new Error('Unsupported file type');
    }
    
    let resultCid: string;
    let resultSize: number;
    
    if (metadata) {
      // If metadata is provided, create a combined object
      const metadataWithFile = {
        ...metadata,
        file: file instanceof File ? file.name : 'buffer',
        timestamp: new Date().toISOString(),
      };
      
      // Add metadata to IPFS
      const metadataBytes = new TextEncoder().encode(JSON.stringify(metadataWithFile));
      const metadataCid = await fs.addBytes(metadataBytes);
      
      // Add file to IPFS
      const fileCid = await fs.addBytes(fileBytes);
      
      // Create combined object
      const combined = {
        metadata: metadataCid.toString(),
        file: fileCid.toString(),
        type: 'track',
      };
      
      const combinedBytes = new TextEncoder().encode(JSON.stringify(combined));
      const combinedCid = await fs.addBytes(combinedBytes);
      
      resultCid = combinedCid.toString();
      resultSize = combinedBytes.length;
    } else {
      // Just add the file
      const cid = await fs.addBytes(fileBytes);
      resultCid = cid.toString();
      resultSize = fileBytes.length;
    }
    
    console.log(`Helia IPFS upload successful: ${resultCid} (${resultSize} bytes)`);
    
    return { cid: resultCid, size: resultSize };
  } catch (error) {
    console.error('Helia IPFS upload failed:', error);
    throw new Error(`Failed to upload to Helia IPFS: ${error}`);
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
 * Get file from IPFS using Helia
 */
export async function getFileFromIPFSHelia(cid: string): Promise<Buffer> {
  try {
    console.log(`Fetching file from Helia IPFS: ${cid}`);
    
    const { fs } = await getHelia();
    
    // Get the file content
    const stream = fs.cat(cid);
    const chunks: Uint8Array[] = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    // Combine all chunks into a single Uint8Array
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Convert Uint8Array to Buffer
    const fileData = Buffer.from(combined);
    console.log(`File retrieved successfully: ${fileData.length} bytes`);
    
    return fileData;
  } catch (error) {
    console.error('Failed to fetch file from Helia IPFS:', error);
    throw new Error(`Failed to fetch file from Helia IPFS: ${error}`);
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
 * Check file availability using Helia
 */
export async function checkFileAvailabilityHelia(cid: string): Promise<{
  available: boolean;
  gateways: string[];
}> {
  try {
    // In Helia, we can try to retrieve the file as a way to check availability
    const { fs } = await getHelia();
    
    // Try to get the file (this will fail if the CID doesn't exist)
    const stream = fs.cat(cid);
    let available = false;
    
    try {
      // Try to read the first chunk to verify the file exists
      for await (const chunk of stream) {
        // If we get here, the file is available
        available = true;
        break; // We only need to verify it exists, not read the whole thing
      }
    } catch (error) {
      // If there's an error, the file is not available
      available = false;
    }
    
    // Also check via public gateways as a secondary verification
    const gateways = [
      'https://ipfs.io/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
    ];
    
    const availableGateways: string[] = [];
    
    if (available) {
      // If Helia could access it, check which gateways also have it
      for (const gateway of gateways) {
        try {
          const url = `${gateway}${cid}`;
          const response = await fetch(url, { method: 'HEAD' });
          
          if (response.ok) {
            availableGateways.push(gateway);
          }
        } catch (error) {
          console.warn(`Gateway ${gateway} not available:`, error);
        }
      }
    }
    
    return {
      available,
      gateways: availableGateways,
    };
  } catch (error) {
    console.error('Failed to check file availability via Helia:', error);
    return {
      available: false,
      gateways: [],
    };
  }
}