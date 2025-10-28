# Руководство по интеграции с Telegram

## Введение

Invisible Wallet тесно интегрирован с экосистемой Telegram, что позволяет пользователям использовать кошелек через Telegram Mini App и оплачивать транзакции с помощью Telegram Stars. Это руководство описывает все аспекты интеграции с Telegram, включая работу с Telegram WebApp API, Telegram Stars и меры безопасности в Telegram среде.

### Основные возможности интеграции

- **Telegram Mini App**: Полнофункциональный кошелек в виде Telegram Mini App
- **Telegram Stars**: Покупка токенов и оплата комиссий через Telegram Stars
- **Telegram WebApp API**: Использование всех возможностей Telegram WebApp
- **Безопасная аутентификация**: Использование данных Telegram для идентификации
- **Уведомления**: Отправка уведомлений через Telegram

## Интеграция с Telegram Mini App

### Создание Telegram Mini App

Для создания Telegram Mini App с Invisible Wallet:

1. **Создание бота**:
   - Создайте нового бота через @BotFather
   - Установите имя, описание и аватар
   - Получите токен бота

2. **Настройка Mini App**:
   - Загрузите ваше веб-приложение на хостинг
   - Убедитесь, что приложение доступно по HTTPS
   - Настройте domain в настройках бота

3. **Интеграция Invisible Wallet**:
   - Используйте Telegram WebApp API для получения данных пользователя
   - Инициализируйте Invisible Wallet с полученными данными

### Пример интеграции

```html
<!DOCTYPE html>
<html>
<head>
    <title>Invisible Wallet Telegram Mini App</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.js"></script>
</head>
<body>
    <div id="app">
        <div id="wallet-container"></div>
        <div id="stars-balance"></div>
        <button id="buy-with-stars">Купить с помощью Stars</button>
    </div>

    <script>
        // Инициализация Telegram WebApp
        const tg = window.Telegram.WebApp;
        
        // Установка цветовой схемы
        document.body.style.backgroundColor = tg.backgroundColor;
        
        // Получение данных пользователя
        const user = tg.initDataUnsafe?.user;
        if (!user) {
            alert('Не удалось получить данные пользователя');
            return;
        }
        
        // Инициализация Invisible Wallet
        const wallet = new InvisibleWalletAdapter(
            {
                telegramUserId: user.id.toString(),
                telegramInitData: window.Telegram.WebApp.initData,
                enableSocialRecovery: true,
                supportedChains: ['solana', 'ethereum'],
                enableOffline: true,
            },
            new solana.Connection('https://api.mainnet-beta.solana.com')
        );
        
        // Подключение к кошельку
        wallet.connect()
            .then(() => {
                console.log('Кошелек подключен');
                updateUI();
            })
            .catch(error => {
                console.error('Ошибка подключения:', error);
            });
        
        // Функция обновления UI
        function updateUI() {
            document.getElementById('wallet-container').innerHTML = `
                <p>Адрес: ${wallet.publicKey.toBase58()}</p>
                <p>Баланс: ${wallet.getBalance()} SOL</p>
            `;
        }
        
        // Обработка покупки с помощью Stars
        document.getElementById('buy-with-stars').addEventListener('click', async () => {
            try {
                // Проверка баланса Stars
                const starsBalance = await getStarsBalance();
                if (starsBalance < 100) {
                    tg.showAlert('Недостаточно Stars для покупки');
                    return;
                }
                
                // Запуск процесса покупки
                const result = await tg.CloudStorage.runMethod('buy_stars', {
                    amount: 100,
                    description: 'Покупка токенов через Invisible Wallet'
                });
                
                if (result.ok) {
                    tg.showAlert('Покупка прошла успешно!');
                } else {
                    tg.showAlert('Ошибка покупки: ' + result.error);
                }
            } catch (error) {
                console.error('Ошибка покупки:', error);
                tg.showAlert('Ошибка покупки: ' + error.message);
            }
        });
        
        // Функция получения баланса Stars
        async function getStarsBalance() {
            try {
                const result = await tg.CloudStorage.runMethod('get_stars_balance', {});
                return result.balance || 0;
            } catch (error) {
                console.error('Ошибка получения баланса Stars:', error);
                return 0;
            }
        }
    </script>
</body>
</html>
```

## Работа с Telegram Stars

### Основные возможности

Telegram Stars - это внутренняя валюта Telegram, которая может использоваться для покупки цифровых товаров и услуг. Invisible Wallet интегрирован с системой Telegram Stars, позволяя:

- Покупать криптотокены за Stars
- Оплачивать комиссии за транзакции
- Конвертировать Stars в основные токены
- Отслеживать баланс Stars

