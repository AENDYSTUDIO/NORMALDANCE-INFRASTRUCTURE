# 🤖 AI Рекомендательная система - Документация компонента

## Обзор

Компонент `RecommendationEngine` предоставляет персонализированные музыкальные рекомендации на основе коллаборативной фильтрации, истории прослушиваний и трендов платформы.

## Функциональность

### Основные возможности
- **Персонализированные рекомендации** на основе истории прослушиваний пользователя
- **Коллаборативная фильтрация** для пользователей со схожими музыкальными вкусами
- **Рекомендации по трендам** на основе популярности контента
- **Адаптивная система** обучения на предпочтениях пользователей
- **Кэширование результатов** для улучшения производительности

### Вкладки рекомендаций
1. **Персональные** - рекомендации на основе истории прослушиваний
2. **Коллаборативные** - рекомендации от пользователей со схожими вкусами
3. **Тренды** - популярные и актуальные треки платформы

## API компонента

### Props
```typescript
interface RecommendationEngineProps {
  className?: string
  userId?: string
  onTrackSelect?: (trackId: string) => void
  refreshInterval?: number // в миллисекундах
}
```

### Состояния компонента
```typescript
interface Track {
  id: string
  title: string
  artist: string
  genre: string
  bpm: number
  similarity: number // процент совпадения
  playCount: number
  rating: number
  collaborativeScore?: number
}

interface UserListeningHistory {
  trackId: string
  playCount: number
  rating: number
  timestamp: Date
}

interface CollaborativeRecommendation {
  trackId: string
  score: number
  reason: string
}
```

## Использование

### Базовое использование
```tsx
import { RecommendationEngine } from '@/components/recommendations/recommendation-engine'

function MyComponent() {
  return (
    <div className="p-6">
      <h2>Рекомендации для вас</h2>
      <RecommendationEngine />
    </div>
  )
}
```

### С кастомными пропсами
```tsx
import { RecommendationEngine } from '@/components/recommendations/recommendation-engine'

function MyComponent() {
  const handleTrackSelect = (trackId: string) => {
    console.log('Выбран трек:', trackId)
    // логика воспроизведения трека
  }

  return (
    <RecommendationEngine
      userId="user123"
      onTrackSelect={handleTrackSelect}
      refreshInterval={300000} // 5 минут
      className="custom-styling"
    />
  )
}
```

## Методы

### generatePersonalRecommendations()
Генерирует персонализированные рекомендации на основе истории прослушиваний.

```typescript
const recommendations = await generatePersonalRecommendations()
```

**Возвращает:** `Promise<Track[]>`

### generateCollaborativeRecommendations()
Генерирует рекомендации на основе коллаборативной фильтрации.

```typescript
const recommendations = await generateCollaborativeRecommendations()
```

**Возвращает:** `Promise<CollaborativeRecommendation[]>`

### generateTrendingRecommendations()
Генерирует рекомендации на основе трендов платформы.

```typescript
const recommendations = await generateTrendingRecommendations()
```

**Возвращает:** `Promise<Track[]>`

## Стили

Компонент использует Tailwind CSS классы для стилизации. Основные классы:
- `.recommendation-engine` - основной контейнер
- `.recommendation-item` - элемент рекомендации
- `.recommendation-header` - заголовок вкладки
- `.recommendation-loading` - индикатор загрузки

## Примеры кода

### Интеграция с аудио плеером
```tsx
import { RecommendationEngine } from '@/components/recommendations/recommendation-engine'
import { useAudioPlayer } from '@/hooks/use-audio-player'

function MusicPage() {
  const { playTrack } = useAudioPlayer()

  const handleTrackSelect = (trackId: string) => {
    playTrack(trackId)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {/* Основной контент */}
      </div>
      <div className="lg:col-span-1">
        <RecommendationEngine 
          onTrackSelect={handleTrackSelect}
          className="sticky top-6"
        />
      </div>
    </div>
  )
}
```

### Кастомная обработка рекомендаций
```tsx
import { RecommendationEngine, useRecommendations } from '@/components/recommendations/recommendation-engine'

function CustomRecommendationComponent() {
  const { recommendations, loading, error, refresh } = useRecommendations({
    type: 'personal',
    limit: 10
  })

  if (loading) return <div>Загрузка...</div>
  if (error) return <div>Ошибка: {error.message}</div>

  return (
    <div>
      <button onClick={refresh}>Обновить</button>
      <div className="space-y-4">
        {recommendations.map(track => (
          <div key={track.id} className="p-4 bg-white rounded-lg shadow">
            <h3>{track.title}</h3>
            <p>{track.artist}</p>
            <p>Совпадение: {track.similarity}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Тестирование

### Unit тесты
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RecommendationEngine } from '@/components/recommendations/recommendation-engine'

describe('RecommendationEngine', () => {
  it('renders recommendation tabs', () => {
    render(<RecommendationEngine />)
    
    expect(screen.getByText('Персональные')).toBeInTheDocument()
    expect(screen.getByText('Коллаборативные')).toBeInTheDocument()
    expect(screen.getByText('Тренды')).toBeInTheDocument()
  })

  it('switches between tabs', async () => {
    render(<RecommendationEngine />)
    
    fireEvent.click(screen.getByText('Коллаборативные'))
    
    await waitFor(() => {
      expect(screen.getByText('Совпадение:')).toBeInTheDocument()
    })
  })

  it('shows loading state', () => {
    render(<RecommendationEngine />)
    
    expect(screen.getByText('Анализируем ваши предпочтения...')).toBeInTheDocument()
  })
})
```

### Интеграционные тесты
```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { RecommendationEngine } from '@/components/recommendations/recommendation-engine'
import { mockRecommendations } from '__mocks__/recommendations'

describe('RecommendationEngine Integration', () => {
  beforeEach(() => {
    // Мок API вызовов
    jest.spyOn(window, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockRecommendations)
      } as Response)
    )
  })

  it('displays recommendations from API', async () => {
    render(<RecommendationEngine />)
    
    await waitFor(() => {
      expect(screen.getByText('Neon Nights')).toBeInTheDocument()
      expect(screen.getByText('Synthwave Master')).toBeInTheDocument()
    })
  })
})
```

## Производительность

### Оптимизации
- **Кэширование результатов** рекомендаций
- **Ленивая загрузка** контента
- **Дебаунсинг** при переключении вкладок
- **Виртуализация списка** для большого количества рекомендаций

### Рекомендации по оптимизации
1. Используйте `refreshInterval` для периодического обновления рекомендаций
2. Реализуйте кэширование на уровне приложения
3. Оптимизируйте запросы к API для получения рекомендаций
4. Используйте `React.memo` для дочерних компонентов

## Отладка

### Проблемы и решения
1. **Рекомендации не загружаются**
   - Проверьте подключение к API
   - Убедитесь, что userId передается корректно
   - Проверьте консоль на наличие ошибок

2. **Медленная производительность**
   - Уменьшите количество рекомендаций
   - Включите кэширование
   - Оптимизируйте запросы к базе данных

3. **Некорректные рекомендации**
   - Проверьте алгоритм коллаборативной фильтрации
   - Убедитесь, что история прослушиваний собирается корректно
   - Настройте веса для различных факторов

## Версия

**Текущая версия:** 1.0.1

**Дата последнего обновления:** 2025-09-01

## Лицензия

Этот компонент является частью проекта NORMAL DANCE и распространяется под MIT License.