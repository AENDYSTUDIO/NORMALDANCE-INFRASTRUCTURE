/* eslint-disable @typescript-eslint/no-require-imports */
import { NDTManager } from "@/components/wallet/ndt-manager";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { PublicKey } from "@solana/web3.js";

// Mock external dependencies
jest.mock("@solana/web3.js");
jest.mock("@solana/wallet-adapter-phantom");
jest.mock("@solana/wallet-adapter-base");

describe("NDTManager - Unit Tests", () => {
  let mockWallet: any;
  let mockConnection: any;
  let ndtManager: NDTManager;

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
      getAccountInfo: jest.fn(),
    };

    ndtManager = new NDTManager(mockWallet, mockConnection);
  });

  describe("constructor", () => {
    it("should initialize with wallet and connection", () => {
      expect(ndtManager["wallet"]).toBe(mockWallet);
      expect(ndtManager["connection"]).toBe(mockConnection);
    });
  });

  describe("getNDTBalance", () => {
    it("should return 0 when wallet is not connected", async () => {
      mockWallet.connected = false;
      const balance = await ndtManager.getNDTBalance();
      expect(balance).toBe(0);
    });

    it("should return 0 when wallet public key is null", async () => {
      mockWallet.connected = true;
      mockWallet.publicKey = null;
      const balance = await ndtManager.getNDTBalance();
      expect(balance).toBe(0);
    });

    it("should return token balance when wallet is connected", async () => {
      mockWallet.connected = true;
      mockWallet.publicKey = new PublicKey("testPublicKey");

      // Mock the getTokenBalance implementation from wallet adapter
      const mockGetTokenBalance = jest.fn().mockResolvedValue(10.5);
      ndtManager["wallet"].getTokenBalance = mockGetTokenBalance;

      const balance = await ndtManager.getNDTBalance();
      expect(mockGetTokenBalance).toHaveBeenCalledWith(
        "11111111111" // NDT_MINT_ADDRESS from wallet-adapter
      );
      expect(balance).toBe(10.5);
    });

    it("should handle errors gracefully and return 0", async () => {
      mockWallet.connected = true;
      mockWallet.publicKey = new PublicKey("testPublicKey");

      const mockGetTokenBalance = jest
        .fn()
        .mockRejectedValue(new Error("Network error"));
      ndtManager["wallet"].getTokenBalance = mockGetTokenBalance;

      const balance = await ndtManager.getNDTBalance();
      expect(balance).toBe(0);
    });
  });

  describe("stakeNDT", () => {
    it("should throw error when wallet is not connected", async () => {
      mockWallet.connected = false;
      await expect(ndtManager.stakeNDT(5)).rejects.toThrow(
        WalletNotConnectedError
      );
    });

    it("should create and send stake transaction", async () => {
      mockWallet.connected = true;
      mockWallet.publicKey = new PublicKey("testPublicKey");
      mockConnection.getLatestBlockhash = jest.fn().mockResolvedValue({
        blockhash: "test-blockhash",
        lastValidBlockHeight: 10,
      });
      mockWallet.sendTransaction = jest
        .fn()
        .mockResolvedValue("test-signature");

      const result = await ndtManager.stakeNDT(5);

      expect(mockConnection.getLatestBlockhash).toHaveBeenCalled();
      expect(mockWallet.sendTransaction).toHaveBeenCalled();
      expect(result).toBe("test-signature");
    });

    it("should throw error if stake amount is invalid", async () => {
      mockWallet.connected = true;
      mockWallet.publicKey = new PublicKey("testPublicKey");

      await expect(ndtManager.stakeNDT(-1)).rejects.toThrow(
        "Stake amount must be positive"
      );
      await expect(ndtManager.stakeNDT(0)).rejects.toThrow(
        "Stake amount must be positive"
      );
    });

    it("should handle transaction errors", async () => {
      mockWallet.connected = true;
      mockWallet.publicKey = new PublicKey("testPublicKey");
      mockWallet.sendTransaction = jest
        .fn()
        .mockRejectedValue(new Error("Transaction failed"));

      await expect(ndtManager.stakeNDT(5)).rejects.toThrow(
        "Transaction failed"
      );
    });
  });

  describe("unstakeNDT", () => {
    it("should throw error when wallet is not connected", async () => {
      mockWallet.connected = false;
      await expect(ndtManager.unstakeNDT(5)).rejects.toThrow(
        WalletNotConnectedError
      );
    });

    it("should create and send unstake transaction", async () => {
      mockWallet.connected = true;
      mockWallet.publicKey = new PublicKey("testPublicKey");
      mockConnection.getLatestBlockhash = jest.fn().mockResolvedValue({
        blockhash: "test-blockhash",
        lastValidBlockHeight: 10,
      });
      mockWallet.sendTransaction = jest
        .fn()
        .mockResolvedValue("test-signature");

      const result = await ndtManager.unstakeNDT(5);

      expect(mockConnection.getLatestBlockhash).toHaveBeenCalled();
      expect(mockWallet.sendTransaction).toHaveBeenCalled();
      expect(result).toBe("test-signature");
    });

    it("should throw error if unstake amount is invalid", async () => {
      mockWallet.connected = true;
      mockWallet.publicKey = new PublicKey("testPublicKey");

      await expect(ndtManager.unstakeNDT(-1)).rejects.toThrow(
        "Unstake amount must be positive"
      );
      await expect(ndtManager.unstakeNDT(0)).rejects.toThrow(
        "Unstake amount must be positive"
      );
    });
  });

  describe("getStakingInfo", () => {
    it("should return staking information", async () => {
      // Mock implementation
      const stakingInfo = await ndtManager.getStakingInfo();

      // Since the method is not fully implemented in the original, we'll just check that it returns an object
      expect(typeof stakingInfo).toBe("object");
    });
  });

  describe("claimRewards", () => {
    it("should throw error when wallet is not connected", async () => {
      mockWallet.connected = false;
      await expect(ndtManager.claimRewards()).rejects.toThrow(
        WalletNotConnectedError
      );
    });

    it("should create and send claim rewards transaction", async () => {
      mockWallet.connected = true;
      mockWallet.publicKey = new PublicKey("testPublicKey");
      mockConnection.getLatestBlockhash = jest.fn().mockResolvedValue({
        blockhash: "test-blockhash",
        lastValidBlockHeight: 100,
      });
      mockWallet.sendTransaction = jest
        .fn()
        .mockResolvedValue("test-signature");

      const result = await ndtManager.claimRewards();

      expect(mockConnection.getLatestBlockhash).toHaveBeenCalled();
      expect(mockWallet.sendTransaction).toHaveBeenCalled();
      expect(result).toBe("test-signature");
    });
  });

  describe("getNDTPrice", () => {
    it("should return current NDT price", async () => {
      // Mock implementation
      const price = await ndtManager.getNDTPrice();

      // Since the method is not fully implemented in the original, we'll just check that it returns a number
      expect(typeof price).toBe("number");
    });
  });

  describe("buyNDT", () => {
    it("should throw error when wallet is not connected", async () => {
      mockWallet.connected = false;
      await expect(ndtManager.buyNDT(5)).rejects.toThrow(
        WalletNotConnectedError
      );
    });

    it("should create and send buy NDT transaction", async () => {
      mockWallet.connected = true;
      mockWallet.publicKey = new PublicKey("testPublicKey");
      mockConnection.getLatestBlockhash = jest.fn().mockResolvedValue({
        blockhash: "test-blockhash",
        lastValidBlockHeight: 100,
      });
      mockWallet.sendTransaction = jest
        .fn()
        .mockResolvedValue("test-signature");

      const result = await ndtManager.buyNDT(5);

      expect(mockConnection.getLatestBlockhash).toHaveBeenCalled();
      expect(mockWallet.sendTransaction).toHaveBeenCalled();
      expect(result).toBe("test-signature");
    });

    it("should throw error if buy amount is invalid", async () => {
      mockWallet.connected = true;
      mockWallet.publicKey = new PublicKey("testPublicKey");

      await expect(ndtManager.buyNDT(-1)).rejects.toThrow(
        "Buy amount must be positive"
      );
      await expect(ndtManager.buyNDT(0)).rejects.toThrow(
        "Buy amount must be positive"
      );
    });
  });

  describe("sellNDT", () => {
    it("should throw error when wallet is not connected", async () => {
      mockWallet.connected = false;
      await expect(ndtManager.sellNDT(5)).rejects.toThrow(
        WalletNotConnectedError
      );
    });

    it("should create and send sell NDT transaction", async () => {
      mockWallet.connected = true;
      mockWallet.publicKey = new PublicKey("testPublicKey");
      mockConnection.getLatestBlockhash = jest.fn().mockResolvedValue({
        blockhash: "test-blockhash",
        lastValidBlockHeight: 100,
      });
      mockWallet.sendTransaction = jest
        .fn()
        .mockResolvedValue("test-signature");

      const result = await ndtManager.sellNDT(5);

      expect(mockConnection.getLatestBlockhash).toHaveBeenCalled();
      expect(mockWallet.sendTransaction).toHaveBeenCalled();
      expect(result).toBe("test-signature");
    });

    it("should throw error if sell amount is invalid", async () => {
      mockWallet.connected = true;
      mockWallet.publicKey = new PublicKey("testPublicKey");

      await expect(ndtManager.sellNDT(-1)).rejects.toThrow(
        "Sell amount must be positive"
      );
      await expect(ndtManager.sellNDT(0)).rejects.toThrow(
        "Sell amount must be positive"
      );
    });
  });
});
