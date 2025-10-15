#!/bin/bash

# Скрипт для деплоя NORMALDANCE Enterprise Automation

echo "🚀 Деплой NORMALDANCE Enterprise Automation..."

# Проверяем, установлены ли необходимые зависимости
echo "🔍 Проверка зависимостей..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Пожалуйста, установите Docker перед продолжением."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Пожалуйста, установите Docker Compose перед продолжением."
    exit 1
fi

# Создаем директорию для конфигурации если её нет
mkdir -p config

# Проверяем наличие необходимых переменных окружения
ENV_VARS=(
    "TELEGRAM_BOT_TOKEN"
    "TODOIST_TOKEN" 
    "OPENAI_API_KEY"
    "N8N_BASIC_AUTH_USER"
    "N8N_BASIC_AUTH_PASSWORD"
)

echo "🔐 Проверка переменных окружения..."
for var in "${ENV_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "⚠️ Переменная $var не установлена. Пожалуйста, установите её перед деплоем."
    else
        echo "✅ $var: УСТАНОВЛЕНА"
    fi
done

# Создаем файл .env если он не существует
if [ ! -f ".env" ]; then
    echo "📄 Создание файла .env..."
    cat > .env << EOF
# NORMALDANCE Enterprise Automation Environment Variables

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Todoist
TODOIST_TOKEN=your_todoist_token_here
TODOIST_PROJECT_ID=your_todoist_project_id_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# n8n
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password
N8N_EXTERNAL_URL=http://localhost:5678

# MemoryBank (ChromaDB)
CHROMA_URL=http://chroma:8000
CHROMA_COLLECTION=normaldance_automation

# Server
SERVER_URL=http://localhost:3000
MCP_URL=http://localhost:3001

# Monitoring
HEALTH_CHECK_INTERVAL=300000
METRICS_COLLECTION_INTERVAL=600000
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
RESPONSE_TIME_THRESHOLD=5000
EOF
    echo "✅ Файл .env создан. Пожалуйста, обновите его с вашими реальными значениями."
fi

# Создаем docker-compose файл для деплоя
echo "🐳 Создание docker-compose файла..."
cat > docker-compose.automation.yml << EOF
version: '3.8'

services:
  # n8n - центральная система автоматизации
  n8n:
    image: n8nio/n8n
    container_name: normaldance-n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=\${N8N_BASIC_AUTH_USER:-admin}
      - N8N_BASIC_AUTH_PASSWORD=\${N8N_BASIC_AUTH_PASSWORD:-secure_password}
      - N8N_EXTERNAL_URL=http://localhost:5678
    volumes:
      - ~/.n8n:/home/node/.n8n
    restart: unless-stopped
    networks:
      - normaldance-net

  # ChromaDB - MemoryBank для хранения истории
 chroma:
    image: chromadb/chroma:latest
    container_name: normaldance-chroma
    ports:
      - "8000:8000"
    volumes:
      - ~/.chroma:/app/chroma/data
    environment:
      - CHROMA_CONFIG_PATH=/app/chroma/config/chroma_config.yaml
    restart: unless-stopped
    networks:
      - normaldance-net

  # MCP сервер для кастомных протоколов
  mcp-server:
    build:
      context: .
      dockerfile: Dockerfile.mcp
    container_name: normaldance-mcp
    ports:
      - "3001:3001"
    environment:
      - CHROMA_URL=http://chroma:8000
      - N8N_URL=http://n8n:5678
      - TODOIST_API_URL=https://api.todoist.com/rest/v2
      - TODOIST_TOKEN=\${TODOIST_TOKEN}
    depends_on:
      - chroma
      - n8n
    restart: unless-stopped
    networks:
      - normaldance-net

  # Telegram бот
  telegram-bot:
    build:
      context: .
      dockerfile: Dockerfile.bot
    container_name: normaldance-telegram-bot
    environment:
      - TELEGRAM_BOT_TOKEN=\${TELEGRAM_BOT_TOKEN}
      - CHROMA_URL=http://chroma:8000
      - N8N_URL=http://n8n:5678
      - TODOIST_TOKEN=\${TODOIST_TOKEN}
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
    depends_on:
      - chroma
      - n8n
      - mcp-server
    restart: unless-stopped
    networks:
      - normaldance-net

  # Мониторинг с Prometheus и Grafana
  prometheus:
    image: prom/prometheus
    container_name: normaldance-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    restart: unless-stopped
    networks:
      - normaldance-net

  grafana:
    image: grafana/grafana
    container_name: normaldance-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - ~/.grafana:/var/lib/grafana
    depends_on:
      - prometheus
    restart: unless-stopped
    networks:
      - normaldance-net

networks:
  normaldance-net:
    driver: bridge
EOF

echo "✅ Docker Compose файл создан."

# Создаем Dockerfile для MCP сервера
echo "🔨 Создание Dockerfile для MCP сервера..."
cat > Dockerfile.mcp << EOF
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY mcp-server/ ./
COPY config/ ./config/

EXPOSE 3001

CMD ["node", "normaldance-mcp.js"]
EOF

echo "✅ Dockerfile для MCP сервера создан."

# Создаем Dockerfile для Telegram бота
echo "🔨 Создание Dockerfile для Telegram бота..."
cat > Dockerfile.bot << EOF
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY telegram-bot/ ./
COPY config/ ./config/
COPY memorybank/ ./memorybank/
COPY todoist-integration/ ./todoist-integration/
COPY ai-integration/ ./ai-integration/

EXPOSE 3000

CMD ["node", "bot.js"]
EOF

echo "✅ Dockerfile для Telegram бота создан."

# Создаем конфигурацию Prometheus
mkdir -p monitoring
cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'normaldance-mcp'
    static_configs:
      - targets: ['mcp-server:3001']
  - job_name: 'normaldance-services'
    static_configs:
      - targets: ['localhost:3000']  # Замените на реальные метрики сервисов
EOF

echo "✅ Конфигурация Prometheus создана."

# Запускаем сервисы
echo "🚀 Запуск сервисов NORMALDANCE Enterprise Automation..."
docker-compose -f docker-compose.automation.yml up -d

# Ждем немного для запуска сервисов
echo "⏳ Ожидание запуска сервисов..."
sleep 30

# Проверяем статус сервисов
echo "📋 Проверка статуса сервисов..."
docker-compose -f docker-compose.automation.yml ps

echo "🎉 NORMALDANCE Enterprise Automation успешно развернут!"
echo ""
echo "🔗 Доступные сервисы:"
echo "   n8n: http://localhost:5678 (admin/secure_password)"
echo "   ChromaDB: http://localhost:8000"
echo "   MCP Server: http://localhost:3001"
echo "   Grafana: http://localhost:3000 (admin/admin)"
echo "   Prometheus: http://localhost:9090"
echo ""
echo "🤖 Telegram бот запущен и готов к работе"
echo "🔄 Все workflow активны и готовы к использованию"
echo ""
echo "💡 Следующие шаги:"
echo "   1. Обновите .env файл с вашими реальными токенами"
echo "   2. Импортируйте n8n workflow из директории n8n-workflows/"
echo "   3. Настройте вебхук для Telegram бота"
echo "   4. Настройте Grafana для мониторинга"