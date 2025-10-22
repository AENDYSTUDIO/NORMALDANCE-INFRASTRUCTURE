# 📊 Мониторинг и обсервабельность

## Обзор системы мониторинга

NORMAL DANCE использует комплексную систему мониторинга для обеспечения надежности и производительности платформы.

## 🏗️ Архитектура мониторинга

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Приложение    │───►│   Prometheus    │───►│   Grafana       │
│   (Метрики)     │    │   (Сбор)        │    │   (Визуализация)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Fluent Bit    │    │   Jaeger        │    │   AlertManager  │
│   (Логи)        │    │   (Трейсинг)    │    │   (Алертинг)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📈 Метрики приложения

### Системные метрики

```typescript
// src/lib/metrics/system.ts
import client from 'prom-client';

export const cpuUsage = new client.Gauge({
  name: 'nodejs_cpu_usage_percentage',
  help: 'Current CPU usage percentage'
});

export const memoryUsage = new client.Gauge({
  name: 'nodejs_memory_usage_bytes',
  help: 'Memory usage in bytes'
});

export const activeConnections = new client.Gauge({
  name: 'nodejs_active_connections',
  help: 'Number of active connections'
});

export const eventLoopLag = new client.Histogram({
  name: 'nodejs_eventloop_lag_seconds',
  help: 'Lag of event loop in seconds',
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
});
```

### Бизнес-метрики

```typescript
// src/lib/metrics/business.ts
export const tracksUploaded = new client.Counter({
  name: 'tracks_uploaded_total',
  help: 'Total number of tracks uploaded',
  labelNames: ['genre', 'user_type']
});

export const streamsStarted = new client.Counter({
  name: 'streams_started_total',
  help: 'Total number of streams started',
  labelNames: ['track_id', 'user_id', 'device_type']
});

export const nftMinted = new client.Counter({
  name: 'nft_minted_total',
  help: 'Total number of NFTs minted',
  labelNames: ['track_id', 'collection_id']
});
```

### Health Check метрики

```typescript
// src/lib/metrics/health.ts
export const healthCheckDuration = new client.Histogram({
  name: 'health_check_duration_seconds',
  help: 'Duration of health checks',
  labelNames: ['check_type']
});

export const serviceStatus = new client.Gauge({
  name: 'service_status',
  help: 'Service health status (1 = healthy, 0 = unhealthy)',
  labelNames: ['service_name']
});
```

## 📊 Дашборды Grafana

### Основной дашборд

**Панели:**
- CPU и память использование
- Количество активных подключений
- RPS (requests per second)
- Error rate
- Response time распределение

### Бизнес-метрики дашборд

**Панели:**
- Загруженные треки по жанрам
- Стримы по времени суток
- Популярные треки
- Доход платформы
- Активность пользователей

### Инфраструктурный дашборд

**Панели:**
- Kubernetes pod статусы
- Resource utilization по неймспейсам
- Network I/O
- Disk usage
- Node exporter метрики

## 🚨 Алертинг

### Правила алертинга

```yaml
# alertmanager/alert-rules.yml
groups:
  - name: application
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}% over the last 5 minutes"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "95th percentile response time is {{ $value }}s"

      - alert: ServiceDown
        expr: up{job="normaldance"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "Service has been down for more than 1 minute"
```

### Каналы уведомлений

#### Slack уведомления

```yaml
# alertmanager/config.yml
route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'slack'

receivers:
  - name: 'slack'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#alerts'
        title: 'Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }} - {{ .Annotations.description }}\n{{ end }}'
```

#### Email уведомления

```yaml
- name: 'email'
  email_configs:
    - to: 'oncall@normaldance.com'
      from: 'alertmanager@normaldance.com'
      smarthost: 'smtp.gmail.com:587'
      auth_username: '${SMTP_USERNAME}'
      auth_password: '${SMTP_PASSWORD}'
```

## 📝 Логирование

### Структурированное логирование

```typescript
// src/lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        service: 'normaldance',
        ...meta
      });
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.File({ filename: 'logs/errors.log', level: 'error' })
  ]
});

export default logger;
```

### Fluent Bit конфигурация

```yaml
# fluent-bit/fluent-bit.conf
[SERVICE]
    Flush        5
    Log_Level    info

[INPUT]
    Name         tail
    Path         /var/log/containers/*normaldance*.log
    Parser       docker
    Tag          normaldance.*
    Refresh_Interval 5

[FILTER]
    Name         kubernetes
    Match        normaldance.*
    Kube_URL     https://kubernetes.default.svc:443
    Kube_CA_File /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    Kube_Token_File /var/run/secrets/kubernetes.io/serviceaccount/token

[OUTPUT]
    Name         elasticsearch
    Match        *
    Host         elasticsearch
    Port         9200
    Logstash_Format On
```

## 🔍 Трейсинг

### OpenTelemetry интеграция

```typescript
// src/lib/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-grpc';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://jaeger:4317',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

### Кастомные трейсы

```typescript
import { trace } from '@opentelemetry/api';

