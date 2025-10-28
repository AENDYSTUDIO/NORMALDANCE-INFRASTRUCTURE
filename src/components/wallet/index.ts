// Экспорт всех компонентов невидимого кошелька
export { BiometricAuth, BiometricAuthUtils } from "./biometric-auth";
export { InvisibleWalletAdapter } from "./invisible-wallet-adapter";
export { KeyManager } from "./key-manager";
export { MigrationPath, MigrationUtils } from "./migration-path";
export {
  MultiChainTransactionAbstraction,
  MultiChainUtils,
} from "./multi-chain-transaction-abstraction";
export { OfflineManager } from "./offline-manager";
export { SecurityManager } from "./security-manager";
export {
  TelegramStarsManager,
  TelegramStarsUtils,
} from "./telegram-stars-manager";
export {
  WalletIntegration,
  WalletIntegrationUtils,
} from "./wallet-integration";

// Экспорт типов
export type {
  AnalyticsEvent,
  AnalyticsEventType,
  BaseTransaction,
  ChainConfig,
  DisclosureConfig,
  DisclosureLevel,
  ErrorData,
  IntegrationStatus,
  InvisibleWalletConfig,
  InvisibleWalletEvent,
  InvisibleWalletState,
  MigrationData,
  MigrationResult,
  MigrationStatus,
  MigrationStep,
  PerformanceMetrics,
  SupportedChain,
  TransactionResult,
  TransactionStatus,
  TransactionType,
  UsageMetrics,
  WalletInfo,
  WalletIntegrationConfig,
  WalletSwitchResult,
  WalletType,
} from "./invisible-wallet-adapter";

// Реэкспорт из существующего wallet-adapter
export {
  WalletConnectionError,
  WalletDisconnectionError,
  WalletEvent,
  WalletEventEmitter,
  WalletSignMessageError,
  WalletTransactionError,
  createAutoWalletAdapter,
  createConnection,
  createPhantomWallet,
  createTransaction,
  createWalletAdapter,
  formatAddress,
  formatSol,
  formatTokens,
  isValidAddress,
  lamportsToSol,
  solToLamports,
  useSolanaWallet,
  walletEmitter,
} from "./wallet-adapter";

// Экспорт Progressive Disclosure UI
export { default as ProgressiveDisclosureUI } from "./progressive-disclosure-ui";
export type { ProgressiveDisclosureUIProps } from "./progressive-disclosure-ui";

// Экспорт Monitoring и Analytics
export { MonitoringAnalytics, MonitoringUtils } from "./monitoring-analytics";

// Утилиты для работы с невидимым кошельком
export class InvisibleWalletUtils {
  /**
   * Создание полной конфигурации невидимого кошелька
   */
  static createFullConfig(
    overrides: Partial<InvisibleWalletConfig> = {}
  ): InvisibleWalletConfig {
    return {
      // Telegram интеграция
      telegramUserId: overrides.telegramUserId,
      telegramInitData: overrides.telegramInitData,

      // Безопасность
      enableBiometric: overrides.enableBiometric ?? true,
      enableSocialRecovery: overrides.enableSocialRecovery ?? true,
      trustedContacts: overrides.trustedContacts ?? [],

      // Multi-chain поддержка
      supportedChains: overrides.supportedChains ?? [
        "solana",
        "ethereum",
        "ton",
      ],

      // Оффлайн режим
      enableOffline: overrides.enableOffline ?? true,
      cacheDuration: overrides.cacheDuration ?? 300000,

      // Мониторинг
      enableAnalytics: overrides.enableAnalytics ?? true,
      analyticsEndpoint: overrides.analyticsEndpoint,

      ...overrides,
    };
  }

  /**
   * Валидация конфигурации
   */
  static validateConfig(config: InvisibleWalletConfig): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Обязательные поля
    if (!config.telegramUserId && !config.telegramInitData) {
      errors.push("Either telegramUserId or telegramInitData is required");
    }

    // Валидация контактов для социального восстановления
    if (
      config.enableSocialRecovery &&
      (!config.trustedContacts || config.trustedContacts.length < 3)
    ) {
      warnings.push(
        "At least 3 trusted contacts recommended for social recovery"
      );
    }

