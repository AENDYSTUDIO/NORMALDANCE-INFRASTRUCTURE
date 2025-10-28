import { Transaction } from '@solana/web3.js';
import { logger } from '../utils/logger';
import { CacheManager } from './cache-manager';
import { FallbackStateManager } from './fallback-state-manager';

export interface OfflineTransaction {
  id: string;
  type: 'transfer' | 'stake' | 'purchase' | 'nft-transfer' | 'swap';
  data: any;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  executedAt?: Date;
  status: 'pending' | 'executed' | 'failed' | 'conflict';
  error?: string;
  networkHash?: string;
}

export interface TransactionQueue {
  transactions: OfflineTransaction[];
  lastSyncedBlock: number | null;
}

export class OfflineTransactionManager {
  private static instance: OfflineTransactionManager;
  private transactionQueue: TransactionQueue;
  private cacheManager: CacheManager;
  private fallbackStateManager: FallbackStateManager;
  private isOnline: boolean = true;
  private syncInterval: NodeJS.Timeout | null = null;
  private networkStatusListener: (() => void) | null = null;

  private constructor() {
    this.transactionQueue = {
      transactions: [],
      lastSyncedBlock: null,
    };
    this.cacheManager = CacheManager.getInstance();
    this.fallbackStateManager = FallbackStateManager.getInstance();
    
    // Initialize from localStorage if available
    this.loadFromStorage();
    
    // Set up online/offline detection
    this.setupNetworkDetection();
    
    // Start sync interval when online
    if (typeof window !== 'undefined' && window.navigator.onLine) {
      this.startSyncInterval();
    }
  }

  public static getInstance(): OfflineTransactionManager {
    if (!OfflineTransactionManager.instance) {
      OfflineTransactionManager.instance = new OfflineTransactionManager();
    }
    return OfflineTransactionManager.instance;
  }

