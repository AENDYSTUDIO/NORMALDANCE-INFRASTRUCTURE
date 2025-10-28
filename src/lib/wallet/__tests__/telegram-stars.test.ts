// Тесты для системы интеграции с Telegram Stars

import { TelegramStarsBridge } from '../telegram-stars-bridge';
import { StarsPaymentManager } from '../stars-payment-manager';
import { ConversionRate, StarsTransaction } from '@/types/wallet';

describe('TelegramStarsBridge', () => {
  let bridge: TelegramStarsBridge;

  beforeEach(() => {
    bridge = new TelegramStarsBridge();
  });

  describe('getConversionRates', () => {
    it('should return current conversion rates', async () => {
      const rates: ConversionRate = await bridge.getConversionRates();
      
      expect(rates).toHaveProperty('starsToSol');
      expect(rates).toHaveProperty('solToNdt');
      expect(rates).toHaveProperty('updatedAt');
      expect(typeof rates.starsToSol).toBe('number');
      expect(typeof rates.solToNdt).toBe('number');
      expect(rates.updatedAt instanceof Date).toBe(true);
    });

    it('should cache conversion rates', async () => {
      const rates1: ConversionRate = await bridge.getConversionRates();
      const rates2: ConversionRate = await bridge.getConversionRates();
      
      expect(rates1).toEqual(rates2);
    });
  });

 describe('calculateSolAmount', () => {
    it('should calculate SOL amount from Stars', async () => {
      const starsAmount = 285714; // Пример: 1 SOL worth of Stars
      const solAmount = await bridge.calculateSolAmount(starsAmount);
      
      // С учетом курса по умолчанию (1 SOL = ~285,714 Stars)
      expect(solAmount).toBeCloseTo(1, 2); // Погрешность из-за округления
    });

    it('should return 0 for 0 Stars', async () => {
      const solAmount = await bridge.calculateSolAmount(0);
      
      expect(solAmount).toBe(0);
    });
  });

 describe('calculateNdtAmount', () => {
    it('should calculate NDT amount from Stars', async () => {
      const starsAmount = 285; // Пример: 0.001 SOL worth of Stars
      const ndtAmount = await bridge.calculateNdtAmount(starsAmount);
      
      // Если 1 SOL = 1000 NDT, то 0.001 SOL = 1 NDT
      expect(ndtAmount).toBeCloseTo(1, 2);
    });

    it('should return 0 for 0 Stars', async () => {
      const ndtAmount = await bridge.calculateNdtAmount(0);
      
      expect(ndtAmount).toBe(0);
    });
  });

  describe('purchaseNdtWithStars', () => {
    it('should create a successful transaction', async () => {
      const starsAmount = 1000;
      const userId = 'test_user_123';
      
      const transaction: StarsTransaction = await bridge.purchaseNdtWithStars(starsAmount, userId);
      
      expect(transaction).toHaveProperty('id');
      expect(transaction.userId).toBe(userId);
      expect(transaction.starsAmount).toBe(starsAmount);
      expect(typeof transaction.solAmount).toBe('number');
      expect(typeof transaction.ndtAmount).toBe('number');
      expect(transaction.timestamp instanceof Date).toBe(true);
      expect(transaction.status).toBe('confirmed'); // В тесте сразу подтверждаем
    });

    it('should throw error for amount below minimum', async () => {
      const starsAmount = 50; // Ниже минимальной суммы 100
      const userId = 'test_user_123';
      
      await expect(bridge.purchaseNdtWithStars(starsAmount, userId)).rejects.toThrow();
    });

    it('should throw error for amount above maximum', async () => {
      const starsAmount = 2000000; // Выше максимальной суммы 1,000,000
      const userId = 'test_user_123';
      
      await expect(bridge.purchaseNdtWithStars(starsAmount, userId)).rejects.toThrow();
    });
  });

 describe('processBatchTransactions', () => {
    it('should process multiple transactions', async () => {
      const transactions = [
        { starsAmount: 1000, userId: 'user1' },
        { starsAmount: 2000, userId: 'user2' },
        { starsAmount: 3000, userId: 'user3' },
      ];
      
      const results = await bridge.processBatchTransactions(transactions);
      
      expect(results).toHaveLength(3);
      expect(results[0].userId).toBe('user1');
      expect(results[1].userId).toBe('user2');
      expect(results[2].userId).toBe('user3');
    });
  });

  describe('processRefund', () => {
    it('should process refund successfully', async () => {
      const transactionId = 'test_transaction_123';
      const result = await bridge.processRefund(transactionId);
      
      expect(result).toBe(true);
    });
  });
});

