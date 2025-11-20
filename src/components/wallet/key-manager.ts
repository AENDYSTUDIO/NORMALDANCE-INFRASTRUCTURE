import { logger } from "@/lib/utils/logger";
import { Keypair, PublicKey } from "@solana/web3.js";
import { InvisibleWalletConfig } from "./invisible-wallet-adapter";

/**
 * Интерфейс для ключевой пары
 */
export interface KeyPairData {
  publicKey: string;
  privateKey: string;
  createdAt: number;
  lastUsed: number;
}

/**
 * Интерфейс для share социального восстановления
 */
export interface KeyShare {
  id: string;
  shareData: string;
  contactId: string;
  createdAt: number;
  isUsed: boolean;
}

/**
 * Интерфейс для метаданных восстановления
 */
export interface RecoveryMetadata {
  userId: string;
  threshold: number;
  totalShares: number;
  trustedContacts: string[];
  createdAt: number;
  lastBackup: number;
}

/**
 * Менеджер ключей для невидимого кошелька
 *
 * Ответственности:
 * - Генерация и хранение ключевых пар
 * - Шифрование приватных ключей
 * - Социальное восстановление через Shamir's Secret Sharing
 * - Безопасное хранение в localStorage/secure storage
 */
export class KeyManager {
  private _config: InvisibleWalletConfig;
  private _storageKey: string;
  private _encryptionKey: string | null = null;

  constructor(config: InvisibleWalletConfig) {
    this._config = config;
    this._storageKey = `invisible_wallet_keys_${
      config.telegramUserId || "default"
    }`;
  }

  /**
   * Получение или создание ключевой пары
   */
  async getOrCreateKeyPair(
    userId: string,
    initData?: string
  ): Promise<PublicKey> {
    try {
      // Проверяем существующий ключ
      const existingKeyPair = await this._retrieveKeyPair(userId);
      if (existingKeyPair) {
        logger.info("Existing key pair found", { userId });
        return new PublicKey(existingKeyPair.publicKey);
      }

      // Создаем новую ключевую пару
      const keyPair = await this._generateKeyPair(userId, initData);
      await this._storeKeyPair(keyPair, userId);

      logger.info("New key pair created", {
        userId,
        publicKey: keyPair.publicKey,
      });

      return new PublicKey(keyPair.publicKey);
    } catch (error) {
      logger.error("Failed to get or create key pair", error);
      throw error;
    }
  }

  /**
   * Генерация случайной ключевой пары
   */
  async generateRandomKeyPair(): Promise<PublicKey> {
    const keyPair = Keypair.generate();
    const keyPairData: KeyPairData = {
      publicKey: keyPair.publicKey.toBase58(),
      privateKey: Buffer.from(keyPair.secretKey).toString("base64"),
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };

    await this._storeKeyPair(keyPairData, "random");
    return keyPair.publicKey;
  }

  /**
   * Получение приватного ключа
   */
  async getPrivateKey(): Promise<Keypair> {
    const userId = this._config.telegramUserId || "default";
    const keyPairData = await this._retrieveKeyPair(userId);

    if (!keyPairData) {
      throw new Error("No key pair found");
    }

    const privateKeyBytes = Buffer.from(keyPairData.privateKey, "base64");
    return Keypair.fromSecretKey(privateKeyBytes);
  }

