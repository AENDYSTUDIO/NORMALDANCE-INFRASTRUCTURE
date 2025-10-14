# План улучшения DevOps-процессов

## Обзор

В этом документе описывается план улучшения DevOps-процессов проекта NormalDance. Это улучшение имеет низкий приоритет для Q3-Q4 2025 года, так как обеспечивает автоматизацию инфраструктуры, улучшает процессы разработки и упрощает развертывание приложений.

## Текущая ситуация

### Существующие DevOps-процессы

- Базовая CI/CD система
- Ограниченная автоматизация развертывания
- Нет полноценной системы IaC
- Ограниченные практики DevOps

### Проблемы текущей реализации

- Ручные процессы развертывания
- Нет единообразия в инфраструктуре
- Ограниченная автоматизация
- Недостаточная мониторинговая инфраструктура

## Цели реализации

### Основные цели

- Оптимизация CI/CD-пайплайнов
- Внедрение Infrastructure as Code
- Настройка автоматического тестирования
- Улучшение мониторинга развертываний

### Технические цели

- Быстрые и надежные релизы
- Упрощенное управление инфраструктурой
- Повышенная стабильность развертываний
- Интеграция существующими процессами

## План реализации

### Этап 1: Анализ и аудит (Неделя 1-2)

- Анализ текущей CI/CD инфраструктуры
- Аудит процессов развертывания
- Оценка текущего состояния IaC
- Подготовка рекомендаций

### Этап 2: Подготовка инфраструктуры (Неделя 3-4)

- Настройка IaC инструментов
- Подготовка конфигураций для разных окружений
- Создание шаблонов инфраструктуры
- Интеграция с системами мониторинга

### Этап 3: CI/CD оптимизация (Неделя 5-6)

- Оптимизация существующих пайплайнов
- Внедрение дополнительных проверок
- Автоматизация тестирования
- Улучшение безопасности CI/CD

### Этап 4: Развертывание и мониторинг (Неделя 7-8)

- Настройка автоматических развертываний
- Интеграция с системами мониторинга
- Создание дашбордов для DevOps
- Тестирование процессов

### Этап 5: Внедрение (Неделя 9)

- Постепенное внедрение улучшений
- Обучение команды
- Обновление документации

## Технические детали

### Infrastructure as Code

#### Terraform конфигурации

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
 }

  backend "s3" {
    bucket         = "normaldance-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "normaldance-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  token                  = data.aws_eks_cluster_auth.this.token
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    token                  = data.aws_eks_cluster_auth.this.token
 }
}

# Переменные
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "Public subnet CIDRs"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnets" {
  description = "Private subnet CIDRs"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

# VPC
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "normaldance-vpc-${var.environment}"
  cidr = var.vpc_cidr

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_subnets  = var.public_subnets
 private_subnets = var.private_subnets

 enable_nat_gateway = true
  single_nat_gateway = true

 tags = {
    Environment = var.environment
    Project     = "NormalDance"
  }
}

# EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "normaldance-${var.environment}"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  node_security_group_additional_rules = {
    ingress_self_all = {
      description = "Node to node all ports/protocols"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "ingress"
      self        = true
    }
  }

  node_groups = {
    main = {
      desired_capacity = 3
      max_capacity     = 10
      min_capacity     = 2

      instance_types = ["t3.medium"]

      k8s_labels = {
        Environment = var.environment
      }

      additional_tags = {
        Name = "normaldance-node-group-${var.environment}"
      }
    }
  }

  tags = {
    Environment = var.environment
    Project     = "NormalDance"
  }
}

# RDS для production
resource "aws_db_instance" "production" {
  count = var.environment == "prod" ? 1 : 0

  identifier = "normaldance-db-${var.environment}"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"

  name     = "normaldance"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  allocated_storage    = 100
  max_allocated_storage = 1000
  storage_type         = "gp2"
  storage_encrypted    = true

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = false
  final_snapshot_identifier = "normaldance-final-snapshot-${var.environment}"

  tags = {
    Environment = var.environment
    Project     = "NormalDance"
  }
}

