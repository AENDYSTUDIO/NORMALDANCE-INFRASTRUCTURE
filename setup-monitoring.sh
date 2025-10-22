#!/bin/bash

# ==============================================
# 📊 NORMAL DANCE MONITORING SETUP
# ==============================================
# Настройка мониторинга и алертинга после развертывания

set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ==============================================
# КОНФИГУРАЦИЯ
# ==============================================

# Vercel project name (нужно изменить на реальный)
PROJECT_NAME="normaldance"
APP_URL="https://normaldance.online"

# ==============================================
# ФУНКЦИИ
# ==============================================

check_requirements() {
    log_info "Проверка системных требований для мониторинга..."

    # Проверка наличия curl
    if ! command -v curl &> /dev/null; then
        log_error "curl не установлен"
        exit 1
    fi

    # Проверка наличия jq для обработки JSON
    if ! command -v jq &> /dev/null; then
        log_warning "jq не установлен. Устанавливаю..."
        # Для разных ОС установка jq может отличаться
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y jq
        elif command -v yum &> /dev/null; then
            sudo yum install -y jq
        elif command -v brew &> /dev/null; then
            brew install jq
        else
            log_error "Не удалось установить jq автоматически"
            exit 1
        fi
    fi

    log_success "Все требования выполнены"
}

setup_vercel_analytics() {
    log_info "Настройка Vercel Analytics..."

    # Проверка наличия Vercel Analytics в приложении
    if [ -f "src/app/layout.tsx" ] || [ -f "src/pages/_app.tsx" ]; then
        log_success "Vercel Analytics автоматически включен в Next.js приложении"
    else
        log_warning "Не найден layout файл для проверки аналитики"
    fi

    log_info "Включите Vercel Analytics в настройках проекта:"
    log_info "1. Откройте Vercel Dashboard"
    log_info "2. Перейдите в Settings > Analytics"
    log_info "3. Включите Web Analytics"
    log_info "4. Настройте кастомные события при необходимости"
}

setup_sentry_monitoring() {
    log_info "Настройка Sentry мониторинга..."

    # Проверка наличия Sentry конфигурации
    if grep -r "sentry\|Sentry" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
        log_info "Обнаружена интеграция с Sentry"

        # Создание базовой конфигурации Sentry
        cat > sentry.properties << EOF
# Sentry Configuration
defaults.url=https://sentry.io/
defaults.org=your-organization
defaults.project=$PROJECT_NAME
cli.executable=node
EOF

        log_success "Создан файл sentry.properties"
        log_info "Настройте Sentry DSN в переменных окружения"
    else
        log_warning "Интеграция с Sentry не найдена"
        log_info "Рекомендуется добавить @sentry/nextjs для мониторинга ошибок"
    fi
}

setup_health_checks() {
    log_info "Настройка health checks..."

    # Проверка наличия health check эндпоинта
    if curl -f -s "$APP_URL/api/health" > /dev/null; then
        log_success "Health check эндпоинт доступен"

        # Создание мониторинга для health check
        log_info "Настройте uptime мониторинг в Vercel или используйте:"
        log_info "- https://uptime.betterstack.com"
        log_info "- https://www.pingdom.com"
        log_info "- https://statuscake.com"

    else
        log_warning "Health check эндпоинт недоступен по адресу: $APP_URL/api/health"
        log_info "Убедитесь, что эндпоинт существует и приложение развернуто"
    fi
}

setup_performance_monitoring() {
    log_info "Настройка мониторинга производительности..."

    # Рекомендации по мониторингу производительности
    log_info "Рекомендуемые инструменты для мониторинга:"

    echo
    echo "1. Vercel Performance Monitoring:"
    log_info "   - Автоматически включен в Pro планах"
    log_info "   - Мониторит Core Web Vitals"
    log_info "   - Отслеживает время загрузки страниц"

    echo
    echo "2. Google PageSpeed Insights:"
    log_info "   - Интеграция с Vercel"
    log_info "   - Автоматический мониторинг"

    echo
    echo "3. Real User Monitoring (RUM):"
    log_info "   - Интегрируйте @vercel/analytics"
    log_info "   - Добавьте кастомные метрики"

    # Создание базового конфига для аналитики
    if [ ! -f "lib/analytics.ts" ]; then
        mkdir -p lib
        cat > lib/analytics.ts << 'EOF'
// Analytics configuration
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || ''

// Vercel Analytics
export const vercelAnalyticsEnabled = process.env.NODE_ENV === 'production'

// Custom event tracking
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && vercelAnalyticsEnabled) {
    // Vercel Analytics track function will be available globally
    if (window.va) {
      window.va('event', { name: event, data: properties })
    }
  }
}
EOF
        log_success "Создан базовый файл аналитики"
    fi
}

