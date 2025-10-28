import {
  StorageAdapter,
  InvisibleWalletError,
  SessionManagerError,
  SecurityError
} from "@/types/wallet";
import { CryptoUtils, StorageUtils, DeviceUtils, TelegramUtils, ErrorUtils } from "./utils";
import { logger } from "@/lib/utils/logger";

/**
 * Типы аутентификации
 */
export enum AuthType {
  BIOMETRIC = 'biometric',
  PIN = 'pin',
  TELEGRAM = 'telegram',
  COMBINED = 'combined'
}

/**
 * Результат аутентификации
 */
export interface AuthResult {
  success: boolean;
  authType: AuthType;
  timestamp: number;
  deviceId: string;
  trustScore: number;
  requiresMFA?: boolean;
  error?: string;
}

/**
 * Метаданные аутентификации
 */
export interface AuthMetadata {
  userId: string;
  authType: AuthType;
  createdAt: number;
  lastUsed: number;
  successCount: number;
  failureCount: number;
  lastFailure?: number;
  isLocked: boolean;
  lockUntil?: number;
  settings: AuthSettings;
}

/**
 * Настройки аутентификации
 */
export interface AuthSettings {
  biometricEnabled: boolean;
  pinEnabled: boolean;
  telegramEnabled: boolean;
  combinedAuthEnabled: boolean;
  maxAttempts: number;
  lockoutDuration: number; // в миллисекундах
  sessionDuration: number; // в миллисекундах
  requireMFA: boolean;
  mfaThreshold: number; // порог для требования MFA
}

/**
 * Интерфейс для биометрической аутентификации
 */
interface BiometricAuth {
  isAvailable(): Promise<boolean>;
  authenticate(prompt?: string): Promise<boolean>;
  enroll(): Promise<boolean>;
}

/**
 * Интерфейс для PIN аутентификации
 */
interface PinAuth {
  setup(pin: string): Promise<boolean>;
  authenticate(pin: string): Promise<boolean>;
  changePin(oldPin: string, newPin: string): Promise<boolean>;
  validatePin(pin: string): boolean;
}

/**
 * Интерфейс для Telegram аутентификации
 */
interface TelegramAuth {
  authenticate(): Promise<boolean>;
  validateTelegramUser(): Promise<boolean>;
  getTelegramUserId(): Promise<string | null>;
}

/**
 * Реализация менеджера аутентификации для Invisible Wallet
 */
export class AuthManager {
  private storage: StorageAdapter;
  private crypto: CryptoUtils;
  private biometricAuth: BiometricAuth;
  private pinAuth: PinAuth;
  private telegramAuth: TelegramAuth;
  private currentSession: AuthResult | null = null;
  private authSettings: AuthSettings;
  
  constructor(storage?: StorageAdapter) {
    this.storage = storage || this.createStorageAdapter();
    this.crypto = new CryptoUtils({
      encryptionAlgorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2',
      storageType: 'indexeddb',
      backupEnabled: false,
      rotationInterval: 30
    });
    
    this.biometricAuth = new BiometricAuthImpl();
    this.pinAuth = new PinAuthImpl(this.storage, this.crypto);
    this.telegramAuth = new TelegramAuthImpl();
    
    this.authSettings = this.getDefaultAuthSettings();
  }
  
  /**
   * Инициализация менеджера аутентификации
   */
  async initialize(): Promise<void> {
    try {
      logger.info("Initializing AuthManager");
      
      // Инициализация хранилища
      if ('initialize' in this.storage && typeof this.storage.initialize === 'function') {
        await this.storage.initialize();
      }
      
      // Загрузка настроек аутентификации
      await this.loadAuthSettings();
      
      // Инициализация компонентов аутентификации
      await this.initializeAuthComponents();
      
      // Проверка текущей сессии
      await this.checkCurrentSession();
      
      logger.info("AuthManager initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize AuthManager", error as Error);
      throw new InvisibleWalletError("Failed to initialize AuthManager", "AUTH_MANAGER_INIT_ERROR", { error });
    }
  }
  
