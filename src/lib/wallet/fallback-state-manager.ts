import { logger } from '../utils/logger';
import { CacheManager } from './cache-manager';

export interface WalletState {
  publicKey: string | null;
  balance: number;
  tokens: { [mint: string]: number };
  nfts: string[];
  stakedAmount: number;
  lastUpdated: Date;
}

export interface NetworkState {
  publicKey: string | null;
  balance: number;
  tokens: { [mint: string]: number };
  nfts: string[];
  stakedAmount: number;
  blockHeight: number;
  lastSynced: Date;
}

export interface StateDifference {
  local: WalletState;
  network: NetworkState;
  conflicts: string[];
}

export class FallbackStateManager {
  private static instance: FallbackStateManager;
  private cacheManager: CacheManager;
  private localState: WalletState | null = null;
  private networkState: NetworkState | null = null;
  private stateSyncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.cacheManager = CacheManager.getInstance();
    this.loadStateFromStorage();
    this.startStateSync();
  }

  public static getInstance(): FallbackStateManager {
    if (!FallbackStateManager.instance) {
      FallbackStateManager.instance = new FallbackStateManager();
    }
    return FallbackStateManager.instance;
  }

  private loadStateFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const storedLocal = localStorage.getItem('wallet-local-state');
      const storedNetwork = localStorage.getItem('wallet-network-state');

      if (storedLocal) {
        const parsed = JSON.parse(storedLocal);
        this.localState = {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated),
        };
      }

      if (storedNetwork) {
        const parsed = JSON.parse(storedNetwork);
        this.networkState = {
          ...parsed,
          lastSynced: new Date(parsed.lastSynced),
        };
      }
    } catch (error) {
      logger.error('Failed to load wallet state from storage:', error);
    }
  }

  private saveStateToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      if (this.localState) {
        localStorage.setItem('wallet-local-state', JSON.stringify({
          ...this.localState,
          lastUpdated: this.localState.lastUpdated.toISOString(),
        }));
      }

      if (this.networkState) {
        localStorage.setItem('wallet-network-state', JSON.stringify({
          ...this.networkState,
          lastSynced: this.networkState.lastSynced.toISOString(),
        }));
      }
    } catch (error) {
      logger.error('Failed to save wallet state to storage:', error);
    }
  }

  private startStateSync(): void {
    this.stateSyncInterval = setInterval(() => {
      this.syncWithNetwork();
    }, 10000); // Sync every 10 seconds
  }

  public async updateLocalState(newState: Partial<WalletState>): Promise<void> {
    if (!this.localState) {
      this.localState = {
        publicKey: null,
        balance: 0,
        tokens: {},
        nfts: [],
        stakedAmount: 0,
        lastUpdated: new Date(),
      };
    }

    // Update local state with new values
    Object.assign(this.localState, newState, {
      lastUpdated: new Date(),
    });

    this.saveStateToStorage();
    logger.info('Local wallet state updated', newState);
  }

  public async updateNetworkState(newState: Partial<NetworkState>): Promise<void> {
    if (!this.networkState) {
      this.networkState = {
        publicKey: null,
        balance: 0,
        tokens: {},
        nfts: [],
        stakedAmount: 0,
        blockHeight: 0,
        lastSynced: new Date(),
      };
    }

    // Update network state with new values
    Object.assign(this.networkState, newState, {
      lastSynced: new Date(),
    });

    this.saveStateToStorage();
    logger.info('Network wallet state updated', newState);
  }

  public async syncWithNetwork(): Promise<boolean> {
    // This is a simplified implementation - in reality, you'd need to interact with Solana
    // to get the actual network state
    
    if (!this.localState || !this.networkState) {
      logger.warn('Cannot sync, states not initialized');
      return false;
    }

    try {
      // In a real implementation, this would fetch the actual network state
      // For now, we'll simulate by comparing local and network states
      
      const differences = await this.calculateDifferences();
      
      if (differences.conflicts.length > 0) {
        logger.warn('State conflicts detected:', differences.conflicts);
        await this.resolveConflicts(differences);
      } else {
        // If no conflicts, update local state to match network state
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
      logger.error('Failed to sync wallet state with network:', error);
      return false;
    }
  }

  public async calculateDifferences(): Promise<StateDifference> {
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
  }

  private async resolveConflicts(differences: StateDifference): Promise<void> {
    logger.info('Resolving wallet state conflicts:', differences.conflicts);

    // Strategy: Network state takes precedence for most values
    // But we need to handle specific cases carefully
    
    // For balance conflicts, we might want to use the higher value or investigate further
    if (differences.conflicts.some(conflict => conflict.includes('Balance mismatch'))) {
      // In case of balance conflicts, use the network value as the authoritative source
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

    logger.info('Wallet state conflicts resolved');
  }

  public async getLocalState(): Promise<WalletState | null> {
    return this.localState;
  }

  public async getNetworkState(): Promise<NetworkState | null> {
    return this.networkState;
  }

  public async isStateSynced(): Promise<boolean> {
    if (!this.localState || !this.networkState) {
      return false;
    }

    // Check if the states are approximately equal
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
  }

  public async getSyncStatus(): Promise<{
    isSynced: boolean;
    localLastUpdated: Date | null;
    networkLastSynced: Date | null;
    conflicts: string[];
  }> {
    const isSynced = await this.isStateSynced();
    const differences = await this.calculateDifferences();

    return {
      isSynced,
      localLastUpdated: this.localState?.lastUpdated || null,
      networkLastSynced: this.networkState?.lastSynced || null,
      conflicts: differences.conflicts,
    };
  }

  public async forceStateSync(): Promise<void> {
    logger.info('Forcing wallet state sync');
    
    // Clear local state and resync from network
    if (this.networkState) {
      await this.updateLocalState({
        publicKey: this.networkState.publicKey,
        balance: this.networkState.balance,
        tokens: { ...this.networkState.tokens },
        nfts: [...this.networkState.nfts],
        stakedAmount: this.networkState.stakedAmount,
      });
    }
  }

  public async resetLocalState(): Promise<void> {
    logger.info('Resetting local wallet state');
    
    this.localState = {
      publicKey: null,
      balance: 0,
      tokens: {},
      nfts: [],
      stakedAmount: 0,
      lastUpdated: new Date(),
    };
    
    this.saveStateToStorage();
 }

  public async cleanup(): Promise<void> {
    if (this.stateSyncInterval) {
      clearInterval(this.stateSyncInterval);
      this.stateSyncInterval = null;
    }
  }

  public async getWalletStateSummary(): Promise<{
    isOnline: boolean;
    hasLocalChanges: boolean;
    lastSyncTime: Date | null;
    pendingTransactions: number;
  }> {
    // This would integrate with OfflineTransactionManager in a real implementation
    // For now, we'll return a basic summary
    return {
      isOnline: true, // Would check actual network status in real implementation
      hasLocalChanges: this.localState?.lastUpdated > (this.networkState?.lastSynced || new Date(0)),
      lastSyncTime: this.networkState?.lastSynced || null,
      pendingTransactions: 0, // Would integrate with OfflineTransactionManager
    };
  }
}