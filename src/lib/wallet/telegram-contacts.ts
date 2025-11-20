import {
  TelegramContact,
  RecoveryShare,
  StorageAdapter,
  InvisibleWalletError
} from "@/types/wallet";
import { CryptoUtils, StorageUtils, TelegramUtils, ErrorUtils } from "./utils";
import { logger } from "@/lib/utils/logger";

/**
 * Интерфейс для Telegram WebApp API
 */
interface TelegramWebAppAPI {
  requestContact: () => Promise<TelegramContact>;
  shareContact: (contact: TelegramContact) => Promise<void>;
  openTelegramLink: (url: string) => void;
  openLink: (url: string) => void;
  ready: () => void;
  expand: () => void;
  close: () => void;
}

/**
 * Метаданные контакта для восстановления
 */
interface ContactMetadata {
  id: string;
  trustLevel: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  lastVerified: number;
  verificationAttempts: number;
  notes?: string;
}

/**
 * Запрос на верификацию контакта
 */
interface ContactVerificationRequest {
  id: string;
  contactId: string;
  shareData: Uint8Array;
  encrypted: boolean;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  message?: string;
}

/**
 * Реализация менеджера контактов Telegram для Invisible Wallet
 */
export class TelegramContactsManager {
  private storage: StorageAdapter;
  private crypto: CryptoUtils;
  private telegramAPI: TelegramWebAppAPI | null = null;
  
  constructor(storage?: StorageAdapter) {
    this.storage = storage || this.createStorageAdapter();
    this.crypto = new CryptoUtils({
      encryptionAlgorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2',
      storageType: 'indexeddb',
      backupEnabled: false,
      rotationInterval: 30
    });
    this.initializeTelegramAPI();
  }
  
  /**
   * Инициализация Telegram API
   */
  private initializeTelegramAPI(): void {
    if (TelegramUtils.isTelegramWebApp()) {
      this.telegramAPI = TelegramUtils.getTelegramWebApp();
    }
  }
  
  /**
   * Инициализация менеджера контактов
   */
  async initialize(): Promise<void> {
    try {
      logger.info("Initializing TelegramContactsManager");
      
      // Инициализация хранилища
      if ('initialize' in this.storage && typeof this.storage.initialize === 'function') {
        await this.storage.initialize();
      }
      
      // Очистка истекших запросов верификации
      await this.cleanupExpiredVerificationRequests();
      
      logger.info("TelegramContactsManager initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize TelegramContactsManager", error as Error);
      throw new InvisibleWalletError("Failed to initialize TelegramContactsManager", "CONTACTS_MANAGER_INIT_ERROR", { error });
    }
  }
  
  /**
   * Получение контактов из Telegram
   */
  async getTelegramContacts(): Promise<TelegramContact[]> {
    try {
      logger.info("Getting Telegram contacts");
      
      if (!this.telegramAPI) {
        throw new InvisibleWalletError("Telegram API not available", "TELEGRAM_API_UNAVAILABLE");
      }
      
      // В реальной реализации здесь будет запрос к Telegram WebApp API
      // Для демонстрации возвращаем заглушку
      
      // Проверка прав доступа к контактам
      const hasContactPermission = await this.requestContactPermission();
      if (!hasContactPermission) {
        throw new InvisibleWalletError("Contact permission denied", "CONTACT_PERMISSION_DENIED");
      }
      
      // Заглушка для демонстрации
      const mockContacts: TelegramContact[] = [
        {
          id: "1",
          firstName: "Александр",
          lastName: "Петров",
          username: "alex_petrov",
          isVerified: true,
          trustLevel: 0.9
        },
        {
          id: "2", 
          firstName: "Мария",
          lastName: "Иванова",
          username: "maria_ivanova",
          isVerified: false,
          trustLevel: 0.7
        },
        {
          id: "3",
          firstName: "Дмитрий",
          lastName: "Сидоров",
          isVerified: true,
          trustLevel: 0.8
        }
      ];
      
      logger.info("Telegram contacts retrieved successfully", { count: mockContacts.length });
      return mockContacts;
    } catch (error) {
      logger.error("Failed to get Telegram contacts", error as Error);
      throw new InvisibleWalletError("Failed to get Telegram contacts", "GET_CONTACTS_ERROR", { error });
    }
  }
  
