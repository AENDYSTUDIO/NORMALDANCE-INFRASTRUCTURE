# 👨‍💻 Руководство для разработчиков по contribution process

## 📋 Введение

Добро пожаловать в руководство по разработке для NORMAL DANCE v1.0.1! Этот документ описывает процесс внесения вклада в проект, включая стандарты кодирования, рабочий процесс и лучшие практики.

### 🎯 Цели
- Обеспечение высокого качества кода
- Стандартизация процессов разработки
- Упрощение collaboration между разработчиками
- Обеспечение стабильности и безопасности платформы

### 📁 Структура проекта
```
normaldance/
├── src/                    # Исходный код
│   ├── app/               # Next.js App Router
│   ├── components/        # React компоненты
│   ├── lib/               # Утилиты и конфигурации
│   └── hooks/             # Custom hooks
├── prisma/                # Схема базы данных
├── programs/              # Solana программы
├── docker/                # Docker файлы
├── helm/                  # Helm чарты
├── monitoring/            # Конфигурация мониторинга
├── k8s/                   # Kubernetes manifests
├── tests/                 # Тесты
└── docs/                  # Документация
```

## 🚀 Быстрый старт

### Предварительные требования
- **Node.js** v18+
- **npm** v8+
- **Git** v2.30+
- **Docker** v20.10+
- **TypeScript** v5+

### Клонирование репозитория
```bash
# Клонируем репозиторий
git clone https://github.com/normaldance/normaldance.git
cd normaldance

# Создаем ветку для разработки
git checkout -b feature/your-feature-name
```

### Установка зависимостей
```bash
# Установка зависимостей
npm install

# Установка глобальных зависимостей
npm install -g @prisma/cli @solana/web3.js

# Генерация Prisma клиента
npm run db:generate

# Применение схемы базы данных
npm run db:push
```

### Запуск в разработке
```bash
# Запуск в режиме разработки
npm run dev

# Запуск тестов
npm test

# Запуск линтеров
npm run lint
npm run type-check
```

## 📝 Стандарты кодирования

### TypeScript
```typescript
// Использование строгих типов
interface User {
  id: string
  email: string
  createdAt: Date
}

// Использование enum для констант
enum UserRole {
  ADMIN = 'admin',
  ARTIST = 'artist',
  USER = 'user'
}

// Использование generic типов
function identity<T>(arg: T): T {
  return arg
}

// Использование async/await для асинхронных операций
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
}
```

### React компоненты
```typescript
// Использование функциональных компонентов с хуками
interface UserProfileProps {
  userId: string
  showStats?: boolean
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, showStats = false }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await userService.getUser(userId)
        setUser(userData)
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  if (loading) return <LoadingSpinner />
  if (!user) return <UserNotFound />

  return (
    <div className="user-profile">
      <Avatar src={user.avatarUrl} />
      <h2>{user.name}</h2>
      {showStats && <UserStats userId={userId} />}
    </div>
  )
}

// Использование PropTypes для валидации пропсов
UserProfile.propTypes = {
  userId: PropTypes.string.isRequired,
  showStats: PropTypes.bool
}
```

### Стиль кода
```typescript
// Использование Prettier и ESLint
// Форматирование кода автоматически при сохранении

// Пример хорошо отформатированного кода
const calculateTotal = (items: Item[]): number => {
  return items.reduce((total, item) => {
    return total + item.price * item.quantity
  }, 0)
}

// Использование meaningful переменных
const getUserById = async (userId: string): Promise<User> => {
  const response = await fetch(`/api/users/${userId}`)
  return response.json()
}

// Использование JSDoc для документации
/**
 * Форматирует дату в читаемый формат
 * @param date - Дата для форматирования
 * @returns Отформатированная дата
 */
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ru-RU')
}
```

## 🔄 Рабочий процесс

### 1. Создание ветки
```bash
# Создание feature ветки
git checkout -b feature/add-user-profile

# Создание bugfix ветки
git checkout -b bugfix/fix-login-error

# Создание hotfix ветки
git checkout -b hotfix/fix-security-vulnerability
```

### 2. Разработка
```bash
# Создание коммитов
git add .
git commit -m "feat: add user profile component"

# Использование conventional commits
git commit -m "feat(auth): add two-factor authentication"
git commit -m "fix(api): resolve user login error"
git commit -m "docs(readme): update installation instructions"
```

### 3. Тестирование
```bash
# Запуск тестов
npm test

# Запуск тестов с покрытием
npm run test:coverage

# Заполнение тестовыми данными
npm run db:seed:testing

# Интеграционное тестирование
npm run test:integration
```

