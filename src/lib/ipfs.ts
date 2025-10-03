import { create } from 'ipfs-http-client';

// Import Helia adapter functions
import {
  checkFileAvailabilityHelia,
  getFileFromIPFSHelia,
  getMetadataFromIPFSHelia,
  pinFileHelia,
  unpinFileHelia,
  uploadToIPFSHelia,
  uploadToIPFSHeliaWithProgress
} from './ipfs-helia-adapter';

// Check if we should use Helia backend
const useHeliaBackend = process.env.IPFS_BACKEND === 'helia';

// Конфигурация IPFS клиента
const IPFS_CONFIG = {
  host: process.env.IPFS_HOST || 'ipfs.io',
  port: parseInt(process.env.IPFS_PORT || '5001'),
  protocol: process.env.IPFS_PROTOCOL || 'https',
};

// Создание IPFS клиента
export const ipfsClient = create({
  url: `${IPFS_CONFIG.protocol}://${IPFS_CONFIG.host}:${IPFS_CONFIG.port}/api/v0`,
  headers: {
    authorization: `Bearer ${process.env.IPFS_AUTH_TOKEN || ''}`,
  },
});

// Конфигурация Pinata
const PINATA_CONFIG = {
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY,
  pinataJwt: process.env.PINATA_JWT,
};

// Создание Pinata клиента
export const pinata = PINATA_CONFIG.pinataApiKey && PINATA_CONFIG.pinataSecretApiKey
  ? create({
      pinataApiKey: PINATA_CONFIG.pinataApiKey,
      pinataSecretApiKey: PINATA_CONFIG.pinataSecretApiKey,
    })
  : null;

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
  mimeType: string;
}

// Загрузка файла в IPFS - с поддержкой фичефлага для Helia
export async function uploadToIPFS(
  file: File | Buffer,
  metadata?: IPFSTrackMetadata
): Promise<{ cid: string; size: number }> {
  if (useHeliaBackend) {
    // Use Helia implementation
    return await uploadToIPFSHelia(file, metadata);
  }

  // Legacy implementation
  try {
    console.log('Starting IPFS upload...');
    
    // Если есть метаданные, создаем JSON объект
    let ipfsResult: any;
    if (metadata) {
      const metadataWithFile = {
        ...metadata,
        file: file instanceof File ? file.name : 'buffer',
        timestamp: new Date().toISOString(),
      };
      
      // Загружаем метаданные
      const metadataResult = await ipfsClient.add(JSON.stringify(metadataWithFile));
      const metadataCid = metadataResult.cid.toString();
      
      // Загружаем файл
      const fileResult = await ipfsClient.add(file);
      const fileCid = fileResult.cid.toString();
      
      // Создаем объединенный объект
      const combined = {
        metadata: metadataCid,
        file: fileCid,
        type: 'track',
      };
      
      ipfsResult = await ipfsClient.add(JSON.stringify(combined));
    } else {
      // Просто загружаем файл
      ipfsResult = await ipfsClient.add(file);
    }
    
    const cid = ipfsResult.cid.toString();
    const size = ipfsResult.size;
    
    console.log(`IPFS upload successful: ${cid} (${size} bytes)`);
    
    // Пинимаем через Pinata если доступно
    if (pinata) {
      try {
        await pinata.pinFile(cid);
        console.log('File pinned successfully via Pinata');
      } catch (pinError) {
        console.warn('Pinata pinning failed:', pinError);
      }
    }
    
    return { cid, size };
  } catch (error) {
    console.error('IPFS upload failed:', error);
    throw new Error(`Failed to upload to IPFS: ${error}`);
  }
}

// Загрузка файла с прогрессом - с поддержкой фичефлага для Helia
export async function uploadToIPFSWithProgress(
  file: File,
  metadata: IPFSTrackMetadata,
  onProgress?: (progress: number) => void
): Promise<{ cid: string; size: number }> {
  if (useHeliaBackend) {
    // Use Helia implementation
    return await uploadToIPFSHeliaWithProgress(file, metadata, onProgress);
  }

  // Legacy implementation
  try {
    // Для больших файлов используем чанкование
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
    const totalSize = file.size;
    let uploadedSize = 0;
    
    if (file.size > CHUNK_SIZE) {
      console.log(`Large file detected, using chunking (${file.size} bytes)`);
      
      // Чанкуем файл
      const chunks: Uint8Array[] = [];
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        const arrayBuffer = await chunk.arrayBuffer();
        chunks.push(new Uint8Array(arrayBuffer));
        
        // Обновляем прогресс
        uploadedSize += chunk.size;
        if (onProgress) {
          onProgress(Math.round((uploadedSize / totalSize) * 100));
        }
      }
      
      // Загружаем чанки
      const chunkCIDs: string[] = [];
      for (const chunk of chunks) {
        const chunkResult = await ipfsClient.add(chunk);
        chunkCIDs.push(chunkResult.cid.toString());
      }
      
      // Создаем манифест
      const manifest = {
        chunks: chunkCIDs,
        totalChunks,
        totalSize: file.size,
        metadata,
        type: 'chunked-audio',
        timestamp: new Date().toISOString(),
        compression: 'none'
      };
      
      // Загружаем манифест
      const manifestResult = await ipfsClient.add(JSON.stringify(manifest));
      const manifestCID = manifestResult.cid.toString();
      
      // Пинимаем все чанки и манифест
      if (pinata) {
        try {
          await pinata.pinFile(manifestCID);
          for (const chunkCID of chunkCIDs) {
            await pinata.pinFile(chunkCID);
          }
          console.log('Chunked file pinned successfully via Pinata');
        } catch (pinError) {
          console.warn('Pinata pinning failed for chunked file:', pinError);
        }
      }
      
      return { cid: manifestCID, size: file.size };
    } else {
      // Для маленьких файлов используем обычную загрузку
      return await uploadToIPFS(file, metadata);
    }
  } catch (error) {
    console.error('IPFS upload with progress failed:', error);
    throw new Error(`Failed to upload to IPFS with progress: ${error}`);
  }
}

