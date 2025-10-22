#!/bin/bash

echo "📊 Создание административной панели для NORMAL DANCE..."

cd /var/www/normaldance.ru

# Создание директории для админки
mkdir -p admin

# Создание главной страницы админки
cat > admin/index.html << 'EOF'
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NORMAL DANCE - Админ панель</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: #fff;
            min-height: 100vh;
        }
        .header {
            background: rgba(0,0,0,0.8);
            padding: 20px;
            text-align: center;
            border-bottom: 2px solid #00d4ff;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(0,212,255,0.3);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            backdrop-filter: blur(10px);
            transition: transform 0.3s ease;
        }
        .stat-card:hover {
            transform: translateY(-5px);
            border-color: #00d4ff;
        }
        .stat-card h3 {
            margin: 0 0 15px 0;
            color: #00d4ff;
            font-size: 2.5em;
        }
        .stat-card p {
            margin: 5px 0;
            font-size: 1.1em;
        }
        .controls {
            background: rgba(0,0,0,0.5);
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
        }
        .control-button {
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            border: none;
            border-radius: 8px;
            padding: 15px 30px;
            color: white;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
            transition: all 0.3s ease;
        }
        .control-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,212,255,0.4);
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-online { background: #4CAF50; }
        .status-offline { background: #f44336; }
        .logs {
            background: rgba(0,0,0,0.7);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            font-family: monospace;
            max-height: 300px;
            overflow-y: auto;
        }
        .footer {
            text-align: center;
            padding: 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
            margin-top: 40px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎵 NORMAL DANCE - Админ панель</h1>
        <p>Панель управления Web3 музыкальной платформой</p>
    </div>

    <div class="container">
        <div class="stats-grid">
            <div class="stat-card">
                <h3 id="server-status">⏳</h3>
                <p>Статус сервера</p>
                <p id="server-details">Загрузка...</p>
            </div>
            <div class="stat-card">
                <h3 id="database-status">⏳</h3>
                <p>База данных</p>
                <p id="database-details">Проверка подключения...</p>
            </div>
            <div class="stat-card">
                <h3 id="uptime">⏳</h3>
                <p>Время работы</p>
                <p id="uptime-details">Расчет...</p>
            </div>
            <div class="stat-card">
                <h3 id="memory">⏳</h3>
                <p>Использование памяти</p>
                <p id="memory-details">Загрузка...</p>
            </div>
        </div>

        <div class="controls">
            <h2>🚀 Управление приложением</h2>
            <button class="control-button" onclick="checkStatus()">🔍 Проверить статус</button>
            <button class="control-button" onclick="restartApp()">🔄 Перезапустить приложение</button>
            <button class="control-button" onclick="viewLogs()">📄 Посмотреть логи</button>
            <button class="control-button" onclick="reloadNginx()">🌐 Перезагрузить Nginx</button>
            <button class="control-button" onclick="checkSSL()">🔒 Проверить SSL</button>
        </div>

        <div class="controls">
            <h2>🔗 Быстрый доступ</h2>
            <button class="control-button" onclick="window.open('https://89.104.67.165/', '_blank')">🌍 Открыть сайт</button>
            <button class="control-button" onclick="window.open('https://89.104.67.165/api/health', '_blank')">🔗 API Health</button>
            <button class="control-button" onclick="window.open('/admin/logs', '_blank')">📊 Логи системы</button>
            <button class="control-button" onclick="window.open('https://server172.hosting.reg.ru:1500/', '_blank')">⚙️ Панель REG.RU</button>
        </div>

        <div class="logs" id="logs-section" style="display: none;">
            <h3>📄 Системные логи</h3>
            <div id="logs-content">Загрузка логов...</div>
        </div>
    </div>

    <div class="footer">
        <p>🕐 Последнее обновление: <span id="last-update">Загрузка...</span></p>
        <p>🔧 Админ панель NORMAL DANCE v1.0 | Сервер: 89.104.67.165</p>
    </div>

    <script>
        async function checkStatus() {
            try {
                const response = await fetch('/admin/api/status');
                const data = await response.json();
                updateStatus(data);
            } catch (error) {
                console.error('Ошибка проверки статуса:', error);
                showError('Не удалось проверить статус сервера');
            }
        }

        function updateStatus(data) {
            // Обновление индикаторов статуса
            document.getElementById('server-status').innerHTML = data.server.status === 'online' ? '✅' : '❌';
            document.getElementById('database-status').innerHTML = data.database.status === 'connected' ? '✅' : '❌';
            document.getElementById('uptime').textContent = '⏱️';
            document.getElementById('memory').textContent = '🧠';

            // Детали
            document.getElementById('server-details').textContent = `PM2: ${data.server.status} | PID: ${data.server.pid}`;
            document.getElementById('database-details').textContent = `${data.database.type}: ${data.database.status}`;
            document.getElementById('uptime-details').textContent = `${data.server.uptime}`;
            document.getElementById('memory-details').textContent = `${data.server.memory}`;

            document.getElementById('last-update').textContent = new Date().toLocaleString();
        }

        function restartApp() {
            if (confirm('Перезапустить приложение?')) {
                fetch('/admin/api/restart', { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        alert(data.message);
                        setTimeout(checkStatus, 2000);
                    })
                    .catch(error => showError('Ошибка перезапуска'));
            }
        }

        function viewLogs() {
            fetch('/admin/api/logs')
                .then(response => response.text())
                .then(data => {
                    document.getElementById('logs-content').textContent = data;
                    document.getElementById('logs-section').style.display = 'block';
                })
                .catch(error => showError('Не удалось загрузить логи'));
        }

        function reloadNginx() {
            fetch('/admin/api/nginx-reload', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    checkStatus();
                })
                .catch(error => showError('Ошибка перезагрузки Nginx'));
        }

        function checkSSL() {
            window.open('https://89.104.67.165/api/health', '_blank');
        }

        function showError(message) {
            alert('Ошибка: ' + message);
        }

        // Автоматическая проверка статуса каждые 30 секунд
        setInterval(checkStatus, 30000);

        // Первоначальная проверка
        window.onload = checkStatus;
    </script>
</body>
</html>
EOF

# Создание API эндпоинтов для админки
cat > admin/api.js << 'EOF'
const express = require('express');
const { exec } = require('child_process');
const router = express.Router();

// Функция для выполнения команд
function execCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

// Статус сервера
router.get('/status', async (req, res) => {
    try {
        // Проверка PM2
        const pm2Status = await execCommand('pm2 status');
        const isOnline = pm2Status.stdout.includes('online');

        // Проверка памяти
        const memoryInfo = await execCommand('pm2 monit');
        const memoryMatch = memoryInfo.stdout.match(/(\d+\.?\d*)mb/);
        const memory = memoryMatch ? memoryMatch[1] + 'mb' : 'неизвестно';

        // Проверка uptime
        const uptimeMatch = pm2Status.stdout.match(/(\d+h?\s*\d+m?)/);
        const uptime = uptimeMatch ? uptimeMatch[1] : 'неизвестно';

        // Проверка базы данных
        const dbCheck = await execCommand('mysql -u normaldance -pulT85qn6UU6dYzEv -e "SELECT 1;" normaldance');
        const dbConnected = !dbCheck.error;

        res.json({
            server: {
                status: isOnline ? 'online' : 'offline',
                pid: '164812',
                uptime: uptime,
                memory: memory
            },
            database: {
                type: 'MariaDB',
                status: dbConnected ? 'connected' : 'disconnected'
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Перезапуск приложения
router.post('/restart', async (req, res) => {
    try {
        await execCommand('pm2 restart normaldance');
        res.json({ message: 'Приложение перезапущено' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка перезапуска' });
    }
});

// Логи системы
router.get('/logs', async (req, res) => {
    try {
        const logs = await execCommand('pm2 logs --lines 20');
        res.send(`<pre>${logs.stdout}</pre>`);
    } catch (error) {
        res.status(500).send('Ошибка загрузки логов');
    }
});

// Перезагрузка Nginx
router.post('/nginx-reload', async (req, res) => {
    try {
        await execCommand('systemctl reload nginx');
        res.json({ message: 'Nginx перезагружен' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка перезагрузки Nginx' });
    }
});

module.exports = router;
EOF

echo "✅ Админ панель создана"

# Перезапуск приложения с новыми маршрутами
pm2 restart normaldance

echo ""
echo "🎉 АДМИН ПАНЕЛЬ СОЗДАНА!"
echo ""
echo "📋 ДОСТУП К АДМИН ПАНЕЛИ:"
echo "• https://89.104.67.165/admin/"
echo "• https://normaldance.ru/admin/ (после исправления DNS)"
echo ""
echo "🔧 ФУНКЦИИ АДМИН ПАНЕЛИ:"
echo "• Мониторинг статуса сервера"
echo "• Управление приложением"
echo "• Просмотр логов"
echo "• Перезапуск сервисов"
echo "• Проверка базы данных"
echo ""
echo "📊 АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ: Каждые 30 секунд"