# 🚀 Полное Пошаговое Руководство по Развертыванию NORMALDANCE

## 📋 Содержание

1. [Предварительные требования](#предварительные-требования)
2. [Регистрация необходимых сервисов](#регистрация-необходимых-сервисов)
3. [Подготовка проекта](#подготовка-проекта)
4. [Настройка Vercel](#настройка-vercel)
5. [Настройка переменных окружения](#настройка-переменных-окружения)
6. [Развертывание](#развертывание)
7. [Проверка и тестирование](#проверка-и-тестирование)
8. [Настройка домена](#настройка-домена)
9. [Мониторинг и поддержка](#мониторинг-и-поддержка)

---

## 1️⃣ Предварительные требования

### Что вам понадобится:

- ✅ Аккаунт GitHub (для хранения кода)
- ✅ Аккаунт Vercel (для развертывания)
- ✅ Node.js 18+ установлен локально
- ✅ Git установлен локально
- ✅ Текстовый редактор (VS Code рекомендуется)

### Проверка установленных инструментов:

```bash
# Проверить версию Node.js (должна быть 18+)
node --version

# Проверить версию npm
npm --version

# Проверить Git
git --version
```

---

## 2️⃣ Регистрация Необходимых Сервисов

### 2.1 GitHub (если еще нет аккаунта)

1. Перейдите на https://github.com
2. Нажмите "Sign up"
3. Следуйте инструкциям регистрации
4. Подтвердите email

### 2.2 Vercel (платформа для развертывания)

1. Перейдите на https://vercel.com
2. Нажмите "Sign Up"
3. Выберите "Continue with GitHub"
4. Авторизуйте Vercel доступ к GitHub

### 2.3 Pinata (для IPFS хранилища)

1. Перейдите на https://pinata.cloud
2. Нажмите "Sign Up" → выберите бесплатный план
3. Подтвердите email
4. После входа:
   - Перейдите в "API Keys" в меню
   - Нажмите "New Key"
   - Выберите права: Admin (для полного доступа)
   - Дайте имя ключу: "NORMALDANCE Production"
   - Нажмите "Create Key"
   - **ВАЖНО**: Сохраните:
     - API Key
     - API Secret
     - JWT (появится после создания)

### 2.4 Upstash Redis (для кэширования)

1. Перейдите на https://upstash.com
2. Нажмите "Sign Up" → выберите GitHub
3. После входа:
   - Нажмите "Create Database"
   - Выберите регион (ближайший к вашим пользователям)
   - Выберите бесплатный план
   - Дайте имя: "normaldance-cache"
   - Нажмите "Create"
4. На странице базы данных найдите:
   - REST URL (UPSTASH_REDIS_REST_URL)
   - REST Token (UPSTASH_REDIS_REST_TOKEN)
   - **Сохраните эти значения**

### 2.5 Telegram Bot (для интеграции)

1. Откройте Telegram
2. Найдите бота @BotFather
3. Отправьте команду: `/newbot`
4. Следуйте инструкциям:
   - Введите имя бота: "NORMALDANCE Bot"
   - Введите username: "normaldance_bot" (или другой доступный)
5. **Сохраните токен бота** (выглядит как: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)
6. Настройте бота:
   ```
   /setdescription - Децентрализованная музыкальная платформа
   /setabouttext - NORMALDANCE - Web3 музыкальная платформа
   /setuserpic - Загрузите логотип (если есть)
   ```

### 2.6 Sentry (опционально, для мониторинга ошибок)

1. Перейдите на https://sentry.io
2. Нажмите "Get Started"
3. Выберите "Sign up with GitHub"
4. Создайте новый проект:
   - Platform: Next.js
   - Project name: "normaldance"
5. **Сохраните DSN** (найдете в Settings → Client Keys)

---

## 3️⃣ Подготовка Проекта

### 3.1 Клонирование репозитория (если еще не сделано)

```bash
# Перейдите в папку, где хотите разместить проект
cd ~/Projects  # или любая другая папка

# Клонируйте репозиторий
git clone https://github.com/AENDYSTUDIO/NORMALDANCE-Enterprise.git
cd NORMALDANCE-Enterprise
```

### 3.2 Установка зависимостей

```bash
# Установите все необходимые пакеты
npm install

# Это может занять несколько минут
```

### 3.3 Создание файла .env.local для локального тестирования

```bash
# Скопируйте пример файла
cp .env.example .env.local
```

Откройте `.env.local` в текстовом редакторе и заполните базовые значения:

```env
# Базовая конфигурация для локального тестирования
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# База данных (SQLite для локальной разработки)
DATABASE_URL=file:./db/dev.db

# NextAuth (сгенерируйте случайную строку)
NEXTAUTH_SECRET=your-local-secret-key-change-this
NEXTAUTH_URL=http://localhost:3000

# Solana (devnet для тестирования)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_RPC_TIMEOUT=8000

# Временные ID программ (замените после развертывания в mainnet)
NEXT_PUBLIC_NDT_PROGRAM_ID=NDTdev11111111
NEXT_PUBLIC_NDT_MINT_ADDRESS=NDTmint1111111111
NEXT_PUBLIC_TRACKNFT_PROGRAM_ID=TRACKdev11111111
NEXT_PUBLIC_STAKING_PROGRAM_ID=STAKEdev11111111

# IPFS/Pinata (вставьте ваши ключи из шага 2.3)
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here
PINATA_JWT=your_pinata_jwt_here

# Redis/Upstash (вставьте ваши ключи из шага 2.4)
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token_here

# Telegram (вставьте токен из шага 2.5)
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Sentry (опционально, из шага 2.6)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_DSN=your_sentry_dsn_here
```

### 3.4 Локальное тестирование

```bash
# Инициализация базы данных
npm run db:generate
npm run db:migrate

# Запуск проекта локально
npm run dev
```

Откройте браузер и перейдите на http://localhost:3000

**Проверьте:**

- ✅ Сайт загружается
- ✅ Нет критических ошибок в консоли
- ✅ Основные страницы работают

Если все работает, нажмите `Ctrl+C` чтобы остановить сервер.

---

## 4️⃣ Настройка Vercel

### 4.1 Подготовка репозитория

```bash
# Убедитесь, что все изменения сохранены
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 4.2 Создание проекта в Vercel

#### Через веб-интерфейс:

1. Войдите на https://vercel.com
2. Нажмите "Add New..." → "Project"
3. Выберите ваш GitHub репозиторий "NORMALDANCE-Enterprise"
4. Нажмите "Import"

#### Настройки проекта:

- **Framework Preset**: Next.js (должно определиться автоматически)
- **Root Directory**: `./` (оставьте по умолчанию)
- **Build Command**: `npm run build` (по умолчанию)
- **Output Directory**: `.next` (по умолчанию)
- **Install Command**: `npm install` (по умолчанию)

**НЕ НАЖИМАЙТЕ "Deploy" ЕЩЕ!** Сначала настроим переменные окружения.

---

## 5️⃣ Настройка Переменных Окружения в Vercel

### 5.1 Переход к настройкам

1. В Vercel проекте перейдите в "Settings"
2. Выберите "Environment Variables" в боковом меню

### 5.2 Добавление переменных

Добавьте следующие переменные **ПО ОДНОЙ**. Для каждой:

- Введите имя переменной в поле "Key"
- Введите значение в поле "Value"
- Выберите окружения: Production, Preview, Development (все три)
- Нажмите "Add"

#### 🔹 Основные настройки

```
NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

**Замените** `your-project-name` на имя вашего проекта в Vercel (будет показано после создания).

#### 🔹 База данных

```
DATABASE_URL=file:./db/production.db
```

_Примечание: Для production рекомендуется PostgreSQL, но для начала SQLite подойдет._

#### 🔹 Аутентификация и безопасность

```
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://your-project-name.vercel.app
JWT_SECRET=
```

**Для генерации секретных ключей:**

```bash
# В терминале выполните:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Скопируйте результат для NEXTAUTH_SECRET

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Скопируйте результат для JWT_SECRET
```

#### 🔹 Solana

```
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_RPC_TIMEOUT=8000
NEXT_PUBLIC_NDT_PROGRAM_ID=NDTdev11111111
NEXT_PUBLIC_NDT_MINT_ADDRESS=NDTmint1111111111
NEXT_PUBLIC_TRACKNFT_PROGRAM_ID=TRACKdev11111111
NEXT_PUBLIC_STAKING_PROGRAM_ID=STAKEdev11111111
```

_Примечание: Это временные devnet ID. После развертывания смарт-контрактов в mainnet, обновите их._

#### 🔹 IPFS/Pinata (из шага 2.3)

```
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io
PINATA_API_KEY=your_actual_pinata_api_key
PINATA_SECRET_KEY=your_actual_pinata_secret_key
PINATA_JWT=your_actual_pinata_jwt
```

#### 🔹 Redis/Upstash (из шага 2.4)

```
UPSTASH_REDIS_REST_URL=your_actual_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_actual_upstash_token
```

#### 🔹 Telegram (из шага 2.5)

```
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_actual_telegram_bot_token
TELEGRAM_BOT_TOKEN=your_actual_telegram_bot_token
```

#### 🔹 TON

```
NEXT_PUBLIC_TON_RPC_URL=https://toncenter.com/api/v2/jsonRPC
```

#### 🔹 Sentry (опционально, из шага 2.6)

```
NEXT_PUBLIC_SENTRY_DSN=your_actual_sentry_dsn
SENTRY_DSN=your_actual_sentry_dsn
```

#### 🔹 Дополнительные настройки

```
CDN_PROVIDER=ipfs
IPFS_BACKEND=legacy
DEBUG=false
RATE_LIMIT_ENABLED=true
SECURITY_MONITORING_ENABLED=true
```

### 5.3 Проверка переменных

Убедитесь, что все критически важные переменные добавлены:

- ✅ NEXT_PUBLIC_APP_URL
- ✅ DATABASE_URL
- ✅ NEXTAUTH_SECRET
- ✅ PINATA_JWT
- ✅ UPSTASH_REDIS_REST_URL
- ✅ UPSTASH_REDIS_REST_TOKEN
- ✅ TELEGRAM_BOT_TOKEN

---

## 6️⃣ Развертывание

### 6.1 Первое развертывание

1. Вернитесь на вкладку "Overview" в Vercel
2. Нажмите "Deploy" (или "Redeploy" если уже был деплой)
3. Дождитесь завершения сборки (обычно 2-5 минут)

### 6.2 Мониторинг процесса

Вы увидите:

- 🔄 Building (сборка проекта)
- 🔄 Deploying (развертывание)
- ✅ Ready (готово)

Если возникли ошибки:

- Нажмите на "View Build Logs"
- Изучите ошибки
- Исправьте проблемы в коде
- Сделайте commit и push
- Vercel автоматически пересоберет проект

### 6.3 Получение URL

После успешного развертывания:

1. Скопируйте URL проекта (например: `https://normaldance-abc123.vercel.app`)
2. Обновите переменную окружения `NEXT_PUBLIC_APP_URL`:
   - Settings → Environment Variables
   - Найдите `NEXT_PUBLIC_APP_URL`
   - Нажмите "Edit"
   - Вставьте правильный URL
   - Сохраните
3. Нажмите "Redeploy" для применения изменений

---

## 7️⃣ Проверка и Тестирование

### 7.1 Базовая проверка

Откройте ваш сайт в браузере:

```
https://your-project-name.vercel.app
```

**Проверьте:**

- ✅ Главная страница загружается
- ✅ Нет ошибок в консоли браузера (F12 → Console)
- ✅ Навигация работает
- ✅ Стили применяются корректно

### 7.2 Проверка API эндпоинтов

```
https://your-project-name.vercel.app/api/health
```

Должен вернуть: `{"status":"ok"}`

### 7.3 Проверка Telegram Mini App

1. Откройте Telegram
2. Найдите вашего бота
3. Отправьте команду `/start`
4. Если настроен WebApp, должна открыться кнопка для запуска приложения

### 7.4 Проверка функциональности

- ✅ Регистрация/вход работает
- ✅ Загрузка файлов работает (IPFS)
- ✅ Кэширование работает (Redis)
- ✅ Нет критических ошибок

---

## 8️⃣ Настройка Домена (опционально)

### 8.1 Если у вас есть домен normaldance.online

#### В Vercel:

1. Перейдите в Settings → Domains
2. Нажмите "Add"
3. Введите: `normaldance.online`
4. Нажмите "Add"
5. Vercel покажет DNS записи для настройки

#### У вашего регистратора доменов:

1. Войдите в панель управления доменом
2. Найдите настройки DNS
3. Добавьте A-запись:
   - Type: A
   - Name: @ (или оставьте пустым)
   - Value: (IP адрес, который показал Vercel)
   - TTL: Auto или 3600
4. Добавьте CNAME для www:
   - Type: CNAME
   - Name: www
   - Value: cname.vercel-dns.com
   - TTL: Auto или 3600
5. Сохраните изменения

**Примечание:** DNS изменения могут занять от 5 минут до 48 часов для полного распространения.

### 8.2 Проверка домена

После настройки DNS:

1. Подождите 10-15 минут
2. Проверьте домен в браузере: `https://normaldance.online`
3. Vercel автоматически выпустит SSL сертификат
4. Обновите переменную `NEXT_PUBLIC_APP_URL` на новый домен
5. Обновите `NEXTAUTH_URL` на новый домен
6. Redeploy проекта

---

## 9️⃣ Мониторинг и Поддержка

### 9.1 Настройка мониторинга в Vercel

1. Перейдите в раздел "Analytics" вашего проекта
2. Включите Vercel Analytics (бесплатно)
3. Включите Speed Insights для мониторинга производительности

### 9.2 Настройка Telegram Webhook (для уведомлений)

```bash
# Установите webhook для вашего бота
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-domain.vercel.app/api/telegram/webhook"}'
```

Замените:

- `<YOUR_BOT_TOKEN>` на токен вашего бота
- `your-domain.vercel.app` на ваш реальный домен

### 9.3 Мониторинг логов

В Vercel Dashboard:

1. Перейдите в "Logs"
2. Фильтруйте по типу (Errors, Warnings, Info)
3. Настройте уведомления для критических ошибок

### 9.4 Регулярные проверки

**Ежедневно:**

- ✅ Проверяйте доступность сайта
- ✅ Мониторьте ошибки в Sentry (если настроен)
- ✅ Проверяйте работу Telegram бота

**Еженедельно:**

- ✅ Проверяйте использование ресурсов в Vercel
- ✅ Проверяйте квоты Pinata и Upstash
- ✅ Обновляйте зависимости: `npm outdated`

**Ежемесячно:**

- ✅ Проверяйте безопасность: `npm audit`
- ✅ Обновляйте критические пакеты
- ✅ Проверяйте срок действия API ключей

### 9.5 Резервное копирование

**База данных:**

```bash
# Для SQLite (если используется)
# Скачайте файл db/production.db из Vercel

# Для PostgreSQL
# Настройте автоматические бэкапы у провайдера БД
```

**Код:**

- Регулярно делайте git push
- Создавайте теги для важных версий:
  ```bash
  git tag -a v1.0.0 -m "Production release"
  git push origin v1.0.0
  ```

### 9.6 Обновление проекта

Для обновления кода в production:

```bash
# 1. Внесите изменения локально
# 2. Протестируйте локально
npm run dev

# 3. Закоммитьте изменения
git add .
git commit -m "Описание изменений"

# 4. Запушьте в GitHub
git push origin main

# 5. Vercel автоматически развернет обновление
```

### 9.7 Откат к предыдущей версии

Если что-то пошло не так:

1. В Vercel Dashboard перейдите в "Deployments"
2. Найдите последнюю рабочую версию
3. Нажмите "..." → "Promote to Production"
4. Подтвердите откат

---

## 🎯 Чек-лист Готовности к Production

Перед запуском убедитесь:

### Безопасность

- [ ] Все секретные ключи сгенерированы и уникальны
- [ ] HTTPS включен (автоматически через Vercel)
- [ ] Rate limiting настроен
- [ ] CORS настроен правильно
- [ ] Нет секретов в коде (все в переменных окружения)

### Функциональность

- [ ] Все основные страницы загружаются
- [ ] API эндпоинты работают
- [ ] Telegram бот отвечает
- [ ] IPFS загрузка работает
- [ ] Кэширование Redis работает
- [ ] Аутентификация работает

### Производительность

- [ ] Время загрузки < 3 секунд
- [ ] Изображения оптимизированы
- [ ] Нет утечек памяти
- [ ] CDN настроен

### Мониторинг

- [ ] Vercel Analytics включен
- [ ] Sentry настроен (опционально)
- [ ] Логи доступны
- [ ] Уведомления об ошибках настроены

### Документация

- [ ] README обновлен
- [ ] API документация актуальна
- [ ] Инструкции для пользователей готовы

---

## 🆘 Решение Проблем

### Проблема: Сборка не проходит

**Решение:**

1. Проверьте Build Logs в Vercel
2. Убедитесь, что все зависимости установлены
3. Проверьте версию Node.js (должна быть 18+)
4. Попробуйте собрать локально: `npm run build`

### Проблема: Переменные окружения не работают

**Решение:**

1. Убедитесь, что переменные добавлены для всех окружений
2. Проверьте правильность имен (с префиксом NEXT*PUBLIC* для клиента)
3. После изменения переменных сделайте Redeploy
4. Проверьте, что нет опечаток в именах

### Проблема: База данных не работает

**Решение:**

1. Проверьте DATABASE_URL
2. Убедитесь, что миграции выполнены
3. Для PostgreSQL проверьте доступность сервера
4. Проверьте логи для деталей ошибки

### Проблема: IPFS загрузка не работает

**Решение:**

1. Проверьте Pinata API ключи
2. Убедитесь, что квота не исчерпана
3. Проверьте размер файлов (лимит обычно 100MB)
4. Проверьте CORS настройки

### Проблема: Telegram бот не отвечает

**Решение:**

1. Проверьте токен бота
2. Убедитесь, что webhook настроен правильно
3. Проверьте логи API эндпоинта `/api/telegram/webhook`
4. Попробуйте удалить и заново установить webhook

---

## 📚 Дополнительные Ресурсы

### Документация

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Pinata Documentation](https://docs.pinata.cloud/)
- [Upstash Documentation](https://docs.upstash.com/)

### Поддержка

- GitHub Issues: https://github.com/AENDYSTUDIO/NORMALDANCE-Enterprise/issues
- Telegram Community: (если есть)
- Email: (если есть)

---

## 🎉 Поздравляем!

Вы успешно развернули NORMALDANCE!

**Следующие шаги:**

1. Протестируйте все функции
2. Пригласите бета-тестеров
3. Соберите обратную связь
4. Итеративно улучшайте платформу
5. Масштабируйте по мере роста

**Удачи с вашим проектом! 🚀🎵**

---

_Последнее обновление: Январь 2025_
_Версия документа: 1.0_
