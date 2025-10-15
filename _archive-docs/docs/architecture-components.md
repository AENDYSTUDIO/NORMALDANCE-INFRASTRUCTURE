# 🏗️ Архитектура и компоненты NORMAL DANCE v1.0.1

## 📋 Общая архитектура

NORMAL DANCE - это децентрализованная музыкальная платформа, построенная на микросервисной архитектуре с использованием современных веб-технологий и Web3 интеграции.

### 🎯 Архитектурные принципы
- **Микросервисная архитектура** - независимые сервисы для разных функциональных областей
- **Безсерверная инфраструктура** - использование Kubernetes для оркестрации контейнеров
- **Web3 интеграция** - полная интеграция с блокчейном Solana
- **Реальное время** - WebSocket для мгновенных обновлений
- **Масштабируемость** - горизонтальное масштабирование всех компонентов
- **Безопасность** - многоуровневая система безопасности

### 📊 Схема архитектуры

```
┌─────────────────────────────────────────────────────────────┐
│                     NORMAL DANCE v1.0.1                    │
├─────────────────────────────────────────────────────────────┤
│  Frontend Layer                                             │
│  ├─ Web App (Next.js 15)                                    │
│  ├─ Mobile App (React Native)                              │
│  └─ Admin Panel (Next.js)                                   │
├─────────────────────────────────────────────────────────────┤
│  API Gateway Layer                                          │
│  ├─ Next.js API Routes                                      │
│  ├─ WebSocket Server (Socket.IO)                           │
│  └─ Rate Limiting & Authentication                         │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                       │
│  ├─ Audio Service                                           │
│  ├─ NFT Service                                             │
│  ├─ User Service                                            │
│  ├─ Wallet Service                                          │
│  ├─ Staking Service                                         │
│  └─ Analytics Service                                       │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ├─ PostgreSQL (Primary DB)                                │
│  ├─ Redis (Cache & Session)                                │
│  ├─ IPFS (File Storage)                                     │
│  └─ Solana Blockchain                                       │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                       │
│  ├─ Kubernetes Cluster                                      │
│  ├─ Monitoring (Prometheus + Grafana)                      │
│  ├─ Logging (ELK Stack)                                    │
│  └─ CDN (CloudFlare)                                        │
└─────────────────────────────────────────────────────────────┘
```

## 🎵 Аудиосистема

### 🎼 AudioPlayer компонент

**Файл:** [`src/components/audio/audio-player.tsx`](src/components/audio/audio-player.tsx:1)

**Основные функции:**
- Воспроизведение аудио с адаптивным качеством
- Управление плейлистами и очередью
- Визуализация аудио в реальном времени
- Эквалайзер с пресетами
- Статистика треков

**Ключевые особенности:**

#### 1. Адаптивное качество звука
```typescript
// Определение качества звука на основе сети
const audioSrc = useCallback(() => {
  if (!currentTrack) return ''
  
  // Определяем качество звука
  let quality = audioQualities.find(q => q.id === selectedQuality)
  if (!quality || selectedQuality === 'auto') {
    quality = audioQualities[1] // Среднее качество по умолчанию
  }
  
  // Адаптируем под сеть
  const useLowQualityAudio = effectiveType === 'slow-2g' || effectiveType === '2g'
  
  if (useLowQualityAudio && quality.id !== 'low') {
    const lowQuality = audioQualities[0] // Низкое качество
    const parts = currentTrack.audioUrl.split('.')
    const extension = parts.pop()
    return `${parts.join('.')}_low.${extension}`
  }
  
  return currentTrack.audioUrl
}, [currentTrack, selectedQuality, effectiveType])
```

#### 2. Визуализация аудио
```typescript
<AudioVisualizer
  audioElement={audioRef.current}
  isPlaying={isPlaying}
  type={visualizerType}
  color={visualizerColor}
  sensitivity={visualizerSensitivity}
/>
```

#### 3. Эквалайзер с пресетами
```typescript
const equalizerPresets: EqualizerPreset[] = [
  {
    id: 'flat',
    name: 'Плоский',
    settings: { bass: 0, mid: 0, treble: 0, gain: 0 },
    icon: <Square className="h-4 w-4" />
  },
  {
    id: 'bass_boost',
    name: 'Усиление баса',
    settings: { bass: 8, mid: 0, treble: -2, gain: 2 },
    icon: <Triangle className="h-4 w-4" />
  }
]
```

