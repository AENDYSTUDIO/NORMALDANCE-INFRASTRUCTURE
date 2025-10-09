# План системы рекомендаций на основе ИИ

## Обзор

В этом документе описывается план реализации более продвинутой системы рекомендаций на основе ИИ проекта NormalDance. Это улучшение имеет средний приоритет для Q2-Q3 2025 года, так как обеспечивает персонализированный контент для пользователей и увеличивает время прослушивания.

## Текущая ситуация

### Существующая система рекомендаций

- Базовая система на основе жанров
- Отсутствие ИИ-алгоритмов
- Нет персонализированных плейлистов
- Ограниченная аналитика эффективности

### Проблемы текущей реализации

- Нерелевантный контент для пользователей
- Отсутствие персонализации
- Нет машинного обучения
- Нет аналитики эффективности рекомендаций

## Цели реализации

### Основные цели

- Разработка алгоритма рекомендаций на основе ИИ
- Интеграция с ML-сервисами
- Реализация персонализированных плейлистов
- Настройка аналитики эффективности рекомендаций

### Технические цели

- Использование современных ML-алгоритмов
- Обработка больших объемов данных
- Реализация персонализированных рекомендаций
- Интеграция с существующей системой

## План реализации

### Этап 1: Анализ и выбор алгоритмов (Неделя 1-2)

- Анализ пользовательского поведения
- Выбор ML-алгоритмов для рекомендаций
- Подготовка архитектуры системы
- Создание прототипа

### Этап 2: Подготовка данных (Неделя 3-4)

- Сбор исторических данных
- Подготовка датасета для обучения
- Очистка и нормализация данных
- Создание векторов признаков

### Этап 3: Разработка модели (Неделя 5-7)

- Реализация алгоритма рекомендаций
- Обучение модели
- Тестирование эффективности
- Оптимизация алгоритма

### Этап 4: Интеграция (Неделя 8-9)

- Интеграция с API платформы
- Создание персонализированных плейлистов
- Реализация интерфейса рекомендаций
- Тестирование интеграции

### Этап 5: Внедрение и мониторинг (Неделя 10)

- Постепенное внедрение системы
- Мониторинг эффективности
- Обновление документации
- Оптимизация по результатам

## Технические детали

### Архитектура системы рекомендаций

#### Структура проекта

```
src/
├── ai/
│   ├── models/
│   ├── services/
│   ├── utils/
│   └── types/
├── lib/
│   └── recommendation-engine.ts
└── app/
    └── api/
        └── recommendations/
```

#### Основные зависимости

```bash
npm install @tensorflow/tfjs-node
npm install scikit-learn-ts
npm install natural
npm install @xenova/transformers
```

### Подготовка данных

#### Сбор и обработка данных пользователя

```typescript
// src/ai/types/recommendation-types.ts
export interface UserBehavior {
  userId: string;
  trackId: string;
  listenedPercentage: number;
  listenDuration: number;
  timestamp: Date;
  completed: boolean;
  skipped: boolean;
}

export interface TrackFeatures {
  id: string;
  genre: string;
  artist: string;
  duration: number;
  releaseDate: Date;
  popularity: number;
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  speechiness: number;
  valence: number;
  tempo: number;
}

export interface RecommendationContext {
  userId: string;
  currentTrack?: string;
  timeOfDay: number;
  dayOfWeek: number;
  listeningHistory: UserBehavior[];
  likedTracks: string[];
  dislikedTracks: string[];
  preferredGenres: string[];
  listeningPatterns: {
    timeOfDay: Record<number, number>;
    dayOfWeek: Record<number, number>;
    genrePreferences: Record<string, number>;
  };
}
```

#### Сервис сбора данных

