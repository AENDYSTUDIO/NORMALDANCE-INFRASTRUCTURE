#!/bin/bash

# NORMALDANCE-INFRASTRUCTURE Repository Setup Script
# This script initializes the infrastructure repository structure

set -e

echo "🚀 Setting up NORMALDANCE-INFRASTRUCTURE repository..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the NORMALDANCE-INFRASTRUCTURE repository root"
    exit 1
fi

# Create directory structure
print_status "Creating directory structure..."

directories=(
    ".github/workflows"
    ".github/ISSUE_TEMPLATES"
    "ansible/playbooks"
    "ansible/roles"
    "terraform/modules"
    "terraform/environments/dev"
    "terraform/environments/staging"
    "terraform/environments/prod"
    "terraform/scripts"
    "kubernetes/base"
    "kubernetes/overlays/dev"
    "kubernetes/overlays/staging"
    "kubernetes/overlays/prod"
    "kubernetes/operators"
    "helm/normaldance"
    "helm/monitoring"
    "helm/security"
    "monitoring/prometheus"
    "monitoring/grafana/dashboards"
    "monitoring/alertmanager"
    "monitoring/loki"
    "security/policies"
    "security/secrets"
    "security/scanning"
    "docs/architecture"
    "docs/runbooks"
    "docs/security"
    "scripts/deployment"
    "scripts/maintenance"
    "scripts/emergency"
    "tests/integration"
    "tests/chaos"
)

for dir in "${directories[@]}"; do
    mkdir -p "$dir"
    print_status "Created directory: $dir"
done

# Create initial files
print_status "Creating initial configuration files..."

# .gitignore for infrastructure
cat > .gitignore << 'EOF'
# Terraform
*.tfstate
*.tfstate.backup
.terraform/
terraform.tfvars

# Kubernetes
kubeconfig

# Secrets
secrets/
*.key
*.pem
*.p12

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Temporary files
*.tmp
*.swp
EOF

# GitHub Actions workflow template
cat > .github/workflows/infrastructure-deploy.yml << 'EOF'
name: Infrastructure Deployment

on:
  push:
    branches: [main, staging, development]
  pull_request:
    branches: [main, staging]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.5.0"

      - name: Terraform Format Check
        run: terraform fmt -check -recursive

      - name: Terraform Validate
        run: |
          for dir in terraform/environments/*/; do
            if [ -d "$dir" ]; then
              echo "Validating $dir"
              cd "$dir"
              terraform init -backend=false
              terraform validate
              cd - > /dev/null
            fi
          done

      - name: Kustomize Validate
        run: |
          for overlay in kubernetes/overlays/*/; do
            if [ -d "$overlay" ]; then
              echo "Validating $overlay"
              kubectl kustomize "$overlay" > /dev/null
            fi
          done

  test:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run Infrastructure Tests
        run: |
          echo "Running infrastructure tests..."
          # Add your test commands here

  security-scan:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run Trivy Security Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'config'
          scan-ref: './kubernetes'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy Results
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'

  deploy-staging:
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/staging' && github.event_name == 'push'
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to Staging
        run: |
          echo "Deploying to staging environment..."
          # Add your deployment commands here

  deploy-production:
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to Production
        run: |
          echo "Deploying to production environment..."
          # Add your deployment commands here
EOF

# Terraform module structure
cat > terraform/modules/vpc/main.tf << 'EOF'
# VPC Module for NORMALDANCE Infrastructure

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "az_count" {
  description = "Number of availability zones"
  type        = number
  default     = 3
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "normaldance-${var.environment}"
    Environment = var.environment
    Project     = "normaldance"
  }
}

resource "aws_subnet" "private" {
  count             = var.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "normaldance-${var.environment}-private-${count.index + 1}"
    Environment = var.environment
    Project     = "normaldance"
    Type        = "private"
  }
}

resource "aws_subnet" "public" {
  count             = var.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + var.az_count)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "normaldance-${var.environment}-public-${count.index + 1}"
    Environment = var.environment
    Project     = "normaldance"
    Type        = "public"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}
EOF

