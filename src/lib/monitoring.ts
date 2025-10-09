/**
 * Система мониторинга и логирования для DNB1ST
 *
 * Этот модуль предоставляет централизованный механизм для:
 * - Логирования событий
 * - Мониторинга производительности
 * - Отслеживания ошибок
 * - Сбор метрик
 */

// Интерфейсы для типов данных
export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  service: string;
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  requestId?: string;
}

export interface MetricData {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: string;
}

export interface PerformanceData {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, string>;
}

// Класс для логирования
export class Logger {
  private serviceName: string;
  private logLevel: string;
  private logs: LogEntry[] = [];

  constructor(serviceName: string, logLevel: string = "info") {
    this.serviceName = serviceName;
    this.logLevel = logLevel;
  }

  // Форматирует сообщение для лога
  private formatMessage(
    level: LogEntry["level"],
    message: string,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      metadata,
      requestId: this.getRequestId(),
    };
  }

  // Получает ID текущего запроса
  private getRequestId(): string | undefined {
    // В реальном приложении здесь будет получение ID из контекста запроса
    return undefined;
  }

  // Логирует информационное сообщение
  info(message: string, metadata?: Record<string, any>): void {
    const entry = this.formatMessage("info", message, metadata);
    this.logs.push(entry);
    this.logToConsole(entry);
    this.sendToMonitoringSystem(entry);
  }

  // Логирует предупреждение
  warn(message: string, metadata?: Record<string, any>): void {
    const entry = this.formatMessage("warn", message, metadata);
    this.logs.push(entry);
    this.logToConsole(entry);
    this.sendToMonitoringSystem(entry);
  }

  // Логирует ошибку
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    const entry = this.formatMessage("error", message, {
      ...metadata,
      error: error?.message,
      stack: error?.stack,
    });
    this.logs.push(entry);
    this.logToConsole(entry);
    this.sendToMonitoringSystem(entry);
    this.sendToErrorTrackingSystem(entry);
  }

  // Логирует отладочную информацию
  debug(message: string, metadata?: Record<string, any>): void {
    if (this.logLevel === "debug") {
      const entry = this.formatMessage("debug", message, metadata);
      this.logs.push(entry);
      this.logToConsole(entry);
    }
  }

  // Выводит в консоль
  private logToConsole(entry: LogEntry): void {
    const logMethod =
      entry.level === "error"
        ? "error"
        : entry.level === "warn"
        ? "warn"
        : "log";

    console[logMethod](
      `[${
        entry.timestamp
      }] ${entry.service.toUpperCase()}:${entry.level.toUpperCase()} - ${
        entry.message
      }`,
      entry.metadata ? entry.metadata : ""
    );
  }

  // Отправляет в систему мониторинга
  private async sendToMonitoringSystem(entry: LogEntry): Promise<void> {
    try {
      // Отправка в Sentry
      if (process.env.SENTRY_DSN) {
        try {
          const Sentry = await import("@sentry/node");
          Sentry.init({
            dsn: process.env.SENTRY_DSN,
            tracesSampleRate: parseFloat(
              process.env.SENTRY_TRACES_SAMPLE_RATE || "1.0"
            ),
          });

          Sentry.captureMessage(entry.message, {
            level: entry.level as any,
            contexts: {
              service: {
                name: entry.service,
                userId: entry.userId,
                requestId: entry.requestId,
              },
              metadata: entry.metadata,
            },
            // Убираем timestamp, так как он не нужен для captureMessage
          });
        } catch (sentryError) {
          console.error("Failed to send log to Sentry:", sentryError);
        }
      }

      // Отправка в New Relic
      if (process.env.NEW_RELIC_LICENSE_KEY) {
        try {
          // Проверяем, установлен ли newrelic
          // Используем dynamic import с обработкой ошибок
          const newrelicModule = await import("newrelic").catch(() => null);
          if (
            newrelicModule &&
            typeof (newrelicModule as any).recordLogEvent === "function"
          ) {
            const logData = {
              timestamp: entry.timestamp,
              level: entry.level,
              service: entry.service,
              message: entry.message,
              metadata: entry.metadata,
              userId: entry.userId,
              requestId: entry.requestId,
            };

            (newrelicModule as any).recordLogEvent(logData);
          }
        } catch (newRelicError) {
          console.error("Failed to send log to New Relic:", newRelicError);
        }
      }

      // Отправка в Datadog
      if (process.env.DATADOG_API_KEY) {
        try {
          // В реальном приложении здесь будет отправка в Datadog API
          // Это просто пример структуры
          const datadogPayload = {
            ddsource: entry.service,
            ddtags: `level:${entry.level},service:${entry.service}`,
            hostname: process.env.HOSTNAME || "localhost",
            message: entry.message,
            timestamp: new Date(entry.timestamp).getTime(),
            metadata: entry.metadata,
          };

          // Отправка через HTTP-запрос
          // await fetch('https://http-intake.logs.datadoghq.com/api/v2/logs', {
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'application/json',
          //     'DD-API-KEY': process.env.DATADOG_API_KEY
          //   },
          //   body: JSON.stringify(datadogPayload)
          // });
        } catch (datadogError) {
          console.error("Failed to send log to Datadog:", datadogError);
        }
      }
    } catch (error) {
      console.error("Failed to send log to monitoring system:", error);
    }
  }

  // Отправляет в систему отслеживания ошибок
  private async sendToErrorTrackingSystem(entry: LogEntry): Promise<void> {
    try {
      // В реальном приложении здесь будет отправка критических ошибок
      if (entry.level === "error") {
        // Отправка в систему отслеживания ошибок
      }
    } catch (error) {
      console.error("Failed to send error to tracking system:", error);
    }
  }

  // Получает все логи
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Очищает логи
  clearLogs(): void {
    this.logs = [];
  }
}

