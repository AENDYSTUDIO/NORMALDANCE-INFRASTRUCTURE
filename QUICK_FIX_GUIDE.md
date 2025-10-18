# 🚀 Быстрое исправление ошибок NORMALDANCE 0.1.1

## 🎯 Приоритетные исправления

### 1. Немедленные действия (5 минут)

```bash
# Обновить ESLint конфигурацию
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Запустить автоисправление
npm run lint -- --fix

# Исправить основные ошибки
node scripts/fix-lint-errors.js
```

### 2. Исправление критических файлов

#### A. Исправить next.config.ts
```typescript
// Заменить require на import
import bundleAnalyzer from "@next/bundle-analyzer";
```

#### B. Исправить tsconfig.json
```json
{
  "compilerOptions": {
    "noImplicitAny": true,  // изменить с false
    "allowObjectTypes": true  // добавить
  }
}
```

#### C. Создать .eslintrc.json (уже создан)

### 3. Исправление типов (10 минут)

```typescript
// Заменить {} на:
Record<string, unknown>

// Заменить Function на:
(...args: unknown[]) => unknown

// Заменить any на:
unknown (где возможно)
```

### 4. Исправление импортов в скриптах

```bash
# Конвертировать все .js файлы в scripts/ в ES modules
# Или добавить в package.json:
{
  "type": "module"
}
```

## 🔧 Автоматические исправления

### Запустить скрипт исправлений:
```bash
node scripts/fix-lint-errors.js
```

### Проверить результат:
```bash
npm run lint
npm run type-check
npm run build
```

## 📋 Пошаговый план исправления

### Этап 1: Конфигурация (2 мин)
- [x] Обновить .eslintrc.json
- [ ] Обновить tsconfig.json
- [ ] Добавить "type": "module" в package.json

### Этап 2: Критические файлы (5 мин)
- [x] Исправить src/app/layout.tsx
- [x] Исправить src/lib/utils.ts
- [x] Исправить next.config.ts
- [x] Исправить mobile-app ProfileScreen

### Этап 3: Массовые исправления (10 мин)
- [ ] Запустить автоскрипт
- [ ] Проверить результаты
- [ ] Исправить оставшиеся ошибки вручную

### Этап 4: Проверка (3 мин)
- [ ] npm run lint
- [ ] npm run type-check
- [ ] npm run build
- [ ] npm test

## 🚨 Критические проблемы

### 1. Синтаксические ошибки
- [x] mobile-app/src/screens/ProfileScreen.tsx:622 (исправлено)
- [ ] src/components/icons/index.ts:33196 (требует проверки)
- [ ] tests/integration/api/ipfs-upload.test.ts:754

### 2. Проблемы с типами
- [ ] Все файлы .next/types/ (автогенерируемые)
- [ ] Использование {} типов
- [ ] Использование Function типов

### 3. Проблемы с импортами
- [ ] Все .js файлы в scripts/
- [ ] Все тестовые файлы
- [ ] Конфигурационные файлы

## 💡 Рекомендации по архитектуре

### 1. Разделение на модули
```
src/
├── components/     # UI компоненты
├── lib/           # Утилиты и сервисы
├── hooks/         # React хуки
├── types/         # TypeScript типы
├── constants/     # Константы
└── utils/         # Вспомогательные функции
```

### 2. Типизация
```typescript
// Создать глобальные типы
// types/global.d.ts
export interface User {
  id: string;
  name: string;
  wallet?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
}
```

### 3. Конфигурация среды
```typescript
// lib/config.ts
export const config = {
  solana: {
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
    programId: process.env.NEXT_PUBLIC_NDT_PROGRAM_ID!,
  },
  ipfs: {
    gateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY!,
    apiKey: process.env.PINATA_API_KEY!,
  }
} as const;
```

## 🎯 Следующие шаги

1. **Немедленно**: Исправить синтаксические ошибки
2. **Сегодня**: Обновить конфигурацию линтера
3. **На этой неделе**: Привести типы в порядок
4. **В следующем спринте**: Рефакторинг архитектуры

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `npm run lint 2>&1 | tee lint-errors.log`
2. Изучите документацию: [Next.js ESLint](https://nextjs.org/docs/basic-features/eslint)
3. Создайте issue с подробным описанием

---

**Время на исправление**: ~20 минут  
**Приоритет**: 🔴 Критический  
**Статус**: В процессе