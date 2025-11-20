import { 
  InvisibleWalletAdapterImpl, 
  createInvisibleWalletAdapter, 
  createAutoWalletAdapter 
} from "@/components/wallet/invisible-wallet-adapter";
import { KeyManagerImpl } from "@/lib/wallet/key-manager";
import { getInvisibleWalletConfig } from "@/lib/wallet/config";
import { TelegramUtils } from "@/lib/wallet/utils";
import { PublicKey } from "@solana/web3.js";

// Мокаем Telegram Utils
jest.mock('@/lib/wallet/utils', () => ({
  TelegramUtils: {
    isTelegramWebApp: jest.fn(),
    getTelegramUser: jest.fn(),
    initTelegramWebApp: jest.fn()
  }
}));

// Мокаем KeyManager
jest.mock('@/lib/wallet/key-manager', () => ({
  KeyManagerImpl: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    retrieveKeyPair: jest.fn(),
    deriveFromTelegram: jest.fn(),
    storeKeyPair: jest.fn(),
    generateKeyPair: jest.fn()
  }))
}));

describe('InvisibleWalletAdapter', () => {
  let walletAdapter: InvisibleWalletAdapterImpl;
  let mockConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = getInvisibleWalletConfig();
    walletAdapter = new InvisibleWalletAdapterImpl(mockConfig);
  });

  describe('Initialization', () => {
    it('should create wallet adapter with default config', () => {
      expect(walletAdapter).toBeDefined();
      expect(walletAdapter.name).toBe('Invisible Wallet');
      expect(walletAdapter.connected).toBe(false);
    });

    it('should initialize successfully in Telegram environment', async () => {
      (TelegramUtils.isTelegramWebApp as jest.Mock).mockReturnValue(true);
      (TelegramUtils.getTelegramUser as jest.Mock).mockReturnValue({
        id: 12345,
        first_name: 'Test User'
      });

      const mockKeyPair = {
        publicKey: new PublicKey('11111111111111111111111111111112'),
        privateKey: { toBytes: () => new Uint8Array(64) },
        encryptedPrivateKey: {
          data: new Uint8Array(32),
          iv: new Uint8Array(12),
          salt: new Uint8Array(16),
          algorithm: 'AES-256-GCM',
          keyDerivation: 'PBKDF2',
          iterations: 100000
        },
        metadata: {
          created: Date.now(),
          lastUsed: Date.now(),
          version: 1,
          source: 'telegram' as const,
          deviceId: 'test_device'
        }
      };

      const mockKeyManager = new KeyManagerImpl(mockConfig.keyConfig);
      (mockKeyManager.retrieveKeyPair as jest.Mock).mockResolvedValue(null);
      (mockKeyManager.deriveFromTelegram as jest.Mock).mockResolvedValue(mockKeyPair);

      await walletAdapter.initialize(mockConfig);

      expect(TelegramUtils.isTelegramWebApp).toHaveBeenCalled();
      expect(TelegramUtils.initTelegramWebApp).toHaveBeenCalled();
      expect(walletAdapter.connected).toBe(true);
      expect(walletAdapter.publicKey).toEqual(mockKeyPair.publicKey);
    });

    it('should fail initialization outside Telegram environment', async () => {
      (TelegramUtils.isTelegramWebApp as jest.Mock).mockReturnValue(false);

      await expect(walletAdapter.initialize(mockConfig)).rejects.toThrow('Invisible Wallet requires Telegram WebApp');
    });
  });

  describe('Auto-connect', () => {
    it('should auto-connect successfully in Telegram', async () => {
      (TelegramUtils.isTelegramWebApp as jest.Mock).mockReturnValue(true);
      (TelegramUtils.getTelegramUser as jest.Mock).mockReturnValue({
        id: 12345,
        first_name: 'Test User'
      });

      const mockKeyPair = {
        publicKey: new PublicKey('11111111111111111111111111111112'),
        privateKey: { toBytes: () => new Uint8Array(64) },
        encryptedPrivateKey: {
          data: new Uint8Array(32),
          iv: new Uint8Array(12),
          salt: new Uint8Array(16),
          algorithm: 'AES-256-GCM',
          keyDerivation: 'PBKDF2',
          iterations: 100000
        },
        metadata: {
          created: Date.now(),
          lastUsed: Date.now(),
          version: 1,
          source: 'telegram' as const,
          deviceId: 'test_device'
        }
      };

      const mockKeyManager = new KeyManagerImpl(mockConfig.keyConfig);
      (mockKeyManager.retrieveKeyPair as jest.Mock).mockResolvedValue(mockKeyPair);

      await walletAdapter.autoConnect();

      expect(walletAdapter.connected).toBe(true);
      expect(walletAdapter.publicKey).toEqual(mockKeyPair.publicKey);
    });

    it('should generate new key pair if none exists', async () => {
      (TelegramUtils.isTelegramWebApp as jest.Mock).mockReturnValue(true);
      (TelegramUtils.getTelegramUser as jest.Mock).mockReturnValue({
        id: 12345,
        first_name: 'Test User'
      });

      const mockKeyPair = {
        publicKey: new PublicKey('11111111111111111111111111111112'),
        privateKey: { toBytes: () => new Uint8Array(64) },
        encryptedPrivateKey: {
          data: new Uint8Array(32),
          iv: new Uint8Array(12),
          salt: new Uint8Array(16),
          algorithm: 'AES-256-GCM',
          keyDerivation: 'PBKDF2',
          iterations: 100000
        },
        metadata: {
          created: Date.now(),
          lastUsed: Date.now(),
          version: 1,
          source: 'telegram' as const,
          deviceId: 'test_device'
        }
      };

      const mockKeyManager = new KeyManagerImpl(mockConfig.keyConfig);
      (mockKeyManager.retrieveKeyPair as jest.Mock).mockResolvedValue(null);
      (mockKeyManager.deriveFromTelegram as jest.Mock).mockResolvedValue(mockKeyPair);

      await walletAdapter.autoConnect();

      expect(mockKeyManager.deriveFromTelegram).toHaveBeenCalledWith(12345);
      expect(walletAdapter.connected).toBe(true);
      expect(walletAdapter.publicKey).toEqual(mockKeyPair.publicKey);
    });
  });

  describe('Transaction signing', () => {
    beforeEach(() => {
      (TelegramUtils.isTelegramWebApp as jest.Mock).mockReturnValue(true);
      (TelegramUtils.getTelegramUser as jest.Mock).mockReturnValue({
        id: 12345,
        first_name: 'Test User'
      });
    });

    it('should sign transaction successfully', async () => {
      const mockKeyPair = {
        publicKey: new PublicKey('11111111111111111111111111111112'),
        privateKey: { 
          toBytes: () => new Uint8Array(64),
          sign: jest.fn().mockResolvedValue(new Uint8Array(64))
        },
        encryptedPrivateKey: {
          data: new Uint8Array(32),
          iv: new Uint8Array(12),
          salt: new Uint8Array(16),
          algorithm: 'AES-256-GCM',
          keyDerivation: 'PBKDF2',
          iterations: 100000
        },
        metadata: {
          created: Date.now(),
          lastUsed: Date.now(),
          version: 1,
          source: 'telegram' as const,
          deviceId: 'test_device'
        }
      };

      const mockKeyManager = new KeyManagerImpl(mockConfig.keyConfig);
      (mockKeyManager.retrieveKeyPair as jest.Mock).mockResolvedValue(mockKeyPair);

      await walletAdapter.autoConnect();

      const mockTransaction = {
        sign: jest.fn()
      } as any;

      const signedTransaction = await walletAdapter.signTransaction(mockTransaction);

      expect(signedTransaction).toBeDefined();
      expect(mockTransaction.sign).toHaveBeenCalled();
    });

    it('should fail to sign transaction when not connected', async () => {
      const mockTransaction = {
        sign: jest.fn()
      } as any;

      await expect(walletAdapter.signTransaction(mockTransaction)).rejects.toThrow('Wallet not connected');
    });
  });

  describe('Stars purchases', () => {
    beforeEach(() => {
      (TelegramUtils.isTelegramWebApp as jest.Mock).mockReturnValue(true);
      (TelegramUtils.getTelegramUser as jest.Mock).mockReturnValue({
        id: 12345,
        first_name: 'Test User'
      });
    });

    it('should purchase with Stars successfully', async () => {
      const mockKeyPair = {
        publicKey: new PublicKey('11111111111111111111111111111112'),
        privateKey: { toBytes: () => new Uint8Array(64) },
        encryptedPrivateKey: {
          data: new Uint8Array(32),
          iv: new Uint8Array(12),
          salt: new Uint8Array(16),
          algorithm: 'AES-256-GCM',
          keyDerivation: 'PBKDF2',
          iterations: 100000
        },
        metadata: {
          created: Date.now(),
          lastUsed: Date.now(),
          version: 1,
          source: 'telegram' as const,
          deviceId: 'test_device'
        }
      };

      const mockKeyManager = new KeyManagerImpl(mockConfig.keyConfig);
      (mockKeyManager.retrieveKeyPair as jest.Mock).mockResolvedValue(mockKeyPair);

      await walletAdapter.autoConnect();

      const result = await walletAdapter.purchaseWithStars(100, 'Test purchase');

      expect(result.success).toBe(true);
      expect(result.starsAmount).toBe(100);
      expect(result.solAmount).toBe(100 * mockConfig.starsConfig.conversionRate);
      expect(result.ndtAmount).toBe(100 * mockConfig.starsConfig.conversionRate * 1000);
    });

    it('should fail Stars purchase when disabled', async () => {
      const disabledConfig = {
        ...mockConfig,
        starsConfig: {
          ...mockConfig.starsConfig,
          enabled: false
        }
      };

      const disabledWallet = new InvisibleWalletAdapterImpl(disabledConfig);

      await expect(disabledWallet.purchaseWithStars(100, 'Test purchase'))
        .rejects.toThrow('Stars purchases are disabled');
    });

    it('should fail Stars purchase with invalid amount', async () => {
      const mockKeyPair = {
        publicKey: new PublicKey('11111111111111111111111111111112'),
        privateKey: { toBytes: () => new Uint8Array(64) },
        encryptedPrivateKey: {
          data: new Uint8Array(32),
          iv: new Uint8Array(12),
          salt: new Uint8Array(16),
          algorithm: 'AES-256-GCM',
          keyDerivation: 'PBKDF2',
          iterations: 100000
        },
        metadata: {
          created: Date.now(),
          lastUsed: Date.now(),
          version: 1,
          source: 'telegram' as const,
          deviceId: 'test_device'
        }
      };

      const mockKeyManager = new KeyManagerImpl(mockConfig.keyConfig);
      (mockKeyManager.retrieveKeyPair as jest.Mock).mockResolvedValue(mockKeyPair);

      await walletAdapter.autoConnect();

      await expect(walletAdapter.purchaseWithStars(0, 'Test purchase'))
        .rejects.toThrow('Invalid amount');
    });
  });

  describe('Factory functions', () => {
    it('should create wallet adapter with custom config', () => {
      const customConfig = {
        ...mockConfig,
        keyConfig: {
          ...mockConfig.keyConfig,
          encryptionAlgorithm: 'ChaCha20-Poly1305' as const
        }
      };

      const customWallet = createInvisibleWalletAdapter(customConfig);

      expect(customWallet).toBeDefined();
      expect(customWallet.name).toBe('Invisible Wallet');
    });

    it('should create auto wallet adapter in Telegram environment', () => {
      (TelegramUtils.isTelegramWebApp as jest.Mock).mockReturnValue(true);

      const autoWallet = createAutoWalletAdapter();

      expect(autoWallet).toBeDefined();
      expect(autoWallet?.name).toBe('Invisible Wallet');
    });

    it('should return null for auto wallet adapter outside Telegram', () => {
      (TelegramUtils.isTelegramWebApp as jest.Mock).mockReturnValue(false);

      const autoWallet = createAutoWalletAdapter();

      expect(autoWallet).toBeNull();
    });
  });

  describe('Event handling', () => {
    it('should emit and handle events correctly', () => {
      const mockHandler = jest.fn();
      
      walletAdapter.on('INITIALIZED' as any, mockHandler);
      
      // Эмулируем событие
      walletAdapter.emit('INITIALIZED' as any, { test: 'data' });
      
      expect(mockHandler).toHaveBeenCalledWith({
        type: 'INITIALIZED',
        data: { test: 'data' },
        timestamp: expect.any(Number)
      });
    });

    it('should remove event handlers correctly', () => {
      const mockHandler = jest.fn();
      
      walletAdapter.on('INITIALIZED' as any, mockHandler);
      walletAdapter.off('INITIALIZED' as any, mockHandler);
      
      // Эмулируем событие
      walletAdapter.emit('INITIALIZED' as any, { test: 'data' });
      
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });
});