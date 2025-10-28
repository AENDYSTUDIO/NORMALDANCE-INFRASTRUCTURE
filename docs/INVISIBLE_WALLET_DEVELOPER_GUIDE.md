# Руководство разработчика Invisible Wallet

## Введение

Данное руководство предназначено для разработчиков, которые хотят интегрировать Invisible Wallet в свои приложения или расширить его функциональность. В руководстве рассматриваются архитектурные решения, API, примеры использования и рекомендации по расширению функциональности.

## Архитектура системы

### Общая архитектура

Invisible Wallet построен на модульной архитектуре, где каждый компонент отвечает за определенную функцию:

```
┌─────────────────────────────────────────────┐
│                    Invisible Wallet                         │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Adapter Layer  │  │ Security Layer  │  │ UI Layer     │ │
│  │                 │  │              │ │
│  │ - Invisible     │  │ - Security      │  │ - Progressive│ │
│  │   WalletAdapter │  │   Manager       │  │   Disclosure │ │
│  │ - Event         │  │ - Transaction   │  │   UI         │ │
│  │   Emitter       │  │   Validator     │  │              │ │
│  └─────────────────┘  │ - Session       │  └──────────────┘ │
│                       │   Manager       │                  │
│  ┌─────────────────┐  │ - Rate Limiter  │  ┌──────────────┐ │
│  │ Transaction     │  └─────────────────┘  │ Integration  │ │
│  │ Layer           │                       │ Layer        │ │
│  │                 │  ┌─────────────────┐  │              │ │
│  │ - Multi-Chain   │  │ Key Management │  │ - Telegram   │ │
│  │   Abstraction   │  │                 │  │   Integration│ │
│  │ - Fee Optimizer │  │ - Key Manager   │  │ - Socket.IO  │
│  │ - Bridge        │  │ - Encryption    │  │ - IPFS/File- │ │
│  │   Manager       │  │   Manager       │  │   coin       │ │
│  │                 │  │ - Social        │  │ - Analytics  │ │
│  │                 │  │   Recovery      │  │ - Security   │ │
│  └─────────────────┘  │   Manager       │  └──────────────┘ │
│                       └─────────────────┘                  │
└─────────────────────────────────────────────────────┘
```

### Основные компоненты

#### InvisibleWalletAdapter

Центральный компонент, обеспечивающий взаимодействие с блокчейном и другими компонентами системы.

**Пример инициализации:**
```typescript
import { InvisibleWalletAdapter } from './src/components/wallet/invisible-wallet-adapter';

const config = {
  telegramUserId: '123456789',
  telegramInitData: 'query_id=xxx&user=xxx&hash=xxx',
  enableBiometric: true,
  enableSocialRecovery: true,
  supportedChains: ['solana', 'ethereum'],
  enableOffline: true,
  cacheDuration: 300000, // 5 minutes
  enableAnalytics: true,
 analyticsEndpoint: 'https://analytics.example.com'
};

const wallet = new InvisibleWalletAdapter(
  config,
  new Connection('https://api.mainnet-beta.solana.com')
);
```

**Основные методы:**
- `connect()` - Подключение к кошельку
- `disconnect()` - Отключение от кошелька
- `signTransaction(transaction)` - Подпись транзакции
- `sendTransaction(transaction)` - Отправка транзакции
- `getBalance()` - Получение баланса
- `getPublicKey()` - Получение публичного ключа

#### SecurityManager

Компонент, обеспечивающий безопасность транзакций и сессий.

**Пример использования:**
```typescript
import { SecurityManager } from './src/security/security-manager';

const securityManager = new SecurityManager(config);

// Проверка транзакции
const isValid = await securityManager.validateTransaction(
  transaction,
  userId
);

// Создание сессии
const sessionId = await securityManager.createSession(userId);

// Проверка сессии
const isValidSession = await securityManager.validateSession(sessionId);
```

#### MultiChainTransactionAbstraction

Компонент, обеспечивающий унификацию работы с различными блокчейнами.

**Пример использования:**
```typescript
import { MultiChainTransactionAbstraction } from './src/transactions/multi-chain-transaction';

const multiChainTx = new MultiChainTransactionAbstraction(config);

// Создание транзакции перевода
const transferTx = await multiChainTx.createTransferTransaction(
  'solana', // fromChain
  'ethereum', // toChain
  'source_address',
  'destination_address',
  1.0, // amount
  'SOL' // token
);

// Создание транзакции свопа
const swapTx = await multiChainTx.createSwapTransaction(
  'solana',
  'source_address',
  'destination_address',
  1.0, // amountIn
  'SOL', // tokenIn
  'USDC' // tokenOut
);

// Выполнение транзакции
const result = await multiChainTx.executeTransaction(transferTx);
```