  /**
   * Настройка социального восстановления
   */
  async setupSocialRecovery(contacts: string[]): Promise<void> {
    if (!this._config.enableSocialRecovery) {
      throw new Error("Social recovery is disabled");
    }

    try {
      const userId = this._config.telegramUserId || "default";
      const keyPairData = await this._retrieveKeyPair(userId);

      if (!keyPairData) {
        throw new Error("No key pair found for social recovery setup");
      }

      // Создание shares с помощью Shamir's Secret Sharing
      const shares = await this._createSecretShares(
        keyPairData.privateKey,
        contacts.length,
        Math.ceil(contacts.length * 0.6) // 60% threshold
      );

      // Распределение shares контактам
      const keyShares: KeyShare[] = [];
      for (let i = 0; i < contacts.length && i < shares.length; i++) {
        keyShares.push({
          id: `share_${i}`,
          shareData: shares[i],
          contactId: contacts[i],
          createdAt: Date.now(),
          isUsed: false,
        });
      }

      // Сохранение метаданных восстановления
      const recoveryMetadata: RecoveryMetadata = {
        userId,
        threshold: Math.ceil(contacts.length * 0.6),
        totalShares: contacts.length,
        trustedContacts: contacts,
        createdAt: Date.now(),
        lastBackup: Date.now(),
      };

      await this._storeRecoveryMetadata(recoveryMetadata);
      await this._storeKeyShares(keyShares);

      logger.info("Social recovery setup completed", {
        userId,
        contactsCount: contacts.length,
        threshold: recoveryMetadata.threshold,
      });
    } catch (error) {
      logger.error("Failed to setup social recovery", error);
      throw error;
    }
  }

