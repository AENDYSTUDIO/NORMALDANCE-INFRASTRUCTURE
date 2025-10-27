#!/bin/bash

# 🚀 NORMAL DANCE - Автоматическая настройка на REG.RU сервере
# Использование: curl -s https://raw.githubusercontent.com/AENDYSTUDIO/NORMALDANCE-REVOLUTION/main/scripts/regru-deploy.sh | bash

set -euo pipefail

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Данные сервера REG.RU
SERVER_IP="31.31.196.214"
SSH_USER="u3284463"
PROJECT_DIR="/var/www/${SSH_USER}/data/www/normaldance.ru"
DB_NAME="u3284463_default"
DB_USER="u3284463_default"

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $*${NC}"
}

success() {
    echo -e "${GREEN}✅ $*${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $*${NC}"
}

error() {
    echo -e "${RED}❌ $*${NC}"
    exit 1
}

# Проверка наличия SSH ключа или запрос пароля
check_ssh_access() {
    log "🔐 Проверка SSH доступа к серверу..."

    if ssh -o BatchMode=yes -o ConnectTimeout=10 ${SSH_USER}@${SERVER_IP} "echo 'SSH OK'" 2>/dev/null; then
        SSH_CMD="ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_IP}"
        success "SSH доступ настроен"
    else
        warning "SSH ключи не настроены"
        echo "Необходимо ввести пароль для пользователя ${SSH_USER}"
        SSH_CMD="sshpass -p '[ВАШ_ПАРОЛЬ]' ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_IP}"
    fi
}

# Подготовка сервера
prepare_server() {
    log "🏗️ Подготовка сервера..."

    # Обновление системы
    ${SSH_CMD} "sudo apt update && sudo apt upgrade -y"

    # Установка необходимых пакетов
    ${SSH_CMD} "sudo apt install -y curl wget git nodejs npm mysql-client"

    # Установка PM2 для управления процессами
    ${SSH_CMD} "sudo npm install -g pm2"

    success "Сервер подготовлен"
}

# Настройка базы данных
setup_database() {
    log "💾 Настройка базы данных..."

    # Тестирование подключения к MySQL
    if ${SSH_CMD} "mysql -h localhost -u ${DB_USER} -p[ВАШ_ПАРОЛЬ_БД] ${DB_NAME} -e 'SELECT 1'" 2>/dev/null; then
        success "Подключение к базе данных успешно"
    else
        warning "Не удалось подключиться к базе данных"
        warning "Убедитесь что пароль базы данных указан правильно"
    fi

    # Создание файла конфигурации базы данных
    cat > .env.local << EOF
# Database
DATABASE_URL="mysql://${DB_USER}:[ВАШ_ПАРОЛЬ_БД]@localhost:3306/${DB_NAME}"

# Server
NODE_ENV="production"
PORT=3000

# Application
NEXT_PUBLIC_APP_URL="https://normaldance.ru"
NEXT_PUBLIC_WS_URL="wss://normaldance.ru"

# Security
JWT_SECRET="[СГЕНЕРИРУЙТЕ_БЕЗОПАСНЫЙ_СЕКРЕТ]"

# Blockchain
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
TON_RPC_URL="https://ton.org/api/v2/jsonRPC"
EOF

    success "Конфигурация базы данных создана"
}

# Развертывание приложения
deploy_application() {
    log "🚀 Развертывание приложения..."

    # Создание директории проекта
    ${SSH_CMD} "mkdir -p ${PROJECT_DIR}"

    # Клонирование репозитория
    ${SSH_CMD} "cd ${PROJECT_DIR} && git clone https://github.com/AENDYSTUDIO/NORMALDANCE-REVOLUTION.git . || git pull origin main"

    # Копирование конфигурации
    scp .env.local ${SSH_USER}@${SERVER_IP}:${PROJECT_DIR}/.env

    # Установка зависимостей
    ${SSH_CMD} "cd ${PROJECT_DIR} && npm install"

    # Генерация Prisma клиента
    ${SSH_CMD} "cd ${PROJECT_DIR} && npm run db:generate"

    # Создание и применение миграций базы данных
    ${SSH_CMD} "cd ${PROJECT_DIR} && npm run db:migrate"

    # Сборка приложения
    ${SSH_CMD} "cd ${PROJECT_DIR} && npm run build"

    success "Приложение развернуто"
}

