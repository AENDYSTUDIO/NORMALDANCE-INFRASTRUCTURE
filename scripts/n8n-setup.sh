#!/bin/bash

# n8n Setup Script for NORMALDANCE Enterprise Automation

echo "🚀 Установка n8n для NORMALDANCE Enterprise Automation..."

# Проверяем, установлен ли Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Пожалуйста, установите Docker перед продолжением."
    exit 1
fi

# Создаем директорию для n8n, если она не существует
mkdir -p ~/.n8n

# Запускаем n8n в Docker
echo "📦 Запуск n8n в контейнере..."
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER="admin" \
  -e N8N_BASIC_AUTH_PASSWORD="secure_password" \
  -e N8N_EXTERNAL_URL="http://localhost:5678" \
  n8nio/n8n

echo "✅ n8n успешно запущен на http://localhost:5678"
echo "🔐 Логин: admin"
echo "🔑 Пароль: secure_password"

# Ждем немного, чтобы n8n успел запуститься
sleep 10

# Импортируем созданные workflow
echo "🔄 Импортируем готовые workflow..."

# Проверяем, доступен ли n8n
if curl -s --connect-timeout 10 http://localhost:5678 > /dev/null; then
    echo "✅ n8n доступен, можно импортировать workflow вручную через интерфейс"
else
    echo "⚠️ n8n еще не готов к работе, импортируйте workflow вручную позже"
fi

echo "🎉 Установка n8n завершена!"
echo "📋 Далее:" 
echo "   1. Откройте http://localhost:5678"
echo "   2. Войдите с логином admin / secure_password"
echo "   3. Импортируйте workflow из директории n8n-workflows/"
echo "   4. Настройте соединения с сервисами (GitHub, Telegram, Todoist и т.д.)"