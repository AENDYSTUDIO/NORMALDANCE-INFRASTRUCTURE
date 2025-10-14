# 🧪 План тестирования NORMAL DANCE

Этот документ описывает комплексный план тестирования платформы NormalDance для обеспечения качества и надежности приложения.

## 📋 Общая информация

### Цели тестирования
- Обеспечение качества всех функций платформы
- Выявление и устранение ошибок до релиза
- Проверка производительности и безопасности
- Сбор обратной связи от пользователей

### Область тестирования
- Веб-приложение (Next.js)
- Мобильное приложение (React Native)
- API endpoints
- База данных (Prisma + SQLite)
- Web3 интеграция (Solana)
- Внешние сервисы интеграции

### Методология тестирования
- **Юнит-тестирование**: Отдельные компоненты и функции
- **Интеграционное тестирование**: Взаимодействие между компонентами
- **E2E тестирование**: Полные пользовательские сценарии
- **Нагрузочное тестирование**: Производительность под нагрузкой
- **Безопасностное тестирование**: Проверка уязвимостей

## 🎯 Тестовые сценарии

### 1. Аутентификация и авторизация

#### Регистрация
```typescript
describe('User Registration', () => {
  test('should register new user with valid data', async () => {
    // Given
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      displayName: 'Test User'
    }
    
    // When
    const response = await api.auth.signup(userData)
    
    // Then
    expect(response.status).toBe(201)
    expect(response.data.user.email).toBe(userData.email)
    expect(response.data.user.username).toBe(userData.username)
  })
  
  test('should reject registration with duplicate email', async () => {
    // Given
    const userData = { email: 'existing@example.com', ... }
    
    // When
    const response = await api.auth.signup(userData)
    
    // Then
    expect(response.status).toBe(409)
    expect(response.error).toContain('email already exists')
  })
})
```

#### Вход в систему
```typescript
describe('User Login', () => {
  test('should login with valid credentials', async () => {
    // Given
    const credentials = { email: 'test@example.com', password: 'password123' }
    
    // When
    const response = await api.auth.login(credentials)
    
    // Then
    expect(response.status).toBe(200)
    expect(response.data.token).toBeDefined()
    expect(response.data.user).toBeDefined()
  })
  
  test('should reject login with invalid credentials', async () => {
    // Given
    const credentials = { email: 'test@example.com', password: 'wrongpass' }
    
    // When
    const response = await api.auth.login(credentials)
    
    // Then
    expect(response.status).toBe(401)
    expect(response.error).toContain('invalid credentials')
  })
})
```

#### Web3 аутентификация
```typescript
describe('Web3 Authentication', () => {
  test('should connect wallet successfully', async () => {
    // Given
    const mockWallet = createMockWallet()
    
    // When
    const response = await api.wallet.connect(mockWallet)
    
    // Then
    expect(response.status).toBe(200)
    expect(response.data.walletAddress).toBeDefined()
    expect(response.data.balance).toBeDefined()
  })
  
  test('should sign message with wallet', async () => {
    // Given
    const message = 'test message'
    const mockWallet = createMockWallet()
    
    // When
    const response = await api.wallet.signMessage(mockWallet, message)
    
    // Then
    expect(response.status).toBe(200)
    expect(response.data.signature).toBeDefined()
  })
})
```

### 2. Музыкальный контент

#### Поиск музыки
```typescript
describe('Music Search', () => {
  test('should search tracks by title', async () => {
    // Given
    const query = { q: 'test track', type: 'track' }
    
    // When
    const response = await api.search.tracks(query)
    
    // Then
    expect(response.status).toBe(200)
    expect(response.data.tracks).toBeDefined()
    expect(response.data.tracks.length).toBeGreaterThan(0)
  })
  
  test('should filter search results by genre', async () => {
    // Given
    const query = { q: '', genre: 'electronic', type: 'track' }
    
    // When
    const response = await api.search.tracks(query)
    
    // Then
    expect(response.status).toBe(200)
    response.data.tracks.forEach(track => {
      expect(track.genre).toBe('electronic')
    })
  })
})
```