### API для работы с Stars

#### Получение баланса Stars

```typescript
interface TelegramStarsManager {
  getStarsBalance(): Promise<number>;
  purchaseWithStars(amount: number, description: string): Promise<PurchaseResult>;
  convertStarsToSol(starsAmount: number): Promise<ConversionResult>;
}

interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  starsAmount?: number;
  convertedAmount?: number;
}

interface ConversionResult {
  success: boolean;
  fromAmount: number;
  toAmount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  fee: number;
  error?: string;
}
```

#### Пример использования

```typescript
import { TelegramStarsManager } from './src/integrations/telegram-stars';

const starsManager = new TelegramStarsManager({
  telegramUserId: 'user_id',
  telegramInitData: 'init_data',
});

// Получение баланса Stars
const starsBalance = await starsManager.getStarsBalance();
console.log('Баланс Stars:', starsBalance);

// Покупка токенов за Stars
const purchaseResult = await starsManager.purchaseWithStars(
  500, // количество Stars
  'Покупка SOL через Invisible Wallet'
);

if (purchaseResult.success) {
  console.log('Покупка успешна:', purchaseResult.convertedAmount, 'SOL');
} else {
  console.error('Ошибка покупки:', purchaseResult.error);
}

// Конвертация Stars в SOL
const conversionResult = await starsManager.convertStarsToSol(1000);
if (conversionResult.success) {
  console.log('Конвертация успешна:', conversionResult.toAmount, 'SOL');
}
```

### Конфигурация Stars

```typescript
interface TelegramStarsConfig {
  // Настройки интеграции
  telegramUserId: string;
  telegramInitData: string;
  
  // Настройки конвертации
  conversionRates: Map<string, number>; // Курсы конвертации
  minConversionAmount: number; // Минимальная сумма конвертации
  maxConversionAmount: number; // Максимальная сумма конвертации
  
  // Настройки комиссии
  conversionFee: number; // Комиссия за конвертацию
  starsToTokenRatio: number; // Соотношение Stars к токенам
  
  // Настройки безопасности
  enableConversion: boolean; // Включить конвертацию
  conversionLimit: number; // Лимит конвертации в день
}
```

## Использование Telegram WebApp API

### Основные функции WebApp API

Telegram WebApp API предоставляет доступ к различным возможностям Telegram:

#### 1. Получение данных пользователя

```javascript
// Получение данных пользователя
const user = window.Telegram.WebApp.initDataUnsafe?.user;
if (user) {
  console.log('ID пользователя:', user.id);
  console.log('Имя:', user.first_name);
  console.log('Фамилия:', user.last_name);
  console.log('Имя пользователя:', user.username);
  console.log('Язык:', user.language_code);
}
```

#### 2. Управление интерфейсом

```javascript
// Установка цветовой схемы
window.Telegram.WebApp.setBackgroundColor('#ffffff');
window.Telegram.WebApp.setHeaderColor('#0078ff');

// Управление кнопкой расширения
window.Telegram.WebApp.expand();

// Управление кнопкой подтверждения
window.Telegram.WebApp.MainButton.setText('Подтвердить');
window.Telegram.WebApp.MainButton.show();
window.Telegram.WebApp.MainButton.onClick(() => {
  // Обработка нажатия
});
```

#### 3. Работа с уведомлениями

```javascript
// Показ уведомления
window.Telegram.WebApp.showAlert('Сообщение');

// Показ подтверждения
window.Telegram.WebApp.showConfirm('Вы уверены?', (confirmed) => {
  if (confirmed) {
    // Подтверждено
  } else {
    // Отменено
  }
});
```

#### 4. Работа с Cloud Storage

```javascript
// Сохранение данных в Cloud Storage
window.Telegram.WebApp.CloudStorage.setItem('key', 'value', (error) => {
  if (error) {
    console.error('Ошибка сохранения:', error);
  } else {
    console.log('Данные сохранены');
  }
});

// Получение данных из Cloud Storage
window.Telegram.WebApp.CloudStorage.getItem('key', (error, value) => {
  if (error) {
    console.error('Ошибка получения:', error);
 } else {
    console.log('Значение:', value);
  }
});
```

### Интеграция с Invisible Wallet через WebApp API

