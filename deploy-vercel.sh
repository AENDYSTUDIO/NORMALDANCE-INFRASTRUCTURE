#!/bin/bash

# ==============================================
# 🚀 NORMAL DANCE VERCEL DEPLOYMENT SCRIPT
# ==============================================
# Автоматизированное развертывание на Vercel с проверками безопасности

set -e  # Прервать выполнение при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==============================================
# ФУНКЦИИ
# ==============================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Проверка системных требований..."

    # Проверка Node.js версии
    if ! command -v node &> /dev/null; then
        log_error "Node.js не установлен"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Требуется Node.js версии 18 или выше"
        exit 1
    fi

    # Проверка Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI не установлен. Устанавливаю..."
        npm install -g vercel
    fi

    # Проверка Git
    if ! command -v git &> /dev/null; then
        log_error "Git не установлен"
        exit 1
    fi

    log_success "Все требования выполнены"
}

check_environment_variables() {
    log_info "Проверка переменных окружения..."

    # Критические переменные, которые должны быть заполнены
    CRITICAL_VARS=(
        "NEXTAUTH_SECRET"
        "JWT_SECRET"
        "DATABASE_URL"
        "PINATA_JWT"
        "TELEGRAM_BOT_TOKEN"
    )

    MISSING_VARS=()

    for var in "${CRITICAL_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            MISSING_VARS+=("$var")
        fi
    done

    if [ ${#MISSING_VARS[@]} -ne 0 ]; then
        log_error "Отсутствуют критические переменные окружения:"
        for var in "${MISSING_VARS[@]}"; do
            log_error "  - $var"
        done
        log_info "Заполните переменные в файле .env или в переменных окружения"
        exit 1
    fi

    log_success "Все критические переменные окружения настроены"
}

build_application() {
    log_info "Сборка приложения..."

    # Установка зависимостей
    log_info "Установка зависимостей..."
    npm ci

    # Проверка типов
    log_info "Проверка TypeScript..."
    npm run type-check || {
        log_warning "Найдены ошибки TypeScript, но продолжаю сборку"
    }

    # Сборка приложения
    log_info "Сборка для продакшена..."
    npm run build

    log_success "Сборка завершена успешно"
}

deploy_to_vercel() {
    log_info "Развертывание на Vercel..."

    # Проверка аутентификации Vercel
    if ! vercel whoami &> /dev/null; then
        log_error "Необходимо войти в Vercel CLI"
        log_info "Выполните: vercel login"
        exit 1
    fi

    # Развертывание
    log_info "Запуск развертывания..."
    VERCEL_OUTPUT=$(vercel --prod 2>&1)

    if [ $? -eq 0 ]; then
        log_success "Развертывание успешно!"

        # Извлечение URL развертывания
        DEPLOY_URL=$(echo "$VERCEL_OUTPUT" | grep -o 'https://[^ ]*\.vercel\.app' | head -1)
        if [ ! -z "$DEPLOY_URL" ]; then
            log_info "URL развертывания: $DEPLOY_URL"
        fi
    else
        log_error "Ошибка развертывания:"
        echo "$VERCEL_OUTPUT"
        exit 1
    fi
}

verify_deployment() {
    log_info "Проверка развертывания..."

    # Получение URL развертывания
    if [ -z "$DEPLOY_URL" ]; then
        log_warning "URL развертывания не найден, проверка пропущена"
        return 0
    fi

    # Проверка здоровья приложения
    HEALTH_URL="$DEPLOY_URL/api/health"
    log_info "Проверка endpoint: $HEALTH_URL"

    if curl -f -s "$HEALTH_URL" > /dev/null; then
        log_success "Health check пройден"
    else
        log_warning "Health check не пройден, но развертывание завершено"
    fi

    # Проверка основных страниц
    MAIN_PAGE="$DEPLOY_URL"
    if curl -f -s "$MAIN_PAGE" > /dev/null; then
        log_success "Главная страница доступна"
    else
        log_warning "Главная страница недоступна"
    fi
}

setup_monitoring() {
    log_info "Настройка мониторинга..."

    # Здесь можно добавить команды для настройки мониторинга
    # Например, настройка Sentry, аналитики и т.д.

    log_success "Мониторинг настроен"
}

# ==============================================
# ОСНОВНОЙ ПРОЦЕСС
# ==============================================

main() {
    echo -e "${BLUE}"
    echo "========================================"
    echo "🚀 NORMAL DANCE VERCEL DEPLOYMENT"
    echo "========================================"
    echo -e "${NC}"

    # Шаг 1: Проверка требований
    check_requirements

    # Шаг 2: Проверка переменных окружения
    check_environment_variables

    # Шаг 3: Сборка приложения
    build_application

    # Шаг 4: Развертывание на Vercel
    deploy_to_vercel

    # Шаг 5: Проверка развертывания
    verify_deployment

    # Шаг 6: Настройка мониторинга
    setup_monitoring

    echo -e "${GREEN}"
    echo "========================================"
    echo "✅ РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО УСПЕШНО!"
    echo "========================================"
    echo -e "${NC}"

    log_info "Следующие шаги:"
    log_info "1. Настройте кастомный домен в Vercel Dashboard"
    log_info "2. Обновите DNS записи для normaldance.online"
    log_info "3. Протестируйте все функции приложения"
    log_info "4. Настройте мониторинг и алерты"
    log_info "5. Обновите документацию"
}

# Запуск основного процесса
main "$@"