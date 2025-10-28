import { 
  InvisibleWalletAdapter, 
  InvisibleWalletConfig, 
  InvisibleWalletEvent,
  WalletEventData,
  EventHandler,
  EventHandlerMap,
  KeyPair,
  PendingTransaction,
  PurchaseResult,
  RecoverySession,
  TelegramContact,
  InvisibleWalletError,
  KeyManager,
  SessionManager,
  OfflineManager,
  TelegramStarsBridge,
  RecoverySystem,
  SecurityManager
} from "@/types/wallet";
import { PublicKey, Transaction } from "@solana/web3.js";
import { WalletAdapter, WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { KeyManagerImpl } from "@/lib/wallet/key-manager";
import { getInvisibleWalletConfig } from "@/lib/wallet/config";
import { TelegramUtils, ErrorUtils } from "@/lib/wallet/utils";
import { TelegramStarsBridge } from "@/lib/wallet/telegram-stars-bridge";
import { logger } from "@/lib/utils/logger";
import { SessionManagerImpl } from "@/lib/wallet/session-manager";
import { RecoverySystemImpl } from "@/lib/wallet/recovery-system";
import { TelegramContactsManager } from "@/lib/wallet/telegram-contacts";
import { AuthManager } from "@/lib/wallet/auth-manager";
import { SecurityManager } from "@/components/wallet/security-manager";

/**
 * Основной адаптер для Invisible Wallet
 */
export class InvisibleWalletAdapterImpl implements InvisibleWalletAdapter, WalletAdapter {
  private config: InvisibleWalletConfig;
  private keyManager: KeyManager;
 private sessionManager: SessionManagerImpl;
  private offlineManager: OfflineManager;
  private starsBridge: TelegramStarsBridge;
  private recoverySystem: RecoverySystemImpl;
  private securityManager: SecurityManager;
  private contactsManager: TelegramContactsManager;
  private authManager: AuthManager;
 private eventHandlers: EventHandlerMap = {};
  private isInitializedFlag: boolean = false;
  private connectedFlag: boolean = false;
  private publicKeyValue: PublicKey | null = null;
  private autoConnecting: boolean = false;
  
  // Свойства для совместимости с WalletAdapter
  name: string = 'Invisible Wallet';
  url: string = 'https://normaldance.com';
  icon: string = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwNjZDQyIvPgo8cGF0aCBkPSJNOCAxNkwxNiA4TDI0IDE2TDE2IDI0TDggMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
  supportedTransactionVersions: Set<string> = new Set(['legacy', '0']);
  
  constructor(config?: Partial<InvisibleWalletConfig>) {
    this.config = config || getInvisibleWalletConfig();
    this.initializeComponents();
  }
  
  /**
   * Инициализация компонентов
   */
  private initializeComponents(): void {
    this.keyManager = new KeyManagerImpl(this.config.keyConfig);
    // Инициализируем нашу реализацию TelegramStarsBridge
    this.starsBridge = new TelegramStarsBridge();
    // В реальной реализации здесь будут инициализированы другие компоненты
    this.sessionManager = new SessionManagerImpl(this.config.sessionConfig);
    this.recoverySystem = new RecoverySystemImpl(this.config.recoveryConfig);
    this.contactsManager = new TelegramContactsManager();
    this.authManager = new AuthManager();
    this.securityManager = new SecurityManager(this.config);
  }
  
  /**
   * Инициализация Invisible Wallet
   */
  async initialize(config?: InvisibleWalletConfig): Promise<void> {
    try {
      logger.info("Initializing Invisible Wallet");
      
      if (config) {
        this.config = config;
        this.initializeComponents();
      }
      
      // Инициализация компонентов
      await this.keyManager.initialize();
      await this.sessionManager.initialize();
      // await this.offlineManager.initialize();
      // await this.starsBridge.initialize();
      await this.recoverySystem.initialize();
      await this.contactsManager.initialize();
      await this.authManager.initialize();
      // await this.securityManager.initialize();
      
      // Автоматическое подключение
      await this.autoConnect();
      
      this.isInitializedFlag = true;
      this.emit(InvisibleWalletEvent.INITIALIZED);
      
      logger.info("Invisible Wallet initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Invisible Wallet", error as Error);
      throw new InvisibleWalletError("Failed to initialize Invisible Wallet", "INITIALIZATION_ERROR", { error });
    }
  }
  
  /**
   * Проверка инициализации
   */
  isInitialized(): boolean {
    return this.isInitializedFlag;
  }
  
  /**
   * Автоматическое подключение
   */
  async autoConnect(): Promise<void> {
    if (this.autoConnecting) {
      return;
    }
    
    this.autoConnecting = true;
    
    try {
      logger.info("Auto-connecting Invisible Wallet");
      
      // Проверка нахождения в Telegram
      if (!TelegramUtils.isTelegramWebApp()) {
        throw new InvisibleWalletError("Invisible Wallet requires Telegram WebApp", "NOT_TELEGRAM_WEBAPP");
      }
      
      // Инициализация Telegram WebApp
      TelegramUtils.initTelegramWebApp();
      
      // Получение пользователя Telegram
      const telegramUser = TelegramUtils.getTelegramUser();
      if (!telegramUser) {
        throw new InvisibleWalletError("Telegram user not available", "TELEGRAM_USER_NOT_AVAILABLE");
      }
      
      // Попытка получить существующую ключевую пару
      let keyPair = await this.keyManager.retrieveKeyPair();
      
      if (!keyPair) {
        // Генерация новой ключевой пары на основе Telegram ID
        logger.info("No existing key pair found, generating new one");
        keyPair = await this.keyManager.deriveFromTelegram(telegramUser.id);
        this.emit(InvisibleWalletEvent.KEYS_GENERATED, { publicKey: keyPair.publicKey.toBase58() });
      }
      
      // Установка публичного ключа
      this.publicKeyValue = keyPair.publicKey;
      this.connectedFlag = true;
      
      this.emit(InvisibleWalletEvent.AUTO_CONNECTED, { 
        publicKey: keyPair.publicKey.toBase58(),
        telegramId: telegramUser.id
      });
      
      logger.info("Invisible Wallet auto-connected successfully", { 
        publicKey: keyPair.publicKey.toBase58() 
      });
    } catch (error) {
      logger.error("Failed to auto-connect Invisible Wallet", error as Error);
      throw new InvisibleWalletError("Failed to auto-connect Invisible Wallet", "AUTO_CONNECT_ERROR", { error });
    } finally {
      this.autoConnecting = false;
    }
  }
  
  /**
   * Тихое подключение (без ошибок)
   */
  async silentConnect(): Promise<boolean> {
    try {
      await this.autoConnect();
      return true;
    } catch (error) {
      logger.error("Silent connect failed", error as Error);
      return false;
    }
  }
  
  /**
   * Подключение кошелька (для совместимости с WalletAdapter)
   */
  async connect(): Promise<void> {
    await this.autoConnect();
  }
  
  /**
   * Отключение кошелька
   */
  async disconnect(): Promise<void> {
    try {
      logger.info("Disconnecting Invisible Wallet");
      
      this.connectedFlag = false;
      this.publicKeyValue = null;
      
      // Очистка сессии
      await this.sessionManager.expireSession();
      
      logger.info("Invisible Wallet disconnected successfully");
    } catch (error) {
      logger.error("Failed to disconnect Invisible Wallet", error as Error);
      throw new InvisibleWalletError("Failed to disconnect Invisible Wallet", "DISCONNECT_ERROR", { error });
    }
  }
  
  /**
   * Подпись транзакции
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      if (!this.connectedFlag || !this.publicKeyValue) {
        throw new InvisibleWalletError("Wallet not connected", "WALLET_NOT_CONNECTED");
      }
      
      logger.info("Signing transaction");
      
      // Получение ключевой пары
      const keyPair = await this.keyManager.retrieveKeyPair();
      if (!keyPair) {
        throw new InvisibleWalletError("Key pair not available", "KEY_PAIR_NOT_AVAILABLE");
      }
      
      // Проверка безопасности транзакции
      const userId = await this.getUserId();
      const isValid = await this.securityManager.validateTransaction(transaction, userId);
      if (!isValid) {
        throw new InvisibleWalletError("Transaction validation failed", "TRANSACTION_VALIDATION_FAILED");
      }
      
      // Подпись транзакции
      transaction.sign(keyPair.privateKey as any);
      
      logger.info("Transaction signed successfully");
      return transaction;
    } catch (error) {
      logger.error("Failed to sign transaction", error as Error);
      throw new InvisibleWalletError("Failed to sign transaction", "SIGN_TRANSACTION_ERROR", { error });
    }
  }
  
  /**
   * Подпись всех транзакций
   */
  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    try {
      logger.info("Signing multiple transactions", { count: transactions.length });
      
      const signedTransactions: Transaction[] = [];
      
      for (const transaction of transactions) {
        const signedTransaction = await this.signTransaction(transaction);
        signedTransactions.push(signedTransaction);
      }
      
      logger.info("All transactions signed successfully");
      return signedTransactions;
    } catch (error) {
      logger.error("Failed to sign all transactions", error as Error);
      throw new InvisibleWalletError("Failed to sign all transactions", "SIGN_ALL_TRANSACTIONS_ERROR", { error });
    }
  }
  
  /**
   * Отправка транзакции
   */
  async sendTransaction(transaction: Transaction, connection: any): Promise<string> {
    try {
      logger.info("Sending transaction");
      
      // Подпись транзакции
      const signedTransaction = await this.signTransaction(transaction);
      
      // Отправка в блокчейн
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      
      // Добавление в оффлайн очередь если необходимо
      // await this.offlineManager.cacheTransaction(signature, transaction);
      
      this.emit(InvisibleWalletEvent.TRANSACTION_SENT, { signature });
      
      logger.info("Transaction sent successfully", { signature });
      return signature;
    } catch (error) {
      logger.error("Failed to send transaction", error as Error);
      throw new InvisibleWalletError("Failed to send transaction", "SEND_TRANSACTION_ERROR", { error });
    }
  }
  
  /**
   * Экспорт публичного ключа
   */
  async exportPublicKey(): Promise<PublicKey> {
    if (!this.publicKeyValue) {
      throw new InvisibleWalletError("No public key available", "NO_PUBLIC_KEY");
    }
    
    return this.publicKeyValue;
  }
  
  /**
   * Экспорт зашифрованного ключа
   */
  async exportEncryptedKey(): Promise<any> {
    try {
      const keyPair = await this.keyManager.retrieveKeyPair();
      if (!keyPair) {
        throw new InvisibleWalletError("No key pair available", "NO_KEY_PAIR");
      }
      
      return keyPair.encryptedPrivateKey;
    } catch (error) {
      logger.error("Failed to export encrypted key", error as Error);
      throw new InvisibleWalletError("Failed to export encrypted key", "EXPORT_ENCRYPTED_KEY_ERROR", { error });
    }
  }
  
  /**
   * Синхронизация при подключении
   */
  async syncWhenOnline(): Promise<void> {
    try {
      logger.info("Syncing when online");
      
      // Обработка оффлайн очереди
      // await this.offlineManager.processQueue();
      
      // Синхронизация баланса
      // await this.syncBalance();
      
      logger.info("Sync completed successfully");
    } catch (error) {
      logger.error("Failed to sync when online", error as Error);
      throw new InvisibleWalletError("Failed to sync when online", "SYNC_ERROR", { error });
    }
  }
  
  /**
   * Получение оффлайн очереди
   */
  async getOfflineQueue(): Promise<PendingTransaction[]> {
    try {
      // return await this.offlineManager.getQueue();
      return []; // Заглушка
    } catch (error) {
      logger.error("Failed to get offline queue", error as Error);
      throw new InvisibleWalletError("Failed to get offline queue", "GET_OFFLINE_QUEUE_ERROR", { error });
    }
  }
  
  /**
   * Покупка за Stars
   */
  async purchaseWithStars(amount: number, description: string): Promise<PurchaseResult> {
    try {
      logger.info("Purchasing with Stars", { amount, description });
      
      // Проверка доступности Stars
      if (!this.config.starsConfig.enabled) {
        throw new InvisibleWalletError("Stars purchases are disabled", "STARS_DISABLED");
      }
      
      // Валидация суммы
      if (amount < this.config.starsConfig.minAmount || amount > this.config.starsConfig.maxAmount) {
        throw new InvisibleWalletError("Invalid amount", "INVALID_AMOUNT", {
          min: this.config.starsConfig.minAmount,
          max: this.config.starsConfig.maxAmount
        });
      }
      
      // Покупка через Telegram Stars Bridge
      // const result = await this.starsBridge.purchaseWithStars(amount, description);
      
      // Используем нашу реализацию TelegramStarsBridge
      const starsTransaction = await this.starsBridge.purchaseNdtWithStars(amount, await this.getUserId());
      
      const result: PurchaseResult = {
        success: starsTransaction.status === 'confirmed',
        transactionId: starsTransaction.id,
        starsAmount: starsTransaction.starsAmount,
        solAmount: starsTransaction.solAmount,
        ndtAmount: starsTransaction.ndtAmount
      };
      
      this.emit(InvisibleWalletEvent.STARS_PURCHASE_COMPLETED, result);
      
      logger.info("Stars purchase completed successfully", result);
      return result;
    } catch (error) {
      logger.error("Failed to purchase with Stars", error as Error);
      throw new InvisibleWalletError("Failed to purchase with Stars", "STARS_PURCHASE_ERROR", { error });
    }
  }
  
  /**
   * Получение баланса Stars
   */
  async getStarsBalance(): Promise<number> {
    try {
      // Получаем баланс через Telegram WebApp API
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const telegramWebApp = window.Telegram.WebApp;
        
        // В реальном приложении вызываем API для получения баланса Stars
        // telegramWebApp.CloudStorage.getItem('stars_balance', (error: any, balance: string) => {
        //   if (error) {
        //     throw new Error('Failed to get stars balance');
        //   }
        //   return parseInt(balance || '0', 10);
        // });
        
        // Для демонстрации возвращаем фиктивный баланс
        return 1000; // В реальном приложении это будет получено из Telegram API
      } else {
        throw new InvisibleWalletError("Not in Telegram WebApp", "NOT_IN_TELEGRAM_WEBAPP");
      }
    } catch (error) {
      logger.error("Failed to get Stars balance", error as Error);
      throw new InvisibleWalletError("Failed to get Stars balance", "GET_STARS_BALANCE_ERROR", { error });
    }
  }
  
  /**
   * Настройка восстановления
   */
  async setupRecovery(contacts: TelegramContact[]): Promise<void> {
    try {
      logger.info("Setting up recovery", { contactCount: contacts.length });
      
      // Валидация контактов
      if (contacts.length < this.config.recoveryConfig.threshold) {
        throw new InvisibleWalletError("Not enough contacts for recovery", "NOT_ENOUGH_CONTACTS", {
          required: this.config.recoveryConfig.threshold,
          provided: contacts.length
        });
      }
      
      // Настройка восстановления
      const keyPair = await this.keyManager.retrieveKeyPair();
      if (!keyPair) {
        throw new InvisibleWalletError("No key pair available", "NO_KEY_PAIR");
      }
      
      await this.recoverySystem.setupRecovery(keyPair.encryptedPrivateKey, contacts);
      
      this.emit(InvisibleWalletEvent.RECOVERY_SETUP_COMPLETED, { contactCount: contacts.length });
      
      logger.info("Recovery setup completed successfully");
    } catch (error) {
      logger.error("Failed to setup recovery", error as Error);
      throw new InvisibleWalletError("Failed to setup recovery", "SETUP_RECOVERY_ERROR", { error });
    }
  }
  
  /**
   * Инициация восстановления
   */
  async initiateRecovery(): Promise<RecoverySession> {
    try {
      logger.info("Initiating recovery");
      
      const session = await this.recoverySystem.initiateRecovery(await this.getUserId());
      
      logger.info("Recovery initiated successfully", { sessionId: session.id });
      return session;
    } catch (error) {
      logger.error("Failed to initiate recovery", error as Error);
      throw new InvisibleWalletError("Failed to initiate recovery", "INITIATE_RECOVERY_ERROR", { error });
    }
  }
  
  /**
   * Подписка на события
   */
  on(event: InvisibleWalletEvent, handler: EventHandler): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    
    this.eventHandlers[event].push(handler);
  }
  
  /**
   * Отписка от событий
   */
  off(event: InvisibleWalletEvent, handler: EventHandler): void {
    if (!this.eventHandlers[event]) {
      return;
    }
    
    const index = this.eventHandlers[event].indexOf(handler);
    if (index > -1) {
      this.eventHandlers[event].splice(index, 1);
    }
  }
  
  /**
   * Отправка события
   */
  private emit(event: InvisibleWalletEvent, data?: any): void {
    const eventData: WalletEventData = {
      type: event,
      data,
      timestamp: Date.now()
    };
    
    const handlers = this.eventHandlers[event];
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(eventData);
        } catch (error) {
          logger.error("Error in event handler", error as Error, { event });
        }
      });
    }
  }
  
  /**
   * Получение ID пользователя
   */
  private async getUserId(): Promise<string> {
    const telegramUser = TelegramUtils.getTelegramUser();
    if (!telegramUser) {
      throw new InvisibleWalletError("Telegram user not available", "TELEGRAM_USER_NOT_AVAILABLE");
    }
    
    return telegramUser.id.toString();
  }
  
  // Свойства для совместимости с WalletAdapter
  
  get connected(): boolean {
    return this.connectedFlag;
  }
  
  get connecting(): boolean {
    return this.autoConnecting;
  }
  
  get publicKey(): PublicKey | null {
    return this.publicKeyValue;
  }
  
  get autoApprove(): boolean {
    return true; // Invisible Wallet автоматически одобряет транзакции
  }
  
  get supportedChains(): Set<string> {
    return new Set(['solana:' + (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet')]);
  }
}

/**
 * Фабрика для создания Invisible Wallet Adapter
 */
export function createInvisibleWalletAdapter(config?: Partial<InvisibleWalletConfig>): InvisibleWalletAdapterImpl {
  const walletConfig = config || getInvisibleWalletConfig();
  return new InvisibleWalletAdapterImpl(walletConfig);
}

/**
 * Функция для автоматического определения и создания адаптера
 */
export function createAutoWalletAdapter(): InvisibleWalletAdapterImpl | null {
  // Если в Telegram Mini App, используем Invisible Wallet
  if (typeof window !== 'undefined' && TelegramUtils.isTelegramWebApp()) {
    return createInvisibleWalletAdapter();
  }
  
  return null;
}

/**
 * Хук для использования Invisible Wallet
 */
export function useInvisibleWallet() {
  const [wallet, setWallet] = useState<InvisibleWalletAdapterImpl | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const initializeWallet = async () => {
      setIsInitializing(true);
      setError(null);
      
      try {
        const invisibleWallet = createAutoWalletAdapter();
        if (invisibleWallet) {
          await invisibleWallet.initialize();
          setWallet(invisibleWallet);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize wallet');
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeWallet();
  }, []);
  
  return {
    wallet,
    isInitializing,
    error,
    isConnected: wallet?.connected || false,
    publicKey: wallet?.publicKey || null
  };
}

// Импорт React для хука
import { useState, useEffect } from "react";

  /**
   * Аутентификация пользователя
   */
  async authenticateUser(authType: any, credentials?: any): Promise<boolean> {
    const result = await this.authManager.authenticate(authType, credentials);
    return result.success;
  }
  
  /**
   * Получение текущей сессии
   */
  async getCurrentSession(): Promise<any> {
    return await this.sessionManager.getCurrentSession();
 }
  
  /**
   * Валидация транзакции
   */
  async validateTransaction(transaction: Transaction): Promise<boolean> {
    const userId = await this.getUserId();
    return await this.securityManager.validateTransaction(transaction, userId);
  }
}