## API документация

### Основные интерфейсы

#### InvisibleWalletConfig
```typescript
interface InvisibleWalletConfig {
  // Telegram интеграция
  telegramUserId?: string;
 telegramInitData?: string;
  telegramIntegration?: TelegramIntegrationConfig;

  // Безопасность
  enableBiometric?: boolean;
  enableSocialRecovery?: boolean;
  trustedContacts?: string[];

  // Multi-chain поддержка
  supportedChains?: ("solana" | "ethereum" | "ton" | "polygon" | "bsc")[];

  // Оффлайн режим
  enableOffline?: boolean;
  cacheDuration?: number;

  // Интеграции
  socketIOIntegration?: SocketIOIntegrationConfig;
  ipfsIntegration?: IPFSIntegrationConfig;
  analyticsIntegration?: AnalyticsIntegrationConfig;
  securityIntegration?: SecurityIntegrationConfig;

  // Мониторинг
 enableAnalytics?: boolean;
  analyticsEndpoint?: string;
}
```

#### BaseTransaction
```typescript
interface BaseTransaction {
  id: string;
  type: TransactionType;
  fromChain: SupportedChain;
  toChain?: SupportedChain;
  from: string;
  to: string;
  amount: number;
  token?: string;
  status: TransactionStatus;
  timestamp: number;
  confirmations?: number;
  gasUsed?: number;
  gasPrice?: number;
  fee?: number;
  error?: string;
}
```

#### TransactionType
```typescript
type TransactionType =
  | "transfer"
  | "swap"
  | "stake"
  | "unstake"
  | "mint"
  | "burn"
  | "approve";
```

#### SupportedChain
```typescript
type SupportedChain = "solana" | "ethereum" | "ton" | "polygon" | "bsc";
```

### Методы InvisibleWalletAdapter

#### connect()
Подключает кошелек и инициализирует все необходимые компоненты.

**Возвращает:** `Promise<void>`

**Пример использования:**
```typescript
try {
  await wallet.connect();
  console.log('Wallet connected successfully');
} catch (error) {
  console.error('Failed to connect wallet:', error);
}
```

#### disconnect()
Отключает кошелек и очищает все сессии.

**Возвращает:** `Promise<void>`

**Пример использования:**
```typescript
await wallet.disconnect();
console.log('Wallet disconnected');
```

#### signTransaction(transaction)
Подписывает транзакцию с использованием приватного ключа.

**Параметры:**
- `transaction: Transaction` - Транзакция для подписи

**Возвращает:** `Promise<Transaction>`

**Пример использования:**
```typescript
const transaction = new Transaction();
transaction.add(
  SystemProgram.transfer({
    fromPubkey: wallet.publicKey!,
    toPubkey: new PublicKey('destination_address'),
    lamports: 1000000,
  })
);

const signedTransaction = await wallet.signTransaction(transaction);
console.log('Transaction signed:', signedTransaction);
```

#### sendTransaction(transaction)
Отправляет подписанную транзакцию в блокчейн.

**Параметры:**
- `transaction: Transaction` - Подписанная транзакция

**Возвращает:** `Promise<string>` - Подпись транзакции

**Пример использования:**
```typescript
try {
  const signature = await wallet.sendTransaction(signedTransaction);
  console.log('Transaction sent:', signature);
} catch (error) {
  console.error('Failed to send transaction:', error);
}
```

#### getBalance()
Получает баланс кошелька с учетом кэширования.

**Возвращает:** `Promise<number>`

**Пример использования:**
```typescript
const balance = await wallet.getBalance();
console.log('Wallet balance:', balance);
```

#### on(event, listener)
Подписывается на события кошелька.

**Параметры:**
- `event: string` - Тип события
- `listener: Function` - Обработчик события

**Доступные события:**
- `connect` - Подключение к кошельку
- `disconnect` - Отключение от кошелька
- `balanceChange` - Изменение баланса
- `transaction` - Статус транзакции
- `security` - Событие безопасности
- `error` - Ошибка

**Пример использования:**
```typescript
wallet.on('balanceChange', (data) => {
  console.log('Balance updated:', data);
});

wallet.on('transaction', (data) => {
 console.log('Transaction status:', data.status);
});
```

## Примеры использования

### 1. Простая интеграция в React-приложение

