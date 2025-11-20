# Invisible Wallet Core Module

Модуль Invisible Wallet предоставляет бесшовную интеграцию кошелька для Telegram Mini Apps с автоматическим управлением ключами.

## Архитектура

### Основные компоненты

1. **InvisibleWalletAdapter** - основной адаптер, совместимый с WalletAdapter
2. **KeyManager** - управление ключами с детерминистической генерацией
3. **Config** - конфигурация системы с настройками для разных окружений
4. **Utils** - криптографические утилиты и функции валидации

### Файлы

```
src/
├── types/wallet.ts                    # Типы и интерфейсы
├── lib/wallet/
│   ├── config.ts                     # Конфигурация системы
│   ├── key-manager.ts                # Менеджер ключей
│   ├── utils.ts                      # Утилиты
│   └── __tests__/
│       └── invisible-wallet.test.ts   # Тесты
├── components/wallet/
│   ├── invisible-wallet-adapter.tsx  # Основной адаптер
│   ├── invisible-wallet-demo.tsx      # Демонстрационный компонент
│   ├── wallet-adapter.tsx            # Интеграция с существующим адаптером
│   └── wallet-provider.tsx           # Провайдер контекста
└── lib/wallet/README.md              # Эта документация
```

## Использование

### Базовая инициализация

```typescript
import { createInvisibleWalletAdapter } from "@/components/wallet/invisible-wallet-adapter";

// Создание адаптера с конфигурацией по умолчанию
const walletAdapter = createInvisibleWalletAdapter();

// Инициализация
await walletAdapter.initialize();

// Автоматическое подключение
await walletAdapter.autoConnect();
```

### Интеграция с React

```typescript
import { WalletProviderWrapper } from "@/components/wallet/wallet-provider";
import { useWalletContext } from "@/components/wallet/wallet-provider";

function App() {
  return (
    <WalletProviderWrapper>
      <YourApp />
    </WalletProviderWrapper>
  );
}

function YourComponent() {
  const { 
    connected, 
    publicKey, 
    balance, 
    isInvisibleWallet,
    purchaseWithStars,
    setupRecovery 
  } = useWalletContext();
  
  // Использование кошелька
}
```

### Покупка за Telegram Stars

```typescript
const result = await purchaseWithStars(100, "Покупка NDT токенов");

if (result.success) {
  console.log(`Куплено ${result.ndtAmount} NDT за ${result.starsAmount} Stars`);
}
```

### Настройка восстановления

```typescript
const contacts = [
  {
    id: '123456789',
    username: 'trusted_contact',
    firstName: 'Alice',
    isVerified: true,
    trustLevel: 0.9
  }
];

await setupRecovery(contacts);
```

## Конфигурация

### Базовая конфигурация

```typescript
import { getInvisibleWalletConfig } from "@/lib/wallet/config";

const config = getInvisibleWalletConfig(); // Автоматически определит окружение
```

### Кастомная конфигурация

```typescript
import { createCustomInvisibleWalletConfig } from "@/lib/wallet/config";

const config = createCustomInvisibleWalletConfig({
  keyConfig: {
    encryptionAlgorithm: 'AES-256-GCM',
    keyDerivation: 'Argon2',
    storageType: 'indexeddb',
    backupEnabled: true,
    rotationInterval: 30
  },
  starsConfig: {
    enabled: true,
    minAmount: 1,
    maxAmount: 10000,
    commissionRate: 0.02
  }
});
```

### Конфигурация для разных окружений

```typescript
// Разработка
const devConfig = getInvisibleWalletConfig('dev');

// Продакшен
const prodConfig = getInvisibleWalletConfig('prod');

// Тестирование
const testConfig = getInvisibleWalletConfig('test');
```

## Безопасность

### Управление ключами

- **Детерминистическая генерация**: Ключи генерируются на основе Telegram ID
- **Шифрование**: AES-256-GCM для хранения приватных ключей
- **Ротация ключей**: Автоматическая ротация через заданный интервал
- **Резервное копирование**: Автоматическое создание резервных копий

### Социальное восстановление

- **Shamir's Secret Sharing**: Разделение ключа на части
- **Доверенные контакты**: Хранение частей у контактов Telegram
- **Graceful degradation**: Восстановление при потере доступа

### Валидация

```typescript
import { ValidationUtils } from "@/lib/wallet/utils";

// Валидация адреса
const isValid = ValidationUtils.isValidSolanaAddress("address");

// Валидация ключевой пары
const isValidKeyPair = ValidationUtils.isValidKeyPair(keyPair);
```

## Тестирование

### Запуск тестов

```bash
npm test -- invisible-wallet.test.ts
```

### Структура тестов

```typescript
describe('InvisibleWalletAdapter', () => {
  describe('Initialization', () => {
    // Тесты инициализации
  });
  
  describe('Auto-connect', () => {
    // Тесты автоматического подключения
  });
  
  describe('Transaction signing', () => {
    // Тесты подписи транзакций
  });
  
  describe('Stars purchases', () => {
    // Тесты покупок за Stars
  });
});
```

