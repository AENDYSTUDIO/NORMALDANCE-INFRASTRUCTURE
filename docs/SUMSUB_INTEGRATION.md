# 🔐 Интеграция с Sumsub - Документация

## Обзор

Интеграция с Sumsub предоставляет мощную систему верификации документов пользователей для NORMALDANCE платформы. Система поддерживает несколько уровней верификации и обеспечивает соответствие международным стандартам KYC/AML.

## Архитектура

### Компоненты

1. **SumsubService** - Базовый сервис для взаимодействия с Sumsub API
2. **KYCSumsubService** - Расширенный KYC сервис с интеграцией Sumsub
3. **SumsubConfig** - Конфигурация для подключения к Sumsub
4. **Webhook Handler** - API endpoint для обработки вебхуков от Sumsub

### Уровни верификации

#### Basic (Базовый)

- **Требуемые документы**: Selfie
- **Проверки**: Верификация email, верификация телефона
- **Лимит транзакций**: $1,000
- **Функции**: Базовая торговля, ограниченные выводы

#### Standard (Стандартный)

- **Требуемые документы**: Паспорт + Selfie
- **Проверки**: Верификация адреса, верификация личности
- **Лимит транзакций**: $10,000
- **Функции**: Полная торговля, стандартные выводы, минтинг NFT

#### Enhanced (Расширенный)

- **Требуемые документы**: Паспорт + Selfie + Коммунальные услуги
- **Проверки**: Расширенная проверка, проверка источника средств
- **Лимит транзакций**: $50,000
- **Функции**: Полная торговля, расширенные выводы, минтинг NFT, стейкинг

#### Enterprise (Корпоративный)

- **Требуемые документы**: Паспорт + Selfie + Коммунальные услуги + Банковская выписка
- **Проверки**: Корпоративная верификация, проверка бенефициаров, расширенная проверка
- **Лимит транзакций**: $100,000
- **Функции**: Полная торговля, корпоративные выводы, минтинг NFT, стейкинг, доступ к API

## Установка и настройка

### 1. Переменные окружения

```bash
# Sumsub API настройки
SUMSUB_API_KEY=your_api_key_here
SUMSUB_SECRET=your_secret_here
SUMSUB_APP_ID=normaldance-kyc
SUMSUB_API_URL=https://api.sumsub.com
SUMSUB_WEBHOOK_SECRET=your_webhook_secret_here

# Уровни верификации (опционально)
SUMSUB_BASIC_LEVEL_NAME=basic-kyc
SUMSUB_BASIC_REQUIRED_DOCS=SELFIE
SUMSUB_BASIC_CHECKS=email_verification,phone_verification

SUMSUB_STANDARD_LEVEL_NAME=standard-kyc
SUMSUB_STANDARD_REQUIRED_DOCS=PASSPORT,SELFIE
SUMSUB_STANDARD_CHECKS=address_verification,identity_verification

SUMSUB_ENHANCED_LEVEL_NAME=enhanced-kyc
SUMSUB_ENHANCED_REQUIRED_DOCS=PASSPORT,SELFIE,UTILITY_BILL
SUMSUB_ENHANCED_CHECKS=enhanced_due_diligence,source_of_funds

SUMSUB_ENTERPRISE_LEVEL_NAME=enterprise-kyc
SUMSUB_ENTERPRISE_REQUIRED_DOCS=PASSPORT,SELFIE,UTILITY_BILL,BANK_STATEMENT
SUMSUB_ENTERPRISE_CHECKS=corporate_verification,ubo_verification,enhanced_due_diligence
```

### 2. Настройка вебхуков

Sumsub будет отправлять вебхуки на endpoint:

```
POST /api/kyc/sumsub/webhook
```

## Использование

### Создание KYC профиля с Sumsub

```typescript
import { KYCSumsubService } from "@/lib/aml-kyc/kyc-sumsub-service";
import { getSumsubConfig } from "@/lib/aml-kyc/sumsub-config";

const kycService = new KYCSumsubService(getSumsubConfig());

const request = {
  userId: "user-123",
  walletAddress: "9WzDXwBbmkg8JTt2pLQG",
  verificationLevel: "standard",
  useSumsub: true,
  personalData: {
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1990-01-01",
    placeOfBirth: "New York",
    nationality: "US",
    taxResidence: ["US"],
  },
  addresses: [
    {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "US",
      isPrimary: true,
      addressType: "RESIDENTIAL",
    },
  ],
  documents: [
    {
      type: "PASSPORT",
      number: "123456789",
      issueDate: "2020-01-01",
      expiryDate: "2030-01-01",
      issuingCountry: "US",
      issuingAuthority: "U.S. Department of State",
      frontImageHash: "ipfs://passport-front",
      backImageHash: "ipfs://passport-back",
    },
  ],
};

const result = await kycService.createKYCProfileWithSumsub(request);

if (result.success) {
  console.log("KYC профиль создан:", result.profileId);
  console.log("Sumsub applicant ID:", result.sumsubApplicantId);
  console.log("Access token:", result.sumsubAccessToken);
  console.log("Следующие шаги:", result.nextSteps);
}
```

### Обработка результатов верификации

```typescript
// Вебхук обрабатывается автоматически через API endpoint
// Но можно также обрабатывать вручную:

const result = await kycService.processSumsubVerificationResult(applicantId, {
  reviewAnswer: "GREEN", // или 'RED', 'GRAY'
  moderationComment: "Verification completed successfully",
});

if (result.success) {
  console.log("Статус KYC обновлен");
}
```