```typescript
class TelegramWalletIntegration {
  private webApp: any;
  private wallet: InvisibleWalletAdapter;

  constructor(wallet: InvisibleWalletAdapter) {
    this.webApp = window.Telegram.WebApp;
    this.wallet = wallet;
    
    // Инициализация WebApp
    this.webApp.ready();
    this.setupWebAppInterface();
  }

  private setupWebAppInterface() {
    // Установка цветовой схемы
    this.webApp.setBackgroundColor(this.webApp.themeParams.bg_color);
    this.webApp.setHeaderColor(this.webApp.themeParams.accent_text_color);
    
    // Управление кнопкой основного действия
    this.webApp.MainButton.setText('Подключить кошелек');
    this.webApp.MainButton.show();
    this.webApp.MainButton.onClick(() => {
      this.connectWallet();
    });
  }

 async connectWallet() {
    try {
      // Инициализация с данными Telegram
      const user = this.webApp.initDataUnsafe?.user;
      if (!user) {
        throw new Error('Не удалось получить данные пользователя');
      }

      // Настройка кошелька с данными Telegram
      this.wallet.config.telegramUserId = user.id.toString();
      this.wallet.config.telegramInitData = this.webApp.initData;

      // Подключение кошельку
      await this.wallet.connect();
      
      // Обновление интерфейса
      this.updateInterface();
    } catch (error) {
      this.webApp.showAlert(`Ошибка подключения: ${error.message}`);
    }
  }

  private updateInterface() {
    // Скрытие основной кнопки
    this.webApp.MainButton.hide();
    
    // Показ информации о кошельке
    this.webApp.showAlert('Кошелек успешно подключен!');
  }
}
```

## Безопасность в Telegram среде

### 1. Аутентификация через Telegram

#### Проверка initData

Для обеспечения безопасности все запросы к Invisible Wallet должны проверять подлинность данных Telegram:

```typescript
class TelegramAuthValidator {
  static async validateInitData(initData: string, botToken: string): Promise<boolean> {
    if (!initData) {
      throw new Error('initData отсутствует');
    }

    // Разбор initData
    const params = new URLSearchParams(initData);
    const authDate = parseInt(params.get('auth_date') || '0');
    const hash = params.get('hash');
    
    if (!hash) {
      throw new Error('Хэш отсутствует');
    }

    // Проверка времени (не более 1 часа)
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 3600) {
      throw new Error('Данные аутентификации устарели');
    }

    // Подготовка строки для проверки
    const checkString = Array.from(params.entries())
      .filter(([key]) => key !== 'hash')
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join('\n');

    // Создание секретного ключа
    const secretKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(botToken))
      ),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Вычисление хэша
    const computedHash = await crypto.subtle.sign(
      'HMAC',
      secretKey,
      new TextEncoder().encode(checkString)
    );

    // Преобразование в шестнадцатеричный формат
    const computedHashHex = Array.from(new Uint8Array(computedHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Сравнение хэшей
    return computedHashHex === hash;
  }
}
```

### 2. Защита от подделки данных

#### Валидация пользовательских данных

```typescript
class UserDataValidator {
  static validateUser(userData: any): boolean {
    if (!userData || typeof userData !== 'object') {
      return false;
    }

    // Проверка обязательных полей
    if (!userData.id || typeof userData.id !== 'number') {
      return false;
    }

    // Проверка диапазона ID
    if (userData.id <= 0 || userData.id > 9999999) {
      return false;
    }

    // Проверка строковых полей
    const stringFields = ['first_name', 'last_name', 'username'];
    for (const field of stringFields) {
      if (userData[field] !== undefined) {
        if (typeof userData[field] !== 'string' || userData[field].length > 255) {
          return false;
        }
      }
    }

    // Проверка языкового кода
    if (userData.language_code) {
      if (typeof userData.language_code !== 'string' || userData.language_code.length !== 2) {
        return false;
      }
    }

    return true;
  }
}
```

### 3. Защита от CSRF атак

#### Использование токенов с ограниченным временем жизни

```typescript
class CsrfProtection {
  private static readonly TOKEN_LIFETIME = 3600000; // 1 час

  static generateToken(): string {
    const token = crypto.getRandomValues(new Uint8Array(32));
    const timestamp = Date.now();
    
    return btoa(JSON.stringify({
      token: Array.from(token),
      timestamp
    }));
  }

  static validateToken(token: string): boolean {
    try {
      const parsed = JSON.parse(atob(token));
      const { token: tokenBytes, timestamp } = parsed;
      
      if (Date.now() - timestamp > this.TOKEN_LIFETIME) {
        return false;
      }

      // Проверка токена (в реальном приложении - сравнение с сохраненным)
      return tokenBytes && tokenBytes.length === 32;
    } catch {
      return false;
    }
  }
}
```

### 4. Безопасность при работе с Stars

#### Ограничение частоты операций

