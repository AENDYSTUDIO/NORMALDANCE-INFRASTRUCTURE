## Week 3 — Performance & Security: детальный план исполнения

Цели недели:
- Оптимизация времени загрузки (7s → <3s)
- Внедрение rate limiting для API
- CORS защита middleware
- Progressive image loading

Acceptance (в конце недели):
- TTFB <500ms, FCP <1s, загрузка <3s (Lighthouse 90+)
- Rate limiting активен на всех API эндпоинтах (429 при превышении)
- CORS разрешает только allowedOrigins, OPTIONS запросы обработаны
- Progressive images показывают placeholder → blur → full, lazy loading
- CI зелёный: lint, types, tests, build

---

1) Bundle Analysis и Code Splitting

1.1 Анализ текущего бандла
- Установить @next/bundle-analyzer:
  - npm i -D @next/bundle-analyzer
- Обновить next.config.ts:
  - const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' })
  - module.exports = withBundleAnalyzer({ ...existingConfig })
- Запустить анализ:
  - ANALYZE=true npm run build
  - Открыть .next/analyze/client.html и .next/analyze/server.html
- Задачи:
  - Зафиксировать топ-5 самых больших пакетов (Solana, Radix, IPFS, etc.)
  - Определить кандидатов для dynamic import

1.2 Code Splitting для тяжёлых компонентов
- Файл: src/app/layout.tsx
- Изменения:
  - import dynamic from 'next/dynamic'
  - const WalletProvider = dynamic(() => import('@/components/wallet/wallet-provider'), { ssr: false, loading: () => <Skeleton className="h-8 w-32" /> })
  - const ProgressBar = dynamic(() => import('@/components/ui/progress-bar'), { ssr: false })
- Другие кандидаты:
  - Solana wallet adapters (lazy load при клике Connect)
  - Chart компоненты (recharts — lazy при открытии analytics)
  - IPFS клиент (lazy при upload)

1.3 Tree-shaking и удаление дубликатов
- Проверить package.json:
  - Заменить moment.js → date-fns (уже сделано)
  - Заменить lodash → lodash-es (если используется)
  - Убрать неиспользуемые пакеты (npm depcheck или проверить вручную)
- Псевдокод:
  - npm i -D depcheck
  - npx depcheck
  - Удалить неиспользуемые зависимости из package.json

Acceptance для блока:
- Bundle client <500KB initial, server <200KB
- Lighthouse Performance 90+

---

2) Service Worker и кэширование

2.1 Service Worker для статики
- Файл: public/sw.js
- Псевдокод:
  - self.addEventListener('install', e => { e.waitUntil(caches.open('v1').then(cache => cache.addAll(['/','/_next/static/...']))) })
  - self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))) })
- Регистрация в layout:
  - useEffect(() => { if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js') }, [])

2.2 Cache-Control заголовки
- Файл: next.config.ts (уже частично настроен)
- Дополнить:
  - async headers() { return [{ source: '/static/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }, { source: '/(assets|images|icons)/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }] }

Acceptance для блока:
- Повторная загрузка страницы происходит мгновенно (кэш срабатывает)
- Network вкладка показывает 304/from cache для статики

---

3) Rate Limiting для API

3.1 Установка зависимостей
- npm i @upstash/ratelimit @upstash/redis
- Env: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (или локально можно мокнуть Redis клиент)

3.2 Библиотека rate-limiter
- Файл: src/middleware/rate-limiter.ts
- Псевдокод:
  - import { Ratelimit } from '@upstash/ratelimit'; import { Redis } from '@upstash/redis'
  - const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(10, '10 s'), analytics: true })
  - export async function checkRateLimit(identifier:string) { const { success, limit, reset, remaining } = await ratelimit.limit(identifier); return { success, limit, reset, remaining } }
  - export const rateLimiters = { auth: ...(5 req/1 m), tracks: ...(30 req/1 m), upload: ...(3 req/1 m), nft: ...(10 req/1 m) }

3.3 Middleware интеграция
- Файл: src/middleware.ts
- Изменения (дополнить существующий код):
  - import { rateLimiters } from './middleware/rate-limiter'
  - Определить endpoint: const endpoint = url.pathname.split('/')[2] // auth/tracks/upload/nft
  - Выбрать лимитер: let limiter = rateLimiters.tracks; if(...includes('auth')) limiter=rateLimiters.auth; ...
  - const { success, limit, remaining, reset } = await limiter.limit(`${endpoint}_${ip}`)
  - if (!success) return new Response('Rate limit exceeded', { status: 429, headers: { 'X-RateLimit-Limit': limit, ... } })

3.4 Тесты
- Unit: mock Redis, проверить что limiter.limit() возвращает success:false при превышении
- Integration: вызов API N раз → проверка 429 на (N+1)-м запросе