export const withTracing = async <T>(
  spanName: string,
  fn: () => Promise<T>
): Promise<T> => {
  const tracer = trace.getTracer('normaldance');
  const span = tracer.startSpan(spanName);

  try {
    const result = await fn();
    span.setStatus({ code: 0 }); // OK
    return result;
  } catch (error) {
    span.setStatus({ code: 1, message: error.message }); // ERROR
    throw error;
  } finally {
    span.end();
  }
};
```

## 🏥 Health Checks

### Kubernetes Health Checks

```yaml
# deployment.yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
    scheme: HTTP
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/ready
    port: 3000
    scheme: HTTP
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /api/startup
    port: 3000
    scheme: HTTP
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 30
```

### Health Check эндпоинты

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      ipfs: await checkIPFS(),
      solana: await checkSolana()
    }
  };

  const isHealthy = Object.values(health.services).every(s => s.status === 'ok');

  return Response.json(health, {
    status: isHealthy ? 200 : 503
  });
}

// src/app/api/ready/route.ts
export async function GET() {
  // Проверка готовности сервисов
  const ready = await checkApplicationReadiness();

  return Response.json({ status: ready ? 'ready' : 'not_ready' }, {
    status: ready ? 200 : 503
  });
}
```

## 📊 Кастомные метрики

### Метрики блокчейн операций

```typescript
// src/lib/metrics/blockchain.ts
export const blockchainOperations = new client.Counter({
  name: 'blockchain_operations_total',
  help: 'Total blockchain operations',
  labelNames: ['operation', 'network', 'status']
});

export const gasUsed = new client.Histogram({
  name: 'blockchain_gas_used',
  help: 'Gas used in blockchain operations',
  labelNames: ['operation'],
  buckets: [1000, 5000, 10000, 50000, 100000]
});
```

### Метрики стриминга

```typescript
// src/lib/metrics/streaming.ts
export const streamDuration = new client.Histogram({
  name: 'stream_duration_seconds',
  help: 'Duration of music streams',
  labelNames: ['track_id', 'user_id'],
  buckets: [10, 30, 60, 300, 600, 1800, 3600]
});

export const bufferEvents = new client.Counter({
  name: 'stream_buffer_events_total',
  help: 'Total buffer events during streaming',
  labelNames: ['track_id', 'reason']
});
```

## 🔧 Мониторинг инфраструктуры

### Kubernetes метрики

```yaml
# prometheus/prometheus.yml
scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: pod

  - job_name: 'normaldance-app'
    static_configs:
      - targets: ['normaldance:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Node Exporter

```yaml
# Мониторинг узлов Kubernetes
- job_name: 'node-exporter'
  static_configs:
    - targets: ['node-exporter:9100']
  scrape_interval: 30s
```

## 📋 Дашборды мониторинга

### Создание дашборда

```json
{
  "dashboard": {
    "title": "NORMAL DANCE - Application Overview",
    "panels": [
      {
        "title": "Requests per Second",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{status_code}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "heatmap",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
```

## 🚨 Инцидентный отклик

### Процесс реагирования

1. **Обнаружение**: Автоматическое алертинг
2. **Оценка**: Определение критичности
3. **Реагирование**: Немедленные действия
4. **Анализ**: Пост-мортем анализ
5. **Улучшение**: Профилактические меры

### Runbook'и

#### Высокий error rate

```bash
# 1. Проверить логи приложения
kubectl logs -f deployment/normaldance -n production

# 2. Проверить ресурсы
kubectl top pods -n production

# 3. Проверить внешние зависимости
curl -f https://api.solana.com/ || echo "Solana API down"

# 4. Масштабировать при необходимости
kubectl scale deployment normaldance --replicas=5 -n production
```

#### База данных недоступна

```bash
# 1. Проверить статус базы данных
kubectl exec -it deployment/postgres -n production -- pg_isready

# 2. Проверить логи PostgreSQL
kubectl logs deployment/postgres -n production

# 3. Перезапустить при необходимости
kubectl rollout restart deployment/postgres -n production
```

## 📈 Производительность

### APM интеграция

```typescript
// src/lib/apm.ts
import elasticApm from 'elastic-apm-node';

elasticApm.start({
  serviceName: 'normaldance',
  serverUrl: process.env.APM_SERVER_URL,
  environment: process.env.NODE_ENV
});

export default elasticApm;
```

### Database Query мониторинг

```typescript
// src/lib/db-monitoring.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' }
  ]
});

prisma.$on('query', (e) => {
  queryDurationHistogram.observe(e.duration);
  if (e.duration > 1000) {
    logger.warn('Slow query detected', { query: e.query, duration: e.duration });
  }
});
```

## 🔒 Безопасность мониторинга

### Аутентификация Grafana

```yaml
# grafana/values.yaml
adminUser: admin
adminPassword: "${GRAFANA_ADMIN_PASSWORD}"

ingress:
  enabled: true
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - monitoring.normaldance.com
  tls:
    - secretName: grafana-tls
      hosts:
        - monitoring.normaldance.com
```

### Шифрование данных

```yaml
# fluent-bit конфигурация с шифрованием
[OUTPUT]
    Name         secure_forward
    Host         log-aggregator
    Port         24284
    Shared_Key   "${FLUENT_BIT_SHARED_KEY}"
    Self_Hostname normaldance-prod
```

---

*Для получения дополнительной информации обратитесь к конфигурационным файлам в папке `monitoring/` или создайте issue в репозитории.*
