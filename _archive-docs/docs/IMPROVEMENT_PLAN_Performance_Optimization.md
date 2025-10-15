# ⚡ План оптимизации производительности NORMAL DANCE

## 🎯 Цель

Оптимизировать производительность платформы NORMAL DANCE для улучшения пользовательского опыта, снижения времени загрузки и повышения эффективности использования ресурсов.

## 📋 Текущее состояние

### Оптимизации в конфигурации

- Включена оптимизация изображений (WebP, AVIF)
- Настроена оптимизация CSS и импортов пакетов
- Включено сжатие для продакшена
- Настроены заголовки кэширования

### Проблемы

1. Ограниченные оптимизации изображений (только форматы, нет ленивой загрузки)
2. Отсутствует продвинутая ленивая загрузка компонентов
3. Нет оптимизации шрифтов
4. Отсутствует кэширование данных на клиенте
5. Нет оптимизации рендеринга (memoization, virtualization)
6. Отсутствует предзагрузка критических ресурсов
7. Нет оптимизации сборки для разных типов устройств

## 📈 План улучшения

### 1. Расширенная оптимизация изображений

#### Проблема

Текущая реализация ProgressiveImage базовая и не использует возможности Next.js Image.

#### Решение

Создать продвинутый компонент изображений с ленивой загрузкой, адаптивными размерами и предзагрузкой.

#### Реализация:

```typescript
// src/components/ui/advanced-image.tsx
"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";

interface AdvancedImageProps extends Omit<ImageProps, "src" | "placeholder"> {
  src: string;
  placeholderSrc?: string;
  lazy?: boolean;
  priority?: boolean;
  preload?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  // Адаптивные размеры для разных устройств
  responsiveSizes?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

const AdvancedImage: React.FC<AdvancedImageProps> = ({
  src,
  placeholderSrc,
  lazy = true,
  priority = false,
  preload = false,
  onLoad,
  onError,
  sizes,
  responsiveSizes,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Используем Intersection Observer для ленивой загрузки
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: "50px 0px",
  });

  // Определяем размеры для разных устройств
  const getSizes = () => {
    if (sizes) return sizes;

    if (responsiveSizes) {
      const mobile = responsiveSizes.mobile || 400;
      const tablet = responsiveSizes.tablet || 600;
      const desktop = responsiveSizes.desktop || 800;

      return `(max-width: 768px) ${mobile}px, (max-width: 1024px) ${tablet}px, ${desktop}px`;
    }

    // Дефолтные размеры
    return "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw";
  };

  // Обработка ошибок загрузки
  const handleError = () => {
    setHasError(true);
    if (onError) onError();
  };

  // Обработка успешной загрузки
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // Предзагрузка критических изображений
  useEffect(() => {
    if (preload && typeof window !== "undefined") {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [preload, src]);

  // Если есть ошибка, показываем placeholder
  if (hasError) {
    return (
      <div
        ref={ref}
        className={`bg-gray-200 border-2 border-dashed rounded-xl w-full h-full flex items-center justify-center ${
          props.className || ""
        }`}
      >
        <span className="text-gray-500 text-sm">Image unavailable</span>
      </div>
    );
  }

  // Для ленивой загрузки показываем placeholder пока изображение не в зоне видимости
  if (lazy && !inView && !priority) {
    return (
      <div
        ref={ref}
        className={`bg-gray-100 rounded-xl w-full h-full flex items-center justify-center overflow-hidden ${
          props.className || ""
        }`}
      >
        {placeholderSrc ? (
          <img
            src={placeholderSrc}
            alt={props.alt || ""}
            className="w-full h-full object-cover blur-sm"
          />
        ) : (
          <div className="animate-pulse bg-gray-200 w-full h-full" />
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${props.className || ""}`}
    >
      <Image
        {...props}
        src={src}
        alt={props.alt || ""}
        sizes={getSizes()}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        className={`${props.className || ""} ${
          isLoaded ? "opacity-100 blur-0" : "opacity-80 blur-sm"
        } transition-all duration-300`}
        style={{
          ...props.style,
          transition: "opacity 0.3s ease, filter 0.3s ease",
        }}
      />

      {/* Индикатор загрузки */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      )}
    </div>
  );
};

