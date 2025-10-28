// Типы для кошелька и транзакций

export interface WalletState {
  publicKey: string | null;
  connected: boolean;
  balance: number;
  starsBalance?: number; // Баланс Telegram Stars
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: Date;
  status: "pending" | "confirmed" | "failed";
  signature?: string;
}

export interface StarsTransaction {
  id: string;
  userId: string;
  starsAmount: number;
  ndtAmount: number;
  solAmount: number;
  timestamp: Date;
  status: "pending" | "confirmed" | "failed" | "refunded";
  telegramTransactionId?: string;
  refundReason?: string;
}

export interface PaymentSession {
  id: string;
  userId: string;
  starsAmount: number;
  ndtAmount: number;
  solAmount: number;
  status: "created" | "approved" | "cancelled" | "completed" | "failed";
  createdAt: Date;
  expiresAt: Date;
  callbackUrl?: string;
}

export interface ConversionRate {
  starsToSol: number;
  solToNdt: number;
  updatedAt: Date;
}

export interface WalletAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signTransaction(transaction: any): Promise<any>;
  getBalance(): Promise<number>;
  getStarsBalance?(): Promise<number>;
  buyWithStars?(starsAmount: number, ndtAmount: number): Promise<boolean>;
}

// Дополнительные типы для Invisible Wallet
export interface InvisibleWalletConfig {
  keyConfig?: any;
  sessionConfig?: any;
  offlineConfig?: any;
  starsConfig?: {
    enabled: boolean;
    minAmount: number;
    maxAmount: number;
    conversionRate: number;
  };
  recoveryConfig?: any;
  securityConfig?: any;
}

export interface PurchaseResult {
  success: boolean;
  transactionId: string;
  starsAmount: number;
  solAmount: number;
  ndtAmount: number;
}

export interface TelegramContact {
  id: string;
  name: string;
  isVerified: boolean;
}

export interface RecoverySession {
  id: string;
  userId: string;
  initiatedAt: number;
  expiresAt: number;
  requiredShares: number;
  collectedShares: string[];
  status: 'pending' | 'completed' | 'failed';
}

export interface KeyPair {
  publicKey: any;
  privateKey: any;
  encryptedPrivateKey?: any;
}

export interface PendingTransaction {
  id: string;
  transaction: any;
  timestamp: number;
}

export interface TelegramStarsBridge {
  purchaseNdtWithStars(starsAmount: number, userId: string): Promise<StarsTransaction>;
  calculateSolAmount(starsAmount: number): Promise<number>;
  calculateNdtAmount(starsAmount: number): Promise<number>;
}

export interface KeyManager {
  initialize(): Promise<void>;
  retrieveKeyPair(): Promise<KeyPair | null>;
  deriveFromTelegram(telegramId: string): Promise<KeyPair>;
  setupRecovery(contacts: TelegramContact[]): Promise<void>;
  initiateRecovery(): Promise<RecoverySession>;
  recoverKey(sessionId: string): Promise<EncryptedKey>;
  isRecoverySetup(): Promise<boolean>;
}

export interface SessionManager {
  initialize(): Promise<void>;
  expireSession(): Promise<void>;
}

export interface OfflineManager {
  initialize(): Promise<void>;
  getQueue(): Promise<PendingTransaction[]>;
  processQueue(): Promise<void>;
  cacheTransaction(signature: string, transaction: any): Promise<void>;
}

export interface RecoverySystem {
  setupRecovery(contacts: TelegramContact[]): Promise<void>;
  initiateRecovery(): Promise<RecoverySession>;
}

export interface SecurityManager {
  validateTransaction(transaction: any, userId: string): Promise<boolean>;
}

export enum InvisibleWalletEvent {
  INITIALIZED = 'initialized',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  AUTO_CONNECTED = 'auto_connected',
  KEYS_GENERATED = 'keys_generated',
  TRANSACTION_SENT = 'transaction_sent',
  STARS_PURCHASE_COMPLETED = 'stars_purchase_completed',
  RECOVERY_SETUP_COMPLETED = 'recovery_setup_completed',
  ERROR = 'error'
}

export interface WalletEventData {
  type: InvisibleWalletEvent;
  data?: any;
  timestamp: number;
}

export type EventHandler = (eventData: WalletEventData) => void;

export interface EventHandlerMap {
  [key: string]: EventHandler[];
}

export class InvisibleWalletError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'InvisibleWalletError';
    this.code = code;
    this.details = details;
  }
}

export interface InvisibleWalletAdapter {
  initialize(config?: InvisibleWalletConfig): Promise<void>;
  isInitialized(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signTransaction(transaction: any): Promise<any>;
  signAllTransactions(transactions: any[]): Promise<any[]>;
  sendTransaction(transaction: any, connection: any): Promise<string>;
  exportPublicKey(): Promise<any>;
  exportEncryptedKey(): Promise<any>;
  syncWhenOnline(): Promise<void>;
  getOfflineQueue(): Promise<PendingTransaction[]>;
  purchaseWithStars(amount: number, description: string): Promise<PurchaseResult>;
  getStarsBalance(): Promise<number>;
  setupRecovery(contacts: TelegramContact[]): Promise<void>;
  initiateRecovery(): Promise<RecoverySession>;
  on(event: InvisibleWalletEvent, handler: EventHandler): void;
  off(event: InvisibleWalletEvent, handler: EventHandler): void;
  connected: boolean;
  connecting: boolean;
  publicKey: any | null;
  autoApprove: boolean;
}
