import Redis from "ioredis";

/**
 * Cache Manager для NormalDance
 * Оптимизация производительности через кеширование аудиофайлов, данных и запросов
 */

interface CacheConfig {
  maxAge: number; // Время жизни кеша в миллисекундах
  maxSize: number; // Максимальный размер кеша в байтах
  strategy: "memory" | "storage" | "hybrid" | "redis"; // Стратегия кеширования
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

interface AudioCacheConfig extends CacheConfig {
  quality: "low" | "medium" | "high"; // Качество аудио для кеширования
  format: "mp3" | "ogg" | "webm"; // Формат аудио
  preload: boolean; // Предзагрузка следующего трека
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private storageCache = new Map<string, CacheEntry<any>>();
  private redisClient?: Redis;
  private config: CacheConfig;
  private currentSize = 0;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    saves: 0,
  };

  constructor(config: CacheConfig) {
    this.config = config;
    this.initializeCache();
  }

  /**
   * Инициализация кеша
   */
  private initializeCache() {
    // Инициализация Redis на сервере
    if (typeof window === "undefined") {
      this.redisClient = new Redis({
        // Настройки подключения к Redis (из переменных окружения)
        host: process.env.REDIS_HOST || "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
      });
      this.config.strategy = "redis";
      console.log("Redis cache manager initialized.");
    } else if (this.config.strategy === "hybrid") {
      // Загрузка кеша из localStorage на клиенте
      try {
        const savedCache = localStorage.getItem("normaldance_cache");
        if (savedCache) {
          const parsed = JSON.parse(savedCache);
          this.storageCache = new Map(parsed.entries);
          this.currentSize = parsed.size || 0;
        }
      } catch (error) {
        console.warn("Failed to load cache from localStorage:", error);
      }
    }
  }

  /**
   * Генерация ключа для кеша
   */
  private generateKey(
    prefix: string,
    id: string,
    params?: Record<string, any>
  ): string {
    const paramString = params
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    return `${prefix}:${id}${paramString}`;
  }

  /**
   * Получение элемента из кеша
   */
  async get<T>(
    prefix: string,
    id: string,
    params?: Record<string, any>
  ): Promise<T | null> {
    const key = this.generateKey(prefix, id, params);

    // Стратегия Redis (сервер)
    if (this.redisClient) {
      const redisData = await this.redisClient.get(key);
      if (redisData) {
        this.stats.hits++;
        return JSON.parse(redisData) as T;
      }
      this.stats.misses++;
      return null;
    }

    // Клиентские стратегии
    // Проверка в памяти
    if (this.config.strategy !== "storage") {
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && this.isValidEntry(memoryEntry)) {
        this.updateAccessStats(memoryEntry);
        this.stats.hits++;
        return memoryEntry.data;
      }
    }