  /**
   * Выбор доверенных контактов для восстановления
   */
  async selectTrustedContacts(contacts: TelegramContact[], minTrustLevel: number = 0.5): Promise<TelegramContact[]> {
    try {
      logger.info("Selecting trusted contacts", { totalContacts: contacts.length, minTrustLevel });
      
      // Фильтрация контактов по уровню доверия
      const trustedContacts = contacts.filter(contact => 
        contact.trustLevel >= minTrustLevel && 
        contact.id !== this.getCurrentUserId() // Исключаем самого себя
      );
      
      // Сортировка по уровню доверия (убывание)
      trustedContacts.sort((a, b) => b.trustLevel - a.trustLevel);
      
      // Проверка верифицированных контактов
      const verifiedContacts = await this.getVerifiedContacts();
      const finalContacts = trustedContacts.filter(contact => 
        verifiedContacts.some(verified => verified.id === contact.id)
      );
      
      // Если недостаточно верифицированных контактов, добавляем доверенных
      if (finalContacts.length < 3) {
        const additionalContacts = trustedContacts.filter(contact => 
          !finalContacts.some(final => final.id === contact.id)
        ).slice(0, 3 - finalContacts.length);
        
        finalContacts.push(...additionalContacts);
      }
      
      logger.info("Trusted contacts selected successfully", { 
        selected: finalContacts.length,
        total: contacts.length 
      });
      
      return finalContacts;
    } catch (error) {
      logger.error("Failed to select trusted contacts", error as Error);
      throw new InvisibleWalletError("Failed to select trusted contacts", "SELECT_TRUSTED_CONTACTS_ERROR", { error });
    }
  }
  
  /**
   * Шифрование share для контакта
   */
  async encryptShareForContact(share: Uint8Array, contact: TelegramContact): Promise<Uint8Array> {
    try {
      logger.info("Encrypting share for contact", { contactId: contact.id });
      
      // Генерация ключа для контакта
      const contactKey = await this.deriveContactKey(contact);
      
      // Шифрование share
      const encryptedShare = await this.crypto.encrypt(share, contactKey);
      
      logger.info("Share encrypted successfully for contact", { contactId: contact.id });
      return encryptedShare;
    } catch (error) {
      logger.error("Failed to encrypt share for contact", error as Error);
      throw new InvisibleWalletError("Failed to encrypt share for contact", "ENCRYPT_SHARE_ERROR", { error });
    }
  }
  
  /**
   * Расшифровка share от контакта
   */
  async decryptShareFromContact(encryptedShare: Uint8Array, contact: TelegramContact): Promise<Uint8Array> {
    try {
      logger.info("Decrypting share from contact", { contactId: contact.id });
      
      // Генерация ключа для контакта
      const contactKey = await this.deriveContactKey(contact);
      
      // Расшифровка share
      const decryptedShare = await this.crypto.decrypt(encryptedShare, contactKey);
      
      logger.info("Share decrypted successfully from contact", { contactId: contact.id });
      return decryptedShare;
    } catch (error) {
      logger.error("Failed to decrypt share from contact", error as Error);
      throw new InvisibleWalletError("Failed to decrypt share from contact", "DECRYPT_SHARE_ERROR", { error });
    }
  }
  
  /**
   * Отправка share контакту для верификации
   */
  async sendShareToContact(share: RecoveryShare, contact: TelegramContact, message?: string): Promise<string> {
    try {
      logger.info("Sending share to contact", { contactId: contact.id, shareId: share.id });
      
      // Создание запроса верификации
      const verificationRequest: ContactVerificationRequest = {
        id: await this.generateRequestId(),
        contactId: contact.id,
        shareData: share.shareData,
        encrypted: share.encrypted,
        createdAt: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 дней
        status: 'pending',
        message: message || 'Прошу помочь с восстановлением доступа к кошельку'
      };
      
      // Сохранение запроса
      await this.storeVerificationRequest(verificationRequest);
      
      // Отправка через Telegram
      if (this.telegramAPI) {
        await this.sendVerificationMessage(contact, verificationRequest);
      }
      
      logger.info("Share sent to contact successfully", { 
        contactId: contact.id, 
        requestId: verificationRequest.id 
      });
      
      return verificationRequest.id;
    } catch (error) {
      logger.error("Failed to send share to contact", error as Error);
      throw new InvisibleWalletError("Failed to send share to contact", "SEND_SHARE_ERROR", { error });
    }
  }
  
