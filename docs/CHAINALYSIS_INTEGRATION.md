# 🔗 Интеграция с Chainalysis - Блокчейн-аналитика

## Обзор

Интеграция с Chainalysis предоставляет комплексный анализ блокчейн-транзакций и адресов для улучшения AML/KYC комплаенса в NORMALDANCE. Система использует Chainalysis API для выявления рискованных транзакций, мониторинга адресов и генерации отчетов о подозрительной деятельности.

## Архитектура

### Компоненты

1. **Chainalysis Service** (`src/lib/aml-kyc/chainalysis-service.ts`)
   - Основной сервис для взаимодействия с Chainalysis API
   - Анализ адресов, транзакций и портфелей
   - Мониторинг в реальном времени
   - Создание правил и отчетов

2. **Chainalysis AML Integration** (`src/lib/aml-kyc/chainalysis-aml-integration.ts`)
   - Интеграция Chainalysis с существующей AML системой
   - Комплексный анализ транзакций
   - Оценка рисков пользователей
   - Мониторинг адресов

3. **Chainalysis Types** (`src/lib/aml-kyc/chainalysis-types.ts`)
   - Типы и интерфейсы для Chainalysis API
   - Структуры данных для анализа
   - Типы для интеграции с AML

4. **Chainalysis Config** (`src/lib/aml-kyc/chainalysis-config.ts`)
   - Конфигурация API
   - Правила мониторинга по умолчанию
   - Маппинг рисков и категорий

### API Эндпоинты

- `/api/chainalysis/address` - Анализ адресов
- `/api/chainalysis/transaction` - Анализ транзакций
- `/api/chainalysis/portfolio` - Анализ портфеля
- `/api/chainalysis/aml-integration` - Интеграция с AML
- `/api/chainalysis/monitor` - Мониторинг адресов
- `/api/chainalysis/portfolio-risk` - Отчеты о рисках портфеля

## База данных

### Новые таблицы

1. **ChainalysisAddressAnalysis**
   - Результаты анализа адресов
   - Категории, идентификации, экспозиция риска

2. **ChainalysisTransactionAnalysis**
   - Результаты анализа транзакций
   - Входы, выходы, риски

3. **ChainalysisMonitoringRule**
   - Правила мониторинга
   - Условия и действия

4. **ChainalysisMonitoringEvent**
   - События мониторинга
   - Результаты срабатывания правил

5. **ChainalysisReport**
   - Отчеты анализа
   - Сводки и аналитика

6. **ChainalysisResult**
   - Результаты интеграции с AML
   - Факторы риска, рекомендации

7. **UserChainalysisResult**
   - Результаты анализа пользователей
   - История анализов

## Конфигурация

### Переменные окружения

```bash
# Chainalysis API
CHAINALYSIS_API_KEY=your_api_key
CHAINALYSIS_API_SECRET=your_api_secret
CHAINALYSIS_ENVIRONMENT=SANDBOX|PRODUCTION
CHAINALYSIS_TIMEOUT=30000
CHAINALYSIS_RETRY_ATTEMPTS=3
CHAINALYSIS_RETRY_DELAY=1000
CHAINALYSIS_WEBHOOK_SECRET=your_webhook_secret
CHAINALYSIS_MONITORING_ENABLED=true

# Пороги риска
CHAINALYSIS_RISK_THRESHOLD_LOW=25
CHAINALYSIS_RISK_THRESHOLD_MEDIUM=50
CHAINALYSIS_RISK_THRESHOLD_HIGH=75
CHAINALYSIS_RISK_THRESHOLD_SEVERE=90
```

### Уровни риска

- **LOW** (0-25): Низкий риск, стандартные операции
- **MEDIUM** (26-50): Средний риск, требует внимания
- **HIGH** (51-75): Высокий риск, ручная проверка
- **SEVERE** (76-100): Критический риск, блокировка

### Категории адресов

- **EXCHANGE**: Криптобиржи
- **WALLET**: Кошельки пользователей
- **MINING**: Майнинг пулы
- **MARKETPLACE**: Маркетплейсы
- **GAMBLING**: Азартные игры
- **MIXER**: Миксеры/тумблеры
- **SCAM**: Мошенничество
- **ILLEGAL**: Незаконная деятельность
- **OTHER**: Другое

## Использование

### Анализ адреса

