# 🚀 NORMAL DANCE - Docker для REG.RU сервера
FROM node:20-bullseye-slim

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    htop \
    iotop \
    nginx \
    certbot \
    python3-certbot-nginx \
    mysql-client \
    postgresql-client \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

# Создание пользователя приложения
RUN groupadd -r normaldance && useradd -r -g normaldance normaldance

# Создание директорий приложения
RUN mkdir -p /app && chown -R normaldance:normaldance /app
RUN mkdir -p /var/www/normaldance && chown -R normaldance:normaldance /var/www/normaldance
RUN mkdir -p /var/log/normaldance && chown -R normaldance:normaldance /var/log/normaldance

# Установка PM2 глобально
RUN npm install -g pm2 @prisma/cli

# Копирование конфигурации Nginx
COPY nginx/regru.conf /etc/nginx/sites-available/normaldance.ru
COPY nginx/regru-online.conf /etc/nginx/sites-available/normaldance.online

# Создание скрипта запуска
COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Переключение на пользователя приложения
USER normaldance

# Рабочая директория
WORKDIR /app

# Копирование package файлов
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production=false

# Копирование исходного кода
COPY --chown=normaldance:normaldance . .

# Генерация Prisma клиента
RUN npx prisma generate

# Сборка приложения
RUN npm run build

# Создание директории для логов
RUN mkdir -p logs

# Экспорт порта
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Запуск через entrypoint скрипт
ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "start"]