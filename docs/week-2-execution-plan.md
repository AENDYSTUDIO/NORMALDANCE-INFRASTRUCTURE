## Week 2 — Core Integrations: детальный план исполнения

Цели недели:
- Интегрировать Solana Pay (lib + UI + webhook)
- Завершить Telegram Mini App UI и связки с бэкендом
- Завершить миграцию IPFS → Helia в API-роутах (upload/monitor/track)

Acceptance (в конце недели):
- Оплаты через Solana Pay генерируются и валидируются в webhook (dev)
- Telegram Mini App UI доступен, Stars/линки/инициализация работают
- Все IPFS API-роуты используют Helia через фиче-флаг, тесты зелёные
- CI зелёный: lint, types, tests, build

---

1) Solana Pay интеграция (lib + UI + webhook)

1.1 Библиотека платежей
- Файл: `src/lib/solana-pay.ts`
- Зависимости:
  - @solana/pay, @solana/web3.js, bignumber.js
- Интерфейсы/логика:
  - class SolanaPayService { constructor(connection=Connection(RPC_URL)); generatePaymentQR(config); validatePayment(signature,...); createPaymentRequest({...}) }
- Псевдокод:
  - encodeURL({ recipient, amount, label, message, memo, splToken? })
  - createQR(encodedURL, size, bg) → вернуть url/QR
  - validate: confirmTransaction(signature) → validateTransfer(connection, signature, { recipient, amount, reference })
- Env:
  - NEXT_PUBLIC_SOLANA_RPC_URL
  - NEXT_PUBLIC_PLATFORM_WALLET

1.2 UI-компонент
- Файл: `src/components/payment/solana-pay-button.tsx`
- Пропсы: amount:number, recipient?:string, label?:string, message?:string, memo?:string, onSuccess?, onError?
- Логика: генерирует URL/QR, диалог с QR, кнопка "I've Paid" → вызов onSuccess()
- Дефолты: recipient из NEXT_PUBLIC_PLATFORM_WALLET

1.3 Webhook подтверждения оплаты
- Файл: `src/app/api/solana/webhook/route.ts`
- POST: { signature, recipient, amount } → validatePayment → при успехе: обновить статус (TODO: заглушка) → 200 JSON
- Ответы: success:true/false + message

1.4 Встраивание в страницы/флоу
- Кнопку SolanaPayButton добавить в нужные экраны (покупка трека, донат, мемориалы) — MVP: вставить на тестовую страницу/секцию.
- Пример:
  - Landing/Checkout: импорт компонента и вывод с суммой
  - Telegram Mini App (см. раздел 2): показать кнопку, если не Stars

1.5 Тесты
- Unit: мокнуть web3/validateTransfer
- API: POST webhook → валид/невалид, проверка статусов ответов

Acceptance для блока:
- `createPaymentRequest` возвращает URL/QR, UI-диалог показывает QR
- POST webhook корректно валидирует успешный/ошибочный кейс
- Базовые unit/integration тесты зелёные

---

2) Telegram Mini App UI

2.1 Страница и layout
- Файлы: `src/app/telegram-app/page.tsx`, `src/app/telegram-app/layout.tsx`
- Инициализация: window.Telegram.WebApp.ready(); expand(); initDataUnsafe.user; setHeaderColor
- UI: приветствие, кнопки: открыть DEX/analytics, Stars purchase, Solana Pay кнопка как альтернатива
- Подключить SDK в layout: <script src="https://telegram.org/js/telegram-web-app.js"></script>

2.2 Сервис/клиентская интеграция
- Использовать `src/lib/telegram-partnership.ts` (инициализация, purchaseWithStars, haptic, validate)
- Связать с webhook `src/app/api/telegram/webhook/route.ts` (команды /start, /dex и ссылки web_app)

2.3 CORS/безопасность
- Убедиться, что middleware CORS разрешает домены Telegram:
  - https://t.me, https://web.telegram.org
- CSP (vercel.json) разрешает telegram js: script-src https://telegram.org

2.4 Тестирование
- Desktop и mobile Telegram: /start, кнопки, открытие web_app страниц
- Stars flow (заглушка/песочница), fallback на Solana Pay (QR)

Acceptance для блока:
- Telegram Mini App открывается, отображает имя пользователя, работает expand/haptic
- Кнопки навигации открывают /dex, /analytics
- Stars purchase инициируется (dev-заглушка), Solana Pay доступен как опция

---

3) Завершение IPFS → Helia в API-роутах

3.1 Главная абстракция IPFS
- Файл: `src/lib/ipfs.ts`
- Использовать фиче-флаг: IPFS_BACKEND=helia|legacy
- В зависимости от флага проксировать в Helia adapter либо legacy-клиент
- Сохранить API: uploadToIPFS, uploadToIPFSWithProgress, getFileFromIPFS, getMetadataFromIPFS, pinFile, unpinFile, checkFileAvailability

3.2 Helia adapter
- Файл: `src/lib/ipfs-helia-adapter.ts`
- Singleton: createHelia(), unixfs(helia)
- addBytes(Uint8Array), cat(cid) итерация чанков, pin через fs/ipfs pin API либо no-op (по стратегии)
- Поддержать chunked upload (манифест с массивом chunk CIDs)

3.3 Обновить API-роуты
- `src/app/api/ipfs/upload/route.ts`: заменить вызовы на методы из `src/lib/ipfs.ts` (они внутри выберут Helia)
- `src/app/api/ipfs/monitor/route.ts`: использовать checkFileAvailabilityOnMultipleGateways/monitorFileHealth, убедиться что внутри опираются на unified IPFS API
- `src/app/api/tracks/route.ts`: все места, где формируется CID/получение, заменить на unified API

3.4 Тесты
- `tests/integration/api/ipfs-upload.test.ts`: обновить моки для `@/lib/ipfs`
- Добавить unit-тесты для adapter (минимум 2-3 кейса: upload, cat, checkAvailability)

Acceptance для блока:
- При IPFS_BACKEND=legacy — поведение как прежде
- При IPFS_BACKEND=helia — upload/GET/monitor работают, тесты зелёные

---

4) Документация/Env
- Обновить `.env.example`: IPFS_BACKEND, NEXT_PUBLIC_SOLANA_RPC_URL, NEXT_PUBLIC_PLATFORM_WALLET
- README_2025_PLAN.md: добавить короткий Quickstart для Solana Pay, Telegram Mini App, IPFS_BACKEND переключение

---

5) Контроль качества
- Локально: npm run lint && npm run type-check && npm test && npm run build
- Проверить http://localhost:3000/telegram-app (dev) и вызовы SolanaPayButton (test recipient)
- CI должен пройти все проверки

Риски/Откат:
- Solana Pay: если валидатор/подтверждение нестабильны — временно логировать и подтверждать вручную в dev
- Telegram: CORS/CSP — fallback отключить строгие заголовки на dev
- IPFS: Helia зависимость от окружения — оставить IPFS_BACKEND=legacy как rollback
