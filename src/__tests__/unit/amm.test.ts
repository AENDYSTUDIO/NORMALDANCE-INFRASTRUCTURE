import { AdvancedAMM, SwapParams, LiquidityPool } from '@/lib/advanced-amm'

describe('Advanced AMM System', () => {
  let amm: AdvancedAMM
  let testPool: LiquidityPool

  beforeEach(() => {
    amm = new AdvancedAMM()
    testPool = {
      tonReserve: 1000,
      ndtReserve: 42700,
      totalLiquidity: 1000 + 42700,
      lastUpdate: Date.now(),
      volatility: 5,
      priceHistory: []
    }
  })

  test('should execute basic TON to NDT swap', async () => {
    const swapParams: SwapParams = {
      from: 'TON',
      to: 'NDT',
      amount: 100,
      slippage: 10 // 10% slippage tolerance for CPMM price impact
    }

    const result = await amm.executeSwap(swapParams, testPool)

    expect(result).toBeDefined()
    expect(result.outputAmount).toBeGreaterThan(0)
    expect(result.algorithm).toBe('HARMONY') // Should use Harmony for stable market
    expect(result.fee).toBeGreaterThan(0)
    expect(result.executionTime).toBeLessThan(1000) // Should complete within 1s
  })

  test('should switch to BEAT_DROP mode during high volatility', async () => {
    // Simulate high volatility pool
    const volatilePool: LiquidityPool = {
      ...testPool,
      volatility: 25 // High volatility
    }

    const swapParams: SwapParams = {
      from: 'TON',
      to: 'NDT',
      amount: 100,
      slippage: 10 // 10% slippage tolerance
    }

    const result = await amm.executeSwap(swapParams, volatilePool)

    expect(result.algorithm).toBe('BEAT_DROP')
    expect(result.volatility).toBe(25)
  })

  test('should use MIXED mode for moderate volatility', async () => {
    const moderatePool: LiquidityPool = {
      ...testPool,
      volatility: 12 // Moderate volatility
    }

    const swapParams: SwapParams = {
      from: 'TON',
      to: 'NDT',
      amount: 100,
      slippage: 10 // 10% slippage tolerance
    }

    const result = await amm.executeSwap(swapParams, moderatePool)

    expect(result.algorithm).toBe('MIXED')
  })

  test('should calculate price impact correctly', () => {
    const impact = amm['estimatePriceImpact'](100, testPool)
    expect(impact).toBeGreaterThan(0)
    expect(impact).toBeLessThan(10) // Should be reasonable for this amount
  })

  test('should calculate stability score correctly', () => {
    const score = amm['calculateStabilityScore'](testPool)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  test('should handle NDT to TON swaps', async () => {
    const swapParams: SwapParams = {
      from: 'NDT',
      to: 'TON',
      amount: 1000, // Smaller amount to keep in HARMONY mode
      slippage: 10 // 10% slippage tolerance for CPMM price impact
    }

    const result = await amm.executeSwap(swapParams, testPool)

    expect(result).toBeDefined()
    expect(result.outputAmount).toBeGreaterThan(0)
    expect(result.algorithm).toBe('HARMONY')
  })
})