#### Воспроизведение музыки
```typescript
describe('Music Playback', () => {
  test('should play track successfully', async () => {
    // Given
    const trackId = 'track123'
    const mockUser = createMockUser()
    
    // When
    const response = await api.playback.play(trackId, mockUser)
    
    // Then
    expect(response.status).toBe(200)
    expect(response.data.playbackId).toBeDefined()
    expect(response.data.duration).toBeDefined()
  })
  
  test('should track play history', async () => {
    // Given
    const trackId = 'track123'
    const userId = 'user123'
    
    // When
    await api.playback.play(trackId, userId)
    const history = await api.playback.getHistory(userId)
    
    // Then
    expect(history.length).toBeGreaterThan(0)
    expect(history[0].trackId).toBe(trackId)
  })
})
```

#### Управление плейлистами
```typescript
describe('Playlist Management', () => {
  test('should create playlist', async () => {
    // Given
    const playlistData = {
      name: 'Test Playlist',
      description: 'Test description',
      isPublic: true
    }
    const userId = 'user123'
    
    // When
    const response = await api.playlists.create(playlistData, userId)
    
    // Then
    expect(response.status).toBe(201)
    expect(response.data.playlist.name).toBe(playlistData.name)
    expect(response.data.playlist.userId).toBe(userId)
  })
  
  test('should add track to playlist', async () => {
    // Given
    const playlistId = 'playlist123'
    const trackId = 'track123'
    
    // When
    const response = await api.playlists.addTrack(playlistId, trackId)
    
    // Then
    expect(response.status).toBe(200)
    expect(response.data.playlist.tracks).toContainEqual(
      expect.objectContaining({ trackId })
    )
  })
})
```

### 3. Профили пользователей

#### Управление профилем
```typescript
describe('User Profile', () => {
  test('should update user profile', async () => {
    // Given
    const userId = 'user123'
    const profileData = {
      displayName: 'New Name',
      bio: 'New bio',
      avatar: 'new-avatar-url'
    }
    
    // When
    const response = await api.users.updateProfile(userId, profileData)
    
    // Then
    expect(response.status).toBe(200)
    expect(response.data.user.displayName).toBe(profileData.displayName)
    expect(response.data.user.bio).toBe(profileData.bio)
  })
  
  test('should get user statistics', async () => {
    // Given
    const userId = 'user123'
    
    // When
    const response = await api.users.getStatistics(userId)
    
    // Then
    expect(response.status).toBe(200)
    expect(response.data.stats).toBeDefined()
    expect(response.data.stats.playCount).toBeDefined()
    expect(response.data.stats.favoriteCount).toBeDefined()
  })
})
```

#### Артистский профиль
```typescript
describe('Artist Profile', () => {
  test('should verify artist account', async () => {
    // Given
    const userId = 'user123'
    const verificationData = {
      documents: ['doc1.pdf', 'doc2.pdf'],
      bio: 'Artist bio'
    }
    
    // When
    const response = await api.artists.verify(userId, verificationData)
    
    // Then
    expect(response.status).toBe(200)
    expect(response.data.artist.isVerified).toBe(true)
  })
  
  test('should get artist analytics', async () => {
    // Given
    const artistId = 'artist123'
    const dateRange = { start: '2024-01-01', end: '2024-12-31' }
    
    // When
    const response = await api.artists.getAnalytics(artistId, dateRange)
    
    // Then
    expect(response.status).toBe(200)
    expect(response.data.analytics).toBeDefined()
    expect(response.data.analytics.revenue).toBeDefined()
    expect(response.data.analytics.streams).toBeDefined()
  })
})
```

### 4. Web3 и NFT

#### Кошелек
```typescript
describe('Wallet Management', () => {
  test('should get wallet balance', async () => {
    // Given
    const walletAddress = 'wallet123'
    
    // When
    const response = await api.wallet.getBalance(walletAddress)
    
    // Then
    expect(response.status).toBe(200)
    expect(response.data.balance).toBeDefined()
    expect(response.data.balance.sol).toBeDefined()
    expect(response.data.balance.ndt).toBeDefined()
  })
  
  test('should transfer tokens', async () => {
    // Given
    const transferData = {
      from: 'wallet123',
      to: 'wallet456',
      amount: 100,
      token: 'ndt'
    }
    
    // When
    const response = await api.wallet.transfer(transferData)
    
    // Then
    expect(response.status).toBe(200)
    expect(response.data.transaction).toBeDefined()
    expect(response.data.transaction.hash).toBeDefined()
  })
})
```

