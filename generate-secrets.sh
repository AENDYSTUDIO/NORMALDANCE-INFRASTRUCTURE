#!/bin/bash

# ==============================================
# 🔐 NORMAL DANCE SECRET GENERATOR
# ==============================================
# Генерация безопасных секретов для продакшена

set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Проверка наличия openssl
if ! command -v openssl &> /dev/null; then
    echo "Ошибка: openssl не установлен"
    exit 1
fi

# Создание файла секретов если он не существует
SECRETS_FILE=".env.secrets"
if [ ! -f "$SECRETS_FILE" ]; then
    touch "$SECRETS_FILE"
    log_info "Создан файл секретов: $SECRETS_FILE"
else
    log_warning "Файл секретов уже существует. Создаю резервную копию..."
    cp "$SECRETS_FILE" "$SECRETS_FILE.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Функция генерации секрета
generate_secret() {
    local name=$1
    local length=${2:-32}
    local secret=$(openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length)

    echo "$name=$secret" >> "$SECRETS_FILE"

    # Также вывести в консоль для копирования
    printf "%-25s = %s\n" "$name" "$secret"
}

log_info "Генерация безопасных секретов..."

echo
echo "=========================================="
echo "🔐 СГЕНЕРИРОВАННЫЕ СЕКРЕТЫ"
echo "=========================================="
echo

# Генерация NextAuth секрет (32 байта)
generate_secret "NEXTAUTH_SECRET" 32

# Генерация JWT секрет (32 байта)
generate_secret "JWT_SECRET" 32

# Генерация Database пароль (16 символов)
generate_secret "DB_PASSWORD" 16

# Генерация Redis пароль (16 символов)
generate_secret "REDIS_PASSWORD" 16

# Генерация API ключ для внешних сервисов (24 символа)
generate_secret "API_SECRET_KEY" 24

echo
echo "=========================================="
echo

# Генерация UUID для уникальных идентификаторов
APP_ID=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen 2>/dev/null || openssl rand -hex 16)
echo "APP_ID=$APP_ID" >> "$SECRETS_FILE"
printf "%-25s = %s\n" "APP_ID" "$APP_ID"

echo
log_success "Секреты сгенерированы и сохранены в $SECRETS_FILE"

# Создание файла .env.production с новыми секретами
create_production_env() {
    if [ -f ".env" ]; then
        log_info "Создание production файла окружения..."
        cp ".env" ".env.production"

        # Замена плейсхолдеров на реальные секреты
        while IFS='=' read -r key value; do
            if [ ! -z "$key" ] && [ ! -z "$value" ]; then
                # Пропустить комментарии и пустые строки
                [[ $key =~ ^#.*$ ]] && continue
                [[ -z "$key" ]] && continue

                # Найти соответствующий секрет в файле секретов
                secret_value=$(grep "^${key}=" "$SECRETS_FILE" | cut -d'=' -f2-)

                if [ ! -z "$secret_value" ]; then
                    sed -i.bak "s|^${key}=.*|${key}=${secret_value}|" ".env.production"
                fi
            fi
        done < "$SECRETS_FILE"

        log_success "Создан файл .env.production с новыми секретами"
    else
        log_warning "Файл .env не найден, пропускаю создание production файла"
    fi
}

# Запрос на создание production файла
read -p "Создать .env.production с новыми секретами? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    create_production_env
fi

# Инструкции по использованию
echo
echo "=========================================="
echo "📋 ИНСТРУКЦИИ ПО ИСПОЛЬЗОВАНИЮ"
echo "=========================================="
echo
log_info "1. Скопируйте сгенерированные секреты в Vercel Dashboard"
log_info "2. Никогда не коммитьте файлы секретов в Git"
log_info "3. Храните секреты в безопасном месте"
log_info "4. Регулярно обновляйте секреты (каждые 90 дней)"
echo
log_warning "ВАЖНО: Замените все значения 'your-*' и 'GENERATE_NEW_SECRET_HERE' на реальные значения!"

# Проверка наличия плейсхолдеров в .env
if [ -f ".env" ]; then
    PLACEHOLDERS=$(grep -c "your-\|GENERATE_NEW_SECRET_HERE" .env || true)
    if [ "$PLACEHOLDERS" -gt 0 ]; then
        log_warning "Найдено $PLACEHOLDERS плейсхолдеров в .env файле"
        log_info "Выполните: ./generate-secrets.sh для замены всех секретов"
    fi
fi

echo
log_success "Генерация секретов завершена!"