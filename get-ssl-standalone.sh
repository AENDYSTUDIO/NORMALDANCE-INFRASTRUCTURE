#!/bin/bash

echo "🔒 Получение SSL сертификата через standalone режим..."

# Остановка Nginx для освобождения порта 80
echo "🛑 Остановка Nginx..."
systemctl stop nginx

# Ожидание освобождения порта
sleep 3

# Получение SSL сертификата в standalone режиме
echo "📜 Получение сертификата..."
certbot certonly \
    --standalone \
    -d normaldance.ru \
    -d www.normaldance.ru \
    --agree-tos \
    --register-unsafely-without-email \
    --non-interactive \
    --force-renewal

if [ $? -eq 0 ]; then
    echo "✅ SSL сертификат получен!"

    # Создание HTTPS конфигурации
    cat > /etc/nginx/sites-available/normaldance.ru << 'EOF'
server {
    listen 80;
    server_name normaldance.ru www.normaldance.ru;
    root /var/www/normaldance.ru;
    client_max_body_size 100M;

    # Перенаправление на HTTPS
    return 301 https://$server_name$request_uri;

    # Важно для Let's Encrypt challenge
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

    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/normaldance.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/normaldance.ru/privkey.pem;
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

    # Запуск Nginx
    echo "🚀 Запуск Nginx с HTTPS..."
    nginx -t && systemctl start nginx

    if [ $? -eq 0 ]; then
        echo "✅ HTTPS настроен и работает!"
        echo ""
        echo "🌍 ДОСТУП К ПРИЛОЖЕНИЮ:"
        echo "• https://normaldance.ru/"
        echo "• https://www.normaldance.ru/"
        echo ""
        echo "📋 ПРОВЕРКА СЕРТИФИКАТА:"
        echo "• https://normaldance.ru/api/health"
        echo ""
        echo "🎉 SSL РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!"
    else
        echo "❌ Ошибка запуска Nginx"
        systemctl start nginx
    fi

else
    echo "❌ Не удалось получить SSL сертификат"
    # Запуск Nginx обратно
    systemctl start nginx
fi

# Проверка сертификата
echo ""
echo "📜 ИНФОРМАЦИЯ О СЕРТИФИКАТЕ:"
ls -la /etc/letsencrypt/live/normaldance.ru/ 2>/dev/null || echo "Сертификат не найден"

echo ""
echo "📅 АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ СЕРТИФИКАТА:"
echo "certbot renew --dry-run"