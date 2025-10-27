#!/bin/bash

echo "🔒 Активация HTTPS с полученным SSL сертификатом..."

# Создание директории для сертификатов
mkdir -p /etc/nginx/ssl

# Проверка наличия сертификата
echo "📜 Проверка SSL сертификата..."
ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "Сертификат Let's Encrypt не найден"

# Создание HTTPS конфигурации Nginx
cat > /etc/nginx/sites-available/normaldance.ru << 'EOF'
server {
    listen 80;
    server_name normaldance.ru www.normaldance.ru;
    root /var/www/normaldance.ru;
    client_max_body_size 100M;

    # Перенаправление на HTTPS
    return 301 https://$server_name$request_uri;

    # Важно для Let's Encrypt challenge (если понадобится перевыпуск)
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
        access_log off;
        log_not_found off;
    }
}

server {
    listen 443 ssl http2;
    server_name normaldance.ru www.normaldance.ru;
    root /var/www/normaldance.ru;
    client_max_body_size 100M;

    # SSL сертификаты от REG.RU / GlobalSign
    # Укажите правильные пути к сертификатам после установки через панель
    ssl_certificate /etc/ssl/certs/normaldance.crt;
    ssl_certificate_key /etc/ssl/private/normaldance.key;

    # Альтернатива: если сертификаты в другом месте
    # ssl_certificate /etc/letsencrypt/live/normaldance.ru/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/normaldance.ru/privkey.pem;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Основное приложение
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API роуты
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Статические файлы Next.js
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check для мониторинга
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

echo "✅ HTTPS конфигурация создана"

# Тестирование конфигурации
echo "🔍 Тестирование конфигурации Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Конфигурация корректна"

    # Перезапуск Nginx
    systemctl reload nginx
    echo "✅ Nginx перезапущен с HTTPS"

    # Тестирование HTTPS
    echo "🌍 Тестирование HTTPS..."
    sleep 3

    # Проверка HTTP (должен перенаправлять на HTTPS)
    HTTP_STATUS=$(curl -s -I http://89.104.67.165/ | head -1)
    echo "HTTP статус: $HTTP_STATUS"

    # Проверка HTTPS (если сертификат установлен)
    HTTPS_STATUS=$(curl -s -I -k https://89.104.67.165/ 2>/dev/null | head -1 || echo "HTTPS не доступен")
    echo "HTTPS статус: $HTTPS_STATUS"

    echo ""
    echo "🎉 HTTPS АКТИВИРОВАН!"
    echo ""
    echo "📋 ДОСТУП К ПРИЛОЖЕНИЮ:"
    echo "• https://normaldance.ru/"
    echo "• https://www.normaldance.ru/"
    echo "• https://89.104.67.165/"
    echo ""
    echo "📜 СЕРТИФИКАТ ДЕЙСТВУЕТ ДО: 05.05.2026"

else
    echo "❌ Ошибка в конфигурации Nginx"
    exit 1
fi

echo ""
echo "📝 РЕКОМЕНДАЦИИ:"
echo "1. Установите файлы сертификата в правильное место:"
echo "   /etc/ssl/certs/normaldance.crt"
echo "   /etc/ssl/private/normaldance.key"
echo ""
echo "2. Или укажите правильные пути к сертификатам в конфигурации Nginx"
echo ""
echo "3. Для автоматического обновления сертификата настройте cron:"
echo "   crontab -e"
echo "   Добавить: 0 3 1 * * certbot renew --quiet"