# Security groups и другие ресурсы...
```

#### Ansible плейбуки

```yaml
# ansible/playbooks/deploy-app.yml
---
- name: Deploy NormalDance Application
  hosts: all
  become: yes
  vars:
    app_name: "normaldance"
    app_user: "app"
    app_group: "app"
    app_dir: "/opt/{{ app_name }}"
    app_port: 3000
    node_version: "18"

  tasks:
    - name: Ensure app user exists
      user:
        name: "{{ app_user }}"
        group: "{{ app_group }}"
        system: yes
        shell: /bin/bash
        create_home: no

    - name: Install Node.js
      include_role:
        name: geerlingguy.nodejs

    - name: Install PM2 globally
      npm:
        name: pm2
        global: yes
        state: present

    - name: Create application directory
      file:
        path: "{{ app_dir }}"
        state: directory
        owner: "{{ app_user }}"
        group: "{{ app_group }}"
        mode: "0755"

    - name: Copy application files
      copy:
        src: "../dist/"
        dest: "{{ app_dir }}"
        owner: "{{ app_user }}"
        group: "{{ app_group }}"
        mode: "064"
      notify: restart application

    - name: Install application dependencies
      npm:
        path: "{{ app_dir }}"
        state: present
      become_user: "{{ app_user }}"
      notify: restart application

    - name: Create PM2 ecosystem file
      template:
        src: ecosystem.config.js.j2
        dest: "{{ app_dir }}/ecosystem.config.js"
        owner: "{{ app_user }}"
        group: "{{ app_group }}"
        mode: "0644"
      notify: restart application

    - name: Start application with PM2
      command: pm2 start ecosystem.config.js
      args:
        chdir: "{{ app_dir }}"
      become_user: "{{ app_user }}"
      register: pm2_result
      changed_when: "'online' in pm2_result.stdout"

  handlers:
    - name: restart application
      command: pm2 reload all
      become_user: "{{ app_user }}"
```

### CI/CD Pipeline

#### GitHub Actions для CI/CD

```yaml
# .github/workflows/ci-cd.yml
name: 🚀 CI/CD Pipeline

on:
  push:
    branches: [main, develop, staging]
  pull_request:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run type checking
      run: npm run type-check

    - name: Run unit tests
      run: npm run test:unit

    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
        REDIS_URL: redis://localhost:6379
      services:
        postgres:
          image: postgres:13
          env:
            POSTGRES_PASSWORD: postgres
            POSTGRES_DB: testdb
          options: >-
            --health-cmd pg_isready
            --health-interval 10s
            --health-timeout 5s
            --health-retries 5
        redis:
          image: redis:6
          options: >-
            --health-cmd "redis-cli ping"
            --health-interval 10s
            --health-timeout 5s
            --health-retries 5

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
        fail_ci_if_error: false

  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Run Trivy vulnerability scanner in repo mode
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
        ignore-unfixed: true
        vuln-type: 'os,library'
        severity: 'CRITICAL,HIGH'

    - name: Upload Trivy scan results to GitHub Security tab
      uses: github/codeql-action/upload-sarif@v2
      if: always()
      with:
        sarif_file: 'trivy-results.sarif'

  build-and-push:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/staging')

    permissions:
      contents: read
      packages: write

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Log in to the Container registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata for Docker
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy-dev:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'

    steps:
    - name: Deploy to development
      run: |
        echo "Deploying to development environment..."
        # Add deployment commands here
        # For example, using kubectl to update a Kubernetes deployment
        # kubectl set image deployment/normaldance normaldance=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'

    steps:
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment..."
        # Add deployment commands here

 deploy-prod:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Deploy to production
      run: |
        echo "Deploying to production environment..."
        # Add deployment commands here
        # Production deployments might require additional approvals
```

### Helm Chart

#### Helm chart для приложения

```yaml
# charts/normaldance/Chart.yaml
apiVersion: v2
name: normaldance
description: A Helm chart for NormalDance application
type: application
version: 0.1.0
appVersion: "1.0.0"
```

```yaml
# charts/normaldance/values.yaml
# Default values for normaldance
replicaCount: 3

image:
  repository: ghcr.io/normaldance/normaldance
  pullPolicy: IfNotPresent
  tag: ""

imagePullSecrets: []
nameOverride: ""
fullnameOverride: "normaldance"

serviceAccount:
 create: true
 annotations: {}
  name: ""

podAnnotations: {}

podSecurityContext: {}
 # fsGroup: 2000

