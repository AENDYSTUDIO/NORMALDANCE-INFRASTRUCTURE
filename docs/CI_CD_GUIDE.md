# 🔄 CI/CD и автоматизация развертывания

## Обзор CI/CD системы

NORMAL DANCE использует современную систему непрерывной интеграции и развертывания с несколькими пайплайнами для разных окружений.

## 🏗️ Архитектура CI/CD

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Git Push/PR  │───►│   GitHub/GitLab │───►│   Build & Test  │
└─────────────────┘    │   Actions/CI    │    └─────────────────┘
                       └─────────────────┘             │
                              │                       ▼
                              ▼              ┌─────────────────┐
                       ┌─────────────────┐    │   Docker Build  │
                       │   Security      │    │   & Push        │
                       │   Scanning      │    └─────────────────┘
                       └─────────────────┘             │
                              │                       ▼
                              ▼              ┌─────────────────┐
                       ┌─────────────────┐    │   Deploy to     │
                       │   Quality       │    │   Kubernetes    │
                       │   Gates         │    └─────────────────┘
                       └─────────────────┘             │
                              │                       ▼
                              ▼              ┌─────────────────┐
                       ┌─────────────────┐    │   Health Check  │
                       │   Monitoring    │    │   & Verification│
                       └─────────────────┘    └─────────────────┘
```

## 🛠️ Инструменты CI/CD

### GitHub Actions
Основной пайплайн для продакшн развертывания.

### GitLab CI
Альтернативный пайплайн для развертывания на Render.

### Дополнительные инструменты
- **Docker Buildx**: Многоархитектурная сборка
- **Helm**: Управление Kubernetes приложениями
- **kubectl**: Взаимодействие с кластером
- **Prometheus**: Мониторинг и алертинг

## 📋 Рабочие процессы

### 1. Pull Request Workflow

Автоматически запускается при создании/обновлении PR:

```yaml
name: Pull Request CI
on:
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build

      - name: Security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### 2. Main Branch Deployment

Автоматическое развертывание при пуше в main:

```yaml
name: Production Deployment
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBECONFIG }}" | base64 -d > kubeconfig

      - name: Deploy to Kubernetes
        run: |
          helm upgrade --install normaldance ./helm/normaldance \
            --namespace production \
            --set image.tag=${{ github.sha }}

      - name: Verify deployment
        run: |
          kubectl rollout status deployment/normaldance -n production
```

### 3. Security Scanning

Интеграция с Snyk для сканирования зависимостей:

```yaml
- name: Run Snyk to check for vulnerabilities
  uses: snyk/actions/node@master
  continue-on-error: true
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  with:
    args: --severity-threshold=high

- name: Upload Snyk results to GitHub
  uses: github/codeql-action/upload-sarif@v2
  if: always()
  with:
    sarif_file: snyk.sarif
```

## 🔧 Конфигурация пайплайнов

### Переменные окружения

Создайте следующие секреты в репозитории:

```bash
# GitHub Secrets
GITHUB_TOKEN          # Автоматически доступен
KUBECONFIG           # kubeconfig для продакшн кластера
DOCKER_PASSWORD      # Пароль для Docker registry
SNYK_TOKEN           # Токен для Snyk сканирования
SLACK_WEBHOOK_URL    # Для уведомлений
```

### Кастомные действия

Проект включает кастомные composite actions:

#### Docker Build Action
```yaml
- name: Build and Push Docker Images
  uses: ./.github/actions/docker-build
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
    services: '["nextjs", "backend", "ipfs-service"]'
```

#### Kubernetes Deploy Action
```yaml
- name: Deploy to Kubernetes
  uses: ./.github/actions/k8s-deploy
  with:
    kubeconfig: ${{ secrets.KUBECONFIG }}
    namespace: production
    helm-chart: ./helm/normaldance
```

## 🚀 Стратегии развертывания

### Blue-Green Deployment

Стратегия нулевого даунтайма:

```yaml
# Blue-Green стратегия
strategy:
  blueGreen:
    activeService: normaldance-active
    previewService: normaldance-preview
    autoPromotionEnabled: false
```

### Canary Releases

Прогрессивное развертывание с трафиком:

```yaml
# Canary развертывание
- name: Deploy Canary
  run: |
    helm upgrade normaldance-canary ./helm/normaldance \
      --set replicaCount=1 \
      --set image.tag=${{ github.sha }}

- name: Route Traffic
  run: |
    kubectl patch ingress normaldance \
      -p "{\"spec\":{\"rules\":[{\"http\":{\"paths\":[
        {\"path\":\"/\",\"pathType\":\"Prefix\",
         \"backend\":{\"service\":{\"name\":\"normaldance-canary\",
                                 \"port\":{\"number\":80}}}}]}}]}}"
```

### Rolling Updates

Стандартное обновление без даунтайма:

```yaml
# Rolling update стратегия
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 25%
    maxSurge: 25%
```

