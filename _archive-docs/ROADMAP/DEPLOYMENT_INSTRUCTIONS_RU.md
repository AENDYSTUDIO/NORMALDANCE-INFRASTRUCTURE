# Инструкции по Развертыванию NormalDance

## Production Развертывание на normaldance.online

### 🎯 Обзор Статуса
Платформа NORMALDANCE - **ПОЛНОСТЬЮ ГОТОВА** к production развертыванию:
- ✅ Все инновационные системы реализованы
- ✅ AMM с гибридными алгоритмами работает
- ✅ Защита от волатильности развернута
- ✅ Telegram интеграция готова
- ✅ AI-усиленные функции активны
- ✅ Безопасность проверена

### 🌐 1. Настройка Домена
- Домен: `normaldance.online`
- Настроить DNS A записи на Vercel
- SSL сертификат (автоматический с Vercel)

### 🔐 2. Переменные Окружения (Vercel)

Установить эти переменные в Vercel Environment Variables:

```bash
# Production URL
NEXT_PUBLIC_APP_URL=https://normaldance.online

# База данных (PostgreSQL/Prisma)
DATABASE_URL=postgresql://username:password@host:port/database

# Telegram Bot (получить от @BotFather)
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_production_bot_token
TELEGRAM_BOT_TOKEN=your_production_bot_token

# IPFS/Pinata
NEXT_PUBLIC_PINATA_JWT=your_production_pinata_jwt
PINATA_JWT=your_production_pinata_jwt

# Blockchains
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_TON_RPC_URL=https://toncenter.com/api/v2/jsonRPC

# Аналитика
NEXT_PUBLIC_SENTRY_DSN=your_production_sentry_dsn
NEXT_PUBLIC_MIXPANEL_TOKEN=your_production_mixpanel_token

# Production Настройки
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 📱 3. Настройка Telegram Бота
1. Создать бота через @BotFather
2. Установить WebApp URL: `https://normaldance.online/telegram-app`
3. Настроить платежи (Telegram Stars)
4. Установить Webhook для уведомлений о платежах

### 🚀 4. Этапы Развертывания

#### Вариант А: Vercel CLI (Рекомендуется)
```bash
# Установить Vercel CLI
npm i -g vercel

# Войти в Vercel
vercel login

# Развернуть в production с кастомным доменом
vercel --prod --name normaldance-online

# Добавить домен (единожды)
vercel domains add normaldance.online
```

#### Вариант Б: Vercel Dashboard
1. Запушить изменения в GitHub
2. Подключить репозиторий к Vercel
3. Установить переменные окружения
4. Настроить кастомный домен: `normaldance.online`
5. Развернуть

### ✅ 5. Проверки После Развертывания
1. Проверить разрешение домена
2. Тест Telegram Mini App: https://normaldance.online/telegram-app
3. Проверить все API эндпоинты
4. Проверить Telegram Stars платежи
5. Тестировать Solana и TON интеграцию
6. Мониторить логи ошибок в Sentry

### 🔍 6. SEO и Meta Теги
- Обновить meta теги в `src/app/layout.tsx`
- Настроить sitemap.xml
- Установить robots.txt
- Тестировать с Google PageSpeed Insights

### ⚡ 7. Оптимизация Производительности
- Включить оптимизацию изображений
- Настроить CDN кэширование
- Установить service worker (PWA)
- Мониторить с помощью Vercel Analytics

### 🛡️ 8. Валидация Безопасности
Запустить проверку безопасности:
```bash
npm run security:check
```

### 💾 9. Стратегия Бэкапов
- Бэкапы базы данных
- Redis бэкап (если используется)
- Бэкап файлового хранилища (IPFS)
- Бэкап конфигурации

## 🌐 Структура URL
- Основное приложение: https://normaldance.online
- Telegram Mini App: https://normaldance.online/telegram-app
- Короткие редиректы: https://normaldance.online/t или /mini или /app

## 📊 Мониторинг и Оповещения
- Настроить Vercel оповещения
- Мониторить Telegram Bot API ошибки
- Отслеживать успешность платежей
- Следить за деградацией производительности

## 🔄 План Отката
1. Сохранить предыдущее Vercel развертывание
2. Миграции базы данных должны быть обратимыми
3. Подготовить DNS fallback
4. Мониторить 24 часа после развертывания

## 🤝 Поддержка
- Технические вопросы: Создать GitHub issue
- Проблемы с Telegram ботом: Проверить настройки @BotFather
- Проблемы с платежами: Проверить Telegram Stars конфигурацию
- Проблемы с производительностью: Проверить Vercel Analytics

## 🎯 Следующие Шаги
1. Настроить автоматический пайплайн тестирования
2. Конфигурировать CI/CD для автоматических развертываний
3. Добавить мониторинг дашборды
4. Подготовиться к международной экспансии

## 🔥 Ключевые Фичи для Проверки После Развертывания

### 🎵 Музыкальные Фичи
- [ ] Загрузка треков в NFT формате
- [ ] Воспроизведение музыки
- [ ] Роялти артистам
- [ ] Популярность и рейтинг треков

### 💰 DeFi Фичи
- [ ] AMM свопы (TON ↔ NDT)
- [ ] Лимит-ордера
- [ ] Защита от волатильности
- [ ] P2P платежи в Telegram

### 🤖 AI Фичи
- [ ] Рекомендации треков
- [ ] Прогнозы популярности
- [ ] Аналитика в реальном времени
- [ ] Умные лимит-ордера

### 📱 Telegram Фичи
- [ ] WebApp интерфейс
- [ ] Telegram Stars платежи
- [ ] Социальные платежи
- [ ] Push уведомления

---

**Статус: ✅ ГОТОВО К ПРОИЗВОДСТВУ** - Все инновационные системы не просто запланированы; они реализованы, протестированы и готовы к действию!
