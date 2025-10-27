#!/bin/bash

# 📊 NORMAL DANCE - Мониторинг REG.RU сервера
# Использование: ./monitoring/regru-server-monitoring.sh

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
LOG_FILE="/var/www/${SSH_USER}/logs/monitoring.log"
ALERT_FILE="/var/www/${SSH_USER}/logs/alerts.log"

# Пороговые значения для алертов
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
LOAD_THRESHOLD=4.0

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $*${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" >> "${LOG_FILE}"
}

success() {
    echo -e "${GREEN}✅ $*${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $*${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $*" >> "${ALERT_FILE}"
}

error() {
    echo -e "${RED}❌ $*${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >> "${ALERT_FILE}"
}

alert() {
    echo -e "${PURPLE}🚨 $*${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ALERT: $*" >> "${ALERT_FILE}"
}

# Проверка SSH доступа
check_ssh() {
    log "🔐 Проверка SSH доступа..."

    if ssh -o ConnectTimeout=10 -o BatchMode=yes ${SSH_USER}@${SERVER_IP} "echo 'SSH OK'" 2>/dev/null; then
        success "SSH доступ работает"
        SSH_CMD="ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_IP}"
        return 0
    else
        error "SSH доступ не работает"
        return 1
    fi
}

# Мониторинг системных ресурсов
monitor_system_resources() {
    log "🖥️ Мониторинг системных ресурсов..."

    # Загрузка CPU
    CPU_USAGE=$(${SSH_CMD} "top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\([0-9.]*\)%* id.*/\1/' | awk '{print 100 - \$1}'" 2>/dev/null)

    if [[ -n "${CPU_USAGE}" ]]; then
        log "CPU: ${CPU_USAGE}%"

        if (( $(echo "${CPU_USAGE} > ${CPU_THRESHOLD}" | bc -l) )); then
            alert "Высокая загрузка CPU: ${CPU_USAGE}%"
        else
            success "CPU в норме: ${CPU_USAGE}%"
        fi
    fi

    # Использование памяти
    MEMORY_INFO=$(${SSH_CMD} "free | grep Mem" 2>/dev/null)
    if [[ -n "${MEMORY_INFO}" ]]; then
        MEMORY_USED=$(echo "${MEMORY_INFO}" | awk '{printf "%.0f", $3/$2 * 100.0}')
        log "Память: ${MEMORY_USED}%"

        if (( MEMORY_USED > MEMORY_THRESHOLD )); then
            alert "Высокое использование памяти: ${MEMORY_USED}%"
        else
            success "Память в норме: ${MEMORY_USED}%"
        fi
    fi

    # Использование диска
    DISK_USAGE=$(${SSH_CMD} "df / | tail -1 | awk '{print \$5}' | sed 's/%//'" 2>/dev/null)
    if [[ -n "${DISK_USAGE}" ]]; then
        log "Диск: ${DISK_USAGE}%"

        if (( DISK_USAGE > DISK_THRESHOLD )); then
            alert "Мало места на диске: ${DISK_USAGE}%"
        else
            success "Диск в норме: ${DISK_USAGE}%"
        fi
    fi

    # Средняя нагрузка
    LOAD_AVERAGE=$(${SSH_CMD} "uptime | awk -F'load average:' '{print \$2}' | awk -F',' '{print \$1}'" 2>/dev/null)
    if [[ -n "${LOAD_AVERAGE}" ]]; then
        log "Средняя нагрузка: ${LOAD_AVERAGE}"

        if (( $(echo "${LOAD_AVERAGE} > ${LOAD_THRESHOLD}" | bc -l) )); then
            alert "Высокая средняя нагрузка: ${LOAD_AVERAGE}"
        else
            success "Нагрузка в норме: ${LOAD_AVERAGE}"
        fi
    fi
}

# Мониторинг сервисов
monitor_services() {
    log "🔧 Мониторинг сервисов..."

    # Проверка Nginx
    if ${SSH_CMD} "sudo systemctl is-active nginx" 2>/dev/null; then
        success "Nginx работает"
    else
        error "Nginx не работает"
    fi

    # Проверка MySQL
    if ${SSH_CMD} "sudo systemctl is-active mysql" 2>/dev/null; then
        success "MySQL работает"
    else
        error "MySQL не работает"
    fi

    # Проверка PM2 и приложения
    if ${SSH_CMD} "pm2 list | grep normaldance" 2>/dev/null; then
        success "Приложение работает через PM2"
    else
        error "Приложение не работает"
    fi

    # Проверка портов
    if ${SSH_CMD} "netstat -tlnp | grep :80" 2>/dev/null; then
        success "Порт 80 (HTTP) открыт"
    else
        warning "Порт 80 не прослушивается"
    fi

    if ${SSH_CMD} "netstat -tlnp | grep :3000" 2>/dev/null; then
        success "Порт 3000 (приложение) открыт"
    else
        warning "Порт 3000 не прослушивается"
    fi
}

