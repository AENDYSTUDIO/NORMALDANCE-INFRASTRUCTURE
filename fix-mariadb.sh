#!/bin/bash

echo "🔧 Исправление настройки MariaDB..."

# Остановка MariaDB для безопасной настройки
systemctl stop mariadb

# Запуск MariaDB в безопасном режиме для сброса пароля root
echo "🔑 Сброс пароля root пользователя..."
mysqld_safe --skip-grant-tables --skip-networking &
sleep 3

# Подключение к MariaDB без пароля и установка нового пароля
mysql -u root << EOF
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'Ll6DLuwyKalfvGbF';
EOF

# Остановка безопасного режима
pkill mysqld

# Запуск MariaDB в нормальном режиме
systemctl start mariadb
sleep 5

# Настройка пользователей и баз данных
echo "👥 Создание пользователей и баз данных..."
mysql -u root -pLl6DLuwyKalfvGbF << EOF
CREATE USER IF NOT EXISTS 'normaldance'@'%' IDENTIFIED BY 'ulT85qn6UU6dYzEv';
GRANT ALL PRIVILEGES ON *.* TO 'normaldance'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;

CREATE DATABASE IF NOT EXISTS normaldance;
CREATE DATABASE IF NOT EXISTS normaldance_test;

GRANT ALL PRIVILEGES ON normaldance.* TO 'normaldance'@'%';
GRANT ALL PRIVILEGES ON normaldance_test.* TO 'normaldance'@'%';
FLUSH PRIVILEGES;
EOF

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
mysql -u root -pLl6DLuwyKalfvGbF -e "SHOW DATABASES;"
mysql -u root -pLl6DLuwyKalfvGbF -e "SELECT USER,HOST FROM mysql.user WHERE USER='normaldance';"

echo "✅ Настройка базы данных завершена"

# Тестирование подключения
echo "🔍 Тестирование подключения к базе данных..."
mysql -u normaldance -pulT85qn6UU6dYzEv -e "SELECT 1;" normaldance

if [ $? -eq 0 ]; then
    echo "✅ Подключение к базе данных работает"
else
    echo "❌ Проблемы с подключением к базе данных"
fi