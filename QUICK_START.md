# 🚀 NORMAL DANCE Quick Start

## Prerequisites Installation

### 1. Install Required Tools
```cmd
# Run as Administrator
scripts\setup-tools.bat
```

### 2. Start Docker Desktop
- Install Docker Desktop from https://docker.com/products/docker-desktop
- Start Docker Desktop application

## Local Development

### Start All Services
```cmd
scripts\local-dev.bat
```

### Access Services
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend**: http://localhost:8080  
- 📁 **IPFS**: http://localhost:8081
- 🗄️ **Database**: localhost:5432
- 🔴 **Redis**: localhost:6379

## Production Deployment

### Prerequisites
- Kubernetes cluster access
- kubectl configured
- Helm 3.12+ installed

### Deploy to Production
```cmd
scripts\deploy-production.bat
```

## Manual Docker Build

### Build Images
```cmd
docker build -f docker\nextjs.Dockerfile -t normaldance:latest .
docker build -f docker\backend.Dockerfile -t normaldance-backend:latest .
docker build -f docker\ipfs-service.Dockerfile -t normaldance-ipfs:latest .
```

### Run Single Service
```cmd
docker run -p 3000:3000 normaldance:latest
```

## Troubleshooting

### Docker Issues
```cmd
# Check Docker status
docker info

# View running containers
docker ps

# Check logs
docker-compose logs -f
```

### Kubernetes Issues
```cmd
# Check cluster connection
kubectl cluster-info

# View pods
kubectl get pods -n production

# Check logs
kubectl logs -f deployment/normaldance -n production
```

## Next Steps
1. Configure environment variables in `.env`
2. Set up database migrations
3. Configure Solana RPC endpoints
4. Set up monitoring and alerting