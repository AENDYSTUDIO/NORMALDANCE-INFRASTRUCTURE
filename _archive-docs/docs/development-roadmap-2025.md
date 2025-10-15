# 🚀 NORMALDANCE Development Roadmap 2025

## 1. 🔧 Техническая оптимизация

### 1.1 Исправление уязвимостей безопасности (Приоритет: ВЫСОКИЙ)
**Срок: 1-2 дня**

#### Шаги:
1. Запустить `npm audit` для анализа уязвимостей
2. Выполнить `npm audit fix` для автоматического исправления
3. Для критических уязвимостей, требующих breaking changes:
   - Изучить каждый случай отдельно
   - Найти альтернативные пакеты или обновить вручную
4. Обновить lock-файлы
5. Запустить тесты для проверки работоспособности

#### Ожидаемый результат:
- 0 критических уязвимостей
- 0 высоких уязвимостей
- Минимум средних и низких

#### Файлы для изменения:
- `package.json`
- `package-lock.json`

---

### 1.2 Миграция IPFS на Helia (Приоритет: СРЕДНИЙ)
**Срок: 3-5 дней**

#### Проблема:
Текущие пакеты deprecated:
- `ipfs-http-client@60.0.1`
- `ipfs-core-utils@0.18.1`
- `ipfs-core-types@0.14.1`

#### Шаги:
1. **День 1-2: Подготовка**
   - Изучить документацию Helia: https://github.com/ipfs/helia
   - Установить пакеты:
     ```bash
     npm install helia @helia/unixfs
     npm uninstall ipfs-http-client ipfs-core-utils ipfs-core-types
     ```

2. **День 3: Миграция кода**
   - Обновить `src/lib/ipfs.ts`:
     ```typescript
     import { createHelia } from 'helia'
     import { unixfs } from '@helia/unixfs'
     
     export async function uploadToIPFS(file: File) {
       const helia = await createHelia()
       const fs = unixfs(helia)
       
       const buffer = await file.arrayBuffer()
       const cid = await fs.addBytes(new Uint8Array(buffer))
       
       return cid.toString()
     }
     ```

3. **День 4: Обновление API роутов**
   - `src/app/api/upload/route.ts`
   - `src/app/api/tracks/route.ts`
   - Все места использования IPFS

4. **День 5: Тестирование**
   - Написать тесты для новых функций
   - Проверить загрузку/скачивание файлов
   - Убедиться в работе Pinata интеграции

#### Файлы для изменения:
- `src/lib/ipfs.ts`
- `src/lib/ipfs-enhanced.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/tracks/route.ts`
- `package.json`

---

### 1.3 Автоматические тесты при коммитах (Приоритет: ВЫСОКИЙ)
**Срок: 1 день**

#### Шаги:
1. **Создать pre-commit hook:**
   ```bash
   # .husky/pre-commit
   #!/bin/sh
   npm run lint
   npm run type-check
   npm run test:unit
   ```

2. **Установить Husky:**
   ```bash
   npm install --save-dev husky
   npx husky install
   npx husky add .husky/pre-commit "npm run lint && npm run type-check"
   ```

3. **Настроить GitHub Actions:**
   - Создать `.github/workflows/ci.yml`
   - Добавить проверки:
     - Линтинг (ESLint)
     - Типы (TypeScript)
     - Тесты (Jest)
     - Build проверка

4. **Добавить badge в README:**
   ```markdown
   ![CI](https://github.com/AENDYSTUDIO/normaldance/workflows/CI/badge.svg)
   ```

#### Файлы для создания:
- `.husky/pre-commit`
- `.github/workflows/ci.yml`

---

## 2. 📱 Функциональность

### 2.1 Telegram Mini App интеграция (Приоритет: ВЫСОКИЙ)
**Срок: 5-7 дней**

#### Архитектура:
```
Telegram Bot → Webhook → Next.js API → Database
                              ↓
                        Mini App UI
```

#### Шаги:

**День 1-2: Настройка Telegram Bot**
1. Создать бота через @BotFather
2. Получить API token
3. Настроить webhook:
   ```typescript
   // src/app/api/telegram/webhook/route.ts
   export async function POST(req: Request) {
     const update = await req.json()
     // Обработка команд
   }
   ```

