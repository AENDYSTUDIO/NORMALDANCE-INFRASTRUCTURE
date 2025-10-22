#!/bin/bash

echo "🔧 Исправление конфигурации Nginx..."

# Проверка текущей конфигурации
echo "📋 Проверка конфигурации Nginx:"
nginx -t

# Исправление конфигурации Nginx
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
}
EOF

# Создание символической ссылки
ln -sf /etc/nginx/sites-available/normaldance.ru /etc/nginx/sites-enabled/

# Удаление дефолтного сайта если существует
rm -f /etc/nginx/sites-enabled/default

# Тестирование конфигурации
echo "🔍 Тестирование исправленной конфигурации..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Конфигурация Nginx корректна"

    # Перезапуск Nginx
    systemctl reload nginx
    systemctl restart nginx

    echo "📊 Статус Nginx:"
    systemctl status nginx --no-pager

    # Тестирование доступности
    echo "🌍 Тестирование доступности сайта..."
    sleep 3
    curl -I http://localhost/health 2>/dev/null | head -1 || echo "Health check не отвечает"

    echo "✅ Nginx настроен и работает!"
else
    echo "❌ Все еще ошибка в конфигурации Nginx"
    nginx -t
fi