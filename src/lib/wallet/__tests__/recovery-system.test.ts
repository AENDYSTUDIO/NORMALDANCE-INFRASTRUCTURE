import { RecoverySystemImpl } from '../recovery-system';
import { RecoveryConfig, EncryptedKey, TelegramContact } from '@/types/wallet';
import { MemoryStorageAdapter } from '../recovery-system';

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

describe('RecoverySystemImpl', () => {
  let recoverySystem: RecoverySystemImpl;
  let mockStorage: MemoryStorageAdapter;
  
  const mockConfig: RecoveryConfig = {
    threshold: 3,
    totalShares: 5,
    shareEncryption: true,
    contactVerification: true,
    gracePeriod: 24 * 60 * 60 * 1000 // 24 часа
  };
  
  const mockEncryptedKey: EncryptedKey = {
    data: new Uint8Array(32),
    iv: new Uint8Array(12),
    salt: new Uint8Array(16),
    algorithm: 'AES-256-GCM',
    keyDerivation: 'PBKDF2',
    iterations: 100000
  };
  
  const mockContacts: TelegramContact[] = [
    {
      id: '1',
      firstName: 'Александр',
      lastName: 'Петров',
      username: 'alex_petrov',
      isVerified: true,
      trustLevel: 0.9
    },
    {
      id: '2',
      firstName: 'Мария',
      lastName: 'Иванова',
      username: 'maria_ivanova',
      isVerified: true,
      trustLevel: 0.8
    },
    {
      id: '3',
      firstName: 'Дмитрий',
      lastName: 'Сидоров',
      isVerified: true,
      trustLevel: 0.7
    }
  ];
  
  beforeEach(() => {
    mockStorage = new MemoryStorageAdapter();
    recoverySystem = new RecoverySystemImpl(mockConfig, mockStorage);
  });
  
  afterEach(async () => {
    await mockStorage.clear();
    jest.clearAllMocks();
  });
  
  describe('initialize', () => {
    it('должен успешно инициализироваться', async () => {
      await expect(recoverySystem.initialize()).resolves.not.toThrow();
    });
  });
  
  describe('setupRecovery', () => {
    beforeEach(async () => {
      await recoverySystem.initialize();
    });
    
    it('должен настраивать восстановление с достаточным количеством контактов', async () => {
      await expect(recoverySystem.setupRecovery(mockEncryptedKey, mockContacts))
        .resolves.not.toThrow();
    });
    
    it('должен выбрасывать ошибку при недостаточном количестве контактов', async () => {
      const insufficientContacts = mockContacts.slice(0, 2); // Только 2 контакта
      
      await expect(recoverySystem.setupRecovery(mockEncryptedKey, insufficientContacts))
        .rejects.toThrow('Not enough contacts for recovery');
    });
    
    it('должен выбрасывать ошибку при слишком большом количестве контактов', async () => {
      const tooManyContacts = [
        ...mockContacts,
        { id: '4', firstName: 'Контакт', isVerified: true, trustLevel: 0.5 },
        { id: '5', firstName: 'Контакт', isVerified: true, trustLevel: 0.5 },
        { id: '6', firstName: 'Контакт', isVerified: true, trustLevel: 0.5 }
      ];
      
      await expect(recoverySystem.setupRecovery(mockEncryptedKey, tooManyContacts))
        .rejects.toThrow('Too many contacts');
    });
    
    it('должен сохранять метаданные восстановления', async () => {
      await recoverySystem.setupRecovery(mockEncryptedKey, mockContacts);
      
      const metadata = await recoverySystem.getRecoveryMetadata();
      expect(metadata).toBeDefined();
      expect(metadata.threshold).toBe(mockConfig.threshold);
      expect(metadata.totalShares).toBe(mockConfig.totalShares);
      expect(metadata.contacts).toHaveLength(mockContacts.length);
    });
  });
  
  describe('initiateRecovery', () => {
    beforeEach(async () => {
      await recoverySystem.initialize();
      await recoverySystem.setupRecovery(mockEncryptedKey, mockContacts);
    });
    
    it('должен создавать сессию восстановления', async () => {
      const userId = 'test_user';
      const session = await recoverySystem.initiateRecovery(userId);
      
      expect(session).toBeDefined();
      expect(session.userId).toBe(userId);
      expect(session.requiredShares).toBe(mockConfig.threshold);
      expect(session.collectedShares).toEqual([]);
      expect(session.status).toBe('pending');
      expect(session.expiresAt).toBeGreaterThan(Date.now());
    });
    
    it('должен выбрасывать ошибку при существующей активной сессии', async () => {
      const userId = 'test_user';
      
      // Создаем первую сессию
      await recoverySystem.initiateRecovery(userId);
      
      // Пытаемся создать вторую
      await expect(recoverySystem.initiateRecovery(userId))
        .rejects.toThrow('Recovery session already exists');
    });
  });
  
  describe('addShareToSession', () => {
    let recoverySession: any;
    
    beforeEach(async () => {
      await recoverySystem.initialize();
      await recoverySystem.setupRecovery(mockEncryptedKey, mockContacts);
      
      recoverySession = await recoverySystem.initiateRecovery('test_user');
    });
    
    it('должен добавлять share к сессии восстановления', async () => {
      const shareData = new Uint8Array(32);
      const contactId = '1';
      
      const updatedSession = await recoverySystem.addShareToSession(
        recoverySession.id,
        shareData,
        contactId
      );
      
      expect(updatedSession.collectedShares).toHaveLength(1);
      expect(updatedSession.collectedShares[0].contactId).toBe(contactId);
      expect(updatedSession.collectedShares[0].shareData).toEqual(shareData);
      expect(updatedSession.status).toBe('collecting');
    });
    
    it('должен изменять статус на completed при достаточном количестве shares', async () => {
      const shareData = new Uint8Array(32);
      
      // Добавляем необходимое количество shares
      for (let i = 0; i < mockConfig.threshold; i++) {
        await recoverySystem.addShareToSession(
          recoverySession.id,
          shareData,
          mockContacts[i].id
        );
      }
      
      const finalSession = await recoverySystem.getRecoverySession(recoverySession.id);
      expect(finalSession?.status).toBe('completed');
    });
    
    it('должен выбрасывать ошибку для несуществующей сессии', async () => {
      await expect(recoverySystem.addShareToSession(
        'non_existent_session',
        new Uint8Array(32),
        '1'
      )).rejects.toThrow('Recovery session not found');
    });
    
    it('должен выбрасывать ошибку для истекшей сессии', async () => {
      const shortGracePeriodConfig = { ...mockConfig, gracePeriod: 1 };
      const shortRecoverySystem = new RecoverySystemImpl(shortGracePeriodConfig, mockStorage);
      await shortRecoverySystem.initialize();
      await shortRecoverySystem.setupRecovery(mockEncryptedKey, mockContacts);
      
      const session = await shortRecoverySystem.initiateRecovery('test_user');
      
      // Ждем истечения сессии
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await expect(shortRecoverySystem.addShareToSession(
        session.id,
        new Uint8Array(32),
        '1'
      )).rejects.toThrow('Recovery session expired');
    });
    
    it('должен предотвращать дубликаты shares от одного контакта', async () => {
      const shareData = new Uint8Array(32);
      const contactId = '1';
      
      // Добавляем первый share
      await recoverySystem.addShareToSession(
        recoverySession.id,
        shareData,
        contactId
      );
      
      // Пытаемся добавить второй share от того же контакта
      await expect(recoverySystem.addShareToSession(
        recoverySession.id,
        shareData,
        contactId
      )).rejects.toThrow('Share already collected from this contact');
    });
  });
  
  describe('recoverKey', () => {
    let recoverySession: any;
    
    beforeEach(async () => {
      await recoverySystem.initialize();
      await recoverySystem.setupRecovery(mockEncryptedKey, mockContacts);
      
      recoverySession = await recoverySystem.initiateRecovery('test_user');
      
      // Добавляем необходимое количество shares
      const shareData = new Uint8Array(32);
      for (let i = 0; i < mockConfig.threshold; i++) {
        await recoverySystem.addShareToSession(
          recoverySession.id,
          shareData,
          mockContacts[i].id
        );
      }
    });
    
    it('должен восстанавливать ключ при завершенной сессии', async () => {
      const recoveredKey = await recoverySystem.recoverKey(recoverySession.id);
      
      expect(recoveredKey).toBeDefined();
      expect(recoveredKey.data).toEqual(mockEncryptedKey.data);
      expect(recoveredKey.iv).toEqual(mockEncryptedKey.iv);
      expect(recoveredKey.salt).toEqual(mockEncryptedKey.salt);
      expect(recoveredKey.algorithm).toBe(mockEncryptedKey.algorithm);
      expect(recoveredKey.keyDerivation).toBe(mockEncryptedKey.keyDerivation);
      expect(recoveredKey.iterations).toBe(mockEncryptedKey.iterations);
    });
    
    it('должен выбрасывать ошибку для незавершенной сессии', async () => {
      const incompleteSession = await recoverySystem.initiateRecovery('test_user_2');
      
      await expect(recoverySystem.recoverKey(incompleteSession.id))
        .rejects.toThrow('Recovery session not completed');
    });
    
    it('должен выбрасывать ошибку для несуществующей сессии', async () => {
      await expect(recoverySystem.recoverKey('non_existent_session'))
        .rejects.toThrow('Recovery session not found');
    });
  });
  
  describe('getShareForContact', () => {
    beforeEach(async () => {
      await recoverySystem.initialize();
      await recoverySystem.setupRecovery(mockEncryptedKey, mockContacts);
    });
    
    it('должен возвращать share для существующего контакта', async () => {
      const share = await recoverySystem.getShareForContact(mockContacts[0].id);
      
      expect(share).toBeDefined();
      expect(share?.contactId).toBe(mockContacts[0].id);
      expect(share?.shareData).toBeDefined();
      expect(share?.encrypted).toBe(mockConfig.shareEncryption);
    });
    
    it('должен возвращать null для несуществующего контакта', async () => {
      const share = await recoverySystem.getShareForContact('non_existent_contact');
      expect(share).toBeNull();
    });
  });
  
  describe('getActiveRecoverySession', () => {
    beforeEach(async () => {
      await recoverySystem.initialize();
      await recoverySystem.setupRecovery(mockEncryptedKey, mockContacts);
    });
    
    it('должен возвращать активную сессию для пользователя', async () => {
      const userId = 'test_user';
      await recoverySystem.initiateRecovery(userId);
      
      const activeSession = await recoverySystem.getActiveRecoverySession(userId);
      expect(activeSession).toBeDefined();
      expect(activeSession?.userId).toBe(userId);
      expect(activeSession?.status).toMatch(/pending|collecting/);
    });
    
    it('должен возвращать null для пользователя без активной сессии', async () => {
      const activeSession = await recoverySystem.getActiveRecoverySession('non_existent_user');
      expect(activeSession).toBeNull();
    });
    
    it('не должен возвращать истекшие сессии', async () => {
      const shortGracePeriodConfig = { ...mockConfig, gracePeriod: 1 };
      const shortRecoverySystem = new RecoverySystemImpl(shortGracePeriodConfig, mockStorage);
      await shortRecoverySystem.initialize();
      await shortRecoverySystem.setupRecovery(mockEncryptedKey, mockContacts);
      
      const userId = 'test_user';
      await shortRecoverySystem.initiateRecovery(userId);
      
      // Ждем истечения сессии
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const activeSession = await shortRecoverySystem.getActiveRecoverySession(userId);
      expect(activeSession).toBeNull();
    });
  });
  
  describe('cancelRecoverySession', () => {
    let recoverySession: any;
    
    beforeEach(async () => {
      await recoverySystem.initialize();
      await recoverySystem.setupRecovery(mockEncryptedKey, mockContacts);
      
      recoverySession = await recoverySystem.initiateRecovery('test_user');
    });
    
    it('должен отменять сессию восстановления', async () => {
      await recoverySystem.cancelRecoverySession(recoverySession.id);
      
      const session = await recoverySystem.getRecoverySession(recoverySession.id);
      expect(session?.status).toBe('failed');
    });
    
    it('должен выбрасывать ошибку для несуществующей сессии', async () => {
      await expect(recoverySystem.cancelRecoverySession('non_existent_session'))
        .rejects.toThrow('Recovery session not found');
    });
  });
  
  describe('isRecoverySetup', () => {
    it('должен возвращать false если восстановление не настроено', async () => {
      await recoverySystem.initialize();
      
      const isSetup = await recoverySystem.isRecoverySetup();
      expect(isSetup).toBe(false);
    });
    
    it('должен возвращать true если восстановление настроено', async () => {
      await recoverySystem.initialize();
      await recoverySystem.setupRecovery(mockEncryptedKey, mockContacts);
      
      const isSetup = await recoverySystem.isRecoverySetup();
      expect(isSetup).toBe(true);
    });
  });
  
  describe('cleanupExpiredSessions', () => {
    beforeEach(async () => {
      await recoverySystem.initialize();
      await recoverySystem.setupRecovery(mockEncryptedKey, mockContacts);
    });
    
    it('должен очищать истекшие сессии', async () => {
      const shortGracePeriodConfig = { ...mockConfig, gracePeriod: 1 };
      const shortRecoverySystem = new RecoverySystemImpl(shortGracePeriodConfig, mockStorage);
      await shortRecoverySystem.initialize();
      await shortRecoverySystem.setupRecovery(mockEncryptedKey, mockContacts);
      
      // Создаем несколько сессий
      await shortRecoverySystem.initiateRecovery('user_1');
      await shortRecoverySystem.initiateRecovery('user_2');
      
      // Ждем истечения сессий
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await shortRecoverySystem.cleanupExpiredSessions();
      
      const activeSession1 = await shortRecoverySystem.getActiveRecoverySession('user_1');
      const activeSession2 = await shortRecoverySystem.getActiveRecoverySession('user_2');
      
      expect(activeSession1).toBeNull();
      expect(activeSession2).toBeNull();
    });
  });
});