export default AdvancedImage;
```

#### Улучшенная конфигурация Next.js для изображений:

```typescript
// next.config.ts (улучшенная версия)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... существующая конфигурация ...

  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [320, 420, 768, 1024, 1200, 1600, 1920, 2560],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 год
    domains: [
      "ipfs.io",
      "gateway.pinata.cloud",
      "cloudflare-ipfs.com",
      "localhost",
      "normaldance.com",
      "www.normaldance.com",
    ],
    // Добавляем оптимизацию для удаленных изображений
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.ipfs.io",
        port: "",
      },
      {
        protocol: "https",
        hostname: "*.pinata.cloud",
        port: "",
      },
      {
        protocol: "https",
        hostname: "cloudflare-ipfs.com",
        port: "",
      },
    ],
  },

  // ... остальная конфигурация ...
};

export default nextConfig;
```

### 2. Продвинутая ленивая загрузка компонентов

#### Проблема

Базовая ленивая загрузка без обработки ошибок и предзагрузки.

#### Решение

Создать улучшенную систему ленивой загрузки с обработкой ошибок, предзагрузкой и индикаторами загрузки.

#### Реализация:

```typescript
// src/lib/advanced-lazy-loading.ts
import { lazy, ComponentType, ReactElement } from "react";

interface LazyOptions {
  fallback?: ReactElement;
  errorFallback?: ReactElement;
  preload?: boolean;
  delay?: number;
}

// Улучшенная функция ленивой загрузки
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyOptions = {}
) => {
  const {
    fallback = (
      <div className="animate-pulse bg-gray-200 rounded-lg h-32 w-full" />
    ),
    errorFallback = (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Failed to load component
      </div>
    ),
    preload = false,
    delay = 150,
  } = options;

  // Предзагрузка модуля
  if (preload) {
    importFn().catch((err) => {
      console.warn("Preload failed:", err);
    });
  }

  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      // Добавляем минимальную задержку для лучшего UX
      const delayPromise = new Promise((resolve) => setTimeout(resolve, delay));

      Promise.all([importFn(), delayPromise])
        .then(([module]) => {
          resolve(module);
        })
        .catch((error) => {
          console.error("Lazy load error:", error);
          // Возвращаем fallback компонент в случае ошибки
          resolve({
            default: () => errorFallback,
          } as any);
        });
    });
  });
};

// Функция для предзагрузки модулей
export const preloadModule = (importFn: () => Promise<any>) => {
  return importFn().catch((err) => {
    console.warn("Preload failed:", err);
  });
};

// Хук для наблюдения за элементами в зоне видимости
export const useIntersectionObserver = (
  threshold: number = 0.1,
  rootMargin: string = "50px"
) => {
  // Реализация Intersection Observer хука
  // В реальной реализации будет использовать react-intersection-observer
  return { ref: null, inView: false };
};
```

#### Использование в приложении:

```typescript
// src/app/page.tsx (улучшенная версия)
import { Suspense } from "react";
import { createLazyComponent } from "@/lib/advanced-lazy-loading";

// Ленивая загрузка тяжелых компонентов
const AudioPlayer = createLazyComponent(
  () => import("@/components/audio/audio-player"),
  {
    fallback: <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />,
    errorFallback: (
      <div className="h-20 bg-red-100 rounded-lg flex items-center justify-center">
        Failed to load audio player
      </div>
    ),
    preload: true,
  }
);

const TrackCard = createLazyComponent(
  () => import("@/components/audio/track-card"),
  {
    fallback: <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />,
  }
);

export default function Home() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* ... существующий контент ... */}

        {/* Лениво загружаемый аудиоплеер */}
        <Suspense
          fallback={
            <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          }
        >
          <AudioPlayer />
        </Suspense>
      </div>
    </MainLayout>
  );
}
```

### 3. Оптимизация рендеринга

#### Проблема

Отсутствует мемоизация и виртуализация списков.

#### Решение

Реализовать мемоизацию компонентов и виртуализацию длинных списков.

#### Реализация:

```typescript
// src/lib/rendering-optimizations.ts
import { memo, useMemo, useCallback } from "react";

// Хук для мемоизации сложных вычислений
export const useHeavyComputation = <T>(
  computeFn: () => T,
  dependencies: any[]
): T => {
  return useMemo(() => {
    console.time("Heavy computation");
    const result = computeFn();
    console.timeEnd("Heavy computation");
    return result;
  }, dependencies);
};

