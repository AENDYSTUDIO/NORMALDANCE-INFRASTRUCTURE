#!/bin/bash

echo "🚀 Развертывание приложения NORMAL DANCE..."

# Создание директории проекта
mkdir -p /var/www/normaldance.ru

# Переход в директорию проекта
cd /var/www/normaldance.ru

# Клонирование репозитория (если еще не клонирован)
if [ ! -d ".git" ]; then
    echo "📥 Клонирование репозитория..."
    git clone https://github.com/AENDYSTUDIO/NORMALDANCE-REVOLUTION.git .
else
    echo "📦 Обновление репозитория..."
    git fetch origin
    git reset --hard origin/main
fi

# Проверка наличия package.json
if [ -f "package.json" ]; then
    echo "📋 Найден package.json"

    # Установка зависимостей
    echo "📦 Установка зависимостей..."
    npm ci --production=false

    # Генерация Prisma клиента
    echo "🔧 Генерация Prisma клиента..."
    if command -v npx &> /dev/null; then
        npx prisma generate
    else
        npm run db:generate
    fi

    # Применение миграций базы данных
    echo "🗄️ Применение миграций базы данных..."
    if command -v npx &> /dev/null; then
        npx prisma migrate deploy
    else
        npm run db:migrate
    fi

    # Сборка приложения
    echo "🏗️ Сборка приложения..."
    npm run build

    echo "✅ Развертывание приложения завершено"
else
    echo "❌ Файл package.json не найден"
    exit 1
fi

# Создание директории для логов
mkdir -p /var/www/normaldance.ru/logs

# Проверка структуры приложения
echo "📁 Структура приложения:"
ls -la

echo "📋 Проверка файлов приложения:"
ls -la package.json
ls -la src/ 2>/dev/null || echo "Директория src не найдена"

# Создание простого health check эндпоинта
cat > /var/www/normaldance.ru/server.js << 'EOF'
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'NORMAL DANCE server is running',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
EOF

echo "🔧 Создан сервер для тестирования"