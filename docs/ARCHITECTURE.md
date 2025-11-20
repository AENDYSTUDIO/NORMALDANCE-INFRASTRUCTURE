# 🏗️ Архитектура системы NormalDance

## Обзор платформы

NormalDance - это полнофункциональная музыкальная платформа Web3 с децентрализованным хранением, интеграцией блокчейн и Telegram Mini Apps. Платформа объединяет традиционный стриминг музыки с современными технологиями Web3.

## Технологический стек

```mermaid
graph TB
    subgraph "Frontend Layer"
        FE[Next.js 15 + TypeScript]
        UI[shadcn/ui + Tailwind CSS]
    end

    subgraph "Backend Services"
        API[NestJS REST API]
        WS[Socket.IO WebSockets]
        JOB[BullMQ Background Jobs]
    end

    subgraph "Blockchain Layer"
        SOL[Solana Integration]
        TON[TON Integration]
        NFT[ERC-721/ERC-1155]
    end

    subgraph "Storage Layer"
        IPFS[IPFS/Filecoin]
        PG[PostgreSQL Primary]
        REDIS[Redis Cache]
    end

    subgraph "Infrastructure"
        TRAEFIK[Traefik Reverse Proxy]
        PROM[Prometheus Monitoring]
        GRAF[Grafana Dashboards]
        LOGGING[Loki Logging]
    end

    FE --> API
    API --> WS
    API --> JOB
    API --> SOL
    API --> TON
    API --> NFT
    API --> IPFS
    API --> PG
    API --> REDIS
    API --> TRAEFIK
    PROM --> GRAF
    LOGGING --> GRAF
```

## Архитектурные принципы

### 🎯 Основные принципы

- **Микросервисная архитектура**: Разделение ответственности по сервисам
- **Децентрализация**: IPFS для хранения контента, блокчейн для транзакций
- **Адаптивность**: Реактивный frontend, real-time синхронизация
- **Безопасность**: Multi-layer security с въалидацией данных
- **Масштабируемость**: Horizontal scaling поддержка

## Сервисы и компоненты

### 🎵 Музыкальный стример

```mermaid
graph TD
    A[Пользователь] --> B[Web Player]
    B --> C[Audio Engine]
    C --> D[Streaming Service]
    D --> E[IPFS Gateway]
    D --> F[HLS/DASH Streaming]

    G[NFT Verification] --> D
    H[Royalty Engine] --> D
```

**Компоненты:**

- **Web Audio API** - клиентское воспроизведение
- **HLS Streaming** - адаптивное bitrate потоковое видео
- **IPFS Storage** - децентрализованное хранение аудио
- **NFT Metadata** - токен метаданные с правами

### 💰 DEX и DeFi интеграция

```mermaid
graph TD
    A[DEX Interface] --> B[AMM Engine]
    B --> C[Liquidity Pools]
    C --> D[Price Oracle]
    D --> E[Solana/TON Networks]

    F[Wallet Integration] --> A
    G[Governance] --> H[Token Emission]
    H --> I[Treasury]
```

**Особенности:**

- **Гибридный AMM** - комбинация CFMM и order book
- **MEV защита** - алгоритмы против фронт-раннинга
- **Cross-chain** - поддержка Solana и TON
- **Governance** - DAO механизм управления

### 🏪 NFT Marketplace

```mermaid
graph TD
    A[Marketplace] --> B[Listing Engine]
    B --> C[Bidding System]
    C --> D[Auction House]
    D --> E[Price Discovery]

    F[Minting Service] --> B
    G[Royalties] --> H[Payment Processor]
    H --> I[Blockchain Networks]
```

**Функции:**

- **Dynamic pricing** - ML-powered pricing suggestions
- **Fractional ownership** - частичное владение высокими активами
- **Secondary trading** - P2P marketplace
- **Royalty tracking** - автоматический сбор роялти

### 🤖 AI-рекомендательная система

