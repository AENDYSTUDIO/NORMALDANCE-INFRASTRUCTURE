# Code Mode Rules (Только критическое)

## Сервер и архитектура

- **Сервер**: Используй `server.ts` с Socket.IO по пути `/api/socketio`
- **База данных**: ТОЛЬКО глобальный Prisma инстанс из `src/lib/db.ts`
- **Deflationary модель**: ВСЕ транзакции через `DeflationaryModel` (2% burn)

## Web3 особенности

- **TypeScript**: `noImplicitAny: false`, `no-non-null-assertion: off` (не исправлять)
- **ESLint**: Полностью отключен в `eslint.config.mjs` (не включать)
- **Program IDs**: Фиксированные NDT_PROGRAM_ID, TRACKNFT_PROGRAM_ID, STAKING_PROGRAM_ID
- **Кошелек**: Silent failures - возвращает 0 вместо ошибок
- **Локаль**: Русское форматирование SOL в `formatSol()`

## Сборка и тестирование

- **Dev**: `npm run dev` (nodemon + tsx, не Next.js)
- **Build**: `npm run build` (tsx напрямую, Next.js отключен)
- **Тесты**: `npm test -- --testPathPattern="filename.test.ts"`
- **Mobile**: `cd mobile-app && npm test` (отдельная среда)

## Файловая система

- **IPFS**: Используй `src/lib/ipfs-enhanced.ts` (мульти-шлюзовая репликация)
- **Загрузки**: Файлы >10MB автоматически чанятся
- **MCP**: `npm run mcp:dev` для разработки AI интеграций

## Запреты

- НЕ создавать новые инстансы Prisma
- НЕ менять program IDs
- НЕ включать ESLint
- НЕ использовать стандартные wallet-adapter-react паттерны
