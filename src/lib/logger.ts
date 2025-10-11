/**
 * Централизованная система логирования для NORMALDANCE
 * Обеспечивает унифицированный интерфейс для логирования с разными уровнями
 */

import { format } from "logform";
import winston from "winston";

// Интерфейс для конфигурации логгера
export interface LoggerConfig {
  level: string;
  format: any;
  transports: any[];
  exitOnError: boolean;
}

// Интерфейс для логов запросов
export interface LogRequest {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  correlationId?: string;
}

// Интерфейс для логов rate limiting
export interface LogRateLimit {
  ip: string;
  url: string;
  limit: number;
  windowMs: number;
  userId?: string;
  correlationId?: string;
}

// Уровни логирования
export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  HTTP = "http",
  VERBOSE = "verbose",
  DEBUG = "debug",
  SILLY = "silly",
}

// Кастомный формат для логов
const customFormat = format.combine(
  format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  format.errors({ stack: true }),
  format.json(),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }

    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

// Конфигурация логгера
const loggerConfig: LoggerConfig = {
  level: process.env.LOG_LEVEL || "info",
  format: customFormat,
  transports: [
    // Консольный транспорт
    new winston.transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),

    // Файловый транспорт для ошибок
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: format.combine(format.timestamp(), format.json()),
      // Добавляем ротацию логов
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),

    // Файловый транспорт для всех логов
    new winston.transports.File({
      filename: "logs/combined.log",
      format: format.combine(format.timestamp(), format.json()),
      // Добавляем ротацию логов
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),

    // Добавляем HTTP транспорт для отправки логов во внешнюю систему
    ...(process.env.LOGGING_ENDPOINT
      ? [
          new winston.transports.Http({
            host: process.env.LOGGING_HOST || "localhost",
            port: parseInt(process.env.LOGGING_PORT || "3000"),
            path: process.env.LOGGING_PATH || "/api/logs",
            ssl: process.env.LOGGING_SSL === "true",
            format: format.combine(format.timestamp(), format.json()),
          }),
        ]
      : []),
  ],
  exitOnError: false,
};

// Создание логгера
const logger = winston.createLogger(loggerConfig);

// Добавляем HTTP транспорт для логирования запросов
logger.add(
  new winston.transports.Http({
    level: "http",
    format: format.json(),
  })
);

// Хелпер для логирования запросов
export const logRequest = (
  method: string,
  url: string,
  statusCode: number,
  responseTime: number,
  context?: {
    userId?: string;
    correlationId?: string;
  }
): void => {
  logger.http("HTTP Request", {
    method,
    url,
    statusCode,
    responseTime,
    userId: context?.userId,
    correlationId: context?.correlationId,
  });
};

// Хелпер для логирования rate limiting
export const logRateLimit = (
  ip: string,
  url: string,
  limit: number,
  windowMs: number,
  context?: {
    userId?: string;
    correlationId?: string;
  }
): void => {
  logger.warn("Rate limit exceeded", {
    ip,
    url,
    limit,
    windowMs,
    userId: context?.userId,
    correlationId: context?.correlationId,
  });
};

// Хелпер для логирования ошибок
export const logError = (
  error: Error,
  context?: {
    userId?: string;
    operation?: string;
    resource?: string;
    correlationId?: string;
  }
): void => {
  logger.error("Error occurred", error, {
    userId: context?.userId,
    operation: context?.operation,
    resource: context?.resource,
    correlationId: context?.correlationId,
    stack: error.stack,
  });
};

// Хелпер для логирования информации
export const logInfo = (
  message: string,
  context?: {
    userId?: string;
    operation?: string;
    resource?: string;
    correlationId?: string;
  }
): void => {
  logger.info(message, {
    userId: context?.userId,
    operation: context?.operation,
    resource: context?.resource,
    correlationId: context?.correlationId,
  });
};

// Хелпер для логирования предупреждений
export const logWarn = (
  message: string,
  context?: {
    userId?: string;
    operation?: string;
    resource?: string;
    correlationId?: string;
  }
): void => {
  logger.warn(message, {
    userId: context?.userId,
    operation: context?.operation,
    resource: context?.resource,
    correlationId: context?.correlationId,
  });
};

// Хелпер для логирования отладочной информации
export const logDebug = (
  message: string,
  context?: {
    userId?: string;
    operation?: string;
    resource?: string;
    correlationId?: string;
  }
): void => {
  logger.debug(message, {
    userId: context?.userId,
    operation: context?.operation,
    resource: context?.resource,
    correlationId: context?.correlationId,
  });
};

// Экспортируем логгер по умолчанию
export default logger;