```typescript
// src/ai/services/data-collection-service.ts
import { prisma } from "@/lib/db";
import { UserBehavior, TrackFeatures } from "../types/recommendation-types";

export class DataCollectionService {
  static async getUserListeningHistory(
    userId: string,
    limit: number = 100
  ): Promise<UserBehavior[]> {
    const history = await prisma.playHistory.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 1000), // За последние 30 дней
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
      include: {
        track: true,
      },
    });

    return history.map((record) => ({
      userId: record.userId,
      trackId: record.trackId,
      listenedPercentage: record.listenedPercentage || 0,
      listenDuration: record.duration || 0,
      timestamp: record.timestamp,
      completed: (record.listenedPercentage || 0) > 0.8,
      skipped: (record.listenedPercentage || 0) < 0.1,
    }));
  }

  static async getTrackFeatures(trackId: string): Promise<TrackFeatures> {
    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }

    // В реальном приложении эти данные будут получены из аудиоанализа
    return {
      id: track.id,
      genre: track.genre || "unknown",
      artist: track.artistId,
      duration: track.duration || 180,
      releaseDate: track.releaseDate,
      popularity: track.popularity || 0,
      acousticness: Math.random(),
      danceability: Math.random(),
      energy: Math.random(),
      instrumentalness: Math.random(),
      liveness: Math.random(),
      loudness: -20 + Math.random() * 20,
      speechiness: Math.random(),
      valence: Math.random(),
      tempo: 60 + Math.random() * 120,
    };
  }

  static async getUserPreferences(userId: string) {
    const history = await this.getUserListeningHistory(userId, 200);

    // Анализ предпочтений пользователя
    const genrePreferences: Record<string, number> = {};
    let totalListens = 0;

    for (const record of history) {
      if (record.completed) {
        const trackFeatures = await this.getTrackFeatures(record.trackId);
        const genre = trackFeatures.genre;

        genrePreferences[genre] = (genrePreferences[genre] || 0) + 1;
        totalListens++;
      }
    }

    // Нормализация предпочтений
    Object.keys(genrePreferences).forEach((genre) => {
      genrePreferences[genre] = genrePreferences[genre] / totalListens;
    });

    return {
      genrePreferences,
      listeningPatterns: this.calculateListeningPatterns(history),
    };
  }

  private static calculateListeningPatterns(history: UserBehavior[]) {
    const timeOfDay: Record<number, number> = {};
    const dayOfWeek: Record<number, number> = {};

    history.forEach((record) => {
      const hour = record.timestamp.getHours();
      const day = record.timestamp.getDay();

      timeOfDay[hour] = (timeOfDay[hour] || 0) + 1;
      dayOfWeek[day] = (dayOfWeek[day] || 0) + 1;
    });

    return { timeOfDay, dayOfWeek };
  }
}
```

### Алгоритм рекомендаций

#### Основной движок рекомендаций