  private setupNetworkDetection() {
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      const previousStatus = this.isOnline;
      this.isOnline = window.navigator.onLine;
      
      if (previousStatus !== this.isOnline) {
        logger.info(`Network status changed: ${this.isOnline ? 'online' : 'offline'}`);
        
        if (this.isOnline) {
          this.startSyncInterval();
          this.syncPendingTransactions();
        }
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    this.networkStatusListener = updateOnlineStatus;
  }

  private startSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncPendingTransactions();
      }
    }, 5000); // Sync every 5 seconds when online
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('offline-transactions');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.transactionQueue = {
          transactions: parsed.transactions.map((tx: any) => ({
            ...tx,
            createdAt: new Date(tx.createdAt),
            executedAt: tx.executedAt ? new Date(tx.executedAt) : undefined,
          })),
          lastSyncedBlock: parsed.lastSyncedBlock,
        };
      }
    } catch (error) {
      logger.error('Failed to load offline transactions from storage:', error);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('offline-transactions', JSON.stringify({
        transactions: this.transactionQueue.transactions,
        lastSyncedBlock: this.transactionQueue.lastSyncedBlock,
      }));
    } catch (error) {
      logger.error('Failed to save offline transactions to storage:', error);
    }
  }

  public addTransaction(transaction: Omit<OfflineTransaction, 'id' | 'createdAt' | 'status'>): string {
    const id = this.generateTransactionId();
    const offlineTransaction: OfflineTransaction = {
      id,
      ...transaction,
      createdAt: new Date(),
      status: 'pending',
    };

    // Add to queue based on priority
    const priorityIndex = this.getTransactionPriorityIndex(offlineTransaction.priority);
    this.transactionQueue.transactions.splice(priorityIndex, 0, offlineTransaction);
    
    this.saveToStorage();
    logger.info(`Added offline transaction ${id} to queue`);
    
    // If online, try to sync immediately
    if (this.isOnline) {
      this.syncPendingTransactions();
    }

    return id;
  }

  private getTransactionPriorityIndex(priority: 'high' | 'medium' | 'low'): number {
    // High priority at the beginning, low priority at the end
    if (priority === 'high') return 0;
    if (priority === 'medium') {
      // Find first low priority transaction
      const lowIndex = this.transactionQueue.transactions.findIndex(tx => tx.priority === 'low');
      return lowIndex === -1 ? this.transactionQueue.transactions.length : lowIndex;
    }
    // Low priority at the end
    return this.transactionQueue.transactions.length;
  }

  private generateTransactionId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async syncPendingTransactions(): Promise<void> {
    if (!this.isOnline || this.transactionQueue.transactions.length === 0) {
      return;
    }

    logger.info(`Syncing ${this.transactionQueue.transactions.length} pending transactions`);

    // Process transactions in priority order
    const pendingTransactions = [...this.transactionQueue.transactions]
      .filter(tx => tx.status === 'pending')
      .sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));

    for (const transaction of pendingTransactions) {
      try {
        await this.executeTransaction(transaction);
      } catch (error) {
        logger.error(`Failed to execute transaction ${transaction.id}:`, error);
        this.updateTransactionStatus(transaction.id, 'failed', (error as Error).message);
      }
    }

    this.saveToStorage();
  }

  private getPriorityValue(priority: 'high' | 'medium' | 'low'): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  private async executeTransaction(transaction: OfflineTransaction): Promise<void> {
    // This is a simplified implementation - in reality, you'd need to interact with Solana
    // and potentially use the wallet adapter to sign and send transactions
    logger.info(`Executing offline transaction ${transaction.id}`);
    
    // Simulate transaction execution
    // In a real implementation, this would involve:
    // 1. Creating the actual Solana transaction
    // 2. Signing it with the wallet
    // 3. Sending it to the network
    // 4. Handling the response
    
    // For now, mark as executed
    this.updateTransactionStatus(transaction.id, 'executed');
    
    // Update local state after successful execution
    await this.updateLocalState(transaction);
  }

  private async updateLocalState(transaction: OfflineTransaction): Promise<void> {
    // Update cached balances and data based on the transaction
    switch (transaction.type) {
      case 'transfer':
        // Update sender and receiver balances
        if (transaction.data.from && transaction.data.to && transaction.data.amount) {
          const fromBalance = await this.cacheManager.get<number>(`balance_${transaction.data.from}`);
          const toBalance = await this.cacheManager.get<number>(`balance_${transaction.data.to}`);
          
          if (fromBalance !== null) {
            await this.cacheManager.set(
              `balance_${transaction.data.from}`, 
              fromBalance - transaction.data.amount,
              300 // 5 minutes TTL
            );
          }
          
          if (toBalance !== null) {
            await this.cacheManager.set(
              `balance_${transaction.data.to}`, 
              toBalance + transaction.data.amount,
              300 // 5 minutes TTL
            );
          }
        }
        break;
        
      case 'stake':
        // Update staking information
        const stakingBalance = await this.cacheManager.get<number>(`stake_balance_${transaction.data.wallet}`);
        if (stakingBalance !== null) {
          await this.cacheManager.set(
            `stake_balance_${transaction.data.wallet}`, 
            stakingBalance + transaction.data.amount,
            300 // 5 minutes TTL
          );
        }
        break;
        
      case 'nft-transfer':
        // Update NFT ownership
        const nftOwners = await this.cacheManager.get<string[]>(`nft_owners_${transaction.data.nftId}`) || [];
        const updatedOwners = nftOwners.filter(owner => owner !== transaction.data.from)
                                      .concat(transaction.data.to);
        await this.cacheManager.set(
          `nft_owners_${transaction.data.nftId}`,
          updatedOwners,
          300 // 5 minutes TTL
        );
        break;
    }
  }

  private updateTransactionStatus(id: string, status: OfflineTransaction['status'], error?: string): void {
    const transaction = this.transactionQueue.transactions.find(tx => tx.id === id);
    if (transaction) {
      transaction.status = status;
      transaction.executedAt = status === 'executed' ? new Date() : transaction.executedAt;
      if (error) {
        transaction.error = error;
      }
      
      // Remove successful transactions from queue after a while
      if (status === 'executed') {
        setTimeout(() => {
          this.transactionQueue.transactions = this.transactionQueue.transactions.filter(tx => tx.id !== id);
          this.saveToStorage();
        }, 30000); // Remove after 30 seconds to allow for verification
      }
      
      this.saveToStorage();
    }
  }

  public getTransactionQueue(): OfflineTransaction[] {
    return [...this.transactionQueue.transactions];
  }

  public getPendingTransactions(): OfflineTransaction[] {
    return this.transactionQueue.transactions.filter(tx => tx.status === 'pending');
  }

  public getExecutedTransactions(): OfflineTransaction[] {
    return this.transactionQueue.transactions.filter(tx => tx.status === 'executed');
  }

  public async resolveConflicts(): Promise<void> {
    // Check for conflicting transactions (e.g., double spending)
    const pendingTransactions = this.getPendingTransactions();
    
    // Group by affected accounts/wallets
    const groupedByWallet: { [key: string]: OfflineTransaction[] } = {};
    
    for (const tx of pendingTransactions) {
      let walletKey = '';
      
      switch (tx.type) {
        case 'transfer':
          walletKey = tx.data.from || tx.data.to;
          break;
        case 'stake':
          walletKey = tx.data.wallet;
          break;
        case 'nft-transfer':
          walletKey = tx.data.from;
          break;
        default:
          walletKey = 'general';
      }
      
      if (walletKey) {
        if (!groupedByWallet[walletKey]) {
          groupedByWallet[walletKey] = [];
        }
        groupedByWallet[walletKey].push(tx);
      }
    }
    
    // For each group, check for conflicts (e.g., insufficient balance)
    for (const [wallet, transactions] of Object.entries(groupedByWallet)) {
      if (transactions.length > 1) {
        await this.checkAndResolveWalletConflicts(wallet, transactions);
      }
    }
  }

  private async checkAndResolveWalletConflicts(wallet: string, transactions: OfflineTransaction[]): Promise<void> {
    // Check if transactions would result in negative balance
    let currentBalance = await this.cacheManager.get<number>(`balance_${wallet}`);
    if (currentBalance === null) {
      // If not in cache, try to get from network (if online)
      if (this.isOnline) {
        // In a real implementation, fetch from network
        currentBalance = 0; // Default to 0 if can't fetch
      } else {
        currentBalance = 0; // Default to 0 if offline
      }
    }
    
    let balanceAfterPending = currentBalance;
    const conflictingTransactions: OfflineTransaction[] = [];
    
    for (const tx of transactions) {
      if (tx.type === 'transfer' && tx.data.from === wallet) {
        if (balanceAfterPending < tx.data.amount) {
          conflictingTransactions.push(tx);
          this.updateTransactionStatus(tx.id, 'conflict', 'Insufficient balance for pending transactions');
        } else {
          balanceAfterPending -= tx.data.amount;
        }
      }
      // Add other conflict checks for different transaction types
    }
  }

  public async cleanup(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.networkStatusListener && typeof window !== 'undefined') {
      window.removeEventListener('online', this.networkStatusListener);
      window.removeEventListener('offline', this.networkStatusListener);
    }
  }

  public isCurrentlyOnline(): boolean {
    return this.isOnline;
  }
}