#### NFT операции
```typescript
describe('NFT Operations', () => {
  test('should mint NFT', async () => {
    // Given
    const nftData = {
      trackId: 'track123',
      name: 'Test NFT',
      description: 'Test description',
      price: 100
    }
    
    // When
    const response = await api.nft.mint(nftData)
    
    // Then
    expect(response.status).toBe(201)
    expect(response.data.nft.tokenId).toBeDefined()
    expect(response.data.nft.metadata).toBeDefined()
  })
  
  test('should list NFT for sale', async () => {
    // Given
    const nftId = 'nft123'
    const listingData = { price: 200 }
    
    // When
    const response = await api.nft.listForSale(nftId, listingData)
    
    // Then
    expect(response.status).toBe(200)
    expect(response.data.nft.status).toBe('listed')
    expect(response.data.nft.price).toBe(listingData.price)
  })
})
```

### 5. Социальные функции

#### Подписки
```typescript
describe('User Subscriptions', () => {
  test('should subscribe to artist', async () => {
    // Given
    const userId = 'user123'
    const artistId = 'artist123'
    
    // When
    const response = await api.subscriptions.subscribe(userId, artistId)
    
    // Then
    expect(response.status).toBe(201)
    expect(response.data.subscription.userId).toBe(userId)
    expect(response.data.subscription.artistId).toBe(artistId)
  })
  
  test('should get user subscriptions', async () => {
    // Given
    const userId = 'user123'
    
    // When
    const response = await api.subscriptions.getUserSubscriptions(userId)
    
    // Then
    expect(response.status).toBe(200)
    expect(response.data.subscriptions).toBeDefined()
    expect(Array.isArray(response.data.subscriptions)).toBe(true)
  })
})
```

#### Лайки и комментарии
```typescript
describe('Engagement Features', () => {
  test('should like track', async () => {
    // Given
    const userId = 'user123'
    const trackId = 'track123'
    
    // When
    const response = await api.likes.create(userId, trackId)
    
    // Then
    expect(response.status).toBe(201)
    expect(response.data.like.userId).toBe(userId)
    expect(response.data.like.trackId).toBe(trackId)
  })
  
  test('should add comment to track', async () => {
    // Given
    const commentData = {
      userId: 'user123',
      trackId: 'track123',
      content: 'Great track!'
    }
    
    // When
    const response = await api.comments.create(commentData)
    
    // Then
    expect(response.status).toBe(201)
    expect(response.data.comment.content).toBe(commentData.content)
    expect(response.data.comment.userId).toBe(commentData.userId)
  })
})
```

## 🧪 Интеграционное тестирование

### API интеграция
```typescript
describe('API Integration', () => {
  test('should handle user authentication flow', async () => {
    // Given
    const userData = createTestUser()
    
    // When
    const registerResponse = await api.auth.signup(userData)
    const loginResponse = await api.auth.login({
      email: userData.email,
      password: userData.password
    })
    const profileResponse = await api.users.getProfile(loginResponse.data.user.id)
    
    // Then
    expect(registerResponse.status).toBe(201)
    expect(loginResponse.status).toBe(200)
    expect(profileResponse.status).toBe(200)
    expect(profileResponse.data.user.email).toBe(userData.email)
  })
  
  test('should handle music playback with user session', async () => {
    // Given
    const user = createTestUser()
    const track = createTestTrack()
    
    // When
    const loginResponse = await api.auth.login({
      email: user.email,
      password: user.password
    })
    const playResponse = await api.playback.play(track.id, loginResponse.data.user)
    const historyResponse = await api.playback.getHistory(loginResponse.data.user.id)
    
    // Then
    expect(loginResponse.status).toBe(200)
    expect(playResponse.status).toBe(200)
    expect(historyResponse.status).toBe(200)
    expect(historyResponse.data[0].trackId).toBe(track.id)
  })
})
```

### База данных
```typescript
describe('Database Integration', () => {
  test('should maintain data consistency', async () => {
    // Given
    const testData = createTestData()
    
    // When
    await prisma.user.create({ data: testData.user })
    await prisma.track.create({ data: testData.track })
    await prisma.like.create({ 
      data: {
        userId: testData.user.id,
        trackId: testData.track.id
      }
    })
    
    // Then
    const user = await prisma.user.findUnique({
      where: { id: testData.user.id },
      include: { likes: true }
    })
    
    expect(user).toBeDefined()
    expect(user.likes.length).toBe(1)
    expect(user.likes[0].trackId).toBe(testData.track.id)
  })
})
```

