// Типы для мобильного Invisible Wallet

// Состояние кошелька
export interface WalletState {
  connected: boolean;
  publicKey?: string;
  balance?: number;
  starsBalance?: number;
  isInvisible: boolean;
}

// Типы конфигурации
export interface MobileInvisibleWalletConfig {
  keyConfig: MobileKeyManagerConfig;
  starsConfig: MobileStarsConfig;
  offlineConfig: MobileOfflineConfig;
  biometricRequired: boolean;
  autoConnect: boolean;
  sessionTimeout?: number;
  refreshThreshold?: number;
}

export interface MobileKeyManagerConfig {
  encryptionAlgorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  keyDerivation: 'PBKDF2' | 'scrypt' | 'Argon2';
  storageLocation: 'secure-store' | 'keychain' | 'keystore';
  backupEnabled: boolean;
  rotationInterval: number; // в днях
}

export interface MobileStarsConfig {
  enabled: boolean;
  minAmount: number;
  maxAmount: number;
  commissionRate: number;
 conversionRate: number;
}

export interface MobileOfflineConfig {
  maxQueueSize: number;
  syncInterval: number; // в миллисекундах
  retryAttempts: number;
  storageQuota: number; // в байтах
  conflictResolution: 'last-wins' | 'first-wins' | 'manual';
}

// Результаты операций
export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  starsAmount?: number;
  solAmount?: number;
  ndtAmount?: number;
  error?: string;
}

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export interface BalanceResult {
  success: boolean;
  balance?: number;
  error?: string;
}

// Типы для транзакций
export interface PendingTransaction {
  id: string;
  transaction: string; // сериализованная транзакция
  timestamp: number;
 priority: 'low' | 'medium' | 'high';
  retryCount: number;
  maxRetries: number;
  metadata: TransactionMetadata;
}

export interface TransactionMetadata {
  type: 'transfer' | 'stake' | 'unstake' | 'purchase' | 'nft-mint';
  amount: number;
  recipient?: string;
  description?: string;
  createdAt: number;
}

export interface BalanceCache {
  publicKey: string;
  balance: number;
 tokenBalances: Record<string, number>;
  timestamp: number;
  blockHeight: number;
}

export interface SyncConflict {
  transactionId: string;
  localState: any;
  remoteState: any;
  resolution: 'local' | 'remote' | 'manual';
}

// Типы для восстановления
export interface TelegramContact {
  id: string;
  username?: string;
  firstName: string;
  lastName?: string;
  isVerified: boolean;
 trustLevel: number;
}

export interface RecoveryShare {
  id: string;
  shareData: Uint8Array;
  contactId: string;
  encrypted: boolean;
  createdAt: number;
  expiresAt?: number;
}

export interface RecoverySession {
  id: string;
  userId: string;
  initiatedAt: number;
  expiresAt: number;
  requiredShares: number;
  collectedShares: RecoveryShare[];
  status: 'pending' | 'collecting' | 'completed' | 'expired' | 'failed';
}

// Типы для Stars транзакций
export interface StarsTransaction {
  id: string;
  type: 'purchase' | 'conversion';
  amount: number;
  fromCurrency: 'stars' | 'sol' | 'ndt';
  toCurrency: 'stars' | 'sol' | 'ndt';
  rate: number;
  fee: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}

export interface ConversionResult {
  success: boolean;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  error?: string;
}

// Дополнительные типы
export interface KeyPairData {
  publicKey: string; // base58 encoded
  privateKey: string; // encrypted
}

export interface EncryptedKeyData {
  data: string; // base64 encoded encrypted key
  iv: string;   // base64 encoded initialization vector
  salt: string; // base64 encoded salt
  algorithm: string;
  keyDerivation: string;
  iterations: number;
}

export interface KeyMetadata {
  created: number;
  lastUsed: number;
  version: number;
  source: 'device-generated' | 'recovered' | 'imported';
  deviceId: string;
}

export interface StoredKeyData {
  encryptedPrivateKey: EncryptedKeyData;
  publicKey: string;
  metadata: KeyMetadata;
}

// События
export enum MobileWalletEvent {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  TRANSACTION_SENT = 'transaction_sent',
  BALANCE_UPDATED = 'balance_updated',
  STARS_PURCHASED = 'stars_purchased',
  OFFLINE_QUEUE_UPDATED = 'offline_queue_updated',
  RECOVERY_SETUP_COMPLETED = 'recovery_setup_completed',
  SECURITY_ALERT = 'security_alert',
  BIOMETRIC_AUTH_REQUIRED = 'biometric_auth_required',
  BIOMETRIC_AUTH_SUCCESS = 'biometric_auth_success',
  BIOMETRIC_AUTH_FAILED = 'biometric_auth_failed',
}

export interface WalletEvent {
  type: MobileWalletEvent;
  data: any;
  timestamp: number;
}