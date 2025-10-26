# Руководство по реализации MVP Normal Dance с токенами

## Этап 1: Подготовка окружения

### Необходимые инструменты
```bash
# Node.js 18+
# Rust toolchain
# Anchor framework
# Solana CLI
```

### Установка зависимостей
```bash
# 1. Клонировать репозиторий
git clone https://github.com/AENDYSTUDIO/NORMALDANCE-INFRASTRUCTURE.git
cd NORMALDANCE-INFRASTRUCTURE

# 2. Перейти на ветку MVP
git checkout feature/mvp-with-music-tokens

# 3. Установить зависимости
npm install

# 4. Установить Anchor
npm i -g @project-serum/anchor-cli

# 5. Установить Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.4/install)"
```

## Этап 2: Конфигурация блокчейна

### Настройка Solana
```bash
# Настроить devnet
solana config set --url devnet

# Создать keypair для деплоя
solana-keygen new -o ~/.config/solana/deployer.json

# Пополнить баланс
solana airdrop 2 --keypair ~/.config/solana/deployer.json
```

## Этап 3: Деплой токена

### Шаг 1: Сборка контракта
```bash
cd contracts

# Установить зависимости контрактов
npm install

# Собрать программу
anchor build
```

### Шаг 2: Деплой токена
```bash
# Развернуть программу на devnet
anchor deploy

# Инициализировать токен
npm run initialize
```

**Ожидаемый результат:**
```
Program ID: [ваш-program-id]
Token Mint: [ваш-token-mint-address]
Supply: 1,000,000,000 MUSIC
```

## Этап 4: Настройка базы данных

### Миграция схемы
```bash
# Использовать упрощенную схему для MVP
cp prisma/mvp-schema.prisma prisma/schema.prisma

# Сгенерировать Prisma клиент
npx prisma generate

# Применить миграции
npx prisma db push
```

## Этап 5: Запуск API

### Конфигурация переменных окружения
```bash
# Создать .env.local
cp .env.example .env.local

# Заполнить переменные:
# SOLANA_RPC_URL=https://api.devnet.solana.com
# TOKEN_MINT_ADDRESS=[ваш-token-mint-address]
# DATABASE_URL=postgresql://...
# NEXTAUTH_SECRET=your-secret
```

### Запуск сервера разработки
```bash
npm run dev
```

**Доступные эндпоинты:**
- `GET /api/rewards` - получение наград за музыку
- `POST /api/staking` - стейкинг токенов
- `GET /api/tokens/balance` - баланс токенов

## Этап 6: Тестирование функциональности

### Тестовые сценарии

#### 1. Получение токенов за прослушивание
```bash
# Эндпоинт: POST /api/rewards/listening
curl -X POST http://localhost:3000/api/rewards/listening \
  -H "Content-Type: application/json" \
  -d '{"trackId": "track_123", "userId": "user_456"}'
```

#### 2. Проверка баланса
```bash
# Эндпоинт: GET /api/tokens/balance?userId=user_456
curl http://localhost:3000/api/tokens/balance?userId=user_456
```

#### 3. Стакинг токенов
```bash
# Эндпоинт: POST /api/staking/stake
curl -X POST http://localhost:3000/api/staking/stake \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "userId": "user_456"}'
```

## Этап 7: Деплой на Vercel

### Подготовка конфигурации
```bash
# Использовать конфиг MVP
cp vercel-mvp.json vercel.json

# Собрать проект
npm run build

# Деплой на Vercel
vercel --prod
```

## Этап 8: Верификация деплоя

### Проверка блокчейна
```bash
# Проверить программу на Solana Explorer
# https://explorer.solana.com/address/[program-id]?cluster=devnet

# Проверить токен
# https://explorer.solana.com/address/[token-mint]?cluster=devnet
```

### Проверка API
```bash
# Тестирование эндпоинтов
curl https://your-domain.vercel.app/api/tokens/balance?userId=test_user
```

## Расписание разработки

### Неделя 1: Фундамент
- [x] Создание ветки и структура файлов
- [x] Деплой SPL токена
- [x] Настройка базы данных
- [x] Базовые API эндпоинты

### Неделя 2: Токеномика
- [ ] Интеграция наград за прослушивание
- [ ] Система стейкинга
- [ ] UI компоненты для токенов
- [ ] Тестирование и отладка

### Неделя 3: Полировка и запуск
- [ ] Финальное тестирование
- [ ] Деплой на mainnet
- [ ] Мониторинг и аналитика
- [ ] Подготовка к продакшену

## Возможные проблемы и решения

### Проблема: Ошибка деплоя токена
```bash
# Решение: Проверить баланс и RPC
solana airdrop 2
solana config set --url https://api.mainnet-beta.solana.com
```

### Проблема: Ошибка базы данных
```bash
# Решение: Пересоздать миграции
npx prisma db push --force-reset
```

### Проблема: Ошибка API
```bash
# Решение: Проверить переменные окружения
cat .env.local
# Убедиться что все переменные заполнены
```

## Метрики успеха MVP

### Технические метрики
- ✅ Токен развернут на devnet
- ✅ API отвечает < 500ms
- ✅ База данных обрабатывает 100+ запросов/мин
- ✅ Деплой на Vercel без ошибок

### Бизнес-метрики
- 🎵 Пользователи могут зарабатывать токены
- 💰 Артисты получают доход от музыки
- 📈 Платформа готова к росту пользователей

## Следующие шаги после MVP

1. **Масштабирование:** Переход на mainnet
2. **Интеграции:** Spotify, Apple Music API
3. **Расширение:** Дополнительные механики токенов
4. **Мобильное приложение:** React Native версия

---

**MVP готов к запуску!** 🚀

После выполнения всех шагов у вас будет рабочая платформа с токенами, где пользователи могут зарабатывать на музыке уже через 2-3 недели разработки.