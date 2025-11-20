# Примеры использования Invisible Wallet

## Введение

Данное руководство содержит практические примеры интеграции и использования Invisible Wallet в различных сценариях. Примеры охватывают как простые случаи использования, так и сложные сценарии, включая код-сниппеты, пошаговые инструкции и лучшие практики.

## 1. Простая интеграция в веб-приложение

### 1.1 Базовая инициализация

```html
<!DOCTYPE html>
<html>
<head>
    <title>Invisible Wallet Example</title>
    <script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.js"></script>
</head>
<body>
    <div id="wallet-container">
        <button id="connect-btn">Подключить кошелек</button>
        <div id="wallet-info" style="display:none;">
            <p>Адрес: <span id="public-key"></span></p>
            <p>Баланс: <span id="balance">0</span> SOL</p>
            <button id="disconnect-btn">Отключить</button>
        </div>
    </div>

    <script>
        // Импортируем Invisible Wallet (в реальном приложении через npm или CDN)
        // Для примера создадим mock объект
        class InvisibleWalletAdapter {
            constructor(config, connection) {
                this.config = config;
                this.connection = connection;
                this.connected = false;
                this.publicKey = null;
                this.balance = 0;
                this.eventListeners = {};
            }

            async connect() {
                // В реальном приложении: инициализация с Telegram данными
                this.connected = true;
                this.publicKey = solana.Keypair.generate().publicKey;
                
                // Обновляем баланс
                await this.updateBalance();
                
                // Вызываем событие подключения
                this.emit('connect');
                
                return this.publicKey;
            }

            async disconnect() {
                this.connected = false;
                this.publicKey = null;
                this.balance = 0;
                this.emit('disconnect');
            }

            async getBalance() {
                if (!this.connected) {
                    throw new Error('Кошелек не подключен');
                }
                
                // В реальном приложении: запрос баланса с блокчейна
                // С кэшированием и проверкой freshness
                return this.balance;
            }

            async updateBalance() {
                if (this.connected) {
                    // Имитация получения баланса
                    this.balance = Math.random() * 10; // Случайный баланс для примера
                    this.emit('balanceChange', { balance: this.balance });
                }
            }

            on(event, callback) {
                if (!this.eventListeners[event]) {
                    this.eventListeners[event] = [];
                }
                this.eventListeners[event].push(callback);
            }

            emit(event, data) {
                const listeners = this.eventListeners[event] || [];
                listeners.forEach(callback => callback(data));
            }
        }

        // Инициализация приложения
        const connection = new solana.Connection('https://api.mainnet-beta.solana.com');
        const wallet = new InvisibleWalletAdapter(
            {
                enableSocialRecovery: true,
                supportedChains: ['solana'],
                enableOffline: true,
                cacheDuration: 300000 // 5 минут
            },
            connection
        );

        // Обработчики событий
        wallet.on('connect', () => {
            document.getElementById('wallet-info').style.display = 'block';
            document.getElementById('connect-btn').style.display = 'none';
            document.getElementById('public-key').textContent = wallet.publicKey.toBase58();
        });

        wallet.on('disconnect', () => {
            document.getElementById('wallet-info').style.display = 'none';
            document.getElementById('connect-btn').style.display = 'block';
            document.getElementById('public-key').textContent = '';
            document.getElementById('balance').textContent = '0';
        });

        wallet.on('balanceChange', (data) => {
            document.getElementById('balance').textContent = data.balance.toFixed(4);
        });

        // Обработчики кнопок
        document.getElementById('connect-btn').addEventListener('click', async () => {
            try {
                await wallet.connect();
                console.log('Кошелек подключен');
            } catch (error) {
                console.error('Ошибка подключения:', error);
                alert('Ошибка подключения: ' + error.message);
            }
        });

        document.getElementById('disconnect-btn').addEventListener('click', async () => {
            try {
                await wallet.disconnect();
                console.log('Кошелек отключен');
            } catch (error) {
                console.error('Ошибка отключения:', error);
            }
        });
    </script>
</body>
</html>
```

### 1.2 Интеграция с React

