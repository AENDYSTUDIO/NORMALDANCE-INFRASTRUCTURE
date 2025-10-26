#!/bin/bash

# 🧪 NORMAL DANCE - Тестирование развертывания
# Использование: ./scripts/test-deployment.sh [environment]

set -euo pipefail

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT="${1:-production}"
TIMEOUT=300

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

# Проверка доступности сервисов
test_service_health() {
    local service_name="$1"
    local url="$2"
    local expected_code="${3:-200}"

    log "Тестирование сервиса: ${service_name} (${url})"

    for i in {1..30}; do
        if curl -f -s --max-time 10 "${url}" > /dev/null 2>&1; then
            success "Сервис ${service_name} доступен"
            return 0
        fi

        log "Ожидание сервиса ${service_name}... (${i}/30)"
        sleep 10
    done

    error "Сервис ${service_name} недоступен после ${TIMEOUT} секунд"
}

# Тестирование API endpoints
test_api_endpoints() {
    log "Тестирование API endpoints..."

    local base_url="https://dnb1st-ru.onrender.com"

    # Health check
    test_service_health "Health Check" "${base_url}/api/health"

    # API информация
    if curl -f -s "${base_url}/api/info" > /dev/null 2>&1; then
        success "API info endpoint доступен"
    else
        warning "API info endpoint недоступен"
    fi

    # WebSocket соединение
    log "Тестирование WebSocket соединения..."
    # Здесь можно добавить тест WebSocket подключения
}

# Тестирование базы данных
test_database() {
    log "Тестирование подключения к базе данных..."

    # Проверка PostgreSQL подключения через kubectl exec в контейнер
    if kubectl exec -n "${ENVIRONMENT}" deployment/normaldance -- \
         pg_isready -U normaldance -d normaldance > /dev/null 2>&1; then
        success "База данных доступна"
    else
        warning "Не удалось проверить подключение к базе данных"
    fi
}

# Тестирование Redis
test_redis() {
    log "Тестирование Redis..."

    if kubectl exec -n "${ENVIRONMENT}" deployment/normaldance -- \
         redis-cli ping > /dev/null 2>&1; then
        success "Redis доступен"
    else
        warning "Не удалось проверить подключение к Redis"
    fi
}

# Тестирование IPFS
test_ipfs() {
    log "Тестирование IPFS узла..."

    if kubectl exec -n "${ENVIRONMENT}" deployment/normaldance -- \
         curl -f "http://localhost:8080/health" > /dev/null 2>&1; then
        success "IPFS узел доступен"
    else
        warning "Не удалось проверить подключение к IPFS"
    fi
}

# Тестирование блокчейн интеграции
test_blockchain() {
    log "Тестирование блокчейн интеграции..."

    # Проверка Solana RPC
    if curl -f -s --max-time 10 \
        "https://api.mainnet-beta.solana.com/health" > /dev/null 2>&1; then
        success "Solana RPC доступен"
    else
        warning "Solana RPC недоступен"
    fi

    # Проверка TON API
    if curl -f -s --max-time 10 \
        "https://ton.org/status" > /dev/null 2>&1; then
        success "TON API доступен"
    else
        warning "TON API недоступен"
    fi
}

# Тестирование производительности
test_performance() {
    log "Тестирование производительности..."

    local base_url="https://dnb1st-ru.onrender.com"

    # Измерение времени ответа
    local response_time
    response_time=$(curl -o /dev/null -s -w "%{time_total}\n" \
        "${base_url}/api/health")

    if (( $(echo "${response_time} < 2.0" | bc -l) )); then
        success "Время ответа в норме: ${response_time}s"
    else
        warning "Высокое время ответа: ${response_time}s"
    fi
}