```typescript
import { ChainalysisService } from '@/lib/aml-kyc/chainalysis-service';

const chainalysisService = new ChainalysisService();

const result = await chainalysisService.analyzeAddress({
  address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDs8",
  asset: "SOL",
  includeTransactions: true,
  includeExposure: true,
  includeIdentifications: true,
});

if (result.success) {
  console.log("Risk level:", result.data.risk);
  console.log("Categories:", result.data.categories);
  console.log("Exposure:", result.data.exposure);
}
```

### Интеграция с AML

```typescript
import { ChainalysisAMLIntegration } from '@/lib/aml-kyc/chainalysis-aml-integration';

const integration = new ChainalysisAMLIntegration();

// Анализ транзакции с Chainalysis
const transaction = {
  transactionHash: "abc123...",
  userId: "user-123",
  walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDs8",
  type: "TRANSFER",
  amount: 1000,
  currency: "SOL",
  fromAddress: "sender-address",
  toAddress: "receiver-address",
  timestamp: "2023-12-01T12:00:00Z",
  blockNumber: 12345,
};

const analyzedTransaction = await integration.analyzeTransactionWithChainalysis(transaction);

console.log("Combined risk score:", analyzedTransaction.riskScore);
console.log("Monitoring status:", analyzedTransaction.monitoringStatus);
```

### Мониторинг адреса

```typescript
// Мониторинг адреса в реальном времени
const monitoringResult = await integration.monitorAddress(
  "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDs8",
  "SOL"
);

if (monitoringResult.requiresAction) {
  console.log("Action required:", monitoringResult.recommendations);
  
  if (monitoringResult.riskLevel === "CRITICAL") {
    // Блокировать транзакции
    await blockTransactions(monitoringResult.address);
  }
}
```

### Анализ портфеля

```typescript
// Анализ рисков портфеля адресов
const portfolioResult = await integration.getPortfolioRiskReport(
  [
    "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDs8",
    "7xKXtg2CW87d97TXJSDpbD5BXgkU8",
    "5KQwrPbwdL6PhJuDJWEbRq9pKzW"
  ],
  "SOL"
);

console.log("Portfolio risk:", portfolioResult.overallRisk);
console.log("High risk addresses:", portfolioResult.highRiskAddresses);
console.log("Recommendations:", portfolioResult.recommendations);
```

## API Примеры

### Анализ адреса

```bash
curl -X POST http://localhost:3000/api/chainalysis/address \
  -H "Content-Type: application/json" \
  -d '{
    "address": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDs8",
    "asset": "SOL",
    "includeTransactions": true,
    "includeExposure": true,
    "includeIdentifications": true
  }'
```

### Получение риска адреса

```bash
curl "http://localhost:3000/api/chainalysis/address?address=9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDs8&asset=SOL"
```

### Анализ портфеля

```bash
curl -X POST http://localhost:3000/api/chainalysis/portfolio \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": [
      "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDs8",
      "7xKXtg2CW87d97TXJSDpbD5BXgkU8"
    ],
    "asset": "SOL",
    "includeTransactions": true,
    "includeExposure": true
  }'
```

## Правила мониторинга

### Правила по умолчанию

1. **High Risk Address Detection**
   - Условие: риск > 75
   - Действия: ALERT, FLAG

2. **Mixer/Tumbler Detection**
   - Условие: категория содержит MIXER
   - Действия: ALERT, BLOCK, REPORT

3. **High Value Transaction**
   - Условие: сумма > $100,000
   - Действия: ALERT, FLAG

4. **Illegal Activity Detection**
   - Условие: категория содержит ILLEGAL
   - Действия: ALERT, BLOCK, REPORT

### Создание кастомных правил

```typescript
const rule = await chainalysisService.createMonitoringRule({
  name: "Custom High Risk Rule",
  description: "Обнаружение кастомных высокорисковых операций",
  isActive: true,
  conditions: [
    {
      field: "risk",
      operator: "GREATER_THAN",
      value: 80,
      weight: 100,
    },
    {
      field: "amount",
      operator: "GREATER_THAN",
      value: 50000,
      weight: 50,
    },
  ],
  actions: [
    {
      type: "ALERT",
      parameters: { priority: "CRITICAL" },
    },
    {
      type: "BLOCK",
    },
  ],
});
```

