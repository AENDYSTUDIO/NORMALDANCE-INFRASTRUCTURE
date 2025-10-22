# 🚀 Процесс развертывания NORMAL DANCE

## Обзор

Этот документ описывает полный процесс развертывания платформы NORMAL DANCE, включая все этапы от разработки до продакшена.

## 📋 Этапы развертывания

### 1. Подготовка к развертыванию

#### Проверка готовности кода

```bash
# Проверка статуса Git
git status

# Проверка ветки (должна быть main для продакшена)
git branch --show-current

# Проверка последних коммитов
git log --oneline -10

# Запуск тестов
npm run test
npm run lint

# Проверка сборки
npm run build
```

#### Настройка окружения

```bash
# Создание файла окружения
cp .env.example .env.production

# Редактирование переменных окружения
nano .env.production

# Проверка переменных окружения
./scripts/check-env.sh production
```

### 2. Сборка образов

#### Автоматическая сборка через скрипт

```bash
# Сборка всех образов
./scripts/deploy.sh production all

# Или сборка отдельных компонентов
./scripts/deploy.sh production kubernetes
./scripts/deploy.sh production render
```

#### Ручная сборка

```bash
# Сборка frontend
docker build -f docker/nextjs.Dockerfile -t normaldance-frontend:latest .

# Сборка backend
docker build -f docker/backend.Dockerfile -t normaldance-backend:latest .

# Сборка IPFS сервиса
docker build -f docker/ipfs-service.Dockerfile -t normaldance-ipfs:latest .

# Публикация в registry
docker tag normaldance-frontend:latest ghcr.io/aendystudio/normaldance-frontend:latest
docker push ghcr.io/aendystudio/normaldance-frontend:latest
```

### 3. Развертывание в Kubernetes

#### Через Helm

```bash
# Обновление зависимостей
helm dependency update ./helm/normaldance

# Развертывание
helm upgrade --install normaldance ./helm/normaldance \
  --namespace production \
  --create-namespace \
  --values ./helm/normaldance/values-production.yaml \
  --atomic \
  --timeout 10m

# Проверка развертывания
kubectl get pods -n production
kubectl get services -n production
kubectl get ingress -n production
```

#### Проверка состояния

```bash
# Проверка логов
kubectl logs -f deployment/normaldance -n production

# Проверка ресурсов
kubectl top pods -n production

# Проверка событий
kubectl get events -n production --sort-by=.metadata.creationTimestamp
```

### 4. Развертывание на Render

#### Автоматическое развертывание

Развертывание происходит автоматически через GitLab CI или GitHub Actions при пуше в ветку main.

#### Ручное развертывание

```bash
# Получение информации о сервисах
curl -H "Authorization: Bearer $RENDER_API_TOKEN" \
  "https://api.render.com/v1/services"

# Деплой конкретного сервиса
curl -X POST \
  -H "Authorization: Bearer $RENDER_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "your-service-id",
    "env": "production"
  }' \
  "https://api.render.com/v1/services/your-service-id/deploys"
```

### 5. Тестирование развертывания

#### Запуск полного тестирования

```bash
# Тестирование продакшн окружения
./scripts/test-deployment.sh production

# Тестирование staging окружения
./scripts/test-deployment.sh staging

# Локальное тестирование
./scripts/test-deployment.sh local
```

#### Проверка ключевых функций

```bash
# Health checks
curl -f https://dnb1st-ru.onrender.com/api/health
curl -f https://normaldance.your-domain.com/health

# API тестирование
curl -f https://dnb1st-ru.onrender.com/api/info

# WebSocket тестирование
# Используйте браузерные инструменты для проверки WebSocket соединений
```

### 6. Мониторинг и верификация

#### Проверка метрик

```bash
# Prometheus метрики
curl http://prometheus:9090/api/v1/query?query=up

# Приложение метрики
curl https://dnb1st-ru.onrender.com/metrics

# Grafana дашборды
# Откройте http://grafana:3000 в браузере
```

#### Проверка логов

```bash
# Логи приложения
kubectl logs -f deployment/normaldance -n production

# Логи через Loki
curl "http://loki:3100/loki/api/v1/query" \
  --data-urlencode 'query={app="normaldance"}' \
  --data 'limit=100'
```

## 🔧 Инструменты развертывания

### Автоматизированные скрипты

| Скрипт | Назначение | Использование |
|--------|------------|---------------|
| `scripts/deploy.sh` | Основной скрипт развертывания | `./scripts/deploy.sh production all` |
| `scripts/test-deployment.sh` | Тестирование после развертывания | `./scripts/test-deployment.sh production` |
| `scripts/rollback.sh` | Откат версии | `./scripts/rollback.sh production` |
| `scripts/backup.sh` | Создание резервных копий | `./scripts/backup.sh production` |

### CI/CD пайплайны

#### GitHub Actions

Автоматическое развертывание через `.github/workflows/ci-unified.yml`:

