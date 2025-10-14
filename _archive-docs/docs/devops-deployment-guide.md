# 🚀 Пошаговое руководство по развертыванию NORMAL DANCE v1.0.1

## 📋 Общая информация

NORMAL DANCE - децентрализованная музыкальная платформа на базе Next.js 15 с TypeScript, Prisma ORM, WebSocket и Web3 интеграцией (Solana).

### 🏗️ Технологический стек
- **Next.js 15** - React фреймворк с App Router
- **TypeScript 5** - Типобезопасный JavaScript
- **Prisma** - ORM для работы с базой данных
- **SQLite** - Локальная база данных (для разработки)
- **PostgreSQL** - Производственная база данных
- **Socket.IO** - WebSocket для реального времени
- **shadcn/ui** - UI компоненты
- **NextAuth.js** - Аутентификация
- **Tailwind CSS** - CSS фреймворк
- **Docker** - Контейнеризация
- **Kubernetes** - Оркестрация контейнеров
- **Helm** - Пакетный менеджер для Kubernetes
- **Prometheus** - Мониторинг
- **Grafana** - Визуализация метрик
- **Solana** - Блокчейн для Web3 интеграции

## 📁 Структура проекта

```
normaldance/
├── src/                    # Исходный код
│   ├── app/               # Next.js App Router
│   ├── components/        # React компоненты
│   ├── lib/               # Утилиты и конфигурации
│   └── hooks/             # Custom hooks
├── prisma/                # Схема базы данных
├── programs/              # Solana программы
├── docker/                # Docker файлы
├── helm/                  # Helm чарты
├── monitoring/            # Конфигурация мониторинга
├── k8s/                   # Kubernetes manifests
└── docs/                  # Документация
```

## 🔧 Предварительные требования

### Системные требования
- **CPU**: 4+ ядер
- **RAM**: 8+ GB
- **HDD**: 50+ GB SSD
- **OS**: Ubuntu 20.04+ / CentOS 8+ / macOS 10.15+

### Необходимые инструменты
- **Docker** v20.10+
- **Docker Compose** v2.0+
- **Kubernetes** v1.20+
- **Helm** v3.0+
- **kubectl** v1.20+
- **Node.js** v18+
- **npm** v8+
- **Git** v2.30+

### Cloud провайдеры
- **AWS** / **GCP** / **Azure** для инфраструктуры
- **CloudFlare** / **AWS CloudFront** для CDN
- **AWS RDS** / **Google Cloud SQL** для базы данных
- **AWS S3** / **Google Cloud Storage** для файлов

## 🚀 Развертывание в разработке

### Шаг 1: Клонирование репозитория

```bash
# Клонируем репозиторий
git clone https://github.com/normaldance/normaldance.git
cd normaldance

# Создаем ветку для разработки
git checkout -b feature/v1.0.1-deployment
```

### Шаг 2: Настройка окружения

```bash
# Создаем файл окружения
cp .env.example .env

# Редактируем переменные окружения
nano .env
```

Содержимое `.env` файла:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/normaldance"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Node Environment
NODE_ENV="development"

# WebSocket
SOCKET_PORT=3000

# Web3 (Solana)
SOLANA_NETWORK="devnet"
SOLANA_RPC_URL="https://api.devnet.solana.com"
WALLET_CONNECT_PROJECT_ID="your-wallet-connect-id"

# Redis (для кеширования)
REDIS_URL="redis://localhost:6379"

# Filecoin (для IPFS)
FILELOTUS_API_URL="https://api.filecoin.io"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
GRAFANA_URL="http://localhost:3001"
PROMETHEUS_URL="http://localhost:9090"
```

### Шаг 3: Установка зависимостей

```bash
# Установка npm зависимостей
npm install

# Установка глобальных зависимостей
npm install -g @prisma/cli @solana/web3.js

# Генерация Prisma клиента
npm run db:generate

# Применение схемы базы данных
npm run db:push
```

### Шаг 4: Настройка базы данных

```bash
# Запуск PostgreSQL через Docker
docker run --name normaldance-postgres \
  -e POSTGRES_USER=normaldance \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=normaldance \
  -p 5432:5432 \
  -d postgres:14

# Применение миграций
npm run db:migrate

# Заполнение базы данных тестовыми данными
npm run db:seed
```

### Шаг 5: Запуск приложения

```bash
# Запуск в режиме разработки
npm run dev

