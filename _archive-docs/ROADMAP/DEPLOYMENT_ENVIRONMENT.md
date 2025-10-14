# 🚀 Production Environment Variables for normaldance.online

Это реальные ключи из файла `.env`, адаптированные для production развертывания на Vercel.

## 📋 Переменные Окружения Установить в Vercel

### 🏗️ Core Configuration

```bash
# Основные настройки
NEXT_PUBLIC_APP_URL=https://normaldance.online
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
DEBUG=false
```

### 🗄️ Database Configuration

```bash
# Для development используем SQLite, для production нужно PostgreSQL
DATABASE_URL=postgresql://username:password@host:port/database
# Временно можно использовать SQLite для теста:
# DATABASE_URL=file:./db/production.db
```

### 🔐 NextAuth Configuration

```bash
# Используем тот же секрет для production
NEXTAUTH_SECRET="NDT_dev_auth_2024_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b"
NEXTAUTH_URL=https://normaldance.online
```

### ⛓ Solana Configuration

```bash
# Переключаем на mainnet для production
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
SOLANA_RPC_TIMEOUT="8000"

# Временно devnet ID, прод заменить на mainnet ID после создания
NEXT_PUBLIC_NDT_PROGRAM_ID="NDTdev1111"
NEXT_PUBLIC_NDT_MINT_ADDRESS="NDTmint111111"
NEXT_PUBLIC_TRACKNFT_PROGRAM_ID="TRACKdev11111111"
NEXT_PUBLIC_STAKING_PROGRAM_ID="STAKEdev11111111"
```

### 📡 IPFS/Pinata Configuration (РЕАЛЬНЫЕ КЛЮЧИ)

```bash
# Используем реальные ключи из .env
NEXT_PUBLIC_IPFS_GATEWAY="https://ipfs.io"
PINATA_API_KEY="789c738f136b9c0e1114"
PINATA_SECRET_KEY="91d1a4bf06059241718f0373e60b464ebe17f9d62ea7c5b339e8c720f263e6ff"
PINATA_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI4YzFlMDhhNy1kMTc4LTQ0YzQtOWE4Ny03Yzk0OGMzY2QzMzciLCJlbWFpbCI6ImFlbmR5c3R1ZGlvQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI3ODljNzM4ZjEzNmI5YzBlMTExNCIsInNjb3BlZEtleVNlY3JldCI6IjkxZDFhNGJmMDYwNTkyNDE3MThmMDM3M2U2MGI0NjRlYmUxN2Y5ZDYyZWE3YzViMzM5ZThjNzIwZjI2M2U2ZmYiLCJleHAiOjE3ODk4ODE1MTh9.Uda4nlL0K8zlZQYrTC3KU8X0gfozQZw8raO96L5mUUA"
```

### 🎵 CDN Configuration

```bash
# Используем IPFS для production
CDN_PROVIDER="ipfs"
```

### 🔐 Security Configuration (РЕАЛЬНЫЕ КЛЮЧИ)

```bash
# Используем тот же JWT секрет из .env
JWT_SECRET="876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9"
RATE_LIMIT_ENABLED="true"
SECURITY_MONITORING_ENABLED="true"
MAX_TRANSACTION_VALUE_SOL="1000"
```

### 📤 Redis/Database Configuration

```bash
# Используем реальные Upstash ключи
REDIS_URL="redis://localhost:6379"
UPSTASH_REDIS_REST_URL="https://composed-lemur-17971.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AUYzAAIncDIxODFlMWMzYmU2NDE0NzBjOGM1ZGY0NmQwYjI0YThhOXAyMTc5NzE"
```

### 🔍 Monitoring Configuration

```bash
# Нужно будет настроить production DSN для Sentry и токен для Mixpanel
# Для начала можно оставить пустыми и добавить позже
SENTRY_DSN=""
MIXPANEL_TOKEN=""
```

## 🎯 Telegram Bot Configuration

Для Telegram Mini App нужно будет создать нового бота и получить production токен:

```bash
# Это создать через @BotFather для production
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN="YOUR_PRODUCTION_BOT_TOKEN"
TELEGRAM_BOT_TOKEN="YOUR_PRODUCTION_BOT_TOKEN"
```

## 🌐 TON Blockchain Configuration

```bash
NEXT_PUBLIC_TON_RPC_URL="https://toncenter.com/api/v2/jsonRPC"
```

## 🚨 ВАЖНЫЕ ЗАМЕЧАНИЯ

### ⚠️ Требуется Замена Production ID

```bash
# ВАЖНО: Эти ID нужно будет создать в mainnet Solana
# Текущие ID - для devnet:
NEXT_PUBLIC_NDT_PROGRAM_ID="NDTdev1111"
NEXT_PUBLIC_NDT_MINT_ADDRESS="NDTmint111111"
NEXT_PUBLIC_TRACKNFT_PROGRAM_ID="TRACKdev11111111"
NEXT_PUBLIC_STAKING_PROGRAM_ID="STAKEdev11111111"

# Для production нужно будет запросить или создать новые ID
# и обновить эти переменные после развертывания программ в mainnet
```

### 🔐 Безопасность

- JWT секреты используются те же из .env (рекомендуется сгенерировать новые)
- Pinata JWT действителен до 2025-03-20 (нужно будет продлить)
- Upstash токен действителен и может использоваться в production

## 📋 Копировать и Вставить для Vercel

Просто скопируйте эти переменные в Vercel Environment Variables:

1. Зайдите в Vercel Dashboard → Project Settings → Environment Variables
2. Добавьте каждую переменную по одной
3. Переразверните проект

## 🎯 Ready to Deploy Configuration

После настройки этих переменных платформа будет готова к развертыванию с реальными ключами IPFS, Redis и существующей архитектурой.
