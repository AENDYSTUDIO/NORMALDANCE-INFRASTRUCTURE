#!/bin/bash

echo "🎵 Создание приложения NORMAL DANCE..."

# Создание директории проекта
mkdir -p /var/www/normaldance.ru
cd /var/www/normaldance.ru

# Создание package.json
cat > package.json << 'EOF'
{
  "name": "normaldance",
  "version": "1.0.0",
  "description": "NORMAL DANCE - Web3 Music Platform",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "node server.js",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "express": "^4.18.0",
    "socket.io": "^4.7.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "@solana/web3.js": "^1.87.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/express": "^4.17.0",
    "typescript": "^5.0.0"
  }
}
EOF

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

# Создание базовой структуры директорий
mkdir -p src/app src/components src/lib public

# Создание базового server.js
cat > server.js << 'EOF'
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// API routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'NORMAL DANCE server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('/api/info', (req, res) => {
    res.json({
        name: 'NORMAL DANCE',
        description: 'Web3 Music Platform',
        features: ['Music Streaming', 'NFT Integration', 'Social Features'],
        blockchain: ['Solana', 'TON']
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 NORMAL DANCE server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
EOF

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
            textAlign: 'center'
        }}>
            <h1>🎵 NORMAL DANCE</h1>
            <h2>Web3 Music Platform</h2>

            <div style={{ margin: '40px 0' }}>
                <p>Добро пожаловать в революционную музыкальную платформу!</p>
                <p>Здесь будет интеграция с блокчейном Solana и TON</p>
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
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                margin: '40px 0'
            }}>
                <div style={{ padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
                    <h4>🎵 Музыка</h4>
                    <p>Стриминг и загрузка</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
                    <h4>💎 NFT</h4>
                    <p>Цифровое искусство</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
                    <h4>🌐 Web3</h4>
                    <p>Блокчейн интеграция</p>
                </div>
            </div>
        </div>
    );
}
EOF

# Создание API маршрута для health check
mkdir -p src/app/api/health
cat > src/app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'OK',
        message: 'NORMAL DANCE API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
}
EOF

# Создание базового layout
cat > src/app/layout.tsx << 'EOF'
import React from 'react';

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

# Создание базовой конфигурации Next.js
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        appDir: true,
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:3000/api/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
EOF

# Создание tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# Создание директории для логов
mkdir -p logs

echo "✅ Приложение NORMAL DANCE создано"
echo "📁 Структура приложения:"
ls -la

echo "📋 Файлы приложения:"
ls -la package.json server.js src/app/page.tsx

echo "🎉 Готово к запуску!"