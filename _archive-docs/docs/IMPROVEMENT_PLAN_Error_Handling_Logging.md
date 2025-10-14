# 🛡️ План улучшения обработки ошибок и логирования NORMAL DANCE

## 🎯 Цель

Создать комплексную систему обработки ошибок и логирования для повышения надежности, наблюдаемости и возможности отладки приложения NORMAL DANCE.

## 📋 Текущее состояние

### Обработка ошибок

- Базовая обработка ошибок в большинстве функций
- Использование try/catch блоков, но без структурированного подхода
- Некоторые ошибки обрабатываются на уровне API, но не на уровне бизнес-логики
- Отсутствует централизованная обработка ошибок

### Логирование

- Простой логгер с базовыми уровнями (error, warn, info, debug)
- Логирование в консоль, с возможностью отправки в внешние сервисы
- Отсутствует структурированное логирование с контекстом
- Нет интеграции с системами мониторинга (Sentry, DataDog и т.д.)

### Мониторинг

- Наличие базовых алертов в Prometheus
- Отсутствует трассировка распределенных запросов
- Нет интеграции с системами Application Performance Monitoring (APM)

## 📈 План улучшения

### 1. Структурированная обработка ошибок

#### Проблема

Ошибки обрабатываются индивидуально в каждой функции без единого подхода.

#### Решение

Создать централизованную систему обработки ошибок с кастомными классами ошибок.

#### Реализация:

```typescript
// src/errors/BaseError.ts
export class BaseError extends Error {
  public readonly name: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly metadata?: Record<string, any>;

  constructor(
    name: string,
    statusCode: number,
    message: string,
    isOperational: boolean = true,
    metadata?: Record<string, any>
  ) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.metadata = metadata;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// src/errors/ValidationError.ts
export class ValidationError extends BaseError {
  constructor(message: string, metadata?: Record<string, any>) {
    super("ValidationError", 400, message, true, metadata);
  }
}

// src/errors/AuthenticationError.ts
export class AuthenticationError extends BaseError {
  constructor(message: string = "Authentication failed") {
    super("AuthenticationError", 401, message, true);
  }
}

// src/errors/AuthorizationError.ts
export class AuthorizationError extends BaseError {
  constructor(message: string = "Access denied") {
    super("AuthorizationError", 403, message, true);
  }
}

// src/errors/NotFoundError.ts
export class NotFoundError extends BaseError {
  constructor(message: string = "Resource not found") {
    super("NotFoundError", 404, message, true);
  }
}

// src/errors/BusinessLogicError.ts
export class BusinessLogicError extends BaseError {
  constructor(message: string, metadata?: Record<string, any>) {
    super("BusinessLogicError", 422, message, true, metadata);
  }
}

// src/errors/ExternalServiceError.ts
export class ExternalServiceError extends BaseError {
  constructor(message: string, metadata?: Record<string, any>) {
    super("ExternalServiceError", 502, message, false, metadata);
  }
}

// src/errors/InternalServerError.ts
export class InternalServerError extends BaseError {
  constructor(message: string = "Internal server error") {
    super("InternalServerError", 500, message, false);
  }
}
```

#### Улучшенная обработка ошибок в `ipfs-helia-adapter.ts`:

```typescript
// src/lib/ipfs-helia-adapter.ts (улучшенная версия)
import { type Helia } from "@helia/interface";
import { unixfs } from "@helia/unixfs";
import { createHelia } from "helia";
import { type IPFSTrackMetadata } from "./ipfs";
import { createLogger } from "../utils/logger";
import {
  ValidationError,
  ExternalServiceError,
  InternalServerError,
} from "../errors";

const logger = createLogger("ipfs-helia");

// Singleton instance for Helia
let heliaInstance: Helia | null = null;
let unixfsInstance: ReturnType<typeof unixfs> | null = null;

/**
 * Get or create Helia instance with UnixFS
 */
async function getHelia(): Promise<{
  helia: Helia;
  fs: ReturnType<typeof unixfs>;
}> {
  if (!heliaInstance || !unixfsInstance) {
    try {
      logger.info("Initializing Helia IPFS instance...", {
        maxConnections: 50,
        minConnections: 10,
      });

      heliaInstance = await createHelia({
        start: true,
        libp2p: {
          connectionManager: {
            maxConnections: 50,
            minConnections: 10,
          },
        },
      });

      unixfsInstance = unixfs(heliaInstance);
      logger.info("Helia IPFS instance initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Helia", { error });

      // Преобразуем ошибку в наш формат
      if (error instanceof Error) {
        throw new ExternalServiceError(
          `Helia initialization failed: ${error.message}`,
          { originalError: error.message, stack: error.stack }
        );
      }

      throw new InternalServerError("Unknown Helia initialization error");
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
      logger.warn("File is required for IPFS upload");
      throw new ValidationError("File is required for upload");
    }

    // File size validation (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    const fileSize = file instanceof File ? file.size : (file as Buffer).length;

    if (fileSize > maxSize) {
      logger.warn("File size exceeds limit", {
        fileSize,
        maxSize,
        fileName: file instanceof File ? file.name : "buffer",
      });

      throw new ValidationError(
        `File size ${fileSize} exceeds maximum allowed size of ${maxSize} bytes`,
        { fileSize, maxSize }
      );
    }

    logger.info("Starting Helia IPFS upload", { fileSize });

    const { fs } = await getHelia();

    // Validate and convert file/buffer to Uint8Array
    let fileBytes: Uint8Array;

    if (file instanceof File) {
      // Additional validation for File objects
      if (!file.type || file.type === "") {
        logger.warn("File has no MIME type, proceeding with caution", {
          fileName: file.name,
        });
      }

      const arrayBuffer = await file.arrayBuffer();
      fileBytes = new Uint8Array(arrayBuffer);
    } else if (Buffer.isBuffer(file)) {
      fileBytes = new Uint8Array(file);
    } else {
      logger.error("Unsupported file type for IPFS upload", {
        fileType: typeof file,
      });

      throw new ValidationError(
        "Unsupported file type: expected File or Buffer",
        { fileType: typeof file }
      );
    }

    // Sanitize metadata if provided
    const sanitizedMetadata = metadata
      ? {
          title: metadata.title?.substring(0, 255) || "",
          artist: metadata.artist?.substring(0, 255) || "",
          genre: metadata.genre?.substring(0, 100) || "",
          duration:
            typeof metadata.duration === "number" && metadata.duration > 0
              ? metadata.duration
              : 0,
          format: metadata.format?.substring(0, 50) || "",
          sampleRate:
            typeof metadata.sampleRate === "number"
              ? metadata.sampleRate
              : 44100,
          bitDepth:
            typeof metadata.bitDepth === "number" ? metadata.bitDepth : 16,
        }
      : undefined;

    let resultCid: string;
    let resultSize: number;

    if (sanitizedMetadata) {
      // Create secure metadata object
      const metadataWithFile = {
        ...sanitizedMetadata,
        file: file instanceof File ? file.name.substring(0, 255) : "buffer",
        timestamp: new Date().toISOString(),
        version: "1.0",
      };

      // Add metadata to IPFS
      const metadataBytes = new TextEncoder().encode(
        JSON.stringify(metadataWithFile)
      );
      const metadataCid = await fs.addBytes(metadataBytes);

      // Add file to IPFS
      const fileCid = await fs.addBytes(fileBytes);

      // Create combined object with validation
      const combined = {
        metadata: metadataCid.toString(),
        file: fileCid.toString(),
        type: "track",
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

    logger.info("Helia IPFS upload successful", {
      cid: resultCid,
      size: resultSize,
      hasMetadata: !!sanitizedMetadata,
    });

    return { cid: resultCid, size: resultSize };
  } catch (error) {
    // Логируем ошибку с контекстом
    logger.error("Helia IPFS upload failed", {
      error,
      hasMetadata: !!metadata,
      fileType:
        file instanceof File
          ? "File"
          : Buffer.isBuffer(file)
          ? "Buffer"
          : typeof file,
    });

    // Если это уже наша ошибка, пробрасываем как есть
    if (error instanceof BaseError) {
      throw error;
    }

    // Преобразуем неизвестные ошибки
    if (error instanceof Error) {
      throw new ExternalServiceError(
        `Failed to upload to Helia IPFS: ${error.message}`,
        { originalError: error.message, stack: error.stack }
      );
    }

    throw new InternalServerError("Unknown error during IPFS upload");
  }
}
```

