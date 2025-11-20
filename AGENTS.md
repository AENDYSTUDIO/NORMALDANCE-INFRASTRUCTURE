# AGENTS.md

Критическая проект-специфичная информация для агентов.

## Build/Test Commands (Неочевидные)

- **Одиночный тест**: `npm test -- --testPathPattern="filename.test.ts"` (Jest для конкретных файлов)
- **Мобильные тесты**: `cd mobile-app && npm test` (Отдельная среда с моками)
- **Dev сервер**: `npm run dev` (nodemon + tsx, не стандартный Next.js)
- **Production сборка**: `npm run build` (Next.js отключен, используется tsx)
- **MCP сервер**: `npm run mcp:dev` (tsx watch с hot reload)

## Критическая архитектура

- **Кастомный сервер**: `server.ts` с Socket.IO по пути `/api/socketio` (не `/socket.io`)
- **Invisible Wallet**: Биометрическая аутентификация в `src/components/wallet/wallet-adapter.tsx`
- **Deflationary модель**: 2% burn всех транзакций в `src/lib/deflationary-model.ts`
- **База данных**: Глобальный Prisma инстанс в `src/lib/db.ts` (никогда не создавать новые)
- **IPFS архитектура**: Мульти-шлюзовая репликация в `src/lib/ipfs-enhanced.ts`

## Web3 особенности

- **ESLint отключен**: Все правила выключены в `eslint.config.mjs` (для Web3)
- **TypeScript расслаблен**: `noImplicitAny: false`, `no-non-null-assertion: off`
- **Фиксированные program IDs**: NDT_PROGRAM_ID, TRACKNFT_PROGRAM_ID, STAKING_PROGRAM_ID
- **Русская локаль**: Форматирование SOL сумм в `formatSol()`
- **Silent failures**: Кошелек возвращает 0 вместо ошибок

## Мобильное приложение

- **Expo с моками**: `mobile-app/jest.setup.js` мокает все React Native модули
- **Отдельная среда**: Изолированная от основного приложения
- **Таймаут тестов**: 30 секунд для асинхронных операций

## MCP интеграции

- **AI сервер**: `src/mcp/server.ts` для интеграций с AI агентами
- **Hot reload**: `tsx watch` для разработки MCP

## Критические пути

- **Инвесторы**: `/invest` → `src/app/invest/page.tsx`
- **TON Grant**: `/ton-grant` → `src/app/ton-grant/page.tsx` ($50,000)
- **Telegram**: `/telegram-partnership` → `src/app/telegram-partnership/page.tsx`
- **Risk Management**: `/risk-management` → `src/app/risk-management/page.tsx`

## AI Агенты

- **Структура**: `.roo/` (архитектура), `.kilocode/` (ассистент кода)
- **Использование**: `@roocode:` или `@roo:` (основной), `@kilocode:` или `@kilo:` (ассистент)
- **Конфигурация**: `.vscode/ai-agents.json`, `.vscode/agent-prompts.json`
