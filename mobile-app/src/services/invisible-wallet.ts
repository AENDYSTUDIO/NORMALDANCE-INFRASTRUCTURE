import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { MobileKeyManager } from './mobile-key-manager';
import { MobileStarsIntegration } from './mobile-stars-integration';
import { MobileOfflineManager } from './mobile-offline-manager';

// Типы для мобильного Invisible Wallet
export interface MobileInvisibleWalletConfig {
  keyConfig: MobileKeyManagerConfig;
  starsConfig: MobileStarsConfig;
  offlineConfig: MobileOfflineConfig;
  biometricRequired: boolean;
  autoConnect: boolean;
}

export interface MobileKeyManagerConfig {
  encryptionAlgorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2' | 'scrypt' | 'Argon2';
  storageLocation: 'secure-store' | 'keychain' | 'keystore';
  backupEnabled: boolean;
  rotationInterval: number;
}

export interface MobileStarsConfig {
  enabled: boolean;
 minAmount: number;
  maxAmount: number;
  commissionRate: number;
 conversionRate: number;
}

export interface MobileOfflineConfig {
  maxQueueSize: number;
  syncInterval: number;
  retryAttempts: number;
  storageQuota: number;
 conflictResolution: 'last-wins' | 'first-wins' | 'manual';
}

export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  starsAmount?: number;
  solAmount?: number;
  ndtAmount?: number;
  error?: string;
}

export interface TelegramContact {
  id: string;
  username?: string;
  firstName: string;
  lastName?: string;
  isVerified: boolean;
 trustLevel: number;
}

export interface WalletState {
  connected: boolean;
  publicKey?: string;
  balance?: number;
  starsBalance?: number;
  isInvisible: boolean;
}

export class MobileInvisibleWallet {
  private config: MobileInvisibleWalletConfig;
  private keyManager: MobileKeyManager;
  private starsIntegration: MobileStarsIntegration;
  private offlineManager: MobileOfflineManager;
  private connection: Connection;
  private isInitialized: boolean = false;
  private isConnected: boolean = false;
  private publicKey?: PublicKey;
  private biometricAuthAvailable: boolean = false;

