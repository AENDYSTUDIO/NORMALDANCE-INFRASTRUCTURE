#!/bin/bash

echo "🔍 Проверка текущего состояния сайта..."

# Проверка приложения на сервере 89.104.67.165
echo "🖥️ Проверка сервера 89.104.67.165:"
echo "PM2 статус:"
pm2 status | grep normaldance

echo ""
echo "Локальная проверка API:"
curl -s http://localhost:3000/api/health | head -1

echo ""
echo "Локальная проверка HTTPS:"
curl -s -k https://89.104.67.165/api/health | head -1

# Проверка сервера 31.31.196.214 (основной сервер REG.RU)
echo ""
echo "🌐 Проверка сервера 31.31.196.214:"
echo "Проверка доступности портов:"
timeout 5 bash -c "</dev/tcp/31.31.196.214/80" && echo "✅ Порт 80 открыт" || echo "❌ Порт 80 закрыт"
timeout 5 bash -c "</dev/tcp/31.31.196.214/443" && echo "✅ Порт 443 открыт" || echo "❌ Порт 443 закрыт"

# Проверка Nginx конфигурации
echo ""
echo "⚙️ Проверка конфигурации Nginx:"
nginx -t

# Проверка логов Nginx
echo ""
echo "📄 Последние ошибки Nginx:"
tail -n 5 /var/log/nginx/normaldance_error.log 2>/dev/null || echo "Логи не найдены"

echo ""
echo "🔧 РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ:"

echo ""
echo "1️⃣ В ПАНЕЛИ REG.RU ИЗМЕНИТЕ IP АДРЕС:"
echo "   Текущий: 31.31.196.214"
echo "   Должен быть: 89.104.67.165"

echo ""
echo "2️⃣ ДОБАВЬТЕ ИНДЕКСНЫЕ ФАЙЛЫ:"
echo "   index.html, index.php"

echo ""
echo "3️⃣ ПРОВЕРЬТЕ ДОСТУПНОСТЬ ПОСЛЕ ИЗМЕНЕНИЙ:"
echo "   curl -I https://normaldance.ru/"

echo ""
echo "4️⃣ ЕСЛИ НЕ РАБОТАЕТ, ПРОВЕРЬТЕ DNS:"
echo "   nslookup normaldance.ru"

echo ""
echo "📞 ПОДДЕРЖКА REG.RU:"
echo "   Телефон: +7 (495) 580-11-11"
echo "   Email: support@reg.ru"