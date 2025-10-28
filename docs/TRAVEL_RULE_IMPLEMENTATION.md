# 🌍 Travel Rule Implementation Documentation

## Обзор

Документация описывает реализацию Travel Rule в платформе NormalDance в соответствии с требованиями FATF (Financial Action Task Force) для передачи информации о транзакциях между VASP (Virtual Asset Service Providers).

## Архитектура

### Компоненты системы

```
┌─────────────────────────────────────────────────────────────────┐
│                   Travel Rule Service                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ CAT Service  │  │ OFAC Service │  │ Crypto Service│  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│              VASP Registry Service                     │
├─────────────────────────────────────────────────────────────────┤
│            Integration Service                        │
├─────────────────────────────────────────────────────────────────┤
│                  API Endpoints                         │
└─────────────────────────────────────────────────────────────────┘
```

### Основные сервисы

1. **TravelRuleService** - Основной сервис для управления Travel Rule сообщениями
2. **CATService** - Реализация CAT (Common Address Transaction) протокола
3. **OFACService** - Реализация OFAC проверки и санкционного скрининга
4. **TravelRuleCrypto** - Сервис шифрования и цифровой подписи
5. **VASPRegistryService** - Реестр VASP для межорганизационного взаимодействия
6. **TravelRuleIntegrationService** - Интеграция с существующими транзакционными системами

## Поддерживаемые протоколы

### CAT (Common Address Transaction)
- **Версия**: 1.0
- **Формат**: JSON
- **Назначение**: Стандартизированный формат для передачи информации о транзакциях
- **Поддерживаемые поля**:
  - Информация о транзакции (ID, сумма, адреса)
  - Данные об отправителе и получателе
  - Цель и источник средств
  - Цифровая подпись

### OFAC (Office of Foreign Assets Control)
- **Версия**: 1.0
- **Формат**: JSON
- **Назначение**: Проверка санкционных списков
- **Функциональность**:
  - Скрининг по именам и псевдонимам
  - Проверка номеров документов
  - Проверка национальности
  - Автоматическая блокировка при совпадениях

### IVMS101 (InterVASP Messaging Standard)
- **Версия**: 1.0
- **Формат**: JSON
- **Статус**: Запланирован для будущих версий

## API Эндпоинты

### Отправка сообщений
```
POST /api/travel-rule/send
```

**Параметры**:
- `transactionId` (string, required) - ID транзакции
- `recipientVaspId` (string, required) - ID VASP получателя
- `protocol` (string, required) - Протокол (CAT, OFAC, IVMS101)
- `message` (object, required) - Travel Rule сообщение
- `priority` (string, optional) - Приоритет (LOW, MEDIUM, HIGH)

**Ответ**:
```json
{
  "success": true,
  "data": {
    "messageId": "msg_123",
    "status": "SENT",
    "timestamp": "2023-12-01T12:00:00Z",
    "protocol": "CAT",
    "recipientVaspId": "RECIPIENT-VASP-001"
  }
}
```

### Получение сообщений
```
POST /api/travel-rule/receive
```

**Параметры**:
- `messageId` (string, required) - ID сообщения
- `protocol` (string, required) - Протокол
- `message` (object, required) - Travel Rule сообщение
- `signature` (string, optional) - Цифровая подпись

**Ответ**:
```json
{
  "success": true,
  "data": {
    "messageId": "msg_123",
    "status": "ACKNOWLEDGED",
    "timestamp": "2023-12-01T12:00:00Z",
    "protocol": "CAT"
  }
}
```

### Управление VASP реестром
```
GET /api/travel-rule/vasp
POST /api/travel-rule/vasp
PUT /api/travel-rule/vasp/[id]
POST /api/travel-rule/vasp/[id]/reputation
```

## Безопасность

### Шифрование
- **Алгоритм**: AES-256-GCM
- **Ротация ключей**: 30 дней
- **Обмен ключами**: Через реестр VASP

### Цифровая подпись
- **Алгоритм**: ECDSA
- **Верификация**: Автоматическая при получении сообщения

### Санкционный скрининг
- **Источники**: OFAC, UN, EU, UK списки
- **Обновление**: Ежедневно
- **Пороги блокировки**: Настраиваемые

## Интеграция с существующими системами

### Триггеры Travel Rule
Travel Rule автоматически активируется при:
- Сумма транзакции ≥ $1,000 USD
- Тип транзакции: TRANSFER, NFT_PURCHASE, NFT_SALE, SWAP
- Получатель - внешний VASP

### Процесс обработки
1. **Определение получателя** - Проверка адреса в реестре VASP
2. **Сбор данных** - Получение KYC информации о пользователе
3. **Создание сообщения** - Формирование CAT/OFAC сообщения
4. **Отправка** - Передача в VASP получателя
5. **Мониторинг** - Отслеживание статуса доставки

## База данных

### Таблицы Travel Rule

#### TravelRuleMessage
```sql
CREATE TABLE travel_rule_messages (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  sender_vasp_id TEXT NOT NULL,
  recipient_vasp_id TEXT NOT NULL,
  protocol TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  message_data TEXT NOT NULL, -- JSON
  priority TEXT DEFAULT 'MEDIUM',
  processing_time INTEGER,
  error_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  expires_at DATETIME
);
```

