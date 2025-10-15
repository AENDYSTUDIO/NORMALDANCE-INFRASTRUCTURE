# 🏆 Система достижений - Документация компонента

## Обзор

Компонент `AchievementsSystem` предоставляет визуальную систему достижений с прогресс-барами, категориями и наградами для пользователей платформы NORMAL DANCE.

## Функциональность

### Основные возможности
- **Визуальная система достижений** с анимированными прогресс-барами
- **7 категорий достижений**: Музыкальные, Социальные, Загрузки, Специальные, Серии, Вехи, Сезонные
- **Награды** за достижение целей (токены NDT, бейджи, эксклюзивные предметы)
- **Система уровней** и прогресса пользователей с опытом (EXP)
- **Уведомления** о новых достижениях в реальном времени
- **Анимации** и визуальные эффекты для разблокировки

### Категории достижений
1. **🎵 Музыкальные** - достижения за прослушивание, создание музыки
2. **👥 Социальные** - достижения за взаимодействие с другими пользователями
3. **📤 Загрузки** - достижения за загрузку контента
4. **⭐ Специальные** - уникальные достижения за особые действия
5. **🔥 Серии** - достижения за последовательные действия
6. **🎯 Вехи** - важные вехи в использовании платформы
7. **🎪 Сезонные** - временные достижения и события

## API компонента

### Props
```typescript
interface AchievementsSystemProps {
  className?: string
  userId?: string
  showProgress?: boolean
  compact?: boolean
  onAchievementUnlock?: (achievementId: string) => void
}
```

### Состояния компонента
```typescript
interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  category: 'listening' | 'uploading' | 'social' | 'special' | 'streak' | 'milestone' | 'seasonal'
  progress: number
  maxProgress: number
  unlocked: boolean
  unlockedAt?: string
  type: 'single' | 'progressive' | 'streak' | 'time-limited'
  expiresAt?: string
  chain?: string[] // Для цепочек достижений
  reward?: {
    type: 'tokens' | 'badge' | 'title' | 'exclusive' | 'nft' | 'multiplier'
    amount: number
    description: string
    multiplier?: number
  }
  animation?: {
    effect: 'glow' | 'pulse' | 'bounce' | 'sparkle'
    color: string
  }
}

interface UserStats {
  level: number
  experience: number
  nextLevelExp: number
  totalTokens: number
  totalPlayTime: number
  totalLikes: number
  totalShares: number
  totalUploads: number
  followers: number
  following: number
  streakDays: number
  longestStreak: number
  seasonalPoints: number
  nftCollected: number
  multiplierActive: number
  lastActivity: string
}
```

## Использование

### Базовое использование
```tsx
import { AchievementsSystem } from '@/components/rewards/achievements-system'

function MyComponent() {
  return (
    <div className="p-6">
      <h2>Ваши достижения</h2>
      <AchievementsSystem />
    </div>
  )
}
```

### С кастомными пропсами
```tsx
import { AchievementsSystem } from '@/components/rewards/achievements-system'

function MyComponent() {
  const handleAchievementUnlock = (achievementId: string) => {
    console.log('Достижение разблокировано:', achievementId)
    // логика награды
  }

  return (
    <AchievementsSystem
      userId="user123"
      showProgress={true}
      compact={false}
      onAchievementUnlock={handleAchievementUnlock}
      className="custom-styling"
    />
  )
}
```

### Компактный режим
```tsx
import { AchievementsSystem } from '@/components/rewards/achievements-system'

function Sidebar() {
  return (
    <div className="w-64">
      <AchievementsSystem
        compact={true}
        className="h-fit"
      />
    </div>
  )
}
```

## Методы

### unlockAchievement()
Разблокирует достижение для пользователя.

```typescript
const success = await unlockAchievement(achievementId, userId)
```

**Параметры:**
- `achievementId: string` - ID достижения
- `userId: string` - ID пользователя

**Возвращает:** `Promise<boolean>`

### getUserStats()
Получает статистику пользователя для системы достижений.

```typescript
const stats = await getUserStats(userId)
```

**Параметры:**
- `userId: string` - ID пользователя

**Возвращает:** `Promise<UserStats>`

