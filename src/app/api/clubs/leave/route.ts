import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// POST /api/clubs/leave - Leave current club
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find user's active club membership
    const membership = await db.clubMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true
      },
      include: {
        club: true
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'No active club membership found' },
        { status: 404 }
      )
    }

    // Use transaction to ensure data consistency
    await db.$transaction(async (tx) => {
      // Deactivate membership
      await tx.clubMember.update({
        where: { id: membership.id },
        data: { 
          isActive: false,
          leftAt: new Date()
        }
      })

      // Update club member count
      await tx.club.update({
        where: { id: membership.clubId },
        data: { memberCount: { decrement: 1 } }
      })

      // Refund partial amount (80% of original price)
      const refundAmount = Math.floor(membership.club.price * 0.8)
      
      await tx.user.update({
        where: { id: session.user.id },
        data: { balance: { increment: refundAmount } }
      })

      // Create refund transaction record
      await tx.reward.create({
        data: {
          userId: session.user.id,
          type: 'CLUB_LEAVE',
          amount: refundAmount,
          reason: `Club leave refund from ${membership.club.name}`
        }
      })

      // Create notification
      await tx.notification.create({
        data: {
          userId: session.user.id,
          type: 'CLUB_LEAVE',
          title: 'Вы покинули клуб',
          message: `Вы покинули ${membership.club.name} и получили возврат ${refundAmount} T1`,
          data: { 
            clubId: membership.clubId, 
            clubName: membership.club.name,
            refundAmount 
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully left club',
      refundAmount: Math.floor(membership.club.price * 0.8)
    })

  } catch (error) {
    console.error('Error leaving club:', error)
    return NextResponse.json(
      { error: 'Failed to leave club' },
      { status: 500 }
    )
  }
}
