import { SessionManagerImpl } from '../session-manager';
import { SessionManagerConfig } from '@/types/wallet';
import { MemoryStorageAdapter } from '../session-manager';

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

describe('SessionManagerImpl', () => {
  let sessionManager: SessionManagerImpl;
  let mockStorage: MemoryStorageAdapter;
  
  const mockConfig: SessionManagerConfig = {
    sessionTimeout: 60 * 60 * 1000, // 1 час
    refreshThreshold: 30 * 60 * 1000, // 30 минут
    storageType: 'memory',
    encryptionEnabled: false
  };
  
  beforeEach(() => {
    mockStorage = new MemoryStorageAdapter();
    sessionManager = new SessionManagerImpl(mockConfig, mockStorage);
  });
  
  afterEach(async () => {
    await mockStorage.clear();
    jest.clearAllMocks();
  });
  
  describe('initialize', () => {
    it('должен успешно инициализироваться', async () => {
      await expect(sessionManager.initialize()).resolves.not.toThrow();
    });
  });
  
  describe('createSession', () => {
    beforeEach(async () => {
      await sessionManager.initialize();
    });
    
    it('должен создавать новую сессию', async () => {
      const publicKey = 'test_public_key';
      const session = await sessionManager.createSession(publicKey);
      
      expect(session).toBeDefined();
      expect(session.publicKey).toBe(publicKey);
      expect(session.id).toBeDefined();
      expect(session.createdAt).toBeGreaterThan(0);
      expect(session.expiresAt).toBeGreaterThan(session.createdAt);
      expect(session.deviceId).toBeDefined();
      expect(session.metadata).toBeDefined();
    });
    
    it('должен устанавливать правильное время истечения', async () => {
      const publicKey = 'test_public_key';
      const now = Date.now();
      const session = await sessionManager.createSession(publicKey);
      
      const expectedExpiresAt = now + mockConfig.sessionTimeout;
      expect(session.expiresAt).toBeCloseTo(expectedExpiresAt, 1000); // Погрешность 1 секунда
    });
    
    it('должен сохранять сессию в хранилище', async () => {
      const publicKey = 'test_public_key';
      const session = await sessionManager.createSession(publicKey);
      
      const storedSession = await sessionManager.getCurrentSession();
      expect(storedSession).toBeDefined();
      expect(storedSession?.id).toBe(session.id);
      expect(storedSession?.publicKey).toBe(publicKey);
    });
  });
  
  describe('getCurrentSession', () => {
    beforeEach(async () => {
      await sessionManager.initialize();
    });
    
    it('должен возвращать null если нет активной сессии', async () => {
      const session = await sessionManager.getCurrentSession();
      expect(session).toBeNull();
    });
    
    it('должен возвращать текущую сессию', async () => {
      const publicKey = 'test_public_key';
      const createdSession = await sessionManager.createSession(publicKey);
      
      const currentSession = await sessionManager.getCurrentSession();
      expect(currentSession).toBeDefined();
      expect(currentSession?.id).toBe(createdSession.id);
    });
    
    it('должен возвращать null для истекшей сессии', async () => {
      const publicKey = 'test_public_key';
      const shortTimeoutConfig = { ...mockConfig, sessionTimeout: 1 };
      const shortSessionManager = new SessionManagerImpl(shortTimeoutConfig, mockStorage);
      await shortSessionManager.initialize();
      
      await shortSessionManager.createSession(publicKey);
      
      // Ждем истечения сессии
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const currentSession = await shortSessionManager.getCurrentSession();
      expect(currentSession).toBeNull();
    });
  });
  
  describe('refreshSession', () => {
    beforeEach(async () => {
      await sessionManager.initialize();
    });
    
    it('должен обновлять существующую сессию', async () => {
      const publicKey = 'test_public_key';
      const originalSession = await sessionManager.createSession(publicKey);
      const originalExpiresAt = originalSession.expiresAt;
      
      // Ждем немного перед обновлением
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const refreshedSession = await sessionManager.refreshSession(originalSession.id);
      
      expect(refreshedSession).toBeDefined();
      expect(refreshedSession.id).toBe(originalSession.id);
      expect(refreshedSession.publicKey).toBe(originalSession.publicKey);
      expect(refreshedSession.expiresAt).toBeGreaterThan(originalExpiresAt);
      expect(refreshedSession.lastActivity).toBeGreaterThan(originalSession.lastActivity);
    });
    
    it('должен выбрасывать ошибку для несуществующей сессии', async () => {
      await expect(sessionManager.refreshSession('non_existent_session'))
        .rejects.toThrow('Session not found');
    });
    
    it('должен выбрасывать ошибку для истекшей сессии', async () => {
      const publicKey = 'test_public_key';
      const shortTimeoutConfig = { ...mockConfig, sessionTimeout: 1 };
      const shortSessionManager = new SessionManagerImpl(shortTimeoutConfig, mockStorage);
      await shortSessionManager.initialize();
      
      const session = await shortSessionManager.createSession(publicKey);
      
      // Ждем истечения сессии
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await expect(shortSessionManager.refreshSession(session.id))
        .rejects.toThrow('Session expired');
    });
  });
  
  describe('expireSession', () => {
    beforeEach(async () => {
      await sessionManager.initialize();
    });
    
    it('должен завершать сессию', async () => {
      const publicKey = 'test_public_key';
      const session = await sessionManager.createSession(publicKey);
      
      await sessionManager.expireSession(session.id);
      
      const currentSession = await sessionManager.getCurrentSession();
      expect(currentSession).toBeNull();
    });
    
    it('должен выбрасывать ошибку для несуществующей сессии', async () => {
      await expect(sessionManager.expireSession('non_existent_session'))
        .rejects.toThrow('No session to expire');
    });
  });
  
  describe('validateSession', () => {
    beforeEach(async () => {
      await sessionManager.initialize();
    });
    
    it('должен валидировать активную сессию', async () => {
      const publicKey = 'test_public_key';
      const session = await sessionManager.createSession(publicKey);
      
      const isValid = await sessionManager.validateSession(session.id);
      expect(isValid).toBe(true);
    });
    
    it('должен возвращать false для несуществующей сессии', async () => {
      const isValid = await sessionManager.validateSession('non_existent_session');
      expect(isValid).toBe(false);
    });
    
    it('должен возвращать false для истекшей сессии', async () => {
      const publicKey = 'test_public_key';
      const shortTimeoutConfig = { ...mockConfig, sessionTimeout: 1 };
      const shortSessionManager = new SessionManagerImpl(shortTimeoutConfig, mockStorage);
      await shortSessionManager.initialize();
      
      const session = await shortSessionManager.createSession(publicKey);
      
      // Ждем истечения сессии
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const isValid = await shortSessionManager.validateSession(session.id);
      expect(isValid).toBe(false);
    });
  });
  
  describe('getActiveSessions', () => {
    beforeEach(async () => {
      await sessionManager.initialize();
    });
    
    it('должен возвращать пустой массив если нет активных сессий', async () => {
      const activeSessions = await sessionManager.getActiveSessions();
      expect(activeSessions).toEqual([]);
    });
    
    it('должен возвращать активные сессии', async () => {
      const session1 = await sessionManager.createSession('public_key_1');
      const session2 = await sessionManager.createSession('public_key_2');
      
      const activeSessions = await sessionManager.getActiveSessions();
      expect(activeSessions).toHaveLength(2);
      expect(activeSessions.map(s => s.id)).toContain(session1.id);
      expect(activeSessions.map(s => s.id)).toContain(session2.id);
    });
    
    it('не должен включать истекшие сессии', async () => {
      const shortTimeoutConfig = { ...mockConfig, sessionTimeout: 1 };
      const shortSessionManager = new SessionManagerImpl(shortTimeoutConfig, mockStorage);
      await shortSessionManager.initialize();
      
      const activeSession = await shortSessionManager.createSession('active_key');
      const expiredSession = await shortSessionManager.createSession('expired_key');
      
      // Ждем истечения одной сессии
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const activeSessions = await shortSessionManager.getActiveSessions();
      expect(activeSessions).toHaveLength(1);
      expect(activeSessions[0].id).toBe(activeSession.id);
    });
  });
  
  describe('updateActivity', () => {
    beforeEach(async () => {
      await sessionManager.initialize();
    });
    
    it('должен обновлять время активности сессии', async () => {
      const publicKey = 'test_public_key';
      const session = await sessionManager.createSession(publicKey);
      const originalLastActivity = session.lastActivity;
      
      // Ждем немного перед обновлением
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await sessionManager.updateActivity(session.id);
      
      const updatedSession = await sessionManager.getCurrentSession();
      expect(updatedSession?.lastActivity).toBeGreaterThan(originalLastActivity);
    });
    
    it('не должен выбрасывать ошибку для несуществующей сессии', async () => {
      await expect(sessionManager.updateActivity('non_existent_session'))
        .resolves.not.toThrow();
    });
  });
  
  describe('requiresMFA', () => {
    beforeEach(async () => {
      await sessionManager.initialize();
    });
    
    it('должен требовать MFA для новой сессии', async () => {
      const publicKey = 'test_public_key';
      await sessionManager.createSession(publicKey);
      
      const requiresMFA = await sessionManager.requiresMFA();
      expect(requiresMFA).toBe(true);
    });
    
    it('должен требовать MFA для сессии с низкой оценкой доверия', async () => {
      // Создаем сессию с низкой оценкой доверия
      const publicKey = 'test_public_key';
      const session = await sessionManager.createSession(publicKey);
      
      // Модифицируем метаданные для низкой оценки доверия
      (session as any).metadata.trustScore = 0.3;
      
      const requiresMFA = await sessionManager.requiresMFA(session.id);
      expect(requiresMFA).toBe(true);
    });
  });
  
  describe('cleanupExpiredSessions', () => {
    beforeEach(async () => {
      await sessionManager.initialize();
    });
    
    it('должен очищать истекшие сессии', async () => {
      const shortTimeoutConfig = { ...mockConfig, sessionTimeout: 1 };
      const shortSessionManager = new SessionManagerImpl(shortTimeoutConfig, mockStorage);
      await shortSessionManager.initialize();
      
      // Создаем несколько сессий
      await shortSessionManager.createSession('key_1');
      await shortSessionManager.createSession('key_2');
      
      // Ждем истечения сессий
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await shortSessionManager.cleanupExpiredSessions();
      
      const activeSessions = await shortSessionManager.getActiveSessions();
      expect(activeSessions).toHaveLength(0);
    });
  });
});