```tsx
import React, { useState, useEffect } from 'react';
import { InvisibleWalletAdapter } from './src/components/wallet/invisible-wallet-adapter';
import { Connection } from '@solana/web3.js';

const WalletComponent = () => {
  const [wallet, setWallet] = useState<InvisibleWalletAdapter | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const initWallet = async () => {
      const walletAdapter = new InvisibleWalletAdapter(
        {
          enableSocialRecovery: true,
          supportedChains: ['solana'],
          enableOffline: true,
        },
        new Connection('https://api.mainnet-beta.solana.com')
      );

      // Подписка на события
      walletAdapter.on('connect', () => {
        setConnected(true);
      });

      walletAdapter.on('disconnect', () => {
        setConnected(false);
        setBalance(null);
      });

      walletAdapter.on('balanceChange', (data) => {
        setBalance(data.balance);
      });

      setWallet(walletAdapter);
    };

    initWallet();
  }, []);

  const connectWallet = async () => {
    if (wallet) {
      try {
        await wallet.connect();
      } catch (error) {
        console.error('Connection failed:', error);
      }
    }
  };

  const disconnectWallet = async () => {
    if (wallet) {
      await wallet.disconnect();
    }
  };

  const getWalletBalance = async () => {
    if (wallet) {
      const bal = await wallet.getBalance();
      setBalance(bal);
    }
  };

  return (
    <div>
      <h2>Invisible Wallet</h2>
      {!connected ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {wallet?.publicKey?.toBase58()}</p>
          <p>Balance: {balance} SOL</p>
          <button onClick={getWalletBalance}>Refresh Balance</button>
          <button onClick={disconnectWallet}>Disconnect</button>
        </div>
      )}
    </div>
  );
};

export default WalletComponent;
```

### 2. Выполнение транзакции перевода

```typescript
import { InvisibleWalletAdapter } from './src/components/wallet/invisible-wallet-adapter';
import { Connection, Transaction, SystemProgram } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';

const executeTransfer = async () => {
  const wallet = new InvisibleWalletAdapter(
    {
      enableSocialRecovery: true,
      supportedChains: ['solana'],
    },
    new Connection('https://api.mainnet-beta.solana.com')
  );

  try {
    // Подключение к кошельку
    await wallet.connect();

    // Создание транзакции
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey!,
        toPubkey: new PublicKey('destination_address'),
        lamports: 1000000, // 0.001 SOL
      })
    );

    // Подпись транзакции
    const signedTransaction = await wallet.signTransaction(transaction);

    // Отправка транзакции
    const signature = await wallet.sendTransaction(signedTransaction);

    console.log('Transaction successful:', signature);
  } catch (error) {
    console.error('Transaction failed:', error);
  } finally {
    await wallet.disconnect();
  }
};

executeTransfer();
```

### 3. Интеграция с MultiChainTransactionAbstraction

```typescript
import { MultiChainTransactionAbstraction } from './src/transactions/multi-chain-transaction';

const multiChainIntegration = async () => {
  const multiChainTx = new MultiChainTransactionAbstraction({
    supportedChains: ['solana', 'ethereum'],
  });

  // Оптимизация комиссии
  const feeOptimization = await multiChainTx.optimizeFee(
    'solana',
    'transfer',
    'medium'
  );
  console.log('Optimal fee:', feeOptimization);

  // Поиск лучшего маршрута для кросс-чейн транзакции
  const route = await multiChainTx.findBestRoute(
    'solana',
    'ethereum',
    1.0,
    'SOL'
  );
 console.log('Best route:', route);

  // Создание и выполнение транзакции
  const transferTx = await multiChainTx.createTransferTransaction(
    'solana',
    'ethereum',
    'source_address',
    'destination_address',
    1.0,
    'SOL'
  );

  const result = await multiChainTx.executeTransaction(transferTx);
  console.log('Transaction result:', result);
};

multiChainIntegration();
```

### 4. Интеграция с Telegram Stars

```typescript
import { TelegramStarsManager } from './src/integrations/telegram-stars';

const telegramStarsIntegration = async () => {
  const starsManager = new TelegramStarsManager({
    telegramUserId: 'user_id',
    telegramInitData: 'init_data',
  });

  // Получение баланса Stars
  const starsBalance = await starsManager.getStarsBalance();
  console.log('Stars balance:', starsBalance);

  // Конвертация Stars в SOL
  const conversionResult = await starsManager.convertStarsToSol(1000);
  if (conversionResult.success) {
    console.log('Converted amount:', conversionResult.toAmount);
  }

  // Покупка с использованием Stars
 const purchaseResult = await starsManager.purchaseWithStars(
    500,
    'Purchase description'
  );
  console.log('Purchase result:', purchaseResult);
};

telegramStarsIntegration();
```