#### 4. Управление плейлистами
```typescript
const handleCreatePlaylist = async () => {
  if (!newPlaylistName.trim()) return
  
  try {
    const playlist = await createPlaylist({
      name: newPlaylistName,
      description: newPlaylistDescription,
      isPublic: false
    })
    
    setPlaylists(prev => [...prev, playlist])
    setNewPlaylistName('')
    setNewPlaylistDescription('')
    setShowCreatePlaylist(false)
  } catch (error) {
    console.error('Error creating playlist:', error)
  }
}
```

### 🎵 Аудиокачество

| Качество | Битрейт | Частота | Размер | Рекомендации |
|----------|---------|---------|--------|-------------|
| Низкое | 64 kbps | 22.05 kHz | 2-5 MB | Медленная сеть |
| Среднее | 128 kbps | 44.1 kHz | 4-10 MB | Стандартное |
| Высокое | 320 kbps | 48 kHz | 8-15 MB | Хороший интернет |
| Lossless | 1411 kbps | 96 kHz | 20-40 MB | Hi-Fi аудио |

## 💰 Web3 интеграция

### 🪙 Wallet Adapter

**Файл:** [`src/components/wallet/wallet-adapter.tsx`](src/components/wallet/wallet-adapter.tsx:1)

**Основные функции:**
- Интеграция с кошельком Phantom
- Управление Solana транзакциями
- Форматирование и валидация адресов
- Работа с токенами NDT

**Ключевые особенности:**

#### 1. Создание подключения к Solana
```typescript
export function createConnection(): Connection {
  return new Connection(RPC_URL, 'confirmed')
}
```

#### 2. Хук для использования кошелька
```typescript
export function useSolanaWallet() {
  const wallet = useWallet()
  const { connection } = useConnection()

  const connectWallet = async () => {
    if (!wallet.connected) {
      if (!wallet.connect) throw new Error('Wallet does not support connection')
      await wallet.connect()
    }
  }

  const sendTransaction = async (transaction: Transaction): Promise<string> => {
    if (!wallet.connected) throw new WalletNotConnectedError()
    if (!wallet.sendTransaction) throw new Error('Wallet does not support transaction sending')
    
    try {
      const signature = await wallet.sendTransaction(transaction, connection)
      return signature
    } catch (error) {
      console.error('Error sending transaction:', error)
      throw error
    }
  }
}
```

#### 3. Форматирование адресов
```typescript
export function formatAddress(address: PublicKey, length: number = 4): string {
  const str = address.toBase58()
  return `${str.slice(0, length)}...${str.slice(-length)}`
}
```

#### 4. Работа с токенами
```typescript
export function formatSol(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount)
}

export function formatTokens(amount: number, decimals: number = 9): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  }).format(amount)
}
```

### 🎵 Solana программы

#### 1. NDT Token Program
```typescript
export const NDT_PROGRAM_ID = new PublicKey('NDT111111111111111111111111111111111111111')
export const NDT_MINT_ADDRESS = new PublicKey('11111111111111111111111111111111')
```

#### 2. TrackNFT Program
```typescript
export const TRACKNFT_PROGRAM_ID = new PublicKey('TRACKNFT111111111111111111111111111111111111111')
```

#### 3. Staking Program
```typescript
export const STAKING_PROGRAM_ID = new PublicKey('STAKING111111111111111111111111111111111111111')
```

## 🎯 Система рекомендаций

### 🤖 Recommendation Engine

**Файл:** [`src/components/recommendations/recommendation-engine.tsx`](src/components/recommendations/recommendation-engine.tsx:1)

**Основные функции:**
- Персональные рекомендации на основе истории прослушиваний
- Коллаборативная фильтрация
- Трендовые треки
- Сходство треков

**Ключевые особенности:**

#### 1. Персональные рекомендации
```typescript
const generatePersonalRecommendations = async (userId: string): Promise<Track[]> => {
  // Получаем историю прослушиваний пользователя
  const history = await getUserListeningHistory(userId)
  
  // Анализируем предпочтения
  const preferences = analyzePreferences(history)
  
  // Находим похожие треки
  const similarTracks = await findSimilarTracks(preferences)
  
  return similarTracks.slice(0, 10) // Возвращаем топ-10 рекомендаций
}
```