    // Валидация поддерживаемых цепей
    if (config.supportedChains && config.supportedChains.length === 0) {
      warnings.push("No supported chains specified");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Получение метаданных окружения
   */
  static getEnvironmentMetadata(): {
    isTelegram: boolean;
    isMobile: boolean;
    isSecure: boolean;
    userAgent: string;
    platform: string;
  } {
    const isTelegram =
      typeof window !== "undefined" &&
      "Telegram" in window &&
      "WebApp" in (window as any).Telegram;

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    const isSecure =
      typeof window !== "undefined" && window.location.protocol === "https:";

    return {
      isTelegram,
      isMobile,
      isSecure,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    };
  }

  /**
   * Определение оптимальных настроек
   */
  static getOptimalSettings(): Partial<InvisibleWalletConfig> {
    const env = this.getEnvironmentMetadata();

    const settings: Partial<InvisibleWalletConfig> = {
      // В Telegram WebApp включаем все оптимизации
      enableOffline: env.isTelegram,
      enableBiometric: env.isMobile,

      // На мобильных устройствах более агрессивное кэширование
      cacheDuration: env.isMobile ? 600000 : 300000, // 10 минут vs 5 минут

      // В Telegram включаем аналитику
      enableAnalytics: env.isTelegram,
    };

    // Если не HTTPS - отключаем чувствительные функции
    if (!env.isSecure) {
      settings.enableBiometric = false;
      settings.enableSocialRecovery = false;
    }

    return settings;
  }

  /**
   * Создание отчета о состоянии кошелька
   */
  static generateWalletReport(
    walletInfo: WalletInfo,
    config: InvisibleWalletConfig
  ): string {
    const report = {
      timestamp: new Date().toISOString(),
      wallet: {
        type: walletInfo.type,
        publicKey: walletInfo.publicKey,
        connected: walletInfo.connected,
        balance: walletInfo.balance,
        network: walletInfo.network,
      },
      config: {
        enableBiometric: config.enableBiometric,
        enableSocialRecovery: config.enableSocialRecovery,
        supportedChains: config.supportedChains,
        enableOffline: config.enableOffline,
        enableAnalytics: config.enableAnalytics,
      },
      environment: this.getEnvironmentMetadata(),
      security: {
        hasBiometric: config.enableBiometric,
        hasSocialRecovery: config.enableSocialRecovery,
        trustedContactsCount: config.trustedContacts?.length || 0,
      },
      features: {
        invisibleWallet: walletInfo.type === "invisible",
        multiChain: (config.supportedChains?.length || 0) > 1,
        offlineMode: config.enableOffline,
        telegramIntegration: !!config.telegramUserId,
        biometricAuth: config.enableBiometric,
      },
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Расчет метрик безопасности
   */
  static calculateSecurityScore(config: InvisibleWalletConfig): {
    score: number;
    level: "low" | "medium" | "high" | "maximum";
    recommendations: string[];
  } {
    let score = 0;
    const recommendations: string[] = [];

    // Биометрическая аутентификация
    if (config.enableBiometric) {
      score += 25;
    } else {
      recommendations.push(
        "Enable biometric authentication for enhanced security"
      );
    }

    // Социальное восстановление
    if (
      config.enableSocialRecovery &&
      config.trustedContacts &&
      config.trustedContacts.length >= 3
    ) {
      score += 25;
    } else {
      recommendations.push(
        "Set up social recovery with at least 3 trusted contacts"
      );
    }

    // Multi-chain поддержка
    if (config.supportedChains && config.supportedChains.length > 1) {
      score += 15;
    }

    // Оффлайн режим
    if (config.enableOffline) {
      score += 15;
    }

    // Telegram интеграция
    if (config.telegramUserId) {
      score += 10;
    }

    // Аналитика для мониторинга
    if (config.enableAnalytics) {
      score += 10;
    }

    let level: "low" | "medium" | "high" | "maximum" = "low";
    if (score >= 80) level = "maximum";
    else if (score >= 60) level = "high";
    else if (score >= 40) level = "medium";

    return {
      score,
      level,
      recommendations,
    };
  }

  /**
   * Проверка готовности к миграции
   */
  static checkMigrationReadiness(
    currentWallet: WalletInfo,
    targetConfig: InvisibleWalletConfig
  ): {
    ready: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Проверка баланса
    if (currentWallet.balance > 0) {
      recommendations.push("Consider transferring balance before migration");
    }

    // Проверка сети
    if (currentWallet.network !== "devnet") {
      recommendations.push("Test migration on devnet first");
    }

    // Проверка конфигурации
    const configValidation = this.validateConfig(targetConfig);
    if (!configValidation.valid) {
      issues.push(...configValidation.errors);
    }

    return {
      ready: issues.length === 0,
      issues,
      recommendations: [...recommendations, ...configValidation.warnings],
    };
  }
}

// Константы для невидимого кошелька
export const INVISIBLE_WALLET_CONSTANTS = {
  // Версия
  VERSION: "1.0.0",

  // Лимиты
  MAX_TRUSTED_CONTACTS: 10,
  MIN_SOCIAL_RECOVERY_CONTACTS: 3,
  MAX_CACHE_DURATION: 3600000, // 1 час
  MIN_CACHE_DURATION: 60000, // 1 минута

  // Комиссии
  DEFAULT_BURN_PERCENTAGE: 2, // 2%
  DEFAULT_STAKING_REWARD_PERCENTAGE: 20, // 20% от сжигания
  DEFAULT_TREASURY_PERCENTAGE: 30, // 30% от сжигания

  // Таймауты
  TRANSACTION_TIMEOUT: 60000, // 30 секунд
  BIOMETRIC_TIMEOUT: 10000, // 10 секунд
  MIGRATION_TIMEOUT: 300000, // 5 минут

  // Размеры
  MAX_TRANSACTION_BATCH_SIZE: 50,
  MAX_OFFLINE_STORAGE_SIZE: 10 * 1024 * 1024, // 10MB

  // URL
  DEFAULT_ANALYTICS_ENDPOINT: "/api/analytics",
  DEFAULT_TELEGRAM_BOT_API: "https://api.telegram.org/bot",

  // Коды ошибок
  ERROR_CODES: {
    WALLET_NOT_CONNECTED: "WALLET_NOT_CONNECTED",
    INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
    TRANSACTION_TIMEOUT: "TRANSACTION_TIMEOUT",
    BIOMETRIC_FAILED: "BIOMETRIC_FAILED",
    MIGRATION_FAILED: "MIGRATION_FAILED",
    NETWORK_ERROR: "NETWORK_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
  },
} as const;

// Экспорт констант
export { INVISIBLE_WALLET_CONSTANTS };
