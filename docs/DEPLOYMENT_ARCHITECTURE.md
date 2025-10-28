# Deployment Architecture Documentation

## Overview

The NORMALDANCE platform follows a modern cloud-native deployment architecture with containerization, orchestration, and GitOps principles. This document details the deployment architecture, infrastructure components, and operational procedures.

## Infrastructure Overview

### Cloud Providers

The platform is designed to be cloud-agnostic and can be deployed on:

1. **Primary**: AWS (Amazon Web Services)
2. **Secondary**: Google Cloud Platform (GCP)
3. **Alternative**: Microsoft Azure
4. **Self-hosted**: On-premises Kubernetes clusters

### Core Infrastructure Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                          LOAD BALANCER                              │
│                        (CloudFront/CDN)                             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                         INGRESS CONTROLLER                          │
│                           (Traefik)                                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                          KUBERNETES CLUSTER                         │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Worker    │  │   Worker    │  │   Worker    │  │   Worker    │ │
│  │   Node 1    │  │   Node 2    │  │   Node 3    │  │   Node 4    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌─────────────┐             ┌─────────────┐             ┌─────────────┐
│  DATABASE   │             │   STORAGE   │             │ MONITORING  │
│ (PostgreSQL │             │   (IPFS)    │             │  (Prometheus│
│   Cluster)  │             │             │             │   + Grafana)│
└─────────────┘             └─────────────┘             └─────────────┘
```

## Containerization Strategy

### Docker Images

All services are containerized using multi-stage Docker builds:

1. **Build Stage**: Compile and build artifacts
2. **Runtime Stage**: Minimal runtime environment with only necessary dependencies
3. **Security Stage**: Scan for vulnerabilities and apply security patches

### Base Images

- **Production**: Distroless or Alpine-based images for minimal attack surface
- **Development**: Development-friendly images with debugging tools

### Image Tagging Strategy

- `latest`: Latest stable release
- `vX.Y.Z`: Specific version tags
- `develop`: Latest development build
- `feature-branch`: Feature branch builds

## Orchestration with Kubernetes

### Cluster Architecture

#### Control Plane

- **API Server**: Primary interface for cluster management
- **etcd**: Distributed database for cluster state
- **Scheduler**: Assigns workloads to nodes
- **Controller Manager**: Manages cluster controllers

#### Worker Nodes

- **kubelet**: Node agent for communication with control plane
- **Container Runtime**: Docker or containerd for running containers
- **kube-proxy**: Network proxy for service networking

### Namespace Organization

```
production/          # Production workloads
staging/             # Staging environment
development/         # Development workloads
monitoring/          # Monitoring stack
database/            # Database workloads
networking/          # Networking components
```

### Core Services

#### Frontend Services

```yaml
# Next.js Web Application
- Deployment: 3+ replicas
- Service: ClusterIP
- Ingress: External access via Traefik
- HorizontalPodAutoscaler: CPU/Memory based scaling
```

#### Backend Services

```yaml
# API Server
- Deployment: 3+ replicas
- Service: ClusterIP
- Ingress: API endpoint via Traefik
- HorizontalPodAutoscaler: Request-based scaling

# Worker Services
- Deployment: 2+ replicas
- Service: ClusterIP
- HorizontalPodAutoscaler: Queue-based scaling
```

#### Database Services

```yaml
# PostgreSQL
- StatefulSet: 1 primary, 2 replicas
- Service: Headless for internal access
- PersistentVolume: For data persistence
- Backup: Automated daily backups

# Redis
- StatefulSet: 1 primary, 1 replica
- Service: ClusterIP
- PersistentVolume: For data persistence
```

#### Blockchain Services

```yaml
# Solana RPC Proxy
- Deployment: 2+ replicas
- Service: ClusterIP
- ExternalService: Connection to Solana mainnet

# IPFS Node
- StatefulSet: 1+ nodes
- Service: ClusterIP
- PersistentVolume: For data storage
```

## GitOps with Argo CD

### Repository Structure

```
normaldance-deploy/
├── charts/
│   ├── normaldance/
│   │   ├── templates/
│   │   ├── values.yaml
│   │   ├── values-production.yaml
│   │   └── values-staging.yaml
│   └── dependencies/
├── applications/
│   ├── production.yaml
│   ├── staging.yaml
│   └── development.yaml
└── scripts/
    └── deployment-scripts/
