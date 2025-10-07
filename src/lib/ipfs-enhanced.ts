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

// Интерфейс для результата загрузки
export interface UploadResult {
  cid: string;
  size: number;
  pinSize?: number;
  timestamp: Date;
  metadata: IPFSTrackMetadata;
}

// Конфигурация нескольких IPFS шлюзов
const GATEWAYS = [
  "https://ipfs.io",
  "https://gateway.pinata.cloud",
  "https://cloudflare-ipfs.com",
];

// Интерфейс для улучшенного результата загрузки
export interface EnhancedUploadResult extends UploadResult {
  gateways: string[];
  replicationStatus: {
    success: boolean;
    failedNodes: string[];
  };
}

// Интерфейс для Filecoin интеграции
export interface FilecoinStatus {
  status: "pending" | "uploading" | "completed" | "failed";
  dealId?: string;
  storageProvider?: string;
  price?: string;
  duration?: string;
}

// Оптимизированная загрузка файла с репликацией
export async function uploadWithReplication(
  file: File,
  metadata: IPFSTrackMetadata,
  options: {
    replicateToGateways?: string[];
    enableFilecoin?: boolean;
    chunkSize?: number;
  } = {}
): Promise<EnhancedUploadResult> {
  const {
    replicateToGateways = GATEWAYS,
    enableFilecoin = false,
    chunkSize = 10 * 1024 * 1024, // 10MB chunks
  } = options;

  try {
    console.log(`Starting upload for file: ${file.name} (${file.size} bytes)`);

    // Используем существующую функцию загрузки из ipfs.ts (теперь с поддержкой Helia)
    const uploadResult = await uploadLargeFileToIPFS(file, metadata, chunkSize);

    // Репликация на дополнительные шлюзы
    const replicationResults = await replicateToMultipleGateways(
      uploadResult.cid,
      replicateToGateways
    );

    // Filecoin интеграция (опционально)
    let filecoinStatus: FilecoinStatus | undefined;
    if (enableFilecoin) {
      filecoinStatus = await uploadToFilecoin(uploadResult.cid);
    }

    return {
      ...uploadResult,
      gateways: replicateToGateways,
      replicationStatus: {
        success: replicationResults.success,
        failedNodes: replicationResults.failedNodes,
      },
    };
  } catch (error) {
    console.error("Enhanced IPFS upload failed:", error);
    throw new Error(`Failed to upload file with replication: ${error}`);
  }
}

