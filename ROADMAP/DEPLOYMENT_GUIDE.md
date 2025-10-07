# 🚀 Пошаговый план запуска проекта NORMAL DANCE

## 📋 Общая информация

Про NORMAL DANCE - децентрализованная музыкальная платформа на базе Next.js 15 с TypeScript, Prisma ORM, WebSocket и Web3 интеграцией.

### 🏗️ Технологический стек
- **Next.js 15** - React фреймворк с App Router
- **TypeScript 5** - Типобезопасный JavaScript
- **Prisma** - ORM для работы с базой данных
- **SQLite** - Локальная база данных
- **Socket.IO** - WebSocket для реального времени
- **shadcn/ui** - UI компоненты
- **NextAuth.js** - Аутентификация
- **Tailwind CSS** - CSS фреймворк

## 🔍 Возможные проблемы при запуске

1. **Отсутствие environment переменных** - критическая проблема
2. **Проблемы с базой данных** - Prisma + SQLite
3. **Конфигурация WebSocket сервера** - Socket.IO
4. **Отсутствие аудиофайлов** - мок данные
5. **Конфликты портов** - порт 3000
6. **Проблемы с TypeScript** - конфигурация
7. **Отсутствие NextAuth конфигурации** - аутентификация

## 📝 Пошаговый план запуска

### Шаг 1: Создание environment файла

```bash
# Создайте файл .env в корневой директории проекта
touch .env
```

Содержимое `.env` файла:
```env
# Database
DATABASE_URL="file:./db/custom.db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Node Environment
NODE_ENV="development"

# WebSocket
SOCKET_PORT=3000

# Web3 (опционально)
WALLET_CONNECT_PROJECT_ID="your-wallet-connect-id"
```

### Шаг 2: Установка зависимостей

```bash
# Установка npm зависимостей
npm install

# Генерация Prisma клиента
npm run db:generate

# Применение схемы базы данных
npm run db:push
```

### Шаг 3: Настройка базы данных

```bash
# Создание миграции (если нужно)
npm run db:migrate

# Сброс базы данных (если нужно)
npm run db:reset
```

### Шаг 4: Запуск приложения

```bash
# Запуск в режиме разработки
npm run dev

# Или запуск в продакшене
npm run build
npm start
```

### Шаг 5: Проверка работы

1. Откройте `http://localhost:3000`
2. Проверьте WebSocket соединение: `ws://localhost:3000/api/socketio`
3. Проверьте работу аудио плеера
4. Проверьте API эндпоинты

## 🚨 Критические проблемы и их решения

### Проблема 1: Отсутствие environment файла
**Решение:** Создайте `.env` файл с необходимыми переменными

### Проблема 2: Проблемы с Prisma
**Решение:** Убедитесь, что база данных создана и схема применена
```bash
npm run db:push
```

### Проблема 3: Конфликт портов
**Решение:** Закройте другие приложения на порту 3000 или измените порт в `server.ts`

### Проблема 4: WebSocket не работает
**Решение:** Проверьте консоль на ошибки в `server.ts`

### Проблема 5: Аудио файлы отсутствуют
**Решение:** Добавьте аудиофайлы в папку `public/` или используйте мок данные

## 🔧 Дополнительные настройки

### Настройка NextAuth.js
Создайте файл `src/lib/auth.ts`:
```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Логика аутентификации
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

### Настройка WebSocket
WebSocket сервер уже настроен в `server.ts` и `src/lib/socket.ts`

## 📝 Проверка работоспособности

### Проверка базы данных:
```bash
npx tsx prisma/seed.ts
```

### Проверка API:
```bash
curl http://localhost:3000/api/health
```

### Проверка WebSocket:
```javascript
const socket = io('ws://localhost:3000/api/socketio');
socket.on('message', (data) => console.log(data));
```

## 🎯 Ожидаемые результаты

- Приложение запускается на `http://localhost:3000`
- WebSocket сервер работает на `ws://localhost:3000/api/socketio`
- База данных SQLite создана и заполнена
- Аудио плеер отображает треки
- Все UI компоненты работают корректно

## 🚀 Дополнительные команды

```bash
# Линтинг
npm run lint

# Сборка для продакшена
npm run build

# Запуск в продакшене
npm start
```

## 📁 Структура проекта

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
└── lib/                # Utility functions and configurations
```

## 🔐 Безопасность

- Никогда не храните секреты в коде
- Используйте environment переменные
- Регулярно обновляйте зависимости
- Используйте HTTPS в продакшене

---
Создано для NORMAL DANCE 🎵