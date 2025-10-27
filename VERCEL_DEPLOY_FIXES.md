# 🚨 Исправление ошибок деплоя на Vercel

## Основные проблемы и решения

### 1. Конфликт настроек Next.js с Vercel

**Проблема**: Конфигурация `output: "standalone"` конфликтует с serverless окружением Vercel.

**Решение**: В `next.config.ts` закомментирована строка:
```typescript
// output: "standalone", // Раскомментировать только если нужно кастомный сервер
```

### 2. WebSocket соединения

**Проблема**: Vercel не поддерживает постоянные WebSocket соединения в serverless функциях.

**Решение**: В `server.ts` добавлена проверка:
```typescript
// Skip Socket.IO setup when running on Vercel since serverless functions don't support persistent connections
if (process.env.VERCEL !== "1") {
  // Socket.IO setup code
}
```

### 3. Node.js модули в браузере

**Проблема**: Некоторые Node.js модули пытаются загружаться в браузере.

**Решение**: В `next.config.ts` добавлены fallbacks:
```typescript
if (!isServer) {
  config.resolve.fallback = {
    fs: false,
    net: false,
    tls: false,
    crypto: false,
    stream: false,
    http: false,
    https: false,
    assert: false,
    os: false,
    url: false,
    zlib: false,
    path: false,
    util: false,
  };
}
```

### 4. Зависимости сервера

**Проблема**: Некоторые зависимости предназначены только для кастомного сервера.

**Решение**: В `serverExternalPackages` добавлены серверные зависимости:
```typescript
serverExternalPackages: [
  "@prisma/client",
  "bcryptjs",
  "argon2",
  "sharp",
  "zod",
  // ... другие серверные пакеты
]
```

## 🔧 Шаги по исправлению деплоя

### Шаг 1: Обновить зависимости
```bash
# Убедитесь что все зависимости корректно указаны
npm install

# Проверьте что нет конфликтующих зависимостей
npm audit
```

### Шаг 2: Проверить настройки сборки
```bash
# Попробуйте собрать локально
npm run build

# Если есть ошибки, проверьте логи
npm run build 2>&1 | tee build.log
```

### Шаг 3: Обновить переменные окружения на Vercel

В панели управления Vercel добавьте/обновите переменные:

**Критически важные переменные:**
- `DATABASE_URL` - URL базы данных
- `JWT_SECRET` - секрет для JWT токенов
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `NEXT_PUBLIC_APP_URL` - публичный URL приложения

**Дополнительные переменные:**
- `REDIS_URL` - URL Redis (если используется)
- `SENTRY_DSN` - Sentry для мониторинга ошибок
- `STRIPE_SECRET_KEY` - секрет Stripe (если используется)

### Шаг 4: Проверить API эндпоинты

Убедитесь что все API роуты совместимы с serverless:

```typescript
// ❌ Плохо - использует серверные возможности
export async function GET() {
  // Database connections, file system access
}

// ✅ Хорошо - serverless совместимый
export async function GET(request: NextRequest) {
  // Только HTTP запросы, без постоянных соединений
}
```

### Шаг 5: Мониторинг деплоя

В панели Vercel:
1. Перейдите в проект
2. Откройте вкладку "Deployments"
3. Проверьте логи последнего деплоя
4. Ищите ошибки в разделах "Build Logs" и "Runtime Logs"

## 🛠️ Распространенные ошибки и решения

### Ошибка: "Module not found"
```
Module not found: Error: Can't resolve 'fs' in '/vercel/path0'
```

**Решение**: Убедитесь что в webpack fallbacks отключены Node.js модули.

### Ошибка: "WebSocket connection failed"
```
WebSocket connection to 'wss://...' failed
```

**Решение**: Используйте Server-Sent Events или polling вместо WebSocket на Vercel.

### Ошибка: "Database connection timeout"
```
Error: P1001: Can't reach database server
```

**Решение**: Проверьте переменную `DATABASE_URL` и доступность базы данных.

### Ошибка: "Function timeout"
```
Error: Function timeout after 30 seconds
```

**Решение**: Увеличьте таймаут функции в `vercel.json`:
```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

## 🚀 Рекомендации для продакшна

### 1. Используйте Vercel KV вместо Redis
```typescript
// Вместо ioredis используйте @vercel/kv
import { kv } from '@vercel/kv';
```

### 2. Оптимизируйте изображения
```typescript
// Используйте next/image для автоматической оптимизации
import Image from 'next/image';
```

### 3. Используйте Vercel Analytics
```typescript
// Автоматический сбор аналитики
import { Analytics } from '@vercel/analytics/react';
```

### 4. Настройте мониторинг ошибок
```typescript
// Интеграция с Sentry
import * as Sentry from '@sentry/nextjs';
```

## 📞 Поддержка

Если проблемы не решаются:

1. **Проверьте логи деплоя** в панели Vercel
2. **Создайте issue** в репозитории с логами ошибок
3. **Обратитесь в поддержку Vercel** для специфичных проблем платформы

---

*Эти исправления должны решить основные проблемы с деплоем на Vercel. Если ошибки продолжаются, предоставьте логи деплоя для более детального анализа.*
