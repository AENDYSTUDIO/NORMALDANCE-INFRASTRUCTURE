import { OfflineTransactionManager } from '../offline-transaction-manager';
import { CacheManager } from '../cache-manager';
import { FallbackStateManager } from '../fallback-state-manager';

describe('OfflineTransactionManager', () => {
  let offlineManager: OfflineTransactionManager;
  let cacheManager: CacheManager;
  let stateManager: FallbackStateManager;

  beforeEach(() => {
    // Mock window object for testing
    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      writable: true,
    });

    offlineManager = OfflineTransactionManager.getInstance();
    cacheManager = CacheManager.getInstance();
    stateManager = FallbackStateManager.getInstance();
 });

  afterEach(async () => {
    // Cleanup after each test
    await offlineManager.cleanup();
    await cacheManager.clear();
    await stateManager.cleanup();
  });

  test('should create offline transaction', () => {
    const transactionData = {
      type: 'transfer' as const,
      data: {
        from: 'wallet1',
        to: 'wallet2',
        amount: 100,
      },
      priority: 'high' as const,
    };

    const transactionId = offlineManager.addTransaction(transactionData);
    const queue = offlineManager.getTransactionQueue();

    expect(transactionId).toBeDefined();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe(transactionId);
    expect(queue[0].status).toBe('pending');
  });

  test('should handle different transaction priorities', () => {
    // Add low priority transaction
    offlineManager.addTransaction({
      type: 'transfer',
      data: { from: 'wallet1', to: 'wallet2', amount: 10 },
      priority: 'low',
    });

    // Add high priority transaction
    offlineManager.addTransaction({
      type: 'transfer',
      data: { from: 'wallet1', to: 'wallet2', amount: 100 },
      priority: 'high',
    });

    const queue = offlineManager.getTransactionQueue();
    expect(queue[0].priority).toBe('high');
    expect(queue[1].priority).toBe('low');
  });

  test('should sync pending transactions when online', async () => {
    offlineManager.addTransaction({
      type: 'transfer',
      data: { from: 'wallet1', to: 'wallet2', amount: 100 },
      priority: 'high',
    });

    // Mock online status
    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      writable: true,
    });

    await offlineManager.syncPendingTransactions();

    const pending = offlineManager.getPendingTransactions();
    expect(pending).toHaveLength(0); // Should be executed
  });

  test('should handle conflicts properly', async () => {
    // Add conflicting transactions
    offlineManager.addTransaction({
      type: 'transfer',
      data: { from: 'wallet1', to: 'wallet2', amount: 100 },
      priority: 'high',
    });

    offlineManager.addTransaction({
      type: 'transfer',
      data: { from: 'wallet1', to: 'wallet3', amount: 150 }, // This would cause insufficient balance
      priority: 'high',
    });

    await offlineManager.resolveConflicts();

    const queue = offlineManager.getTransactionQueue();
    const conflictTx = queue.find(tx => tx.status === 'conflict');
    expect(conflictTx).toBeDefined();
  });
});

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = CacheManager.getInstance();
  });

  afterEach(async () => {
    await cacheManager.clear();
  });

  test('should set and get cached values', async () => {
    await cacheManager.set('test_key', 'test_value', 300);
    const value = await cacheManager.get<string>('test_key');
    expect(value).toBe('test_value');
  });

  test('should handle expired entries', async () => {
    // Set an entry with 1 second TTL
    await cacheManager.set('expiring_key', 'expiring_value', 1);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const value = await cacheManager.get<string>('expiring_key');
    expect(value).toBeNull();
  });

  test('should cache wallet balances', async () => {
    await cacheManager.cacheWalletBalance('wallet1', 100.5, 300);
    const balance = await cacheManager.get<number>('balance_wallet1');
    expect(balance).toBe(100.5);
  });

  test('should cache token balances', async () => {
    await cacheManager.cacheTokenBalance('wallet1', 'token1', 50.25, 300);
    const balance = await cacheManager.get<number>(`token_balance_wallet1_token1`);
    expect(balance).toBe(50.25);
  });

 test('should invalidate cache by prefix', async () => {
    await cacheManager.set('balance_wallet1', 100, 300);
    await cacheManager.set('balance_wallet2', 200, 300);
    await cacheManager.set('other_key', 'value', 300);

    await cacheManager.invalidateByPrefix('balance_');

    const balance1 = await cacheManager.get('balance_wallet1');
    const balance2 = await cacheManager.get('balance_wallet2');
    const otherValue = await cacheManager.get('other_key');

    expect(balance1).toBeNull();
    expect(balance2).toBeNull();
    expect(otherValue).toBe('value');
  });
});

