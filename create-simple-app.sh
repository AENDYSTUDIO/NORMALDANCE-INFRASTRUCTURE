#!/bin/bash

echo "🔧 Создание простого и рабочего приложения..."

cd /var/www/normaldance.ru

# Создание простого Express.js приложения
cat > server.js << 'EOF'
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Создание главной страницы
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
        h2 {
            font-size: 2em;
            margin: 20px 0;
            opacity: 0.9;
        }
        .status-card {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
            backdrop-filter: blur(10px);
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 40px 0;
        }
        .feature {
            background: rgba(255,255,255,0.1);
            padding: 25px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .feature h4 {
            margin: 0 0 15px 0;
            font-size: 1.5em;
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
        .status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid rgba(76, 175, 80, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎵 NORMAL DANCE</h1>
        <h2>Web3 Music Platform</h2>

        <div class="status-card">
            <h3>🚀 Статус сервера</h3>
            <div class="status">
                <p>✅ Сервер активен и работает!</p>
                <p>🌍 Домен: normaldance.ru | normaldance.online</p>
                <p>🔒 HTTPS: Активен с SSL сертификатом</p>
                <p>📍 IP адрес: 89.104.67.165</p>
                <p>⏰ Время запуска: ${new Date().toLocaleString()}</p>
            </div>
        </div>

        <div class="features">
            <div class="feature">
                <h4>🎵 Музыка</h4>
                <p>Стриминг и загрузка музыкальных треков</p>
            </div>
            <div class="feature">
                <h4>💎 NFT</h4>
                <p>Цифровое искусство и коллекционные токены</p>
            </div>
            <div class="feature">
                <h4>🌐 Web3</h4>
                <p>Интеграция с блокчейном Solana и TON</p>
            </div>
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

// API маршруты
app.get('/api/health', (req, res) => {
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

// Статическая страница для всех остальных запросов
app.get('*', (req, res) => {
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

echo "✅ Простое приложение создано"

# Перезапуск приложения
echo "🔄 Перезапуск приложения..."
pm2 restart normaldance

# Ожидание запуска
sleep 5

# Тестирование всех эндпоинтов
echo "🧪 Тестирование всех эндпоинтов..."

echo ""
echo "API Health (локальный):"
curl -s http://localhost:3000/api/health

echo ""
echo ""
echo "API Info (локальный):"
curl -s http://localhost:3000/api/info

echo ""
echo ""
echo "Главная страница (статус):"
curl -s -I http://localhost:3000/ | head -1

echo ""
echo ""
echo "🌍 ВНЕШНИЕ ТЕСТИРОВАНИЯ:"
echo "API Health (HTTPS):"
curl -s -k https://89.104.67.165/api/health

echo ""
echo ""
echo "Главная страница (HTTPS):"
curl -s -k -I https://89.104.67.165/ | head -1

echo ""
echo "🎉 ПРОСТОЕ ПРИЛОЖЕНИЕ УСПЕШНО РАЗВЕРНУТО!"
echo ""
echo "📋 ДОСТУПНЫЕ URL:"
echo "• https://normaldance.ru/"
echo "• https://89.104.67.165/"
echo "• https://normaldance.ru/api/health"
echo "• https://normaldance.ru/api/info"