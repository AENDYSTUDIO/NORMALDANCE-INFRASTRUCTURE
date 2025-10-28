# 🚀 Архитектура развертывания NORMALDANCE

## Обзор инфраструктуры

NORMALDANCE развертывается в облачной инфраструктуре с использованием контейнеризации, оркестрации и геораспределения для обеспечения высокой доступности, масштабируемости и отказоустойчивости.

## Компоненты развертывания

### Контейнеризация

#### Docker образы

**Frontend (Next.js)**

```dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

**Backend (Node.js)**

```dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY prisma/ ./prisma/

EXPOSE 8080
CMD ["npm", "run", "start:prod"]
```

**IPFS Service**

```dockerfile
FROM ipfs/go-ipfs:latest
EXPOSE 4001 5001 8080

# Конфигурация для кластерной работы
COPY ipfs-config.json /data/ipfs/config
CMD ["daemon", "--migrate=true", "--enable-gc=true"]
```

### Оркестрация

#### Kubernetes кластер

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: normaldance-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: nextjs
          image: normaldance/frontend:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

#### Helm чарты

```
normaldance/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── frontend-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── database-statefulset.yaml
│   ├── redis-statefulset.yaml
│   ├── ipfs-statefulset.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   └── service.yaml
└── charts/
    ├── prometheus/
    └── grafana/
```

## Облачные сервисы

### AWS Infrastructure

```hcl
# Terraform конфигурация
resource "aws_eks_cluster" "normaldance" {
  name     = "normaldance-prod"
  role_arn = aws_iam_role.cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }
}

resource "aws_rds_cluster" "postgresql" {
  cluster_identifier = "normaldance-postgres"
  engine             = "aurora-postgresql"
  engine_version     = "15.4"
  database_name      = "normaldance"
  master_username    = var.db_username
  master_password    = var.db_password

  serverlessv2_config {
    max_capacity = 16
    min_capacity = 2
  }
}
```

### Сервисы AWS

- **EKS:** Kubernetes кластер
- **RDS Aurora:** PostgreSQL база данных
- **ElastiCache:** Redis кластер
- **S3:** Хранение статических файлов
- **CloudFront:** CDN
- **Route53:** DNS управление
- **Certificate Manager:** SSL сертификаты
- **WAF:** Web Application Firewall

### Резервное копирование

#### Автоматизированные бэкапы

```bash
#!/bin/bash
# Ежедневный бэкап базы данных
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="normaldance_backup_$DATE.sql"

pg_dump -U normaldance -h $DB_HOST -d normaldance > $BACKUP_FILE

# Загрузка в S3
aws s3 cp $BACKUP_FILE s3://normaldance-backups/database/

# Удаление старых бэкапов (старше 30 дней)
aws s3 ls s3://normaldance-backups/database/ | while read -r line; do
    createDate=`echo $line | awk {'print $1" "$2'}`
    createDate=`date -d"$createDate" +%s`
    olderThan=`date -d'30 days ago' +%s`
    if [[ $createDate -lt $olderThan ]]; then
        fileName=`echo $line | awk {'print $4'}`
        aws s3 rm s3://normaldance-backups/database/$fileName
    fi
done
```

#### Стратегия резервного копирования

| Компонент | Частота       | Хранение     | Восстановление  |
| --------- | ------------- | ------------ | --------------- |
| Database  | Ежечасно      | S3 (30 дней) | Point-in-Time   |
| Redis     | Ежедневно     | S3 (7 дней)  | Snapshot        |
| IPFS      | Ежеминутно    | Multi-region | Replication     |
| Config    | При изменении | Git + S3     | Version control |

## Геораспределение

### Multi-region deployment

```yaml
# Global load balancer
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: normaldance-global
  annotations:
    kubernetes.io/ingress.class: "gce"
    networking.gke.io/managed-certificates: "normaldance-tls"
