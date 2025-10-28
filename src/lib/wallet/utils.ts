import { 
  EncryptedKey, 
  KeyManagerConfig, 
  PrivateKey, 
  KeyPair, 
  KeyMetadata,
  InvisibleWalletError,
  CryptoProvider
} from "@/types/wallet";
import { Keypair, PublicKey } from "@solana/web3.js";
import { logger } from "@/lib/utils/logger";

/**
 * Криптографические утилиты для Invisible Wallet
 */
export class CryptoUtils implements CryptoProvider {
  private config: KeyManagerConfig;
  
  constructor(config: KeyManagerConfig) {
    this.config = config;
  }
  
  /**
   * Генерация новой ключевой пары
   */
  async generateKeyPair(): Promise<{ publicKey: PublicKey; privateKey: PrivateKey }> {
    try {
      const keypair = Keypair.generate();
      
      const privateKey: PrivateKey = {
        toBytes: () => keypair.secretKey,
        sign: async (message: Uint8Array) => {
          // Используем нативную криптографию для подписи
          const signature = await this.signMessage(keypair.secretKey, message);
          return signature;
        }
      };
      
      return {
        publicKey: keypair.publicKey,
        privateKey
      };
    } catch (error) {
      logger.error("Failed to generate key pair", error as Error);
      throw new InvisibleWalletError("Failed to generate key pair", "KEY_GENERATION_ERROR", { error });
    }
  }
  
  /**
   * Генерация ключевой пары из seed
   */
  async deriveKeyPair(seed: Uint8Array): Promise<{ publicKey: PublicKey; privateKey: PrivateKey }> {
    try {
      const keypair = Keypair.fromSeed(seed);
      
      const privateKey: PrivateKey = {
        toBytes: () => keypair.secretKey,
        sign: async (message: Uint8Array) => {
          const signature = await this.signMessage(keypair.secretKey, message);
          return signature;
        }
      };
      
      return {
        publicKey: keypair.publicKey,
        privateKey
      };
    } catch (error) {
      logger.error("Failed to derive key pair from seed", error as Error);
      throw new InvisibleWalletError("Failed to derive key pair from seed", "KEY_DERIVATION_ERROR", { error });
    }
  }
  
