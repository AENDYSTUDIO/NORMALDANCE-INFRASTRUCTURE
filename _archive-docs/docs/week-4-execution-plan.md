## Week 4 — Mobile & Analytics: детальный план исполнения

Цели недели:
- Улучшить мобильный UX (responsive, touch targets, жесты)
- Завершить интеграцию Vercel Analytics и метрики
- Настроить Sentry для production мониторинга
- Создать admin dashboard для метрик

Acceptance (в конце недели):
- Мобильная версия 90+ на Lighthouse Mobile
- Touch targets ≥44x44px, жесты работают (swipe, pull-to-refresh)
- Vercel Analytics отслеживает события (page_view, track_purchase, nft_mint, etc.)
- Sentry ловит ошибки в production, отправляет алерты
- Admin dashboard показывает Core Web Vitals и кастомные метрики
- CI зелёный: lint, types, tests, build

---

1) Мобильный UX: responsive и touch targets

1.1 Адаптивная типографика
- Файл: src/app/globals.css
- Изменения:
  - @media (max-width: 768px) { html { font-size: 14px; } .container { @apply px-4; } button, a { min-height: 44px; min-width: 44px; } input, select, textarea { font-size: 16px; /* prevent iOS zoom */ } }
  - Добавить .mobile-nav, .mobile-modal, .mobile-modal-header, .mobile-modal-body для мобильных UI-паттернов

1.2 Мобильное меню и навигация
- Файл: src/components/layout/mobile-nav.tsx (создать)
- Псевдокод:
  - const MobileNav = () => { return <div className="mobile-nav"><Link href="/">Главная</Link><Link href="/dex">DEX</Link><Link href="/analytics">Аналитика</Link><Link href="/profile">Профиль</Link></div> }
- Встроить в layout:
  - {isMobile && <MobileNav />}

1.3 Bottom sheet для действий
- Файл: src/components/ui/bottom-sheet.tsx (создать или использовать vaul)
- Использование:
  - import { Drawer } from 'vaul'
  - Обернуть действия/модалы в Drawer для мобильной версии

1.4 Touch targets
- Проверить все кнопки/ссылки:
  - className="... min-h-[44px] min-w-[44px]"
- Убедиться, что spacing между элементами ≥8px

Acceptance для блока:
- Lighthouse Mobile 90+
- Touch targets ≥44x44px (Chrome DevTools Accessibility)
- Типографика читаема на iPhone SE/малых экранах

---

2) Мобильные жесты (swipe, pull-to-refresh)

2.1 Swipe навигация между треками
- Библиотека: react-swipeable или Framer Motion
- Файл: src/components/player/swipeable-player.tsx (обёртка над audio player)
- Псевдокод:
  - const handlers = useSwipeable({ onSwipedLeft: () => nextTrack(), onSwipedRight: () => prevTrack() })
  - return <div {...handlers}><AudioPlayer /></div>

2.2 Pull-to-refresh (опционально, если нужен обновляемый контент)
- Библиотека: react-pull-to-refresh или custom
- Применить на главной/треках

2.3 Тестирование жестов
- Проверить на реальных устройствах (iOS/Android)
- Fallback для desktop (кнопки вместо свайпов)

Acceptance для блока:
- Swipe работает на мобильных экранах
- Pull-to-refresh обновляет контент (если внедрён)

---

3) Vercel Analytics: события и dashboard

3.1 Инициализация в layout
- Файл: src/app/layout.tsx
- Изменения:
  - import { Analytics } from '@vercel/analytics/react'
  - import { SpeedInsights } from '@vercel/speed-insights/next'
  - <body>{children}<Analytics /><SpeedInsights /></body>

3.2 Кастомные события
- Файл: src/lib/analytics.ts (уже существует, дополнить)
- Псевдокод:
  - import { track } from '@vercel/analytics'
  - export const analyticsEvents = { trackPurchase: (trackId, amount, paymentMethod) => track('track_purchased', { trackId, amount, paymentMethod }), trackNFTMint: ..., trackTelegramInteraction: ..., trackPageView: ..., trackError: ... }
- Внедрить вызовы:
  - После покупки трека: analyticsEvents.trackPurchase(trackId, price, 'solana-pay')
  - После минта NFT: analyticsEvents.trackNFTMint(nftId, collection)
  - В Telegram webhook: analyticsEvents.trackTelegramInteraction(action, userId)

3.3 Включить в Vercel Dashboard
- Войти в Vercel проект → Settings → Analytics → Enable
- Проверить events во вкладке Analytics

Acceptance для блока:
- Vercel Analytics показывает pageviews, custom events (track_purchased, etc.)
- SpeedInsights отображает Core Web Vitals

---

