import { 
  KeyManager, 
  KeyManagerConfig, 
  KeyPair, 
  EncryptedKey, 
  KeyMetadata, 
  PrivateKey,
  KeyManagerError,
  StorageAdapter,
  CryptoProvider
} from "@/types/wallet";
import { PublicKey } from "@solana/web3.js";
import { CryptoUtils, ValidationUtils, StorageUtils, DeviceUtils, TelegramUtils, ErrorUtils } from "./utils";
import { logger } from "@/lib/utils/logger";
import { OfflineTransactionManager } from "./offline-transaction-manager";
import { CacheManager } from "./cache-manager";
import { FallbackStateManager } from "./fallback-state-manager";

/**
 * Реализация менеджера ключей для Invisible Wallet
 */
export class KeyManagerImpl implements KeyManager {
  private config: KeyManagerConfig;
  private storage: StorageAdapter;
  private crypto: CryptoProvider;
  private currentKeyPair: KeyPair | null = null;
  private serverSecret: string;
  private recoverySystem: RecoverySystem | null = null;
  
  constructor(config: KeyManagerConfig, storage?: StorageAdapter) {
    this.config = config;
    this.storage = storage || this.createStorageAdapter();
    this.crypto = new CryptoUtils(config);
    this.serverSecret = process.env.TELEGRAM_KEY_DERIVATION_SECRET || 'default_secret_change_in_production';
  }
  
  /**
   * Инициализация менеджера ключей
   */
  async initialize(): Promise<void> {
    try {
      logger.info("Initializing KeyManager");
      
      // Инициализация хранилища
      if ('initialize' in this.storage && typeof this.storage.initialize === 'function') {
        await this.storage.initialize();
      }
      
      // Инициализация компонентов восстановления если доступны
      if (this.config.recoveryConfig) {
        try {
          const { RecoverySystemImpl } = await import('./recovery-system');
          this.recoverySystem = new RecoverySystemImpl(this.config.recoveryConfig);
          await this.recoverySystem.initialize();
        } catch (error) {
          logger.warn("Failed to initialize recovery system", error as Error);
        }
      }
      
      // Проверка необходимости ротации ключей
      if (await this.shouldRotateKey()) {
        logger.info("Key rotation required");
        await this.rotateKey();
      }
      
      // Попытка загрузить существующую ключевую пару
      await this.loadExistingKeyPair();
      
      logger.info("KeyManager initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize KeyManager", error as Error);
      throw new KeyManagerError("Failed to initialize KeyManager", { error });
    }
  }
  
  /**
   * Генерация новой ключевой пары
   */
  async generateKeyPair(): Promise<KeyPair> {
    try {
      logger.info("Generating new key pair");
      
      const { publicKey, privateKey } = await this.crypto.generateKeyPair();
      const masterPassword = await this.getMasterPassword();
      const encryptedPrivateKey = await this.crypto.encryptPrivateKey(privateKey, masterPassword);
      
      const keyPair: KeyPair = {
        publicKey,
        privateKey,
        encryptedPrivateKey,
        metadata: {
          created: Date.now(),
          lastUsed: Date.now(),
          version: 1,
          source: 'generated',
          deviceId: await DeviceUtils.getDeviceId()
        }
      };
      
      // Валидация ключевой пары
      if (!ValidationUtils.isValidKeyPair(keyPair)) {
        throw new KeyManagerError("Generated key pair is invalid");
      }
      
      // Сохранение ключевой пары
      await this.storeKeyPair(keyPair);
      this.currentKeyPair = keyPair;
      
      logger.info("New key pair generated successfully", { 
        publicKey: publicKey.toBase58() 
      });
      
      return keyPair;
    } catch (error) {
      logger.error("Failed to generate key pair", error as Error);
      throw new KeyManagerError("Failed to generate key pair", { error });
    }
  }
  
