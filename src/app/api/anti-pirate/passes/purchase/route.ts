import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions, getSessionUser } from '@/lib/auth'

// POST /api/anti-pirate/passes/purchase - Purchase NFT pass
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = getSessionUser(session)
    
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { passId, deviceId, walletAddress, trackId, clubId, genreId } = body

    if (!passId || !deviceId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get pass template
    const passTemplate = await db.nFTPassTemplate.findUnique({
      where: { id: passId }
    })

    if (!passTemplate) {
      return NextResponse.json(
        { error: 'Pass template not found' },
        { status: 404 }
      )
    }

    // Check if user has enough balance
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: { tonBalance: true, balance: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has enough TON balance
    if (user.tonBalance < passTemplate.price) {
      return NextResponse.json(
        { error: 'Insufficient TON balance' },
        { status: 400 }
      )
    }

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Deduct TON from user balance
      await tx.user.update({
        where: { id: sessionUser.id },
        data: { tonBalance: { decrement: passTemplate.price } }
      })

      // Create NFT pass
      const pass = await tx.nFTPass.create({
        data: {
          userId: sessionUser.id,
          type: passTemplate.type,
          name: passTemplate.name,
          price: passTemplate.price,
          duration: passTemplate.duration,
          description: passTemplate.description,
          benefits: passTemplate.benefits as unknown as Prisma.InputJsonValue,
          icon: passTemplate.icon,
          color: passTemplate.color,
          isActive: true,
          expiresAt: new Date(Date.now() + passTemplate.duration * 60 * 60 * 1000),
          metadata: {
            deviceId,
            walletAddress,
            trackId: trackId || null,
            clubId: clubId || null,
            genreId: genreId || null,
            purchasedAt: new Date().toISOString()
          } as Prisma.InputJsonValue
        }
      })

      // Create purchase transaction record
      await tx.passPurchase.create({
        data: {
          userId: sessionUser.id,
          passId: pass.id,
          templateId: passTemplate.id,
          price: passTemplate.price,
          deviceId,
          walletAddress,
          status: 'COMPLETED'
        }
      })

      // Award artist with 90% of the purchase price
      if (trackId) {
        const track = await tx.track.findUnique({
          where: { id: trackId },
          select: { artistId: true }
        })

        if (track) {
          const artistReward = passTemplate.price * 0.9
          await tx.user.update({
            where: { id: track.artistId },
            data: { tonBalance: { increment: artistReward } }
          })

          await tx.reward.create({
            data: {
              userId: track.artistId,
              type: 'PASS_PURCHASE',
              amount: artistReward,
              reason: `NFT pass purchase reward (90% of ${passTemplate.price} TON)`
            }
          })
        }
      }

      return pass
    })

    return NextResponse.json({
      success: true,
      pass: {
        id: result.id,
        type: result.type,
        name: result.name,
        price: result.price,
        duration: result.duration,
        description: result.description,
        benefits: result.benefits,
        icon: result.icon,
        color: result.color,
        isActive: result.isActive,
        expiresAt: result.expiresAt?.getTime(),
        createdAt: result.createdAt.getTime(),
        metadata: result.metadata
      }
    })

  } catch (error) {
    console.error('Error purchasing NFT pass:', error)
    return NextResponse.json(
      { error: 'Failed to purchase NFT pass' },
      { status: 500 }
    )
  }
}
