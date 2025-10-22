#!/bin/bash

# ==============================================
# 🔒 NORMAL DANCE SECURITY CHECK SCRIPT
# ==============================================
# Комплексная проверка безопасности перед развертыванием

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Счетчики
CRITICAL_ISSUES=0
HIGH_ISSUES=0
MEDIUM_ISSUES=0
LOW_ISSUES=0

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

log_critical() {
    echo -e "${RED}[CRITICAL]${NC} $1"
    ((CRITICAL_ISSUES++))
}

log_high() {
    echo -e "${RED}[HIGH]${NC} $1"
    ((HIGH_ISSUES++))
}

print_header() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "🔒 NORMAL DANCE SECURITY AUDIT"
    echo "=========================================="
    echo -e "${NC}"
}

print_summary() {
    echo
    echo -e "${BLUE}=========================================="
    echo "📊 ИТОГИ ПРОВЕРКИ БЕЗОПАСНОСТИ"
    echo -e "${NC}"

    if [ $CRITICAL_ISSUES -gt 0 ]; then
        log_critical "Критических проблем: $CRITICAL_ISSUES"
    else
        log_success "Критических проблем: $CRITICAL_ISSUES"
    fi

    if [ $HIGH_ISSUES -gt 0 ]; then
        log_high "Высокоприоритетных проблем: $HIGH_ISSUES"
    else
        log_success "Высокоприоритетных проблем: $HIGH_ISSUES"
    fi

    log_warning "Среднеприоритетных проблем: $MEDIUM_ISSUES"
    log_info "Низкоприоритетных проблем: $LOW_ISSUES"

    echo
    if [ $CRITICAL_ISSUES -gt 0 ] || [ $HIGH_ISSUES -gt 0 ]; then
        log_error "❌ Найдены серьезные проблемы безопасности!"
        log_info "Рекомендуется исправить их перед развертыванием."
        return 1
    else
        log_success "✅ Проверка безопасности пройдена!"
        return 0
    fi
}

# 1. Проверка секретов в коде
check_hardcoded_secrets() {
    log_info "Проверка hardcoded секретов в коде..."

    # Поиск потенциальных секретов в исходном коде
    local secret_patterns=(
        "password.*=.*['\"][^'\"]*['\"]"
        "secret.*=.*['\"][^'\"]*['\"]"
        "key.*=.*['\"][^'\"]*['\"]"
        "token.*=.*['\"][^'\"]*['\"]"
        "api_key.*=.*['\"][^'\"]*['\"]"
    )

    local found_issues=0
    for pattern in "${secret_patterns[@]}"; do
        if grep -r -i "$pattern" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v ".test." | grep -v "__tests__" | head -5; then
            log_critical "Найдены потенциальные hardcoded секреты в коде!"
            ((found_issues++))
        fi
    done

    if [ $found_issues -eq 0 ]; then
        log_success "Hardcoded секреты не найдены"
    fi
}

# 2. Проверка переменных окружения
check_environment_variables() {
    log_info "Проверка переменных окружения..."

    # Проверка наличия плейсхолдеров в .env
    if [ -f ".env" ]; then
        PLACEHOLDERS=$(grep -c "your-\|GENERATE_NEW_SECRET_HERE\|password.*localhost" .env || true)
        if [ "$PLACEHOLDERS" -gt 0 ]; then
            log_high "Найдено $PLACEHOLDERS плейсхолдеров в .env файле"
        else
            log_success "Плейсхолдеры в .env не найдены"
        fi
    fi

    # Проверка .env в .gitignore
    if [ -f ".gitignore" ]; then
        if grep -q "\.env" .gitignore; then
            log_success ".env файлы исключены из Git"
        else
            log_high ".env файлы не найдены в .gitignore"
        fi
    else
        log_critical ".gitignore файл не найден"
    fi
}

# 3. Проверка зависимостей
check_dependencies() {
    log_info "Проверка безопасности зависимостей..."

    # Проверка наличия устаревших пакетов
    if command -v npm &> /dev/null; then
        log_info "Проверка устаревших пакетов..."
        OUTDATED=$(npm outdated 2>/dev/null | wc -l)
        if [ "$OUTDATED" -gt 0 ]; then
            log_warning "Найдено $OUTDATED устаревших пакетов"
        else
            log_success "Все пакеты актуальны"
        fi
    fi

    # Проверка на наличие известных уязвимых пакетов
    if command -v npm &> /dev/null; then
        log_info "Проверка уязвимых пакетов..."
        VULNERABILITIES=$(npm audit --audit-level=moderate 2>/dev/null | grep -c "vulnerabilities" || true)
        if [ "$VULNERABILITIES" -gt 0 ]; then
            log_high "Найдено $VULNERABILITIES уязвимых пакетов"
        else
            log_success "Критически уязвимые пакеты не найдены"
        fi
    fi
}

# 4. Проверка конфигурации приложения
check_app_config() {
    log_info "Проверка конфигурации приложения..."

    # Проверка наличия TypeScript strict mode
    if [ -f "tsconfig.json" ]; then
        if grep -q '"strict": true' tsconfig.json; then
            log_success "TypeScript strict mode включен"
        else
            log_warning "TypeScript strict mode отключен"
        fi
    fi

    # Проверка next.config.ts
    if [ -f "next.config.ts" ]; then
        log_info "Проверка Next.js конфигурации..."
        if grep -q "reactStrictMode" next.config.ts; then
            log_success "React strict mode включен"
        else
            log_warning "React strict mode не найден"
        fi
    fi
}

# 5. Проверка структуры проекта
check_project_structure() {
    log_info "Проверка структуры проекта..."

    # Проверка наличия критических файлов
    local critical_files=("package.json" "next.config.ts" "tsconfig.json" "prisma/schema.prisma")
    for file in "${critical_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_warning "Критический файл не найден: $file"
        else
            log_success "Файл найден: $file"
        fi
    done

    # Проверка наличия директорий
    local critical_dirs=("src" "prisma" "public")
    for dir in "${critical_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            log_warning "Критическая директория не найдена: $dir"
        else
            log_success "Директория найдена: $dir"
        fi
    done
}

# 6. Проверка блокчейн конфигурации
check_blockchain_config() {
    log_info "Проверка блокчейн конфигурации..."

    # Проверка использования devnet вместо mainnet в продакшене
    if [ -f ".env" ]; then
        if grep -q "devnet" .env; then
            log_warning "Найдена конфигурация devnet в .env (должна быть mainnet для продакшена)"
        fi

        if grep -q "localhost" .env; then
            log_warning "Найдена конфигурация localhost в .env"
        fi
    fi
}

# 7. Проверка мониторинга и логирования
check_monitoring() {
    log_info "Проверка мониторинга и логирования..."

    # Проверка наличия health check эндпоинта
    if [ -f "src/app/api/health/route.ts" ] || [ -f "src/pages/api/health.ts" ]; then
        log_success "Health check эндпоинт найден"
    else
        log_warning "Health check эндпоинт не найден"
    fi

    # Проверка наличия error tracking
    if grep -r "sentry\|Sentry" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
        log_success "Интеграция с Sentry найдена"
    else
        log_warning "Интеграция с error tracking не найдена"
    fi
}

# Основной процесс
main() {
    print_header

    # Запуск всех проверок
    check_hardcoded_secrets
    check_environment_variables
    check_dependencies
    check_app_config
    check_project_structure
    check_blockchain_config
    check_monitoring

    # Вывод итогов
    print_summary
}

# Запуск
main "$@"