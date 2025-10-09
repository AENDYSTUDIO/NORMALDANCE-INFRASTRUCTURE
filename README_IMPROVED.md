# 🚀 NORMALDANCE Enterprise Platform

## 🎯 Overview

Major improvements addressing all identified areas for enhancement in the NORMALDANCE platform. This repository contains the enterprise-grade music NFT platform with advanced features including security, performance optimizations, comprehensive testing, and modern documentation.

## ✅ What's Changed

- ✨ **Security**: Rate limiting, CORS protection, security headers
- ⚡ **Performance**: Service worker, progressive loading, caching
- 🧪 **Testing**: 70% coverage threshold, comprehensive mocks
- 📚 **Documentation**: Modern README with guides and API docs

## 🏗️ Architecture

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Custom Socket.IO server with Next.js API routes
- **Blockchain**: Solana integration with custom Anchor programs
- **Database**: Prisma ORM with SQLite/PostgreSQL
- **Storage**: IPFS/Filecoin redundancy system
- **Wallet**: Phantom wallet integration with custom event system

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS, shadcn/ui components
- **Blockchain**: Solana, Anchor, Phantom Wallet
- **Database**: Prisma, SQLite/PostgreSQL
- **Storage**: IPFS, Filecoin, Pinata
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions, Vercel

## 📚 Documentation

### Project Structure

```
├── src/                    # Main source code
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities and database
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript type definitions
├── programs/             # Solana Anchor programs
├── tests/               # Test files and configurations
├── prisma/              # Database schema and migrations
├── public/              # Static assets
└── scripts/             # Build and deployment scripts
```

### Key Features

- **Deflationary Token Model**: 2% burn on all transactions
- **NFT Creation & Trading**: Music NFT marketplace
- **Wallet Integration**: Phantom wallet support
- **IPFS Storage**: Redundant file storage system
- **Real-time Updates**: Socket.IO integration
- **Mobile Support**: Responsive design and PWA features

## 🔐 Security Features

- Rate limiting on all API endpoints
- CORS protection with secure policies
- Security headers implementation
- Input validation and sanitization
- Secure wallet transaction handling
- Environment variable management

## ⚡ Performance Optimizations

- Service worker for caching
- Progressive image loading
- Code splitting and lazy loading
- Database query optimization
- IPFS content delivery network
- WebSocket real-time communication

## 🧪 Testing Strategy

- Unit tests with 70%+ coverage
- Integration tests for API endpoints
- E2E tests for critical user flows
- Security tests for vulnerabilities
- Performance tests for load handling
- Mock implementations for external services

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Rust (for Solana programs)
- Anchor (Solana framework)
- Docker (for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/AENDYSTUDIO/NORMALDANCE-Enterprise.git
cd NORMALDANCE-Enterprise

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="your_database_url"

# Solana
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
NEXT_PUBLIC_PHANTOM_RPC_URL="https://solana-api.phantom.app"

# IPFS
PINATA_API_KEY="your_pinata_api_key"
PINATA_SECRET_API_KEY="your_pinata_secret"

# Wallet
WALLET_ADAPTER_NETWORK="mainnet-beta"

# Security
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"
```

## 📡 API Endpoints

### NFT Endpoints

- `GET /api/nfts` - Get all NFTs
- `POST /api/nfts` - Create new NFT
- `GET /api/nfts/:id` - Get specific NFT
- `PUT /api/nfts/:id` - Update NFT
- `DELETE /api/nfts/:id` - Delete NFT

### Track Endpoints

- `GET /api/tracks` - Get all tracks
- `POST /api/tracks` - Upload new track
- `GET /api/tracks/:id` - Get specific track
- `PUT /api/tracks/:id` - Update track metadata

### Transaction Endpoints

- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:id` - Get transaction details

## 🤖 Telegram Mini App

The platform includes a Telegram Mini App integration with:

- Seamless wallet connection
- NFT browsing and trading
- Real-time notifications
- Mobile-optimized interface

## 🏗️ Development Scripts

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run lint` - Lint code
- `npm run type-check` - Type check TypeScript

### Deployment

```bash
# Deploy to Vercel
npm run deploy

# Deploy Solana programs
npm run deploy:programs

# Deploy to custom server
npm run deploy:custom
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern="filename.test.ts"

# Run tests with coverage
npm test -- --coverage

# Run mobile app tests
cd mobile-app && npm test
```

### Test Structure

- Unit tests in `tests/unit/`
- Integration tests in `tests/integration/`
- E2E tests in `tests/e2e/`
- Security tests in `tests/security/`
- Performance tests in `tests/performance/`

## 🚢 Deployment

### Production Deployment

1. Ensure all tests pass
2. Run security audit
3. Build the application
4. Deploy to production environment

### CI/CD Pipeline

- Automated testing on push
- Security scanning
- Code coverage validation
- Automated deployment to staging
- Manual promotion to production

## 🔧 Configuration

### Performance Settings

- Service worker caching strategies
- Image optimization settings
- Bundle size optimization
- Database connection pooling

### Security Settings

- Rate limiting configuration
- CORS policy settings
- Security headers
- Authentication providers

## 📊 Performance Impact

- Service worker enables aggressive caching
- Progressive images improve perceived load times
- Code splitting and optimizations reduce bundle size
- Database query optimization improves response times
- CDN integration reduces latency

## 📝 Breaking Changes

None - all changes are additive and backwards compatible.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## 🚀 Ready for Production

- All quality checks pass
- Comprehensive testing setup
- Enhanced security measures
- Performance optimizations active
