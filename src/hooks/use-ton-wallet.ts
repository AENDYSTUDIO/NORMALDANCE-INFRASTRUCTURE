"use client";

import { Address } from "@ton/core";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useEffect, useState } from "react";

export interface WalletState {
  connected: boolean;
  address: string | null;
  balance: string | null;
  network: string | null;
  error: string | null;
}

export function useTonWallet() {
  const [tonConnectUI] = useTonConnectUI();
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    address: null,
    balance: null,
    network: null,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to wallet status changes
    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        // Wallet connected
        const address = wallet.account.address;
        const network = wallet.account.chain;

        setWalletState({
          connected: true,
          address,
          balance: null, // Will be loaded separately
          network: network === "-239" ? "mainnet" : "testnet",
          error: null,
        });

        // Load balance
        loadBalance(address);
      } else {
        // Wallet disconnected
        setWalletState({
          connected: false,
          address: null,
          balance: null,
          network: null,
          error: null,
        });
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [tonConnectUI]);

  const loadBalance = async (address: string) => {
    try {
      setIsLoading(true);

      // In a real implementation, you would:
      // 1. Connect to TON RPC
      // 2. Query the account balance
      // 3. Format the balance

      // For now, we'll simulate with a mock value
      const balance = "0"; // Mock balance

      setWalletState((prev) => ({
        ...prev,
        balance,
      }));
    } catch (error) {
      console.error("Error loading balance:", error);
      setWalletState((prev) => ({
        ...prev,
        error: "Failed to load balance",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      await tonConnectUI.connectWallet();
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setWalletState((prev) => ({
        ...prev,
        error: "Failed to connect wallet",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      setIsLoading(true);
      await tonConnectUI.disconnect();
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      setWalletState((prev) => ({
        ...prev,
        error: "Failed to disconnect wallet",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const sendTransaction = async (
    to: string,
    amount: string,
    payload?: string
  ) => {
    try {
      setIsLoading(true);

      // Validate address
      const address = Address.parse(to);

      // Send transaction
      const result = await tonConnectUI.sendTransaction({
        messages: [
          {
            address: address.toString(),
            amount: amount,
            payload: payload,
          },
        ],
        validUntil: Date.now() + 5 * 60 * 1000, // 5 minutes
      });

      return result;
    } catch (error) {
      console.error("Error sending transaction:", error);
      setWalletState((prev) => ({
        ...prev,
        error: "Failed to send transaction",
      }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (
    address: string | null,
    length: number = 4
  ): string => {
    if (!address) return "";
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  };

  return {
    ...walletState,
    isLoading,
    connectWallet,
    disconnectWallet,
    sendTransaction,
    formatAddress,
  };
}
