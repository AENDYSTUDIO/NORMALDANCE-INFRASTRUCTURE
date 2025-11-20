/**
 * 🌍 Travel Rule Service - FATF Compliance Types
 *
 * Типы и интерфейсы для реализации Travel Rule в соответствии с требованиями FATF
 * для передачи информации о транзакциях между VASP (Virtual Asset Service Providers)
 */

// ============================================================================
// Базовые типы Travel Rule
// ============================================================================

/**
 * Статусы передачи Travel Rule
 */
export type TravelRuleStatus = 
  | "PENDING"           // Ожидает отправки
  | "SENT"              // Отправлено получающему VASP
  | "RECEIVED"          // Получено от отправляющего VASP
  | "ACKNOWLEDGED"      // Подтверждено получением
  | "COMPLETED"         // Завершено успешно
  | "FAILED"            // Ошибка передачи
  | "REJECTED"          // Отклонено получающим VASP
  | "EXPIRED";          // Истекло время ожидания

/**
 * Типы VASP (Virtual Asset Service Providers)
 */
export type VASPType = 
  | "EXCHANGE"          // Криптобиржа
  | "CUSTODIAN"         // Кастодиан
  | "TRANSFER_PROVIDER" // Провайдер переводов
  | "ATM_KIOSK"         // Банкомат/киоск
  | "WALLET_PROVIDER"   // Провайдер кошельков
  | "MINING_POOL"       // Майнинг пул
  | "DEFI_PROTOCOL"     // DeFi протокол
  | "NFT_MARKETPLACE"   // NFT маркетплейс
  | "GAMING_PLATFORM"  // Игровая платформа
  | "OTHER";            // Другое

/**
 * Уровни верификации для Travel Rule
 */
export type TravelRuleVerificationLevel = 
  | "BASIC"             // Базовая верификация
  | "STANDARD"          // Стандартная верификация
  | "ENHANCED";         // Расширенная верификация

// ============================================================================
// Основные интерфейсы Travel Rule
// ============================================================================

/**
 * Информация о VASP
 */
export interface VASPInfo {
  id: string;
  name: string;
  type: VASPType;
  registrationNumber?: string;
  jurisdiction: string; // ISO 3166-1 alpha-2
  address: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  contact: {
    email: string;
    phone?: string;
    website?: string;
  };
  regulatoryStatus: {
    isRegistered: boolean;
    licenseNumber?: string;
    regulatorName?: string;
    registrationDate?: string;
  };
  technicalContact?: {
    name: string;
    email: string;
    phone?: string;
  };
  complianceOfficer?: {
    name: string;
    email: string;
    phone?: string;
  };
}

/**
 * Информация о происхождении средств (Source of Funds)
 */
export interface SourceOfFunds {
  type: "SALARY" | "BUSINESS_INCOME" | "INVESTMENT" | "INHERITANCE" | "GIFT" | "LOAN" | "CRYPTO_MINING" | "OTHER";
  description?: string;
  amount?: number;
  currency?: string;
  documents?: string[]; // IPFS хэши документов
}

/**
 * Информация о цели транзакции (Purpose of Transaction)
 */
export interface PurposeOfTransaction {
  type: "PERSONAL_EXPENSES" | "BUSINESS_EXPENSES" | "INVESTMENT" | "SAVINGS" | "GIFT" | "CHARITY" | "OTHER";
  description?: string;
  expectedUse?: string;
}

/**
 * Базовая информация о стороне транзакции
 */
export interface TransactionParty {
  vaspInfo: VASPInfo;
  customerInfo: {
    naturalPerson?: {
      name: {
        firstName: string;
        middleName?: string;
        lastName: string;
      };
      dateOfBirth: string; // ISO 8601
      placeOfBirth: string;
      nationality: string; // ISO 3166-1 alpha-2
      addresses: Array<{
        street: string;
        city: string;
        state?: string;
        postalCode: string;
        country: string;
        type: "RESIDENTIAL" | "BUSINESS" | "MAILING";
      }>;
      identificationDocuments?: Array<{
        type: "PASSPORT" | "NATIONAL_ID" | "DRIVING_LICENSE";
        number: string;
        issuingCountry: string;
        issueDate: string;
        expiryDate?: string;
      }>;
      contactInformation: {
        email?: string;
        phoneNumber?: string;
      };
    };
    legalPerson?: {
      name: string;
      registrationNumber: string;
      incorporationDate: string;
      jurisdiction: string;
      address: {
        street: string;
        city: string;
        state?: string;
        postalCode: string;
        country: string;
      };
      beneficialOwners?: Array<{
        name: {
          firstName: string;
          lastName: string;
        };
        nationality: string;
        dateOfBirth: string;
      }>;
      contactInformation: {
        email?: string;
        phoneNumber?: string;
      };
    };
  };
  walletAddress: string;
  verificationLevel: TravelRuleVerificationLevel;
  riskAssessment?: {
    riskScore: number; // 0-100
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    lastAssessed: string;
  };
}