```typescript
class StarsRateLimiter {
  private static readonly LIMIT_PER_HOUR = 10;
  private static readonly LIMIT_PER_DAY = 100;
  
  private static readonly requests = new Map<string, Array<number>>();

  static async checkRateLimit(userId: string): Promise<{ allowed: boolean; resetTime?: number }> {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Удаление устаревших запросов (старше 1 часа)
    const hourAgo = now - 3600000;
    const validRequests = userRequests.filter(time => time > hourAgo);
    
    if (validRequests.length >= this.LIMIT_PER_HOUR) {
      return {
        allowed: false,
        resetTime: validRequests[0] + 3600000
      };
    }

    // Добавление текущего запроса
    validRequests.push(now);
    this.requests.set(userId, validRequests);

    return { allowed: true };
  }
}
```

### 5. Защита от фишинга в Telegram среде

#### Проверка доменов и URL

```typescript
class PhishingProtection {
  private static readonly TRUSTED_DOMAINS = [
    't.me',
    'web.telegram.org',
    'telegram.org',
    // Домены вашего приложения
  ];

  static isTrustedDomain(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return this.TRUSTED_DOMAINS.includes(parsedUrl.hostname);
    } catch {
      return false;
    }
  }

  static async checkPhishingAddress(address: string): Promise<boolean> {
    // Проверка адреса на включение в черный список
    // В реальном приложении - запрос к сервису проверки
    return false; // Пока возвращаем false, в реальном приложении будет проверка
  }
}
```

## Примеры использования

### 1. Создание Telegram Mini App с покупкой токенов за Stars

```typescript
class TelegramStarsApp {
  private wallet: InvisibleWalletAdapter;
  private starsManager: TelegramStarsManager;
  private webApp: any;

  constructor() {
    this.webApp = window.Telegram.WebApp;
    this.setupApp();
  }

  private async setupApp() {
    this.webApp.ready();
    
    // Инициализация кошелька
    this.wallet = new InvisibleWalletAdapter(
      {
        telegramUserId: this.webApp.initDataUnsafe?.user?.id?.toString(),
        telegramInitData: this.webApp.initData,
        enableSocialRecovery: true,
        supportedChains: ['solana'],
      },
      new solana.Connection('https://api.mainnet-beta.solana.com')
    );

    // Инициализация менеджера Stars
    this.starsManager = new TelegramStarsManager({
      telegramUserId: this.webApp.initDataUnsafe?.user?.id?.toString(),
      telegramInitData: this.webApp.initData,
    });

    await this.initializeUI();
 }

  private async initializeUI() {
    // Обновление баланса
    await this.updateBalance();
    
    // Установка обработчиков
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Кнопка покупки за Stars
    document.getElementById('buy-with-stars')?.addEventListener('click', async () => {
      await this.handleStarsPurchase();
    });

    // Кнопка отправки токенов
    document.getElementById('send-tokens')?.addEventListener('click', async () => {
      await this.handleTokenSend();
    });
  }

  private async handleStarsPurchase() {
    try {
      // Проверка баланса Stars
      const starsBalance = await this.starsManager.getStarsBalance();
      if (starsBalance < 100) {
        this.webApp.showAlert('Недостаточно Stars для покупки');
        return;
      }

      // Запрос суммы покупки
      const amount = parseInt(prompt('Введите количество Stars для покупки:') || '0');
      if (amount <= 0 || amount > starsBalance) {
        this.webApp.showAlert('Неверная сумма');
        return;
      }

      // Подтверждение покупки
      const confirmed = await this.showConfirm(
        `Купить ${amount} Stars за токены?`
      );
      
      if (!confirmed) return;

      // Выполнение покупки
      const result = await this.starsManager.purchaseWithStars(
        amount,
        'Покупка токенов через Invisible Wallet'
      );

      if (result.success) {
        this.webApp.showAlert(`Покупка успешна! Получено: ${result.convertedAmount} токенов`);
        await this.updateBalance();
      } else {
        this.webApp.showAlert(`Ошибка покупки: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка покупки:', error);
      this.webApp.showAlert(`Ошибка покупки: ${error.message}`);
    }
  }

  private async updateBalance() {
    try {
      const balance = await this.wallet.getBalance();
      const starsBalance = await this.starsManager.getStarsBalance();
      
      document.getElementById('balance')!.textContent = `Баланс: ${balance} SOL`;
      document.getElementById('stars-balance')!.textContent = `Stars: ${starsBalance}`;
    } catch (error) {
      console.error('Ошибка обновления баланса:', error);
    }
  }

  private showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.webApp.showConfirm(message, (confirmed) => {
        resolve(confirmed);
      });
    });
  }

  private async handleTokenSend() {
    try {
      const recipient = prompt('Введите адрес получателя:');
      if (!recipient) return;

      const amount = parseFloat(prompt('Введите сумму:') || '0');
      if (amount <= 0) {
        this.webApp.showAlert('Неверная сумма');
        return;
      }

      // Создание транзакции
      const transaction = new solana.Transaction();
      transaction.add(
        solana.SystemProgram.transfer({
          fromPubkey: this.wallet.publicKey!,
          toPubkey: new solana.PublicKey(recipient),
          lamports: amount * solana.LAMPORTS_PER_SOL,
        })
      );

      // Отправка транзакции
      const signature = await this.wallet.sendTransaction(transaction);
      
      this.webApp.showAlert(`Транзакция отправлена: ${signature}`);
      await this.updateBalance();
    } catch (error) {
      console.error('Ошибка отправки:', error);
      this.webApp.showAlert(`Ошибка отправки: ${error.message}`);
    }
  }
}

