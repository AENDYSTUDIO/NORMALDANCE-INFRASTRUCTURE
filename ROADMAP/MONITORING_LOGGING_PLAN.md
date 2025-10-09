# План системы мониторинга и логирования

## Обзор

В этом документе описывается план реализации комплексной системы мониторинга и логирования проекта NormalDance. Это улучшение имеет средний приоритет для Q2 2025 года, так как обеспечивает поддержку стабильности системы и улучшает понимание пользовательского поведения.

## Текущая ситуация

### Существующая система мониторинга

- Базовая логика логирования
- Отсутствие централизованного логирования
- Нет мониторинга производительности
- Нет оповещений о критических ошибках

### Проблемы текущей реализации

- Отсутствие комплексного мониторинга
- Нет централизованного хранения логов
- Нет аналитики пользовательской активности
- Отсутствие оповещений о проблемах

## Цели реализации

### Основные цели

- Интеграция системы мониторинга производительности
- Реализация централизованного логирования
- Создание дашбордов для анализа
- Настройка оповещений о критических ошибках

### Технические цели

- Мониторинг ошибок и производительности
- Централизованное логирование
- Аналитика пользовательской активности
- Система оповещений

## План реализации

### Этап 1: Анализ и выбор инструментов (Неделя 1-2)

- Анализ требований к мониторингу
- Выбор инструментов мониторинга
- Подготовка архитектуры
- Создание тестовой среды

### Этап 2: Интеграция Sentry (Неделя 3-4)

- Настройка Sentry для бэкенда
- Настройка Sentry для фронтенда
- Интеграция с Next.js
- Настройка алертов

### Этап 3: Логирование и аналитика (Неделя 5-6)

- Реализация централизованного логирования
- Интеграция с системой аналитики
- Создание пользовательских метрик
- Тестирование системы

### Этап 4: Дашборды и оповещения (Неделя 7)

- Создание дашбордов для анализа
- Настройка оповещений
- Тестирование оповещений
- Подготовка к внедрению

### Этап 5: Внедрение (Неделя 8)

- Постепенное внедрение системы
- Мониторинг после внедрения
- Обновление документации
- Обучение команды

## Технические детали

### Интеграция Sentry

#### Установка зависимостей

```bash
npm install @sentry/nextjs
npm install @sentry/node
npm install @sentry/react
```

#### Конфигурация Sentry для Next.js

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",

  // Настройки отслеживания
  tracesSampleRate: 0.1, // 10% сэмплирование трейсов
  replaysSessionSampleRate: 0.1, // 10% сэмплирование реплеев
  replaysOnErrorSampleRate: 1.0, // 100% реплеев при ошибках

  integrations: [
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Фильтрация чувствительных данных
  beforeSend(event) {
    // Удаление чувствительных данных из событий
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.token;
    }
    return event;
  },
});

// sentry.server.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",

  tracesSampleRate: 0.1,

  // Фильтрация чувствительных данных
  beforeSend(event) {
    // Удаление чувствительных данных из событий
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.token;
    }
    return event;
  },
});
```

#### Использование Sentry в приложении

```typescript
// src/lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

export const captureException = (error: Error, context?: any) => {
  Sentry.captureException(error, {
    contexts: context,
    tags: {
      ...context?.tags,
      "user-agent":
        typeof window !== "undefined" ? navigator.userAgent : "server",
    },
  });
};

export const captureMessage = (
  message: string,
  level?: Sentry.SeverityLevel
) => {
  Sentry.captureMessage(message, level);
};

// Обертка для асинхронных операций с логированием ошибок
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    captureException(error as Error, {
      contexts: {
        operation: { name: operationName },
      },
    });
    return null;
  }
};
```

### Централизованное логирование

#### Создание логгера

```typescript
// src/lib/logger.ts
import pino from "pino";

// Конфигурация логгера
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty" }
      : undefined,
  base: {
    env: process.env.NODE_ENV,
    service: "normaldance",
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});

