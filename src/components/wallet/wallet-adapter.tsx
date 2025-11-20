import {
  NDT_MINT_ADDRESS,
  NDT_PROGRAM_ID,
  STAKING_PROGRAM_ID,
  TRACKNFT_PROGRAM_ID,
} from "@/constants/solana";
import {
  AppError,
  ExternalServiceError,
  ValidationError,
} from "@/lib/errors/AppError";
import { logger } from "@/lib/utils/logger";
import * as Sentry from "@sentry/nextjs";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import PhantomWalletAdapter from "@solana/wallet-adapter-phantom";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  InvisibleWalletAdapterImpl,
  createInvisibleWalletAdapter,
  createAutoWalletAdapter
} from "./invisible-wallet-adapter";
import { TelegramUtils } from "@/lib/wallet/utils";
import { OfflineTransactionManager } from "@/lib/wallet/offline-transaction-manager";
import { CacheManager } from "@/lib/wallet/cache-manager";
import { FallbackStateManager } from "@/lib/wallet/fallback-state-manager";

// Типы для ошибок кошелька
export class WalletConnectionError extends AppError {
  constructor(originalError?: Error, metadata?: Record<string, unknown>) {
    super("Wallet connection failed", 400, "WALLET_CONNECTION_ERROR", {
      ...metadata,
      originalError: originalError?.message,
    });
    this.name = "WalletConnectionError";
  }
}

export class WalletDisconnectionError extends AppError {
  constructor(originalError?: Error, metadata?: Record<string, unknown>) {
    super("Wallet disconnection failed", 400, "WALLET_DISCONNECTION_ERROR", {
      ...metadata,
      originalError: originalError?.message,
    });
    this.name = "WalletDisconnectionError";
  }
}

export class WalletTransactionError extends AppError {
  constructor(originalError?: Error, metadata?: Record<string, unknown>) {
    super("Wallet transaction failed", 400, "WALLET_TRANSACTION_ERROR", {
      ...metadata,
      originalError: originalError?.message,
    });
    this.name = "WalletTransactionError";
  }
}

export class WalletSignMessageError extends AppError {
  constructor(originalError?: Error, metadata?: Record<string, unknown>) {
    super("Wallet message signing failed", 400, "WALLET_SIGN_MESSAGE_ERROR", {
      ...metadata,
      originalError: originalError?.message,
    });
    this.name = "WalletSignMessageError";
  }
}

// Конфигурация сети
const NETWORK = WalletAdapterNetwork.Devnet;
const LAMPORTS_PER_SOL = 1000000000;
const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

export interface WalletAdapter {
  connected: boolean;
  publicKey: PublicKey | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: (
    transaction: Transaction,
    connection: Connection
  ) => Promise<string>;
}

// Расширенный интерфейс для поддержки Invisible Wallet
export interface ExtendedWalletAdapter extends WalletAdapter {
  isInvisible?: boolean;
  autoConnect?: () => Promise<void>;
  purchaseWithStars?: (amount: number, description: string) => Promise<any>;
  setupRecovery?: (contacts: any[]) => Promise<void>;
  getStarsBalance?: () => Promise<number>;
}