### 4. Пулл-реквест
```markdown
## Описание изменений
Добавлен новый компонент профиля пользователя с возможностью редактирования информации.

## Список изменений
- [x] Добавлен компонент UserProfile
- [x] Реализована форма редактирования
- [x] Добавлена валидация полей
- [x] Написаны тесты

## Тесты
- [x] Unit тесты пройдены
- [x] Интеграционные тесты пройдены
- [x] E2E тесты пройдены

## Скриншоты (если применимо)
![Скриншот профиля пользователя](screenshots/user-profile.png)

## Связанные задачи
- Closes #123
- Related to #456
```

### 5. Код-ревью
```bash
# Проверка статуса CI/CD
git status

# Просмотр изменений
git diff

# Просмотр логов CI
gh run view --web
```

## 🧪 Тестирование

### Стратегия тестирования
```typescript
// Unit тесты
describe('UserService', () => {
  it('should return user by id', async () => {
    const user = await userService.getUser('123')
    expect(user).toBeDefined()
    expect(user.id).toBe('123')
  })
})

// Интеграционные тесты
describe('API /api/users', () => {
  it('should create new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'John Doe', email: 'john@example.com' })
    
    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('id')
  })
})

// E2E тесты
describe('User Registration Flow', () => {
  it('should register new user', async () => {
    await page.goto('/register')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
  })
})
```

### Тестовые данные
```typescript
// Использование factories для создания тестовых данных
const userFactory = {
  create: (overrides = {}) => ({
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    ...overrides
  })
}

const trackFactory = {
  create: (overrides = {}) => ({
    id: 'track-123',
    title: 'Test Track',
    artistId: 'user-123',
    duration: 180,
    ...overrides
  })
}
```

## 📊 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
```

### Docker Build
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Установка зависимостей
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Сборка приложения
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Сборка
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Автоматически использует .env.production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
```

## 🔧 Инструменты разработки

### VS Code настройки
```json
// .vscode/settings.json
{
  "typescript.preferences.preferTypeOnlyAutoImports": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### Расширения VS Code
```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-git"
  ]
}
```

### Git hooks
```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run type-check
npm test
```

## 📚 Документация

### JSDoc
```typescript
/**
 * Класс для управления пользователями
 * @class UserService
 */
export class UserService {
  /**
   * Получает пользователя по ID
   * @param {string} userId - ID пользователя
   * @returns {Promise<User>} - Объект пользователя
   * @throws {Error} - Если пользователь не найден
   */
  async getUser(userId: string): Promise<User> {
    // ...
  }

  /**
   * Создает нового пользователя
   * @param {CreateUserDto} userData - Данные для создания пользователя
   * @returns {Promise<User>} - Созданный пользователь
   */
  async createUser(userData: CreateUserDto): Promise<User> {
    // ...
  }
}
```

### README для компонентов
```markdown
# UserProfile Component

Компонент для отображения профиля пользователя.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| userId | string | yes | - | ID пользователя |
| showStats | boolean | no | false | Показывать статистику |

## Usage

```tsx
import UserProfile from '@/components/UserProfile'

function App() {
  return (
    <div>
      <UserProfile userId="123" showStats={true} />
    </div>
  )
}
```

## Styling

Компонент использует Tailwind CSS классы.

## Testing

Компонент покрыт unit тестами.
```

## 🚨 Безопасность

### Проверка зависимостей
```bash
# Проверка уязвимостей
npm audit

# Автоматическое исправление
npm audit fix

# Проверка безопасности контейнеров
npm run security:scan
```

### Секреты
```bash
# Использование .env.local для локальной разработки
echo "NEXTAUTH_SECRET=your-secret-key" >> .env.local

# Использование GitHub Secrets для CI
echo "NEXTAUTH_SECRET=${{ secrets.NEXTAUTH_SECRET }}" >> $GITHUB_ENV
```

## 📈 Производительность

### Оптимизация компонентов
```typescript
// Использование React.memo для оптимизации рендеринга
const ExpensiveComponent = React.memo(({ data }) => {
  return (
    <div>
      {data.map(item => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  )
})

// Использование useMemo для вычислений
const filteredData = useMemo(() => {
  return data.filter(item => item.category === 'music')
}, [data])

// Исп useCallback для функций
const handleClick = useCallback((id: string) => {
  console.log('Clicked:', id)
}, [])
```

### Оптимизация запросов
```typescript
// Использование DataLoader для пакетных запросов
const userLoader = new DataLoader(async (userIds: string[]) => {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } }
  })
  
  return userIds.map(id => users.find(user => user.id === id))
})

