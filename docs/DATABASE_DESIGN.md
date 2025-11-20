# Database Design Documentation

## Overview

The NORMALDANCE platform uses a PostgreSQL database with Prisma ORM for data persistence. The database schema is designed to support the platform's core functionality including user management, music content, NFTs, token economics, and transaction history.

## Database Technology

- **Primary Database**: PostgreSQL
- **ORM**: Prisma ORM
- **Development Database**: SQLite (for local development)
- **Caching**: Redis for performance optimization
- **Migration Tool**: Prisma Migrate

## Entity Relationship Diagram

```
┌─────────────┐        ┌──────────────┐
│    User     │◄───────┤   Session    │
└─────────────┘        └──────────────┘
       │                      │
       │               ┌──────────────┐
       ├──────────────►│   Wallet     │
       │               └──────────────┘
       │                      │
       │               ┌──────────────┐
       │               │ UserWallet   │
       │               └──────────────┘
       │
       ▼
┌─────────────┐        ┌──────────────┐
│   Track     │◄───────┤  TrackFile   │
└─────────────┘        └──────────────┘
       │
       ▼
┌─────────────┐        ┌──────────────┐
│   NFT       │◄───────┤ NFTMetadata  │
└─────────────┘        └──────────────┘
       │
       ▼
┌─────────────┐
│ Transaction │
└─────────────┘
       │
       ▼
┌─────────────┐        ┌──────────────┐
│ MusicToken  │◄───────┤  Staking     │
└─────────────┘        └──────────────┘
```

## Core Entities

### 1. User

The User entity represents a platform user, which can be a listener, artist, or curator.

```prisma
model User {
  id              String     @id @default(cuid())
  email           String?    @unique
  username        String?    @unique
  walletAddress   String?    @unique
  telegramId      String?    @unique
  avatar          String?
  bio             String?
  isArtist        Boolean    @default(false)
  isCurator       Boolean    @default(false)
  isAdmin         Boolean    @default(false)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  // Relations
  tracks          Track[]
  nfts            NFT[]      @relation("owned_nfts")
  createdNfts     NFT[]      @relation("created_nfts")
  transactions    Transaction[]
  tokens          MusicToken[]
  staking         Staking[]
  sessions        Session[]
  wallets         UserWallet[]
}
```

### 2. Wallet

Represents blockchain wallet addresses associated with users.

```prisma
model Wallet {
  id              String     @id @default(cuid())
  address         String     @unique
  chain           String     // 'solana', 'ton', 'ethereum', etc.
  provider        String?    // 'phantom', 'metamask', 'tonkeeper', etc.
  isPrimary       Boolean    @default(false)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  // Relations
  userWallets     UserWallet[]
}
```

### 3. UserWallet

Junction table for User-Wallet many-to-many relationship.

```prisma
model UserWallet {
  id              String     @id @default(cuid())
  userId          String
  walletId        String
  createdAt       DateTime   @default(now())
  
  // Relations
  user            User       @relation(fields: [userId], references: [id])
  wallet          Wallet     @relation(fields: [walletId], references: [id])
  
  @@unique([userId, walletId])
}
```

### 4. Session

User session management for authentication.

```prisma
model Session {
  id              String     @id @default(cuid())
  userId          String
  token           String     @unique
  expiresAt       DateTime
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  // Relations
  user            User       @relation(fields: [userId], references: [id])
}
```

### 5. Track

Represents a music track on the platform.

```prisma
model Track {
  id              String     @id @default(cuid())
  title           String
  description     String?
  coverImage      String?
  audioUrl        String     // IPFS hash
  artistId        String
  genre           String?
  duration        Int        // in seconds
  releaseDate     DateTime   @default(now())
  price           Decimal?
  isNFT           Boolean    @default(false)
  nftContract     String?
  playCount       Int        @default(0)
  likeCount       Int        @default(0)
  metadata        Json?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  // Relations
  artist          User       @relation(fields: [artistId], references: [id])
  nft             NFT?
  files           TrackFile[]
}
```

### 6. TrackFile

Represents files associated with a track (audio, cover, etc.).