## 🚀 Нагрузочное тестирование

### Тестирование производительности
```typescript
describe('Performance Testing', () => {
  test('should handle concurrent user requests', async () => {
    // Given
    const concurrentUsers = 100
    const requests = Array(concurrentUsers).fill().map(() => 
      api.search.tracks({ q: 'test', type: 'track' })
    )
    
    // When
    const startTime = Date.now()
    const responses = await Promise.all(requests)
    const endTime = Date.now()
    
    // Then
    const avgResponseTime = (endTime - startTime) / concurrentUsers
    expect(avgResponseTime).toBeLessThan(1000) // Less than 1 second
    responses.forEach(response => {
      expect(response.status).toBe(200)
    })
  })
  
  test('should handle database under load', async () => {
    // Given
    const loadTest = async () => {
      const user = createTestUser()
      return await api.users.create(user)
    }
    
    // When
    const startTime = Date.now()
    const promises = Array(50).fill().map(loadTest)
    const results = await Promise.all(promises)
    const endTime = Date.now()
    
    // Then
    const totalTime = endTime - startTime
    expect(totalTime).toBeLessThan(10000) // Less than 10 seconds for 50 users
    results.forEach(result => {
      expect(result.status).toBe(201)
    })
  })
})
```

### Тестирование памяти
```typescript
describe('Memory Testing', () => {
  test('should not have memory leaks during playback', async () => {
    // Given
    const track = createTestTrack()
    const memoryUsage = process.memoryUsage()
    
    // When
    for (let i = 0; i < 1000; i++) {
      await api.playback.play(track.id, createTestUser())
    }
    
    // Then
    const newMemoryUsage = process.memoryUsage()
    const memoryIncrease = newMemoryUsage.heapUsed - memoryUsage.heapUsed
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Less than 50MB increase
  })
})
```

## 🔒 Безопасностное тестирование

### Аутентификация и авторизация
```typescript
describe('Security Testing', () => {
  test('should prevent SQL injection', async () => {
    // Given
    const maliciousInput = "'; DROP TABLE users; --"
    
    // When
    const response = await api.search.tracks({ q: maliciousInput, type: 'track' })
    
    // Then
    expect(response.status).toBe(200)
    // Should not cause database error
  })
  
  test('should validate input sanitization', async () => {
    // Given
    const xssPayload = '<script>alert("xss")</script>'
    
    // When
    const response = await api.comments.create({
      userId: 'user123',
      trackId: 'track123',
      content: xssPayload
    })
    
    // Then
    expect(response.status).toBe(201)
    expect(response.data.comment.content).not.toContain('<script>')
  })
})
```

### Web3 безопасность
```typescript
describe('Web3 Security', () => {
  test('should validate wallet signatures', async () => {
    // Given
    const maliciousWallet = createMaliciousWallet()
    
    // When
    const response = await api.wallet.connect(maliciousWallet)
    
    // Then
    expect(response.status).toBe(400)
    expect(response.error).toContain('invalid wallet signature')
  })
  
  test('should prevent unauthorized token transfers', async () => {
    // Given
    const unauthorizedTransfer = {
      from: 'attacker_wallet',
      to: 'victim_wallet',
      amount: 1000,
      token: 'ndt'
    }
    
    // When
    const response = await api.wallet.transfer(unauthorizedTransfer)
    
    // Then
    expect(response.status).toBe(403)
    expect(response.error).toContain('unauthorized transfer')
  })
})
```

## 📱 Тестирование на разных устройствах

### Браузерная совместимость
```typescript
describe('Cross-Browser Testing', () => {
  const browsers = ['chrome', 'firefox', 'safari', 'edge']
  
  browsers.forEach(browser => {
    test(`should work on ${browser}`, async () => {
      // Given
      const page = await browser.newPage()
      
      // When
      await page.goto('https://normaldance.com')
      await page.click('[data-testid="login-button"]')
      await page.type('[data-testid="email-input"]', 'test@example.com')
      await page.type('[data-testid="password-input"]', 'password123')
      await page.click('[data-testid="submit-button"]')
      
      // Then
      await page.waitForSelector('[data-testid="user-profile"]')
      const profileVisible = await page.isVisible('[data-testid="user-profile"]')
      expect(profileVisible).toBe(true)
    })
  })
})
```