# Kubernetes base configuration
cat > kubernetes/base/kustomization.yaml << 'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - namespace.yaml
  - configmap.yaml
  - secret.yaml
  - deployment.yaml
  - service.yaml
  - ingress.yaml

patchesStrategicMerge:
  - patches/env-patch.yaml

images:
  - name: normaldance/app
    newTag: latest
EOF

# Monitoring configuration
cat > monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
      - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
      insecure_skip_verify: true
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
      - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: default;kubernetes;https

  - job_name: 'kubernetes-nodes'
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
      insecure_skip_verify: true
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)
      - target_label: __address__
        replacement: kubernetes.default.svc:443
      - source_labels: [__meta_kubernetes_node_name]
        regex: (.+)
        target_label: __metrics_path__
        replacement: /api/v1/nodes/${1}/proxy/metrics

  - job_name: 'normaldance-app'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: normaldance
        action: keep
      - source_labels: [__meta_kubernetes_pod_container_port_number]
        regex: "3000"
        action: keep
EOF

# Security policies
cat > security/policies/network-policy.yaml << 'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: normaldance-network-policy
  namespace: production
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
        - podSelector:
            matchLabels:
              app: normaldance
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
    - to: []
      ports:
        - protocol: TCP
          port: 443
        - protocol: TCP
          port: 80
EOF

# README for infrastructure repository
cat > README.md << 'EOF'
# NORMALDANCE-INFRASTRUCTURE

Infrastructure as Code repository for NORMAL DANCE platform.

## Overview

This repository contains all infrastructure components for the NORMAL DANCE Web3 music platform, including:

- **Terraform**: Infrastructure provisioning
- **Kubernetes**: Container orchestration
- **Helm**: Package management
- **Monitoring**: Observability stack
- **Security**: Policies and compliance
- **CI/CD**: Automated pipelines

## Repository Structure

```
├── .github/           # GitHub Actions workflows
├── ansible/           # Configuration management
├── terraform/         # Infrastructure as Code
├── kubernetes/        # K8s manifests
├── helm/             # Helm charts
├── monitoring/       # Observability
├── security/         # Security policies
├── docs/             # Documentation
├── scripts/          # Operational scripts
└── tests/            # Infrastructure tests
```

## Getting Started

### Prerequisites

- Terraform 1.5+
- kubectl 1.24+
- Helm 3.12+
- AWS CLI configured

### Local Development

1. Clone the repository
2. Initialize Terraform
3. Run tests
4. Deploy to development environment

```bash
# Initialize
terraform -chdir=terraform/environments/dev init

# Plan
terraform -chdir=terraform/environments/dev plan

# Test
make test

# Deploy
make deploy-dev
```

## Environments

- **development**: For feature development and testing
- **staging**: Pre-production environment
- **production**: Live production environment

## Contributing

1. Create a feature branch
2. Make changes with proper testing
3. Submit a pull request
4. Wait for review and approval

## Security

- All changes require security review
- Secrets are managed through sealed secrets
- Regular security scans are automated

## Documentation

- [Architecture Overview](./docs/architecture/)
- [Deployment Guide](./docs/runbooks/deployment.md)
- [Security Policies](./docs/security/)
- [Monitoring Setup](./docs/runbooks/monitoring.md)

## Support

For infrastructure issues, create an issue with the `infrastructure` label.
EOF

print_success "Repository structure created successfully!"
print_status "Next steps:"
echo "1. Initialize Git repository: git init"
echo "2. Add files: git add ."
echo "3. Create initial commit: git commit -m 'Initial infrastructure setup'"
echo "4. Set up remote: git remote add origin https://github.com/AENDYSTUDIO/NORMALDANCE-INFRASTRUCTURE.git"
echo "5. Push: git push -u origin main"
echo ""
print_warning "Remember to:"
echo "- Configure GitHub secrets for CI/CD"
echo "- Set up branch protection rules"
echo "- Configure Terraform Cloud workspace"
echo "- Set up monitoring alerts"

print_success "NORMALDANCE-INFRASTRUCTURE repository setup complete! 🎉"
