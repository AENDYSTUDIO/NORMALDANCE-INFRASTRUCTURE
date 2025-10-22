#!/bin/bash

# 🚀 NORMAL DANCE - ПРОДАКШН развертывание на REG.RU
# Использование: ./scripts/regru-production-deploy.sh

set -euo pipefail

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Конфигурация REG.RU сервера
SERVER_IP="31.31.196.214"
SSH_USER="u3284463"
SSH_PASSWORD="4t6A3d91vtOrZXH1"
FTP_PASSWORD="zv4xVKK61C3FnCzj"
DB_PASSWORD="ulT85qn6UU6dYzEv"

PROJECT_DIR="/var/www/${SSH_USER}/data/www/normaldance.ru"
BACKUP_DIR="/var/www/${SSH_USER}/backups"
LOG_DIR="/var/www/${SSH_USER}/logs"

# Генерация безопасных секретов
JWT_SECRET=$(openssl rand -hex 32)
DB_ROOT_PASSWORD=$(openssl rand -hex 16)

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

info() {
    echo -e "${PURPLE}ℹ️  $*${NC}"
}

# Создание директорий для локальных файлов
prepare_local() {
    log "📁 Подготовка локальных директорий..."

    mkdir -p ../backups
    mkdir -p ../temp
    mkdir -p ../logs

    success "Локальные директории созданы"
}

# Проверка доступа к серверу
check_server_access() {
    log "🔐 Проверка доступа к серверу..."

    # Проверка SSH доступа
    if sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${SSH_USER}@${SERVER_IP} "echo 'SSH OK'" 2>/dev/null; then
        success "SSH доступ работает"
        SSH_CMD="sshpass -p '${SSH_PASSWORD}' ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_IP}"
    else
        error "SSH доступ не работает. Проверьте пароль."
    fi

    # Проверка FTP доступа
    if echo "test" | timeout 10 sshpass -p "${FTP_PASSWORD}" ftp -n ${SERVER_IP} 2>/dev/null; then
        success "FTP доступ работает"
    else
        warning "FTP доступ не работает. Проверьте пароль."
    fi
}

# Создание резервной копии
create_backup() {
    log "💾 Создание резервной копии..."

    # Создание директории для бэкапов на сервере
    ${SSH_CMD} "mkdir -p ${BACKUP_DIR}"

    # Бэкап базы данных
    ${SSH_CMD} "mysqldump -h localhost -u u3284463_default -p'${DB_PASSWORD}' u3284463_default > ${BACKUP_DIR}/db-backup-\$(date +%Y%m%d-%H%M%S).sql"

    # Бэкап файлов приложения
    ${SSH_CMD} "cd ${PROJECT_DIR} && tar -czf ${BACKUP_DIR}/app-backup-\$(date +%Y%m%d-%H%M%S).tar.gz . --exclude=./node_modules --exclude=./.next --exclude=./logs"

    success "Резервная копия создана"
}

# Обновление системы сервера
update_server() {
    log "🔄 Обновление системы сервера..."

    # Обновление пакетов
    ${SSH_CMD} "sudo apt update && sudo apt upgrade -y"

    # Установка необходимых пакетов
    ${SSH_CMD} "sudo apt install -y curl wget git nodejs npm mysql-client postgresql-client redis-tools nginx certbot python3-certbot-nginx htop iotop ufw fail2ban"

    # Установка PM2 глобально
    ${SSH_CMD} "sudo npm install -g pm2"

    # Установка Docker если нужно
    if ! ${SSH_CMD} "command -v docker" 2>/dev/null; then
        ${SSH_CMD} "curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
        ${SSH_CMD} "sudo usermod -aG docker ${SSH_USER}"
    fi

    success "Система сервера обновлена"
}

