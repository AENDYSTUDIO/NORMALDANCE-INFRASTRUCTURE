## Week 1 — Security & Infrastructure: пошаговый план внедрения

1) Безопасное обновление зависимостей и аудит
- Команды (локально):
  - npm ci
  - npm audit --omit=dev
  - npm audit fix (только если нет MAJOR апдейтов; иначе — ручной апдейт)
  - npm outdated (зафиксировать кандидатов на апдейт)
- Технические действия:
  - Зафиксировать список уязвимостей и пакетов для апдейта (security-report.md в корень)
  - Принять решение по критическим пакетам (ручной апдейт с тестами)
  - Синхронизировать package.json и lock
- Acceptance:
  - 0 critical, 0 high (или обоснованные исключения с задачами)
  - npm run build, npm test проходят локально

2) Базовая проверка окружения и .env.example
- Файлы:
  - .env.example (существует) — дополнить недостающие ключи
- Обновить/проверить переменные:
  - DATABASE_URL
  - NEXT_PUBLIC_SOLANA_RPC_URL
  - NEXT_PUBLIC_PLATFORM_WALLET
  - PINATA_API_KEY, PINATA_SECRET_API_KEY, PINATA_JWT (если используется JWT)
  - NEXT_PUBLIC_IPFS_GATEWAY
  - TELEGRAM_BOT_TOKEN, TELEGRAM_WEB_APP_URL
  - NEXT_PUBLIC_VERCEL_ANALYTICS_ID
  - NEXT_PUBLIC_SENTRY_DSN
  - JWT_SECRET, NEXTAUTH_SECRET
- Проверить .gitignore включает .env*, оставить только .env.example в VCS
- Acceptance:
  - Локально подставляется .env (не в репозитории)
  - Приложение поднимается (npm run dev) с валидными демо-значениями

3) Husky pre-commit и унификация secret-scans
- Текущее состояние:
  - .husky/ отсутствует
  - Есть custom hooks: scripts/hooks/pre-commit и .github/hooks/pre-commit (секрет-скан)
- Изменения:
  - npm i -D husky
  - npx husky install
  - Добавить .husky/pre-commit со связкой проверок:
    - npm run lint
    - npm run type-check (если нет — добавить скрипт в package.json: "type-check": "tsc --noEmit")
    - npm test (или npm run test:coverage в CI)
    - bash scripts/hooks/pre-commit (секрет-скан) — вызывать из pre-commit
- Пример .husky/pre-commit (псевдокод):
  - #!/bin/sh
  - npm run lint && npm run type-check && npm test || exit 1
  - bash scripts/hooks/pre-commit || exit 1
- Acceptance:
  - При коммите падает на lint/tests/secret-scan при проблемах

4) CI: привести к единому стандарту проверок
- Текущее состояние: .github/workflows/ci.yml присутствует (много задач)
- Изменения (минимальные, если нужно):
  - Гарантировать матрицу Node 18.x/20.x
  - Кэш npm (actions/setup-node cache: 'npm')
  - Джобы (порядок): install → lint → type-check → test → build
  - Отчёты: coverage upload (если используете codecov) — опционально
- Acceptance:
  - PR триггерит CI, все шаги зелёные

5) Подготовка миграции IPFS → Helia (адаптер, без массовых рефакторов)
- Текущее состояние: src/lib/ipfs.ts использует ipfs-http-client (legacy), в package.json уже есть helia/@helia/unixfs
- Цель Week 1: ввести адаптер и фичефлаг, не ломая существующий код
- Изменения:
  - Создать src/lib/ipfs-helia-adapter.ts (или заменить логику внутри ipfs.ts, сохранив сигнатуры)
  - Сохранить API-функции:
    - uploadToIPFS(fileOrBuffer, metadata?) → { cid: string, size: number }
    - uploadToIPFSWithProgress(file, metadata, onProgress?)
    - getFileFromIPFS(cid): Promise<Buffer>
    - getMetadataFromIPFS(cid): Promise<any>
    - pinFile(cid), unpinFile(cid)
    - checkFileAvailability(cid)
  - Внутри — внедрить Helia:
    - createHelia() singleton
    - const fs = unixfs(helia)
    - fs.addBytes(Uint8Array) для загрузки
    - cat() поток для чтения
  - Фичефлаг в .env: IPFS_BACKEND=helia|legacy
    - В ipfs.ts: if (process.env.IPFS_BACKEND === 'helia') использовать Helia-реализацию, иначе — legacy ipfs-http-client
- Псевдокод нового Helia-вкладыша:
  - import { createHelia } from 'helia'
  - import { unixfs } from '@helia/unixfs'
  - let helia, fs; async function getHelia(){ if(!helia){ helia=await createHelia(); fs=unixfs(helia) } return { helia, fs } }
  - async function uploadToIPFS(file){ const { fs } = await getHelia(); const bytes = toUint8Array(file); const cid = await fs.addBytes(bytes); return { cid: cid.toString(), size: bytes.length } }
- Acceptance:
  - IPFS_BACKEND=legacy — без изменений, всё работает как раньше
  - IPFS_BACKEND=helia — проходит базовые кейсы (upload/read) в dev

6) Минимальные тесты для IPFS-адаптера
- Добавить unit-тесты (mock Helia):
  - uploadToIPFS(file: Buffer) возвращает cid и size > 0
  - getFileFromIPFS(cid) собирает Buffer из чанков
  - checkFileAvailability проверяет хотя бы один шлюз
- Acceptance:
  - npm test проходит локально и в CI, покрытие по новым функциям ≥ 70%

7) Политика секретов и верификация токенов
- Скрипты уже есть (scripts/hooks/pre-commit). План на Week 1:
  - Убедиться, что секрет-скан запускается в pre-commit (Husky)
  - В CI добавить шаг secret-scan (опционально): trufflehog/git-secrets или существующие скрипты
- Acceptance:
  - Коммит с секретами не проходит локально

8) Документация
- Обновить README_2025_PLAN.md раздел Quickstart (кратко):
  - npm ci → npm run dev → .env.example → IPFS_BACKEND переключение
  - Husky/CI поведение
- Добавить docs/security-report-template.md (шаблон для фиксации уязвимостей и апдейтов)
- Acceptance:
  - Новые участники команды поднимают проект за ≤15 минут

9) Контрольные проверки качества
- Запустить локально: npm run lint, npm run type-check, npm test, npm run build
- Убедиться, что dev-сервер на 3000 работает и ключевые страницы открываются
- Acceptance:
  - Успешная сборка и запуск, без регрессий

10) Риски и откат
- Риски:
  - Breaking changes при npm audit fix
  - Helia может требовать Node/драйверные особенности в некоторых окружениях
- Откат:
  - Для зависимостей — вернуть lockfile из ветки до апдейтов
  - Для IPFS — IPFS_BACKEND=legacy