```tsx
// WalletComponent.tsx
import React, { useState, useEffect } from 'react';
import { Connection } from '@solana/web3.js';
import { InvisibleWalletAdapter } from './src/components/wallet/invisible-wallet-adapter';

interface WalletComponentProps {
  onConnect?: (wallet: InvisibleWalletAdapter) => void;
 onDisconnect?: () => void;
}

const WalletComponent: React.FC<WalletComponentProps> = ({ onConnect, onDisconnect }) => {
  const [wallet, setWallet] = useState<InvisibleWalletAdapter | null>(null);
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Инициализация кошелька
    const initWallet = async () => {
      const walletAdapter = new InvisibleWalletAdapter(
        {
          enableSocialRecovery: true,
          supportedChains: ['solana', 'ethereum'],
          enableOffline: true,
        },
        new Connection('https://api.mainnet-beta.solana.com')
      );

      // Подписка на события
      walletAdapter.on('connect', () => {
        setConnected(true);
        if (onConnect) onConnect(walletAdapter);
      });

      walletAdapter.on('disconnect', () => {
        setConnected(false);
        setBalance(null);
        if (onDisconnect) onDisconnect();
      });

      walletAdapter.on('balanceChange', (data) => {
        setBalance(data.balance);
      });

      setWallet(walletAdapter);
    };

    initWallet();

    // Очистка при размонтировании
    return () => {
      if (wallet && connected) {
        wallet.disconnect();
      }
    };
 }, []);

  const handleConnect = async () => {
    if (wallet) {
      setLoading(true);
      try {
        await wallet.connect();
      } catch (error) {
        console.error('Connection failed:', error);
        alert('Failed to connect wallet: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDisconnect = async () => {
    if (wallet) {
      await wallet.disconnect();
    }
 };

  const handleGetBalance = async () => {
    if (wallet && connected) {
      try {
        const bal = await wallet.getBalance();
        setBalance(bal);
      } catch (error) {
        console.error('Failed to get balance:', error);
      }
    }
  };

  return (
    <div className="wallet-component">
      <h3>Invisible Wallet</h3>
      
      {!connected ? (
        <button onClick={handleConnect} disabled={loading}>
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="wallet-info">
          <p>Address: {wallet?.publicKey?.toBase58()}</p>
          <p>Balance: {balance !== null ? balance.toFixed(4) : 'Loading...'} SOL</p>
          <button onClick={handleGetBalance}>Refresh Balance</button>
          <button onClick={handleDisconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
};

export default WalletComponent;
```

## 2. Сложные сценарии использования

### 2.1 Кросс-чейн транзакции

