/* eslint-disable @typescript-eslint/no-require-imports */
import {
  createConnection,
  createPhantomWallet,
  createTransaction,
  formatAddress,
  formatSol,
  formatTokens,
  isValidAddress,
  lamportsToSol,
  NDT_MINT_ADDRESS,
  NDT_PROGRAM_ID,
  solToLamports,
  STAKING_PROGRAM_ID,
  TRACKNFT_PROGRAM_ID,
  useSolanaWallet,
  WalletEventEmitter,
} from "@/components/wallet/wallet-adapter";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

// Mock external dependencies
jest.mock("@solana/web3.js");
jest.mock("@solana/wallet-adapter-phantom");
jest.mock("@solana/wallet-adapter-base");

describe("Wallet Adapter - Unit Tests", () => {
  describe("createConnection", () => {
    it("should create connection with default RPC URL", () => {
      const connection = createConnection();
      expect(connection).toBeInstanceOf(Connection);
      expect(Connection).toHaveBeenCalledWith(
        "https://api.devnet.solana.com",
        "confirmed"
      );
    });

    it("should create connection with custom RPC URL from environment", () => {
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL = "https://custom.rpc.url";
      const connection = createConnection();
      expect(Connection).toHaveBeenCalledWith(
        "https://custom.rpc.url",
        "confirmed"
      );
      delete process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    });
  });

  describe("createPhantomWallet", () => {
    it("should create Phantom wallet adapter", () => {
      const wallet = createPhantomWallet();
      expect(wallet).toBeInstanceOf(PhantomWalletAdapter);
      expect(PhantomWalletAdapter).toHaveBeenCalledTimes(1);
    });
  });

  describe("useSolanaWallet", () => {
    let mockWallet: any;
    let mockConnection: any;

    beforeEach(() => {
      mockWallet = {
        connected: false,
        publicKey: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        signTransaction: jest.fn(),
        signAllTransactions: jest.fn(),
        sendTransaction: jest.fn(),
        signMessage: jest.fn(),
      };

      mockConnection = {
        getBalance: jest.fn(),
        getLatestBlockhash: jest.fn(),
        sendRawTransaction: jest.fn(),
        confirmTransaction: jest.fn(),
      };

      // Mock the wallet hooks
      require("@/components/wallet/wallet-adapter").useWallet = () =>
        mockWallet;
      require("@/components/wallet/wallet-adapter").useConnection = () => ({
        connection: mockConnection,
      });
    });

    it("should return wallet state with extended methods", () => {
      const wallet = useSolanaWallet();
      expect(wallet).toHaveProperty("connected");
      expect(wallet).toHaveProperty("publicKey");
      expect(wallet).toHaveProperty("connectWallet");
      expect(wallet).toHaveProperty("disconnectWallet");
      expect(wallet).toHaveProperty("signMessage");
      expect(wallet).toHaveProperty("sendTransaction");
      expect(wallet).toHaveProperty("getBalance");
      expect(wallet).toHaveProperty("getTokenBalance");
    });

    describe("connectWallet", () => {
      it("should call wallet connect when not connected", async () => {
        mockWallet.connected = false;
        const wallet = useSolanaWallet();
        await wallet.connectWallet();
        expect(mockWallet.connect).toHaveBeenCalledTimes(1);
      });

      it("should not call wallet connect when already connected", async () => {
        mockWallet.connected = true;
        const wallet = useSolanaWallet();
        await wallet.connectWallet();
        expect(mockWallet.connect).not.toHaveBeenCalled();
      });

      it("should throw error if wallet does not support connection", async () => {
        mockWallet.connected = false;
        mockWallet.connect = undefined;
        const wallet = useSolanaWallet();
        await expect(wallet.connectWallet()).rejects.toThrow(
          "Wallet does not support connection"
        );
      });
    });

    describe("disconnectWallet", () => {
      it("should call wallet disconnect when connected", async () => {
        mockWallet.connected = true;
        const wallet = useSolanaWallet();
        await wallet.disconnectWallet();
        expect(mockWallet.disconnect).toHaveBeenCalledTimes(1);
      });

      it("should not call wallet disconnect when not connected", async () => {
        mockWallet.connected = false;
        const wallet = useSolanaWallet();
        await wallet.disconnectWallet();
        expect(mockWallet.disconnect).not.toHaveBeenCalled();
      });

      it("should throw error if wallet does not support disconnection", async () => {
        mockWallet.connected = true;
        mockWallet.disconnect = undefined;
        const wallet = useSolanaWallet();
        await expect(wallet.disconnectWallet()).rejects.toThrow(
          "Wallet does not support disconnection"
        );
      });
    });

    describe("signMessage", () => {
      it("should sign message when wallet is connected", async () => {
        mockWallet.connected = true;
        mockWallet.signMessage = jest
          .fn()
          .mockResolvedValue(new Uint8Array([1, 2, 3]));
        const wallet = useSolanaWallet();
        const message = new Uint8Array([1, 2, 3]);
        const result = await wallet.signMessage(message);
        expect(mockWallet.signMessage).toHaveBeenCalledWith(message);
        expect(result).toEqual(new Uint8Array([1, 2, 3]));
      });

      it("should throw WalletNotConnectedError when wallet is not connected", async () => {
        mockWallet.connected = false;
        const wallet = useSolanaWallet();
        const message = new Uint8Array([1, 2, 3]);
        await expect(wallet.signMessage(message)).rejects.toThrow(
          WalletNotConnectedError
        );
      });

      it("should throw error if wallet does not support message signing", async () => {
        mockWallet.connected = true;
        mockWallet.signMessage = undefined;
        const wallet = useSolanaWallet();
        const message = new Uint8Array([1, 2, 3]);
        await expect(wallet.signMessage(message)).rejects.toThrow(
          "Wallet does not support message signing"
        );
      });

      it("should handle and re-throw signing errors", async () => {
        mockWallet.connected = true;
        mockWallet.signMessage = jest
          .fn()
          .mockRejectedValue(new Error("Signing failed"));
        const wallet = useSolanaWallet();
        const message = new Uint8Array([1, 2, 3]);
        await expect(wallet.signMessage(message)).rejects.toThrow(
          "Signing failed"
        );
      });
    });

    describe("sendTransaction", () => {
      it("should send transaction when wallet is connected", async () => {
        mockWallet.connected = true;
        mockWallet.sendTransaction = jest
          .fn()
          .mockResolvedValue("signature123");
        const wallet = useSolanaWallet();
        const transaction = new Transaction();
        const result = await wallet.sendTransaction(transaction);
        expect(mockWallet.sendTransaction).toHaveBeenCalledWith(
          transaction,
          mockConnection
        );
        expect(result).toBe("signature123");
      });

      it("should throw WalletNotConnectedError when wallet is not connected", async () => {
        mockWallet.connected = false;
        const wallet = useSolanaWallet();
        const transaction = new Transaction();
        await expect(wallet.sendTransaction(transaction)).rejects.toThrow(
          WalletNotConnectedError
        );
      });

      it("should throw error if wallet does not support transaction sending", async () => {
        mockWallet.connected = true;
        mockWallet.sendTransaction = undefined;
        const wallet = useSolanaWallet();
        const transaction = new Transaction();
        await expect(wallet.sendTransaction(transaction)).rejects.toThrow(
          "Wallet does not support transaction sending"
        );
      });

      it("should handle and re-throw transaction errors", async () => {
        mockWallet.connected = true;
        mockWallet.sendTransaction = jest
          .fn()
          .mockRejectedValue(new Error("Transaction failed"));
        const wallet = useSolanaWallet();
        const transaction = new Transaction();
        await expect(wallet.sendTransaction(transaction)).rejects.toThrow(
          "Transaction failed"
        );
      });
    });

    describe("getBalance", () => {
      it("should return balance when wallet is connected", async () => {
        mockWallet.connected = true;
        mockWallet.publicKey = new PublicKey("testPublicKey");
        mockConnection.getBalance = jest
          .fn()
          .mockResolvedValue(LAMPORTS_PER_SOL * 2.5);
        const wallet = useSolanaWallet();
        const balance = await wallet.getBalance();
        expect(mockConnection.getBalance).toHaveBeenCalledWith(
          mockWallet.publicKey
        );
        expect(balance).toBe(2.5);
      });

      it("should return 0 when wallet is not connected", async () => {
        mockWallet.connected = false;
        const wallet = useSolanaWallet();
        const balance = await wallet.getBalance();
        expect(balance).toBe(0);
      });

      it("should return 0 and handle errors gracefully", async () => {
        mockWallet.connected = true;
        mockWallet.publicKey = new PublicKey("testPublicKey");
        mockConnection.getBalance = jest
          .fn()
          .mockRejectedValue(new Error("Network error"));
        const wallet = useSolanaWallet();
        const balance = await wallet.getBalance();
        expect(balance).toBe(0);
      });
    });

    describe("getTokenBalance", () => {
      it("should return 0 when wallet is not connected", async () => {
        mockWallet.connected = false;
        const wallet = useSolanaWallet();
        const balance = await wallet.getTokenBalance("test-mint-address");
        expect(balance).toBe(0);
      });

      it("should return 0 and handle errors gracefully", async () => {
        mockWallet.connected = true;
        mockWallet.publicKey = new PublicKey("testPublicKey");
        const wallet = useSolanaWallet();
        const balance = await wallet.getTokenBalance("test-mint-address");
        expect(balance).toBe(0);
      });
    });
  });

  describe("Utility Functions", () => {
    describe("formatAddress", () => {
      it("should format address with default length", () => {
        const publicKey = new PublicKey(
          "1111111111111111111111111111111111111111111"
        );
        const formatted = formatAddress(publicKey);
        expect(formatted).toBe("1111...1111");
      });

      it("should format address with custom length", () => {
        const publicKey = new PublicKey(
          "1111111111111111111111111111111111111111111"
        );
        const formatted = formatAddress(publicKey, 6);
        expect(formatted).toBe("111111...111111");
      });
    });

    describe("isValidAddress", () => {
      it("should return true for valid address", () => {
        const validAddress = "1111111111111111111111111111111111111111111";
        expect(isValidAddress(validAddress)).toBe(true);
      });

      it("should return false for invalid address", () => {
        const invalidAddress = "invalid-address";
        expect(isValidAddress(invalidAddress)).toBe(false);
      });

      it("should return false for empty address", () => {
        expect(isValidAddress("")).toBe(false);
      });
    });

    describe("solToLamports", () => {
      it("should convert SOL to lamports correctly", () => {
        expect(solToLamports(1)).toBe(LAMPORTS_PER_SOL);
        expect(solToLamports(2.5)).toBe(2.5 * LAMPORTS_PER_SOL);
        expect(solToLamports(0)).toBe(0);
      });

      it("should handle fractional SOL", () => {
        expect(solToLamports(0.5)).toBe(0.5 * LAMPORTS_PER_SOL);
        expect(solToLamports(1.234567)).toBe(
          Math.floor(1.234567 * LAMPORTS_PER_SOL)
        );
      });
    });

    describe("lamportsToSol", () => {
      it("should convert lamports to SOL correctly", () => {
        expect(lamportsToSol(LAMPORTS_PER_SOL)).toBe(1);
        expect(lamportsToSol(2.5 * LAMPORTS_PER_SOL)).toBe(2.5);
        expect(lamportsToSol(0)).toBe(0);
      });

      it("should handle fractional lamports", () => {
        expect(lamportsToSol(0.5 * LAMPORTS_PER_SOL)).toBe(0.5);
      });
    });

    describe("formatSol", () => {
      it("should format SOL amount with Russian locale", () => {
        expect(formatSol(1)).toBe("1.00");
        expect(formatSol(1234.56789)).toBe("1 234.567890");
        expect(formatSol(0.5)).toBe("0.50");
      });

      it("should handle minimum and maximum fraction digits", () => {
        expect(formatSol(1.23456789)).toBe("1.234568");
        expect(formatSol(1234567.89)).toBe("1 234 567.890000");
      });
    });

    describe("formatTokens", () => {
      it("should format token amount with Russian locale", () => {
        expect(formatTokens(1000)).toBe("1 000.00");
        expect(formatTokens(1234567.89, 6)).toBe("1 234 567.890000");
      });

      it("should handle custom decimals", () => {
        expect(formatTokens(1000, 2)).toBe("1 000.00");
        expect(formatTokens(1000, 0)).toBe("1 000");
      });
    });
  });

  describe("createTransaction", () => {
    it("should create transaction with instructions", async () => {
      const mockConnection = {
        getLatestBlockhash: jest.fn().mockResolvedValue({
          blockhash: "test-blockhash",
          lastValidBlockHeight: 100,
        }),
      } as any;

      const mockWallet = {
        publicKey: new PublicKey("test-public-key"),
      } as any;

      const instructions = [
        SystemProgram.transfer({
          fromPubkey: new PublicKey("test-from"),
          toPubkey: new PublicKey("test-to"),
          lamports: 1000,
        }),
      ];

      const transaction = await createTransaction(
        mockConnection,
        mockWallet,
        instructions
      );

      expect(transaction).toBeInstanceOf(Transaction);
      expect(transaction.instructions).toHaveLength(1);
      expect(transaction.recentBlockhash).toBe("test-blockhash");
      expect(transaction.feePayer).toEqual(new PublicKey("test-public-key"));
    });

    it("should throw error if wallet public key is not available", async () => {
      const mockConnection = {
        getLatestBlockhash: jest.fn().mockResolvedValue({
          blockhash: "test-blockhash",
        }),
      } as any;

      const mockWallet = {
        publicKey: null,
      } as any;

      const instructions = [];

      await expect(
        createTransaction(mockConnection, mockWallet, instructions)
      ).rejects.toThrow("Wallet public key is not available");
    });

    it("should create transaction with signers", async () => {
      const mockConnection = {
        getLatestBlockhash: jest.fn().mockResolvedValue({
          blockhash: "test-blockhash",
        }),
      } as any;

      const mockWallet = {
        publicKey: new PublicKey("test-public-key"),
      } as any;

      const instructions = [];
      const signers = [];

      const transaction = await createTransaction(
        mockConnection,
        mockWallet,
        instructions,
        signers
      );

      expect(transaction).toBeInstanceOf(Transaction);
      expect(transaction.instructions).toHaveLength(0);
    });
  });

  describe("WalletEventEmitter", () => {
    let emitter: WalletEventEmitter;

    beforeEach(() => {
      emitter = new WalletEventEmitter();
    });

    it("should add event listener", () => {
      const callback = jest.fn();
      emitter.on("connect", callback);
      expect(emitter["listeners"].get("connect")).toHaveLength(1);
    });

    it("should remove event listener", () => {
      const callback = jest.fn();
      emitter.on("connect", callback);
      emitter.off("connect", callback);
      expect(emitter["listeners"].get("connect")).toHaveLength(0);
    });

    it("should emit event to all listeners", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      emitter.on("connect", callback1);
      emitter.on("connect", callback2);
      emitter.emit("connect", { data: "test" });

      expect(callback1).toHaveBeenCalledWith({ data: "test" });
      expect(callback2).toHaveBeenCalledWith({ data: "test" });
    });

    it("should not emit event if no listeners", () => {
      const callback = jest.fn();
      emitter.emit("connect", { data: "test" });
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("Program Constants", () => {
    it("should have NDT_PROGRAM_ID", () => {
      expect(NDT_PROGRAM_ID).toBeInstanceOf(PublicKey);
    });

    it("should have NDT_MINT_ADDRESS", () => {
      expect(NDT_MINT_ADDRESS).toBeInstanceOf(PublicKey);
    });

    it("should have TRACKNFT_PROGRAM_ID", () => {
      expect(TRACKNFT_PROGRAM_ID).toBeInstanceOf(PublicKey);
    });

    it("should have STAKING_PROGRAM_ID", () => {
      expect(STAKING_PROGRAM_ID).toBeInstanceOf(PublicKey);
    });
  });

  describe("Edge Cases", () => {
    describe("useSolanaWallet edge cases", () => {
      let mockWallet: any;
      let mockConnection: any;

      beforeEach(() => {
        mockWallet = {
          connected: false,
          publicKey: null,
          connect: jest.fn(),
          disconnect: jest.fn(),
          signTransaction: jest.fn(),
          signAllTransactions: jest.fn(),
          sendTransaction: jest.fn(),
          signMessage: jest.fn(),
        };

        mockConnection = {
          getBalance: jest.fn(),
          getLatestBlockhash: jest.fn(),
          sendRawTransaction: jest.fn(),
          confirmTransaction: jest.fn(),
        };

        require("@/components/wallet/wallet-adapter").useWallet = () =>
          mockWallet;
        require("@/components/wallet/wallet-adapter").useConnection = () => ({
          connection: mockConnection,
        });
      });

      it("should handle null publicKey gracefully", async () => {
        mockWallet.connected = true;
        mockWallet.publicKey = null;
        const wallet = useSolanaWallet();
        const balance = await wallet.getBalance();
        expect(balance).toBe(0);
      });

      it("should handle undefined wallet methods gracefully", async () => {
        mockWallet.connected = true;
        mockWallet.sendTransaction = undefined;
        const wallet = useSolanaWallet();
        const transaction = new Transaction();
        await expect(wallet.sendTransaction(transaction)).rejects.toThrow(
          "Wallet does not support transaction sending"
        );
      });

      it("should handle network errors gracefully", async () => {
        mockWallet.connected = true;
        mockWallet.publicKey = new PublicKey("testPublicKey");
        mockConnection.getBalance = jest
          .fn()
          .mockRejectedValue(new Error("Network error"));
        const wallet = useSolanaWallet();
        const balance = await wallet.getBalance();
        expect(balance).toBe(0);
      });
    });
  });
});