  /**
   * Получение share от контакта
   */
  async receiveShareFromContact(requestId: string, contactId: string): Promise<RecoveryShare | null> {
    try {
      logger.info("Receiving share from contact", { requestId, contactId });
      
      // Получение запроса верификации
      const request = await this.getVerificationRequest(requestId);
      if (!request) {
        throw new InvisibleWalletError("Verification request not found", "REQUEST_NOT_FOUND");
      }
      
      if (request.contactId !== contactId) {
        throw new InvisibleWalletError("Contact ID mismatch", "CONTACT_ID_MISMATCH");
      }
      
      if (request.status !== 'accepted') {
        throw new InvisibleWalletError("Share not accepted by contact", "SHARE_NOT_ACCEPTED");
      }
      
      if (Date.now() > request.expiresAt) {
        throw new InvisibleWalletError("Verification request expired", "REQUEST_EXPIRED");
      }
      
      // Создание recovery share
      const recoveryShare: RecoveryShare = {
        id: await this.generateShareId(),
        shareData: request.shareData,
        contactId,
        encrypted: request.encrypted,
        createdAt: request.createdAt
      };
      
      logger.info("Share received from contact successfully", { 
        contactId, 
        requestId,
        shareId: recoveryShare.id 
      });
      
      return recoveryShare;
    } catch (error) {
      logger.error("Failed to receive share from contact", error as Error);
      throw new InvisibleWalletError("Failed to receive share from contact", "RECEIVE_SHARE_ERROR", { error });
    }
  }
  
  /**
   * Верификация контакта
   */
  async verifyContact(contact: TelegramContact, verificationCode: string): Promise<boolean> {
    try {
      logger.info("Verifying contact", { contactId: contact.id });
      
      // Получение метаданных контакта
      const metadata = await this.getContactMetadata(contact.id);
      
      // Проверка кода верификации
      const isValidCode = await this.validateVerificationCode(contact, verificationCode);
      
      if (!isValidCode) {
        // Увеличение счетчика попыток
        if (metadata) {
          metadata.verificationAttempts += 1;
          await this.storeContactMetadata(metadata);
        }
        
        throw new InvisibleWalletError("Invalid verification code", "INVALID_VERIFICATION_CODE");
      }
      
      // Обновление метаданных
      const updatedMetadata: ContactMetadata = {
        id: contact.id,
        trustLevel: Math.min((metadata?.trustLevel || 0.5) + 0.1, 1.0),
        verificationStatus: 'verified',
        lastVerified: Date.now(),
        verificationAttempts: 0
      };
      
      await this.storeContactMetadata(updatedMetadata);
      
      logger.info("Contact verified successfully", { contactId: contact.id });
      return true;
    } catch (error) {
      logger.error("Failed to verify contact", error as Error);
      throw new InvisibleWalletError("Failed to verify contact", "VERIFY_CONTACT_ERROR", { error });
    }
  }
  
  /**
   * Получение верифицированных контактов
   */
  async getVerifiedContacts(): Promise<TelegramContact[]> {
    try {
      const metadataList = await this.getAllContactMetadata();
      const verifiedContactIds = metadataList
        .filter(metadata => metadata.verificationStatus === 'verified')
        .map(metadata => metadata.id);
      
      // Получение полных данных контактов
      const allContacts = await this.getTelegramContacts();
      return allContacts.filter(contact => verifiedContactIds.includes(contact.id));
    } catch (error) {
      logger.error("Failed to get verified contacts", error as Error);
      return [];
    }
  }
  
