# NORMAL DANCE MVP Architecture

## 🎯 Core Components (3 main parts)

### 1. Frontend (Next.js)
```
src/
├── app/
│   ├── page.tsx              # Главная страница
│   ├── upload/               # Загрузка треков
│   ├── track/[id]/           # Страница трека
│   └── profile/              # Профиль артиста
├── components/
│   ├── ui/                   # Базовые UI компоненты
│   ├── wallet/               # Подключение кошелька
│   ├── player/               # Аудиоплеер
│   └── upload/               # Форма загрузки
└── lib/
    ├── solana.ts             # Solana интеграция
    ├── ipfs.ts               # IPFS загрузка
    └── db.ts                 # База данных
```

### 2. Backend (Next.js API Routes)
```
src/app/api/
├── auth/                     # Аутентификация
├── tracks/                   # Управление треками
├── nft/                      # NFT операции
└── ipfs/                     # IPFS загрузка
```

### 3. Database (Prisma + SQLite)
```
prisma/
└── schema.prisma             # Упрощенная схема
```

## 🔥 MVP Features Only

### ✅ Included:
- Solana wallet connect (Phantom)
- Track upload to IPFS
- Simple NFT minting
- Music player
- Basic artist profile

### ❌ Removed:
- TON integration
- DEX functionality
- DAO governance
- AI recommendations
- Telegram mini-app
- Social features
- Staking/farming

## 📦 Dependencies Reduction

**From:** 85+ packages  
**To:** 25 packages (70% reduction)

**Removed packages:**
- @ton/* (TON blockchain)
- @qdrant/* (AI search)
- @pinata/* (IPFS pinning - use basic)
- @mdxeditor/* (rich editor)
- @dnd-kit/* (drag & drop)
- recharts (charts)
- socket.io (real-time)
- And 50+ more...

## 🚀 Deployment Simplification

**Before:** Complex multi-service setup  
**After:** Single Vercel deployment

1. **Frontend:** Vercel (automatic)
2. **Database:** SQLite (built-in)
3. **IPFS:** Basic public gateways
4. **Solana:** Public RPC endpoints

## 📈 Development Speed

**Estimated timeline:** 2-3 weeks MVP
- Week 1: Core wallet + upload
- Week 2: NFT minting + player
- Week 3: Polish + deployment

vs  
**Original timeline:** 3-4 months full platform