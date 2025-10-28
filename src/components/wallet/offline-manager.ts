import { logger } from "@/lib/utils/logger";
import { InvisibleWalletConfig } from "./invisible-wallet-adapter";

/**
 * Данные о балансе для кэширования
 */
export interface BalanceData {
  publicKey: string;
  balance: number;
  timestamp: number;
  tokenBalances?: Record<string, number>;
}

/**
 * Ожидающая транзакция
 */
export interface PendingTransaction {
  id: string;
  type: "send" | "receive" | "swap" | "stake";
  from: string;
  to: string;
  amount: number;
  tokenMint?: string;
  timestamp: number;
  status: "pending" | "processing" | "failed";
  retryCount: number;
  maxRetries: number;
  data?: any;
}

/**
 * Конфликт синхронизации
 */
export interface SyncConflict {
  id: string;
  type: "balance" | "transaction" | "token_balance";
  localData: any;
  remoteData: any;
  timestamp: number;
  resolution?: "local" | "remote" | "merge";
}

/**
 * Менеджер оффлайн функциональности
 *
 * Ответственности:
 * - Кэширование балансов и транзакций
 * - Очередь оффлайн транзакций
 * - Синхронизация при подключении
 * - Разрешение конфликтов
 */
export class OfflineManager {
  private _config: InvisibleWalletConfig;
  private _isOnline: boolean = true;
  private _syncInProgress: boolean = false;
  private _pendingTransactions: PendingTransaction[] = [];
  private _cachedBalance: BalanceData | null = null;
  private _syncConflicts: SyncConflict[] = [];

  constructor(config: InvisibleWalletConfig) {
    this._config = config;
    this._initializeOfflineSupport();
    this._setupNetworkListeners();
  }

  /**
   * Кэширование баланса
   */
  async cacheBalance(balanceData: BalanceData): Promise<void> {
    try {
      this._cachedBalance = balanceData;

      // Сохранение в localStorage
      const storageKey = "offline_balance";
      localStorage.setItem(storageKey, JSON.stringify(balanceData));

      // Сохранение в IndexedDB для больших объемов данных
      if (this._config.enableOffline) {
        await this._saveToIndexedDB("balance", balanceData);
      }

      logger.info("Balance cached", {
        publicKey: balanceData.publicKey,
        balance: balanceData.balance,
      });
    } catch (error) {
      logger.error("Failed to cache balance", error);
    }
  }

