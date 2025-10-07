# 🚀 Скрипты развертывания для NORMAL DANCE

## Локальный запуск

### 1. Быстрый старт
```bash
# Клонирование репозитория
git clone <repository-url>
cd normal-dance

# Копирование environment файла
cp .env.example .env

# Установка зависимостей
npm install

# Настройка базы данных
npm run db:generate
npm run db:push

# Запуск в режиме разработки
npm run dev
```

### 2. Запуск в продакшене
```bash
# Сборка приложения
npm run build

# Запуск продакшен сервера
npm start
```

## Docker развертывание

### 1. Сборка Docker образа
```bash
# Сборка образа
docker build -t normal-dance .

# Запуск контейнера
docker run -p 3000:3000 normal-dance
```

### 2. Docker Compose
```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка сервисов
docker-compose down
```

## CI/CD Pipeline

### GitHub Actions пример
```yaml
name: Deploy NORMAL DANCE

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Run tests
      run: npm test
    
    - name: Deploy to production
      run: |
        # Здесь логика деплоя на сервер
        ssh user@server "cd /app && git pull && npm ci && npm run build && pm2 restart normal-dance"
```

### GitLab CI пример
```yaml
stages:
  - test
  - build
  - deploy

variables:
  NODE_ENV: production

cache:
  paths:
    - node_modules/

test:
  stage: test
  script:
    - npm ci
    - npm run lint
    - npm run test

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - .next/
    expire_in: 1 week

deploy:
  stage: deploy
  script:
    - npm ci
    - npm run build
    - pm2 reload normal-dance
  only:
    - main
```

## Автоматизация развертывания

### 1. Скрипт развертывания
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Starting deployment of NORMAL DANCE..."

# Проверка environment файла
if [ ! -f .env ]; then
    echo "❌ .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your configuration"
    exit 1
fi

# Установка зависимостей
echo "📦 Installing dependencies..."
npm ci

# Сборка приложения
echo "🔨 Building application..."
npm run build

# Миграция базы данных
echo "🗄️ Running database migrations..."
npm run db:migrate

# Перезапуск приложения
echo "🔄 Restarting application..."
pm2 reload normal-dance

echo "✅ Deployment completed successfully!"
```

### 2. Скрипт отката
```bash
#!/bin/bash
# rollback.sh

set -e

echo "🔄 Starting rollback of NORMAL DANCE..."

# Откат к предыдущей версии
pm2 rollback normal-dance

echo "✅ Rollback completed successfully!"
```

## Мониторинг и логирование

### 1. Настройка PM2
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'normal-dance',
    script: 'server.ts',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 2. Логирование
```bash
# Просмотр логов
pm2 logs normal-dance

# Мониторинг процессов
pm2 monit

# Информация о приложении
pm2 show normal-dance
```

## Оптимизация производительности

### 1. Кэширование
```bash
# Настройка кэширования в Next.js
# next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}
```

### 2. Оптимизация изображений
```bash
# Использование Sharp для оптимизации изображений
# next.config.ts
const nextConfig = {
  images: {
    domains: ['example.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  }
}
```

## Безопасность

### 1. HTTPS настройка
```bash
# Настройка SSL сертификата
# Использование Let's Encrypt
sudo certbot --nginx -d normal-dance.com
```

### 2. Firewall настройка
```bash
# Настройка UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Резервное копирование

### 1. Скрипт бэкапа
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/normal-dance"
DB_FILE="$BACKUP_DIR/db_$DATE.sqlite"
LOG_FILE="$BACKUP_DIR/backup_$DATE.log"

# Создание бэкапа базы данных
cp db/custom.db "$DB_FILE"

# Создание бэкапа файлов
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" public/ uploads/

# Удаление старых бэкапов (старше 7 дней)
find "$BACKUP_DIR" -name "*.sqlite" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE" >> "$LOG_FILE"
```

---

Создано для NORMAL DANCE 🎵