  /**
   * Управление доверенными контактами
   */
  async manageTrustedContacts(): Promise<{
    trusted: TelegramContact[];
    pending: TelegramContact[];
    rejected: TelegramContact[];
  }> {
    try {
      logger.info("Managing trusted contacts");
      
      const allContacts = await this.getTelegramContacts();
      const metadataList = await this.getAllContactMetadata();
      
      const trusted: TelegramContact[] = [];
      const pending: TelegramContact[] = [];
      const rejected: TelegramContact[] = [];
      
      for (const contact of allContacts) {
        const metadata = metadataList.find(m => m.id === contact.id);
        
        if (!metadata) {
          pending.push(contact);
        } else if (metadata.verificationStatus === 'verified') {
          trusted.push(contact);
        } else if (metadata.verificationStatus === 'rejected') {
          rejected.push(contact);
        } else {
          pending.push(contact);
        }
      }
      
      logger.info("Trusted contacts managed successfully", {
        trusted: trusted.length,
        pending: pending.length,
        rejected: rejected.length
      });
      
      return { trusted, pending, rejected };
    } catch (error) {
      logger.error("Failed to manage trusted contacts", error as Error);
      throw new InvisibleWalletError("Failed to manage trusted contacts", "MANAGE_TRUSTED_CONTACTS_ERROR", { error });
    }
  }
  
  /**
   * Обновление уровня доверия контакта
   */
  async updateContactTrustLevel(contactId: string, trustLevel: number): Promise<void> {
    try {
      logger.info("Updating contact trust level", { contactId, trustLevel });
      
      if (trustLevel < 0 || trustLevel > 1) {
        throw new InvisibleWalletError("Trust level must be between 0 and 1", "INVALID_TRUST_LEVEL");
      }
      
      const metadata = await this.getContactMetadata(contactId);
      const updatedMetadata: ContactMetadata = {
        id: contactId,
        trustLevel,
        verificationStatus: metadata?.verificationStatus || 'pending',
        lastVerified: metadata?.lastVerified || 0,
        verificationAttempts: metadata?.verificationAttempts || 0
      };
      
      await this.storeContactMetadata(updatedMetadata);
      
      logger.info("Contact trust level updated successfully", { contactId, trustLevel });
    } catch (error) {
      logger.error("Failed to update contact trust level", error as Error);
      throw new InvisibleWalletError("Failed to update contact trust level", "UPDATE_TRUST_LEVEL_ERROR", { error });
    }
  }
  
  /**
   * Создание адаптера хранилища
   */
  private createStorageAdapter(): StorageAdapter {
    return new IndexedDBStorageAdapter();
  }
  
  /**
   * Запрос прав доступа к контактам
   */
  private async requestContactPermission(): Promise<boolean> {
    try {
      // В реальной реализации здесь будет запрос прав через Telegram WebApp API
      // Для демонстрации возвращаем true
      return true;
    } catch (error) {
      logger.error("Failed to request contact permission", error as Error);
      return false;
    }
  }
  