4) Sentry Production мониторинг

4.1 Проверка конфигурации
- Файлы: sentry.config.js, src/lib/sentry-integration.ts (уже существуют)
- Env:
  - NEXT_PUBLIC_SENTRY_DSN (в .env.example уже есть)
  - SENTRY_AUTH_TOKEN (для source maps upload, опционально)
- Убедиться:
  - enabled: process.env.NODE_ENV === 'production'
  - tracesSampleRate: 0.2 (production)
  - beforeSend фильтрует ResizeObserver loop, NetworkError, AbortError

4.2 Error boundary и клиентские ошибки
- Файл: src/app/error.tsx (создать, если нет)
- Псевдокод:
  - 'use client'
  - import * as Sentry from '@sentry/nextjs'
  - export default function Error({ error, reset }) { useEffect(() => { Sentry.captureException(error) }, [error]); return <div>Что-то пошло не так!<Button onClick={reset}>Повторить</Button></div> }

4.3 Source maps upload (опционально)
- Добавить в package.json scripts:
  - "sentry:sourcemaps": "sentry-cli sourcemaps upload --org=... --project=... .next"
- Запускать после build в production CI

4.4 Тестирование алертов
- Создать тестовую ошибку в dev:
  - throw new Error('Test Sentry alert')
- Проверить в Sentry dashboard: Issues → видеть новое событие

Acceptance для блока:
- Sentry ловит ошибки в production
- Source maps загружены (стек-трейсы читаемы)
- Алерты настроены (email/Slack, если configured)

---

5) Core Web Vitals и кастомные метрики

5.1 Web Vitals tracking
- Файл: src/lib/web-vitals.ts (создать)
- Псевдокод:
  - import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
  - const sendToAnalytics = ({ name, value, id }) => { fetch('/api/analytics/vitals', { method: 'POST', body: JSON.stringify({ name, value, id }) }) }
  - export const reportWebVitals = () => { getCLS(sendToAnalytics); getFID(sendToAnalytics); getFCP(sendToAnalytics); getLCP(sendToAnalytics); getTTFB(sendToAnalytics) }
- Вызвать в layout:
  - useEffect(() => { reportWebVitals() }, [])

5.2 API endpoint для метрик
- Файл: src/app/api/analytics/vitals/route.ts (создать)
- POST: { name, value, id } → сохранить в DB/логи → 200 { success: true }
- GET: вернуть агрегированные метрики (среднее LCP, FID, CLS за последние 24ч)

5.3 Кастомные метрики
- Добавить в web-vitals.ts:
  - trackCustomMetric('audio_load_time', duration)
  - trackCustomMetric('wallet_connect_time', duration)
  - trackCustomMetric('nft_mint_time', duration)
- Вызывать в соответствующих местах

5.4 Admin dashboard
- Файл: src/app/admin/metrics/page.tsx (создать)
- UI:
  - import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
  - Показать график/таблицу: LCP, FID, CLS, TTFB, FCP
  - Показать кастомные метрики: audio_load_time, wallet_connect_time
- Данные:
  - Запрос GET /api/analytics/vitals → отобразить

Acceptance для блока:
- Core Web Vitals отслеживаются и сохраняются
- Admin dashboard показывает метрики (среднее, p95)
- Кастомные метрики записываются

---

6) Документация и env

- Обновить README_2025_PLAN.md:
  - Week 4 features: mobile UX, analytics, Sentry
  - Quickstart: npm run dev, открыть /admin/metrics
- Обновить .env.example:
  - NEXT_PUBLIC_SENTRY_DSN
  - SENTRY_AUTH_TOKEN (опционально)
  - UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (если не добавлено в Week 3)

---

7) Контроль качества

- Локально:
  - npm run lint && npm run type-check && npm test && npm run build
  - Lighthouse audit мобильной версии (DevTools Mobile emulation)
  - Проверить /admin/metrics — dashboard показывает данные
  - Проверить Sentry dashboard — событие test error появилось
- CI:
  - Все шаги зелёные

Acceptance:
- Lighthouse Mobile Performance 90+, Accessibility 90+
- Vercel Analytics показывает события
- Sentry отслеживает ошибки
- Admin dashboard функционален
- Мобильная навигация работает

---

8) Риски/Откат

- Риски:
  - Web Vitals tracking может нагружать клиент при частых отправках
  - Sentry может сгенерировать много шума в production
  - Мобильные жесты могут конфликтовать с нативной навигацией браузера
- Откат:
  - Web Vitals — debounce/throttle отправки метрик
  - Sentry — поднять sampleRate/отключить некритичные интеграции
  - Жесты — убрать swipe handlers, оставить кнопки
  - Admin dashboard — скрыть за auth, если нужно