### Получение статуса верификации

```typescript
const status = await kycService.getSumsubVerificationStatus(applicantId);

if (status) {
  console.log("Статус:", status.status);
  console.log("Проверки:", status.checks);
  console.log("Последнее обновление:", status.lastUpdate);
}
```

### Обновление уровня верификации

```typescript
const upgradeResult = await kycService.upgradeVerificationLevel(
  "user-123",
  "enhanced" // 'basic', 'standard', 'enhanced', 'enterprise'
);

if (upgradeResult.success) {
  console.log("Уровень обновлен");
  console.log("Новый токен доступа:", upgradeResult.accessToken);
}
```

## API Reference

### SumsubService

#### `createApplicant(userId, email?, phone?, personalData?)`

Создает нового кандидата в Sumsub.

#### `generateAccessToken(applicantId, levelName)`

Генерирует токен доступа для Sumsub SDK.

#### `getApplicantInfo(applicantId)`

Получает информацию о кандидате.

#### `getApplicantChecks(applicantId)`

Получает результаты проверок кандидата.

#### `submitDocument(applicantId, documentType, fileBuffer, fileName)`

Отправляет документ для проверки.

#### `handleWebhook(payload, signature)`

Обрабатывает вебхук от Sumsub.

### KYCSumsubService

#### `createKYCProfileWithSumsub(request)`

Создает KYC профиль с интеграцией Sumsub.

#### `processSumsubVerificationResult(applicantId, reviewResult)`

Обрабатывает результаты верификации.

#### `upgradeVerificationLevel(userId, newLevel)`

Обновляет уровень верификации пользователя.

#### `getAvailableVerificationLevels()`

Возвращает доступные уровни верификации.

#### `getVerificationLevel(levelName)`

Возвращает информацию об уровне верификации.

## Безопасность

### Аутентификация API

Все запросы к Sumsub API подписываются с использованием HMAC-SHA256:

```typescript
const signature = createHMACSHA256(secret, timestamp + method + path + body);
```

### Валидация вебхуков

Вебхуки валидируются по подписи и IP адресу:

```typescript
// Проверка подписи
if (!verifyWebhookSignature(payload, signature)) {
  return { error: "Invalid signature" };
}

// Проверка IP адреса
if (!isAllowedIp(request.ip)) {
  return { error: "IP not allowed" };
}
```

### Защита данных

- Все чувствительные данные шифруются при хранении
- API ключи хранятся в переменных окружения
- Вебхуки принимаются только с разрешенных IP адресов

## Мониторинг и логирование

### Логи событий

Все события KYC/AML логируются:

```typescript
await complianceService.createComplianceEvent({
  type: "KYC_SUBMITTED",
  userId: request.userId,
  walletAddress: request.walletAddress,
  data: {
    profileId: profile.id,
    verificationLevel: request.verificationLevel,
    useSumsub: request.useSumsub,
  },
  severity: "LOW",
});
```

### Метрики

- Количество созданных профилей
- Время верификации
- Уровни верификации
- Статусы верификации
- Ошибки и отклонения

## Тестирование

### Запуск тестов

```bash
# Запуск всех тестов
npm test -- src/lib/aml-kyc/__tests__/sumsub-service.test.ts

# Запуск с покрытием
npm test -- --coverage src/lib/aml-kyc/__tests__/sumsub-service.test.ts
```

### Мокирование

Тесты используют моки для:

- Sumsub API вызовов
- Базы данных
- Вебхуков
- Файловых операций

## Траблшутинг

### Общие проблемы

1. **Неверная конфигурация API**

   - Проверьте переменные окружения
   - Убедитесь в правильности API ключа и секрета

2. **Ошибки верификации документов**

   - Проверьте качество загруженных изображений
   - Убедитесь в правильности формата документов

3. **Проблемы с вебхуками**

   - Проверьте URL вебхука в настройках Sumsub
   - Убедитесь в доступности endpoint

4. **Таймауты API**
   - Увеличьте таймауты для медленных соединений
   - Используйте повторные попытки

### Производительность

- Кэшируйте токены доступа
- Используйте connection pooling для API запросов
- Оптимизируйте обработку изображений

## Поддержка

### Документация

- [Sumsub API Documentation](https://developers.sumsub.com/)
- [NormalDance KYC Guide](./KYC_GUIDE.md)

### Контакты

- Техническая поддержка: tech-support@normaldance.com
- Sumsub поддержка: support@sumsub.com

## Версионирование

Текущая версия интеграции: v1.0.0

### История изменений

- v1.0.0 - Первоначальная интеграция с Sumsub
  - Базовая поддержка 4 уровней верификации
  - Вебхуки для обработки результатов
  - API endpoints для управления KYC

## Дополнительные ресурсы

### Примеры кода

- [Примеры интеграции](./examples/sumsub-integration/)
- [Тестовые случаи](./test-cases/sumsub/)
- [Конфигурации](./configurations/)

### Инструменты

- [Sumsub SDK](https://github.com/sumsub/sumsub-web-sdk)
- [Postman коллекция](./tools/postman/sumsub-api.postman_collection.json)
- [Валидатор конфигурации](./tools/config-validator/)
