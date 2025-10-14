# 🎨 NFT Рынок - Документация компонента

## Обзор

Компонент `NFTMarketplace` предоставляет полнофункциональный маркетплейс для покупки, продажи и управления музыкальными NFT с продвинутыми фильтрами, аукционами и аналитикой.

## Функциональность

### Основные возможности
- **Мульти-маркетплейс** поддержка (OpenSea, Rarible, Foundation)
- **Продвинутые фильтры** по цене, категории, редкости, дате
- **Аукционы** с автоматическим расчетом минимального прироста
- **Статистика рынка** в реальном времени с графиками трендов
- **Портфель пользователя** с общей стоимостью и историей транзакций
- **Предпросмотр NFT** с аудио плеером
- **Интеграция с кошельками** для покупок и продаж

### Типы NFT
1. **🎵 Аудио NFT** - музыкальные треки с уникальными правами
2. **🎬 Видео NFT** - музыкальные видео и визуализации
3. **🖼️ Изображения NFT** - обложки и арт для музыки
4. **🎭 Коллекции NFT** - наборы связанных NFT
5. **🎪 События NFT** - билеты на мероприятия и концерты

## API компонента

### Props
```typescript
interface NFTMarketplaceProps {
  className?: string
  userId?: string
  defaultView?: 'grid' | 'list'
  showFilters?: boolean
  showAnalytics?: boolean
  compact?: boolean
  onNFTSelect?: (nft: NFT) => void
  onPurchase?: (nft: NFT, price: number) => void
  onSale?: (nft: NFT, price: number) => void
}
```

### Состояния компонента
```typescript
interface NFT {
  id: string
  tokenId: string
  name: string
  description: string
  imageUrl: string
  audioUrl?: string
  videoUrl?: string
  price: number
  currency: 'SOL' | 'NDT' | 'USD'
  owner: string
  creator: string
  category: 'audio' | 'video' | 'image' | 'collection' | 'event'
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
  metadata: {
    bpm?: number
    genre?: string
    duration?: number
    releaseDate?: string
    platform?: string
  }
  saleType: 'buy-now' | 'auction' | 'offer'
  auction?: {
    currentBid: number
    endTime: string
    minIncrement: number
    bids: Array<{
      bidder: string
      amount: number
      timestamp: string
    }>
  }
  royalties: number // процент роялти
  totalSales: number
  views: number
  likes: number
  createdAt: string
  updatedAt: string
  isListed: boolean
  collection?: {
    id: string
    name: string
    description: string
    floorPrice: number
  }
}

interface NFTCollection {
  id: string
  name: string
  description: string
  imageUrl: string
  totalSupply: number
  minted: number
  floorPrice: number
  totalVolume: number
  owners: number
  averagePrice: number
  category: string
  rarityDistribution: Record<string, number>
  topHolders: Array<{
    address: string
    amount: number
    percentage: number
  }>
}

interface MarketStats {
  totalVolume: number
  totalSales: number
  activeListings: number
  averagePrice: number
  topCollections: NFTCollection[]
  priceHistory: Array<{
    timestamp: string
    price: number
    volume: number
  }>
  categoryStats: Record<string, {
    volume: number
    sales: number
    averagePrice: number
  }>
}
```

## Использование

### Базовое использование
```tsx
import { NFTMarketplace } from '@/components/nft/nft-marketplace'

function MyComponent() {
  return (
    <div className="p-6">
      <h2>NFT Рынок</h2>
      <NFTMarketplace />
    </div>
  )
}
```

### С кастомными пропсами
```tsx
import { NFTMarketplace } from '@/components/nft/nft-marketplace'

function MyComponent() {
  const handleNFTSelect = (nft: NFT) => {
    console.log('Выбран NFT:', nft)
    // логика предпросмотра
  }

  const handlePurchase = async (nft: NFT, price: number) => {
    console.log('Покупка NFT:', nft, price)
    // логика покупки
  }

  return (
    <NFTMarketplace
      userId="user123"
      defaultView="grid"
      showFilters={true}
      showAnalytics={true}
      onNFTSelect={handleNFTSelect}
      onPurchase={handlePurchase}
      className="custom-styling"
    />
  )
}
```

