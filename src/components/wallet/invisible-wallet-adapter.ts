import { DeflationaryModel } from "@/lib/deflationary-model";
import { logger } from "@/lib/utils/logger";
import { WalletAdapter } from "@solana/wallet-adapter-base";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { BiometricAuth } from "./biometric-auth";
import { KeyManager } from "./key-manager";
import { OfflineManager } from "./offline-manager";
import { SecurityManager } from "./security-manager";
import { TelegramStarsManager } from "./telegram-stars-manager";

/**
 * Конфигурация невидимого кошелька
 */
export interface InvisibleWalletConfig {
  // Telegram интеграция
  telegramUserId?: string;
  telegramInitData?: string;

  // Безопасность
  enableBiometric?: boolean;
  enableSocialRecovery?: boolean;
  trustedContacts?: string[];

  // Multi-chain поддержка
  supportedChains?: ("solana" | "ethereum" | "ton")[];

  // Оффлайн режим
  enableOffline?: boolean;
  cacheDuration?: number;

  // Мониторинг
  enableAnalytics?: boolean;
  analyticsEndpoint?: string;
}

/**
 * Состояние невидимого кошелька
 */
export interface InvisibleWalletState {
  isInitialized: boolean;
  isConnected: boolean;
  publicKey: PublicKey | null;
  balance: number;
  tokenBalances: Record<string, number>;
  lastSync: number;
  isOffline: boolean;
  securityLevel: "basic" | "enhanced" | "maximum";
}

/**
 * События невидимого кошелька
 */
export interface InvisibleWalletEvent {
  type:
    | "connect"
    | "disconnect"
    | "balanceChange"
    | "transaction"
    | "security"
    | "error";
  data?: any;
  timestamp: number;
}

/**
 * Невидимый кошелек - абстракция над Web3 взаимодействием
 *
 * Ключевые особенности:
 * - Автоматическая инициализация без явного подключения
 * - Прогрессивное раскрытие сложности
 * - Multi-chain поддержка
 * - Оффлайн функциональность
 * - Социальное восстановление
 * - Интеграция с Telegram Stars
 */
export class InvisibleWalletAdapter implements WalletAdapter {
  private _publicKey: PublicKey | null = null;
  private _connected: boolean = false;
  private _connecting: boolean = false;
  private _config: InvisibleWalletConfig;
  private _state: InvisibleWalletState;

  // Менеджеры
  private _keyManager: KeyManager;
  private _offlineManager: OfflineManager;
  private _telegramStars: TelegramStarsManager;
  private _securityManager: SecurityManager;
  private _biometricAuth: BiometricAuth;
  private _deflationaryModel: DeflationaryModel;

  // События
  private _eventListeners: Map<string, Function[]> = new Map();
  private _connection: Connection;

  constructor(config: InvisibleWalletConfig, connection: Connection) {
    this._config = {
      enableBiometric: true,
      enableSocialRecovery: true,
      supportedChains: ["solana"],
      enableOffline: true,
      cacheDuration: 300000, // 5 минут
      enableAnalytics: true,
      ...config,
    };

    this._connection = connection;
    this._state = {
      isInitialized: false,
      isConnected: false,
      publicKey: null,
      balance: 0,
      tokenBalances: {},
      lastSync: 0,
      isOffline: false,
      securityLevel: "basic",
    };

    // Инициализация менеджеров
    this._keyManager = new KeyManager(this._config);
    this._offlineManager = new OfflineManager(this._config);
    this._telegramStars = new TelegramStarsManager(this._config);
    this._securityManager = new SecurityManager(this._config);
    this._biometricAuth = new BiometricAuth(this._config);
    this._deflationaryModel = new DeflationaryModel(connection);
  }

