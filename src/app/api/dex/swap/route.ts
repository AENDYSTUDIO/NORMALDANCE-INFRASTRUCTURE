import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dexSwapPostSchema, dexSwapGetSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

// POST /api/dex/swap - Execute currency swap
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
    const { from, to, amount: swapAmount, slippage } = dexSwapPostSchema.parse(body)

    // Get current exchange rate from liquidity pool
    const pool = await db.liquidityPool.findFirst({
      where: { pair: 'TON-NDT' }
    })

    if (!pool) {
      return NextResponse.json(
        { error: 'Liquidity pool not found' },
        { status: 404 }
      )
    }

    // Calculate exchange rate using constant product formula
    const { tonReserve, ndtReserve } = pool
    let rate: number
    let outputAmount: number
    let fee: number

    if (from === 'TON' && to === 'NDT') {
      // TON to NDT
      rate = ndtReserve / tonReserve
      fee = swapAmount * 0.0025 // 0.25% fee
      const inputAfterFee = swapAmount - fee
      outputAmount = (inputAfterFee * ndtReserve) / (tonReserve + inputAfterFee)
    } else if (from === 'NDT' && to === 'TON') {
      // NDT to TON
      rate = tonReserve / ndtReserve
      fee = swapAmount * 0.0025 // 0.25% fee
      const inputAfterFee = swapAmount - fee
      outputAmount = (inputAfterFee * tonReserve) / (ndtReserve + inputAfterFee)
    } else {
      return NextResponse.json(
        { error: 'Invalid currency pair' },
        { status: 400 }
      )
    }

    // Check slippage tolerance
    const expectedOutput = swapAmount * rate
    const slippageAmount = expectedOutput * (slippage / 100)
    const minOutput = expectedOutput - slippageAmount

    if (outputAmount < minOutput) {
      return NextResponse.json(
        { error: 'Slippage tolerance exceeded' },
        { status: 400 }
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

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Update user balances
      if (from === 'TON') {
        await tx.user.update({
          where: { id: session.user.id },
          data: { 
            tonBalance: { decrement: swapAmount },
            balance: { increment: outputAmount }
          }
        })
      } else {
        await tx.user.update({
          where: { id: session.user.id },
          data: { 
            balance: { decrement: swapAmount },
            tonBalance: { increment: outputAmount }
          }
        })
      }

      // Update liquidity pool
      if (from === 'TON' && to === 'NDT') {
        await tx.liquidityPool.update({
          where: { id: pool.id },
          data: {
            tonReserve: { increment: swapAmount },
            ndtReserve: { decrement: outputAmount }
          }
        })
      } else {
        await tx.liquidityPool.update({
          where: { id: pool.id },
          data: {
            tonReserve: { decrement: outputAmount },
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
          outputAmount,
          rate,
          fee,
          slippage,
          status: 'COMPLETED'
        }
      })

      // Distribute fees to liquidity providers
      const feeDistribution = fee * 0.8 // 80% to LPs, 20% to protocol
      await tx.liquidityPool.update({
        where: { id: pool.id },
        data: {
          totalFees: { increment: feeDistribution }
        }
      })

      // Add to stability reserve (5% of fees)
      const stabilityReserve = fee * 0.05
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

    return NextResponse.json({
      success: true,
      transaction: {
        id: result.id,
        from,
        to,
        inputAmount: swapAmount,
        outputAmount,
        rate,
        fee,
        timestamp: result.createdAt.getTime(),
        status: result.status
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

// GET /api/dex/swap - Get swap history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const { limit, offset } = dexSwapGetSchema.parse(query)

    const transactions = await db.swapTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      from: tx.from,
      to: tx.to,
      inputAmount: tx.inputAmount,
      outputAmount: tx.outputAmount,
      rate: tx.rate,
      fee: tx.fee,
      timestamp: tx.createdAt.getTime(),
      status: tx.status
    }))

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions
    })

  } catch (error) {
    return handleApiError(error)
  }
}
