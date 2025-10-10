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
      slippage: 1
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
      slippage: 1
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
      slippage: 1
    }

    const result = await amm.executeSwap(swapParams, moderatePool)

    expect(result.algorithm).toBe('MIXED')
  })

  test('should reject swap with excessive slippage', async () => {
    const swapParams: SwapParams = {
      from: 'TON',
      to: 'NDT',
      amount: 1000, // Large amount
      slippage: 0.1 // Very low slippage tolerance
    }

    await expect(amm.executeSwap(swapParams, testPool))
      .rejects.toThrow('Slippage tolerance exceeded')
  })

  test('should calculate price impact correctly', () => {
    const impact = amm['estimatePriceImpact'](100, testPool)
    expect(impact).toBeGreaterThan(0)
    expect(impact).toBeLessThan(10) // Should be reasonable for this amount
  })

  test('should update pool state after swap', () => {
    const poolId = 'test-pool'
    amm['pools'].set(poolId, { ...testPool })

    const swapParams: SwapParams = {
      from: 'TON',
      to: 'NDT',
      amount: 100,
      slippage: 1
    }

    // Mock swap result
    const mockResult = {
      outputAmount: 4270,
      priceImpact: 0.5,
      algorithm: 'HARMONY' as const,
      fee: 0.25,
      executionTime: 100,
      volatility: 5
    }

    const updatedPool = amm.updatePool(poolId, swapParams, mockResult)

    expect(updatedPool.tonReserve).toBe(testPool.tonReserve + 100)
    expect(updatedPool.ndtReserve).toBe(testPool.ndtReserve - 4270)
    expect(updatedPool.priceHistory.length).toBe(1)
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
      amount: 4270,
      slippage: 1
    }

    const result = await amm.executeSwap(swapParams, testPool)

    expect(result).toBeDefined()
    expect(result.outputAmount).toBeGreaterThan(0)
    expect(result.algorithm).toBe('HARMONY')
  })
})
