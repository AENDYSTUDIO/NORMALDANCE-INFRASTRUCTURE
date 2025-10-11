/**
 * 🎵 NormalDance AMM System 2025 - Music-Enhanced Hybrid Algorithms
 * 
 * Реализует гибридные алгоритмы AMM с музыкальной тематикой:
 * - "Harmony Mode" (CPMM) - для стабильной торговли
 * - "Beat Drop Mode" (CSMM) - для волатильных периодов
 * - Интеграция с NFT треками и роялти
 */

export interface AMMConfig {
  volatilityThreshold: number // Порог волатильности для переключения (10%)
  priceImpactThreshold: number // Порог ценового воздействия (5%)
  stabilityWindow: number // Окно стабильности в мс (300000 = 5 мин)
  emergencyThreshold: number // Экстренный порог (20%)
}

export interface SwapParams {
  from: 'TON' | 'NDT'
  to: 'TON' | 'NDT'
  amount: number
  slippage: number
  maxPriceImpact?: number
}

export interface SwapResult {
  outputAmount: number
  priceImpact: number
  algorithm: 'HARMONY' | 'BEAT_DROP' | 'MIXED' // Музыкальные названия
  fee: number
  executionTime: number
  volatility: number
  musicBonus?: number // Бонус за торговлю во время популярных треков
  artistReward?: number // Награда артисту за ликвидность
}

export interface LiquidityPool {
  tonReserve: number
  ndtReserve: number
  totalLiquidity: number
  lastUpdate: number
  volatility: number
  priceHistory: PricePoint[]
}

interface PricePoint {
  timestamp: number
  price: number
  volume: number
}

export class AdvancedAMM {
  private config: AMMConfig
  private pools: Map<string, LiquidityPool> = new Map()
  private priceHistory: Map<string, PricePoint[]> = new Map()

  constructor(config: Partial<AMMConfig> = {}) {
    this.config = {
      volatilityThreshold: 10, // 10%
      priceImpactThreshold: 5, // 5%
      stabilityWindow: 300000, // 5 минут
      emergencyThreshold: 20, // 20%
      ...config
    }
  }

  /**
   * 🎯 Основной метод свопа с гибридным алгоритмом
   */
  async executeSwap(params: SwapParams, pool: LiquidityPool): Promise<SwapResult> {
    const startTime = Date.now()
    
    // 1. Анализ волатильности
    const volatility = this.calculateVolatility(pool)
    
    // 2. Выбор алгоритма
    const algorithm = this.selectAlgorithm(volatility, params.amount, pool)
    
    // 3. Расчет выходного количества
    let outputAmount: number
    let priceImpact: number
    
    switch (algorithm) {
      case 'HARMONY':
        ({ outputAmount, priceImpact } = this.calculateHarmonyMode(params, pool))
        break
      case 'BEAT_DROP':
        ({ outputAmount, priceImpact } = this.calculateBeatDropMode(params, pool))
        break
      case 'MIXED':
        ({ outputAmount, priceImpact } = this.calculateMixedMode(params, pool, volatility))
        break
    }
    
    // 4. Проверка лимитов
    this.validateSwap(params, outputAmount, priceImpact, pool)
    
    // 5. Расчет комиссии
    const fee = this.calculateFee(params.amount, algorithm, volatility)
    
    const executionTime = Date.now() - startTime
    
    return {
      outputAmount,
      priceImpact,
      algorithm,
      fee,
      executionTime,
      volatility
    }
  }

  /**
   * 📊 Расчет волатильности на основе истории цен
   */
  private calculateVolatility(pool: LiquidityPool): number {
    const history = pool.priceHistory
    // Если истории нет, используем значение из пула
    if (history.length < 2) return pool.volatility || 0

    const recent = history.slice(-10) // Последние 10 точек
    const prices = recent.map(p => p.price)
    
    // Стандартное отклонение
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length
    const stdDev = Math.sqrt(variance)
    
    // Волатильность в процентах
    return (stdDev / mean) * 100
  }