// Хук для мемоизации обработчиков событий
export const useEventCallback = <T extends (...args: any[]) => any>(
  callback: T
): T => {
  return useCallback(callback, []);
};

// Компонент для виртуализации списков
import { useState, useEffect, useRef } from "react";

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export const VirtualList = <T>({
  items,
  itemHeight,
  renderItem,
  overscan = 5,
  className = "",
}: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    if (!containerRef.current) return { start: 0, end: 0 };

    const containerHeight = containerRef.current.clientHeight;
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { start, end };
  }, [scrollTop, items.length, itemHeight, overscan]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;
  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            width: "100%",
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.start + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Мемоизированный компонент трека
import { memo } from "react";

interface TrackCardProps {
  track: any;
  onPlay?: () => void;
  onLike?: () => void;
}

const TrackCardComponent: React.FC<TrackCardProps> = ({
  track,
  onPlay,
  onLike,
}) => {
  // Мемоизируем сложные вычисления
  const formattedDuration = useMemo(() => {
    const minutes = Math.floor(track.duration / 60);
    const seconds = track.duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [track.duration]);

  // Мемоизируем обработчики
  const handlePlay = useCallback(() => {
    onPlay?.();
  }, [onPlay]);

  const handleLike = useCallback(() => {
    onLike?.();
  }, [onLike]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* ... существующий JSX ... */}
    </div>
  );
};

// Экспортируем мемоизированную версию
export const TrackCard = memo(TrackCardComponent);
```

### 4. Кэширование данных

#### Проблема

Отсутствует клиентское кэширование данных.

#### Решение

Реализовать систему кэширования с TTL и инвалидацией.

#### Реализация:

```typescript
// src/lib/data-cache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // время жизни в миллисекундах
}

class DataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Запускаем периодическую очистку устаревших записей
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Каждую минуту
  }

  // Получение данных из кэша
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Проверяем, не истекло ли время жизни
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Сохранение данных в кэш
  set<T>(key: string, data: T, ttl: number = 300000): void {
    // 5 минут по умолчанию
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  // Инвалидация кэша по ключу
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  // Инвалидация кэша по паттерну
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  // Очистка устаревших записей
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  // Получение статистики кэша
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Очистка всего кэша
  clear(): void {
    this.cache.clear();
  }

  // Остановка периодической очистки
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Глобальный экземпляр кэша
export const dataCache = new DataCache();

// Хук для использования кэша в React компонентах
import { useState, useEffect } from "react";

export const useCachedData = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300000
): { data: T | null; loading: boolean; error: Error | null } => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Проверяем кэш
    const cachedData = dataCache.get<T>(key);

    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    // Загружаем данные
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetchFn();
        dataCache.set(key, result, ttl);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key, fetchFn, ttl]);

  return { data, loading, error };
};

// Утилита для инвалидации кэша при мутациях
export const invalidateCacheOnMutation = (mutationKey: string) => {
  // Инвалидируем связанные кэши
  const patternsToInvalidate = ["tracks", "playlists", "user", "search"];

  patternsToInvalidate.forEach((pattern) => {
    if (mutationKey.includes(pattern)) {
      dataCache.invalidatePattern(pattern);
    }
  });
};
```

#### Использование в API клиентах:

```typescript
// src/lib/api-client.ts
import { dataCache, invalidateCacheOnMutation } from "./data-cache";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // GET запрос с кэшированием
  async get<T>(endpoint: string, cacheTtl: number = 300000): Promise<T> {
    const cacheKey = `GET:${this.baseUrl}${endpoint}`;

    // Проверяем кэш
    const cached = dataCache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    // Выполняем запрос
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Сохраняем в кэш
    dataCache.set(cacheKey, data, cacheTtl);

    return data;
  }

  // POST запрос с инвалидацией кэша
  async post<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Инвалидируем связанные кэши
    invalidateCacheOnMutation(`POST:${endpoint}`);

    return data;
  }

  // PUT запрос с инвалидацией кэша
  async put<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Инвалидируем связанные кэши
    invalidateCacheOnMutation(`PUT:${endpoint}`);

    return data;
  }

  // DELETE запрос с инвалидацией кэша
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Инвалидируем связанные кэши
    invalidateCacheOnMutation(`DELETE:${endpoint}`);

    return data;
  }
}

