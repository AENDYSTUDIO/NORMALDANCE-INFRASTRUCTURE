/**
 * 🔐 Sumsub Configuration - Настройки интеграции с Sumsub
 *
 * Конфигурация для подключения к Sumsub API и настройки уровней верификации
 */

export interface SumsubApiConfig {
  // Основные настройки API
  apiKey: string;
  secret: string;
  appId: string;
  apiUrl: string;
  webHookSecret?: string;

  // Настройки уровней верификации
  verificationLevels: {
    basic: {
      levelName: string;
      requiredDocs: string[];
      checks: string[];
    };
    standard: {
      levelName: string;
      requiredDocs: string[];
      checks: string[];
    };
    enhanced: {
      levelName: string;
      requiredDocs: string[];
      checks: string[];
    };
    enterprise: {
      levelName: string;
      requiredDocs: string[];
      checks: string[];
    };
  };

  // Настройки вебхуков
  webhooks: {
    enabled: boolean;
    endpoint: string;
    secret: string;
    allowedIps: string[];
  };

  // Настройки времени ожидания
  timeouts: {
    verification: number; // в секундах
    documentUpload: number; // в секундах
    apiRequest: number; // в миллисекундах
  };

  // Настройки повторных попыток
  retries: {
    maxAttempts: number;
    backoffMs: number;
  };
}

/**
 * Конфигурация по умолчанию для Sumsub
 */
export const DEFAULT_SUMSUB_CONFIG: SumsubApiConfig = {
  apiKey: process.env.SUMSUB_API_KEY || "",
  secret: process.env.SUMSUB_SECRET || "",
  appId: process.env.SUMSUB_APP_ID || "normaldance-kyc",
  apiUrl: process.env.SUMSUB_API_URL || "https://api.sumsub.com",
  webHookSecret: process.env.SUMSUB_WEBHOOK_SECRET,

  verificationLevels: {
    basic: {
      levelName: "basic-kyc",
      requiredDocs: ["SELFIE"],
      checks: ["email_verification", "phone_verification"],
    },
    standard: {
      levelName: "standard-kyc",
      requiredDocs: ["PASSPORT", "SELFIE"],
      checks: ["address_verification", "identity_verification"],
    },
    enhanced: {
      levelName: "enhanced-kyc",
      requiredDocs: ["PASSPORT", "SELFIE", "UTILITY_BILL"],
      checks: ["enhanced_due_diligence", "source_of_funds"],
    },
    enterprise: {
      levelName: "enterprise-kyc",
      requiredDocs: ["PASSPORT", "SELFIE", "UTILITY_BILL", "BANK_STATEMENT"],
      checks: [
        "corporate_verification",
        "ubo_verification",
        "enhanced_due_diligence",
      ],
    },
  },

  webhooks: {
    enabled: true,
    endpoint: "/api/kyc/sumsub/webhook",
    secret: process.env.SUMSUB_WEBHOOK_SECRET || "default-webhook-secret",
    allowedIps: ["0.0.0.0/0", "::1"], // localhost и IPv6 localhost
  },

  timeouts: {
    verification: 300, // 5 минут
    documentUpload: 120, // 2 минуты
    apiRequest: 10000, // 10 секунд
  },

  retries: {
    maxAttempts: 3,
    backoffMs: 1000, // 1 секунда
  },
};

/**
 * Валидация конфигурации Sumsub
 */