  constructor(config: MobileInvisibleWalletConfig) {
    this.config = config;
    this.keyManager = new MobileKeyManager(config.keyConfig);
    this.starsIntegration = new MobileStarsIntegration(config.starsConfig);
    this.offlineManager = new MobileOfflineManager(config.offlineConfig);
    this.connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
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
    try {
      // Инициализация всех компонентов
      await this.keyManager.initialize();
      await this.starsIntegration.initialize();
      await this.offlineManager.initialize();

      // Проверка автоподключения
      if (this.config.autoConnect) {
        await this.autoConnect();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('MobileInvisibleWallet initialization failed:', error);
      throw new Error(`MobileInvisibleWallet initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
 }

  async autoConnect(): Promise<void> {
    try {
      // Проверка наличия сохраненного ключа
      const hasStoredKey = await this.keyManager.hasStoredKey();
      
      if (hasStoredKey) {
        // Восстановление ключа из хранилища
        await this.restoreFromStoredKey();
      } else {
        // Создание нового ключа
        await this.createAndStoreKey();
      }

      this.isConnected = true;
    } catch (error) {
      console.error('Auto-connect failed:', error);
      throw new Error(`Auto-connect failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
 }

  private async restoreFromStoredKey(): Promise<void> {
    try {
      const keyPair = await this.keyManager.retrieveKeyPair();
      if (!keyPair) {
        throw new Error('No stored key found');
      }

      this.publicKey = keyPair.publicKey;
    } catch (error) {
      console.error('Failed to restore from stored key:', error);
      throw error;
    }
  }

  private async createAndStoreKey(): Promise<void> {
    try {
      // В мобильной версии мы можем использовать уникальный идентификатор устройства
      // или создать случайный seed, зашифрованный с помощью биометрии
      const keyPair = await this.keyManager.generateKeyPair();
      await this.keyManager.storeKeyPair(keyPair);

      this.publicKey = keyPair.publicKey;
    } catch (error) {
      console.error('Failed to create and store key:', error);
      throw error;
    }
  }

  async connect(): Promise<WalletState> {
    try {
      // Запрос биометрической аутентификации при необходимости
      if (this.config.biometricRequired && this.biometricAuthAvailable) {
        const authResult = await this.authenticateBiometrically();
        if (!authResult) {
          throw new Error('Biometric authentication failed');
        }
      }

      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isConnected) {
        await this.autoConnect();
      }

      // Загрузка баланса
      let balance = 0;
      if (this.publicKey) {
        balance = await this.getBalance(this.publicKey.toBase58());
      }

      // Загрузка баланса Stars
      const starsBalance = await this.starsIntegration.getStarsBalance();

      return {
        connected: true,
        publicKey: this.publicKey?.toBase58(),
        balance,
        starsBalance,
        isInvisible: true
      };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      return {
        connected: false,
        isInvisible: true
      };
    }
  }

 async disconnect(): Promise<void> {
    this.isConnected = false;
    this.publicKey = undefined;
  }

  async authenticateBiometrically(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Подтверждение доступа кошельку',
        fallbackLabel: 'Использовать PIN-код',
        cancelLabel: 'Отмена'
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  async getBalance(publicKey: string): Promise<number> {
    try {
      const balance = await this.connection.getBalance(new PublicKey(publicKey));
      return balance / 1e9; // SOL to lamports
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

 async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      if (!this.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Запрос биометрической аутентификации для подписания
      if (this.config.biometricRequired && this.biometricAuthAvailable) {
        const authResult = await this.authenticateBiometrically();
        if (!authResult) {
          throw new Error('Biometric authentication required for transaction signing');
        }
      }

      // Получение ключевой пары для подписания
      const keyPair = await this.keyManager.retrieveKeyPair();
      if (!keyPair) {
        throw new Error('Private key not available for signing');
      }

      // Подготовка транзакции
      transaction.recentBlockhash = (await this.connection.getRecentBlockhash()).blockhash;
      transaction.feePayer = this.publicKey;

      // Подпись транзакции
      transaction.sign(keyPair.keyPair);

      return transaction;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw new Error(`Transaction signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
 }

  async sendTransaction(transaction: Transaction): Promise<string> {
    try {
      // Подписываем транзакцию
      const signedTransaction = await this.signTransaction(transaction);

      // Отправляем транзакцию в сеть
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      // Подтверждаем транзакцию
      await this.connection.confirmTransaction(signature, 'confirmed');

      return signature;
    } catch (error) {
      console.error('Transaction sending failed:', error);
      throw new Error(`Transaction sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async purchaseWithStars(amount: number, description: string): Promise<PurchaseResult> {
    try {
      // Проверка аутентификации при необходимости
      if (this.config.biometricRequired && this.biometricAuthAvailable) {
        const authResult = await this.authenticateBiometrically();
        if (!authResult) {
          return {
            success: false,
            error: 'Biometric authentication required for Stars purchase'
          };
        }
      }

      // Выполнение покупки через Stars
      return await this.starsIntegration.purchaseWithStars(amount, description);
    } catch (error) {
      console.error('Stars purchase failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stars purchase failed'
      };
    }
  }

  async getStarsBalance(): Promise<number> {
    try {
      return await this.starsIntegration.getStarsBalance();
    } catch (error) {
      console.error('Failed to get Stars balance:', error);
      return 0;
    }
  }

 async setupRecovery(contacts: TelegramContact[]): Promise<void> {
    try {
      // Проверка аутентификации
      if (this.config.biometricRequired && this.biometricAuthAvailable) {
        const authResult = await this.authenticateBiometrically();
        if (!authResult) {
          throw new Error('Biometric authentication required for recovery setup');
        }
      }

      // В мобильной версии реализация будет упрощенной
      // В реальной реализации нужно использовать Shamir's Secret Sharing
      console.log('Recovery setup initiated with contacts:', contacts);
      
      // Сохранение контактов для восстановления
      await SecureStore.setItemAsync('recovery_contacts', JSON.stringify(contacts));
    } catch (error) {
      console.error('Recovery setup failed:', error);
      throw new Error(`Recovery setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async queueTransaction(transaction: Transaction): Promise<string> {
    return await this.offlineManager.queueTransaction(transaction);
  }

 async syncWhenOnline(): Promise<void> {
    await this.offlineManager.syncWhenOnline();
  }

 async getOfflineQueue(): Promise<any[]> {
    return await this.offlineManager.getQueue();
  }

  async exportPublicKey(): Promise<string> {
    if (!this.publicKey) {
      throw new Error('Wallet not connected');
    }
    return this.publicKey.toBase58();
  }

  async exportEncryptedKey(): Promise<any> {
    // Проверка аутентификации
    if (this.config.biometricRequired && this.biometricAuthAvailable) {
      const authResult = await this.authenticateBiometrically();
      if (!authResult) {
        throw new Error('Biometric authentication required for key export');
      }
    }

    return await this.keyManager.exportEncryptedKey();
  }

  getState(): WalletState {
    return {
      connected: this.isConnected,
      publicKey: this.publicKey?.toBase58(),
      balance: this.publicKey ? undefined : undefined, // Баланс нужно загружать отдельно
      starsBalance: undefined, // Баланс Stars нужно загружать отдельно
      isInvisible: true
    };
  }

  async isInitialized(): Promise<boolean> {
    return this.isInitialized;
 }

  async isConnected(): Promise<boolean> {
    return this.isConnected;
  }
}