import {
  RecoverySystem,
  RecoveryConfig,
  RecoveryShare,
  RecoverySession,
  TelegramContact,
  RecoveryError,
  StorageAdapter,
  EncryptedKey,
  PrivateKey,
  InvisibleWalletError
} from "@/types/wallet";
import { CryptoUtils, StorageUtils, TelegramUtils, ErrorUtils } from "./utils";
import { logger } from "@/lib/utils/logger";

/**
 * Интерфейс для Shamir's Secret Sharing
 */
interface ShamirSecretSharing {
  split(secret: Uint8Array, threshold: number, totalShares: number): Promise<Uint8Array[]>;
  combine(shares: Uint8Array[]): Promise<Uint8Array>;
}

/**
 * Реализация Shamir's Secret Sharing
 */
class ShamirSecretSharingImpl implements ShamirSecretSharing {
  /**
   * Разделение секрета на shares
   */
  async split(secret: Uint8Array, threshold: number, totalShares: number): Promise<Uint8Array[]> {
    try {
      if (threshold > totalShares) {
        throw new Error("Threshold cannot be greater than total shares");
      }
      
      if (threshold < 2) {
        throw new Error("Threshold must be at least 2");
      }
      
      // В реальной реализации здесь будет полноценный алгоритм Shamir's Secret Sharing
      // Для демонстрации используем упрощенную версию
      
      const shares: Uint8Array[] = [];
      
      // Создаем shares с использованием простого XOR-based подхода
      // В реальной реализации нужно использовать полноценный Shamir's Secret Sharing
      
      for (let i = 0; i < totalShares; i++) {
        const share = new Uint8Array(secret.length + 4); // 4 байта для индекса
        
        // Копируем секрет
        share.set(secret, 4);
        
        // Добавляем индекс share
        const view = new DataView(share.buffer, 0, 4);
        view.setUint32(0, i + 1, false); // 1-based indexing
        
        // В реальной реализации здесь будет математическая операция
        // Для демонстрации просто добавляем случайные данные
        for (let j = 4; j < share.length; j++) {
          share[j] ^= Math.floor(Math.random() * 256);
        }
        
        shares.push(share);
      }
      
      // Последний share содержит восстановимый секрет
      const lastShare = new Uint8Array(secret.length + 4);
      const view = new DataView(lastShare.buffer, 0, 4);
      view.setUint32(0, totalShares, false);
      lastShare.set(secret, 4);
      shares[totalShares - 1] = lastShare;
      
      return shares;
    } catch (error) {
      logger.error("Failed to split secret", error as Error);
      throw new RecoveryError("Failed to split secret", { error });
    }
  }
  
  /**
   * Восстановление секрета из shares
   */
  async combine(shares: Uint8Array[]): Promise<Uint8Array> {
    try {
      if (shares.length < 2) {
        throw new Error("At least 2 shares required for recovery");
      }
      
      // Извлекаем индексы и данные
      const indexedShares = shares.map(share => ({
        index: new DataView(share.buffer, 0, 4).getUint32(0, false),
        data: share.slice(4)
      }));
      
      // Сортируем по индексу
      indexedShares.sort((a, b) => a.index - b.index);
      
      // В реальной реализации здесь будет полноценная математическая реконструкция
      // Для демонстрации используем последний share как содержащий секрет
      const lastShare = indexedShares[indexedShares.length - 1];
      
      return lastShare.data;
    } catch (error) {
      logger.error("Failed to combine shares", error as Error);
      throw new RecoveryError("Failed to combine shares", { error });
    }
  }
}

/**
 * Реализация системы восстановления для Invisible Wallet
 */
export class RecoverySystemImpl implements RecoverySystem {
  private config: RecoveryConfig;
  private storage: StorageAdapter;
  private crypto: CryptoUtils;
  private shamir: ShamirSecretSharing;
  
  constructor(config: RecoveryConfig, storage?: StorageAdapter) {
    this.config = config;
    this.storage = storage || this.createStorageAdapter();
    this.crypto = new CryptoUtils({
      encryptionAlgorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2',
      storageType: 'indexeddb',
      backupEnabled: false,
      rotationInterval: 30
    });
    this.shamir = new ShamirSecretSharingImpl();
  }
  
