import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions, getSessionUser } from '@/lib/auth'

// GET /api/unified/activity - Get unified user activity
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = getSessionUser(session)
    
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') // 'all', 'tracks', 'clubs', 'chat', 'dex', 'anti-pirate'

    // Get different types of activities
    const activities = await db.$transaction(async (tx) => {
      const allActivities = []

      // Track activities
      if (!type || type === 'all' || type === 'tracks') {
        const trackActivities = await tx.track.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            title: true,
            createdAt: true,
            playCount: true,
            isPublished: true
          }
        })

        allActivities.push(...trackActivities.map(track => ({
          id: `track-${track.id}`,
          type: 'track',
          title: track.title,
          description: `Трек ${track.isPublished ? 'опубликован' : 'создан'}`,
          timestamp: track.createdAt.getTime(),
          metadata: {
            playCount: track.playCount,
            isPublished: track.isPublished
          }
        })))
      }

      // Club activities
      if (!type || type === 'all' || type === 'clubs') {
        const clubActivities = await tx.clubMember.findMany({
          where: { userId: session.user.id },
          orderBy: { joinedAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            club: {
              select: {
                name: true,
                description: true
              }
            }
          }
        })

        allActivities.push(...clubActivities.map(member => ({
          id: `club-${member.id}`,
          type: 'club',
          title: member.club.name,
          description: member.isActive ? 'Присоединился к клубу' : 'Покинул клуб',
          timestamp: member.joinedAt.getTime(),
          metadata: {
            isActive: member.isActive,
            totalEarnings: member.totalEarnings
          }
        })))
      }

      // Chat activities
      if (!type || type === 'all' || type === 'chat') {
        const chatActivities = await tx.chatMessage.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            content: true,
            chatType: true,
            type: true,
            createdAt: true
          }
        })

        allActivities.push(...chatActivities.map(message => ({
          id: `chat-${message.id}`,
          type: 'chat',
          title: `Сообщение в ${message.chatType}`,
          description: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
          timestamp: message.createdAt.getTime(),
          metadata: {
            chatType: message.chatType,
            messageType: message.type
          }
        })))
      }

      // DEX activities
      if (!type || type === 'all' || type === 'dex') {
        const dexActivities = await tx.swapTransaction.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            from: true,
            to: true,
            inputAmount: true,
            outputAmount: true,
            createdAt: true
          }
        })

        allActivities.push(...dexActivities.map(swap => ({
          id: `swap-${swap.id}`,
          type: 'dex',
          title: `Обмен ${swap.from} → ${swap.to}`,
          description: `${swap.inputAmount} ${swap.from} → ${swap.outputAmount} ${swap.to}`,
          timestamp: swap.createdAt.getTime(),
          metadata: {
            from: swap.from,
            to: swap.to,
            inputAmount: swap.inputAmount,
            outputAmount: swap.outputAmount
          }
        })))
      }

      // Anti-pirate activities
      if (!type || type === 'all' || type === 'anti-pirate') {
        const passActivities = await tx.nftPass.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            createdAt: true,
            isActive: true
          }
        })

        allActivities.push(...passActivities.map(pass => ({
          id: `pass-${pass.id}`,
          type: 'anti-pirate',
          title: `NFT-пасс: ${pass.name}`,
          description: `Куплен за ${pass.price} TON`,
          timestamp: pass.createdAt.getTime(),
          metadata: {
            passType: pass.type,
            price: pass.price,
            isActive: pass.isActive
          }
        })))
      }

      // Sort all activities by timestamp
      return allActivities.sort((a, b) => b.timestamp - a.timestamp)
    })

    return NextResponse.json({
      success: true,
      activities: activities.slice(0, limit),
      total: activities.length
    })

  } catch (error) {
    console.error('Error getting unified activity:', error)
    return NextResponse.json(
      { error: 'Failed to get activity' },
      { status: 500 }
    )
  }
}
