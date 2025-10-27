#!/bin/bash

echo "🌐 Настройка веб-сервера Nginx..."

# Создание конфигурации Nginx для normaldance.ru
cat > /etc/nginx/sites-available/normaldance.ru << 'EOF'
server {
    listen 80;
    server_name 89.104.67.165;

    # Логи
    access_log /var/log/nginx/normaldance_access.log;
    error_log /var/log/nginx/normaldance_error.log;

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

    # Health check для мониторинга
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Статические файлы
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

# Создание символической ссылки
ln -sf /etc/nginx/sites-available/normaldance.ru /etc/nginx/sites-enabled/

# Удаление дефолтного сайта если существует
rm -f /etc/nginx/sites-enabled/default

# Тестирование конфигурации
echo "🔍 Тестирование конфигурации Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Конфигурация Nginx корректна"
else
    echo "❌ Ошибка в конфигурации Nginx"
    exit 1
fi

# Перезапуск Nginx
echo "🔄 Перезапуск Nginx..."
systemctl reload nginx
systemctl restart nginx

# Проверка статуса Nginx
echo "📊 Статус Nginx:"
systemctl status nginx --no-pager

echo "✅ Настройка Nginx завершена"

# Тестирование доступности сайта
echo "🌍 Тестирование доступности сайта..."
sleep 3
curl -I http://localhost/health || echo "Health check не отвечает"
curl -I http://localhost/api/health || echo "API health не отвечает"

echo "🎉 Nginx настроен и готов к работе!"