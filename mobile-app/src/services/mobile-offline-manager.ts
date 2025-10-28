import * as FileSystem from 'expo-file-system';
import { Transaction } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Типы для MobileOfflineManager
export interface MobileOfflineConfig {
  maxQueueSize: number;
  syncInterval: number;
  retryAttempts: number;
  storageQuota: number; // в байтах
  conflictResolution: 'last-wins' | 'first-wins' | 'manual';
}

export interface PendingTransaction {
  id: string;
  transaction: string; // сериализованный transaction
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  retryCount: number;
  maxRetries: number;
  metadata: TransactionMetadata;
}

export interface TransactionMetadata {
  type: 'transfer' | 'stake' | 'unstake' | 'purchase';
  amount: number;
  recipient?: string;
  description?: string;
  createdAt: number;
}

export interface BalanceCache {
  publicKey: string;
  balance: number;
  tokenBalances: Record<string, number>;
  timestamp: number;
  blockHeight: number;
}

export interface SyncConflict {
  transactionId: string;
  localState: any;
  remoteState: any;
  resolution: 'local' | 'remote' | 'manual';
}

export class MobileOfflineManager {
  private config: MobileOfflineConfig;
  private transactionQueue: PendingTransaction[];
  private balanceCache: Map<string, BalanceCache>;
  private isOnline: boolean = true;
  private syncTimer: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;
 private eventHandlers: Map<string, Function[]>;

  constructor(config: MobileOfflineConfig) {
    this.config = config;
    this.transactionQueue = [];
    this.balanceCache = new Map();
    this.eventHandlers = new Map();
    this.setupNetworkListeners();
  }

  async initialize(): Promise<void> {
    // Загрузка очереди транзакций из локального хранилища
    await this.loadTransactionQueue();
    
    // Загрузка кэша балансов
    await this.loadBalanceCache();
    
    // Проверка онлайн статуса
    this.isOnline = this.checkOnlineStatus();
    
    // Запуск фоновой синхронизации
    this.startBackgroundSync();
  }

  private setupNetworkListeners(): void {
    // В мобильной среде Expo Network API может быть использован для отслеживания статуса сети
    // Для упрощения реализации используем встроенную проверку
    // В реальной реализации использовать expo-network для отслеживания изменений статуса сети
    this.simulateNetworkChanges();
  }

  private simulateNetworkChanges(): void {
    // Временная реализация - проверка статуса сети каждые 5 секунд
    setInterval(() => {
      const wasOnline = this.isOnline;
      this.isOnline = this.checkOnlineStatus();
      
      if (!wasOnline && this.isOnline) {
        // Сеть восстановлена, запускаем синхронизацию
        this.processQueue().catch(console.error);
      }
    }, 5000);
  }

  private checkOnlineStatus(): boolean {
    // Временная реализация - в реальной версии использовать expo-network
    // для проверки статуса подключения к интернету
    try {
      // В мобильной среде можно использовать различные методы проверки
      // соединения, включая ping до API сервера
      return true; // Временно считаем, что всегда онлайн для демонстрации
    } catch (error) {
      return false;
    }
  }

