import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { musicTokenService } from '@/lib/music-token'
import { z } from 'zod'

const stakeSchema = z.object({
  userWallet: z.string().min(32),
  amount: z.number().min(1), // Minimum 1 NDT
  durationDays: z.number().min(1).max(365) // 1 day to 1 year
})

// Stake tokens for additional rewards
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = stakeSchema.parse(body)

    // Check user's token balance
    const currentBalance = await musicTokenService.getUserTokenBalance(
      new PublicKey(validatedData.userWallet)
    )

    if (currentBalance < validatedData.amount) {
      return NextResponse.json(
        { error: 'Insufficient token balance' },
        { status: 400 }
      )
    }

    // Calculate staking rewards
    const baseAPY = 0.10 // 10% annual percentage yield
    const durationMultiplier = validatedData.durationDays / 365
    const expectedRewards = validatedData.amount * baseAPY * durationMultiplier

    // Create staking record
    const stakingRecord = await db.stakingPosition.create({
      data: {
        userWallet: validatedData.userWallet,
        amount: validatedData.amount,
        durationDays: validatedData.durationDays,
        expectedRewards,
        startDate: new Date(),
        endDate: new Date(Date.now() + validatedData.durationDays * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      }
    })

    try {
      // Execute staking transaction
      const txSignature = await musicTokenService.stakeTokens(
        new PublicKey(validatedData.userWallet),
        validatedData.amount,
        validatedData.durationDays
      )

      // Update record with transaction signature
      await db.stakingPosition.update({
        where: { id: stakingRecord.id },
        data: { transactionSignature: txSignature }
      })

      return NextResponse.json({
        success: true,
        stakingPosition: {
          id: stakingRecord.id,
          amount: validatedData.amount,
          durationDays: validatedData.durationDays,
          expectedRewards,
          startDate: stakingRecord.startDate,
          endDate: stakingRecord.endDate
        },
        transactionSignature: txSignature,
        message: `Staked ${validatedData.amount} NDT for ${validatedData.durationDays} days`
      })

    } catch (tokenError) {
      console.error('Staking transaction failed:', tokenError)
      
      // Mark as pending
      await db.stakingPosition.update({
        where: { id: stakingRecord.id },
        data: { status: 'PENDING' }
      })

      return NextResponse.json({
        success: true,
        stakingPosition: stakingRecord,
        pending: true,
        message: `Staking ${validatedData.amount} NDT... Processing transaction`
      })
    }

  } catch (error) {
    console.error('Staking error:', error)
    return NextResponse.json(
      { error: 'Failed to stake tokens' },
      { status: 500 }
    )
  }
}

// Get user's staking positions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userWallet = searchParams.get('userWallet')

    if (!userWallet) {
      return NextResponse.json(
        { error: 'userWallet parameter required' },
        { status: 400 }
      )
    }

    const stakingPositions = await db.stakingPosition.findMany({
      where: { userWallet },
      orderBy: { createdAt: 'desc' }
    })

    const totalStaked = stakingPositions
      .filter(pos => pos.status === 'ACTIVE')
      .reduce((sum, pos) => sum + pos.amount, 0)

    const totalPendingRewards = stakingPositions
      .filter(pos => pos.status === 'ACTIVE')
      .reduce((sum, pos) => sum + pos.expectedRewards, 0)

    return NextResponse.json({
      stakingPositions,
      totalStaked,
      totalPendingRewards,
      activePositions: stakingPositions.filter(pos => pos.status === 'ACTIVE').length
    })

  } catch (error) {
    console.error('Error fetching staking positions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staking positions' },
      { status: 500 }
    )
  }
}