4. Добавить переменные окружения:
   ```env
   TELEGRAM_BOT_TOKEN=your_token
   TELEGRAM_WEBHOOK_URL=https://normaldance.com/api/telegram/webhook
   ```

**День 3-4: Mini App UI**
1. Создать `/telegram-app` роут:
   ```typescript
   // src/app/telegram-app/page.tsx
   'use client'
   import { useEffect } from 'react'
   
   export default function TelegramApp() {
     useEffect(() => {
       // Инициализация Telegram WebApp
       const tg = window.Telegram.WebApp
       tg.ready()
       tg.expand()
     }, [])
     
     return <div>Telegram Mini App</div>
   }
   ```

2. Добавить Telegram Web App SDK:
   ```html
   <script src="https://telegram.org/js/telegram-web-app.js"></script>
   ```

**День 5-6: Функциональность**
1. Просмотр треков
2. Покупка NFT
3. Создание мемориалов
4. Интеграция Telegram Stars для платежей

**День 7: Тестирование**
- Проверка в Telegram Desktop
- Проверка в Telegram Mobile
- Проверка всех функций

#### Файлы для создания:
- `src/app/telegram-app/page.tsx`
- `src/app/telegram-app/layout.tsx`
- `src/app/api/telegram/webhook/route.ts`
- `src/app/api/telegram/stars/route.ts`
- `src/lib/telegram-integration-2025.ts`

---

### 2.2 NFT мемориалы для Digital Cemetery (Приоритет: СРЕДНИЙ)
**Срок: 7-10 дней**

#### Компоненты:
1. **Smart Contract** (уже есть базовая версия)
2. **Frontend UI**
3. **Backend API**
4. **Интеграция с Solana**

#### Шаги:

**День 1-3: Улучшение Smart Contract**
```solidity
// contracts/MemorialNFT.sol
pragma solidity ^0.8.0;

contract MemorialNFT {
    struct Memorial {
        uint256 tokenId;
        string name;
        string bio;
        string imageURI;
        uint256 timestamp;
        address creator;
    }
    
    mapping(uint256 => Memorial) public memorials;
    
    function createMemorial(
        string memory name,
        string memory bio,
        string memory imageURI
    ) public payable returns (uint256) {
        require(msg.value >= 0.01 ether, "Minimum 0.01 SOL");
        // Логика создания NFT
    }
}
```

**День 4-6: Frontend компоненты**
```typescript
// src/components/memorial/create-memorial-form.tsx
export function CreateMemorialForm() {
  return (
    <form>
      <Input name="name" placeholder="Имя" />
      <Textarea name="bio" placeholder="Биография" />
      <ImageUpload name="photo" />
      <Button type="submit">Создать мемориал (0.01 SOL)</Button>
    </form>
  )
}
```

**День 7-8: Backend API**
```typescript
// src/app/api/memorials/create/route.ts
export async function POST(req: Request) {
  const { name, bio, imageURI, signature } = await req.json()
  
  // 1. Верификация подписи
  // 2. Создание записи в базе
  // 3. Минтинг NFT в блокчейне
  // 4. Возврат результата
}
```

**День 9-10: Интеграция и тестирование**
- Связать все компоненты
- Тестировать создание мемориалов
- Проверить транзакции в Solana

#### Файлы для изменения:
- `contracts/MemorialNFT.sol`
- `src/components/memorial/create-memorial-form.tsx`
- `src/app/api/memorials/create/route.ts`
- `src/app/grave/page.tsx`

---

### 2.3 Интеграция Solana Pay (Приоритет: ВЫСОКИЙ)
**Срок: 3-5 дней**

#### Что такое Solana Pay:
Протокол для мгновенных платежей в Solana с нулевой комиссией для продавца.

#### Шаги:

**День 1: Установка и настройка**
```bash
npm install @solana/pay @solana/web3.js
```