```mermaid
graph TD
    A[User Behavior] --> B[Data Ingestion]
    B --> C[Feature Engineering]
    C --> D[ML Models]
    D --> E[Recommendation Engine]

    F[Content Metadata] --> C
    G[Social Graph] --> C
    H[Blockchain History] --> C
```

**Алгоритмы:**

- **Collaborative filtering** - рекомендации на основе предпочтений
- **Content-based filtering** - на основе метаданных треков
- **Social recommendations** - через Telegram/social сети
- **Reinforcement learning** - адаптация к пользовательскому feedback

## База данных архитектура

### PostgreSQL Schema

```sql
-- Основные таблицы
tracks (
    id UUID PRIMARY KEY,
    title VARCHAR(255),
    artist_id UUID,
    ipfs_hash VARCHAR(255),
    blockchain_tx VARCHAR(255),
    nft_contract VARCHAR(255),
    streaming_count BIGINT DEFAULT 0,
    created_at TIMESTAMP
);

users (
    id UUID PRIMARY KEY,
    wallet_address VARCHAR(255) UNIQUE,
    username VARCHAR(100) UNIQUE,
    created_at TIMESTAMP
);

nft_collections (
    id UUID PRIMARY KEY,
    contract_address VARCHAR(255),
    creator_id UUID,
    name VARCHAR(255),
    royalty_percentage DECIMAL(5,2)
);
```

### Индексы и оптимизация

```sql
-- Spatial индексы для гео-поиска
CREATE INDEX idx_tracks_artist ON tracks(artist_id);
CREATE INDEX idx_tracks_genre ON tracks(genre);
CREATE INDEX idx_tracks_created_at ON tracks(created_at DESC);

-- Full-text search
CREATE INDEX idx_tracks_fulltext ON tracks USING gin(to_tsvector('english', title || ' ' || description));
```

## Безопасность архитектуры

### 🔐 Multi-layer безопасность

```mermaid
graph TD
    A[Client Layer] --> B[API Gateway]
    B --> C[Authentication]
    C --> D[Authorization]
    D --> E[Rate Limiting]
    E --> F[Data Validation]

    G[Blockchain] --> H[Smart Contracts Audit]
    I[IPFS] --> J[Content Verification]
    K[Storage] --> L[Encryption at Rest]

    M[Monitoring] --> N[Security Events]
    N --> O[Alert System]
```

### Защитные механизмы

- **Input validation** - Zod schemas для всех входов
- **Rate limiting** - за защиту от DoS атак
- **JWT+wallet auth** - двойная аутентификация
- **Encryption** - AES-256 для чувствительных данных
- **Audit logs** - полное логирование операций

## Масштабируемость и производительность

### 🏗️ Horizontal scaling

```mermaid
graph TD
    A[Load Balancer] --> B[API Instances]
    A --> C[API Instances]
    A --> D[API Instances]

    B --> E[Database Cluster]
    C --> E
    D --> E

    F[Redis Cluster] --> B
    F --> C
    F --> D
```

### Кэширование strategy

- **L1 Cache**: Application-level (Zustand stores)
- **L2 Cache**: Redis для сессий и частых запросов
- **L3 Cache**: CDN для статических ресурсов
- **CDN**: Cloudflare для global distribution

## Мониторинг и наблюдаемость

### 📊 Metrics и Monitoring

```mermaid
graph TD
    A[Application Metrics] --> B[Prometheus]
    C[Infrastructure] --> B
    D[Blockchain] --> B
    E[IPFS] --> B

    B --> F[Grafana Dashboards]
    F --> G[Business KPIs]
    F --> H[Technical Metrics]
    F --> I[Security Alerts]
```

### Логирование архитектура

- **Structured logging** - JSON формат для всех логов
- **Log aggregation** - Loki для централизованного хранения
- **Distributed tracing** - Jaeger для request tracking
- **Error tracking** - Sentry для exception monitoring

## Блокчейн интеграция

### Solana эко-система

