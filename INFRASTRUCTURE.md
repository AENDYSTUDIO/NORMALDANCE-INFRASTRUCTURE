# NORMAL DANCE Infrastructure

## Overview
Production-ready infrastructure for NORMAL DANCE Web3 Music Platform with Kubernetes, Helm, GitOps, and comprehensive monitoring.

## Architecture
- **Frontend**: Next.js with standalone output
- **Backend**: Node.js with Prisma ORM and Socket.io
- **Blockchain**: Solana smart contracts
- **Storage**: IPFS/Helia distributed storage
- **Database**: PostgreSQL with Redis caching
- **Orchestration**: Kubernetes with Helm charts
- **GitOps**: Argo CD for automated deployments
- **Monitoring**: Prometheus + Grafana stack

## Quick Start

### Prerequisites
- Kubernetes cluster (1.24+)
- Helm 3.12+
- Docker
- kubectl configured

### Deploy to Kubernetes
```bash
# Install dependencies
helm dependency update ./helm/normaldance

# Deploy to production
helm install normaldance ./helm/normaldance \
  --namespace production \
  --create-namespace \
  --values ./helm/normaldance/values-production.yaml

# Verify deployment
kubectl get pods -n production
```

### GitOps Setup
```bash
# Install Argo CD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Deploy application
kubectl apply -f argocd/application.yaml
```

## CI/CD Pipeline

### Automated Workflows
- **Build**: Multi-stage Docker builds with caching
- **Test**: Unit tests, integration tests, security scans
- **Deploy**: Automated Kubernetes deployment
- **Canary**: Progressive traffic shifting

### Manual Deployment
```bash
# Build images
docker build -f docker/nextjs.Dockerfile -t normaldance:latest .
docker build -f docker/backend.Dockerfile -t normaldance-backend:latest .
docker build -f docker/ipfs-service.Dockerfile -t normaldance-ipfs:latest .

# Push to registry
docker tag normaldance:latest ghcr.io/aendystudio/normaldance:latest
docker push ghcr.io/aendystudio/normaldance:latest
```

## Configuration

### Environment Variables
- `NODE_ENV`: production
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SOLANA_RPC_URL`: Solana RPC endpoint
- `IPFS_GATEWAY_URL`: IPFS gateway URL

### Secrets Management
```bash
# Create secrets
kubectl create secret generic normaldance-secrets \
  --from-literal=postgres-password=<password> \
  --from-literal=redis-password=<password> \
  --from-literal=jwt-secret=<secret> \
  -n production
```

## Monitoring & Observability

### Metrics
- Application metrics via `/metrics` endpoint
- Infrastructure metrics via Prometheus
- Custom dashboards in Grafana

### Health Checks
- Liveness probes: `/api/health`
- Readiness probes: `/api/ready`
- Startup probes for slow-starting services

### Logging
- Structured JSON logging
- Centralized log aggregation
- Error tracking and alerting

## Security

### Network Policies
- Ingress: Only from ingress controller
- Egress: Restricted to required services
- Inter-pod communication controlled

### Pod Security
- Non-root containers
- Read-only root filesystem
- Dropped capabilities
- Security contexts enforced

## Scaling & Performance

### Horizontal Pod Autoscaler
- CPU-based scaling (70% threshold)
- Memory-based scaling (80% threshold)
- Min replicas: 3, Max replicas: 20

### Resource Management
- CPU/Memory requests and limits
- Quality of Service classes
- Node affinity rules

## Disaster Recovery

### Database Backups
- Automated daily backups
- Point-in-time recovery
- Cross-region replication

### Application Recovery
- Rolling updates with zero downtime
- Automated rollback on failure
- Health check validation

## Development Workflow

1. **Feature Development**: Create feature branch
2. **Testing**: Automated CI pipeline runs tests
3. **Build**: Docker images built and pushed
4. **Staging**: Deploy to staging environment
5. **Production**: GitOps deployment via Argo CD
6. **Monitoring**: Observe metrics and logs

## Troubleshooting

### Common Issues
```bash
# Check pod status
kubectl get pods -n production

# View logs
kubectl logs -f deployment/normaldance -n production

# Debug networking
kubectl exec -it pod/normaldance-xxx -n production -- curl localhost:3000/api/health

# Check resources
kubectl top pods -n production
```

### Performance Tuning
- Adjust resource limits based on metrics
- Optimize database queries
- Configure caching strategies
- Monitor application performance

## Maintenance

### Updates
- Security patches via automated CI/CD
- Dependency updates with testing
- Kubernetes cluster upgrades
- Database maintenance windows

### Monitoring
- Set up alerting rules
- Review performance metrics
- Capacity planning
- Cost optimization