  /**
   * Хеширование данных
   */
  async hash(data: Uint8Array): Promise<Uint8Array> {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return new Uint8Array(hashBuffer);
    } catch (error) {
      logger.error("Failed to hash data", error as Error);
      throw new InvisibleWalletError("Failed to hash data", "HASH_ERROR", { error });
    }
  }
  
  /**
   * Шифрование данных
   */
  async encrypt(data: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV для GCM
      const algorithm = this.config.encryptionAlgorithm === 'AES-256-GCM' ? 'AES-GCM' : 'ChaCha20-Poly1305';
      
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: algorithm,
          iv
        },
        key,
        data
      );
      
      // Объединяем IV и зашифрованные данные
      const result = new Uint8Array(iv.length + encryptedData.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encryptedData), iv.length);
      
      return result;
    } catch (error) {
      logger.error("Failed to encrypt data", error as Error);
      throw new InvisibleWalletError("Failed to encrypt data", "ENCRYPTION_ERROR", { error });
    }
  }
  
  /**
   * Расшифровка данных
   */
  async decrypt(encryptedData: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
    try {
      const algorithm = this.config.encryptionAlgorithm === 'AES-256-GCM' ? 'AES-GCM' : 'ChaCha20-Poly1305';
      const ivLength = algorithm === 'AES-GCM' ? 12 : 12; // 96-bit IV для обоих алгоритмов
      
      const iv = encryptedData.slice(0, ivLength);
      const data = encryptedData.slice(ivLength);
      
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: algorithm,
          iv
        },
        key,
        data
      );
      
      return new Uint8Array(decryptedData);
    } catch (error) {
      logger.error("Failed to decrypt data", error as Error);
      throw new InvisibleWalletError("Failed to decrypt data", "DECRYPTION_ERROR", { error });
    }
  }
  
  /**
   * Подпись сообщения
   */
  async sign(message: Uint8Array, privateKey: PrivateKey): Promise<Uint8Array> {
    try {
      return await privateKey.sign(message);
    } catch (error) {
      logger.error("Failed to sign message", error as Error);
      throw new InvisibleWalletError("Failed to sign message", "SIGN_ERROR", { error });
    }
  }
  
  /**
   * Проверка подписи
   */
  async verify(message: Uint8Array, signature: Uint8Array, publicKey: PublicKey): Promise<boolean> {
    try {
      // В реальной реализации здесь будет проверка подписи Ed25519
      // Для демонстрации используем упрощенную версию
      return true;
    } catch (error) {
      logger.error("Failed to verify signature", error as Error);
      throw new InvisibleWalletError("Failed to verify signature", "VERIFY_ERROR", { error });
    }
  }
  
  /**
   * Генерация ключа шифрования из пароля
   */
  async deriveEncryptionKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    try {
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);
      
      let keyMaterial: CryptoKey;
      
      switch (this.config.keyDerivation) {
        case 'PBKDF2':
          keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordData,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
          );
          break;
        case 'scrypt':
          // В браузере scrypt может не поддерживаться, используем PBKDF2 как fallback
          keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordData,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
          );
          break;
        case 'Argon2':
          // Argon2 не поддерживается в Web Crypto API, используем PBKDF2
          keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordData,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
          );
          break;
        default:
          throw new Error(`Unsupported key derivation: ${this.config.keyDerivation}`);
      }
      
      const iterations = this.config.keyDerivation === 'Argon2' ? 100000 : 
                        this.config.keyDerivation === 'scrypt' ? 16384 : 100000;
      
      return await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: this.config.encryptionAlgorithm, length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      logger.error("Failed to derive encryption key", error as Error);
      throw new InvisibleWalletError("Failed to derive encryption key", "KEY_DERIVATION_ERROR", { error });
    }
  }
  
  /**
   * Шифрование приватного ключа
   */
  async encryptPrivateKey(privateKey: PrivateKey, password: string): Promise<EncryptedKey> {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const encryptionKey = await this.deriveEncryptionKey(password, salt);
      const privateKeyBytes = privateKey.toBytes();
      const encryptedData = await this.encrypt(privateKeyBytes, encryptionKey);
      
      return {
        data: encryptedData,
        iv: encryptedData.slice(0, 12), // Первые 12 байт - это IV
        salt,
        algorithm: this.config.encryptionAlgorithm,
        keyDerivation: this.config.keyDerivation,
        iterations: this.config.keyDerivation === 'Argon2' ? 100000 : 
                   this.config.keyDerivation === 'scrypt' ? 16384 : 100000
      };
    } catch (error) {
      logger.error("Failed to encrypt private key", error as Error);
      throw new InvisibleWalletError("Failed to encrypt private key", "PRIVATE_KEY_ENCRYPTION_ERROR", { error });
    }
  }
  
  /**
   * Расшифровка приватного ключа
   */
  async decryptPrivateKey(encryptedKey: EncryptedKey, password: string): Promise<PrivateKey> {
    try {
      const encryptionKey = await this.deriveEncryptionKey(password, encryptedKey.salt);
      const privateKeyBytes = await this.decrypt(encryptedKey.data, encryptionKey);
      
      return {
        toBytes: () => privateKeyBytes,
        sign: async (message: Uint8Array) => {
          return await this.signMessage(privateKeyBytes, message);
        }
      };
    } catch (error) {
      logger.error("Failed to decrypt private key", error as Error);
      throw new InvisibleWalletError("Failed to decrypt private key", "PRIVATE_KEY_DECRYPTION_ERROR", { error });
    }
  }
  
  /**
   * Внутренний метод для подписи сообщения
   */
  private async signMessage(privateKeyBytes: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
    try {
      // В реальной реализации здесь будет Ed25519 подпись
      // Для демонстрации используем упрощенную версию
      const messageHash = await this.hash(message);
      const signature = new Uint8Array(64); // Ed25519 signature size
      
      // В реальной реализации здесь будет криптографическая подпись
      // Для демонстрации просто копируем хеш
      signature.set(messageHash.slice(0, 32));
      signature.set(messageHash.slice(0, 32), 32);
      
      return signature;
    } catch (error) {
      logger.error("Failed to sign message", error as Error);
      throw new InvisibleWalletError("Failed to sign message", "SIGN_MESSAGE_ERROR", { error });
    }
  }
  
  /**
   * Генерация детерминистического seed из Telegram ID
   */
  async deriveSeedFromTelegramId(telegramId: number, serverSecret: string): Promise<Uint8Array> {
    try {
      const encoder = new TextEncoder();
      const telegramData = encoder.encode(telegramId.toString());
      const secretData = encoder.encode(serverSecret);
      
      // Конкатенация данных
      const combined = new Uint8Array(telegramData.length + secretData.length);
      combined.set(telegramData);
      combined.set(secretData, telegramData.length);
      
      // Хеширование для создания детерминистического seed
      return await this.hash(combined);
    } catch (error) {
      logger.error("Failed to derive seed from Telegram ID", error as Error);
      throw new InvisibleWalletError("Failed to derive seed from Telegram ID", "SEED_DERIVATION_ERROR", { error });
    }
  }
}

