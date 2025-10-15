# 💰 Интерфейс стейкинга - Документация компонента

## Обзор

Компонент `StakingInterface` предоставляет продвинутый интерфейс для стейкинга токенов NDT с различными стратегиями, расчетом доходности и аналитикой.

## Функциональность

### Основные возможности
- **5 типов стейкинга**: Фиксированный, Плавающий, Ликвидность, NFT, Тиры
- **Реальный расчет доходности** с учетом сложного процента и дефляции токенов (2% burn)
- **Автокомпаундирование** с настраиваемой частотой (ежедневно, еженедельно, ежемесячно)
- **Аналитика стейкинга** с графиками APY и объема торгов
- **Ранжинг пользователей** и статистика пула
- **История транзакций** стейкинга
- **Предупреждения о рисках** и комиссии

### Типы стейкинга
1. **🔒 Фиксированный** - гарантированная доходность 15% APY на 30-365 дней
2. **📊 Плавающий** - переменная доходность на основе пула ликвидности
3. **💧 Ликвидность** - предоставление ликвидности для DEX
4. **🎨 NFT** - стейкинг NFT для получения бонусов
5. **🏆 Тиры** - стейкинг с повышенными ставками для крупных держателей

## API компонента

### Props
```typescript
interface StakingInterfaceProps {
  className?: string
  userId?: string
  defaultTab?: 'fixed' | 'floating' | 'liquidity' | 'nft' | 'tiers'
  showAnalytics?: boolean
  compact?: boolean
  onStake?: (data: StakeData) => void
  onUnstake?: (data: UnstakeData) => void
}
```

### Состояния компонента
```typescript
interface StakeData {
  amount: number
  type: 'fixed' | 'floating' | 'liquidity' | 'nft' | 'tiers'
  duration?: number // в днях
  compoundFrequency?: 'daily' | 'weekly' | 'monthly'
  nftId?: string
  tier?: number
  autoCompound: boolean
}

interface UnstakeData {
  amount: number
  type: 'fixed' | 'floating' | 'liquidity' | 'nft' | 'tiers'
  earlyUnstake: boolean
  penalty?: number
}

interface StakingPool {
  id: string
  name: string
  type: 'fixed' | 'floating' | 'liquidity' | 'nft' | 'tiers'
  apy: number
  minAmount: number
  maxAmount: number
  duration: number
  totalStaked: number
  totalStakers: number
  myStake: number
  myRewards: number
  nextReward: string
  isAvailable: boolean
  riskLevel: 'low' | 'medium' | 'high'
  description: string
  features: string[]
  requirements: string[]
}

interface StakingAnalytics {
  totalStaked: number
  totalRewards: number
  apyHistory: Array<{
    date: string
    apy: number
  }>
  volumeHistory: Array<{
    date: string
    volume: number
  }>
  userRank: number
  totalUsers: number
  myContribution: number
  myShare: number
}
```

## Использование

### Базовое использование
```tsx
import { StakingInterface } from '@/components/staking/staking-interface'

function MyComponent() {
  return (
    <div className="p-6">
      <h2>Стейкинг токенов</h2>
      <StakingInterface />
    </div>
  )
}
```

### С кастомными пропсами
```tsx
import { StakingInterface } from '@/components/staking/staking-interface'

function MyComponent() {
  const handleStake = (data: StakeData) => {
    console.log('Стейкинг:', data)
    // логика стейкинга
  }

  const handleUnstake = (data: UnstakeData) => {
    console.log 'Анстейкинг:', data)
    // логика анстейкинга
  }

  return (
    <StakingInterface
      userId="user123"
      defaultTab="fixed"
      showAnalytics={true}
      onStake={handleStake}
      onUnstake={handleUnstake}
      className="custom-styling"
    />
  )
}
```

### Компактный режим
```tsx
import { StakingInterface } from '@/components/staking/staking-interface'

function Sidebar() {
  return (
    <div className="w-80">
      <StakingInterface
        compact={true}
        defaultTab="floating"
      />
    </div>
  )
}
```

## Методы

### calculateStakingRewards()
Рассчитывает потенциальную доходность стейкинга.

```typescript
const rewards = await calculateStakingRewards(params)
```

**Параметры:**
```typescript
interface StakingCalculationParams {
  amount: number
  type: 'fixed' | 'floating' | 'liquidity' | 'nft' | 'tiers'
  duration?: number
  compoundFrequency?: 'daily' | 'weekly' | 'monthly'
  currentApy?: number
  tokenPrice?: number
}
```

**Возвращает:** `Promise<StakingRewards>`

### getStakingPools()
Получает информацию о пулах стейкинга.

```typescript
const pools = await getStakingPools()
```

**Возвращает:** `Promise<StakingPool[]>`

### getUserStakingData()
Получает данные о стейкинге пользователя.

```typescript
const data = await getUserStakingData(userId)
```

