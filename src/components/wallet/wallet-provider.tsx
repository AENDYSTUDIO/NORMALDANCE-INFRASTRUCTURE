"use client";

import { Button } from "@/components/ui/button";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { walletEmitter } from "./wallet-adapter";
import { WalletConnect } from "./wallet-connect";

// Интерфейс для контекста кошелька
interface WalletContextType {
  connected: boolean;
  publicKey: PublicKey | null;
  balance: number | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Провайдер кошелька
export function WalletProviderWrapper({ children }: { children: ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = "https://api.devnet.solana.com";

  // Динамически загружаем адаптеры кошельков только при необходимости
  const [walletAdapters, setWalletAdapters] = useState<any[]>([]);

  useEffect(() => {
    // Асинхронно загружаем адаптеры кошельков
    const loadWalletAdapters = async () => {
      try {
        // Загружаем только те адаптеры, которые действительно нужны
        const phantomModule = await import("@solana/wallet-adapter-phantom");
        const solflareModule = await import("@solana/wallet-adapter-solflare");

        const PhantomWalletAdapter = phantomModule.PhantomWalletAdapter;
        const SolflareWalletAdapter = solflareModule.SolflareWalletAdapter;

        setWalletAdapters([
          new PhantomWalletAdapter(),
          new SolflareWalletAdapter(),
        ]);
      } catch (error) {
        console.error("Failed to load wallet adapters:", error);
        // В случае ошибки используем пустой массив адаптеров
        setWalletAdapters([]);
      }
    };

    loadWalletAdapters();
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={walletAdapters}>
        <WalletModalProvider>
          <WalletInnerProvider>{children}</WalletInnerProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// Внутренний провайдер для управления состоянием
function WalletInnerProvider({ children }: { children: ReactNode }) {
  const { connected, publicKey, wallet } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Получение баланса при изменении publicKey
  useEffect(() => {
    const updateBalance = async () => {
      if (publicKey && connection) {
        try {
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / 1e9); // Конвертация в SOL
        } catch (err) {
          console.error("Error getting balance:", err);
          setBalance(null);
        }
      } else {
        setBalance(null);
      }
    };

    updateBalance();

    // Подписка на изменения баланса
    let subscriptionId: number | null = null;
    if (publicKey && connection) {
      subscriptionId = connection.onAccountChange(
        publicKey,
        updateBalance,
        "confirmed"
      );
    }

    return () => {
      if (subscriptionId) {
        connection.removeAccountChangeListener(subscriptionId);
      }
    };
  }, [publicKey, connection]);

  // Обработка событий подключения/отключения
  useEffect(() => {
    const handleConnect = () => {
      setError(null);
      walletEmitter.emit("connect", publicKey?.toBase58());
    };

    const handleDisconnect = () => {
      setBalance(null);
      setError(null);
      walletEmitter.emit("disconnect");
    };

    const handleError = (err: Error) => {
      setError(err.message);
      walletEmitter.emit("error", err);
    };

    if (wallet) {
      wallet.on("connect", handleConnect);
      wallet.on("disconnect", handleDisconnect);
      wallet.on("error", handleError);

      return () => {
        wallet.off("connect", handleConnect);
        wallet.off("disconnect", handleDisconnect);
        wallet.off("error", handleError);
      };
    }
  }, [wallet, publicKey]);

  const connect = async () => {
    if (!wallet) {
      setError("Кошелек не доступен");
      return;
    }

    setIsConnecting(true);
    setError(null);
    try {
      await wallet.connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка подключения");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!wallet) {
      setError("Кошелек не подключен");
      return;
    }

    setIsConnecting(true);
    setError(null);
    try {
      await wallet.disconnect();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отключения");
    } finally {
      setIsConnecting(false);
    }
  };

  const value: WalletContextType = {
    connected,
    publicKey,
    balance,
    connect,
    disconnect,
    isConnecting,
    error,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

// Хук для использования кошелька
export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error(
      "useWalletContext must be used within a WalletProviderWrapper"
    );
  }
  return context;
}

// Компонент для отображения состояния кошелька
export function WalletStatus() {
  const { connected, publicKey, balance, error } = useWalletContext();

  if (!connected) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      {publicKey && (
        <span className="font-mono text-xs">
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </span>
      )}
      {balance !== null && (
        <span className="text-muted-foreground">{balance.toFixed(4)} SOL</span>
      )}
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}

// Компонент для подключения кошелька (альтернатива WalletConnect)
export function WalletConnectButton() {
  const { connected, connect, disconnect, isConnecting, error } =
    useWalletContext();

  if (connected) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={disconnect}
        disabled={isConnecting}
      >
        Отключить
      </Button>
    );
  }

  return (
    <Button onClick={connect} disabled={isConnecting} size="sm">
      {isConnecting ? "Подключение..." : "Подключить кошелек"}
    </Button>
  );
}

// HOC для обертки компонентов, требующих подключения кошелька
export function withWallet<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WrappedComponent(props: P) {
    const { connected } = useWalletContext();

    if (!connected) {
      return (
        fallback || (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Пожалуйста, подключите кошелек для использования этой функции
              </p>
              <WalletConnect />
            </div>
          </div>
        )
      );
    }

    return <Component {...props} />;
  };
}

// Типы для транзакций
export interface TransactionParams {
  instructions: any[];
  signers?: any[];
  feePayer?: PublicKey;
  commitment?: "processed" | "confirmed" | "finalized";
}

// Хук для отправки транзакций
export function useTransactions() {
  const { connection } = useConnection();
  const { wallet } = useWallet();

  const sendTransaction = async (params: TransactionParams) => {
    if (!wallet) throw new Error("Кошелек не подключен");

    try {
      const transaction = new Transaction();

      // Добавляем инструкции
      params.instructions.forEach((instruction: any) => {
        transaction.add(instruction);
      });

      // Добавляем recentBlockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = params.feePayer || wallet.publicKey!;

      // Подписываем транзакцию
      const signedTransaction = await wallet.signTransaction(transaction);

      // Отправляем транзакцию
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      // Ждем подтверждения с заданным уровнем подтверждения
      const commitment = params.commitment || "confirmed";
      await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight: await connection.getBlockHeight(),
        },
        commitment
      );

      return signature;
    } catch (error: any) {
      console.error("Transaction error:", error);
      // Более детальная обработка ошибок
      if (error.message.includes("Transaction was not confirmed")) {
        throw new Error(
          "Транзакция не была подтверждена в сети. Попробуйте позже."
        );
      } else if (error.message.includes("Insufficient funds")) {
        throw new Error("Недостаточно средств для выполнения транзакции.");
      } else if (error.message.includes("Blockhash not found")) {
        throw new Error("Транзакция истекла. Попробуйте снова.");
      }
      throw error;
    }
  };

  return { sendTransaction };
}
