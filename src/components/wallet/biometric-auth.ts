import { logger } from "@/lib/utils/logger";
import { InvisibleWalletConfig } from "./invisible-wallet-adapter";

/**
 * Результат биометрической аутентификации
 */
export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: "fingerprint" | "face" | "voice" | "unknown";
}

/**
 * Доступные биометрические методы
 */
export interface BiometricCapabilities {
  fingerprint: boolean;
  face: boolean;
  voice: boolean;
  platformAuthenticator: boolean;
}

/**
 * Менеджер биометрической аутентификации
 *
 * Ответственности:
 * - Проверка доступности биометрии
 * - Аутентификация через биометрические данные
 * - Управление биометрическими учетными данными
 * - Fallback на другие методы аутентификации
 */
export class BiometricAuth {
  private _config: InvisibleWalletConfig;
  private _isSupported: boolean = false;
  private _capabilities: BiometricCapabilities;

  constructor(config: InvisibleWalletConfig) {
    this._config = config;
    this._capabilities = {
      fingerprint: false,
      face: false,
      voice: false,
      platformAuthenticator: false,
    };

    this._initializeCapabilities();
  }

  /**
   * Проверка доступности биометрической аутентификации
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Проверка поддержки Web Authentication API
      if (!window.PublicKeyCredential) {
        return false;
      }

      // Проверка доступности биометрических методов
      const available = await this._checkBiometricAvailability();
      this._isSupported = available;

      return available;
    } catch (error) {
      logger.error("Biometric availability check failed", error);
      return false;
    }
  }

  /**
   * Получение доступных биометрических возможностей
   */
  async getCapabilities(): Promise<BiometricCapabilities> {
    await this.isAvailable(); // Обновляем возможности
    return { ...this._capabilities };
  }

