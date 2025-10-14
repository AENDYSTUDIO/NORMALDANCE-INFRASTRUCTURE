# 📊 Документация по мониторингу и логированию NORMAL DANCE v1.0.1

## 📋 Введение

Эта документация описывает систему мониторинга и логирования для платформы NORMAL DANCE v1.0.1. Система включает в себя сбор метрик, логирование, алертинг и визуализацию данных для обеспечения стабильной работы платформы.

### 🎯 Цели мониторинга
- **Мониторинг производительности** отслеживание ключевых метрик производительности
- **Обнаружение проблем** раннее выявление аномалий и сбоев
- **Аналитика использования** понимание поведения пользователей
- **Оптимизация ресурсов** эффективное использование инфраструктуры
- **Безопасность** мониторинг безопасности и подозрительной активности

### 🏗️ Архитектура мониторинга

```
┌─────────────────────────────────────────────────────────────┐
│                     Система мониторинга                     │
├─────────────────────────────────────────────────────────────┤
│  Data Collection Layer                                      │
│  ├─ Prometheus (Metrics)                                   │
│  ├─ Fluentd (Logs)                                         │
│  ├─ Jaeger (Traces)                                        │
│  └─ StatsD (Custom Metrics)                                │
├─────────────────────────────────────────────────────────────┤
│  Processing Layer                                          │
│  ├─ Alertmanager (Alerts)                                  │
│  ├─ Grafana (Visualization)                                │
│  ├─ Kibana (Log Analysis)                                  │
│  └─ Elasticsearch (Log Storage)                           │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer                                             │
│  ├─ Prometheus (Time Series Data)                          │
│  ├─ Elasticsearch (Log Data)                              │
│  ├─ InfluxDB (Metrics)                                     │
│  └─ Loki (Log Aggregation)                                 │
├─────────────────────────────────────────────────────────────┤
│  Alerting Layer                                            │
│  ├─ Slack/Email Notifications                              │
│  ├─ PagerDuty (Critical Alerts)                            │
│  ├─ Webhooks (Custom Integrations)                         │
│  └─ SMS (Emergency Alerts)                                 │
└─────────────────────────────────────────────────────────────┘
```

## 📈 Сбор метрик

### Prometheus Configuration

#### Основной конфигурационный файл
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'normaldance-api'
    static_configs:
      - targets: ['normaldance-api:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s
    labels:
      environment: 'production'
      service: 'api'

  - job_name: 'normaldance-websocket'
    static_configs:
      - targets: ['normaldance-websocket:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s
    labels:
      environment: 'production'
      service: 'websocket'

  - job_name: 'normaldance-database'
    static_configs:
      - targets: ['postgres:5432']
    metrics_path: '/metrics'
    scrape_interval: 30s
    scrape_timeout: 10s
    labels:
      environment: 'production'
      service: 'database'

  - job_name: 'normaldance-redis'
    static_configs:
      - targets: ['redis:6379']
    metrics_path: '/metrics'
    scrape_interval: 30s
    scrape_timeout: 10s
    labels:
      environment: 'production'
      service: 'redis'

  - job_name: 'normaldance-solana'
    static_configs:
      - targets: ['solana:8899']
    metrics_path: '/metrics'
    scrape_interval: 30s
    scrape_timeout: 10s
    labels:
      environment: 'production'
      service: 'solana'
```

#### Правила алертов
```yaml
# monitoring/alert_rules.yml
groups:
  - name: normaldance_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.instance }}"
          description: "Error rate is {{ $value }} errors per second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time on {{ $labels.instance }}"
          description: "95th percentile response time is {{ $value }} seconds"

      - alert: DatabaseConnectionErrors
        expr: rate(pg_stat_database_deadlocks[5m]) > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection errors on {{ $labels.instance }}"
          description: "Deadlock rate is {{ $value }} per second"

      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value }}%"

      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value }}%"

      - alert: SolanaConnectionErrors
        expr: rate(solana_rpc_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Solana connection errors on {{ $labels.instance }}"
          description: "Error rate is {{ $value }} errors per second"

      - alert: WebSocketConnectionErrors
        expr: rate(socketio_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "WebSocket connection errors on {{ $labels.instance }}"
          description: "Error rate is {{ $value }} errors per second"
```

### Кастомные метрики

#### В Node.js приложении
```typescript
// src/lib/metrics.ts
import { Counter, Histogram, Gauge } from 'prom-client'

// Счетчики
export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status', 'service']
})