# Настройка базы данных
setup_database() {
    log "🗄️ Настройка базы данных..."

    # Проверка подключения к MySQL
    if ${SSH_CMD} "mysql -h localhost -u u3284463_default -p'${DB_PASSWORD}' u3284463_default -e 'SELECT 1'" 2>/dev/null; then
        success "Подключение к базе данных успешно"
    else
        error "Не удалось подключиться к базе данных"
    fi

    # Создание файла конфигурации базы данных
    cat > ../temp/.env.production << EOF
# Database Configuration
DATABASE_URL="mysql://u3284463_default:${DB_PASSWORD}@localhost:3306/u3284463_default"
DIRECT_URL="mysql://u3284463_default:${DB_PASSWORD}@localhost:3306/u3284463_default"

# Server Configuration
NODE_ENV="production"
PORT=3000
HOSTNAME="0.0.0.0"

# Application URLs
NEXT_PUBLIC_APP_URL="https://normaldance.ru"
NEXT_PUBLIC_WS_URL="wss://normaldance.ru"

# Security
JWT_SECRET="${JWT_SECRET}"
BCRYPT_ROUNDS=12

# Blockchain RPC
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
TON_RPC_URL="https://ton.org/api/v2/jsonRPC"

# IPFS
IPFS_GATEWAY_URL="https://gateway.pinata.cloud"
NEXT_PUBLIC_IPFS_GATEWAY="https://gateway.pinata.cloud"

# Redis (если используется)
REDIS_URL="redis://localhost:6379"

# Monitoring
SENTRY_DSN=""
EOF

    success "Конфигурация базы данных создана"
}

# Развертывание приложения
deploy_application() {
    log "🚀 Развертывание приложения..."

    # Создание директории проекта
    ${SSH_CMD} "mkdir -p ${PROJECT_DIR}"

    # Переход в директорию проекта
    ${SSH_CMD} "cd ${PROJECT_DIR}"

    # Клонирование или обновление репозитория
    if ${SSH_CMD} "[ ! -d ${PROJECT_DIR}/.git ]"; then
        ${SSH_CMD} "cd ${PROJECT_DIR} && git clone https://github.com/AENDYSTUDIO/NORMALDANCE-REVOLUTION.git ."
    else
        ${SSH_CMD} "cd ${PROJECT_DIR} && git fetch origin && git reset --hard origin/main"
    fi

    # Копирование конфигурации
    scp ../temp/.env.production ${SSH_USER}@${SERVER_IP}:${PROJECT_DIR}/.env

    # Установка зависимостей
    ${SSH_CMD} "cd ${PROJECT_DIR} && npm ci --production=false"

    # Генерация Prisma клиента и миграции
    ${SSH_CMD} "cd ${PROJECT_DIR} && npm run db:generate"

    # Применение миграций базы данных
    ${SSH_CMD} "cd ${PROJECT_DIR} && npm run db:migrate"

    # Сборка приложения
    ${SSH_CMD} "cd ${PROJECT_DIR} && npm run build"

    success "Приложение развернуто"
}

# Настройка веб-сервера Nginx
setup_nginx() {
    log "🌐 Настройка Nginx..."

    # Создание конфигурации для normaldance.ru
    ${SSH_CMD} "sudo tee /etc/nginx/sites-available/normaldance.ru > /dev/null" << EOF
server {
    listen 80;
    server_name normaldance.ru www.normaldance.ru;
    root ${PROJECT_DIR};
    client_max_body_size 100M;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Основное приложение
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API роуты
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Безопасность API
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Статические файлы Next.js
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Robots-Tag "noindex";
    }

    # Health check для мониторинга
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Логи
    error_log /var/log/nginx/normaldance.ru_error.log;
    access_log /var/log/nginx/normaldance.ru_access.log;
}
EOF

    # Создание конфигурации для normaldance.online
    ${SSH_CMD} "sudo tee /etc/nginx/sites-available/normaldance.online > /dev/null" << EOF
server {
    listen 80;
    server_name normaldance.online www.normaldance.online;
    root ${PROJECT_DIR};
    client_max_body_size 100M;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Перенаправление на основной домен
    location / {
        return 301 https://normaldance.ru\$request_uri;
    }

    # Логи
    error_log /var/log/nginx/normaldance.online_error.log;
    access_log /var/log/nginx/normaldance.online_access.log;
}
EOF

    # Активация сайтов
    ${SSH_CMD} "sudo ln -sf /etc/nginx/sites-available/normaldance.ru /etc/nginx/sites-enabled/"
    ${SSH_CMD} "sudo ln -sf /etc/nginx/sites-available/normaldance.online /etc/nginx/sites-enabled/"

    # Удаление дефолтного сайта
    ${SSH_CMD} "sudo rm -f /etc/nginx/sites-enabled/default"

    # Тестирование конфигурации
    if ${SSH_CMD} "sudo nginx -t"; then
        success "Конфигурация Nginx корректна"
    else
        error "Ошибка в конфигурации Nginx"
    fi

    # Перезапуск Nginx
    ${SSH_CMD} "sudo systemctl reload nginx"

    success "Nginx настроен"
}