  /**
   * Регистрация биометрических данных
   */
  async registerBiometric(userId: string): Promise<BiometricAuthResult> {
    try {
      if (!this._isSupported) {
        return {
          success: false,
          error: "Biometric authentication not supported",
        };
      }

      // Создание учетных данных для биометрии
      const credential = await this._createBiometricCredential(userId);

      if (credential) {
        // Сохранение ID учетных данных
        await this._storeCredentialId(userId, credential.id);

        logger.info("Biometric registration successful", { userId });
        return {
          success: true,
          biometricType: await this._detectBiometricType(),
        };
      }

      return {
        success: false,
        error: "Failed to create biometric credential",
      };
    } catch (error) {
      logger.error("Biometric registration failed", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Аутентификация через биометрические данные
   */
  async authenticate(): Promise<BiometricAuthResult> {
    try {
      if (!this._isSupported) {
        return {
          success: false,
          error: "Biometric authentication not supported",
        };
      }

      // Получение учетных данных для аутентификации
      const credentialId = await this._getStoredCredentialId();
      if (!credentialId) {
        return {
          success: false,
          error: "No biometric credentials found",
        };
      }

      // Аутентификация
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: [
            {
              id: this._base64ToArrayBuffer(credentialId),
              type: "public-key",
              transports: ["internal", "usb", "nfc", "ble"],
            },
          ],
          userVerification: "required",
          timeout: 60000,
        },
      });

      if (assertion) {
        const biometricType = await this._detectBiometricType();
        logger.info("Biometric authentication successful", { biometricType });

        return {
          success: true,
          biometricType,
        };
      }

      return {
        success: false,
        error: "Authentication failed",
      };
    } catch (error) {
      logger.error("Biometric authentication failed", error);

      // Обработка специфических ошибок
      if (error.name === "NotAllowedError") {
        return {
          success: false,
          error: "Biometric authentication cancelled by user",
        };
      }

      if (error.name === "InvalidStateError") {
        return {
          success: false,
          error: "Biometric device is already registered",
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      };
    }
  }

  /**
   * Удаление биометрических данных
   */
  async removeBiometric(userId: string): Promise<boolean> {
    try {
      await this._removeCredentialId(userId);
      logger.info("Biometric credentials removed", { userId });
      return true;
    } catch (error) {
      logger.error("Failed to remove biometric credentials", error);
      return false;
    }
  }

  /**
   * Проверка регистрации биометрии
   */
  async isBiometricRegistered(userId: string): Promise<boolean> {
    try {
      const credentialId = await this._getStoredCredentialId(userId);
      return !!credentialId;
    } catch (error) {
      logger.error("Failed to check biometric registration", error);
      return false;
    }
  }

  // Приватные методы

  private async _initializeCapabilities(): Promise<void> {
    try {
      // Проверка поддержки PublicKeyCredential
      if (!window.PublicKeyCredential) {
        return;
      }

      // Проверка доступности платформенного аутентификатора
      this._capabilities.platformAuthenticator =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

      // Проверка конкретных биометрических методов
      if (this._capabilities.platformAuthenticator) {
        // В реальной реализации здесь может быть более детальная проверка
        // через специфичные для платформы API
        this._capabilities.fingerprint = true;
        this._capabilities.face = true;
      }
    } catch (error) {
      logger.error("Failed to initialize biometric capabilities", error);
    }
  }

  private async _checkBiometricAvailability(): Promise<boolean> {
    try {
      // Базовая проверка поддержки WebAuthn
      if (!window.PublicKeyCredential) {
        return false;
      }

      // Проверка доступности аутентификатора
      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (error) {
      logger.error("Biometric availability check failed", error);
      return false;
    }
  }

  private async _createBiometricCredential(
    userId: string
  ): Promise<PublicKeyCredential | null> {
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: "Normal Dance",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: userId,
            displayName: `User ${userId}`,
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred",
          },
          timeout: 60000,
          attestation: "direct",
        },
      });

      return credential as PublicKeyCredential;
    } catch (error) {
      logger.error("Failed to create biometric credential", error);
      return null;
    }
  }

  private async _detectBiometricType(): Promise<
    "fingerprint" | "face" | "voice" | "unknown"
  > {
    try {
      // В реальной реализации здесь может быть определение типа биометрии
      // через анализ ответа от аутентификатора

      // Упрощенная логика для демонстрации
      if (navigator.userAgent.includes("Touch ID")) {
        return "fingerprint";
      }

      if (navigator.userAgent.includes("Face ID")) {
        return "face";
      }

      return "unknown";
    } catch (error) {
      logger.error("Failed to detect biometric type", error);
      return "unknown";
    }
  }

  private async _storeCredentialId(
    userId: string,
    credentialId: string
  ): Promise<void> {
    const storageKey = `biometric_${userId}`;
    const encryptedData = await this._encryptData(credentialId);
    localStorage.setItem(storageKey, encryptedData);
  }

  private async _getStoredCredentialId(
    userId?: string
  ): Promise<string | null> {
    try {
      const storageUserId = userId || this._config.telegramUserId || "default";
      const storageKey = `biometric_${storageUserId}`;
      const encryptedData = localStorage.getItem(storageKey);

      if (!encryptedData) {
        return null;
      }

      return await this._decryptData(encryptedData);
    } catch (error) {
      logger.error("Failed to get stored credential ID", error);
      return null;
    }
  }

  private async _removeCredentialId(userId: string): Promise<void> {
    const storageKey = `biometric_${userId}`;
    localStorage.removeItem(storageKey);
  }

  private async _encryptData(data: string): Promise<string> {
    // В реальной реализации здесь должно быть шифрование данных
    // Для демонстрации используем простое кодирование
    return btoa(data);
  }

  private async _decryptData(encryptedData: string): Promise<string> {
    // В реальной реализации здесь должно быть расшифрование данных
    // Для демонстрации используем простое декодирование
    try {
      return atob(encryptedData);
    } catch (error) {
      return "";
    }
  }

  private _base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

/**
 * Утилиты для работы с биометрической аутентификацией
 */
export class BiometricAuthUtils {
  /**
   * Проверка поддержки биометрии в браузере
   */
  static async isSupported(): Promise<boolean> {
    try {
      return !!(
        window.PublicKeyCredential &&
        (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Получение информации о поддерживаемых методах
   */
  static async getSupportedMethods(): Promise<string[]> {
    const methods: string[] = [];

    if (await BiometricAuthUtils.isSupported()) {
      methods.push("platform-authenticator");

      // Проверка специфичных методов
      if (navigator.userAgent.includes("Touch ID")) {
        methods.push("touch-id");
      }

      if (navigator.userAgent.includes("Face ID")) {
        methods.push("face-id");
      }

      if (navigator.userAgent.includes("Windows Hello")) {
        methods.push("windows-hello");
      }
    }

    return methods;
  }

  /**
   * Проверка безопасности биометрической аутентификации
   */
  static async isSecure(): Promise<boolean> {
    try {
      // Проверка HTTPS
      if (window.location.protocol !== "https:") {
        return false;
      }

      // Проверка поддержки User Verification
      if (!window.PublicKeyCredential) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}
