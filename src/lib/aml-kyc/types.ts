/**
 * 🛡️ AML/KYC Module Types - NormalDance Music Platform
 *
 * Базовые типы и интерфейсы для модуля противодействия отмыванию денег
 * и Know Your Customer верификации в соответствии с международными стандартами
 */

// ============================================================================
// Базовые типы для KYC (Know Your Customer)
// ============================================================================

/**
 * Уровни верификации KYC
 */
export type KYCLevel = "BASIC" | "STANDARD" | "ENHANCED" | "PREMIUM";

/**
 * Статус верификации KYC
 */
export type KYCStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED"
  | "SUSPENDED";

/**
 * Типы документов для верификации
 */
export type DocumentType =
  | "PASSPORT"
  | "NATIONAL_ID"
  | "DRIVING_LICENSE"
  | "RESIDENCE_PERMIT"
  | "TAX_ID"
  | "UTILITY_BILL"
  | "BANK_STATEMENT"
  | "SELFIE";

/**
 * Персональные данные пользователя
 */
export interface PersonalData {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string; // ISO 8601
  placeOfBirth: string;
  nationality: string; // ISO 3166-1 alpha-2
  gender?: "MALE" | "FEMALE" | "OTHER";
  taxResidence: string[]; // Массив стран налогового резидентства
  taxIdentificationNumber?: string;
  email?: string;
  phone?: string;
}

/**
 * Адресные данные
 */
export interface AddressData {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2
  isPrimary: boolean;
  addressType: "RESIDENTIAL" | "BUSINESS" | "MAILING";
  proofDocument?: string; // Ссылка на документ подтверждающий адрес
}

/**
 * Документ для верификации
 */
export interface VerificationDocument {
  id: string;
  type: DocumentType;
  number: string;
  issueDate: string; // ISO 8601
  expiryDate?: string; // ISO 8601
  issuingCountry: string; // ISO 3166-1 alpha-2
  issuingAuthority: string;
  frontImageHash?: string; // IPFS hash
  backImageHash?: string; // IPFS hash
  selfieImageHash?: string; // IPFS hash для верификации личности
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";
  verificationDate?: string;
  rejectionReason?: string;
  extractedData?: Record<string, any>; // Данные извлеченные OCR
}

/**
 * Профиль KYC пользователя
 */
export interface KYCProfile {
  id: string;
  userId: string; // ID пользователя в системе
  walletAddress: string; // Solana wallet address
  did?: string; // Decentralized Identifier
  level: KYCLevel;
  status: KYCStatus;
  personalData: PersonalData;
  addresses: AddressData[];
  documents: VerificationDocument[];
  riskScore: number; // 0-100
  riskCategory: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  expiresAt?: string;
  lastUpdated: string;
  notes?: string;
  additionalData?: Record<string, any>; // Дополнительные данные для интеграций
}

// ============================================================================
// Типы для AML (Anti-Money Laundering)
// ============================================================================

/**
 * Уровни риска AML
 */
export type AMLRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/**
 * Типы транзакций для мониторинга
 */
export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "TRANSFER"
  | "SWAP"
  | "NFT_PURCHASE"
  | "NFT_SALE"
  | "ROYALTY_PAYMENT"
  | "STAKING"
  | "UNSTAKING";

/**
 * Статусы мониторинга транзакций
 */
export type MonitoringStatus =
  | "CLEARED"
  | "FLAGGED"
  | "UNDER_REVIEW"
  | "SUSPICIOUS"
  | "REPORTED";

/**
 * Мониторинговая транзакция
 */
export interface MonitoredTransaction {
  id: string;
  transactionHash: string;
  userId: string;
  walletAddress: string;
  type: TransactionType;
  amount: number;
  currency: string; // SOL, USDC, NDT и т.д.
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  blockNumber?: number;
  riskScore: number; // 0-100
  riskLevel: AMLRiskLevel;
  monitoringStatus: MonitoringStatus;
  flaggedReasons?: string[];
  reviewedAt?: string;
  reviewedBy?: string;
  additionalData?: Record<string, any>;
}

/**
 * Правило мониторинга AML
 */
