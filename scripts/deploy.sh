#!/bin/bash

# 🚀 NORMAL DANCE - Автоматизированный скрипт развертывания
# Использование: ./scripts/deploy.sh [environment] [service]

set -euo pipefail

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENVIRONMENT="${1:-production}"
SERVICE="${2:-all}"

# Логирование
LOG_FILE="${PROJECT_ROOT}/logs/deploy-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $*${NC}" | tee -a "${LOG_FILE}"
}

success() {
    echo -e "${GREEN}✅ $*${NC}" | tee -a "${LOG_FILE}"
}

warning() {
    echo -e "${YELLOW}⚠️  $*${NC}" | tee -a "${LOG_FILE}"
}

error() {
    echo -e "${RED}❌ $*${NC}" | tee -a "${LOG_FILE}"
    exit 1
}

# Проверка зависимостей
check_dependencies() {
    log "Проверка зависимостей..."

    local deps=("docker" "kubectl" "helm")
    for dep in "${deps[@]}"; do
        if ! command -v "${dep}" &> /dev/null; then
            error "Требуется установить ${dep}"
        fi
    done

    success "Все зависимости установлены"
}

# Загрузка переменных окружения
load_environment() {
    log "Загрузка конфигурации для окружения: ${ENVIRONMENT}"

    if [[ -f "${PROJECT_ROOT}/.env.${ENVIRONMENT}" ]]; then
        # shellcheck source=/dev/null
        source "${PROJECT_ROOT}/.env.${ENVIRONMENT}"
        success "Конфигурация окружения загружена"
    else
        warning "Файл .env.${ENVIRONMENT} не найден"
    fi

    # Проверка обязательных переменных
    local required_vars=("DATABASE_URL" "REDIS_URL" "JWT_SECRET")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Обязательная переменная ${var} не установлена"
        fi
    done
}

# Предварительные проверки
pre_flight_checks() {
    log "Выполнение предварительных проверок..."

    # Проверка Git статуса
    if [[ -n "$(git status --porcelain)" ]]; then
        warning "Есть незафиксированные изменения в репозитории"
        read -p "Продолжить? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Развертывание отменено пользователем"
        fi
    fi

    # Проверка ветки
    local current_branch
    current_branch=$(git branch --show-current)
    if [[ "${ENVIRONMENT}" == "production" && "${current_branch}" != "main" ]]; then
        error "Для продакшн развертывания необходимо находиться на ветке main"
    fi

    success "Предварительные проверки пройдены"
}

# Сборка образов
build_images() {
    log "Сборка Docker образов..."

    local image_tag
    image_tag="${ENVIRONMENT}-$(git rev-parse --short HEAD)"

    # Сборка основных сервисов
    local services=("frontend" "backend" "ipfs")

    for service in "${services[@]}"; do
        log "Сборка сервиса: ${service}"

        case "${service}" in
            "frontend")
                docker build \
                    -f docker/nextjs.Dockerfile \
                    -t "normaldance-${service}:${image_tag}" \
                    -t "normaldance-${service}:latest" \
                    "${PROJECT_ROOT}"
                ;;
            "backend")
                docker build \
                    -f docker/backend.Dockerfile \
                    -t "normaldance-${service}:${image_tag}" \
                    -t "normaldance-${service}:latest" \
                    "${PROJECT_ROOT}"
                ;;
            "ipfs")
                docker build \
                    -f docker/ipfs-service.Dockerfile \
                    -t "normaldance-${service}:${image_tag}" \
                    -t "normaldance-${service}:latest" \
                    "${PROJECT_ROOT}"
                ;;
        esac

        success "Сервис ${service} собран"
    done

    export IMAGE_TAG="${image_tag}"
}

# Тестирование образов
test_images() {
    log "Тестирование Docker образов..."

    # Запуск тестовых контейнеров
    for service in frontend backend ipfs; do
        log "Тестирование сервиса: ${service}"

        local container_name="test-${service}-$$"
        docker run \
            --name "${container_name}" \
            --rm \
            --detach \
            "normaldance-${service}:${IMAGE_TAG}"

        # Ожидание запуска
        sleep 10

        # Проверка здоровья
        if docker exec "${container_name}" curl -f "http://localhost:3000/health" &>/dev/null; then
            success "Сервис ${service} прошел health check"
        else
            error "Health check сервиса ${service} не пройден"
        fi

        # Остановка тестового контейнера
        docker stop "${container_name}" || true
    done

    success "Все тесты пройдены"
}

# Развертывание в Kubernetes
deploy_kubernetes() {
    log "Развертывание в Kubernetes..."

    # Создание namespace если не существует
    kubectl create namespace "${ENVIRONMENT}" --dry-run=client -o yaml | kubectl apply -f -

    # Обновление зависимостей Helm
    helm dependency update "${PROJECT_ROOT}/helm/normaldance"

    # Развертывание через Helm
    helm upgrade --install normaldance "${PROJECT_ROOT}/helm/normaldance" \
        --namespace "${ENVIRONMENT}" \
        --create-namespace \
        --values "${PROJECT_ROOT}/helm/normaldance/values-${ENVIRONMENT}.yaml" \
        --set image.tag="${IMAGE_TAG}" \
        --atomic \
        --timeout 10m \
        --wait

    success "Развертывание в Kubernetes завершено"
}