// Создание подключения к Solana
export function createConnection(): Connection {
  const timeoutMs = Number(process.env.SOLANA_RPC_TIMEOUT || "8000");

  // Custom fetch with timeout for reliability
  const fetchWithTimeout = (
    url: RequestInfo,
    init?: RequestInit
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, {
      ...init,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
  };

  return new Connection(RPC_URL, {
    commitment: "confirmed",
    fetchMiddleware: fetchWithTimeout,
  });
}

// Инициализация кошелька Phantom
export function createPhantomWallet(): PhantomWalletAdapter {
  return new PhantomWalletAdapter();
}

// Создание адаптера кошелька в зависимости от окружения
export function createWalletAdapter(type?: 'phantom' | 'invisible' | 'auto'): ExtendedWalletAdapter {
  if (type === 'invisible' || (type === 'auto' && TelegramUtils.isTelegramWebApp())) {
    const invisibleWallet = createInvisibleWalletAdapter();
    return {
      ...invisibleWallet,
      isInvisible: true,
      autoConnect: () => invisibleWallet.autoConnect(),
      purchaseWithStars: (amount: number, description: string) => invisibleWallet.purchaseWithStars(amount, description),
      setupRecovery: (contacts: any[]) => invisibleWallet.setupRecovery(contacts),
      getStarsBalance: () => invisibleWallet.getStarsBalance()
    };
  }
  
  // По умолчанию используем Phantom
  const phantomWallet = new PhantomWalletAdapter();
  return {
    ...phantomWallet,
    isInvisible: false
  };
}

// Автоматическое определение и создание адаптера
export function createAutoWalletAdapter(): ExtendedWalletAdapter {
  return createWalletAdapter('auto');
}

// Хук для использования кошелька
export function useSolanaWallet() {
  const wallet = useWallet();
  const connection = createConnection();
  
  // Автоматическая инициализация Invisible Wallet в Telegram
  React.useEffect(() => {
    if (TelegramUtils.isTelegramWebApp() && !wallet.connected) {
      const invisibleWallet = createAutoWalletAdapter();
      if (invisibleWallet.isInvisible && invisibleWallet.autoConnect) {
        invisibleWallet.autoConnect().catch(console.error);
      }
    }
  }, [wallet.connected]);

  const connectWallet = async () => {
    if (!wallet.connected) {
      if (!wallet.connect) {
        const error = new ValidationError("Wallet does not support connection");
        logger.error("Wallet connection error", error);
        Sentry.captureException(error);
        throw error;
      }
      try {
        await wallet.connect();
      } catch (error) {
        logger.error("Failed to connect wallet", error as Error);
        Sentry.captureException(error);
        throw new ExternalServiceError("wallet-connection", error as Error);
      }
    }
  };

  const disconnectWallet = async () => {
    if (wallet.connected) {
      if (!wallet.disconnect) {
        const error = new ValidationError(
          "Wallet does not support disconnection"
        );
        logger.error("Wallet disconnection error", error);
        Sentry.captureException(error);
        throw error;
      }
      try {
        await wallet.disconnect();
      } catch (error) {
        logger.error("Failed to disconnect wallet", error as Error);
        Sentry.captureException(error);
        throw new ExternalServiceError("wallet-disconnection", error as Error);
      }
    }
  };

  const signMessage = async (message: Uint8Array): Promise<Uint8Array> => {
    if (!wallet.connected) {
      const error = new ValidationError("Wallet not connected");
      logger.error("Wallet not connected for message signing", error);
      Sentry.captureException(error);
      throw error;
    }
    if (!wallet.signMessage) {
      const error = new ValidationError(
        "Wallet does not support message signing"
      );
      logger.error("Wallet message signing error", error);
      Sentry.captureException(error);
      throw error;
    }

    try {
      return await wallet.signMessage(message);
    } catch (error) {
      logger.error("Error signing message", error as Error);
      Sentry.captureException(error);
      throw new ExternalServiceError("wallet-sign-message", error as Error);
    }
  };

  const sendTransaction = async (transaction: Transaction): Promise<string> => {
    if (!wallet.connected) {
      const error = new ValidationError("Wallet not connected");
      logger.error("Wallet not connected for transaction", error);
      Sentry.captureException(error);
      throw error;
    }
    if (!wallet.sendTransaction) {
      const error = new ValidationError(
        "Wallet does not support transaction sending"
      );
      logger.error("Wallet transaction sending error", error);
      Sentry.captureException(error);
      throw error;
    }

    try {
      // Check network status before sending transaction
      const isOnline = navigator.onLine;
      
      if (!isOnline) {
        // Add transaction to offline queue
        const offlineManager = OfflineTransactionManager.getInstance();
        const transactionId = offlineManager.addTransaction({
          type: 'transfer', // Default type, could be more specific
          data: {
            transaction: transaction.serialize().toString('base64'),
            publicKey: wallet.publicKey?.toBase58(),
          },
          priority: 'high', // Financial transactions should have high priority
        });
        
        logger.info(`Transaction added to offline queue: ${transactionId}`);
        return transactionId; // Return transaction ID for offline transaction
      }
      
      const signature = await wallet.sendTransaction(transaction, connection);
      return signature;
    } catch (error) {
      // If network error, add to offline queue
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('timeout'))) {
        const offlineManager = OfflineTransactionManager.getInstance();
        const transactionId = offlineManager.addTransaction({
          type: 'transfer',
          data: {
            transaction: transaction.serialize().toString('base64'),
            publicKey: wallet.publicKey?.toBase58(),
          },
          priority: 'high',
        });
        
        logger.info(`Network error - transaction added to offline queue: ${transactionId}`);
        return transactionId;
      }
      
      logger.error("Error sending transaction", error as Error);
      Sentry.captureException(error);
      throw new ExternalServiceError("wallet-send-transaction", error as Error);
    }
  };

  const getBalance = async (): Promise<number> => {
    if (!wallet.publicKey) return 0;

    const cacheKey = `balance_${wallet.publicKey.toBase58()}`;
    const cacheManager = CacheManager.getInstance();
    
    // Try to get from cache first
    const cachedBalance = await cacheManager.get<number>(cacheKey);
    if (cachedBalance !== null) {
      return cachedBalance;
    }

    try {
      const balance = await connection.getBalance(wallet.publicKey);
      const balanceInSol = balance / LAMPORTS_PER_SOL;
      
      // Cache the balance for 5 minutes
      await cacheManager.cacheWalletBalance(wallet.publicKey.toBase58(), balanceInSol, 300);
      
      return balanceInSol;
    } catch (error) {
      logger.error("Error getting balance", error as Error, {
        publicKey: wallet.publicKey?.toBase58(),
      });
      Sentry.captureException(error);
      
      // If network is down, try to get from fallback state
      if (!navigator.onLine) {
        const stateManager = FallbackStateManager.getInstance();
        const localState = await stateManager.getLocalState();
        if (localState && localState.publicKey === wallet.publicKey.toBase58()) {
          return localState.balance;
        }
      }
      
      return 0;
    }
  };

  const getTokenBalance = async (mintAddress: string): Promise<number> => {
    if (!wallet.publicKey) return 0;

    const cacheKey = `token_balance_${wallet.publicKey.toBase58()}_${mintAddress}`;
    const cacheManager = CacheManager.getInstance();
    
    // Try to get from cache first
    const cachedBalance = await cacheManager.get<number>(cacheKey);
    if (cachedBalance !== null) {
      return cachedBalance;
    }

    try {
      const mintPublicKey = new PublicKey(mintAddress);
      // Импортируем необходимые функции из SPL Token
      const { TOKEN_PROGRAM_ID, AccountLayout, getAssociatedTokenAddress } =
        await import("@solana/spl-token");

      // Получаем адрес ассоциированного токен-аккаунта
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPublicKey,
        wallet.publicKey
      );

      // Получаем информацию об аккаунте
      const accountInfo = await connection.getAccountInfo(
        associatedTokenAddress
      );

      if (accountInfo === null) {
        // Токен-аккаунт не существует
        // Cache zero balance for 5 minutes
        await cacheManager.cacheTokenBalance(wallet.publicKey.toBase58(), mintAddress, 0, 300);
        return 0;
      }

      // Парсим данные аккаунта
      const accountData = AccountLayout.decode(accountInfo.data);
      const balance = Number(accountData.amount);

      // Получаем количество десятичных знаков для токена
      const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);
      let decimals = 9; // Default decimals
      if (mintInfo.value?.data && "parsed" in mintInfo.value.data) {
        decimals = mintInfo.value.data.parsed.info.decimals;
      }

      const finalBalance = balance / Math.pow(10, decimals);
      
      // Cache the token balance for 5 minutes
      await cacheManager.cacheTokenBalance(wallet.publicKey.toBase58(), mintAddress, finalBalance, 300);
      
      return finalBalance;
    } catch (error) {
      logger.error("Error getting token balance", error as Error, {
        mintAddress,
        publicKey: wallet.publicKey?.toBase58(),
      });
      Sentry.captureException(error);
      
      // If network is down, try to get from fallback state
      if (!navigator.onLine) {
        const stateManager = FallbackStateManager.getInstance();
        const localState = await stateManager.getLocalState();
        if (localState && localState.publicKey === wallet.publicKey.toBase58()) {
          return localState.tokens[mintAddress] || 0;
        }
      }
      
      return 0;
    }
  };

  // Функции для Invisible Wallet
  const purchaseWithStars = async (amount: number, description: string) => {
    const adapter = wallet.adapter as any;
    if (adapter?.purchaseWithStars) {
      return await adapter.purchaseWithStars(amount, description);
    }
    throw new Error("Stars purchases not supported");
  };

  const setupRecovery = async (contacts: any[]) => {
    const adapter = wallet.adapter as any;
    if (adapter?.setupRecovery) {
      return await adapter.setupRecovery(contacts);
    }
    throw new Error("Recovery setup not supported");
  };

  const getStarsBalance = async () => {
    const adapter = wallet.adapter as any;
    if (adapter?.getStarsBalance) {
      return await adapter.getStarsBalance();
    }
    return 0;
  };

  return {
    ...wallet,
    connectWallet,
    disconnectWallet,
    signMessage,
    sendTransaction,
    getBalance,
    getTokenBalance,
    purchaseWithStars,
    setupRecovery,
    getStarsBalance,
    isInvisibleWallet: (wallet.adapter as any)?.isInvisible || false
  };
}