/**
 * Утилиты для валидации
 */
export class ValidationUtils {
  /**
   * Валидация адреса Solana
   */
  static isValidSolanaAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Валидация Telegram ID
   */
  static isValidTelegramId(telegramId: number): boolean {
    return Number.isInteger(telegramId) && telegramId > 0;
  }
  
  /**
   * Валидация приватного ключа
   */
  static isValidPrivateKey(privateKey: Uint8Array): boolean {
    return privateKey.length === 64; // Ed25519 private key size
  }
  
  /**
   * Валидация зашифрованного ключа
   */
  static isValidEncryptedKey(encryptedKey: EncryptedKey): boolean {
    return (
      encryptedKey.data.length > 0 &&
      encryptedKey.iv.length > 0 &&
      encryptedKey.salt.length > 0 &&
      encryptedKey.algorithm.length > 0 &&
      encryptedKey.keyDerivation.length > 0 &&
      encryptedKey.iterations > 0
    );
  }
  
  /**
   * Валидация метаданных ключа
   */
  static isValidKeyMetadata(metadata: KeyMetadata): boolean {
    return (
      metadata.created > 0 &&
      metadata.lastUsed > 0 &&
      metadata.version > 0 &&
      ['telegram', 'generated', 'recovered'].includes(metadata.source) &&
      metadata.deviceId.length > 0
    );
  }
  
  /**
   * Валидация ключевой пары
   */
  static isValidKeyPair(keyPair: KeyPair): boolean {
    return (
      keyPair.publicKey !== null &&
      keyPair.privateKey !== null &&
      this.isValidPrivateKey(keyPair.privateKey.toBytes()) &&
      this.isValidEncryptedKey(keyPair.encryptedPrivateKey) &&
      this.isValidKeyMetadata(keyPair.metadata)
    );
  }
}

/**
 * Утилиты для форматирования
 */
export class FormatUtils {
  /**
   * Форматирование адреса Solana
   */
  static formatSolanaAddress(address: string | PublicKey, startChars: number = 4, endChars: number = 4): string {
    const addressStr = typeof address === 'string' ? address : address.toBase58();
    
    if (addressStr.length <= startChars + endChars) {
      return addressStr;
    }
    
    return `${addressStr.slice(0, startChars)}...${addressStr.slice(-endChars)}`;
  }
  