#### 2. Коллаборативная фильтрация
```typescript
const generateCollaborativeRecommendations = async (userId: string): Promise<Track[]> => {
  // Находим пользователей с похожими вкусами
  const similarUsers = await findSimilarUsers(userId)
  
  // Собираем треки, которые понравились похожим пользователям
  const recommendedTracks = await getTracksFromUsers(similarUsers)
  
  // Фильтруем уже прослушанные треки
  const newTracks = filterUnheardTracks(userId, recommendedTracks)
  
  return newTracks.slice(0, 10)
}
```

#### 3. Трендовые треки
```typescript
const getTrendingTracks = async (): Promise<Track[]> => {
  const now = new Date()
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  return await prisma.track.findMany({
    where: {
      createdAt: {
        gte: lastWeek
      },
      playCount: {
        gt: 1000
      }
    },
    orderBy: {
      playCount: 'desc'
    },
    take: 10
  })
}
```

## 💎 Стейкинг система

### 🏆 Staking Interface

**Файл:** [`src/components/staking/staking-interface.tsx`](src/components/staking/staking-interface.tsx:1)

**Основные функции:**
- Управление пулами стейкинга
- Расчет вознаграждений
- Автоматическая капитализация
- Аналитика доходности

**Ключевые особенности:**

#### 1. Типы стейкинга
```typescript
enum StakingType {
  FIXED = 'fixed',        // Фиксированный срок
  FLEXIBLE = 'flexible',  // Гибкий срок
  LIQUIDITY = 'liquidity', // Ликвидность
  NFT = 'nft',           // NFT стейкинг
  TIERED = 'tiered'      // Тиред стейкинг
}
```

#### 2. Расчет вознаграждений
```typescript
const calculateRewards = useCallback((amount: number, apy: number, days: number, compound: string): StakingRewards => {
  const frequencies = {
    daily: 365,
    weekly: 52,
    monthly: 12
  }
  
  const compoundPerYear = frequencies[compound as keyof typeof frequencies] || 365
  const rate = apy / 100
  const years = days / 365
  
  // Формула сложного процента: A = P(1 + r/n)^(nt)
  const totalAmount = amount * Math.pow(1 + rate / compoundPerYear, compoundPerYear * years)
  const totalEarned = totalAmount - amount
  
  return {
    daily: (totalEarned / days) * 1,
    weekly: (totalEarned / days) * 7,
    monthly: (totalEarned / days) * 30,
    yearly: totalEarned / years,
    total: totalEarned
  }
}, [])
```

#### 3. Пулы стейкинга
```typescript
interface StakingPool {
  id: string
  name: string
  type: StakingType
  apy: number
  minAmount: number
  maxAmount: number
  duration: number
  totalStaked: number
  participants: number
  isAvailable: boolean
  description: string
  riskLevel: 'low' | 'medium' | 'high'
  earlyWithdrawalPenalty: number
  compoundFrequency: 'daily' | 'weekly' | 'monthly'
  performanceFee: number
  bonus?: {
    type: 'volume' | 'referral'
    value: number
    description: string
  }
}
```

#### 4. Обработка стейкинга
```typescript
const handleStake = async () => {
  const amount = parseFloat(stakeAmount)
  if (!amount || amount <= 0) {
    setError('Пожалуйста, введите корректную сумму')
    return
  }

  if (amount > userBalance) {
    setError('Недостаточно средств на балансе')
    return
  }

  if (amount < selectedPool.minAmount) {
    setError(`Минимальная сумма для стейкинга: ${selectedPool.minAmount} NDT`)
    return
  }

  setIsStaking(true)
  setError(null)
  setSuccess(null)

  try {
    // Simulate staking transaction
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update user balance
    setUserBalance(prev => prev - amount)
    
    // Add new stake
    const newStake: UserStake = {
      id: Date.now().toString(),
      poolName: selectedPool.name,
      poolId: selectedPool.id,
      amount,
      apy: selectedPool.apy,
      startDate: new Date().toISOString(),
      endDate: selectedPool.duration > 0 
        ? new Date(Date.now() + selectedPool.duration * 24 * 60 * 60 * 1000).toISOString()
        : null,
      earned: 0,
      status: 'active',
      type: selectedPool.type,
      compoundCount: 0
    }
    
    setStakes(prev => [newStake, ...prev])
    setSuccess(`Успешно заблокировано ${amount} NDT в пуле ${selectedPool.name}`)
    setStakeAmount('')
  } catch (err) {
    setError('Ошибка при стейкинге. Пожалуйста, попробуйте снова.')
  } finally {
    setIsStaking(false)
  }
}
```

