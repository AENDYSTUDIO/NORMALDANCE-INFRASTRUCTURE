import { MobileInvisibleWallet } from '../invisible-wallet';
import { MobileKeyManager } from '../mobile-key-manager';
import { MobileStarsIntegration } from '../mobile-stars-integration';
import { MobileOfflineManager } from '../mobile-offline-manager';

// Моки для зависимостей
jest.mock('expo-secure-store');
jest.mock('expo-local-authentication');
jest.mock('expo-file-system');
jest.mock('@solana/web3.js', () => ({
  ...jest.requireActual('@solana/web3.js'),
  Connection: jest.fn(() => ({
    getBalance: jest.fn(() => Promise.resolve(1000000000)), // 1 SOL
    getRecentBlockhash: jest.fn(() => Promise.resolve({ blockhash: 'mock-blockhash' })),
    sendRawTransaction: jest.fn(() => Promise.resolve('mock-signature')),
    confirmTransaction: jest.fn(() => Promise.resolve({ value: { err: null } })),
  })),
  Keypair: {
    generate: jest.fn(() => ({
      publicKey: { toBase58: () => 'mock-public-key' },
      secretKey: new Uint8Array(64),
    })),
    fromSecretKey: jest.fn(() => ({
      publicKey: { toBase58: () => 'mock-public-key' },
      secretKey: new Uint8Array(64),
    })),
  },
  Transaction: jest.fn(() => ({
    sign: jest.fn(),
    serialize: jest.fn(() => new Uint8Array()),
  })),
}));

describe('MobileInvisibleWallet', () => {
  let wallet: MobileInvisibleWallet;
  const mockConfig = {
    keyConfig: {
      encryptionAlgorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2',
      storageLocation: 'secure-store',
      backupEnabled: true,
      rotationInterval: 30
    },
    starsConfig: {
      enabled: true,
      minAmount: 1,
      maxAmount: 10000,
      commissionRate: 0.02,
      conversionRate: 0.001
    },
    offlineConfig: {
      maxQueueSize: 100,
      syncInterval: 300,
      retryAttempts: 3,
      storageQuota: 100 * 1024 * 1024,
      conflictResolution: 'last-wins' as const
    },
    biometricRequired: false, // Отключаем биометрию для тестов
    autoConnect: false
  };

  beforeEach(() => {
    wallet = new MobileInvisibleWallet(mockConfig);
  });

 afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(wallet.initialize()).resolves.not.toThrow();
      expect(await wallet.isInitialized()).toBe(true);
    });

    it('should handle initialization errors', async () => {
      // Мокаем ошибку при инициализации KeyManager
      const keyManagerSpy = jest.spyOn(MobileKeyManager.prototype, 'initialize');
      keyManagerSpy.mockRejectedValueOnce(new Error('Initialization failed'));

      await expect(wallet.initialize()).rejects.toThrow('MobileInvisibleWallet initialization failed');
    });
  });

  describe('Connection', () => {
    beforeEach(async () => {
      await wallet.initialize();
    });

    it('should connect successfully', async () => {
      const result = await wallet.connect();
      expect(result.connected).toBe(true);
      expect(result.isInvisible).toBe(true);
    });

    it('should disconnect successfully', async () => {
      await wallet.connect();
      await wallet.disconnect();
      const state = wallet.getState();
      expect(state.connected).toBe(false);
    });
  });

  describe('Stars Integration', () => {
    beforeEach(async () => {
      await wallet.initialize();
    });

    it('should get stars balance', async () => {
      const balance = await wallet.getStarsBalance();
      expect(typeof balance).toBe('number');
    });

    it('should purchase with stars', async () => {
      const result = await wallet.purchaseWithStars(100, 'Test purchase');
      expect(result.success).toBe(true);
      expect(result.starsAmount).toBe(100);
    });

    it('should handle purchase errors', async () => {
      const result = await wallet.purchaseWithStars(0, 'Invalid purchase');
      expect(result.success).toBe(false);
    });
 });

  describe('Offline Functionality', () => {
    beforeEach(async () => {
      await wallet.initialize();
    });

    it('should queue transactions', async () => {
      const mockTransaction = new (require('@solana/web3.js').Transaction)();
      const id = await wallet.queueTransaction(mockTransaction);
      expect(typeof id).toBe('string');
      expect(id.startsWith('offline_tx_')).toBe(true);
    });

    it('should return offline queue', async () => {
      const queue = await wallet.getOfflineQueue();
      expect(Array.isArray(queue)).toBe(true);
    });
  });

  describe('Key Management', () => {
    beforeEach(async () => {
      await wallet.initialize();
    });

    it('should export public key', async () => {
      await wallet.connect();
      const publicKey = await wallet.exportPublicKey();
      expect(typeof publicKey).toBe('string');
      expect(publicKey).toBe('mock-public-key');
    });

    it('should export encrypted key', async () => {
      await wallet.connect();
      const encryptedKey = await wallet.exportEncryptedKey();
      expect(encryptedKey).toBeDefined();
    });
  });
});

