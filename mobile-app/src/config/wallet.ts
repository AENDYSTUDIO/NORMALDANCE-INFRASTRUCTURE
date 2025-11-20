// Конфигурация мобильного Invisible Wallet

// Основная конфигурация кошелька
export const MOBILE_WALLET_CONFIG = {
  keyConfig: {
    encryptionAlgorithm: 'AES-256-GCM' as const,
    keyDerivation: 'PBKDF2' as const,
    storageLocation: 'secure-store' as const,
    backupEnabled: true,
    rotationInterval: 30, // дней
  },
  starsConfig: {
    enabled: true,
    minAmount: 1,
    maxAmount: 10000,
    commissionRate: 0.02, // 2% комиссия
    conversionRate: 0.0001, // 1 Star = 0.0001 SOL
  },
  offlineConfig: {
    maxQueueSize: 100,
    syncInterval: 30000, // 30 секунд
    retryAttempts: 3,
    storageQuota: 100 * 1024 * 1024, // 100MB
    conflictResolution: 'last-wins' as const,
  },
  biometricRequired: true,
  autoConnect: true,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 часа
  refreshThreshold: 60 * 60 * 1000, // 1 час
};

// Конфигурация для разных сред
export const ENV_CONFIG = {
  development: {
    rpcUrl: 'https://api.devnet.solana.com',
    apiUrl: 'http://localhost:3000',
    debugMode: true,
  },
  production: {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    apiUrl: 'https://api.normaldance.com',
    debugMode: false,
  },
  staging: {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    apiUrl: 'https://staging-api.normaldance.com',
    debugMode: true,
  }
};

// Текущая среда (можно изменить в зависимости от сборки)
export const CURRENT_ENV = 'development'; // или 'production' или 'staging'

// Получение конфигурации для текущей среды
export const getConfig = () => {
  return {
    ...MOBILE_WALLET_CONFIG,
    ...ENV_CONFIG[CURRENT_ENV]
  };
};

// Настройки безопасности
export const SECURITY_CONFIG = {
  maxTransactionsPerHour: 100,
  maxAmountPerTransaction: 1000,
  anomalyDetection: true,
  biometricAuth: true,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 часа
  refreshThreshold: 60 * 60 * 1000, // 1 час
};

// Настройки производительности
export const PERFORMANCE_CONFIG = {
  cacheSize: 50 * 1024 * 1024, // 50MB
  maxConcurrentDownloads: 3,
  prefetchEnabled: true,
  prefetchCount: 5,
};