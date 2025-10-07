# План улучшения архитектуры базы данных

## Обзор

В этом документе описывается план улучшения архитектуры базы данных проекта NormalDance. Это улучшение имеет средний приоритет для Q2 2025 года, так как обеспечивает поддержку масштабирования и улучшает производительность запросов.

## Текущая ситуация

### Существующая архитектура базы данных

- Используется SQLite через Prisma
- Базовая схема данных
- Отсутствие продвинутого кэширования
- Нет оптимизации запросов

### Проблемы текущей реализации

- Ограниченная масштабируемость SQLite
- Медленные запросы при увеличении данных
- Отсутствие кэширования
- Нет репликации для масштабирования чтения

## Цели реализации

### Основные цели

- Миграция на более масштабируемую базу данных
- Оптимизация структуры базы данных
- Добавление кэширования через Redis
- Настройка репликации для масштабирования чтения

### Технические цели

- Оптимизация схемы базы данных
- Добавление индексов для частых запросов
- Реализация кэширования через Redis
- Настройка репликации для масштабирования

## План реализации

### Этап 1: Анализ и проектирование (Неделя 1-3)

- Анализ текущей схемы данных
- Проектирование новой схемы
- Подготовка миграций
- Настройка тестовой среды

### Этап 2: Миграция на PostgreSQL (Неделя 4-6)

- Настройка PostgreSQL
- Перенос данных из SQLite
- Обновление Prisma-схемы
- Тестирование миграции

### Этап 3: Оптимизация схемы (Неделя 7-8)

- Добавление индексов
- Оптимизация структуры таблиц
- Реализация партиционирования
- Тестирование производительности

### Этап 4: Внедрение кэширования (Неделя 9-10)

- Настройка Redis
- Реализация кэширования запросов
- Интеграция с приложением
- Тестирование кэширования

### Этап 5: Репликация и масштабирование (Неделя 11)

- Настройка репликации PostgreSQL
- Оптимизация для чтения/записи
- Мониторинг после внедрения
- Обновление документации

## Технические детали

### Миграция на PostgreSQL

#### Обновление Prisma-схемы

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String    @id @default(cuid())
  telegramId     String?   @unique
  solanaAddress  String?   @unique
  username       String?
  email          String?   @unique
  avatar         String?
  bio            String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  // Индексы для оптимизации запросов
  @@index([telegramId])
  @@index([solanaAddress])
  @@index([createdAt])
}

model Track {
  id           String   @id @default(cuid())
  title        String
  description  String?
  coverImage   String
  audioUrl     String
  artistId     String
  artist       User     @relation(fields: [artistId], references: [id], onDelete: Cascade)
  genre        String?
  duration     Int      // в секундах
  releaseDate  DateTime @default(now())
  price        Decimal?
  isNFT        Boolean  @default(false)
  nftContract  String?
  metadata     Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([artistId])
  @@index([genre])
  @@index([releaseDate])
  @@index([createdAt])
}

model NFTMemorial {
  id         String         @id @default(cuid())
  memorialId String         @unique
  owner      String
  metadata   Json
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  track      Track?
  trackId    String?

  @@index([owner])
  @@index([createdAt])
}
```

#### Конфигурация PostgreSQL

```env
# .env.production
DATABASE_URL="postgresql://username:password@host:port/database_name?schema=public&sslmode=prefer"
DIRECT_URL="postgresql://username:password@host:port/database_name?schema=public&sslmode=prefer"
```

### Оптимизация запросов

#### Добавление индексов для частых запросов

```sql
-- Индексы для таблицы Track
CREATE INDEX CONCURRENTLY idx_tracks_artist_id ON tracks (artist_id);
CREATE INDEX CONCURRENTLY idx_tracks_genre ON tracks (genre);
CREATE INDEX CONCURRENTLY idx_tracks_release_date ON tracks (release_date DESC);
CREATE INDEX CONCURRENTLY idx_tracks_created_at ON tracks (created_at DESC);

-- Индексы для таблицы User
CREATE INDEX CONCURRENTLY idx_users_telegram_id ON users (telegram_id);
CREATE INDEX CONCURRENTLY idx_users_solana_address ON users (solana_address);

-- Составной индекс для популярных запросов
CREATE INDEX CONCURRENTLY idx_tracks_artist_genre ON tracks (artist_id, genre);
```

#### Оптимизация запросов с использованием Prisma

```typescript
// src/lib/db/optimized-queries.ts

// Оптимизированный запрос для получения треков артиста
export async function getArtistTracks(
  artistId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  return await prisma.track.findMany({
    where: { artistId },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    // Только нужные поля для уменьшения объема данных
    select: {
      id: true,
      title: true,
      coverImage: true,
      duration: true,
      releaseDate: true,
      price: true,
      isNFT: true,
    },
  });
}

