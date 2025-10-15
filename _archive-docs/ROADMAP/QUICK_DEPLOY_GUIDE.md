# 🚀 Quick Deploy Guide: normaldance.online

## 🎯 One-Click Configuration Setup

### 📋 Шаг 1: Переменные Окружения

Перейдите в Vercel Dashboard → Project Settings → Environment Variables и добавьте эти переменные:

### ⚡ Core Config (Обязательно)

```
NEXT_PUBLIC_APP_URL=https://normaldance.online
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 🗄️ Database

```
DATABASE_URL=file:./db/production.db
```

### 🔐 Auth & Security

```
NEXTAUTH_SECRET=your_nextauth_secret_here_(generate_a_secure_random_string)
NEXTAUTH_URL=https://normaldance.online
JWT_SECRET=your_jwt_secret_here_(generate_a_secure_random_string)
RATE_LIMIT_ENABLED=true
SECURITY_MONITORING_ENABLED=true
MAX_TRANSACTION_VALUE_SOL=1000
```

### ⛓ Solana (Mainnet с devnet ID)

```
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_RPC_TIMEOUT=8000
NEXT_PUBLIC_NDT_PROGRAM_ID=NDTdev11111111
NEXT_PUBLIC_NDT_MINT_ADDRESS=NDTmint1111111111
NEXT_PUBLIC_TRACKNFT_PROGRAM_ID=TRACKdev11111111
NEXT_PUBLIC_STAKING_PROGRAM_ID=STAKEdev11111111
```

### 📡 IPFS/Pinata (РЕАЛЬНЫЕ КЛЮЧИ)

```
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io
PINATA_API_KEY=your_pinata_api_key_here_(obtain_from_pinata.cloud)
PINATA_SECRET_KEY=your_pinata_secret_key_here_(obtain_from_pinata.cloud)
PINATA_JWT=your_pinata_jwt_here_(obtain_from_pinata.cloud)
```

### 📦 Redis/Upstash (РЕАЛЬНЫЕ КЛЮЧИ)

```
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url_here_(obtain_from_upstash.com)
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token_here_(obtain_from_upstash.com)
```

### 📱 TON

```
NEXT_PUBLIC_TON_RPC_URL=https://toncenter.com/api/v2/jsonRPC
```

### 🔍 Другие настройки

```
CDN_PROVIDER=ipfs
DEBUG=false
```

## 🎯 Шаг 2: Настройка Telegram Бота

1. Откройте @BotFather в Telegram
2. Создайте нового бота командой `/newbot`
3. Скопируйте токен бота и добавьте в Vercel:
   ```
   NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here_(obtain_from_botfather)
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here_(obtain_from_botfather)
   ```

## 🚨 ВАЖНОЕ ПРЕДУПРЕЖДЕНИЕ

### ⚠️ Devnet ID в Production

Текущие Solana program ID - для devnet. В production нужно будет:

1. Развернуть программы в mainnet
2. Обновить ID программ
3. Перезапустить деплой

### 🔐 Секреты безопасности

- Pinata JWT действует до 2025-03-20 (нужно будет продлить)
- JWT секреты из dev (рекомендуется сгенерировать новые для production)
- Все остальные ключи действительны

## 📋 Шаг 3: Развертывание

1. Подключите репозиторий к Vercel
2. Добавьте переменные окружения
3. Настройте домен: `normaldance.online`
4. Нажмите `Deploy`

## ✅ Проверка После Развертывания

1. Главный сайт: https://normaldance.online
2. Telegram App: https://normaldance.online/telegram-app
3. Инновации: https://normaldance.online/innovations-2025
4. Health Check: https://normaldance.online/api/health

## 🎵 Ready!

Платформа готова к запуску со всеми инновациями 2025 года! 🚀
