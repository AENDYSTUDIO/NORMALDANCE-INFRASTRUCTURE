#!/bin/bash

echo "🔄 Обновление системы сервера..."

# Обновление списка пакетов
echo "📦 Обновление списка пакетов..."
apt update

# Обновление системы
echo "⬆️ Обновление системы..."
apt upgrade -y

# Установка необходимых пакетов для NORMAL DANCE
echo "📋 Установка зависимостей..."
apt install -y \
    curl \
    wget \
    git \
    nodejs \
    npm \
    mysql-server \
    mysql-client \
    nginx \
    certbot \
    python3-certbot-nginx \
    htop \
    iotop \
    ufw \
    fail2ban \
    redis-server \
    postgresql \
    postgresql-contrib \
    sqlite3 \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Установка PM2 глобально
echo "📦 Установка PM2..."
npm install -g pm2

# Установка Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Установка Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker root
fi

# Проверка установки
echo "🔍 Проверка установленных компонентов..."
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "PM2 version: $(pm2 -v)"
echo "MySQL status: $(systemctl is-active mysql)"
echo "Nginx status: $(systemctl is-active nginx)"

# Настройка firewall
echo "🔥 Настройка firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Настройка fail2ban
echo "🛡️ Настройка fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

echo "✅ Обновление системы завершено"