### 2. Расширенное логирование

#### Проблема

Логирование базовое, без контекста запроса и трассировки.

#### Решение

Создать расширенный логгер с контекстом, трассировкой и интеграцией с внешними сервисами.

#### Реализация:

```typescript
// src/utils/advanced-logger.ts
import winston from "winston";
import Sentry from "@sentry/nextjs";
import { format, transports } from "winston";
import { v4 as uuidv4 } from "uuid";

// Создаем типизированный логгер
interface LogMetadata {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  service?: string;
  [key: string]: any;
}

class AdvancedLogger {
  private logger: winston.Logger;
  private service: string;

  constructor(service: string) {
    this.service = service;

    // Определяем уровень логирования
    const logLevel = process.env.LOG_LEVEL || "info";

    this.logger = winston.createLogger({
      level: logLevel,
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.metadata({
          fillExcept: ["message", "level", "timestamp", "label"],
        }),
        format((info) => {
          // Добавляем сервис к метаданным
          info.metadata = {
            service: this.service,
            ...info.metadata,
          };
          return info;
        })(),
        process.env.NODE_ENV === "production"
          ? format.json()
          : format.prettyPrint()
      ),
      defaultMeta: { service: this.service },
      transports: [
        // Консольный транспорт
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ level, message, timestamp, metadata }) => {
              const metaString = Object.keys(metadata).length
                ? ` | Metadata: ${JSON.stringify(metadata)}`
                : "";
              return `${timestamp} [${level}] ${this.service}: ${message}${metaString}`;
            })
          ),
        }),

        // Файловый транспорт для production
        ...(process.env.NODE_ENV === "production"
          ? [
              new transports.File({
                filename: "logs/error.log",
                level: "error",
                maxsize: 5242880, // 5MB
                maxFiles: 5,
              }),
              new transports.File({
                filename: "logs/combined.log",
                maxsize: 5242880, // 5MB
                maxFiles: 5,
              }),
            ]
          : []),
      ],
    });
  }

  // Метод для добавления контекста к логгеру
  withContext(context: LogMetadata): AdvancedLogger {
    const contextualLogger = new AdvancedLogger(this.service);
    contextualLogger.logger.defaultMeta = {
      ...contextualLogger.logger.defaultMeta,
      ...context,
    };
    return contextualLogger;
  }

  // Генерация correlation ID для трассировки запросов
  static generateCorrelationId(): string {
    return uuidv4();
  }

  error(message: string, metadata?: LogMetadata): void {
    this.logger.error(message, { ...metadata });
    // Отправляем в Sentry
    if (process.env.NODE_ENV === "production") {
      Sentry.captureException(new Error(message), {
        contexts: { metadata },
      });
    }
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.logger.warn(message, { ...metadata });
  }

  info(message: string, metadata?: LogMetadata): void {
    this.logger.info(message, { ...metadata });
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.logger.debug(message, { ...metadata });
  }

  // Логирование HTTP запросов
  http(
    method: string,
    url: string,
    statusCode: number,
    metadata?: LogMetadata
  ): void {
    const level =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    this.logger.log(level, `${method} ${url} ${statusCode}`, {
      http: { method, url, statusCode },
      ...metadata,
    });
  }

  // Логирование метрик производительности
  metric(name: string, value: number, metadata?: LogMetadata): void {
    this.logger.info(`Metric: ${name}`, {
      metric: { name, value },
      ...metadata,
    });
  }
}

// Middleware для добавления correlation ID к каждому запросу
export function loggingMiddleware() {
  return (req: any, res: any, next: () => void) => {
    const correlationId = AdvancedLogger.generateCorrelationId();
    req.correlationId = correlationId;

    // Добавляем заголовок к ответу
    res.setHeader("X-Correlation-ID", correlationId);

    next();
  };
}

// Создание логгера с контекстом запроса
export function createRequestLogger(req: any, service: string): AdvancedLogger {
  const context: LogMetadata = {
    correlationId: req.correlationId,
    requestId: req.id,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    method: req.method,
    url: req.url,
  };

  // Добавляем информацию о пользователе, если доступна
  if (req.user) {
    context.userId = req.user.id;
  }

  return new AdvancedLogger(service).withContext(context);
}

export function createLogger(service: string): AdvancedLogger {
  return new AdvancedLogger(service);
}

export default AdvancedLogger;
```

