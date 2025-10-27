# 🚀 NORMAL DANCE - Полное руководство по развертыванию и инфраструктуре

## Обзор инфраструктуры

NORMAL DANCE представляет собой современную Web3 музыкальную платформу с полной инфраструктурой для продакшена, включая:

- **Контейнеризация**: Многоэтапные Docker сборки с оптимизацией для Kubernetes
- **Оркестрация**: Kubernetes с Helm charts и GitOps подходом через Argo CD
- **CI/CD**: Автоматизированные пайплайны через GitLab CI и GitHub Actions
- **Мониторинг**: Prometheus + Grafana стек с комплексной обсервабельностью
- **Безопасность**: Network policies, RBAC, secrets management

## 🏗️ Архитектура системы

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Custom API    │    │   IPFS Node     │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Storage)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │    │   Solana RPC    │
│   (Database)    │    │    (Cache)      │    │   (Blockchain)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Предварительные требования

### Локальная разработка
- **Node.js**: 20.x или выше
- **Docker**: 20.10 или выше
- **Docker Compose**: 2.0 или выше
- **Git**: 2.30 или выше

### Продакшн окружение
- **Kubernetes**: 1.24 или выше
- **Helm**: 3.12 или выше
- **kubectl**: настроенный доступ к кластеру

## 🚀 Быстрый старт

### Локальное развертывание

```bash
# Клонирование репозитория
git clone https://github.com/AENDYSTUDIO/NORMALDANCE-REVOLUTION.git
cd NORMALDANCE-REVOLUTION

# Установка зависимостей
npm install

# Настройка базы данных
npm run db:generate
npm run db:migrate

# Запуск всех сервисов через Docker Compose
docker-compose up -d

# Доступ к приложению: http://localhost:3000
```

### Развертывание в Kubernetes

```bash
# Установка зависимостей Helm chart
helm dependency update ./helm/normaldance

# Развертывание в продакшн
helm install normaldance ./helm/normaldance \
  --namespace production \
  --create-namespace \
  --values ./helm/normaldance/values-production.yaml

# Проверка развертывания
kubectl get pods -n production
```

## 🔧 Конфигурация окружения

### Переменные окружения

Создайте файл `.env` на основе `.env.example`:

```bash
# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/normaldance"

# Кэширование
REDIS_URL="redis://localhost:6379"

# Blockchain
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
SOLANA_PRIVATE_KEY="your-private-key"

# IPFS
IPFS_GATEWAY_URL="http://localhost:8080"

# JWT секрет
JWT_SECRET="your-jwt-secret"

# Сервер
NODE_ENV="production"
PORT=3000
```

### Secrets Management

Для продакшна используйте Kubernetes secrets:

```bash
# Создание секретов
kubectl create secret generic normaldance-secrets \
  --from-literal=postgres-password=your-password \
  --from-literal=redis-password=your-password \
  --from-literal=jwt-secret=your-secret \
  --from-literal=solana-private-key=your-key \
  -n production
```

## 🐳 Docker контейнеры

### Структура образов

Проект использует многоэтапную сборку для оптимизации:

1. **nextjs**: Frontend Next.js приложение
2. **backend**: Кастомный Node.js сервер с Socket.IO
3. **ipfs-service**: IPFS узел с Helia интеграцией
4. **smart-contracts**: Solana программы и тесты

### Сборка образов

```bash
# Сборка всех сервисов
docker build -f docker/nextjs.Dockerfile -t normaldance-frontend:latest .
docker build -f docker/backend.Dockerfile -t normaldance-backend:latest .
docker build -f docker/ipfs-service.Dockerfile -t normaldance-ipfs:latest .
docker build -f docker/smart-contracts.Dockerfile -t normaldance-contracts:latest .

# Публикация в registry
docker tag normaldance-frontend:latest ghcr.io/aendystudio/normaldance-frontend:latest
docker push ghcr.io/aendystudio/normaldance-frontend:latest
```

## ☸️ Kubernetes развертывание

### Helm Chart структура

```
helm/normaldance/
├── Chart.yaml              # Метаданные чарта
├── values.yaml             # Значения по умолчанию
├── values-production.yaml  # Продакшн конфигурация
└── templates/              # Kubernetes манифесты
    ├── deployment.yaml     # Deployment ресурсы
    ├── service.yaml        # Service ресурсы
    ├── configmap.yaml      # Конфигурации
    ├── secret.yaml         # Секреты
    ├── ingress.yaml        # Ingress правила
    └── hpa.yaml           # Horizontal Pod Autoscaler
```

