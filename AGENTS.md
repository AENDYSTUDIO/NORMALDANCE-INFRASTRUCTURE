# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Build/Test Commands (Non-Obvious)

- **Single test execution**: `npm test -- --testPathPattern="filename.test.ts"` (Jest configured for specific file testing)
- **Mobile app tests**: `cd mobile-app && npm test` (Separate test environment with extensive mocking)
- **Development server**: `npm run dev` (Uses nodemon + tsx, not standard Next.js dev server)
- **Production build**: `npm run build` (Next.js build disabled, uses tsx directly)
- **MCP server**: `npm run mcp:dev` (Uses tsx watch for hot reload)

## Critical Architecture Patterns

- **Custom server setup**: Uses `server.ts` with Socket.IO integration, not standard Next.js server
- **Socket.IO path**: Custom `/api/socketio` path, not standard `/socket.io`
- **Wallet integration**: Phantom wallet only, custom event emitter system in `src/components/wallet/wallet-adapter.tsx`
- **Deflationary model**: 2% burn on all transactions, implemented in `src/lib/deflationary-model.ts`
- **Database**: Prisma with SQLite, global instance pattern in `src/lib/db.ts`
- **Middleware**: Role-based access control with NextAuth, artist/curator/admin paths protected

## Code Style (Project-Specific)

- **ESLint disabled**: All linting rules turned off in `eslint.config.mjs` (intentional)
- **TypeScript**: `noImplicitAny: false`, `no-non-null-assertion: off` (relaxed for Web3)
- **Import patterns**: Wallet utilities use custom event system, not standard React patterns
- **Error handling**: Silent failures in wallet operations, return 0 instead of throwing

## Testing Setup

- **Dual test environments**: Separate Jest configs for main app (`jest.config.js`) and mobile app (`mobile-app/jest.setup.js`)
- **Extensive mocking**: Mobile app mocks all React Native modules, expo libraries, and WebSocket
- **Test timeout**: 30 seconds for async operations (longer than standard)
- **Coverage**: Excludes `__tests__` directories from coverage reports

## Web3 Specific

- **Solana programs**: Custom Anchor programs in `programs/` with fixed program IDs
- **Transaction handling**: Custom transaction creation in `src/components/wallet/wallet-adapter.tsx`
- **Token formatting**: Russian locale formatting for SOL amounts, custom decimal handling
- **Wallet state**: Custom context system, not standard wallet-adapter-react patterns

## Mobile App

- **Expo setup**: Custom service layer in `mobile-app/src/services/mobileService.ts`
- **Audio handling**: Extensive mocking of expo-av for testing
- **Wallet integration**: Separate from main app, custom mobile wallet service

## File Storage & CDN

- **IPFS/Filecoin redundancy**: Custom system in `src/lib/ipfs-enhanced.ts` with multiple gateway replication
- **CDN integration**: Automatic fallback to multiple gateways (ipfs.io, pinata.cloud, cloudflare-ipfs.com)
- **File chunking**: Large files automatically chunked for IPFS upload
- **Health monitoring**: Automated file availability checking across multiple gateways

## Инвесторская страница

- **Роут**: `/invest`
- **Файл**: `src/app/invest/page.tsx`
- **Обновляется вручную** при смене метрик или условий сделки.

## TON Foundation Grant

- **Роут**: `/ton-grant`
- **Файл**: `src/app/ton-grant/page.tsx`
- **Цель**: Получение гранта $50,000 + аудит + трафик от TON Foundation
- **Статус**: Готов к подаче заявки

## Telegram Partnership

- **Роут**: `/telegram-partnership`
- **Файл**: `src/app/telegram-partnership/page.tsx`
- **Цель**: Verified Mini-App + Stars revenue share + App Directory
- **Статус**: Готов к подаче заявки

## Risk Management

- **Роут**: `/risk-management`
- **Файл**: `src/app/risk-management/page.tsx`
- **Цель**: 4-ступенчатая модель страховки, анти-хрупкая архитектура
- **Статус**: Активная стратегия минимизации рисков

## AI Агенты

- **Структура файлов**:
  - `.roo/` - конфигурации и правила для архитектурных агентов
  - `.kilocode/` - настройки режимов для kilocode агента
  - `.roo/rules-code/` - правила кодирования
  - `.roo/rules-architect/` - архитектурные правила
  - `.roo/rules-ask/` - правила вопросов
  - `.roo/rules-debug/` - правила отладки
- **Файлы конфигурации**:
  - `.vscode/ai-agents.json` - основная конфигурация агентов
  - `.vscode/agent-prompts.json` - системные промпты и примеры
  - `.roo/roo-code-settings.json` - настройки Roo code
  - `.kilocode/agent-config.json` - настройки kilocode
- **Использование**:
  - `@roocode:` или `@roo:` для основного агента
  - `@kilocode:` или `@kilo:` для ассистента кода