**Параметры:**
- `userId: string` - ID пользователя

**Возвращает:** `Promise<UserStakingData>`

## Стили

Компонент использует Tailwind CSS классы для стилизации. Основные классы:
- `.staking-interface` - основной контейнер
- `.staking-pool` - карточка пула стейкинга
- `.staking-tab` - вкладка типа стейкинга
- `.staking-analytics` - блок аналитики
- `.staking-rewards` - блок расчета доходности

## Примеры кода

### Интеграция с кошельком
```tsx
import { StakingInterface } from '@/components/staking/staking-interface'
import { useWallet } from '@/components/wallet/wallet-adapter'

function StakingPage() {
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
        <p>Пожалуйста, подключите кошелек для использования стейкинга</p>
        <button onClick={connectWallet}>Подключить кошелек</button>
      </div>
    )
  }

  return (
    <StakingInterface
      userId={userId}
      onStake={async (data) => {
        // Подпись транзакции
        const signature = await stakeTokens(data)
        console.log('Транзакция подписана:', signature)
      }}
    />
  )
}
```

### Кастомный расчет доходности
```tsx
import { StakingInterface, useStakingCalculator } from '@/components/staking/staking-interface'

function CustomStakingCalculator() {
  const { amount, duration, type, rewards, calculate } = useStakingCalculator()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label>Сумма (NDT)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min="100"
          />
        </div>
        
        <div>
          <label>Тип стейкинга</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="fixed">Фиксированный</option>
            <option value="floating">Плавающий</option>
            <option value="liquidity">Ликвидность</option>
            <option value="nft">NFT</option>
            <option value="tiers">Тиры</option>
          </select>
        </div>
        
        <div>
          <label>Срок (дней)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min="30"
            max="365"
          />
        </div>
      </div>

      <button onClick={calculate}>Рассчитать доходность</button>

      {rewards && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3>Расчет доходности</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>APY: {rewards.apy}%</p>
              <p>Общая доходность: {rewards.totalRewards} NDT</p>
            </div>
            <div>
              <p>После комиссии: {rewards.netRewards} NDT</p>
              <p>Эквивалент в USD: ${rewards.usdValue}</p>
            </div>
          </div>
          
          {rewards.compoundEffect && (
            <div className="mt-4">
              <p>Эффект сложного процента: +{rewards.compoundEffect} NDT</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### Обработка стейкинга с автокомпаундированием
```tsx
import { StakingInterface } from '@/components/staking/staking-interface'
import { toast } from 'react-hot-toast'