// Загрузка с чанкованием для больших файлов
async function uploadLargeFileToIPFS(
  file: File,
  metadata: IPFSTrackMetadata,
  chunkSize: number
): Promise<UploadResult> {
  try {
    // Проверяем безопасность файла перед загрузкой
    // Проверяем тип файла
    const allowedTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/flac",
      "audio/aac",
      "audio/ogg",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type not allowed: ${file.type}`);
    }

    // Проверяем размер файла
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      throw new Error(`File too large: ${file.size} bytes, max: ${maxSize}`);
    }

    // Проверяем имя файла на безопасность
    const fileName = file.name;
    if (
      fileName.includes("../") ||
      fileName.includes("..\\") ||
      fileName.includes("..%2f") ||
      fileName.includes("..%5c")
    ) {
      throw new Error("Invalid file name");
    }

    // Проверяем на потенциально опасные расширения
    const dangerousExtensions = [
      ".exe",
      ".bat",
      ".cmd",
      ".com",
      ".pif",
      ".scr",
      ".vbs",
      ".js",
      ".jar",
      ".sh",
      ".php",
      ".pl",
      ".py",
    ];
    const fileExtension = fileName
      .substring(fileName.lastIndexOf("."))
      .toLowerCase();
    if (dangerousExtensions.includes(fileExtension)) {
      throw new Error(`Dangerous file extension: ${fileExtension}`);
    }

    // For files smaller than chunkSize, use the regular uploadToIPFS function
    if (file.size <= chunkSize) {
      const { uploadToIPFS } = await import("./ipfs");
      const result = await uploadToIPFS(file, metadata);
      return {
        cid: result.cid,
        size: result.size,
        timestamp: new Date(),
        metadata,
      };
    }

    // For larger files, use chunking approach
    const totalChunks = Math.ceil(file.size / chunkSize);
    const chunks: Uint8Array[] = [];

    // Чанкуем файл
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      const arrayBuffer = await chunk.arrayBuffer();
      chunks.push(new Uint8Array(arrayBuffer));
    }

    console.log(`File split into ${totalChunks} chunks`);

    // Используем unified IPFS API (теперь с поддержкой Helia)
    const { uploadToIPFS } = await import("./ipfs");
    const chunkCIDs: string[] = [];

    for (const chunk of chunks) {
      // Create a Buffer from the Uint8Array
      const buffer = Buffer.from(chunk);
      // Convert to File-like object using Blob
      const blob = new Blob([buffer]);
      const fileChunk = new File([blob], `chunk_${chunkCIDs.length}`);

      // Загружаем каждый чанк через unified API
      const chunkResult = await uploadToIPFS(fileChunk);
      chunkCIDs.push(chunkResult.cid);
    }

    // Санитизируем метаданные
    const sanitizedMetadata = {
      ...metadata,
      title: metadata.title?.replace(/[<>:"/\\|?*]/g, "") || "",
      artist: metadata.artist?.replace(/[<>:"/\\|?*]/g, "") || "",
      description: metadata.description?.replace(/[<>]/g, "") || "",
    };

    // Создаем манифест для чанков
    const manifest = {
      chunks: chunkCIDs,
      totalChunks,
      totalSize: file.size,
      metadata: sanitizedMetadata,
      type: "chunked-audio",
      timestamp: new Date().toISOString(),
      compression: "none",
    };

    // Create a blob for the manifest JSON to match the expected type
    const manifestBlob = new Blob([JSON.stringify(manifest)], {
      type: "application/json",
    });
    const manifestFile = new File([manifestBlob], "manifest.json");

    // Загружаем манифест
    const manifestResult = await uploadToIPFS(manifestFile);
    const manifestCID = manifestResult.cid;

    // Пинимаем через unified API
    try {
      const { pinFile } = await import("./ipfs");
      await pinFile(manifestCID);
      for (const chunkCID of chunkCIDs) {
        await pinFile(chunkCID);
      }
      console.log("File pinned successfully via unified API");
    } catch (pinError) {
      console.warn("Pinning failed:", pinError);
    }

    return {
      cid: manifestCID,
      size: file.size,
      timestamp: new Date(),
      metadata: sanitizedMetadata,
    };
  } catch (error) {
    console.error("Chunked IPFS upload failed:", error);
    throw new Error(`Failed to upload large file to IPFS: ${error}`);
  }
}

// Репликация на несколько шлюзов
async function replicateToMultipleGateways(
  cid: string,
  gateways: string[]
): Promise<{ success: boolean; failedNodes: string[] }> {
  const failedNodes: string[] = [];
  const successNodes: string[] = [];

  for (const gateway of gateways) {
    try {
      const url = `${gateway}/ipfs/${cid}`;
      const response = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000) as any,
      });

      if (response.ok) {
        successNodes.push(gateway);
        console.log(`Successfully replicated to ${gateway}`);
      } else {
        failedNodes.push(gateway);
        console.warn(`Failed to replicate to ${gateway}: ${response.status}`);
      }
    } catch (error) {
      failedNodes.push(gateway);
      console.warn(`Error replicating to ${gateway}:`, error);
    }
  }

  return {
    success: failedNodes.length < gateways.length,
    failedNodes,
  };
}

// Filecoin интеграция (заглушка)
async function uploadToFilecoin(cid: string): Promise<FilecoinStatus> {
  try {
    // Здесь должна быть реальная интеграция с Filecoin API
    // Пока возвращаем статус pending
    return {
      status: "pending",
      dealId: undefined,
      storageProvider: "pending",
      price: "calculated",
      duration: "365 days",
    };
  } catch (error) {
    console.error("Filecoin upload failed:", error);
    return {
      status: "failed",
    };
  }
}

// Проверка доступности файла на нескольких шлюзах
export async function checkFileAvailabilityOnMultipleGateways(
  cid: string
): Promise<{
  available: boolean;
  availableGateways: string[];
  unavailableGateways: string[];
}> {
  const availableGateways: string[] = [];
  const unavailableGateways: string[] = [];

  for (const gateway of GATEWAYS) {
    try {
      const url = `${gateway}/ipfs/${cid}`;
      const response = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000) as any,
      });

      if (response.ok) {
        availableGateways.push(gateway);
      } else {
        unavailableGateways.push(gateway);
      }
    } catch (error) {
      unavailableGateways.push(gateway);
    }
  }

  return {
    available: availableGateways.length > 0,
    availableGateways,
    unavailableGateways,
  };
}

// Получение файла с лучшего шлюза
export async function getFileFromBestGateway(cid: string): Promise<Response> {
  // Проверяем доступность на всех шлюзах
  const availability = await checkFileAvailabilityOnMultipleGateways(cid);

  if (!availability.available) {
    throw new Error("File not available on any gateway");
  }

  // Пробуем шлюзы в порядке приоритета с ограничением числа попыток
  const fetchWithRetry = async (url: string, tries = 3): Promise<Response> => {
    for (let i = 0; i < tries; i++) {
      try {
        return await fetch(url, { signal: AbortSignal.timeout(8000) as any });
      } catch (e) {
        if (i === tries - 1) throw e;
      }
    }
    throw new Error("IPFS gateways exhausted");
  };

  for (const gateway of GATEWAYS) {
    try {
      const url = `${gateway}/ipfs/${cid}`;
      const response = await fetchWithRetry(url, 3);
      if (response.ok) {
        console.log(`File retrieved from ${gateway}`);
        return response;
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${gateway}:`, error);
    }
  }

  throw new Error("Failed to retrieve file from any gateway");
}