## 📊 Система мониторинга

### 📈 Monitoring System

**Файл:** [`src/lib/monitoring.ts`](src/lib/monitoring.ts:1)

**Основные функции:**
- Сбор метрик производительности
- Отслеживание ошибок
- Мониторинг ресурсов
- Аналитика использования

**Ключевые особенности:**

#### 1. Сбор метрик
```typescript
export class MetricsCollector {
  private static instance: MetricsCollector
  private metrics: Map<string, number> = new Map()

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector()
    }
    return MetricsCollector.instance
  }

  increment(metric: string, value: number = 1): void {
    const current = this.metrics.get(metric) || 0
    this.metrics.set(metric, current + value)
  }

  set(metric: string, value: number): void {
    this.metrics.set(metric, value)
  }

  get(metric: string): number {
    return this.metrics.get(metric) || 0
  }

  getAll(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }
}
```

#### 2. Отслеживание ошибок
```typescript
export class ErrorTracker {
  static trackError(error: Error, context?: any): void {
    console.error('Error tracked:', error, context)
    
    // Отправка в Sentry
    if (typeof Sentry !== 'undefined') {
      Sentry.captureException(error, { extra: context })
    }
    
    // Локальное логирование
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      context
    }
    
    // Сохранение в локальное хранилище
    const errors = JSON.parse(localStorage.getItem('errorLogs') || '[]')
    errors.push(errorLog)
    localStorage.setItem('errorLogs', JSON.stringify(errors.slice(-100))) // Храним последние 100 ошибок
  }
}
```

#### 3. Производительность
```typescript
export class PerformanceMonitor {
  static measure(name: string): () => void {
    const start = performance.now()
    
    return () => {
      const end = performance.now()
      const duration = end - start
      
      console.log(`${name} took ${duration}ms`)
      
      // Отправка метрик
      MetricsCollector.getInstance().set(`performance.${name}`, duration)
    }
  }

  static measureAsync(name: string, fn: () => Promise<any>): Promise<any> {
    const start = performance.now()
    
    return fn().finally(() => {
      const end = performance.now()
      const duration = end - start
      
      console.log(`${name} took ${duration}ms`)
      MetricsCollector.getInstance().set(`performance.${name}`, duration)
    })
  }
}
```

## 🗄️ База данных

### 📊 Схема базы данных

#### Основные сущности

```sql
-- Пользователи
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  wallet_address VARCHAR(44) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Треки
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  artist_id UUID REFERENCES users(id),
  genre VARCHAR(50),
  duration INTEGER,
  bitrate INTEGER,
  sample_rate INTEGER,
  file_url VARCHAR(500) NOT NULL,
  cover_image_url VARCHAR(500),
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- NFT
CREATE TABLE nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id VARCHAR(66) UNIQUE NOT NULL,
  track_id UUID REFERENCES tracks(id),
  owner_id UUID REFERENCES users(id),
  creator_id UUID REFERENCES users(id),
  price DECIMAL(18, 8),
  currency VARCHAR(10) DEFAULT 'SOL',
  category VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Плейлисты
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT false,
  cover_image_url VARCHAR(500),
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Треки в плейлистах
CREATE TABLE playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id),
  track_id UUID REFERENCES tracks(id),
  position INTEGER NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(playlist_id, track_id)
);

-- Стейкинг
CREATE TABLE staking_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  apy DECIMAL(5, 2) NOT NULL,
  min_amount DECIMAL(18, 8) NOT NULL,
  max_amount DECIMAL(18, 8),
  duration INTEGER,
  total_staked DECIMAL(18, 8) DEFAULT 0,
  participants INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  risk_level VARCHAR(20) DEFAULT 'medium',
  early_withdrawal_penalty DECIMAL(5, 2) DEFAULT 0,
  compound_frequency VARCHAR(20) DEFAULT 'daily',
  performance_fee DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Стейки пользователей
CREATE TABLE user_stakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  pool_id UUID REFERENCES staking_pools(id),
  amount DECIMAL(18, 8) NOT NULL,
  apy DECIMAL(5, 2) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  earned DECIMAL(18, 8) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  type VARCHAR(50) NOT NULL,
  compound_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Аналитика
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(50) NOT NULL,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX idx_tracks_created_at ON tracks(created_at);
CREATE INDEX idx_tracks_genre ON tracks(genre);
CREATE INDEX idx_tracks_artist_id ON tracks(artist_id);
CREATE INDEX idx_nfts_created_at ON nfts(created_at);
CREATE INDEX idx_nfts_category ON nfts(category);
CREATE INDEX idx_nfts_owner_id ON nfts(owner_id);
CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX idx_staking_pools_type ON staking_pools(type);
CREATE INDEX idx_user_stakes_user_id ON user_stakes(user_id);
CREATE INDEX idx_user_stakes_pool_id ON user_stakes(pool_id);
CREATE INDEX idx_analytics_track_id ON analytics(track_id);
CREATE INDEX idx_analytics_user_id ON analytics(user_id);
CREATE INDEX idx_analytics_event_type ON analytics(event_type);
```

