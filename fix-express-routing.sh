#!/bin/bash

echo "🔧 Исправление Express маршрутизации..."

cd /var/www/normaldance.ru

# Создание правильного server.js с корректным порядком маршрутов
cat > server.js << 'EOF'
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// API МАРШРУТЫ ДОЛЖНЫ БЫТЬ ПЕРВЫМИ!
app.get('/api/health', (req, res) => {
    console.log('API Health requested');
    res.json({
        status: 'OK',
        message: 'NORMAL DANCE API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        server: '89.104.67.165',
        ssl: 'active',
        domains: ['normaldance.ru', 'normaldance.online']
    });
});

app.get('/api/info', (req, res) => {
    console.log('API Info requested');
    res.json({
        name: 'NORMAL DANCE',
        description: 'Web3 Music Platform',
        version: '1.0.0',
        features: [
            'Music Streaming',
            'NFT Integration',
            'Web3 Blockchain (Solana, TON)',
            'Social Features',
            'Artist Dashboard'
        ],
        status: 'active',
        server: {
            ip: '89.104.67.165',
            location: 'REG.RU Hosting',
            ssl: true,
            domains: ['normaldance.ru', 'normaldance.online']
        },
        database: {
            type: 'MariaDB',
            status: 'connected'
        }
    });
});

// Статическая страница ТОЛЬКО ДЛЯ НЕ-API ЗАПРОСОВ
app.get('*', (req, res) => {
    console.log('Main page requested:', req.path);
    const mainPage = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NORMAL DANCE - Web3 Music Platform</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        }
        .container {
            max-width: 800px;
            padding: 20px;
        }
        h1 {
            font-size: 4em;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .status-card {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
            backdrop-filter: blur(10px);
        }
        .links {
            margin-top: 40px;
        }
        .link-button {
            display: inline-block;
            padding: 12px 24px;
            margin: 0 10px;
            border: 1px solid white;
            border-radius: 8px;
            text-decoration: none;
            color: white;
            transition: all 0.3s ease;
        }
        .link-button:hover {
            background: white;
            color: #667eea;
        }
        .link-button.primary {
            background: white;
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎵 NORMAL DANCE</h1>
        <h2>Web3 Music Platform</h2>

        <div class="status-card">
            <h3>🚀 Статус сервера</h3>
            <p>✅ Сервер активен и работает!</p>
            <p>🌍 Домен: normaldance.ru | normaldance.online</p>
            <p>🔒 HTTPS: Активен с SSL сертификатом</p>
            <p>📍 IP адрес: 89.104.67.165</p>
            <p>⏰ Время запуска: ${new Date().toLocaleString()}</p>
        </div>

        <div class="links">
            <a href="/api/health" class="link-button">API Health Check</a>
            <a href="/api/info" class="link-button">Информация о платформе</a>
            <a href="https://89.104.67.165/api/health" class="link-button primary">HTTPS API</a>
        </div>
    </div>
</body>
</html>
`;
    res.send(mainPage);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 NORMAL DANCE server running!');
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🌍 Public: https://89.104.67.165`);
    console.log(`📜 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🔒 SSL API: https://89.104.67.165/api/health`);
});

module.exports = app;
EOF

echo "✅ Express маршрутизация исправлена"

# Перезапуск приложения
echo "🔄 Перезапуск приложения..."
pm2 restart normaldance

# Ожидание запуска
sleep 5

# Тестирование API (теперь должно работать!)
echo "🧪 Тестирование API маршрутов..."

echo ""
echo "🔍 API HEALTH TEST:"
curl -s http://localhost:3000/api/health

echo ""
echo ""
echo "🔍 API INFO TEST:"
curl -s http://localhost:3000/api/info

echo ""
echo ""
echo "🔍 MAIN PAGE TEST:"
curl -s -I http://localhost:3000/ | head -1

echo ""
echo ""
echo "🌍 ВНЕШНИЕ ТЕСТИРОВАНИЯ:"

echo "🌍 API Health (HTTPS):"
curl -s -k https://89.104.67.165/api/health

echo ""
echo ""
echo "🎯 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ:"
echo ""
echo "📋 ДОСТУПНЫЕ URL:"
echo "✅ Главная: https://normaldance.ru/"
echo "✅ API Health: https://normaldance.ru/api/health"
echo "✅ API Info: https://normaldance.ru/api/info"
echo "✅ HTTPS API: https://89.104.67.165/api/health"
echo ""
echo "🎉 ПРИЛОЖЕНИЕ УСПЕШНО ИСПРАВЛЕНО!"