// Инициализация приложения
new TelegramStarsApp();
```

### 2. Интеграция с уведомлениями Telegram

```typescript
class TelegramNotificationService {
  private webApp: any;

  constructor() {
    this.webApp = window.Telegram.WebApp;
  }

  async sendNotification(message: string) {
    // В Telegram Mini App уведомления отправляются через бота
    // Это пример для демонстрации
    this.webApp.showAlert(message);
  }

  async requestNotificationPermission(): Promise<boolean> {
    // В Telegram Mini App уведомления обрабатываются через бота
    // Запрос разрешения на отправку сообщений через бота
    return new Promise((resolve) => {
      this.webApp.showConfirm(
        'Разрешить боту отправлять вам уведомления о транзакциях?',
        (confirmed) => {
          resolve(confirmed);
        }
      );
    });
  }

  async subscribeToTransactionNotifications() {
    // Подписка на события транзакций
    this.wallet.on('transaction', (data) => {
      const status = data.status === 'confirmed' ? 'успешна' : 'не успешна';
      this.sendNotification(`Транзакция ${status}: ${data.id}`);
    });
  }
}
```

## Лучшие практики

### 1. Обработка ошибок

```typescript
class TelegramErrorHandler {
  static handleTelegramError(error: any) {
    console.error('Ошибка Telegram:', error);
    
    // Показ пользовательского сообщения об ошибке
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert(`Произошла ошибка: ${error.message}`);
    } else {
      alert(`Произошла ошибка: ${error.message}`);
    }
  }

  static handleWalletError(error: any) {
    console.error('Ошибка кошелька:', error);
    
    // Показ специфичного сообщения для разных типов ошибок
    let message = 'Произошла ошибка';
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      message = 'Недостаточно средств';
    } else if (error.code === 'TRANSACTION_REJECTED') {
      message = 'Транзакция отклонена';
    } else if (error.code === 'NETWORK_ERROR') {
      message = 'Ошибка сети';
    }
    
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert(message);
    }
  }
}
```

### 2. Оптимизация производительности

```typescript
class TelegramPerformanceOptimizer {
  private static readonly CACHE_DURATION = 300000; // 5 минут
  private cache = new Map<string, { data: any; timestamp: number }>();

  async getCachedData(key: string, fetcher: () => Promise<any>) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
 }

  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }
}
```

### 3. Обработка оффлайн сценариев

```typescript
class TelegramOfflineHandler {
  private isOnline: boolean = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOffline();
    });
  }

  private handleOnline() {
    console.log('Соединение восстановлено');
    // Повторная синхронизация данных
    this.resyncPendingTransactions();
  }

  private handleOffline() {
    console.log('Подключение потеряно');
    // Переключение в оффлайн режим
    this.switchToOfflineMode();
  }

  private async resyncPendingTransactions() {
    // Синхронизация отложенных транзакций
  }

  private switchToOfflineMode() {
    // Отключение функций, требующих подключения
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert('Подключение к интернету потеряно. Некоторые функции недоступны.');
    }
  }
}
```

## Заключение

Интеграция Invisible Wallet с Telegram предоставляет мощную и безопасную платформу для работы с криптовалютами через Telegram Mini App. Использование Telegram WebApp API, Telegram Stars и встроенных механизмов безопасности позволяет создавать удобные и защищенные приложения для пользователей Telegram.

Ключевые аспекты успешной интеграции:
- Правильная аутентификация через Telegram initData
- Безопасная обработка данных пользователя
- Эффективная работа с Telegram Stars
- Использование возможностей WebApp API
- Соблюдение рекомендаций по безопасности

Следуя этому руководству, вы сможете создать полнофункциональное и безопасное приложение, которое максимально использует возможности экосистемы Telegram.