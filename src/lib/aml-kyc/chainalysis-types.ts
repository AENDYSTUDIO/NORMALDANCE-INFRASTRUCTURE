/**
 * 🔗 Chainalysis API Types - Blockchain Analytics Integration
 *
 * Типы и интерфейсы для интеграции с Chainalysis API
 * для анализа блокчейн-транзакций и адресов
 */

// ============================================================================
// Базовые типы Chainalysis API
// ============================================================================

/**
 * Уровни риска Chainalysis
 */
export type ChainalysisRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "SEVERE";

/**
 * Категории адресов Chainalysis
 */
export type ChainalysisCategory =
  | "EXCHANGE"
  | "GAMBLING"
  | "ILLEGAL"
  | "MIXER"
  | "MARKETPLACE"
  | "MINING"
  | "SCAM"
  | "WALLET"
  | "OTHER";

/**
 * Типы активов Chainalysis
 */
export type ChainalysisAsset =
  | "BTC"
  | "ETH"
  | "SOL"
  | "USDT"
  | "USDC"
  | "DAI"
  | "OTHER";

/**
 * Статусы анализа
 */
export type ChainalysisAnalysisStatus = "PENDING" | "COMPLETED" | "FAILED";

// ============================================================================
// Типы для анализа адресов
// ============================================================================

/**
 * Результат анализа адреса
 */
export interface ChainalysisAddressAnalysis {
  address: string;
  asset: ChainalysisAsset;
  risk: ChainalysisRiskLevel;
  confidence: number; // 0-100
  categories: ChainalysisCategory[];
  identifications: ChainalysisIdentification[];
  exposure: ChainalysisExposure;
  firstSeen: string; // ISO 8601
  lastSeen: string; // ISO 8601
  totalReceived: number;
  totalSent: number;
  balance: number;
  transactionCount: number;
  labels: string[];
  metadata: Record<string, any>;
}

/**
 * Идентификация адреса
 */
export interface ChainalysisIdentification {
  entity: string;
  category: ChainalysisCategory;
  confidence: number; // 0-100
  description: string;
  url?: string;
  source: string;
}

/**
 * Экспозиция риска
 */
export interface ChainalysisExposure {
  direct: number; // Прямая экспозиция в %
  indirect: number; // Косвенная экспозиция в %
  total: number; // Общая экспозиция в %
  breakdown: {
    category: ChainalysisCategory;
    amount: number;
    percentage: number;
  }[];
}

// ============================================================================
// Типы для анализа транзакций
// ============================================================================

/**
 * Результат анализа транзакции
 */
export interface ChainalysisTransactionAnalysis {
  transactionHash: string;
  asset: ChainalysisAsset;
  timestamp: string; // ISO 8601
  blockNumber: number;
  fromAddress: string;
  toAddress: string;
  amount: number;
  risk: ChainalysisRiskLevel;
  confidence: number; // 0-100
  categories: ChainalysisCategory[];
  identifications: ChainalysisIdentification[];
  exposure: ChainalysisExposure;
  inputs: ChainalysisTransactionInput[];
  outputs: ChainalysisTransactionOutput[];
  labels: string[];
  metadata: Record<string, any>;
}

/**
 * Вход транзакции
 */
export interface ChainalysisTransactionInput {
  address: string;
  amount: number;
  risk: ChainalysisRiskLevel;
  categories: ChainalysisCategory[];
  identifications: ChainalysisIdentification[];
}

/**
 * Выход транзакции
 */
export interface ChainalysisTransactionOutput {
  address: string;
  amount: number;
  risk: ChainalysisRiskLevel;
  categories: ChainalysisCategory[];
  identifications: ChainalysisIdentification[];
}

// ============================================================================
// Типы для мониторинга в реальном времени
// ============================================================================

/**
 * Правило мониторинга Chainalysis
 */
export interface ChainalysisMonitoringRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  conditions: ChainalysisMonitoringCondition[];
  actions: ChainalysisMonitoringAction[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Условие мониторинга
 */
export interface ChainalysisMonitoringCondition {
  field: "risk" | "category" | "amount" | "exposure" | "confidence";
  operator: "GREATER_THAN" | "LESS_THAN" | "EQUALS" | "CONTAINS" | "IN_LIST";
  value: any;
  weight?: number;
}

/**
 * Действие мониторинга
 */
export interface ChainalysisMonitoringAction {
  type: "ALERT" | "BLOCK" | "FLAG" | "REPORT" | "NOTIFY";
  parameters?: Record<string, any>;
}

/**
 * Событие мониторинга
 */
export interface ChainalysisMonitoringEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  address?: string;
  transactionHash?: string;
  asset: ChainalysisAsset;
  risk: ChainalysisRiskLevel;
  confidence: number;
  timestamp: string; // ISO 8601
  data: Record<string, any>;
  processed: boolean;
  processedAt?: string;
}

