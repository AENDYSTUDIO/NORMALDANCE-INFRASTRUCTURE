# Стратегии смягчения уязвимостей, не устранимых через npm

## 1. bigint-buffer (высокий уровень угрозы)

### Проблема

Уязвимость Buffer Overflow в пакете bigint-buffer, используемом через:
`@solana/buffer-layout-utils` → `@solana/spl-token` → `@solana/pay`

### Стратегии смягчения

1. **Валидация данных на входе**: Добавить строгую валидацию размера и формата данных перед передачей в Solana-транзакции
2. **Ограничение размера**: Ввести ограничения на размеры передаваемых значений в Solana-транзакциях
3. **Мониторинг**: Добавить логирование и мониторинг подозрительных транзакций

### Рекомендуемые изменения

```typescript
// В файле src/lib/deflationary-model.ts и других местах работы с токенами
function validateTokenAmount(amount: bigint): boolean {
  // Ограничить максимальный размер значения для предотвращения переполнения
  const MAX_SAFE_AMOUNT = BigInt(2) ** BigInt(64) - BigInt(1);
  return amount > BigInt(0) && amount <= MAX_SAFE_AMOUNT;
}

function safeTokenTransfer(amount: bigint): boolean {
  if (!validateTokenAmount(amount)) {
    console.error("Небезопасное значение токена обнаружено:", amount);
    return false;
  }
  // Продолжить выполнение транзакции
  return true;
}
```

## 2. fast-redact (средний уровень угрозы)

### Проблема

Уязвимость prototype pollution в пакете fast-redact, используемом через:
`pino` → `@walletconnect/logger` → `@reown/appkit`

### Стратегии смягчения

1. **Изоляция логов**: Не передавать напрямую пользовательские данные в логи
2. **Санитизация данных**: Очищать логируемые данные от потенциально опасных полей
3. **Альтернативные решения**: Рассмотреть временное отключение логирования или переход на другой логгер

### Рекомендуемые изменения

```typescript
// В файлах, использующих логирование
function sanitizeLogData(data: any): any {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  // Удалить потенциально опасные поля
  const sanitized = { ...data };
  delete sanitized.__proto__;
  delete sanitized.constructor;

  // Рекурсивно обработать вложенные объекты
  for (const key in sanitized) {
    if (typeof sanitized[key] === "object") {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }

  return sanitized;
}
```

## 3. nanoid (средний уровень угрозы)

### Проблема

Предсказуемые результаты при некорректных значениях в пакете nanoid, используемом через:
`interface-datastore` → `ipfs-core-types` и `ipfs-core-utils`

### Стратегии смягчения

1. **Проверка входных данных**: Убедиться, что все значения, передаваемые в nanoid, корректны
2. **Использование альтернатив**: Для критических функций использовать альтернативные генераторы ID

### Рекомендуемые изменения

```typescript
// В файлах, где используется генерация ID
import { customAlphabet } from "nanoid";

// Использовать кастомный алфавит и длину для критических ID
const secureIdGenerator = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  21
);

function generateSecureId(): string {
  return secureIdGenerator();
}
```

## 4. parse-duration (высокий уровень угрозы)

### Проблема

DoS через регулярное выражение в пакете parse-duration, используемом через:
`ipfs-core-utils` → `ipfs-http-client`

### Стратегии смягчения

1. **Валидация входных данных**: Проверять формат строки перед передачей в parse-duration
2. **Ограничение по времени**: Устанавливать таймауты для операций парсинга
3. **Альтернативная реализация**: Использовать собственную реализацию парсинга продолжительности

### Рекомендуемые изменения

```typescript
// В файлах, использующих parse-duration
function safeParseDuration(durationStr: string): number | null {
  // Базовая валидация формата
  if (!/^[0-9]+(ms|s|m|h|d|w|y)$/.test(durationStr)) {
    console.error("Неверный формат продолжительности:", durationStr);
    return null;
  }

  // Ограничить длину строки для предотвращения ReDoS
  if (durationStr.length > 100) {
    console.error("Слишком длинная строка продолжительности:", durationStr);
    return null;
  }

  // Использовать try-catch для предотвращения падения приложения
  try {
    // Здесь использовать parse-duration с таймаутом или альтернативную реализацию
    // Временное решение: использовать простой парсер
    const match = durationStr.match(/^([0-9]+)([a-z]+)$/);
    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "ms":
        return value;
      case "s":
        return value * 1000;
      case "m":
        return value * 60000;
      case "h":
        return value * 3600000;
      case "d":
        return value * 86400000;
      default:
        return null;
    }
  } catch (error) {
    console.error("Ошибка парсинга продолжительности:", error);
    return null;
  }
}
```

## 5. Общие рекомендации

### Мониторинг и оповещения

- Настроить мониторинг аномального поведения приложений
- Внедрить оповещения о потенциальных атаках, связанных с этими уязвимостями

### Тестирование

- Добавить тесты, проверяющие корректную обработку некорректных данных
- Регулярно проводить тестирование на проникновение

### План действий

1. Внедрить стратегии смягчения в критические компоненты
2. Провести тестирование после внедрения
3. Подготовить план полной замены уязвимых библиотек
4. Отслеживать обновления зависимостей для устранения уязвимостей
