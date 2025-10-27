# Модуль безопасности NORMALDANCE

## Обзор

Модуль безопасности предоставляет унифицированный интерфейс для всех операций безопасности в приложении NORMALDANCE. Он включает в себя санитизацию, защиту от XSS/CSRF, валидацию, управление сессиями и другие функции безопасности.

## Структура экспорта

Все функции безопасности должны импортироваться из `@/lib/security`:

```typescript
import { 
  sanitize, 
  xssCsrf, 
  SecurityManager, 
  BaseValidator 
} from '@/lib/security';
```

## Основные компоненты

### sanitize
Модуль санитизации для очистки пользовательского ввода:
- `escapeHTML` - экранирование HTML
- `stripDangerousHtml` - удаление опасных HTML-конструкций
- `sanitizeURL` - санитизация URL
- `sanitizeFilename` - безопасная обработка имен файлов

### xssCsrf
Модуль защиты от XSS и CSRF атак:
- `xssCsrf` - комплексная защита
- `generateCsrfToken` - генерация CSRF токенов
- `verifyCsrfToken` - проверка CSRF токенов

### SecurityManager
Централизованный менеджер безопасности:
- Управление CSP заголовками
- Регистрация валидаторов
- Аудит безопасности

### BaseValidator
Базовый класс для создания пользовательских валидаторов.

## Миграция с устаревших импортов

### Устаревшие файлы
Следующие файлы устарели и будут удалены в версии v2.0.0:
- `input-sanitizer.ts`
- `input-validator.ts`
- `xss-csrf.ts` (для прямых импортов)

### Шаги миграции

1. Замените импорты:
   ```typescript
   // Вместо:
   import { sanitizeHTML } from '@/lib/security/input-sanitizer';
   
   // Используйте:
   import { sanitize } from '@/lib/security';
   const safeHTML = sanitize.escapeHTML(dirtyHTML);
   ```

2. Замените названия функций:
   - `sanitizeHTML` → `escapeHTML`
   - `stripHTML` → `stripDangerousHtml`
   - `sanitizeURL` → `sanitizeURL` (остается тем же)
   - `sanitizeSQL` → `sanitizeSQL` (остается тем же)

3. Используйте `SecurityManager` для комплексной безопасности:
   ```typescript
   import { SecurityManager } from '@/lib/security';
   
   const security = new SecurityManager();
   const cspHeader = security.generateCspHeader();
   ```

## Тестирование

Все функции безопасности покрыты тестами. Запустите тесты с помощью:

```bash
npm run test:security
```

## CSP (Content Security Policy)

CSP заголовки управляются через `config/csp.ts`. Для получения заголовка используйте:

```typescript
import { getCspHeader } from '@/config/csp';

const cspHeader = getCspHeader({ isDev: process.env.NODE_ENV === 'development' });
```

## Разработка

При добавлении новых функций безопасности:
1. Добавляйте их в соответствующие модули
2. Экспортируйте через `index.ts`
3. Покрывайте тестами
4. Обновляйте эту документацию