# Мониторинг веб-сайта
monitor_website() {
    log "🌐 Мониторинг веб-сайта..."

    local domains=("normaldance.ru" "www.normaldance.ru")

    for domain in "${domains[@]}"; do
        log "Проверка домена: ${domain}"

        # Проверка HTTP ответа
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://${domain}" 2>/dev/null || echo "000")

        if [[ "${HTTP_STATUS}" == "200" ]]; then
            success "Домен ${domain} отвечает: HTTP ${HTTP_STATUS}"
        elif [[ "${HTTP_STATUS}" == "301" ]] || [[ "${HTTP_STATUS}" == "302" ]]; then
            success "Домен ${domain} перенаправляет: HTTP ${HTTP_STATUS}"
        else
            error "Домен ${domain} недоступен: HTTP ${HTTP_STATUS}"
        fi

        # Проверка HTTPS (если настроен)
        HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -k --max-time 10 "https://${domain}" 2>/dev/null || echo "000")

        if [[ "${HTTPS_STATUS}" == "200" ]]; then
            success "HTTPS для ${domain} работает: ${HTTPS_STATUS}"
        elif [[ "${HTTP_STATUS}" != "000" ]]; then
            warning "HTTPS для ${domain} недоступен: ${HTTPS_STATUS}"
        fi

        # Проверка времени ответа
        RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "http://${domain}" 2>/dev/null || echo "0")

        if (( $(echo "${RESPONSE_TIME} < 3.0" | bc -l) )); then
            success "Время ответа для ${domain}: ${RESPONSE_TIME}s"
        else
            warning "Высокое время ответа для ${domain}: ${RESPONSE_TIME}s"
        fi
    done
}

# Мониторинг базы данных
monitor_database() {
    log "🗄️ Мониторинг базы данных..."

    # Проверка подключения
    if ${SSH_CMD} "mysql -h localhost -u u3284463_default -p[ПАРОЛЬ_БД] u3284463_default -e 'SELECT 1'" 2>/dev/null; then
        success "База данных доступна"
    else
        error "База данных недоступна"
    fi

    # Проверка активных соединений
    CONNECTIONS=$(${SSH_CMD} "mysql -h localhost -u u3284463_default -p[ПАРОЛЬ_БД] -e 'SHOW PROCESSLIST' 2>/dev/null | wc -l" 2>/dev/null || echo "0")

    if [[ "${CONNECTIONS}" -lt "50" ]]; then
        success "Соединений с БД: ${CONNECTIONS}"
    else
        warning "Много соединений с БД: ${CONNECTIONS}"
    fi

    # Проверка размера базы данных
    DB_SIZE=$(${SSH_CMD} "du -sb /var/lib/mysql/u3284463_default 2>/dev/null | cut -f1" 2>/dev/null || echo "0")
    DB_SIZE_MB=$(( DB_SIZE / 1024 / 1024 ))

    log "Размер базы данных: ${DB_SIZE_MB} MB"

    if [[ "${DB_SIZE_MB}" -lt "1000" ]]; then
        success "Размер БД в норме: ${DB_SIZE_MB} MB"
    else
        warning "Большой размер БД: ${DB_SIZE_MB} MB"
    fi
}

# Мониторинг логов приложения
monitor_logs() {
    log "📝 Мониторинг логов приложения..."

    # Создание директории для логов если не существует
    ${SSH_CMD} "mkdir -p /var/www/${SSH_USER}/logs"

    # Проверка размера лог файлов
    LOG_SIZE=$(${SSH_CMD} "du -sb /var/www/${SSH_USER}/data/www/normaldance.ru/logs/ 2>/dev/null | cut -f1" 2>/dev/null || echo "0")
    LOG_SIZE_MB=$(( LOG_SIZE / 1024 / 1024 ))

    log "Размер логов приложения: ${LOG_SIZE_MB} MB"

    # Поиск ошибок в логах за последний час
    ERROR_COUNT=$(${SSH_CMD} "tail -n 1000 /var/www/${SSH_USER}/data/www/normaldance.ru/logs/combined.log | grep -i error | wc -l" 2>/dev/null || echo "0")

    if [[ "${ERROR_COUNT}" -eq "0" ]]; then
        success "Ошибок в логах не найдено"
    elif [[ "${ERROR_COUNT}" -lt "10" ]]; then
        warning "Найдено ${ERROR_COUNT} ошибок в логах"
    else
        error "Много ошибок в логах: ${ERROR_COUNT}"
    fi

    # Проверка критических ошибок
    CRITICAL_ERRORS=$(${SSH_CMD} "tail -n 100 /var/www/${SSH_USER}/data/www/normaldance.ru/logs/err.log | grep -c 'CRITICAL\|FATAL\|ERROR'" 2>/dev/null || echo "0")

    if [[ "${CRITICAL_ERRORS}" -eq "0" ]]; then
        success "Критических ошибок не найдено"
    else
        alert "Найдено ${CRITICAL_ERRORS} критических ошибок"
    fi
}