export interface AMLRule {
  id: string;
  name: string;
  description: string;
  category: "THRESHOLD" | "PATTERN" | "SANCTIONS" | "GEOGRAPHIC" | "BEHAVIORAL";
  isActive: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  conditions: AMLRuleCondition[];
  actions: AMLRuleAction[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Условие правила AML
 */
export interface AMLRuleCondition {
  field: string;
  operator:
    | "EQUALS"
    | "GREATER_THAN"
    | "LESS_THAN"
    | "BETWEEN"
    | "CONTAINS"
    | "IN_LIST";
  value: any;
  weight?: number; // Вес условия в общем расчете риска
}

/**
 * Действие правила AML
 */
export interface AMLRuleAction {
  type:
    | "FLAG"
    | "BLOCK"
    | "REQUIRE_MANUAL_REVIEW"
    | "SEND_NOTIFICATION"
    | "CREATE_REPORT";
  parameters?: Record<string, any>;
}

/**
 * Санкционный список
 */
export interface SanctionsList {
  id: string;
  name: string;
  source: string; // OFAC, UN, EU, UK и т.д.
  version: string;
  lastUpdated: string;
  entries: SanctionsEntry[];
}

/**
 * Запись в санкционном списке
 */
export interface SanctionsEntry {
  id: string;
  type: "INDIVIDUAL" | "ENTITY" | "VESSEL" | "AIRCRAFT";
  names: string[];
  aliases: string[];
  datesOfBirth?: string[];
  nationalities?: string[];
  addresses?: string[];
  identificationNumbers?: string[];
  listedDate: string;
  additionalInfo?: Record<string, any>;
}

// ============================================================================
// Типы для отчетности и комплаенса
// ============================================================================

/**
 * Типы отчетов
 */
export type ReportType =
  | "SAR" // Suspicious Activity Report
  | "CTR" // Currency Transaction Report
  | "STR" // Suspicious Transaction Report
  | "ANNUAL_RISK_ASSESSMENT"
  | "KYC_SUMMARY"
  | "AML_MONITORING_SUMMARY";

/**
 * Статусы отчетов
 */
export type ReportStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

/**
 * Отчет комплаенса
 */
export interface ComplianceReport {
  id: string;
  type: ReportType;
  status: ReportStatus;
  title: string;
  description: string;
  reportingPeriod: {
    startDate: string;
    endDate: string;
  };
  submittedBy: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  data: Record<string, any>;
  attachments?: string[]; // IPFS hashes
  externalReportId?: string; // ID в системе регулятора
}

/**
 * Риск-оценка пользователя
 */
export interface UserRiskAssessment {
  id: string;
  userId: string;
  walletAddress: string;
  overallRiskScore: number; // 0-100
  riskLevel: AMLRiskLevel;
  factors: RiskFactor[];
  lastAssessed: string;
  nextReviewDate: string;
  assessedBy: string;
}

/**
 * Фактор риска
 */
export interface RiskFactor {
  category:
    | "GEOGRAPHIC"
    | "TRANSACTIONAL"
    | "BEHAVIORAL"
    | "DOCUMENTATION"
    | "SANCTIONS";
  name: string;
  description: string;
  score: number; // 0-100
  weight: number; // Вес в общей оценке
  details?: Record<string, any>;
}

// ============================================================================
// API интерфейсы и запросы
// ============================================================================

/**
 * Запрос на создание KYC профиля
 */
export interface CreateKYCRequest {
  userId: string;
  walletAddress: string;
  personalData: PersonalData;
  addresses: AddressData[];
  documents: Omit<
    VerificationDocument,
    "id" | "verificationStatus" | "verificationDate" | "rejectionReason"
  >[];
}

/**
 * Ответ KYC верификации
 */
export interface KYCVerificationResponse {
  success: boolean;
  profileId?: string;
  status: KYCStatus;
  level: KYCLevel;
  message?: string;
  errors?: string[];
  nextSteps?: string[];
}

/**
 * Параметры мониторинга транзакций
 */
export interface TransactionMonitoringParams {
  userId?: string;
  walletAddress?: string;
  startDate?: string;
  endDate?: string;
  transactionType?: TransactionType;
  riskLevel?: AMLRiskLevel;
  status?: MonitoringStatus;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}

/**
 * Результаты мониторинга
 */
export interface MonitoringResults {
  transactions: MonitoredTransaction[];
  totalCount: number;
  hasMore: boolean;
  summary: {
    totalAmount: number;
    flaggedCount: number;
    highRiskCount: number;
    averageRiskScore: number;
  };
}

/**
 * Параметры создания отчета
 */
export interface CreateReportRequest {
  type: ReportType;
  title: string;
  description: string;
  reportingPeriod: {
    startDate: string;
    endDate: string;
  };
  data: Record<string, any>;
  attachments?: string[];
}

// ============================================================================
// Конфигурация и настройки
// ============================================================================

/**
 * Конфигурация AML/KYC модуля
 */
export interface AMLKYCConfig {
  // Настройки KYC
  kyc: {
    enabled: boolean;
    requiredLevel: KYCLevel;
    documentRetentionDays: number;
    autoApprovalEnabled: boolean;
    ocrProvider: string;
    biometricProvider: string;
  };

  // Настройки AML
  aml: {
    enabled: boolean;
    realTimeMonitoring: boolean;
    riskThreshold: number;
    sanctionsCheckEnabled: boolean;
    sanctionsUpdateInterval: number; // в часах
    transactionRetentionDays: number;
  };

  // Настройки отчетности
  reporting: {
    enabled: boolean;
    autoReportGeneration: boolean;
    reportRetentionDays: number;
    regulatoryAuthorities: string[];
  };

  // Интеграции
  integrations: {
    chainalysisApiKey?: string;
    ellipticApiKey?: string;
    sumsubApiKey?: string;
    onfidoApiKey?: string;
  };
}

// ============================================================================
// События и уведомления
// ============================================================================

/**
 * Типы событий AML/KYC
 */
export type AMLKYCEventType =
  | "KYC_SUBMITTED"
  | "KYC_APPROVED"
  | "KYC_REJECTED"
  | "TRANSACTION_FLAGGED"
  | "SANCTIONS_MATCH"
  | "RISK_LEVEL_CHANGED"
  | "REPORT_GENERATED"
  | "RULE_TRIGGERED";

/**
 * Событие AML/KYC системы
 */
export interface AMLKYCEvent {
  id: string;
  type: AMLKYCEventType;
  userId?: string;
  walletAddress?: string;
  timestamp: string;
  data: Record<string, any>;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  processed: boolean;
}

// ============================================================================
// Экспорт всех типов
// ============================================================================

export * from "./types";