export const apiClient = new ApiClient("/api");
```

### 5. Оптимизация сборки

#### Проблема

Отсутствует оптимизация сборки для разных типов устройств.

#### Решение

Настроить дифференциальную сборку и code splitting.

#### Реализация:

```javascript
// next.config.js (улучшенная версия)
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... существующая конфигурация ...

  // Оптимизация webpack
  webpack: (config, { dev, isServer }) => {
    // Оптимизация для продакшена
    if (!dev && !isServer) {
      // Split chunks для лучшего кэширования
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            minChunks: 2,
            chunks: "all",
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };

      // Runtime chunk для лучшего кэширования
      config.optimization.runtimeChunk = "single";

      // Минификация
      config.optimization.minimize = true;
      config.optimization.minimizer = [
        ...config.optimization.minimizer,
        // Добавление оптимизатора для CSS
        require("css-minimizer-webpack-plugin"),
      ];
    }

    // Оптимизация для изображений
    config.module.rules.push({
      test: /\.(jpe?g|png|webp|gif|svg)$/i,
      type: "asset/resource",
      generator: {
        filename: "images/[hash][ext][query]",
      },
    });

    // Оптимизация для шрифтов
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: "asset/resource",
      generator: {
        filename: "fonts/[hash][ext][query]",
      },
    });

    // Add fallback for node-specific modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },

  // Оптимизация экспериментальных функций
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "@solana/web3.js",
      "@solana/wallet-adapter-react",
    ],
    serverActions: {},
    // Включаем оптимизацию для больших приложений
    largePageDataBytes: 256 * 1000, // 256KB
  },

  // Оптимизация изображений
  images: {
    // ... существующая конфигурация ...
    // Добавляем оптимизацию для удаленных изображений
    unoptimized: false, // Включаем оптимизацию
  },

  // Оптимизация компиляции
  swcMinify: true,

  // Оптимизация для Vercel
  poweredByHeader: false,
  compress: true,

  // Оптимизация заголовков
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Cache control для статических ресурсов
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          // Предзагрузка критических ресурсов
          {
            key: "Link",
            value:
              "</fonts/inter-var-latin.woff2>; rel=preload; as=font; type=font/woff2; crossorigin",
          },
        ],
      },
      // Оптимизация для API routes
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
```

### 6. Мониторинг производительности

#### Проблема

Отсутствует мониторинг производительности в реальном времени.

#### Решение

Реализовать систему мониторинга Core Web Vitals и пользовательских метрик.

#### Реализация:

```typescript
// src/lib/performance-monitoring.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

// Типы для метрик
interface PerformanceMetric {
  name: string;
  value: number;
  id: string;
  navigationType?: string;
  entries?: PerformanceEntry[];
}