# Мониторинг безопасности
monitor_security() {
    log "🔒 Мониторинг безопасности..."

    # Проверка fail2ban
    if ${SSH_CMD} "sudo fail2ban-client status ssh" 2>/dev/null; then
        BANNED_COUNT=$(${SSH_CMD} "sudo fail2ban-client status ssh | grep 'Currently failed' | awk '{print \$NF}'" 2>/dev/null || echo "0")

        if [[ "${BANNED_COUNT}" -eq "0" ]]; then
            success "Fail2ban: заблокированных IP нет"
        else
            warning "Fail2ban: заблокировано ${BANNED_COUNT} IP"
        fi
    fi

    # Проверка подозрительной активности в логах
    SUSPICIOUS=$(${SSH_CMD} "tail -n 1000 /var/log/nginx/normaldance.ru_access.log | grep -c 'SELECT\|UNION\|script\|javascript'" 2>/dev/null || echo "0")

    if [[ "${SUSPICIOUS}" -eq "0" ]]; then
        success "Подозрительной активности не обнаружено"
    else
        warning "Обнаружена подозрительная активность: ${SUSPICIOUS} запросов"
    fi

    # Проверка прав доступа к файлам
    PERM_ISSUES=$(${SSH_CMD} "find /var/www/${SSH_USER}/data/www/normaldance.ru -type f -perm 777 2>/dev/null | wc -l" 2>/dev/null || echo "0")

    if [[ "${PERM_ISSUES}" -eq "0" ]]; then
        success "Прав доступа в норме"
    else
        warning "Найдено файлов с правами 777: ${PERM_ISSUES}"
    fi
}

# Генерация отчета
generate_report() {
    log "📊 Генерация отчета мониторинга..."

    local report_file="server-monitoring-$(date +%Y%m%d-%H%M%S).md"

    cat > "../reports/${report_file}" << EOF
# 📊 Отчет мониторинга сервера NORMAL DANCE

## Общая информация
- **Дата мониторинга**: $(date)
- **Сервер**: ${SERVER_IP}
- **Пользователь**: ${SSH_USER}

## Системные ресурсы
$(uptime)

**Использование диска:**
$(df -h)

**Использование памяти:**
$(free -h)

## Сервисы
$(systemctl is-active nginx mysql 2>/dev/null || echo "Не удалось проверить статус сервисов")

## Процессы приложения
$(pm2 list 2>/dev/null || echo "PM2 недоступен")

## Сетевые соединения
$(netstat -tlnp | grep -E ':(80|3000|3306)' || echo "Не удалось проверить порты")

## Логи приложения
**Размер логов:** $(du -sh /var/www/${SSH_USER}/data/www/normaldance.ru/logs/ 2>/dev/null || echo "Неизвестен")

**Последние ошибки:**
$(tail -n 5 /var/www/${SSH_USER}/data/www/normaldance.ru/logs/err.log 2>/dev/null || echo "Логи недоступны")

## База данных
**Размер базы:** $(du -sb /var/lib/mysql/u3284463_default 2>/dev/null | cut -f1 || echo "Неизвестен") байт

**Активные соединения:** $(mysql -h localhost -u u3284463_default -p[ПАРОЛЬ_БД] -e 'SHOW PROCESSLIST' 2>/dev/null | wc -l || echo "Неизвестно")

## Безопасность
**Fail2ban статус:**
$(fail2ban-client status ssh 2>/dev/null || echo "Fail2ban недоступен")

## Рекомендации

$(if [[ -s "${ALERT_FILE}" ]]; then
    echo "### ⚠️ Требует внимания:"
    echo "$(tail -n 10 "${ALERT_FILE}")"
else
    echo "### ✅ Все в норме"
fi)

## Следующие шаги
1. Проверьте алерты выше
2. Очистите старые логи если нужно
3. Обновите резервные копии
4. Проверьте мониторинг в панели управления

---
*Отчет сгенерирован автоматически скриптом мониторинга*
EOF

    success "Отчет сохранен: reports/${report_file}"
}

# Отправка уведомлений
send_notifications() {
    log "📢 Отправка уведомлений..."

    if [[ -s "${ALERT_FILE}" ]]; then
        # Здесь можно добавить отправку уведомлений в Slack/Telegram
        warning "Найдены алерты для отправки"

        # Пример отправки в Slack
        # curl -X POST -H 'Content-type: application/json' \
        #     --data '{"text":"Сервер NORMAL DANCE: найдены алерты"}' \
        #     "${SLACK_WEBHOOK}"
    else
        success "Алертов для отправки нет"
    fi
}

# Основная функция
main() {
    log "🚀 НАЧАЛО МОНИТОРИНГА СЕРВЕРА NORMAL DANCE"

    # Создание директорий для логов
    ${SSH_CMD} "mkdir -p /var/www/${SSH_USER}/logs" || warning "Не удалось создать директории для логов"

    # Основные проверки
    if check_ssh; then
        monitor_system_resources
        monitor_services
        monitor_website
        monitor_database
        monitor_logs
        monitor_security

        generate_report
        send_notifications

        log "🎉 МОНИТОРИНГ ЗАВЕРШЕН"
    else
        error "Не удалось подключиться к серверу для мониторинга"
    fi
}

# Обработка сигналов
cleanup() {
    log "🛑 Получен сигнал завершения мониторинга"
    exit 0
}

trap cleanup SIGTERM SIGINT

# Запуск
main "$@"