```prisma
model TrackFile {
  id              String     @id @default(cuid())
  trackId         String
  ipfsHash        String     // IPFS content identifier
  fileType        String     // 'audio', 'cover', 'metadata'
  fileName        String?
  fileSize        Int?
  mimeType        String?
  isPinned        Boolean    @default(true)
  createdAt       DateTime   @default(now())
  
  // Relations
  track           Track      @relation(fields: [trackId], references: [id])
}
```

### 7. NFT

Represents a music NFT on the platform.

```prisma
model NFT {
  id              String     @id @default(cuid())
  tokenId         String     @unique
  contractAddress String
  name            String
  description     String?
  imageUrl        String?    // IPFS hash
  owner           String     // User ID
  creatorId       String
  collectionId    String?
  price           Decimal?
  isListed        Boolean    @default(false)
  metadata        Json?
  blockchainTx    String?    // Transaction hash
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  // Relations
  creator         User       @relation("created_nfts", fields: [creatorId], references: [id])
  ownerUser       User       @relation("owned_nfts", fields: [owner], references: [id])
  track           Track?
  collection      NFTCollection?
  transactions    Transaction[]
  metadataDetails NFTMetadata[]
}
```

### 8. NFTMetadata

Detailed metadata for NFTs stored off-chain.

```prisma
model NFTMetadata {
  id              String     @id @default(cuid())
  nftId           String
  ipfsHash        String     @unique
  name            String
  description     String?
  attributes      Json?
  externalUrl     String?
  createdAt       DateTime   @default(now())
  
  // Relations
  nft             NFT        @relation(fields: [nftId], references: [id])
}
```

### 9. NFTCollection

Represents a collection of NFTs.

```prisma
model NFTCollection {
  id              String     @id @default(cuid())
  name            String
  description     String?
  creatorId       String
  contractAddress String     @unique
  totalSupply     Int        @default(0)
  mintedCount     Int        @default(0)
  price           Decimal?
  royaltyPercent  Decimal?   @default(2.5)
  metadata        Json?
  isActive        Boolean    @default(true)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  // Relations
  creator         User       @relation(fields: [creatorId], references: [id])
  nfts            NFT[]
}
```

### 10. Transaction

Records all platform transactions.

```prisma
model Transaction {
  id              String     @id @default(cuid())
  nftId           String?
  sellerId        String?
  buyerId         String?
  transactionHash String     @unique
  price           Decimal?
  fee             Decimal?   @default(0)
  transactionType String     // 'mint', 'transfer', 'sale', 'stake', 'unstake'
  status          String     @default('pending') // 'pending', 'completed', 'failed'
  chain           String     // 'solana', 'ton'
  blockNumber     BigInt?
  gasUsed         BigInt?
  metadata        Json?
  createdAt       DateTime   @default(now())
  
  // Relations
  nft             NFT?       @relation(fields: [nftId], references: [id])
  seller          User?      @relation("sold_transactions", fields: [sellerId], references: [id])
  buyer           User?      @relation("bought_transactions", fields: [buyerId], references: [id])
}
```

### 11. MusicToken

Tracks user token balances and activities.

```prisma
model MusicToken {
  id              String     @id @default(cuid())
  userId          String
  balance         Decimal    @default(0)
  totalEarned     Decimal    @default(0)
  totalSpent      Decimal    @default(0)
  lastClaimed     DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  // Relations
  user            User       @relation(fields: [userId], references: [id])
  staking         Staking[]
}
```

### 12. Staking

Records user staking positions.

```prisma
model Staking {
  id              String     @id @default(cuid())
  userId          String
  tokenId         String
  amount          Decimal
  startDate       DateTime   @default(now())
  endDate         DateTime?
  duration        Int        // in days
  apy             Decimal    @default(15.0)
  rewards         Decimal    @default(0)
  claimedRewards  Decimal    @default(0)
  isActive        Boolean    @default(true)
  metadata        Json?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  // Relations
  user            User       @relation(fields: [userId], references: [id])
  token           MusicToken @relation(fields: [tokenId], references: [id])
}
```

## Indexes

To optimize query performance, the following indexes are defined:

```prisma
// User indexes
@@index([walletAddress])
@@index([telegramId])
@@index([email])
@@index([createdAt])

// Track indexes
@@index([artistId])
@@index([genre])
@@index([releaseDate])
@@index([createdAt])
@@index([isNFT])

// NFT indexes
@@index([owner])
@@index([creatorId])
@@index([contractAddress])
@@index([tokenId])
@@index([isListed])
@@index([createdAt])

// Transaction indexes
@@index([nftId])
@@index([buyerId])
@@index([sellerId])
@@index([transactionType])
@@index([status])
@@index([createdAt])

// Token indexes
@@index([userId])
@@index([updatedAt])

// Staking indexes
@@index([userId])
@@index([isActive])
@@index([startDate])
```

## Data Migration Strategy

### Migration Process

1. **Schema Changes**:
   - Define changes in Prisma schema
   - Generate migration files with `prisma migrate dev`
   - Review and modify migration files if needed

2. **Data Migration**:
   - Create migration scripts for data transformation
   - Test migrations in staging environment
   - Execute migrations during maintenance windows

3. **Rollback Plan**:
   - Maintain backup before migration
   - Prepare rollback scripts for critical changes
   - Monitor system after migration

### Migration Best Practices

1. **Backward Compatibility**:
   - Ensure schema changes are backward compatible
   - Deploy code changes before schema changes
   - Test with both old and new schemas

2. **Performance Considerations**:
   - Schedule large migrations during low-traffic periods
   - Monitor database performance during migration
   - Use batching for large data operations

3. **Testing**:
   - Test migrations in development environment
   - Verify data integrity after migration
   - Perform end-to-end testing of affected features

## Caching Strategy

### Redis Implementation

1. **Query Result Caching**:
   - Cache frequently accessed data (popular tracks, user profiles)
   - Set appropriate TTL values (10-60 minutes)
   - Invalidate cache on data updates

2. **Session Caching**:
   - Store active user sessions in Redis
   - Implement session expiration
   - Synchronize with database sessions

3. **Rate Limiting**:
   - Track API request rates per user/IP
   - Store rate limit counters in Redis
   - Implement sliding window algorithm

### Cache Invalidation

1. **Event-Driven Invalidation**:
   - Invalidate cache on data modification
   - Use database triggers or application events
   - Implement cache warming for critical data

2. **Time-Based Invalidation**:
   - Set TTL for all cached items
   - Use different TTL for different data types
   - Monitor cache hit ratios

## Performance Optimization

### Query Optimization

1. **Database Indexing**:
   - Create indexes for frequently queried columns
   - Use composite indexes for complex queries
   - Monitor index usage and remove unused indexes

2. **Query Analysis**:
   - Use EXPLAIN to analyze query performance
   - Identify and optimize slow queries
   - Implement query result caching

3. **Connection Management**:
   - Use connection pooling
   - Configure appropriate pool sizes
   - Monitor connection usage

### Data Partitioning

1. **Horizontal Partitioning**:
   - Partition large tables by date or user segments
   - Implement sharding for high-scale scenarios
   - Maintain partitioning keys for efficient querying

2. **Archival Strategy**:
   - Archive old data to separate tables
   - Implement data retention policies
   - Provide access to archived data when needed

## Security Considerations

### Data Protection

1. **Encryption**:
   - Encrypt sensitive data at rest
   - Use TLS for data in transit
   - Implement field-level encryption for PII

2. **Access Control**:
   - Implement role-based access control
   - Use database user permissions
   - Audit data access logs

3. **Data Privacy**:
   - Implement data anonymization for analytics
   - Comply with GDPR and other privacy regulations
   - Provide data deletion mechanisms

## Monitoring and Maintenance

### Health Checks

1. **Database Connectivity**:
   - Monitor database connection health
   - Alert on connection failures
   - Implement automatic reconnection

2. **Performance Metrics**:
   - Track query response times
   - Monitor database resource usage
   - Alert on performance degradation

3. **Data Integrity**:
   - Implement data consistency checks
   - Monitor for data corruption
   - Maintain backup verification processes

### Backup and Recovery

1. **Backup Strategy**:
   - Daily full backups
   - Hourly incremental backups
   - Off-site backup storage

2. **Recovery Procedures**:
   - Documented recovery processes
   - Regular recovery testing
   - Point-in-time recovery capabilities

3. **Disaster Recovery**:
   - Multi-region backup strategy
   - Automated failover procedures
   - Recovery time objectives (RTO) and recovery point objectives (RPO)