#!/bin/bash

# Тест подключения к серверу REG.RU
SERVER_IP="31.31.196.214"
SSH_USER="u3284463"
SSH_PASSWORD="4t6A3d91vtOrZXH1"

echo "🔐 Тестирование SSH подключения к серверу..."

if sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${SSH_USER}@${SERVER_IP} "echo 'SSH OK'"; then
    echo "✅ SSH подключение работает"
else
    echo "❌ SSH подключение не работает"
    exit 1
fi

echo "🌐 Тестирование доступности веб-сервера..."
if sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_IP} "sudo systemctl status nginx" 2>/dev/null; then
    echo "✅ Nginx работает"
else
    echo "⚠️ Nginx не запущен или нет доступа"
fi

echo "📊 Проверка системных ресурсов..."
sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_IP} "df -h / && free -h && uptime"