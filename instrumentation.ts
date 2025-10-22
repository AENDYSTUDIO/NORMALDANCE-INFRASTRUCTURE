import * as Sentry from "@sentry/nextjs";
import { logger } from "./src/lib/logger";

// Инициализация Sentry при старте приложения
export async function register() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
    try {
      // Импорт Sentry конфигурации
      const SentryConfig = {
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
        tracesSampleRate: parseFloat(
          process.env.SENTRY_TRACES_SAMPLE_RATE || "0.2"
        ),
        profilesSampleRate: parseFloat(
          process.env.SENTRY_PROFILES_SAMPLE_RATE || "0.2"
        ),
        environment: process.env.NODE_ENV || "development",
        release: process.env.npm_package_version || "1.0.0",
        integrations: [],
      };

      // Инициализация Sentry
      Sentry.init(SentryConfig);

      logger.info("Sentry initialized successfully", {
        environment: SentryConfig.environment,
        release: SentryConfig.release,
        tracesSampleRate: SentryConfig.tracesSampleRate,
      });
    } catch (error) {
      logger.error("Failed to initialize Sentry", error);
    }
  }
}

// Обработка ошибок на сервере
export function onError(error: Error) {
  logger.error("Server error captured by instrumentation", {
    message: error.message,
    stack: error.stack,
    name: error.name,
  });

  // Отправка ошибки в Sentry, если он инициализирован
  try {
    Sentry.captureException(error);
  } catch (sentryError) {
    logger.error("Failed to send error to Sentry", sentryError);
  }
}