securityContext: {}
  # capabilities:
  #   drop:
  #   - ALL
  # readOnlyRootFilesystem: true
  # runAsNonRoot: true
  # runAsUser: 1000

service:
  type: ClusterIP
  port: 3000

ingress:
  enabled: true
  className: "nginx"
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: normaldance.com
      paths:
        - path: /
          pathType: ImplementationSpecific
  tls:
    - secretName: normaldance-tls
      hosts:
        - normaldance.com

resources:
 limits:
    cpu: 500m
    memory: 1Gi
  requests:
    cpu: 250m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
  targetMemoryUtilizationPercentage: 80

nodeSelector: {}

tolerations: []

affinity: {}

env:
  - name: NODE_ENV
    value: "production"
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: normaldance-db-secret
        key: url
  - name: REDIS_URL
    valueFrom:
      secretKeyRef:
        name: normaldance-redis-secret
        key: url

configMap:
  enabled: true
  data:
    next.config.js: |
      module.exports = {
        // Next.js config
      }
```

```yaml
# charts/normaldance/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "normaldance.fullname" . }}
  labels:
    {{- include "normaldance.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "normaldance.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
      labels:
        {{- include "normaldance.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "normaldance.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: {{ .Chart.Name }}
          securityContext:
            {{- toYaml .Values.securityContext | nindent 12 }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: 3000
              protocol: TCP
          livenessProbe:
            httpGet:
              path: /api/health
              port: http
          readinessProbe:
            httpGet:
              path: /api/health
              port: http
          env:
            {{- toYaml .Values.env | nindent 12 }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

### Мониторинг и логирование

#### Конфигурация Prometheus и Grafana

```yaml
# monitoring/prometheus-config.yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: "normaldance-app"
    static_configs:
      - targets: ["normaldance-service:3000"]
    metrics_path: /api/metrics
    scrape_interval: 10s

  - job_name: "kubernetes-nodes"
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - source_labels: [__address__]
        regex: "(.*):10250"
        replacement: "${1}:10255"
        target_label: __address__

  - job_name: "kubernetes-pods"
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels:
          [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
```

```yaml
# monitoring/grafana-dashboards/normaldance-dashboard.json
{
  "dashboard":
    {
      "id": null,
      "title": "NormalDance Application Dashboard",
      "tags": ["normaldance", "app"],
      "style": "dark",
      "timezone": "browser",
      "panels":
        [
          {
            "id": 1,
            "title": "Request Rate",
            "type": "graph",
            "targets":
              [
                {
                  "expr": "rate(http_requests_total[5m])",
                  "legendFormat": "{{method}} {{status}}",
                },
              ],
            "yAxes": [{ "label": "Requests/sec", "show": true }],
          },
          {
            "id": 2,
            "title": "Response Time",
            "type": "graph",
            "targets":
              [
                {
                  "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
                  "legendFormat": "P95 Response Time",
                },
              ],
            "yAxes": [{ "label": "Seconds", "show": true }],
          },
          {
            "id": 3,
            "title": "Error Rate",
            "type": "graph",
            "targets":
              [
                {
                  "expr": 'rate(http_requests_total{status=~"5.."}[5m])',
                  "legendFormat": "5xx Errors",
                },
              ],
            "yAxes": [{ "label": "Errors/sec", "show": true }],
          },
          {
            "id": 4,
            "title": "Database Connections",
            "type": "singlestat",
            "targets": [{ "expr": "database_connections", "refId": "A" }],
            "valueName": "current",
          },
        ],
      "time": { "from": "now-6h", "to": "now" },
      "timepicker":
        {
          "time_options":
            ["5m", "15m", "1h", "6h", "12h", "24h", "2d", "7d", "30d"],
        },
    },
}
```

### Автоматизация развертывания

#### Скрипт автоматического развертывания

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-"dev"}
IMAGE_TAG=${2:-"latest"}
NAMESPACE=${3:-"normaldance-${ENVIRONMENT}"}

echo "Starting deployment to ${ENVIRONMENT} environment..."

# Проверка доступности kubectl
if ! command -v kubectl &> /dev/null; then
    echo "kubectl is required but not installed. Aborting."
    exit 1
fi

# Проверка доступности helm
if ! command -v helm &> /dev/null; then
    echo "helm is required but not installed. Aborting."
    exit 1
fi

# Создание namespace если не существует
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Обновление зависимостей Helm
helm dependency update charts/normaldance

# Установка/обновление релиза
helm upgrade --install normaldance \
    charts/normaldance \
    --namespace $NAMESPACE \
    --set image.tag=$IMAGE_TAG \
    --set environment=$ENVIRONMENT \
    --wait \
    --timeout=10m

# Проверка статуса развертывания
echo "Waiting for deployment to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=normaldance --timeout=300s -n $NAMESPACE

# Проверка сервисов
echo "Verifying services..."
kubectl get svc -n $NAMESPACE

# Проверка ingress (если используется)
if kubectl get ingress normaldance -n $NAMESPACE &> /dev/null; then
    echo "Ingress status:"
    kubectl get ingress normaldance -n $NAMESPACE
fi

echo "Deployment to ${ENVIRONMENT} completed successfully!"
echo "Deployment timestamp: $(date)"
```

### Документация DevOps

#### README для DevOps процессов

````markdown
# DevOps Processes for NormalDance

This document describes the DevOps processes and infrastructure for the NormalDance project.

## Infrastructure Overview

The NormalDance infrastructure is managed using Infrastructure as Code (IaC) with Terraform. The main components include:

- **VPC**: Virtual Private Cloud with public and private subnets
- **EKS**: Elastic Kubernetes Service cluster
- **RDS**: PostgreSQL database for production
- **S3**: Object storage for backups and static assets
- **CloudFront**: CDN for static assets

## CI/CD Pipeline

The CI/CD pipeline is implemented using GitHub Actions and includes the following stages:

1. **Test**: Unit, integration, and security tests
2. **Build**: Docker image building and pushing to registry
3. **Deploy**: Automated deployments to different environments

### Environments

- **Development** (`develop` branch): Auto-deployed from `develop` branch
- **Staging** (`staging` branch): Auto-deployed from `staging` branch
- **Production** (`main` branch): Auto-deployed from `main` branch

## Deployment Process

### Manual Deployment

To deploy manually to a specific environment:

```bash
./scripts/deploy.sh <environment> <image-tag>
```
````

Example:

```bash
./scripts/deploy.sh staging abc123
```

### Rollback Process

In case of issues, you can rollback to a previous version:

```bash
helm rollback normaldance <revision-number> --namespace <namespace>
```

## Monitoring and Observability

### Metrics

- Application metrics exposed via `/api/metrics`
- Kubernetes cluster metrics
- Database performance metrics
- Network and infrastructure metrics

### Logging

- Application logs in JSON format
- Centralized logging with Fluentd/Elasticsearch
- Structured logging for better analysis

### Alerting

- Critical alerts sent to Slack
- Performance degradation alerts
- Infrastructure health alerts

## Security

### Secrets Management

- Kubernetes secrets for sensitive data
- AWS Secrets Manager for infrastructure secrets
- Environment-specific secret management

### Security Scanning

- Trivy for container vulnerability scanning
- CodeQL for code security analysis
- Dependency vulnerability scanning

## Backup and Recovery

- Automated database backups to S3
- Application data backups
- Infrastructure state backups
- Regular recovery testing

## Contributing

When making changes to infrastructure:

1. Update Terraform configurations
2. Test changes in development environment
3. Create pull request with changes
4. Get approval from DevOps team
5. Apply changes to production during maintenance window

```

## Риски и меры по их снижению

### Риск 1: Сбои при автоматическом развертывании
- **Мера**: Постепенное развертывание (rolling updates)
- **Мера**: Автоматические откаты при сбоях

### Риск 2: Потеря данных при изменениях инфраструктуры
- **Мера**: Регулярные бэкапы
- **Мера**: Тестирование изменений в изолированной среде

### Риск 3: Нарушение безопасности
- **Мера**: Сканирование уязвимостей
- **Мера**: Принцип наименьших привилегий

## Критерии успеха

- Быстрые и надежные релизы
- Упрощенное управление инфраструктурой
- Повышенная стабильность развертываний
- Автоматизация рутинных задач
- Улучшенная видимость процессов

## Ресурсы

- 1-2 DevOps-инженера на 9 недель
- Инфраструктурные ресурсы для IaC
- Средства мониторинга и логирования

## Сроки

- Начало: 15 декабря 2025
- Завершение: 10 февраля 2026
- Общее время: 9 недель
```