  /**
   * Инициация восстановления
   */
  async initiateRecovery(): Promise<string> {
    const userId = this._config.telegramUserId || "default";
    const metadata = await this._retrieveRecoveryMetadata(userId);

    if (!metadata) {
      throw new Error("No recovery setup found");
    }

    const sessionId = `recovery_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Здесь должна быть логика отправки запросов доверенным контактам
    // через Telegram API или другие каналы

    logger.info("Recovery initiated", { userId, sessionId });
    return sessionId;
  }

  /**
   * Восстановление из shares
   */
  async recoverFromShares(shares: string[]): Promise<PublicKey> {
    if (shares.length < 3) {
      throw new Error("Insufficient shares for recovery");
    }

    try {
      // Реконструкция приватного ключа из shares
      const privateKey = await this._reconstructSecret(shares);

      const keyPair = Keypair.fromSecretKey(Buffer.from(privateKey, "base64"));
      const keyPairData: KeyPairData = {
        publicKey: keyPair.publicKey.toBase58(),
        privateKey: privateKey,
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };

      const userId = this._config.telegramUserId || "default";
      await this._storeKeyPair(keyPairData, userId);

      logger.info("Key pair recovered successfully", { userId });
      return keyPair.publicKey;
    } catch (error) {
      logger.error("Failed to recover from shares", error);
      throw error;
    }
  }

  /**
   * Экспорт бэкапа
   */
  async exportBackup(): Promise<string> {
    const userId = this._config.telegramUserId || "default";
    const keyPairData = await this._retrieveKeyPair(userId);

    if (!keyPairData) {
      throw new Error("No key pair found");
    }

    const backup = {
      version: "1.0",
      timestamp: Date.now(),
      keyPair: keyPairData,
      metadata: {
        platform: "invisible-wallet",
        userId,
      },
    };

    return JSON.stringify(backup);
  }

  /**
   * Импорт бэкапа
   */
  async importBackup(backupData: string): Promise<PublicKey> {
    try {
      const backup = JSON.parse(backupData);

      if (backup.version !== "1.0") {
        throw new Error("Unsupported backup version");
      }

      const userId = this._config.telegramUserId || "default";
      await this._storeKeyPair(backup.keyPair, userId);

      logger.info("Backup imported successfully", { userId });
      return new PublicKey(backup.keyPair.publicKey);
    } catch (error) {
      logger.error("Failed to import backup", error);
      throw error;
    }
  }

  // Приватные методы

  private async _generateKeyPair(
    userId: string,
    initData?: string
  ): Promise<KeyPairData> {
    const keyPair = Keypair.generate();

    // Если есть Telegram initData, используем ее для детерминированной генерации
    if (initData) {
      const seed = await this._deriveSeedFromTelegramData(userId, initData);
      const derivedKeyPair = Keypair.fromSeed(seed);

      return {
        publicKey: derivedKeyPair.publicKey.toBase58(),
        privateKey: Buffer.from(derivedKeyPair.secretKey).toString("base64"),
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };
    }

    return {
      publicKey: keyPair.publicKey.toBase58(),
      privateKey: Buffer.from(keyPair.secretKey).toString("base64"),
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };
  }

  private async _deriveSeedFromTelegramData(
    userId: string,
    initData: string
  ): Promise<Uint8Array> {
    // Используем Web Crypto API для детерминированной генерации seed
    const encoder = new TextEncoder();
    const data = encoder.encode(`${userId}:${initData}`);

    const hash = await crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(hash.slice(0, 32)); // Первые 32 байта для seed
  }

  private async _storeKeyPair(
    keyPair: KeyPairData,
    userId: string
  ): Promise<void> {
    const encryptedKeyPair = await this._encryptKeyPair(keyPair);
    const storageData = {
      encryptedKeyPair,
      userId,
      version: "1.0",
    };

    localStorage.setItem(this._storageKey, JSON.stringify(storageData));
  }

  private async _retrieveKeyPair(userId: string): Promise<KeyPairData | null> {
    try {
      const storageData = localStorage.getItem(this._storageKey);
      if (!storageData) return null;

      const parsed = JSON.parse(storageData);
      if (parsed.userId !== userId) return null;

      return await this._decryptKeyPair(parsed.encryptedKeyPair);
    } catch (error) {
      logger.error("Failed to retrieve key pair", error);
      return null;
    }
  }

  private async _encryptKeyPair(keyPair: KeyPairData): Promise<string> {
    const encryptionKey = await this._getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(keyPair));

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      encryptionKey,
      data
    );

    return JSON.stringify({
      encrypted: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv),
    });
  }

  private async _decryptKeyPair(encryptedData: string): Promise<KeyPairData> {
    const encryptionKey = await this._getEncryptionKey();
    const parsed = JSON.parse(encryptedData);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(parsed.iv),
      },
      encryptionKey,
      new Uint8Array(parsed.encrypted)
    );

    const decoder = new TextDecoder();
    const keyPairData = JSON.parse(decoder.decode(decrypted));
    return keyPairData;
  }

  private async _getEncryptionKey(): Promise<CryptoKey> {
    if (this._encryptionKey) {
      return this._encryptionKey!;
    }

    // Генерация ключа шифрования на основе Telegram initData или случайного
    const keyMaterial = this._config.telegramInitData
      ? await this._deriveKeyFromTelegramData(this._config.telegramInitData)
      : crypto.getRandomValues(new Uint8Array(32));

    this._encryptionKey = await crypto.subtle.importKey(
      "raw",
      keyMaterial,
      "AES-GCM",
      false,
      ["encrypt", "decrypt"]
    );

    return this._encryptionKey!;
  }

  private async _deriveKeyFromTelegramData(
    initData: string
  ): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const data = encoder.encode(initData);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(hash);
  }

  private async _createSecretShares(
    secret: string,
    totalShares: number,
    threshold: number
  ): Promise<string[]> {
    // Упрощенная реализация Shamir's Secret Sharing
    // В реальной реализации следует использовать специализированную библиотеку
    const shares: string[] = [];

    for (let i = 0; i < totalShares; i++) {
      // В реальности здесь должна быть правильная реализация SSS
      const share = `${secret}_share_${i}_${Date.now()}`;
      shares.push(share);
    }

    return shares;
  }

  private async _reconstructSecret(shares: string[]): Promise<string> {
    // Упрощенная реконструкция секрета
    // В реальности здесь должна быть правильная реализация SSS
    const baseShare = shares[0];
    const secret = baseShare.split("_share_")[0];
    return secret;
  }

  private async _storeRecoveryMetadata(
    metadata: RecoveryMetadata
  ): Promise<void> {
    const storageKey = `recovery_metadata_${metadata.userId}`;
    localStorage.setItem(storageKey, JSON.stringify(metadata));
  }

  private async _retrieveRecoveryMetadata(
    userId: string
  ): Promise<RecoveryMetadata | null> {
    try {
      const storageKey = `recovery_metadata_${userId}`;
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error("Failed to retrieve recovery metadata", error);
      return null;
    }
  }

  private async _storeKeyShares(shares: KeyShare[]): Promise<void> {
    const userId = this._config.telegramUserId || "default";
    const storageKey = `key_shares_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(shares));
  }
}