# Или запуск в продакшене
npm run build
npm start
```

### Шаг 6: Проверка работы

```bash
# Проверка API
curl http://localhost:3000/api/health

# Проверка WebSocket
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Host: localhost:3000" http://localhost:3000/api/socketio

# Проверка базы данных
npm run db:check
```

## 🚀 Развертывание в продакшене

### Вариант 1: Docker Compose

#### Шаг 1: Создание docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres:5432/normaldance
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_USER=normaldance
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=normaldance
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### Шаг 2: Запуск

```bash
# Сборка образов
docker-compose build

# Зап servicios
docker-compose up -d

# Проверка статуса
docker-compose ps
```

### Вариант 2: Kubernetes

#### Шаг 1: Создание namespace

```bash
kubectl create namespace normaldance
```

#### Шаг 2: Развертывание Helm чартов

```bash
# Установка Helm репозитория
helm repo add normaldance https://normaldance.github.io/helm-charts
helm repo update

# Установка приложения
helm install normaldance normaldance/normaldance \
  --namespace normaldance \
  --set image.tag=v1.0.1 \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=api.normaldance.com \
  --set ingress.tls[0].secretName=normaldance-tls \
  --set postgresql.enabled=true \
  --set redis.enabled=true
```

#### Шаг 3: Проверка развертывания

```bash
# Проверка подов
kubectl get pods -n normaldance

# Проверка сервисов
kubectl get svc -n normaldance

# Проверка ingress
kubectl get ingress -n normaldance
```

### Вариант 3: AWS ECS

#### Шаг 1: Создание ECR репозитория

```bash
# Создание репозитория
aws ecr create-repository --repository-name normaldance --region us-east-1