  // Getters
  get connected(): boolean {
    return this._connected;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  get autoConnect(): () => Promise<void> {
    return () => this.connect(); // Всегда автоконнект для невидимого кошелька
  }

  // Основные методы WalletAdapter
  async connect(): Promise<void> {
    if (this._connecting || this._connected) return;

    this._connecting = true;
    this.emit("connect", { timestamp: Date.now() });

    try {
      // 1. Инициализация ключевой пары
      await this._initializeKeyPair();

      // 2. Проверка безопасности
      await this._performSecurityCheck();

      // 3. Синхронизация баланса
      await this._syncBalance();

      // 4. Настройка фоновой синхронизации
      this._setupBackgroundSync();

      this._connected = true;
      this._state.isConnected = true;
      this._state.isInitialized = true;

      this.emit("connect", {
        publicKey: this._publicKey?.toBase58() || "",
        timestamp: Date.now(),
      });

      logger.info("Invisible wallet connected successfully", {
        publicKey: this._publicKey?.toBase58() || "",
        securityLevel: this._state.securityLevel,
      });
    } catch (error) {
      logger.error("Failed to connect invisible wallet", error);
      this.emit("error", { error: error.message, timestamp: Date.now() });
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this._connected) return;

    try {
      // Сохранение состояния перед отключением
      await this._offlineManager.cacheState(this._state);

      // Очистка сессии
      await this._securityManager.clearSession();

      this._connected = false;
      this._state.isConnected = false;
      this._publicKey = null;

      this.emit("disconnect", { timestamp: Date.now() });

      logger.info("Invisible wallet disconnected");
    } catch (error) {
      logger.error("Error during wallet disconnect", error);
      throw error;
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this._connected || !this._publicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      // Проверка безопасности транзакции
      await this._securityManager.validateTransaction(
        transaction,
        this._publicKey.toBase58()
      );

      // Получение приватного ключа
      const privateKey = await this._keyManager.getPrivateKey();

      // Подпись транзакции
      transaction.sign(privateKey);

      // Логирование для аналитики
      if (this._config.enableAnalytics) {
        this._trackTransaction(transaction);
      }

      this.emit("transaction", {
        type: "sign",
        signature: transaction.signature?.toString() || "",
        timestamp: Date.now(),
      });

      return transaction;
    } catch (error) {
      logger.error("Failed to sign transaction", error);
      this.emit("error", { error: error.message, timestamp: Date.now() });
      throw error;
    }
  }

  async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    return Promise.all(transactions.map((tx) => this.signTransaction(tx)));
  }

  async sendTransaction(transaction: Transaction): Promise<string> {
    try {
      const signedTransaction = await this.signTransaction(transaction);
      const signature = await this._connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        }
      );

      // Ожидание подтверждения
      await this._connection.confirmTransaction(signature, "confirmed");

      // Обновление баланса
      await this._syncBalance();

      this.emit("transaction", {
        type: "send",
        signature,
        timestamp: Date.now(),
      });