# Настройка SSL сертификатов
setup_ssl() {
    log "🔒 Настройка SSL сертификатов..."

    # Получение SSL сертификатов через Certbot
    ${SSH_CMD} "sudo certbot --nginx -d normaldance.ru -d www.normaldance.ru --non-interactive --agree-tos --email admin@normaldance.ru"

    # Настройка автоматического обновления сертификатов
    ${SSH_CMD} "sudo systemctl enable certbot.timer"

    success "SSL сертификаты настроены"
}

# Запуск приложения
start_application() {
    log "▶️ Запуск приложения..."

    # Создание директории для логов
    ${SSH_CMD} "mkdir -p ${PROJECT_DIR}/logs"

    # Создание PM2 экосистемы
    cat > ../temp/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'normaldance',
    script: 'server.js',
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
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

    scp ../temp/ecosystem.config.js ${SSH_USER}@${SERVER_IP}:${PROJECT_DIR}/

    # Остановка предыдущей версии
    ${SSH_CMD} "cd ${PROJECT_DIR} && pm2 stop normaldance" || true

    # Запуск новой версии
    ${SSH_CMD} "cd ${PROJECT_DIR} && pm2 start ecosystem.config.js"

    # Сохранение конфигурации PM2
    ${SSH_CMD} "pm2 save"

    # Настройка автозапуска
    ${SSH_CMD} "pm2 startup"

    success "Приложение запущено через PM2"
}

# Настройка мониторинга
setup_monitoring() {
    log "📊 Настройка мониторинга..."

    # Создание скрипта мониторинга
    cat > ../temp/monitor.sh << 'EOF'
#!/bin/bash
# Мониторинг NORMAL DANCE

APP_URL="http://localhost:3000"
LOG_FILE="/var/www/u3284463/logs/monitor.log"

# Проверка приложения
if curl -f -s "$APP_URL" > /dev/null; then
    echo "$(date): ✅ Приложение работает" >> "$LOG_FILE"
else
    echo "$(date): ❌ Приложение недоступно" >> "$LOG_FILE"
    # Перезапуск приложения
    pm2 restart normaldance
fi

# Проверка использования ресурсов
echo "$(date): 📊 Использование ресурсов:" >> "$LOG_FILE"
echo "Диск: $(df -h / | awk 'NR==2 {print $5}')" >> "$LOG_FILE"
echo "Память: $(free -h | awk 'NR==2 {print $3 "/" $2}')" >> "$LOG_FILE"
echo "CPU: $(uptime | awk -F'load average:' '{print $2}')" >> "$LOG_FILE"

# Проверка логов приложения
if [ $(wc -l < /var/www/u3284463/data/www/normaldance.ru/logs/combined.log) -gt 1000 ]; then
    echo "$(date): 📝 Ротация логов" >> "$LOG_FILE"
    # Ротация логов если файл слишком большой
    mv /var/www/u3284463/data/www/normaldance.ru/logs/combined.log \
       /var/www/u3284463/data/www/normaldance.ru/logs/combined.log.$(date +%Y%m%d%H%M%S)
    pm2 reloadLogs
fi
EOF

    scp ../temp/monitor.sh ${SSH_USER}@${SERVER_IP}:/var/www/${SSH_USER}/
    ${SSH_CMD} "chmod +x /var/www/${SSH_USER}/monitor.sh"

    # Настройка cron для мониторинга
    ${SSH_CMD} "crontab -l | grep -v 'monitor.sh' | crontab -"
    ${SSH_CMD} "(crontab -l 2>/dev/null; echo '* * * * * /var/www/${SSH_USER}/monitor.sh') | crontab -"

    success "Мониторинг настроен"
}

