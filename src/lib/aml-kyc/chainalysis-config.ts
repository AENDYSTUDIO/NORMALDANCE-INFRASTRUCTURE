/**
 * ⚙️ Chainalysis Configuration - Blockchain Analytics Setup
 *
 * Конфигурация для интеграции с Chainalysis API
 * и настройки анализа блокчейн-транзакций
 */

import { ChainalysisConfig } from "./chainalysis-types";

/**
 * Конфигурация по умолчанию для Chainalysis
 */
export const DEFAULT_CHAINALYSIS_CONFIG: Partial<ChainalysisConfig> = {
  environment: "SANDBOX", // Используем песочницу для разработки
  timeout: 30000, // 30 секунд
  retryAttempts: 3,
  retryDelay: 1000, // 1 секунда
  monitoringEnabled: true,
  riskThresholds: {
    LOW: 25,
    MEDIUM: 50,
    HIGH: 75,
    SEVERE: 90,
  },
};

/**
 * URL-адреса API для разных сред
 */
export const CHAINALYSIS_API_URLS = {
  SANDBOX: "https://api.sandbox.chainalysis.com",
  PRODUCTION: "https://api.chainalysis.com",
} as const;

/**
 * Эндпоинты API Chainalysis
 */
export const CHAINALYSIS_API_ENDPOINTS = {
  // Анализ адресов
  ADDRESS_ANALYSIS: "/api/kyt/v2/address",
  ADDRESS_RISK: "/api/kyt/v2/address/risk",
  ADDRESS_EXPOSURE: "/api/kyt/v2/address/exposure",

  // Анализ транзакций
  TRANSACTION_ANALYSIS: "/api/kyt/v2/transaction",
  TRANSACTION_RISK: "/api/kyt/v2/transaction/risk",

  // Мониторинг
  MONITORING_RULES: "/api/kyt/v2/rules",
  MONITORING_EVENTS: "/api/kyt/v2/events",
  MONITORING_WEBHOOKS: "/api/kyt/v2/webhooks",

  // Отчеты
  REPORTS: "/api/kyt/v2/reports",
  REPORT_GENERATE: "/api/kyt/v2/reports/generate",

  // Портфельный анализ
  PORTFOLIO_ANALYSIS: "/api/kyt/v2/portfolio",
  PORTFOLIO_RISK: "/api/kyt/v2/portfolio/risk",
} as const;

/**
 * Маппинг активов для Chainalysis
 */
export const CHAINALYSIS_ASSET_MAPPING = {
  SOL: "SOL",
  BTC: "BTC",
  ETH: "ETH",
  USDC: "USDC",
  USDT: "USDT",
  DAI: "DAI",
} as const;

/**
 * Маппинг уровней риска из Chainalysis в AML
 */
export const CHAINALYSIS_TO_AML_RISK_MAPPING = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  SEVERE: "CRITICAL",
} as const;

/**
 * Маппинг категорий риска
 */
export const CHAINALYSIS_CATEGORY_RISK_MAPPING = {
  EXCHANGE: { risk: "LOW", weight: 10 },
  WALLET: { risk: "LOW", weight: 5 },
  MINING: { risk: "MEDIUM", weight: 20 },
  MARKETPLACE: { risk: "MEDIUM", weight: 30 },
  GAMBLING: { risk: "HIGH", weight: 60 },
  MIXER: { risk: "HIGH", weight: 80 },
  SCAM: { risk: "SEVERE", weight: 95 },
  ILLEGAL: { risk: "SEVERE", weight: 100 },
  OTHER: { risk: "MEDIUM", weight: 25 },
} as const;

/**
 * Правила мониторинга по умолчанию
 */
export const DEFAULT_CHAINALYSIS_MONITORING_RULES = [
  {
    name: "High Risk Address Detection",
    description: "Обнаружение адресов с высоким уровнем риска",
    conditions: [
      {
        field: "risk" as const,
        operator: "GREATER_THAN" as const,
        value: 75,
        weight: 100,
      },
    ],
    actions: [
      {
        type: "ALERT" as const,
        parameters: { priority: "HIGH" },
      },
      {
        type: "FLAG" as const,
      },
    ],
  },
  {
    name: "Mixer/Tumbler Detection",
    description: "Обнаружение транзакций через миксеры",
    conditions: [
      {
        field: "category" as const,
        operator: "CONTAINS" as const,
        value: "MIXER",
        weight: 100,
      },
    ],
    actions: [
      {
        type: "ALERT" as const,
        parameters: { priority: "CRITICAL" },
      },
      {
        type: "BLOCK" as const,
      },
      {
        type: "REPORT" as const,
      },
    ],
  },
  {
    name: "High Value Transaction",
    description: "Обнаружение транзакций с большой суммой",
    conditions: [
      {
        field: "amount" as const,
        operator: "GREATER_THAN" as const,
        value: 100000, // $100,000
        weight: 50,
      },
    ],
    actions: [
      {
        type: "ALERT" as const,
        parameters: { priority: "MEDIUM" },
      },
      {
        type: "FLAG" as const,
      },
    ],
  },
  {
    name: "Illegal Activity Detection",
    description: "Обнаружение связей с незаконной деятельностью",
    conditions: [
      {
        field: "category" as const,
        operator: "CONTAINS" as const,
        value: "ILLEGAL",
        weight: 100,
      },
    ],
    actions: [
      {
        type: "ALERT" as const,
        parameters: { priority: "CRITICAL" },
      },
      {
        type: "BLOCK" as const,
      },
      {
        type: "REPORT" as const,
      },
    ],
  },
];