      return signature;
    } catch (error) {
      logger.error("Failed to send transaction", error);
      this.emit("error", { error: error.message, timestamp: Date.now() });
      throw error;
    }
  }

  // Расширенные методы для невидимого кошелька

  /**
   * Автоматическое подключение (без UI)
   */
  async autoConnectMethod(): Promise<void> {
    return this.connect();
  }

  /**
   * Покупка за Telegram Stars
   */
  async purchaseWithStars(amount: number, description: string): Promise<any> {
    if (!this._connected) {
      await this.connect();
    }

    return await this._telegramStars.purchaseWithStars(amount, description);
  }

  /**
   * Настройка социального восстановления
   */
  async setupRecovery(contacts: string[]): Promise<void> {
    if (!this._config.enableSocialRecovery) {
      throw new Error("Social recovery is disabled");
    }

    await this._keyManager.setupSocialRecovery(contacts);
    this._config.trustedContacts = contacts;

    this.emit("security", {
      type: "recovery-setup",
      contactsCount: contacts.length,
      timestamp: Date.now(),
    });
  }

  /**
   * Получение баланса Telegram Stars
   */
  async getStarsBalance(): Promise<number> {
    return await this._telegramStars.getStarsBalance();
  }

  /**
   * Получение баланса с кэшированием
   */
  async getBalance(): Promise<number> {
    const now = Date.now();
    const cacheAge = now - this._state.lastSync;

    // Возвращаем кэшированный баланс если он свежий
    if (cacheAge < (this._config.cacheDuration || 300000)) {
      return this._state.balance;
    }

    return await this._syncBalance();
  }

  /**
   * Получение баланса токена
   */
  async getTokenBalance(mintAddress: string): Promise<number> {
    const cached = this._state.tokenBalances[mintAddress];
    if (cached !== undefined) {
      return cached;
    }

    if (!this._publicKey) return 0;

    try {
      const balance = await this._getTokenBalanceFromChain(mintAddress);
      this._state.tokenBalances[mintAddress] = balance;
      return balance;
    } catch (error) {
      logger.error("Failed to get token balance", error);
      return 0;
    }
  }

  // Приватные методы

  private async _initializeKeyPair(): Promise<void> {
    if (this._config.telegramUserId) {
      // Генерация ключа на основе Telegram ID
      this._publicKey = await this._keyManager.getOrCreateKeyPair(
        this._config.telegramUserId,
        this._config.telegramInitData
      );
    } else {
      // Генерация случайной ключевой пары
      this._publicKey = await this._keyManager.generateRandomKeyPair();
    }

    this._state.publicKey = this._publicKey;
  }

  private async _performSecurityCheck(): Promise<void> {
    // Биометрическая аутентификация если включена
    if (
      this._config.enableBiometric &&
      (await this._biometricAuth.isAvailable())
    ) {
      const authResult = await this._biometricAuth.authenticate();
      if (!authResult.success) {
        throw new Error("Biometric authentication failed");
      }
      this._state.securityLevel = "enhanced";
    }

    // Проверка безопасности устройства
    const securityCheck = await this._securityManager.performSecurityCheck();
    if (!securityCheck.secure) {
      this._state.securityLevel = "basic";
      logger.warn("Device security check failed", securityCheck.issues);
    } else {
      this._state.securityLevel = "maximum";
    }
  }

  private async _syncBalance(): Promise<number> {
    if (!this._publicKey) return 0;

    try {
      const balance = await this._connection.getBalance(this._publicKey);
      const solBalance = balance / 1e9; // Конвертация lamports в SOL

      this._state.balance = solBalance;
      this._state.lastSync = Date.now();

      // Кэширование в оффлайн менеджере
      if (this._config.enableOffline) {
        await this._offlineManager.cacheBalance({
          publicKey: this._publicKey.toBase58(),
          balance: solBalance,
          timestamp: Date.now(),
        });
      }

      this.emit("balanceChange", {
        balance: solBalance,
        timestamp: Date.now(),
      });

      return solBalance;
    } catch (error) {
      logger.error("Failed to sync balance", error);
      this._state.isOffline = true;
      return this._state.balance; // Возвращаем кэшированный баланс
    }
  }

  private async _getTokenBalanceFromChain(
    mintAddress: string
  ): Promise<number> {
    if (!this._publicKey) return 0;

    // Реализация получения баланса токена из блокчейна
    // Здесь должна быть логика для SPL токенов
    return 0;
  }

  private _setupBackgroundSync(): void {
    if (!this._config.enableOffline) return;

    // Настройка фоновой синхронизации каждые 30 секунд
    setInterval(async () => {
      if (this._connected && !this._state.isOffline) {
        try {
          await this._syncBalance();
        } catch (error) {
          logger.error("Background sync failed", error);
        }
      }
    }, 30000);
  }

  private _trackTransaction(transaction: Transaction): void {
    // Отправка аналитики о транзакции
    if (this._config.analyticsEndpoint) {
      // Реализация отправки аналитики
    }
  }

  // Event emitter методы

  on(event: string, listener: Function): void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, []);
    }
    this._eventListeners.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any): void {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(data));
    }
  }
}

/**
 * Фабрика для создания Invisible Wallet Adapter
 */
export function createInvisibleWalletAdapter(
  config: InvisibleWalletConfig,
  connection: Connection
): InvisibleWalletAdapter {
  return new InvisibleWalletAdapter(config, connection);
}

/**
 * Утилиты для работы с невидимым кошельком
 */
export class InvisibleWalletUtils {
  /**
   * Проверка доступности невидимого кошелька
   */
  static async isAvailable(): Promise<boolean> {
    // Проверка поддержки необходимых API
    return (
      typeof window !== "undefined" &&
      "crypto" in window &&
      "localStorage" in window
    );
  }

  /**
   * Получение конфигурации по умолчанию
   */
  static getDefaultConfig(): InvisibleWalletConfig {
    return {
      enableBiometric: true,
      enableSocialRecovery: true,
      supportedChains: ["solana"],
      enableOffline: true,
      cacheDuration: 300000,
      enableAnalytics: true,
    };
  }

  /**
   * Валидация конфигурации
   */
  static validateConfig(config: InvisibleWalletConfig): boolean {
    return !!config.telegramUserId || !!config.telegramInitData;
  }
}