  /**
   * Аутентификация пользователя
   */
  async authenticate(authType: AuthType, credentials?: any): Promise<AuthResult> {
    try {
      logger.info("Authenticating user", { authType });
      
      const deviceId = await DeviceUtils.getDeviceId();
      const userId = await this.getUserId();
      
      // Проверка блокировки
      const isLocked = await this.isAuthLocked(userId);
      if (isLocked) {
        throw new SecurityError("Authentication is locked due to too many failed attempts");
      }
      
      let authSuccess = false;
      let trustScore = 0.5;
      
      switch (authType) {
        case AuthType.BIOMETRIC:
          authSuccess = await this.biometricAuth.authenticate(credentials?.prompt);
          trustScore = authSuccess ? 0.9 : 0;
          break;
          
        case AuthType.PIN:
          if (!credentials?.pin) {
            throw new InvisibleWalletError("PIN is required for PIN authentication", "PIN_REQUIRED");
          }
          authSuccess = await this.pinAuth.authenticate(credentials.pin);
          trustScore = authSuccess ? 0.7 : 0;
          break;
          
        case AuthType.TELEGRAM:
          authSuccess = await this.telegramAuth.authenticate();
          trustScore = authSuccess ? 0.8 : 0;
          break;
          
        case AuthType.COMBINED:
          authSuccess = await this.performCombinedAuth(credentials);
          trustScore = authSuccess ? 1.0 : 0;
          break;
          
        default:
          throw new InvisibleWalletError("Unsupported authentication type", "UNSUPPORTED_AUTH_TYPE");
      }
      
      if (!authSuccess) {
        await this.handleAuthFailure(userId);
        throw new SecurityError("Authentication failed");
      }
      
      // Обновление метаданных аутентификации
      await this.updateAuthMetadata(userId, authType, true);
      
      // Создание результата аутентификации
      const authResult: AuthResult = {
        success: true,
        authType,
        timestamp: Date.now(),
        deviceId,
        trustScore,
        requiresMFA: await this.requiresMFA(trustScore)
      };
      
      // Сохранение сессии
      await this.saveAuthSession(authResult);
      this.currentSession = authResult;
      
      logger.info("User authenticated successfully", { 
        authType, 
        trustScore,
        requiresMFA: authResult.requiresMFA 
      });
      
      return authResult;
    } catch (error) {
      logger.error("Authentication failed", error as Error);
      return {
        success: false,
        authType,
        timestamp: Date.now(),
        deviceId: await DeviceUtils.getDeviceId(),
        trustScore: 0,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }
  
  /**
   * Настройка биометрической аутентификации
   */
  async setupBiometricAuth(): Promise<boolean> {
    try {
      logger.info("Setting up biometric authentication");
      
      const isAvailable = await this.biometricAuth.isAvailable();
      if (!isAvailable) {
        throw new InvisibleWalletError("Biometric authentication is not available", "BIOMETRIC_UNAVAILABLE");
      }
      
      const success = await this.biometricAuth.enroll();
      if (success) {
        this.authSettings.biometricEnabled = true;
        await this.saveAuthSettings();
        
        // Создание метаданных для биометрии
        const userId = await this.getUserId();
        await this.createAuthMetadata(userId, AuthType.BIOMETRIC);
      }
      
      logger.info("Biometric authentication setup completed", { success });
      return success;
    } catch (error) {
      logger.error("Failed to setup biometric authentication", error as Error);
      throw new InvisibleWalletError("Failed to setup biometric authentication", "SETUP_BIOMETRIC_ERROR", { error });
    }
  }
  
  /**
   * Настройка PIN аутентификации
   */
  async setupPinAuth(pin: string): Promise<boolean> {
    try {
      logger.info("Setting up PIN authentication");
      
      if (!pin || pin.length < 4) {
        throw new InvisibleWalletError("PIN must be at least 4 characters", "INVALID_PIN");
      }
      
      const success = await this.pinAuth.setup(pin);
      if (success) {
        this.authSettings.pinEnabled = true;
        await this.saveAuthSettings();
        
        // Создание метаданных для PIN
        const userId = await this.getUserId();
        await this.createAuthMetadata(userId, AuthType.PIN);
      }
      
      logger.info("PIN authentication setup completed", { success });
      return success;
    } catch (error) {
      logger.error("Failed to setup PIN authentication", error as Error);
      throw new InvisibleWalletError("Failed to setup PIN authentication", "SETUP_PIN_ERROR", { error });
    }
  }
  
  /**
   * Настройка Telegram аутентификации
   */
  async setupTelegramAuth(): Promise<boolean> {
    try {
      logger.info("Setting up Telegram authentication");
      
      const isValid = await this.telegramAuth.validateTelegramUser();
      if (!isValid) {
        throw new InvisibleWalletError("Telegram user validation failed", "TELEGRAM_VALIDATION_FAILED");
      }
      
      this.authSettings.telegramEnabled = true;
      await this.saveAuthSettings();
      
      // Создание метаданных для Telegram
      const userId = await this.getUserId();
      await this.createAuthMetadata(userId, AuthType.TELEGRAM);
      
      logger.info("Telegram authentication setup completed");
      return true;
    } catch (error) {
      logger.error("Failed to setup Telegram authentication", error as Error);
      throw new InvisibleWalletError("Failed to setup Telegram authentication", "SETUP_TELEGRAM_ERROR", { error });
    }
  }
  
  /**
   * Настройка комбинированной аутентификации
   */
  async setupCombinedAuth(): Promise<boolean> {
    try {
      logger.info("Setting up combined authentication");
      
      // Проверка наличия всех методов аутентификации
      if (!this.authSettings.biometricEnabled || !this.authSettings.pinEnabled) {
        throw new InvisibleWalletError("Both biometric and PIN authentication must be enabled for combined auth", "INSUFFICIENT_AUTH_METHODS");
      }
      
      this.authSettings.combinedAuthEnabled = true;
      await this.saveAuthSettings();
      
      // Создание метаданных для комбинированной аутентификации
      const userId = await this.getUserId();
      await this.createAuthMetadata(userId, AuthType.COMBINED);
      
      logger.info("Combined authentication setup completed");
      return true;
    } catch (error) {
      logger.error("Failed to setup combined authentication", error as Error);
      throw new InvisibleWalletError("Failed to setup combined authentication", "SETUP_COMBINED_ERROR", { error });
    }
  }
  
  /**
   * Проверка текущей сессии
   */
  async checkCurrentSession(): Promise<AuthResult | null> {
    try {
      const sessionData = await this.storage.get('invisible_wallet_auth_session');
      if (!sessionData) {
        return null;
      }
      
      // Проверка истечения сессии
      if (Date.now() > sessionData.timestamp + this.authSettings.sessionDuration) {
        await this.storage.remove('invisible_wallet_auth_session');
        return null;
      }
      
      this.currentSession = sessionData;
      return sessionData;
    } catch (error) {
      logger.error("Failed to check current session", error as Error);
      return null;
    }
  }
  
  /**
   * Выход из системы
   */
  async logout(): Promise<void> {
    try {
      logger.info("Logging out user");
      
      this.currentSession = null;
      await this.storage.remove('invisible_wallet_auth_session');
      
      logger.info("User logged out successfully");
    } catch (error) {
      logger.error("Failed to logout user", error as Error);
      throw new InvisibleWalletError("Failed to logout user", "LOGOUT_ERROR", { error });
    }
  }
  
  /**
   * Получение доступных методов аутентификации
   */
  async getAvailableAuthMethods(): Promise<AuthType[]> {
    try {
      const methods: AuthType[] = [];
      
      if (this.authSettings.biometricEnabled && await this.biometricAuth.isAvailable()) {
        methods.push(AuthType.BIOMETRIC);
      }
      
      if (this.authSettings.pinEnabled) {
        methods.push(AuthType.PIN);
      }
      
      if (this.authSettings.telegramEnabled && TelegramUtils.isTelegramWebApp()) {
        methods.push(AuthType.TELEGRAM);
      }
      
      if (this.authSettings.combinedAuthEnabled) {
        methods.push(AuthType.COMBINED);
      }
      
      return methods;
    } catch (error) {
      logger.error("Failed to get available auth methods", error as Error);
      return [];
    }
  }
  
  /**
   * Получение настроек аутентификации
   */
  async getAuthSettings(): Promise<AuthSettings> {
    return { ...this.authSettings };
  }
  
  /**
   * Обновление настроек аутентификации
   */
  async updateAuthSettings(settings: Partial<AuthSettings>): Promise<void> {
    try {
      this.authSettings = { ...this.authSettings, ...settings };
      await this.saveAuthSettings();
      
      logger.info("Auth settings updated successfully");
    } catch (error) {
      logger.error("Failed to update auth settings", error as Error);
      throw new InvisibleWalletError("Failed to update auth settings", "UPDATE_AUTH_SETTINGS_ERROR", { error });
    }
  }
  
  /**
   * Проверка требует ли MFA
   */
  async requiresMFA(trustScore?: number): Promise<boolean> {
    try {
      if (!this.authSettings.requireMFA) {
        return false;
      }
      
      const score = trustScore || this.currentSession?.trustScore || 0;
      return score < this.authSettings.mfaThreshold;
    } catch (error) {
      logger.error("Failed to check MFA requirement", error as Error);
      return true; // В случае ошибки требуем MFA
    }
  }
  
  /**
   * Получение текущей сессии
   */
  getCurrentSession(): AuthResult | null {
    return this.currentSession;
  }
  
  /**
   * Создание адаптера хранилища
   */
  private createStorageAdapter(): StorageAdapter {
    return new IndexedDBStorageAdapter();
  }
  
  /**
   * Получение настроек аутентификации по умолчанию
   */
  private getDefaultAuthSettings(): AuthSettings {
    return {
      biometricEnabled: false,
      pinEnabled: false,
      telegramEnabled: true, // Включено по умолчанию для Telegram
      combinedAuthEnabled: false,
      maxAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 минут
      sessionDuration: 24 * 60 * 60 * 1000, // 24 часа
      requireMFA: true,
      mfaThreshold: 0.7
    };
  }
  
  /**
   * Загрузка настроек аутентификации
   */
  private async loadAuthSettings(): Promise<void> {
    try {
      const settings = await this.storage.get('invisible_wallet_auth_settings');
      if (settings) {
        this.authSettings = { ...this.authSettings, ...settings };
      }
    } catch (error) {
      logger.error("Failed to load auth settings", error as Error);
    }
  }
  
  /**
   * Сохранение настроек аутентификации
   */
  private async saveAuthSettings(): Promise<void> {
    try {
      await this.storage.set('invisible_wallet_auth_settings', this.authSettings);
    } catch (error) {
      logger.error("Failed to save auth settings", error as Error);
      throw new InvisibleWalletError("Failed to save auth settings", "SAVE_AUTH_SETTINGS_ERROR", { error });
    }
  }
  
  /**
   * Инициализация компонентов аутентификации
   */
  private async initializeAuthComponents(): Promise<void> {
    try {
      // Инициализация не требуется для текущей реализации
      // Компоненты инициализируются при первом использовании
    } catch (error) {
      logger.error("Failed to initialize auth components", error as Error);
    }
  }
  
  /**
   * Выполнение комбинированной аутентификации
   */
  private async performCombinedAuth(credentials?: any): Promise<boolean> {
    try {
      // Требуем как биометрию, так и PIN
      const biometricSuccess = await this.biometricAuth.authenticate(credentials?.biometricPrompt);
      if (!biometricSuccess) {
        return false;
      }
      
      if (!credentials?.pin) {
        throw new InvisibleWalletError("PIN is required for combined authentication", "PIN_REQUIRED");
      }
      
      const pinSuccess = await this.pinAuth.authenticate(credentials.pin);
      return pinSuccess;
    } catch (error) {
      logger.error("Combined authentication failed", error as Error);
      return false;
    }
  }
  
  /**
   * Получение ID пользователя
   */
  private async getUserId(): Promise<string> {
    const telegramUser = TelegramUtils.getTelegramUser();
    if (telegramUser) {
      return telegramUser.id.toString();
    }
    
    // Fallback к device ID
    return await DeviceUtils.getDeviceId();
  }
  
  /**
   * Проверка заблокирована ли аутентификация
   */
  private async isAuthLocked(userId: string): Promise<boolean> {
    try {
      const metadata = await this.getAuthMetadata(userId);
      if (!metadata || !metadata.isLocked) {
        return false;
      }
      
      // Проверка истечения блокировки
      if (metadata.lockUntil && Date.now() > metadata.lockUntil) {
        metadata.isLocked = false;
        metadata.lockUntil = undefined;
        await this.saveAuthMetadata(metadata);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error("Failed to check auth lock status", error as Error);
      return false;
    }
  }
  
  /**
   * Обработка неудачной аутентификации
   */
  private async handleAuthFailure(userId: string): Promise<void> {
    try {
      const metadata = await this.getAuthMetadata(userId);
      if (!metadata) {
        return;
      }
      
      metadata.failureCount += 1;
      metadata.lastFailure = Date.now();
      
      // Проверка необходимости блокировки
      if (metadata.failureCount >= this.authSettings.maxAttempts) {
        metadata.isLocked = true;
        metadata.lockUntil = Date.now() + this.authSettings.lockoutDuration;
      }
      
      await this.saveAuthMetadata(metadata);
    } catch (error) {
      logger.error("Failed to handle auth failure", error as Error);
    }
  }
  
  /**
   * Обновление метаданных аутентификации
   */
  private async updateAuthMetadata(userId: string, authType: AuthType, success: boolean): Promise<void> {
    try {
      const metadata = await this.getAuthMetadata(userId);
      if (!metadata) {
        return;
      }
      
      if (success) {
        metadata.successCount += 1;
        metadata.failureCount = 0; // Сброс счетчика неудач
        metadata.isLocked = false;
        metadata.lockUntil = undefined;
      }
      
      metadata.lastUsed = Date.now();
      await this.saveAuthMetadata(metadata);
    } catch (error) {
      logger.error("Failed to update auth metadata", error as Error);
    }
  }
  
  /**
   * Создание метаданных аутентификации
   */
  private async createAuthMetadata(userId: string, authType: AuthType): Promise<void> {
    try {
      const metadata: AuthMetadata = {
        userId,
        authType,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        successCount: 0,
        failureCount: 0,
        isLocked: false,
        settings: this.authSettings
      };
      
      await this.saveAuthMetadata(metadata);
    } catch (error) {
      logger.error("Failed to create auth metadata", error as Error);
    }
  }
  
  /**
   * Получение метаданных аутентификации
   */
  private async getAuthMetadata(userId: string): Promise<AuthMetadata | null> {
    try {
      const storageKey = StorageUtils.generateStorageKey('auth_metadata', userId);
      return await this.storage.get(storageKey);
    } catch (error) {
      logger.error("Failed to get auth metadata", error as Error);
      return null;
    }
  }
  
  /**
   * Сохранение метаданных аутентификации
   */
  private async saveAuthMetadata(metadata: AuthMetadata): Promise<void> {
    try {
      const storageKey = StorageUtils.generateStorageKey('auth_metadata', metadata.userId);
      await this.storage.set(storageKey, metadata);
    } catch (error) {
      logger.error("Failed to save auth metadata", error as Error);
      throw new InvisibleWalletError("Failed to save auth metadata", "SAVE_AUTH_METADATA_ERROR", { error });
    }
  }
  
  /**
   * Сохранение сессии аутентификации
   */
  private async saveAuthSession(session: AuthResult): Promise<void> {
    try {
      await this.storage.set('invisible_wallet_auth_session', session);
    } catch (error) {
      logger.error("Failed to save auth session", error as Error);
      throw new InvisibleWalletError("Failed to save auth session", "SAVE_AUTH_SESSION_ERROR", { error });
    }
  }
}

/**
 * Реализация биометрической аутентификации
 */
class BiometricAuthImpl implements BiometricAuth {
  async isAvailable(): Promise<boolean> {
    try {
      // Проверка доступности WebAuthn
      if (!window.navigator || !window.navigator.credentials) {
        return false;
      }
      
      // Проверка поддержки биометрии
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (error) {
      logger.error("Failed to check biometric availability", error as Error);
      return false;
    }
  }
  
  async authenticate(prompt?: string): Promise<boolean> {
    try {
      if (!await this.isAvailable()) {
        throw new Error("Biometric authentication is not available");
      }
      
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: challenge.buffer,
          allowCredentials: [],
          userVerification: 'required',
          timeout: 60000
        }
      } as any);
      
      return credential !== null;
    } catch (error) {
      logger.error("Biometric authentication failed", error as Error);
      return false;
    }
  }
  
  async enroll(): Promise<boolean> {
    try {
      if (!await this.isAvailable()) {
        throw new Error("Biometric authentication is not available");
      }
      
      // В реальной реализации здесь будет регистрация биометрических данных
      // Для демонстрации возвращаем true
      return true;
    } catch (error) {
      logger.error("Biometric enrollment failed", error as Error);
      return false;
    }
  }
}

/**
 * Реализация PIN аутентификации
 */
class PinAuthImpl implements PinAuth {
  private storage: StorageAdapter;
  private crypto: CryptoUtils;
  