# Настройка резервного копирования
setup_backup() {
    log "💾 Настройка резервного копирования..."

    # Создание скрипта резервного копирования
    cat > ../temp/backup.sh << 'EOF'
#!/bin/bash
# Автоматическое резервное копирование NORMAL DANCE

BACKUP_DIR="/var/www/u3284463/backups"
LOG_FILE="/var/www/u3284463/logs/backup.log"

echo "$(date): 🔄 Создание резервной копии..." >> "$LOG_FILE"

# Бэкап базы данных
mysqldump -h localhost -u u3284463_default -p'DB_PASSWORD' u3284463_default > "$BACKUP_DIR/db-$(date +%Y%m%d-%H%M%S).sql"

# Бэкап файлов приложения
cd /var/www/u3284463/data/www/normaldance.ru
tar -czf "$BACKUP_DIR/app-$(date +%Y%m%d-%H%M%S).tar.gz" . --exclude=./node_modules --exclude=./.next/cache --exclude=./logs

# Удаление старых бэкапов (старше 7 дней)
find "$BACKUP_DIR" -name "*.sql" -type f -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +7 -delete

echo "$(date): ✅ Резервная копия создана" >> "$LOG_FILE"
EOF

    # Вставка реального пароля базы данных
    sed -i "s/DB_PASSWORD/${DB_PASSWORD}/g" ../temp/backup.sh

    scp ../temp/backup.sh ${SSH_USER}@${SERVER_IP}:/var/www/${SSH_USER}/
    ${SSH_CMD} "chmod +x /var/www/${SSH_USER}/backup.sh"

    # Настройка ежедневного резервного копирования
    ${SSH_CMD} "crontab -l | grep -v 'backup.sh' | crontab -"
    ${SSH_CMD} "(crontab -l 2>/dev/null; echo '0 2 * * * /var/www/${SSH_USER}/backup.sh') | crontab -"

    success "Резервное копирование настроено"
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

    # Проверка порта
    if ${SSH_CMD} "netstat -tlnp | grep :3000" 2>/dev/null; then
        success "Порт 3000 прослушивается"
    else
        warning "Порт 3000 не прослушивается"
    fi

    # Проверка Nginx
    if ${SSH_CMD} "sudo systemctl is-active nginx" 2>/dev/null; then
        success "Nginx работает"
    else
        warning "Nginx не работает"
    fi

    # Проверка домена
    if curl -f -s -I "http://normaldance.ru" | head -1 | grep -q "200\|301\|302"; then
        success "Домен normaldance.ru доступен"
    else
        warning "Домен normaldance.ru недоступен"
    fi

    log "🎉 Развертывание завершено!"
    echo ""
    echo "📋 Доступ к приложению:"
    echo "• http://normaldance.ru (перенаправление на HTTPS)"
    echo "• http://31.31.196.214:3000 (прямой доступ)"
    echo ""
    echo "🔧 Управление:"
    echo "• PM2: pm2 status/logs/restart normaldance"
    echo "• Nginx: sudo systemctl reload nginx"
    echo "• Мониторинг: tail -f /var/www/${SSH_USER}/logs/monitor.log"
    echo ""
    echo "📊 Ресурсы сервера:"
    echo "• Диск: df -h"
    echo "• Память: free -h"
    echo "• Процессы: htop"
}

# Основная функция
main() {
    log "🚀 НАЧАЛО ПРОДАКШН РАЗВЕРТЫВАНИЯ NORMAL DANCE"
    echo ""
    warning "Убедитесь что пароли указаны правильно в начале скрипта!"
    read -p "Продолжить? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Развертывание отменено пользователем"
    fi

    prepare_local
    check_server_access
    create_backup
    update_server
    setup_database
    deploy_application
    setup_nginx
    setup_ssl
    start_application
    setup_monitoring
    setup_backup
    final_check

    log "🎉 ПРОДАКШН РАЗВЕРТЫВАНИЕ УСПЕШНО ЗАВЕРШЕНО!"
    echo ""
    echo "📖 Следующие шаги:"
    echo "1. Настройте DNS записи для доменов normaldance.ru и normaldance.online"
    echo "2. Протестируйте приложение по адресу https://normaldance.ru"
    echo "3. Настройте мониторинг в панели Ispmanager"
    echo "4. Проверьте резервное копирование"
    echo "5. Настройте уведомления об ошибках"
}

# Запуск
main "$@"