import { DeflationaryTokenManager } from '../deflationary-token-manager';
import { InvisibleDeflationAdapter } from '../../../components/wallet/invisible-deflation-adapter';
import { TransactionFeeCalculator } from '../transaction-fee-calculator';
import { DeflationaryModel } from '../../deflationary-model';
import { PrismaClient } from '@prisma/client';
import { Connection, PublicKey } from '@solana/web3.js';

// Mock data
const mockConnection = {
  getBalance: jest.fn(),
  getTokenAccountBalance: jest.fn(),
  sendTransaction: jest.fn(),
} as unknown as Connection;

const mockDb = {
  deflationaryTransaction: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient;

const mockWalletAdapter = {
  publicKey: new PublicKey('123'),
  sendTransaction: jest.fn(),
  on: jest.fn(),
} as any;

const mockTokenMint = new PublicKey('token123');
const mockFromPublicKey = new PublicKey('from123');
const mockToPublicKey = new PublicKey('to123');

describe('Deflation Integration Tests', () => {
  let deflationaryModel: DeflationaryModel;
  let transactionFeeCalculator: TransactionFeeCalculator;
  let deflationaryTokenManager: DeflationaryTokenManager;
  let invisibleDeflationAdapter: InvisibleDeflationAdapter;

  beforeEach(() => {
    deflationaryModel = new DeflationaryModel(mockConnection);
    transactionFeeCalculator = new TransactionFeeCalculator(deflationaryModel);
    deflationaryTokenManager = new DeflationaryTokenManager(mockConnection, mockDb, mockWalletAdapter);
    invisibleDeflationAdapter = new InvisibleDeflationAdapter(mockConnection, mockDb, mockWalletAdapter);
  });

  describe('TransactionFeeCalculator', () => {
    test('should calculate fees correctly with standard deflation model', () => {
      const amount = 1000;
      const fees = transactionFeeCalculator.calculateFees(amount);
      
      // With standard config: 2% total fee
      // 1% to burn (50% of 2%)
      // 0.6% to treasury (30% of 2%)
      // 0.4% to staking (20% of 2%)
      expect(fees.totalAmount).toBe(1000);
      expect(fees.burnAmount).toBe(10); // 1% of 1000
      expect(fees.treasuryAmount).toBe(6); // 0.6% of 1000
      expect(fees.stakingAmount).toBe(4); // 0.4% of 1000
      expect(fees.feeAmount).toBe(20); // 2% of 1000
      expect(fees.netAmount).toBe(980); // 1000 - 20
    });

    test('should calculate fees for batch transactions', () => {
      const amounts = [1000, 2000, 3000];
      const fees = transactionFeeCalculator.calculateBatchFees(amounts);
      
      expect(fees).toHaveLength(3);
      expect(fees[0].totalAmount).toBe(1000);
      expect(fees[1].totalAmount).toBe(2000);
      expect(fees[2].totalAmount).toBe(3000);
    });

    test('should calculate cumulative fees', () => {
      const amounts = [1000, 200, 3000];
      const cumulative = transactionFeeCalculator.calculateCumulativeFees(amounts);
      
      expect(cumulative.totalBurned).toBe(60); // 10 + 20 + 30
      expect(cumulative.totalToTreasury).toBe(36); // 6 + 12 + 18
      expect(cumulative.totalToStaking).toBe(24); // 4 + 8 + 12
      expect(cumulative.totalFees).toBe(120); // 20 + 40 + 60
      expect(cumulative.totalNetAmount).toBe(5880); // 980 + 1960 + 2940
    });
  });

  describe('DeflationaryTokenManager', () => {
    test('should create deflationary transaction with correct fee distribution', async () => {
      const amount = 1000;
      const result = await deflationaryTokenManager.createDeflationaryTransaction(
        mockFromPublicKey,
        mockToPublicKey,
        mockTokenMint,
        amount
      );
      
      expect(result.success).toBe(true);
      expect(result.burnedAmount).toBe(10); // 1% of 1000
      expect(result.treasuryAmount).toBe(6); // 0.6% of 1000
      expect(result.stakingAmount).toBe(4); // 0.4% of 1000
      expect(result.netAmount).toBe(980); // 1000 - 20
    });

    test('should calculate deflation stats correctly', async () => {
      const stats = await deflationaryTokenManager.getDeflationStats(mockTokenMint);
      
      // Mock values for testing
      expect(stats).toHaveProperty('totalSupply');
      expect(stats).toHaveProperty('burnedTokens');
      expect(stats).toHaveProperty('currentSupply');
      expect(stats).toHaveProperty('treasuryDistributed');
      expect(stats).toHaveProperty('stakingDistributed');
    });
  });

  describe('InvisibleDeflationAdapter', () => {
    test('should execute invisible transaction with deflation', async () => {
      const amount = 1000;
      const result = await invisibleDeflationAdapter.executeInvisibleTransaction(
        mockToPublicKey,
        mockTokenMint,
        amount
      );
      
      expect(result.success).toBe(true);
      expect(result.originalAmount).toBe(1000);
      expect(result.burnedAmount).toBe(10); // 1% of 1000
      expect(result.treasuryAmount).toBe(6); // 0.6% of 1000
      expect(result.stakingAmount).toBe(4); // 0.4% of 1000
      expect(result.feeAmount).toBe(20); // Total fee
      expect(result.netAmount).toBe(980); // Net amount after fees
    });

    test('should calculate fees correctly', () => {
      const amount = 1000;
      const fees = (invisibleDeflationAdapter as any).calculateFees(amount);
      
      expect(fees.burnAmount).toBe(10); // 1% of 1000
      expect(fees.treasuryAmount).toBe(6); // 0.6% of 1000
      expect(fees.stakingAmount).toBe(4); // 0.4% of 1000
      expect(fees.feeAmount).toBe(20); // Total fee
      expect(fees.netAmount).toBe(980); // Net amount after fees
    });
  });

  describe('Integration Tests', () => {
    test('should maintain consistency between all components', async () => {
      const amount = 1000;
      
      // Calculate fees using the calculator
      const feeBreakdown = transactionFeeCalculator.calculateFees(amount);
      
      // Execute transaction using the invisible adapter
      const transactionResult = await invisibleDeflationAdapter.executeInvisibleTransaction(
        mockToPublicKey,
        mockTokenMint,
        amount
      );
      
      // Verify that the fee calculations match
      expect(transactionResult.burnedAmount).toBe(feeBreakdown.burnAmount);
      expect(transactionResult.treasuryAmount).toBe(feeBreakdown.treasuryAmount);
      expect(transactionResult.stakingAmount).toBe(feeBreakdown.stakingAmount);
      expect(transactionResult.feeAmount).toBe(feeBreakdown.feeAmount);
      expect(transactionResult.netAmount).toBe(feeBreakdown.netAmount);
    });

    test('should handle multiple transactions consistently', async () => {
      const amounts = [1000, 2000, 3000];
      const results = await invisibleDeflationAdapter.deflationaryTokenManager.processBatchTransactions(
        amounts.map(amount => ({
          fromPublicKey: mockFromPublicKey,
          toPublicKey: mockToPublicKey,
          tokenMint: mockTokenMint,
          amount
        }))
      );
      
      // Verify each transaction has correct fee distribution
      results.forEach((result, index) => {
        const expectedAmount = amounts[index];
        const expectedFees = transactionFeeCalculator.calculateFees(expectedAmount);
        
        expect(result.burnedAmount).toBe(expectedFees.burnAmount);
        expect(result.treasuryAmount).toBe(expectedFees.treasuryAmount);
        expect(result.stakingAmount).toBe(expectedFees.stakingAmount);
        expect(result.netAmount).toBe(expectedFees.netAmount);
      });
    });

    test('should update deflation stats after transactions', async () => {
      const initialStats = await deflationaryTokenManager.getDeflationStats(mockTokenMint);
      
      // Execute a transaction
      await invisibleDeflationAdapter.executeInvisibleTransaction(
        mockToPublicKey,
        mockTokenMint,
        1000
      );
      
      const finalStats = await deflationaryTokenManager.getDeflationStats(mockTokenMint);
      
      // After a transaction, burned tokens should increase
      expect(finalStats.burnedTokens).toBeGreaterThanOrEqual(initialStats.burnedTokens);
    });
  });

  describe('Error Handling', () => {
    test('should handle insufficient balance error', async () => {
      // Mock insufficient balance
      (mockConnection.getTokenAccountBalance as jest.Mock).mockResolvedValue({
        value: { amount: '500' } // Less than required amount
      });
      
      const result = await invisibleDeflationAdapter.executeInvisibleTransaction(
        mockToPublicKey,
        mockTokenMint,
        1000
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle wallet not connected error', async () => {
      // Create adapter with disconnected wallet
      const disconnectedAdapter = new InvisibleDeflationAdapter(
        mockConnection,
        mockDb,
        { ...mockWalletAdapter, publicKey: null } as any
      );
      
      const result = await disconnectedAdapter.executeInvisibleTransaction(
        mockToPublicKey,
        mockTokenMint,
        1000
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});