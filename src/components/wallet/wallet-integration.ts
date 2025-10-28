import { logger } from "@/lib/utils/logger";
import {
  WalletAdapter,
  WalletAdapterNetwork,
} from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { Connection, Transaction } from "@solana/web3.js";
import {
  InvisibleWalletAdapter,
  InvisibleWalletConfig,
} from "./invisible-wallet-adapter";
import { MigrationPath } from "./migration-path";

/**
 * Тип кошелька
 */
export type WalletType = "phantom" | "invisible" | "auto";

/**
 * Статус интеграции
 */
export type IntegrationStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "migrating"
  | "error";

/**
 * Конфигурация интеграции
 */
export interface WalletIntegrationConfig {
  preferredWallet: WalletType;
  autoMigration: boolean;
  fallbackToPhantom: boolean;
  migrationConfig?: {
    backupBeforeMigration: boolean;
    validateData: boolean;
    preserveBalance: boolean;
  };
  invisibleWalletConfig?: InvisibleWalletConfig;
}

/**
 * Данные о кошельке
 */
export interface WalletInfo {
  type: WalletType;
  publicKey: string | null;
  connected: boolean;
  balance: number;
  network: WalletAdapterNetwork;
  adapter: WalletAdapter | null;
}

/**
 * Результат переключения кошелька
 */
export interface WalletSwitchResult {
  success: boolean;
  fromType: WalletType;
  toType: WalletType;
  newPublicKey?: string;
  error?: string;
  migrationRequired?: boolean;
}

/**
 * Интеграция невидимого кошелька с существующей системой
 *
 * Ответственности:
 * - Бесшовное переключение между кошельками
 * - Автоматическая миграция данных
 * - Обратная совместимость
 * - Унификация интерфейса
 */
export class WalletIntegration {
  private _config: WalletIntegrationConfig;
  private _connection: Connection;
  private _currentWallet: WalletAdapter | null = null;
  private _currentType: WalletType = "phantom";
  private _status: IntegrationStatus = "disconnected";
  private _migrationPath: MigrationPath | null = null;
  private _eventListeners: Map<string, Function[]> = new Map();

  constructor(config: WalletIntegrationConfig, connection: Connection) {
    this._config = config;
    this._connection = connection;
    this._initializeMigrationPath();
  }

  /**
   * Инициализация кошелька
   */
  async initialize(): Promise<WalletInfo> {
    try {
      logger.info("Initializing wallet integration", {
        preferredWallet: this._config.preferredWallet,
        autoMigration: this._config.autoMigration,
      });

      // Определение типа кошелька
      const walletType = await this._determineWalletType();
      this._currentType = walletType;

      // Создание адаптера
      const adapter = await this._createWalletAdapter(walletType);
      this._currentWallet = adapter;

      // Подключение кошелька
      await this._connectWallet(adapter);

      // Автоматическая миграция если требуется
      if (this._config.autoMigration && walletType === "phantom") {
        await this._autoMigrateToInvisible();
      }

      const walletInfo: WalletInfo = {
        type: this._currentType,
        publicKey: adapter.publicKey?.toBase58() || null,
        connected: adapter.connected,
        balance: 0, // Будет обновлено асинхронно
        network: WalletAdapterNetwork.Devnet,
        adapter,
      };

      this._status = "connected";
      this._emit("initialized", walletInfo);

      return walletInfo;
    } catch (error) {
      logger.error("Wallet initialization failed", error);
      this._status = "error";
      throw error;
    }
  }

  /**
   * Переключение типа кошелька
   */
  async switchWallet(targetType: WalletType): Promise<WalletSwitchResult> {
    try {
      const fromType = this._currentType;

      logger.info("Switching wallet", { fromType, toType: targetType });

      // Отключение текущего кошелька
      if (this._currentWallet) {
        await this._disconnectWallet(this._currentWallet);
      }

      // Создание нового адаптера
      const newAdapter = await this._createWalletAdapter(targetType);
      this._currentWallet = newAdapter;
      this._currentType = targetType;

      // Подключение нового кошелька
      await this._connectWallet(newAdapter);

      // Миграция данных если требуется
      let migrationRequired = false;
      if (fromType === "phantom" && targetType === "invisible") {
        migrationRequired = true;
        await this._migrateFromPhantom(newAdapter as InvisibleWalletAdapter);
      } else if (fromType === "invisible" && targetType === "phantom") {
        // Обратная миграция не требуется
        logger.info(
          "Switching from Invisible to Phantom - no migration needed"
        );
      }

      const result: WalletSwitchResult = {
        success: true,
        fromType,
        toType: targetType,
        newPublicKey: newAdapter.publicKey?.toBase58(),
        migrationRequired,
      };

      this._status = "connected";
      this._emit("wallet_switched", result);

      return result;
    } catch (error) {
      logger.error("Wallet switch failed", error);

      return {
        success: false,
        fromType: this._currentType,
        toType: targetType,
        error: error instanceof Error ? error.message : "Switch failed",
      };
    }
  }