### getAchievementsByCategory()
Получает достижения по категории.

```typescript
const achievements = await getAchievementsByCategory(category)
```

**Параметры:**
- `category: string` - Категория достижения

**Возвращает:** `Promise<Achievement[]>`

## Стили

Компонент использует Tailwind CSS классы для стилизации. Основные классы:
- `.achievements-system` - основной контейнер
- `.achievement-card` - карточка достижения
- `.achievement-progress` - прогресс-бар
- `.achievement-unlocked` - разблокированное достижение
- `.achievement-locked` - заблокированное достижение
- `.achievement-rarity-{rarity}` - класс для редкости

## Примеры кода

### Интеграция с профилем пользователя
```tsx
import { AchievementsSystem } from '@/components/rewards/achievements-system'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function UserProfile() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Информация о пользователе</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Контент профиля */}
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Достижения</CardTitle>
          </CardHeader>
          <CardContent>
            <AchievementsSystem compact={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

### Кастомная обработка достижений
```tsx
import { AchievementsSystem, useAchievements } from '@/components/rewards/achievements-system'

function CustomAchievementComponent() {
  const { achievements, stats, loading, error } = useAchievements({
    userId: 'user123',
    category: 'listening'
  })

  if (loading) return <div>Загрузка...</div>
  if (error) return <div>Ошибка: {error.message}</div>

  return (
    <div>
      <div className="mb-6">
        <h3>Уровень {stats.level}</h3>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${(stats.experience / stats.nextLevelExp) * 100}%` }}
          />
        </div>
        <p>{stats.experience} / {stats.nextLevelExp} EXP</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map(achievement => (
          <div 
            key={achievement.id} 
            className={`p-4 rounded-lg border-2 ${
              achievement.unlocked 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{achievement.icon}</span>
              <div className="flex-1">
                <h4 className="font-medium">{achievement.name}</h4>
                <p className="text-sm text-gray-600">{achievement.description}</p>
                {achievement.reward && (
                  <p className="text-sm text-green-600 mt-1">
                    🎁 {achievement.reward.description}
                  </p>
                )}
              </div>
              {achievement.unlocked && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
            
            {achievement.type === 'progressive' && (
              <div className="mt-3">
                <div className="flex justify-between text-sm">
                  <span>Прогресс</span>
                  <span>{achievement.progress}/{achievement.maxProgress}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Обработка разблокировки достижений
```tsx
import { AchievementsSystem } from '@/components/rewards/achievements-system'
import { toast } from 'react-hot-toast'

function AchievementPage() {
  const handleAchievementUnlock = (achievementId: string) => {
    const achievement = getAchievementById(achievementId)
    
    if (achievement?.reward) {
      // Показать уведомление о награде
      toast.success(`🎉 Достижение "${achievement.name}" разблокировано! ${achievement.reward.description}`)
      
      // Обновить баланс пользователя
      updateUserBalance(achievement.reward.amount)
      
      // Отправить уведомление
      sendNotification('achievement_unlocked', {
        achievementId,
        reward: achievement.reward
      })
    }
  }

  return (
    <AchievementsSystem
      onAchievementUnlock={handleAchievementUnlock}
    />
  )
}
```

## Тестирование

### Unit тесты
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AchievementsSystem } from '@/components/rewards/achievements-system'

describe('AchievementsSystem', () => {
  const mockAchievements = [
    {
      id: '1',
      name: 'Первый прослуш',
      description: 'Прослушайте первый трек',
      icon: '🎵',
      rarity: 'common',
      category: 'listening',
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      reward: {
        type: 'tokens',
        amount: 10,
        description: '10 токенов NDT'
      }
    }
  ]

  beforeEach(() => {
    jest.spyOn(window, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockAchievements)
      } as Response)
    )
  })

  it('renders achievement cards', async () => {
    render(<AchievementsSystem />)
    
    await waitFor(() => {
      expect(screen.getByText('Первый прослуш')).toBeInTheDocument()
      expect(screen.getByText('🎵')).toBeInTheDocument()
    })
  })

  it('shows progress for progressive achievements', async () => {
    render(<AchievementsSystem />)
    
    await waitFor(() => {
      expect(screen.getByText('Прогресс')).toBeInTheDocument()
    })
  })

  it('calls unlock callback when achievement is clicked', async () => {
    const mockUnlock = jest.fn()
    render(<AchievementsSystem onAchievementUnlock={mockUnlock} />)
    
    await waitFor(() => {
      const achievementCard = screen.getByText('Первый прослуш').closest('.achievement-card')
      fireEvent.click(achievementCard!)
    })
    
    expect(mockUnlock).toHaveBeenCalledWith('1')
  })
})
```

### Интеграционные тесты
```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { AchievementsSystem } from '@/components/rewards/achievements-system'
import { mockUserStats } from '__mocks__/user-stats'

describe('AchievementsSystem Integration', () => {
  beforeEach(() => {
    // Мок API вызовов
    jest.spyOn(window, 'fetch')
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockAchievements)
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockUserStats)
        } as Response)
      )
  })

  it('displays user level and experience', async () => {
    render(<AchievementsSystem />)
    
    await waitFor(() => {
      expect(screen.getByText('Уровень 1')).toBeInTheDocument()
      expect(screen.getByText('150 / 300 EXP')).toBeInTheDocument()
    })
  })

  it('handles achievement unlocking', async () => {
    const mockUnlock = jest.fn()
    render(<AchievementsSystem onAchievementUnlock={mockUnlock} />)
    
    // Симулируем разблокировку достижения
    await waitFor(() => {
      const unlockButton = screen.getByRole('button', { name: /разблокировать/i })
      fireEvent.click(unlockButton)
    })
    
    expect(mockUnlock).toHaveBeenCalled()
  })
})
```

## Производительность

### Оптимизации
- **Ленивая загрузка** достижений
- **Виртуализация списка** для большого количества достижений
- **Кэширование** данных о достижениях
- **Дебаунсинг** анимаций

### Рекомендации по оптимизации
1. Используйте `compact` режим для боковых панелей
2. Реализуйте пагинацию для большого количества достижений
3. Оптимизируйте запросы к API для получения достижений
4. Используйте `React.memo` для дочерних компонентов

## Отладка

### Проблемы и решения
1. **Достижения не отображаются**
   - Проверьте подключение к API
   - Убедитесь, что userId передается корректно
   - Проверьте консоль на наличие ошибок

2. **Прогресс-бары не обновляются**
   - Проверьте правильность расчета прогресса
   - Убедитесь, что данные о пользователе актуальны
   - Проверьте обновление состояния компонента

3. **Анимации работают некорректно**
   - Проверьте CSS классы анимаций
   - Убедитесь, что все зависимости подключены
   - Проверьте совместимость браузеров

## Конфигурация

### Настройка редкости достижений
```typescript
const rarityConfig = {
  common: {
    color: 'gray',
    borderColor: 'border-gray-300',
    bgColor: 'bg-gray-50'
  },
  rare: {
    color: 'blue',
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50'
  },
  epic: {
    color: 'purple',
    borderColor: 'border-purple-300',
    bgColor: 'bg-purple-50'
  },
  legendary: {
    color: 'orange',
    borderColor: 'border-orange-300',
    bgColor: 'bg-orange-50'
  },
  mythic: {
    color: 'red',
    borderColor: 'border-red-300',
    bgColor: 'bg-red-50'
  }
}
```

### Настройка наград
```typescript
const rewardConfig = {
  tokens: {
    icon: '💰',
    color: 'text-green-600'
  },
  badge: {
    icon: '🏅',
    color: 'text-yellow-600'
  },
  title: {
    icon: '👑',
    color: 'text-purple-600'
  },
  exclusive: {
    icon: '⭐',
    color: 'text-blue-600'
  },
  nft: {
    icon: '🎨',
    color: 'text-pink-600'
  },
  multiplier: {
    icon: '📈',
    color: 'text-indigo-600'
  }
}
```

## Версия

**Текущая версия:** 1.0.1

**Дата последнего обновления:** 2025-09-01

## Лицензия

Этот компонент является частью проекта NORMAL DANCE и распространяется под MIT License.