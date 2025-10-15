#!/bin/bash

#####################################################
# NORMALDANCE SERVER SETUP SCRIPT
# Автоматическая настройка Debian 12 сервера
#####################################################

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "\n${BLUE}▶ $1${NC}"; }

# Переменные из окружения
ARCHIVE_NAME=${ARCHIVE_NAME:-"normaldance.tar.gz"}
DOMAIN_PRIMARY=${DOMAIN_PRIMARY:-"normaldance.ru"}
DOMAIN_SECONDARY=${DOMAIN_SECONDARY:-"normaldance.online"}
SSL_EMAIL=${SSL_EMAIL:-"admin@normaldance.ru"}
APP_NAME=${APP_NAME:-"normaldance"}
REMOTE_DIR=${REMOTE_DIR:-"/var/www/normaldance"}
DB_NAME="normaldance"
DB_USER="normaldance"
DB_PASSWORD=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 64)

log_step "Обновление системы..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

log_step "Установка базовых пакетов..."
apt-get install -y -qq curl wget git build-essential nginx ufw certbot python3-certbot-nginx

log_step "Установка Node.js 20..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y -qq nodejs
fi
log_info "✓ Node.js $(node -v)"
log_info "✓ npm $(npm -v)"

log_step "Установка PM2..."
npm install -g pm2 > /dev/null 2>&1
log_info "✓ PM2 $(pm2 -v)"

log_step "Установка PostgreSQL..."
apt-get install -y -qq postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

log_step "Настройка базы данных PostgreSQL..."
sudo -u postgres psql << EOF > /dev/null 2>&1
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF
log_info "✓ PostgreSQL настроен (БД: $DB_NAME)"

log_step "Создание директории проекта..."
mkdir -p $REMOTE_DIR
cd $REMOTE_DIR

log_step "Распаковка проекта..."
tar -xzf /tmp/$ARCHIVE_NAME -C $REMOTE_DIR
rm -f /tmp/$ARCHIVE_NAME

log_step "Создание .env.production..."
cat > $REMOTE_DIR/.env.production << EOF
NODE_ENV=production
PORT=3000

# Next.js
NEXTAUTH_URL=https://$DOMAIN_PRIMARY
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# Solana
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_HOST=https://api.mainnet-beta.solana.com

# IPFS Pinata (ТРЕБУЕТСЯ НАСТРОЙКА!)
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_API_KEY=your_pinata_secret_key_here
PINATA_JWT=your_pinata_jwt_here

# Redis (опционально)
REDIS_URL=redis://localhost:6379

# Sentry (опционально)
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
EOF
log_info "✓ .env.production создан"

log_step "Установка зависимостей..."
npm ci --production --quiet > /dev/null 2>&1
log_info "✓ Зависимости установлены"

log_step "Prisma миграции..."
npx prisma generate > /dev/null 2>&1
npx prisma migrate deploy > /dev/null 2>&1 || log_warn "Prisma миграции пропущены (возможно, схема еще не готова)"

log_step "Сборка проекта..."
npm run build > /tmp/build.log 2>&1 || {
    log_error "Ошибка сборки! Смотрите /tmp/build.log"
    tail -20 /tmp/build.log
    exit 1
}
log_info "✓ Проект собран"

log_step "Настройка PM2..."
cp /tmp/deploy-config/ecosystem.config.js $REMOTE_DIR/
pm2 delete $APP_NAME > /dev/null 2>&1 || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u root --hp /root > /tmp/pm2-startup.sh 2>&1
bash /tmp/pm2-startup.sh > /dev/null 2>&1
log_info "✓ PM2 настроен и запущен"

log_step "Настройка Nginx..."
cp /tmp/deploy-config/nginx.conf /etc/nginx/sites-available/$APP_NAME
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/

# Временный конфиг без SSL для получения сертификатов
cat > /etc/nginx/sites-available/$APP_NAME << 'NGINXCONF'
server {
    listen 80;
    listen [::]:80;
    server_name normaldance.ru normaldance.online www.normaldance.ru www.normaldance.online;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXCONF

nginx -t > /dev/null 2>&1 || {
    log_error "Ошибка конфигурации Nginx"
    nginx -t
    exit 1
}
systemctl restart nginx
systemctl enable nginx
log_info "✓ Nginx настроен и запущен"

log_step "Получение SSL сертификатов..."
certbot --nginx -d $DOMAIN_PRIMARY -d www.$DOMAIN_PRIMARY \
    --non-interactive --agree-tos --email $SSL_EMAIL --redirect \
    > /dev/null 2>&1 && log_info "✓ SSL для $DOMAIN_PRIMARY" || log_warn "! SSL для $DOMAIN_PRIMARY пропущен (проверьте DNS)"

certbot --nginx -d $DOMAIN_SECONDARY -d www.$DOMAIN_SECONDARY \
    --non-interactive --agree-tos --email $SSL_EMAIL --redirect \
    > /dev/null 2>&1 && log_info "✓ SSL для $DOMAIN_SECONDARY" || log_warn "! SSL для $DOMAIN_SECONDARY пропущен (проверьте DNS)"

systemctl enable certbot.timer
systemctl start certbot.timer

log_step "Настройка Firewall..."
ufw --force enable > /dev/null 2>&1
ufw allow ssh > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
log_info "✓ Firewall настроен"

log_step "Настройка автобэкапов..."
mkdir -p /backups/$APP_NAME
cp /tmp/deploy-config/backup.sh /root/backup-$APP_NAME.sh
chmod +x /root/backup-$APP_NAME.sh

# Добавление в crontab
(crontab -l 2>/dev/null | grep -v "backup-$APP_NAME"; echo "0 3 * * * /root/backup-$APP_NAME.sh >> /var/log/backup.log 2>&1") | crontab -
log_info "✓ Автобэкапы настроены (ежедневно в 3:00)"

log_step "Настройка логирования..."
pm2 install pm2-logrotate > /dev/null 2>&1
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 10
mkdir -p /var/log/$APP_NAME
log_info "✓ Логирование настроено"

log_step "Финальная проверка..."
sleep 3
if pm2 status | grep -q "$APP_NAME.*online"; then
    log_info "✓ Приложение запущено"
else
    log_error "✗ Приложение не запущено!"
    pm2 logs $APP_NAME --lines 20
    exit 1
fi

if systemctl is-active --quiet nginx; then
    log_info "✓ Nginx работает"
else
    log_error "✗ Nginx не работает!"
    exit 1
fi

if curl -s http://localhost:3000 > /dev/null; then
    log_info "✓ Приложение отвечает на запросы"
else
    log_warn "! Приложение не отвечает на localhost:3000"
fi

echo ""
log_info "═══════════════════════════════════════════"
log_info "  УСТАНОВКА ЗАВЕРШЕНА УСПЕШНО! 🎉"
log_info "═══════════════════════════════════════════"
echo ""
log_info "База данных:"
log_info "  • Имя: $DB_NAME"
log_info "  • Пользователь: $DB_USER"
log_info "  • Пароль: $DB_PASSWORD"
echo ""
log_info "Сохраните эти данные в безопасном месте!"
echo ""
