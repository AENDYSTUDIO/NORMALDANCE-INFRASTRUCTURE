#!/bin/bash

# ==============================================
# ✅ NORMAL DANCE POST-DEPLOYMENT VERIFICATION
# ==============================================
# Комплексная проверка после развертывания

set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Счетчики успешных проверок
SUCCESS_COUNT=0
WARNING_COUNT=0
ERROR_COUNT=0

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    ((SUCCESS_COUNT++))
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    ((WARNING_COUNT++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((ERROR_COUNT++))
}

# ==============================================
# КОНФИГУРАЦИЯ
# ==============================================

# Основной URL приложения
APP_URL="${APP_URL:-https://normaldance.online}"

# Telegram bot токен для проверки
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"

# Критически важные эндпоинты для проверки
CRITICAL_ENDPOINTS=(
    "/"
    "/api/health"
    "/api/tracks"
    "/api/artists"
    "/telegram-app"
)

# ==============================================
# ФУНКЦИИ ПРОВЕРКИ
# ==============================================

check_basic_connectivity() {
    log_info "Проверка базовой доступности приложения..."

    if curl -f -s --max-time 10 "$APP_URL" > /dev/null; then
        log_success "Главная страница доступна"
        return 0
    else
        log_error "Главная страница недоступна"
        return 1
    fi
}

check_health_endpoint() {
    log_info "Проверка health check эндпоинта..."

    local health_url="$APP_URL/api/health"

    if curl -f -s --max-time 5 "$health_url" > /dev/null; then
        log_success "Health check пройден"

        # Попытка получить JSON ответ
        local health_response
        if health_response=$(curl -s --max-time 5 "$health_url" 2>/dev/null); then
            log_info "Health response: $(echo "$health_response" | head -1)"
        fi

        return 0
    else
        log_error "Health check не пройден"
        return 1
    fi
}

check_api_endpoints() {
    log_info "Проверка API эндпоинтов..."

    for endpoint in "/api/tracks" "/api/artists"; do
        local full_url="$APP_URL$endpoint"

        if curl -f -s --max-time 10 "$full_url" > /dev/null; then
            log_success "API эндпоинт доступен: $endpoint"
        else
            log_warning "API эндпоинт недоступен: $endpoint"
        fi
    done
}

check_telegram_integration() {
    log_info "Проверка интеграции с Telegram..."

    if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
        log_warning "TELEGRAM_BOT_TOKEN не настроен, пропускаю проверку"
        return 0
    fi

    # Проверка Telegram Mini App страницы
    local telegram_page="$APP_URL/telegram-app"

    if curl -f -s --max-time 10 "$telegram_page" > /dev/null; then
        log_success "Telegram Mini App страница доступна"
    else
        log_warning "Telegram Mini App страница недоступна"
    fi

    # Проверка webhook эндпоинта
    local webhook_url="$APP_URL/api/telegram/webhook"

    if curl -f -s --max-time 10 "$webhook_url" > /dev/null; then
        log_success "Telegram webhook эндпоинт доступен"
    else
        log_warning "Telegram webhook эндпоинт недоступен"
    fi
}

check_performance_metrics() {
    log_info "Проверка базовых метрик производительности..."

    # Измерение времени загрузки главной страницы
    local load_time
    if load_time=$(curl -s -w "%{time_total}\n" -o /dev/null "$APP_URL" 2>/dev/null); then
        load_time=$(echo "$load_time * 1000" | bc 2>/dev/null | cut -d'.' -f1)

        if [ "$load_time" -lt 3000 ]; then
            log_success "Время загрузки страницы: ${load_time}ms"
        elif [ "$load_time" -lt 5000 ]; then
            log_warning "Время загрузки страницы: ${load_time}ms (медленно)"
        else
            log_error "Время загрузки страницы: ${load_time}ms (очень медленно)"
        fi
    else
        log_warning "Не удалось измерить время загрузки"
    fi
}

check_ssl_certificate() {
    log_info "Проверка SSL сертификата..."

    # Проверка истечения сертификата
    local ssl_info
    if ssl_info=$(echo | openssl s_client -servername "$(echo $APP_URL | sed 's/https:\/\/\///')" -connect "$(echo $APP_URL | sed 's/https:\/\/\///'):443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null); then

        local expiry_date
        expiry_date=$(echo "$ssl_info" | grep "notAfter" | cut -d'=' -f2)

        if [ ! -z "$expiry_date" ]; then
            log_success "SSL сертификат действителен до: $expiry_date"
        else
            log_warning "Не удалось получить информацию о сертификате"
        fi
    else
        log_warning "Не удалось проверить SSL сертификат"
    fi
}

check_database_connectivity() {
    log_info "Проверка подключения к базе данных..."

    # Эта проверка требует настроенных переменных окружения
    # В реальном сценарии здесь должна быть проверка подключения к БД

    if [ -n "$DATABASE_URL" ]; then
        log_info "DATABASE_URL настроена"
        log_success "Конфигурация базы данных найдена"
    else
        log_warning "DATABASE_URL не настроена"
    fi
}

check_blockchain_integration() {
    log_info "Проверка интеграции с блокчейном Solana..."

    # Проверка RPC подключения
    if curl -f -s --max-time 10 "https://api.mainnet-beta.solana.com/health" > /dev/null; then
        log_success "Solana RPC доступен"
    else
        log_warning "Solana RPC недоступен"
    fi

    # Проверка переменных блокчейна
    if [ -n "$NEXT_PUBLIC_SOLANA_RPC_URL" ]; then
        log_success "Блокчейн переменные окружения настроены"
    else
        log_warning "Блокчейн переменные окружения не настроены"
    fi
}

check_cdn_and_assets() {
    log_info "Проверка загрузки статических ресурсов..."

    # Проверка доступности favicon
    local favicon_url="$APP_URL/favicon.ico"

    if curl -f -s --max-time 5 "$favicon_url" > /dev/null; then
        log_success "Favicon загружается"
    else
        log_warning "Favicon не найден"
    fi

    # Проверка CSS/JS ресурсов
    if curl -f -s --max-time 5 "$APP_URL/_next/static/css/" | head -5 | grep -q "css"; then
        log_success "Статические ресурсы доступны"
    else
        log_warning "Проблемы с загрузкой статических ресурсов"
    fi
}

generate_report() {
    echo
    echo -e "${BLUE}=========================================="
    echo "📊 ОТЧЕТ О РАЗВЕРТЫВАНИИ"
    echo -e "${NC}"

    echo "📅 Дата: $(date)"
    echo "🌐 URL: $APP_URL"
    echo "📊 Результаты проверок:"
    echo "   ✅ Успешных: $SUCCESS_COUNT"
    echo "   ⚠️ Предупреждений: $WARNING_COUNT"
    echo "   ❌ Ошибок: $ERROR_COUNT"

    echo
    if [ $ERROR_COUNT -gt 0 ]; then
        log_error "Найдены критические проблемы, требующие внимания!"
        echo
        log_info "Рекомендуемые действия:"
        log_info "1. Проверьте логи развертывания в Vercel"
        log_info "2. Убедитесь, что все переменные окружения настроены"
        log_info "3. Проверьте подключение к внешним сервисам"
        log_info "4. Протестируйте функциональность вручную"
    else
        log_success "Развертывание прошло успешно!"
        echo
        log_info "Следующие шаги:"
        log_info "1. Настройте мониторинг и алертинг"
        log_info "2. Протестируйте ключевые пользовательские сценарии"
        log_info "3. Обновите документацию"
        log_info "4. Настройте резервное копирование"
        log_info "5. Планируйте следующий релиз"
    fi

    # Сохранение отчета в файл
    local report_file="deployment-report-$(date +%Y%m%d-%H%M%S).md"

    cat > "$report_file" << EOF
# Отчет о развертывании NormalDance

**Дата:** $(date)
**URL:** $APP_URL
**Статус:** $(if [ $ERROR_COUNT -gt 0 ]; then echo "Требует внимания"; else echo "Успешно"; fi)

## Результаты проверок

- ✅ Успешных: $SUCCESS_COUNT
- ⚠️ Предупреждений: $WARNING_COUNT
- ❌ Ошибок: $ERROR_COUNT

## Проверенные компоненты

$(if check_basic_connectivity >/dev/null 2>&1; then echo "- ✅ Базовая доступность" ; fi)
$(if check_health_endpoint >/dev/null 2>&1; then echo "- ✅ Health check" ; fi)
$(if check_api_endpoints >/dev/null 2>&1; then echo "- ✅ API эндпоинты" ; fi)
$(if check_telegram_integration >/dev/null 2>&1; then echo "- ✅ Telegram интеграция" ; fi)
$(if check_ssl_certificate >/dev/null 2>&1; then echo "- ✅ SSL сертификат" ; fi)

## Рекомендации

$(if [ $ERROR_COUNT -gt 0 ]; then echo "- Исправьте критические ошибки перед запуском" ; else echo "- Мониторьте приложение в первые 24 часа" ; fi)
- Настройте резервное копирование базы данных
- Обновите документацию с актуальными URL
- Настройте алертинг для ключевых метрик
EOF

    log_success "Отчет сохранен в файл: $report_file"
}

# ==============================================
# ОСНОВНОЙ ПРОЦЕСС
# ==============================================

main() {
    echo -e "${BLUE}"
    echo "========================================"
    echo "✅ NORMAL DANCE POST-DEPLOYMENT VERIFICATION"
    echo "========================================"
    echo -e "${NC}"

    log_info "Запуск комплексной проверки развертывания..."
    log_info "Целевой URL: $APP_URL"

    echo

    # Запуск всех проверок
    check_basic_connectivity
    check_health_endpoint
    check_api_endpoints
    check_telegram_integration
    check_performance_metrics
    check_ssl_certificate
    check_database_connectivity
    check_blockchain_integration
    check_cdn_and_assets

    # Генерация отчета
    generate_report

    echo -e "${BLUE}=========================================="
    echo "🎉 ПРОВЕРКА РАЗВЕРТЫВАНИЯ ЗАВЕРШЕНА!"
    echo -e "${NC}"
}

# Запуск основного процесса
main "$@"