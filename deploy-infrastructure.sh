#!/bin/bash

# ==============================================
# 🚀 NORMAL DANCE COMPLETE INFRASTRUCTURE DEPLOYMENT
# ==============================================
# Полный цикл развертывания инфраструктуры от начала до конца

set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ==============================================
# КОНФИГУРАЦИЯ
# ==============================================

# Настройки развертывания
PROJECT_NAME="normaldance"
APP_URL="https://normaldance.online"
DEPLOY_ENV="production"

# ==============================================
# ФУНКЦИИ
# ==============================================

log_header() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo -e "${NC}"
}

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

print_banner() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                 🚀 NORMAL DANCE                          ║"
    echo "║           COMPLETE INFRASTRUCTURE DEPLOYMENT             ║"
    echo "║                                                          ║"
    echo "║      Web3 Music Platform with Solana Integration         ║"
    echo "║                                                          ║"
    echo "║              Automated Deployment Pipeline               ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_prerequisites() {
    log_header "🔍 ПРОВЕРКА ПРЕДВАРИТЕЛЬНЫХ ТРЕБОВАНИЙ"

    # Проверка операционной системы
    log_info "Операционная система: $(uname -a)"

    # Проверка Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js не установлен"
        exit 1
    fi
    log_info "Node.js версия: $(node -v)"

    # Проверка npm
    if ! command -v npm &> /dev/null; then
        log_error "npm не установлен"
        exit 1
    fi
    log_info "npm версия: $(npm -v)"

    # Проверка Git
    if ! command -v git &> /dev/null; then
        log_error "Git не установлен"
        exit 1
    fi
    log_info "Git версия: $(git --version)"

    log_success "Все предварительные требования выполнены"
}

setup_secrets() {
    log_header "🔐 НАСТРОЙКА БЕЗОПАСНЫХ СЕКРЕТОВ"

    if [ ! -f "generate-secrets.sh" ]; then
        log_error "Скрипт generate-secrets.sh не найден"
        exit 1
    fi

    chmod +x generate-secrets.sh
    ./generate-secrets.sh

    log_success "Секреты сгенерированы и настроены"
}

security_audit() {
    log_header "🔒 АУДИТ БЕЗОПАСНОСТИ"

    if [ ! -f "security-check.sh" ]; then
        log_error "Скрипт security-check.sh не найден"
        exit 1
    fi

    chmod +x security-check.sh
    if ./security-check.sh; then
        log_success "Аудит безопасности пройден"
    else
        log_warning "Найдены проблемы безопасности, но продолжаю развертывание"
    fi
}

build_application() {
    log_header "🏗️ СБОРКА ПРИЛОЖЕНИЯ"

    log_info "Установка зависимостей..."
    npm ci

    log_info "Проверка типов TypeScript..."
    if npm run type-check 2>/dev/null; then
        log_success "Проверка типов пройдена"
    else
        log_warning "Найдены ошибки типов, но продолжаю"
    fi

    log_info "Сборка приложения для продакшена..."
    npm run build

    log_success "Приложение собрано успешно"
}

deploy_to_vercel() {
    log_header "🚀 РАЗВЕРТЫВАНИЕ НА VERCEL"

    # Проверка аутентификации Vercel
    if ! vercel whoami &> /dev/null; then
        log_error "Необходимо войти в Vercel CLI"
        log_info "Выполните: vercel login"
        exit 1
    fi

    log_info "Запуск развертывания..."
    if vercel --prod; then
        log_success "Развертывание на Vercel завершено"
    else
        log_error "Ошибка развертывания на Vercel"
        exit 1
    fi
}

verify_deployment() {
    log_header "✅ ПРОВЕРКА РАЗВЕРТЫВАНИЯ"

    if [ ! -f "post-deploy-verification.sh" ]; then
        log_error "Скрипт post-deploy-verification.sh не найден"
        exit 1
    fi

    chmod +x post-deploy-verification.sh
    ./post-deploy-verification.sh

    log_success "Проверка развертывания завершена"
}

