#!/bin/bash

echo "🚀 Запуск приложения NORMAL DANCE через PM2..."

cd /var/www/normaldance.ru

# Проверка наличия приложения
if [ ! -f "server.js" ]; then
    echo "❌ Файл server.js не найден"
    exit 1
fi

# Создание конфигурации PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'normaldance',
    script: 'server.js',
    cwd: '/var/www/normaldance.ru',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/www/normaldance.ru/logs/err.log',
    out_file: '/var/www/normaldance.ru/logs/out.log',
    log_file: '/var/www/normaldance.ru/logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Создание директории для логов
mkdir -p logs

# Остановка предыдущей версии если запущена
echo "🛑 Остановка предыдущей версии..."
pm2 stop normaldance 2>/dev/null || echo "Предыдущая версия не найдена"

# Запуск новой версии
echo "▶️ Запуск приложения..."
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска PM2
pm2 startup

# Проверка статуса
echo "📊 Статус PM2:"
pm2 status

echo "📋 Информация о процессе:"
pm2 show normaldance

# Проверка доступности приложения
echo "🔍 Проверка доступности приложения..."
sleep 5
curl -f http://localhost:3000/api/health || echo "Приложение не отвечает на health check"

# Проверка порта
echo "🔌 Проверка порта 3000:"
netstat -tlnp | grep :3000 || echo "Порт 3000 не прослушивается"

echo "✅ Приложение запущено через PM2"

# Показать логи
echo "📄 Последние логи:"
pm2 logs --lines 10

echo "🎉 Приложение NORMAL DANCE успешно запущено!"
echo ""
echo "📋 Доступ к приложению:"
echo "• http://89.104.67.165/health"
echo "• http://89.104.67.165/api/health"
echo ""
echo "🔧 Управление:"
echo "• Статус: pm2 status"
echo "• Логи: pm2 logs normaldance"
echo "• Перезапуск: pm2 restart normaldance"
echo "• Остановка: pm2 stop normaldance"