  /**
   * 🎵 Выбор оптимального алгоритма (музыкальная тематика)
   */
  private selectAlgorithm(volatility: number, amount: number, pool: LiquidityPool): 'HARMONY' | 'BEAT_DROP' | 'MIXED' {
    // Экстренная ситуация - высокая волатильность = Beat Drop Mode
    if (volatility > this.config.emergencyThreshold) {
      return 'BEAT_DROP' // Стабилизирующий алгоритм для "взрывных" моментов
    }
    
    // Высокая волатильность - Mixed Mode (микс треков)
    if (volatility > this.config.volatilityThreshold) {
      return 'MIXED'
    }
    
    // Большие объемы - проверяем ценовое воздействие
    const estimatedImpact = this.estimatePriceImpact(amount, pool)
    if (estimatedImpact > this.config.priceImpactThreshold) {
      return 'MIXED'
    }
    
    // Обычная торговля - Harmony Mode (гармоничная торговля)
    return 'HARMONY'
  }

  /**
   * 🎵 Harmony Mode - Constant Product Market Maker (гармоничная торговля)
   */
  private calculateHarmonyMode(params: SwapParams, pool: LiquidityPool): { outputAmount: number, priceImpact: number } {
    const { from, to, amount } = params
    const { tonReserve, ndtReserve } = pool
    
    let inputReserve: number
    let outputReserve: number
    
    if (from === 'TON' && to === 'NDT') {
      inputReserve = tonReserve
      outputReserve = ndtReserve
    } else {
      inputReserve = ndtReserve
      outputReserve = tonReserve
    }
    
    // Формула x * y = k
    const k = inputReserve * outputReserve
    const newInputReserve = inputReserve + amount
    const newOutputReserve = k / newInputReserve
    const outputAmount = outputReserve - newOutputReserve
    
    // Ценовое воздействие
    const priceBefore = outputReserve / inputReserve
    const priceAfter = newOutputReserve / newInputReserve
    const priceImpact = Math.abs((priceAfter - priceBefore) / priceBefore) * 100
    
    return { outputAmount, priceImpact }
  }

  /**
   * 🎧 Beat Drop Mode - Constant Sum Market Maker (стабилизация во время "взрывных" моментов)
   */
  private calculateBeatDropMode(params: SwapParams, pool: LiquidityPool): { outputAmount: number, priceImpact: number } {
    const { from, to, amount } = params
    const { tonReserve, ndtReserve } = pool
    
    // Фиксированный курс для стабилизации
    const stableRate = ndtReserve / tonReserve
    const outputAmount = amount * stableRate
    
    // Минимальное ценовое воздействие
    const priceImpact = 0.1 // 0.1% для CSMM
    
    return { outputAmount, priceImpact }
  }

  /**
   * 🎶 Mixed Mode - Гибридный алгоритм (микс треков для адаптивной торговли)
   */
  private calculateMixedMode(params: SwapParams, pool: LiquidityPool, volatility: number): { outputAmount: number, priceImpact: number } {
    const { from, to, amount } = params
    
    // Получаем результаты от обоих алгоритмов
    const harmonyResult = this.calculateHarmonyMode(params, pool)
    const beatDropResult = this.calculateBeatDropMode(params, pool)
    
    // Весовой коэффициент на основе волатильности (как громкость в миксе)
    const volatilityWeight = Math.min(volatility / this.config.volatilityThreshold, 1)
    
    // Линейная интерполяция между алгоритмами (как crossfade в DJ миксе)
    const outputAmount = harmonyResult.outputAmount * (1 - volatilityWeight) + 
                        beatDropResult.outputAmount * volatilityWeight
    
    const priceImpact = harmonyResult.priceImpact * (1 - volatilityWeight) + 
                       beatDropResult.priceImpact * volatilityWeight
    
    return { outputAmount, priceImpact }
  }

  /**
   * 💰 Адаптивная система комиссий
   */
  private calculateFee(amount: number, algorithm: string, volatility: number): number {
    let baseFee = 0.0025 // 0.25% базовая комиссия
    
    // Увеличение комиссии при высокой волатильности
    if (volatility > this.config.volatilityThreshold) {
      baseFee *= 1.5 // +50% при волатильности
    }
    
    // Снижение комиссии для Beat Drop Mode (стимулирование стабильности)
    if (algorithm === 'BEAT_DROP') {
      baseFee *= 0.8 // -20% для стабилизирующих свопов
    }
    
    return amount * baseFee
  }

