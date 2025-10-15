# Конституция разработчика NORMAL DANCE

## 1. Основной стек технологий

### Языки программирования

- **TypeScript** (основной язык для фронтенда и бэкенда)
- **Rust** (для Solana программ)
- **Python** (для AI/ML компонентов и скриптов)

### Фреймворки и библиотеки

- **Next.js 15** - основной фреймворк для веб-приложения
- **React 18** - библиотека для построения пользовательского интерфейса
- **Solana Web3.js** - для взаимодействия с Solana блокчейном
- **Solana Wallet Adapter** - интеграция с кошельками
- **Phantom Wallet** - основной поддерживаемый кошелек
- **TON Connect SDK** - для интеграции с TON
- **Socket.IO** - для реального времени взаимодействия
- **Prisma** - ORM для работы с базой данных
- **NextAuth.js** - система аутентификации
- **Tailwind CSS** - система стилизации
- **Radix UI** - низкоуровневые компоненты UI
- **Zustand** - управление состоянием
- **Jest/React Testing Library** - тестирование
- **IPFS/Helia** - децентрализованное хранение
- **Qdrant** - векторная база данных для рекомендательной системы
- **Model Context Protocol (MCP)** - для AI интеграции

## 2. Архитектура и структура

### Структура проекта

```
src/
├── app/                    # Next.js App Router
├── components/            # React компоненты
│   ├── ui/               # Базовые UI компоненты (Radix + Tailwind)
│   ├── wallet/           # Компоненты для работы с кошельками
│   └── telegram/         # Компоненты для Telegram интеграции
├── lib/                 # Библиотечные функции и классы
├── hooks/               # Кастомные React хуки
├── store/               # Zustand store
├── types/               # TypeScript типы
├── constants/           # Константы
├── contexts/            # React контексты
├── middleware/          # Next.js middleware
├── mcp/                 # Model Context Protocol сервер
├── __tests__/           # Тесты
```

### Расположение новых компонентов

- **UI компоненты**: `src/components/ui/`
- **Бизнес-логика компоненты**: `src/components/` с соответствующей папкой
- **Библиотечные функции**: `src/lib/`
- **Хуки**: `src/hooks/`
- **Типы**: `src/types/`
- **Константы**: `src/constants/`
- **Мидлвары**: `src/middleware/`
- **MCP провайдеры**: `src/mcp/providers/`

## 3. Стилизация

### Принципы стилизации

- Использование **Tailwind CSS** с настроенной темой
- Цвета определены через CSS переменные в `tailwind.config.ts`
- Использование `darkMode: "class"` для поддержки темной темы
- Все компоненты должны быть адаптивными
- Использование семантических цветов (primary, secondary, muted и т.д.)

### Паттерны

- Компоненты UI в `src/components/ui/` должны быть построены на Radix UI
- Использование `cn()` утилиты для комбинации Tailwind классов
- Стили компонентов инлайновые через Tailwind, без CSS файлов
- Использование `tailwindcss-animate` для анимаций

## 4. Управление данными

### База данных

- **SQLite** через **Prisma ORM**
- Использование глобального инстанса Prisma в `src/lib/db.ts`
- Модели определены в `prisma/schema.prisma`
- Использование миграций Prisma для изменений схемы

### Децентрализованное хранение

- **IPFS** через **Helia** для хранения медиафайлов
- **Filecoin** для долгосрочного хранения
- Репликация на несколько шлюзов (ipfs.io, pinata.cloud, cloudflare-ipfs.com)
- Автоматическая проверка доступности файлов
- Использование `src/lib/ipfs-enhanced.ts` для всех операций с IPFS

### Векторная база данных

- **Qdrant** для рекомендательной системы
- Использование векторного поиска для музыкальных рекомендаций

## 5. Особые практики

### Тестирование

- **Jest** для юнит и интеграционных тестов
- **React Testing Library** для тестирования компонентов
- **Playwright** для E2E тестов
- Тесты размещаются в `__tests__/` папках рядом с тестируемыми файлами
- Покрытие тестами обязательно для критических компонентов

### Безопасность

- **ESLint отключен** (по решению команды, см. AGENTS.md)
- **TypeScript** с `noImplicitAny: false` и `no-non-null-assertion: off` (для Web3)
- **Helmet** для заголовков безопасности
- **Rate limiting** через `express-rate-limit` и кастомные мидлвары
- **Input validation** и **sanitization** для всех внешних данных
- **CSP** заголовки в `next.config.ts`
- **Web3 безопасности** через `siwe` (Sign-In with Ethereum)

### Web3 специфика

- **Solana programs** в папке `programs/` с фиксированными ID
- **Deflationary model** с 2% сжиганием токенов при транзакциях
- **Custom wallet adapter** в `src/components/wallet/wallet-adapter.tsx`
- **Silent failures** в операциях с кошельками (возвращают 0 вместо ошибки)
- **Russian locale** для форматирования SOL сумм

### AI/ML интеграция

- **Model Context Protocol (MCP)** сервер в `src/mcp/server.ts`
- **AI рекомендательная система** в `src/lib/ai-recommendation-system.ts`
- **Векторные эмбеддинги** для музыкального контента
- **Qdrant** для хранения и поиска векторов

### Многоязычность (ATR)

- Поддержка языков АТР региона (Китай, Япония, Корея, Индия, Индонезия, Таиланд, Вьетнам, Филиппины, Малайзия)
- Использование `src/lib/i18n/atr-translations.ts` для переводов
- Форматирование дат и чисел по локали

### Telegram интеграция

- **Telegram Mini App** в отдельной папке
- **Telegram Stars** для монетизации
- **@twa-dev/sdk** для интеграции с Telegram
- **TON Connect** для кошелька в Telegram

### CI/CD и деплой

- **Vercel** для основного веб-приложения
- **Docker** для контейнеризации
- **Husky** для git hooks
- **Jest** для тестирования в CI
- **Security scanning** через `npm audit`

### Производительность

- **Lazy loading** компонентов через `createLazyComponent`
- **Image optimization** через Next.js Image и IPFS
- **Bundle analysis** через `@next/bundle-analyzer`
- **CDN** через Cloudflare для быстрой доставки контента

## 6. Специфические ограничения и особенности

### Ограничения

- Все кошельки должны использовать **Phantom** как основной
- **Deflationary model** - 2% сжигание при каждой транзакции
- **Russian locale** по умолчанию для всех числовых форматов
- **Silent failures** в Web3 операциях (возвращают 0, не бросают ошибки)
- **ESLint отключен** - форматирование через Prettier

### Особые практики

- **Custom event emitter** для кошелька в `src/components/wallet/wallet-adapter.tsx`
- **Global Prisma instance** в `src/lib/db.ts`
- **Socket.IO** на кастомном пути `/api/socketio`
- **MCP server** для AI интеграции
- **Multiple IPFS gateways** с автоматической репликацией
- **Filecoin integration** для долгосрочного хранения
- **AI recommendation system** с контекстной логикой
- **RBAC система** с уровнями: BRONZE, SILVER, GOLD, PLATINUM, ADMIN, CURATOR

### Критические архитектурные паттерны

- **Custom server setup** через `server.ts` с Socket.IO интеграцией
- **Wallet integration** через Phantom только, с кастомной системой событий
- **Deflationary model** с 2% burn на все транзакции
- **Database** через Prisma с SQLite и глобальным инстансом
- **Middleware** с RBAC и защитой через NextAuth