  /**
   * Получение информации о текущем кошельке
   */
  getWalletInfo(): WalletInfo {
    return {
      type: this._currentType,
      publicKey: this._currentWallet?.publicKey?.toBase58() || null,
      connected: this._currentWallet?.connected || false,
      balance: 0, // Будет обновлено через getBalance()
      network: WalletAdapterNetwork.Devnet,
      adapter: this._currentWallet,
    };
  }

  /**
   * Получение баланса
   */
  async getBalance(): Promise<number> {
    if (!this._currentWallet || !this._currentWallet.publicKey) {
      return 0;
    }

    try {
      const balance = await this._connection.getBalance(
        this._currentWallet.publicKey
      );
      return balance / 1e9; // Конвертация lamports в SOL
    } catch (error) {
      logger.error("Failed to get balance", error);
      return 0;
    }
  }

  /**
   * Отправка транзакции
   */
  async sendTransaction(transaction: Transaction): Promise<string> {
    if (!this._currentWallet) {
      throw new Error("No wallet connected");
    }

    try {
      const signature = await this._currentWallet.sendTransaction(
        transaction,
        this._connection
      );

      this._emit("transaction_sent", {
        signature,
        walletType: this._currentType,
      });

      return signature;
    } catch (error) {
      logger.error("Transaction failed", error);
      this._emit("transaction_failed", {
        error: error instanceof Error ? error.message : "Transaction failed",
        walletType: this._currentType,
      });
      throw error;
    }
  }

  /**
   * Подпись сообщения
   */
  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this._currentWallet) {
      throw new Error("No wallet connected");
    }

    if (!this._currentWallet.signMessage) {
      throw new Error("Wallet does not support message signing");
    }

    try {
      const signature = await this._currentWallet.signMessage(message);

      this._emit("message_signed", {
        message: Array.from(message),
        signature: Array.from(signature),
        walletType: this._currentType,
      });

      return signature;
    } catch (error) {
      logger.error("Message signing failed", error);
      throw error;
    }
  }

  /**
   * Отключение кошелька
   */
  async disconnect(): Promise<void> {
    if (this._currentWallet) {
      await this._disconnectWallet(this._currentWallet);
      this._currentWallet = null;
      this._status = "disconnected";

      this._emit("disconnected", { walletType: this._currentType });
    }
  }

  /**
   * Получение статуса интеграции
   */
  getStatus(): IntegrationStatus {
    return this._status;
  }

  /**
   * Проверка доступности кошелька
   */
  static async isWalletAvailable(type: WalletType): Promise<boolean> {
    switch (type) {
      case "phantom":
        return (
          typeof window !== "undefined" &&
          "solana" in window &&
          "isPhantom" in window.solana
        );

      case "invisible":
        return true; // Всегда доступен

      case "auto":
        return await WalletIntegration.isWalletAvailable("phantom");

      default:
        return false;
    }
  }

  /**
   * Получение рекомендованного типа кошелька
   */
  static async getRecommendedWalletType(): Promise<WalletType> {
    // Проверяем окружение
    const isTelegram =
      typeof window !== "undefined" &&
      "Telegram" in window &&
      "WebApp" in (window as any).Telegram;

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    // В Telegram WebApp рекомендуем Invisible Wallet
    if (isTelegram) {
      return "invisible";
    }

    // На мобильных устройствах рекомендуем Invisible Wallet
    if (isMobile) {
      return "invisible";
    }

    // На десктопе с Phantom - используем Phantom
    if (await WalletIntegration.isWalletAvailable("phantom")) {
      return "phantom";
    }

    // По умолчанию - Invisible Wallet
    return "invisible";
  }

  /**
   * Добавление обработчика событий
   */
  on(event: string, listener: Function): void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, []);
    }
    this._eventListeners.get(event)!.push(listener);
  }

  /**
   * Удаление обработчика событий
   */
  off(event: string, listener: Function): void {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Приватные методы

  private async _determineWalletType(): Promise<WalletType> {
    // Если указан предпочтительный тип
    if (this._config.preferredWallet !== "auto") {
      const available = await WalletIntegration.isWalletAvailable(
        this._config.preferredWallet
      );
      return available ? this._config.preferredWallet : "invisible";
    }

    // Автоматическое определение
    return await WalletIntegration.getRecommendedWalletType();
  }

  private async _createWalletAdapter(type: WalletType): Promise<WalletAdapter> {
    switch (type) {
      case "phantom":
        return new PhantomWalletAdapter();

      case "invisible":
        if (!this._config.invisibleWalletConfig) {
          throw new Error("Invisible wallet config not provided");
        }
        return new InvisibleWalletAdapter(
          this._config.invisibleWalletConfig,
          this._connection
        );

      case "auto":
        const recommendedType =
          await WalletIntegration.getRecommendedWalletType();
        return this._createWalletAdapter(recommendedType);

      default:
        throw new Error(`Unsupported wallet type: ${type}`);
    }
  }

  private async _connectWallet(adapter: WalletAdapter): Promise<void> {
    this._status = "connecting";
    this._emit("connecting", { walletType: this._currentType });

    try {
      await adapter.connect();
      this._emit("connected", {
        walletType: this._currentType,
        publicKey: adapter.publicKey?.toBase58(),
      });
    } catch (error) {
      this._status = "error";
      this._emit("error", {
        error: error instanceof Error ? error.message : "Connection failed",
        walletType: this._currentType,
      });
      throw error;
    }
  }

  private async _disconnectWallet(adapter: WalletAdapter): Promise<void> {
    try {
      await adapter.disconnect();
    } catch (error) {
      logger.error("Wallet disconnection failed", error);
    }
  }

  private async _autoMigrateToInvisible(): Promise<void> {
    if (!this._currentWallet || this._currentType !== "phantom") {
      return;
    }

    try {
      this._status = "migrating";
      this._emit("migration_started", {
        fromType: "phantom",
        toType: "invisible",
      });

      const phantomPublicKey = this._currentWallet.publicKey?.toBase58();
      if (!phantomPublicKey) {
        throw new Error("Phantom public key not available");
      }

      const migrationResult = await this._migrationPath!.startMigration(
        phantomPublicKey
      );

      if (migrationResult.success) {
        // Переключение на Invisible Wallet
        await this.switchWallet("invisible");

        this._emit("migration_completed", {
          fromType: "phantom",
          toType: "invisible",
          newPublicKey: migrationResult.newPublicKey,
        });
      } else {
        this._status = "error";
        this._emit("migration_failed", {
          fromType: "phantom",
          toType: "invisible",
          error: migrationResult.error,
        });
      }
    } catch (error) {
      this._status = "error";
      this._emit("migration_failed", {
        fromType: "phantom",
        toType: "invisible",
        error: error instanceof Error ? error.message : "Migration failed",
      });
    }
  }

  private async _migrateFromPhantom(
    invisibleWallet: InvisibleWalletAdapter
  ): Promise<void> {
    // Дополнительная логика миграции если требуется
    if (this._config.migrationConfig?.preserveBalance) {
      // Сохранение баланса при миграции
      const balance = await this.getBalance();
      logger.info("Preserving balance during migration", { balance });
    }
  }

  private _initializeMigrationPath(): void {
    if (this._config.invisibleWalletConfig) {
      this._migrationPath = new MigrationPath(
        this._config.invisibleWalletConfig
      );
    }
  }

  private _emit(event: string, data: any): void {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(data));
    }
  }
}