```typescript
// src/lib/recommendation-engine.ts
import {
  RecommendationContext,
  TrackFeatures,
} from "@/ai/types/recommendation-types";
import { DataCollectionService } from "@/ai/services/data-collection-service";
import * as tf from "@tensorflow/tfjs-node";

export class RecommendationEngine {
  private model: tf.LayersModel | null = null;

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    // В реальном приложении модель будет загружаться из хранилища
    // или обучаться заранее
    this.model = this.createModel();
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential();

    // Входной слой для признаков пользователя и трека
    model.add(
      tf.layers.dense({
        inputShape: [20], // 10 признаков пользователя + 10 признаков трека
        units: 64,
        activation: "relu",
      })
    );

    model.add(
      tf.layers.dense({
        units: 32,
        activation: "relu",
      })
    );

    model.add(
      tf.layers.dense({
        units: 1,
        activation: "sigmoid", // Вероятность рекомендации
      })
    );

    model.compile({
      optimizer: "adam",
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });

    return model;
  }

  async getRecommendations(
    context: RecommendationContext,
    limit: number = 10
  ): Promise<string[]> {
    // Получение признаков пользователя
    const userFeatures = await this.getUserFeatures(context);

    // Получение всех доступных треков
    const allTracks = await this.getAllTracks();

    // Вычисление релевантности для каждого трека
    const trackScores: Array<{ trackId: string; score: number }> = [];

    for (const track of allTracks) {
      if (context.listeningHistory.some((h) => h.trackId === track.id)) {
        continue; // Пропуск уже прослушанных треков
      }

      const trackFeatures = await this.getTrackFeatures(track.id);
      const relevanceScore = await this.calculateRelevance(
        userFeatures,
        trackFeatures,
        context
      );

      trackScores.push({
        trackId: track.id,
        score: relevanceScore,
      });
    }

    // Сортировка по релевантности и возврат топ-N
    trackScores.sort((a, b) => b.score - a.score);
    return trackScores.slice(0, limit).map((item) => item.trackId);
  }

  private async getUserFeatures(context: RecommendationContext) {
    // Вектор признаков пользователя
    return [
      context.listeningHistory.length,
      context.listeningHistory.filter((h) => h.completed).length /
        Math.max(context.listeningHistory.length, 1),
      context.listeningHistory.filter((h) => h.skipped).length /
        Math.max(context.listeningHistory.length, 1),
      context.timeOfDay / 24,
      context.dayOfWeek / 7,
      context.likedTracks.length,
      context.dislikedTracks.length,
      // Предпочтения по жанрам (вектор)
      ...this.getGenrePreferenceVector(context.preferredGenres),
      // Паттерны прослушивания
      ...this.getListeningPatternVector(context.listeningPatterns),
    ];
  }

  private getGenrePreferenceVector(genres: string[]): number[] {
    // Векторизация жанров (упрощенная версия)
    const allGenres = [
      "pop",
      "rock",
      "hiphop",
      "electronic",
      "jazz",
      "classical",
      "country",
      "rnb",
    ];
    return allGenres.map((g) => (genres.includes(g) ? 1 : 0));
  }

  private getListeningPatternVector(patterns: any): number[] {
    // Векторизация паттернов прослушивания
    const timeOfDayVector = Array(24).fill(0);
    Object.entries(patterns.timeOfDay).forEach(([hour, count]) => {
      timeOfDayVector[parseInt(hour)] = count as number;
    });

    const dayOfWeekVector = Array(7).fill(0);
    Object.entries(patterns.dayOfWeek).forEach(([day, count]) => {
      dayOfWeekVector[parseInt(day)] = count as number;
    });

    return [...timeOfDayVector, ...dayOfWeekVector];
  }

  private async getTrackFeatures(trackId: string): Promise<number[]> {
    const features = await DataCollectionService.getTrackFeatures(trackId);

    // Нормализация признаков трека
    return [
      features.danceability,
      features.energy,
      features.valence,
      features.tempo / 200, // Нормализация темпа
      features.duration / 300, // Нормализация длительности
      features.loudness / -10, // Нормализация громкости
      features.acousticness,
      features.instrumentalness,
      features.liveness,
      features.speechiness,
    ];
  }

  private async calculateRelevance(
    userFeatures: number[],
    trackFeatures: number[],
    context: RecommendationContext
  ): Promise<number> {
    // В реальном приложении это будет результатом работы ML-модели
    // Для упрощения используем простой алгоритм

    // Совпадение по жанру
    const track = await DataCollectionService.getTrackFeatures(
      context.currentTrack || trackFeatures[0].toString()
    );
    const genreMatch = context.preferredGenres.includes(track.genre) ? 0.3 : 0;

    // Временные паттерны
    const timeMatch = this.getTimePatternMatch(trackFeatures, context);

    // История прослушивания
    const historyMatch = this.getHistoryMatch(trackFeatures, context);

    // Комбинирование факторов
    return (genreMatch + timeMatch + historyMatch) / 3;
  }

  private getTimePatternMatch(
    trackFeatures: number[],
    context: RecommendationContext
  ): number {
    // Простой расчет соответствия времени прослушивания
    const preferredHours = Object.keys(context.listeningPatterns.timeOfDay)
      .map(Number)
      .filter((hour) => context.listeningPatterns.timeOfDay[hour] > 0);

    if (preferredHours.includes(context.timeOfDay)) {
      return 0.2;
    }
    return 0;
  }

  private getHistoryMatch(
    trackFeatures: number[],
    context: RecommendationContext
  ): number {
    // Простой расчет соответствия истории прослушивания
    if (context.listeningHistory.length === 0) return 0.1;

    // Анализ схожести с последними прослушанными треками
    const recentTracks = context.listeningHistory.slice(0, 5);
    let similarityScore = 0;

    for (const recent of recentTracks) {
      // Простой расчет схожести (в реальном приложении - более сложный алгоритм)
      similarityScore += Math.random() * 0.2; // Заглушка
    }

    return similarityScore / recentTracks.length;
  }

  private async getAllTracks() {
    // Получение всех доступных треков
    return await prisma.track.findMany({
      where: {
        status: "published",
      },
      take: 1000, // Ограничение для производительности
    });
  }
}
```

