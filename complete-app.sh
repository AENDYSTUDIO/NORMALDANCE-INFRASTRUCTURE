#!/bin/bash

echo "🔧 Завершение создания приложения NORMAL DANCE..."

cd /var/www/normaldance.ru

# Создание недостающих директорий
echo "📁 Создание директорий..."
mkdir -p src/app/api/health src/components src/lib public logs

# Создание базовой главной страницы
cat > src/app/page.tsx << 'EOF'
import React from 'react';

export default function HomePage() {
    return (
        <div style={{
            fontFamily: 'Arial, sans-serif',
            maxWidth: '800px',
            margin: '0 auto',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#000',
            color: '#fff',
            minHeight: '100vh'
        }}>
            <h1>🎵 NORMAL DANCE</h1>
            <h2>Web3 Music Platform</h2>

            <div style={{ margin: '40px 0' }}>
                <p>Добро пожаловать в революционную музыкальную платформу!</p>
                <p>Интеграция с блокчейном Solana и TON</p>
            </div>

            <div style={{
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '20px',
                margin: '20px 0'
            }}>
                <h3>🚀 Статус сервера</h3>
                <p>Сервер активен и готов к работе!</p>
                <p>Время запуска: {new Date().toLocaleString()}</p>
                <p>IP адрес: 89.104.67.165</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                margin: '40px 0'
            }}>
                <div style={{ padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px', color: '#000' }}>
                    <h4>🎵 Музыка</h4>
                    <p>Стриминг и загрузка</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px', color: '#000' }}>
                    <h4>💎 NFT</h4>
                    <p>Цифровое искусство</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px', color: '#000' }}>
                    <h4>🌐 Web3</h4>
                    <p>Блокчейн интеграция</p>
                </div>
            </div>

            <div style={{ marginTop: '40px' }}>
                <a href="/api/health" style={{
                    color: '#007bff',
                    textDecoration: 'none',
                    padding: '10px 20px',
                    border: '1px solid #007bff',
                    borderRadius: '5px'
                }}>Проверить API Health</a>
            </div>
        </div>
    );
}
EOF

# Создание API маршрута для health check
cat > src/app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'OK',
        message: 'NORMAL DANCE API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        server: '89.104.67.165'
    });
}
EOF

# Создание базового layout
cat > src/app/layout.tsx << 'EOF'
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru">
            <head>
                <title>NORMAL DANCE - Web3 Music Platform</title>
                <meta name="description" content="Революционная музыкальная платформа с Web3 интеграцией" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body style={{
                fontFamily: 'Arial, sans-serif',
                margin: 0,
                padding: 0,
                backgroundColor: '#000',
                color: '#fff'
            }}>
                {children}
            </body>
        </html>
    );
}
EOF

# Создание простого компонента
mkdir -p src/components
cat > src/components/Welcome.tsx << 'EOF'
import React from 'react';

export default function Welcome() {
    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3>Добро пожаловать в NORMAL DANCE!</h3>
            <p>Платформа для музыкантов и любителей музыки</p>
        </div>
    );
}
EOF

echo "✅ Приложение NORMAL DANCE завершено"
echo "📁 Структура приложения:"
find . -type f -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.json" | head -10

echo "🎉 Приложение готово к запуску!"