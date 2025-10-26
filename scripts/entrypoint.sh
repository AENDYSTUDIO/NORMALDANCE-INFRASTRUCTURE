#!/bin/bash

# 🚀 NORMAL DANCE - Entrypoint скрипт для Docker контейнера

set -euo pipefail

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $*${NC}"
}

success() {
    echo -e "${GREEN}✅ $*${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $*${NC}"
}

# Проверка переменных окружения
check_environment() {
    log "🔍 Проверка переменных окружения..."

    local required_vars=("DATABASE_URL" "JWT_SECRET")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            warning "Переменная окружения ${var} не установлена"
        fi
    done

    success "Проверка окружения завершена"
}

# Миграции базы данных
run_migrations() {
    log "🗄️ Выполнение миграций базы данных..."

    # Ожидание доступности базы данных
    for i in {1..30}; do
        if npx prisma db ping; then
            break
        fi
        log "Ожидание базы данных... (${i}/30)"
        sleep 2
    done

    # Генерация клиента Prisma
    npx prisma generate

    # Применение миграций
    npx prisma db push

    success "Миграции выполнены"
}

# Создание директорий для логов и временных файлов
setup_directories() {
    log "📁 Создание директорий..."

    mkdir -p /app/logs
    mkdir -p /app/tmp
    mkdir -p /tmp/normaldance

    # Настройка прав доступа
    chmod 755 /app/logs
    chmod 755 /app/tmp
    chmod 1777 /tmp/normaldance

    success "Директории созданы"
}

# Настройка Nginx в контейнере
setup_nginx() {
    log "🌐 Настройка Nginx в контейнере..."

    # Создание символических ссылок
    ln -sf /etc/nginx/sites-available/normaldance.ru /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    # Тестирование конфигурации
    if nginx -t; then
        success "Конфигурация Nginx корректна"
    else
        error "Ошибка в конфигурации Nginx"
    fi

    success "Nginx настроен"
}

# Запуск сервисов
start_services() {
    log "▶️ Запуск сервисов..."

    # Запуск Nginx
    nginx &

    # Небольшая пауза для запуска Nginx
    sleep 2

    # Проверка что Nginx запустился
    if ! pgrep nginx > /dev/null; then
        error "Не удалось запустить Nginx"
    fi

    success "Сервисы запущены"
}

# Основная функция
main() {
    log "🚀 Запуск NORMAL DANCE в Docker контейнере"

    check_environment
    setup_directories

    # Проверка режима запуска
    if [[ "${1:-}" == "nginx" ]]; then
        log "Запуск только Nginx сервера"
        setup_nginx
        nginx -g "daemon off;"
    elif [[ "${1:-}" == "app" ]]; then
        log "Запуск только приложения"
        run_migrations

        # Запуск приложения с передачей всех аргументов
        exec "$@"
    else
        log "Запуск полного стека (Nginx + App)"

        run_migrations
        setup_nginx
        start_services

        # Запуск приложения
        log "Запуск приложения..."
        exec "$@"
    fi
}

# Обработка сигналов
cleanup() {
    log "🛑 Получен сигнал завершения, останавливаю сервисы..."

    # Остановка Nginx
    if pgrep nginx > /dev/null; then
        nginx -s quit
    fi

    # Остановка Node.js приложения
    if pgrep -f "node.*server.js\|npm.*start" > /dev/null; then
        pkill -f "node.*server.js\|npm.*start"
    fi

    log "✅ Сервисы остановлены"
    exit 0
}

# Установка обработчиков сигналов
trap cleanup SIGTERM SIGINT SIGQUIT

# Запуск
main "$@"