## Рекомендации по расширению функциональности

### 1. Добавление новой цепи

Для добавления поддержки новой блокчейн-сети необходимо:

1. Создать адаптер цепи:
```typescript
class NewChainAdapter implements ChainAdapter {
  async initialize(): Promise<void> {
    // Инициализация подключения к новой цепи
  }

  async connect(): Promise<void> {
    // Подключение к цепи
  }

  async disconnect(): Promise<void> {
    // Отключение от цепи
  }

  async getBalance(address: string): Promise<number> {
    // Получение баланса в новой цепи
  }

  async sendTransaction(transaction: any): Promise<string> {
    // Отправка транзакции в новую цепь
  }

  // ... другие методы
}
```

2. Добавить конфигурацию цепи в `ChainConfig`:
```typescript
const newChainConfig: ChainConfig = {
  name: "New Chain",
  chainId: "new_chain_id",
  rpcUrl: "https://rpc.newchain.com",
  explorerUrl: "https://explorer.newchain.com",
  nativeCurrency: "NEW",
  blockTime: 5000, // ms
  confirmationsRequired: 10,
  maxFeePerTransaction: 0.01,
  supportedTokens: ["NEW", "USDC", "USDT"],
};
```

3. Зарегистрировать адаптер в `MultiChainTransactionAbstraction`:
```typescript
class MultiChainTransactionAbstraction {
  private _chainAdapters: Map<SupportedChain, ChainAdapter> = new Map();

  constructor(config: InvisibleWalletConfig) {
    // ... существующая инициализация
    this._chainAdapters.set("newchain", new NewChainAdapter());
  }
}
```

### 2. Добавление нового уровня безопасности

Для добавления нового уровня безопасности:

1. Расширить `SecurityLevel`:
```typescript
type SecurityLevel = "basic" | "enhanced" | "maximum" | "new_level";
```

2. Добавить новую проверку в `SecurityManager`:
```typescript
class SecurityManager {
  private async _performNewLevelCheck(): Promise<SecurityCheckResult> {
    // Реализация новой проверки безопасности
    return {
      secure: true,
      issues: [],
      recommendations: [],
      riskLevel: "low",
    };
 }
}
```

3. Интегрировать проверку в основной метод:
```typescript
async performSecurityCheck(): Promise<SecurityCheckResult> {
  // ... существующие проверки
  if (this._config.securityLevel === "new_level") {
    const newLevelCheck = await this._performNewLevelCheck();
    // Объединить результаты
  }
}
```

### 3. Добавление нового уровня интерфейса

Для добавления нового уровня в прогрессивное раскрытие:

1. Расширить `DisclosureLevel`:
```typescript
type DisclosureLevel = "basic" | "intermediate" | "advanced" | "expert" | "new_level";
```

2. Создать новый компонент UI:
```tsx
const NewLevelComponent: React.FC<{ wallet: InvisibleWalletAdapter }> = ({
  wallet,
}) => {
  // Реализация нового уровня интерфейса
  return (
    <div className="new-level-ui">
      {/* Содержимое нового уровня */}
    </div>
  );
};
```

3. Добавить отображение компонента в `ProgressiveDisclosureUI`:
```tsx
const ContentRenderer: React.FC<ContentRendererProps> = ({
  config,
  wallet,
}) => {
  return (
    <div className="content-area">
      {/* ... существующие компоненты */}
      {config.showNewLevelFeatures && <NewLevelComponent wallet={wallet} />}
    </div>
  );
};
```

### 4. Интеграция с новым провайдером

Для интеграции с новым внешним сервисом:

1. Создать интерфейс интеграции:
```typescript
interface NewIntegrationConfig {
  apiKey: string;
  endpoint: string;
  options?: any;
}

class NewIntegration {
  constructor(config: NewIntegrationConfig);
  
  async initialize(): Promise<void>;
  async performAction(data: any): Promise<any>;
  // ... другие методы
}
```

2. Добавить интеграцию в `IntegrationManager`:
```typescript
class IntegrationManager {
  private _newIntegration: NewIntegration | null = null;

  async initializeIntegrations(): Promise<void> {
    // ... существующая инициализация
    if (this._config.newIntegration) {
      this._newIntegration = new NewIntegration(this._config.newIntegration);
      await this._newIntegration.initialize();
    }
  }

  getNewIntegration(): NewIntegration | null {
    return this._newIntegration;
  }
}
```