  /**
   * Генерация ключевой пары на основе Telegram ID
   */
  async deriveFromTelegram(telegramId: number): Promise<KeyPair> {
    try {
      logger.info("Deriving key pair from Telegram ID", { telegramId });
      
      // Валидация Telegram ID
      if (!ValidationUtils.isValidTelegramId(telegramId)) {
        throw new KeyManagerError("Invalid Telegram ID", { telegramId });
      }
      
      // Генерация seed из Telegram ID
      const seed = await this.crypto.deriveSeedFromTelegramId(telegramId, this.serverSecret);
      
      // Генерация ключевой пары из seed
      const { publicKey, privateKey } = await this.crypto.deriveKeyPair(seed);
      
      // Шифрование приватного ключа
      const masterPassword = await this.getMasterPassword();
      const encryptedPrivateKey = await this.crypto.encryptPrivateKey(privateKey, masterPassword);
      
      const keyPair: KeyPair = {
        publicKey,
        privateKey,
        encryptedPrivateKey,
        metadata: {
          created: Date.now(),
          lastUsed: Date.now(),
          version: 1,
          source: 'telegram',
          deviceId: await DeviceUtils.getDeviceId()
        }
      };
      
      // Валидация ключевой пары
      if (!ValidationUtils.isValidKeyPair(keyPair)) {
        throw new KeyManagerError("Derived key pair is invalid");
      }
      
      // Сохранение ключевой пары
      await this.storeKeyPair(keyPair);
      this.currentKeyPair = keyPair;
      
      logger.info("Key pair derived from Telegram ID successfully", { 
        publicKey: publicKey.toBase58(),
        telegramId 
      });
      
      return keyPair;
    } catch (error) {
      logger.error("Failed to derive key pair from Telegram ID", error as Error);
      throw new KeyManagerError("Failed to derive key pair from Telegram ID", { error, telegramId });
    }
  }
  
  /**
   * Сохранение ключевой пары
   */
  async storeKeyPair(keyPair: KeyPair): Promise<void> {
    try {
      logger.info("Storing key pair", { publicKey: keyPair.publicKey.toBase58() });
      
      // Валидация ключевой пары
      if (!ValidationUtils.isValidKeyPair(keyPair)) {
        throw new KeyManagerError("Invalid key pair");
      }
      
      const storageKey = StorageUtils.generateStorageKey('keypair', 'main');
      
      // Сериализация ключевой пары для хранения
      const serializedKeyPair = {
        publicKey: keyPair.publicKey.toBase58(),
        encryptedPrivateKey: {
          data: Array.from(keyPair.encryptedPrivateKey.data),
          iv: Array.from(keyPair.encryptedPrivateKey.iv),
          salt: Array.from(keyPair.encryptedPrivateKey.salt),
          algorithm: keyPair.encryptedPrivateKey.algorithm,
          keyDerivation: keyPair.encryptedPrivateKey.keyDerivation,
          iterations: keyPair.encryptedPrivateKey.iterations
        },
        metadata: keyPair.metadata
      };
      
      await this.storage.set(storageKey, serializedKeyPair);
      
      // Создание резервной копии если включено
      if (this.config.backupEnabled) {
        await this.createBackup(keyPair);
      }
      
      logger.info("Key pair stored successfully");
    } catch (error) {
      logger.error("Failed to store key pair", error as Error);
      throw new KeyManagerError("Failed to store key pair", { error });
    }
  }
  
  /**
   * Получение ключевой пары
   */
  async retrieveKeyPair(): Promise<KeyPair | null> {
    try {
      if (this.currentKeyPair) {
        return this.currentKeyPair;
      }
      
      logger.info("Retrieving key pair from storage");
      
      const storageKey = StorageUtils.generateStorageKey('keypair', 'main');
      const serializedKeyPair = await this.storage.get(storageKey);
      
      if (!serializedKeyPair) {
        logger.info("No key pair found in storage");
        return null;
      }
      
      // Десериализация ключевой пары
      const publicKey = new PublicKey(serializedKeyPair.publicKey);
      
      const encryptedPrivateKey: EncryptedKey = {
        data: new Uint8Array(serializedKeyPair.encryptedPrivateKey.data),
        iv: new Uint8Array(serializedKeyPair.encryptedPrivateKey.iv),
        salt: new Uint8Array(serializedKeyPair.encryptedPrivateKey.salt),
        algorithm: serializedKeyPair.encryptedPrivateKey.algorithm,
        keyDerivation: serializedKeyPair.encryptedPrivateKey.keyDerivation,
        iterations: serializedKeyPair.encryptedPrivateKey.iterations
      };
      
      // Расшифровка приватного ключа
      const masterPassword = await this.getMasterPassword();
      const privateKey = await this.crypto.decryptPrivateKey(encryptedPrivateKey, masterPassword);
      
      const keyPair: KeyPair = {
        publicKey,
        privateKey,
        encryptedPrivateKey,
        metadata: serializedKeyPair.metadata
      };
      
      // Валидация ключевой пары
      if (!ValidationUtils.isValidKeyPair(keyPair)) {
        throw new KeyManagerError("Retrieved key pair is invalid");
      }
      
      this.currentKeyPair = keyPair;
      
      logger.info("Key pair retrieved successfully", { 
        publicKey: publicKey.toBase58() 
      });
      
      return keyPair;
    } catch (error) {
      logger.error("Failed to retrieve key pair", error as Error);
      throw new KeyManagerError("Failed to retrieve key pair", { error });
    }
  }
  