### Компактный режим
```tsx
import { NFTMarketplace } from '@/components/nft/nft-marketplace'

function Sidebar() {
  return (
    <div className="w-80">
      <NFTMarketplace
        compact={true}
        defaultView="list"
        showFilters={false}
      />
    </div>
  )
}
```

## Методы

### getNFTs()
Получает список NFT с фильтрацией.

```typescript
const nfts = await getNFTs(filters)
```

**Параметры:**
```typescript
interface NFTFilters {
  category?: string
  rarity?: string
  priceRange?: [number, number]
  sortBy?: 'price' | 'date' | 'popularity' | 'rarity'
  sortOrder?: 'asc' | 'desc'
  search?: string
  collectionId?: string
  creator?: string
  owner?: string
  saleType?: 'buy-now' | 'auction' | 'offer'
  limit?: number
  offset?: number
}
```

**Возвращает:** `Promise<NFT[]>`

### getMarketStats()
Получает статистику рынка в реальном времени.

```typescript
const stats = await getMarketStats()
```

**Возвращает:** `Promise<MarketStats>`

### placeBid()
Размещает ставку на аукционе.

```typescript
const result = await placeBid(auctionId, amount, userId)
```

**Параметры:**
- `auctionId: string` - ID аукциона
- `amount: number` - Сумма ставки
- `userId: string` - ID пользователя

**Возвращает:** `Promise<{ success: boolean; transaction?: string }>`
```

### listNFT()
Размещает NFT на продажу.

```typescript
const result = await listNFT(nftId, price, saleType, userId)
```

**Параметры:**
- `nftId: string` - ID NFT
- `price: number` - Цена продажи
- `saleType: 'buy-now' | 'auction' | 'offer'` - Тип продажи
- `userId: string` - ID пользователя

**Возвращает:** `Promise<{ success: boolean; transaction?: string }>`
```

## Стили

Компонент использует Tailwind CSS классы для стилизации. Основные классы:
- `.nft-marketplace` - основной контейнер
- `.nft-card` - карточка NFT
- `.nft-filters` - панель фильтров
- `.nft-analytics` - блок аналитики
- `.nft-auction` - блок аукциона

## Примеры кода

### Интеграция с кошельком
```tsx
import { NFTMarketplace } from '@/components/nft/nft-marketplace'
import { useWallet } from '@/components/wallet/wallet-adapter'

function NFTPage() {
  const { connected, balance, publicKey } = useWallet()
  const [userId, setUserId] = useState<string>()

  useEffect(() => {
    if (publicKey) {
      setUserId(publicKey.toString())
    }
  }, [publicKey])

  if (!connected) {
    return (
      <div className="text-center p-8">
        <p>Пожалуйста, подключите кошелек для использования NFT рынка</p>
        <button onClick={connectWallet}>Подключить кошелек</button>
      </div>
    )
  }

  return (
    <NFTMarketplace
      userId={userId}
      onPurchase={async (nft, price) => {
        // Проверка баланса
        if (balance < price) {
          throw new Error('Недостаточно средств')
        }

        // Подготовка транзакции
        const transaction = await preparePurchaseTransaction(nft, price)
        
        // Подписание транзакции
        const signature = await signTransaction(transaction)
        
        // Отправка транзакции
        const result = await sendTransaction(signature)
        
        if (result.success) {
          // Обновление UI
          updateNFTData(nft.id)
          updateBalance()
        }
      }}
    />
  )
}
```