### Интеграция с API

#### API-эндпоинт для рекомендаций

```typescript
// src/app/api/recommendations/ai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { RecommendationEngine } from "@/lib/recommendation-engine";
import { DataCollectionService } from "@/ai/services/data-collection-service";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const contextType = searchParams.get("context") || "general";

    const engine = new RecommendationEngine();

    // Получение контекста пользователя
    const userHistory = await DataCollectionService.getUserListeningHistory(
      session.user.id
    );
    const userPreferences = await DataCollectionService.getUserPreferences(
      session.user.id
    );

    const context = {
      userId: session.user.id,
      currentTrack: searchParams.get("currentTrack") || undefined,
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      listeningHistory: userHistory,
      likedTracks: [], // В реальном приложении - из базы
      dislikedTracks: [], // В реальном приложении - из базы
      preferredGenres: Object.keys(userPreferences.genrePreferences).slice(
        0,
        5
      ),
      listeningPatterns: userPreferences.listeningPatterns,
    };

    const recommendedTrackIds = await engine.getRecommendations(context, limit);

    // Получение полной информации о треках
    const recommendedTracks = await prisma.track.findMany({
      where: {
        id: { in: recommendedTrackIds },
      },
      include: {
        artist: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Сортировка в соответствии с порядком рекомендаций
    const sortedTracks = recommendedTrackIds
      .map((id) => recommendedTracks.find((track) => track.id === id))
      .filter(Boolean) as any[];

    return NextResponse.json({
      recommendations: sortedTracks,
      context: contextType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

### Персонализированные плейлисты

#### Сервис генерации плейлистов

```typescript
// src/ai/services/playlist-generation-service.ts
import { RecommendationEngine } from "@/lib/recommendation-engine";
import { DataCollectionService } from "@/ai/services/data-collection-service";