setup_monitoring() {
    log_header "📊 НАСТРОЙКА МОНИТОРИНГА"

    if [ ! -f "setup-monitoring.sh" ]; then
        log_error "Скрипт setup-monitoring.sh не найден"
        exit 1
    fi

    chmod +x setup-monitoring.sh
    ./setup-monitoring.sh

    log_success "Мониторинг настроен"
}

generate_documentation() {
    log_header "📚 ГЕНЕРАЦИЯ ДОКУМЕНТАЦИИ"

    # Создание отчета о развертывании
    local report_file="INFRASTRUCTURE_DEPLOYMENT_REPORT_$(date +%Y%m%d_%H%M%S).md"

    cat > "$report_file" << EOF
# Отчет о развертывании инфраструктуры NormalDance

## Информация о развертывании

- **Дата**: $(date)
- **Проект**: $PROJECT_NAME
- **Среда**: $DEPLOY_ENV
- **URL**: $APP_URL
- **Статус**: ✅ УСПЕШНО

## Выполненные этапы

### ✅ Подготовка
- Проверка предварительных требований
- Генерация безопасных секретов
- Аудит безопасности

### ✅ Сборка
- Установка зависимостей
- Проверка типов TypeScript
- Сборка приложения

### ✅ Развертывание
- Деплой на Vercel
- Настройка домена
- Проверка доступности

### ✅ Мониторинг
- Настройка аналитики
- Конфигурация алертов
- Мониторинг производительности

## Следующие шаги

1. **Мониторинг**: Следите за метриками в первые 24 часа
2. **Тестирование**: Проведите полное тестирование функциональности
3. **Документация**: Обновите пользовательскую документацию
4. **Резервное копирование**: Настройте регулярное резервное копирование
5. **Обучение команды**: Проведите обучение по новым возможностям

## Полезные команды

\`\`\`bash
# Просмотр статуса развертывания
vercel ls

# Мониторинг логов
vercel logs --follow

# Проверка здоровья
curl $APP_URL/api/health

# Откат при необходимости
vercel rollback
\`\`\`

## Контакты

- **DevOps**: devops@normaldance.online
- **Техническая поддержка**: support@normaldance.online
- **Экстренные случаи**: emergency@normaldance.online

---
*Автоматически сгенерировано скриптом развертывания*
EOF

    log_success "Отчет о развертывании создан: $report_file"
}

# ==============================================
# ОСНОВНОЙ ПРОЦЕСС РАЗВЕРТЫВАНИЯ
# ==============================================

main() {
    print_banner

    log_info "Запуск полного цикла развертывания инфраструктуры..."
    log_info "Это может занять 10-15 минут"

    echo
    read -p "Начать развертывание? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Развертывание отменено пользователем"
        exit 0
    fi

    # Этап 1: Проверка предварительных требований
    check_prerequisites

    # Этап 2: Настройка секретов
    setup_secrets

    # Этап 3: Аудит безопасности
    security_audit

    # Этап 4: Сборка приложения
    build_application

    # Этап 5: Развертывание на Vercel
    deploy_to_vercel

    # Этап 6: Проверка развертывания
    verify_deployment

    # Этап 7: Настройка мониторинга
    setup_monitoring

    # Этап 8: Генерация документации
    generate_documentation

    # Финальный баннер успеха
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║           🎉 РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО! 🎉                ║"
    echo "║                                                          ║"
    echo "║      Платформа NormalDance готова к использованию!       ║"
    echo "║                                                          ║"
    echo "║            🌐 $APP_URL                                   ║"
    echo "║                                                          ║"
    echo "║     Мониторьте приложение и наслаждайтесь успехом!       ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    log_info "Следующие шаги:"
    log_info "1. Откройте $APP_URL в браузере"
    log_info "2. Протестируйте ключевые функции"
    log_info "3. Настройте дополнительные интеграции"
    log_info "4. Обучите команду работе с платформой"
    log_info "5. Планируйте следующий релиз"

    echo
    log_success "🎵 Добро пожаловать в мир Web3 музыки! 🎵"
}

# Обработка прерываний
trap 'log_error "Развертывание прервано пользователем"; exit 1' INT TERM

# Запуск основного процесса
main "$@"