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
  // LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";

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

// Хук для использования кошелька
export function useSolanaWallet() {
  const wallet = useWallet();
  const connection = createConnection();

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
      const signature = await wallet.sendTransaction(transaction, connection);
      return signature;
    } catch (error) {
      logger.error("Error sending transaction", error as Error);
      Sentry.captureException(error);
      throw new ExternalServiceError("wallet-send-transaction", error as Error);
    }
  };

  const getBalance = async (): Promise<number> => {
    if (!wallet.publicKey) return 0;

    try {
      const balance = await connection.getBalance(wallet.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      logger.error("Error getting balance", error as Error, {
        publicKey: wallet.publicKey?.toBase58(),
      });
      Sentry.captureException(error);
      return 0;
    }
  };

  const getTokenBalance = async (mintAddress: string): Promise<number> => {
    if (!wallet.publicKey) return 0;

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
        return 0;
      }

      // Парсим данные аккаунта
      const accountData = AccountLayout.decode(accountInfo.data);
      const balance = Number(accountData.amount);

      // Получаем количество десятичных знаков для токена
      const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);
      if (mintInfo.value?.data && "parsed" in mintInfo.value.data) {
        const decimals = mintInfo.value.data.parsed.info.decimals;
        return balance / Math.pow(10, decimals);
      }

      return balance;
    } catch (error) {
      logger.error("Error getting token balance", error as Error, {
        mintAddress,
        publicKey: wallet.publicKey?.toBase58(),
      });
      Sentry.captureException(error);
      return 0;
    }
  };

  return {
    ...wallet,
    connectWallet,
    disconnectWallet,
    signMessage,
    sendTransaction,
    getBalance,
    getTokenBalance,
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