export class PlaylistGenerationService {
  static async generatePersonalizedPlaylist(
    userId: string,
    name: string,
    size: number = 20
  ) {
    const engine = new RecommendationEngine();

    // Получение контекста пользователя
    const userHistory = await DataCollectionService.getUserListeningHistory(
      userId
    );
    const userPreferences = await DataCollectionService.getUserPreferences(
      userId
    );

    const context = {
      userId,
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      listeningHistory: userHistory,
      likedTracks: [], // В реальном приложении - из базы
      dislikedTracks: [], // В реальном приложении - из базы
      preferredGenres: Object.keys(userPreferences.genrePreferences).slice(
        0,
        5
      ),
      listeningPatterns: userPreferences.listeningPatterns,
    };

    const recommendedTrackIds = await engine.getRecommendations(context, size);

    // Создание плейлиста в базе данных
    const playlist = await prisma.playlist.create({
      data: {
        name,
        userId,
        tracks: {
          connect: recommendedTrackIds.map((id) => ({ id })),
        },
        isGenerated: true, // Пометка, что плейлист сгенерирован ИИ
        generatedAt: new Date(),
      },
      include: {
        tracks: {
          include: {
            artist: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return playlist;
  }

  static async regeneratePlaylist(playlistId: string) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { user: true },
    });

    if (!playlist || !playlist.isGenerated) {
      throw new Error("Playlist not found or not AI-generated");
    }

    // Удаление старых треков
    await prisma.playlistTrack.deleteMany({
      where: { playlistId },
    });

    // Генерация новых рекомендаций
    return await this.generatePersonalizedPlaylist(
      playlist.userId,
      playlist.name,
      playlist.tracks.length
    );
  }
}
```

### Аналитика эффективности

#### Сервис аналитики рекомендаций

```typescript
// src/ai/services/recommendation-analytics-service.ts
import { prisma } from "@/lib/db";

export class RecommendationAnalyticsService {
  static async logRecommendationInteraction(
    userId: string,
    recommendedTrackIds: string[],
    clickedTrackId?: string,
    skippedTrackIds: string[] = []
  ) {
    const interactions = recommendedTrackIds.map((trackId) => ({
      userId,
      trackId,
      isRecommended: true,
      isClicked: trackId === clickedTrackId,
      isSkipped: skippedTrackIds.includes(trackId),
      timestamp: new Date(),
    }));

    await prisma.recommendationInteraction.createMany({
      data: interactions,
    });
  }

  static async getRecommendationEffectiveness(userId?: string) {
    const whereClause: any = {};
    if (userId) {
      whereClause.userId = userId;
    }

    const interactions = await prisma.recommendationInteraction.findMany({
      where: whereClause,
      take: 100, // Ограничение для производительности
    });

    const totalRecommendations = interactions.length;
    const clickedRecommendations = interactions.filter(
      (i) => i.isClicked
    ).length;
    const skippedRecommendations = interactions.filter(
      (i) => i.isSkipped
    ).length;

    return {
      totalRecommendations,
      clickedCount: clickedRecommendations,
      skippedCount: skippedRecommendations,
      clickThroughRate:
        totalRecommendations > 0
          ? clickedRecommendations / totalRecommendations
          : 0,
      skipRate:
        totalRecommendations > 0
          ? skippedRecommendations / totalRecommendations
          : 0,
      engagementRate:
        totalRecommendations > 0
          ? (clickedRecommendations / totalRecommendations) * 100
          : 0,
    };
  }

  static async updateRecommendationModelPerformance(
    modelVersion: string,
    metrics: any
  ) {
    await prisma.mlModelPerformance.upsert({
      where: { modelVersion },
      update: {
        metrics: { ...metrics },
        lastUpdated: new Date(),
      },
      create: {
        modelVersion,
        metrics: { ...metrics },
        lastUpdated: new Date(),
      },
    });
  }
}
```

## Риски и меры по их снижению

### Риск 1: Высокая вычислительная сложность

- **Мера**: Оптимизация алгоритмов
- **Мера**: Использование кэширования результатов

### Риск 2: Низкая релевантность рекомендаций

- **Мера**: Постоянное обучение модели
- **Мера**: A/B тестирование алгоритмов

### Риск 3: Проблемы с конфиденциальностью

- **Мера**: Анонимизация данных
- **Мера**: Соблюдение GDPR и других норм

## Критерии успеха

- Повышенная релевантность рекомендаций
- Увеличение времени прослушивания
- Удовлетворенность пользователей
- Улучшенная персонализация
- Эффективность алгоритмов

## Ресурсы

- 2-3 разработчика на 10 недель
- ML-инженер для разработки алгоритмов
- QA-инженер для тестирования

## Сроки

- Начало: 15 июля 2025
- Завершение: 26 сентября 2025
- Общее время: 10 недель
