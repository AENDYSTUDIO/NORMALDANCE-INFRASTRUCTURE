"use client";

import { useTonConnectUI } from "@tonconnect/ui-react";
import React, { createContext, useContext, useEffect, useState } from "react";

interface TonConnectContextType {
  connected: boolean;
  account: unknown;
  network: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  sendTransaction: (params: unknown) => Promise<any>;
}

const TonConnectContext = createContext<TonConnectContextType | undefined>(
  undefined
);

export function TonConnectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tonConnectUI] = useTonConnectUI();
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<any>(null);
  const [network, setNetwork] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        setConnected(true);
        setAccount(wallet.account);
        setNetwork(wallet.account.chain === "-239" ? "mainnet" : "testnet");
      } else {
        setConnected(false);
        setAccount(null);
        setNetwork(null);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [tonConnectUI]);

  const connectWallet = async () => {
    try {
      await tonConnectUI.connectWallet();
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    try {
      await tonConnectUI.disconnect();
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      throw error;
    }
  };

  const sendTransaction = async (params: unknown) => {
    try {
      return await tonConnectUI.sendTransaction(params);
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw error;
    }
  };

  const contextValue: TonConnectContextType = {
    connected,
    account,
    network,
    connectWallet,
    disconnectWallet,
    sendTransaction,
  };

  return (
    <TonConnectContext.Provider value={contextValue}>
      {children}
    </TonConnectContext.Provider>
  );
}

export function useTonConnect() {
  const context = useContext(TonConnectContext);
  if (context === undefined) {
    throw new Error("useTonConnect must be used within a TonConnectProvider");
  }
  return context;
}
