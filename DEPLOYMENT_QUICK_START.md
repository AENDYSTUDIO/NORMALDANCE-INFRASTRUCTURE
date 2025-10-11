# 🚀 Быстрый Старт: Развертывание NORMALDANCE

## 📝 Краткая Справка

Это краткое руководство для быстрого старта. Для полной инструкции см. [DEPLOYMENT_STEP_BY_STEP_COMPLETE.md](./DEPLOYMENT_STEP_BY_STEP_COMPLETE.md)

---

## ✅ Проверка Готовности

Перед началом запустите проверку:

```bash
npm run deploy:check
```

Этот скрипт проверит наличие всех необходимых файлов и конфигураций.

---

## 🎯 Быстрый План Действий

### 1. Подготовка (5-10 минут)

**Зарегистрируйтесь на сервисах:**

- ✅ [Vercel](https://vercel.com) - платформа развертывания
- ✅ [Pinata](https://pinata.cloud) - IPFS хранилище
- ✅ [Upstash](https://upstash.com) - Redis кэширование
- ✅ Telegram Bot через [@BotFather](https://t.me/BotFather)

### 2. Получение API Ключей (10-15 минут)

**Pinata:**

1. Войдите → API Keys → New Key
2. Сохраните: API Key, Secret, JWT

**Upstash:**

1. Create Database → выберите регион
2. Сохраните: REST URL, REST Token

**Telegram:**

1. Напишите @BotFather → `/newbot`
2. Сохраните токен бота

### 3. Настройка Vercel (5 минут)

```bash
# Установите Vercel CLI (опционально)
npm i -g vercel

# Или используйте веб-интерфейс
```

**В Vercel Dashboard:**

1. New Project → Import из GitHub
2. Выберите репозиторий NORMALDANCE
3. **НЕ НАЖИМАЙТЕ Deploy!** Сначала добавьте переменные окружения

### 4. Переменные Окружения (10 минут)

В Vercel → Settings → Environment Variables добавьте:

#### Обязательные:

```env
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NODE_ENV=production
DATABASE_URL=file:./db/production.db
NEXTAUTH_SECRET=<сгенерируйте случайную строку>
NEXTAUTH_URL=https://your-project.vercel.app
JWT_SECRET=<сгенерируйте случайную строку>
PINATA_JWT=<ваш JWT из Pinata>
UPSTASH_REDIS_REST_URL=<ваш URL из Upstash>
UPSTASH_REDIS_REST_TOKEN=<ваш Token из Upstash>
TELEGRAM_BOT_TOKEN=<ваш токен от BotFather>
```

**Генерация секретов:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Дополнительные (рекомендуется):

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_TON_RPC_URL=https://toncenter.com/api/v2/jsonRPC
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io
```

### 5. Развертывание (2-5 минут)

1. В Vercel нажмите **Deploy**
2. Дождитесь завершения сборки
3. Скопируйте URL проекта
4. Обновите `NEXT_PUBLIC_APP_URL` и `NEXTAUTH_URL` на реальный URL
5. Нажмите **Redeploy**

### 6. Проверка (5 минут)

Откройте ваш сайт и проверьте:

- ✅ Главная страница загружается
- ✅ Нет ошибок в консоли (F12)
- ✅ API работает: `/api/health`
- ✅ Telegram бот отвечает

---

## 🔧 Полезные Команды

```bash
# Проверка готовности к развертыванию
npm run deploy:check

# Локальное тестирование
npm run dev

# Сборка проекта
npm run build

# Проверка безопасности
npm run security:check

# Просмотр документации
npm run deploy:guide
```

---

## 🆘 Частые Проблемы

### Ошибка сборки

```bash
# Попробуйте собрать локально
npm run build
# Проверьте логи в Vercel
```

### Переменные не работают

- Убедитесь, что добавлены для всех окружений (Production, Preview, Development)
- После изменения сделайте Redeploy
- Проверьте префикс `NEXT_PUBLIC_` для клиентских переменных

### База данных не работает

- Для production рекомендуется PostgreSQL вместо SQLite
- Проверьте `DATABASE_URL`

---

## 📚 Дополнительные Ресурсы

- 📖 [Полная инструкция](./DEPLOYMENT_STEP_BY_STEP_COMPLETE.md)
- 🔐 [Руководство по безопасности](./SECURITY.md)
- 📝 [README проекта](./README.md)
- 🌐 [Vercel Docs](https://vercel.com/docs)

---

## 🎯 Следующие Шаги После Развертывания

1. **Настройте домен** (если есть)

   - Vercel → Settings → Domains
   - Добавьте DNS записи у регистратора

2. **Настройте мониторинг**

   - Включите Vercel Analytics
   - Настройте Sentry (опционально)

3. **Настройте Telegram Webhook**

   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -d "url=https://your-domain.vercel.app/api/telegram/webhook"
   ```

4. **Протестируйте все функции**

   - Регистрация/вход
   - Загрузка файлов
   - Telegram Mini App
   - Платежи (если настроены)

5. **Пригласите бета-тестеров**

---

## ⏱️ Общее Время: ~40-60 минут

- Регистрация сервисов: 10 мин
- Получение ключей: 15 мин
- Настройка Vercel: 15 мин
- Развертывание: 5 мин
- Проверка: 10 мин

---

## 💡 Совет

Сохраните все API ключи и токены в безопасном месте (например, в менеджере паролей). Они понадобятся для обновлений и обслуживания.

---

**Готовы начать? Запустите проверку:**

```bash
npm run deploy:check
```

**Удачи! 🚀**