  constructor(storage: StorageAdapter, crypto: CryptoUtils) {
    this.storage = storage;
    this.crypto = crypto;
  }
  
  async setup(pin: string): Promise<boolean> {
    try {
      if (!this.validatePin(pin)) {
        throw new Error("Invalid PIN format");
      }
      
      const hashedPin = await this.hashPin(pin);
      await this.storage.set('invisible_wallet_pin', hashedPin);
      
      return true;
    } catch (error) {
      logger.error("PIN setup failed", error as Error);
      return false;
    }
  }
  
  async authenticate(pin: string): Promise<boolean> {
    try {
      const storedPin = await this.storage.get('invisible_wallet_pin');
      if (!storedPin) {
        return false;
      }
      
      const hashedPin = await this.hashPin(pin);
      return this.compareHashes(hashedPin, storedPin);
    } catch (error) {
      logger.error("PIN authentication failed", error as Error);
      return false;
    }
  }
  
  async changePin(oldPin: string, newPin: string): Promise<boolean> {
    try {
      const isValid = await this.authenticate(oldPin);
      if (!isValid) {
        throw new Error("Invalid old PIN");
      }
      
      if (!this.validatePin(newPin)) {
        throw new Error("Invalid new PIN format");
      }
      
      const hashedNewPin = await this.hashPin(newPin);
      await this.storage.set('invisible_wallet_pin', hashedNewPin);
      
      return true;
    } catch (error) {
      logger.error("PIN change failed", error as Error);
      return false;
    }
  }
  