// Класс для мониторинга производительности
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: MutationObserver[] = [];

  // Запуск мониторинга Web Vitals
  startWebVitalsMonitoring() {
    if (typeof window !== "undefined") {
      getCLS(this.sendToAnalytics);
      getFID(this.sendToAnalytics);
      getFCP(this.sendToAnalytics);
      getLCP(this.sendToAnalytics);
      getTTFB(this.sendToAnalytics);
    }
  }

  // Отправка метрик в аналитику
  private sendToAnalytics = (metric: PerformanceMetric) => {
    this.metrics.push(metric);

    // Отправляем в аналитику (например, Vercel Analytics)
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", metric.name, {
        value: Math.round(
          metric.name === "CLS" ? metric.value * 1000 : metric.value
        ),
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // Также отправляем на наш сервер для мониторинга
    this.sendToServer(metric);
  };

  // Отправка метрик на сервер
  private async sendToServer(metric: PerformanceMetric) {
    try {
      await fetch("/api/analytics/performance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metric,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "",
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.warn("Failed to send performance metric:", error);
    }
  }

  // Мониторинг времени до интерактивности
  measureTimeToInteractive() {
    if (typeof window !== "undefined") {
      const startTime = performance.now();

      const checkInteractive = () => {
        if (document.readyState === "complete") {
          const tti = performance.now() - startTime;
          this.sendToAnalytics({
            name: "TTI",
            value: tti,
            id: `tti-${Date.now()}`,
          });
        } else {
          setTimeout(checkInteractive, 100);
        }
      };

      checkInteractive();
    }
  }

  // Мониторинг FPS
  monitorFPS() {
    if (typeof window !== "undefined") {
      let frameCount = 0;
      let lastTime = performance.now();
      let fps = 0;

      const measureFPS = () => {
        frameCount++;
        const currentTime = performance.now();

        if (currentTime - lastTime >= 1000) {
          fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
          frameCount = 0;
          lastTime = currentTime;

          // Отправляем метрику FPS если ниже порога
          if (fps < 30) {
            this.sendToAnalytics({
              name: "LowFPS",
              value: fps,
              id: `fps-${Date.now()}`,
            });
          }
        }

        requestAnimationFrame(measureFPS);
      };

      requestAnimationFrame(measureFPS);
    }
  }

  // Мониторинг использования памяти
  monitorMemoryUsage() {
    if (typeof window !== "undefined" && (performance as any).memory) {
      const memory = (performance as any).memory;

      setInterval(() => {
        this.sendToAnalytics({
          name: "MemoryUsage",
          value: memory.usedJSHeapSize,
          id: `memory-${Date.now()}`,
        });

        // Предупреждаем о высоком использовании памяти
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
          this.sendToAnalytics({
            name: "HighMemoryUsage",
            value: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
            id: `high-memory-${Date.now()}`,
          });
        }
      }, 30000); // Каждые 30 секунд
    }
  }

  // Мониторинг ошибок скриптов
  monitorScriptErrors() {
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        this.sendToAnalytics({
          name: "ScriptError",
          value: 1,
          id: `script-error-${Date.now()}`,
          entries: [
            {
              name: event.error?.message || "Unknown script error",
              entryType: "error",
            } as PerformanceEntry,
          ],
        });
      });
    }
  }

  // Получение всех собранных метрик
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Очистка ресурсов
  destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Глобальный экземпляр монитора производительности
export const performanceMonitor = new PerformanceMonitor();

// Хук для использования в React компонентах
import { useEffect } from "react";

export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Запускаем мониторинг при монтировании
    performanceMonitor.startWebVitalsMonitoring();
    performanceMonitor.measureTimeToInteractive();
    performanceMonitor.monitorFPS();
    performanceMonitor.monitorMemoryUsage();
    performanceMonitor.monitorScriptErrors();

    // Очищаем при размонтировании
    return () => {
      performanceMonitor.destroy();
    };
  }, []);
};

// Компонент для отображения метрик производительности в dev режиме
import { useState, useEffect } from "react";

export const PerformanceDevTools: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const interval = setInterval(() => {
        setMetrics(performanceMonitor.getMetrics());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50 max-w-xs">
      <h3 className="font-bold mb-2">Performance Metrics</h3>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {metrics.slice(-10).map((metric, index) => (
          <div key={index} className="flex justify-between">
            <span>{metric.name}:</span>
            <span className="font-mono">{metric.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 📅 План реализации

### Неделя 1

- [ ] Реализовать продвинутый компонент изображений
- [ ] Настроить оптимизацию изображений в Next.js
- [ ] Реализовать систему ленивой загрузки компонентов
- [ ] Добавить мемоизацию критических компонентов

### Неделя 2

- [ ] Реализовать систему кэширования данных
- [ ] Интегрировать кэширование в API клиенты
- [ ] Добавить виртуализацию длинных списков
- [ ] Оптимизировать сборку с code splitting

### Неделя 3

- [ ] Настроить мониторинг Core Web Vitals
- [ ] Реализовать систему отслеживания пользовательских метрик
- [ ] Добавить мониторинг производительности в реальном времени
- [ ] Создать дашборды производительности

### Неделя 4

- [ ] Провести аудит текущей производительности
- [ ] Оптимизировать критические пути загрузки
- [ ] Настроить предзагрузку критических ресурсов
- [ ] Создать документацию по оптимизациям

## 📊 Метрики успеха

- Снижение времени загрузки страниц на 40%
- Увеличение Core Web Vitals оценки до 90+
- Снижение объема JavaScript бандла на 30%
- Увеличение First Contentful Paint (FCP) на 50%
- Снижение Largest Contentful Paint (LCP) до 2.5 секунд
- Увеличение кэширования ресурсов до 85%

## 🛠️ Инструменты

- Next.js Image Optimization
- React.lazy и Suspense
- Webpack Bundle Analyzer
- Lighthouse для аудита производительности
- Web Vitals библиотека
- React Developer Tools
- Chrome DevTools Performance Panel