```typescript
import { MultiChainTransactionAbstraction } from './src/transactions/multi-chain-transaction';
import { InvisibleWalletAdapter } from './src/components/wallet/invisible-wallet-adapter';

class CrossChainService {
  private multiChainTx: MultiChainTransactionAbstraction;
  private wallet: InvisibleWalletAdapter;

  constructor(wallet: InvisibleWalletAdapter) {
    this.wallet = wallet;
    this.multiChainTx = new MultiChainTransactionAbstraction({
      supportedChains: ['solana', 'ethereum', 'polygon', 'bsc']
    });
  }

  async executeCrossChainTransfer(
    fromChain: 'solana' | 'ethereum' | 'polygon' | 'bsc',
    toChain: 'solana' | 'ethereum' | 'polygon' | 'bsc',
    amount: number,
    token: string,
    recipient: string
  ) {
    try {
      // Найти оптимальный маршрут
      const routeInfo = await this.multiChainTx.findBestRoute(
        fromChain,
        toChain,
        amount,
        token
      );

      console.log(`Лучший маршрут: ${routeInfo.route.join(' -> ')}`);
      console.log(`Оценочная комиссия: ${routeInfo.estimatedFee}`);
      console.log(`Оценочное время: ${routeInfo.estimatedTime}ms`);

      // Создать транзакцию перевода
      const transaction = await this.multiChainTx.createTransferTransaction(
        fromChain,
        toChain,
        this.wallet.publicKey!.toBase58(),
        recipient,
        amount,
        token
      );

      console.log(`Транзакция создана: ${transaction.id}`);

      // Выполнить транзакцию
      const result = await this.multiChainTx.executeTransaction(transaction);

      if (result.success) {
        console.log(`Транзакция успешна: ${result.transactionId}`);
        return result;
      } else {
        throw new Error(`Транзакция не удалась: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка кросс-чейн транзакции:', error);
      throw error;
    }
  }

  async swapTokens(
    chain: 'solana' | 'ethereum' | 'polygon' | 'bsc',
    fromToken: string,
    toToken: string,
    amount: number
  ) {
    try {
      // Создать транзакцию свопа
      const swapTransaction = await this.multiChainTx.createSwapTransaction(
        chain,
        this.wallet.publicKey!.toBase58(),
        this.wallet.publicKey!.toBase58(), // Для свопа отправитель и получатель одинаковы
        amount,
        fromToken,
        toToken
      );

      console.log(`Своп транзакция создана: ${swapTransaction.id}`);

      // Выполнить транзакцию
      const result = await this.multiChainTx.executeTransaction(swapTransaction);

      if (result.success) {
        console.log(`Своп успешен: ${result.transactionId}`);
        return result;
      } else {
        throw new Error(`Своп не удался: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка свопа токенов:', error);
      throw error;
    }
  }
}

// Пример использования
const executeCrossChainExample = async () => {
  // Предполагается, что кошелек уже инициализирован и подключен
  const wallet = new InvisibleWalletAdapter(
    { supportedChains: ['solana', 'ethereum'] },
    new Connection('https://api.mainnet-beta.solana.com')
  );

  await wallet.connect();

  const crossChainService = new CrossChainService(wallet);

 try {
    // Выполнить кросс-чейн транзакцию: Solana -> Ethereum
    const result = await crossChainService.executeCrossChainTransfer(
      'solana',
      'ethereum',
      1.0, // 1 SOL
      'SOL',
      '0x...' // Ethereum адрес получателя
    );

    console.log('Результат транзакции:', result);
  } catch (error) {
    console.error('Ошибка выполнения транзакции:', error);
  }
};
```

### 2.2 Использование Telegram Stars

```typescript
import { TelegramStarsManager } from './src/integrations/telegram-stars';
import { InvisibleWalletAdapter } from './src/components/wallet/invisible-wallet-adapter';

class StarsIntegrationService {
  private starsManager: TelegramStarsManager;
  private wallet: InvisibleWalletAdapter;

  constructor(wallet: InvisibleWalletAdapter, starsManager: TelegramStarsManager) {
    this.wallet = wallet;
    this.starsManager = starsManager;
  }

 async purchaseTokensWithStars(starsAmount: number, token: string, amount: number) {
    try {
      // Проверить баланс Stars
      const starsBalance = await this.starsManager.getStarsBalance();
      if (starsBalance < starsAmount) {
        throw new Error(`Недостаточно Stars. Требуется: ${starsAmount}, доступно: ${starsBalance}`);
      }

      // Выполнить покупку через Stars
      const purchaseResult = await this.starsManager.purchaseWithStars(
        starsAmount,
        `Покупка ${amount} ${token} через Invisible Wallet`
      );

      if (!purchaseResult.success) {
        throw new Error(`Покупка не удалась: ${purchaseResult.error}`);
      }

      console.log(`Покупка успешна: ${purchaseResult.convertedAmount} ${token} приобретено`);

      // Конвертировать Stars в нужный токен
      const conversionResult = await this.starsManager.convertStarsToSol(starsAmount);
      if (conversionResult.success) {
        console.log(`Конвертация успешна: ${conversionResult.toAmount} ${token}`);
      }

      return {
        success: true,
        starsUsed: starsAmount,
        tokensReceived: conversionResult.toAmount,
        transactionId: purchaseResult.transactionId
      };
    } catch (error) {
      console.error('Ошибка покупки через Stars:', error);
      throw error;
    }
  }

  async payTransactionFeeWithStars(feeInSol: number) {
    try {
      // Рассчитать эквивалент в Stars (предположим курс 1 SOL = 100 Stars)
      const starsEquivalent = feeInSol * 100;

      // Проверить баланс Stars
      const starsBalance = await this.starsManager.getStarsBalance();
      if (starsBalance < starsEquivalent) {
        throw new Error(`Недостаточно Stars для оплаты комиссии. Требуется: ${starsEquivalent}, доступно: ${starsBalance}`);
      }

      // Выполнить оплату комиссии через Stars
      const purchaseResult = await this.starsManager.purchaseWithStars(
        starsEquivalent,
        `Оплата комиссии за транзакцию`
      );

      if (purchaseResult.success) {
        console.log(`Комиссия оплачена через Stars: ${starsEquivalent} Stars использовано`);
        return true;
      } else {
        throw new Error(`Оплата комиссии не удалась: ${purchaseResult.error}`);
      }
    } catch (error) {
      console.error('Ошибка оплаты комиссии через Stars:', error);
      throw error;
    }
  }
}

// Пример использования
const starsIntegrationExample = async () => {
  const wallet = new InvisibleWalletAdapter(
    {
      telegramUserId: 'user_id',
      telegramInitData: 'init_data',
      supportedChains: ['solana']
    },
    new Connection('https://api.mainnet-beta.solana.com')
  );

  const starsManager = new TelegramStarsManager({
    telegramUserId: 'user_id',
    telegramInitData: 'init_data',
  });

  await wallet.connect();

  const starsService = new StarsIntegrationService(wallet, starsManager);

  try {
    // Купить 1 SOL за 100 Stars
    const result = await starsService.purchaseTokensWithStars(100, 'SOL', 1.0);
    console.log('Результат покупки:', result);
  } catch (error) {
    console.error('Ошибка покупки:', error);
  }
};
```

### 2.3 Социальное восстановление

```typescript
import { KeyManager } from './src/security/key-manager';
import { InvisibleWalletAdapter } from './src/components/wallet/invisible-wallet-adapter';

class SocialRecoveryService {
  private keyManager: KeyManager;
  private wallet: InvisibleWalletAdapter;

  constructor(wallet: InvisibleWalletAdapter, keyManager: KeyManager) {
    this.wallet = wallet;
    this.keyManager = keyManager;
  }

  async setupSocialRecovery(trustedContacts: string[]) {
    try {
      // Установить доверенные контакты для социального восстановления
      await this.keyManager.setupSocialRecovery(trustedContacts);

      console.log(`Социальное восстановление настроено для ${trustedContacts.length} контактов`);
      console.log(`Порог для восстановления: ${Math.ceil(trustedContacts.length * 0.6)}`);

      return {
        success: true,
        contactsCount: trustedContacts.length,
        recoveryThreshold: Math.ceil(trustedContacts.length * 0.6)
      };
    } catch (error) {
      console.error('Ошибка настройки социального восстановления:', error);
      throw error;
    }
  }

  async initiateRecovery() {
    try {
      // Инициировать процесс восстановления
      const recoverySessionId = await this.keyManager.initiateRecovery();

      console.log(`Сессия восстановления создана: ${recoverySessionId}`);
      console.log('Попросите доверенные контакты предоставить свои шары восстановления');

      return recoverySessionId;
    } catch (error) {
      console.error('Ошибка инициации восстановления:', error);
      throw error;
    }
  }

  async recoverWallet(shares: string[]) {
    try {
      // Восстановить кошелек из шаров
      const recoveredPublicKey = await this.keyManager.recoverFromShares(shares);

      console.log(`Кошелек восстановлен: ${recoveredPublicKey.toBase58()}`);

      // Обновить кошелек с восстановленным ключом
      this.wallet.publicKey = recoveredPublicKey;

      return {
        success: true,
        publicKey: recoveredPublicKey.toBase58()
      };
    } catch (error) {
      console.error('Ошибка восстановления кошелька:', error);
      throw error;
    }
  }

  async backupWalletToIPFS() {
    try {
      // Создать бэкап кошелька
      const backupData = await this.keyManager.exportBackup();

      console.log('Бэкап создан успешно');

      // В реальном приложении загрузить на IPFS
      // const ipfsHash = await this.uploadToIPFS(backupData);

      return {
        success: true,
        backupSize: backupData.length,
        // ipfsHash
      };
    } catch (error) {
      console.error('Ошибка создания бэкапа:', error);
      throw error;
    }
  }
}

// Пример использования
const socialRecoveryExample = async () => {
  const wallet = new InvisibleWalletAdapter(
    { enableSocialRecovery: true },
    new Connection('https://api.mainnet-beta.solana.com')
  );

  const keyManager = new KeyManager({
    enableSocialRecovery: true,
  });

 const recoveryService = new SocialRecoveryService(wallet, keyManager);

  try {
    // Настроить социальное восстановление с 5 доверенными контактами
    const contacts = ['contact1', 'contact2', 'contact3', 'contact4', 'contact5'];
    const setupResult = await recoveryService.setupSocialRecovery(contacts);
    console.log('Результат настройки восстановления:', setupResult);

    // В случае потери доступа:
    // 1. Инициировать восстановление
    // const sessionId = await recoveryService.initiateRecovery();

    // 2. Собрать шары от доверенных контактов
    // const shares = await collectSharesFromContacts(sessionId);

    // 3. Восстановить кошелек
    // const recoveryResult = await recoveryService.recoverWallet(shares);
    // console.log('Результат восстановления:', recoveryResult);
  } catch (error) {
    console.error('Ошибка в примере социального восстановления:', error);
  }
};
```

## 3. Сценарии использования

### 3.1 E-commerce интеграция

```typescript
class EcommercePaymentService {
  private wallet: InvisibleWalletAdapter;
  private multiChainTx: MultiChainTransactionAbstraction;

  constructor(wallet: InvisibleWalletAdapter) {
    this.wallet = wallet;
    this.multiChainTx = new MultiChainTransactionAbstraction({
      supportedChains: ['solana', 'ethereum']
    });
  }

  async processPayment(
    recipient: string,
    amount: number,
    token: string,
    description: string
  ) {
    try {
      // Проверить баланс
      const balance = await this.wallet.getBalance();
      if (balance < amount) {
        throw new Error(`Недостаточно средств. Требуется: ${amount}, доступно: ${balance}`);
      }

      // Создать транзакцию перевода
      const transaction = await this.multiChainTx.createTransferTransaction(
        'solana', // или определить автоматически
        'solana', // для простоты в примере
        this.wallet.publicKey!.toBase58(),
        recipient,
        amount,
        token
      );

      // Добавить описание к транзакции
      transaction.description = description;

      // Выполнить транзакцию
      const result = await this.multiChainTx.executeTransaction(transaction);

      if (result.success) {
        console.log(`Платеж успешно обработан: ${result.transactionId}`);
        
        // Логировать транзакцию для учета
        this.logTransaction(transaction, result);
        
        return {
          success: true,
          transactionId: result.transactionId,
          amount: transaction.amount,
          token: transaction.token
        };
      } else {
        throw new Error(`Платеж не прошел: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка обработки платежа:', error);
      throw error;
    }
  }

  private logTransaction(transaction: any, result: any) {
    // Логировать транзакцию для аудита
    console.log('Транзакция E-commerce:', {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      token: transaction.token,
      from: transaction.from,
      to: transaction.to,
      timestamp: transaction.timestamp,
      status: result.status,
      fee: result.fee
    });
  }

  async processSubscriptionPayment(
    recipient: string,
    amount: number,
    token: string,
    interval: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ) {
    // В реальном приложении реализовать подписку
    // с автоматическими платежами
    console.log(`Настройка подписки: ${amount} ${token} every ${interval}`);
    
    // Для примера выполним один платеж
    return await this.processPayment(recipient, amount, token, `Subscription payment - ${interval}`);
  }
}

// Пример использования в e-commerce приложении
const ecommerceExample = async () => {
  const wallet = new InvisibleWalletAdapter(
    { supportedChains: ['solana'] },
    new Connection('https://api.mainnet-beta.solana.com')
  );

  await wallet.connect();

  const paymentService = new EcommercePaymentService(wallet);

  try {
    // Обработка платежа за товар
    const paymentResult = await paymentService.processPayment(
      'recipient_address',
      50.0, // 50 SOL
      'SOL',
      'Покупка товара #12345'
    );

    console.log('Результат платежа:', paymentResult);
  } catch (error) {
    console.error('Ошибка платежа:', error);
  }
};
```

### 3.2 Игровая интеграция

```typescript
class GameIntegrationService {
  private wallet: InvisibleWalletAdapter;
  private multiChainTx: MultiChainTransactionAbstraction;

  constructor(wallet: InvisibleWalletAdapter) {
    this.wallet = wallet;
    this.multiChainTx = new MultiChainTransactionAbstraction({
      supportedChains: ['solana', 'ethereum']
    });
  }

  async purchaseInGameItem(
    itemId: string,
    itemName: string,
    price: number,
    token: string
  ) {
    try {
      console.log(`Покупка игрового предмета: ${itemName} за ${price} ${token}`);

      // Выполнить платеж за игровой предмет
      const transaction = await this.multiChainTx.createTransferTransaction(
        'solana',
        'solana',
        this.wallet.publicKey!.toBase58(),
        'game_contract_address', // адрес игрового контракта
        price,
        token
      );

      // Добавить данные предмета к транзакции
      transaction.gameData = {
        itemId,
        itemName,
        purchaseType: 'in_game_item'
      };

      const result = await this.multiChainTx.executeTransaction(transaction);

      if (result.success) {
        console.log(`Предмет куплен успешно: ${itemName}`);
        
        // В реальном приложении: обновить инвентарь игрока
        this.updatePlayerInventory(itemId, itemName);
        
        return {
          success: true,
          transactionId: result.transactionId,
          itemId,
          itemName
        };
      } else {
        throw new Error(`Покупка не удалась: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка покупки игрового предмета:', error);
      throw error;
    }
  }

  async claimGameRewards(
    rewardAmount: number,
    rewardToken: string,
    gameId: string
  ) {
    try {
      console.log(`Получение игровых наград: ${rewardAmount} ${rewardToken}`);

      // В реальном приложении: вызвать игровой контракт для получения наград
      // или выполнить транзакцию получения наград
      
      // Для примера создадим транзакцию получения
      const transaction = await this.multiChainTx.createTransferTransaction(
        'solana',
        'solana',
        'game_contract_address', // игровой контракт отправляет награду
        this.wallet.publicKey!.toBase58(),
        rewardAmount,
        rewardToken
      );

      transaction.gameData = {
        gameId,
        rewardType: 'achievement',
        claimType: 'reward'
      };

      const result = await this.multiChainTx.executeTransaction(transaction);

      if (result.success) {
        console.log(`Награды получены: ${rewardAmount} ${rewardToken}`);
        return {
          success: true,
          transactionId: result.transactionId,
          amount: rewardAmount,
          token: rewardToken
        };
      } else {
        throw new Error(`Получение наград не удалось: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка получения игровых наград:', error);
      throw error;
    }
  }

  private updatePlayerInventory(itemId: string, itemName: string) {
    // Обновить локальный инвентарь игрока
    console.log(`Предмет добавлен в инвентарь: ${itemName} (${itemId})`);
    
    // В реальном приложении: сохранить в локальное хранилище или отправить на сервер
  }

  async participateInGameTournament(
    tournamentId: string,
    buyIn: number,
    token: string
  ) {
    try {
      console.log(`Участие в турнире: ${tournamentId}, взнос: ${buyIn} ${token}`);

      // Оплатить взнос за участие в турнире
      const transaction = await this.multiChainTx.createTransferTransaction(
        'solana',
        'solana',
        this.wallet.publicKey!.toBase58(),
        'tournament_contract_address',
        buyIn,
        token
      );

      transaction.gameData = {
        tournamentId,
        buyIn,
        participationType: 'tournament_entry'
      };

      const result = await this.multiChainTx.executeTransaction(transaction);

      if (result.success) {
        console.log(`Участие в турнире подтверждено: ${tournamentId}`);
        return {
          success: true,
          transactionId: result.transactionId,
          tournamentId
        };
      } else {
        throw new Error(`Участие в турнире не подтверждено: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка участия в турнире:', error);
      throw error;
    }
  }
}

// Пример использования в игровом приложении
const gameIntegrationExample = async () => {
  const wallet = new InvisibleWalletAdapter(
    { supportedChains: ['solana'] },
    new Connection('https://api.mainnet-beta.solana.com')
  );

  await wallet.connect();

  const gameService = new GameIntegrationService(wallet);

 try {
    // Покупка игрового предмета
    const purchaseResult = await gameService.purchaseInGameItem(
      'sword_001',
      'Эпический меч',
      10.0, // 10 SOL
      'SOL'
    );

    console.log('Результат покупки:', purchaseResult);

    // Получение наград
    const rewardsResult = await gameService.claimGameRewards(
      5.0, // 5 SOL
      'SOL',
      'game_123'
    );

    console.log('Результат получения наград:', rewardsResult);
  } catch (error) {
    console.error('Ошибка в игровой интеграции:', error);
  }
};
```

## 4. Часто задаваемые вопросы

### 4.1 Как безопасно хранить приватные ключи?

Invisible Wallet использует многоуровневую систему безопасности:

1. **Шифрование на устройстве**: Все ключи шифруются с использованием AES-256-GCM
2. **Детерминированная генерация**: Ключи генерируются на основе данных Telegram
3. **Социальное восстановление**: Возможность восстановления через доверенные контакты
4. **Резервное копирование**: Автоматическое резервное копирование на IPFS/Filecoin

```typescript
// Пример безопасного хранения
class SecureKeyStorage {
  static async storeEncryptedKey(plainKey: string, userId: string): Promise<string> {
    // Генерация соли
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Производные ключи
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(userId + salt),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    const cryptoKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 1000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Шифрование ключа
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      new TextEncoder().encode(plainKey)
    );
    
    // Возврат зашифрованных данных с метаданными
    return JSON.stringify({
      encrypted: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv),
      salt: Array.from(salt)
    });
  }
}
```

### 4.2 Как обрабатывать оффлайн сценарии?

Invisible Wallet обеспечивает полную оффлайн функциональность:

```typescript
class OfflineTransactionManager {
  private pendingTransactions: any[] = [];
  private isOnline: boolean = true;

  constructor() {
    // Проверка статуса подключения
    this.checkConnectivity();
  }

  private checkConnectivity() {
    // В браузере
    if (typeof window !== 'undefined' && 'navigator' in window) {
      this.isOnline = navigator.onLine;
      
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processPendingTransactions();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

 async createOfflineTransaction(transactionData: any) {
    const transaction = {
      ...transactionData,
      id: this.generateTransactionId(),
      status: this.isOnline ? 'pending' : 'offline_pending',
      timestamp: Date.now()
    };

    if (this.isOnline) {
      // Отправить транзакцию немедленно
      return await this.sendTransaction(transaction);
    } else {
      // Сохранить для последующей отправки
      this.pendingTransactions.push(transaction);
      await this.savePendingTransactions();
      return transaction;
    }
  }

  private async processPendingTransactions() {
    if (!this.isOnline || this.pendingTransactions.length === 0) {
      return;
    }

    const transactionsToSend = [...this.pendingTransactions];
    this.pendingTransactions = [];

    for (const transaction of transactionsToSend) {
      try {
        const result = await this.sendTransaction(transaction);
        console.log(`Транзакция отправлена: ${result.id}`);
      } catch (error) {
        console.error('Ошибка отправки оффлайн транзакции:', error);
        // Возврат транзакции в очередь
        this.pendingTransactions.push(transaction);
      }
    }

    await this.savePendingTransactions();
  }

  private async savePendingTransactions() {
    // Сохранение в локальное хранилище
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        'pending_transactions',
        JSON.stringify(this.pendingTransactions)
      );
    }
  }

  private generateTransactionId(): string {
    return 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private async sendTransaction(transaction: any) {
    // Реальная отправка транзакции в блокчейн
    // В примере возвращаем транзакцию как есть
    return transaction;
  }
}
```

### 4.3 Как интегрировать с Telegram Stars?

Интеграция с Telegram Stars включает несколько шагов:

1. **Получение баланса Stars**
2. **Конвертация Stars в токены**
3. **Выполнение покупок через Stars**

```typescript
class TelegramStarsIntegration {
  private starsManager: any; // TelegramStarsManager

  async initializeStarsIntegration() {
    // Инициализация с Telegram данными
    this.starsManager = new TelegramStarsManager({
      telegramUserId: this.getTelegramUserId(),
      telegramInitData: this.getTelegramInitData(),
    });
  }

  private getTelegramUserId(): string | null {
    // Получение userId из Telegram WebApp данных
    if (typeof window !== 'undefined' && window.Telegram) {
      return window.Telegram.WebApp.initDataUnsafe?.user?.id?.toString() || null;
    }
    return null;
  }

  private getTelegramInitData(): string {
    // Получение initData из Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram) {
      return window.Telegram.WebApp.initData || '';
    }
    return '';
  }

  async purchaseWithStars(
    amount: number,
    description: string,
    targetToken: string
 ): Promise<any> {
    try {
      // Проверка баланса
      const balance = await this.starsManager.getStarsBalance();
      if (balance < amount) {
        throw new Error(`Недостаточно Stars. Баланс: ${balance}, требуется: ${amount}`);
      }

      // Выполнение покупки
      const purchaseResult = await this.starsManager.purchaseWithStars(
        amount,
        description
      );

      if (purchaseResult.success) {
        // Конвертация в целевой токен
        if (targetToken !== 'Stars') {
          const conversionResult = await this.starsManager.convertStarsToSol(amount);
          if (conversionResult.success) {
            return {
              success: true,
              convertedAmount: conversionResult.toAmount,
              targetToken,
              starsUsed: amount,
              transactionId: purchaseResult.transactionId
            };
          }
        }

        return purchaseResult;
      } else {
        throw new Error(`Покупка не удалась: ${purchaseResult.error}`);
      }
    } catch (error) {
      console.error('Ошибка покупки через Stars:', error);
      throw error;
    }
  }
}
```

## 5. Код-сниппеты

### 5.1 Базовая инициализация кошелька

```typescript
import { InvisibleWalletAdapter } from './src/components/wallet/invisible-wallet-adapter';
import { Connection } from '@solana/web3.js';

// Инициализация кошелька
const wallet = new InvisibleWalletAdapter(
  {
    // Конфигурация безопасности
    enableBiometric: true,
    enableSocialRecovery: true,
    trustedContacts: ['contact1', 'contact2', 'contact3'],
    
    // Поддерживаемые цепи
    supportedChains: ['solana', 'ethereum'],
    
    // Оффлайн режим
    enableOffline: true,
    cacheDuration: 300000, // 5 минут
    
    // Аналитика
    enableAnalytics: true,
    analyticsEndpoint: 'https://analytics.example.com'
  },
  new Connection('https://api.mainnet-beta.solana.com')
);

// Подключение к кошельку
await wallet.connect();

// Проверка подключения
if (wallet.connected) {
  console.log('Кошелек подключен');
  console.log('Адрес:', wallet.publicKey?.toBase58());
}
```

### 5.2 Выполнение транзакции

```typescript
import { Transaction, SystemProgram } from '@solana/web3.js';

// Создание транзакции
const transaction = new Transaction();
transaction.add(
  SystemProgram.transfer({
    fromPubkey: wallet.publicKey!,
    toPubkey: new PublicKey('recipient_address'),
    lamports: 1000000, // 0.001 SOL
  })
);

try {
  // Подпись транзакции
  const signedTransaction = await wallet.signTransaction(transaction);
  
  // Отправка транзакции
 const signature = await wallet.sendTransaction(signedTransaction);
  
  console.log('Транзакция отправлена:', signature);
} catch (error) {
  console.error('Ошибка транзакции:', error);
}
```

### 5.3 Многоуровневое управление интерфейсом

```tsx
import React, { useState } from 'react';

const ProgressiveDisclosureUI: React.FC = () => {
  const [level, setLevel] = useState<'basic' | 'intermediate' | 'advanced' | 'expert'>('basic');

  return (
    <div className="progressive-disclosure-ui">
      {/* Основная информация - всегда видна */}
      <div className="basic-info">
        <h3>Баланс: {walletBalance} SOL</h3>
        <p>Адрес: {walletAddress}</p>
      </div>

      {/* Промежуточный уровень */}
      {level !== 'basic' && (
        <div className="intermediate-info">
          <h4>Детали транзакций</h4>
          <div className="transaction-details">
            {/* Детали транзакций */}
          </div>
        </div>
      )}

      {/* Продвинутый уровень */}
      {level === 'advanced' || level === 'expert' && (
        <div className="advanced-controls">
          <h4>Продвинутые настройки</h4>
          <div className="advanced-settings">
            {/* Продвинутые настройки */}
          </div>
        </div>
      )}

      {/* Экспертный уровень */}
      {level === 'expert' && (
        <div className="expert-tools">
          <h4>Инструменты разработчика</h4>
          <div className="developer-tools">
            {/* Инструменты разработчика */}
          </div>
        </div>
      )}

      <div className="level-controls">
        <button onClick={() => setLevel('basic')}>Базовый</button>
        <button onClick={() => setLevel('intermediate')}>Промежуточный</button>
        <button onClick={() => setLevel('advanced')}>Продвинутый</button>
        <button onClick={() => setLevel('expert')}>Эксперт</button>
      </div>
    </div>
  );
};
```

## Заключение

Примеры использования Invisible Wallet демонстрируют гибкость и мощность архитектуры кошелька. От простой интеграции до сложных многоцепочных операций, Invisible Wallet обеспечивает безопасное и удобное взаимодействие с Web3.

Ключевые преимущества:
- Простота интеграции существующими приложениями
- Поддержка многоцепочных операций
- Встроенная безопасность и социальное восстановление
- Оффлайн функциональность
- Интеграция с Telegram и Telegram Stars
- Прогрессивное раскрытие интерфейса

Для успешной интеграции рекомендуется следовать лучшим практикам безопасности, использовать предоставленные API и следить за обновлениями документации.