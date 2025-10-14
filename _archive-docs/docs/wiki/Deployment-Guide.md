# 🚀 Deployment Guide

## Production Deployment

### Prerequisites
- AWS Account with appropriate permissions
- Kubernetes cluster (EKS recommended)
- Docker registry access
- Domain name and SSL certificates
- Environment variables configured

### One-Click Deployment
```bash
# Execute the automated deployment script
./scripts/deploy/one-click-deploy.sh

# Or deploy specific environment
./scripts/deploy/one-click-deploy.sh staging
./scripts/deploy/one-click-deploy.sh production
```

## Manual Deployment Steps

### 1. Build and Push Docker Images
```bash
# Build production image
docker build -t normaldance:latest .

# Tag for registry
docker tag normaldance:latest your-registry/normaldance:v2.3.0

# Push to registry
docker push your-registry/normaldance:v2.3.0
```

### 2. Deploy to Kubernetes
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres-ha.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

### 3. Database Migration
```bash
# Run database migrations
kubectl exec -it deployment/normaldance-app -- npx prisma migrate deploy

# Seed initial data (if needed)
kubectl exec -it deployment/normaldance-app -- npm run seed
```

## Environment Configuration

### Production Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3000
APP_URL=https://normaldance.com
API_URL=https://api.normaldance.com

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/normaldance
REDIS_URL=redis://redis:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://normaldance.com

# Web3
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta
WALLET_PRIVATE_KEY=your-wallet-private-key

# Storage
IPFS_GATEWAY=https://gateway.pinata.cloud
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Staging Environment
```bash
# Similar to production but with staging URLs and test keys
NODE_ENV=staging
APP_URL=https://staging.normaldance.com
SOLANA_NETWORK=devnet
```

## Infrastructure as Code

### AWS CloudFormation
```bash
# Deploy infrastructure
aws cloudformation deploy \
  --template-file aws/cloudformation/production-stack.yml \
  --stack-name normaldance-production \
  --parameter-overrides \
    Environment=production \
    DomainName=normaldance.com \
  --capabilities CAPABILITY_IAM
```

### Terraform (Alternative)
```bash
# Initialize Terraform
cd terraform/
terraform init

# Plan deployment
terraform plan -var-file="production.tfvars"

# Apply infrastructure
terraform apply -var-file="production.tfvars"
```

## Monitoring Setup

### Prometheus Configuration
```yaml
# prometheus-config.yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'normaldance-app'
    static_configs:
      - targets: ['normaldance-app:3000']
    metrics_path: '/api/metrics'
    
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

### Grafana Dashboards
```bash
# Import pre-configured dashboards
kubectl apply -f monitoring/grafana-dashboards.yaml

# Access Grafana
kubectl port-forward svc/grafana 3000:3000
```

## SSL/TLS Configuration

### Let's Encrypt with Cert-Manager
```yaml
# cert-manager-issuer.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@normaldance.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

### Ingress with SSL
```yaml
# ingress-ssl.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: normaldance-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - normaldance.com
    - api.normaldance.com
    secretName: normaldance-tls
  rules:
  - host: normaldance.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: normaldance-app
            port:
              number: 3000
```

## Health Checks

### Application Health Endpoint
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    const redis = await getRedisClient();
    await redis.ping();
    
    // Check external services
    const solanaConnection = new Connection(process.env.SOLANA_RPC_URL!);
    await solanaConnection.getVersion();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        redis: 'healthy',
        solana: 'healthy'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
```

### Kubernetes Health Checks
```yaml
# deployment-health.yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: app
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
```

## Backup and Recovery

### Database Backup
```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y-%m-%d)"
mkdir -p $BACKUP_DIR

# PostgreSQL backup
kubectl exec postgres-0 -- pg_dump -U postgres normaldance > $BACKUP_DIR/postgres.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/postgres.sql s3://normaldance-backups/$(date +%Y-%m-%d)/
```

### Disaster Recovery
```bash
# Restore from backup
kubectl exec -i postgres-0 -- psql -U postgres normaldance < backup.sql

# Verify data integrity
kubectl exec postgres-0 -- psql -U postgres -c "SELECT COUNT(*) FROM users;"
```

## Performance Optimization

### CDN Configuration
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['cdn.normaldance.com'],
    loader: 'cloudinary',
    path: 'https://res.cloudinary.com/normaldance/'
  },
  
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300' }
        ]
      }
    ];
  }
};
```

### Database Optimization
```sql
-- Production database optimizations
CREATE INDEX CONCURRENTLY idx_tracks_artist_created 
ON tracks(artist_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_nfts_status_price 
ON nfts(status, price) WHERE status = 'active';

-- Analyze tables
ANALYZE tracks;
ANALYZE nfts;
ANALYZE users;
```

## Rollback Procedures

### Application Rollback
```bash
# Rollback to previous version
kubectl rollout undo deployment/normaldance-app

# Rollback to specific revision
kubectl rollout undo deployment/normaldance-app --to-revision=2

# Check rollout status
kubectl rollout status deployment/normaldance-app
```

### Database Rollback
```bash
# Rollback database migration
npx prisma migrate resolve --rolled-back 20241219_add_new_table

# Apply previous migration
npx prisma migrate deploy
```

## Troubleshooting

### Common Issues

#### Pod Startup Issues
```bash
# Check pod logs
kubectl logs -f deployment/normaldance-app

# Describe pod for events
kubectl describe pod <pod-name>

# Check resource usage
kubectl top pods
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it deployment/normaldance-app -- npx prisma db pull

# Check database logs
kubectl logs -f statefulset/postgres
```

#### Performance Issues
```bash
# Check application metrics
curl https://normaldance.com/api/metrics

# Monitor resource usage
kubectl top nodes
kubectl top pods
```

### Emergency Procedures

#### Scale Down for Maintenance
```bash
# Scale to zero replicas
kubectl scale deployment normaldance-app --replicas=0

# Perform maintenance
# ...

# Scale back up
kubectl scale deployment normaldance-app --replicas=3
```

#### Emergency Rollback
```bash
# Quick rollback script
#!/bin/bash
kubectl rollout undo deployment/normaldance-app
kubectl rollout status deployment/normaldance-app
echo "Rollback completed"
```