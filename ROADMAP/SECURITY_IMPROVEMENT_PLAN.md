# План улучшения безопасности

## Обзор

В этом документе описывается план улучшения системы безопасности проекта NormalDance. Это улучшение имеет высокий приоритет для Q1 2025 года, так как обеспечивает защиту пользовательских данных и устойчивость системы к атакам.

## Текущая ситуация

### Существующие меры безопасности

- Базовая аутентификация через NextAuth
- Защита от CSRF-атак
- Санитизация пользовательского ввода
- Использование HTTPS

### Выявленные уязвимости

- Отсутствие ограничения частоты запросов (rate limiting)
- Недостаточная защита CORS
- Устаревшие зависимости с уязвимостями
- Отсутствие security headers

## Цели улучшения

### Основные цели

- Реализовать полноценное ограничение частоты запросов
- Настроить надежную CORS-политику
- Обновить уязвимые зависимости
- Добавить security headers

### Технические цели

- Защита от DDoS-атак
- Улучшенная безопасность данных
- Соответствие современным стандартам безопасности
- Повышение доверия пользователей

## План реализации

### Этап 1: Анализ уязвимостей (Неделя 1)

- Проведение аудита безопасности
- Сканирование зависимостей на уязвимости
- Анализ текущих уязвимостей
- Оценка рисков

### Этап 2: Разработка (Неделя 2-4)

- Реализация rate limiting в `src/middleware/rate-limiter.ts`
- Настройка CORS-политик
- Обновление уязвимых зависимостей
- Добавление security headers

### Этап 3: Тестирование (Неделя 5)

- Тестирование защиты от DDoS-атак
- Проверка CORS-политик
- Тестирование совместимости
- Проверка производительности

### Этап 4: Внедрение (Неделя 6)

- Постепенное внедрение изменений
- Мониторинг после внедрения
- Обновление документации
- Обучение команды

## Технические детали

### Rate limiting

#### Текущая реализация

```typescript
// src/middleware/rate-limiter.ts - текущая реализация отсутствует
```

#### Новая реализация

```typescript
import { NextRequest } from "next/server";
import { kv } from "@vercel/kv";

export async function rateLimit(
  identifier: string,
  limit: number,
  window: number
) {
  const key = `rate-limit:${identifier}`;
  const current = await kv.incr(key);

  if (current === 1) {
    await kv.expire(key, window);
  }

  if (current > limit) {
    return {
      blocked: true,
      retryAfter: await kv.ttl(key),
    };
  }

  return {
    blocked: false,
    remaining: limit - current,
  };
}

// Middleware для защиты API-эндпоинтов
export function withRateLimit(handler: any) {
  return async (req: NextRequest, ...args: any[]) => {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const result = await rateLimit(ip, 100, 60); // 100 запросов в минуту

    if (result.blocked) {
      return new Response("Too many requests", {
        status: 429,
        headers: {
          "Retry-After": result.retryAfter.toString(),
        },
      });
    }

    return handler(req, ...args);
  };
}
```

### CORS-политика

#### Настройка CORS-политики

```typescript
// Конфигурация CORS для Next.js
const corsOptions = {
  origin: [
    "https://normaldance.com",
    "https://www.normaldance.com",
    "https://normaldance-git-main.vercel.app",
    // разрешенные домены для разработки
    ...(process.env.NODE_ENV === "development"
      ? ["http://localhost:3000"]
      : []),
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200,
};
```

### Security headers

#### Добавление security headers

```typescript
// headers middleware
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=6307200; includeSubDomains; preload",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.normaldance.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://*.solana.com https://*.pinata.cloud; frame-src 'self' https://*.youtube.com;",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};
```

### Обновление зависимостей

#### Процесс обновления

- Использование `npm audit` для выявления уязвимостей
- Обновление до безопасных версий
- Тестирование совместимости
- Обновление lock-файла

## Риски и меры по их снижению

### Риск 1: Повлияет на производительность

- **Мера**: Оптимизация rate limiting через Redis/KV
- **Мера**: Тестирование производительности

### Риск 2: Проблемы совместимости

- **Мера**: Тестирование в изолированной среде
- **Мера**: Постепенное внедрение

### Риск 3: Блокировка легитимных пользователей

- **Мера**: Настройка разумных лимитов
- **Мера**: Мониторинг и корректировка параметров

## Критерии успеха

- Защита от DDoS-атак
- Улучшенная безопасность данных
- Соответствие современным стандартам безопасности
- Успешное прохождение всех тестов
- Отсутствие негативного влияния на пользовательский опыт

## Ресурсы

- 1-2 разработчика на 6 недель
- Специалист по безопасности (консультация)
- QA-инженер для тестирования

## Сроки

- Начало: 1 января 2025
- Завершение: 12 февраля 2025
- Общее время: 6 недель
