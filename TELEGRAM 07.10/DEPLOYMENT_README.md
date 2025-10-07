# 🚀 Руководство по развертыванию на Vercel с Upstash Redis

Это подробное руководство по настройке и развертыванию Next.js приложения с интеграцией Upstash Redis на платформе Vercel.

## 📋 Содержание
- [Требования](#требования)
- [Быстрая настройка](#быстрая-настройка)
- [Конфигурация переменных окружения](#конфигурация-переменных-окружения)
- [Настройка Upstash Redis](#настройка-upstash-redis)
- [Настройка кастомного домена](#настройка-кастомного-домена)
- [SSL сертификаты](#ssl-сертификаты)
- [Оптимизация производительности](#оптимизация-производительности)
- [Мониторинг и логирование](#мониторинг-и-логирование)
- [Устранение неисправностей](#устранение-неисправностей)

## 🛠 Требования

- Аккаунт Vercel
- Аккаунт Upstash
- Доменное имя (опционально)
- Node.js 18+
- npm/yarn/pnpm

## ⚡ Быстрая настройка

### 1. Установка зависимостей

```bash
npm install @upstash/redis ioredis
```

### 2. Настройка Upstash Redis

1. Создайте базу данных в [Upstash Console](https://console.upstash.com)
2. Скопируйте REST URL и Token из панели управления
3. Добавьте переменные окружения в Vercel Dashboard

### 3. Развертывание на Vercel

```bash
# Установка Vercel CLI
npm i -g vercel

# Авторизация
vercel login

# Развертывание
vercel --prod
```

## 🔧 Конфигурация переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
# Database Configuration
DATABASE_URL="file:./dev.db"

# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL="https://your-redis-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# NextAuth Configuration
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Blockchain RPC URLs
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
TON_RPC_URL="https://toncenter.com/api/v2/jsonRPC"

# Security
JWT_SECRET="your-jwt-secret-key"
ENCRYPTION_KEY="your-32-character-encryption-key"

# Rate Limiting
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW_MS="900000"

# Redis Cache Configuration
REDIS_CACHE_TTL="3600"
REDIS_SESSION_TTL="86400"

# Performance Optimization
COMPRESSION_LEVEL="6"
BROTLI_QUALITY="4"
```

## ⚙️ Настройка Upstash Redis

### Создание базы данных

1. Перейдите в [Upstash Console](https://console.upstash.com)
2. Создайте новый Redis database
3. Выберите регион, ближайший к вашему развертыванию (например, `US-East-1`)
4. Скопируйте REST URL и Token

### Конфигурация сети

Upstash Redis автоматически доступен из Vercel без дополнительной настройки сети.

### Мониторинг Redis

Используйте встроенный мониторинг Upstash для отслеживания:
- Использования памяти
- Количества подключений
- Производительности команд

## 🌐 Настройка кастомного домена

### В Vercel Dashboard

1. Перейдите в настройки проекта
2. Выберите вкладку "Domains"
3. Добавьте ваш домен
4. Следуйте инструкциям по настройке DNS

### В коде

Обновите `next.config.ts`:

```typescript
const nextConfig = {
  // ... другие настройки
  env: {
    CUSTOM_DOMAIN: process.env.CUSTOM_DOMAIN,
  },
}
```

## 🔒 SSL сертификаты

Vercel автоматически предоставляет SSL сертификаты для всех доменов через Let's Encrypt.

### Автоматическое продление

Сертификаты автоматически продлеваются за 30 дней до истечения срока действия.

### Кастомные сертификаты

Для использования собственных сертификатов:

1. Перейдите в настройки домена в Vercel
2. Загрузите сертификат и приватный ключ
3. Укажите пути в переменных окружения:

```env
SSL_CERT_PATH="/etc/ssl/certs/cert.pem"
SSL_KEY_PATH="/etc/ssl/private/key.pem"
```

## ⚡ Оптимизация производительности

### Настройки сборки

В `next.config.ts` включены оптимизации:

```typescript
const nextConfig = {
  swcMinify: true,
  optimizeFonts: true,
  productionBrowserSourceMaps: false,
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
}
```

### Кеширование

Используйте Redis для кеширования часто запрашиваемых данных:

```typescript
import { cacheManager } from '@/libs/redis'

export async function getCachedData(key: string) {
  // Попытка получить из кеша
  const cached = await cacheManager.get(key)
  if (cached) return cached

  // Получение данных из источника
  const data = await fetchData()

  // Сохранение в кеш
  await cacheManager.set(key, data)

  return data
}
```

### Сжатие

Настройки сжатия в Vercel:
- Gzip уровень 6
- Brotli качество 4
- Автоматическая оптимизация изображений

## 📊 Мониторинг и логирование

### Логи Vercel

Доступны в панели управления Vercel:
- Function logs
- Build logs
- Deployment logs

### Кастомное логирование

```typescript
// В API routes
export async function POST(request: Request) {
  console.log('API request:', request.url)

  try {
    // Ваш код
  } catch (error) {
    console.error('Error:', error)
    // Логи автоматически отправляются в Vercel
  }
}
```

### Метрики производительности

Используйте Vercel Analytics или интегрируйте Sentry:

```env
SENTRY_DSN="your-sentry-dsn"
ENABLE_METRICS="true"
```

## 🔧 Настройки Prisma для продакшена

Обновите `schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql" // Используйте PostgreSQL для продакшена
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Для миграций
}
```

### Миграции базы данных

```bash
# Генерация клиента
npx prisma generate

# Пуш схемы (только для разработки)
npx prisma db push

# Миграции (для продакшена)
npx prisma migrate deploy
```

## 🚨 Устранение неисправностей

### Ошибка подключения к Redis

```bash
# Проверьте переменные окружения
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Тестирование подключения
npm run test:redis
```

### Проблемы с памятью

1. Увеличьте лимит памяти в Upstash
2. Оптимизируйте TTL для кеша
3. Используйте пагинацию для больших запросов

### Проблемы производительности

1. Включите мониторинг в Upstash
2. Используйте CDN для статических файлов
3. Оптимизируйте изображения
4. Внедрите кеширование API ответов

## 📞 Поддержка

- [Документация Vercel](https://vercel.com/docs)
- [Документация Upstash](https://docs.upstash.com)
- [Документация Prisma](https://www.prisma.io/docs)

## 🔄 Автоматизация развертывания

### GitHub Actions

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Скрипты в package.json

```json
{
  "scripts": {
    "deploy": "vercel --prod",
    "deploy:preview": "vercel",
    "logs": "vercel logs --follow",
    "env:pull": "vercel env pull .env.local"
  }
}
```

---

*Это руководство поддерживается и обновляется командой разработки. Последнее обновление: 2025-01-07*
