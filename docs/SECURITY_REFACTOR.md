# Миграционный гайд: Рефакторинг безопасности NORMALDANCE

## Содержание

1. [Текущая проблематика и результаты инвентаризации](#текущая-проблематика-и-результаты-инвентаризации)
2. [Целевая архитектура и принципы](#целевая-архитектура-и-принципы)
3. [Обновлённый договор интерфейсов](#обновлённый-договор-интерфейсов)
4. [Гайд по миграции](#гайд-по-миграции)
5. [Список депрекейтед-API и их замены](#список-депрекейтед-api-и-их-замены)
6. [Рекомендации по безопасному использованию](#рекомендации-по-безопасному-использованию)
7. [Типовые рецепты интеграции с middleware](#типовые-рецепты-интеграции-с-middleware)
8. [Тестирование и отладка](#тестирование-и-отладка)
9. [Оценка рисков, план отката и критерии готовности](#оценка-рисков-план-отката-и-критерии-готовности)

## Текущая проблематика и результаты инвентаризации

### Проблемы с текущей архитектурой безопасности

1. **Фрагментация модулей**: Безопасность была распределена по нескольким файлам (`input-sanitizer.ts`, `input-validator.ts`, `xss-csrf.ts`), что затрудняло поддержку и создавало дублирование кода.

2. **Отсутствие единого интерфейса**: Разные модули имели разные API, что усложняло интеграцию и создавало несогласованности в подходах к безопасности.

3. **Недостаточная типизация**: Многие функции безопасности не имели строгой типизации, что могло приводить к ошибкам во время выполнения.

4. **Отсутствие централизованного управления**: Невозможно было легко настроить и управлять всеми аспектами безопасности из одного места.

5. **Проблемы с CSRF-защитой**: Старая реализация CSRF не была полностью stateless и не использовала современные подходы к защите.

### Результаты инвентаризации

После анализа текущего состояния модулей безопасности были выявлены следующие компоненты:

- **input-sanitizer.ts**: Содержит легаси-валидаторы (email, wallet, IPFS) и санитайзеры
- **input-validator.ts**: Простой валидатор без внешних зависимостей
- **xss-csrf.ts**: Реализация защиты от XSS и CSRF
- **sanitize.ts**: Унифицированные санитайзеры
- **rate-limiter.ts**: Ограничение частоты запросов
- **telegram-validator.ts**: Валидация данных Telegram Mini App

## Целевая архитектура и принципы

### Архитектурные принципы

1. **Единая точка входа**: Все функции безопасности доступны через `@/lib/security` с централизованным импортом.

2. **Контрактно-ориентированный подход**: Использование интерфейса `ISecurityService` как основы для всех реализаций безопасности.

3. **Контекстно-зависимая санитизация**: Все функции санитизации учитывают контекст использования (HTML, атрибут, URL, SQL).

4. **Идемпотентность**: Все функции безопасности могут быть вызваны несколько раз без изменения результата.

5. **Совместимость с Next.js**: Архитектура работает как на клиенте, так и на сервере.

### Новая архитектура

```
src/lib/security/
├── index.ts           # Единая точка входа
├── ISecurityService.ts # Основной интерфейс
├── SecurityManager.ts  # Централизованный менеджер
├── sanitize.ts        # Унифицированные санитайзеры
├── xss-csrf.ts        # XSS/CSRF реализация
├── BaseValidator.ts   # Базовый класс валидатора
├── rate-limiter.ts    # Ограничение частоты
├── telegram-validator.ts # Валидация Telegram
└── security-utils.ts  # Вспомогательные утилиты
```

### SecurityManager

Центральный компонент, реализующий `ISecurityService` и предоставляющий:

- Единый API для всех операций безопасности
- Управление конфигурацией безопасности
- Регистрацию и выполнение пользовательских валидаторов
- Генерацию и проверку CSRF-токенов
- Формирование заголовков безопасности
- Проверку политик безопасности
- Сводный аудит безопасности

## Обновлённый договор интерфейсов

### ISecurityService

```typescript
export interface ISecurityService {
  // Конфигурация
  getConfig(): SecurityConfig;
  setConfig(config: SecurityConfig): void;

  // Санитизация и экранирование
  sanitizeString(
    input: string,
    ctx: SecurityContext,
    opts: SanitizationOptions
  ): SecurityResult<string>;
  sanitizeObject<T = unknown>(
    value: T,
    ctx: SecurityContext,
    opts?: SanitizationOptions
  ): SecurityResult<T>;
  escapeHTML(input: string): string;
  escapeAttribute(input: string): string;
  sanitizeURL(
    input: string,
    allowedProtocols?: string[]
  ): SecurityResult<string | null>;
  sanitizeFilename(input: string): SecurityResult<string>;
  escapeSql(input: string): string;

  // CSRF (double-submit)
  generateCsrfToken(ctx: SecurityContext): CSRFToken;
  verifyCsrfToken(
    ctx: SecurityContext,
    requestHeaders: Headers
  ): CSRFVerification;

  // Валидаторы
  registerValidator<I = unknown, O = unknown>(
    registration: ValidatorRegistration<I, O>
  ): void;
  validate<I = unknown, O = unknown>(
    name: string,
    input: I,
    options?: ValidationOptions
  ): SecurityResult<O>;

  // Заголовки безопасности
  buildSecurityHeaders(ctx: SecurityContext): HeadersResult;

  // Политики
  checkPolicies(ctx: SecurityContext): PoliciesCheck;

  // Сводный аудит
  audit(input: AuditInput): AuditReport;
}
```

### Ключевые изменения в интерфейсе

1. **Контекстная санитизация**: Все функции санитизации теперь принимают `SecurityContext` и `SanitizationOptions`.

2. **Единая модель ошибок**: Используется `SecurityResult<T>` для всех операций с возможностью получения детализированных ошибок.

3. **Расширяемость**: Возможность регистрации пользовательских валидаторов через `registerValidator`.

4. **Единая точка конфигурации**: Все настройки безопасности объединены в `SecurityConfig`.

## Гайд по миграции

### Примеры старых и новых импортов

#### Старый способ (депрекейтед):

```typescript
// Было:
import {
  sanitizeHTML,
  stripHTML,
  sanitizeSQL,
} from "src/lib/security/input-sanitizer";
import { InputValidator } from "src/lib/security/input-validator";
import { generateCsrfToken, verifyCsrfToken } from "src/lib/security/xss-csrf";
```

#### Новый способ:

```typescript
// Стало:
import {
  escapeHTML,
  stripDangerousHtml,
  sanitizeSQL,
  InputValidator,
  SecurityManager,
  ISecurityService,
} from "@/lib/security";
```

### Пошаговая миграция

#### Шаг 1: Замена импортов

**Было:**

```typescript
import { sanitizeHTML, isValidEmail } from "src/lib/security/input-sanitizer";
import { InputValidator } from "src/lib/security/input-validator";
```

**Стало:**

```typescript
import { escapeHTML, isValidEmail, InputValidator } from "@/lib/security";
```

#### Шаг 2: Обновление вызовов функций

**Было:**

```typescript
const sanitized = sanitizeHTML(userInput);
const isValid = isValidEmail(emailInput);
```

**Стало:**

```typescript
// Основной способ:
const sanitized = escapeHTML(userInput);
const isValid = isValidEmail(emailInput);

// Или через SecurityManager:
const security = new SecurityManager(config);
const result = security.sanitizeString(userInput, ctx, { kind: "html" });
```

#### Шаг 3: Использование SecurityManager

**Было:**

```typescript
// Ручная проверка CSRF
const csrfValid = verifyCsrfToken(token, config);
```

**Стало:**

```typescript
const security = new SecurityManager(config);
const csrfResult = security.verifyCsrfToken(ctx, requestHeaders);
```

#### Шаг 4: Регистрация пользовательских валидаторов

**Стало:**

```typescript
const security = new SecurityManager(config);

// Регистрация валидатора
security.registerValidator({
  name: "email",
  fn: (input: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input)
      ? BaseValidator.ok(input)
      : BaseValidator.err([
          BaseValidator.error(
            SecurityErrorCode.VALIDATION_ERROR,
            "Invalid email format"
          ),
        ]);
  },
});

// Использование валидатора
const result = security.validate("email", "user@example.com");
```

### Переход с легаси-валидаторов

#### InputValidator

**Было:**

```typescript
const validator = new InputValidator();
const result = validator.validateEmail(email);
```

**Стало:**

```typescript
// Прямая валидация:
const isValid = isValidEmail(email);

// Или через SecurityManager:
const security = new SecurityManager(config);
const result = security.validate("email", email);
```

#### CSRF-токены

**Было:**

```typescript
const csrf = await generateCsrfToken(sessionId, config);
```

**Стало:**

```typescript
const security = new SecurityManager(config);
const token = security.generateCsrfToken(ctx);
```

## Список депрекейтед-API и их замены

| Старое API                                   | Новое API                  | Статус     | Заметки                                   |
| -------------------------------------------- | -------------------------- | ---------- | ----------------------------------------- |
| `sanitizeHTML`                               | `escapeHTML`               | Deprecated | Алиас сохранен для совместимости          |
| `stripHTML`                                  | `stripDangerousHtml`       | Deprecated | Алиас сохранен для совместимости          |
| `sanitizeUrl`                                | `sanitizeURL`              | Deprecated | Алиас сохранен для совместимости          |
| `sanitizeSql`                                | `sanitizeSQL`              | Deprecated | Алиас сохранен для совместимости          |
| `stripHtml`                                  | `stripDangerousHtml`       | Deprecated | Алиас сохранен для совместимости          |
| `escapeHtml`                                 | `escapeHTML`               | Deprecated | Алиас сохранен для совместимости          |
| `isValidEmail`, `isValidSolanaAddress` и др. | Сохранены                  | Active     | Легаси-валидаторы                         |
| `InputValidator.sanitizeHTML`                | `escapeHTML`               | Deprecated | Используйте напрямую                      |
| `InputValidator.stripHTML`                   | `stripDangerousHtml`       | Deprecated | Используйте напрямую                      |
| Импорт из `input-sanitizer.ts`               | Импорт из `@/lib/security` | Deprecated | Все функции доступны через главный индекс |
| Импорт из `input-validator.ts`               | Импорт из `@/lib/security` | Deprecated | Все функции доступны через главный индекс |
| `xss-csrf` напрямую                          | `@/lib/security`           | Deprecated | Все функции доступны через главный индекс |

### План депрекации

- **Предупреждения активны**: с 2025-10-26
- **Удаление легаси-реализаций**: v2.0, плановая дата 2026-03-31
- **Рекомендуемый срок миграции**: до 2025-12-31

## Рекомендации по безопасному использованию

### В компонентах

#### Клиентские компоненты

```typescript
"use client";

import { escapeHTML, stripDangerousHtml } from "@/lib/security";

// Правильно: экранирование пользовательского контента перед отображением
const UserProfile = ({ user }) => {
  const safeName = escapeHTML(user.name);
  return <div>{safeName}</div>;
};

// Правильно: использование безопасных URL
const LinkComponent = ({ url }) => {
  const sanitized = sanitizeURL(url, ["http", "https", "ipfs"]);
  return sanitized ? <a href={sanitized}>Link</a> : null;
};
```

#### Серверные компоненты

```typescript
import { SecurityManager } from "@/lib/security";

// Правильно: использование SecurityManager для санитизации на сервере
export async function ServerComponent({ data }) {
  const security = new SecurityManager(config);
  const sanitizedData = security.sanitizeObject(data, ctx, { kind: "html" });
  return <div>{JSON.stringify(sanitizedData)}</div>;
}
```

### В API-обработчиках

```typescript
import { SecurityManager, BaseValidator } from "@/lib/security";

export async function POST(request: Request) {
  const security = new SecurityManager(config);

  // Проверка CSRF
  const csrfResult = security.verifyCsrfToken(ctx, request.headers);
  if (!csrfResult.valid) {
    return Response.json({ error: "CSRF validation failed" }, { status: 403 });
  }

  // Валидация входных данных
  const body = await request.json();
  const sanitized = security.sanitizeObject(body, ctx, { kind: "html" });

  if (!sanitized.ok) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  // Обработка данных...
}
```

### В middleware

```typescript
import { SecurityManager, withRateLimit } from "@/lib/security";

export async function middleware(request: Request) {
  const security = new SecurityManager(config);

  // Проверка политик безопасности
  const policies = security.checkPolicies(ctx);
  if (!policies.ok) {
    return Response.json({ error: "Policy violation" }, { status: 403 });
  }

  // Ограничение частоты запросов
  const rateLimiter = withRateLimit(apiRateLimiter);
  // ... остальная логика middleware
}
```

## Типовые рецепты интеграции с middleware

### CSRF-защита в API-маршрутах

```typescript
import { SecurityManager } from "@/lib/security";

export async function withCsrfProtection(handler: Function) {
  return async (request: Request) => {
    const security = new SecurityManager(config);
    const ctx = {
      runtime: "server",
      requestHeaders: request.headers,
    };

    const csrfResult = security.verifyCsrfToken(ctx, request.headers);
    if (!csrfResult.valid) {
      return Response.json(
        { error: "CSRF token validation failed" },
        { status: 403 }
      );
    }

    return handler(request);
  };
}
```

### Валидация входных данных

```typescript
import { SecurityManager, BaseValidator } from "@/lib/security";

export async function withInputValidation(schemaName: string) {
  return async (handler: Function) => {
    return async (request: Request) => {
      const security = new SecurityManager(config);
      const body = await request.json();

      const result = security.validate(schemaName, body);
      if (!result.ok) {
        return Response.json(
          { error: "Validation failed", details: result.errors },
          { status: 400 }
        );
      }

      return handler(request);
    };
  };
}
```

### Комплексная защита

```typescript
import { SecurityManager, withRateLimit, apiRateLimiter } from "@/lib/security";

export async function withSecurityMiddleware(handler: Function) {
  return async (request: Request) => {
    const security = new SecurityManager(config);
    const ctx = {
      runtime: "server",
      requestHeaders: request.headers,
    };

    // Проверка политик
    const policies = security.checkPolicies(ctx);
    if (!policies.ok) {
      return Response.json({ error: "Policy violation" }, { status: 403 });
    }

    // Ограничение частоты
    const rateLimitResult = apiRateLimiter.check(request);
    if (!rateLimitResult.allowed) {
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // Проверка CSRF для методов, требующих защиты
    if (request.method !== "GET" && request.method !== "HEAD") {
      const csrfResult = security.verifyCsrfToken(ctx, request.headers);
      if (!csrfResult.valid) {
        return Response.json(
          { error: "CSRF validation failed" },
          { status: 403 }
        );
      }
    }

    // Санитизация входных данных
    if (
      request.method === "POST" ||
      request.method === "PUT" ||
      request.method === "PATCH"
    ) {
      const body = await request.json();
      const sanitized = security.sanitizeObject(body, ctx, { kind: "html" });
      if (!sanitized.ok) {
        return Response.json({ error: "Invalid input" }, { status: 400 });
      }
    }

    // Добавление заголовков безопасности
    const headers = security.buildSecurityHeaders(ctx);
    const response = await handler(request);

    if (response instanceof Response) {
      Object.entries(headers.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  };
}
```

## Тестирование и отладка

### Модульное тестирование

```typescript
import { SecurityManager, BaseValidator } from "@/lib/security";

describe("SecurityManager", () => {
  let security: SecurityManager;

  beforeEach(() => {
    security = new SecurityManager(config);
  });

  it("should sanitize HTML correctly", () => {
    const input = '<script>alert("xss")</script>';
    const result = security.sanitizeString(input, ctx, { kind: "html" });

    expect(result.ok).toBe(true);
    expect(result.value).toBe('<script>alert("xss")<&#x2F;script>');
  });

  it("should validate custom validator", () => {
    security.registerValidator({
      name: "positiveNumber",
      fn: (input: number) => {
        return input > 0
          ? BaseValidator.ok(input)
          : BaseValidator.err([
              BaseValidator.error(
                "VALIDATION_ERROR",
                "Number must be positive"
              ),
            ]);
      },
    });

    const result = security.validate("positiveNumber", -5);
    expect(result.ok).toBe(false);
    expect(result.errors[0].message).toBe("Number must be positive");
  });
});
```

### Интеграционное тестирование

```typescript
import { SecurityManager } from "@/lib/security";

describe("Security integration", () => {
  it("should handle complete security flow", async () => {
    const security = new SecurityManager(config);
    const ctx = { runtime: "server" };

    // Генерация CSRF-токена
    const token = security.generateCsrfToken(ctx);

    // Проверка токена
    const mockHeaders = new Headers();
    mockHeaders.set("x-csrf-token", token.token);

    const verification = security.verifyCsrfToken(ctx, mockHeaders);
    expect(verification.valid).toBe(true);

    // Санитизация данных
    const maliciousData = {
      html: '<script>alert("xss")</script>',
      url: 'javascript:alert("xss")',
    };

    const sanitized = security.sanitizeObject(maliciousData, ctx, {
      kind: "html",
    });
    expect(sanitized.ok).toBe(true);
    expect(sanitized.value.html).not.toContain("<script>");
  });
});
```

### Отладка безопасности

#### Включение отладочных логов

```typescript
// В конфигурации безопасности
const debugConfig = {
  ...config,
  extensions: {
    debug: true,
    logLevel: "verbose",
  },
};
```

#### Аудит безопасности

```typescript
const security = new SecurityManager(config);
const auditReport = security.audit({
  context: ctx,
  sample: maliciousInput,
});

console.log("Security audit results:", auditReport.results);
```

## Оценка рисков, план отката и критерии готовности

### Оценка рисков

#### Высокий риск

- **Потенциальные уязвимости безопасности**: При неправильной миграции могут возникнуть XSS или CSRF уязвимости
- **Нарушение обратной совместимости**: Некоторые легаси-компоненты могут перестать работать

#### Средний риск

- **Производительность**: Новые реализации могут быть медленнее старых в некоторых сценариях
- **Неправильная конфигурация**: Неправильная настройка SecurityManager может ослабить защиту

#### Низкий риск

- **Увеличение сложности**: Новая архитектура может быть сложнее для понимания новыми разработчиками

### План отката

#### В случае критических проблем

1. **Немедленное отключение новых компонентов**:

   ```typescript
   // Включить легаси-режим через переменную окружения
   const useLegacy = process.env.USE_LEGACY_SECURITY === "true";
   ```

2. **Восстановление легаси-импортов**:

   - Временно восстановить все легаси-функции
   - Отключить предупреждения о депрекации
   - Обеспечить полную обратную совместимость

3. **Постепенная миграция**:
   - Использовать feature flags для контролируемого включения новых компонентов
   - Провести дополнительное тестирование в изолированной среде

### Критерии готовности

#### Технические критерии

- [ ] Все легаси-тесты проходят успешно
- [ ] Покрытие безопасности не менее 95%
- [ ] Нет критических уязвимостей в статическом анализе
- [ ] Совместимость с Next.js App Router
- [ ] Поддержка как клиентской, так и серверной среды

#### Функциональные критерии

- [ ] Все API-эндпоинты корректно обрабатывают валидацию и санитизацию
- [ ] CSRF-защита работает во всех сценариях
- [ ] Ограничение частоты запросов функционирует корректно
- [ ] Валидация данных Telegram Mini App работает как раньше
- [ ] Заголовки безопасности корректно устанавливаются

#### Организационные критерии

- [ ] Все разработчики проинструктированы о новой архитектуре
- [ ] Документация обновлена и доступна
- [ ] План миграции реализован для всех компонентов
- [ ] Система мониторинга безопасности настроена