```

### Deployment Process

1. **Development**:
   - Developers push code to feature branches
   - CI pipeline builds and tests changes
   - Successful builds create preview environments

2. **Staging**:
   - Merge to `develop` branch triggers staging deployment
   - Automated testing in staging environment
   - Manual approval for production promotion

3. **Production**:
   - Merge to `main` branch triggers production deployment
   - Blue-green deployment strategy
   - Automated rollback on failure

### Argo CD Applications

```yaml
# Production Application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: normaldance-production
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/normaldance/deploy.git
    targetRevision: HEAD
    path: charts/normaldance
    helm:
      valueFiles:
        - values-production.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# Main pipeline stages
1. Code Checkout
2. Dependency Installation
3. Code Quality Checks
   - ESLint
   - TypeScript compilation
   - Unit tests
4. Security Scanning
   - Trivy for vulnerabilities
   - Snyk for code security
5. Build Docker Images
6. Push to Container Registry
7. Deploy to Staging
8. Integration Tests
9. Manual Approval for Production
10. Deploy to Production
```

### Container Registry

- **Primary**: AWS ECR (Elastic Container Registry)
- **Backup**: GitHub Container Registry
- **Retention**: 90 days for production images, 30 days for others

### Artifact Management

- Docker images tagged with Git commit SHA
- Helm charts versioned with semantic versioning
- Build metadata stored with each artifact

## Monitoring and Observability

### Prometheus Stack

#### Metrics Collection

- **Application Metrics**: Custom metrics from services
- **System Metrics**: Node, pod, and container metrics
- **Database Metrics**: PostgreSQL performance metrics
- **Blockchain Metrics**: RPC call performance

#### Alerting Rules

```yaml
# Critical alerts
- High error rate in API (>5%)
- High latency in database queries (>1s)
- Low disk space (<10%)
- Service downtime

# Warning alerts
- Moderate error rate in API (>1%)
- Moderate latency in database queries (>500ms)
- Medium disk space usage (>80%)
```

### Grafana Dashboards

#### Core Dashboards

1. **System Overview**: Cluster health and resource usage
2. **Application Performance**: API response times and error rates
3. **Database Performance**: Query performance and connection stats
4. **Blockchain Integration**: RPC performance and transaction metrics
5. **Business Metrics**: User engagement and revenue metrics

### Logging with Loki

#### Log Structure

- Structured JSON logs with trace IDs
- Centralized log aggregation
- Retention policies (30 days for application logs, 90 days for audit logs)

#### Log Access

- Grafana for log visualization
- CLI access for debugging
- Export capabilities for compliance

### Distributed Tracing

#### OpenTelemetry Integration

- Trace context propagation across services
- Performance analysis for complex operations
- Error tracking with detailed context

## Security Architecture

### Network Security

#### Network Policies

```yaml
# Restrict pod-to-pod communication
- Database pods only accessible by backend services
- Backend services only accessible by frontend and workers
- Internet access restricted to necessary services
```

#### Service Mesh (Optional)

- Istio for advanced traffic management
- Mutual TLS for service-to-service encryption
- Fine-grained authorization policies

### Secrets Management

#### HashiCorp Vault Integration

- Dynamic secrets for database access
- Certificate management for TLS
- Audit trails for secret access

#### Kubernetes Secrets

- Encrypted at rest with Kubernetes encryption
- RBAC controls for access
- Rotation policies for credentials

### Image Security

#### Container Scanning

- Trivy for vulnerability scanning
- Policy enforcement for critical vulnerabilities
- Base image update procedures

#### Image Signing

- Cosign for image signature verification
- Admission controllers to enforce signed images
- Key management for signing keys

## Backup and Disaster Recovery

### Database Backup

#### PostgreSQL Backup Strategy

- **Daily Full Backups**: Complete database snapshots
- **Hourly Incremental**: WAL (Write-Ahead Log) archiving
- **Point-in-Time Recovery**: Restore to any point within retention
- **Cross-Region Replication**: Backup copies in different regions

#### Backup Storage

- **Primary**: S3 with versioning enabled
- **Secondary**: Glacier for long-term archival
- **Encryption**: SSE-KMS for data at rest

### Disaster Recovery Plan

#### Recovery Point Objective (RPO)

- Maximum data loss: 1 hour
- Backup frequency: Hourly incremental

#### Recovery Time Objective (RTO)

- Critical services: 2 hours
- Non-critical services: 24 hours

#### Failover Procedures

1. **Automated Failover**:
   - Health checks monitor service availability
   - Automatic redirection to healthy instances
   - Load balancer configuration updates

2. **Manual Failover**:
   - Database replica promotion
   - DNS switching for external services
   - Configuration updates for new environment

## Scaling Strategy

### Horizontal Pod Autoscaler (HPA)

#### Metrics-Based Scaling

- **CPU Utilization**: Target 70% CPU usage
- **Memory Usage**: Target 80% memory usage
- **Custom Metrics**: Request rate, queue length

#### Configuration Example

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Vertical Pod Autoscaler (VPA)

#### Resource Optimization

- **Initial Recommendations**: Based on historical usage
- **Continuous Updates**: Adjust resources based on current usage
- **Resource Limits**: Prevent over-consumption

### Cluster Autoscaler

#### Node Group Scaling

- **Scale Up**: Add nodes when pods can't be scheduled
- **Scale Down**: Remove underutilized nodes
- **Node Pools**: Different pools for different workloads

## Environment Configuration

### Configuration Management

#### Helm Values Structure

```yaml
# values-production.yaml
replicaCount: 3
resources:
  limits:
    cpu: 1000m
    memory: 2Gi
  requests:
    cpu: 500m
    memory: 1Gi