## Отчетность

### Типы отчетов

1. **ADDRESS_ANALYSIS**: Анализ адресов
2. **TRANSACTION_ANALYSIS**: Анализ транзакций
3. **PORTFOLIO_RISK**: Риски портфеля
4. **COMPLIANCE_SUMMARY**: Сводка комплаенса

### Создание отчета

```typescript
const report = await chainalysisService.createReport(
  "PORTFOLIO_RISK",
  "Monthly Portfolio Risk Report",
  "Ежемесячный анализ рисков портфеля",
  {
    addresses: analysisResults,
    summary: {
      totalAddresses: 100,
      highRiskAddresses: 5,
      averageRiskScore: 35,
    },
  }
);

console.log("Report ID:", report.reportId);
```

## Интеграция с существующей AML системой

### Комбинированная оценка риска

Система комбинирует результаты из двух источников:

- **AML Service** (60% веса): Традиционный AML анализ
- **Chainalysis** (40% веса): Блокчейн-аналитика

### Факторы риска

1. **EXPOSURE**: Экспозиция к рискованным активам
2. **IDENTIFICATION**: Идентификация контрагентов
3. **BEHAVIOR**: Поведенческие паттерны
4. **NETWORK**: Сетевой анализ
5. **VOLUME**: Объемные показатели

### Рекомендации

Система генерирует рекомендации на основе:

- Уровня риска
- Категорий адресов
- Экспозиции
- Поведенческих паттернов

## Тестирование

### Запуск тестов

```bash
# Тесты Chainalysis сервиса
npm test -- --testPathPattern="chainalysis-service.test.ts"

# Тесты интеграции с AML
npm test -- --testPathPattern="chainalysis-aml-integration.test.ts"

# Все тесты AML/KYC
npm test -- --testPathPattern="aml-kyc"
```

### Покрытие тестами

- Chainalysis Service: 95%
- AML Integration: 90%
- API Endpoints: 85%

## Безопасность

### Аутентификация API

- Использование API ключей и секретов
- Валидация подписей запросов
- Ограничение доступа по IP

### Защита данных

- Шифрование конфиденциальных данных
- Анонимизация персональной информации
- Соблюдение GDPR и других регуляторных требований

### Мониторинг безопасности

- Логирование всех запросов
- Обнаружение аномальной активности
- Оповещения о инцидентах безопасности

## Производительность

### Оптимизация запросов

- Кэширование результатов анализа
- Пакетная обработка запросов
- Лимиты на количество адресов

### Метрики производительности

- Время ответа API: < 2с
- Пропускная способность: 1000 req/min
- Доступность: 99.9%

## Траблшутинг

### Общие проблемы

1. **Timeout ошибок**
   - Увеличить таймаут в конфигурации
   - Проверить сетевое соединение
   - Использовать ретраи

2. **Неверные результаты анализа**
   - Проверить формат адреса
   - Убедиться в правильности ассета
   - Валидировать параметры запроса

3. **Проблемы с интеграцией**
   - Проверить конфигурацию AML сервиса
   - Убедиться в доступности базы данных
   - Проверить логи ошибок

### Логирование

```typescript
// Включение детального логирования
const chainalysisService = new ChainalysisService({
  ...config,
  enableDebugLogging: true,
});

// Просмотр логов
console.log("Chainalysis logs:", await getChainalysisLogs());
```

## Будущие улучшения

1. **Машинное обучение**
   - Улучшение детекции аномалий
   - Адаптивные пороги риска
   - Прогнозирование рисков

2. **Расширенная аналитика**
   - Графовый анализ транзакций
   - Временные паттерны
   - Кросс-чейн анализ

3. **Интеграции**
   - Дополнительные блокчейн-аналитики
   - Сервисы верификации
   - Регуляторные отчеты

## Поддержка

### Документация Chainalysis

- [Chainalysis API Documentation](https://docs.chainalysis.com/)
- [KYT API Guide](https://docs.chainalysis.com/kyt/api/)
- [Reactors Documentation](https://docs.chainalysis.com/reactors/)

### Контакты

- Техническая поддержка: support@normaldance.com
- AML комплаенс: compliance@normaldance.com
- Безопасность: security@normaldance.com

---

*Документация обновлена: 28.10.2025*
*Версия: 1.0.0*