**День 2-3: Создание Payment Request**
```typescript
// src/lib/solana-pay.ts
import { createQR, encodeURL, TransferRequestURLFields } from '@solana/pay'

export function generatePaymentQR(params: {
  recipient: string
  amount: number
  label: string
  message: string
}) {
  const url = encodeURL({
    recipient: new PublicKey(params.recipient),
    amount: new BigNumber(params.amount),
    label: params.label,
    message: params.message,
  })
  
  return createQR(url)
}
```

**День 4: Frontend интеграция**
```typescript
// src/components/payment/solana-pay-button.tsx
export function SolanaPayButton({ amount, onSuccess }) {
  const [qrCode, setQrCode] = useState(null)
  
  const generatePayment = async () => {
    const qr = await generatePaymentQR({
      recipient: PLATFORM_WALLET,
      amount,
      label: 'NORMALDANCE',
      message: 'Покупка трека'
    })
    setQrCode(qr)
  }
  
  return (
    <div>
      <Button onClick={generatePayment}>Оплатить через Solana Pay</Button>
      {qrCode && <img src={qrCode} alt="Scan to pay" />}
    </div>
  )
}
```

**День 5: Webhook для подтверждения платежей**
```typescript
// src/app/api/solana/webhook/route.ts
export async function POST(req: Request) {
  const { signature, amount, from } = await req.json()
  
  // 1. Проверить транзакцию в блокчейне
  // 2. Обновить статус заказа
  // 3. Выдать доступ к контенту
}
```

#### Файлы для создания:
- `src/lib/solana-pay.ts`
- `src/components/payment/solana-pay-button.tsx`
- `src/app/api/solana/webhook/route.ts`

---

## 3. 🎨 UI/UX улучшения

### 3.1 Оптимизация времени загрузки (Приоритет: ВЫСОКИЙ)
**Срок: 3-4 дня**

#### Текущие проблемы:
- Время загрузки: 7 секунд
- TTFB: 1.2 секунды
- FCP: 2.2 секунды

#### Целевые показатели:
- Время загрузки: <3 секунд
- TTFB: <500ms
- FCP: <1 секунда

#### Шаги:

**День 1: Анализ**
```bash
npm install --save-dev @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

module.exports = withBundleAnalyzer({
  // ... config
})
```

Запустить анализ:
```bash
ANALYZE=true npm run build
```

**День 2: Code Splitting**
1. Разделить большие компоненты:
   ```typescript
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <Skeleton />,
     ssr: false
   })
   ```

2. Lazy load для некритичных модулей:
   - Web3 wallet adapters
   - Chart библиотеки
   - IPFS клиент

**День 3: Оптимизация бандла**
1. Tree-shaking для неиспользуемого кода
2. Замена тяжелых библиотек:
   - moment.js → date-fns (уже используется)
   - lodash → lodash-es
3. Удаление дубликатов зависимостей

**День 4: Кэширование и CDN**
1. Настроить Service Worker:
   ```typescript
   // public/sw.js
   self.addEventListener('fetch', (event) => {
     event.respondWith(
       caches.match(event.request).then((response) => {
         return response || fetch(event.request)
       })
     )
   })
   ```

2. Настроить кэш-заголовки в `next.config.js`:
   ```javascript
   async headers() {
     return [
       {
         source: '/static/:path*',
         headers: [
           { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
         ]
       }
     ]
   }
   ```

#### Файлы для изменения:
- `next.config.js`
- `src/app/layout.tsx`
- `src/components/**/*` (lazy loading)

---

### 3.2 Прогрессивная загрузка изображений (Приоритет: СРЕДНИЙ)
**Срок: 2 дня**

#### Шаги:

