import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions, getSessionUser } from '@/lib/auth'

// GET /api/unified/profile - Get unified user profile
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

    // Get comprehensive user profile
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        clubMemberships: {
          where: { isActive: true },
          include: { club: true }
        },
        nftPasses: {
          where: { 
            isActive: true,
            expiresAt: { gt: new Date() }
          }
        },
        rewards: {
          select: { amount: true }
        },
        tracks: {
          select: { id: true }
        },
        achievements: {
          select: { id: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate total earnings
    const totalEarnings = user.rewards.reduce((sum, reward) => sum + reward.amount, 0)

    // Get recent activity
    const recentActivity = await db.$transaction([
      // Recent tracks
      db.track.findMany({
        where: { userId: sessionUser.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true
        }
      }),
      // Recent club activities
      db.clubAchievement.findMany({
        where: {
          club: {
            members: {
              some: { userId: sessionUser.id }
            }
          }
        },
        orderBy: { earnedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          earnedAt: true
        }
      }),
      // Recent chat messages
      db.chatMessage.findMany({
        where: { userId: sessionUser.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          content: true,
          chatType: true,
          createdAt: true
        }
      })
    ])

    // Get system-wide stats
    const systemStats = await db.$transaction([
      db.user.count(),
      db.track.count(),
      db.club.count(),
      db.chatMessage.count(),
      db.swapTransaction.count(),
      db.nFTPass.count()
    ])

    const profile = {
      id: user.id,
      name: user.name || 'Anonymous',
      email: user.email,
      avatar: user.avatar || '/avatars/default.jpg',
      level: user.level,
      balance: user.balance,
      tonBalance: user.tonBalance || 0,
      clubMemberships: user.clubMemberships.length,
      activePasses: user.nftPasses.length,
      totalEarnings,
      achievements: user.achievements.length,
      tracks: user.tracks.length,
      isOnline: true, // This would be determined by real-time presence
      lastActive: user.updatedAt.getTime(),
      recentActivity: {
        tracks: recentActivity[0],
        clubActivities: recentActivity[1],
        chatMessages: recentActivity[2]
      },
      systemStats: {
        totalUsers: systemStats[0],
        totalTracks: systemStats[1],
        totalClubs: systemStats[2],
        totalChatMessages: systemStats[3],
        totalSwaps: systemStats[4],
        totalPasses: systemStats[5]
      }
    }

    return NextResponse.json({
      success: true,
      profile
    })

  } catch (error) {
    console.error('Error getting unified profile:', error)
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    )
  }
}

// PUT /api/unified/profile - Update user profile
export async function PUT(request: NextRequest) {
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
    const { name, avatar, bio } = body

    const updatedUser = await db.user.update({
      where: { id: sessionUser.id },
      data: {
        name: name || undefined,
        avatar: avatar || undefined,
        bio: bio || undefined
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio
      }
    })

  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