export function validateSumsubConfig(config: Partial<SumsubApiConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Проверка обязательных полей
  if (!config.apiKey || config.apiKey.trim() === "") {
    errors.push("Sumsub API key is required");
  }

  if (!config.secret || config.secret.trim() === "") {
    errors.push("Sumsub secret is required");
  }

  if (!config.appId || config.appId.trim() === "") {
    errors.push("Sumsub app ID is required");
  }

  if (!config.apiUrl || config.apiUrl.trim() === "") {
    errors.push("Sumsub API URL is required");
  }

  // Валидация URL
  if (config.apiUrl) {
    try {
      new URL(config.apiUrl);
    } catch {
      errors.push("Invalid Sumsub API URL format");
    }
  }

  // Валидация уровней верификации
  if (config.verificationLevels) {
    const requiredLevels = ["basic", "standard", "enhanced", "enterprise"];
    const providedLevels = Object.keys(config.verificationLevels);

    for (const level of requiredLevels) {
      if (!providedLevels.includes(level)) {
        errors.push(`Missing verification level: ${level}`);
      }
    }

    // Валидация каждого уровня
    for (const [levelName, levelConfig] of Object.entries(
      config.verificationLevels
    )) {
      if (!levelConfig.levelName || levelConfig.levelName.trim() === "") {
        errors.push(`Level name is required for ${levelName}`);
      }

      if (
        !levelConfig.requiredDocs ||
        !Array.isArray(levelConfig.requiredDocs)
      ) {
        errors.push(`Required documents must be an array for ${levelName}`);
      }

      if (!levelConfig.checks || !Array.isArray(levelConfig.checks)) {
        errors.push(`Checks must be an array for ${levelName}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Получение конфигурации Sumsub из переменных окружения
 */
export function getSumsubConfig(): SumsubApiConfig {
  const config: Partial<SumsubApiConfig> = {
    apiKey: process.env.SUMSUB_API_KEY,
    secret: process.env.SUMSUB_SECRET,
    appId: process.env.SUMSUB_APP_ID,
    apiUrl: process.env.SUMSUB_API_URL,
    webHookSecret: process.env.SUMSUB_WEBHOOK_SECRET,
  };

  // Добавляем уровни верификации если они настроены
  if (process.env.SUMSUB_BASIC_LEVEL_NAME) {
    config.verificationLevels = {
      basic: {
        levelName: process.env.SUMSUB_BASIC_LEVEL_NAME,
        requiredDocs: process.env.SUMSUB_BASIC_REQUIRED_DOCS?.split(",") || [
          "SELFIE",
        ],
        checks: process.env.SUMSUB_BASIC_CHECKS?.split(",") || [
          "email_verification",
          "phone_verification",
        ],
      },
      standard: {
        levelName: process.env.SUMSUB_STANDARD_LEVEL_NAME || "standard-kyc",
        requiredDocs: process.env.SUMSUB_STANDARD_REQUIRED_DOCS?.split(",") || [
          "PASSPORT",
          "SELFIE",
        ],
        checks: process.env.SUMSUB_STANDARD_CHECKS?.split(",") || [
          "address_verification",
          "identity_verification",
        ],
      },
      enhanced: {
        levelName: process.env.SUMSUB_ENHANCED_LEVEL_NAME || "enhanced-kyc",
        requiredDocs: process.env.SUMSUB_ENHANCED_REQUIRED_DOCS?.split(",") || [
          "PASSPORT",
          "SELFIE",
          "UTILITY_BILL",
        ],
        checks: process.env.SUMSUB_ENHANCED_CHECKS?.split(",") || [
          "enhanced_due_diligence",
          "source_of_funds",
        ],
      },
      enterprise: {
        levelName: process.env.SUMSUB_ENTERPRISE_LEVEL_NAME || "enterprise-kyc",
        requiredDocs: process.env.SUMSUB_ENTERPRISE_REQUIRED_DOCS?.split(
          ","
        ) || ["PASSPORT", "SELFIE", "UTILITY_BILL", "BANK_STATEMENT"],
        checks: process.env.SUMSUB_ENTERPRISE_CHECKS?.split(",") || [
          "corporate_verification",
          "ubo_verification",
          "enhanced_due_diligence",
        ],
      },
    };
  }

  return { ...DEFAULT_SUMSUB_CONFIG, ...config } as SumsubApiConfig;
}