/**
 * Основная структура Travel Rule сообщения
 */
export interface TravelRuleMessage {
  id: string;
  version: string; // Версия формата (например "1.0")
  timestamp: string; // ISO 8601
  transactionId: string; // ID транзакции в блокчейне
  virtualAsset: {
    type: string; // "BTC", "ETH", "SOL", "USDC", "NDT" и т.д.
    amount: number;
    fiatValue?: number;
    fiatCurrency?: string;
  };
  originatingVASP: TransactionParty;
  benefitingVASP: TransactionParty;
  sourceOfFunds?: SourceOfFunds;
  purposeOfTransaction?: PurposeOfTransaction;
  additionalInformation?: {
    transactionDescription?: string;
    referenceNumber?: string;
    urgencyLevel?: "LOW" | "MEDIUM" | "HIGH";
    specialInstructions?: string;
  };
  complianceInformation: {
    screeningResults: {
      sanctionsScreening: {
        checked: boolean;
        matches: boolean;
        details?: string;
      };
      amlScreening: {
        checked: boolean;
        riskScore: number;
        flags: string[];
      };
    };
    regulatoryReporting: {
      reportable: boolean;
      reportType?: string;
      reportId?: string;
    };
  };
  technicalInformation: {
    protocol: string; // "IVMS101", "CAT", "OFAC", etc.
    format: string; // "JSON", "XML", etc.
    encryption: {
      algorithm: string;
      keyId?: string;
    };
    signature?: {
      algorithm: string;
      publicKey: string;
      value: string;
    };
  };
}

// ============================================================================
// CAT (Common Address Transaction) формат
// ============================================================================

/**
 * CAT сообщение для Travel Rule
 */
export interface CATMessage {
  header: {
    version: string;
    messageId: string;
    timestamp: string;
    sender: {
      vaspId: string;
      name: string;
      endpoint: string;
    };
    recipient: {
      vaspId: string;
      name: string;
      endpoint: string;
    };
  };
  payload: {
    transaction: {
      id: string;
      blockchain: string;
      asset: string;
      amount: number;
      fromAddress: string;
      toAddress: string;
      timestamp: string;
    };
    originator: {
      type: "NATURAL" | "LEGAL";
      name: string;
      dateOfBirth?: string;
      nationality?: string;
      address?: string;
      identificationNumber?: string;
    };
    beneficiary: {
      type: "NATURAL" | "LEGAL";
      name: string;
      dateOfBirth?: string;
      nationality?: string;
      address?: string;
      identificationNumber?: string;
    };
    purpose?: string;
    sourceOfFunds?: string;
  };
  security: {
    signature: string;
    publicKey: string;
    algorithm: string;
  };
}

// ============================================================================
// OFAC формат
// ============================================================================

/**
 * OFAC сообщение для санкционной проверки
 */
export interface OFACMessage {
  header: {
    version: string;
    timestamp: string;
    messageId: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  };
  screeningRequest: {
    entities: Array<{
      type: "INDIVIDUAL" | "ENTITY";
      name: string;
      aliases?: string[];
      dateOfBirth?: string;
      nationality?: string;
      addresses?: string[];
      identificationNumbers?: string[];
      additionalInfo?: Record<string, any>;
    }>;
    transaction: {
      id: string;
      amount: number;
      currency: string;
      date: string;
      parties: Array<{
        type: "ORIGINATOR" | "BENEFICIARY";
        name: string;
        address?: string;
        accountNumber?: string;
      }>;
    };
  };
  response?: {
    matches: Array<{
      entity: {
        name: string;
        type: string;
        list: string;
        score: number;
      };
      confidence: number;
      details: string;
    }>;
    recommendation: "APPROVE" | "REVIEW" | "BLOCK";
    processedAt: string;
  };
}