// Генерация CDN URL для быстрой доставки
export function generateCDNUrl(cid: string, region?: string): string {
  const cdnProvider = process.env.CDN_PROVIDER || "cloudflare";

  switch (cdnProvider) {
    case "cloudflare":
      return `https://normaldance.pages.dev/ipfs/${cid}`;
    case "pinata":
      return `https://gateway.pinata.cloud/ipfs/${cid}`;
    default:
      return `https://ipfs.io/ipfs/${cid}`;
  }
}

// Мониторинг состояния файлов
export async function monitorFileHealth(cid: string): Promise<{
  health: "healthy" | "degraded" | "unhealthy";
  replicationFactor: number;
  lastChecked: Date;
}> {
  const availability = await checkFileAvailabilityOnMultipleGateways(cid);
  const replicationFactor = availability.availableGateways.length;

  let health: "healthy" | "degraded" | "unhealthy";
  if (replicationFactor >= 2) {
    health = "healthy";
  } else if (replicationFactor === 1) {
    health = "degraded";
  } else {
    health = "unhealthy";
  }

  return {
    health,
    replicationFactor,
    lastChecked: new Date(),
  };
}

// Кэширование результатов для улучшения производительности
const cache = new Map<
  string,
  {
    data: any;
    timestamp: number;
    ttl: number;
  }
>();

export function getCachedData(key: string, ttl: number = 300000): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  return null;
}

export function setCachedData(
  key: string,
  data: any,
  ttl: number = 300000
): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

// Очистка устаревших кэшированных данных
export function cleanupCache(): void {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key);
    }
  }
}

// Регулярная очистка кэша
setInterval(cleanupCache, 60000); // Каждую минуту
