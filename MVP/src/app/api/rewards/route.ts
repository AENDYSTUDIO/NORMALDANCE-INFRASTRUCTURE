import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { musicTokenService } from '@/lib/music-token'
import { z } from 'zod'

const rewardSchema = z.object({
  userWallet: z.string().min(32),
  trackId: z.string().min(1),
  listenDuration: z.number().min(10), // minimum 10 seconds
  userId: z.string().optional()
})

// Reward users for listening to tracks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = rewardSchema.parse(body)

    // Check if user already rewarded for this track recently
    const existingReward = await db.listenerReward.findFirst({
      where: {
        userWallet: validatedData.userWallet,
        trackId: validatedData.trackId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
        }
      }
    })

    if (existingReward) {
      return NextResponse.json(
        { error: 'Already rewarded for this track in the last 24 hours' },
        { status: 400 }
      )
    }

    // Calculate reward based on listen duration
    const baseReward = 0.1 // 0.1 NDT base reward
    const durationBonus = Math.min(validatedData.listenDuration / 60, 5) // Max 5x bonus for 5+ minutes
    const totalReward = baseReward * durationBonus

    // Get track info to verify it exists
    const track = await db.track.findUnique({
      where: { id: validatedData.trackId }
    })

    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      )
    }

    // Record the reward in database
    const rewardRecord = await db.listenerReward.create({
      data: {
        userWallet: validatedData.userWallet,
        trackId: validatedData.trackId,
        amount: totalReward,
        listenDuration: validatedData.listenDuration,
        userId: validatedData.userId
      }
    })

    // Queue the token reward (in production, use a background job)
    try {
      const txSignature = await musicTokenService.rewardListener(
        new PublicKey(validatedData.userWallet),
        validatedData.trackId,
        totalReward
      )

      // Update reward record with transaction signature
      await db.listenerReward.update({
        where: { id: rewardRecord.id },
        data: { transactionSignature: txSignature }
      })

      return NextResponse.json({
        success: true,
        reward: totalReward,
        transactionSignature: txSignature,
        message: `Earned ${totalReward} NDT for listening!`
      })

    } catch (tokenError) {
      console.error('Token reward failed:', tokenError)
      
      // Still record the reward but mark as pending
      await db.listenerReward.update({
        where: { id: rewardRecord.id },
        data: { status: 'PENDING' }
      })

      return NextResponse.json({
        success: true,
        reward: totalReward,
        pending: true,
        message: `Earned ${totalReward} NDT! Processing reward...`
      })
    }

  } catch (error) {
    console.error('Reward processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process reward' },
      { status: 500 }
    )
  }
}

// Get user's reward history
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

    const rewards = await db.listenerReward.findMany({
      where: { userWallet },
      include: {
        track: {
          select: {
            title: true,
            artist: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const totalEarned = rewards.reduce((sum, reward) => sum + reward.amount, 0)

    return NextResponse.json({
      rewards,
      totalEarned,
      count: rewards.length
    })

  } catch (error) {
    console.error('Error fetching reward history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reward history' },
      { status: 500 }
    )
  }
}