### 3. Централизованная обработка ошибок в API

#### Проблема

Обработка ошибок в API разрознена.

#### Решение

Создать middleware для централизованной обработки ошибок.

#### Реализация:

```typescript
// src/middleware/error-handler.ts
import { NextRequest, NextResponse } from "next/server";
import { BaseError } from "@/errors/BaseError";
import { createLogger } from "@/utils/advanced-logger";

const logger = createLogger("error-handler");

// Error response interface
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  correlationId?: string;
  details?: Record<string, any>;
}

// Error handler middleware
export async function errorHandler(
  error: Error,
  req: NextRequest,
  correlationId?: string
): Promise<NextResponse> {
  // Логируем ошибку
  logger.error("Unhandled error in API route", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    correlationId,
  });

  // Определяем тип ошибки
  let statusCode = 500;
  let message = "Internal Server Error";
  let errorName = "InternalServerError";
  let details: Record<string, any> | undefined;

  if (error instanceof BaseError) {
    statusCode = error.statusCode;
    message = error.message;
    errorName = error.name;
    details = error.metadata;
  } else {
    // Для неизвестных ошибок отправляем в Sentry
    if (process.env.NODE_ENV === "production") {
      // В реальной реализации здесь будет интеграция с Sentry
      console.error("Unhandled error:", error);
    }
  }

  // Формируем ответ
  const errorResponse: ErrorResponse = {
    error: errorName,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    correlationId,
    ...(details && { details }),
  };

  // Возвращаем ответ с соответствующим статусом
  return NextResponse.json(errorResponse, { status: statusCode });
}

// Глобальный error handler для API routes
export function withErrorHandling(handler: Function) {
  return async (req: NextRequest) => {
    const correlationId =
      req.headers.get("X-Correlation-ID") ||
      Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

    try {
      return await handler(req);
    } catch (error: any) {
      return errorHandler(error, req, correlationId);
    }
  };
}
```

#### Улучшенная версия Telegram webhook с централизованной обработкой ошибок:

```typescript
// src/app/api/telegram/webhook/route.ts (улучшенная версия)
import { NextRequest, NextResponse } from "next/server";
import { telegramIntegration2025 } from "@/lib/telegram-integration-2025";
import { withErrorHandling } from "@/middleware/error-handler";
import { createLogger } from "@/utils/advanced-logger";
import { BusinessLogicError, ValidationError } from "@/errors";

const logger = createLogger("telegram-webhook");

// POST /api/telegram/webhook - Telegram webhook handler
export const POST = withErrorHandling(async (req: NextRequest) => {
  const correlationId = req.headers.get("X-Correlation-ID") || "unknown";

  try {
    const body = await req.json();

    logger.info("Processing Telegram webhook", {
      updateType: Object.keys(body)[0],
      correlationId,
    });

    // Обработка различных типов обновлений
    if (body.message) {
      await handleMessage(body.message, correlationId);
    } else if (body.callback_query) {
      await handleCallbackQuery(body.callback_query, correlationId);
    } else if (body.inline_query) {
      await handleInlineQuery(body.inline_query, correlationId);
    } else if (body.pre_checkout_query) {
      await handlePreCheckoutQuery(body.pre_checkout_query, correlationId);
    } else {
      logger.warn("Unknown Telegram update type", {
        updateKeys: Object.keys(body),
        correlationId,
      });

      throw new ValidationError("Unknown Telegram update type", {
        updateType: Object.keys(body)[0],
      });
    }

    logger.info("Telegram webhook processed successfully", { correlationId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Error processing Telegram webhook", {
      error: error instanceof Error ? error.message : "Unknown error",
      correlationId,
    });

    throw error;
  }
});

// GET /api/telegram/webhook - Webhook info
export const GET = withErrorHandling(async (req: NextRequest) => {
  const correlationId = req.headers.get("X-Correlation-ID") || "unknown";

  logger.info("Telegram webhook info requested", { correlationId });

  return NextResponse.json({
    status: "active",
    integration: "Telegram 2025",
    features: [
      "mini_app",
      "social_payments",
      "notifications",
      "analytics",
      "quick_swap",
    ],
    timestamp: Date.now(),
  });
});

/**
 * 📱 Обработка сообщений
 */
async function handleMessage(message: any, correlationId: string) {
  try {
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text;

    logger.info("Handling Telegram message", {
      chatId,
      userId,
      textLength: text?.length || 0,
      correlationId,
    });

    // Обработка команд
    if (text?.startsWith("/")) {
      await handleCommand(chatId, userId, text, message.from, correlationId);
    }

    // Обработка обычных сообщений
    else if (text) {
      await handleTextMessage(
        chatId,
        userId,
        text,
        message.from,
        correlationId
      );
    }
  } catch (error) {
    logger.error("Error handling Telegram message", {
      error: error instanceof Error ? error.message : "Unknown error",
      chatId: message?.chat?.id,
      userId: message?.from?.id,
      correlationId,
    });

    throw error;
  }
}

/**
 * 🎯 Обработка команд
 */
async function handleCommand(
  chatId: number,
  userId: number,
  command: string,
  user: any,
  correlationId: string
) {
  try {
    logger.info("Handling Telegram command", {
      chatId,
      userId,
      command,
      correlationId,
    });

    switch (command) {
      case "/start":
        await telegramIntegration2025.sendTelegramMessage(chatId, {
          text:
            `🚀 *Добро пожаловать в NormalDance DEX!*\n\n` +
            `Продвинутый DEX с гибридными алгоритмами AMM и защитой от волатильности.\n\n` +
            `*Доступные команды:*\n` +
            `/dex - Открыть DEX интерфейс\n` +
            `/analytics - Просмотр аналитики\n` +
            `/orders - Управление ордерами\n` +
            `/help - Справка\n\n` +
            `*Особенности 2025:*\n` +
            `🤖 ИИ-прогнозы\n` +
            `🛡️ Защита от волатильности\n` +
            `⚡ Гибридные алгоритмы AMM\n` +
            `💧 Умные ордера\n` +
            `📊 Продвинутая аналитика`,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🚀 Открыть DEX",
                  web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/dex` },
                },
              ],
              [
                {
                  text: "📊 Аналитика",
                  web_app: {
                    url: `${process.env.TELEGRAM_WEB_APP_URL}/analytics`,
                  },
                },
                {
                  text: "🎯 Ордера",
                  web_app: {
                    url: `${process.env.TELEGRAM_WEB_APP_URL}/dex?tab=orders`,
                  },
                },
              ],
            ],
          },
        });
        break;

      // ... остальные команды

      default:
        logger.warn("Unknown Telegram command", {
          chatId,
          userId,
          command,
          correlationId,
        });

        await telegramIntegration2025.sendTelegramMessage(chatId, {
          text: `❓ Неизвестная команда. Используйте /help для справки.`,
        });
    }
  } catch (error) {
    logger.error("Error handling Telegram command", {
      error: error instanceof Error ? error.message : "Unknown error",
      chatId,
      userId,
      command,
      correlationId,
    });

    // Отправляем пользователю уведомление об ошибке
    await telegramIntegration2025.sendTelegramMessage(chatId, {
      text: `❌ Произошла ошибка при обработке команды. Попробуйте позже.`,
    });

    throw new BusinessLogicError("Failed to handle Telegram command", {
      command,
      chatId,
      userId,
      originalError: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
```

### 4. Интеграция с системами мониторинга

#### Проблема

Отсутствует интеграция с системами Application Performance Monitoring.

#### Решение

Интегрировать Sentry и DataDog для трассировки ошибок и мониторинга производительности.

#### Реализация:

```typescript
// src/utils/monitoring.ts
import * as Sentry from "@sentry/nextjs";
import { createLogger } from "./advanced-logger";

const logger = createLogger("monitoring");

// Инициализация Sentry
export function initSentry() {
  if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
        ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
        : 1.0,
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_APP_VERSION,

      // Integrations
      integrations: [
        // Add profiling integration to get good quality profiling data
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Undici(),
      ],
    });

    logger.info("Sentry initialized successfully");
  } else {
    logger.info("Sentry initialization skipped", {
      hasDsn: !!process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
    });
  }
}

