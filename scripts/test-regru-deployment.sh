#!/bin/bash

# 🧪 NORMAL DANCE - Тестирование развертывания на REG.RU сервере
# Использование: ./scripts/test-regru-deployment.sh

set -euo pipefail

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Конфигурация
SERVER_IP="31.31.196.214"
SSH_USER="u3284463"
TEST_DOMAINS=("normaldance.ru" "www.normaldance.ru")
TEST_TIMEOUT=30

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

info() {
    echo -e "${PURPLE}ℹ️  $*${NC}"
}

# Проверка SSH доступа
test_ssh_access() {
    log "🔐 Тестирование SSH доступа..."

    if ssh -o ConnectTimeout=10 -o BatchMode=yes ${SSH_USER}@${SERVER_IP} "echo 'SSH OK'" 2>/dev/null; then
        success "SSH доступ работает"
        SSH_CMD="ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_IP}"
        return 0
    else
        error "SSH доступ не работает"
    fi
}

# Тестирование сетевого доступа
test_network_access() {
    log "🌐 Тестирование сетевого доступа..."

    for domain in "${TEST_DOMAINS[@]}"; do
        log "Проверка домена: ${domain}"

        # Проверка DNS разрешения
        IP_ADDRESS=$(dig +short "${domain}" @8.8.8.8 2>/dev/null || echo "")

        if [[ "${IP_ADDRESS}" == "${SERVER_IP}" ]]; then
            success "DNS для ${domain} настроен правильно"
        else
            warning "DNS для ${domain} указывает на ${IP_ADDRESS}, ожидалось ${SERVER_IP}"
        fi

        # Проверка HTTP ответа
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://${domain}" 2>/dev/null || echo "000")

        if [[ "${HTTP_STATUS}" == "200" ]]; then
            success "HTTP для ${domain}: ${HTTP_STATUS}"
        elif [[ "${HTTP_STATUS}" == "301" ]] || [[ "${HTTP_STATUS}" == "302" ]]; then
            success "Перенаправление для ${domain}: ${HTTP_STATUS}"
        else
            warning "HTTP для ${domain}: ${HTTP_STATUS}"
        fi

        # Проверка HTTPS
        HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -k --max-time 10 "https://${domain}" 2>/dev/null || echo "000")

        if [[ "${HTTPS_STATUS}" == "200" ]]; then
            success "HTTPS для ${domain}: ${HTTPS_STATUS}"
        else
            warning "HTTPS для ${domain}: ${HTTPS_STATUS}"
        fi

        # Измерение времени ответа
        RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "http://${domain}" 2>/dev/null || echo "0")

        if (( $(echo "${RESPONSE_TIME} < 3.0" | bc -l 2>/dev/null || echo "1") )); then
            success "Время ответа для ${domain}: ${RESPONSE_TIME}s"
        else
            warning "Высокое время ответа для ${domain}: ${RESPONSE_TIME}s"
        fi
    done
}

# Тестирование сервисов на сервере
test_server_services() {
    log "🔧 Тестирование сервисов на сервере..."

    # Проверка Nginx
    if ${SSH_CMD} "sudo systemctl is-active nginx" 2>/dev/null; then
        success "Nginx работает"

        # Проверка конфигурации
        if ${SSH_CMD} "sudo nginx -t" 2>/dev/null; then
            success "Конфигурация Nginx корректна"
        else
            error "Ошибка в конфигурации Nginx"
        fi
    else
        error "Nginx не работает"
    fi

    # Проверка MySQL
    if ${SSH_CMD} "sudo systemctl is-active mysql" 2>/dev/null; then
        success "MySQL работает"
    else
        error "MySQL не работает"
    fi

    # Проверка PM2
    if ${SSH_CMD} "pm2 list" 2>/dev/null; then
        success "PM2 установлен"

        # Проверка приложения
        if ${SSH_CMD} "pm2 list | grep normaldance" 2>/dev/null; then
            success "Приложение работает через PM2"
        else
            error "Приложение не найдено в PM2"
        fi
    else
        warning "PM2 не установлен"
    fi

    # Проверка портов
    if ${SSH_CMD} "netstat -tlnp | grep :80" 2>/dev/null; then
        success "Порт 80 прослушивается"
    else
        error "Порт 80 не прослушивается"
    fi

    if ${SSH_CMD} "netstat -tlnp | grep :3000" 2>/dev/null; then
        success "Порт 3000 прослушивается"
    else
        warning "Порт 3000 не прослушивается"
    fi
}

