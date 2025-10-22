# 💻 Руководство локальной разработки

## 🚀 Быстрый старт

### Предварительные требования

Убедитесь, что у вас установлены:

- **Node.js**: 20.x или выше ([скачать](https://nodejs.org/))
- **Docker**: 20.10 или выше ([скачать](https://docker.com/))
- **Git**: 2.30 или выше

### Первоначальная настройка

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/AENDYSTUDIO/NORMALDANCE-REVOLUTION.git
cd NORMALDANCE-REVOLUTION

# 2. Установите зависимости
npm install

# 3. Настройте переменные окружения
cp .env.example .env.local

# 4. Сгенерируйте Prisma клиент
npm run db:generate

# 5. Запустите миграции базы данных
npm run db:migrate

# 6. Запустите приложение в режиме разработки
npm run dev
```

После выполнения этих команд приложение будет доступно по адресу: **http://localhost:3000**

## 🛠️ Структура проекта

```
├── src/                    # Исходный код приложения
│   ├── app/               # Next.js App Router страницы
│   ├── components/        # React компоненты
│   ├── lib/               # Утилиты и библиотеки
│   ├── hooks/             # Кастомные React хуки
│   └── api/               # API роуты
├── docker/                # Docker файлы для различных сервисов
├── helm/                  # Kubernetes Helm чарты
├── mobile-app/            # React Native мобильное приложение
├── programs/              # Solana Anchor программы
├── prisma/                # База данных Prisma схема
└── docs/                  # Документация проекта
```

## 🔧 Команды разработки

### Основные команды

```bash
# Запуск в режиме разработки
npm run dev

# Сборка для продакшна
npm run build

# Запуск продакшн сборки локально
npm start

# Линтинг кода
npm run lint

# Автоматическое исправление линтинга
npm run lint:fix

# Запуск тестов
npm test

# Запуск тестов в режиме наблюдения
npm run test:watch

# Очистка кэша Next.js
npm run clean
```

### Работа с базой данных

```bash
# Генерация Prisma клиента
npm run db:generate

# Создание новой миграции
npm run db:migrate:dev --name feature-name

# Применение миграций
npm run db:migrate

# Сброс базы данных
npm run db:reset

# Открытие Prisma Studio
npm run db:studio
```

### Работа с блокчейном

```bash
# Тестирование Solana программ локально
npm run solana:test

# Деплой программ в devnet
npm run solana:deploy:devnet

# Деплой программ в mainnet
npm run solana:deploy:mainnet

# Проверка баланса аккаунта программы
npm run solana:balance
```

## 🐳 Docker разработка

### Запуск всех сервисов локально

```bash
# Запуск полной инфраструктуры
docker-compose up -d

# Запуск только базы данных
docker-compose up postgres redis -d

# Просмотр логов сервисов
docker-compose logs -f frontend
docker-compose logs -f backend

# Остановка всех сервисов
docker-compose down

# Остановка с удалением volumes
docker-compose down -v
```

### Доступ к сервисам

После запуска `docker-compose up`:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **IPFS Node**: http://localhost:8081
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🔗 Настройка внешних сервисов

### Solana Wallet

Для тестирования Web3 функциональности:

1. Установите [Phantom Wallet](https://phantom.app/)
2. Настройте тестовую сеть (devnet)
3. Получите тестовые SOL из [Solana Faucet](https://faucet.solana.com/)

### IPFS

Для работы с децентрализованным хранением:

```bash
# Установка IPFS Desktop
# https://ipfs.io/install/

# Или через npm
npm install -g ipfs
ipfs init
ipfs daemon
```

## 📱 Мобильная разработка

### Настройка мобильного приложения

```bash
# Установка зависимостей мобильного приложения
cd mobile-app
npm install

# Запуск на Android эмуляторе
npm run android

# Запуск на iOS симуляторе
npm run ios

# Сборка APK
npm run build:android
```

### Конфигурация мобильного приложения

```bash
# mobile-app/.env
API_URL=http://localhost:8080
SOLANA_RPC_URL=https://api.devnet.solana.com
IPFS_GATEWAY_URL=http://localhost:8081
```

## 🔧 Конфигурация IDE

### Рекомендуемые расширения VS Code

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "solana.solanawallet"
  ]
}
```

### Настройка рабочей области

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.workingDirectories": ["src", "mobile-app"],
  "files.associations": {
    "*.md": "markdown"
  }
}
```

## 🧪 Тестирование

### Запуск тестов

```bash
# Все тесты
npm test

# Тесты с покрытием
npm run test:coverage

# Интеграционные тесты
npm run test:integration

# E2E тесты
npm run test:e2e

# Performance тесты
npm run test:performance
```

### Написание тестов

```typescript
// src/__tests__/components/TrackCard.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrackCard from '@/components/TrackCard';

describe('TrackCard', () => {
  it('renders track information', () => {
    render(<TrackCard track={mockTrack} />);

    expect(screen.getByText(mockTrack.title)).toBeInTheDocument();
    expect(screen.getByText(mockTrack.artist)).toBeInTheDocument();
  });

  it('handles play button click', () => {
    const mockPlay = jest.fn();
    render(<TrackCard track={mockTrack} onPlay={mockPlay} />);

    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(mockPlay).toHaveBeenCalledWith(mockTrack.id);
  });
});
```

## 🚨 Отладка

### Логи приложения

```bash
# Увеличение уровня логирования
DEBUG=normaldance:* npm run dev

# Логи только для API
DEBUG=normaldance:api npm run dev

# Логи базы данных
DEBUG=prisma:* npm run dev
```

### Инструменты отладки

```typescript
// Использование React DevTools
import { useEffect } from 'react';

function DebugComponent() {
  useEffect(() => {
    console.log('Component mounted');
    return () => console.log('Component unmounted');
  }, []);

  return <div>Debug info</div>;
}
```

### Профилирование производительности

```bash
# React DevTools Profiler
# 1. Откройте React DevTools в браузере
# 2. Перейдите во вкладку Profiler
# 3. Запишите сессию взаимодействия с приложением
```

## 🔒 Безопасность разработки

### Управление секретами

```bash
# Никогда не коммитьте реальные секреты
git status
git diff .env.local  # Убедитесь что .env.local не в коммите

# Используйте .env.example как шаблон
cp .env.example .env.local
# Заполните .env.local своими тестовыми значениями
```

### Локальное сканирование безопасности

```bash
# Проверка зависимостей на уязвимости
npm audit

# Проверка конкретного уровня угроз
npm audit --audit-level moderate

# Автоматическое исправление уязвимостей
npm audit fix
```

## 📊 Мониторинг разработки

### Локальные метрики

```typescript
// src/lib/dev-metrics.ts
export class DevMetrics {
  static recordApiCall(endpoint: string, duration: number) {
    console.log(`API Call: ${endpoint} - ${duration}ms`);
  }

  static recordError(error: Error, context: any) {
    console.error('Dev Error:', error.message, context);
  }
}
```

### Профилирование памяти

```bash
# Использование Chrome DevTools Memory tab
# 1. Откройте DevTools (F12)
# 2. Перейдите во вкладку Memory
# 3. Сделайте snapshot до и после операции
# 4. Сравните snapshots для выявления утечек памяти
```

## 🤝 Сотрудничество

### Работа с ветками

```bash
# Создание новой ветки для функции
git checkout -b feature/amazing-new-feature

# Публикация ветки
git push -u origin feature/amazing-new-feature

# Слияние изменений
git checkout main
git pull origin main
git merge feature/amazing-new-feature
git push origin main
```

### Code Review процесс

1. Создайте Pull Request с описанием изменений
2. Добавьте reviewers из команды
3. Дождитесь approval перед merge
4. После merge удалите ветку

## 🔧 Распространенные проблемы

### Проблема: Node modules не устанавливаются

```bash
# Очистка кэша npm
npm cache clean --force

# Удаление node_modules и package-lock.json
rm -rf node_modules package-lock.json

# Переустановка
npm install
```

### Проблема: База данных не подключается

```bash
# Проверка подключения к базе данных
npm run db:studio

# Проверка переменных окружения
cat .env.local | grep DATABASE_URL

# Проверка Docker контейнера
docker-compose ps
docker-compose logs postgres
```

### Проблема: Solana программы не компилируются

```bash
# Проверка версии Solana CLI
solana --version

# Переустановка зависимостей Anchor
npm install -g @project-serum/anchor-cli

# Проверка баланса аккаунта
npm run solana:balance
```

## 📚 Дополнительные ресурсы

### Документация компонентов
- [Storybook](./storybook-static/index.html) - UI компоненты
- [API документация](./docs/api/README.md) - REST API спецификация

### Сообщество
- [GitHub Issues](https://github.com/AENDYSTUDIO/NORMALDANCE-REVOLUTION/issues) - Баг репорты и предложения
- [Discord](https://discord.gg/normaldance) - Обсуждения разработки
- [Документация](https://docs.normaldance.com) - Полная документация

### Видео туториалы
- [Настройка окружения](./docs/tutorials/setup.md)
- [Работа с блокчейном](./docs/tutorials/blockchain.md)
- [Развертывание в продакшн](./docs/tutorials/deployment.md)

---

*Если у вас возникли проблемы, не описанные в этом руководстве, создайте issue в репозитории с тегом `development-help`.*