# Аутентификация в ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Сборка и отправка образа
docker build -t normaldance .
docker tag normaldance:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/normaldance:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/normaldance:latest
```

#### Шаг 2: Создание ECS задачи

```json
{
  "family": "normaldance",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "normaldance",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/normaldance:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:password@rds-endpoint:5432/normaldance"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/normaldance",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## 🔧 Конфигурация мониторинга

### Шаг 1: Настройка Prometheus

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'normaldance'
    static_configs:
      - targets: ['normaldance:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s
```

### Шаг 2: Настройка Grafana

```bash
# Установка Grafana
helm repo add grafana https://grafana.github.io/helm-charts
helm install grafana grafana/grafana --namespace monitoring

# Импорт дашбордов
kubectl create -f monitoring/grafana/dashboards/
```

### Шаг 3: Настройка Alertmanager

```yaml
# monitoring/alertmanager/alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@normaldance.com'
  smtp_auth_username: 'alerts@normaldance.com'
  smtp_auth_password: 'password'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  email_configs:
  - to: 'admin@normaldance.com'
    subject: 'NormalDance Alert: {{ .GroupLabels.alertname }}'
```

## 🔐 Безопасность

### Шаг 1: Настройка SSL/TLS

```bash
# Генерация SSL сертификата
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Настройка Nginx
server {
    listen 443 ssl;
    server_name api.normaldance.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Шаг 2: Настройка безопасности контейнеров

```dockerfile
# Dockerfile
FROM node:18-alpine

# Создание пользователя без прав root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Установка зависимостей
COPY package*.json ./
RUN npm ci --only=production

# Копирование кода
COPY . .

# Смена владельца
USER nextjs

# Экспорт порта
EXPOSE 3000

# Запуск приложения
CMD ["npm", "start"]
```

### Шаг 3: Настройка сетевой безопасности

```yaml
# Kubernetes Network Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: normaldance-network-policy
spec:
  podSelector:
    matchLabels:
      app: normaldance
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: normaldance
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 9090
```

## 📊 Масштабирование

### Горизонтальное масштабирование

```yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: normaldance-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: normaldance
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Вертикальное масштабирование

```yaml
# Vertical Pod Autoscaler
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: normaldance-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: normaldance
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: normaldance
      minAllowed:
        cpu: 500m
        memory: 1Gi
      maxAllowed:
        cpu: 2000m
        memory: 4Gi
      controlledResources: ["cpu", "memory"]
```

## 🔧 Обновление развертывания

### Blue-Green развертывание

```bash
# Шаг 1: Создание нового окружения
kubectl create namespace normaldance-blue
kubectl create namespace normaldance-green

# Шаг 2: Развертывание в зеленом окружении
helm install normaldance-green normaldance/normaldance \
  --namespace normaldance-green \
  --set image.tag=v1.0.1 \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=api.normaldance.com

# Шаг 3: Переключение трафика
kubectl patch ingress normaldance-ingress -n normaldance-green \
  --patch '{"spec":{"rules":[{"host":"api.normaldance.com","http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"normaldance-service","port":{"number":3000}}}}]}}]}}'

# Шаг 4: Проверка работы
curl -I http://api.normaldance.com

# Шаг 5: Удаление старого окружения
helm uninstall normaldance-blue -n normaldance-blue
kubectl delete namespace normaldance-blue
```

### Canary развертывание

```bash
# Шаг 1: Развертывание canary версии
kubectl set image deployment/normaldance normaldance=normaldance:v1.0.1-canary --record

# Шаг 2: Проверка работы
kubectl rollout status deployment/normaldance

# Шаг 3: Увеличение трафика на canary
kubectl patch deployment normaldance --patch='{"spec":{"template":{"spec":{"containers":[{"name":"normaldance","env":[{"name":"TRAFFIC_PERCENTAGE","value":"10"}]}]}}}}'

# Шаг 4: Мониторинг метрик
kubectl logs -f deployment/normaldance

# Шаг 5: Полное переключение
kubectl set image deployment/normaldance normaldance=normaldance:v1.0.1 --record
```

## 🚨 Обработка аварий

### Шаг 1: Автоматическое восстановление

```yaml
# Pod Disruption Budget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: normaldance-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: normaldance
```

### Шаг 2: Резервное копирование

```bash
# Создание бэкапа базы данных
kubectl exec -it postgres-0 -n normaldance -- pg_dump -U normaldance normaldance > backup.sql

# Восстановление из бэкапа
kubectl exec -it postgres-0 -n normaldance -- psql -U normaldance normaldance < backup.sql
```

### Шаг 3: Мониторинг аварий

```bash
# Настройка Sentry
npm install @sentry/node @sentry/tracing

# В коде приложения
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

## 📈 Оптимизация производительности

### Шаг 1: Кеширование

```yaml
# Redis для кеширования
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Шаг 2: CDN

```yaml
# CloudFlare или AWS CloudFront
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: normaldance-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  tls:
  - hosts:
    - api.normaldance.com
    secretName: normaldance-tls
  rules:
  - host: api.normaldance.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: normaldance-service
            port:
              number: 3000
```

### Шаг 3: Оптимизация базы данных

```sql
-- Индексы для оптимизации запросов
CREATE INDEX idx_tracks_created_at ON tracks(created_at);
CREATE INDEX idx_tracks_genre ON tracks(genre);
CREATE INDEX idx_tracks_artist_id ON tracks(artist_id);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_nfts_created_at ON nfts(created_at);
CREATE INDEX idx_nfts_category ON nfts(category);

-- Аналитические индексы
CREATE INDEX idx_analytics_plays ON analytics(play_count);
CREATE INDEX idx_analytics_date ON analytics(date);
```

## 🧪 Тестирование развертывания

### Шаг 1: Интеграционное тестирование

```bash
# Запуск тестов
npm test

# Заполнение тестовыми данными
npm run db:seed:testing

# Проверка API
npm run test:integration
```

### Шаг 2: Нагрузочное тестирование

```bash
# Использование k6
npm install -g k6

# Запуск нагрузочного теста
k6 run --vus 100 --duration 30s tests/load-test.js
```

### Шаг 3: Безопасностное тестирование

```bash
# Сканирование уязвимостей
npm audit
npm audit fix

# Тесты безопасности
npm run test:security
```

## 📚 Дополнительные ресурсы

### Документация
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs)
- [Solana Documentation](https://docs.solana.com)

### Инструменты
- [Docker Hub](https://hub.docker.com)
- [Helm Charts](https://hub.helm.sh)
- [Prometheus](https://prometheus.io)
- [Grafana](https://grafana.com)

### Сообщество
- [GitHub Issues](https://github.com/normaldance/normaldance/issues)
- [Discord](https://discord.gg/normaldance)
- [Telegram](https://t.me/normaldance)

---

**Создано:** Сентябрь 2025
**Версия:** v1.0.1
**Обновлено:** Последнее обновление: Сентябрь 2025