#### VASPRegistry
```sql
CREATE TABLE vasp_registry (
  id TEXT PRIMARY KEY,
  vasp_info TEXT NOT NULL, -- JSON
  technical_endpoints TEXT NOT NULL, -- JSON
  supported_protocols TEXT NOT NULL, -- JSON array
  supported_formats TEXT NOT NULL, -- JSON array
  encryption_keys TEXT NOT NULL, -- JSON array
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  last_verified DATETIME DEFAULT CURRENT_TIMESTAMP,
  reputation TEXT NOT NULL -- JSON
);
```

#### TravelRuleEvent
```sql
CREATE TABLE travel_rule_events (
  id TEXT PRIMARY KEY,
  message_id TEXT,
  transaction_id TEXT,
  vasp_id TEXT,
  type TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  data TEXT NOT NULL, -- JSON
  severity TEXT NOT NULL DEFAULT 'LOW',
  processed BOOLEAN DEFAULT FALSE,
  processed_at DATETIME
);
```

## Конфигурация

### Переменные окружения
```bash
# Travel Rule настройки
TRAVEL_RULE_ENABLED=true
TRAVEL_RULE_AUTO_THRESHOLD=1000
TRAVEL_RULE_SUPPORTED_PROTOCOLS=CAT,OFAC

# Безопасность
TRAVEL_RULE_ENCRYPTION_ALGORITHM=AES-256-GCM
TRAVEL_RULE_KEY_ROTATION_DAYS=30
TRAVEL_RULE_SIGNATURE_ALGORITHM=ECDSA

# VASP информация
TRAVEL_RULE_VASP_ID=NORMALDANCE-VASP-001
TRAVEL_RULE_VASP_NAME=NormalDance Music Platform
TRAVEL_RULE_VASP_TYPE=NFT_MARKETPLACE
TRAVEL_RULE_VASP_JURISDICTION=RU
```

## Тестирование

### Unit тесты
- **Travel Rule Service**: Основная функциональность
- **CAT Service**: CAT протокол и валидация
- **OFAC Service**: Санкционный скрининг
- **Crypto Service**: Шифрование и подпись
- **Integration Service**: Интеграция с транзакциями

### Тестовые сценарии
1. **Успешная отправка CAT сообщения**
2. **Обработка входящего OFAC сообщения**
3. **Блокировка при совпадении в санкционном списке**
4. **Ошибка при отсутствии VASP получателя**
5. **Валидация формата сообщений**
6. **Шифрование и расшифрование сообщений**

### Запуск тестов
```bash
# Запуск всех тестов
npm test -- src/lib/travel-rule/__tests__

# Запуск конкретного теста
npm test -- --testPathPattern=travel-rule-service.test.ts

# Запуск с покрытием
npm test -- --coverage -- src/lib/travel-rule/__tests__
```

## Мониторинг и логирование

### Метрики
- Количество отправленных сообщений
- Количество полученных сообщений
- Время обработки сообщений
- Процент успешных доставок
- Количество заблокированных транзакций

### Логи
```javascript
// Пример логирования
console.log(`[TravelRule] Message sent: ${messageId} to ${recipientVaspId}`);
console.log(`[TravelRule] Screening result: ${screeningResult.recommendation}`);
console.log(`[TravelRule] Processing time: ${processingTime}ms`);
```

## Соответствие требованиям FATF

### Требования к данным отправителя
- ✅ Имя (физическое или юридическое лицо)
- ✅ Адрес
- ✅ Номер счета (если применимо)
- ✅ Дата рождения (для физических лиц)
- ✅ Национальность
- ✅ Идентификационный номер документа

### Требования к данным получателя
- ✅ Имя (физическое или юридическое лицо)
- ✅ Адрес
- ✅ Номер счета (если применимо)

### Требования к транзакции
- ✅ Сумма и валюта
- ✅ Дата и время
- ✅ Цель транзакции
- ✅ Источник средств

### Технические требования
- ✅ Шифрование передаваемых данных
- ✅ Цифровая подпись сообщений
- ✅ Валидация получателя
- ✅ Хранение записей (5-7 лет)
- ✅ Защита от несанкционированного доступа

## Будущие улучшения

### Планируемая функциональность
1. **Поддержка IVMS101** - Полная реализация стандарта
2. **Расширенный скрининг** - Интеграция с дополнительными базами данных
3. **ML детекция** - Машинное обучение для выявления подозрительных паттернов
4. **Dashboard** - Веб-интерфейс для мониторинга
5. **API версии 2** - Улучшенный API с большей функциональностью

### Производительность
1. **Кэширование** - Улучшение производительности через кэширование
2. **Асинхронная обработка** - Фоновая обработка сообщений
3. **Batch операции** - Групповая обработка транзакций
4. **Оптимизация БД** - Улучшение запросов к базе данных

## Поддержка

### Документация
- [API Reference](./API_REFERENCE.md)
- [Configuration Guide](./CONFIGURATION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

### Контакты
- **Техническая поддержка**: tech@normaldance.ru
- **Compliance**: compliance@normaldance.ru
- **Security**: security@normaldance.ru

---

*Документация обновлена: 28 октября 2025 г.*
*Версия: 1.0.0*