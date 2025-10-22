#!/bin/bash

echo "🗄️ Настройка базы данных..."

# Установка MySQL сервера
echo "📦 Установка MySQL сервера..."
apt install -y mysql-server mysql-client

# Запуск MySQL сервиса
echo "▶️ Запуск MySQL..."
systemctl start mysql
systemctl enable mysql

# Ожидание запуска MySQL
sleep 5

# Настройка MySQL для удаленного доступа
echo "🔧 Настройка MySQL..."
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Ll6DLuwyKalfvGbF';"
mysql -e "CREATE USER IF NOT EXISTS 'normaldance'@'%' IDENTIFIED BY 'ulT85qn6UU6dYzEv';"
mysql -e "GRANT ALL PRIVILEGES ON *.* TO 'normaldance'@'%' WITH GRANT OPTION;"
mysql -e "FLUSH PRIVILEGES;"

# Создание базы данных для приложения
echo "💾 Создание базы данных normaldance..."
mysql -e "CREATE DATABASE IF NOT EXISTS normaldance;"
mysql -e "CREATE DATABASE IF NOT EXISTS normaldance_test;"

# Создание файла конфигурации для приложения
cat > /root/.env.production << 'EOF'
# Database Configuration
DATABASE_URL="mysql://normaldance:ulT85qn6UU6dYzEv@localhost:3306/normaldance"
DIRECT_URL="mysql://normaldance:ulT85qn6UU6dYzEv@localhost:3306/normaldance"

# Server Configuration
NODE_ENV="production"
PORT=3000
HOSTNAME="0.0.0.0"

# Application URLs
NEXT_PUBLIC_APP_URL="https://89.104.67.165"
NEXT_PUBLIC_WS_URL="wss://89.104.67.165"

# Security
JWT_SECRET="$(openssl rand -hex 32)"
BCRYPT_ROUNDS=12

# Blockchain RPC
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
TON_RPC_URL="https://ton.org/api/v2/jsonRPC"

# IPFS
IPFS_GATEWAY_URL="https://gateway.pinata.cloud"
NEXT_PUBLIC_IPFS_GATEWAY="https://gateway.pinata.cloud"

# Redis
REDIS_URL="redis://localhost:6379"
EOF

echo "📋 Проверка базы данных..."
mysql -e "SHOW DATABASES;"
mysql -e "SELECT USER,HOST FROM mysql.user WHERE USER='normaldance';"

echo "✅ Настройка базы данных завершена"

# Тестирование подключения
echo "🔍 Тестирование подключения к базе данных..."
mysql -u normaldance -pulT85qn6UU6dYzEv -e "SELECT 1;" normaldance

if [ $? -eq 0 ]; then
    echo "✅ Подключение к базе данных работает"
else
    echo "❌ Проблемы с подключением к базе данных"
fi