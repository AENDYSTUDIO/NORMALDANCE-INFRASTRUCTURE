# QWEN.md - Normal Dance Project Context

## 🎵 Project Overview

Normal Dance is a **production-ready decentralized music platform** that revolutionizes music distribution through Web3 technology. Built with Next.js, Solana integration, and IPFS storage, it provides artists with unprecedented control over their music and revenue streams.

**Version:** 0.1.1 (Production Ready)  
**License:** MIT  
**Repository:** https://github.com/AENDYSTUDIO/NORMALDANCE-REVOLUTION

### Core Features
- **Web3 Music Distribution**: Decentralized music platform with blockchain verification
- **Solana Integration**: Native Solana blockchain support with Phantom wallet integration
- **Deflationary Tokenomics**: Automatic 2% burn with staking rewards and treasury allocation
- **IPFS/Filecoin Storage**: Redundant decentralized file storage system
- **NFT Creation**: TrackNFT program for music NFTs with memorial functionality
- **Mobile App**: React Native application for iOS and Android

### Technology Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Custom Socket.IO server, Prisma ORM, SQLite/PostgreSQL
- **Blockchain**: Solana with custom Anchor programs (NDT, Staking, TrackNFT), TON integration
- **Storage**: IPFS/Filecoin with Helia integration and multi-gateway redundancy
- **Wallet**: Phantom wallet with custom transaction handling
- **Mobile**: React Native with Expo

## 🏗️ Infrastructure

- **Containerization**: Multi-stage Docker builds optimized for Kubernetes
- **Orchestration**: Kubernetes with Helm charts and GitOps via Argo CD
- **CI/CD**: Automated pipelines through GitHub Actions and GitLab CI
- **Monitoring**: Prometheus + Grafana stack with comprehensive observability
- **Security**: Network policies, RBAC, and secrets management

## 🔧 Building and Running

### Prerequisites
- Node.js 20+
- Solana CLI tools
- Docker (for local development)
- Phantom wallet for testing

### Quick Start
```bash
# Install dependencies
npm install

# Setup database
npm run db:generate
npm run db:migrate

# Run in development mode
npm run dev

# Or run locally with Docker
docker-compose up -d

# Access application: http://localhost:3000
```

### Production Deployment
```bash
# Deploy to Kubernetes
helm install normaldance ./helm/normaldance \
  --namespace production \
  --create-namespace \
  --values ./helm/normaldance/values-production.yaml
```

### Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Lint code
- `npm run db:migrate` - Run database migrations
- `npm run security:audit` - Security vulnerability check
- `npm run security:secrets` - Scan for secret leaks

### Environment Variables
Create a `.env.local` file based on `.env.example` with the following key variables:
- DATABASE_URL
- REDIS_URL
- NEXT_PUBLIC_SOLANA_RPC
- NEXT_PUBLIC_TON_RPC
- BACKEND_URL
- IPFS_SERVICE_URL

## 🏛️ Architecture

### Application Structure
```
src/
├── app/                      # Next.js App Router pages
├── components/              # React components
├── lib/                     # Utility libraries
├── hooks/                   # Custom React hooks
├── store/                   # Zustand stores
├── types/                   # TypeScript type definitions
├── utils/                   # Utility functions
├── mcp/                     # Model Context Protocol server
└── contexts/                # React contexts
```

### Custom Server Architecture
The application uses a custom Next.js server (`server.ts`) with:
- Socket.IO integration for real-time communication
- Redis adapter for multi-instance setups
- Custom health checks
- CORS configuration for multiple domains

### Security Features
- Content Security Policy implementation
- Input validation and sanitization
- Secure secret management
- Pre-commit security checks via Husky
- Environment validation system

## 🤝 Development Conventions

### Code Standards
- Strict TypeScript typing
- ESLint linting with project-specific rules
- JSDoc comments for public APIs
- Conventional commits for git messages
- Component organization following Atomic Design principles

### Git Workflow
```bash
git checkout -b feature/amazing-feature
# Make changes
npm run test  # Ensure tests pass
git commit -m 'feat: Add amazing feature'
git push origin feature/amazing-feature
```

### Testing
- Unit tests: `npm run test`
- Integration tests: `npm run test:integration`
- E2E tests: `npm run test:e2e`
- Coverage reports: `npm run test:coverage`

Target: 700+ test lines with 80%+ code coverage

### Development Pipeline
The project uses a unified CI pipeline with standardized checks:
- Code Quality: ESLint, TypeScript type checking
- Security Scans: Internal secrets scanner, Trivy, Snyk, CodeQL
- Testing: Unit and integration tests
- Build Verification: Application build checks
- Technical Debt Resolution: Systematic Phase 2 plan

## 📊 Deployment & Operations

### Docker Configuration
Multi-stage Dockerfile with:
- Dependency installation stage
- Build stage
- Production runner stage with security considerations
- Health check for Kubernetes
- Non-root user for security

### Kubernetes Deployment
- Helm charts for deployment
- Service configurations
- Ingress setup
- Persistent volumes for data storage
- Horizontal Pod Autoscaling

### Monitoring & Observability
- Application metrics with Prometheus
- Grafana dashboards
- Error tracking with Sentry
- Performance monitoring
- Log aggregation

## 📚 Documentation References

- `docs/DEPLOYMENT_GUIDE.md` - Complete infrastructure guide
- `docs/CI_CD_GUIDE.md` - CI/CD pipeline documentation
- `docs/DEVELOPMENT_GUIDE.md` - Local development setup
- `docs/API_DOCUMENTATION.md` - API reference
- `docs/MONITORING_GUIDE.md` - Monitoring and observability
- `docs/EXAMPLES_GUIDE.md` - Usage examples and integrations

## 🚀 Roadmap

### Immediate Goals (v0.2.0)
- Enhanced mobile app experience with offline support
- Advanced recommendation algorithms using AI/ML
- Expanded TON blockchain integration
- Cross-chain NFT marketplace
- Advanced analytics dashboard for artists

### Future Development
- Multi-chain compatibility (Ethereum, Polygon, BSC)
- Social features (artist collaboration, fan communities)
- Live streaming capabilities
- AI-powered music discovery and recommendations
- Metaverse integration

## 🧠 Special Features

### Deflationary Token Model
- Automatic 2% burn on each transaction
- Staking rewards mechanism
- Treasury allocation system

### Web3 Integrations
- Solana wallet connection (Phantom)
- TON wallet integration
- NFT creation and management
- Smart contract interactions

### Decentralized Storage
- IPFS with Helia implementation
- Multi-gateway redundancy
- Pinata integration for content persistence

### AI & ML Features
- Recommendation systems
- Content personalization
- Smart playlist generation

This comprehensive context covers the architecture, development practices, deployment strategies, and key features of the Normal Dance project, providing a solid foundation for anyone working on this Web3 music platform.