## Интеграция с существующим кодом

### Совместимость с WalletAdapter

Invisible Wallet полностью совместим с существующим интерфейсом WalletAdapter:

```typescript
interface ExtendedWalletAdapter extends WalletAdapter {
  isInvisible?: boolean;
  autoConnect?: () => Promise<void>;
  purchaseWithStars?: (amount: number, description: string) => Promise<PurchaseResult>;
  setupRecovery?: (contacts: TelegramContact[]) => Promise<void>;
  getStarsBalance?: () => Promise<number>;
}
```

### Автоматическое определение

```typescript
import { createAutoWalletAdapter } from "@/components/wallet/wallet-adapter";

// Автоматически выберет Invisible Wallet в Telegram
// или стандартный кошелек в браузере
const walletAdapter = createAutoWalletAdapter();
```

## Оффлайн функциональность

### Очередь транзакций

```typescript
// Получение оффлайн очереди
const queue = await walletAdapter.getOfflineQueue();

// Синхронизация при подключении
await walletAdapter.syncWhenOnline();
```

### Кэширование баланса

```typescript
// Баланс автоматически кэшируется
// и обновляется при подключении к сети
const balance = await walletAdapter.getBalance();
```

## Telegram Stars интеграция

### Покупка токенов

```typescript
const result = await walletAdapter.purchaseWithStars(100, "Покупка NDT");

// Результат включает конвертацию Stars → SOL → NDT
console.log(result);
// {
//   success: true,
//   starsAmount: 100,
//   solAmount: 0.01,
//   ndtAmount: 10
// }
```

### Получение баланса

```typescript
const starsBalance = await walletAdapter.getStarsBalance();
console.log(`Доступно ${starsBalance} Stars`);
```

## Логирование и отладка

### Включение логирования

```typescript
import { logger } from "@/lib/utils/logger";

// Логи автоматически включаются для всех операций
logger.info("Invisible Wallet operation", { operation: "connect" });
```

### Отладочные утилиты

```typescript
import { TelegramUtils } from "@/lib/wallet/utils";

// Проверка окружения
const isTelegram = TelegramUtils.isTelegramWebApp();

// Получение данных пользователя
const user = TelegramUtils.getTelegramUser();
```

## Обработка ошибок

### Типы ошибок

```typescript
import { 
  InvisibleWalletError,
  KeyManagerError,
  SecurityError 
} from "@/types/wallet";

try {
  await walletAdapter.connect();
} catch (error) {
  if (error instanceof KeyManagerError) {
    // Обработка ошибки менеджера ключей
  } else if (error instanceof SecurityError) {
    // Обработка ошибки безопасности
  }
}
```

### Валидация ошибок

```typescript
import { ErrorUtils } from "@/lib/wallet/utils";

// Проверка типа ошибки
const isNetworkError = ErrorUtils.isNetworkError(error);
const isAuthError = ErrorUtils.isAuthError(error);
```

## Производительность

### Оптимизации

- **Ленивая загрузка**: Адаптеры загружаются только при необходимости
- **Кэширование**: Балансы и данные кэшируются
- **Пакетная обработка**: Транзакции обрабатываются пакетами
- **Сжатие**: Данные сжимаются при хранении

### Мониторинг

```typescript
// Отслеживание событий
walletAdapter.on('TRANSACTION_SENT', (event) => {
  console.log('Transaction sent:', event.data);
});

walletAdapter.on('SECURITY_ALERT', (event) => {
  console.log('Security alert:', event.data);
});
```

## Будущие улучшения

### Планируемая функциональность

1. **Биометрическая аутентификация**: Touch ID / Face ID
2. **Мульти-сигнатуры**: Кошельки с несколькими подписями
3. **DeFi интеграция**: Встроенный DeFi функционал
4. **NFT поддержка**: Управление NFT в Invisible Wallet
5. **Кросс-чейн**: Поддержка других блокчейнов

### Расширения API

```typescript
// Будущие расширения интерфейса
interface FutureInvisibleWalletAdapter extends InvisibleWalletAdapter {
  // Биометрия
  authenticateWithBiometry(): Promise<boolean>;
  
  // Мульти-сигнатуры
  addSigner(publicKey: PublicKey): Promise<void>;
  
  // DeFi
  swapTokens(from: string, to: string, amount: number): Promise<string>;
  
  // NFT
  mintNFT(metadata: NFTMetadata): Promise<string>;
}
```

## Поддержка

### Документация

- [API Reference](./api-reference.md)
- [Security Guide](./security-guide.md)
- [Migration Guide](./migration-guide.md)

### Сообщество

- [GitHub Issues](https://github.com/normaldance/invisible-wallet/issues)
- [Discord](https://discord.gg/normaldance)
- [Telegram](https://t.me/normaldance)

### Контакты

- Техническая поддержка: support@normaldance.com
- Вопросы безопасности: security@normaldance.com
- Бизнес: business@normaldance.com