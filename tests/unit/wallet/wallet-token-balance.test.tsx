/* eslint-disable @typescript-eslint/no-require-imports */
// @ts-ignore
import { useSolanaWallet } from "@/components/wallet/wallet-adapter";
import * as splToken from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

// Mock external dependencies
jest.mock("@solana/web3.js");
jest.mock("@solana/spl-token");

describe("Wallet Adapter - Token Balance Tests", () => {
  let mockWallet: any;
  let mockConnection: any;

  beforeEach(() => {
    mockWallet = {
      connected: true,
      publicKey: new PublicKey("testPublicKey"),
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
      getParsedAccountInfo: jest.fn(),
    };

    // Mock the wallet hooks
    require("@/components/wallet/wallet-adapter").useWallet = () => mockWallet;
    require("@/components/wallet/wallet-adapter").useConnection = () => ({
      connection: mockConnection,
    });
  });

  describe("getTokenBalance", () => {
    it("should return 0 when wallet is not connected", async () => {
      mockWallet.connected = false;
      mockWallet.publicKey = null;

      const wallet = useSolanaWallet();
      const balance = await wallet.getTokenBalance("test-mint-address");

      expect(balance).toBe(0);
    });

    it("should return 0 when token account does not exist", async () => {
      // Мокаем getAssociatedTokenAddress
      const mockGetAssociatedTokenAddress = jest
        .fn()
        .mockResolvedValue(new PublicKey("associatedTokenAddress"));
      jest
        .spyOn(splToken, "getAssociatedTokenAddress")
        .mockImplementation(mockGetAssociatedTokenAddress);

      // Мокаем getAccountInfo чтобы вернуть null (аккаунт не существует)
      mockConnection.getAccountInfo.mockResolvedValue(null);

      const wallet = useSolanaWallet();
      const balance = await wallet.getTokenBalance("test-mint-address");

      expect(balance).toBe(0);
      expect(mockGetAssociatedTokenAddress).toHaveBeenCalledWith(
        new PublicKey("test-mint-address"),
        mockWallet.publicKey
      );
    });

    it("should return correct token balance when account exists", async () => {
      // Мокаем getAssociatedTokenAddress
      const mockGetAssociatedTokenAddress = jest
        .fn()
        .mockResolvedValue(new PublicKey("associatedTokenAddress"));
      jest
        .spyOn(splToken, "getAssociatedTokenAddress")
        .mockImplementation(mockGetAssociatedTokenAddress);

      // Мокаем getAccountInfo чтобы вернуть информацию об аккаунте
      mockConnection.getAccountInfo.mockResolvedValue({
        data: Buffer.from("accountData"),
      });

      // Мокаем AccountLayout.decode
      const mockAccountLayout = {
        decode: jest.fn().mockReturnValue({ amount: BigInt(1000000000) }),
      };
      jest
        .spyOn(splToken, "AccountLayout", "get")
        .mockReturnValue(mockAccountLayout as any);

      // Мокаем getParsedAccountInfo чтобы вернуть информацию о токене
      mockConnection.getParsedAccountInfo.mockResolvedValue({
        value: {
          data: {
            parsed: {
              info: {
                decimals: 9,
              },
            },
          },
        },
      });

      const wallet = useSolanaWallet();
      const balance = await wallet.getTokenBalance("test-mint-address");

      expect(balance).toBe(1); // 1000000000 / 10^9 = 1
      expect(mockGetAssociatedTokenAddress).toHaveBeenCalledWith(
        new PublicKey("test-mint-address"),
        mockWallet.publicKey
      );
    });

    it("should return raw balance when mint info is not parsed", async () => {
      // Мокаем getAssociatedTokenAddress
      const mockGetAssociatedTokenAddress = jest
        .fn()
        .mockResolvedValue(new PublicKey("associatedTokenAddress"));
      jest
        .spyOn(splToken, "getAssociatedTokenAddress")
        .mockImplementation(mockGetAssociatedTokenAddress);

      // Мокаем getAccountInfo чтобы вернуть информацию об аккаунте
      mockConnection.getAccountInfo.mockResolvedValue({
        data: Buffer.from("accountData"),
      });

      // Мокаем AccountLayout.decode
      const mockAccountLayout = {
        decode: jest.fn().mockReturnValue({ amount: BigInt(1000000000) }),
      };
      jest
        .spyOn(splToken, "AccountLayout", "get")
        .mockReturnValue(mockAccountLayout as any);

      // Мокаем getParsedAccountInfo чтобы вернуть непарсенную информацию
      mockConnection.getParsedAccountInfo.mockResolvedValue({
        value: {
          data: Record<string, unknown>,
        },
      });

      const wallet = useSolanaWallet();
      const balance = await wallet.getTokenBalance("test-mint-address");

      expect(balance).toBe(1000000000); // Возвращаем сырое значение
    });

    it("should handle errors gracefully and return 0", async () => {
      // Мокаем getAssociatedTokenAddress чтобы выбросить ошибку
      const mockGetAssociatedTokenAddress = jest
        .fn()
        .mockRejectedValue(new Error("Network error"));
      jest
        .spyOn(splToken, "getAssociatedTokenAddress")
        .mockImplementation(mockGetAssociatedTokenAddress);

      const wallet = useSolanaWallet();
      const balance = await wallet.getTokenBalance("test-mint-address");

      expect(balance).toBe(0);
      expect(console.error).toHaveBeenCalledWith(
        "Error getting token balance:",
        expect.any(Error)
      );
    });
  });
});