/**
 * Утилиты для интеграции кошельков
 */
export class WalletIntegrationUtils {
  /**
   * Валидация конфигурации
   */
  static validateConfig(config: WalletIntegrationConfig): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.preferredWallet) {
      errors.push("Preferred wallet type is required");
    }

    if (
      config.preferredWallet === "invisible" &&
      !config.invisibleWalletConfig
    ) {
      errors.push("Invisible wallet config is required for invisible wallet");
    }

    if (config.autoMigration && !config.migrationConfig) {
      warnings.push("Migration config not provided - using defaults");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Создание конфигурации по умолчанию
   */
  static createDefaultConfig(): WalletIntegrationConfig {
    return {
      preferredWallet: "auto",
      autoMigration: true,
      fallbackToPhantom: true,
      migrationConfig: {
        backupBeforeMigration: true,
        validateData: true,
        preserveBalance: true,
      },
    };
  }

  /**
   * Определение оптимального типа кошелька
   */
  static async determineOptimalWalletType(): Promise<{
    recommended: WalletType;
    alternatives: WalletType[];
    reasoning: string[];
  }> {
    const available: WalletType[] = [];
    const reasoning: string[] = [];

    // Проверяем доступность Phantom
    if (await WalletIntegration.isWalletAvailable("phantom")) {
      available.push("phantom");
      reasoning.push("Phantom wallet is available");
    }

    // Invisible Wallet всегда доступен
    available.push("invisible");
    reasoning.push("Invisible wallet is always available");

    // Определение рекомендованного типа
    const recommended = await WalletIntegration.getRecommendedWalletType();
    reasoning.push(`Recommended: ${recommended} based on environment`);

    return {
      recommended,
      alternatives: available.filter((t) => t !== recommended),
      reasoning,
    };
  }

  /**
   * Создание отчета об интеграции
   */
  static generateIntegrationReport(
    walletInfo: WalletInfo,
    config: WalletIntegrationConfig
  ): string {
    const report = {
      timestamp: new Date().toISOString(),
      walletInfo: {
        type: walletInfo.type,
        publicKey: walletInfo.publicKey,
        connected: walletInfo.connected,
        balance: walletInfo.balance,
        network: walletInfo.network,
      },
      config: {
        preferredWallet: config.preferredWallet,
        autoMigration: config.autoMigration,
        fallbackToPhantom: config.fallbackToPhantom,
      },
      environment: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        isTelegram: typeof window !== "undefined" && "Telegram" in window,
        isMobile:
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          ),
      },
    };

    return JSON.stringify(report, null, 2);
  }
}