### Кастомный фильтр NFT
```tsx
import { NFTMarketplace, useNFTFilters } from '@/components/nft/nft-marketplace'

function CustomNFTFilter() {
  const { 
    filters, 
    setFilters, 
    categories, 
    rarities, 
    collections 
  } = useNFTFilters()

  return (
    <div className="space-y-4">
      <div>
        <label>Категория</label>
        <select 
          value={filters.category || ''}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">Все категории</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Редкость</label>
        <select 
          value={filters.rarity || ''}
          onChange={(e) => setFilters({ ...filters, rarity: e.target.value })}
        >
          <option value="">Все редкости</option>
          {rarities.map(rarity => (
            <option key={rarity} value={rarity}>{rarity}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Цена (SOL)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="От"
            value={filters.priceRange?.[0] || ''}
            onChange={(e) => setFilters({
              ...filters,
              priceRange: [Number(e.target.value), filters.priceRange?.[1] || 0]
            })}
          />
          <input
            type="number"
            placeholder="До"
            value={filters.priceRange?.[1] || ''}
            onChange={(e) => setFilters({
              ...filters,
              priceRange: [filters.priceRange?.[0] || 0, Number(e.target.value)]
            })}
          />
        </div>
      </div>

      <div>
        <label>Коллекция</label>
        <select 
          value={filters.collectionId || ''}
          onChange={(e) => setFilters({ ...filters, collectionId: e.target.value })}
        >
          <option value="">Все коллекции</option>
          {collections.map(collection => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
```

### Обработка аукционов
```tsx
import { NFTMarketplace } from '@/components/nft/nft-marketplace'
import { toast } from 'react-hot-toast'

function AuctionPage() {
  const handleBid = async (nft: NFT, amount: number) => {
    try {
      // Проверка баланса
      const balance = await getBalance('SOL')
      if (balance < amount) {
        throw new Error('Недостаточно SOL для ставки')
      }

      // Проверка минимального прироста
      if (nft.auction && amount < nft.auction.currentBid + nft.auction.minIncrement) {
        throw new Error(`Минимальная ставка: ${nft.auction.currentBid + nft.auction.minIncrement} SOL`)
      }

      // Подготовка транзакции
      const transaction = await prepareBidTransaction(nft.id, amount)
      
      // Подписание транзакции
      const signature = await signTransaction(transaction)
      
      // Отправка транзакции
      const result = await sendTransaction(signature)
      
      if (result.success) {
        toast.success(`✅ Ставка ${amount} SOL успешно размещена!`)
        
        // Обновление UI
        updateAuctionData(nft.id)
        updateBalance()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error(`❌ Ошибка ставки: ${error.message}`)
    }
  }

  return (
    <NFTMarketplace
      onPurchase={handleBid}
      showFilters={true}
      showAnalytics={true}
    />
  )
}
```

## Тестирование

### Unit тесты
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NFTMarketplace } from '@/components/nft/nft-marketplace'

describe('NFTMarketplace', () => {
  const mockNFTs = [
    {
      id: '1',
      tokenId: '123',
      name: 'Neon Nights',
      description: 'Синтвейв трек',
      imageUrl: '/nft1.jpg',
      price: 1.5,
      currency: 'SOL',
      owner: 'user1',
      creator: 'artist1',
      category: 'audio',
      rarity: 'rare',
      saleType: 'buy-now',
      royalties: 10,
      totalSales: 5,
      views: 100,
      likes: 20,
      createdAt: '2025-01-01',
      isListed: true
    }
  ]

  beforeEach(() => {
    jest.spyOn(window, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockNFTs)
      } as Response)
    )
  })

  it('renders NFT cards', async () => {
    render(<NFTMarketplace />)
    
    await waitFor(() => {
      expect(screen.getByText('Neon Nights')).toBeInTheDocument()
      expect(screen.getByText('1.5 SOL')).toBeInTheDocument()
    })
  })

  it('filters NFT by category', async () => {
    render(<NFTMarketplace />)
    
    await waitFor(() => {
      const categoryFilter = screen.getByLabelText('Категория')
      fireEvent.change(categoryFilter, { target: { value: 'audio' } })
    })
    
    expect(screen.getByText('Neon Nights')).toBeInTheDocument()
  })

  it('shows NFT preview', async () => {
    render(<NFTMarketplace />)
    
    await waitFor(() => {
      const nftCard = screen.getByText('Neon Nights').closest('.nft-card')
      fireEvent.click(nftCard!)
    })
    
    expect(screen.getByText('Предпросмотр NFT')).toBeInTheDocument()
  })

  it('handles purchase flow', async () => {
    render(<NFTMarketplace />)
    
    await waitFor(() => {
      const buyButton = screen.getByRole('button', { name: /купить/i })
      fireEvent.click(buyButton)
    })
    
    expect(screen.getByText('Подтверждение покупки')).toBeInTheDocument()
  })
})
```

### Интеграционные тесты
```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { NFTMarketplace } from '@/components/nft/nft-marketplace'
import { mockWallet } from '__mocks__/wallet'

