import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { advancedAMM } from '@/lib/advanced-amm'
import { volatilityProtectionSystem } from '@/lib/volatility-protection'
import { dexAdvancedSwapPostSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

// POST /api/dex/advanced-swap - Execute advanced swap with hybrid AMM
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      from,
      to,
      amount: swapAmount,
      slippage,
      maxPriceImpact,
      useAdvancedAMM,
      enableVolatilityProtection
    } = dexAdvancedSwapPostSchema.parse(body)

    // Get current liquidity pool
    const pool = await db.liquidityPool.findFirst({
      where: { pair: 'TON-NDT' }
    })

    if (!pool) {
      return NextResponse.json(
        { error: 'Liquidity pool not found' },
        { status: 404 }
      )
    }

    // Check user balance
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { 
        balance: true, 
        tonBalance: true,
        name: true 
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has enough balance
    if (from === 'TON' && user.tonBalance < swapAmount) {
      return NextResponse.json(
        { error: 'Insufficient TON balance' },
        { status: 400 }
      )
    }

    if (from === 'NDT' && user.balance < swapAmount) {
      return NextResponse.json(
        { error: 'Insufficient NDT balance' },
        { status: 400 }
      )
    }

    let swapResult: Record<string, unknown>
    let updatedPool: Record<string, unknown>

    if (useAdvancedAMM) {
      // Use advanced AMM with hybrid algorithms
      const poolData = {
        tonReserve: pool.tonReserve,
        ndtReserve: pool.ndtReserve,
        totalLiquidity: pool.totalLiquidity,
        lastUpdate: pool.updatedAt.getTime(),
        volatility: 0, // Will be calculated by AMM
        priceHistory: [] // Will be populated by AMM
      }

      swapResult = await advancedAMM.executeSwap({
        from,
        to,
        amount: swapAmount,
        slippage,
        maxPriceImpact
      }, poolData)

      // Update pool with new data
      updatedPool = advancedAMM.updatePool('ton-ndt-pool', {
        from,
        to,
        amount: swapAmount,
        slippage,
        maxPriceImpact
      }, swapResult)

    } else {
      // Fallback to simple AMM
      const { tonReserve, ndtReserve } = pool
      let rate: number
      let outputAmount: number
      let fee: number

      if (from === 'TON' && to === 'NDT') {
        rate = ndtReserve / tonReserve
        fee = swapAmount * 0.0025
        const inputAfterFee = swapAmount - fee
        outputAmount = (inputAfterFee * ndtReserve) / (tonReserve + inputAfterFee)
      } else {
        rate = tonReserve / ndtReserve
        fee = swapAmount * 0.0025
        const inputAfterFee = swapAmount - fee
        outputAmount = (inputAfterFee * tonReserve) / (ndtReserve + inputAfterFee)
      }

      swapResult = {
        outputAmount,
        priceImpact: 0,
        algorithm: 'CPMM',
        fee,
        executionTime: 0,
        volatility: 0
      }
    }

    // Check slippage tolerance
    const expectedOutput = swapAmount * (from === 'TON' ? pool.ndtReserve / pool.tonReserve : pool.tonReserve / pool.ndtReserve)
    const slippageAmount = expectedOutput * (slippage / 100)
    const minOutput = expectedOutput - slippageAmount

    if (swapResult.outputAmount < minOutput) {
      return NextResponse.json(
        { error: 'Slippage tolerance exceeded' },
        { status: 400 }
      )
    }

    // Check price impact
    if (swapResult.priceImpact > maxPriceImpact) {
      return NextResponse.json(
        { error: `Price impact too high: ${swapResult.priceImpact.toFixed(2)}%` },
        { status: 400 }
      )
    }

    // Execute the swap in database
    const result = await db.$transaction(async (tx) => {
      // Update user balances
      if (from === 'TON') {
        await tx.user.update({
          where: { id: session.user.id },
          data: { 
            tonBalance: { decrement: swapAmount },
            balance: { increment: swapResult.outputAmount }
          }
        })
      } else {
        await tx.user.update({
          where: { id: session.user.id },
          data: { 
            balance: { decrement: swapAmount },
            tonBalance: { increment: swapResult.outputAmount }
          }
        })
      }

      // Update liquidity pool
      if (from === 'TON' && to === 'NDT') {
        await tx.liquidityPool.update({
          where: { id: pool.id },
          data: {
            tonReserve: { increment: swapAmount },
            ndtReserve: { decrement: swapResult.outputAmount }
          }
        })
      } else {
        await tx.liquidityPool.update({
          where: { id: pool.id },
          data: {
            tonReserve: { decrement: swapResult.outputAmount },
            ndtReserve: { increment: swapAmount }
          }
        })
      }

      // Create swap transaction record
      const transaction = await tx.swapTransaction.create({
        data: {
          userId: session.user.id,
          from,
          to,
          inputAmount: swapAmount,
          outputAmount: swapResult.outputAmount,
          rate: swapResult.outputAmount / swapAmount,
          fee: swapResult.fee,
          slippage,
          status: 'COMPLETED'
        }
      })

      // Distribute fees
      const feeDistribution = swapResult.fee * 0.8 // 80% to LPs
      await tx.liquidityPool.update({
        where: { id: pool.id },
        data: {
          totalFees: { increment: feeDistribution }
        }
      })

      // Add to stability reserve (5% of fees)
      const stabilityReserve = swapResult.fee * 0.05
      await tx.stabilityReserve.upsert({
        where: { id: 'main' },
        update: { balance: { increment: stabilityReserve } },
        create: { 
          id: 'main',
          balance: stabilityReserve,
          currency: 'TON'
        }
      })

      return transaction
    })

    // Trigger volatility protection if enabled
    if (enableVolatilityProtection && swapResult.volatility > 10) {
      // This would trigger protection mechanisms in background
      console.log(`🛡️ High volatility detected: ${swapResult.volatility.toFixed(2)}%`)
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: result.id,
        from,
        to,
        inputAmount: swapAmount,
        outputAmount: swapResult.outputAmount,
        rate: swapResult.outputAmount / swapAmount,
        fee: swapResult.fee,
        timestamp: result.createdAt.getTime(),
        status: result.status,
        // Advanced AMM data
        advanced: useAdvancedAMM ? {
          algorithm: swapResult.algorithm,
          priceImpact: swapResult.priceImpact,
          executionTime: swapResult.executionTime,
          volatility: swapResult.volatility
        } : null
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}
