
import { PublicKey } from '@solana/web3.js';
import { InvisibleWalletAdapter, InvisibleWalletUtils } from '../invisible-wallet-adapter';

// Mock connection для тестов
const mockConnection = {
  getBalance: jest.fn(),
  sendTransaction: jest.fn(),
  confirmTransaction: jest.fn()
} as any;

// Mock конфигурация
const mockConfig = InvisibleWalletUtils.createFullConfig({
  telegramUserId: 'test-user',
  telegramInitData: 'test-init-data'
});

describe('InvisibleWalletAdapter', () => {
  let wallet: InvisibleWalletAdapter;

  beforeEach(() => {
    wallet = new InvisibleWalletAdapter(mockConfig, mockConnection);
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with config', () => {
      expect(wallet).toBeDefined();
      expect(wallet.connected).toBe(false);
      expect(wallet.connecting).toBe(false);
    });

    test('should auto-connect when autoConnect is called', async () => {
      await wallet.autoConnect();
      expect(wallet.connected).toBe(true);
    });
  });

  describe('Connection Management', () => {
    test('should connect successfully', async () => {
      await wallet.connect();
      expect(wallet.connected).toBe(true);
      expect(wallet.publicKey).toBeDefined();
    });

    test('should disconnect successfully', async () => {
      await wallet.connect();
      await wallet.disconnect();
      expect(wallet.connected).toBe(false);
      expect(wallet.publicKey).toBeNull();
    });

    test('should handle connection errors', async () => {
      mockConnection.getBalance.mockRejectedValue(new Error('Network error'));
      
      await expect(wallet.connect()).rejects.toThrow();
    });
  });

  describe('Transaction Operations', () => {
    beforeEach(async () => {
      await wallet.autoConnect();
    });

    test('should sign transaction', async () => {
      const mockTransaction = {
        sign: jest.fn(),
        instructions: [],
        feePayer: new PublicKey('11111111111111111111111111111111')
      } as any;

      const signedTx = await wallet.signTransaction(mockTransaction);
      expect(signedTx).toBeDefined();
      expect(mockTransaction.sign).toHaveBeenCalled();
    });

    test('should send transaction', async () => {
      const mockTransaction = {
        sign: jest.fn(),
        instructions: [],
        feePayer: new PublicKey('11111111111111111111111111111111')
      } as any;

      const mockSignature = 'mock-signature';
      mockConnection.sendTransaction.mockResolvedValue(mockSignature);

      const signature = await wallet.sendTransaction(mockTransaction);
      expect(signature).toBe(mockSignature);
      expect(mockConnection.sendTransaction).toHaveBeenCalledWith(
        mockTransaction,
        mockConnection
      );
    });

    test('should handle transaction failures', async () => {
      const mockTransaction = {
        sign: jest.fn(),
        instructions: [],
        feePayer: new PublicKey('11111111111111111111111111111111')
      } as any;

      mockConnection.sendTransaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(wallet.sendTransaction(mockTransaction)).rejects.toThrow();
    });
  });

  describe('Telegram Stars Integration', () => {
    test('should purchase with stars', async () => {
      const mockResult = {
        success: true,
        transactionId: 'tx-123',
        starsAmount: 100,
        convertedAmount: 0.001
      };

      const result = await wallet.purchaseWithStars(100, 'Test purchase');
      expect(result.success).toBe(true);
      expect(result.starsAmount).toBe(100);
    });

    test('should get stars balance', async () => {
      const mockBalance = 500;
      const result = await wallet.getStarsBalance();
      expect(result).toBe(mockBalance);
    });

    test('should setup recovery', async () => {
      const mockContacts = ['user1', 'user2', 'user3'];
      
      await expect(wallet.setupRecovery(mockContacts)).resolves.not.toThrow();
    });
  });

  describe('Balance Operations', () => {
    test('should get balance', async () => {
      const mockBalance = 1.5;
      mockConnection.getBalance.mockResolvedValue(mockBalance * 1e9);

      const balance = await wallet.getBalance();
      expect(balance).toBe(mockBalance);
    });

    test('should get token balance', async () => {
      const mockTokenBalance = 1000;
      
      const balance = await wallet.getTokenBalance('mock-token-mint');
      expect(balance).toBe(mockTokenBalance);
    });

    test('should handle balance errors gracefully', async () => {
      mockConnection.getBalance.mockRejectedValue(new Error('RPC error'));

      const balance = await wallet.getBalance();
      expect(balance).toBe(0); // Возвращаем 0 при ошибке
    });
  });

  describe('Event System', () => {
    test('should emit connect event', (done) => {
      wallet.on('connect', (data) => {
        expect(data).toBeDefined();
        expect(data.publicKey).toBeDefined();
        done();
      });

      wallet.autoConnect();
    });

