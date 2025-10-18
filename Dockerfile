# Многоэтапная сборка для NormalDance с оптимизацией для Kubernetes

# Этап 1: Установка зависимостей
FROM node:20-alpine AS deps
WORKDIR /app

# Установка системных зависимостей для аудио обработки
RUN apk add --no-cache \
    ffmpeg \
    vips-dev

# Копирование package.json и package-lock.json
COPY package.json package-lock.json ./
COPY mobile-app/package.json mobile-app/package-lock.json ./mobile-app/

# Установка зависимостей для основного приложения
RUN npm ci --only=production

# Установка зависимостей для мобильного приложения
WORKDIR /app/mobile-app
RUN npm ci --only=production

WORKDIR /app

# Этап 2: Сборка приложения
FROM node:20-alpine AS builder
WORKDIR /app

# Установка системных зависимостей для сборки
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Копирование зависимостей
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/mobile-app/node_modules ./mobile-app/node_modules

# Копирование исходного кода
COPY . .

# Сборка основного приложения
RUN npm run build

# Сборка мобильного приложения
WORKDIR /app/mobile-app
RUN npm run build:android

WORKDIR /app

# Этап 3: Production среда
FROM node:20-alpine AS runner
WORKDIR /app

# Создание пользователя с фиксированным UID/GID для безопасности
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Установка системных зависимостей для аудио обработки
RUN apk add --no-cache \
    ffmpeg \
    vips-dev \
    build-base \
    python3 \
    dumb-init

# Копирование зависимостей
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/mobile-app/node_modules ./mobile-app/node_modules

# Копирование сборки
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/mobile-app/android/app/build/outputs/apk/ ./mobile-app/android/app/build/outputs/apk/

# Копирование конфигурации
COPY --chown=nextjs:nodejs prisma ./prisma
COPY --chown=nextjs:nodejs server.ts ./
COPY --chown=nextjs:nodejs next.config.ts ./

# Создание директорий для загрузок и кэша с правами пользователя
RUN mkdir -p /app/uploads /app/cache /app/logs && \
    chown -R nextjs:nodejs /app

# Переключение на пользователя
USER nextjs

# Экспорт портов
EXPOSE 3000
EXPOSE 3001

# Environment variables
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV NODE_ENV "production"
ENV UPLOAD_DIR "/app/uploads"
ENV CACHE_DIR "/app/cache"
ENV LOG_DIR "/app/logs"

# Health check для Kubernetes
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Запуск приложения через dumb-init для корректной обработки сигналов в Kubernetes
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.ts"]

# Этап 4: Development среда (опционально)
FROM node:20-alpine AS dev
WORKDIR /app

# Установка системных зависимостей для разработки
RUN apk add --no-cache \
    ffmpeg \
    vips-dev \
    build-base \
    python3

# Установка всех зависимостей
COPY package.json package-lock.json ./
COPY mobile-app/package.json mobile-app/package-lock.json ./mobile-app/

RUN apk add --no-cache eudev-dev && npm ci --no-optional --omit=dev --ignore-scripts

# Копирование исходного кода
COPY . .

# Экспорт порта
EXPOSE 3000

# Команда для разработки
CMD ["npm", "run", "dev"]

# Файл для проверки здоровья приложения в Kubernetes
RUN echo '#!/usr/bin/env node\nconst http = require("http");\nconst options = { host: "localhost", port: 3000, path: "/api/health", timeout: 200 };\nconst request = http.request(options, (res) => { console.log("STATUS: " + res.statusCode); process.exit(res.statusCode === 200 ? 0 : 1); });\nrequest.on("error", (err) => { console.log("ERROR: " + err.message); process.exit(1); });\nrequest.end();' > healthcheck.js