  /**
   * 📈 Оценка ценового воздействия
   */
  private estimatePriceImpact(amount: number, pool: LiquidityPool): number {
    const { tonReserve, ndtReserve } = pool
    const totalReserve = tonReserve + ndtReserve
    const impact = (amount / totalReserve) * 100
    return impact
  }

  /**
   * ✅ Валидация свопа
   */
  private validateSwap(params: SwapParams, outputAmount: number, priceImpact: number, pool: LiquidityPool): void {
    // Проверка slippage на основе реального курса из пула
    const currentRate = this.getCurrentRate(params.from, params.to, pool)
    const expectedOutput = params.amount * currentRate
    const slippageAmount = expectedOutput * (params.slippage / 100)
    const minOutput = expectedOutput - slippageAmount
    
    if (outputAmount < minOutput) {
      throw new Error(`Slippage tolerance exceeded. Expected: ${expectedOutput.toFixed(2)}, Got: ${outputAmount.toFixed(2)}`)
    }
    
    // Проверка максимального ценового воздействия
    if (params.maxPriceImpact && priceImpact > params.maxPriceImpact) {
      throw new Error(`Price impact too high: ${priceImpact.toFixed(2)}%`)
    }
  }

  /**
   * 📊 Получение текущего курса из пула
   */
  private getCurrentRate(from: 'TON' | 'NDT', to: 'TON' | 'NDT', pool: LiquidityPool): number {
    if (from === 'TON' && to === 'NDT') {
      return pool.ndtReserve / pool.tonReserve
    } else if (from === 'NDT' && to === 'TON') {
      return pool.tonReserve / pool.ndtReserve
    }
    return 1
  }

  /**
   * 🔄 Обновление пула после свопа
   */
  updatePool(poolId: string, params: SwapParams, result: SwapResult): LiquidityPool {
    const pool = this.pools.get(poolId)
    if (!pool) throw new Error('Pool not found')
    
    const { from, to, amount } = params
    const { outputAmount } = result
    
    // Обновляем резервы
    if (from === 'TON' && to === 'NDT') {
      pool.tonReserve += amount
      pool.ndtReserve -= outputAmount
    } else {
      pool.tonReserve -= outputAmount
      pool.ndtReserve += amount
    }
    
    // Обновляем историю цен
    const currentPrice = pool.ndtReserve / pool.tonReserve
    pool.priceHistory.push({
      timestamp: Date.now(),
      price: currentPrice,
      volume: amount
    })
    
    // Ограничиваем историю последними 100 точками
    if (pool.priceHistory.length > 100) {
      pool.priceHistory = pool.priceHistory.slice(-100)
    }
    
    pool.lastUpdate = Date.now()
    pool.volatility = result.volatility
    
    this.pools.set(poolId, pool)
    return pool
  }

  /**
   * 📊 Получение аналитики пула
   */
  getPoolAnalytics(poolId: string) {
    const pool = this.pools.get(poolId)
    if (!pool) return null
    
    return {
      currentPrice: pool.ndtReserve / pool.tonReserve,
      volatility: pool.volatility,
      totalLiquidity: pool.totalLiquidity,
      priceHistory: pool.priceHistory.slice(-24), // Последние 24 точки
      algorithm: this.selectAlgorithm(pool.volatility, 0, pool),
      stabilityScore: this.calculateStabilityScore(pool)
    }
  }

  /**
   * 🎯 Расчет индекса стабильности
   */
  private calculateStabilityScore(pool: LiquidityPool): number {
    const volatility = pool.volatility
    const liquidity = pool.totalLiquidity
    
    // Индекс от 0 до 100 (100 = максимальная стабильность)
    const volatilityScore = Math.max(0, 100 - volatility * 5)
    const liquidityScore = Math.min(100, liquidity / 10000) // Нормализация
    
    return (volatilityScore + liquidityScore) / 2
  }
}

export type { AMMConfig, SwapParams, SwapResult, LiquidityPool, PricePoint }

// Экспорт синглтона
export const advancedAMM = new AdvancedAMM()