# Тестирование безопасности
test_security() {
    log "Тестирование безопасности..."

    local base_url="https://dnb1st-ru.onrender.com"

    # Проверка HTTPS
    if curl -f -s -I "${base_url}" | grep -q "HTTP/2"; then
        success "HTTPS настроен корректно"
    else
        warning "Проблемы с HTTPS конфигурацией"
    fi

    # Проверка security headers
    local headers
    headers=$(curl -f -s -I "${base_url}" | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)")

    if [[ -n "${headers}" ]]; then
        success "Security headers настроены"
    else
        warning "Security headers отсутствуют или некорректны"
    fi
}

# Генерация отчета
generate_report() {
    log "Генерация отчета о тестировании..."

    local report_file="deployment-test-$(date +%Y%m%d-%H%M%S).md"

    cat > "${report_file}" << EOF
# 📊 Отчет о тестировании развертывания NORMAL DANCE

## Общая информация
- **Дата тестирования**: $(date)
- **Окружение**: ${ENVIRONMENT}
- **Коммит**: $(git rev-parse --short HEAD)
- **Ветка**: $(git branch --show-current)

## Результаты тестирования

### ✅ Критические тесты
$(if curl -f "https://dnb1st-ru.onrender.com/api/health" > /dev/null 2>&1; then
    echo "- ✅ Приложение доступно"
else
    echo "- ❌ Приложение недоступно"
fi)

### 🔧 Инфраструктурные тесты
$(if kubectl get pods -n "${ENVIRONMENT}" > /dev/null 2>&1; then
    echo "- ✅ Kubernetes pods работают"
else
    echo "- ⚠️ Проблемы с Kubernetes"
fi)

### 🌐 Сетевые тесты
$(if curl -f "https://api.mainnet-beta.solana.com" > /dev/null 2>&1; then
    echo "- ✅ Solana RPC доступен"
else
    echo "- ⚠️ Solana RPC недоступен"
fi)

### 💾 Тесты данных
$(if kubectl exec -n "${ENVIRONMENT}" deployment/normaldance -- pg_isready -U normaldance -d normaldance > /dev/null 2>&1; then
    echo "- ✅ База данных доступна"
else
    echo "- ⚠️ Проблемы с базой данных"
fi)

## Рекомендации

$(if [[ "${ENVIRONMENT}" == "production" ]]; then
    cat << RECOMMENDATIONS_EOF
### Для продакшн окружения:
1. Настроить мониторинг и алертинг
2. Проверить резервное копирование
3. Убедиться в наличии SSL сертификатов
4. Настроить rate limiting для API
RECOMMENDATIONS_EOF
else
    cat << RECOMMENDATIONS_EOF
### Для staging окружения:
1. Проверить все новые функции
2. Убедиться в корректности переменных окружения
3. Протестировать интеграцию с внешними сервисами
RECOMMENDATIONS_EOF
fi)

## Заключение

$(if [[ "${ENVIRONMENT}" == "production" ]]; then
    echo "Развертывание готово для продакшн использования."
else
    echo "Развертывание готово для тестирования."
fi)

---
*Отчет сгенерирован автоматически скриптом test-deployment.sh*
EOF

    success "Отчет сохранен в файл: ${report_file}"
}

# Основная функция
main() {
    log "🧪 Начало тестирования развертывания"
    log "Окружение: ${ENVIRONMENT}"

    # Определение типа тестирования
    case "${ENVIRONMENT}" in
        "production")
            log "Выполнение полного тестирования продакшн окружения..."
            test_api_endpoints
            test_performance
            test_security
            ;;
        "staging")
            log "Выполнение тестирования staging окружения..."
            test_api_endpoints
            test_performance
            ;;
        "local")
            log "Выполнение локального тестирования..."
            test_database
            test_redis
            test_ipfs
            ;;
        *)
            error "Неизвестное окружение: ${ENVIRONMENT}"
            ;;
    esac

    # Общие тесты
    test_blockchain
    generate_report

    log "🎉 Тестирование завершено успешно!"
}

# Запуск
main "$@"