**День 1: Реализация**
```typescript
// src/components/ui/progressive-image.tsx
import { useState, useEffect } from 'react'
import Image from 'next/image'

export function ProgressiveImage({ src, alt, placeholder }) {
  const [imgSrc, setImgSrc] = useState(placeholder)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      setImgSrc(src)
      setLoading(false)
    }
  }, [src])
  
  return (
    <div className="relative">
      <Image
        src={imgSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${
          loading ? 'opacity-50 blur-sm' : 'opacity-100'
        }`}
      />
      {loading && <Skeleton />}
    </div>
  )
}
```

**День 2: Интеграция**
1. Заменить все `<Image>` на `<ProgressiveImage>`
2. Создать low-quality placeholders (LQIP)
3. Настроить Next.js Image Optimization

#### Файлы для создания:
- `src/components/ui/progressive-image.tsx`
- Обновить все компоненты с изображениями

---

### 3.3 Улучшение мобильной версии (Приоритет: СРЕДНИЙ)
**Срок: 5-7 дней**

#### Проблемы:
- Маленькие кликабельные элементы
- Неоптимальное использование пространства
- Плохая навигация на маленьких экранах

#### Шаги:

**День 1-2: Mobile-first подход**
1. Пересмотреть все компоненты
2. Увеличить touch targets до минимум 48x48px
3. Добавить мобильное меню

**День 3-4: Адаптивная типографика**
```css
/* globals.css */
html {
  font-size: 16px;
}

