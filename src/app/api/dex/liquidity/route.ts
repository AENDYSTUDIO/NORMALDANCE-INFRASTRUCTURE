import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dexLiquidityPostSchema, dexLiquidityDeleteSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

// POST /api/dex/liquidity - Add liquidity to pool
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
    const { tonAmount, ndtAmount } = dexLiquidityPostSchema.parse(body)

    // Get or create liquidity pool
    let pool = await db.liquidityPool.findFirst({
      where: { pair: 'TON-NDT' }
    })

    if (!pool) {
      // Create new pool
      pool = await db.liquidityPool.create({
        data: {
          pair: 'TON-NDT',
          tonReserve: tonAmount || 0, // Use 0 if undefined
          ndtReserve: ndtAmount || 0, // Use 0 if undefined
          totalLiquidity: (tonAmount || 0) + (ndtAmount || 0),
          totalFees: 0
        }
      })
    }

    // Check if user has enough balance
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { 
        balance: true, 
        tonBalance: true 
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (tonAmount && user.tonBalance < tonAmount) {
      return NextResponse.json(
        { error: 'Insufficient TON balance' },
        { status: 400 }
      )
    }

    if (ndtAmount && user.balance < ndtAmount) {
      return NextResponse.json(
        { error: 'Insufficient NDT balance' },
        { status: 400 }
      )
    }

    // Calculate LP tokens to mint
    let lpTokens: number
    if (pool.tonReserve === 0 && pool.ndtReserve === 0) {
      // First liquidity provision
      lpTokens = Math.sqrt((tonAmount || 0) * (ndtAmount || 0))
    } else {
      // Calculate based on existing reserves
      const tonRatio = (tonAmount || 0) / pool.tonReserve
      const ndtRatio = (ndtAmount || 0) / pool.ndtReserve
      const minRatio = Math.min(tonRatio, ndtRatio)
      lpTokens = minRatio * pool.totalLiquidity
    }

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Update user balances
      await tx.user.update({
        where: { id: session.user.id },
        data: { 
          tonBalance: { decrement: tonAmount || 0 },
          balance: { decrement: ndtAmount || 0 }
        }
      })

      // Update liquidity pool
      await tx.liquidityPool.update({
        where: { id: pool.id },
        data: {
          tonReserve: { increment: tonAmount || 0 },
          ndtReserve: { increment: ndtAmount || 0 },
          totalLiquidity: { increment: lpTokens }
        }
      })

      // Create or update liquidity position
      const existingPosition = await tx.liquidityPosition.findFirst({
        where: {
          userId: session.user.id,
          poolId: pool.id
        }
      })

      if (existingPosition) {
        await tx.liquidityPosition.update({
          where: { id: existingPosition.id },
          data: {
            tonAmount: { increment: tonAmount || 0 },
            ndtAmount: { increment: ndtAmount || 0 },
            lpTokens: { increment: lpTokens }
          }
        })
      } else {
        await tx.liquidityPosition.create({
          data: {
            userId: session.user.id,
            poolId: pool.id,
            tonAmount: tonAmount || 0,
            ndtAmount: ndtAmount || 0,
            lpTokens
          }
        })
      }

      // Create liquidity transaction record
      const transaction = await tx.liquidityTransaction.create({
        data: {
          userId: session.user.id,
          poolId: pool.id,
          type: 'ADD',
          tonAmount: tonAmount || 0,
          ndtAmount: ndtAmount || 0,
          lpTokens,
          status: 'COMPLETED'
        }
      })

      return transaction
    })

    return NextResponse.json({
      success: true,
      liquidity: {
        id: result.id,
        tonAmount,
        ndtAmount,
        lpTokens,
        timestamp: result.createdAt.getTime(),
        status: result.status
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/dex/liquidity - Remove liquidity from pool
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { lpTokens } = dexLiquidityDeleteSchema.parse(body)

    // Get user's liquidity position
    const position = await db.liquidityPosition.findFirst({
      where: {
        userId: session.user.id,
        poolId: 'ton-ndt-pool'
      },
      include: {
        pool: true
      }
    })

    if (!position || position.lpTokens < lpTokens) {
      return NextResponse.json(
        { error: 'Insufficient LP tokens' },
        { status: 400 }
      )
    }

    // Calculate amounts to return
    const ratio = lpTokens / position.lpTokens
    const tonAmount = position.tonAmount * ratio
    const ndtAmount = position.ndtAmount * ratio

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Update user balances
      await tx.user.update({
        where: { id: session.user.id },
        data: { 
          tonBalance: { increment: tonAmount },
          balance: { increment: ndtAmount }
        }
      })

      // Update liquidity pool
      await tx.liquidityPool.update({
        where: { id: position.poolId },
        data: {
          tonReserve: { decrement: tonAmount },
          ndtReserve: { decrement: ndtAmount },
          totalLiquidity: { decrement: lpTokens }
        }
      })

      // Update liquidity position
      await tx.liquidityPosition.update({
        where: { id: position.id },
        data: {
          tonAmount: { decrement: tonAmount },
          ndtAmount: { decrement: ndtAmount },
          lpTokens: { decrement: lpTokens }
        }
      })

      // Create liquidity transaction record
      const transaction = await tx.liquidityTransaction.create({
        data: {
          userId: session.user.id,
          poolId: position.poolId,
          type: 'REMOVE',
          tonAmount,
          ndtAmount,
          lpTokens,
          status: 'COMPLETED'
        }
      })

      return transaction
    })

    return NextResponse.json({
      success: true,
      liquidity: {
        id: result.id,
        tonAmount,
        ndtAmount,
        lpTokens,
        timestamp: result.createdAt.getTime(),
        status: result.status
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

// GET /api/dex/liquidity - Get liquidity positions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const positions = await db.liquidityPosition.findMany({
      where: { userId: session.user.id },
      include: {
        pool: true
      }
    })

    const formattedPositions = positions.map(position => ({
      id: position.id,
      poolId: position.poolId,
      tonAmount: position.tonAmount,
      ndtAmount: position.ndtAmount,
      lpTokens: position.lpTokens,
      share: (position.lpTokens / position.pool.totalLiquidity) * 100,
      createdAt: position.createdAt.getTime()
    }))

    return NextResponse.json({
      success: true,
      positions: formattedPositions
    })

  } catch (error) {
    return handleApiError(error)
  }
}