setup_error_alerts() {
    log_info "Настройка алертов об ошибках..."

    # Создание конфигурации алертов
    cat > monitoring/alerts.json << EOF
{
  "alerts": [
    {
      "name": "High Error Rate",
      "condition": "error_rate > 5%",
      "duration": "5 minutes",
      "channels": ["email", "slack"]
    },
    {
      "name": "API Down",
      "condition": "health_check == false",
      "duration": "2 minutes",
      "channels": ["email", "slack", "sms"]
    },
    {
      "name": "High Response Time",
      "condition": "response_time > 3000ms",
      "duration": "3 minutes",
      "channels": ["email"]
    }
  ]
}
EOF

    log_success "Создан файл конфигурации алертов"
    log_info "Настройте уведомления в вашем мониторинговом сервисе"
}

setup_logging() {
    log_info "Настройка централизованного логирования..."

    # Создание конфигурации логирования
    cat > logging.config.json << EOF
{
  "level": "info",
  "transports": [
    {
      "type": "console",
      "level": "info",
      "format": "json"
    },
    {
      "type": "file",
      "level": "error",
      "filename": "logs/error.log",
      "maxsize": 5242880,
      "maxFiles": 5
    }
  ]
}
EOF

    log_success "Создан файл конфигурации логирования"
    log_info "Интегрируйте winston или pino для структурированного логирования"
}

create_monitoring_dashboard() {
    log_info "Создание дашборда мониторинга..."

    # Создание базового дашборда
    cat > monitoring/dashboard.json << EOF
{
  "dashboard": {
    "title": "NormalDance Production Dashboard",
    "widgets": [
      {
        "type": "uptime",
        "title": "Application Uptime",
        "endpoint": "$APP_URL/api/health"
      },
      {
        "type": "response_time",
        "title": "Average Response Time",
        "endpoints": ["$APP_URL", "$APP_URL/api/tracks"]
      },
      {
        "type": "error_rate",
        "title": "Error Rate",
        "threshold": "5%"
      },
      {
        "type": "throughput",
        "title": "Requests per Minute"
      }
    ]
  }
}
EOF

    log_success "Создан файл конфигурации дашборда"
}

# ==============================================
# ОСНОВНОЙ ПРОЦЕСС
# ==============================================

main() {
    echo -e "${BLUE}"
    echo "========================================"
    echo "📊 NORMAL DANCE MONITORING SETUP"
    echo "========================================"
    echo -e "${NC}"

    # Проверка URL приложения
    if [ -z "$APP_URL" ]; then
        log_error "APP_URL не настроен"
        log_info "Установите APP_URL в начале скрипта"
        exit 1
    fi

    # Шаг 1: Проверка требований
    check_requirements

    # Шаг 2: Настройка аналитики Vercel
    setup_vercel_analytics

    # Шаг 3: Настройка Sentry мониторинга
    setup_sentry_monitoring

    # Шаг 4: Настройка health checks
    setup_health_checks

    # Шаг 5: Настройка мониторинга производительности
    setup_performance_monitoring

    # Шаг 6: Настройка алертов
    setup_error_alerts

    # Шаг 7: Настройка логирования
    setup_logging

    # Шаг 8: Создание дашборда мониторинга
    create_monitoring_dashboard

    echo -e "${GREEN}"
    echo "========================================"
    echo "✅ НАСТРОЙКА МОНИТОРИНГА ЗАВЕРШЕНА!"
    echo "========================================"
    echo -e "${NC}"

    log_info "Следующие шаги:"
    log_info "1. Зарегистрируйтесь в мониторинговых сервисах (Sentry, BetterStack)"
    log_info "2. Настройте алерты и уведомления"
    log_info "3. Создайте дашборды мониторинга"
    log_info "4. Протестируйте все алерты"
    log_info "5. Обучите команду работе с мониторингом"
    log_info "6. Настройте регулярные отчеты"

    echo
    log_success "Мониторинг готов к работе!"
}

# Запуск основного процесса
main "$@"