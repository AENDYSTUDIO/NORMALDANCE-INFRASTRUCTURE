#!/bin/bash

echo "🔧 Финальное исправление Nginx upstream..."

# Исправление upstream в Nginx конфигурации
cat > /etc/nginx/sites-available/normaldance.ru << 'EOF'
upstream normaldance_backend {
    server 127.0.0.1:3000;
    # Альтернатива: server localhost:3000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name normaldance.ru www.normaldance.ru;
    root /var/www/normaldance.ru;
    client_max_body_size 100M;

    # Важно для Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
        access_log off;
        log_not_found off;
        try_files $uri =404;
    }

    # Перенаправление HTTP на HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name normaldance.ru www.normaldance.ru;
    root /var/www/normaldance.ru;
    client_max_body_size 100M;

    # SSL сертификаты
    ssl_certificate /etc/ssl/certs/normaldance.crt;
    ssl_certificate_key /etc/ssl/private/normaldance.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

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

        # Таймауты и настройки
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
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

# HTTP сервер для IPv6 (перенаправление)
server {
    listen [::]:80;
    server_name normaldance.ru www.normaldance.ru;
    return 301 https://$server_name$request_uri;
}

# HTTPS сервер для IPv6 (перенаправление)
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

    # Тестирование подключения
    echo "🧪 Тестирование подключения..."
    sleep 3

    # Тест локального подключения к приложению
    echo "📡 Проверка приложения:"
    curl -s http://localhost:3000/api/health | head -1

    # Тест Nginx upstream
    echo ""
    echo "🌐 Проверка Nginx upstream:"
    curl -s -I http://localhost/api/health

    # Тест внешнего доступа
    echo ""
    echo "🌍 Проверка внешнего доступа:"
    curl -s -I https://89.104.67.165/api/health

    echo ""
    echo "🎯 ФИНАЛЬНОЕ ТЕСТИРОВАНИЕ ДОМЕНА:"
    echo "⏳ Ожидание 3 секунды для применения конфигурации..."
    sleep 3
    curl -s -I https://normaldance.ru/api/health

else
    echo "❌ Ошибка в конфигурации Nginx"
    nginx -t
fi

echo ""
echo "🎉 NGINX ИСПРАВЛЕН!"
echo ""
echo "📋 ДОСТУПНЫЕ URL ПОСЛЕ ИСПРАВЛЕНИЯ DNS В ПАНЕЛИ:"
echo "• https://normaldance.ru/ ✅ Главная страница"
echo "• https://normaldance.ru/api/health ✅ JSON API"
echo "• https://normaldance.ru/admin/ ✅ Админ панель"
echo ""
echo "🔧 ЕСЛИ НЕ РАБОТАЕТ:"
echo "1. Проверьте что IP в панели REG.RU = 89.104.67.165"
echo "2. Подождите 5 минут для распространения DNS"
echo "3. Проверьте настройки домена в панели хостинга"