spec:
  rules:
    - host: api.normaldance.com
      http:
        paths:
          - path: /*
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

### Регионы развертывания

1. **Primary (us-east-1):**

   - Полный кластер
   - Master database
   - 60% трафика

2. **Secondary (eu-west-1):**

   - Read-replica database
   - 30% трафика

3. **Tertiary (ap-southeast-1):**
   - CDN edge locations
   - 10% трафика

## Мониторинг и наблюдаемость

### Prometheus + Grafana стек

```yaml
# Prometheus конфигурация
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "kubernetes-pods"
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true

  - job_name: "kubernetes-services"
    kubernetes_sd_configs:
      - role: service
    relabel_configs:
      - source_labels:
          [__meta_kubernetes_service_annotation_prometheus_io_scrape]
        action: keep
        regex: true
```

### Ключевые метрики

#### Application метрики

- Response time (p50, p95, p99)
- Error rate
- Throughput (RPS)
- Active users

#### Infrastructure метрики

- CPU/Memory usage
- Disk I/O
- Network traffic
- Pod restarts

#### Business метрики

- Track uploads
- NFT mints
- Transaction volume
- User engagement

### Alert система

```yaml
# Alert manager правила
groups:
  - name: normaldance.alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}%"

      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
          description: "PostgreSQL has been down for more than 1 minute"
```

## Безопасность развертывания

### Network security

```yaml
# Network policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-allow
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080
```

### Secret management

```yaml
# External secrets operator
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: normaldance-secrets
spec:
  refreshInterval: 15s
  secretStoreRef:
    name: aws-secretsmanager
    kind: SecretStore
  target:
    name: normaldance-secret
    creationPolicy: Owner
  data:
    - secretKey: db-password
      remoteRef:
        key: prod/normaldance/database
        property: password
```

### Compliance

- **SOC 2 Type II** сертификация
- **GDPR** compliance для EU пользователей
- **PCI DSS** для платежей
- **ISO 27001** для информационной безопасности

## CI/CD Pipeline

### GitHub Actions workflow

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:all
      - name: Build
        run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - name: Security scan
        uses: securecodewarrior/github-action-security-scan@v1
      - name: Dependency check
        run: npm audit --audit-level=moderate

  deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          kubectl config use-context staging
          helm upgrade --install normaldance ./helm/normaldance -f helm/values-staging.yaml

      - name: Run e2e tests
        run: npm run test:e2e

      - name: Deploy to production
        run: |
          kubectl config use-context production
          helm upgrade --install normaldance ./helm/normaldance -f helm/values-production.yaml
```

### Blue-Green deployment

```yaml
# Blue-green стратегия
apiVersion: v1
kind: Service
metadata:
  name: normaldance-service
spec:
  selector:
    version: blue # или green
  ports:
    - port: 80
      targetPort: 3000
  type: LoadBalancer
```

## Масштабирование

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 3
  maxReplicas: 50
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

### Cluster Autoscaler

```yaml
# AWS EKS cluster autoscaler
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cluster-autoscaler
  namespace: kube-system
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT-ID:role/ClusterAutoscalerRole
```

## Disaster Recovery

### RTO/RPO цели

- **RTO (Recovery Time Objective):** 4 часа
- **RPO (Recovery Point Objective):** 1 час

### DR стратегия

1. **Multi-region replication**
2. **Automated failover**
3. **Backup validation**
4. **Regular DR drills**

### Runbook для аварий

```markdown
# Disaster Recovery Runbook

## Database Failover

1. Promote read replica to master
2. Update application configuration
3. Verify data consistency
4. Notify stakeholders

## Service Outage

1. Scale up remaining regions
2. Enable CDN caching
3. Communicate with users
4. Post-mortem analysis
```

## Cost Optimization

### Reserved Instances

```hcl
resource "aws_ec2_capacity_reservation" "normaldance" {
  instance_type     = "m5.large"
  instance_platform = "Linux/UNIX"
  availability_zone = "us-east-1a"
  instance_count    = 10

  tags = {
    Name = "NormalDance Reserved"
  }
}
```

### Spot Instances для не-критичных workloads

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ipfs-nodes
spec:
  replicas: 5
  template:
    spec:
      nodeSelector:
        lifecycle: spot
      tolerations:
        - key: "spot"
          operator: "Equal"
          value: "true"
          effect: "NoSchedule"
```

## Заключение

Архитектура развертывания NORMALDANCE обеспечивает высокую доступность, масштабируемость и безопасность платформы. Использование облачных сервисов, контейнеризации и современных DevOps практик позволяет эффективно управлять инфраструктурой и быстро реагировать на изменения нагрузки.

---

_Инфраструктура разработана для поддержки миллионов пользователей с минимальным downtime и максимальной производительностью._