```mermaid
graph TD
    A[Wallet Connect] --> B[SPL Token Program]
    B --> C[NFT Standard]
    C --> D[Metaplex Protocol]

    E[DEX Integration] --> F[Serum/Orderbook]
    E --> G[Raydium AMM]
    E --> H[Orca Whirlpools]

    I[Cross-chain] --> J[Wormhole Bridge]
    J --> K[Other Chains]
```

### TON экосистема

```mermaid
graph TD
    A[TON Connect] --> B[TON Wallet]
    B --> C[TON Contracts]
    C --> D[DeFi Protocols]

    E[Mini Apps] --> F[Telegram Integration]
    F --> G[Web App Manifest]

    H[NFT] --> I[TON NFTs]
    I --> J[Tonnel Network]
```

## Интеграция с Telegram

### Mini App архитектура

```mermaid
graph TD
    A[Telegram Client] --> B[Mini App Runtime]
    B --> C[TWA WebView]
    C --> D[React App]

    E[Telegram API] --> F[Bot Integration]
    F --> G[User Authentication]
    G --> H[Web3 Wallet Connect]

    I[TON Payment] --> J[Stars API]
    J --> K[Merchant API]
```

**Фичерс:**

- **WebApp manifest** - декларативная конфигурация
- **Init data** - безопасная аутентификация
- **Payment API** - встроенные платежи

## Data flow

### User Journey Example

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Blockchain
    participant IPFS

    User->>Frontend: Upload track
    Frontend->>API: POST /tracks
    API->>IPFS: Store audio file
    IPFS-->>API: IPFS hash
    API->>Blockchain: Mint NFT
    Blockchain-->>API: Transaction hash
    API-->>Frontend: Success response
    Frontend-->>User: Track published
```

### Streaming Flow

```mermaid
sequenceDiagram
    participant Client
    participant CDN
    participant API
    participant IPFS
    participant Blockchain

    Client->>CDN: Request manifest
    CDN->>Client: HLS/DASH manifest
    Client->>CDN: Request segments

    Client->>API: /analytics/stream
    API->>Blockchain: Verify ownership
    API->>IPFS: Get content
```

## API endpoints overview

| Компонент | Endpoint         | Метод    | Описание              |
| --------- | ---------------- | -------- | --------------------- |
| Tracks    | `/api/tracks`    | GET/POST | Управление треками    |
| Users     | `/api/users`     | GET      | Профиль пользователей |
| NFT       | `/api/nft`       | POST     | Создание NFT          |
| Payments  | `/api/payments`  | POST     | Обработка платежей    |
| Search    | `/api/search`    | GET      | Глобальный поиск      |
| Analytics | `/api/analytics` | GET      | Метрики и аналитика   |

## Деплоймент архитектура

### Production stack

```mermaid
graph TD
    A[Docker Swarm] --> B[Frontend Service]
    A --> C[Backend Service]
    A --> D[Database Service]
    A --> E[IPFS Service]

    F[CI/CD Pipeline] --> G[Automated Testing]
    G --> H[Build Images]
    H --> I[Deploy to Swarm]

    J[Monitoring Stack] --> K[Health Checks]
    K --> L[Auto-scaling]
```

### Геораспределение

- **Global CDN** - Cloudflare для static assets
- **Regional APIs** - Multi-region deployment
- **Blockchain nodes** - Direct RPC connections
- **IPFS gateways** - Distributed pinning services

## Заключение

Архитектура NormalDance проектирована для масштабируемости, безопасности и инноваций в Web3 музыке. Использование лучших практик микросервисной архитектуры, децентрализованных технологий и современных инструментов обеспечивает надежность и производительность платформы.

Ключевые преимущества:

- 🚀 **Быстрая масштабируемость** - микросервисы + container orchestration
- 🔐 **Высокая безопасность** - multi-layer protection + blockchain immutability
- 💰 **Экономическая эффективность** - децентрализация снижает инфраструктурные costs
- 🎵 **Пользовательский опыт** - seamless Web3 интеграция без компромиссов
