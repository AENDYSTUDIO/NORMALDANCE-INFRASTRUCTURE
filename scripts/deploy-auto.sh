#!/bin/bash

#####################################################
# NORMALDANCE АВТОМАТИЧЕСКИЙ ДЕПЛОЙ
# Автор: NORMALDANCE Team
# Версия: 1.0.0
#####################################################

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация
SERVER_IP="89.104.67.165"
SERVER_USER="root"
SERVER_PASSWORD="Ll6DLuwyKalfvGbF"
DOMAIN_PRIMARY="normaldance.ru"
DOMAIN_SECONDARY="normaldance.online"
SSL_EMAIL="admin@normaldance.ru"
APP_NAME="normaldance"
REMOTE_DIR="/var/www/normaldance"

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ███╗   ██╗ ██████╗ ██████╗ ███╗   ███╗ █████╗ ██╗     ║
║   ████╗  ██║██╔═══██╗██╔══██╗████╗ ████║██╔══██╗██║     ║
║   ██╔██╗ ██║██║   ██║██████╔╝██╔████╔██║███████║██║     ║
║   ██║╚██╗██║██║   ██║██╔══██╗██║╚██╔╝██║██╔══██║██║     ║
║   ██║ ╚████║╚██████╔╝██║  ██║██║ ╚═╝ ██║██║  ██║███████╗║
║   ╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝║
║                                                           ║
║              АВТОМАТИЧЕСКИЙ ДЕПЛОЙ v1.0                  ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Функция логирования
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

# Проверка sshpass
if ! command -v sshpass &> /dev/null; then
    log_warn "sshpass не установлен. Пытаюсь установить..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y sshpass
    else
        log_error "Установите sshpass вручную: https://sourceforge.net/projects/sshpass/"
        exit 1
    fi
fi

log_step "Проверка подключения к серверу..."
if sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP "echo 'Подключение успешно'" > /dev/null 2>&1; then
    log_info "✓ Подключение к $SERVER_IP установлено"
else
    log_error "✗ Не удалось подключиться к серверу $SERVER_IP"
    exit 1
fi

log_step "Упаковка проекта..."
ARCHIVE_NAME="normaldance-$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "/tmp/$ARCHIVE_NAME" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='_archive-docs' \
    --exclude='coverage' \
    --exclude='test-results' \
    --exclude='.vercel' \
    --exclude='*.log' \
    --exclude='.env.local' \
    --exclude='.env.secrets' \
    -C "$(pwd)" .

log_info "✓ Проект упакован: /tmp/$ARCHIVE_NAME ($(du -h /tmp/$ARCHIVE_NAME | cut -f1))"

log_step "Загрузка проекта на сервер..."
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no "/tmp/$ARCHIVE_NAME" $SERVER_USER@$SERVER_IP:/tmp/

log_step "Загрузка скриптов настройки..."
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no \
    "$(pwd)/scripts/server-setup.sh" \
    $SERVER_USER@$SERVER_IP:/tmp/

sshpass -p "$SERVER_PASSWORD" scp -r -o StrictHostKeyChecking=no \
    "$(pwd)/scripts/deploy-config" \
    $SERVER_USER@$SERVER_IP:/tmp/

log_step "Запуск настройки сервера (это займёт 10-15 минут)..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << ENDSSH
export ARCHIVE_NAME="$ARCHIVE_NAME"
export DOMAIN_PRIMARY="$DOMAIN_PRIMARY"
export DOMAIN_SECONDARY="$DOMAIN_SECONDARY"
export SSL_EMAIL="$SSL_EMAIL"
export APP_NAME="$APP_NAME"
export REMOTE_DIR="$REMOTE_DIR"

chmod +x /tmp/server-setup.sh
bash /tmp/server-setup.sh
ENDSSH

if [ $? -eq 0 ]; then
    log_info "✓ Настройка сервера завершена успешно!"
else
    log_error "✗ Ошибка при настройке сервера"
    exit 1
fi

log_step "Проверка работоспособности..."
sleep 5

# Проверка HTTP
if curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP" | grep -q "200\|301\|302"; then
    log_info "✓ HTTP сервер отвечает"
else
    log_warn "! HTTP сервер не отвечает (возможно, SSL еще настраивается)"
fi

# Проверка HTTPS (может не работать сразу если DNS не обновился)
if curl -s -k -o /dev/null -w "%{http_code}" "https://$DOMAIN_PRIMARY" | grep -q "200"; then
    log_info "✓ HTTPS работает"
else
    log_warn "! HTTPS не работает (DNS может еще обновляться)"
fi

# Очистка
rm -f "/tmp/$ARCHIVE_NAME"

echo -e "\n${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                  ДЕПЛОЙ ЗАВЕРШЁН! 🚀                      ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}Ваш сайт доступен по адресам:${NC}"
echo -e "  • HTTP:  http://$SERVER_IP"
echo -e "  • HTTPS: https://$DOMAIN_PRIMARY"
echo -e "  • HTTPS: https://$DOMAIN_SECONDARY"
echo ""
echo -e "${BLUE}Полезные команды:${NC}"
echo -e "  • Логи приложения:    ${GREEN}ssh root@$SERVER_IP 'pm2 logs $APP_NAME'${NC}"
echo -e "  • Статус:             ${GREEN}ssh root@$SERVER_IP 'pm2 status'${NC}"
echo -e "  • Рестарт:            ${GREEN}ssh root@$SERVER_IP 'pm2 restart $APP_NAME'${NC}"
echo -e "  • Логи Nginx:         ${GREEN}ssh root@$SERVER_IP 'tail -f /var/log/nginx/normaldance-error.log'${NC}"
echo ""
echo -e "${YELLOW}⚠ ВАЖНО:${NC}"
echo -e "  1. Обновите DNS A-записи для $DOMAIN_PRIMARY и $DOMAIN_SECONDARY на $SERVER_IP"
echo -e "  2. Настройте переменные окружения в $REMOTE_DIR/.env.production"
echo -e "  3. Получите API ключи для Pinata (IPFS): https://pinata.cloud"
echo -e "  4. Настройте Sentry для мониторинга: https://sentry.io"
echo ""
echo -e "${GREEN}Готово! 🎉${NC}"