### 🔧 Prisma схема

```typescript
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  username      String   @unique
  passwordHash  String
  walletAddress String?  @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLogin     DateTime?
  isActive      Boolean  @default(true)

  // Relations
  tracks         Track[]
  nfts           Nft[]
  playlists      Playlist[]
  userStakes     UserStake[]
  analytics      Analytics[]

  @@map("users")
}

model Track {
  id            String   @id @default(cuid())
  title         String
  artistId      String
  genre         String?
  duration      Int?
  bitrate       Int?
  sampleRate    Int?
  fileUrl       String
  coverImageUrl String?
  playCount     Int      @default(0)
  likeCount     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  isActive      Boolean  @default(true)

  // Relations
  artist        User         @relation(fields: [artistId], references: [id])
  nfts          Nft[]
  playlistTracks PlaylistTrack[]
  analytics     Analytics[]

  @@map("tracks")
}

model Nft {
  id          String   @id @default(cuid())
  tokenId     String   @unique
  trackId     String
  ownerId     String
  creatorId   String
  price       Decimal?
  currency    String   @default("SOL")
  category    String?
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  isActive    Boolean  @default(true)

  // Relations
  track       Track           @relation(fields: [trackId], references: [id])
  owner       User            @relation(fields: [ownerId], references: [id])
  creator     User            @relation(fields: [creatorId], references: [id])
  userStakes  UserStake[]

  @@map("nfts")
}

model Playlist {
  id            String   @id @default(cuid())
  name          String
  description   String?
  userId        String
  isPublic      Boolean  @default(false)
  coverImageUrl String?
  playCount     Int      @default(0)
  likeCount     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  user          User             @relation(fields: [userId], references: [id])
  playlistTracks PlaylistTrack[]

  @@map("playlists")
}

model PlaylistTrack {
  id         String   @id @default(cuid())
  playlistId String
  trackId    String
  position   Int
  addedAt    DateTime @default(now())

  // Relations
  playlist   Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  track      Track    @relation(fields: [trackId], references: [id])

  @@unique([playlistId, trackId])
  @@map("playlist_tracks")
}

model StakingPool {
  id                     String   @id @default(cuid())
  name                   String
  type                   String
  apy                    Decimal
  minAmount              Decimal
  maxAmount              Decimal?
  duration               Int?
  totalStaked            Decimal  @default(0)
  participants           Int      @default(0)
  isActive               Boolean  @default(true)
  description            String?
  riskLevel              String   @default("medium")
  earlyWithdrawalPenalty Decimal  @default(0)
  compoundFrequency      String   @default("daily")
  performanceFee         Decimal  @default(0)
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  // Relations
  userStakes UserStake[]

  @@map("staking_pools")
}

model UserStake {
  id            String   @id @default(cuid())
  userId        String
  poolId        String
  amount        Decimal
  apy           Decimal
  startDate     DateTime
  endDate       DateTime?
  earned        Decimal  @default(0)
  status        String   @default("active")
  type          String
  compoundCount Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  user User  @relation(fields: [userId], references: [id])
  pool StakingPool @relation(fields: [poolId], references: [id])

  @@map("user_stakes")
}

model Analytics {
  id         String   @id @default(cuid())
  trackId    String?
  userId     String?
  eventType  String
  metadata   Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  // Relations
  track Track? @relation(fields: [trackId], references: [id])
  user  User?  @relation(fields: [userId], references: [id])

  @@map("analytics")
}
```

## 🔐 Система безопасности

### 🛡️ Безопасные практики