  /**
   * Получение кэшированного баланса
   */
  async getCachedBalance(): Promise<BalanceData | null> {
    try {
      // Сначала проверяем память
      if (this._cachedBalance) {
        const age = Date.now() - this._cachedBalance.timestamp;
        const maxAge = this._config.cacheDuration || 300000; // 5 минут

        if (age < maxAge) {
          return this._cachedBalance;
        }
      }

      // Проверяем localStorage
      const storageKey = "offline_balance";
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const balanceData = JSON.parse(stored);
        const age = Date.now() - balanceData.timestamp;
        const maxAge = this._config.cacheDuration || 300000;

        if (age < maxAge) {
          this._cachedBalance = balanceData;
          return balanceData;
        }
      }

      // Проверяем IndexedDB
      if (this._config.enableOffline) {
        const indexedData = await this._getFromIndexedDB("balance");
        if (indexedData) {
          const age = Date.now() - indexedData.timestamp;
          const maxAge = this._config.cacheDuration || 300000;

          if (age < maxAge) {
            this._cachedBalance = indexedData;
            return indexedData;
          }
        }
      }

      return null;
    } catch (error) {
      logger.error("Failed to get cached balance", error);
      return null;
    }
  }

  /**
   * Добавление транзакции в очередь
   */
  async queueTransaction(
    transaction: Omit<
      PendingTransaction,
      "id" | "timestamp" | "status" | "retryCount"
    >
  ): Promise<string> {
    try {
      const pendingTransaction: PendingTransaction = {
        ...transaction,
        id: this._generateTransactionId(),
        timestamp: Date.now(),
        status: "pending",
        retryCount: 0,
      };

      this._pendingTransactions.push(pendingTransaction);

      // Сохранение в localStorage
      await this._savePendingTransactions();

      // Попытка отправки если онлайн
      if (this._isOnline) {
        await this._processPendingTransactions();
      }

      logger.info("Transaction queued", {
        id: pendingTransaction.id,
        type: transaction.type,
      });

      return pendingTransaction.id;
    } catch (error) {
      logger.error("Failed to queue transaction", error);
      throw error;
    }
  }

  /**
   * Обработка очереди транзакций
   */
  async processQueue(): Promise<void> {
    if (this._syncInProgress || !this._isOnline) {
      return;
    }

    this._syncInProgress = true;

    try {
      await this._processPendingTransactions();
      await this._syncWithServer();
    } catch (error) {
      logger.error("Queue processing failed", error);
    } finally {
      this._syncInProgress = false;
    }
  }

  /**
   * Синхронизация при подключении
   */
  async syncWhenOnline(): Promise<void> {
    if (!this._isOnline) {
      return;
    }

    try {
      // 1. Синхронизация баланса
      await this._syncBalance();

      // 2. Обработка ожидающих транзакций
      await this._processPendingTransactions();

      // 3. Разрешение конфликтов
      await this.resolveConflicts(this._syncConflicts);

      logger.info("Sync completed successfully");
    } catch (error) {
      logger.error("Sync failed", error);
    }
  }

  /**
   * Разрешение конфликтов
   */
  async resolveConflicts(conflicts: SyncConflict[]): Promise<void> {
    try {
      for (const conflict of conflicts) {
        const resolution = await this._resolveConflict(conflict);
        conflict.resolution = resolution;

        // Применение решения
        await this._applyConflictResolution(conflict);
      }

      // Сохранение разрешенных конфликтов
      await this._saveSyncConflicts();

      logger.info("Conflicts resolved", { count: conflicts.length });
    } catch (error) {
      logger.error("Failed to resolve conflicts", error);
      throw error;
    }
  }

  /**
   * Получение ожидающих транзакций
   */
  getPendingTransactions(): PendingTransaction[] {
    return [...this._pendingTransactions];
  }

  /**
   * Получение конфликтов синхронизации
   */
  getSyncConflicts(): SyncConflict[] {
    return [...this._syncConflicts];
  }

  /**
   * Очистка кэша
   */
  async clearCache(): Promise<void> {
    try {
      this._cachedBalance = null;
      this._pendingTransactions = [];
      this._syncConflicts = [];

      // Очистка localStorage
      localStorage.removeItem("offline_balance");
      localStorage.removeItem("pending_transactions");
      localStorage.removeItem("sync_conflicts");

      // Очистка IndexedDB
      if (this._config.enableOffline) {
        await this._clearIndexedDB();
      }

      logger.info("Cache cleared");
    } catch (error) {
      logger.error("Failed to clear cache", error);
    }
  }

  /**
   * Получение статуса оффлайн режима
   */
  isOffline(): boolean {
    return !this._isOnline;
  }

  /**
   * Кэширование состояния кошелька
   */
  async cacheState(state: any): Promise<void> {
    try {
      const storageKey = "wallet_state";
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          ...state,
          cachedAt: Date.now(),
        })
      );

      if (this._config.enableOffline) {
        await this._saveToIndexedDB("wallet_state", state);
      }
    } catch (error) {
      logger.error("Failed to cache state", error);
    }
  }

  // Приватные методы

  private _initializeOfflineSupport(): Promise<void> {
    // Инициализация IndexedDB если доступна
    if (this._config.enableOffline && "indexedDB" in window) {
      return this._initializeIndexedDB();
    }
    return Promise.resolve();
  }

  private _setupNetworkListeners(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this._isOnline = true;
        logger.info("Network connection restored");
        this.syncWhenOnline();
      });

      window.addEventListener("offline", () => {
        this._isOnline = false;
        logger.info("Network connection lost");
      });

      // Начальный статус
      this._isOnline = navigator.onLine;
    }
  }

  private async _initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("InvisibleWalletDB", 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Создание хранилищ
        if (!db.objectStoreNames.contains("balance")) {
          db.createObjectStore("balance");
        }

        if (!db.objectStoreNames.contains("transactions")) {
          db.createObjectStore("transactions");
        }

        if (!db.objectStoreNames.contains("wallet_state")) {
          db.createObjectStore("wallet_state");
        }
      };
    });
  }

  private async _saveToIndexedDB(store: string, data: any): Promise<void> {
    if (!("indexedDB" in window)) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open("InvisibleWalletDB", 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([store], "readwrite");
        const objectStore = transaction.objectStore(store);

        const putRequest = objectStore.put(data, store);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async _getFromIndexedDB(store: string): Promise<any> {
    if (!("indexedDB" in window)) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open("InvisibleWalletDB", 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([store], "readonly");
        const objectStore = transaction.objectStore(store);

        const getRequest = objectStore.get(store);
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async _clearIndexedDB(): Promise<void> {
    if (!("indexedDB" in window)) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open("InvisibleWalletDB", 1);

      request.onsuccess = () => {
        const db = request.result;
        const stores = ["balance", "transactions", "wallet_state"];

        Promise.all(
          stores.map((store) => {
            return new Promise<void>((storeResolve, storeReject) => {
              const transaction = db.transaction([store], "readwrite");
              const objectStore = transaction.objectStore(store);

              const clearRequest = objectStore.clear();
              clearRequest.onsuccess = () => storeResolve();
              clearRequest.onerror = () => storeReject(clearRequest.error);
            });
          })
        )
          .then(() => resolve())
          .catch(reject);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async _processPendingTransactions(): Promise<void> {
    const transactionsToProcess = this._pendingTransactions.filter(
      (tx) => tx.status === "pending" && tx.retryCount < tx.maxRetries
    );

    for (const transaction of transactionsToProcess) {
      try {
        transaction.status = "processing";
        await this._savePendingTransactions();

        // Здесь должна быть реальная отправка транзакции
        const success = await this._sendTransaction(transaction);

        if (success) {
          // Удаление успешной транзакции из очереди
          this._pendingTransactions = this._pendingTransactions.filter(
            (tx) => tx.id !== transaction.id
          );
        } else {
          transaction.status = "pending";
          transaction.retryCount++;
        }

        await this._savePendingTransactions();
      } catch (error) {
        logger.error("Failed to process transaction", {
          transactionId: transaction.id,
          error,
        });

        transaction.status = "pending";
        transaction.retryCount++;
        await this._savePendingTransactions();
      }
    }
  }

  private async _sendTransaction(
    transaction: PendingTransaction
  ): Promise<boolean> {
    // В реальной реализации здесь должна быть отправка транзакции в блокчейн
    // Для демонстрации имитируем успешную отправку
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.3); // 70% успех
      }, 1000);
    });
  }

  private async _syncWithServer(): Promise<void> {
    // В реальной реализации здесь должна быть синхронизация с сервером
    logger.info("Syncing with server...");
  }

  private async _syncBalance(): Promise<void> {
    // В реальной реализации здесь должна быть синхронизация баланса
    logger.info("Syncing balance...");
  }

  private async _resolveConflict(
    conflict: SyncConflict
  ): Promise<"local" | "remote" | "merge"> {
    // В реальной реализации здесь должна быть логика разрешения конфликтов
    // Для демонстрации предпочитаем локальные данные
    return "local";
  }

  private async _applyConflictResolution(
    conflict: SyncConflict
  ): Promise<void> {
    // В реальной реализации здесь должно быть применение решения
    logger.info("Applying conflict resolution", {
      conflictId: conflict.id,
      resolution: conflict.resolution,
    });
  }

  private async _savePendingTransactions(): Promise<void> {
    const storageKey = "pending_transactions";
    localStorage.setItem(storageKey, JSON.stringify(this._pendingTransactions));
  }

  private async _saveSyncConflicts(): Promise<void> {
    const storageKey = "sync_conflicts";
    localStorage.setItem(storageKey, JSON.stringify(this._syncConflicts));
  }

  private _generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
