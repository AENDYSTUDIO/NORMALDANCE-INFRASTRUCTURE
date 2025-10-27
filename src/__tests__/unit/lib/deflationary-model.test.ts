import {
  calcDistribution,
  deflationUtils,
  FEE_BPS,
  STAKING_BPS,
  TREASURY_BPS,
} from "@/lib/deflationary-model";

// Mock Solana dependencies
jest.mock("@solana/web3.js", () => ({
  Connection: jest.fn(),
  PublicKey: jest.fn(),
  Transaction: jest.fn(),
  LAMPORTS_PER_SOL: 1000000,
}));

describe("Deflationary Model - Unit Tests", () => {
  describe("calcDistribution function", () => {
    it("should calculate distribution correctly for a given amount", () => {
      const amount = 10000;
      const result = calcDistribution(amount);

      expect(result.burn).toBe(Math.floor((amount * FEE_BPS) / 10000)); // 2% of 10000 = 200
      expect(result.treasury).toBe(Math.floor((amount * TREASURY_BPS) / 10000)); // 6% of 10000 = 600
      expect(result.staking).toBe(Math.floor((amount * STAKING_BPS) / 10000)); // 2% of 10000 = 200
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
      expect(result.treasury).toBe(Math.floor((amount * TREASURY_BPS) / 10000)); // 6% of 100 = 6
      expect(result.staking).toBe(Math.floor((amount * STAKING_BPS) / 10000)); // 2% of 100 = 2
      expect(result.net).toBe(
        amount - result.burn - result.treasury - result.staking
      ); // 100 - 2 - 6 - 2 = 90
    });
  });

  describe("deflationUtils", () => {
    describe("calculateEffectivePrice", () => {
      it("should calculate effective price with deflation", () => {
        const basePrice = 100;
        const burnPercentage = 2;
        const result = deflationUtils.calculateEffectivePrice(
          basePrice,
          burnPercentage
        );

        expect(result).toBe(basePrice * (1 + burnPercentage / 100)); // 100 * 1.02 = 102
      });

      it("should handle zero burn percentage", () => {
        const basePrice = 100;
        const burnPercentage = 0;
        const result = deflationUtils.calculateEffectivePrice(
          basePrice,
          burnPercentage
        );

        expect(result).toBe(basePrice); // 100 * 1.0 = 100
      });

      it("should handle higher burn percentage", () => {
        const basePrice = 50;
        const burnPercentage = 5;
        const result = deflationUtils.calculateEffectivePrice(
          basePrice,
          burnPercentage
        );

        expect(result).toBe(basePrice * (1 + burnPercentage / 100)); // 50 * 1.05 = 52.5
      });
    });

    describe("calculateStakingROI", () => {
      it("should calculate staking ROI with deflation bonus", () => {
        const stakeAmount = 100;
        const apy = 10; // 10% APY
        const days = 365; // 1 year
        const burnRate = 2; // 2% burn rate

        const baseReturn = stakeAmount * (apy / 100) * (days / 365); // 100 * 0.1 * 1 = 100
        const deflationBonus = stakeAmount * (burnRate / 100) * (days / 365); // 1000 * 0.02 * 1 = 20
        const expectedROI = baseReturn + deflationBonus; // 100 + 20 = 120

        const result = deflationUtils.calculateStakingROI(
          stakeAmount,
          apy,
          days,
          burnRate
        );

        expect(result).toBe(expectedROI);
      });

      it("should handle different time periods", () => {
        const stakeAmount = 1000;
        const apy = 10;
        const days = 180; // Half a year
        const burnRate = 2;

        const baseReturn = stakeAmount * (apy / 100) * (days / 365); // 1000 * 0.1 * (180/365) ≈ 49.32
        const deflationBonus = stakeAmount * (burnRate / 100) * (days / 365); // 100 * 0.02 * (180/365) ≈ 9.86
        const expectedROI = baseReturn + deflationBonus;

        const result = deflationUtils.calculateStakingROI(
          stakeAmount,
          apy,
          days,
          burnRate
        );

        expect(result).toBeCloseTo(expectedROI, 2);
      });

      it("should handle zero values", () => {
        const result = deflationUtils.calculateStakingROI(0, 0, 0, 0);
        expect(result).toBe(0);
      });
    });

    describe("formatDeflationProgress", () => {
      it("should format deflation progress correctly", () => {
        const totalBurned = 50000000;
        const totalSupply = 1000000000;
        const result = deflationUtils.formatDeflationProgress(
          totalBurned,
          totalSupply
        );

        const expectedPercentage = (totalBurned / totalSupply) * 100; // 5%
        expect(result).toBe(`${expectedPercentage.toFixed(2)}% сожжено`); // "5.00% сожжено"
      });

      it("should handle zero total supply", () => {
        const result = deflationUtils.formatDeflationProgress(0, 0);
        expect(result).toBe("NaN% сожжено"); // Division by zero results in NaN
      });

      it("should handle cases where burned exceeds supply", () => {
        const result = deflationUtils.formatDeflationProgress(1100000, 1000000); // More burned than supply
        expect(result).toBe("110.00% сожжено");
      });
    });

    describe("getDeflationColor", () => {
      it("should return green color for low deflation percentage", () => {
        const result = deflationUtils.getDeflationColor(3);
        expect(result).toBe("text-green-600");
      });

      it("should return yellow color for medium deflation percentage", () => {
        const result = deflationUtils.getDeflationColor(10);
        expect(result).toBe("text-yellow-600");
      });

      it("should return red color for high deflation percentage", () => {
        const result = deflationUtils.getDeflationColor(20);
        expect(result).toBe("text-red-600");
      });

      it("should handle exact boundary values", () => {
        expect(deflationUtils.getDeflationColor(5)).toBe("text-yellow-600"); // At boundary
        expect(deflationUtils.getDeflationColor(15)).toBe("text-red-600"); // At boundary
      });
    });
  });
});