```yaml
name: 🚀 NORMAL DANCE - Unified CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  release:
    types: [published]

jobs:
  quality-check:      # Проверка качества кода
  build-application:  # Сборка приложения
  deploy-production:  # Деплой в продакшн
  deploy-kubernetes:  # Деплой в Kubernetes
  post-deploy:        # Мониторинг после деплоя
```

#### GitLab CI

Альтернативный пайплайн через `.gitlab-ci.yml`:

```yaml
stages:
  - test      # Тестирование
  - build     # Сборка
  - deploy    # Развертывание
  - monitor   # Мониторинг

# Развертывание на Render
deploy_dnb1st_ru:
  stage: deploy
  script:
    - curl -X POST "https://api.render.com/deploy"
```

## 📊 Мониторинг развертывания

### Метрики развертывания

| Метрика | Описание | Порог успеха |
|---------|----------|--------------|
| Deployment Duration | Время развертывания | < 10 минут |
| Health Check Success | Успешность health checks | 100% |
| Error Rate | Количество ошибок | < 1% |
| Response Time | Среднее время ответа | < 2 секунды |
| Resource Usage | Использование CPU/памяти | < 80% |

### Алертинг

Автоматические уведомления в Slack при:

- ❌ Неудачном развертывании
- ❌ Падении сервисов
- ⚠️ Высокий error rate
- ⚠️ Высокая latency
- ⚠️ Проблемы с ресурсами

## 🔄 Стратегии развертывания

### Rolling Updates (по умолчанию)

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 1
    maxSurge: 1
```

### Blue-Green Deployment

```bash
# Создание blue окружения
kubectl apply -f k8s/blue-deployment.yaml

# Тестирование blue версии
./scripts/test-deployment.sh blue

# Переключение трафика
kubectl apply -f k8s/green-deployment.yaml

# Удаление старой версии
kubectl delete -f k8s/blue-deployment.yaml
```

### Canary Deployment

```yaml
# Canary с 10% трафика
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"
```

## 🛠️ Устранение неисправностей

### Распространенные проблемы

#### Проблемы с развертыванием

```bash
# Проверка событий Kubernetes
kubectl get events -n production --sort-by=.metadata.creationTimestamp

# Проверка логов всех контейнеров
kubectl logs -n production --all-containers --prefix

# Проверка ресурсов
kubectl describe nodes
kubectl top nodes
```

#### Проблемы с базами данных

```bash
# Проверка подключения к PostgreSQL
kubectl exec -n production deployment/postgres -- pg_isready

# Проверка логов PostgreSQL
kubectl logs -n production deployment/postgres

# Проверка размера базы данных
kubectl exec -n production deployment/postgres -- \
  psql -U normaldance -d normaldance -c "SELECT pg_size_pretty(pg_database_size('normaldance'));"
```

#### Проблемы с производительностью

```bash
# Проверка использования ресурсов
kubectl top pods -n production

# Проверка сетевых политик
kubectl get networkpolicies -n production

# Проверка лимитов ресурсов
kubectl describe deployment normaldance -n production
```

### Восстановление после сбоев

#### Автоматический роллбек

```bash
# Роллбек последнего развертывания
kubectl rollout undo deployment/normaldance -n production

# Роллбек к конкретной версии
kubectl rollout undo deployment/normaldance --to-revision=2 -n production
```

#### Ручное восстановление

```bash
# Масштабирование до предыдущей версии
kubectl scale deployment normaldance --replicas=0 -n production
kubectl scale deployment normaldance --replicas=3 -n production

# Проверка и очистка ресурсов
kubectl get all -n production
kubectl delete pod -l app=normaldance -n production
```

## 📚 Дополнительные ресурсы

### Документация

- [Руководство по развертыванию](./DEPLOYMENT_GUIDE.md)
- [CI/CD руководство](./CI_CD_GUIDE.md)
- [Мониторинг руководство](./MONITORING_GUIDE.md)
- [Примеры разработки](./DEVELOPER_EXAMPLES.md)

### Конфигурации

- [Docker Compose полная](./docker-compose.full.yml)
- [Helm чарты](./helm/)
- [Kubernetes манифесты](./k8s/)
- [Мониторинг](./monitoring/)

### Скрипты

- [Основной деплой](./scripts/deploy.sh)
- [Тестирование](./scripts/test-deployment.sh)
- [Роллбек](./scripts/rollback.sh)
- [Бэкап](./scripts/backup.sh)

## 🎯 Рекомендации

### Для продакшена

1. **Автоматизация**: Используйте CI/CD пайплайны для автоматического развертывания
2. **Мониторинг**: Настройте комплексный мониторинг и алертинг
3. **Безопасность**: Регулярно обновляйте зависимости и проверяйте уязвимости
4. **Резервное копирование**: Настройте автоматическое резервное копирование данных
5. **Документация**: Поддерживайте актуальность документации

### Для разработки

1. **Локальное тестирование**: Используйте Docker Compose для локальной разработки
2. **Код ревью**: Проводите код ревью перед слиянием в main
3. **Тестирование**: Запускайте полный тестовый набор перед развертыванием
4. **Документирование**: Документируйте изменения и новые функции

---

*Процесс развертывания обновляется регулярно. Последняя редакция: $(date)*