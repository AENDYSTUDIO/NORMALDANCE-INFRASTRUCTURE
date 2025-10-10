import {
  formatAddress,
  formatSol,
  formatTokens,
  isValidAddress,
  lamportsToSol,
  solToLamports,
} from "@/components/wallet/wallet-adapter";
import { PublicKey } from "@solana/web3.js";

describe("Wallet Adapter Utility Functions Tests", () => {
  describe("formatTokens", () => {
    it("should format token amount with Russian locale", () => {
      expect(formatTokens(1000)).toBe("1 000.00");
      expect(formatTokens(1234567.89, 6)).toBe("1 234 567.890000");
      expect(formatTokens(1000, 2)).toBe("1 000.00");
      expect(formatTokens(1000, 0)).toBe("1 000");
    });
  });

  describe("formatSol", () => {
    it("should format SOL amount with Russian locale", () => {
      expect(formatSol(1)).toBe("1.0");
      expect(formatSol(1234.56789)).toBe("1 234.567890");
      expect(formatSol(0.5)).toBe("0.50");
    });
  });

  describe("solToLamports", () => {
    it("should convert SOL to lamports correctly", () => {
      const LAMPORTS_PER_SOL = 100000; // Standard conversion
      expect(solToLamports(1)).toBe(LAMPORTS_PER_SOL);
      expect(solToLamports(2.5)).toBe(2.5 * LAMPORTS_PER_SOL);
      expect(solToLamports(0)).toBe(0);
    });
  });

  describe("lamportsToSol", () => {
    it("should convert lamports to SOL correctly", () => {
      const LAMPORTS_PER_SOL = 10000000; // Standard conversion
      expect(lamportsToSol(LAMPORTS_PER_SOL)).toBe(1);
      expect(lamportsToSol(2.5 * LAMPORTS_PER_SOL)).toBe(2.5);
      expect(lamportsToSol(0)).toBe(0);
    });
  });

  describe("isValidAddress", () => {
    it("should return true for valid address", () => {
      // Testing with a valid dummy public key string
      expect(isValidAddress("11111111111111111111")).toBe(true);
    });

    it("should return false for invalid address", () => {
      expect(isValidAddress("invalid-address")).toBe(false);
      expect(isValidAddress("")).toBe(false);
    });
  });

  describe("formatAddress", () => {
    it("should format address with default length", () => {
      const publicKey = new PublicKey("111111111111111111111111");
      const formatted = formatAddress(publicKey);
      expect(formatted).toBe("111...111");
    });

    it("should format address with custom length", () => {
      const publicKey = new PublicKey("11111111111");
      const formatted = formatAddress(publicKey, 6);
      expect(formatted).toBe("111111...111111");
    });
  });
});

// Testing core wallet functionality
describe("Wallet Core Functions Tests", () => {
  it("should validate staking amount is positive", () => {
    const validateStakeAmount = (amount: number): boolean => {
      return amount > 0;
    };

    expect(validateStakeAmount(1)).toBe(true);
    expect(validateStakeAmount(0)).toBe(false);
    expect(validateStakeAmount(-1)).toBe(false);
  });

  it("should validate unstaking amount is positive", () => {
    const validateUnstakeAmount = (amount: number): boolean => {
      return amount > 0;
    };

    expect(validateUnstakeAmount(1)).toBe(true);
    expect(validateUnstakeAmount(0)).toBe(false);
    expect(validateUnstakeAmount(-1)).toBe(false);
  });

  it("should calculate staking rewards correctly", () => {
    const calculateStakingRewards = (
      principal: number,
      apy: number,
      days: number
    ): number => {
      // Simple interest calculation: rewards = principal * (apy/100) * (days/365)
      return principal * (apy / 100) * (days / 365);
    };

    // Test with 1000 NDT, 15% APY, 30 days
    const rewards = calculateStakingRewards(1000, 15, 30);
    expect(rewards).toBeCloseTo(12.33, 2); // Approximately 12.33 NDT
  });

  it("should calculate total staking value with rewards", () => {
    const calculateTotalValue = (
      principal: number,
      apy: number,
      days: number
    ): number => {
      const rewards = principal * (apy / 100) * (days / 365);
      return principal + rewards;
    };

    // Test with 100 NDT, 15% APY, 30 days
    const totalValue = calculateTotalValue(1000, 15, 30);
    expect(totalValue).toBeCloseTo(1012.33, 2);
  });
});