// Функция для трассировки транзакций
export function traceTransaction<T>(
  name: string,
  operation: string,
  callback: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: operation,
    },
    async (span) => {
      try {
        logger.info("Starting traced transaction", { name, operation });
        const result = await callback();
        logger.info("Transaction completed successfully", { name, operation });
        return result;
      } catch (error) {
        logger.error("Transaction failed", {
          name,
          operation,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        // Захватываем ошибку в Sentry
        Sentry.captureException(error);
        throw error;
      }
    }
  );
}

// Функция для измерения метрик производительности
export function measurePerformance<T>(
  metricName: string,
  callback: () => Promise<T>
): Promise<T> {
  return traceTransaction(metricName, "performance", async () => {
    const startTime = Date.now();

    try {
      const result = await callback();
      const duration = Date.now() - startTime;

      // Отправляем метрику
      logger.metric(metricName, duration);

      // В production можно отправлять в DataDog или другую систему
      if (process.env.NODE_ENV === "production") {
        // Пример отправки в DataDog (реализация зависит от конкретной интеграции)
        // datadog.distribution(`performance.${metricName}`, duration);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.metric(`${metricName}.error`, duration);
      throw error;
    }
  });
}

// Middleware для трассировки HTTP запросов
export function tracingMiddleware() {
  return (req: any, res: any, next: () => void) => {
    const transaction = Sentry.startTransaction({
      name: `${req.method} ${req.url}`,
      op: "http.server",
    });

    Sentry.getCurrentHub().configureScope((scope) => {
      scope.setSpan(transaction);
    });

    res.on("finish", () => {
      transaction.setHttpStatus(res.statusCode);
      transaction.finish();
    });

    next();
  };
}
```

### 5. Улучшенные алерты и мониторинг

#### Проблема

Алерты базовые, без контекста бизнес-логики.

#### Решение

Создать расширенные алерты с бизнес-метриками и контекстом.

#### Реализация:

```yaml
# monitoring/business-alerts.yml
groups:
  - name: normaldance-business-alerts
    rules:
      # Бизнес-метрики
      - alert: LowUserEngagement
        expr: rate(user_actions_total[1h]) < 10
        for: 10m
        labels:
          severity: warning
          team: product
        annotations:
          summary: "Low user engagement detected"
          description: "User actions rate is {{ $value }} per hour, below threshold of 10"

      - alert: HighTrackUploadFailureRate
        expr: rate(track_upload_failures_total[5m]) / rate(track_uploads_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "High track upload failure rate"
          description: "Track upload failure rate is {{ $value | humanizePercentage }}, above threshold of 5%"

      - alert: LowNFTMintingSuccessRate
        expr: rate(nft_minting_success_total[5m]) / rate(nft_minting_attempts_total[5m]) < 0.95
        for: 5m
        labels:
          severity: critical
          team: blockchain
        annotations:
          summary: "Low NFT minting success rate"
          description: "NFT minting success rate is {{ $value | humanizePercentage }}, below threshold of 95%"

      - alert: HighWalletConnectionFailures
        expr: rate(wallet_connection_failures_total[5m]) / rate(wallet_connection_attempts_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
          team: frontend
        annotations:
          summary: "High wallet connection failure rate"
          description: "Wallet connection failure rate is {{ $value | humanizePercentage }}, above threshold of 10%"

      - alert: LowTelegramBotResponseRate
        expr: rate(telegram_messages_sent_total[5m]) / rate(telegram_messages_received_total[5m]) < 0.8
        for: 5m
        labels:
          severity: warning
          team: product
        annotations:
          summary: "Low Telegram bot response rate"
          description: "Telegram bot response rate is {{ $value | humanizePercentage }}, below threshold of 80%"

      # Финансовые метрики
      - alert: AbnormalRevenueDrop
        expr: rate(revenue_usd_total[1h]) < (rate(revenue_usd_total[24h]) * 0.5)
        for: 15m
        labels:
          severity: critical
          team: finance
        annotations:
          summary: "Abnormal revenue drop detected"
          description: "Current revenue rate is {{ $value }} USD/h, significantly below 24h average"

      - alert: HighRefundRate
        expr: rate(refunds_total[1h]) / rate(purchases_total[1h]) > 0.02
        for: 10m
        labels:
          severity: warning
          team: finance
        annotations:
          summary: "High refund rate detected"
          description: "Refund rate is {{ $value | humanizePercentage }}, above threshold of 2%"

      # Системные метрики
      - alert: HighDatabaseConnectionLatency
        expr: histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High database connection latency"
          description: "95th percentile database query latency is {{ $value }} seconds, above threshold of 1s"

      - alert: LowCacheHitRatio
        expr: rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) < 0.8
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "Low cache hit ratio"
          description: "Cache hit ratio is {{ $value | humanizePercentage }}, below threshold of 80%"

      - alert: HighIPFSUploadLatency
        expr: histogram_quantile(0.95, rate(ipfs_upload_duration_seconds_bucket[5m])) > 30
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High IPFS upload latency"
          description: "95th percentile IPFS upload latency is {{ $value }} seconds, above threshold of 30s"

      # Блокчейн метрики
      - alert: HighTransactionFailureRate
        expr: rate(blockchain_transactions_failed_total[5m]) / rate(blockchain_transactions_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
          team: blockchain
        annotations:
          summary: "High blockchain transaction failure rate"
          description: "Blockchain transaction failure rate is {{ $value | humanizePercentage }}, above threshold of 5%"

      - alert: LowSolanaRPCAvailability
        expr: up{job="solana-rpc"} == 0
        for: 2m
        labels:
          severity: critical
          team: blockchain
        annotations:
          summary: "Solana RPC unavailable"
          description: "Solana RPC endpoint is unavailable"
```

## 📅 План реализации

### Неделя 1

- [ ] Создать систему кастомных ошибок
- [ ] Реализовать расширенный логгер
- [ ] Добавить централизованную обработку ошибок в API
- [ ] Интегрировать Sentry для трассировки ошибок

### Неделя 2

- [ ] Улучшить обработку ошибок во всех критических сервисах
- [ ] Добавить контекст к логам (correlation ID, user ID и т.д.)
- [ ] Реализовать трассировку транзакций
- [ ] Добавить метрики производительности

### Неделя 3

- [ ] Интегрировать DataDog или другую систему APM
- [ ] Создать расширенные алерты с бизнес-метриками
- [ ] Добавить мониторинг блокчейн операций
- [ ] Реализовать трассировку распределенных запросов

### Неделя 4

- [ ] Провести аудит текущей системы обработки ошибок
- [ ] Добавить недостающие алерты и метрики
- [ ] Создать документацию по системе мониторинга
- [ ] Настроить дашборды в Grafana

## 📊 Метрики успеха

- Снижение количества необработанных ошибок на 80%
- Уменьшение времени Mean Time To Resolution (MTTR) на 60%
- Повышение покрытия логами критических путей до 100%
- Увеличение видимости в системах мониторинга на 90%
- Снижение количества инцидентов в продакшене на 70%

## 🛠️ Инструменты

- Winston для структурированного логирования
- Sentry для трассировки ошибок
- DataDog/NewRelic для APM
- Prometheus для метрик
- Grafana для визуализации
- OpenTelemetry для распределенной трассировки