  async queueTransaction(transaction: Transaction): Promise<string> {
    try {
      // Проверка размера очереди
      if (this.transactionQueue.length >= this.config.maxQueueSize) {
        throw new Error('Transaction queue is full');
      }

      // Сериализация транзакции
      const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');
      
      // Создание метаданных транзакции (упрощенная версия)
      const metadata: TransactionMetadata = {
        type: 'transfer', // В реальной реализации определять тип транзакции
        amount: 0, // В реальной реализации извлекать из транзакции
        createdAt: Date.now()
      };

      const transactionId = this.generateTransactionId();
      
      const pendingTransaction: PendingTransaction = {
        id: transactionId,
        transaction: serializedTransaction,
        timestamp: Date.now(),
        priority: this.calculatePriority(metadata),
        retryCount: 0,
        maxRetries: this.config.retryAttempts,
        metadata
      };

      // Добавление в очередь
      this.transactionQueue.push(pendingTransaction);
      
      // Сохранение в локальное хранилище
      await this.saveTransactionQueue();
      
      // Вызов обработчиков событий
      this.emitEvent('queue_updated', { transactionId, queueSize: this.transactionQueue.length });
      
      return transactionId;
    } catch (error) {
      console.error('Failed to queue transaction:', error);
      throw new Error(`Transaction queuing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculatePriority(metadata: TransactionMetadata): 'low' | 'medium' | 'high' {
    // Определение приоритета на основе типа и суммы транзакции
    if (metadata.type === 'purchase' || metadata.amount > 100) {
      return 'high';
    } else if (metadata.type === 'stake' || metadata.amount > 10) {
      return 'medium';
    }
    return 'low';
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.isOnline) {
      return;
    }

    this.isProcessing = true;
    this.emitEvent('sync_started', {});

    try {
      const queue = [...this.transactionQueue]; // Создаем копию очереди
      const sortedQueue = this.sortQueueByPriority(queue);

      for (const pendingTx of sortedQueue) {
        try {
          await this.processTransaction(pendingTx);
          
          // Удаление успешно обработанной транзакции
          this.transactionQueue = this.transactionQueue.filter(tx => tx.id !== pendingTx.id);
        } catch (error) {
          await this.handleTransactionError(pendingTx, error as Error);
        }
      }

      // Сохранение обновленной очереди
      await this.saveTransactionQueue();
      
      this.emitEvent('sync_completed', { processed: sortedQueue.length });
    } finally {
      this.isProcessing = false;
    }
 }

  private sortQueueByPriority(queue: PendingTransaction[]): PendingTransaction[] {
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    
    return queue.sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority] || 
             a.timestamp - b.timestamp; // По времени создания как резерв
    });
 }

  private async processTransaction(pendingTx: PendingTransaction): Promise<void> {
    try {
      // Десериализация транзакции
      const transactionBuffer = Buffer.from(pendingTx.transaction, 'base64');
      // В реальной реализации нужно восстановить транзакцию из буфера
      
      // Временная реализация - в реальной версии отправить транзакцию в сеть
      console.log(`Processing transaction ${pendingTx.id}`);
      
      // В реальной реализации:
      // 1. Подключиться к Solana RPC
      // 2. Отправить транзакцию
      // 3. Дождаться подтверждения
      // 4. Обработать результат
    } catch (error) {
      throw new Error(`Transaction processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
 }

  private async handleTransactionError(pendingTx: PendingTransaction, error: Error): Promise<void> {
    pendingTx.retryCount++;
    
    if (pendingTx.retryCount >= pendingTx.maxRetries) {
      // Удаление транзакции после максимального количества попыток
      this.transactionQueue = this.transactionQueue.filter(tx => tx.id !== pendingTx.id);
      
      this.emitEvent('transaction_failed', { 
        transactionId: pendingTx.id, 
        error: error.message,
        maxRetriesReached: true 
      });
      
      throw new Error(`Transaction ${pendingTx.id} failed after ${pendingTx.maxRetries} attempts: ${error.message}`);
    }
    
    // Обновление транзакции с увеличенным счетчиком попыток
    const index = this.transactionQueue.findIndex(tx => tx.id === pendingTx.id);
    if (index !== -1) {
      this.transactionQueue[index] = pendingTx;
    }
    
    // Сохранение обновленной очереди
    await this.saveTransactionQueue();
    
    this.emitEvent('transaction_retry', { 
      transactionId: pendingTx.id, 
      retryCount: pendingTx.retryCount,
      error: error.message 
    });
 }

  async getQueue(): Promise<PendingTransaction[]> {
    return [...this.transactionQueue];
  }

  async clearQueue(): Promise<void> {
    this.transactionQueue = [];
    await this.saveTransactionQueue();
    this.emitEvent('queue_cleared', {});
  }

  async cacheBalance(balance: BalanceCache): Promise<void> {
    try {
      this.balanceCache.set(balance.publicKey, balance);
      
      // Сохранение в локальное хранилище
      await this.saveBalanceCache();
      
      this.emitEvent('balance_cached', { publicKey: balance.publicKey });
    } catch (error) {
      console.error('Failed to cache balance:', error);
      throw new Error(`Balance caching failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCachedBalance(publicKey: string): Promise<BalanceCache | null> {
    try {
      return this.balanceCache.get(publicKey) || null;
    } catch (error) {
      console.error('Failed to get cached balance:', error);
      return null;
    }
  }

 async invalidateCache(publicKey: string): Promise<void> {
    try {
      this.balanceCache.delete(publicKey);
      
      // Сохранение обновленного кэша
      await this.saveBalanceCache();
      
      this.emitEvent('cache_invalidated', { publicKey });
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
      throw new Error(`Cache invalidation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async syncWhenOnline(): Promise<void> {
    if (this.isOnline) {
      await this.processQueue();
    }
  }

  private startBackgroundSync(): void {
    if (this.config.syncInterval > 0) {
      this.syncTimer = setInterval(() => {
        if (this.isOnline) {
          this.processQueue().catch(console.error);
        }
      }, this.config.syncInterval);
    }
  }

 private generateTransactionId(): string {
    return `offline_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveTransactionQueue(): Promise<void> {
    try {
      const queuePath = `${FileSystem.documentDirectory}offline_tx_queue.json`;
      const queueData = JSON.stringify(this.transactionQueue);
      await FileSystem.writeAsStringAsync(queuePath, queueData);
    } catch (error) {
      console.error('Failed to save transaction queue:', error);
    }
  }

 private async loadTransactionQueue(): Promise<void> {
    try {
      const queuePath = `${FileSystem.documentDirectory}offline_tx_queue.json`;
      const fileInfo = await FileSystem.getInfoAsync(queuePath);
      
      if (fileInfo.exists) {
        const queueData = await FileSystem.readAsStringAsync(queuePath);
        this.transactionQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load transaction queue:', error);
      this.transactionQueue = []; // Начинаем с пустой очереди в случае ошибки
    }
 }

  private async saveBalanceCache(): Promise<void> {
    try {
      const cachePath = `${FileSystem.documentDirectory}balance_cache.json`;
      const cacheData = JSON.stringify(Array.from(this.balanceCache.entries()));
      await FileSystem.writeAsStringAsync(cachePath, cacheData);
    } catch (error) {
      console.error('Failed to save balance cache:', error);
    }
  }

  private async loadBalanceCache(): Promise<void> {
    try {
      const cachePath = `${FileSystem.documentDirectory}balance_cache.json`;
      const fileInfo = await FileSystem.getInfoAsync(cachePath);
      
      if (fileInfo.exists) {
        const cacheData = await FileSystem.readAsStringAsync(cachePath);
        const cacheEntries: [string, BalanceCache][] = JSON.parse(cacheData);
        this.balanceCache = new Map(cacheEntries);
      }
    } catch (error) {
      console.error('Failed to load balance cache:', error);
      this.balanceCache = new Map(); // Начинаем с пустого кэша в случае ошибки
    }
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

 off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emitEvent(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

 async resolveConflicts(conflicts: SyncConflict[]): Promise<void> {
    for (const conflict of conflicts) {
      switch (this.config.conflictResolution) {
        case 'last-wins':
          // Используем локальное состояние
          break;
        case 'first-wins':
          // Используем удаленное состояние
          break;
        case 'manual':
          // Требуется ручное разрешение
          this.emitEvent('conflict_detected', conflict);
          break;
      }
    }
  }

  async cleanup(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

 getQueueSize(): number {
    return this.transactionQueue.length;
  }

  isProcessingQueue(): boolean {
    return this.isProcessing;
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

// Extended interfaces for enhanced offline functionality
export interface EnhancedTransactionMetadata extends TransactionMetadata {
  source: 'user' | 'system' | 'recurring';
  tags?: string[];
  estimatedFee?: number;
}

export interface EnhancedPendingTransaction extends PendingTransaction {
  metadata: EnhancedTransactionMetadata;
  networkHash?: string;
  executedAt?: number;
  status: 'pending' | 'executed' | 'failed' | 'conflict';
  error?: string;
}

export interface MobileWalletState {
  publicKey: string | null;
  balance: number;
 tokens: { [mint: string]: number };
  nfts: string[];
  stakedAmount: number;
 lastUpdated: number;
}

export interface NetworkState {
  publicKey: string | null;
  balance: number;
  tokens: { [mint: string]: number };
  nfts: string[];
  stakedAmount: number;
  blockHeight: number;
  lastSynced: number;
}

// Enhanced MobileOfflineManager with additional functionality
export interface MobileOfflineManager {
  cacheManager: any; // Placeholder for cache manager
  stateManager: any; // Placeholder for state manager
  
  // Enhanced transaction methods
  addTransaction(transaction: Omit<EnhancedPendingTransaction, 'id' | 'timestamp' | 'retryCount'>): Promise<string>;
  updateTransactionStatus(id: string, status: EnhancedPendingTransaction['status'], error?: string): Promise<void>;
  getPendingTransactions(): EnhancedPendingTransaction[];
  getExecutedTransactions(): EnhancedPendingTransaction[];
  
  // State management methods
  updateLocalState(newState: Partial<MobileWalletState>): Promise<void>;
  updateNetworkState(newState: Partial<NetworkState>): Promise<void>;
  getLocalState(): Promise<MobileWalletState | null>;
  getNetworkState(): Promise<NetworkState | null>;
  syncWithNetwork(): Promise<boolean>;
  isStateSynced(): Promise<boolean>;
  
  // Enhanced caching methods
  cacheWalletBalance(walletAddress: string, balance: number, ttl?: number): Promise<void>;
  cacheTokenBalance(walletAddress: string, tokenMint: string, balance: number, ttl?: number): Promise<void>;
  cacheTransactionHistory(walletAddress: string, transactions: any[], ttl?: number): Promise<void>;
  cacheNFTMetadata(nftMint: string, metadata: any, ttl?: number): Promise<void>;
  cacheExchangeRate(fromToken: string, toToken: string, rate: number, ttl?: number): Promise<void>;
  
  // Conflict resolution
  resolveConflicts(): Promise<void>;
  calculateDifferences(): Promise<{
    local: MobileWalletState;
    network: NetworkState;
    conflicts: string[];
  }>;
}

// Extend the existing MobileOfflineManager class with enhanced functionality
declare module './mobile-offline-manager' {
  interface MobileOfflineManager {
    enhancedTransactionQueue: EnhancedPendingTransaction[];
    localState: MobileWalletState | null;
    networkState: NetworkState | null;
 }
}

// Add enhanced methods to the existing class
const originalInitialize = MobileOfflineManager.prototype.initialize;
MobileOfflineManager.prototype.initialize = async function(this: any) {
  await originalInitialize.call(this);
  
  // Initialize enhanced properties
  this.enhancedTransactionQueue = [];
  this.localState = null;
  this.networkState = null;
  
  // Load enhanced transaction queue
  await this.loadEnhancedTransactionQueue();
  
  // Initialize state managers
  await this.initializeStateManager();
};

MobileOfflineManager.prototype.loadEnhancedTransactionQueue = async function(this: any) {
  try {
    const queueData = await AsyncStorage.getItem('mobile_enhanced_tx_queue');
    if (queueData) {
      this.enhancedTransactionQueue = JSON.parse(queueData);
    }
  } catch (error) {
    console.error('Failed to load enhanced transaction queue:', error);
    this.enhancedTransactionQueue = [];
  }
};

MobileOfflineManager.prototype.saveEnhancedTransactionQueue = async function(this: any) {
 try {
    await AsyncStorage.setItem('mobile_enhanced_tx_queue', JSON.stringify(this.enhancedTransactionQueue));
  } catch (error) {
    console.error('Failed to save enhanced transaction queue:', error);
  }
};

MobileOfflineManager.prototype.addTransaction = async function(this: any, transactionData: Omit<EnhancedPendingTransaction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
  const transactionId = `mobile_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const enhancedTransaction: EnhancedPendingTransaction = {
    id: transactionId,
    transaction: transactionData.transaction,
    timestamp: Date.now(),
    priority: transactionData.priority,
    retryCount: 0,
    maxRetries: transactionData.maxRetries || this.config.retryAttempts,
    metadata: {
      ...transactionData.metadata,
      createdAt: Date.now()
    },
    status: 'pending'
  };
  
  this.enhancedTransactionQueue.push(enhancedTransaction);
  await this.saveEnhancedTransactionQueue();
  
  this.emitEvent('enhanced_queue_updated', { 
    transactionId, 
    queueSize: this.enhancedTransactionQueue.length 
  });
  
  // If online, try to sync immediately
  if (this.isOnline) {
    this.processQueue().catch(console.error);
  }
  
  return transactionId;
};

MobileOfflineManager.prototype.updateTransactionStatus = async function(this: any, id: string, status: EnhancedPendingTransaction['status'], error?: string): Promise<void> {
  const transaction = this.enhancedTransactionQueue.find(tx => tx.id === id);
 if (transaction) {
    transaction.status = status;
    if (error) {
      transaction.error = error;
    }
    if (status === 'executed') {
      transaction.executedAt = Date.now();
    }
    
    // Remove successful transactions after a while
    if (status === 'executed') {
      setTimeout(() => {
        this.enhancedTransactionQueue = this.enhancedTransactionQueue.filter(tx => tx.id !== id);
        this.saveEnhancedTransactionQueue().catch(console.error);
      }, 30000); // Remove after 30 seconds
    }
    
    await this.saveEnhancedTransactionQueue();
  }
};

MobileOfflineManager.prototype.getPendingTransactions = function(this: any): EnhancedPendingTransaction[] {
  return this.enhancedTransactionQueue.filter(tx => tx.status === 'pending');
};

MobileOfflineManager.prototype.getExecutedTransactions = function(this: any): EnhancedPendingTransaction[] {
  return this.enhancedTransactionQueue.filter(tx => tx.status === 'executed');
};

MobileOfflineManager.prototype.initializeStateManager = async function(this: any) {
 try {
    const localStateData = await AsyncStorage.getItem('mobile_local_state');
    const networkStateData = await AsyncStorage.getItem('mobile_network_state');
    
    if (localStateData) {
      this.localState = JSON.parse(localStateData);
    }
    
    if (networkStateData) {
      this.networkState = JSON.parse(networkStateData);
    }
  } catch (error) {
    console.error('Failed to initialize state manager:', error);
  }
};

MobileOfflineManager.prototype.updateLocalState = async function(this: any, newState: Partial<MobileWalletState>): Promise<void> {
  if (!this.localState) {
    this.localState = {
      publicKey: null,
      balance: 0,
      tokens: {},
      nfts: [],
      stakedAmount: 0,
      lastUpdated: Date.now()
    };
 }
  
  Object.assign(this.localState, newState, {
    lastUpdated: Date.now()
  });
  
  try {
    await AsyncStorage.setItem('mobile_local_state', JSON.stringify(this.localState));
  } catch (error) {
    console.error('Failed to save local state:', error);
  }
};

MobileOfflineManager.prototype.updateNetworkState = async function(this: any, newState: Partial<NetworkState>): Promise<void> {
  if (!this.networkState) {
    this.networkState = {
      publicKey: null,
      balance: 0,
      tokens: {},
      nfts: [],
      stakedAmount: 0,
      blockHeight: 0,
      lastSynced: Date.now()
    };
 }
  
  Object.assign(this.networkState, newState, {
    lastSynced: Date.now()
  });
  
  try {
    await AsyncStorage.setItem('mobile_network_state', JSON.stringify(this.networkState));
  } catch (error) {
    console.error('Failed to save network state:', error);
  }
};

MobileOfflineManager.prototype.getLocalState = async function(this: any): Promise<MobileWalletState | null> {
  return this.localState;
};

MobileOfflineManager.prototype.getNetworkState = async function(this: any): Promise<NetworkState | null> {
  return this.networkState;
};

MobileOfflineManager.prototype.syncWithNetwork = async function(this: any): Promise<boolean> {
  if (!this.localState || !this.networkState) {
    return false;
  }
  
  try {
    // In a real implementation, this would sync with the actual network
    // For now, we'll just check for differences and resolve conflicts
    const differences = await this.calculateDifferences();
    
    if (differences.conflicts.length > 0) {
      await this.resolveConflicts();
    } else {
      // Update local state to match network state if no conflicts
      await this.updateLocalState({
        publicKey: this.networkState.publicKey,
        balance: this.networkState.balance,
        tokens: { ...this.networkState.tokens },
        nfts: [...this.networkState.nfts],
        stakedAmount: this.networkState.stakedAmount,
      });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to sync with network:', error);
    return false;
  }
};

MobileOfflineManager.prototype.isStateSynced = async function(this: any): Promise<boolean> {
  if (!this.localState || !this.networkState) {
    return false;
  }
  
  const balanceMatch = Math.abs(this.localState.balance - this.networkState.balance) < 0.001;
  const stakedAmountMatch = this.localState.stakedAmount === this.networkState.stakedAmount;
  
  // Check token balances
  const tokenMints = new Set([
    ...Object.keys(this.localState.tokens),
    ...Object.keys(this.networkState.tokens)
  ]);
  
  let tokensMatch = true;
  for (const mint of tokenMints) {
    const localBalance = this.localState.tokens[mint] || 0;
    const networkBalance = this.networkState.tokens[mint] || 0;
    
    if (Math.abs(localBalance - networkBalance) >= 0.001) {
      tokensMatch = false;
      break;
    }
  }
  
  // Check NFTs
  const localNFTSet = new Set(this.localState.nfts);
  const networkNFTSet = new Set(this.networkState.nfts);
  const nftsMatch = localNFTSet.size === networkNFTSet.size && 
                   [...localNFTSet].every(nft => networkNFTSet.has(nft));
  
  return balanceMatch && stakedAmountMatch && tokensMatch && nftsMatch;
};

MobileOfflineManager.prototype.calculateDifferences = async function(this: any): Promise<{
  local: MobileWalletState;
  network: NetworkState;
  conflicts: string[];
}> {
  if (!this.localState || !this.networkState) {
    throw new Error('Wallet states not initialized');
  }
  
  const conflicts: string[] = [];
  
  // Check for balance conflicts
 if (this.localState.balance !== this.networkState.balance) {
    conflicts.push(`Balance mismatch: local ${this.localState.balance}, network ${this.networkState.balance}`);
  }
  
  // Check for token conflicts
  const allTokenMints = new Set([
    ...Object.keys(this.localState.tokens),
    ...Object.keys(this.networkState.tokens)
  ]);
  
  for (const mint of allTokenMints) {
    const localBalance = this.localState.tokens[mint] || 0;
    const networkBalance = this.networkState.tokens[mint] || 0;
    
    if (localBalance !== networkBalance) {
      conflicts.push(`Token ${mint} balance mismatch: local ${localBalance}, network ${networkBalance}`);
    }
  }
  
  // Check for NFT conflicts
  const localNFTs = new Set(this.localState.nfts);
  const networkNFTs = new Set(this.networkState.nfts);
  
  const missingInLocal = [...networkNFTs].filter(nft => !localNFTs.has(nft));
  const missingInNetwork = [...localNFTs].filter(nft => !networkNFTs.has(nft));
  
  if (missingInLocal.length > 0) {
    conflicts.push(`NFTs missing in local state: ${missingInLocal.join(', ')}`);
  }
  
  if (missingInNetwork.length > 0) {
    conflicts.push(`NFTs missing in network state: ${missingInNetwork.join(', ')}`);
  }
  
  // Check for staking conflicts
  if (this.localState.stakedAmount !== this.networkState.stakedAmount) {
    conflicts.push(`Staked amount mismatch: local ${this.localState.stakedAmount}, network ${this.networkState.stakedAmount}`);
  }
  
  return {
    local: this.localState,
    network: this.networkState,
    conflicts,
  };
};

MobileOfflineManager.prototype.resolveConflicts = async function(this: any): Promise<void> {
  console.log('Resolving mobile wallet state conflicts');
  
  if (!this.localState || !this.networkState) {
    return;
  }
  
  const differences = await this.calculateDifferences();
  
  // Strategy: Network state takes precedence for most values
  if (differences.conflicts.some(conflict => conflict.includes('Balance mismatch'))) {
    await this.updateLocalState({
      balance: differences.network.balance,
    });
  }
  
  // For token conflicts, merge the token states carefully
  if (differences.conflicts.some(conflict => conflict.includes('Token balance mismatch'))) {
    const mergedTokens = { ...differences.network.tokens };
    
    // Add tokens that exist locally but not on network (could be from pending transactions)
    for (const [mint, balance] of Object.entries(differences.local.tokens)) {
      if (!(mint in mergedTokens)) {
        mergedTokens[mint] = balance;
      }
    }
    
    await this.updateLocalState({
      tokens: mergedTokens,
    });
  }
  
  // For NFT conflicts, merge the NFT lists
  if (differences.conflicts.some(conflict => 
    conflict.includes('NFTs missing in local state') || 
    conflict.includes('NFTs missing in network state')
  )) {
    const mergedNFTs = Array.from(
      new Set([...differences.network.nfts, ...differences.local.nfts])
    );
    
    await this.updateLocalState({
      nfts: mergedNFTs,
    });
  }
  
  // For staking conflicts, use network state as authoritative
  if (differences.conflicts.some(conflict => conflict.includes('Staked amount mismatch'))) {
    await this.updateLocalState({
      stakedAmount: differences.network.stakedAmount,
    });
  }
  
  console.log('Mobile wallet state conflicts resolved');
};

// Enhanced caching methods
MobileOfflineManager.prototype.cacheWalletBalance = async function(this: any, walletAddress: string, balance: number, ttl: number = 300): Promise<void> {
  const cacheKey = `balance_${walletAddress}`;
  const cacheData = {
    value: balance,
    timestamp: Date.now(),
    ttl
  };
  
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to cache wallet balance:', error);
  }
};

MobileOfflineManager.prototype.cacheTokenBalance = async function(this: any, walletAddress: string, tokenMint: string, balance: number, ttl: number = 300): Promise<void> {
  const cacheKey = `token_balance_${walletAddress}_${tokenMint}`;
  const cacheData = {
    value: balance,
    timestamp: Date.now(),
    ttl
  };
  
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to cache token balance:', error);
  }
};

MobileOfflineManager.prototype.cacheTransactionHistory = async function(this: any, walletAddress: string, transactions: any[], ttl: number = 600): Promise<void> {
  const cacheKey = `transaction_history_${walletAddress}`;
  const cacheData = {
    value: transactions,
    timestamp: Date.now(),
    ttl
  };
  
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to cache transaction history:', error);
  }
};

MobileOfflineManager.prototype.cacheNFTMetadata = async function(this: any, nftMint: string, metadata: any, ttl: number = 3600): Promise<void> {
  const cacheKey = `nft_metadata_${nftMint}`;
  const cacheData = {
    value: metadata,
    timestamp: Date.now(),
    ttl
  };
  
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to cache NFT metadata:', error);
  }
};

MobileOfflineManager.prototype.cacheExchangeRate = async function(this: any, fromToken: string, toToken: string, rate: number, ttl: number = 300): Promise<void> {
  const cacheKey = `exchange_rate_${fromToken}_${toToken}`;
  const cacheData = {
    value: rate,
    timestamp: Date.now(),
    ttl
  };
  
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to cache exchange rate:', error);
  }
};