  /**
   * Получение ID текущего пользователя
   */
  private getCurrentUserId(): string {
    const telegramUser = TelegramUtils.getTelegramUser();
    return telegramUser?.id?.toString() || 'unknown';
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
      throw new InvisibleWalletError("Failed to derive contact key", "DERIVE_CONTACT_KEY_ERROR", { error });
    }
  }
  
  /**
   * Отправка сообщения верификации
   */
  private async sendVerificationMessage(contact: TelegramContact, request: ContactVerificationRequest): Promise<void> {
    try {
      if (!this.telegramAPI) {
        throw new InvisibleWalletError("Telegram API not available", "TELEGRAM_API_UNAVAILABLE");
      }
      
      // Формирование сообщения
      const message = `
🔐 Запрос на восстановление доступа

Привет, ${contact.firstName}!

Прошу тебя помочь с восстановлением доступа к моему крипто-кошельку. 
Это безопасный процесс с использованием шифрования.

📅 Запрос создан: ${new Date(request.createdAt).toLocaleDateString('ru-RU')}
⏰ Истекает: ${new Date(request.expiresAt).toLocaleDateString('ru-RU')}

🔗 ID запроса: ${request.id}

${request.message ? `\n💬 Сообщение: ${request.message}` : ''}

Для помощи просто ответь на это сообщение.
      `.trim();
      
      // В реальной реализации здесь будет отправка через Telegram API
      // Для демонстрации просто логируем
      logger.info("Verification message sent", { contactId: contact.id, requestId: request.id });
    } catch (error) {
      logger.error("Failed to send verification message", error as Error);
      throw new InvisibleWalletError("Failed to send verification message", "SEND_VERIFICATION_MESSAGE_ERROR", { error });
    }
  }
  
  /**
   * Валидация кода верификации
   */
  private async validateVerificationCode(contact: TelegramContact, code: string): Promise<boolean> {
    try {
      // В реальной реализации здесь будет проверка кода через Telegram API
      // Для демонстрации используем простой код "123456"
      return code === "123456";
    } catch (error) {
      logger.error("Failed to validate verification code", error as Error);
      return false;
    }
  }
  
  /**
   * Генерация ID запроса
   */
  private async generateRequestId(): Promise<string> {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
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
   * Сохранение запроса верификации
   */
  private async storeVerificationRequest(request: ContactVerificationRequest): Promise<void> {
    try {
      const storageKey = StorageUtils.generateStorageKey('verification_request', request.id);
      const requestData = {
        ...request,
        shareData: Array.from(request.shareData)
      };
      
      await this.storage.set(storageKey, requestData);
    } catch (error) {
      logger.error("Failed to store verification request", error as Error);
      throw new InvisibleWalletError("Failed to store verification request", "STORE_VERIFICATION_REQUEST_ERROR", { error });
    }
  }
  
  /**
   * Получение запроса верификации
   */
  private async getVerificationRequest(requestId: string): Promise<ContactVerificationRequest | null> {
    try {
      const storageKey = StorageUtils.generateStorageKey('verification_request', requestId);
      const requestData = await this.storage.get(storageKey);
      
      if (!requestData) {
        return null;
      }
      
      return {
        ...requestData,
        shareData: new Uint8Array(requestData.shareData)
      };
    } catch (error) {
      logger.error("Failed to get verification request", error as Error);
      return null;
    }
  }
  
  /**
   * Сохранение метаданных контакта
   */
  private async storeContactMetadata(metadata: ContactMetadata): Promise<void> {
    try {
      const storageKey = StorageUtils.generateStorageKey('contact_metadata', metadata.id);
      await this.storage.set(storageKey, metadata);
    } catch (error) {
      logger.error("Failed to store contact metadata", error as Error);
      throw new InvisibleWalletError("Failed to store contact metadata", "STORE_CONTACT_METADATA_ERROR", { error });
    }
  }
  
  /**
   * Получение метаданных контакта
   */
  private async getContactMetadata(contactId: string): Promise<ContactMetadata | null> {
    try {
      const storageKey = StorageUtils.generateStorageKey('contact_metadata', contactId);
      return await this.storage.get(storageKey);
    } catch (error) {
      logger.error("Failed to get contact metadata", error as Error);
      return null;
    }
  }
  
  /**
   * Получение всех метаданных контактов
   */
  private async getAllContactMetadata(): Promise<ContactMetadata[]> {
    try {
      const keys = await this.storage.keys();
      const metadataKeys = keys.filter(key => key.startsWith('invisible_wallet_contact_metadata_'));
      
      const metadataList: ContactMetadata[] = [];
      for (const key of metadataKeys) {
        const metadata = await this.storage.get(key);
        if (metadata) {
          metadataList.push(metadata);
        }
      }
      
      return metadataList;
    } catch (error) {
      logger.error("Failed to get all contact metadata", error as Error);
      return [];
    }
  }
  
  /**
   * Очистка истекших запросов верификации
   */
  private async cleanupExpiredVerificationRequests(): Promise<void> {
    try {
      logger.info("Cleaning up expired verification requests");
      
      const keys = await this.storage.keys();
      const requestKeys = keys.filter(key => key.startsWith('invisible_wallet_verification_request_'));
      
      let cleanedCount = 0;
      for (const key of requestKeys) {
        const request = await this.storage.get(key);
        if (request && Date.now() > request.expiresAt) {
          await this.storage.remove(key);
          cleanedCount++;
        }
      }
      
      logger.info("Cleaned up expired verification requests", { count: cleanedCount });
    } catch (error) {
      logger.error("Failed to cleanup expired verification requests", error as Error);
      // Не выбрасываем ошибку, так как это не критичная операция
    }
  }
}

/**
 * Адаптер IndexedDB для хранения данных контактов
 */
class IndexedDBStorageAdapter implements StorageAdapter {
  private dbName = 'InvisibleWalletContactsDB';
  private storeName = 'contactsStore';
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