// Получение файла из IPFS - с поддержкой фичефлага для Helia
export async function getFileFromIPFS(cid: string): Promise<Buffer> {
  if (useHeliaBackend) {
    // Use Helia implementation
    return await getFileFromIPFSHelia(cid);
  }

  // Legacy implementation
  try {
    console.log(`Fetching file from IPFS: ${cid}`);
    
    const chunks: Buffer[] = [];
    for await (const chunk of ipfsClient.cat(cid)) {
      chunks.push(chunk);
    }
    
    const fileData = Buffer.concat(chunks);
    console.log(`File retrieved successfully: ${fileData.length} bytes`);
    
    return fileData;
  } catch (error) {
    console.error('Failed to fetch file from IPFS:', error);
    throw new Error(`Failed to fetch file from IPFS: ${error}`);
  }
}

// Получение метаданных из IPFS - с поддержкой фичефлага для Helia
export async function getMetadataFromIPFS(cid: string): Promise<any> {
  if (useHeliaBackend) {
    // Use Helia implementation
    return await getMetadataFromIPFSHelia(cid);
  }

  // Legacy implementation
  try {
    console.log(`Fetching metadata from IPFS: ${cid}`);
    
    const metadata = await ipfsClient.cat(cid);
    const metadataString = Buffer.from(metadata).toString();
    const metadataJson = JSON.parse(metadataString);
    
    console.log('Metadata retrieved successfully');
    return metadataJson;
  } catch (error) {
    console.error('Failed to fetch metadata from IPFS:', error);
    throw new Error(`Failed to fetch metadata from IPFS: ${error}`);
  }
}

// Пиннинг файла - с поддержкой фичефлага для Helia
export async function pinFile(cid: string): Promise<boolean> {
  if (useHeliaBackend) {
    // Use Helia implementation
    return await pinFileHelia(cid);
  }

  // Legacy implementation
  try {
    if (pinata) {
      await pinata.pinFile(cid);
      console.log(`File pinned successfully: ${cid}`);
      return true;
    } else {
      // Используем IPFS пиннинг
      await ipfsClient.pin.add(cid);
      console.log(`File pinned via IPFS: ${cid}`);
      return true;
    }
  } catch (error) {
    console.error('Failed to pin file:', error);
    return false;
  }
}

// Отмена пиннинга файла - с поддержкой фичефлага для Helia
export async function unpinFile(cid: string): Promise<boolean> {
  if (useHeliaBackend) {
    // Use Helia implementation
    return await unpinFileHelia(cid);
  }

  // Legacy implementation
  try {
    if (pinata) {
      await pinata.unpin(cid);
      console.log(`File unpinned successfully: ${cid}`);
      return true;
    } else {
      // Используем IPFS unpin
      await ipfsClient.pin.rm(cid);
      console.log(`File unpinned via IPFS: ${cid}`);
      return true;
    }
  } catch (error) {
    console.error('Failed to unpin file:', error);
    return false;
  }
}

// Проверка доступности файла - с поддержкой фичефлага для Helia
export async function checkFileAvailability(cid: string): Promise<{
  available: boolean;
  gateways: string[];
}> {
  if (useHeliaBackend) {
    // Use Helia implementation
    return await checkFileAvailabilityHelia(cid);
  }

  // Legacy implementation
  const gateways = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
  ];
  
  const availableGateways: string[] = [];
  
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
  
  return {
    available: availableGateways.length > 0,
    gateways: availableGateways,
  };
}

// Генерация URL для файла
export function generateIPFSUrl(cid: string, gateway?: string): string {
  const selectedGateway = gateway || 'https://ipfs.io/ipfs/';
  return `${selectedGateway}${cid}`;
}

// Очистка неиспользуемых файлов
export async function cleanupUnpinnedFiles(): Promise<number> {
  if (useHeliaBackend) {
    // For Helia, we'll use the legacy implementation for now
    // Helia has different cleanup mechanisms that we can implement later
    console.log('Using legacy cleanup for Helia backend (placeholder)');
    return 0;
  }

  // Legacy implementation
  try {
    console.log('Starting cleanup of unpinned files...');
    
    // Получаем список всех пиннед файлов
    const pinnedFiles = [];
    for await (const { cid } of ipfsClient.pin.ls()) {
      pinnedFiles.push(cid.toString());
    }
    
    console.log(`Found ${pinnedFiles.length} pinned files`);
    
    // Здесь можно добавить логику для удаления старых или неиспользуемых файлов
    // Например, файлов старше 30 дней
    
    return pinnedFiles.length;
  } catch (error) {
    console.error('Failed to cleanup unpinned files:', error);
    return 0;
  }
}
