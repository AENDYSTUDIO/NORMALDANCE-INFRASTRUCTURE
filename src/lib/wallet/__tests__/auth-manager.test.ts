import { AuthManager, AuthType } from '../auth-manager';
import { MemoryStorageAdapter } from '../auth-manager';

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
    platform: 'Test Platform',
    credentials: {
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null)
    }
  },
  writable: true
});

// Mock для PublicKeyCredential
global.PublicKeyCredential = {
  isUserVerifyingPlatformAuthenticatorAvailable: jest.fn().mockResolvedValue(true)
} as any;

describe('AuthManager', () => {
  let authManager: AuthManager;
  let mockStorage: MemoryStorageAdapter;
  
  beforeEach(() => {
    mockStorage = new MemoryStorageAdapter();
    authManager = new AuthManager(mockStorage);
  });
  
  afterEach(async () => {
    await mockStorage.clear();
    jest.clearAllMocks();
  });
  
  describe('initialize', () => {
    it('должен успешно инициализироваться', async () => {
      await expect(authManager.initialize()).resolves.not.toThrow();
    });
  });
  
  describe('authenticate', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });
    
    it('должен успешно аутентифицировать с Telegram', async () => {
      const result = await authManager.authenticate(AuthType.TELEGRAM);
      
      expect(result.success).toBe(true);
      expect(result.authType).toBe(AuthType.TELEGRAM);
      expect(result.trustScore).toBeGreaterThan(0);
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.deviceId).toBeDefined();
    });
    
    it('должен выбрасывать ошибку для неверного PIN', async () => {
      const result = await authManager.authenticate(AuthType.PIN, { pin: '0000' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    it('должен требовать PIN для PIN аутентификации', async () => {
      await expect(authManager.authenticate(AuthType.PIN))
        .rejects.toThrow('PIN is required for PIN authentication');
    });
    
    it('должен успешно аутентифицировать с правильным PIN', async () => {
      // Сначала настраиваем PIN
      await authManager.setupPinAuth('1234');
      
      const result = await authManager.authenticate(AuthType.PIN, { pin: '1234' });
      
      expect(result.success).toBe(true);
      expect(result.authType).toBe(AuthType.PIN);
      expect(result.trustScore).toBeGreaterThan(0);
    });
    
    it('должен успешно выполнять комбинированную аутентификацию', async () => {
      // Настраиваем оба метода
      await authManager.setupPinAuth('1234');
      await authManager.setupCombinedAuth();
      
      const result = await authManager.authenticate(AuthType.COMBINED, { 
        pin: '1234',
        biometricPrompt: 'Аутентификация'
      });
      
      expect(result.success).toBe(true);
      expect(result.authType).toBe(AuthType.COMBINED);
      expect(result.trustScore).toBe(1.0); // Максимальная оценка для комбинированной аутентификации
    });
    
    it('должен выбрасывать ошибку для неподдерживаемого типа аутентификации', async () => {
      await expect(authManager.authenticate('unsupported' as AuthType))
        .rejects.toThrow('Unsupported authentication type');
    });
  });
  
  describe('setupPinAuth', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });
    
    it('должен успешно настраивать PIN аутентификацию', async () => {
      const result = await authManager.setupPinAuth('1234');
      
      expect(result).toBe(true);
      
      const settings = await authManager.getAuthSettings();
      expect(settings.pinEnabled).toBe(true);
    });
    
    it('должен выбрасывать ошибку для короткого PIN', async () => {
      await expect(authManager.setupPinAuth('123'))
        .rejects.toThrow('PIN must be at least 4 characters');
    });
    
    it('должен выбрасывать ошибку для PIN с нецифровыми символами', async () => {
      await expect(authManager.setupPinAuth('abcd'))
        .rejects.toThrow('PIN must be at least 4 characters');
    });
  });
  
  describe('setupBiometricAuth', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });
    
    it('должен успешно настраивать биометрическую аутентификацию', async () => {
      const result = await authManager.setupBiometricAuth();
      
      expect(result).toBe(true);
      
      const settings = await authManager.getAuthSettings();
      expect(settings.biometricEnabled).toBe(true);
    });
    
    it('должен выбрасывать ошибку если биометрия недоступна', async () => {
      // Mock для недоступности биометрии
      (global.PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable
        .mockResolvedValue(false);
      
      await expect(authManager.setupBiometricAuth())
        .rejects.toThrow('Biometric authentication is not available');
    });
  });
  
  describe('setupTelegramAuth', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });
    
    it('должен успешно настраивать Telegram аутентификацию', async () => {
      const result = await authManager.setupTelegramAuth();
      
      expect(result).toBe(true);
      
      const settings = await authManager.getAuthSettings();
      expect(settings.telegramEnabled).toBe(true);
    });
  });
  
  describe('setupCombinedAuth', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });
    
    it('должен успешно настраивать комбинированную аутентификацию', async () => {
      // Сначала настраиваем оба метода
      await authManager.setupPinAuth('1234');
      await authManager.setupBiometricAuth();
      
      const result = await authManager.setupCombinedAuth();
      
      expect(result).toBe(true);
      
      const settings = await authManager.getAuthSettings();
      expect(settings.combinedAuthEnabled).toBe(true);
    });
    
    it('должен выбрасывать ошибку если не все методы настроены', async () => {
      await expect(authManager.setupCombinedAuth())
        .rejects.toThrow('Both biometric and PIN authentication must be enabled for combined auth');
    });
  });
  
  describe('checkCurrentSession', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });
    
    it('должен возвращать null если нет активной сессии', async () => {
      const session = await authManager.checkCurrentSession();
      expect(session).toBeNull();
    });
    
    it('должен возвращать активную сессию', async () => {
      // Создаем сессию через аутентификацию
      await authManager.setupTelegramAuth();
      await authManager.authenticate(AuthType.TELEGRAM);
      
      const session = await authManager.checkCurrentSession();
      expect(session).toBeDefined();
      expect(session?.success).toBe(true);
      expect(session?.authType).toBe(AuthType.TELEGRAM);
    });
    
    it('должен возвращать null для истекшей сессии', async () => {
      // Создаем сессию с коротким временем жизни
      await authManager.setupTelegramAuth();
      await authManager.updateAuthSettings({ sessionDuration: 1 }); // 1 мс
      
      await authManager.authenticate(AuthType.TELEGRAM);
      
      // Ждем истечения сессии
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const session = await authManager.checkCurrentSession();
      expect(session).toBeNull();
    });
  });
  
  describe('logout', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });
    
    it('должен успешно выходить из системы', async () => {
      // Создаем сессию
      await authManager.setupTelegramAuth();
      await authManager.authenticate(AuthType.TELEGRAM);
      
      await authManager.logout();
      
      const session = await authManager.checkCurrentSession();
      expect(session).toBeNull();
    });
  });
  
  describe('getAvailableAuthMethods', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });
    
    it('должен возвращать доступные методы аутентификации', async () => {
      // Настраиваем все методы
      await authManager.setupPinAuth('1234');
      await authManager.setupBiometricAuth();
      await authManager.setupTelegramAuth();
      await authManager.setupCombinedAuth();
      
      const methods = await authManager.getAvailableAuthMethods();
      
      expect(methods).toContain(AuthType.PIN);
      expect(methods).toContain(AuthType.BIOMETRIC);
      expect(methods).toContain(AuthType.TELEGRAM);
      expect(methods).toContain(AuthType.COMBINED);
    });
    
    it('не должен включать недоступные методы', async () => {
      // Mock для недоступности биометрии
      (global.PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable
        .mockResolvedValue(false);
      
      const methods = await authManager.getAvailableAuthMethods();
      
      expect(methods).not.toContain(AuthType.BIOMETRIC);
    });
  });
  
  describe('updateAuthSettings', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });
    
    it('должен обновлять настройки аутентификации', async () => {
      const newSettings = {
        maxAttempts: 10,
        lockoutDuration: 30 * 60 * 1000, // 30 минут
        requireMFA: false
      };
      
      await authManager.updateAuthSettings(newSettings);
      
      const settings = await authManager.getAuthSettings();
      expect(settings.maxAttempts).toBe(newSettings.maxAttempts);
      expect(settings.lockoutDuration).toBe(newSettings.lockoutDuration);
      expect(settings.requireMFA).toBe(newSettings.requireMFA);
    });
  });
  
  describe('requiresMFA', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });
    
    it('должен требовать MFA для низкой оценки доверия', async () => {
      await authManager.updateAuthSettings({ requireMFA: true, mfaThreshold: 0.8 });
      
      const requiresMFA = await authManager.requiresMFA(0.5);
      expect(requiresMFA).toBe(true);
    });
    
    it('не должен требовать MFA для высокой оценки доверия', async () => {
      await authManager.updateAuthSettings({ requireMFA: true, mfaThreshold: 0.8 });
      
      const requiresMFA = await authManager.requiresMFA(0.9);
      expect(requiresMFA).toBe(false);
    });
    
    it('не должен требовать MFA если отключено в настройках', async () => {
      await authManager.updateAuthSettings({ requireMFA: false });
      
      const requiresMFA = await authManager.requiresMFA(0.1);
      expect(requiresMFA).toBe(false);
    });
  });
  
  describe('getCurrentSession', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });
    
    it('должен возвращать текущую сессию', async () => {
      // Создаем сессию
      await authManager.setupTelegramAuth();
      await authManager.authenticate(AuthType.TELEGRAM);
      
      const session = authManager.getCurrentSession();
      expect(session).toBeDefined();
      expect(session?.success).toBe(true);
    });
    
    it('должен возвращать null если нет сессии', () => {
      const session = authManager.getCurrentSession();
      expect(session).toBeNull();
    });
  });
  
  describe('rate limiting', () => {
    beforeEach(async () => {
      await authManager.initialize();
      await authManager.setupPinAuth('1234');
    });
    
    it('должен блокировать пользователя после превышения лимита попыток', async () => {
      // Выполняем несколько неудачных попыток
      for (let i = 0; i < 5; i++) {
        try {
          await authManager.authenticate(AuthType.PIN, { pin: '0000' });
        } catch (error) {
          // Ожидаем ошибки
        }
      }
      
      // Следующая попытка должна быть заблокирована
      await expect(authManager.authenticate(AuthType.PIN, { pin: '1234' }))
        .rejects.toThrow('Authentication is locked due to too many failed attempts');
    });
    
    it('должен сбрасывать счетчик неудачных попыток после успешной аутентификации', async () => {
      // Выполняем несколько неудачных попыток
      for (let i = 0; i < 2; i++) {
        try {
          await authManager.authenticate(AuthType.PIN, { pin: '0000' });
        } catch (error) {
          // Ожидаем ошибки
        }
      }
      
      // Успешная аутентификация
      await authManager.authenticate(AuthType.PIN, { pin: '1234' });
      
      // Следующая неудачная попытка не должна блокировать
      const result = await authManager.authenticate(AuthType.PIN, { pin: '0000' });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});