import * as Sentry from "@sentry/nextjs";
import {
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  NDT_PROGRAM_ID,
  NDT_MINT_ADDRESS,
  TRACKNFT_PROGRAM_ID,
  STAKING_PROGRAM_ID,
} from "@/constants/solana";

// Конфигурация сети
const NETWORK = WalletAdapterNetwork.Devnet;
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
  return new Connection(RPC_URL, {
    commitment: "confirmed",
    // Use a fetch with AbortSignal timeout to avoid hanging requests
    // @ts-ignore - web3.js supports custom fetch
    fetch: (url: string, options?: any) =>
      fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) as any }),
  } as any);
}

// Инициализация кошелька Phantom
export function createPhantomWallet(): PhantomWalletAdapter {
  return new PhantomWalletAdapter();
}

// Хук для использования кошелька
export function useSolanaWallet() {
  const wallet = useWallet();
  const { connection } = useConnection();

  const connectWallet = async () => {
    if (!wallet.connected) {
      if (!wallet.connect)
        throw new Error("Wallet does not support connection");
      await wallet.connect();
    }
  };

  const disconnectWallet = async () => {
    if (wallet.connected) {
      if (!wallet.disconnect)
        throw new Error("Wallet does not support disconnection");
      await wallet.disconnect();
    }
  };

  const signMessage = async (message: Uint8Array): Promise<Uint8Array> => {
    if (!wallet.connected) throw new WalletNotConnectedError();
    if (!wallet.signMessage)
      throw new Error("Wallet does not support message signing");

    try {
      return await wallet.signMessage(message);
    } catch (error) {
      console.error("Error signing message:", error);
      Sentry.captureException(error);
      throw error;
    }
  };

  const sendTransaction = async (transaction: Transaction): Promise<string> => {
    if (!wallet.connected) throw new WalletNotConnectedError();
    if (!wallet.sendTransaction)
      throw new Error("Wallet does not support transaction sending");

    try {
      const signature = await wallet.sendTransaction(transaction, connection);
      return signature;
    } catch (error) {
      console.error("Error sending transaction:", error);
      Sentry.captureException(error);
      throw error;
    }
  };

  const getBalance = async (): Promise<number> => {
    if (!wallet.publicKey) return 0;

    try {
      const balance = await connection.getBalance(wallet.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error("Error getting balance:", error);
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
      console.error("Error getting token balance:", error);
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

export { NDT_PROGRAM_ID, NDT_MINT_ADDRESS, TRACKNFT_PROGRAM_ID, STAKING_PROGRAM_ID };

// Хелпер для создания транзакции
export async function createTransaction(
  connection: Connection,
  wallet: WalletAdapter,
  instructions: any[],
  signers: any[] = []
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
  data?: any;
}

// Эмиттер событий для кошелька
export class WalletEventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }
}

// Глобальный эмиттер событий
export const walletEmitter = new WalletEventEmitter();