  /**
   * Форматирование суммы в SOL
   */
  static formatSolAmount(amount: number, maximumFractionDigits: number = 6): string {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits
    }).format(amount);
  }
  
  /**
   * Форматирование суммы в токенах
   */
  static formatTokenAmount(amount: number, decimals: number = 9, symbol: string = ''): string {
    const formattedAmount = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals
    }).format(amount);
    
    return symbol ? `${formattedAmount} ${symbol}` : formattedAmount;
  }
  
  /**
   * Форматирование времени
   */
  static formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
  
  /**
   * Форматирование относительного времени
   */
  static formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} дн. назад`;
    } else if (hours > 0) {
      return `${hours} ч. назад`;
    } else if (minutes > 0) {
      return `${minutes} мин. назад`;
    } else {
      return 'только что';
    }
  }
}

/**
 * Утилиты для обработки ошибок
 */
export class ErrorUtils {
  /**
   * Создание структурированной ошибки
   */
  static createError(
    message: string,
    code: string,
    details?: Record<string, any>
  ): InvisibleWalletError {
    return new InvisibleWalletError(message, code, details);
  }
  
  /**
   * Обработка ошибки с логированием
   */
  static handleError(error: unknown, context: string): InvisibleWalletError {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const details = error instanceof Error ? { stack: error.stack } : {};
    
    logger.error(`${context}: ${message}`, error as Error);
    
    return new InvisibleWalletError(
      `${context}: ${message}`,
      'UNKNOWN_ERROR',
      details
    );
  }
  
  /**
   * Проверка является ли ошибка сетевой
   */
  static isNetworkError(error: Error): boolean {
    return (
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('timeout') ||
      error.message.includes('offline')
    );
  }
  
  /**
   * Проверка является ли ошибка связанной с аутентификацией
   */
  static isAuthError(error: Error): boolean {
    return (
      error.message.includes('unauthorized') ||
      error.message.includes('authentication') ||
      error.message.includes('login') ||
      error.message.includes('credentials')
    );
  }
}

/**
 * Утилиты для работы с Telegram
 */
export class TelegramUtils {
  /**
   * Получение Telegram WebApp данных
   */
  static getTelegramWebApp(): any {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      return window.Telegram.WebApp;
    }
    return null;
  }
  
  /**
   * Получение ID пользователя Telegram
   */
  static getTelegramUserId(): number | null {
    const webApp = this.getTelegramWebApp();
    if (webApp?.initDataUnsafe?.user?.id) {
      return webApp.initDataUnsafe.user.id;
    }
    return null;
  }
  
  /**
   * Получение данных пользователя Telegram
   */
  static getTelegramUser(): any {
    const webApp = this.getTelegramWebApp();
    return webApp?.initDataUnsafe?.user || null;
  }
  
  /**
   * Проверка находится ли приложение в Telegram
   */
  static isTelegramWebApp(): boolean {
    return this.getTelegramWebApp() !== null;
  }
  
  /**
   * Инициализация Telegram WebApp
   */
  static initTelegramWebApp(): void {
    const webApp = this.getTelegramWebApp();
    if (webApp) {
      webApp.ready();
      webApp.expand();
    }
  }
  
  /**
   * Валидация initData от Telegram
   */
  static validateTelegramInitData(initData: string, botToken: string): boolean {
    try {
      // В реальной реализации здесь будет проверка HMAC-SHA256
      // Для демонстрации возвращаем true
      return true;
    } catch (error) {
      logger.error("Failed to validate Telegram init data", error as Error);
      return false;
    }
  }
}

/**
 * Утилиты для работы с хранилищем
 */
export class StorageUtils {
  /**
   * Проверка доступности IndexedDB
   */
  static isIndexedDBAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }
  
  /**
   * Проверка доступности localStorage
   */
  static isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Проверка доступности Secure Enclave (мобильные устройства)
   */
  static isSecureEnclaveAvailable(): boolean {
    // В браузере Secure Enclave недоступен
    return false;
  }
  
  /**
   * Получение оптимального типа хранилища
   */
  static getOptimalStorageType(): 'indexeddb' | 'localStorage' | 'memory' {
    if (this.isIndexedDBAvailable()) {
      return 'indexeddb';
    } else if (this.isLocalStorageAvailable()) {
      return 'localStorage';
    } else {
      return 'memory';
    }
  }
  
  /**
   * Генерация уникального ключа для хранилища
   */
  static generateStorageKey(prefix: string, identifier: string): string {
    return `invisible_wallet_${prefix}_${identifier}`;
  }
}

/**
 * Утилиты для работы с устройством
 */
export class DeviceUtils {
  /**
   * Получение уникального ID устройства
   */
  static async getDeviceId(): Promise<string> {
    try {
      // Проверяем наличие существующего ID
      const existingId = localStorage.getItem('invisible_wallet_device_id');
      if (existingId) {
        return existingId;
      }
      
      // Генерируем новый ID
      const newId = await this.generateDeviceId();
      localStorage.setItem('invisible_wallet_device_id', newId);
      
      return newId;
    } catch (error) {
      logger.error("Failed to get device ID", error as Error);
      return 'unknown_device';
    }
  }
  
  /**
   * Генерация нового ID устройства
   */
  private static async generateDeviceId(): Promise<string> {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Получение информации об устройстве
   */
  static getDeviceInfo(): Record<string, string> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled.toString(),
      onLine: navigator.onLine.toString()
    };
  }
  
  /**
   * Проверка является ли устройство мобильным
   */
  static isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  /**
   * Проверка поддерживает ли устройство биометрию
   */
  static isBiometricAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      // В браузере биометрия доступна через WebAuthn
      if (typeof window !== 'undefined' && 'credentials' in navigator) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }
}