### Масштабирование

Автоматическое масштабирование на основе нагрузки:

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
  minReplicas: 3
  maxReplicas: 20
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

## 🔄 CI/CD пайплайны

### GitHub Actions

Автоматизированный пайплайн включает:

1. **Тестирование**: Unit тесты, интеграционные тесты
2. **Безопасность**: Snyk сканирование, secrets detection
3. **Сборка**: Многоэтапная Docker сборка с кэшированием
4. **Развертывание**: Автоматический деплой в Kubernetes

### GitLab CI

Альтернативный пайплайн для развертывания на Render:

```yaml
stages:
  - test
  - build
  - deploy
  - monitor

# Тестирование
test:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm run lint
    - npm test

# Сборка
build:
  stage: build
  script:
    - docker build -f docker/nextjs.Dockerfile -t $CI_REGISTRY_IMAGE .

# Развертывание
deploy:
  stage: deploy
  script:
    - curl -X POST "https://api.render.com/deploy" -H "Authorization: Bearer $RENDER_API_TOKEN"
```

## 📊 Мониторинг и обсервабельность

### Метрики приложения

Экспорт метрик через `/metrics` endpoint:

```typescript
// src/lib/metrics.ts
import client from 'prom-client';

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const responseTimeSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5]
});
```

### Health Checks

Проверки здоровья для Kubernetes probes:

```typescript
// Health check endpoints
app.get('/api/health', async (req, res) => {
  // Проверка базы данных, Redis, внешних сервисов
  const health = await checkServicesHealth();
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

app.get('/api/ready', async (req, res) => {
  // Проверка готовности приложения
  res.status(200).json({ status: 'ready' });
});
```

### Логирование

Структурированное логирование с Winston:

```typescript
// src/lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

## 🔒 Безопасность

### Network Policies

Ограничение сетевого трафика:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: normaldance-policy
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
          name: ingress-nginx
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 5432  # PostgreSQL
    - protocol: TCP
      port: 6379  # Redis
```

### RBAC

Контроль доступа на основе ролей:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: normaldance-role
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps"]
  verbs: ["get", "list", "watch"]
```

## 🚨 Мониторинг и алертинг

### Prometheus правила

```yaml
groups:
- name: normaldance
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"

  - alert: DatabaseConnectionFailed
    expr: up{job="postgres"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Database connection failed"
```

### Grafana дашборды

Кастомные дашборды для мониторинга:
- Application metrics (response time, error rates)
- Infrastructure metrics (CPU, memory, disk usage)
- Business metrics (user registrations, track uploads)
- Blockchain metrics (transactions, gas usage)

## 🔄 Стратегии развертывания

### Rolling Updates

Стратегия обновления без простоев:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: normaldance
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    spec:
      containers:
      - name: normaldance
        image: normaldance:latest
        ports:
        - containerPort: 3000
```

### Canary Deployments

Прогрессивное развертывание:

```yaml
# Canary deployment с 10% трафика
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: normaldance-canary
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"
```

## 🛠️ Разработка и отладка

### Локальная разработка

```bash
# Запуск в режиме разработки
npm run dev

# Сборка для продакшна
npm run build

# Тестирование
npm test
npm run test:watch

# Линтинг
npm run lint
npm run lint:fix
```

### Отладка в Kubernetes

```bash
# Просмотр логов
kubectl logs -f deployment/normaldance -n production

# Исполнение команд в контейнере
kubectl exec -it deployment/normaldance -n production -- /bin/bash

# Порт-форвардинг для локальной отладки
kubectl port-forward deployment/normaldance 3000:3000 -n production
```

## 📚 Дополнительные ресурсы

### Документация API
- [OpenAPI спецификация](./docs/api/openapi.yaml)
- [Postman коллекция](./docs/api/postman-collection.json)

### Руководства по эксплуатации
- [Руководство по эксплуатации](./docs/operations/runbook.md)
- [План реагирования на инциденты](./docs/operations/incident-response.md)

### Разработка
- [Руководство по вкладам](./CONTRIBUTING.md)
- [Архитектурные решения](./docs/architecture/decisions.md)

---

*Для получения дополнительной информации обратитесь к полной документации в папке `docs/` или создайте issue в репозитории.*