# Тестирование базы данных
test_database() {
    log "🗄️ Тестирование базы данных..."

    # Проверка подключения
    if ${SSH_CMD} "mysql -h localhost -u u3284463_default -p[ПАРОЛЬ_БД] u3284463_default -e 'SELECT 1'" 2>/dev/null; then
        success "Подключение к базе данных работает"
    else
        error "Не удалось подключиться к базе данных"
    fi

    # Проверка таблиц
    TABLES_COUNT=$(${SSH_CMD} "mysql -h localhost -u u3284463_default -p[ПАРОЛЬ_БД] u3284463_default -e 'SHOW TABLES' 2>/dev/null | wc -l" 2>/dev/null || echo "0")

    if [[ "${TABLES_COUNT}" -gt "0" ]]; then
        success "База данных содержит таблицы: ${TABLES_COUNT}"
    else
        warning "В базе данных нет таблиц или ошибка доступа"
    fi

    # Проверка размера базы
    DB_SIZE=$(${SSH_CMD} "du -sb /var/lib/mysql/u3284463_default 2>/dev/null | cut -f1" 2>/dev/null || echo "0")
    DB_SIZE_MB=$(( DB_SIZE / 1024 / 1024 ))

    log "Размер базы данных: ${DB_SIZE_MB} MB"

    if [[ "${DB_SIZE_MB}" -lt "1000" ]]; then
        success "Размер базы данных в норме"
    else
        warning "Большой размер базы данных: ${DB_SIZE_MB} MB"
    fi
}

# Тестирование приложения
test_application() {
    log "🎵 Тестирование приложения..."

    # Тестирование health endpoint
    for domain in "${TEST_DOMAINS[@]}"; do
        log "Health check для ${domain}"

        HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://${domain}/api/health" 2>/dev/null || echo "000")

        if [[ "${HEALTH_STATUS}" == "200" ]]; then
            success "Health check для ${domain}: ${HEALTH_STATUS}"
        else
            warning "Health check для ${domain}: ${HEALTH_STATUS}"
        fi
    done

    # Тестирование API endpoints
    API_TESTS=(
        "api/info:200"
        "api/tracks:200"
        "api/users:200"
    )

    for test in "${API_TESTS[@]}"; do
        endpoint="${test%:*}"
        expected_code="${test#*:}"

        for domain in "${TEST_DOMAINS[@]}"; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://${domain}/${endpoint}" 2>/dev/null || echo "000")

            if [[ "${STATUS}" == "${expected_code}" ]]; then
                success "API ${endpoint} для ${domain}: ${STATUS}"
            else
                warning "API ${endpoint} для ${domain}: ${STATUS} (ожидалось ${expected_code})"
            fi
        done
    done
}

# Тестирование производительности
test_performance() {
    log "⚡ Тестирование производительности..."

    local domain="normaldance.ru"

    # Измерение времени ответа главной страницы
    MAIN_PAGE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "http://${domain}" 2>/dev/null || echo "0")

    if (( $(echo "${MAIN_PAGE_TIME} < 3.0" | bc -l 2>/dev/null || echo "1") )); then
        success "Главная страница загружается за ${MAIN_PAGE_TIME}s"
    else
        warning "Главная страница загружается слишком долго: ${MAIN_PAGE_TIME}s"
    fi

    # Измерение времени ответа API
    API_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "http://${domain}/api/health" 2>/dev/null || echo "0")

    if (( $(echo "${API_TIME} < 1.0" | bc -l 2>/dev/null || echo "1") )); then
        success "API отвечает за ${API_TIME}s"
    else
        warning "API отвечает медленно: ${API_TIME}s"
    fi

    # Проверка размера главной страницы
    PAGE_SIZE=$(curl -s "http://${domain}" --max-time 10 2>/dev/null | wc -c || echo "0")

    if [[ "${PAGE_SIZE}" -gt "0" ]] && [[ "${PAGE_SIZE}" -lt "5000000" ]]; then
        success "Размер главной страницы: $((PAGE_SIZE / 1024)) KB"
    else
        warning "Некорректный размер главной страницы: ${PAGE_SIZE} байт"
    fi
}

