import { logger } from '../utils/logger';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number; // Time to live in seconds
}

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry<any>>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.cache = new Map();
    this.startCleanupInterval();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Clean up every minute
 }

  public async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl,
    };

    this.cache.set(key, entry);
    logger.debug(`Cached entry set: ${key}, TTL: ${ttl}s`);

    // Also save to localStorage for persistence
    this.saveToLocalStorage(key, entry);
  }

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      // Try to load from localStorage
      const stored = this.loadFromLocalStorage(key);
      if (stored) {
        this.cache.set(key, stored);
        return this.isExpired(stored) ? null : stored.value;
      }
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.removeFromLocalStorage(key);
      logger.debug(`Cached entry expired and removed: ${key}`);
      return null;
    }

    logger.debug(`Cached entry retrieved: ${key}`);
    return entry.value;
  }

  public async has(key: string): Promise<boolean> {
    const entry = await this.get(key);
    return entry !== null;
  }

  public async delete(key: string): Promise<void> {
    this.cache.delete(key);
    this.removeFromLocalStorage(key);
    logger.debug(`Cached entry deleted: ${key}`);
  }

  public async clear(): Promise<void> {
    this.cache.clear();
    this.clearLocalStorage();
    logger.info('Cache cleared');
  }

  public async getKeys(): Promise<string[]> {
    const now = Date.now();
    const validKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isExpired(entry)) {
        validKeys.push(key);
      } else {
        this.cache.delete(key);
        this.removeFromLocalStorage(key);
      }
    }

    // Also check localStorage for additional keys
    if (typeof window !== 'undefined') {
      for (let i = 0; i < window.localStorage.length; i++) {
        const storageKey = window.localStorage.key(i);
        if (storageKey && storageKey.startsWith('cache_')) {
          const stored = this.loadFromLocalStorage(storageKey);
          if (stored) {
            if (!this.isExpired(stored)) {
              validKeys.push(storageKey);
            } else {
              window.localStorage.removeItem(storageKey);
            }
          }
        }
      }
    }

    return validKeys;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    const expirationTime = entry.timestamp + (entry.ttl * 1000);
    return now > expirationTime;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let expiredCount = 0;

    // Clean up memory cache
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.removeFromLocalStorage(key);
        expiredCount++;
      }
    }

    // Clean up localStorage
    if (typeof window !== 'undefined') {
      for (let i = 0; i < window.localStorage.length; i++) {
        const storageKey = window.localStorage.key(i);
        if (storageKey && storageKey.startsWith('cache_')) {
          const stored = this.loadFromLocalStorage(storageKey);
          if (stored && this.isExpired(stored)) {
            window.localStorage.removeItem(storageKey);
            expiredCount++;
          }
        }
      }
    }

    if (expiredCount > 0) {
      logger.info(`Cleaned up ${expiredCount} expired cache entries`);
    }
  }

  private saveToLocalStorage<T>(key: string, entry: CacheEntry<T>): void {
    if (typeof window === 'undefined') return;

    try {
      const storageKey = `cache_${key}`;
      window.localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      logger.warn(`Failed to save cache entry to localStorage: ${key}`, error);
    }
  }

  private loadFromLocalStorage<T>(key: string): CacheEntry<T> | null {
    if (typeof window === 'undefined') return null;

    try {
      const storageKey = `cache_${key}`;
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed: CacheEntry<T> = JSON.parse(stored);
        return parsed;
      }
    } catch (error) {
      logger.warn(`Failed to load cache entry from localStorage: ${key}`, error);
    }

    return null;
  }

  private removeFromLocalStorage(key: string): void {
    if (typeof window === 'undefined') return;

    try {
      const storageKey = `cache_${key}`;
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      logger.warn(`Failed to remove cache entry from localStorage: ${key}`, error);
    }
  }

  private clearLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          window.localStorage.removeItem(key);
        }
      }
    } catch (error) {
      logger.warn('Failed to clear localStorage cache', error);
    }
  }

  public async invalidateByPrefix(prefix: string): Promise<void> {
    const keys = await this.getKeys();
    const keysToInvalidate = keys.filter(key => key.startsWith(prefix));

    for (const key of keysToInvalidate) {
      await this.delete(key);
    }

    logger.info(`Invalidated ${keysToInvalidate.length} cache entries with prefix: ${prefix}`);
  }

  public async getCacheStats(): Promise<{ size: number; totalSize: number; oldestEntry: number | null }> {
    const keys = await this.getKeys();
    const oldestEntry = keys.length > 0 
      ? Math.min(...Array.from(this.cache.values()).map(entry => entry.timestamp))
      : null;

    // Approximate size calculation
    let totalSize = 0;
    for (const [key, entry] of this.cache.entries()) {
      totalSize += JSON.stringify({ key, entry }).length;
    }

    return {
      size: keys.length,
      totalSize,
      oldestEntry,
    };
  }

  public async invalidateWalletBalanceCache(walletAddress: string): Promise<void> {
    await this.invalidateByPrefix(`balance_${walletAddress}`);
    logger.info(`Invalidated balance cache for wallet: ${walletAddress}`);
  }

  public async invalidateTokenBalanceCache(walletAddress: string, tokenMint: string): Promise<void> {
    await this.delete(`token_balance_${walletAddress}_${tokenMint}`);
    logger.info(`Invalidated token balance cache for wallet: ${walletAddress}, token: ${tokenMint}`);
  }

  public async invalidateTransactionHistoryCache(walletAddress: string): Promise<void> {
    await this.delete(`transaction_history_${walletAddress}`);
    logger.info(`Invalidated transaction history cache for wallet: ${walletAddress}`);
  }

  public async invalidateNFTMetadataCache(nftMint: string): Promise<void> {
    await this.delete(`nft_metadata_${nftMint}`);
    await this.delete(`nft_owner_${nftMint}`);
    logger.info(`Invalidated NFT metadata cache for NFT: ${nftMint}`);
  }

  public async invalidateExchangeRateCache(fromToken: string, toToken: string): Promise<void> {
    await this.delete(`exchange_rate_${fromToken}_${toToken}`);
    logger.info(`Invalidated exchange rate cache for ${fromToken} to ${toToken}`);
  }

  public async cleanup(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Specific caching methods for different data types

  public async cacheWalletBalance(walletAddress: string, balance: number, ttl: number = 300): Promise<void> {
    await this.set(`balance_${walletAddress}`, balance, ttl);
  }

  public async cacheTokenBalance(walletAddress: string, tokenMint: string, balance: number, ttl: number = 300): Promise<void> {
    await this.set(`token_balance_${walletAddress}_${tokenMint}`, balance, ttl);
  }

  public async cacheTransactionHistory(walletAddress: string, transactions: any[], ttl: number = 600): Promise<void> {
    await this.set(`transaction_history_${walletAddress}`, transactions, ttl);
  }

  public async cacheNFTMetadata(nftMint: string, metadata: any, ttl: number = 3600): Promise<void> {
    await this.set(`nft_metadata_${nftMint}`, metadata, ttl);
  }

  public async cacheNFTOwner(nftMint: string, owner: string, ttl: number = 300): Promise<void> {
    await this.set(`nft_owner_${nftMint}`, owner, ttl);
  }

  public async cacheExchangeRate(fromToken: string, toToken: string, rate: number, ttl: number = 300): Promise<void> {
    await this.set(`exchange_rate_${fromToken}_${toToken}`, rate, ttl);
  }

  public async cacheStakeInfo(walletAddress: string, stakeInfo: any, ttl: number = 300): Promise<void> {
    await this.set(`stake_info_${walletAddress}`, stakeInfo, ttl);
  }

  public async cacheProgramAccount(accountKey: string, accountData: any, ttl: number = 600): Promise<void> {
    await this.set(`program_account_${accountKey}`, accountData, ttl);
  }
}