  validatePin(pin: string): boolean {
    return pin && pin.length >= 4 && /^\d+$/.test(pin);
  }
  
  private async hashPin(pin: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    return await this.crypto.hash(data);
  }
  
  private compareHashes(hash1: Uint8Array, hash2: Uint8Array): boolean {
    if (hash1.length !== hash2.length) {
      return false;
    }
    
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) {
        return false;
      }
    }
    
    return true;
  }
}

/**
 * Реализация Telegram аутентификации
 */
class TelegramAuthImpl implements TelegramAuth {
  async authenticate(): Promise<boolean> {
    try {
      if (!TelegramUtils.isTelegramWebApp()) {
        throw new Error("Not in Telegram WebApp");
      }
      
      const telegramUser = TelegramUtils.getTelegramUser();
      return telegramUser !== null;
    } catch (error) {
      logger.error("Telegram authentication failed", error as Error);
      return false;
    }
  }
  
  async validateTelegramUser(): Promise<boolean> {
    try {
      const telegramUser = TelegramUtils.getTelegramUser();
      if (!telegramUser) {
        return false;
      }
      
      // В реальной реализации здесь будет валидация initData
      // Для демонстрации проверяем наличие обязательных полей
      return !!(telegramUser.id && telegramUser.first_name);
    } catch (error) {
      logger.error("Telegram user validation failed", error as Error);
      return false;
    }
  }
  
  async getTelegramUserId(): Promise<string | null> {
    try {
      const telegramUser = TelegramUtils.getTelegramUser();
      return telegramUser?.id?.toString() || null;
    } catch (error) {
      logger.error("Failed to get Telegram user ID", error as Error);
      return null;
    }
  }
}

/**
 * Адаптер IndexedDB для хранения данных аутентификации
 */
class IndexedDBStorageAdapter implements StorageAdapter {
  private dbName = 'InvisibleWalletAuthDB';
  private storeName = 'authStore';
  private db: IDBDatabase | null = null;
  
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }
  
  async get(key: string): Promise<any> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
  
  async set(key: string, value: any): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async remove(key: string): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async clear(): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async keys(): Promise<string[]> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}