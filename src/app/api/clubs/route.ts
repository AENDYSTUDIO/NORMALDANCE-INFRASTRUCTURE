import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/clubs - Get all clubs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Get all active clubs with their statistics
    const clubs = await db.club.findMany({
      where: { isActive: true },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        },
        achievements: {
          orderBy: { earnedAt: 'desc' },
          take: 5
        },
        recentWinners: {
          orderBy: { date: 'desc' },
          take: 5
        },
        _count: {
          select: {
            members: true,
            achievements: true
          }
        }
      },
      orderBy: { reputation: 'desc' }
    })

    // Format clubs data
    const formattedClubs = clubs.map(club => ({
      id: club.id,
      name: club.name,
      description: club.description,
      imageUrl: club.imageUrl,
      reputation: club.reputation,
      members: club._count.members,
      totalPrizePool: club.totalPrizePool,
      monthlyPrizePool: club.monthlyPrizePool,
      boostMultiplier: club.boostMultiplier,
      royaltyMultiplier: club.royaltyMultiplier,
      obligationRate: club.obligationRate,
      price: club.price,
      maxMembers: club.maxMembers,
      isActive: club.isActive,
      foundedAt: club.foundedAt.toISOString(),
      achievements: club.achievements.map(achievement => ({
        id: achievement.id,
        type: achievement.type,
        title: achievement.title,
        description: achievement.description,
        earnedAt: achievement.earnedAt.toISOString(),
        artist: achievement.artist,
        event: achievement.event,
        reputationBonus: achievement.reputationBonus
      })),
      recentWinners: club.recentWinners.map(winner => ({
        id: winner.id,
        artist: winner.artist,
        track: winner.track,
        position: winner.position,
        prize: winner.prize,
        event: winner.event,
        date: winner.date.toISOString()
      }))
    }))

    return NextResponse.json({
      success: true,
      clubs: formattedClubs
    })

  } catch (error) {
    console.error('Error getting clubs:', error)
    return NextResponse.json(
      { error: 'Failed to get clubs' },
      { status: 500 }
    )
  }
}

// POST /api/clubs - Create new club
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
      name, 
      description, 
      imageUrl, 
      price, 
      maxMembers,
      boostMultiplier = 0.15,
      royaltyMultiplier = 0.05,
      obligationRate = 0.20
    } = body

    if (!name || !description || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user has enough balance to create club
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only artists and admins can create clubs
    if (!['ARTIST', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Create club
    const club = await db.club.create({
      data: {
        name,
        description,
        imageUrl: imageUrl || '/clubs/default.jpg',
        price: parseFloat(price),
        maxMembers: maxMembers || 100,
        boostMultiplier: parseFloat(boostMultiplier),
        royaltyMultiplier: parseFloat(royaltyMultiplier),
        obligationRate: parseFloat(obligationRate),
        reputation: 0,
        totalPrizePool: 0,
        monthlyPrizePool: 0,
        isActive: true,
        foundedAt: new Date(),
        founderId: session.user.id
      }
    })

    // Auto-join the founder to the club
    await db.clubMember.create({
      data: {
        clubId: club.id,
        userId: session.user.id,
        nftBalance: 1,
        joinedAt: new Date(),
        isActive: true
      }
    })

    // Update club member count
    await db.club.update({
      where: { id: club.id },
      data: { memberCount: 1 }
    })

    return NextResponse.json({
      success: true,
      club: {
        id: club.id,
        name: club.name,
        description: club.description,
        imageUrl: club.imageUrl,
        reputation: club.reputation,
        members: 1,
        totalPrizePool: club.totalPrizePool,
        monthlyPrizePool: club.monthlyPrizePool,
        boostMultiplier: club.boostMultiplier,
        royaltyMultiplier: club.royaltyMultiplier,
        obligationRate: club.obligationRate,
        price: club.price,
        maxMembers: club.maxMembers,
        isActive: club.isActive,
        foundedAt: club.foundedAt.toISOString(),
        achievements: [],
        recentWinners: []
      }
    })

  } catch (error) {
    console.error('Error creating club:', error)
    return NextResponse.json(
      { error: 'Failed to create club' },
      { status: 500 }
    )
  }
}