### Мобильное приложение
```typescript
describe('Mobile App Testing', () => {
  test('should handle mobile gestures', async () => {
    // Given
    const device = 'iPhone 12'
    
    // When
    await device.launchApp()
    await device.tap('[data-testid="search-button"]')
    await device.type('[data-testid="search-input"]', 'test track')
    await device.tap('[data-testid="search-submit"]')
    
    // Then
    await device.waitForElementByType('UITableView')
    const searchResults = await device.getNumberOfElementsByType('UITableViewCell')
    expect(searchResults).toBeGreaterThan(0)
  })
  
  test('should work offline', async () => {
    // Given
    await device.launchApp()
    await device.toggleAirplaneMode()
    
    // When
    await device.tap('[data-testid="offline-playlist"]')
    
    // Then
    await device.waitForElementByType('UITableView')
    const playlistVisible = await device.isVisible('[data-testid="playlist-container"]')
    expect(playlistVisible).toBe(true)
  })
})
```

## 🎯 Тестовые данные

### Структура тестовых данных
```typescript
// test/data/factory.ts
export const createTestUser = (overrides = {}) => ({
  id: 'user123',
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  password: 'hashed_password',
  isArtist: false,
  level: 'BRONZE',
  balance: 0,
  ...overrides
})

export const createTestTrack = (overrides = {}) => ({
  id: 'track123',
  title: 'Test Track',
  artistName: 'Test Artist',
  genre: 'electronic',
  duration: 180,
  ipfsHash: 'QmTestHash',
  price: 0.1,
  isPublished: true,
  ...overrides
})

export const createTestPlaylist = (overrides = {}) => ({
  id: 'playlist123',
  name: 'Test Playlist',
  description: 'Test description',
  isPublic: true,
  playCount: 0,
  ...overrides
})
```

### Очистка тестовых данных
```typescript
// test/utils/cleanup.ts
export const cleanupTestData = async () => {
  await prisma.like.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.playlistTrack.deleteMany()
  await prisma.playlist.deleteMany()
  await prisma.track.deleteMany()
  await prisma.user.deleteMany()
}

export const setupTestDatabase = async () => {
  await cleanupTestData()
  const testUser = await prisma.user.create({
    data: createTestUser()
  })
  const testTrack = await prisma.track.create({
    data: createTestTrack({ artistId: testUser.id })
  })
  return { testUser, testTrack }
}
```

## 📊 Отчетность и метрики

### Метрики тестирования
```typescript
// test/metrics.ts
export const testMetrics = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  executionTime: 0,
  coverage: {
    statements: 0,
    branches: 0,
    functions: 0,
    lines: 0
  },
  performance: {
    avgResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: 0,
    throughput: 0
  }
}

export const generateTestReport = () => {
  const passRate = (testMetrics.passedTests / testMetrics.totalTests) * 100
  const report = {
    summary: {
      total: testMetrics.totalTests,
      passed: testMetrics.passedTests,
      failed: testMetrics.failedTests,
      skipped: testMetrics.skippedTests,
      passRate: `${passRate.toFixed(2)}%`
    },
    performance: testMetrics.performance,
    coverage: testMetrics.coverage,
    timestamp: new Date().toISOString()
  }
  
  console.log('Test Report:', report)
  return report
}
```

### Интеграция с CI/CD
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run e2e tests
      run: npm run test:e2e
    
    - name: Run security tests
      run: npm run test:security
    
    - name: Generate test report
      run: npm run test:report
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      with:
        name: test-results
        path: test-results/
```

## 🔄 Обновление тестов

### Регулярное обновление
- Еженедельно: Обновление тестовых данных
- Ежемесячно: Обновление тестовых сценариев
- Квартально: Обновление тестовой инфраструктуры

### Обратная связь
- Сбор ошибок от пользователей
- Анализ логов приложения
- Мониторинг производительности

---

**Последнее обновление:** 2024-01-01
**Версия:** 1.0.0
**Ответственный:** QA Team