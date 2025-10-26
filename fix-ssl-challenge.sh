#!/bin/bash

echo "🔧 Исправление Nginx для Let's Encrypt challenge..."

# Исправление конфигурации Nginx для поддержки HTTP challenge
cat > /etc/nginx/sites-available/normaldance.ru << 'EOF'
server {
    listen 80;
    server_name normaldance.ru www.normaldance.ru;
    root /var/www/normaldance.ru;
    client_max_body_size 100M;

    # Важно: Запросы к .well-known должны обрабатываться ДО остальных правил
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
        access_log off;
        log_not_found off;
        try_files $uri =404;
    }

    # Перенаправление на HTTPS (исключая .well-known)
    location / {
        # return 301 https://$server_name$request_uri;
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

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

# Тестирование конфигурации
echo "🔍 Тестирование конфигурации Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Конфигурация корректна"
    systemctl reload nginx
    echo "✅ Nginx перезапущен"

    # Тестирование .well-known пути
    echo "🧪 Тестирование .well-known пути..."
    mkdir -p /var/www/html/.well-known/acme-challenge
    echo "test-content-$(date +%s)" > /var/www/html/.well-known/acme-challenge/test.txt

    sleep 2
    TEST_RESPONSE=$(curl -s http://localhost/.well-known/acme-challenge/test.txt)
    if [[ $TEST_RESPONSE == *"test-content"* ]]; then
        echo "✅ .well-known путь работает корректно"
    else
        echo "❌ .well-known путь не работает"
    fi

else
    echo "❌ Ошибка в конфигурации Nginx"
    exit 1
fi

echo ""
echo "🎯 ГОТОВО К ПОЛУЧЕНИЮ SSL СЕРТИФИКАТА!"
echo ""
echo "Выполните команду:"
echo "certbot --webroot -w /var/www/html -d normaldance.ru -d www.normaldance.ru"
echo ""
echo "Или через панель управления REG.RU получите SSL сертификат вручную."