import {
  calcDistribution,
  DEFALATIONARY_CONFIG,
  DeflationaryModel,
  deflationUtils,
  FEE_BPS,
  STAKING_BPS,
  TREASURY_BPS,
} from "@/lib/deflationary-model";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

// Mock Solana dependencies
jest.mock("@solana/web3.js", () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn().mockResolvedValue(10000000), // 1 SOL
  })),
  PublicKey: jest.fn().mockImplementation((value) => {
    return { toBase58: () => value || "testPublicKey" };
  }),
  Transaction: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    recentBlockhash: null,
    feePayer: null,
  })),
  LAMPORTS_PER_SOL: 1000000000,
}));

// Mock the NDT_MINT_ADDRESS constant
jest.mock("@/constants/solana", () => ({
  NDT_MINT_ADDRESS: "ndtTestPublicKey",
}));

describe("Deflationary Model - Unit Tests", () => {
  let mockConnection: jest.Mocked<Connection>;
  let deflationaryModel: DeflationaryModel;

  beforeEach(() => {
    mockConnection = new Connection(
      "https://api.devnet.solana.com"
    ) as jest.Mocked<Connection>;
    mockConnection.getBalance = jest.fn().mockResolvedValue(1000000000); // 1 SOL
    deflationaryModel = new DeflationaryModel(
      mockConnection,
      DEFALATIONARY_CONFIG
    );
  });

  describe("calcDistribution function", () => {
    it("should calculate distribution correctly for a given amount", () => {
      const amount = 10000;
      const result = calcDistribution(amount);

      expect(result.burn).toBe(Math.floor((amount * FEE_BPS) / 10000)); // 2% of 10000 = 200
      expect(result.treasury).toBe(Math.floor((amount * TREASURY_BPS) / 10000)); // 6% of 10000 = 600
      expect(result.staking).toBe(Math.floor((amount * STAKING_BPS) / 10000)); // 2% of 10000 = 200
      expect(result.net).toBe(
        amount - result.burn - result.treasury - result.staking
      ); // 10000 - 20 - 60 - 20 = 9000
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
      expect(result.staking).toBe(Math.floor((amount * STAKING_BPS) / 100)); // 2% of 100 = 2
      expect(result.net).toBe(
        amount - result.burn - result.treasury - result.staking
      ); // 100 - 2 - 6 - 2 = 90
    });
  });

  describe("DeflationaryModel class", () => {
    describe("constructor", () => {
      it("should initialize with connection and config", () => {
        expect(deflationaryModel["connection"]).toBe(mockConnection);
        expect(deflationaryModel["config"]).toBe(DEFALATIONARY_CONFIG);
      });

      it("should use default config when not provided", () => {
        const model = new DeflationaryModel(mockConnection);
        expect(model["config"]).toBe(DEFALATIONARY_CONFIG);
      });
    });

    describe("calculateBurnAmount", () => {
      it("should calculate burn amount correctly", () => {
        const amount = 10000;
        const expectedBurn = Math.floor(
          amount * (DEFALATIONARY_CONFIG.burnPercentage / 100)
        ); // 2% of 10000 = 200
        const result = deflationaryModel.calculateBurnAmount(amount);

        expect(result).toBe(expectedBurn);
      });

      it("should return 0 for zero amount", () => {
        const result = deflationaryModel.calculateBurnAmount(0);
        expect(result).toBe(0);
      });

      it("should handle fractional results correctly", () => {
        const amount = 10001; // Results in fractional burn
        const expectedBurn = Math.floor(
          amount * (DEFALATIONARY_CONFIG.burnPercentage / 100)
        ); // 2% of 10001 = 200.02 -> 20
        const result = deflationaryModel.calculateBurnAmount(amount);

        expect(result).toBe(expectedBurn);
      });
    });

    describe("calculateStakingRewards", () => {
      it("should calculate staking rewards correctly", () => {
        const burnAmount = 1000;
        const expectedStaking = Math.floor(
          burnAmount * (DEFALATIONARY_CONFIG.stakingRewardsPercentage / 100)
        ); // 20% of 1000 = 200
        const result = deflationaryModel.calculateStakingRewards(burnAmount);

        expect(result).toBe(expectedStaking);
      });

      it("should return 0 for zero burn amount", () => {
        const result = deflationaryModel.calculateStakingRewards(0);
        expect(result).toBe(0);
      });

      it("should handle fractional results correctly", () => {
        const burnAmount = 1001; // Results in fractional staking
        const expectedStaking = Math.floor(
          burnAmount * (DEFALATIONARY_CONFIG.stakingRewardsPercentage / 100)
        ); // 20% of 1001 = 200.2 -> 200
        const result = deflationaryModel.calculateStakingRewards(burnAmount);

        expect(result).toBe(expectedStaking);
      });
    });

    describe("calculateTreasuryAmount", () => {
      it("should calculate treasury amount correctly", () => {
        const burnAmount = 1000;
        const expectedTreasury = Math.floor(
          burnAmount * (DEFALATIONARY_CONFIG.treasuryPercentage / 100)
        ); // 30% of 1000 = 300
        const result = deflationaryModel.calculateTreasuryAmount(burnAmount);

        expect(result).toBe(expectedTreasury);
      });

      it("should return 0 for zero burn amount", () => {
        const result = deflationaryModel.calculateTreasuryAmount(0);
        expect(result).toBe(0);
      });

      it("should handle fractional results correctly", () => {
        const burnAmount = 1001; // Results in fractional treasury
        const expectedTreasury = Math.floor(
          burnAmount * (DEFALATIONARY_CONFIG.treasuryPercentage / 100)
        ); // 30% of 101 = 300.3 -> 300
        const result = deflationaryModel.calculateTreasuryAmount(burnAmount);

        expect(result).toBe(expectedTreasury);
      });
    });

    describe("getTotalBurned", () => {
      it("should return mock total burned value", async () => {
        const result = await deflationaryModel.getTotalBurned();
        expect(result).toBe(50000000); // Mock value from the implementation
      });
    });

    describe("getCurrentSupply", () => {
      it("should calculate current supply correctly", async () => {
        const totalBurned = 5000000; // Mock value from getTotalBurned
        const expectedCurrentSupply =
          DEFALATIONARY_CONFIG.totalSupply - totalBurned; // 10000000 - 5000000 = 9500000
        const result = await deflationaryModel.getCurrentSupply();

        expect(result).toBe(expectedCurrentSupply);
      });
    });

    describe("getTreasuryData", () => {
      it("should return treasury data", async () => {
        const result = await deflationaryModel.getTreasuryData();

        expect(result).toEqual({
          totalCollected: 150000,
          totalDistributed: 50000,
          lastDistribution: expect.any(Number), // A timestamp value
        });
      });
    });

    describe("getDeflationStats", () => {
      it("should return deflation stats", async () => {
        const result = await deflationaryModel.getDeflationStats();

        expect(result).toEqual({
          currentSupply: expect.any(Number),
          totalBurned: expect.any(Number),
          burnRate: expect.any(Number), // Average burn per day
          daysToZero: expect.any(Number), // Estimated days to zero supply
          treasuryBalance: expect.any(Number),
        });
      });

      it("should calculate burn rate based on 30 days", async () => {
        const totalBurned = 60000000; // Mock value
        jest
          .spyOn(deflationaryModel, "getTotalBurned")
          .mockResolvedValue(totalBurned);

        const result = await deflationaryModel.getDeflationStats();
        const expectedBurnRate = totalBurned / 30; // 60000000 / 30 = 2000000

        expect(result.burnRate).toBe(expectedBurnRate);
      });
    });

    describe("formatTokenAmount", () => {
      it("should format token amount with Russian locale", () => {
        const amount = 1234567.89;
        const result = deflationaryModel.formatTokenAmount(amount);

        // The exact formatting depends on the Russian locale implementation
        // but it should have proper decimal formatting
        expect(result).toContain("1 234 567,89"); // or similar Russian locale formatting
      });

      it("should handle integer amounts", () => {
        const amount = 100000;
        const result = deflationaryModel.formatTokenAmount(amount);

        expect(result).toContain("1 000 000,00");
      });

      it("should handle zero amount", () => {
        const amount = 0;
        const result = deflationaryModel.formatTokenAmount(amount);

        expect(result).toContain("0,00");
      });
    });

    describe("getDeflationInfo", () => {
      it("should return deflation info", () => {
        const result = deflationaryModel.getDeflationInfo();

        expect(result).toEqual({
          config: DEFALATIONARY_CONFIG,
          description: expect.any(String),
          benefits: expect.any(Array),
        });

        expect(result.benefits).toContain(
          "Автоматическое сжигание 2% от каждой транзакции"
        );
        expect(result.benefits).toContain(
          "20% от сожженных токенов идет на стейкинг rewards"
        );
        expect(result.benefits).toContain(
          "30% от сожженных токенов идет в казну платформы"
        );
      });
    });

    describe("createBurnTransaction", () => {
      it("should throw error for non-positive amount", async () => {
        await expect(
          deflationaryModel.createBurnTransaction(
            0,
            new PublicKey("test"),
            new PublicKey("test")
          )
        ).rejects.toThrow("Amount must be positive");
        await expect(
          deflationaryModel.createBurnTransaction(
            -100,
            new PublicKey("test"),
            new PublicKey("test")
          )
        ).rejects.toThrow("Amount must be positive");
      });

      it("should create burn transaction with correct distribution", async () => {
        const amount = 10000;
        const from = new PublicKey("fromPublicKey");
        const to = new PublicKey("toPublicKey");

        const result = await deflationaryModel.createBurnTransaction(
          amount,
          from,
          to,
          "test reason"
        );

        expect(result.transaction).toBeInstanceOf(Transaction);
        expect(result.burnEvent).toEqual({
          amount: expect.any(Number), // burn amount from calcDistribution
          totalBurned: expect.any(Number), // from getTotalBurned
          transactionHash: "", // Will be filled after sending
          timestamp: expect.any(Number), // Current timestamp
          reason: "test reason",
        });
      });
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

        const baseReturn = stakeAmount * (apy / 100) * (days / 365); // 1000 * 0.1 * 1 = 100
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
        const deflationBonus = stakeAmount * (burnRate / 100) * (days / 365); // 1000 * 0.02 * (180/365) ≈ 9.86
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
        const totalSupply = 100000;
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
        const result = deflationUtils.formatDeflationProgress(
          11000000,
          1000000000
        ); // More burned than supply
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