    // Проверка в хранилище
    if (this.config.strategy !== "memory") {
      const storageEntry = this.storageCache.get(key);
      if (storageEntry && this.isValidEntry(storageEntry)) {
        // Копируем в память для быстрого доступа
        if (this.config.strategy === "hybrid") {
          this.setMemoryCache(key, storageEntry);
        }
        this.updateAccessStats(storageEntry);
        this.stats.hits++;
        return storageEntry.data;
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Сохранение элемента в кеш
   */
  async set<T>(
    prefix: string,
    id: string,
    data: T,
    params?: Record<string, any>,
    size?: number
  ): Promise<void> {
    const key = this.generateKey(prefix, id, params);

    // Стратегия Redis (сервер)
    if (this.redisClient) {
      const jsonData = JSON.stringify(data);
      // Устанавливаем с TTL в секундах
      await this.redisClient.set(
        key,
        jsonData,
        "EX",
        Math.floor(this.config.maxAge / 1000)
      );
      this.stats.saves++;
      return;
    }

    // Клиентские стратегии
    const entrySize = size || this.calculateSize(data);

    // Проверка размера
    if (entrySize > this.config.maxSize) {
      console.warn(`Cache entry too large: ${entrySize} bytes`);
      return;
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      size: entrySize,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Сохранение в память
    if (this.config.strategy !== "storage") {
      this.setMemoryCache(key, entry);
    }

    // Сохранение в хранилище
    if (this.config.strategy !== "memory") {
      await this.setStorageCache(key, entry);
    }

    this.stats.saves++;
  }

  /**
   * Установка кеша в память
   */
  private setMemoryCache<T>(key: string, entry: CacheEntry<T>) {
    this.memoryCache.set(key, entry);
    this.currentSize += entry.size;

    // Очистка старых записей при превышении размера
    this.cleanupMemoryCache();
  }

  /**
   * Установка кеша в хранилище
   */
  private async setStorageCache<T>(key: string, entry: CacheEntry<T>) {
    this.storageCache.set(key, entry);
    this.currentSize += entry.size;

    // Сохранение в localStorage
    if (typeof window !== "undefined" && this.config.strategy === "hybrid") {
      try {
        const cacheData = {
          entries: Array.from(this.storageCache.entries()),
          size: this.currentSize,
        };
        localStorage.setItem("normaldance_cache", JSON.stringify(cacheData));
      } catch (error) {
        console.warn("Failed to save cache to localStorage:", error);
      }
    }

    // Очистка старых записей при превышении размера
    this.cleanupStorageCache();
  }

  /**
   * Проверка валидности записи
   */
  private isValidEntry(entry: CacheEntry<any>): boolean {
    const age = Date.now() - entry.timestamp;
    return age < this.config.maxAge;
  }

  /**
   * Обновление статистики доступа
   */
  private updateAccessStats(entry: CacheEntry<any>) {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
  }

  /**
   * Расчет размера данных
   */
  private calculateSize(data: unknown): number {
    try {
      const json = JSON.stringify(data);
      return new Blob([json]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Очистка кеша памяти
   */
  private cleanupMemoryCache() {
    if (this.currentSize > this.config.maxSize) {
      // Сортировка по времени последнего доступа
      const entries = Array.from(this.memoryCache.entries()).sort(
        ([, a], [, b]) => a.lastAccessed - b.lastAccessed
      );

      for (const [key, entry] of entries) {
        this.memoryCache.delete(key);
        this.currentSize -= entry.size;

        if (this.currentSize <= this.config.maxSize * 0.8) {
          break;
        }
      }

      this.stats.evictions++;
    }
  }

  /**
   * Очистка кеша хранилища
   */
  private cleanupStorageCache() {
    if (this.currentSize > this.config.maxSize) {
      // Сортировка по времени последнего доступа
      const entries = Array.from(this.storageCache.entries()).sort(
        ([, a], [, b]) => a.lastAccessed - b.lastAccessed
      );

      for (const [key, entry] of entries) {
        this.storageCache.delete(key);
        this.currentSize -= entry.size;

        if (this.currentSize <= this.config.maxSize * 0.8) {
          break;
        }
      }

      // Сохранение обновленного кеша
      if (typeof window !== "undefined" && this.config.strategy === "hybrid") {
        try {
          const cacheData = {
            entries: Array.from(this.storageCache.entries()),
            size: this.currentSize,
          };
          localStorage.setItem("normaldance_cache", JSON.stringify(cacheData));
        } catch (error) {
          console.warn("Failed to save updated cache to localStorage:", error);
        }
      }

      this.stats.evictions++;
    }
  }

  /**
   * Очистка всего кеша
   */
  async clear(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.flushdb();
    }
    this.memoryCache.clear();
    this.storageCache.clear();
    this.currentSize = 0;

    if (typeof window !== "undefined") {
      localStorage.removeItem("normaldance_cache");
    }

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      saves: 0,
    };
  }

  /**
   * Получение статистики кеша
   */
  getStats() {
    // Статистика для Redis может быть получена через команду INFO
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      currentSize: this.currentSize, // Для клиентского кеша
      maxSize: this.config.maxSize,
      entryCount: this.memoryCache.size + this.storageCache.size,
    };
  }

  /**
   * Предзагрузка данных
   */
  async preload<T>(
    prefix: string,
    id: string,
    params?: Record<string, any>
  ): Promise<void> {
    // В реальном приложении здесь будет логика предзагрузки
    console.log(`Preloading ${prefix}:${id}`);
  }
}

/**
 * Кеш для аудиофайлов
 */
class AudioCacheManager extends CacheManager {
  private audioConfig: AudioCacheConfig;

  constructor(config: AudioCacheConfig) {
    super(config);
    this.audioConfig = config;
  }

  /**
   * Кеширование аудиофайла
   */
  async cacheAudio(
    trackId: string,
    audioData: ArrayBuffer,
    quality: AudioCacheConfig["quality"] = this.audioConfig.quality
  ): Promise<void> {
    const key = `audio:${trackId}:${quality}`;
    const size = audioData.byteLength;

    await this.set("audio", trackId, audioData, { quality }, size);
  }

  /**
   * Получение закешированного аудиофайла
   */
  async getCachedAudio(
    trackId: string,
    quality: AudioCacheConfig["quality"] = this.audioConfig.quality
  ): Promise<ArrayBuffer | null> {
    return this.get<ArrayBuffer>("audio", trackId, { quality });
  }

  /**
   * Предзагрузка следующего трека
   */
  async preloadNextTrack(
    currentTrackId: string,
    nextTrackId: string
  ): Promise<void> {
    if (this.audioConfig.preload) {
      await this.preload("audio", nextTrackId);
    }
  }

  /**
   * Очистка старых аудиофайлов
   */
  async cleanupOldAudio(): Promise<void> {
    // В этой реализации очистка будет происходить автоматически через TTL
    // Этот метод оставлен для совместимости, но не используется напрямую
    console.log("Audio cleanup is handled automatically by TTL");
  }
}

/**
 * Кеш для API запросов
 */
class APICacheManager extends CacheManager {
  constructor(config: CacheConfig) {
    super(config);
  }

  /**
   * Кеширование API ответа
   */
<<<<<<< HEAD
  async cacheResponse(endpoint: string, params: Record<string, unknown>, data: unknown): Promise<void> {
    const key = `api:${endpoint}`
    await this.set('api', endpoint, data, params)
=======
  async cacheResponse(
    endpoint: string,
    params: Record<string, unknown>,
    data: unknown
  ): Promise<void> {
    const key = `api:${endpoint}`;
    await this.set("api", endpoint, data, params);
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
  }

  /**
   * Получение закешированного API ответа
   */
  async getCachedResponse(
    endpoint: string,
    params: Record<string, any>
  ): Promise<any | null> {
    return this.get("api", endpoint, params);
  }
}

/**
 * Кеш для пользовательских данных
 */
class UserCacheManager extends CacheManager {
  constructor(config: CacheConfig) {
    super(config);
  }

  /**
   * Кеширование профиля пользователя
   */
<<<<<<< HEAD
  async cacheUserProfile(userId: string, profile: Record<string, unknown>): Promise<void> {
    await this.set('user', userId, profile)
=======
  async cacheUserProfile(
    userId: string,
    profile: Record<string, unknown>
  ): Promise<void> {
    await this.set("user", userId, profile);
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
  }

  /**
   * Получение закешированного профиля
   */
  async getCachedUserProfile(userId: string): Promise<any | null> {
    return this.get("user", userId);
  }

  /**
   * Кеширование плейлистов
   */
  async cachePlaylists(userId: string, playlists: unknown[]): Promise<void> {
<<<<<<< HEAD
    await this.set('playlists', userId, playlists)
=======
    await this.set("playlists", userId, playlists);
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
  }

  /**
   * Получение закешированных плейлистов
   */
  async getCachedPlaylists(userId: string): Promise<any[] | null> {
    return this.get("playlists", userId);
  }
}

// Экспорт экземпляров кеша
export const audioCache = new AudioCacheManager({
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
  maxSize: 500 * 1024 * 1024, // 500MB
  strategy: "hybrid",
  quality: "medium",
  format: "mp3",
  preload: true,
});

// Кеш для API запросов
export const apiCache = new APICacheManager({
  maxAge: 5 * 60 * 1000, // 5 минут
  maxSize: 100 * 1024 * 1024, // 100MB
  strategy: typeof window === "undefined" ? "redis" : "memory", // Используем Redis на сервере, память на клиенте
});

// Кеш для часто используемых данных
export const commonDataCache = new APICacheManager({
  maxAge: 15 * 60 * 1000, // 15 минут
  maxSize: 50 * 1024 * 1024, // 50MB
  strategy: typeof window === "undefined" ? "redis" : "hybrid", // Используем Redis на сервере, гибрид на клиенте
});

// Кеш для треков
export const trackCache = new AudioCacheManager({
  maxAge: 24 * 60 * 60 * 1000, // 24 часа
  maxSize: 200 * 1024 * 1024, // 200MB
  strategy: "hybrid",
  quality: "medium",
  format: "mp3",
  preload: true,
});

export const userCache = new UserCacheManager({
  maxAge: 30 * 60 * 1000, // 30 минут
  maxSize: 50 * 1024 * 1024, // 50MB
  strategy: "memory",
});

// Утилиты для кеширования
export const cacheUtils = {
  /**
   * Дебаунс функция с кешированием
   */
  debounceWithCache<T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number,
    cacheKey: string
  ): T {
<<<<<<< HEAD
    let timeoutId: NodeJS.Timeout
    let lastCall = 0
    
    return ((...args: Parameters<T>) => {
      const now = Date.now()
      
=======
    let timeoutId: NodeJS.Timeout;
    let lastCall = 0;

    return ((...args: Parameters<T>) => {
      const now = Date.now();

>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
      if (now - lastCall < delay) {
        return Promise.resolve(null);
      }

      lastCall = now;

      clearTimeout(timeoutId);

      return new Promise((resolve) => {
        timeoutId = setTimeout(() => {
          const result = func(...args);
          resolve(result);
        }, delay);
      });
    }) as T;
  },

  /**
   * Кеширование результата функции
   */
  memoize<T extends (...args: unknown[]) => unknown>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, unknown>();

    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },
};

export default CacheManager;