// ============================================================================
// Типы для отчетов и аналитики
// ============================================================================

/**
 * Отчет Chainalysis
 */
export interface ChainalysisReport {
  id: string;
  type:
    | "ADDRESS_ANALYSIS"
    | "TRANSACTION_ANALYSIS"
    | "PORTFOLIO_RISK"
    | "COMPLIANCE_SUMMARY";
  title: string;
  description: string;
  generatedAt: string; // ISO 8601
  generatedBy: string;
  period: {
    startDate: string; // ISO 8601
    endDate: string; // ISO 8601
  };
  data: {
    addresses?: ChainalysisAddressAnalysis[];
    transactions?: ChainalysisTransactionAnalysis[];
    summary: ChainalysisReportSummary;
  };
  metadata: Record<string, any>;
}

/**
 * Сводка отчета
 */
export interface ChainalysisReportSummary {
  totalAddresses: number;
  totalTransactions: number;
  riskDistribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    SEVERE: number;
  };
  categoryDistribution: Record<ChainalysisCategory, number>;
  averageRiskScore: number;
  highRiskAddresses: string[];
  highRiskTransactions: string[];
}

// ============================================================================
// Типы для конфигурации и API запросов
// ============================================================================

/**
 * Конфигурация Chainalysis
 */
export interface ChainalysisConfig {
  apiKey: string;
  apiSecret: string;
  apiUrl: string;
  environment: "SANDBOX" | "PRODUCTION";
  timeout: number; // в миллисекундах
  retryAttempts: number;
  retryDelay: number; // в миллисекундах
  webhookSecret?: string;
  monitoringEnabled: boolean;
  riskThresholds: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    SEVERE: number;
  };
}

/**
 * Запрос на анализ адреса
 */
export interface ChainalysisAddressAnalysisRequest {
  address: string;
  asset: ChainalysisAsset;
  includeTransactions?: boolean;
  transactionLimit?: number;
  includeExposure?: boolean;
  includeIdentifications?: boolean;
}

/**
 * Запрос на анализ транзакции
 */
export interface ChainalysisTransactionAnalysisRequest {
  transactionHash: string;
  asset: ChainalysisAsset;
  includeInputs?: boolean;
  includeOutputs?: boolean;
  includeExposure?: boolean;
  includeIdentifications?: boolean;
}

/**
 * Запрос на анализ портфеля
 */
export interface ChainalysisPortfolioAnalysisRequest {
  addresses: string[];
  asset: ChainalysisAsset;
  includeTransactions?: boolean;
  transactionLimit?: number;
  includeExposure?: boolean;
  includeIdentifications?: boolean;
}

// ============================================================================
// Типы для ответов API
// ============================================================================

/**
 * Базовый ответ API
 */
export interface ChainalysisApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ChainalysisApiError;
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}

/**
 * Ошибка API
 */
export interface ChainalysisApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Пагинированный ответ
 */
export interface ChainalysisPaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ============================================================================
// Типы для интеграции с AML системой
// ============================================================================

/**
 * Результат интеграции с AML
 */
export interface ChainalysisAMLIntegration {
  addressAnalysisId?: string;
  transactionAnalysisId?: string;
  riskScore: number; // 0-100
  riskLevel: AMLRiskLevel;
  factors: ChainalysisRiskFactor[];
  recommendations: string[];
  requiresManualReview: boolean;
  shouldBlock: boolean;
  shouldReport: boolean;
}

/**
 * Фактор риска Chainalysis
 */
export interface ChainalysisRiskFactor {
  category: "EXPOSURE" | "IDENTIFICATION" | "BEHAVIOR" | "NETWORK" | "VOLUME";
  name: string;
  description: string;
  score: number; // 0-100
  weight: number;
  details: Record<string, any>;
}

/**
 * Тип для импорта из AML типов
 */
export type AMLRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// ============================================================================
// Экспорт всех типов
// ============================================================================