# Тестирование безопасности
test_security() {
    log "🔒 Тестирование безопасности..."

    local domain="normaldance.ru"

    # Проверка security headers
    HEADERS=$(curl -s -I "http://${domain}" --max-time 10 2>/dev/null || echo "")

    if echo "${HEADERS}" | grep -q "X-Frame-Options"; then
        success "X-Frame-Options header установлен"
    else
        warning "X-Frame-Options header отсутствует"
    fi

    if echo "${HEADERS}" | grep -q "X-Content-Type-Options"; then
        success "X-Content-Type-Options header установлен"
    else
        warning "X-Content-Type-Options header отсутствует"
    fi

    if echo "${HEADERS}" | grep -q "Strict-Transport-Security"; then
        success "HSTS header установлен"
    else
        warning "HSTS header отсутствует"
    fi

    # Проверка HTTPS сертификата
    if curl -s -I "https://${domain}" --max-time 10 2>/dev/null | grep -q "HTTP/2\|HTTP/1.1 200"; then
        success "HTTPS сертификат действителен"
    else
        warning "Проблемы с HTTPS сертификатом"
    fi

    # Проверка директорий на наличие чувствительных файлов
    SENSITIVE_FILES=$(${SSH_CMD} "find /var/www/${SSH_USER}/data/www/normaldance.ru -name '.env*' -o -name '*.key' -o -name '*.pem' 2>/dev/null | wc -l" 2>/dev/null || echo "0")

    if [[ "${SENSITIVE_FILES}" -eq "0" ]]; then
        success "Чувствительных файлов не найдено"
    else
        error "Найдено ${SENSITIVE_FILES} чувствительных файлов"
    fi
}

# Генерация отчета
generate_test_report() {
    log "📊 Генерация отчета тестирования..."

    local report_file="regru-deployment-test-$(date +%Y%m%d-%H%M%S).md"

    cat > "../reports/${report_file}" << EOF
# 🧪 Отчет тестирования развертывания на REG.RU

## Общая информация
- **Дата тестирования**: $(date)
- **Сервер**: ${SERVER_IP}
- **Домены**: $(echo "${TEST_DOMAINS[@]}" | tr ' ' ', ')
- **Статус развертывания**: $(if [[ $? -eq 0 ]]; then echo "✅ УСПЕШНО"; else echo "❌ НЕУДАЧНО"; fi)

## Результаты тестирования

### 🔐 Доступ к серверу
$(if ssh -o ConnectTimeout=5 -o BatchMode=yes ${SSH_USER}@${SERVER_IP} "echo 'OK'" 2>/dev/null; then
    echo "- ✅ SSH доступ работает"
else
    echo "- ❌ SSH доступ не работает"
fi)

### 🌐 Домены и сеть
$(for domain in "${TEST_DOMAINS[@]}"; do
    DNS_IP=$(dig +short "${domain}" @8.8.8.8 2>/dev/null || echo "неизвестен")
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://${domain}" 2>/dev/null || echo "недоступен")
    echo "- **${domain}**: DNS=${DNS_IP}, HTTP=${HTTP_STATUS}"
done)

### 🔧 Сервисы сервера
$(if ${SSH_CMD} "sudo systemctl is-active nginx" 2>/dev/null; then
    echo "- ✅ Nginx: работает"
else
    echo "- ❌ Nginx: не работает"
fi)

$(if ${SSH_CMD} "sudo systemctl is-active mysql" 2>/dev/null; then
    echo "- ✅ MySQL: работает"
else
    echo "- ❌ MySQL: не работает"
fi)

$(if ${SSH_CMD} "pm2 list | grep normaldance" 2>/dev/null; then
    echo "- ✅ Приложение: работает через PM2"
else
    echo "- ❌ Приложение: не работает"
fi)

### 🗄️ База данных
$(DB_STATUS=$(mysql -h localhost -u u3284463_default -p[ПАРОЛЬ_БД] -e 'SELECT 1' 2>/dev/null && echo "доступна" || echo "недоступна")
echo "- База данных: ${DB_STATUS}")

$(TABLES_COUNT=$(${SSH_CMD} "mysql -h localhost -u u3284463_default -p[ПАРОЛЬ_БД] -e 'SHOW TABLES' 2>/dev/null | wc -l" 2>/dev/null || echo "0")
echo "- Количество таблиц: ${TABLES_COUNT}")

### ⚡ Производительность
$(MAIN_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 5 "http://normaldance.ru" 2>/dev/null || echo "0")
echo "- Время загрузки главной страницы: ${MAIN_TIME}s")