export {
  NDT_MINT_ADDRESS,
  NDT_PROGRAM_ID,
  STAKING_PROGRAM_ID,
  TRACKNFT_PROGRAM_ID,
};

// Хелпер для создания транзакции
export async function createTransaction(
  connection: Connection,
  wallet: WalletAdapter,
  instructions: unknown[],
  signers: unknown[] = []
): Promise<Transaction> {
  const transaction = new Transaction();

  // Добавляем инструкции
  instructions.forEach((instruction) => {
    transaction.add(instruction);
  });

  // Добавим recentBlockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  if (!wallet.publicKey) {
    throw new Error("Wallet public key is not available");
  }
  transaction.feePayer = wallet.publicKey;

  return transaction;
}

// Функция для форматирования адреса
export function formatAddress(address: PublicKey, length: number = 4): string {
  const str = address.toBase58();
  return `${str.slice(0, length)}...${str.slice(-length)}`;
}

// Функция для проверки валидности адреса
export function isValidAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

// Функция для конвертации SOL в lamports
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

// Функция для конвертации lamports в SOL
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

// Функция для форматирования суммы в SOL
export function formatSol(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount);
}

// Функция для форматирования суммы в токенах
export function formatTokens(amount: number, decimals: number = 9): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  }).format(amount);
}

// Типы для событий кошелька
export interface WalletEvent {
  type: "connect" | "disconnect" | "accountChange" | "chainChange";
  data?: unknown;
}

// Эмиттер событий для кошелька
export class WalletEventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: (...args: unknown[]) => unknown) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (...args: unknown[]) => unknown) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: unknown) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }
}

// Глобальный эмиттер событий
export const walletEmitter = new WalletEventEmitter();