describe('NFTMarketplace Integration', () => {
  beforeEach(() => {
    // Мок API вызовов
    jest.spyOn(window, 'fetch')
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockNFTs)
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockMarketStats)
        } as Response)
      )
  })

  it('displays market statistics', async () => {
    render(<NFTMarketplace showAnalytics={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('Статистика рынка')).toBeInTheDocument()
      expect(screen.getByText('Объем торгов')).toBeInTheDocument()
    })
  })

  it('handles NFT purchase with wallet integration', async () => {
    render(<NFTMarketplace />)
    
    // Симуляция покупки
    await waitFor(() => {
      const buyButton = screen.getByRole('button', { name: /купить/i })
      fireEvent.click(buyButton)
    })
    
    // Проверка вызова обработчика
    expect(mockWallet.signTransaction).toHaveBeenCalled()
  })
})
```

## Производительность

### Оптимизации
- **Ленивая загрузка** NFT
- **Виртуализация** списка NFT
- **Кэширование** данных о коллекциях
- **Дебаунсинг** при фильтрации
- **Image optimization** для превью NFT

### Рекомендации по оптимизации
1. Используйте `compact` режим для боковых панелей
2. Реализуйте пагинацию для больших списков NFT
3. Оптимизируйте запросы к API для получения NFT
4. Используйте `React.memo` для дочерних компонентов

## Отладка

### Проблемы и решения
1. **NFT не отображаются**
   - Проверьте подключение к API
   - Убедитесь, что фильтры корректны
   - Проверьте консоль на наличие ошибок

2. **Транзакции покупки не проходят**
   - Проверьте баланс кошелька
   - Убедитесь, что сеть доступна
   - Проверьте комиссии за транзакцию
   - Проверьте права доступа к NFT

3. **Аукционы работают некорректно**
   - Проверьте логику расчета минимального прироста
   - Убедитесь, что время окончания аукциона корректно
   - Проверьте обработку ставок

## Конфигурация

### Настройка редкости NFT
```typescript
const rarityConfig = {
  common: {
    color: 'gray',
    borderColor: 'border-gray-300',
    bgColor: 'bg-gray-50',
    multiplier: 1.0
  },
  rare: {
    color: 'blue',
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50',
    multiplier: 1.5
  },
  epic: {
    color: 'purple',
    borderColor: 'border-purple-300',
    bgColor: 'bg-purple-50',
    multiplier: 2.0
  },
  legendary: {
    color: 'orange',
    borderColor: 'border-orange-300',
    bgColor: 'bg-orange-50',
    multiplier: 3.0
  },
  mythic: {
    color: 'red',
    borderColor: 'border-red-300',
    bgColor: 'bg-red-50',
    multiplier: 5.0
  }
}
```

### Настройка комиссий
```typescript
const feeConfig = {
  marketplace: {
    listing: 2.5, // 2.5% при размещении на продажу
    sale: 2.5, // 2.5% при продаже
    auction: 1.0 // 1% при аукционе
  },
  royalties: {
    default: 10, // 10% роялти по умолчанию
    creator: 8, // 8% создателю
    platform: 2 // 2% платформе
  },
  gas: {
    standard: 0.0005, // стандартная комиссия
    priority: 0.001, // повышенная комиссия
    auction: 0.002 // комиссия для аукционов
  }
}
```

## Версия

**Текущая версия:** 1.0.1

**Дата последнего обновления:** 2025-09-01

## Лицензия

Этот компонент является частью проекта NORMAL DANCE и распространяется под MIT License.