  /**
   * Удаление ключевой пары
   */
  async deleteKeyPair(): Promise<void> {
    try {
      logger.info("Deleting key pair");
      
      const storageKey = StorageUtils.generateStorageKey('keypair', 'main');
      await this.storage.remove(storageKey);
      
      // Удаление резервных копий
      if (this.config.backupEnabled) {
        await this.deleteBackups();
      }
      
      this.currentKeyPair = null;
      
      logger.info("Key pair deleted successfully");
    } catch (error) {
      logger.error("Failed to delete key pair", error as Error);
      throw new KeyManagerError("Failed to delete key pair", { error });
    }
  }
  
  /**
   * Шифрование приватного ключа
   */
  async encryptKey(privateKey: PrivateKey, password: string): Promise<EncryptedKey> {
    try {
      return await this.crypto.encryptPrivateKey(privateKey, password);
    } catch (error) {
      logger.error("Failed to encrypt private key", error as Error);
      throw new KeyManagerError("Failed to encrypt private key", { error });
    }
  }
  
  /**
   * Расшифровка приватного ключа
   */
  async decryptKey(encryptedKey: EncryptedKey, password: string): Promise<PrivateKey> {
    try {
      return await this.crypto.decryptPrivateKey(encryptedKey, password);
    } catch (error) {
      logger.error("Failed to decrypt private key", error as Error);
      throw new KeyManagerError("Failed to decrypt private key", { error });
    }
  }
  
  /**
   * Создание резервной копии
   */
  async createBackup(): Promise<any> {
    try {
      logger.info("Creating key pair backup");
      
      const keyPair = await this.retrieveKeyPair();
      if (!keyPair) {
        throw new KeyManagerError("No key pair to backup");
      }
      
      const backup = {
        publicKey: keyPair.publicKey.toBase58(),
        encryptedPrivateKey: keyPair.encryptedPrivateKey,
        metadata: keyPair.metadata,
        timestamp: Date.now(),
        version: 1
      };
      
      const backupKey = StorageUtils.generateStorageKey('backup', Date.now().toString());
      await this.storage.set(backupKey, backup);
      
      logger.info("Key pair backup created successfully");
      return backup;
    } catch (error) {
      logger.error("Failed to create backup", error as Error);
      throw new KeyManagerError("Failed to create backup", { error });
    }
  }
  
  /**
   * Восстановление из резервной копии
   */
  async restoreFromBackup(backup: any): Promise<void> {
    try {
      logger.info("Restoring key pair from backup");
      
      // Валидация резервной копии
      if (!backup.publicKey || !backup.encryptedPrivateKey || !backup.metadata) {
        throw new KeyManagerError("Invalid backup format");
      }
      
      const publicKey = new PublicKey(backup.publicKey);
      const encryptedPrivateKey: EncryptedKey = {
        data: new Uint8Array(backup.encryptedPrivateKey.data),
        iv: new Uint8Array(backup.encryptedPrivateKey.iv),
        salt: new Uint8Array(backup.encryptedPrivateKey.salt),
        algorithm: backup.encryptedPrivateKey.algorithm,
        keyDerivation: backup.encryptedPrivateKey.keyDerivation,
        iterations: backup.encryptedPrivateKey.iterations
      };
      
      // Расшифровка приватного ключа
      const masterPassword = await this.getMasterPassword();
      const privateKey = await this.crypto.decryptPrivateKey(encryptedPrivateKey, masterPassword);
      
      const keyPair: KeyPair = {
        publicKey,
        privateKey,
        encryptedPrivateKey,
        metadata: {
          ...backup.metadata,
          source: 'recovered',
          lastUsed: Date.now()
        }
      };
      
      // Валидация ключевой пары
      if (!ValidationUtils.isValidKeyPair(keyPair)) {
        throw new KeyManagerError("Restored key pair is invalid");
      }
      
      // Сохранение восстановленной ключевой пары
      await this.storeKeyPair(keyPair);
      this.currentKeyPair = keyPair;
      
      logger.info("Key pair restored from backup successfully", { 
        publicKey: publicKey.toBase58() 
      });
    } catch (error) {
      logger.error("Failed to restore from backup", error as Error);
      throw new KeyManagerError("Failed to restore from backup", { error });
    }
  }
  
