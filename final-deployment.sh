#!/bin/bash

echo "🎯 Финальная проверка развертывания NORMAL DANCE..."
echo ""

# Проверка доступности сервисов
echo "🔍 Проверка доступности сервисов:"

# 1. Проверка Nginx
echo "🌐 Проверка Nginx:"
if systemctl is-active nginx >/dev/null 2>&1; then
    echo "✅ Nginx работает"
    curl -f -s http://localhost/health >/dev/null && echo "✅ Health check доступен" || echo "❌ Health check недоступен"
else
    echo "❌ Nginx не работает"
fi

# 2. Проверка приложения
echo ""
echo "🚀 Проверка приложения:"
if pm2 list | grep -q "normaldance"; then
    echo "✅ Приложение работает через PM2"
    curl -f -s http://localhost:3000/api/health >/dev/null && echo "✅ API health доступен" || echo "❌ API health недоступен"
else
    echo "❌ Приложение не найдено в PM2"
fi

# 3. Проверка базы данных
echo ""
echo "🗄️ Проверка базы данных:"
if mysql -u normaldance -pulT85qn6UU6dYzEv -e "SELECT 1;" normaldance >/dev/null 2>&1; then
    echo "✅ База данных доступна"
    DB_COUNT=$(mysql -u normaldance -pulT85qn6UU6dYzEv -e "SHOW DATABASES;" normaldance | grep -c normaldance)
    echo "✅ Базы данных: $DB_COUNT найдено"
else
    echo "❌ Проблемы с подключением к базе данных"
fi

# 4. Проверка системных ресурсов
echo ""
echo "📊 Проверка системных ресурсов:"
echo "💾 Диск: $(df -h / | awk 'NR==2 {print $5}') использовано"
echo "🧠 Память: $(free -h | awk 'NR==2 {print $3 "/" $2}')"
echo "⚡ Загрузка: $(uptime | awk -F'load average:' '{print $2}')"

# 5. Проверка портов
echo ""
echo "🔌 Проверка портов:"
netstat -tlnp | grep -E ":(80|3000|3306)" || echo "❌ Не все необходимые порты прослушиваются"

# 6. Проверка логов
echo ""
echo "📄 Проверка логов:"
echo "Ошибки Nginx: $(tail -n 5 /var/log/nginx/normaldance_error.log 2>/dev/null | wc -l) строк"
echo "Ошибки приложения: $(tail -n 5 /var/www/normaldance.ru/logs/err.log 2>/dev/null | wc -l) строк"

# Создание мониторингового скрипта
cat > /root/monitor-normaldance.sh << 'EOF'
#!/bin/bash
# Мониторинг NORMAL DANCE

LOG_FILE="/var/log/normaldance-monitor.log"

echo "$(date): 🔍 Мониторинг NORMAL DANCE" >> "$LOG_FILE"

# Проверка Nginx
if systemctl is-active nginx >/dev/null; then
    echo "$(date): ✅ Nginx работает" >> "$LOG_FILE"
else
    echo "$(date): ❌ Nginx не работает, перезапуск..." >> "$LOG_FILE"
    systemctl restart nginx
fi

# Проверка приложения
if pm2 list | grep -q "normaldance.*online"; then
    echo "$(date): ✅ Приложение работает" >> "$LOG_FILE"
else
    echo "$(date): ❌ Приложение не отвечает, перезапуск..." >> "$LOG_FILE"
    pm2 restart normaldance
fi

# Проверка базы данных
if mysql -u normaldance -pulT85qn6UU6dYzEv -e "SELECT 1;" normaldance >/dev/null 2>&1; then
    echo "$(date): ✅ База данных доступна" >> "$LOG_FILE"
else
    echo "$(date): ❌ База данных недоступна" >> "$LOG_FILE"
fi

# Использование ресурсов
echo "$(date): 📊 Ресурсы: Диск=$(df / | awk 'NR==2 {print $5}'), Память=$(free | awk 'NR==2 {print $3/$2*100}' | cut -d. -f1)%" >> "$LOG_FILE"
EOF

chmod +x /root/monitor-normaldance.sh

# Настройка cron для мониторинга
crontab -l | grep -v "monitor-normaldance" | crontab -
(crontab -l 2>/dev/null; echo "* * * * * /root/monitor-normaldance.sh") | crontab -

echo ""
echo "🎉 РАЗВЕРТЫВАНИЕ NORMAL DANCE ЗАВЕРШЕНО!"
echo ""
echo "📋 ДОСТУП К ПРИЛОЖЕНИЮ:"
echo "• http://89.104.67.165/"
echo "• http://89.104.67.165/api/health"
echo ""
echo "🔧 УПРАВЛЕНИЕ:"
echo "• Статус: pm2 status"
echo "• Логи: pm2 logs normaldance"
echo "• Перезапуск: pm2 restart normaldance"
echo "• Мониторинг: tail -f /var/log/normaldance-monitor.log"
echo ""
echo "📊 РЕСУРСЫ СЕРВЕРА:"
echo "• Диск: df -h"
echo "• Память: free -h"
echo "• Процессы: htop"
echo ""
echo "✅ DEPLOYMENT COMPLETE!"