## 📊 Мониторинг развертываний

### Метрики развертывания

```typescript
// src/lib/deployment-metrics.ts
export class DeploymentMetrics {
  static recordDeployment(version: string, environment: string) {
    deploymentCounter.inc({
      version,
      environment,
      timestamp: Date.now()
    });
  }

  static recordHealthCheck(status: 'healthy' | 'unhealthy') {
    healthCheckGauge.set(status === 'healthy' ? 1 : 0);
  }
}
```

### Health Check интеграция

Автоматическая проверка здоровья после развертывания:

```bash
# Health check после развертывания
curl -f https://your-app.com/api/health || exit 1

# Readiness check
curl -f https://your-app.com/api/ready || exit 1

# Database migration check
kubectl wait --for=condition=complete job/migration-job
```

## 🚨 Управление ошибками

### Автоматический откат

```yaml
- name: Rollback on Failure
  if: failure()
  run: |
    kubectl rollout undo deployment/normaldance -n production

    # Уведомление команды
    curl -X POST -H 'Content-type: application/json' \
      -d '{"text":"🚨 Deployment failed, rollback initiated"}' \
      ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Мониторинг ошибок

```typescript
// src/lib/error-monitoring.ts
export class ErrorMonitor {
  static captureException(error: Error, context: any) {
    // Отправка в Sentry, LogRocket или другой сервис мониторинга
    errorTracker.captureException(error, { extra: context });
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error') {
    errorTracker.captureMessage(message, level);
  }
}
```

## 🔐 Безопасность в CI/CD

### Secrets Management

```yaml
# Шифрование секретов
- name: Encrypt secrets
  run: |
    echo "${{ secrets.DATABASE_PASSWORD }}" | base64 -w 0

# Использование в рантайме
- name: Use secrets
  env:
    DB_PASSWORD: ${{ secrets.DATABASE_PASSWORD }}
  run: |
    kubectl create secret generic db-secret \
      --from-literal=password=$DB_PASSWORD
```

### Vulnerability Scanning

Интеграция с различными сканерами безопасности:

```yaml
- name: Security Scan
  uses: securecodewarrior/github-action-trivy@main
  with:
    scan-type: 'fs'
    scan-ref: '.'
    format: 'sarif'

- name: Dependency Check
  uses: dependency-check/Dependency-Check_Action@main
  with:
    path: .
    format: 'ALL'
```

## 📈 Производительность и оптимизация

### Кэширование сборки

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Build with cache
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Параллельные задачи

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20]
        os: [ubuntu-latest, windows-latest]
```

## 🧪 Тестирование в CI/CD

### Многоуровневое тестирование

```yaml
- name: Unit Tests
  run: npm run test:unit

- name: Integration Tests
  run: npm run test:integration
  services:
    postgres:
      image: postgres:15
      env:
        POSTGRES_PASSWORD: test
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5

- name: E2E Tests
  run: npm run test:e2e
  timeout-minutes: 10
```

### Performance Testing

```yaml
- name: Performance Tests
  uses: actions/setup-node@v4
  with:
    node-version: '20'
- run: npm run test:performance
```

## 🚀 Деплоймент стратегии

### Многоэтапный деплоймент

```yaml
stages:
  - validate
  - build
  - test
  - deploy-staging
  - test-staging
  - deploy-production
```

### Условные деплойменты

```yaml
deploy-production:
  needs: [test-staging]
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to production
      run: |
        # Деплоймент логика
```

## 📋 Лучшие практики

### 1. Идемпотентность
- Каждый шаг пайплайна должен быть идемпотентным
- Используйте `--create-namespace` флаги
- Проверяйте существование ресурсов перед созданием

### 2. Отказоустойчивость
- Используйте `continue-on-error` для не критичных шагов
- Реализуйте автоматический откат при сбоях
- Мониторьте ключевые метрики после развертывания

### 3. Безопасность
- Никогда не логируйте секреты
- Используйте временные токены с ограниченным scope
- Регулярно ротируйте ключи доступа

### 4. Производительность
- Параллельное выполнение независимых задач
- Кэширование зависимостей и артефактов
- Оптимизация размера Docker образов

## 🔧 Устранение неисправностей

### Отладка пайплайнов

```bash
# Локальный запуск пайплайна
act -j test

# Просмотр логов GitHub Actions
gh run view <run-id> --log

# Диагностика проблем с Kubernetes
kubectl describe pod <pod-name> -n production
kubectl logs <pod-name> -n production --previous
```

### Мониторинг здоровья

```bash
# Проверка endpoint'ов здоровья
curl https://your-app.com/api/health
curl https://your-app.com/api/ready

# Мониторинг ресурсов
kubectl top pods -n production
kubectl top nodes
```

---

*Для получения дополнительной информации обратитесь к конкретным workflow файлам в `.github/workflows/` или создайте issue в репозитории.*
