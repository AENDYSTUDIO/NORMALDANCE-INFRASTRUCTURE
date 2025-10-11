import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions, getSessionUser } from '@/lib/auth'

// GET /api/unified/stats - Get unified system statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = getSessionUser(session)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get comprehensive system statistics
    const stats = await db.$transaction([
      // User stats
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      
      // Track stats
      db.track.count(),
      db.track.aggregate({
        _sum: { playCount: true }
      }),
      
      // Club stats
      db.club.count(),
      db.clubMember.count({ where: { isActive: true } }),
      
      // Financial stats
      db.swapTransaction.aggregate({
        _sum: { inputAmount: true, outputAmount: true }
      }),
      db.liquidityPool.aggregate({
        _sum: { totalLiquidity: true }
      }),
      
      // Activity stats
      db.playbackSession.count({
        where: {
          startTime: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      db.chatMessage.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      db.chatVote.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      db.nFTPass.count({
        where: {
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      })
    ])

    // Calculate additional metrics
    const totalUsers = stats[0]
    const activeUsers = stats[1]
    const totalTracks = stats[2]
    const totalPlays = stats[3]._sum.playCount || 0
    const totalClubs = stats[4]
    const activeClubMembers = stats[5]
    const swapVolume = stats[6]._sum.inputAmount || 0
    const totalLiquidity = stats[7]._sum.totalLiquidity || 0
    const activeSessions = stats[8]
    const chatMessages = stats[9]
    const votes = stats[10]
    const activePasses = stats[11]

    // Get revenue metrics
    const revenueStats = await db.$transaction([
      db.reward.aggregate({
        _sum: { amount: true }
      }),
      db.passPurchase.aggregate({
        _sum: { price: true }
      }),
      db.club.aggregate({
        _sum: { totalPrizePool: true }
      })
    ])

    const totalRewards = revenueStats[0]._sum.amount || 0
    const totalPassRevenue = revenueStats[1]._sum.price || 0
    const totalPrizePools = revenueStats[2]._sum.totalPrizePool || 0

    // Get growth metrics (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const growthStats = await db.$transaction([
      db.user.count({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      db.track.count({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      db.club.count({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      })
    ])

    const systemStats = {
      // Core metrics
      totalUsers,
      activeUsers,
      totalTracks,
      totalPlays,
      totalClubs,
      activeClubMembers,
      
      // Financial metrics
      totalRevenue: totalPassRevenue + totalRewards,
      totalNDT: totalRewards,
      totalTON: totalPassRevenue,
      swapVolume,
      totalLiquidity,
      totalPrizePools,
      
      // Activity metrics
      activeSessions,
      chatMessages,
      votes,
      activePasses,
      
      // Growth metrics
      newUsers30d: growthStats[0],
      newTracks30d: growthStats[1],
      newClubs30d: growthStats[2],
      
      // Calculated metrics
      userEngagement: activeUsers / totalUsers,
      avgPlaysPerTrack: totalTracks > 0 ? totalPlays / totalTracks : 0,
      avgMembersPerClub: totalClubs > 0 ? activeClubMembers / totalClubs : 0
    }

    return NextResponse.json({
      success: true,
      stats: systemStats
    })

  } catch (error) {
    console.error('Error getting unified stats:', error)
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}