describe('StarsPaymentManager', () => {
  let bridge: TelegramStarsBridge;
  let paymentManager: StarsPaymentManager;

  beforeEach(() => {
    bridge = new TelegramStarsBridge();
    paymentManager = new StarsPaymentManager(bridge);
  });

  describe('createPaymentSession', () => {
    it('should create a payment session', async () => {
      const userId = 'test_user_123';
      const starsAmount = 1000;
      const ndtAmount = 10;
      
      const session = await paymentManager.createPaymentSession(userId, starsAmount, ndtAmount);
      
      expect(session).toHaveProperty('id');
      expect(session.userId).toBe(userId);
      expect(session.starsAmount).toBe(starsAmount);
      expect(session.ndtAmount).toBe(ndtAmount);
      expect(session.status).toBe('created');
      expect(session.createdAt instanceof Date).toBe(true);
      expect(session.expiresAt instanceof Date).toBe(true);
    });

    it('should throw error for amount below minimum', async () => {
      const userId = 'test_user_123';
      const starsAmount = 50; // Ниже минимальной суммы
      const ndtAmount = 10;
      
      await expect(
        paymentManager.createPaymentSession(userId, starsAmount, ndtAmount)
      ).rejects.toThrow();
    });
  });

  describe('getPaymentSession', () => {
    it('should retrieve existing session', async () => {
      const userId = 'test_user_123';
      const starsAmount = 100;
      const ndtAmount = 10;
      
      const session = await paymentManager.createPaymentSession(userId, starsAmount, ndtAmount);
      const retrievedSession = paymentManager.getPaymentSession(session.id);
      
      expect(retrievedSession).not.toBeNull();
      expect(retrievedSession?.id).toBe(session.id);
    });

    it('should return null for non-existing session', () => {
      const retrievedSession = paymentManager.getPaymentSession('non_existing_id');
      
      expect(retrievedSession).toBeNull();
    });
  });

  describe('approvePaymentSession', () => {
    it('should approve and complete a payment session', async () => {
      const userId = 'test_user_123';
      const starsAmount = 1000;
      const ndtAmount = 10;
      
      const session = await paymentManager.createPaymentSession(userId, starsAmount, ndtAmount);
      const result = await paymentManager.approvePaymentSession(session.id);
      
      expect(result).toBe(true);
      
      const updatedSession = paymentManager.getPaymentSession(session.id);
      expect(updatedSession?.status).toBe('completed');
    });

    it('should fail to approve non-existing session', async () => {
      const result = await paymentManager.approvePaymentSession('non_existing_id');
      
      expect(result).toBe(false);
    });
  });

  describe('cancelPaymentSession', () => {
    it('should cancel a payment session', async () => {
      const userId = 'test_user_123';
      const starsAmount = 100;
      const ndtAmount = 10;
      
      const session = await paymentManager.createPaymentSession(userId, starsAmount, ndtAmount);
      const result = await paymentManager.cancelPaymentSession(session.id);
      
      expect(result).toBe(true);
      
      const updatedSession = paymentManager.getPaymentSession(session.id);
      expect(updatedSession?.status).toBe('cancelled');
    });

    it('should fail to cancel already completed session', async () => {
      const userId = 'test_user_123';
      const starsAmount = 1000;
      const ndtAmount = 10;
      
      const session = await paymentManager.createPaymentSession(userId, starsAmount, ndtAmount);
      await paymentManager.approvePaymentSession(session.id); // Сначала подтверждаем
      
      const result = await paymentManager.cancelPaymentSession(session.id);
      
      expect(result).toBe(false); // Не должно получиться отменить завершенную сессию
    });
  });

  describe('handleTelegramCallback', () => {
    it('should handle successful Telegram callback', async () => {
      const userId = 'test_user_123';
      const starsAmount = 100;
      const ndtAmount = 10;
      
      // Создаем сессию
      const session = await paymentManager.createPaymentSession(userId, starsAmount, ndtAmount);
      
      // Имитируем успешный коллбэк от Telegram
      const telegramData = {
        id: 'telegram_transaction_123',
        status: 'completed',
        stars_amount: starsAmount,
        user_id: userId
      };
      
      const result = await paymentManager.handleTelegramCallback(telegramData);
      
      expect(result).toBe(true);
      
      const updatedSession = paymentManager.getPaymentSession(session.id);
      expect(updatedSession?.status).toBe('completed');
    });

    it('should handle failed Telegram callback', async () => {
      const userId = 'test_user_123';
      const starsAmount = 100;
      const ndtAmount = 10;
      
      // Создаем сессию
      const session = await paymentManager.createPaymentSession(userId, starsAmount, ndtAmount);
      
      // Имитируем неудачный коллбэк от Telegram
      const telegramData = {
        id: 'telegram_transaction_123',
        status: 'failed',
        stars_amount: starsAmount,
        user_id: userId
      };
      
      const result = await paymentManager.handleTelegramCallback(telegramData);
      
      expect(result).toBe(true);
      
      const updatedSession = paymentManager.getPaymentSession(session.id);
      expect(updatedSession?.status).toBe('failed');
    });
  });
});