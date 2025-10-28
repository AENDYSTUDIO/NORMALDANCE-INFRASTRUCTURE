# System Architecture Documentation

## Overview

NORMALDANCE is a production-ready decentralized Web3 music platform that revolutionizes music distribution through blockchain technology. It combines Solana, IPFS, and NFT technology to give artists complete control over their music and revenue streams.

## Technology Stack

### Frontend
- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **State Management**: Zustand
- **Real-time Communication**: Socket.IO

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js with Next.js API Routes
- **ORM**: Prisma ORM
- **Caching**: Redis

### Database
- **Primary**: PostgreSQL (with SQLite for development)
- **ORM**: Prisma Client

### Blockchain
- **Main Chain**: Solana (using Anchor framework)
- **Auxiliary Chain**: TON (The Open Network)
- **Wallet Integration**: Phantom and other Solana wallets

### Storage
- **Decentralized Storage**: IPFS/Filecoin (Helia)
- **Service**: Pinata SDK

### Mobile
- **Framework**: React Native + Expo

### Infrastructure & DevOps
- **Containerization**: Docker (multi-stage builds)
- **Orchestration**: Kubernetes + Helm
- **Deployment**: Argo CD (GitOps)
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: GitHub Actions

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────────┐  │
│  │   Web App    │  │ Mobile App     │  │ Telegram Mini App       │  │
│  │ (Next.js)    │  │ (React Native) │  │ (TWA)                   │  │
│  └──────────────┘  └────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────────┐  │
│  │   API GW     │  │   Backend      │  │ IPFS Service            │  │
│  │ (Traefik)    │  │ (Node.js)      │  │ (Helia)                 │  │
│  └──────────────┘  └────────────────┘  └─────────────────────────┘  │
│         │                  │                     │                 │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────────┐  │
│  │ Auth Service │  │ Track Service  │  │ Storage Service         │  │
│  └──────────────┘  └────────────────┘  └─────────────────────────┘  │
│         │                  │                     │                 │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────────┐  │
│  │ NFT Service  │  │ Token Service  │  │ Recommendation Service  │  │
│  └──────────────┘  └────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA & BLOCKCHAIN LAYER                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────────┐  │
│  │ PostgreSQL   │  │ Redis Cache    │  │ Solana Blockchain       │  │
│  │ (Prisma)     │  │                │  │ (NDT Token, Programs)   │  │
│  └──────────────┘  └────────────────┘  └─────────────────────────┘  │
│         │                                    │                     │
│  ┌──────────────┐                 ┌─────────────────────────┐      │
│  │ IPFS Storage │                 │ TON Blockchain          │      │
│  │ (Pinata)     │                 │ (Telegram Integration)  │      │
│  └──────────────┘                 └─────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Web Application (Next.js)
The main user interface built with Next.js 15 featuring:
- Server-Side Rendering (SSR) and Static Site Generation (SSG)
- App Router for improved routing
- TypeScript for type safety
- Tailwind CSS for styling
- Integration with Solana and TON wallets

### 2. Backend Services
RESTful API services built with Node.js and Express:
- Authentication service with wallet signature verification
- Track management service for music content
- NFT service for minting and managing music NFTs
- Token service for NDT token operations
- Staking service for token staking functionality

### 3. Blockchain Integration

#### Solana Integration
- **NDT Token**: SPL Token with deflationary model (2% burn on transactions)
- **TrackNFT Program**: Anchor program for music NFTs
- **Royalty Distribution**: Automatic royalty distribution to artists
- **Staking Program**: Token staking with rewards

#### TON Integration
- **Telegram Mini App**: Integration with Telegram's ecosystem
- **TON Connect**: Wallet connection for TON-based transactions
- **Telegram Stars**: Payment processing through Telegram's monetization system

### 4. Storage System
- **IPFS**: Decentralized storage for music files using Helia
- **Pinata**: Pinning service for reliable content availability
- **Metadata Storage**: On-chain and off-chain metadata management

### 5. Database Schema
Main entities include:
- **Users**: User profiles with wallet addresses
- **Tracks**: Music tracks with metadata and IPFS hashes
- **NFTs**: Music NFTs with ownership information
- **Transactions**: Record of all blockchain transactions
- **Tokens**: User token balances and staking information

## Microservices Architecture

The platform follows a microservices architecture with the following services:

### Frontend Services
- **Web Application**: Main web interface
- **Mobile Application**: iOS/Android app
- **Telegram Mini App**: Lightweight Telegram integration

### Backend Services
- **Authentication Service**: User authentication and wallet verification
- **Music Service**: Track upload, management, and streaming
- **NFT Service**: NFT minting, transfer, and management
- **Token Service**: NDT token operations and staking
- **Recommendation Service**: AI-powered music recommendations
- **Notification Service**: User notifications and alerts

### Infrastructure Services
- **IPFS Service**: File storage and retrieval
- **Indexing Service**: Blockchain data indexing
- **Analytics Service**: Usage analytics and metrics

## Data Flow

1. **User Authentication**:
   - User connects wallet (Phantom/Solflare/other)
   - Signature verification through backend
   - JWT token generation for session management

2. **Music Upload**:
   - User uploads music file through frontend
   - File stored in IPFS via IPFS service
   - Metadata stored in database
   - Optional NFT minting through Solana program

3. **Music Streaming**:
   - User requests track through frontend
   - Backend retrieves metadata and IPFS hash
   - Content streamed directly from IPFS gateway
   - Listening rewards distributed via token service

4. **NFT Operations**:
   - User mints NFT through frontend
   - Transaction processed via Solana program
   - Metadata updated in database
   - Ownership tracked both on-chain and off-chain

5. **Token Management**:
   - Rewards distributed for various activities
   - Users can stake tokens for additional rewards
   - Transactions processed through Solana

## Security Architecture

### Authentication & Authorization
- Wallet-based authentication
- JWT tokens for session management
- Role-based access control (RBAC)

### Data Protection
- Encryption at rest for sensitive data
- TLS encryption for data in transit
- Secure secret management through Vault

### Smart Contract Security
- Audited smart contracts
- Reentrancy guards
- Access control mechanisms
- Upgradeable contract patterns

## Scalability & Performance

### Horizontal Scaling
- Containerized services for easy scaling
- Load balancing through Traefik
- Database read replicas for scaling reads
- Redis caching for improved performance

### Performance Optimization
- CDN for static assets
- Database indexing for common queries
- Query optimization and connection pooling
- Caching strategies at multiple levels

## Monitoring & Observability

### Metrics Collection
- Application performance metrics
- Database performance monitoring
- Blockchain transaction monitoring
- User engagement metrics

### Logging
- Structured logging with trace IDs
- Centralized log aggregation with Loki
- Log retention and archival policies

### Alerting
- System health alerts
- Performance degradation alerts
- Security incident alerts
- Business metric alerts

## Deployment Architecture

### Development Environment
- Local development with Docker Compose
- Hot reloading for frontend and backend
- Integrated testing environment

### Production Deployment
- Kubernetes cluster with Helm charts
- Argo CD for GitOps deployment
- Multi-region deployment capabilities
- Blue-green deployment strategy

### CI/CD Pipeline
- Automated testing on every commit
- Security scanning and vulnerability detection
- Automated deployment to staging
- Manual approval for production deployment

## Future Architecture Improvements

### Planned Enhancements
1. **Multi-chain Support**: Integration with Ethereum, Polygon, and BSC
2. **AI Enhancement**: Advanced recommendation algorithms
3. **Metaverse Integration**: VR/AR music experiences
4. **Offline Support**: Enhanced mobile offline capabilities
5. **Social Features**: Enhanced social and community features