  /**
   * Инициализация системы восстановления
   */
  async initialize(): Promise<void> {
    try {
      logger.info("Initializing RecoverySystem");
      
      // Инициализация хранилища
      if ('initialize' in this.storage && typeof this.storage.initialize === 'function') {
        await this.storage.initialize();
      }
      
      // Очистка истекших сессий восстановления
      await this.cleanupExpiredSessions();
      
      logger.info("RecoverySystem initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize RecoverySystem", error as Error);
      throw new RecoveryError("Failed to initialize RecoverySystem", { error });
    }
  }
  
  /**
   * Настройка восстановления
   */
  async setupRecovery(encryptedKey: EncryptedKey, contacts: TelegramContact[]): Promise<void> {
    try {
      logger.info("Setting up recovery", { contactCount: contacts.length });
      
      // Валидация контактов
      if (contacts.length < this.config.threshold) {
        throw new RecoveryError("Not enough contacts for recovery", {
          required: this.config.threshold,
          provided: contacts.length
        });
      }
      
      if (contacts.length > this.config.totalShares) {
        throw new RecoveryError("Too many contacts", {
          max: this.config.totalShares,
          provided: contacts.length
        });
      }
      
      // Сериализация зашифрованного ключа
      const keyData = this.serializeEncryptedKey(encryptedKey);
      
      // Разделение секрета на shares
      const shares = await this.shamir.split(keyData, this.config.threshold, this.config.totalShares);
      
      // Создание recovery shares
      const recoveryShares: RecoveryShare[] = [];
      
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const share = shares[i];
        
        let encryptedShare: Uint8Array;
        
        if (this.config.shareEncryption) {
          // Шифрование share для контакта
          const contactKey = await this.deriveContactKey(contact);
          encryptedShare = await this.crypto.encrypt(share, contactKey);
        } else {
          encryptedShare = share;
        }
        
        const recoveryShare: RecoveryShare = {
          id: await this.generateShareId(),
          shareData: encryptedShare,
          contactId: contact.id,
          encrypted: this.config.shareEncryption,
          createdAt: Date.now(),
          expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 дней
        };
        
        recoveryShares.push(recoveryShare);
      }
      
      // Сохранение recovery shares
      for (const share of recoveryShares) {
        await this.storeRecoveryShare(share);
      }
      
      // Сохранение метаданных восстановления
      await this.storeRecoveryMetadata({
        encryptedKey,
        contacts: contacts.map(c => ({ id: c.id, firstName: c.firstName, trustLevel: c.trustLevel })),
        threshold: this.config.threshold,
        totalShares: this.config.totalShares,
        createdAt: Date.now()
      });
      
      logger.info("Recovery setup completed successfully", { 
        sharesCreated: recoveryShares.length 
      });
    } catch (error) {
      logger.error("Failed to setup recovery", error as Error);
      throw new RecoveryError("Failed to setup recovery", { error });
    }
  }
  
  /**
   * Инициация восстановления
   */
  async initiateRecovery(userId: string): Promise<RecoverySession> {
    try {
      logger.info("Initiating recovery", { userId });
      
      // Проверка существующей активной сессии
      const existingSession = await this.getActiveRecoverySession(userId);
      if (existingSession) {
        throw new RecoveryError("Recovery session already exists", {
          sessionId: existingSession.id
        });
      }
      
      // Создание новой сессии восстановления
      const session: RecoverySession = {
        id: await this.generateSessionId(),
        userId,
        initiatedAt: Date.now(),
        expiresAt: Date.now() + this.config.gracePeriod,
        requiredShares: this.config.threshold,
        collectedShares: [],
        status: 'pending'
      };
      
      // Сохранение сессии
      await this.storeRecoverySession(session);
      
      logger.info("Recovery session initiated successfully", { 
        sessionId: session.id,
        expiresAt: session.expiresAt 
      });
      
      return session;
    } catch (error) {
      logger.error("Failed to initiate recovery", error as Error);
      throw new RecoveryError("Failed to initiate recovery", { error });
    }
  }
  
  /**
   * Добавление share к сессии восстановления
   */
  async addShareToSession(sessionId: string, shareData: Uint8Array, contactId: string): Promise<RecoverySession> {
    try {
      logger.info("Adding share to recovery session", { sessionId, contactId });
      
      const session = await this.getRecoverySession(sessionId);
      if (!session) {
        throw new RecoveryError("Recovery session not found", { sessionId });
      }
      
      if (session.status !== 'pending' && session.status !== 'collecting') {
        throw new RecoveryError("Recovery session is not active", { 
          sessionId, 
          status: session.status 
        });
      }
      
      if (Date.now() > session.expiresAt) {
        throw new RecoveryError("Recovery session expired", { sessionId });
      }
      
      // Проверка дубликатов
      const existingShare = session.collectedShares.find(s => s.contactId === contactId);
      if (existingShare) {
        throw new RecoveryError("Share already collected from this contact", { 
          sessionId, 
          contactId 
        });
      }
      
      // Валидация share
      const recoveryShare: RecoveryShare = {
        id: await this.generateShareId(),
        shareData,
        contactId,
        encrypted: false, // Share должен быть расшифрован перед добавлением
        createdAt: Date.now()
      };
      
      // Добавление share к сессии
      session.collectedShares.push(recoveryShare);
      session.status = 'collecting';
      
      // Проверка достаточного количества shares
      if (session.collectedShares.length >= session.requiredShares) {
        session.status = 'completed';
      }
      
      // Сохранение обновленной сессии
      await this.storeRecoverySession(session);
      
      logger.info("Share added to recovery session successfully", { 
        sessionId, 
        contactId,
        totalShares: session.collectedShares.length,
        requiredShares: session.requiredShares 
      });
      
      return session;
    } catch (error) {
      logger.error("Failed to add share to recovery session", error as Error);
      throw new RecoveryError("Failed to add share to recovery session", { error });
    }
  }
  
  /**
   * Восстановление ключа
   */
  async recoverKey(sessionId: string): Promise<EncryptedKey> {
    try {
      logger.info("Recovering key from session", { sessionId });
      
      const session = await this.getRecoverySession(sessionId);
      if (!session) {
        throw new RecoveryError("Recovery session not found", { sessionId });
      }
      
      if (session.status !== 'completed') {
        throw new RecoveryError("Recovery session not completed", { 
          sessionId, 
          status: session.status 
        });
      }
      
      if (Date.now() > session.expiresAt) {
        throw new RecoveryError("Recovery session expired", { sessionId });
      }
      
      // Извлечение shares
      const shares = session.collectedShares.map(s => s.shareData);
      
      // Восстановление секрета
      const recoveredKeyData = await this.shamir.combine(shares);
      
      // Десериализация зашифрованного ключа
      const encryptedKey = this.deserializeEncryptedKey(recoveredKeyData);
      
      // Валидация восстановленного ключа
      if (!this.isValidEncryptedKey(encryptedKey)) {
        throw new RecoveryError("Recovered key is invalid");
      }
      
      logger.info("Key recovered successfully", { sessionId });
      
      return encryptedKey;
    } catch (error) {
      logger.error("Failed to recover key", error as Error);
      throw new RecoveryError("Failed to recover key", { error });
    }
  }
  
  /**
   * Получение share для контакта
   */
  async getShareForContact(contactId: string): Promise<RecoveryShare | null> {
    try {
      const shares = await this.getAllRecoveryShares();
      return shares.find(share => share.contactId === contactId) || null;
    } catch (error) {
      logger.error("Failed to get share for contact", error as Error);
      return null;
    }
  }
  
  /**
   * Получение активной сессии восстановления
   */
  async getActiveRecoverySession(userId: string): Promise<RecoverySession | null> {
    try {
      const sessions = await this.getAllRecoverySessions();
      return sessions.find(session => 
        session.userId === userId && 
        (session.status === 'pending' || session.status === 'collecting') &&
        Date.now() <= session.expiresAt
      ) || null;
    } catch (error) {
      logger.error("Failed to get active recovery session", error as Error);
      return null;
    }
  }
  
  /**
   * Отмена сессии восстановления
   */
  async cancelRecoverySession(sessionId: string): Promise<void> {
    try {
      logger.info("Cancelling recovery session", { sessionId });
      
      const session = await this.getRecoverySession(sessionId);
      if (!session) {
        throw new RecoveryError("Recovery session not found", { sessionId });
      }
      
      session.status = 'failed';
      await this.storeRecoverySession(session);
      
      logger.info("Recovery session cancelled successfully", { sessionId });
    } catch (error) {
      logger.error("Failed to cancel recovery session", error as Error);
      throw new RecoveryError("Failed to cancel recovery session", { error });
    }
  }
  
  /**
   * Проверка настроено ли восстановление
   */
  async isRecoverySetup(): Promise<boolean> {
    try {
      const metadata = await this.getRecoveryMetadata();
      return metadata !== null;
    } catch (error) {
      logger.error("Failed to check recovery setup", error as Error);
      return false;
    }
  }
  
  /**
   * Получение метаданных восстановления
   */
  async getRecoveryMetadata(): Promise<any> {
    try {
      return await this.storage.get('invisible_wallet_recovery_metadata');
    } catch (error) {
      logger.error("Failed to get recovery metadata", error as Error);
      return null;
    }
  }
  
  /**
   * Очистка истекших сессий
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      logger.info("Cleaning up expired recovery sessions");
      
      const sessions = await this.getAllRecoverySessions();
      const expiredSessions = sessions.filter(session => 
        Date.now() > session.expiresAt && session.status !== 'completed'
      );
      
      for (const session of expiredSessions) {
        session.status = 'expired';
        await this.storeRecoverySession(session);
      }
      
      logger.info("Cleaned up expired recovery sessions", { 
        count: expiredSessions.length 
      });
    } catch (error) {
      logger.error("Failed to cleanup expired sessions", error as Error);
      // Не выбрасываем ошибку, так как это не критичная операция
    }
  }
  
  /**
   * Создание адаптера хранилища
   */
  private createStorageAdapter(): StorageAdapter {
    return new IndexedDBStorageAdapter();
  }
  
  /**
   * Генерация ID share
   */
  private async generateShareId(): Promise<string> {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Генерация ID сессии
   */
  private async generateSessionId(): Promise<string> {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Сериализация зашифрованного ключа
   */
  private serializeEncryptedKey(encryptedKey: EncryptedKey): Uint8Array {
    const data = {
      data: Array.from(encryptedKey.data),
      iv: Array.from(encryptedKey.iv),
      salt: Array.from(encryptedKey.salt),
      algorithm: encryptedKey.algorithm,
      keyDerivation: encryptedKey.keyDerivation,
      iterations: encryptedKey.iterations
    };
    
    return new TextEncoder().encode(JSON.stringify(data));
  }
  
  /**
   * Десериализация зашифрованного ключа
   */
  private deserializeEncryptedKey(data: Uint8Array): EncryptedKey {
    const parsed = JSON.parse(new TextDecoder().decode(data));
    
    return {
      data: new Uint8Array(parsed.data),
      iv: new Uint8Array(parsed.iv),
      salt: new Uint8Array(parsed.salt),
      algorithm: parsed.algorithm,
      keyDerivation: parsed.keyDerivation,
      iterations: parsed.iterations
    };
  }
  
  /**
   * Вывод ключа для контакта
   */
  private async deriveContactKey(contact: TelegramContact): Promise<CryptoKey> {
    try {
      const contactData = `${contact.id}_${contact.firstName}_${contact.trustLevel}`;
      const password = await this.crypto.hash(new TextEncoder().encode(contactData));
      const salt = new TextEncoder().encode('invisible_wallet_contact_salt');
      
      return await this.crypto.deriveEncryptionKey(
        new TextDecoder().decode(password),
        salt
      );
    } catch (error) {
      logger.error("Failed to derive contact key", error as Error);
      throw new RecoveryError("Failed to derive contact key", { error });
    }
  }
  
  /**
   * Сохранение recovery share
   */
  private async storeRecoveryShare(share: RecoveryShare): Promise<void> {
    try {
      const storageKey = StorageUtils.generateStorageKey('recovery_share', share.id);
      const shareData = {
        ...share,
        shareData: Array.from(share.shareData)
      };
      
      await this.storage.set(storageKey, shareData);
    } catch (error) {
      logger.error("Failed to store recovery share", error as Error);
      throw new RecoveryError("Failed to store recovery share", { error });
    }
  }
  
  /**
   * Сохранение сессии восстановления
   */
  private async storeRecoverySession(session: RecoverySession): Promise<void> {
    try {
      const storageKey = StorageUtils.generateStorageKey('recovery_session', session.id);
      const sessionData = {
        ...session,
        collectedShares: session.collectedShares.map(share => ({
          ...share,
          shareData: Array.from(share.shareData)
        }))
      };
      
      await this.storage.set(storageKey, sessionData);
    } catch (error) {
      logger.error("Failed to store recovery session", error as Error);
      throw new RecoveryError("Failed to store recovery session", { error });
    }
  }
  
  /**
   * Сохранение метаданных восстановления
   */
  private async storeRecoveryMetadata(metadata: any): Promise<void> {
    try {
      await this.storage.set('invisible_wallet_recovery_metadata', metadata);
    } catch (error) {
      logger.error("Failed to store recovery metadata", error as Error);
      throw new RecoveryError("Failed to store recovery metadata", { error });
    }
  }
  
  /**
   * Получение сессии восстановления
   */
  private async getRecoverySession(sessionId: string): Promise<RecoverySession | null> {
    try {
      const storageKey = StorageUtils.generateStorageKey('recovery_session', sessionId);
      const sessionData = await this.storage.get(storageKey);
      
      if (!sessionData) {
        return null;
      }
      
      return {
        ...sessionData,
        collectedShares: sessionData.collectedShares.map((share: any) => ({
          ...share,
          shareData: new Uint8Array(share.shareData)
        }))
      };
    } catch (error) {
      logger.error("Failed to get recovery session", error as Error);
      return null;
    }
  }
  
  /**
   * Получение всех recovery shares
   */
  private async getAllRecoveryShares(): Promise<RecoveryShare[]> {
    try {
      const keys = await this.storage.keys();
      const shareKeys = keys.filter(key => key.startsWith('invisible_wallet_recovery_share_'));
      
      const shares: RecoveryShare[] = [];
      for (const key of shareKeys) {
        const shareData = await this.storage.get(key);
        if (shareData) {
          shares.push({
            ...shareData,
            shareData: new Uint8Array(shareData.shareData)
          });
        }
      }
      
      return shares;
    } catch (error) {
      logger.error("Failed to get all recovery shares", error as Error);
      return [];
    }
  }
  
  /**
   * Получение всех сессий восстановления
   */
  private async getAllRecoverySessions(): Promise<RecoverySession[]> {
    try {
      const keys = await this.storage.keys();
      const sessionKeys = keys.filter(key => key.startsWith('invisible_wallet_recovery_session_'));
      
      const sessions: RecoverySession[] = [];
      for (const key of sessionKeys) {
        const sessionData = await this.storage.get(key);
        if (sessionData) {
          sessions.push({
            ...sessionData,
            collectedShares: sessionData.collectedShares.map((share: any) => ({
              ...share,
              shareData: new Uint8Array(share.shareData)
            }))
          });
        }
      }
      
      return sessions;
    } catch (error) {
      logger.error("Failed to get all recovery sessions", error as Error);
      return [];
    }
  }
  
  /**
   * Валидация зашифрованного ключа
   */
  private isValidEncryptedKey(encryptedKey: EncryptedKey): boolean {
    return (
      encryptedKey.data.length > 0 &&
      encryptedKey.iv.length > 0 &&
      encryptedKey.salt.length > 0 &&
      encryptedKey.algorithm.length > 0 &&
      encryptedKey.keyDerivation.length > 0 &&
      encryptedKey.iterations > 0
    );
  }
}

/**
 * Адаптер IndexedDB для хранения данных восстановления
 */
class IndexedDBStorageAdapter implements StorageAdapter {
  private dbName = 'InvisibleWalletRecoveryDB';
  private storeName = 'recoveryStore';
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