#### 1. Аутентификация
```typescript
// Использование NextAuth.js
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Проверка учетных данных
        const user = await authenticateUser(credentials.email, credentials.password)
        if (user) {
          return user
        }
        return null
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.walletAddress = user.walletAddress
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.walletAddress = token.walletAddress
      }
      return session
    }
  }
})
```

#### 2. Авторизация
```typescript
// Middleware для защиты роутов
export async function middleware(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  
  // Проверка прав доступа
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/admin') && session.user.role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/tracks/:path*']
}
```

#### 3. Валидация ввода
```typescript
import { z } from 'zod'

const trackSchema = z.object({
  title: z.string().min(1).max(255),
  genre: z.string().min(1).max(50),
  duration: z.number().positive(),
  file: z.instanceof(File).refine(file => file.size <= 50 * 1024 * 1024) // 50MB
})

export async function uploadTrack(formData: FormData) {
  const validatedData = trackSchema.parse({
    title: formData.get('title'),
    genre: formData.get('genre'),
    duration: parseInt(formData.get('duration')),
    file: formData.get('file')
  })
  
  // Обработка загрузки
  return await processTrackUpload(validatedData)
}
```

## 🚀 Производительность

### ⚡ Оптимизация производительности

#### 1. Кеширование
```typescript
// Redis кеширование
import { createClient } from 'redis'

const redisClient = createClient({
  url: process.env.REDIS_URL
})

export async function getCachedData(key: string): Promise<any> {
  try {
    const cached = await redisClient.get(key)
    if (cached) {
      return JSON.parse(cached)
    }
    
    const data = await fetchDataFromDatabase(key)
    await redisClient.setex(key, 3600, JSON.stringify(data)) // Кеширование на 1 час
    
    return data
  } catch (error) {
    console.error('Cache error:', error)
    return await fetchDataFromDatabase(key)
  }
}
```

#### 2. Оптимизация запросов
```typescript
// Использование Prisma с оптимизацией
export async function getTrackWithAnalytics(trackId: string) {
  return await prisma.track.findUnique({
    where: { id: trackId },
    include: {
      artist: {
        select: { id: true, username: true }
      },
      analytics: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Последние 7 дней
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })
}
```

#### 3. Ленивая загрузка
```typescript
// React.lazy для компонентов
const LazyAnalytics = React.lazy(() => import('./components/Analytics'))

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<div>Loading analytics...</div>}>
        <LazyAnalytics />
      </Suspense>
    </div>
  )
}
```

## 📱 Мобильное приложение

### 📱 React Native Integration

**Структура мобильного приложения:**
```
mobile-app/
├── src/
│   ├── components/     # Компоненты UI
│   ├── hooks/         # Custom hooks
│   ├── navigation/    # Навигация
│   ├── screens/       # Экраны
│   ├── services/      # API сервисы
│   └── utils/         # Утилиты
├── App.tsx            # Главный компонент
└── package.json       # Зависимости
```

#### 1. Сервис мобильного приложения
```typescript
// mobile-app/src/services/mobileService.ts
import AsyncStorage from '@react-native-async-storage/async-storage'

export class MobileService {
  private static instance: MobileService
  
  static getInstance(): MobileService {
    if (!MobileService.instance) {
      MobileService.instance = new MobileService()
    }
    return MobileService.instance
  }

  async getStoredData(key: string): Promise<any> {
    try {
      const jsonValue = await AsyncStorage.getItem(key)
      return jsonValue != null ? JSON.parse(jsonValue) : null
    } catch (e) {
      console.error('Error reading from storage', e)
      return null
    }
  }

  async storeData(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value)
      await AsyncStorage.setItem(key, jsonValue)
    } catch (e) {
      console.error('Error saving to storage', e)
    }
  }

  async playAudio(trackUrl: string): Promise<void> {
    try {
      // Имитация воспроизведения аудио
      console.log('Playing audio:', trackUrl)
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }
}
```

#### 2. Интеграция с кошельком
```typescript
// mobile-app/src/services/walletService.ts
import { WalletAdapter } from '../types/wallet'

export class MobileWalletService implements WalletAdapter {
  private isConnected = false
  private publicKey: string | null = null

  async connect(): Promise<void> {
    try {
      // Имитация подключения к кошельку
      this.isConnected = true
      this.publicKey = 'mock_public_key'
    } catch (error) {
      console.error('Error connecting wallet:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false
    this.publicKey = null
  }

  async signTransaction(transaction: any): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Wallet not connected')
    }
    
    // Имитация подписи транзакции
    return 'mock_signature'
  }

  get connected(): boolean {
    return this.isConnected
  }

  get publicKeyString(): string | null {
    return this.publicKey
  }
}
```