@media (max-width: 768px) {
  html {
    font-size: 14px;
  }
  
  h1 { font-size: 2rem; }
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.25rem; }
}
```

**День 5-6: Мобильные жесты**
1. Swipe для навигации между треками
2. Pull-to-refresh
3. Bottom sheet для действий

**День 7: Тестирование**
- iPhone SE (малый экран)
- iPhone 12 Pro (средний)
- iPad (планшет)
- Android различные размеры

#### Файлы для изменения:
- `src/app/globals.css`
- Все компоненты UI
- `tailwind.config.ts` (добавить mobile breakpoints)

---

## 4. 🔒 Безопасность

### 4.1 Production environment variables (Приоритет: КРИТИЧЕСКИЙ)
**Срок: 1 день**

#### Текущая проблема:
- Секреты могут быть в коде
- Нет разделения dev/prod переменных

#### Шаги:

**Шаг 1: Аудит секретов**
```bash
# Установить gitleaks для поиска секретов
npm install -g gitleaks
gitleaks detect --source . --verbose
```

**Шаг 2: Создать структуру**
```
.env.local          # Локальная разработка (не коммитить!)
.env.development    # Development окружение
.env.production     # Production окружение
.env.example        # Шаблон (коммитить)
```

**Шаг 3: Настроить Vercel/Railway**
```bash
# Добавить переменные через CLI
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_SOLANA_RPC production
vercel env add PINATA_API_KEY production
vercel env add JWT_SECRET production
```

**Шаг 4: Обновить .gitignore**
```.gitignore
# Environment variables
.env*.local
.env.development
.env.production
!.env.example
```

**Шаг 5: Ротация существующих секретов**
1. Сгенерировать новые API ключи
2. Обновить в production
3. Удалить старые ключи

#### Файлы для создания:
- `.env.example`
- Обновить `.gitignore`
- Документация в `README.md`

---

### 4.2 Rate Limiting для API (Приоритет: ВЫСОКИЙ)
**Срок: 2 дня**

#### Цель:
Защитить API от DDoS и abuse

#### Шаги:

**День 1: Реализация**
```typescript
// src/middleware/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
})

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(
    identifier
  )
  
  if (!success) {
    throw new Error('Rate limit exceeded')
  }
  
  return { limit, reset, remaining }
}
```

**День 2: Интеграция**
```typescript
// src/app/api/tracks/route.ts
import { checkRateLimit } from '@/middleware/rate-limiter'

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous'
  
  try {
    await checkRateLimit(ip)
  } catch (error) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }
  
  // ... API логика
}
```

#### Лимиты по эндпоинтам:
- `/api/auth/*`: 5 req/min
- `/api/tracks/*`: 30 req/min
- `/api/upload/*`: 3 req/min
- `/api/nft/*`: 10 req/min

#### Файлы для создания:
- `src/middleware/rate-limiter.ts`
- Обновить все API роуты

---

### 4.3 CORS защита (Приоритет: СРЕДНИЙ)
**Срок: 1 день**

#### Шаги:

**Создать middleware**
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'

const allowedOrigins = [
  'https://normaldance.com',
  'https://www.normaldance.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
].filter(Boolean)

export function middleware(request: Request) {
  const origin = request.headers.get('origin')
  
  // CORS
  if (origin && !allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 403,
      statusText: 'Forbidden',
    })
  }
  
  const response = NextResponse.next()
  
  response.headers.set('Access-Control-Allow-Origin', origin || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}

export const config = {
  matcher: '/api/:path*',
}
```

#### Файлы для изменения:
- `src/middleware.ts`

---

## 5. 📊 Аналитика

### 5.1 Vercel Analytics (Приоритет: НИЗКИЙ)
**Срок: 1 день**

#### Шаги:

**Уже частично реализовано**, нужно:

1. Убедиться в правильной настройке:
```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

2. Включить в Vercel Dashboard
3. Настроить custom events:
```typescript
import { track } from '@vercel/analytics'

// Tracking покупок
track('track_purchased', { 
  trackId,
  price,
  paymentMethod 
})
```

#### Файлы для изменения:
- `src/app/layout.tsx`
- Добавить tracking в ключевые точки

---

### 5.2 Sentry для мониторинга ошибок (Приоритет: ВЫСОКИЙ)
**Срок: 2 дня**

#### Шаги:

**День 1: Установка и настройка**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})
```

**День 2: Интеграция**
```typescript
// src/app/error.tsx
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function Error({ error }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])
  
  return <div>Что-то пошло не так!</div>
}
```

#### Файлы для создания:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `src/app/error.tsx`

---

### 5.3 Метрики производительности (Приоритет: СРЕДНИЙ)
**Срок: 2-3 дня**

#### Шаги:

**День 1: Core Web Vitals**
```typescript
// src/lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

export function reportWebVitals() {
  getCLS(sendToAnalytics)
  getFID(sendToAnalytics)
  getFCP(sendToAnalytics)
  getLCP(sendToAnalytics)
  getTTFB(sendToAnalytics)
}

function sendToAnalytics(metric) {
  // Отправить в аналитику
  fetch('/api/analytics/vitals', {
    method: 'POST',
    body: JSON.stringify(metric)
  })
}
```

**День 2: Custom метрики**
```typescript
// Время до первого взаимодействия
// Время загрузки аудио
// Время подключения кошелька
// и т.д.
```

**День 3: Dashboard**
Создать простой dashboard для просмотра метрик:
```typescript
// src/app/admin/metrics/page.tsx
export default function MetricsPage() {
  return (
    <div>
      <MetricsChart metric="LCP" />
      <MetricsChart metric="FID" />
      <MetricsChart metric="CLS" />
    </div>
  )
}
```

#### Файлы для создания:
- `src/lib/web-vitals.ts`
- `src/app/api/analytics/vitals/route.ts`
- `src/app/admin/metrics/page.tsx`

---

## 📅 Приоритизация

### Неделя 1 (Критично):
1. ✅ Исправить уязвимости безопасности
2. ✅ Настроить production environment variables
3. ✅ Добавить rate limiting
4. ✅ Настроить автоматические тесты

### Неделя 2 (Важно):
1. ✅ Telegram Mini App интеграция
2. ✅ Solana Pay интеграция
3. ✅ Оптимизация времени загрузки
4. ✅ Sentry мониторинг

### Неделя 3 (Среднее):
1. ✅ Миграция IPFS на Helia
2. ✅ NFT мемориалы
3. ✅ Прогрессивная загрузка изображений
4. ✅ CORS защита

### Неделя 4 (Низкое):
1. ✅ Улучшение мобильной версии
2. ✅ Метрики производительности
3. ✅ Vercel Analytics настройка

---

## 🎯 Успех метрики

### Технические:
- ✅ 0 критических уязвимостей
- ✅ Время загрузки <3 секунд
- ✅ 100% покрытие тестами критических путей
- ✅ 99.9% uptime

### Пользовательские:
- ✅ Telegram Mini App работает
- ✅ Платежи через Solana Pay
- ✅ NFT мемориалы созданы
- ✅ Мобильная версия удобна

### Бизнес:
- ✅ Защита от DDoS
- ✅ Мониторинг всех ошибок
- ✅ Аналитика пользователей
- ✅ Метрики производительности

---

## 📞 Контакты для вопросов

Если возникнут вопросы по плану, обращайтесь к AI Developer Agent!