// Класс для сбора метрик
export class MetricsCollector {
  private metrics: MetricData[] = [];
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  // Регистрирует метрику
  metric(name: string, value: number, tags: Record<string, string> = {}): void {
    const metricData: MetricData = {
      name,
      value,
      tags: {
        service: this.serviceName,
        ...tags,
      },
      timestamp: new Date().toISOString(),
    };

    this.metrics.push(metricData);
    this.sendToMonitoringSystem(metricData);
  }

  // Регистрирует счетчик
  increment(
    name: string,
    tags: Record<string, string> = {},
    value: number = 1
  ): void {
    this.metric(name, value, tags);
  }

  // Регистрирует гистограмму
  histogram(
    name: string,
    value: number,
    tags: Record<string, string> = {}
  ): void {
    this.metric(`${name}_duration`, value, tags);
  }

  // Отправляет в систему мониторинга
  private async sendToMonitoringSystem(metric: MetricData): Promise<void> {
    try {
      // В реальном приложении здесь будет отправка в Prometheus, Datadog и т.д.
      if (process.env.NEW_RELIC_LICENSE_KEY) {
        // Отправка в New Relic
      }
    } catch (error) {
      console.error("Failed to send metric to monitoring system:", error);
    }
  }

  // Получает все метрики
  getMetrics(): MetricData[] {
    return [...this.metrics];
  }

  // Очищает метрики
  clearMetrics(): void {
    this.metrics = [];
  }
}

// Класс для мониторинга производительности
export class PerformanceMonitor {
  private timers: Map<
    string,
    { startTime: number; metadata: Record<string, any> }
  > = new Map();
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  // Начинает измерение времени
  startTimer(operation: string, metadata: Record<string, any> = {}): void {
    this.timers.set(operation, {
      startTime: Date.now(),
      metadata,
    });
  }

  // Завершает измерение времени
  endTimer(operation: string, success: boolean = true): PerformanceData | null {
    const timer = this.timers.get(operation);
    if (!timer) {
      console.warn(`No timer found for operation: ${operation}`);
      return null;
    }

    const duration = Date.now() - timer.startTime;
    const performanceData: PerformanceData = {
      operation,
      duration,
      success,
      metadata: timer.metadata,
    };

    this.timers.delete(operation);

    // Отправляем метрику
    const metricsCollector = new MetricsCollector(this.serviceName);
    metricsCollector.histogram("operation_duration", duration, {
      operation,
      success: success.toString(),
    });

    return performanceData;
  }

  // Измеряет выполнение функции
  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata: Record<string, any> = {}
  ): Promise<{ result: T; performance: PerformanceData }> {
    this.startTimer(operation, metadata);

    try {
      const result = await fn();
      const performance = this.endTimer(operation, true)!;
      return { result, performance };
    } catch (error) {
      this.endTimer(operation, false);
      throw error;
    }
  }

  // Измеряет выполнение синхронной функции
  measureSync<T>(
    operation: string,
    fn: () => T,
    metadata: Record<string, any> = {}
  ): { result: T; performance: PerformanceData } {
    this.startTimer(operation, metadata);

    try {
      const result = fn();
      const performance = this.endTimer(operation, true)!;
      return { result, performance };
    } catch (error) {
      this.endTimer(operation, false);
      throw error;
    }
  }
}

// Глобальные экземпляры
export const logger = new Logger("dnb1st");
export const metrics = new MetricsCollector("dnb1st");
export const performance = new PerformanceMonitor("dnb1st");

// Middleware для логирования запросов
export function loggingMiddleware(request: any): void {
  const startTime = Date.now();
  const url = request.nextUrl?.pathname || request.url;

  // Логируем начало запроса
  logger.info("Request started", {
    method: request.method,
    url,
    userAgent: request.headers.get("user-agent"),
    ip:
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip"),
  });

  // В Next.js мы не можем перехватить Response.end напрямую
  // Вместо этого мы можем использовать глобальный перехватчик
  // или создать кастомный middleware в middleware.ts

  // Для простоты оставим логирование только начала запроса
  // Конечное логирование будет в каждом роуте отдельно
}

// Функция для health check
export async function healthCheck(): Promise<{
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, string>;
  metrics: Record<string, any>;
}> {
  const checks: Record<string, string> = {};

  // Проверяем базу данных
  try {
    // Здесь будет проверка подключения к базе данных
    checks.database = "healthy";
  } catch (error) {
    checks.database = "unhealthy";
  }

  // Проверяем Redis
  try {
    // Здесь будет проверка подключения к Redis
    checks.redis = "healthy";
  } catch (error) {
    checks.redis = "unhealthy";
  }

  // Проверяем внешние сервисы
  try {
    // Здесь будет проверка внешних сервисов
    checks.external = "healthy";
  } catch (error) {
    checks.external = "unhealthy";
  }

  // Определяем общий статус
  const allChecks = Object.values(checks);
  const status = allChecks.every((check) => check === "healthy")
    ? "healthy"
    : allChecks.every((check) => check === "unhealthy")
    ? "unhealthy"
    : "degraded";

  return {
    status,
    checks,
    metrics: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    },
  };
}