/**
 * Получение конфигурации Chainalysis из переменных окружения
 */
export function getChainalysisConfig(): ChainalysisConfig {
  const environment =
    (process.env.CHAINALYSIS_ENVIRONMENT as "SANDBOX" | "PRODUCTION") ||
    "SANDBOX";

  return {
    apiKey: process.env.CHAINALYSIS_API_KEY || "",
    apiSecret: process.env.CHAINALYSIS_API_SECRET || "",
    apiUrl: CHAINALYSIS_API_URLS[environment],
    environment,
    timeout: parseInt(process.env.CHAINALYSIS_TIMEOUT || "30000"),
    retryAttempts: parseInt(process.env.CHAINALYSIS_RETRY_ATTEMPTS || "3"),
    retryDelay: parseInt(process.env.CHAINALYSIS_RETRY_DELAY || "1000"),
    webhookSecret: process.env.CHAINALYSIS_WEBHOOK_SECRET,
    monitoringEnabled: process.env.CHAINALYSIS_MONITORING_ENABLED !== "false",
    riskThresholds: {
      LOW: parseInt(process.env.CHAINALYSIS_RISK_THRESHOLD_LOW || "25"),
      MEDIUM: parseInt(process.env.CHAINALYSIS_RISK_THRESHOLD_MEDIUM || "50"),
      HIGH: parseInt(process.env.CHAINALYSIS_RISK_THRESHOLD_HIGH || "75"),
      SEVERE: parseInt(process.env.CHAINALYSIS_RISK_THRESHOLD_SEVERE || "90"),
    },
  };
}

/**
 * Валидация конфигурации Chainalysis
 */
export function validateChainalysisConfig(config: ChainalysisConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push("API ключ Chainalysis не указан");
  }

  if (!config.apiSecret) {
    errors.push("API секрет Chainalysis не указан");
  }

  if (!config.apiUrl) {
    errors.push("URL API Chainalysis не указан");
  }

  if (config.timeout <= 0) {
    errors.push("Таймаут должен быть положительным числом");
  }

  if (config.retryAttempts < 0) {
    errors.push("Количество попыток повтора не может быть отрицательным");
  }

  if (config.retryDelay < 0) {
    errors.push("Задержка между попытками не может быть отрицательной");
  }

  if (config.riskThresholds.LOW < 0 || config.riskThresholds.LOW > 100) {
    errors.push("Порог риска LOW должен быть в диапазоне 0-100");
  }

  if (config.riskThresholds.MEDIUM < 0 || config.riskThresholds.MEDIUM > 100) {
    errors.push("Порог риска MEDIUM должен быть в диапазоне 0-100");
  }

  if (config.riskThresholds.HIGH < 0 || config.riskThresholds.HIGH > 100) {
    errors.push("Порог риска HIGH должен быть в диапазоне 0-100");
  }

  if (config.riskThresholds.SEVERE < 0 || config.riskThresholds.SEVERE > 100) {
    errors.push("Порог риска SEVERE должен быть в диапазоне 0-100");
  }

  // Проверка логической последовательности порогов
  if (config.riskThresholds.LOW >= config.riskThresholds.MEDIUM) {
    errors.push("Порог риска LOW должен быть меньше MEDIUM");
  }

  if (config.riskThresholds.MEDIUM >= config.riskThresholds.HIGH) {
    errors.push("Порог риска MEDIUM должен быть меньше HIGH");
  }

  if (config.riskThresholds.HIGH >= config.riskThresholds.SEVERE) {
    errors.push("Порог риска HIGH должен быть меньше SEVERE");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Получение URL API для эндпоинта
 */
export function getChainalysisApiUrl(
  endpoint: keyof typeof CHAINALYSIS_API_ENDPOINTS
): string {
  const config = getChainalysisConfig();
  return `${config.apiUrl}${CHAINALYSIS_API_ENDPOINTS[endpoint]}`;
}

/**
 * Преобразование уровня риска Chainalysis в AML
 */
export function mapChainalysisRiskToAML(
  risk: string
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  return (
    CHAINALYSIS_TO_AML_RISK_MAPPING[
      risk as keyof typeof CHAINALYSIS_TO_AML_RISK_MAPPING
    ] || "MEDIUM"
  );
}

/**
 * Получение веса риска для категории
 */
export function getCategoryRiskWeight(category: string): number {
  const mapping =
    CHAINALYSIS_CATEGORY_RISK_MAPPING[
      category as keyof typeof CHAINALYSIS_CATEGORY_RISK_MAPPING
    ];
  return mapping?.weight || 25;
}

/**
 * Получение уровня риска для категории
 */
export function getCategoryRiskLevel(
  category: string
): "LOW" | "MEDIUM" | "HIGH" | "SEVERE" {
  const mapping =
    CHAINALYSIS_CATEGORY_RISK_MAPPING[
      category as keyof typeof CHAINALYSIS_CATEGORY_RISK_MAPPING
    ];
  return mapping?.risk || "MEDIUM";
}
