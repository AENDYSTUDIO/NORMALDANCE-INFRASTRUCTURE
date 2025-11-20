import { logger } from "@/lib/utils/logger";
import { Transaction } from "@solana/web3.js";
import { InvisibleWalletConfig } from "./invisible-wallet-adapter";

/**
 * Результат проверки безопасности
 */
export interface SecurityCheckResult {
  secure: boolean;
  issues: string[];
  recommendations: string[];
  riskLevel: "low" | "medium" | "high";
}

/**
 * Метаданные сессии
 */
export interface SessionMetadata {
  sessionId: string;
  userId: string;
  deviceFingerprint: string;
  createdAt: number;
  lastActivity: number;
  isActive: boolean;
}

/**
 * Менеджер безопасности для невидимого кошелька
 *
 * Ответственности:
 * - Валидация транзакций
 * - Проверка безопасности устройства
 * - Управление сессиями
 * - Защита от атак
 */
export class SecurityManager {
  private _config: InvisibleWalletConfig;
  private _sessionMetadata: SessionMetadata | null = null;
  private _deviceFingerprint: string;

  constructor(config: InvisibleWalletConfig) {
    this._config = config;
    this._deviceFingerprint = this._generateDeviceFingerprint();
  }

  /**
   * Валидация транзакции
   */
  async validateTransaction(
    transaction: Transaction,
    userId: string
  ): Promise<boolean> {
    try {
      // 1. Проверка базовой валидности транзакции
      if (!this._isValidTransactionStructure(transaction)) {
        throw new Error("Invalid transaction structure");
      }

      // 2. Проверка на аномалии
      const anomalyCheck = await this._detectTransactionAnomalies(
        transaction,
        userId
      );
      if (anomalyCheck.isAnomalous) {
        logger.warn("Anomalous transaction detected", {
          userId,
          reasons: anomalyCheck.reasons,
        });

        // В production здесь может быть дополнительная проверка
        // или требование дополнительного подтверждения
        return false;
      }

      // 3. Проверка лимитов
      const limitCheck = await this._checkTransactionLimits(
        transaction,
        userId
      );
      if (!limitCheck.withinLimits) {
        logger.warn("Transaction exceeds limits", {
          userId,
          limits: limitCheck.exceededLimits,
        });
        return false;
      }

      // 4. Anti-phishing проверка
      const phishingCheck = await this._checkPhishing(transaction);
      if (phishingCheck.isPhishing) {
        logger.error("Phishing transaction detected", {
          userId,
          suspiciousAddresses: phishingCheck.suspiciousAddresses,
        });
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Transaction validation failed", error);
      return false;
    }
  }

  /**
   * Выполнение проверки безопасности устройства
   */
  async performSecurityCheck(): Promise<SecurityCheckResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // 1. Проверка HTTPS
      if (!this._isSecureConnection()) {
        issues.push("Insecure connection detected");
        recommendations.push("Use HTTPS connection");
      }

      // 2. Проверка браузера
      const browserCheck = this._checkBrowserSecurity();
      if (!browserCheck.secure) {
        issues.push(...browserCheck.issues);
        recommendations.push(...browserCheck.recommendations);
      }

      // 3. Проверка на подозрительные расширения
      const extensionCheck = await this._checkBrowserExtensions();
      if (!extensionCheck.secure) {
        issues.push(...extensionCheck.issues);
        recommendations.push(...extensionCheck.recommendations);
      }

      // 4. Проверка времени сессии
      const sessionCheck = this._checkSessionSecurity();
      if (!sessionCheck.secure) {
        issues.push(...sessionCheck.issues);
        recommendations.push(...sessionCheck.recommendations);
      }

      // 5. Проверка геолокации (если доступна)
      const geoCheck = await this._checkGeolocationSecurity();
      if (!geoCheck.secure) {
        issues.push(...geoCheck.issues);
        recommendations.push(...geoCheck.recommendations);
      }

      const riskLevel = this._calculateRiskLevel(issues);

      return {
        secure: issues.length === 0,
        issues,
        recommendations,
        riskLevel,
      };
    } catch (error) {
      logger.error("Security check failed", error);
      return {
        secure: false,
        issues: ["Security check failed"],
        recommendations: ["Try again later"],
        riskLevel: "high",
      };
    }
  }

  /**
   * Создание сессии
   */
  async createSession(userId: string): Promise<string> {
    const sessionId = this._generateSessionId();

    this._sessionMetadata = {
      sessionId,
      userId,
      deviceFingerprint: this._deviceFingerprint,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isActive: true,
    };

    // Сохранение метаданных сессии
    await this._storeSessionMetadata(this._sessionMetadata);

    logger.info("Session created", { userId, sessionId });
    return sessionId;
  }

  /**
   * Валидация сессии
   */
  async validateSession(sessionId: string): Promise<boolean> {
    try {
      const sessionData = await this._retrieveSessionMetadata(sessionId);

      if (!sessionData) {
        return false;
      }

      // Проверка времени жизни сессии (24 часа)
      const sessionAge = Date.now() - sessionData.lastActivity;
      if (sessionAge > 24 * 60 * 60 * 1000) {
        await this.clearSession();
        return false;
      }

      // Проверка fingerprint устройства
      if (sessionData.deviceFingerprint !== this._deviceFingerprint) {
        logger.warn("Device fingerprint mismatch", {
          expected: sessionData.deviceFingerprint,
          actual: this._deviceFingerprint,
        });
        await this.clearSession();
        return false;
      }

      // Обновление времени последней активности
      sessionData.lastActivity = Date.now();
      await this._storeSessionMetadata(sessionData);

      return true;
    } catch (error) {
      logger.error("Session validation failed", error);
      return false;
    }
  }

  /**
   * Очистка сессии
   */
  async clearSession(): Promise<void> {
    if (this._sessionMetadata) {
      await this._removeSessionMetadata(this._sessionMetadata.sessionId);
      this._sessionMetadata = null;
    }
  }

  /**
   * Проверка rate limiting
   */
  async checkRateLimit(
    userId: string
  ): Promise<{ allowed: boolean; resetTime?: number }> {
    const rateLimitKey = `rate_limit_${userId}`;
    const now = Date.now();

    try {
      const rateLimitData = localStorage.getItem(rateLimitKey);

      if (!rateLimitData) {
        // Первая транзакция
        const newLimitData = {
          count: 1,
          windowStart: now,
          windowEnd: now + 60000, // 1 минута
        };
        localStorage.setItem(rateLimitKey, JSON.stringify(newLimitData));
        return { allowed: true };
      }

      const limitData = JSON.parse(rateLimitData);

      // Проверка окна времени
      if (now > limitData.windowEnd) {
        // Новое окно
        const newLimitData = {
          count: 1,
          windowStart: now,
          windowEnd: now + 60000,
        };
        localStorage.setItem(rateLimitKey, JSON.stringify(newLimitData));
        return { allowed: true };
      }

      // Проверка лимита (10 транзакций в минуту)
      if (limitData.count >= 10) {
        return {
          allowed: false,
          resetTime: limitData.windowEnd,
        };
      }

      // Увеличение счетчика
      limitData.count++;
      localStorage.setItem(rateLimitKey, JSON.stringify(limitData));
      return { allowed: true };
    } catch (error) {
      logger.error("Rate limit check failed", error);
      return { allowed: true }; // Fail open
    }
  }

  // Приватные методы

  private _generateDeviceFingerprint(): string {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("Device fingerprint", 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join("|");

    return this._hashString(fingerprint);
  }

  private _hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  private _generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private _isValidTransactionStructure(transaction: Transaction): boolean {
    // Базовая проверка структуры транзакции
    return (
      transaction &&
      Array.isArray(transaction.instructions) &&
      transaction.feePayer !== undefined
    );
  }

  private async _detectTransactionAnomalies(
    transaction: Transaction,
    userId: string
  ): Promise<{ isAnomalous: boolean; reasons: string[] }> {
    const reasons: string[] = [];

    // 1. Проверка размера транзакции
    if (transaction.instructions.length > 10) {
      reasons.push("Too many instructions");
    }

    // 2. Проверка на необычные адреса
    const suspiciousAddresses = await this._getSuspiciousAddresses();
    for (const instruction of transaction.instructions) {
      // Здесь должна быть проверка адресов в инструкции
      // на наличие в черном списке
    }

    // 3. Проверка частоты транзакций
    const frequencyCheck = await this._checkTransactionFrequency(userId);
    if (!frequencyCheck.normal) {
      reasons.push("High transaction frequency");
    }

    return {
      isAnomalous: reasons.length > 0,
      reasons,
    };
  }

  private async _checkTransactionLimits(
    transaction: Transaction,
    userId: string
  ): Promise<{ withinLimits: boolean; exceededLimits: string[] }> {
    const exceededLimits: string[] = [];

    // Здесь должна быть проверка лимитов транзакций
    // на основе пользовательских настроек и системных лимитов

    return {
      withinLimits: exceededLimits.length === 0,
      exceededLimits,
    };
  }

  private async _checkPhishing(
    transaction: Transaction
  ): Promise<{ isPhishing: boolean; suspiciousAddresses: string[] }> {
    const suspiciousAddresses: string[] = [];

    // Здесь должна быть проверка адресов на наличие в базах данных фишинга
    // и использование алгоритмов машинного обучения для обнаружения

    return {
      isPhishing: suspiciousAddresses.length > 0,
      suspiciousAddresses,
    };
  }

  private _isSecureConnection(): boolean {
    return (
      typeof window !== "undefined" && window.location.protocol === "https:"
    );
  }

  private _checkBrowserSecurity(): {
    secure: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Проверка на устаревшие браузеры
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Chrome/")) {
      const match = userAgent.match(/Chrome\/(\d+)/);
      if (match && parseInt(match[1]) < 90) {
        issues.push("Outdated Chrome browser");
        recommendations.push("Update Chrome browser");
      }
    }

    return {
      secure: issues.length === 0,
      issues,
      recommendations,
    };
  }

  private async _checkBrowserExtensions(): Promise<{
    secure: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    // В реальной реализации здесь может быть проверка на подозрительные расширения
    return {
      secure: true,
      issues: [],
      recommendations: [],
    };
  }

  private _checkSessionSecurity(): {
    secure: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!this._sessionMetadata) {
      issues.push("No active session");
      recommendations.push("Create new session");
    }

    return {
      secure: issues.length === 0,
      issues,
      recommendations,
    };
  }

  private async _checkGeolocationSecurity(): Promise<{
    secure: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    // В реальной реализации здесь может быть проверка геолокации
    return {
      secure: true,
      issues: [],
      recommendations: [],
    };
  }

  private _calculateRiskLevel(issues: string[]): "low" | "medium" | "high" {
    if (issues.length === 0) return "low";
    if (issues.length <= 2) return "medium";
    return "high";
  }

  private async _getSuspiciousAddresses(): Promise<string[]> {
    // В реальной реализации здесь должен быть запрос к базе данных
    // подозрительных адресов
    return [];
  }

  private async _checkTransactionFrequency(userId: string): Promise<{
    normal: boolean;
  }> {
    // Проверка частоты транзакций для пользователя
    return { normal: true };
  }

  private async _storeSessionMetadata(
    metadata: SessionMetadata
  ): Promise<void> {
    const storageKey = `session_${metadata.sessionId}`;
    localStorage.setItem(storageKey, JSON.stringify(metadata));
  }

  private async _retrieveSessionMetadata(
    sessionId: string
  ): Promise<SessionMetadata | null> {
    try {
      const storageKey = `session_${sessionId}`;
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error("Failed to retrieve session metadata", error);
      return null;
    }
  }

  private async _removeSessionMetadata(sessionId: string): Promise<void> {
    const storageKey = `session_${sessionId}`;
    localStorage.removeItem(storageKey);
  }
}