export default logger;

// Использование логгера в приложении
export const logInfo = (message: string, data?: any) => {
  logger.info(data, message);
};

export const logError = (message: string, error?: any) => {
  logger.error(error, message);
};

export const logWarn = (message: string, data?: any) => {
  logger.warn(data, message);
};

export const logDebug = (message: string, data?: any) => {
  logger.debug(data, message);
};
```

#### Middleware для логирования запросов

```typescript
// src/middleware/logging.ts
import { NextRequest } from "next/server";
import logger from "@/lib/logger";

export function withLogging(handler: any) {
  return async (req: NextRequest, ...args: any[]) => {
    const startTime = Date.now();
    const method = req.method;
    const url = req.nextUrl.pathname;
    const userAgent = req.headers.get("user-agent") || "unknown";

    logger.info(
      {
        type: "request",
        method,
        url,
        userAgent,
        ip: req.headers.get("x-forwarded-for"),
      },
      "Incoming request"
    );

    try {
      const response = await handler(req, ...args);

      logger.info(
        {
          type: "response",
          method,
          url,
          status: response.status,
          duration: Date.now() - startTime,
        },
        "Request completed"
      );

      return response;
    } catch (error) {
      logger.error(
        {
          type: "error",
          method,
          url,
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "Request failed"
      );

      throw error;
    }
  };
}
```

### Метрики пользовательской активности

#### Создание сервиса аналитики

```typescript
// src/lib/analytics.ts
import { captureException } from "@/lib/sentry";
import logger from "@/lib/logger";

export interface AnalyticsEvent {
  userId?: string;
  sessionId?: string;
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
}

export class AnalyticsService {
  static async track(event: AnalyticsEvent): Promise<void> {
    try {
      // Отправка события в систему аналитики
      // В реальном приложении это может быть PostHog, Mixpanel, GA4 и т.д.

      // Пример с PostHog
      if (typeof window !== "undefined" && (window as any).posthog) {
        (window as any).posthog.capture(event.event, {
          ...event.properties,
          userId: event.userId,
          sessionId: event.sessionId,
        });
      }

      // Логирование события
      logger.info(
        {
          type: "analytics",
          event: event.event,
          userId: event.userId,
          properties: event.properties,
        },
        "Analytics event tracked"
      );
    } catch (error) {
      logger.error(error, "Failed to track analytics event");
      captureException(error as Error, {
        contexts: {
          event: event.event,
          properties: event.properties,
        },
      });
    }
  }

  // Отслеживание прослушивания трека
  static async trackTrackPlay(
    trackId: string,
    userId?: string,
    duration?: number
  ) {
    await this.track({
      userId,
      event: "track_play",
      properties: {
        trackId,
        duration,
      },
      timestamp: new Date(),
    });
  }

  // Отслеживание покупки NFT
  static async trackNFTPurchase(nftId: string, userId: string, price: number) {
    await this.track({
      userId,
      event: "nft_purchase",
      properties: {
        nftId,
        price,
      },
      timestamp: new Date(),
    });
  }

  // Отслеживание создания мемориала
  static async trackMemorialCreation(memorialId: string, userId: string) {
    await this.track({
      userId,
      event: "memorial_created",
      properties: {
        memorialId,
      },
      timestamp: new Date(),
    });
  }
}
```

### Мониторинг Web3-операций

#### Логирование Web3-транзакций

```typescript
// src/lib/web3-monitoring.ts
import { captureException } from "@/lib/sentry";
import logger from "@/lib/logger";

export interface Web3TransactionEvent {
  userId?: string;
  transactionId: string;
  action: string;
  status: "pending" | "confirmed" | "failed";
  details: Record<string, any>;
  timestamp: Date;
}

export class Web3MonitoringService {
  static async logTransaction(event: Web3TransactionEvent): Promise<void> {
    try {
      logger.info(
        {
          type: "web3_transaction",
          transactionId: event.transactionId,
          action: event.action,
          status: event.status,
          userId: event.userId,
          details: event.details,
        },
        `Web3 transaction ${event.status}`
      );

      // Если транзакция не удалась, захватываем как ошибку
      if (event.status === "failed") {
        captureException(
          new Error(`Web3 transaction failed: ${event.action}`),
          {
            contexts: {
              transaction: {
                id: event.transactionId,
                action: event.action,
                details: event.details,
              },
            },
          }
        );
      }
    } catch (error) {
      logger.error(error, "Failed to log Web3 transaction");
      captureException(error as Error);
    }
  }

  static async trackNFTMint(
    userId: string,
    nftId: string,
    transactionId: string
  ) {
    await this.logTransaction({
      userId,
      transactionId,
      action: "nft_mint",
      status: "pending",
      details: { nftId },
      timestamp: new Date(),
    });
  }

  static async trackPayment(
    userId: string,
    paymentId: string,
    transactionId: string,
    amount: number
  ) {
    await this.logTransaction({
      userId,
      transactionId,
      action: "payment",
      status: "pending",
      details: { paymentId, amount },
      timestamp: new Date(),
    });
  }
}
```

### Дашборды и оповещения

#### Пример дашборда для мониторинга

```typescript
// src/app/admin/monitoring/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Получение метрик из API
        const response = await fetch("/api/admin/metrics");
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Обновление каждые 30 секунд
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>Загрузка метрик...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Мониторинг системы</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Посетители (24ч)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.visitors24h || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Активные пользователи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.activeUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ошибки (1ч)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {metrics?.errors1h || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Транзакции (24ч)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.transactions24h || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Запросы по времени</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics?.requestTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="requests" stroke="#884d8" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringDashboard;
```

#### API для получения метрик

```typescript
// src/app/api/admin/metrics/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Получение метрик из различных источников
    const metrics = {
      visitors24h: await getVisitors24h(),
      activeUsers: await getActiveUsers(),
      errors1h: await getErrors1h(),
      transactions24h: await getTransactions24h(),
      requestTrend: await getRequestTrend(),
    };

    logger.info(
      {
        type: "admin_metrics_access",
        userId: session.user.id,
      },
      "Admin accessed metrics"
    );

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    logger.error(error, "Failed to fetch metrics");
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Заглушки для получения метрик
async function getVisitors24h() {
  // Реализация получения посетителей за последние 24 часа
  return 1250;
}

async function getActiveUsers() {
  // Реализация получения активных пользователей
  return 342;
}

async function getErrors1h() {
  // Реализация получения ошибок за последний час
  return 5;
}

async function getTransactions24h() {
  // Реализация получения транзакций за последние 24 часа
  return 42;
}

async function getRequestTrend() {
  // Реализация получения тренда запросов
  return [
    { time: "00:00", requests: 120 },
    { time: "04:00", requests: 85 },
    { time: "08:00", requests: 210 },
    { time: "12:00", requests: 350 },
    { time: "16:00", requests: 420 },
    { time: "20:00", requests: 380 },
  ];
}
```

## Риски и меры по их снижению

### Риск 1: Утечка чувствительных данных

- **Мера**: Фильтрация чувствительных данных в логах
- **Мера**: Использование маскировки в Sentry

### Риск 2: Перегрузка системы логированием

- **Мера**: Асинхронное логирование
- **Мера**: Ограничение объема логов

### Риск 3: Ложные срабатывания оповещений

- **Мера**: Настройка порогов оповещений
- **Мера**: Тестирование системы оповещений

## Критерии успеха

- Успешная интеграция системы мониторинга
- Централизованное хранение логов
- Быстрое выявление проблем
- Улучшенное понимание пользовательского поведения
- Эффективная система оповещений

## Ресурсы

- 2-3 разработчика на 8 недель
- DevOps-инженер для настройки инфраструктуры
- QA-инженер для тестирования

## Сроки

- Начало: 1 июня 2025
- Завершение: 27 июля 2025
- Общее время: 8 недель
