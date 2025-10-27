#!/bin/bash

echo "🔧 Исправление upstream конфигурации Nginx..."

# Исправление конфигурации Nginx
cat > /etc/nginx/sites-available/normaldance.ru << 'EOF'
upstream normaldance_backend {
    server 127.0.0.1:3000;
    # Альтернатива: server localhost:3000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name normaldance.ru www.normaldance.ru 89.104.67.165;
    root /var/www/normaldance.ru;
    client_max_body_size 100M;

    # Перенаправление HTTP на HTTPS
    return 301 https://$server_name$request_uri;

    # Важно для Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
        access_log off;
        log_not_found off;
        try_files $uri =404;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name normaldance.ru www.normaldance.ru 89.104.67.165;
    root /var/www/normaldance.ru;
    client_max_body_size 100M;

    # SSL сертификаты
    ssl_certificate /etc/ssl/certs/normaldance.crt;
    ssl_certificate_key /etc/ssl/private/normaldance.key;

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
        proxy_pass http://normaldance_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Health check
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
    }

    # API роуты
    location /api/ {
        proxy_pass http://normaldance_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check для мониторинга
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# HTTP сервер для IPv6
server {
    listen [::]:80;
    server_name normaldance.ru www.normaldance.ru;
    return 301 https://$server_name$request_uri;
}

# HTTPS сервер для IPv6
server {
    listen [::]:443 ssl http2;
    server_name normaldance.ru www.normaldance.ru;

    ssl_certificate /etc/ssl/certs/normaldance.crt;
    ssl_certificate_key /etc/ssl/private/normaldance.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Тестирование конфигурации
echo "🔍 Тестирование конфигурации Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Конфигурация корректна"

    # Перезапуск Nginx
    systemctl reload nginx
    echo "✅ Nginx перезапущен"

    # Тестирование upstream подключения
    echo "🧪 Тестирование upstream подключения..."
    sleep 3

    # Тест локального подключения
    curl -s http://localhost:3000/api/health >/dev/null && echo "✅ Локальное подключение работает" || echo "❌ Локальное подключение не работает"

    # Тест через Nginx
    curl -s http://localhost/api/health >/dev/null && echo "✅ Nginx upstream работает" || echo "❌ Nginx upstream не работает"

    echo ""
    echo "🎯 ТЕСТИРОВАНИЕ ВНЕШНЕГО ДОСТУПА:"

    # Тест HTTPS через IP
    echo "🌍 HTTPS API через IP:"
    curl -s -k https://89.104.67.165/api/health

    echo ""
    echo ""
    echo "📋 ЕСЛИ САЙТ НЕ РАБОТАЕТ ЧЕРЕЗ ДОМЕН:"
    echo "1. Проверьте DNS: nslookup normaldance.ru"
    echo "2. Убедитесь что IP в панели REG.RU = 89.104.67.165"
    echo "3. Подождите 5-30 минут для распространения DNS"

else
    echo "❌ Ошибка в конфигурации Nginx"
    nginx -t
fi

echo ""
echo "🎉 NGINX ИСПРАВЛЕН И ГОТОВ К РАБОТЕ!"