# Развертывание на Render
deploy_render() {
    log "Развертывание на Render..."

    local services=("dnb1st-ru" "dnb1st-store")
    local service_ids=()

    # Определение ID сервисов
    case "${ENVIRONMENT}" in
        "production")
            service_ids=("dnb1st-ru-prod" "dnb1st-store-prod")
            ;;
        "staging")
            service_ids=("dnb1st-ru-staging" "dnb1st-store-staging")
            ;;
        *)
            error "Неизвестное окружение: ${ENVIRONMENT}"
            ;;
    esac

    # Деплой каждого сервиса
    for i in "${!services[@]}"; do
        local service="${services[$i]}"
        local service_id="${service_ids[$i]}"

        log "Деплой сервиса: ${service}"

        curl -X POST \
            -H "Authorization: Bearer ${RENDER_API_TOKEN}" \
            -H "Content-Type: application/json" \
            -d "{
                \"service_id\": \"${service_id}\",
                \"env\": \"${ENVIRONMENT}\",
                \"git\": {
                    \"branch\": \"$(git branch --show-current)\",
                    \"commit_sha\": \"$(git rev-parse HEAD)\"
                }
            }" \
            "https://api.render.com/v1/services/${service_id}/deploys"

        success "Деплой сервиса ${service} инициирован"
    done
}

# Проверка развертывания
verify_deployment() {
    log "Проверка развертывания..."

    case "${SERVICE}" in
        "kubernetes"|"k8s")
            # Проверка Kubernetes деплоя
            kubectl wait --for=condition=available --timeout=300s \
                deployment/normaldance --namespace "${ENVIRONMENT}"

            # Проверка сервисов
            kubectl get services --namespace "${ENVIRONMENT}"

            # Проверка Ingress
            kubectl get ingress --namespace "${ENVIRONMENT}"

            # Smoke тесты
            local app_url
            app_url="https://normaldance-${ENVIRONMENT}.local"
            if curl -f -k "${app_url}/health" &>/dev/null; then
                success "Приложение доступно по адресу: ${app_url}"
            else
                error "Приложение недоступно"
            fi
            ;;
        "render")
            # Проверка Render деплоя
            local render_url="https://dnb1st-ru.onrender.com"
            for i in {1..30}; do
                if curl -f "${render_url}/health" &>/dev/null; then
                    success "Приложение доступно по адресу: ${render_url}"
                    return 0
                fi
                log "Ожидание готовности приложения... (${i}/30)"
                sleep 10
            done
            error "Приложение не готово после 5 минут ожидания"
            ;;
        *)
            # Общая проверка
            success "Развертывание завершено"
            ;;
    esac
}

# Отправка уведомлений
send_notification() {
    log "Отправка уведомлений..."

    local status="${1:-success}"
    local webhook_url="${SLACK_WEBHOOK_URL:-}"

    if [[ -n "${webhook_url}" ]]; then
        local color="good"
        local emoji="✅"

        if [[ "${status}" == "failed" ]]; then
            color="danger"
            emoji="❌"
        fi

        curl -X POST \
            -H "Content-type: application/json" \
            -d "{
                \"text\": \"${emoji} Deployment ${status} for NORMAL DANCE\",
                \"attachments\": [
                    {
                        \"color\": \"${color}\",
                        \"fields\": [
                            {
                                \"title\": \"Environment\",
                                \"value\": \"${ENVIRONMENT}\",
                                \"short\": true
                            },
                            {
                                \"title\": \"Commit\",
                                \"value\": \"$(git rev-parse --short HEAD)\",
                                \"short\": true
                            },
                            {
                                \"title\": \"Branch\",
                                \"value\": \"$(git branch --show-current)\",
                                \"short\": true
                            }
                        ]
                    }
                ]
            }" \
            "${webhook_url}"

        success "Уведомление отправлено в Slack"
    else
        warning "Slack webhook не настроен, уведомление пропущено"
    fi
}

# Основная функция
main() {
    log "🚀 Начало развертывания NORMAL DANCE"
    log "Окружение: ${ENVIRONMENT}"
    log "Сервис: ${SERVICE}"
    log "Время начала: $(date)"

    # Создание директории для логов
    mkdir -p "${PROJECT_ROOT}/logs"

    # Основные этапы развертывания
    check_dependencies
    load_environment
    pre_flight_checks
    build_images
    test_images

    case "${SERVICE}" in
        "kubernetes"|"k8s")
            deploy_kubernetes
            verify_deployment
            send_notification "success"
            ;;
        "render")
            deploy_render
            verify_deployment
            send_notification "success"
            ;;
        "all")
            deploy_kubernetes
            deploy_render
            verify_deployment
            send_notification "success"
            ;;
        *)
            error "Неизвестный сервис: ${SERVICE}. Используйте: kubernetes, render, или all"
            ;;
    esac

    log "🎉 Развертывание успешно завершено!"
    log "Время завершения: $(date)"
    log "Подробности в файле: ${LOG_FILE}"
}

# Обработка сигналов
cleanup() {
    log "Прерывание развертывания..."
    send_notification "failed"
    exit 1
}

trap cleanup INT TERM

# Запуск
main "$@"