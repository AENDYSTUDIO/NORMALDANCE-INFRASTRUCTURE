import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as Crypto from 'expo-crypto';

// Типы для MobileKeyManager
export interface KeyPairData {
  publicKey: PublicKey;
  keyPair: Keypair;
}

export interface EncryptedKeyData {
 data: string; // base64 encoded encrypted key
  iv: string;   // base64 encoded initialization vector
  salt: string; // base64 encoded salt
  algorithm: string;
  keyDerivation: string;
  iterations: number;
}

export interface KeyMetadata {
  created: number;
  lastUsed: number;
  version: number;
  source: 'device-generated' | 'recovered';
  deviceId: string;
}

export interface StoredKeyData {
  encryptedPrivateKey: EncryptedKeyData;
 publicKey: string;
  metadata: KeyMetadata;
}

export class MobileKeyManager {
  private config: any; // Using 'any' temporarily until we define the full config
  private currentKeyPair: KeyPairData | null = null;
  private biometricAuthAvailable: boolean = false;

  constructor(config: any) {
    this.config = config;
    this.initializeBiometricAuth();
  }

  private async initializeBiometricAuth(): Promise<void> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      this.biometricAuthAvailable = compatible && enrolled;
    } catch (error) {
      console.error('Biometric auth initialization failed:', error);
      this.biometricAuthAvailable = false;
    }
  }

  async initialize(): Promise<void> {
    // Initialization logic if needed
    console.log('MobileKeyManager initialized');
  }

  async generateKeyPair(): Promise<KeyPairData> {
    try {
      // Генерация новой ключевой пары
      const keypair = Keypair.generate();
      
      const keyPairData: KeyPairData = {
        publicKey: keypair.publicKey,
        keyPair: keypair
      };

      this.currentKeyPair = keyPairData;
      return keyPairData;
    } catch (error) {
      console.error('Failed to generate key pair:', error);
      throw new Error(`Key pair generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async storeKeyPair(keyPairData: KeyPairData): Promise<void> {
    try {
      // Шифрование приватного ключа
      const encryptedPrivateKey = await this.encryptPrivateKey(keyPairData.keyPair.secretKey);
      
      // Подготовка метаданных
      const metadata: KeyMetadata = {
        created: Date.now(),
        lastUsed: Date.now(),
        version: 1,
        source: 'device-generated',
        deviceId: await this.getDeviceId()
      };

      // Подготовка данных для хранения
      const storedData: StoredKeyData = {
        encryptedPrivateKey,
        publicKey: keyPairData.keyPair.publicKey.toBase58(),
        metadata
      };

      // Сохранение в безопасное хранилище
      await SecureStore.setItemAsync('invisible_wallet_key', JSON.stringify(storedData), {
        keychainAccessible: this.getKeychainAccessibility()
      });
    } catch (error) {
      console.error('Failed to store key pair:', error);
      throw new Error(`Key pair storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async retrieveKeyPair(): Promise<KeyPairData | null> {
    try {
      // Загрузка зашифрованных данных из хранилища
      const storedDataStr = await SecureStore.getItemAsync('invisible_wallet_key');
      if (!storedDataStr) {
        return null;
      }

      const storedData: StoredKeyData = JSON.parse(storedDataStr);

      // Расшифровка приватного ключа
      const privateKeyBytes = await this.decryptPrivateKey(storedData.encryptedPrivateKey);

      // Создание ключевой пары из расшифрованных данных
      const keypair = Keypair.fromSecretKey(privateKeyBytes);
      
      const keyPairData: KeyPairData = {
        publicKey: keypair.publicKey,
        keyPair: keypair
      };

      this.currentKeyPair = keyPairData;
      return keyPairData;
    } catch (error) {
      console.error('Failed to retrieve key pair:', error);
      return null;
    }
  }

  async hasStoredKey(): Promise<boolean> {
    try {
      const storedData = await SecureStore.getItemAsync('invisible_wallet_key');
      return storedData !== null;
    } catch (error) {
      console.error('Failed to check for stored key:', error);
      return false;
    }
  }

  async deleteKeyPair(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('invisible_wallet_key');
      this.currentKeyPair = null;
    } catch (error) {
      console.error('Failed to delete key pair:', error);
      throw new Error(`Key pair deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async encryptPrivateKey(privateKey: Uint8Array): Promise<EncryptedKeyData> {
    try {
      // Генерация случайной соли и IV
      const salt = Crypto.getRandomBytes(16);
      const iv = Crypto.getRandomBytes(12);
      
      // Создание ключа шифрования на основе биометрических данных или пароля
      // В мобильной версии используем сгенерированный ключ, защищенный биометрией
      const encryptionKey = await this.generateEncryptionKey(salt);
      
      // Шифрование приватного ключа с использованием AES-256-GCM
      const plaintext = privateKey;
      const algorithm = 'AES-GCM';
      const iterations = 100000; // For PBKDF2 if used
      
      // В экспо-среде используем криптографические функции для шифрования
      // Для упрощения реализации возвращаем данные в нужном формате
      // Реальная реализация будет использовать нативные криптографические функции
      
      // Временная реализация - просто кодируем в base64
      const encryptedData = await this.performEncryption(plaintext, encryptionKey, iv);
      
      return {
        data: this.uint8ArrayToBase64(encryptedData),
        iv: this.uint8ArrayToBase64(iv),
        salt: this.uint8ArrayToBase64(salt),
        algorithm,
        keyDerivation: this.config.keyDerivation || 'PBKDF2',
        iterations
      };
    } catch (error) {
      console.error('Failed to encrypt private key:', error);
      throw new Error(`Private key encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async decryptPrivateKey(encryptedKeyData: EncryptedKeyData): Promise<Uint8Array> {
    try {
      // Декодирование данных из base64
      const encryptedData = this.base64ToUint8Array(encryptedKeyData.data);
      const iv = this.base64ToUint8Array(encryptedKeyData.iv);
      const salt = this.base64ToUint8Array(encryptedKeyData.salt);
      
      // Создание ключа расшифровки
      const encryptionKey = await this.generateEncryptionKey(salt);
      
      // Расшифровка приватного ключа
      const decryptedData = await this.performDecryption(encryptedData, encryptionKey, iv);
      
      return decryptedData;
    } catch (error) {
      console.error('Failed to decrypt private key:', error);
      throw new Error(`Private key decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateEncryptionKey(salt: Uint8Array): Promise<Uint8Array> {
    // В мобильной версии создаем ключ шифрования на основе биометрических данных
    // или защищенного пользовательского ключа
    
    // Для упрощения временно используем фиксированный ключ, но в реальной реализации
    // он будет генерироваться с использованием биометрической аутентификации
    const deviceId = await this.getDeviceId();
    const deviceInfo = deviceId + salt.toString();
    
    // Хеширование для получения ключа
    const hashBuffer = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      deviceInfo
    );
    
    // Преобразование в байты
    const key = this.hexStringToUint8Array(hashBuffer);
    
    // Убедимся, что ключ имеет правильную длину (32 байта для AES-256)
    if (key.length < 32) {
      const extendedKey = new Uint8Array(32);
      extendedKey.set(key);
      for (let i = key.length; i < 32; i++) {
        extendedKey[i] = 0;
      }
      return extendedKey;
    } else if (key.length > 32) {
      return key.slice(0, 32);
    }
    
    return key;
  }

  private async performEncryption(plaintext: Uint8Array, key: Uint8Array, iv: Uint8Array): Promise<Uint8Array> {
    // В реальной реализации здесь будет вызов нативных криптографических функций
    // для выполнения AES-256-GCM шифрования
    
    // Временная реализация - возвращаем зашифрованные данные
    // В мобильной среде Expo Crypto не поддерживает прямое шифрование,
    // поэтому используем упрощенную реализацию
    
    // В реальном приложении нужно будет использовать нативные модули
    // или альтернативные решения для шифрования
    console.log('Performing encryption with key length:', key.length);
    
    // Временное решение: просто возвращаем исходные данные с добавлением IV
    // Это НЕ безопасно и используется только для демонстрации структуры
    const result = new Uint8Array(plaintext.length + iv.length);
    result.set(plaintext);
    result.set(iv, plaintext.length);
    
    return result;
  }

  private async performDecryption(ciphertext: Uint8Array, key: Uint8Array, iv: Uint8Array): Promise<Uint8Array> {
    // В реальной реализации здесь будет вызов нативных криптографических функций
    // для выполнения AES-256-GCM расшифровки
    
    // Временная реализация
    console.log('Performing decryption with key length:', key.length);
    
    // Возвращаем оригинальные данные (без IV)
    return ciphertext.slice(0, -iv.length);
  }

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

 private hexStringToUint8Array(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  private async getDeviceId(): Promise<string> {
    // В мобильной версии получаем уникальный идентификатор устройства
    // В реальном приложении использовать идентификатор, предоставляемый Expo
    try {
      // Используем Expo Application Utilities для получения device ID
      // или генерируем уникальный идентификатор для этого приложения
      return await this.generateAppSpecificId();
    } catch (error) {
      // В случае ошибки генерируем случайный идентификатор
      return this.generateRandomId();
    }
 }

  private async generateAppSpecificId(): Promise<string> {
    // Временная реализация - генерируем идентификатор на основе случайных данных
    // В реальной реализации использовать Expo Application Utilities
    return this.generateRandomId();
  }

  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private getKeychainAccessibility(): SecureStore.Options['keychainAccessible'] {
    // Возвращаем настройку доступности для iOS keychain
    // В реальной реализации использовать соответствующие настройки безопасности
    return SecureStore.keychainAccessibilityWhenUnlocked;
  }

  async exportEncryptedKey(): Promise<EncryptedKeyData> {
    try {
      const storedDataStr = await SecureStore.getItemAsync('invisible_wallet_key');
      if (!storedDataStr) {
        throw new Error('No stored key found');
      }

      const storedData: StoredKeyData = JSON.parse(storedDataStr);
      return storedData.encryptedPrivateKey;
    } catch (error) {
      console.error('Failed to export encrypted key:', error);
      throw new Error(`Encrypted key export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

 async rotateKey(): Promise<KeyPairData> {
    try {
      // Генерация новой ключевой пары
      const newKeyPair = await this.generateKeyPair();
      
      // Сохранение новой пары
      await this.storeKeyPair(newKeyPair);
      
      // Удаление старой зашифрованной версии (если требуется)
      
      return newKeyPair;
    } catch (error) {
      console.error('Key rotation failed:', error);
      throw new Error(`Key rotation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async shouldRotateKey(): Promise<boolean> {
    try {
      const storedDataStr = await SecureStore.getItemAsync('invisible_wallet_key');
      if (!storedDataStr) {
        return false;
      }

      const storedData: StoredKeyData = JSON.parse(storedDataStr);
      const now = Date.now();
      const timeSinceCreation = now - storedData.metadata.created;
      
      // Проверяем, прошло ли достаточно времени для ротации
      const rotationIntervalMs = this.config.rotationInterval * 24 * 60 * 60 * 1000; // дни в миллисекунды
      return timeSinceCreation > rotationIntervalMs;
    } catch (error) {
      console.error('Failed to check if key rotation is needed:', error);
      return false;
    }
  }
}