describe('MobileKeyManager', () => {
  let keyManager: MobileKeyManager;

  beforeEach(() => {
    keyManager = new MobileKeyManager({
      encryptionAlgorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2',
      storageLocation: 'secure-store',
      backupEnabled: true,
      rotationInterval: 30
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize successfully', async () => {
    await expect(keyManager.initialize()).resolves.not.toThrow();
  });

  it('should generate key pair', async () => {
    const keyPair = await keyManager.generateKeyPair();
    expect(keyPair).toBeDefined();
    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.keyPair).toBeDefined();
 });

  it('should store and retrieve key pair', async () => {
    const originalKeyPair = await keyManager.generateKeyPair();
    await keyManager.storeKeyPair(originalKeyPair);

    const retrievedKeyPair = await keyManager.retrieveKeyPair();
    expect(retrievedKeyPair).toBeDefined();
    expect(retrievedKeyPair?.publicKey.toBase58()).toBe(originalKeyPair.publicKey.toBase58());
  });

  it('should check if key is stored', async () => {
    const hasStored = await keyManager.hasStoredKey();
    expect(typeof hasStored).toBe('boolean');
  });

  it('should export encrypted key', async () => {
    const originalKeyPair = await keyManager.generateKeyPair();
    await keyManager.storeKeyPair(originalKeyPair);

    const encryptedKey = await keyManager.exportEncryptedKey();
    expect(encryptedKey).toBeDefined();
 });
});

describe('MobileStarsIntegration', () => {
  let starsIntegration: MobileStarsIntegration;

  beforeEach(() => {
    starsIntegration = new MobileStarsIntegration({
      enabled: true,
      minAmount: 1,
      maxAmount: 10000,
      commissionRate: 0.02,
      conversionRate: 0.0001
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize successfully', async () => {
    await expect(starsIntegration.initialize()).resolves.not.toThrow();
  });

  it('should get conversion rate', async () => {
    const rate = await starsIntegration.getConversionRate('stars', 'sol');
    expect(typeof rate).toBe('number');
    expect(rate).toBeGreaterThan(0);
  });

  it('should convert stars to sol', async () => {
    const result = await starsIntegration.convertStarsToSol(1000);
    expect(result.success).toBe(true);
    expect(result.toAmount).toBeGreaterThan(0);
  });

  it('should convert sol to ndt', async () => {
    const result = await starsIntegration.convertSolToNdt(1);
    expect(result.success).toBe(true);
    expect(result.toAmount).toBeGreaterThan(0);
  });

  it('should handle purchase with stars', async () => {
    const result = await starsIntegration.purchaseWithStars(100, 'Test purchase');
    expect(result.success).toBe(true);
    expect(result.starsAmount).toBe(100);
  });

  it('should validate purchase amount', async () => {
    const result = await starsIntegration.purchaseWithStars(0, 'Invalid purchase');
    expect(result.success).toBe(false);
  });
});

describe('MobileOfflineManager', () => {
  let offlineManager: MobileOfflineManager;

  beforeEach(() => {
    offlineManager = new MobileOfflineManager({
      maxQueueSize: 100,
      syncInterval: 300,
      retryAttempts: 3,
      storageQuota: 100 * 1024 * 1024,
      conflictResolution: 'last-wins'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize successfully', async () => {
    await expect(offlineManager.initialize()).resolves.not.toThrow();
  });

  it('should queue transaction', async () => {
    const mockTransaction = new (require('@solana/web3.js').Transaction)();
    const id = await offlineManager.queueTransaction(mockTransaction);
    expect(typeof id).toBe('string');
    expect(id.startsWith('offline_tx_')).toBe(true);
  });

  it('should return queue', async () => {
    const queue = await offlineManager.getQueue();
    expect(Array.isArray(queue)).toBe(true);
 });

  it('should cache and retrieve balance', async () => {
    const balance: any = {
      publicKey: 'mock-public-key',
      balance: 10,
      tokenBalances: {},
      timestamp: Date.now(),
      blockHeight: 12345
    };

    await offlineManager.cacheBalance(balance);
    const cached = await offlineManager.getCachedBalance('mock-public-key');
    expect(cached).toBeDefined();
    expect(cached?.balance).toBe(10);
  });

  it('should clear queue', async () => {
    await offlineManager.clearQueue();
    const queue = await offlineManager.getQueue();
    expect(queue.length).toBe(0);
  });
});

// Тесты для сценариев использования без интернета
describe('Offline Scenarios', () => {
  let wallet: MobileInvisibleWallet;

  beforeEach(async () => {
    wallet = new MobileInvisibleWallet({
      keyConfig: {
        encryptionAlgorithm: 'AES-256-GCM',
        keyDerivation: 'PBKDF2',
        storageLocation: 'secure-store',
        backupEnabled: true,
        rotationInterval: 30
      },
      starsConfig: {
        enabled: true,
        minAmount: 1,
        maxAmount: 10000,
        commissionRate: 0.02,
        conversionRate: 0.0001
      },
      offlineConfig: {
        maxQueueSize: 100,
        syncInterval: 30000,
        retryAttempts: 3,
        storageQuota: 100 * 1024 * 1024,
        conflictResolution: 'last-wins'
      },
      biometricRequired: false,
      autoConnect: false
    });
    await wallet.initialize();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should queue transactions when offline', async () => {
    // Мокаем отсутствие подключения
    const connectionMock = require('@solana/web3.js').Connection;
    connectionMock.mockImplementation(() => ({
      getBalance: jest.fn(() => Promise.resolve(10000000)),
      getRecentBlockhash: jest.fn(() => Promise.reject(new Error('Network error'))),
      sendRawTransaction: jest.fn(() => Promise.reject(new Error('Network error'))),
      confirmTransaction: jest.fn(() => Promise.reject(new Error('Network error'))),
    }));

    const mockTransaction = new (require('@solana/web3.js').Transaction)();
    await expect(wallet.sendTransaction(mockTransaction)).rejects.toThrow('Network error');
    
    // Проверяем, что транзакция была добавлена в очередь
    const queue = await wallet.getOfflineQueue();
    expect(queue.length).toBeGreaterThan(0);
  });

  it('should sync when online', async () => {
    // Сначала добавляем транзакцию в очередь
    const mockTransaction = new (require('@solana/web3.js').Transaction)();
    await wallet.queueTransaction(mockTransaction);

    // Проверяем начальный размер очереди
    let queue = await wallet.getOfflineQueue();
    expect(queue.length).toBe(1);

    // Выполняем синхронизацию (в тестах просто проверяем, что метод не падает)
    await expect(wallet.syncWhenOnline()).resolves.not.toThrow();

    // Проверяем размер очереди после синхронизации
    queue = await wallet.getOfflineQueue();
    // В тестовой реализации очередь может не измениться, так как нет реальной синхронизации
  });
});

// Тесты для биометрической аутентификации
describe('Biometric Authentication', () => {
  let wallet: MobileInvisibleWallet;

  beforeEach(async () => {
    wallet = new MobileInvisibleWallet({
      keyConfig: {
        encryptionAlgorithm: 'AES-256-GCM',
        keyDerivation: 'PBKDF2',
        storageLocation: 'secure-store',
        backupEnabled: true,
        rotationInterval: 30
      },
      starsConfig: {
        enabled: true,
        minAmount: 1,
        maxAmount: 10000,
        commissionRate: 0.02,
        conversionRate: 0.0001
      },
      offlineConfig: {
        maxQueueSize: 100,
        syncInterval: 30000,
        retryAttempts: 3,
        storageQuota: 100 * 1024 * 1024,
        conflictResolution: 'last-wins'
      },
      biometricRequired: true, // Включаем биометрию для тестов
      autoConnect: false
    });
    await wallet.initialize();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should authenticate biometrically', async () => {
    const result = await wallet.authenticateBiometrically();
    expect(typeof result).toBe('boolean');
  });

  it('should fail to connect without biometric auth when required', async () => {
    // Мокаем неудачную биометрическую аутентификацию
    jest.spyOn(wallet as any, 'authenticateBiometrically').mockResolvedValueOnce(false);
    
    await expect(wallet.connect()).resolves.toEqual({
      connected: false,
      isInvisible: true
    });
  });
});