export const errorCounter = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'service', 'environment']
})

export const userActionCounter = new Counter({
  name: 'user_actions_total',
  help: 'Total number of user actions',
  labelNames: ['action', 'user_type', 'service']
})

// Гистограммы
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status', 'service'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
})

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['query_type', 'table', 'service'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
})

export const websocketMessageDuration = new Histogram({
  name: 'websocket_message_duration_seconds',
  help: 'WebSocket message processing duration in seconds',
  labelNames: ['message_type', 'service'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5]
})

// Измерители
export const activeUsersGauge = new Gauge({
  name: 'active_users_total',
  help: 'Number of active users',
  labelNames: ['service', 'environment']
})

export const activeConnectionsGauge = new Gauge({
  name: 'active_connections_total',
  help: 'Number of active connections',
  labelNames: ['service', 'connection_type']
})

export const systemHealthGauge = new Gauge({
  name: 'system_health_score',
  help: 'System health score (0-100)',
  labelNames: ['service', 'component']
})
```

#### Использование метрик в API
```typescript
// src/app/api/tracks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { httpRequestCounter, httpRequestDuration, errorCounter } from '@/lib/metrics'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const tracks = await getTracks()
    
    httpRequestCounter.inc({
      method: 'GET',
      route: '/api/tracks',
      status: '200',
      service: 'api'
    })
    
    httpRequestDuration.observe({
      method: 'GET',
      route: '/api/tracks',
      status: '200',
      service: 'api'
    }, (Date.now() - startTime) / 1000)
    
    return NextResponse.json(tracks)
  } catch (error) {
    errorCounter.inc({
      type: 'database_error',
      service: 'api',
      environment: process.env.NODE_ENV
    })
    
    httpRequestDuration.observe({
      method: 'GET',
      route: '/api/tracks',
      status: '500',
      service: 'api'
    }, (Date.now() - startTime) / 1000)
    
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

#### WebSocket метрики
```typescript
// src/lib/websocket-metrics.ts
import { websocketMessageDuration, activeConnectionsGauge } from './metrics'

export class WebSocketMetrics {
  private static instance: WebSocketMetrics
  private connectionCounts = new Map<string, number>()

  static getInstance(): WebSocketMetrics {
    if (!WebSocketMetrics.instance) {
      WebSocketMetrics.instance = new WebSocketMetrics()
    }
    return WebSocketMetrics.instance
  }

  trackConnection(service: string, connectionType: string, increment: number = 1) {
    const key = `${service}:${connectionType}`
    const current = this.connectionCounts.get(key) || 0
    this.connectionCounts.set(key, current + increment)
    
    activeConnectionsGauge.set(
      { service, connection_type: connectionType },
      current + increment
    )
  }

  trackMessageProcessing(service: string, messageType: string, duration: number) {
    websocketMessageDuration.observe(
      { service, message_type: messageType },
      duration
    )
  }
}
```

## 📝 Логирование

### Структурированное логирование

#### Конфигурация Winston
```typescript
// src/lib/logger.ts
import winston from 'winston'
import { ElasticsearchTransport } from '@elastic/transport'
import { Client } from '@elastic/elasticsearch'

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
})

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'normaldance-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new ElasticsearchTransport({
      level: 'info',
      client: esClient,
      index: 'normaldance-logs'
    })
  ]
})

export default logger
```

#### Кастомные логгеры
```typescript
// src/lib/request-logger.ts
import logger from './logger'

export class RequestLogger {
  static logRequest(req: any, res: any, startTime: number) {
    const duration = Date.now() - startTime
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      statusCode: res.statusCode,
      duration,
      service: 'api'
    })
  }

  static logError(error: Error, req: any) {
    logger.error('Request Error', {
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      service: 'api'
    })
  }

  static logUserAction(userId: string, action: string, details: any = {}) {
    logger.info('User Action', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
      service: 'api'
    })
  }
}
```

#### Логирование транзакций
```typescript
// src/lib/transaction-logger.ts
import logger from './logger'

export class TransactionLogger {
  static logTransaction(transaction: any) {
    logger.info('Blockchain Transaction', {
      signature: transaction.signature,
      type: transaction.type,
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount,
      timestamp: new Date().toISOString(),
      service: 'blockchain'
    })
  }

  static logNFTTransfer(nftId: string, from: string, to: string, price: number) {
    logger.info('NFT Transfer', {
      nftId,
      from,
      to,
      price,
      timestamp: new Date().toISOString(),
      service: 'nft'
    })
  }

  static logStaking(stakeId: string, userId: string, amount: number, poolId: string) {
    logger.info('Staking Operation', {
      stakeId,
      userId,
      amount,
      poolId,
      timestamp: new Date().toISOString(),
      service: 'staking'
    })
  }
}
```

### Логирование безопасности
```typescript
// src/lib/security-logger.ts
import logger from './logger'

export class SecurityLogger {
  static logSecurityEvent(event: string, details: any) {
    logger.warn('Security Event', {
      event,
      details,
      timestamp: new Date().toISOString(),
      service: 'security'
    })
  }

  static logFailedLogin(email: string, ip: string, userAgent: string) {
    logger.warn('Failed Login Attempt', {
      email,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
      service: 'security'
    })
  }

  static logSuspiciousActivity(userId: string, activity: string, details: any) {
    logger.warn('Suspicious Activity', {
      userId,
      activity,
      details,
      timestamp: new Date().toISOString(),
      service: 'security'
    })
  }

  static logDataAccess(userId: string, dataType: string, operation: string, details: any) {
    logger.info('Data Access', {
      userId,
      dataType,
      operation,
      details,
      timestamp: new Date().toISOString(),
      service: 'security'
    })
  }
}
```

## 📊 Визуализация и дашборды

### Grafana дашборды

#### Основной дашборд
```json
{
  "dashboard": {
    "id": null,
    "title": "NormalDance Main Dashboard",
    "tags": ["normaldance", "main"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "HTTP Requests Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx Errors"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      },
      {
        "id": 3,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      },
      {
        "id": 4,
        "title": "Active Users",
        "type": "singlestat",
        "targets": [
          {
            "expr": "active_users_total"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
      }
    ]
  }
}
```

#### Дашборд базы данных
```json
{
  "dashboard": {
    "id": null,
    "title": "Database Metrics",
    "tags": ["normaldance", "database"],
    "panels": [
      {
        "id": 1,
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends",
            "legendFormat": "Active Connections"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Query Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(database_query_duration_sum[5m]) / rate(database_query_duration_count[5m])",
            "legendFormat": "Average Query Time"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      },
      {
        "id": 3,
        "title": "Deadlocks",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(pg_stat_database_deadlocks[5m])"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      }
    ]
  }
}
```

#### Дашборд WebSocket
```json
{
  "dashboard": {
    "id": null,
    "title": "WebSocket Metrics",
    "tags": ["normaldance", "websocket"],
    "panels": [
      {
        "id": 1,
        "title": "Active WebSocket Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "active_connections_total{connection_type=\"websocket\"}",
            "legendFormat": "WebSocket Connections"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Message Processing Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(websocket_message_duration_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      }
    ]
  }
}
```

## 🚨 Алертинг

### Alertmanager Configuration
```yaml
# monitoring/alertmanager/alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@normaldance.com'
  smtp_auth_username: 'alerts@normaldance.com'
  smtp_auth_password: 'your-smtp-password'

route:
  group_by: ['alertname', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  email_configs:
  - to: 'admin@normaldance.com'
    subject: 'NormalDance Alert: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      Labels: {{ .Labels }}
      {{ end }}
  
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#alerts'
    title: 'NormalDance Alert'
    text: |
      {{ range .Alerts }}
      *{{ .Annotations.summary }}*
      {{ .Annotations.description }}
      {{ end }}

- name: 'pagerduty'
  pagerduty_configs:
  - service_key: 'your-pagerduty-service-key'
    severity: 'critical'

- name: 'critical'
  email_configs:
  - to: 'critical-team@normaldance.com'
    subject: 'CRITICAL: {{ .GroupLabels.alertname }}'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#critical-alerts'
    color: 'danger'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'service']
```

### Кастомные алерты
```typescript
// src/lib/alerting.ts
import { AlertManager } from 'alertmanager-client'

const alertManager = new AlertManager({
  host: 'localhost',
  port: 9093,
  path: '/api/v1/alerts'
})

export class AlertService {
  static async sendAlert(
    alertName: string,
    severity: 'critical' | 'warning' | 'info',
    message: string,
    labels: Record<string, string> = {}
  ) {
    const alert = {
      labels: {
        alertname: alertName,
        severity,
        service: 'normaldance-api',
        ...labels
      },
      annotations: {
        summary: message,
        description: message
      },
      startsAt: new Date().toISOString()
    }

    try {
      await alertManager.post(alert)
      console.log(`Alert sent: ${alertName}`)
    } catch (error) {
      console.error('Failed to send alert:', error)
    }
  }

  static async sendCriticalAlert(message: string, labels?: Record<string, string>) {
    await this.sendAlert('Critical Error', 'critical', message, labels)
  }

  static async sendWarningAlert(message: string, labels?: Record<string, string>) {
    await this.sendAlert('Warning', 'warning', message, labels)
  }

  static async sendInfoAlert(message: string, labels?: Record<string, string>) {
    await this.sendAlert('Info', 'info', message, labels)
  }
}
```

## 🔍 Распространенные проблемы и их решение

### Проблема 1: Высокая нагрузка на базу данных
```typescript
// src/lib/database-monitoring.ts
import { databaseQueryDuration } from './metrics'

export class DatabaseMonitor {
  static async monitorQuery(query: string, params: any[], callback: () => Promise<any>) {
    const startTime = Date.now()
    
    try {
      const result = await callback()
      const duration = (Date.now() - startTime) / 1000
      
      databaseQueryDuration.observe(
        { query_type: 'select', table: this.getTableFromQuery(query) },
        duration
      )
      
      return result
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000
      databaseQueryDuration.observe(
        { query_type: 'select', table: this.getTableFromQuery(query) },
        duration
      )
      throw error
    }
  }

  private static getTableFromQuery(query: string): string {
    // Простая логика извлечения имени таблицы из запроса
    const match = query.match(/FROM\s+(\w+)/i)
    return match ? match[1] : 'unknown'
  }
}
```

### Проблема 2: Медленные WebSocket соединения
```typescript
// src/lib/websocket-monitoring.ts
import { WebSocketMetrics } from './websocket-metrics'

export class WebSocketMonitor {
  static trackMessageProcessing(socket: any, messageType: string, callback: () => Promise<any>) {
    const startTime = Date.now()
    
    return callback().finally(() => {
      const duration = Date.now() - startTime
      WebSocketMetrics.getInstance().trackMessageProcessing(
        'websocket',
        messageType,
        duration
      )
    })
  }

  static trackConnection(socket: any, connectionType: string) {
    WebSocketMetrics.getInstance().trackConnection(
      'websocket',
      connectionType,
      1
    )
  }
}
```

### Проблема 3: Память утечки
```typescript
// src/lib/memory-monitoring.ts
import { Gauge } from 'prom-client'

const memoryUsageGauge = new Gauge({
  name: 'nodejs_memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type', 'service']
})

export class MemoryMonitor {
  static startMonitoring() {
    setInterval(() => {
      const usage = process.memoryUsage()
      
      memoryUsageGauge.set({ type: 'rss', service: 'api' }, usage.rss)
      memoryUsageGauge.set({ type: 'heapTotal', service: 'api' }, usage.heapTotal)
      memoryUsageGauge.set({ type: 'heapUsed', service: 'api' }, usage.heapUsed)
      memoryUsageGauge.set({ type: 'external', service: 'api' }, usage.external)
    }, 30000) // Каждые 30 секунд
  }
}
```

## 📊 Аналитика использования

### Сбор пользовательской аналитики
```typescript
// src/lib/analytics.ts
import { userActionCounter } from './metrics'

export class AnalyticsService {
  static trackUserAction(userId: string, action: string, details: any = {}) {
    userActionCounter.inc({
      action,
      user_type: this.getUserType(userId),
      service: 'api'
    })
    
    // Отправка в аналитическую систему
    this.sendToAnalytics({
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    })
  }

  static trackPageView(userId: string, page: string, referrer?: string) {
    this.trackUserAction(userId, 'page_view', {
      page,
      referrer
    })
  }

  static trackEvent(userId: string, event: string, properties: any = {}) {
    this.trackUserAction(userId, 'event', {
      event,
      properties
    })
  }

  private static getUserType(userId: string): string {
    // Логика определения типа пользователя
    return 'user'
  }

  private static async sendToAnalytics(data: any) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.error('Failed to send analytics:', error)
    }
  }
}
```

### Отчеты и дашборды
```typescript
// src/lib/reports.ts
import logger from './logger'

export class ReportService {
  static async generateDailyReport() {
    const report = {
      date: new Date().toISOString().split('T')[0],
      metrics: {
        totalUsers: await this.getTotalUsers(),
        activeUsers: await this.getActiveUsers(),
        totalTracks: await this.getTotalTracks(),
        totalNFTs: await this.getTotalNFTs(),
        totalTransactions: await this.getTotalTransactions()
      },
      errors: await this.getErrorSummary(),
      performance: await this.getPerformanceSummary()
    }

    logger.info('Daily Report Generated', report)
    return report
  }

  private static async getTotalUsers(): Promise<number> {
    // Логика получения общего числа пользователей
    return 0
  }

  private static async getActiveUsers(): Promise<number> {
    // Логика получения числа активных пользователей
    return 0
  }

  private static async getTotalTracks(): Promise<number> {
    // Логика получения общего числа треков
    return 0
  }

  private static async getTotalNFTs(): Promise<number> {
    // Логика получения общего числа NFT
    return 0
  }

  private static async getTotalTransactions(): Promise<number> {
    // Логика получения общего числа транзакций
    return 0
  }

  private static async getErrorSummary(): Promise<any> {
    // Логика получения сводки по ошибкам
    return {}
  }

  private static async getPerformanceSummary(): Promise<any> {
    // Логика получения сводки по производительности
    return {}
  }
}
```

## 🔧 Интеграции

### Sentry для ошибок
```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  release: process.env.npm_package_version
})

export class SentryService {
  static captureException(error: Error, context?: any) {
    Sentry.captureException(error, {
      extra: context
    })
  }

  static captureMessage(message: string, level: Sentry.Severity = 'info') {
    Sentry.captureMessage(message, level)
  }

  static setUser(user: { id: string; email?: string }) {
    Sentry.setUser(user)
  }

  static configureScope(callback: (scope: Sentry.Scope) => void) {
    Sentry.configureScope(callback)
  }
}
```

### Datadog для APM
```typescript
// src/lib/datadog.ts
import { StatsD } from 'hot-shots'

const statsd = new StatsD({
  host: process.env.DATADOG_HOST || 'localhost',
  port: 8125,
  prefix: 'normaldance.'
})

export class DatadogService {
  static increment(metric: string, tags: Record<string, string> = {}) {
    statsd.increment(metric, 1, tags)
  }

  static decrement(metric: string, tags: Record<string, string> = {}) {
    statsd.decrement(metric, 1, tags)
  }

  static timing(metric: string, milliseconds: number, tags: Record<string, string> = {}) {
    statsd.timing(metric, milliseconds, tags)
  }

  static gauge(metric: string, value: number, tags: Record<string, string> = {}) {
    statsd.gauge(metric, value, tags)
  }

  static histogram(metric: string, value: number, tags: Record<string, string> = {}) {
    statsd.histogram(metric, value, tags)
  }
}
```

## 📚 Заключение

Система мониторинга и логирования NORMAL DANCE v1.0.1 обеспечивает полный контроль над состоянием платформы, позволяя及时发现 и решать проблемы, а также оптимизировать производительность. Основные компоненты:

- **Prometheus** для сбора метрик
- **Grafana** для визуализации
- **Alertmanager** для алертинга
- **Winston** для логирования
- **Elasticsearch** для хранения логов
- **Sentry** для отслеживания ошибок
- **Datadog** для APM

Эта система обеспечивает мониторинг всех ключевых аспектов платформы, включая производительность, безопасность, использование ресурсов и пользовательскую активность.

---

**Создано:** Сентябрь 2025
**Версия:** v1.0.1
**Обновлено:** Последнее обновление: Сентябрь 2025
**Ответственный:** DevOps Lead - Кузнецов В.А.