  /**
   * Ротация ключа
   */
  async rotateKey(): Promise<KeyPair> {
    try {
      logger.info("Rotating key pair");
      
      // Генерация новой ключевой пары
      const newKeyPair = await this.generateKeyPair();
      
      // Обновление метаданных
      newKeyPair.metadata.version += 1;
      newKeyPair.metadata.source = 'generated';
      
      // Сохранение новой ключевой пары
      await this.storeKeyPair(newKeyPair);
      this.currentKeyPair = newKeyPair;
      
      logger.info("Key pair rotated successfully", { 
        publicKey: newKeyPair.publicKey.toBase58() 
      });
      
      return newKeyPair;
    } catch (error) {
      logger.error("Failed to rotate key", error as Error);
      throw new KeyManagerError("Failed to rotate key", { error });
    }
  }
  
  /**
   * Проверка необходимости ротации ключа
   */
  async shouldRotateKey(): Promise<boolean> {
    try {
      const keyPair = await this.retrieveKeyPair();
      if (!keyPair) {
        return false;
      }
      
      const now = Date.now();
      const rotationInterval = this.config.rotationInterval * 24 * 60 * 60 * 1000; // Конвертация дней в миллисекунды
      const lastRotation = keyPair.metadata.created;
      
      return (now - lastRotation) > rotationInterval;
    } catch (error) {
      logger.error("Failed to check key rotation", error as Error);
      return false;
    }
  }
  
  /**
   * Получение мастер-пароля
   */
  private async getMasterPassword(): Promise<string> {
    try {
      // Если в Telegram WebApp, используем initData для генерации пароля
      if (TelegramUtils.isTelegramWebApp()) {
        const telegramUser = TelegramUtils.getTelegramUser();
        if (telegramUser) {
          const deviceId = await DeviceUtils.getDeviceId();
          return `${telegramUser.id}_${deviceId}_${this.serverSecret}`;
        }
      }
      
      // Иначе используем deviceId и serverSecret
      const deviceId = await DeviceUtils.getDeviceId();
      return `${deviceId}_${this.serverSecret}`;
    } catch (error) {
      logger.error("Failed to get master password", error as Error);
      throw new KeyManagerError("Failed to get master password", { error });
    }
  }
  
  /**
   * Создание адаптера хранилища
   */
  private createStorageAdapter(): StorageAdapter {
    const storageType = this.config.storageType;
    
    switch (storageType) {
      case 'indexeddb':
        return new IndexedDBStorageAdapter();
      case 'localStorage':
        return new LocalStorageAdapter();
      case 'secure-enclave':
        return new SecureEnclaveStorageAdapter();
      default:
        return new MemoryStorageAdapter();
    }
  }
  
  /**
   * Загрузка существующей ключевой пары
   */
  private async loadExistingKeyPair(): Promise<void> {
    try {
      const keyPair = await this.retrieveKeyPair();
      if (keyPair) {
        this.currentKeyPair = keyPair;
        logger.info("Existing key pair loaded", { 
          publicKey: keyPair.publicKey.toBase58() 
        });
      }
    } catch (error) {
      logger.error("Failed to load existing key pair", error as Error);
      // Не выбрасываем ошибку, так как это нормальная ситуация для первого запуска
    }
  }
  
