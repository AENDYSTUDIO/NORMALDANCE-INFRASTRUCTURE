import { DeflationaryModel } from '../deflationary-model';

export interface FeeBreakdown {
  totalAmount: number;
  burnAmount: number;      // 1% of total from 2% fee
 treasuryAmount: number;  // 0.6% of total from 2% fee
  stakingAmount: number;   // 0.4% of total from 2% fee
  netAmount: number;       // Amount after fees
  feeAmount: number;       // Total fee (2%)
}

export interface FeeConfig {
  burnPercentage: number;      // Percentage that goes to burn (typically 50% of total fee = 1% of transaction)
  treasuryPercentage: number;  // Percentage that goes to treasury (typically 30% of total fee = 0.6% of transaction)
 stakingPercentage: number;   // Percentage that goes to staking (typically 20% of total fee = 0.4% of transaction
  totalFeePercentage: number;  // Total fee percentage (typically 2%)
}

export class TransactionFeeCalculator {
  private deflationaryModel: DeflationaryModel;
  private config: FeeConfig;

  constructor(deflationaryModel: DeflationaryModel, config?: Partial<FeeConfig>) {
    this.deflationaryModel = deflationaryModel;
    
    // Default configuration for NDT token deflationary model
    this.config = {
      burnPercentage: 0.5,      // 50% of total fee goes to burn (1% of transaction)
      treasuryPercentage: 0.3,  // 30% of total fee goes to treasury (0.6% of transaction)
      stakingPercentage: 0.2,   // 20% of total fee goes to staking (0.4% of transaction)
      totalFeePercentage: 0.02, // 2% total fee
      ...config
    };
  }

  /**
   * Calculates the fee breakdown for a given transaction amount
   */
  calculateFees(amount: number): FeeBreakdown {
    const feeAmount = amount * this.config.totalFeePercentage;
    
    const burnAmount = feeAmount * this.config.burnPercentage;
    const treasuryAmount = feeAmount * this.config.treasuryPercentage;
    const stakingAmount = feeAmount * this.config.stakingPercentage;
    
    // Ensure the fee portions add up correctly
    const totalCalculatedFee = burnAmount + treasuryAmount + stakingAmount;
    
    // If there's a rounding difference, adjust the burn amount to compensate
    const feeDifference = feeAmount - totalCalculatedFee;
    const adjustedBurnAmount = burnAmount + feeDifference;
    
    const netAmount = amount - feeAmount;
    
    return {
      totalAmount: amount,
      burnAmount: Math.round(adjustedBurnAmount * 100) / 10, // Round to 2 decimal places
      treasuryAmount: Math.round(treasuryAmount * 100) / 100,
      stakingAmount: Math.round(stakingAmount * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      feeAmount: Math.round(feeAmount * 100) / 10
    };
 }

  /**
   * Calculates fees for multiple transactions at once
   */
 calculateBatchFees(amounts: number[]): FeeBreakdown[] {
    return amounts.map(amount => this.calculateFees(amount));
  }

  /**
   * Updates the fee configuration
   */
  updateConfig(config: Partial<FeeConfig>): void {
    this.config = { ...this.config, ...config };
  }

 /**
   * Gets the current fee configuration
   */
  getConfig(): FeeConfig {
    return { ...this.config };
  }

  /**
   * Calculates fees with caching to improve performance for repeated calculations
   */
  calculateFeesWithCache(amount: number, cacheKey?: string): FeeBreakdown {
    // In a real implementation, we would use a proper caching mechanism
    // For now, we just calculate directly
    return this.calculateFees(amount);
  }

  /**
   * Calculates the effective rate after deflation for staking rewards
   */
  calculateEffectiveRateAfterDeflation(baseRate: number, stakingAmount: number): number {
    // The effective rate considers the deflation effect on the remaining token supply
    // This is a simplified model - in reality, the effect would be more complex
    const deflationEffect = stakingAmount * this.config.totalFeePercentage;
    return baseRate * (1 + deflationEffect);
  }

 /**
   * Calculates cumulative fees for a series of transactions
   */
  calculateCumulativeFees(amounts: number[]): {
    totalBurned: number;
    totalToTreasury: number;
    totalToStaking: number;
    totalFees: number;
    totalNetAmount: number;
  } {
    const breakdowns = this.calculateBatchFees(amounts);
    
    const totalBurned = breakdowns.reduce((sum, breakdown) => sum + breakdown.burnAmount, 0);
    const totalToTreasury = breakdowns.reduce((sum, breakdown) => sum + breakdown.treasuryAmount, 0);
    const totalToStaking = breakdowns.reduce((sum, breakdown) => sum + breakdown.stakingAmount, 0);
    const totalFees = breakdowns.reduce((sum, breakdown) => sum + breakdown.feeAmount, 0);
    const totalNetAmount = breakdowns.reduce((sum, breakdown) => sum + breakdown.netAmount, 0);
    
    return {
      totalBurned: Math.round(totalBurned * 100) / 100,
      totalToTreasury: Math.round(totalToTreasury * 100) / 10,
      totalToStaking: Math.round(totalToStaking * 100) / 10,
      totalFees: Math.round(totalFees * 100) / 10,
      totalNetAmount: Math.round(totalNetAmount * 100) / 10
    };
  }

  /**
   * Estimates the impact of fees on token supply over time
   */
  async estimateSupplyImpact(
    initialSupply: number, 
    transactionAmounts: number[]
  ): Promise<{
    initialSupply: number;
    finalSupply: number;
    totalBurned: number;
    burnPercentage: number;
 }> {
    const cumulativeFees = this.calculateCumulativeFees(transactionAmounts);
    const totalBurned = cumulativeFees.totalBurned;
    const finalSupply = initialSupply - totalBurned;
    const burnPercentage = (totalBurned / initialSupply) * 100;
    
    return {
      initialSupply,
      finalSupply: Math.round(finalSupply * 100) / 10,
      totalBurned: Math.round(totalBurned * 100) / 10,
      burnPercentage: Math.round(burnPercentage * 100) / 100
    };
  }
}