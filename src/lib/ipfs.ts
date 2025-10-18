// MIGRATION COMPLETE: Now using Helia as primary IPFS backend
// Legacy ipfs-http-client has been fully replaced with Helia

import { logger } from './logger';
import {
  checkFileAvailabilityHelia,
  getFileFromIPFSHelia,
  getMetadataFromIPFSHelia,
  pinFileHelia,
  unpinFileHelia,
  uploadToIPFSHelia,
  uploadToIPFSHeliaWithProgress,
} from "./ipfs-helia-adapter"; // Now primary IPFS implementation

// Helia now serves as the primary IPFS client
// Legacy configuration kept for fallback references
const IPFS_CONFIG = {
  host: process.env.IPFS_HOST || "ipfs.io",
  port: parseInt(process.env.IPFS_PORT || "5001"),
  protocol: process.env.IPFS_PROTOCOL || "https",
};

// Конфигурация Pinata
const PINATA_CONFIG = {
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY,
  pinataJwt: process.env.PINATA_JWT,
};

// Интерфейс для IPFS метаданных
export interface IPFSTrackMetadata {
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
  format: string;
  sampleRate: number;
  bitDepth: number;
}

// Загрузка файла в IPFS с использованием Helia (теперь основной метод)
export async function uploadToIPFS(
  file: File | Buffer,
  metadata?: IPFSTrackMetadata
): Promise<{ cid: string; size: number }> {
  try {
    // Helia is now the primary implementation
    return await uploadToIPFSHelia(file, metadata);
  } catch (error) {
    logger.error("IPFS upload failed", error);
    throw new Error(`Failed to upload to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Загрузка файла с прогрессом - с поддержкой фичефлага для Helia
export async function uploadToIPFSWithProgress(
  file: File,
  metadata: IPFSTrackMetadata,
  onProgress?: (progress: number) => void
): Promise<{ cid: string; size: number }> {
  // Helia implementation is now primary
  return await uploadToIPFSHeliaWithProgress(file, metadata, onProgress);
}

// Получение файла из IPFS
export async function getFileFromIPFS(
  cid: string,
  retries: number = 3
): Promise<Buffer> {
  try {
    // Helia implementation is now primary
    return await getFileFromIPFSHelia(cid);
  } catch (error) {
    logger.error("Failed to get file from IPFS", error);
    throw new Error(`Failed to get file from IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Получение метаданных из IPFS
export async function getMetadataFromIPFS(cid: string): Promise<any> {
  try {
    const fileData = await getFileFromIPFS(cid);
    const metadataString = fileData.toString();
    const metadataJson = JSON.parse(metadataString);
    
    return metadataJson;
  } catch (error) {
    logger.error("Failed to get metadata from IPFS", error);
    throw new Error(`Failed to get metadata from IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Закрепление файла в Pinata (зарезервировано для будущих нужд) 
export async function pinFile(pinataApiKey: string, pinataSecretApiKey: string, cid: string): Promise<boolean> {
  try {
    logger.info(`Pinning file in Pinata: ${cid}`);
    
    const response = await fetch('/api/ipfs/pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hashToPin: cid,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to pin file in Pinata: ${response.statusText}`);
    }

    logger.info(`File pinned successfully in Pinata: ${cid}`);
    return true;
  } catch (error) {
    logger.error("Failed to pin file in Pinata", error);
    return false;
  }
}

// Открепление файла из Pinata (зарезервировано для будущих нужд)
export async function unpinFile(PINATA_JWT: string, cid: string): Promise<boolean> {
  try {
    logger.info(`Unpinning file from Pinata: ${cid}`);
    
    const response = await fetch(`/api/ipfs/unpin/${cid}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to unpin file from Pinata: ${response.statusText}`);
    }

    logger.info(`File unpinned successfully from Pinata: ${cid}`);
    return true;
  } catch (error) {
    logger.error("Failed to unpin file from Pinata", error);
    return false;
  }
}

// Проверка доступности файла через шлюз
export async function checkFileAvailability(cid: string): Promise<{
  available: boolean;
  gateways: string[];
}> {
  try {
    // Use Helia implementation for availability check
    return await checkFileAvailabilityHelia(cid);
  } catch (error) {
    logger.error("Failed to check file availability", error);
    return {
      available: false,
      gateways: [],
    };
  }
}

// Сбор мусора - удаление незакрепленных файлов
export async function cleanupUnpinnedFiles(): Promise<{
  cleanedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  const cleanedCount = 0;

  try {
    logger.info('Starting cleanup of unpinned files');

    return {
      cleanedCount,
      errors,
    };
  } catch (error) {
    const errorMsg = `Failed to cleanup unpinned files: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg);
    errors.push(errorMsg);
    
    return {
      cleanedCount,
      errors,
    };
  }
}

// Резервное копирование важных файлов
export async function backupImportantFiles(): Promise<{
  backedUpCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  const backedUpCount = 0;

  try {
    logger.info('Starting backup of important files');
    
    return {
      backedUpCount,
      errors,
    };
  } catch (error) {
    const errorMsg = `Failed to backup important files: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg);
    errors.push(errorMsg);
    
    return {
      backedUpCount,
      errors,
    };
  }
}

// Валидация CID
export function validateCID(cid: string): boolean {
  // Basic CID validation - in production use proper CID validation library
  if (!cid || typeof cid !== 'string' || cid.trim().length === 0) {
    return false;
  }

  // Check if it starts with common CID prefixes
  const validPrefixes = ['Qm', 'baf', 'baa', 'bafy', 'z'];
  return validPrefixes.some(prefix => cid.startsWith(prefix));
}

// Генерация статистики использования IPFS
export async function generateIPFSStatistics(): Promise<{
  totalFiles: number;
  totalSize: number;
  pinnedFiles: number;
  availableGateways: number;
}> {
  try {
    return {
      totalFiles: 0,
      totalSize: 0,
      pinnedFiles: 0,
      availableGateways: 0,
    };
  } catch (error) {
    logger.error("Failed to generate IPFS statistics", error);
    throw new Error(`Failed to generate IPFS statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