env:
  DATABASE_URL: "postgresql://..."
  SOLANA_RPC_URL: "https://api.mainnet-beta.solana.com"
```

#### Environment Variables

- **Secrets**: Injected via Kubernetes secrets or Vault
- **Configuration**: ConfigMaps for non-sensitive settings
- **Feature Flags**: Dynamic configuration for feature toggles

### Multi-Environment Strategy

#### Environment Differences

| Aspect | Development | Staging | Production |
|--------|-------------|---------|------------|
| Replica Count | 1 | 2 | 3+ |
| Resources | Minimal | Medium | Full |
| Monitoring | Basic | Enhanced | Full |
| Backup | None | Daily | Hourly + Daily |
| Security | Basic | Enhanced | Full |

## Deployment Procedures

### Blue-Green Deployment

#### Process

1. **Prepare Green Environment**:
   - Deploy new version to green namespace
   - Run health checks and tests
   - Validate functionality

2. **Switch Traffic**:
   - Update load balancer to route to green
   - Monitor for issues
   - Rollback procedure ready

3. **Clean Up Blue**:
   - Keep blue for quick rollback
   - Decommission after stability period

### Canary Deployment

#### Process

1. **Deploy Canary**:
   - Route small percentage of traffic (5%) to new version
   - Monitor metrics and errors

2. **Gradual Rollout**:
   - Increase traffic in steps (5% → 25% → 50% → 100%)
   - Monitor at each step

3. **Full Deployment**:
   - Complete rollout when stable
   - Decommission old version

### Rollback Procedures

#### Automated Rollback

- Health check failures trigger automatic rollback
- Metrics-based rollback criteria
- Minimal downtime during rollback

#### Manual Rollback

- Git revert to previous stable commit
- Argo CD sync to previous state
- Manual validation of rollback

## Compliance and Auditing

### Audit Logging

#### Event Types

- User authentication and authorization
- Data access and modification
- Configuration changes
- Security events

#### Log Retention

- **Operational Logs**: 30 days
- **Security Logs**: 90 days
- **Compliance Logs**: 7 years

### Compliance Standards

#### GDPR

- Data encryption at rest and in transit
- Right to data portability
- Data deletion procedures
- Privacy by design

#### SOC 2

- Security controls documentation
- Access logging and monitoring
- Incident response procedures
- Regular security assessments

## Cost Optimization

### Resource Optimization

#### Right-Sizing

- Regular review of resource requests and limits
- Utilization-based sizing adjustments
- Elimination of over-provisioned resources

#### Spot Instances

- Non-critical workloads on spot instances
- Preemptible node pools for batch jobs
- Graceful handling of instance termination

### Storage Optimization

#### Tiered Storage

- Hot storage for frequently accessed data
- Warm storage for occasionally accessed data
- Cold storage for archival data

#### Data Lifecycle

- Automated transition between storage tiers
- Data deduplication where possible
- Compression for large datasets

## Future Enhancements

### Multi-Region Deployment

#### Active-Passive Setup

- Primary region for all traffic
- Standby region for disaster recovery
- Automated failover procedures

#### Active-Active Setup

- Load balancing across regions
- Latency-based routing
- Data synchronization between regions

### Serverless Components

#### Function-as-a-Service

- Event-driven processing with AWS Lambda/GCP Functions
- Cost optimization for sporadic workloads
- Integration with existing services

### Edge Computing

#### CDN Integration

- Edge caching for static assets
- Edge computing for content delivery
- Reduced latency for global users

#### Edge Functions

- Serverless functions at the edge
- Real-time content processing
- Personalization at the edge