  /**
   * Удаление резервных копий
   */
  private async deleteBackups(): Promise<void> {
    try {
      const keys = await this.storage.keys();
      const backupKeys = keys.filter(key => key.startsWith('invisible_wallet_backup_'));
      
      for (const key of backupKeys) {
        await this.storage.remove(key);
      }
      
      // Extend KeyManagerImpl with recovery functionality
      export interface KeyManagerImpl {
        setupRecovery(contacts: TelegramContact[]): Promise<void>;
        initiateRecovery(): Promise<RecoverySession>;
        recoverKey(sessionId: string): Promise<EncryptedKey>;
        isRecoverySetup(): Promise<boolean>;
      }
      
      /**
       * Настройка восстановления
       */
      (KeyManagerImpl.prototype as any).setupRecovery = async function(this: KeyManagerImpl, contacts: TelegramContact[]): Promise<void> {
        try {
          logger.info("Setting up recovery", { contactCount: contacts.length });
          
          if (!this.recoverySystem) {
            throw new KeyManagerError("Recovery system not initialized");
          }
          
          if (!this.currentKeyPair || !this.currentKeyPair.encryptedPrivateKey) {
            throw new KeyManagerError("No encrypted private key available for recovery setup");
          }
          
          // Вызываем систему восстановления для настройки
          await this.recoverySystem.setupRecovery(this.currentKeyPair.encryptedPrivateKey, contacts);
          
          logger.info("Recovery setup completed successfully");
        } catch (error) {
          logger.error("Failed to setup recovery", error as Error);
          throw new KeyManagerError("Failed to setup recovery", { error });
        }
      };
      
      /**
       * Инициация восстановления
       */
      (KeyManagerImpl.prototype as any).initiateRecovery = async function(this: KeyManagerImpl): Promise<RecoverySession> {
        try {
          logger.info("Initiating recovery");
          
          if (!this.recoverySystem) {
            throw new KeyManagerError("Recovery system not initialized");
          }
          
          // Получаем текущий user ID (в реальности может быть из сессии или другого источника)
          const userId = await this.getCurrentUserId();
          
          // Инициируем сессию восстановления
          const session = await this.recoverySystem.initiateRecovery(userId);
          
          logger.info("Recovery initiated successfully", { sessionId: session.id });
          return session;
       } catch (error) {
          logger.error("Failed to initiate recovery", error as Error);
          throw new KeyManagerError("Failed to initiate recovery", { error });
        }
      };
      
      /**
       * Восстановление ключа
       */
      (KeyManagerImpl.prototype as any).recoverKey = async function(this: KeyManagerImpl, sessionId: string): Promise<EncryptedKey> {
        try {
          logger.info("Recovering key", { sessionId });
          
          if (!this.recoverySystem) {
            throw new KeyManagerError("Recovery system not initialized");
          }
          
          // Восстанавливаем ключ через систему восстановления
          const encryptedKey = await this.recoverySystem.recoverKey(sessionId);
          
          logger.info("Key recovered successfully", { sessionId });
          return encryptedKey;
        } catch (error) {
          logger.error("Failed to recover key", error as Error);
          throw new KeyManagerError("Failed to recover key", { error, sessionId });
        }
      };
      
      /**
       * Проверка настроено ли восстановление
       */
      (KeyManagerImpl.prototype as any).isRecoverySetup = async function(this: KeyManagerImpl): Promise<boolean> {
        try {
          logger.info("Checking if recovery is setup");
          
          if (!this.recoverySystem) {
            return false;
          }
          
          const isSetup = await this.recoverySystem.isRecoverySetup();
          
          logger.info("Recovery setup check completed", { isSetup });
          return isSetup;
       } catch (error) {
          logger.error("Failed to check recovery setup", error as Error);
          throw new KeyManagerError("Failed to check recovery setup", { error });
        }
      };
      
      /**
       * Получение текущего user ID
       */
      (KeyManagerImpl.prototype as any).getCurrentUserId = async function(this: KeyManagerImpl): Promise<string> {
        try {
          // В реальности может быть получение из сессии, Telegram или другого источника
          // Для демонстрации используем device ID
          const deviceId = await DeviceUtils.getDeviceId();
          return deviceId;
        } catch (error) {
          logger.error("Failed to get current user ID", error as Error);
          throw new KeyManagerError("Failed to get current user ID", { error });
        }
      };
      
      logger.info("All backups deleted successfully");
    } catch (error) {
      logger.error("Failed to delete backups", error as Error);
      // Не выбрасываем ошибку, так как это не критичная операция
    }
  }
}

/**
 * Адаптер для IndexedDB хранилища
 */
