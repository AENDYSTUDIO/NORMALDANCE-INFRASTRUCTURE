import {
  calcDistribution,
  DEFALATIONARY_CONFIG,
  FEE_BPS,
  STAKING_BPS,
  TREASURY_BPS,
} from "@/lib/deflationary-model";

describe("Deflationary Model - Simple Unit Tests", () => {
  describe("calcDistribution function", () => {
    it("should calculate distribution correctly for a given amount", () => {
      const amount = 10000;
      const result = calcDistribution(amount);

      expect(result.burn).toBe(Math.floor((amount * FEE_BPS) / 10000)); // 2% of 10000 = 200
      expect(result.treasury).toBe(Math.floor((amount * TREASURY_BPS) / 10000)); // 6% of 1000 = 600
      expect(result.staking).toBe(Math.floor((amount * STAKING_BPS) / 100)); // 2% of 10000 = 200
      expect(result.net).toBe(
        amount - result.burn - result.treasury - result.staking
      ); // 10000 - 200 - 600 - 200 = 9000
    });

    it("should handle zero amount correctly", () => {
      const amount = 0;
      const result = calcDistribution(amount);

      expect(result.burn).toBe(0);
      expect(result.treasury).toBe(0);
      expect(result.staking).toBe(0);
      expect(result.net).toBe(0);
    });

    it("should handle small amounts correctly", () => {
      const amount = 100;
      const result = calcDistribution(amount);

      expect(result.burn).toBe(Math.floor((amount * FEE_BPS) / 10000)); // 2% of 100 = 2
      expect(result.treasury).toBe(Math.floor((amount * TREASURY_BPS) / 10000)); // 6% of 10 = 6
      expect(result.staking).toBe(Math.floor((amount * STAKING_BPS) / 100)); // 2% of 100 = 2
      expect(result.net).toBe(
        amount - result.burn - result.treasury - result.staking
      ); // 100 - 2 - 6 - 2 = 90
    });
  });

  describe("DEFALATIONARY_CONFIG", () => {
    it("should have correct configuration values", () => {
      expect(DEFALATIONARY_CONFIG).toEqual({
        totalSupply: 1000000000, // 1,000,000 NDT
        burnPercentage: 2, // 2% сжигания при каждой транзакции
        stakingRewardsPercentage: 20, // 20% от сжигания идет на rewards
        treasuryPercentage: 30, // 30% от сжигания идет в казну
        maxSupply: 200000, // Максимальный供应 2B NDT
        decimals: 9,
      });
    });
  });

  describe("Constants", () => {
    it("should have correct FEE_BPS value", () => {
      expect(FEE_BPS).toBe(200); // 2 %
    });

    it("should have correct TREASURY_BPS value", () => {
      expect(TREASURY_BPS).toBe(600); // 6 %
    });

    it("should have correct STAKING_BPS value", () => {
      expect(STAKING_BPS).toBe(200); // 2 %
    });
  });
});