$(API_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 5 "http://normaldance.ru/api/health" 2>/dev/null || echo "0")
echo "- Время ответа API: ${API_TIME}s")

### 🔒 Безопасность
$(SECURITY_HEADERS=$(curl -s -I "http://normaldance.ru" --max-time 5 2>/dev/null | grep -c "X-Frame-Options\|X-Content-Type-Options\|Strict-Transport-Security" || echo "0")
echo "- Security headers: ${SECURITY_HEADERS} найдено")

$(HTTPS_WORKS=$(curl -s -I "https://normaldance.ru" --max-time 5 2>/dev/null | grep -q "200\|301\|302" && echo "да" || echo "нет")
echo "- HTTPS работает: ${HTTPS_WORKS}")

## Рекомендации

$(if [[ $? -eq 0 ]]; then
    cat << RECOMMENDATIONS_EOF
### ✅ Развертывание успешно

**Следующие шаги:**
1. Настройте мониторинг в панели Ispmanager
2. Проверьте резервное копирование
3. Настройте уведомления об ошибках
4. Протестируйте все функции приложения
5. Обновите DNS записи если нужно

**Команды для управления:**
\`\`\`bash
# Статус приложения
pm2 status

# Логи приложения
pm2 logs normaldance

# Перезапуск приложения
pm2 restart normaldance

# Статус сервисов
sudo systemctl status nginx mysql
\`\`\`
RECOMMENDATIONS_EOF
else
    cat << RECOMMENDATIONS_EOF
### ❌ Требуется исправление проблем

**Критические проблемы:**
1. Исправьте недоступные сервисы
2. Проверьте конфигурацию Nginx
3. Убедитесь в корректности базы данных
4. Настройте правильные DNS записи

**Диагностика:**
\`\`\`bash
# Проверка логов
tail -f /var/log/nginx/normaldance.ru_error.log
pm2 logs normaldance

# Проверка процессов
ps aux | grep -E 'nginx|node|mysql'

# Проверка портов
netstat -tlnp | grep -E ':(80|3000|3306)'
\`\`\`
RECOMMENDATIONS_EOF
fi)

## Контакты поддержки

- **Панель управления**: https://server172.hosting.reg.ru:1500/
- **Техническая поддержка REG.RU**: +7 (495) 580-11-11
- **Документация**: $(echo "${report_file}" | sed 's/.md//')

---
*Отчет сгенерирован автоматически скриптом test-regru-deployment.sh*
EOF

    success "Отчет тестирования сохранен: reports/${report_file}"
}

# Основная функция
main() {
    log "🧪 НАЧАЛО ТЕСТИРОВАНИЯ РАЗВЕРТЫВАНИЯ NORMAL DANCE НА REG.RU"

    # Создание директории для отчетов
    mkdir -p ../reports

    # Основные тесты
    test_ssh_access
    test_network_access
    test_server_services
    test_database
    test_application
    test_performance
    test_security

    generate_test_report

    log "🎉 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО"
    echo ""
    echo "📋 Результаты тестирования:"
    echo "• Доступ к серверу: $(if ssh -o ConnectTimeout=5 -o BatchMode=yes ${SSH_USER}@${SERVER_IP} 'echo OK' 2>/dev/null; then echo '✅ Работает'; else echo '❌ Не работает'; fi)"
    echo "• Домены: $(for domain in "${TEST_DOMAINS[@]}"; do echo -n "${domain} "; done)"
    echo "• Сервисы: $(if ${SSH_CMD} "sudo systemctl is-active nginx mysql" 2>/dev/null; then echo '✅ Работают'; else echo '❌ Проблемы'; fi)"
    echo "• База данных: $(if ${SSH_CMD} "mysql -h localhost -u u3284463_default -p[ПАРОЛЬ_БД] -e 'SELECT 1'" 2>/dev/null; then echo '✅ Доступна'; else echo '❌ Недоступна'; fi)"
    echo ""
    echo "📊 Подробный отчет в файле: reports/$(ls -t ../reports/regru-deployment-test-*.md 2>/dev/null | head -1)"
}

# Запуск
main "$@"