function AdvancedStakingPage() {
  const handleStake = async (data: StakeData) => {
    try {
      // Проверка баланса
      const balance = await getTokenBalance('NDT')
      if (balance < data.amount) {
        throw new Error('Недостаточно токенов')
      }

      // Подготовка транзакции
      const transaction = await prepareStakingTransaction(data)
      
      // Подписание транзакции
      const signature = await signTransaction(transaction)
      
      // Отправка транзакции
      const result = await sendTransaction(signature)
      
      if (result.success) {
        toast.success(`✅ Стейкинг ${data.amount} NDT успешно выполнен!`)
        
        // Обновление UI
        updateStakingData()
        
        // Запуск автокомпаундирования если включено
        if (data.autoCompound) {
          setupAutoCompound(data)
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error(`❌ Ошибка стейкинга: ${error.message}`)
    }
  }

  return (
    <StakingInterface
      onStake={handleStake}
      showAnalytics={true}
    />
  )
}
```

## Тестирование

### Unit тесты
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StakingInterface } from '@/components/staking/staking-interface'

describe('StakingInterface', () => {
  const mockPools = [
    {
      id: '1',
      name: 'Фиксированный стейкинг',
      type: 'fixed',
      apy: 15,
      minAmount: 1000,
      maxAmount: 100000,
      duration: 30,
      totalStaked: 500000,
      totalStakers: 100,
      myStake: 5000,
      myRewards: 62.5,
      isAvailable: true,
      riskLevel: 'low'
    }
  ]

  beforeEach(() => {
    jest.spyOn(window, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockPools)
      } as Response)
    )
  })

  it('renders staking pools', async () => {
    render(<StakingInterface />)
    
    await waitFor(() => {
      expect(screen.getByText('Фиксированный стейкинг')).toBeInTheDocument()
      expect(screen.getByText('15% APY')).toBeInTheDocument()
    })
  })

  it('switches between staking types', async () => {
    render(<StakingInterface />)
    
    // Переключение на плавающий стейкинг
    fireEvent.click(screen.getByText('Плавающий'))
    
    await waitFor(() => {
      expect(screen.getByText('Переменная доходность')).toBeInTheDocument()
    })
  })

  it('calculates rewards correctly', async () => {
    render(<StakingInterface />)
    
    await waitFor(() => {
      const amountInput = screen.getByLabelText('Сумма')
      fireEvent.change(amountInput, { target: { value: '1000' } })
      
      expect(screen.getByText('62.5 NDT')).toBeInTheDocument()
    })
  })

  it('shows insufficient balance warning', async () => {
    render(<StakingInterface />)
    
    await waitFor(() => {
      const amountInput = screen.getByLabelText('Сумма')
      fireEvent.change(amountInput, { target: { value: '1000000' } })
      
      expect(screen.getByText('Недостаточно токенов')).toBeInTheDocument()
    })
  })
})
```

### Интеграционные тесты
```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { StakingInterface } from '@/components/staking/staking-interface'
import { mockWallet } from '__mocks__/wallet'

describe('StakingInterface Integration', () => {
  beforeEach(() => {
    // Мок API вызовов
    jest.spyOn(window, 'fetch')
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockPools)
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve({ balance: 10000 })
        } as Response)
      )
  })

  it('handles staking transaction flow', async () => {
    render(<StakingInterface />)
    
    // Заполнение формы стейкинга
    await waitFor(() => {
      const amountInput = screen.getByLabelText('Сумма')
      fireEvent.change(amountInput, { target: { value: '1000' } })
      
      const stakeButton = screen.getByRole('button', { name: /застейкить/i })
      fireEvent.click(stakeButton)
    })
    
    // Проверка вызова обработчика
    expect(mockWallet.signTransaction).toHaveBeenCalled()
  })

  it('displays analytics data', async () => {
    render(<StakingInterface showAnalytics={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('Аналитика стейкинга')).toBeInTheDocument()
      expect(screen.getByText('Общий объем стейкинга')).toBeInTheDocument()
    })
  })
})
```

## Производительность

### Оптимизации
- **Ленивая загрузка** данных о пулах
- **Кэширование** расчетов доходности
- **Дебаунсинг** при вводе суммы
- **Виртуализация** списка транзакций

### Рекомендации по оптимизации
1. Используйте `compact` режим для боковых панелей
2. Реализуйте пагинацию для истории транзакций
3. Оптимизируйте запросы к API для получения данных о пулах
4. Используйте `React.memo` для дочерних компонентов

## Отладка

### Проблемы и решения
1. **Расчеты доходности некорректны**
   - Проверьте формулы расчета APY
   - Убедитесь, что учтена дефляция токенов (2% burn)
   - Проверьте расчет сложного процента

2. **Транзакции стейкинга не проходят**
   - Проверьте баланс кошелька
   - Убедитесь, что сеть доступна
   - Проверьте комиссии за транзакцию
   - Проверьте лимиты пула стейкинга

3. **Аналитика не отображается**
   - Проверьте подключение к API аналитики
   - Убедитесь, что userId передается корректно
   - Проверьте права доступа к данным

## Конфигурация

### Настройка типов стейкинга
```typescript
const stakingTypes = {
  fixed: {
    name: 'Фиксированный',
    icon: '🔒',
    color: 'blue',
    description: 'Гарантированная доходность 15% APY',
    minDuration: 30,
    maxDuration: 365,
    riskLevel: 'low'
  },
  floating: {
    name: 'Плавающий',
    icon: '📊',
    color: 'green',
    description: 'Переменная доходность на основе пула',
    minDuration: 7,
    maxDuration: 90,
    riskLevel: 'medium'
  },
  liquidity: {
    name: 'Ликвидность',
    icon: '💧',
    color: 'cyan',
    description: 'Предоставление ликвидности для DEX',
    minDuration: 1,
    maxDuration: 30,
    riskLevel: 'high'
  },
  nft: {
    name: 'NFT',
    icon: '🎨',
    color: 'purple',
    description: 'Стейкинг NFT для получения бонусов',
    minDuration: 0,
    maxDuration: 0,
    riskLevel: 'low'
  },
  tiers: {
    name: 'Тиры',
    icon: '🏆',
    color: 'orange',
    description: 'Повышенные ставки для крупных держателей',
    minDuration: 30,
    maxDuration: 365,
    riskLevel: 'low'
  }
}
```

### Настройка комиссий
```typescript
const feeConfig = {
  staking: {
    fixed: 0.5, // 0.5%
    floating: 0.3,
    liquidity: 0.1,
    nft: 1.0,
    tiers: 0.2
  },
  earlyUnstake: {
    fixed: 2.0, // 2% при досрочном анстейкинге
    floating: 1.0,
    liquidity: 0.5,
    nft: 0,
    tiers: 1.5
  },
  compound: {
    daily: 0.1, // 0.1% за автокомпаундирование
    weekly: 0.05,
    monthly: 0.02
  }
}
```

## Версия

**Текущая версия:** 1.0.1

**Дата последнего обновления:** 2025-09-01

## Лицензия

Этот компонент является частью проекта NORMAL DANCE и распространяется под MIT License.