// ============================================================================
// VASP реестр и конфигурация
// ============================================================================

/**
 * Запись в реестре VASP
 */
export interface VASPRegistryEntry {
  id: string;
  vaspInfo: VASPInfo;
  technicalEndpoints: {
    travelRuleEndpoint: string;
    ivms101Endpoint?: string;
    catEndpoint?: string;
    ofacEndpoint?: string;
    backupEndpoints?: string[];
  };
  supportedProtocols: string[]; // ["IVMS101", "CAT", "OFAC", etc.]
  supportedFormats: string[]; // ["JSON", "XML", etc.]
  encryptionKeys: Array<{
    keyId: string;
    algorithm: string;
    publicKey: string;
    validFrom: string;
    validUntil?: string;
  }>;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  lastVerified: string;
  reputation: {
    score: number; // 0-100
    reviews: number;
    lastIncident?: string;
  };
}

/**
 * Конфигурация Travel Rule сервиса
 */
export interface TravelRuleConfig {
  vaspInfo: VASPInfo;
  protocols: {
    ivms101: {
      enabled: boolean;
      endpoint: string;
      version: string;
    };
    cat: {
      enabled: boolean;
      endpoint: string;
      version: string;
    };
    ofac: {
      enabled: boolean;
      endpoint: string;
      apiKey?: string;
      updateInterval: number; // в часах
    };
  };
  security: {
    encryption: {
      algorithm: string;
      keyRotationInterval: number; // в днях
    };
    signature: {
      algorithm: string;
      keyId: string;
    };
  };
  compliance: {
    autoScreening: boolean;
    screeningThreshold: number; // 0-100
    reportingThreshold: number; // в USD
    retentionPeriod: number; // в днях
  };
  timeouts: {
    messageExpiry: number; // в часах
    responseTimeout: number; // в минутах
    retryAttempts: number;
  };
}

// ============================================================================
// API интерфейсы
// ============================================================================

/**
 * Запрос на отправку Travel Rule сообщения
 */
export interface SendTravelRuleRequest {
  transactionId: string;
  recipientVaspId: string;
  protocol: "IVMS101" | "CAT" | "OFAC";
  message: TravelRuleMessage | CATMessage | OFACMessage;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  encryptionKeyId?: string;
}

/**
 * Ответ на отправку Travel Rule сообщения
 */
export interface SendTravelRuleResponse {
  success: boolean;
  messageId?: string;
  status: TravelRuleStatus;
  timestamp: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Запрос на получение Travel Rule сообщения
 */
export interface ReceiveTravelRuleRequest {
  messageId?: string;
  transactionId?: string;
  senderVaspId?: string;
  status?: TravelRuleStatus;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

/**
 * Ответ на получение Travel Rule сообщений
 */
export interface ReceiveTravelRuleResponse {
  success: boolean;
  messages: Array<{
    id: string;
    transactionId: string;
    senderVaspId: string;
    recipientVaspId: string;
    protocol: string;
    status: TravelRuleStatus;
    timestamp: string;
    message: TravelRuleMessage | CATMessage | OFACMessage;
  }>;
  totalCount: number;
  hasMore: boolean;
}

// ============================================================================
// События и уведомления
// ============================================================================

/**
 * Типы событий Travel Rule
 */
export type TravelRuleEventType = 
  | "MESSAGE_SENT"
  | "MESSAGE_RECEIVED"
  | "MESSAGE_ACKNOWLEDGED"
  | "MESSAGE_FAILED"
  | "SCREENING_MATCH"
  | "COMPLIANCE_FLAG"
  | "VASP_VERIFIED"
  | "ENCRYPTION_KEY_ROTATED";

/**
 * Событие Travel Rule системы
 */
export interface TravelRuleEvent {
  id: string;
  type: TravelRuleEventType;
  timestamp: string;
  messageId?: string;
  transactionId?: string;
  vaspId?: string;
  data: Record<string, any>;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  processed: boolean;
}

// ============================================================================
// Экспорт всех типов
// ============================================================================

export * from "./types";