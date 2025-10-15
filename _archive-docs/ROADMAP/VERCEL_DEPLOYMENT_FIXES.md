# Исправление проблем с Vercel деплойментом

## Проблемы, выявленные в логах Vercel:

1. **PrismaClientInitializationError**: Ошибка из-за отсутствия переменной окружения `DATABASE_URL` в production
2. **MissingSecretError**: Ошибка из-за отсутствия переменной окружения `NEXTAUTH_SECRET` в production

## Решения:

### 1. Настройка переменных окружения в Vercel

Все переменные окружения должны быть настроены в панели управления Vercel:

#### Необходимые переменные:

```
DATABASE_URL=postgresql://postgres:postgres@db.normaldance.com:5432/normaldance_prod?schema=public
NEXTAUTH_SECRET=NDT_prod_auth_2024_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b_secret_key_for_production
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_RPC_TIMEOUT=8000
NEXT_PUBLIC_NDT_PROGRAM_ID=NDT11111111
NEXT_PUBLIC_NDT_MINT_ADDRESS=NDT11111111
NEXT_PUBLIC_TRACKNFT_PROGRAM_ID=TRACK1111
NEXT_PUBLIC_STAKING_PROGRAM_ID=STAKE11111111
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io
PINATA_API_KEY=789c738f136b9c0e1114
PINATA_SECRET_KEY=91d1a4bf06059241718f0373e60b464ebe17f9d62ea7c5b339e8c720f263e6ff
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI4YzFlMDhhNy1kMTc4LTQ0YzQtOWE4Ny03Yzk0OGMzY2QzMzciLCJlbWFpbCI6ImFlbmR5c3R1ZGlvQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI3ODljNzM4ZjEzNmI5YzBlMTExNCIsInNjb3BlZEtlWXNlY3JldCI6IjkxZDFhNGJmMDYwNTkyNDE3MThmMDM3M2U2MGI0NjRlYmUxN2Y5ZDYyZWE3YzViMzM5ZThjNzIwZjI2M2U2ZmYiLCJleHAiOjE3ODk4ODE1MTh9.Uda4nlL0K8zlZQYrTC3KU8X0gfozQZw8raO96L5mUUA
SPOTIFY_CLIENT_ID=spotify_client_id_here
SPOTIFY_CLIENT_SECRET=spotify_client_secret_here
APPLE_CLIENT_ID=apple_client_id_here
APPLE_CLIENT_SECRET=apple_client_secret_here
REDIS_URL=redis://prod-redis.normaldance.com:6379
JWT_SECRET=NDT_prod_jwt_2024_secure_key_change_in_production_for_real_deployment
SENTRY_DSN=https://sentry_normaldance_dsn_here
MIXPANEL_TOKEN=mixpanel_token_here
NODE_ENV=production
DEBUG=false
```

### 2. Проверка файлов конфигурации

#### Файл `.env.production`:

Создан и содержит все необходимые переменные для production окружения.

#### Файл `.env`:

Создан для development окружения с локальными настройками.

#### Файл `vercel.json`:

Конфигурация Vercel уже настроена правильно.

### 3. Проверка конфигурации Prisma

#### Файл `prisma/schema.prisma`:

Убедитесь, что в файле присутствует следующая конфигурация:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4. Проверка конфигурации NextAuth

#### Файл `src/lib/auth.ts`:

Обновлен для корректной проверки и использования переменных окружения.

### 5. Проверка зависимостей

Убедитесь, что в `package.json` установлены все необходимые зависимости:

```json
{
  "dependencies": {
    "@next-auth/prisma-adapter": "^1.0.7",
    "next-auth": "^4.24.7",
    "prisma": "^5.16.3"
  }
}
```

## Шаги для исправления:

1. **Добавьте переменные окружения в Vercel**:

   - Перейдите в панель управления Vercel для проекта
   - Перейдите в раздел "Settings" → "Environment Variables"
   - Добавьте все необходимые переменные окружения

2. **Проверьте конфигурацию Prisma**:

   - Убедитесь, что переменная `DATABASE_URL` указывает на правильную PostgreSQL базу данных
   - Убедитесь, что база данных доступна из Vercel

3. **Перезапустите деплоймент**:
   - После добавления переменных окружения перезапустите деплоймент через Vercel
   - Проверьте логи после перезапуска

## Проверка после исправления:

1. **Проверьте логи Vercel** на наличие ошибок 500
2. **Тестирование API эндпоинтов**:
   - `/api/auth/[...nextauth]` - должен возвращать 200 OK
   - `/api/artists` - должен возвращать 200 OK
   - `/api/tracks` - должен возвращать 200 OK
   - `/api/playlists` - должен возвращать 200 OK
3. **Проверка функциональности**:
   - Аутентификация через OAuth
   - Аутентификация через Solana кошелек
   - Работа с базой данных

## Дополнительные рекомендации:

1. **Для безопасности**:

   - Используйте уникальные и сложные ключи для `NEXTAUTH_SECRET` и `JWT_SECRET`
   - Не храните реальные секреты в репозитории

2. **Для мониторинга**:

   - Настройте Sentry для отслеживания ошибок
   - Используйте Mixpanel для аналитики пользовательского поведения

3. **Для масштабируемости**:
   - Настройте отдельные базы данных для development и production
   - Используйте Redis для кэширования