class IndexedDBStorageAdapter implements StorageAdapter {
  private dbName = 'InvisibleWalletDB';
  private storeName = 'keyStore';
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

/**
 * Адаптер для localStorage хранилища
 */
class LocalStorageAdapter implements StorageAdapter {
  async initialize(): Promise<void> {
    // localStorage не требует инициализации
  }
  
  async get(key: string): Promise<any> {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }
  
  async set(key: string, value: any): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      throw new Error(`Failed to set item in localStorage: ${error}`);
    }
  }
  
  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
  
  async clear(): Promise<void> {
    localStorage.clear();
  }
  
  async keys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    return keys;
  }
}

/**
 * Адаптер для Secure Enclave хранилища (заглушка)
 */
class SecureEnclaveStorageAdapter implements StorageAdapter {
  async initialize(): Promise<void> {
    // В реальной реализации здесь будет инициализация Secure Enclave
  }
  
  async get(key: string): Promise<any> {
    // В реальной реализации здесь будет получение из Secure Enclave
    return null;
  }
  
  async set(key: string, value: any): Promise<void> {
    // В реальной реализации здесь будет сохранение в Secure Enclave
  }
  
  async remove(key: string): Promise<void> {
    // В реальной реализации здесь будет удаление из Secure Enclave
  }
  
  async clear(): Promise<void> {
    // В реальной реализации здесь будет очистка Secure Enclave
  }
  
  async keys(): Promise<string[]> {
    // В реальной реализации здесь будет получение ключей из Secure Enclave
    return [];
  }
}

/**
 * Адаптер для memory хранилища
 */
class MemoryStorageAdapter implements StorageAdapter {
  private storage: Map<string, any> = new Map();
  
  async initialize(): Promise<void> {
    // Memory storage не требует инициализации
  }
  
  async get(key: string): Promise<any> {
    return this.storage.get(key) || null;
  }
  
  async set(key: string, value: any): Promise<void> {
    this.storage.set(key, value);
  }
  
  async remove(key: string): Promise<void> {
    this.storage.delete(key);
  }
  
  async clear(): Promise<void> {
    this.storage.clear();
  }
  
  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }
}

// Extend KeyManagerImpl with caching functionality
export interface KeyManagerImpl {
  cachePublicKey(publicKey: PublicKey, ttl?: number): Promise<void>;
  getCachedPublicKey(keyId: string): Promise<PublicKey | null>;
  cacheKeyMetadata(publicKey: PublicKey, metadata: KeyMetadata, ttl?: number): Promise<void>;
  getCachedKeyMetadata(keyId: string): Promise<KeyMetadata | null>;
}

/**
 * Кэширование публичного ключа
 */
(KeyManagerImpl.prototype as any).cachePublicKey = async function(this: KeyManagerImpl, publicKey: PublicKey, ttl: number = 3600): Promise<void> {
  const cacheManager = CacheManager.getInstance();
  const keyId = publicKey.toBase58();
  await cacheManager.set(`public_key_${keyId}`, keyId, ttl);
};

/**
 * Получение закэшированного публичного ключа
 */
(KeyManagerImpl.prototype as any).getCachedPublicKey = async function(this: KeyManagerImpl, keyId: string): Promise<PublicKey | null> {
  const cacheManager = CacheManager.getInstance();
  const cachedKey = await cacheManager.get<string>(`public_key_${keyId}`);
  if (cachedKey) {
    try {
      return new PublicKey(cachedKey);
    } catch (error) {
      logger.warn("Invalid cached public key", error);
      return null;
    }
  }
  return null;
};

/**
 * Кэширование метаданных ключа
 */
(KeyManagerImpl.prototype as any).cacheKeyMetadata = async function(this: KeyManagerImpl, publicKey: PublicKey, metadata: KeyMetadata, ttl: number = 3600): Promise<void> {
  const cacheManager = CacheManager.getInstance();
  const keyId = publicKey.toBase58();
  await cacheManager.set(`key_metadata_${keyId}`, metadata, ttl);
};

/**
 * Получение закэшированных метаданных ключа
 */
(KeyManagerImpl.prototype as any).getCachedKeyMetadata = async function(this: KeyManagerImpl, keyId: string): Promise<KeyMetadata | null> {
  const cacheManager = CacheManager.getInstance();
  return await cacheManager.get<KeyMetadata>(`key_metadata_${keyId}`);
};