# Настройка веб-сервера
setup_web_server() {
    log "🌐 Настройка веб-сервера..."

    # Создание конфигурации Nginx для normaldance.ru
    ${SSH_CMD} "sudo tee /etc/nginx/sites-available/normaldance.ru > /dev/null" << 'EOF'
server {
    listen 80;
    server_name normaldance.ru www.normaldance.ru;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Статические файлы
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API роуты
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

    # Создание конфигурации для normaldance.online
    ${SSH_CMD} "sudo tee /etc/nginx/sites-available/normaldance.online > /dev/null" << 'EOF'
server {
    listen 80;
    server_name normaldance.online www.normaldance.online;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

    # Активация сайтов
    ${SSH_CMD} "sudo ln -sf /etc/nginx/sites-available/normaldance.ru /etc/nginx/sites-enabled/"
    ${SSH_CMD} "sudo ln -sf /etc/nginx/sites-available/normaldance.online /etc/nginx/sites-enabled/"

    # Удаление дефолтного сайта
    ${SSH_CMD} "sudo rm -f /etc/nginx/sites-enabled/default"

    # Тестирование конфигурации
    ${SSH_CMD} "sudo nginx -t"

    # Перезапуск Nginx
    ${SSH_CMD} "sudo systemctl reload nginx"

    success "Веб-сервер настроен"
}

# Запуск приложения
start_application() {
    log "▶️ Запуск приложения..."

    # Создание PM2 экосистемы
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'normaldance',
    script: 'npm',
    args: 'start',
    cwd: '${PROJECT_DIR}',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: '${PROJECT_DIR}/logs/err.log',
    out_file: '${PROJECT_DIR}/logs/out.log',
    log_file: '${PROJECT_DIR}/logs/combined.log',
    time: true
  }]
};
EOF

    scp ecosystem.config.js ${SSH_USER}@${SERVER_IP}:${PROJECT_DIR}/

    # Создание директории для логов
    ${SSH_CMD} "mkdir -p ${PROJECT_DIR}/logs"

    # Запуск приложения через PM2
    ${SSH_CMD} "cd ${PROJECT_DIR} && pm2 start ecosystem.config.js"

    # Сохранение конфигурации PM2
    ${SSH_CMD} "pm2 save"

    # Настройка автозапуска PM2
    ${SSH_CMD} "pm2 startup"

    success "Приложение запущено через PM2"
}

# Настройка мониторинга
setup_monitoring() {
    log "📊 Настройка мониторинга..."

    # Установка htop и другие утилиты мониторинга
    ${SSH_CMD} "sudo apt install -y htop iotop nethogs"

    # Настройка logrotate для логов приложения
    ${SSH_CMD} "sudo tee /etc/logrotate.d/normaldance > /dev/null" << 'EOF'
/var/www/u3284463/data/www/normaldance.ru/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 u3284463 u3284463
}
EOF

    success "Мониторинг настроен"
}

# Финальная проверка
final_check() {
    log "🔍 Финальная проверка..."

    # Проверка запущенных процессов
    if ${SSH_CMD} "pm2 list | grep normaldance" 2>/dev/null; then
        success "Приложение работает через PM2"
    else
        warning "Приложение не найдено в PM2"
    fi

    # Проверка доступности порта
    if ${SSH_CMD} "netstat -tlnp | grep :3000" 2>/dev/null; then
        success "Порт 3000 прослушивается"
    else
        warning "Порт 3000 не прослушивается"
    fi

    # Проверка Nginx конфигурации
    if ${SSH_CMD} "sudo nginx -t" 2>/dev/null; then
        success "Конфигурация Nginx корректна"
    else
        warning "Проблемы с конфигурацией Nginx"
    fi

    log "🎉 Развертывание завершено!"
    echo ""
    echo "📋 Доступ к приложению:"
    echo "• https://normaldance.ru"
    echo "• https://normaldance.online"
    echo ""
    echo "🔧 Управление приложением:"
    echo "• Статус: pm2 status"
    echo "• Логи: pm2 logs normaldance"
    echo "• Перезапуск: pm2 restart normaldance"
    echo "• Остановка: pm2 stop normaldance"
}

# Основная функция
main() {
    log "🚀 Начало развертывания NORMAL DANCE на REG.RU сервер..."

    check_ssh_access
    prepare_server
    setup_database
    deploy_application
    setup_web_server
    start_application
    setup_monitoring
    final_check

    log "🎉 Развертывание успешно завершено!"
    echo ""
    echo "📖 Следующие шаги:"
    echo "1. Настройте DNS записи в панели REG.RU"
    echo "2. Получите SSL сертификат через панель Ispmanager"
    echo "3. Протестируйте приложение"
    echo "4. Настройте мониторинг и резервное копирование"
}

# Запуск скрипта
main "$@"