// Оптимизированный запрос для получения популярных треков
export async function getPopularTracks(genre?: string, limit: number = 50) {
  const whereClause: any = { isNFT: false }; // Исключаем NFT из популярных треков

  if (genre) {
    whereClause.genre = genre;
  }

  return await prisma.track.findMany({
    where: whereClause,
    orderBy: [
      { releaseDate: "desc" }, // Сначала по дате
      { createdAt: "desc" }, // Потом по времени создания
    ],
    take: limit,
    select: {
      id: true,
      title: true,
      coverImage: true,
      duration: true,
      artist: {
        select: {
          username: true,
          avatar: true,
        },
      },
    },
  });
}
```

### Кэширование через Redis

#### Конфигурация Redis

```typescript
// src/lib/redis.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Или для локальной разработки
// import Redis from 'ioredis';
// export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
```

#### Реализация кэширования запросов

```typescript
// src/lib/cache/db-cache.ts
import { redis } from "@/lib/redis";
import { Prisma } from "@prisma/client";

export class DBCache {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  static async set<T>(
    key: string,
    value: T,
    ttl: number = 3600
  ): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), { ex: ttl });
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error("Cache del error:", error);
    }
  }

  // Кэширование результатов Prisma-запросов
  static async getCachedQuery<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    // Попытка получить из кэша
    let result = await this.get<T>(cacheKey);

    if (!result) {
      // Выполнение запроса, если в кэше нет
      result = await queryFn();
      // Сохранение в кэш
      await this.set(cacheKey, result, ttl);
    }

    return result;
  }
}

// Использование в сервисах
export async function getCachedPopularTracks(genre?: string) {
  const cacheKey = `popular_tracks:${genre || "all"}`;

  return await DBCache.getCachedQuery(
    cacheKey,
    () => getPopularTracks(genre),
    600 // 10 минут
  );
}
```

### Интеграция кэширования с API

#### API-эндпоинт с кэшированием

```typescript
// src/app/api/tracks/popular/route.ts
import { NextRequest } from "next/server";
import { getCachedPopularTracks } from "@/lib/cache/db-cache";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get("genre");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const tracks = await getCachedPopularTracks(genre);

    return new Response(JSON.stringify(tracks), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=600", // 10 минут кэширования на уровне CDN
      },
    });
  } catch (error) {
    console.error("Error fetching popular tracks:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
```

### Репликация базы данных

#### Настройка репликации PostgreSQL

```typescript
// src/lib/db.ts - обновленная конфигурация для репликации
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Определение URL для записи и чтения
const PRIMARY_DATABASE_URL = process.env.DATABASE_URL;
const REPLICA_DATABASE_URL =
  process.env.READ_DATABASE_URL || PRIMARY_DATABASE_URL;

// Создание клиентов для записи и чтения
const createPrismaClient = (url: string) => {
  return new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
    log: ["query", "info", "warn", "error"],
  });
};

// Клиент для записи
const primaryClient =
  global.prisma || createPrismaClient(PRIMARY_DATABASE_URL!);

// Клиент для чтения
const replicaClient = createPrismaClient(REPLICA_DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  global.prisma = primaryClient;
}

// Экспорт клиентов
export const db = {
  write: primaryClient,
  read: replicaClient,
};

// Использование в сервисах
export async function getTracksForUser(userId: string) {
  // Использование реплики для чтения
  return await db.read.track.findMany({
    where: { artistId: userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTrack(data: any) {
  // Использование основной базы для записи
  return await db.write.track.create({
    data,
  });
}
```

## Риски и меры по их снижению

### Риск 1: Потеря данных при миграции

- **Мера**: Создание резервных копий перед миграцией
- **Мера**: Тестирование миграции в изолированной среде

### Риск 2: Простой сервиса во время миграции

- **Мера**: Постепенная миграция с минимальным временем простоя
- **Мера**: Использование стратегии "синий-зеленый" развертывания

### Риск 3: Проблемы с производительностью

- **Мера**: Тестирование производительности до и после
- **Мера**: Мониторинг ключевых метрик

## Критерии успеха

- Успешная миграция данных
- Улучшенная производительность запросов
- Поддержка масштабирования
- Надежность и отказоустойчивость
- Минимальное время простоя во время миграции

## Ресурсы

- 2-3 разработчика на 11 недель
- DevOps-инженер для настройки инфраструктуры
- QA-инженер для тестирования

## Сроки

- Начало: 15 марта 2025
- Завершение: 20 мая 2025
- Общее время: 11 недель
