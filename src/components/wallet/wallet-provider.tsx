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
import { createAutoWalletAdapter, ExtendedWalletAdapter } from "./wallet-adapter";
import { TelegramUtils } from "@/lib/wallet/utils";
import { AutoConnectProvider } from "./invisible-wallet-provider";
import { InvisibleTransactionUI } from "./invisible-transaction-ui";
import { InvisibleWalletDashboard } from "./invisible-wallet-dashboard";
import { logger } from "@/lib/utils/logger";

// Расширенный интерфейс для контекста кошелька
interface WalletContextType {
  connected: boolean;
  publicKey: PublicKey | null;
  balance: number | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  error: string | null;
  isInvisibleWallet: boolean;
  purchaseWithStars?: (amount: number, description: string) => Promise<any>;
  setupRecovery?: (contacts: any[]) => Promise<void>;
  starsBalance?: number;
  recoverySetup?: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Провайдер кошелька
export function WalletProviderWrapper({ children }: { children: ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = "https://api.devnet.solana.com";

  // Динамически загружаем адаптеры кошельков только при необходимости
  const [walletAdapters, setWalletAdapters] = useState<any[]>([]);
  const [isInvisibleWallet, setIsInvisibleWallet] = useState(false);
  const [starsBalance, setStarsBalance] = useState<number | null>(null);
  const [recoverySetup, setRecoverySetup] = useState(false);

  useEffect(() => {
    // Асинхронно загружаем адаптеры кошельков
    const loadWalletAdapters = async () => {
      try {
        // Проверяем, находимся ли в Telegram
        if (TelegramUtils.isTelegramWebApp()) {
          logger.info("Telegram WebApp detected, using Invisible Wallet");
          setIsInvisibleWallet(true);
          
          // В Telegram используем только Invisible Wallet
          const invisibleAdapter = createAutoWalletAdapter();
          if (invisibleAdapter) {
            setWalletAdapters([invisibleAdapter]);
            return;
          }
        }
        
        // Загружаем стандартные адаптеры для веба
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
        logger.error("Failed to load wallet adapters", error as Error);
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
          <AutoConnectProvider>
            <WalletInnerProvider
              isInvisibleWallet={isInvisibleWallet}
              starsBalance={starsBalance}
              setStarsBalance={setStarsBalance}
              recoverySetup={recoverySetup}
              setRecoverySetup={setRecoverySetup}
            >
              {children}
            </WalletInnerProvider>
          </AutoConnectProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// Внутренний провайдер для управления состоянием
function WalletInnerProvider({
  children,
  isInvisibleWallet,
  starsBalance,
  setStarsBalance,
  recoverySetup,
  setRecoverySetup
}: {
  children: ReactNode;
  isInvisibleWallet: boolean;
  starsBalance: number | null;
  setStarsBalance: (balance: number | null) => void;
  recoverySetup: boolean;
  setRecoverySetup: (setup: boolean) => void;
}) {
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

  // Функции для Invisible Wallet
  const purchaseWithStars = async (amount: number, description: string) => {
    const adapter = wallet?.adapter as any;
    if (adapter?.purchaseWithStars) {
      try {
        const result = await adapter.purchaseWithStars(amount, description);
        return result;
      } catch (error) {
        logger.error("Failed to purchase with Stars", error as Error);
        throw error;
      }
    }
    throw new Error("Stars purchases not supported");
  };

  const setupRecovery = async (contacts: any[]) => {
    const adapter = wallet?.adapter as any;
    if (adapter?.setupRecovery) {
      try {
        await adapter.setupRecovery(contacts);
        setRecoverySetup(true);
      } catch (error) {
        logger.error("Failed to setup recovery", error as Error);
        throw error;
      }
    }
    throw new Error("Recovery setup not supported");
  };

  const getStarsBalance = async () => {
    const adapter = wallet?.adapter as any;
    if (adapter?.getStarsBalance) {
      try {
        const balance = await adapter.getStarsBalance();
        setStarsBalance(balance);
        return balance;
      } catch (error) {
        logger.error("Failed to get Stars balance", error as Error);
        throw error;
      }
    }
    return 0;
  };

  // Загрузка баланса Stars для Invisible Wallet
  useEffect(() => {
    if (isInvisibleWallet && connected && wallet?.adapter) {
      const loadStarsBalance = async () => {
        try {
          await getStarsBalance();
        } catch (error) {
          console.error("Failed to load Stars balance:", error);
        }
      };
      
      loadStarsBalance();
    }
  }, [isInvisibleWallet, connected, wallet?.adapter]);

  // Проверка настройки восстановления
  useEffect(() => {
    if (isInvisibleWallet && connected && wallet?.adapter) {
      const checkRecoverySetup = async () => {
        try {
          // В реальной реализации здесь будет проверка настроек восстановления
          // const setup = await wallet.adapter.isRecoverySetup?.();
          // setRecoverySetup(setup || false);
        } catch (error) {
          console.error("Failed to check recovery setup:", error);
        }
      };
      
      checkRecoverySetup();
    }
  }, [isInvisibleWallet, connected, wallet?.adapter]);

  const value: WalletContextType = {
    connected,
    publicKey,
    balance,
    connect,
    disconnect,
    isConnecting,
    error,
    isInvisibleWallet,
    purchaseWithStars,
    setupRecovery,
    starsBalance,
    recoverySetup
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
      <InvisibleTransactionUI />
      <InvisibleWalletDashboard />
    </WalletContext.Provider>
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
  instructions: unknown[];
  signers?: unknown[];
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
      params.instructions.forEach((instruction: unknown) => {
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
    } catch (error: unknown) {
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
