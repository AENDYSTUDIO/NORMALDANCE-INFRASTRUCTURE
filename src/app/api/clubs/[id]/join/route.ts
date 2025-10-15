import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { joinClubSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

// POST /api/clubs/[id]/join - Join a club
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find the club
    const club = await db.club.findUnique({
      where: { id },
      include: {
        members: true,
        _count: {
          select: { members: true }
        }
      }
    })

    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      )
    }

    if (!club.isActive) {
      return NextResponse.json(
        { error: 'Club is not active' },
        { status: 400 }
      )
    }

    if (club._count.members >= club.maxMembers) {
      return NextResponse.json(
        { error: 'Club is full' },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const existingMembership = await db.clubMember.findFirst({
      where: {
        clubId: id,
        userId: session.user.id,
        isActive: true
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Already a member of this club' },
        { status: 400 }
      )
    }

    // Check if user has enough balance
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true, name: true }
    })

    if (!user || user.balance < club.price) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Deduct club price from user balance
      await tx.user.update({
        where: { id: session.user.id },
        data: { balance: { decrement: club.price } }
      })

      // Create club membership
      const membership = await tx.clubMember.create({
        data: {
          clubId: id,
          userId: session.user.id,
          nftBalance: 1,
          joinedAt: new Date(),
          isActive: true
        }
      })

      // Update club member count
      await tx.club.update({
        where: { id },
        data: { memberCount: { increment: 1 } }
      })

      // Add club price to club's prize pool
      await tx.club.update({
        where: { id },
        data: { 
          totalPrizePool: { increment: club.price },
          monthlyPrizePool: { increment: club.price }
        }
      })

      // Create reward for joining
      await tx.reward.create({
        data: {
          userId: session.user.id,
          type: 'CLUB_JOIN',
          amount: Math.floor(club.price * 0.1), // 10% bonus
          reason: `Club join bonus for ${club.name}`
        }
      })

      // Update user balance with bonus
      await tx.user.update({
        where: { id: session.user.id },
        data: { balance: { increment: Math.floor(club.price * 0.1) } }
      })

      // Create notification
      await tx.notification.create({
        data: {
          userId: session.user.id,
          type: 'CLUB_JOIN',
          title: 'Добро пожаловать в клуб!',
          message: `Вы успешно присоединились к ${club.name}`,
          data: { clubId: id, clubName: club.name }
        }
      })

      return membership
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully joined club',
      membership: {
        id: result.id,
        clubId: result.clubId,
        userId: result.userId,
        nftBalance: result.nftBalance,
        joinedAt: result.joinedAt.toISOString(),
        isActive: result.isActive
      }
    })

  } catch (error) {
    console.error('Error joining club:', error)
    return NextResponse.json(
      { error: 'Failed to join club' },
      { status: 500 }
    )
  }
}
