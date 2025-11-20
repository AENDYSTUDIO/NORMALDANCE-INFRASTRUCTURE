import { SecurityManagerImpl, SecurityEventType } from '../security-manager';
import { SecurityConfig } from '@/types/wallet';
import { MemoryStorageAdapter } from '../security-manager';
import { Transaction } from '@solana/web3.js';

// Mock для crypto
global.crypto = {
  getRandomValues: jest.fn().mockReturnValue(new Uint8Array(16)),
  subtle: {
    digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(64)),
    decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    importKey: jest.fn().mockResolvedValue({}),
    deriveKey: jest.fn().mockResolvedValue({})
  }
} as any;

// Mock для navigator
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Test User Agent',
    platform: 'Test Platform'
  },
  writable: true
});

describe('SecurityManagerImpl', () => {
  let securityManager: SecurityManagerImpl;
  let mockStorage: MemoryStorageAdapter;
  
  const mockConfig: SecurityConfig = {
    maxTransactionsPerHour: 10,
    maxAmountPerTransaction: 100,
    anomalyDetection: true,
    biometricAuth: true
  };
  
  const mockTransaction = new Transaction();
  
  beforeEach(() => {
    mockStorage = new MemoryStorageAdapter();
    securityManager = new SecurityManagerImpl(mockConfig, mockStorage);
  });
  
  afterEach(async () => {
    await mockStorage.clear();
    jest.clearAllMocks();
  });
  
  describe('initialize', () => {
    it('должен успешно инициализироваться', async () => {
      await expect(securityManager.initialize()).resolves.not.toThrow();
    });
  });
  
  describe('validateTransaction', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });
    
    it('должен валидировать нормальную транзакцию', async () => {
      const isValid = await securityManager.validateTransaction(mockTransaction, 'test_user');
      expect(isValid).toBe(true);
    });
    
    it('должен блокировать транзакцию при превышении лимита', async () => {
      // Создаем несколько транзакций для превышения лимита
      for (let i = 0; i < mockConfig.maxTransactionsPerHour; i++) {
        await securityManager.validateTransaction(mockTransaction, 'test_user');
      }
      
      const isValid = await securityManager.validateTransaction(mockTransaction, 'test_user');
      expect(isValid).toBe(false);
    });
    
    it('должен записывать событие безопасности', async () => {
      await securityManager.validateTransaction(mockTransaction, 'test_user');
      
      const events = await securityManager.getSecurityEvents('test_user');
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(SecurityEventType.TRANSACTION_CREATED);
      expect(events[0].userId).toBe('test_user');
    });
  });
  
  describe('detectAnomaly', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });
    
    it('должен детектировать аномалии при включенной детекции', async () => {
      const isAnomalous = await securityManager.detectAnomaly(mockTransaction, 'test_user');
      expect(typeof isAnomalous).toBe('boolean');
    });
    
    it('не должен детектировать аномалии при выключенной детекции', async () => {
      const configWithoutAnomaly = { ...mockConfig, anomalyDetection: false };
      const managerWithoutAnomaly = new SecurityManagerImpl(configWithoutAnomaly, mockStorage);
      await managerWithoutAnomaly.initialize();
      
      const isAnomalous = await managerWithoutAnomaly.detectAnomaly(mockTransaction, 'test_user');
      expect(isAnomalous).toBe(false);
    });
  });
  
  describe('getAnomalyScore', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });
    
    it('должен возвращать оценку аномалии', async () => {
      const score = await securityManager.getAnomalyScore(mockTransaction, 'test_user');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
  
  describe('checkRateLimit', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });
    
    it('должен проверять rate limiting для входа', async () => {
      // Выполняем несколько попыток входа
      for (let i = 0; i < 4; i++) {
        await securityManager.checkRateLimit(SecurityEventType.LOGIN_ATTEMPT, 'test_user');
      }
      
      const isLimited = await securityManager.checkRateLimit(SecurityEventType.LOGIN_ATTEMPT, 'test_user');
      expect(isLimited).toBe(false); // Еще не превышен лимит
    });
    
    it('должен блокировать при превышении лимита', async () => {
      // Выполняем попытки входа для превышения лимита
      for (let i = 0; i < 6; i++) {
        await securityManager.checkRateLimit(SecurityEventType.LOGIN_ATTEMPT, 'test_user');
      }
      
      const isLimited = await securityManager.checkRateLimit(SecurityEventType.LOGIN_ATTEMPT, 'test_user');
      expect(isLimited).toBe(true);
    });
  });
  
  describe('blockUser', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });
    
    it('должен блокировать пользователя', async () => {
      await securityManager.blockUser('test_user', 60 * 1000); // 1 минута
      
      const isBlocked = await securityManager.isUserBlocked('test_user');
      expect(isBlocked).toBe(true);
    });
    
    it('должен разблокировать пользователя после истечения времени', async () => {
      await securityManager.blockUser('test_user', 1); // 1 мс
      
      // Ждем истечения блокировки
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const isBlocked = await securityManager.isUserBlocked('test_user');
      expect(isBlocked).toBe(false);
    });
  });
  
  describe('isUserBlocked', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });
    
    it('должен возвращать false для незаблокированного пользователя', async () => {
      const isBlocked = await securityManager.isUserBlocked('test_user');
      expect(isBlocked).toBe(false);
    });
    
    it('должен возвращать true для заблокированного пользователя', async () => {
      await securityManager.blockUser('test_user', 60 * 1000); // 1 минута
      
      const isBlocked = await securityManager.isUserBlocked('test_user');
      expect(isBlocked).toBe(true);
    });
  });
  
  describe('createSecurityAlert', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });
    
    it('должен создавать оповещение безопасности', async () => {
      await securityManager.createSecurityAlert(
        'suspicious_activity',
        'medium',
        'Test alert message',
        { detail: 'test' }
      );
      
      const alerts = await securityManager.getSecurityAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('suspicious_activity');
      expect(alerts[0].severity).toBe('medium');
      expect(alerts[0].message).toBe('Test alert message');
      expect(alerts[0].details.detail).toBe('test');
    });
    
    it('должен записывать событие безопасности при создании оповещения', async () => {
      await securityManager.createSecurityAlert(
        'phishing_attempt',
        'high',
        'Phishing attempt detected'
      );
      
      const events = await securityManager.getSecurityEvents();
      expect(events.some(e => e.type === SecurityEventType.SUSPICIOUS_ACTIVITY)).toBe(true);
    });
  });
  
  describe('getSecurityAlerts', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });
    
    it('должен возвращать пустой массив если нет оповещений', async () => {
      const alerts = await securityManager.getSecurityAlerts();
      expect(alerts).toEqual([]);
    });
    
    it('должен возвращать оповещения безопасности', async () => {
      // Создаем несколько оповещений
      await securityManager.createSecurityAlert('suspicious_activity', 'low', 'Low alert');
      await securityManager.createSecurityAlert('phishing_attempt', 'high', 'High alert');
      
      const alerts = await securityManager.getSecurityAlerts();
      expect(alerts).toHaveLength(2);
      expect(alerts[0].severity).toBe('high'); // Сортировка по времени (убывание)
      expect(alerts[1].severity).toBe('low');
    });
    
    it('должен ограничивать количество возвращаемых оповещений', async () => {
      // Создаем несколько оповещений
      for (let i = 0; i < 10; i++) {
        await securityManager.createSecurityAlert('suspicious_activity', 'low', `Alert ${i}`);
      }
      
      const alerts = await securityManager.getSecurityAlerts(5);
      expect(alerts).toHaveLength(5);
    });
  });
  
  describe('checkPhishing', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });
    
    it('должен детектировать phishing URL', async () => {
      const phishingUrl = 'http://bit.ly/malicious-link';
      const isPhishing = await securityManager.checkPhishing(phishingUrl);
      expect(isPhishing).toBe(true);
    });
    
    it('должен пропускать безопасные URL', async () => {
      const safeUrl = 'https://normaldance.com';
      const isPhishing = await securityManager.checkPhishing(safeUrl);
      expect(isPhishing).toBe(false);
    });
    
    it('должен создавать оповещение при детекции phishing', async () => {
      const phishingUrl = 'http://free-crypto.com/login';
      await securityManager.checkPhishing(phishingUrl);
      
      const alerts = await securityManager.getSecurityAlerts();
      expect(alerts.some(a => a.type === 'phishing_attempt')).toBe(true);
    });
  });
  
  describe('recordSecurityEvent', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });
    
    it('должен записывать событие безопасности', async () => {
      await securityManager.recordSecurityEvent(
        SecurityEventType.LOGIN_SUCCESS,
        'test_user',
        { method: 'telegram' }
      );
      
      const events = await securityManager.getSecurityEvents('test_user');
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(SecurityEventType.LOGIN_SUCCESS);
      expect(events[0].userId).toBe('test_user');
      expect(events[0].details.method).toBe('telegram');
    });
    
    it('должен устанавливать метаданные события', async () => {
      await securityManager.recordSecurityEvent(
        SecurityEventType.LOGIN_FAILURE,
        'test_user',
        { reason: 'invalid_credentials' },
        'high'
      );
      
      const events = await securityManager.getSecurityEvents('test_user');
      expect(events[0].severity).toBe('high');
      expect(events[0].deviceId).toBeDefined();
      expect(events[0].timestamp).toBeGreaterThan(0);
      expect(events[0].resolved).toBe(false);
    });
  });
  
  describe('getSecurityEvents', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });
    
    it('должен возвращать пустой массив если нет событий', async () => {
      const events = await securityManager.getSecurityEvents();
      expect(events).toEqual([]);
    });
    
    it('должен возвращать события для конкретного пользователя', async () => {
      await securityManager.recordSecurityEvent(SecurityEventType.LOGIN_SUCCESS, 'user1');
      await securityManager.recordSecurityEvent(SecurityEventType.LOGIN_SUCCESS, 'user2');
      
      const user1Events = await securityManager.getSecurityEvents('user1');
      expect(user1Events).toHaveLength(1);
      expect(user1Events[0].userId).toBe('user1');
    });
    
    it('должен возвращать события конкретного типа', async () => {
      await securityManager.recordSecurityEvent(SecurityEventType.LOGIN_SUCCESS, 'user1');
      await securityManager.recordSecurityEvent(SecurityEventType.LOGIN_FAILURE, 'user1');
      
      const loginEvents = await securityManager.getSecurityEvents('user1', SecurityEventType.LOGIN_SUCCESS);
      expect(loginEvents).toHaveLength(1);
      expect(loginEvents[0].type).toBe(SecurityEventType.LOGIN_SUCCESS);
    });
    
    it('должен сортировать события по времени (убывание)', async () => {
      const now = Date.now();
      await securityManager.recordSecurityEvent(SecurityEventType.LOGIN_SUCCESS, 'user1');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      await securityManager.recordSecurityEvent(SecurityEventType.LOGIN_FAILURE, 'user1');
      
      const events = await securityManager.getSecurityEvents('user1');
      expect(events[0].type).toBe(SecurityEventType.LOGIN_FAILURE); // Более позднее событие
      expect(events[1].type).toBe(SecurityEventType.LOGIN_SUCCESS); // Более раннее событие
    });
    
    it('должен ограничивать количество возвращаемых событий', async () => {
      // Создаем несколько событий
      for (let i = 0; i < 10; i++) {
        await securityManager.recordSecurityEvent(SecurityEventType.LOGIN_SUCCESS, 'user1');
      }
      
      const events = await securityManager.getSecurityEvents('user1', undefined, 5);
      expect(events).toHaveLength(5);
    });
  });
  
  describe('cleanupOldEvents', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });
    
    it('должен очищать старые события', async () => {
      // Создаем событие
      await securityManager.recordSecurityEvent(SecurityEventType.LOGIN_SUCCESS, 'user1');
      
      // Модифицируем время события на старое
      const events = await securityManager.getSecurityEvents();
      if (events.length > 0) {
        (events[0] as any).timestamp = Date.now() - (35 * 24 * 60 * 60 * 1000); // 35 дней назад
      }
      
      await securityManager.cleanupOldEvents();
      
      const cleanedEvents = await securityManager.getSecurityEvents();
      expect(cleanedEvents).toHaveLength(0);
    });
  });
});