## 📊 Аналитика и метрики

### 📈 Система аналитики

#### 1. Отслеживание событий
```typescript
// utils/analytics.ts
export class Analytics {
  static track(event: string, properties?: any): void {
    if (typeof window !== 'undefined') {
      // Отправка в Google Analytics
      gtag('event', event, properties)
      
      // Локальное хранилище
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]')
      events.push({
        event,
        properties,
        timestamp: new Date().toISOString(),
        url: window.location.href
      })
      localStorage.setItem('analytics_events', JSON.stringify(events.slice(-1000)))
    }
  }

  static identify(userId: string, traits?: any): void {
    if (typeof window !== 'undefined') {
      // Отправка идентификатора пользователя
      gtag('config', GA_TRACKING_ID, {
        user_id: userId,
        ...traits
      })
    }
  }
}
```

#### 2. Метрики производительности
```typescript
// utils/performance.ts
export class PerformanceMetrics {
  static startMeasure(name: string): () => void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const start = performance.now()
      
      return () => {
        const end = performance.now()
        const duration = end - start
        
        console.log(`${name} took ${duration}ms`)
        
        // Отправка метрик
        Analytics.track('performance_metric', {
          name,
          duration,
          timestamp: new Date().toISOString()
        })
      }
    }
    
    return () => {}
  }

  static measurePageLoad(): void {
    const measure = this.startMeasure('page_load')
    
    if (document.readyState === 'complete') {
      measure()
    } else {
      window.addEventListener('load', measure)
    }
  }
}
```

## 🔄 Интеграции

### 🔗 Внешние API интеграции

#### 1. Solana Web3
```typescript
// lib/solana.ts
import { Connection, PublicKey, Transaction } from '@solana/web3.js'

export class SolanaService {
  private connection: Connection

  constructor() {
    this.connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    )
  }

  async getBalance(publicKey: string): Promise<number> {
    try {
      const balance = await this.connection.getBalance(new PublicKey(publicKey))
      return balance / 1e9 // Конвертация в SOL
    } catch (error) {
      console.error('Error getting balance:', error)
      return 0
    }
  }

  async sendTransaction(transaction: Transaction): Promise<string> {
    try {
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize()
      )
      return signature
    } catch (error) {
      console.error('Error sending transaction:', error)
      throw error
    }
  }
}
```

#### 2. IPFS интеграция
```typescript
// lib/ipfs.ts
import { create } from 'ipfs-http-client'

export class IPFSService {
  private client: any

  constructor() {
    this.client = create({
      url: process.env.IPFS_API_URL || 'https://ipfs.infura.io:5001'
    })
  }

  async uploadFile(file: File): Promise<string> {
    try {
      const result = await this.client.add(file)
      return result.path
    } catch (error) {
      console.error('Error uploading to IPFS:', error)
      throw error
    }
  }

  async getFile(cid: string): Promise<Buffer> {
    try {
      const chunks: Buffer[] = []
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk)
      }
      return Buffer.concat(chunks)
    } catch (error) {
      console.error('Error fetching from IPFS:', error)
      throw error
    }
  }
}
```

## 📚 Заключение

Архитектура NORMAL DANCE v1.0.1 представляет собой современную, масштабируемую и безопасную платформу для музыкального стриминга с Web3 интеграцией. Основные компоненты:

- **Аудиосистема** с адаптивным качеством и визуализацией
- **Web3 интеграция** с кошельком Phantom и Solana
- **Система рекомендаций** на основе ML
- **Стейкинг система** с多种池类型
- **Мониторинг и аналитика** для отслеживания производительности
- **Безопасность** на всех уровнях
- **Мобильная интеграция** для кроссплатформенности

Эта архитектура обеспечивает высокую производительность, безопасность и масштабируемость, что позволяет платформе обрабатывать миллионы пользователей и транзакций.

---

**Создано:** Сентябрь 2025
**Версия:** v1.0.1
**Обновлено:** Последнее обновление: Сентябрь 2025
**Ответственный:** Lead Architect - Петров И.А.