Acceptance для блока:
- 10+ запросов/10s к /api/tracks → 429 на 11-м
- Заголовки X-RateLimit-* присутствуют

---

4) CORS защита

4.1 Определить allowedOrigins
- Список:
  - process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  - https://normaldance.com, https://www.normaldance.com
  - https://*.vercel.app (паттерн для preview URL)
  - https://t.me, https://web.telegram.org

4.2 Middleware CORS
- Файл: src/middleware.ts (дополнить)
- Псевдокод:
  - const origin = request.headers.get('origin')
  - const isAllowed = origin && allowedOrigins.some(a => a.startsWith('https://*.')? origin.includes(a.substring(11)) : origin === a)
  - const response = NextResponse.next()
  - if(origin && isAllowed) response.headers.set('Access-Control-Allow-Origin', origin); else response.headers.set('Access-Control-Allow-Origin', origin || '')
  - response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  - response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
  - response.headers.set('Access-Control-Allow-Credentials', 'true')
  - if(request.method === 'OPTIONS') return new Response(null, { status: 200, headers: response.headers })

4.3 Тесты
- Integration: запрос с origin=https://evil.com → проверить отсутствие CORS заголовка или запрет
- OPTIONS preflight → проверка 200 OK с нужными заголовками

Acceptance для блока:
- CORS разрешает только listed origins
- OPTIONS запросы обрабатываются корректно

---

5) Progressive Image Loading

5.1 Компонент ProgressiveImage
- Файл: src/components/ui/progressive-image.tsx
- Псевдокод:
  - interface ProgressiveImageProps extends Omit<ImageProps, 'src'> { src: string; placeholder?: string; quality?: number }
  - useState для [currentSrc, loading, error]
  - useEffect: const img = new Image(); img.src = src; img.onload = () => { setCurrentSrc(src); setLoading(false) }; img.onerror = () => setError(true)
  - return <div><Image src={currentSrc} className={loading ? 'blur-sm' : ''} placeholder="blur" blurDataURL={placeholder} />{loading && <Skeleton />}</div>

5.2 Интеграция в существующие компоненты
- Найти все <Image> (Next.js Image component) в компонентах
- Заменить на <ProgressiveImage src={...} placeholder={lowQualityPlaceholder} />
- Для placeholder:
  - Генерировать LQIP (low-quality image placeholder) либо использовать встроенный base64/blur

5.3 Lazy loading
- Убедиться, что Next.js Image использует loading="lazy" для изображений ниже fold
- В ProgressiveImage: добавить проп loading="lazy"

Acceptance для блока:
- Изображения показывают blur/skeleton до полной загрузки
- Lighthouse Accessibility/Best Practices 90+

---

6) Финальная оптимизация next.config.ts

6.1 Обновить next.config.ts
- Добавить/проверить:
  - images: { domains: ['ipfs.io', 'gateway.pinata.cloud', 'cloudflare-ipfs.com'], formats: ['image/avif', 'image/webp'] }
  - experimental: { optimizeCss: true, optimizePackageImports: ['@solana/web3.js', '@solana/wallet-adapter-react'] }
  - webpack: (config, { isServer }) => { if (!isServer) config.resolve.fallback = { fs: false }; return config }

6.2 Security headers (уже частично в vercel.json/next.config)
- Проверить наличие:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Content-Security-Policy (если нужен строгий — обновить)

Acceptance для блока:
- Lighthouse Performance 90+, Best Practices 90+, SEO 90+
- Security headers присутствуют в Network tab

---

7) Документация
- Обновить README_2025_PLAN.md:
  - Quickstart для rate limiting (env UPSTASH_*)
  - Quickstart для CORS/allowedOrigins
  - Quickstart для progressive images
- Обновить .env.example:
  - UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

---

8) Контроль качества
- Локально:
  - npm run lint && npm run type-check && npm test && npm run build
  - Lighthouse audit (npm i -g lighthouse; lighthouse http://localhost:3000 --view)
  - Проверить rate limiting (curl в цикле)
  - Проверить CORS (curl -H "Origin: https://evil.com" http://localhost:3000/api/tracks)

Acceptance:
- Lighthouse Performance 90+
- Rate limiting работает, 429 при превышении
- CORS блокирует неразрешённые origins
- Progressive images загружаются с placeholder

---

9) Риски/Откат
- Риски:
  - Rate limiting может блокировать легитимный трафик при неправильных лимитах
  - CORS может заблокировать нужные origins (Telegram preview, Vercel)
  - Service Worker может кэшировать старые версии
- Откат:
  - Rate limiting — увеличить лимиты или временно отключить (убрать middleware)
  - CORS — расширить allowedOrigins или убрать проверку origin
  - Service Worker — очистить кэш, отключить регистрацию
  - Progressive images — fallback на обычный <Image>