describe('FallbackStateManager', () => {
  let stateManager: FallbackStateManager;

  beforeEach(() => {
    stateManager = FallbackStateManager.getInstance();
  });

 afterEach(async () => {
    await stateManager.cleanup();
  });

 test('should update local state', async () => {
    await stateManager.updateLocalState({
      publicKey: 'test_public_key',
      balance: 100,
      tokens: { token1: 50 },
      nfts: ['nft1'],
      stakedAmount: 25,
    });

    const localState = await stateManager.getLocalState();
    expect(localState).toBeDefined();
    expect(localState?.publicKey).toBe('test_public_key');
    expect(localState?.balance).toBe(100);
  });

  test('should update network state', async () => {
    await stateManager.updateNetworkState({
      publicKey: 'network_public_key',
      balance: 150,
      tokens: { token1: 75 },
      nfts: ['nft2'],
      stakedAmount: 30,
      blockHeight: 123456,
    });

    const networkState = await stateManager.getNetworkState();
    expect(networkState).toBeDefined();
    expect(networkState?.publicKey).toBe('network_public_key');
    expect(networkState?.balance).toBe(150);
  });

  test('should calculate differences between states', async () => {
    await stateManager.updateLocalState({
      publicKey: 'wallet1',
      balance: 100,
      tokens: { token1: 50 },
      nfts: ['nft1'],
      stakedAmount: 25,
      lastUpdated: new Date(),
    });

    await stateManager.updateNetworkState({
      publicKey: 'wallet1',
      balance: 120, // Different balance
      tokens: { token1: 50 }, // Same token balance
      nfts: ['nft1', 'nft2'], // Different NFTs
      stakedAmount: 25, // Same staked amount
      blockHeight: 123456,
      lastSynced: new Date(),
    });

    const differences = await stateManager.calculateDifferences();
    expect(differences.conflicts).toContain('Balance mismatch: local 100, network 120');
    expect(differences.conflicts).toContain('NFTs missing in local state: nft2');
  });

  test('should resolve conflicts', async () => {
    await stateManager.updateLocalState({
      publicKey: 'wallet1',
      balance: 100,
      tokens: { token1: 50 },
      nfts: ['nft1'],
      stakedAmount: 25,
      lastUpdated: new Date(),
    });

    await stateManager.updateNetworkState({
      publicKey: 'wallet1',
      balance: 120,
      tokens: { token1: 50 },
      nfts: ['nft1', 'nft2'],
      stakedAmount: 25,
      blockHeight: 123456,
      lastSynced: new Date(),
    });

    await stateManager.resolveConflicts();

    const localState = await stateManager.getLocalState();
    expect(localState?.balance).toBe(120); // Should match network state
    expect(localState?.nfts).toContain('nft2'); // Should include network NFTs
  });
});

describe('Integration: Offline Transaction Flow', () => {
 let offlineManager: OfflineTransactionManager;
  let cacheManager: CacheManager;
  let stateManager: FallbackStateManager;

  beforeEach(() => {
    // Mock online status
    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      writable: true,
    });

    offlineManager = OfflineTransactionManager.getInstance();
    cacheManager = CacheManager.getInstance();
    stateManager = FallbackStateManager.getInstance();
  });

  afterEach(async () => {
    await offlineManager.cleanup();
    await cacheManager.clear();
    await stateManager.cleanup();
  });

  test('should handle offline transaction flow with caching', async () => {
    // Simulate offline status
    Object.defineProperty(window, 'navigator', {
      value: { onLine: false },
      writable: true,
    });

    // Add transaction while offline
    const transactionId = offlineManager.addTransaction({
      type: 'transfer',
      data: { from: 'wallet1', to: 'wallet2', amount: 100 },
      priority: 'high',
    });

    // Verify transaction is in queue
    const pending = offlineManager.getPendingTransactions();
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe(transactionId);
    expect(pending[0].status).toBe('pending');

    // Update local state to reflect transaction
    await stateManager.updateLocalState({
      publicKey: 'wallet1',
      balance: 900, // Assuming original balance was 1000
      tokens: {},
      nfts: [],
      stakedAmount: 0,
      lastUpdated: new Date(),
    });

    // Cache the updated balance
    await cacheManager.cacheWalletBalance('wallet1', 900, 300);

    // Verify state is updated
    const localState = await stateManager.getLocalState();
    expect(localState?.balance).toBe(900);

    const cachedBalance = await cacheManager.get<number>('balance_wallet1');
    expect(cachedBalance).toBe(900);

    // Simulate coming back online
    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      writable: true,
    });

    // Sync transactions
    await offlineManager.syncPendingTransactions();

    // Verify transaction is executed
    const executed = offlineManager.getExecutedTransactions();
    expect(executed).toHaveLength(1);
    expect(executed[0].status).toBe('executed');
  });

  test('should handle network status changes', async () => {
    // Initially offline
    Object.defineProperty(window, 'navigator', {
      value: { onLine: false },
      writable: true,
    });

    // Add transaction
    offlineManager.addTransaction({
      type: 'transfer',
      data: { from: 'wallet1', to: 'wallet2', amount: 50 },
      priority: 'medium',
    });

    // Verify it's pending
    expect(offlineManager.getPendingTransactions()).toHaveLength(1);

    // Go online
    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      writable: true,
    });

    // Simulate online event
    const event = new Event('online');
    window.dispatchEvent(event);

    // Wait for sync to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify transaction is processed
    expect(offlineManager.getPendingTransactions()).toHaveLength(0);
    expect(offlineManager.getExecutedTransactions()).toHaveLength(1);
  });
});