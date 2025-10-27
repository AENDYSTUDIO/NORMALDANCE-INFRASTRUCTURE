import { PublicKey, Transaction } from '@solana/web3.js';

/**
 * Wallet-related type definitions
 */

// Type for Solana transactions (compatible with both Transaction and VersionedTransaction)
export type SolanaTransaction = Transaction | Record<string, unknown>;

export interface WalletAdapter {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signTransaction<T extends SolanaTransaction>(transaction: T): Promise<T>;
  signAllTransactions<T extends SolanaTransaction>(transactions: T[]): Promise<T[]>;
  signMessage?(message: Uint8Array): Promise<Uint8Array>;
  sendTransaction?(transaction: SolanaTransaction): Promise<string>;
}

export interface WalletBalance {
  sol: number;
  ndt: number;
  ton?: number;
  usd?: number;
}

export interface WalletTransaction {
  signature: string;
  type: 'transfer' | 'stake' | 'unstake' | 'reward' | 'burn' | 'nft_mint' | 'nft_transfer';
  amount: number;
  from: string;
  to: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  fee?: number;
}

export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  chainId?: string;
  error?: Error;
}

export interface SignMessageParams {
  message: string | Uint8Array;
  display?: 'utf8' | 'hex';
}

export interface SignTransactionParams {
  transaction: SolanaTransaction;
  sendOptions?: {
    skipPreflight?: boolean;
    preflightCommitment?: string;
  };
}

export interface TONWalletAdapter {
  address: string | null;
  connected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendTransaction(params: TONTransactionParams): Promise<string>;
}

export interface TONTransactionParams {
  to: string;
  value: string;
  payload?: string;
  stateInit?: string;
}

export interface MultiWalletState {
  solana: WalletConnectionState;
  ton: WalletConnectionState;
  activeWallet: 'solana' | 'ton' | null;
}