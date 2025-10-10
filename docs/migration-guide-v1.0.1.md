# 🚀 Руководство по миграции на версию 0.0.0

## Обзор

Это руководство поможет вам обновить NORMAL DANCE с предыдущих версий до версии 0.0.0. Версия 0.0.0 включает значительные улучшения в AI рекомендательной системе, системе достижений, интерфейсе стейкинга и NFT рынке.

## 📋 Содержание

1. [Подготовка к миграции](#подготовка-к-миграции)
2. [Критические изменения](#критические-изменения)
3. [Изменения API](#изменения-api)
4. [Изменения в базе данных](#изменения-в-базе-данных)
5. [Изменения в компонентах](#изменения-в-компонентах)
6. [Изменения в конфигурации](#изменения-в-конфигурации)
7. [Рекомендации по производительности](#рекомендации-по-производительности)
8. [Тестирование](#тестирование)
9. [Откат](#откат)

## 🛠️ Подготовка к миграции

### Проверка требований
- **Node.js**: v18.x или выше
- **npm**: v8.x или выше
- **PostgreSQL**: v14 или выше
- **Redis**: v6.x или выше
- **Solana CLI**: v1.14 или выше

### Резервное копирование
```bash
# Создание резервной копии базы данных
pg_dump -h localhost -U normaldance -d normaldance > backup_v0.0.0.sql

# Создание резервной копии файлов
tar -czf backup_v0.0.0_files.tar.gz src/ components/ docs/ package.json

# Создание резервной копии конфигурации
cp prisma/schema.prisma prisma/schema.backup.v0.0.0.prisma
```

### Проверка текущей версии
```bash
npm list normaldance
# или
git describe --tags
```

## ⚠️ Критические изменения

### 1. Изменения в API роутах

#### Удаленные эндпоинты
- `GET /api/recommendations/old` - заменен на новый API
- `POST /api/achievements/simple` - заменен на расширенную систему

#### Измененные эндпоинты
```typescript
// Старый формат
GET /api/recommendations
{
  "tracks": [...],
  "type": "basic"
}

// Новый формат (v0.0.0)
GET /api/recommendations
{
  "personal": [...],
  "collaborative": [...],
  "trending": [...],
  "metadata": {
    "algorithm": "hybrid",
    "version": "2.0"
  }
}
```

#### Новые эндпоинты
```typescript
// Система достижений
GET /api/achievements/categories
GET /api/achievements/progress
POST /api/achievements/unlock

// Интерфейс стейкинга
GET /api/staking/pools
POST /api/staking/stake
POST /api/staking/compound
GET /api/staking/analytics

// NFT рынок
GET /api/nft/marketplace/stats
GET /api/nft/marketplace/filters
POST /api/nft/marketplace/bid
```

### 2. Изменения в базе данных

#### Новые таблицы
```sql
-- Достижения
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  category VARCHAR(50) NOT NULL,
  rarity VARCHAR(20) NOT NULL DEFAULT 'common',
  type VARCHAR(20) NOT NULL DEFAULT 'single',
  progress_max INTEGER DEFAULT 1,
  reward_type VARCHAR(20),
  reward_amount DECIMAL(18,8),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Прогресс достижений
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  achievement_id UUID REFERENCES achievements(id),
  progress INTEGER DEFAULT 0,
  unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Стейкинг
CREATE TABLE staking_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,
  apy DECIMAL(10,4) NOT NULL,
  min_amount DECIMAL(18,8) NOT NULL,
  max_amount DECIMAL(18,8),
  duration_days INTEGER,
  total_staked DECIMAL(18,8) DEFAULT 0,
  total_stakers INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Транзакции стейкинга
CREATE TABLE staking_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  pool_id UUID REFERENCES staking_pools(id),
  amount DECIMAL(18,8) NOT NULL,
  type VARCHAR(20) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  rewards DECIMAL(18,8) DEFAULT 0,
  compound_frequency VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- NFT коллекции
CREATE TABLE nft_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  total_supply INTEGER,
  minted INTEGER DEFAULT 0,
  floor_price DECIMAL(18,8),
  total_volume DECIMAL(18,8) DEFAULT 0,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- NFT
CREATE TABLE nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES nft_collections(id),
  token_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  audio_url VARCHAR(500),
  video_url VARCHAR(500),
  price DECIMAL(18,8),
  currency VARCHAR(10) DEFAULT 'SOL',
  owner_id UUID REFERENCES users(id),
  creator_id UUID REFERENCES users(id),
  category VARCHAR(20),
  rarity VARCHAR(20) DEFAULT 'common',
  sale_type VARCHAR(20) DEFAULT 'buy-now',
  royalties DECIMAL(5,2) DEFAULT 10,
  total_sales INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  metadata JSONB,
  is_listed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Измененные таблицы
```sql
-- Таблица пользователей (добавлены новые поля)
ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN experience INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN next_level_exp INTEGER DEFAULT 100;
ALTER TABLE users ADD COLUMN total_tokens DECIMAL(18,8) DEFAULT 0;
ALTER TABLE users ADD COLUMN streak_days INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN longest_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN seasonal_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN nft_collected INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN multiplier_active DECIMAL(5,2) DEFAULT 1.0;
ALTER TABLE users ADD COLUMN last_activity TIMESTAMP;

-- Таблица треков (добавлены новые поля)
ALTER TABLE tracks ADD COLUMN bpm INTEGER;
ALTER TABLE tracks ADD COLUMN energy DECIMAL(3,2);
ALTER TABLE tracks ADD COLUMN danceability DECIMAL(3,2);
ALTER TABLE tracks ADD COLUMN valence DECIMAL(3,2);
ALTER TABLE tracks ADD COLUMN acousticness DECIMAL(3,2);
ALTER TABLE tracks ADD COLUMN instrumentalness DECIMAL(3,2);
ALTER TABLE tracks ADD COLUMN liveness DECIMAL(3,2);
ALTER TABLE tracks ADD COLUMN speechiness DECIMAL(3,2);
```

### 3. Изменения в компонентах

#### Рекомендательная система
```typescript
// Старый импорт
import { RecommendationEngine } from '@/components/recommendations'

// Новый импорт
import { RecommendationEngine, useRecommendations } from '@/components/recommendations'
import { RecommendationProvider } from '@/contexts/recommendation-context'

// Старые пропсы
<RecommendationEngine userId="user123" />

// Новые пропсы
<RecommendationEngine
  userId="user123"
  onTrackSelect={handleTrackSelect}
  refreshInterval={300000}
  showAnalytics={true}
/>
```

#### Система достижений
```typescript
// Старый импорт
import { Achievements } from '@/components/achievements'

// Новый импорт
import { AchievementsSystem, useAchievements } from '@/components/rewards/achievements-system'
import { AchievementProvider } from '@/contexts/achievement-context'

// Старые пропсы
<Achievements userId="user123" />

// Новые пропсы
<AchievementsSystem
  userId="user123"
  showProgress={true}
  compact={false}
  onAchievementUnlock={handleUnlock}
/>
```

#### Интерфейс стейкинга
```typescript
// Старый импорт
import { Staking } from '@/components/staking'

// Новый импорт
import { StakingInterface, useStakingCalculator } from '@/components/staking/staking-interface'
import { StakingProvider } from '@/contexts/staking-context'

// Старые пропсы
<Staking userId="user123" />

// Новые пропсы
<StakingInterface
  userId="user123"
  defaultTab="fixed"
  showAnalytics={true}
  onStake={handleStake}
  onUnstake={handleUnstake}
/>
```

#### NFT рынок
```typescript
// Старый импорт
import { NFTMarket } from '@/components/nft'

// Новый импорт
import { NFTMarketplace, useNFTFilters } from '@/components/nft/nft-marketplace'
import { NFTProvider } from '@/contexts/nft-context'

// Старые пропсы
<NFTMarket userId="user123" />

// Новые пропсы
<NFTMarketplace
  userId="user123"
  defaultView="grid"
  showFilters={true}
  showAnalytics={true}
  onNFTSelect={handleSelect}
  onPurchase={handlePurchase}
/>
```

## 🔧 Изменения в конфигурации

### package.json
```json
{
  "dependencies": {
    "normaldance": "^0.0.0",
    "@solana/web3.js": "^1.78.0",
    "@solana/wallet-adapter-base": "^0.9.23",
    "@solana/wallet-adapter-react": "^0.15.35",
    "framer-motion": "^10.16.4",
    "recharts": "^2.8.0",
    "zustand": "^4.4.7"
  },
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsx build",
    "start": "tsx start",
    "test": "jest",
    "test:mobile": "cd mobile-app && npm test",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

### prisma/schema.prisма
```prisma
// Новые модели
model Achievement {
  id          String   @id @default(cuid())
  name        String
  description String?
  icon        String?
  category    String
  rarity      String   @default("common")
  type        String   @default("single")
  progressMax Int      @default(1)
  rewardType  String?
  rewardAmount Decimal?
  createdAt   DateTime @default(now())
  
  userAchievements UserAchievement[]
}

model UserAchievement {
  id           String   @id @default(cuid())
  userId       String
  achievementId String
  progress     Int      @default(0)
  unlocked     Boolean  @default(false)
  unlockedAt   DateTime?
  createdAt    DateTime @default(now())
  
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)
  
  @@unique([userId, achievementId])
}

model StakingPool {
  id            String   @id @default(cuid())
  name          String
  type          String
  apy           Decimal
  minAmount     Decimal
  maxAmount     Decimal?
  durationDays  Int?
  totalStaked   Decimal  @default(0)
  totalStakers  Int      @default(0)
  createdAt     DateTime @default(now())
  
  stakingTransactions StakingTransaction[]
}

model StakingTransaction {
  id               String   @id @default(cuid())
  userId           String
  poolId           String
  amount           Decimal
  type             String
  startDate        DateTime
  endDate          DateTime?
  rewards          Decimal  @default(0)
  compoundFrequency String?
  createdAt        DateTime @default(now())
  
  user User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  pool StakingPool @relation(fields: [poolId], references: [id], onDelete: Cascade)
}

model NFTCollection {
  id            String   @id @default(cuid())
  name          String
  description   String?
  imageUrl      String?
  totalSupply   Int?
  minted        Int      @default(0)
  floorPrice    Decimal?
  totalVolume   Decimal  @default(0)
  category      String?
  createdAt     DateTime @default(now())
  
  nfts NFT[]
}

model NFT {
  id            String   @id @default(cuid())
  collectionId  String
  tokenId       String   @unique
  name          String
  description   String?
  imageUrl      String?
  audioUrl      String?
  videoUrl      String?
  price         Decimal?
  currency      String   @default("SOL")
  ownerId       String
  creatorId     String
  category      String
  rarity        String   @default("common")
  saleType      String   @default("buy-now")
  royalties     Decimal  @default(10)
  totalSales    Int      @default(0)
  views         Int      @default(0)
  likes         Int      @default(0)
  metadata      Json?
  isListed      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  collection NFTCollection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  owner      User          @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  creator    User          @relation(fields: [creatorId], references: [id], onDelete: Cascade)
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 📊 Изменения в API

### Новые эндпоинты

#### Рекомендации
```typescript
// GET /api/recommendations/personal
{
  "tracks": [...],
  "algorithm": "collaborative_filtering",
  "confidence": 0.85
}

// GET /api/recommendations/collaborative
{
  "tracks": [...],
  "similarUsers": 1234,
  "explanation": "Users with similar taste also listened to..."
}

// GET /api/recommendations/trending
{
  "tracks": [...],
  "timeframe": "week",
  "category": "all"
}
```

#### Достижения
```typescript
// GET /api/achievements/categories
{
  "categories": ["listening", "social", "uploading", "special", "streak", "milestone", "seasonal"]
}

// GET /api/achievements/progress
{
  "achievements": [...],
  "stats": {
    "total": 50,
    "unlocked": 15,
    "inProgress": 20,
    "locked": 15
  }
}

// POST /api/achievements/unlock
{
  "achievementId": "uuid",
  "progress": 1,
  "unlocked": true
}
```

#### Стейкинг
```typescript
// GET /api/staking/pools
{
  "pools": [
    {
      "id": "uuid",
      "name": "Fixed Staking",
      "type": "fixed",
      "apy": 15,
      "minAmount": 1000,
      "maxAmount": 100000,
      "duration": 30,
      "totalStaked": 500000,
      "totalStakers": 100,
      "myStake": 5000,
      "myRewards": 62.5
    }
  ]
}

// POST /api/staking/stake
{
  "poolId": "uuid",
  "amount": 1000,
  "duration": 30,
  "autoCompound": true
}

// GET /api/staking/analytics
{
  "totalStaked": 1000000,
  "totalRewards": 50000,
  "apyHistory": [...],
  "userRank": 123,
  "totalUsers": 1000
}
```

#### NFT рынок
```typescript
// GET /api/nft/marketplace/stats
{
  "totalVolume": 1000000,
  "totalSales": 5000,
  "activeListings": 10000,
  "averagePrice": 200,
  "topCollections": [...]
}

// GET /api/nft/marketplace/filters
{
  "categories": ["audio", "video", "image", "collection", "event"],
  "rarities": ["common", "rare", "epic", "legendary", "mythic"],
  "priceRanges": [[0, 100], [100, 1000], [1000, 10000]]
}

// POST /api/nft/marketplace/bid
{
  "nftId": "uuid",
  "amount": 1.5,
  "message": "Great artwork!"
}
```

### Измененные эндпоинты

#### Аутентификация
```typescript
// Старый формат
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

// Новый формат
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password",
  "2faToken": "optional"
}
```

#### Треки
```typescript
// Старый формат
GET /api/tracks
{
  "tracks": [...],
  "total": 100
}

// Новый формат
GET /api/tracks
{
  "tracks": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "filters": {
    "genre": "electronic",
    "sortBy": "popularity"
  }
}
```

## 🔄 Миграция данных

### Шаг 1: Запуск миграций базы данных
```bash
# Создание новой миграции
npx prisma migrate dev --name upgrade-to-0.0.0

# Применение миграций
npx prisma migrate deploy

// Или для разработки
npx prisma migrate dev
```

### Шаг 2: Запуск сидеров для начальных данных
```bash
# Заполнение таблиц достижений
npm run db:seed:achievements

# Заполнение таблиц стейкинга
npm run db:seed:staking

# Заполнение таблиц NFT
npm run db:seed:nft
```

### Шаг 3: Обновление существующих данных
```typescript
// Миграция данных пользователей
async function migrateUserData() {
  const users = await prisma.user.findMany()
  
  for (const user of users) {
    // Расчет уровня и опыта
    const level = Math.floor(user.totalTokens / 1000) + 1
    const experience = (user.totalTokens % 1000) * 100
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        level,
        experience,
        nextLevelExp: level * 1000
      }
    })
  }
}

// Миграция данных треков
async function migrateTrackData() {
  const tracks = await prisma.track.findMany()
  
  for (const track of tracks) {
    // Генерация метаданных аудио
    const audioFeatures = await generateAudioFeatures(track.audioUrl)
    
    await prisma.track.update({
      where: { id: track.id },
      data: {
        bpm: audioFeatures.bpm,
        energy: audioFeatures.energy,
        danceability: audioFeatures.danceability,
        valence: audioFeatures.valence,
        acousticness: audioFeatures.acousticness,
        instrumentalness: audioFeatures.instrumentalness,
        liveness: audioFeatures.liveness,
        speechiness: audioFeatures.speechiness
      }
    })
  }
}
```

## ⚡ Рекомендации по производительности

### Оптимизация запросов
```typescript
// Использование пагинации
const tracks = await prisma.track.findMany({
  skip: (page - 1) * limit,
  take: limit,
  include: {
    artist: true,
    genre: true
  }
})

// Использование кэширования
const cachedTracks = await cache.get(`tracks:${page}:${limit}`)
if (cachedTracks) {
  return cachedTracks
}

const tracks = await prisma.track.findMany({...})
await cache.set(`tracks:${page}:${limit}`, tracks, 3600) // 1 час
```

### Оптимизация загрузки
```typescript
// Ленивая загрузка компонентов
const RecommendationEngine = dynamic(
  () => import('@/components/recommendations/recommendation-engine'),
  { ssr: false }
)

// Code splitting
const StakingInterface = lazy(() => import('@/components/staking/staking-interface'))
```

### Оптимизация изображений
```typescript
// Использование Next.js Image компонента
import Image from 'next/image'

function NFTCard({ nft }) {
  return (
    <div className="relative">
      <Image
        src={nft.imageUrl}
        alt={nft.name}
        width={300}
        height={300}
        priority={false}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
      />
    </div>
  )
}
```

## 🧪 Тестирование

### Unit тесты
```bash
# Запуск всех тестов
npm test

# Запуск тестов конкретного файла
npm test -- --testPathPattern="recommendation-engine.test.ts"

# Запуск тестов с покрытием
npm test -- --coverage
```

### Интеграционные тесты
```bash
# Запуск интеграционных тестов
npm run test:integration

# Зап试 тестов API
npm run test:api

# Запуск тестов базы данных
npm run test:database
```

### E2E тесты
```bash
# Запуск E2E тестов
npm run test:e2e

# Запуск тестов в браузере
npm run test:e2e:browser

# Запуск тестов на мобильных устройствах
npm run test:e2e:mobile
```

## 🔄 Откат

### Если миграция завершилась с ошибкой

#### Шаг 1: Откат миграций базы данных
```bash
# Откат последней миграции
npx prisma migrate reset

# Или откат к конкретной миграции
npx prisma migrate resolve --applied 20250830120000_initial
```

#### Шаг 2: Восстановление из резервной копии
```bash
# Восстановление базы данных
psql -h localhost -U normaldance -d normaldance < backup_v1.0.0.sql

# Восстановление файлов
tar -xzf backup_v0.0.0_files.tar.gz
```

#### Шаг 3: Проверка работоспособности
```bash
# Запуск приложения в режиме разработки
npm run dev

# Проверка основных функций
curl http://localhost:3000/api/health
```

### Автоматический откат
```typescript
// Скрипт для автоматического отката
async function rollbackMigration() {
  try {
    // Откат миграций
    await exec('npx prisma migrate reset --force')
    
    // Восстановление данных
    await exec('psql -h localhost -U normaldance -d normaldance < backup.sql')
    
    // Перезапуск приложения
    await exec('npm run restart')
    
    console.log('Откат успешно выполнен')
  } catch (error) {
    console.error('Ошибка отката:', error)
    process.exit(1)
  }
}
```

## 📞 Поддержка

Если у вас возникли проблемы при миграции, пожалуйста:

1. Проверьте [FAQ](../faq.md)
2. Посмотрите [видео туториалы](../video-tutorials.md)
3. Обратитесь в [чат поддержки](https://discord.gg/normaldance)
4. Создайте [issue на GitHub](https://github.com/normaldance/normaldance/issues)

## 📝 Дополнительные ресурсы

- [Документация по API](../api.md)
- [Руководство по развертыванию](../../DEPLOY.md)
- [Руководство по тестированию](../testing.md)
- [Руководство по безопасности](../security-testing.md)

---

**Версия документа:** 0.0.0  
**Дата последнего обновления:** 2025-09-01  
**Автор:** NormalDance Team