3. Использовать интеграцию в других компонентах:
```typescript
class SomeComponent {
  private _newIntegration: NewIntegration | null;

  constructor(config: InvisibleWalletConfig) {
    const integrationManager = getGlobalIntegrationManager();
    this._newIntegration = integrationManager.getNewIntegration();
 }
}
```

## Лучшие практики

### 1. Обработка ошибок

Всегда обрабатывайте ошибки при работе с Invisible Wallet:

```typescript
try {
  await wallet.connect();
} catch (error) {
  if (error instanceof WalletConnectionError) {
    // Обработка ошибки подключения
    console.error('Wallet connection failed:', error.message);
  } else if (error instanceof SecurityError) {
    // Обработка ошибки безопасности
    console.error('Security validation failed:', error.message);
  } else {
    // Обработка других ошибок
    console.error('Unexpected error:', error);
 }
}
```

### 2. Управление состоянием

Используйте события для управления состоянием приложения:

```typescript
wallet.on('balanceChange', (data) => {
  updateUIBalance(data.balance);
});

wallet.on('transaction', (data) => {
  updateTransactionStatus(data);
});

wallet.on('security', (data) => {
 handleSecurityAlert(data);
});
```

### 3. Оптимизация производительности

- Используйте кэширование для частых операций
- Минимизируйте количество обращений к блокчейну
- Используйте оптимизацию комиссий через `MultiChainTransactionAbstraction`
- Реализуйте оффлайн функциональность для критических операций

### 4. Безопасность

- Всегда валидируйте транзакции через `SecurityManager`
- Используйте сессионное управление
- Реализуйте rate limiting для предотвращения атак
- Проверяйте подлинность внешних данных

## Отладка и тестирование

### Unit тесты

Для тестирования компонентов используйте стандартные фреймворки:

```typescript
describe('InvisibleWalletAdapter', () => {
  let wallet: InvisibleWalletAdapter;
  let mockConnection: Connection;

  beforeEach(async () => {
    mockConnection = new Connection('https://api.devnet.solana.com');
    wallet = new InvisibleWalletAdapter(
      {
        enableSocialRecovery: true,
        supportedChains: ['solana'],
      },
      mockConnection
    );
  });

  afterEach(async () => {
    if (wallet.connected) {
      await wallet.disconnect();
    }
  });

  it('should connect successfully', async () => {
    await wallet.connect();
    expect(wallet.connected).toBe(true);
  });
});
```

### Интеграционные тесты

Тестируйте взаимодействие между компонентами:

```typescript
describe('Integration Tests', () => {
  it('should handle transaction flow correctly', async () => {
    const wallet = new InvisibleWalletAdapter(config, connection);
    const securityManager = new SecurityManager(config);

    await wallet.connect();

    const transaction = new Transaction();
    // ... настройка транзакции

    // Проверка безопасности
    const isValid = await securityManager.validateTransaction(
      transaction,
      wallet.publicKey!.toBase58()
    );
    expect(isValid).toBe(true);

    // Подпись и отправка
    const signedTx = await wallet.signTransaction(transaction);
    const signature = await wallet.sendTransaction(signedTx);

    expect(signature).toBeDefined();
  });
});
```

### E2E тесты

Для тестирования пользовательских сценариев используйте Playwright или Cypress:

```typescript
// example.e2e.ts
import { test, expect } from '@playwright/test';

test('wallet connection flow', async ({ page }) => {
  await page.goto('/wallet');

  // Проверка начального состояния
  await expect(page.locator('#connect-button')).toBeVisible();

  // Подключение кошелька
  await page.locator('#connect-button').click();

  // Проверка подключения
  await expect(page.locator('#wallet-address')).toBeVisible();
  await expect(page.locator('#balance')).toBeVisible();
});
```

## Заключение

Invisible Wallet предоставляет мощную и гибкую архитектуру для интеграции Web3 функциональности в приложения. Следуя этому руководству, вы сможете эффективно интегрировать кошелек в свои проекты и расширить его функциональность в соответствии с вашими потребностями.

Ключевые моменты:
- Используйте модульную архитектуру для легкого расширения
- Обрабатывайте ошибки надежно
- Следите за безопасностью на всех уровнях
- Используйте события для управления состоянием
- Тестируйте все компоненты тщательно

Для получения дополнительной информации о конкретных компонентах обратитесь к соответствующим техническим спецификациям и примерам кода.