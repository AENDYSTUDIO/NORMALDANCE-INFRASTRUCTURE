#!/bin/bash

echo "🔒 Настройка SSL сертификатов для доменов normaldance.ru и normaldance.online..."

# Установка Certbot если не установлен
if ! command -v certbot &> /dev/null; then
    echo "📦 Установка Certbot..."
    apt install -y certbot python3-certbot-nginx
fi

# Создание улучшенной конфигурации Nginx для SSL
cat > /etc/nginx/sites-available/normaldance.ru << 'EOF'
server {
    listen 80;
    server_name normaldance.ru www.normaldance.ru;
    root /var/www/normaldance.ru;
    client_max_body_size 100M;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Перенаправление на HTTPS (после получения сертификата)
    # return 301 https://$server_name$request_uri;

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
        proxy_cache_bypass $http_upgrade;

        # Таймауты
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

        # Безопасность API
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Статические файлы Next.js
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Robots-Tag "noindex";
    }

    # Health check для мониторинга
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Важно для Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
        access_log off;
        log_not_found off;
    }

    # Логи
    error_log /var/log/nginx/normaldance.ru_error.log;
    access_log /var/log/nginx/normaldance.ru_access.log;
}

# HTTP to HTTPS redirect для www
server {
    listen 80;
    server_name www.normaldance.ru;
    return 301 $scheme://normaldance.ru$request_uri;
}

# HTTPS сервер (активируется после получения сертификата)
# server {
#     listen 443 ssl http2;
#     server_name normaldance.ru www.normaldance.ru;
#
#     ssl_certificate /etc/letsencrypt/live/normaldance.ru/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/normaldance.ru/privkey.pem;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#
#     # Остальные настройки...
# }
EOF

# Создание директории для Let's Encrypt challenge
mkdir -p /var/www/html/.well-known/acme-challenge

# Создание конфигурации для normaldance.online
cat > /etc/nginx/sites-available/normaldance.online << 'EOF'
server {
    listen 80;
    server_name normaldance.online www.normaldance.online;

    # Перенаправление на основной домен
    return 301 https://normaldance.ru$request_uri;

    # Важно для Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Активация сайтов
ln -sf /etc/nginx/sites-available/normaldance.ru /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/normaldance.online /etc/nginx/sites-enabled/

# Удаление дефолтного сайта
rm -f /etc/nginx/sites-enabled/default

# Тестирование конфигурации
echo "🔍 Тестирование конфигурации Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Конфигурация Nginx корректна"
    systemctl reload nginx
    echo "✅ Nginx перезапущен"
else
    echo "❌ Ошибка в конфигурации Nginx"
    exit 1
fi

echo ""
echo "📋 НЕОБХОДИМЫЕ ДЕЙСТВИЯ ДЛЯ ПОЛУЧЕНИЯ SSL:"
echo ""
echo "1️⃣ В ПАНЕЛИ REG.RU НАСТРОИТЬ DNS ЗАПИСИ:"
echo "   normaldance.ru A → 89.104.67.165"
echo "   www.normaldance.ru A → 89.104.67.165"
echo "   normaldance.online A → 89.104.67.165"
echo ""
echo "2️⃣ ПОСЛЕ НАСТРОЙКИ DNS (5-30 МИНУТ) ЗАПУСТИТЬ:"
echo "   certbot --nginx -d normaldance.ru -d www.normaldance.ru"
echo ""
echo "3️⃣ АКТИВИРОВАТЬ HTTPS ПЕРЕНАПРАВЛЕНИЕ:"
echo "   В файле /etc/nginx/sites-available/normaldance.ru"
echo "   Раскомментировать строку: return 301 https://$server_name$request_uri;"
echo ""
echo "✅ Nginx готов для получения SSL сертификатов!"