// Использование кеширования
const cache = new Map()

async function getCachedData(key: string) {
  if (cache.has(key)) {
    return cache.get(key)
  }
  
  const data = await fetchData(key)
  cache.set(key, data)
  return data
}
```

## 🔄 Версионирование

### Semantic Versioning
```bash
# Major (совместимость нарушена)
1.0.0 -> 2.0.0

# Minor (новая функциональность)
1.0.0 -> 1.1.0

# Patch (исправления ошибок)
1.0.0 -> 1.0.1
```

### Changelog
```markdown
## [1.0.1] - 2025-09-01

### Добавлено
- Новый компонент UserProfile
- Поддержка двухфакторной аутентификации

### Исправлено
- Ошибка при загрузке треков
- Проблема с кешированием

### Улучшено
- Производительность аудио плеера
- UX интерфейса администратора
```

## 🤝 Collaboration

### Code Review
```markdown
## Checklist для Code Review

### Качество кода
- [ ] Код соответствует стандартам проекта
- [ ] Добавлены необходимые тесты
- [ ] Документация обновлена
- [ ] Нет дублирования кода

### Функциональность
- [ ] Новая функциональность работает корректно
- [ ] Не сломана существующая функциональность
- [ ] Обработка ошибок корректна
- [ ] Edge cases обработаны

### Безопасность
- [ ] Нет уязвимостей безопасности
- [ ] Входные данные валидированы
- [ ] Секреты не утелили
- [ ] Права доступа проверены

### Производительность
- [ ] Оптимизированы запросы к базе данных
- [ ] Нет утечек памяти
- [ ] Компоненты оптимизированы
- [ ] Ресурсы освобождаются корректно
```

### Communication
```markdown
## Communication Guidelines

### Slack/Discord
- Используйте соответствующие каналы
- Обсуждайте технические детали в соответствующих каналах
- Задавайте вопросы в канале #help

### GitHub Issues
- Используйте шаблоны для создания issues
- Обязательно указывайте воспроизводимые шаги
- Прикрепляйте скриншоты и логи

### Pull Requests
- Обязательно указывайте reviewer
- Обсуждайте изменения в PR
- Отвечайте на комментарии
```

## 📚 Дополнительные ресурсы

### Документация
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Solana Documentation](https://docs.solana.com)

### Инструменты
- [VS Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/)
- [GitHub](https://github.com/)
- [npm](https://www.npmjs.com/)

### Курсы и туториалы
- [React Tutorial](https://reactjs.org/tutorial/tutorial.html)
- [TypeScript Tutorial](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
- [Next.js Tutorial](https://nextjs.org/learn)
- [Prisma Tutorial](https://www.prisma.io/docs/getting-started/quickstart)

## 🎯 Best Practices

### Общие рекомендации
1. **Пишите читаемый код** - код пишется один раз, но читается много раз
2. **Следуйте стандартам** - используйте существующие паттерны и практики
3. **Тестируйте код** - пишите тесты для нового функционала
4. **Документируйте** - добавляйте JSDoc и README
5. **Ревьюте код** - внимательно проверяйте PR других разработчиков
6. **Коммуницируйте** - обсуждайте сложные технические решения

### React Best Practices
1. **Используйте хуки** - вместо классовых компонентов
2. **Оптимизируйте рендеринг** - используйте React.memo, useMemo, useCallback
3. **Разделяйте компоненты** - создавайте переиспользуемые компоненты
4. **Используйте TypeScript** - для типизации пропсов и состояния
5. **Следуйте принципу единственной ответственности** - каждый компонент должен выполнять одну задачу

### Backend Best Practices
1. **Используйте ORM** - Prisma для работы с базой данных
2. **Валидируйте входные данные** - используйте Zod или Joi
3. **Обрабатывайте ошибки** - используйте try/catch и middleware для обработки ошибок
4. **Оптимизируйте запросы** - используйте DataLoader и кеширование
5. **Следуйте REST принципам** - для API endpoints

### Database Best Practices
1. **Используйте миграции** - для изменений схемы базы данных
2. **Добавляйте индексы** - для оптимизации запросов
3. **Используйте транзакции** - для атомарных операций
4. **Ограничивайте доступ** - используйте роли и права доступа
5. **Резервируйте данные** - регулярно делайте бэкапы

---

**Создано:** Сентябрь 2025
**Версия:** v1.0.1
**Обновлено:** Последнее обновление: Сентябрь 2025
**Ответственный:** Tech Lead - Сидоров П.А.