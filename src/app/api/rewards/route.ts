import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/rewards - Get rewards for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    const where = {
      userId,
      ...(type && { type: type as any })
    }

    const [rewards, total] = await Promise.all([
      db.reward.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.reward.count({ where })
    ])

    // Calculate total earnings
    const totalEarnings = await db.reward.aggregate({
      where: { userId },
      _sum: { amount: true }
    })

    // Calculate earnings by type
    const earningsByType = await db.reward.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { amount: true },
      _count: { amount: true }
    })

    return NextResponse.json({
      rewards,
      totalEarnings: totalEarnings._sum.amount || 0,
      earningsByType,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching rewards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    )
  }
}

// POST /api/rewards - Create a new reward (admin only)
export async function POST(request: NextRequest) {
  try {
    // Server-side RBAC: Only admins can create rewards
    const { getServerSession } = await import('next-auth/next')
    const { authOptions } = await import('@/lib/auth')
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.level !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, type, amount, reason } = body

    if (!userId || !type || amount === undefined) {
      return NextResponse.json(
        { error: 'userId, type, and amount are required' },
        { status: 400 }
      )
    }

    // Validate reward type
    const validTypes = ['LISTENING', 'UPLOAD', 'LIKE', 'COMMENT', 'REFERRAL', 'DAILY_BONUS', 'PLAYLIST', 'FOLLOW']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid reward type' },
        { status: 400 }
      )
    }

    // Create reward
    const reward = await db.reward.create({
      data: {
        userId,
        type,
        amount,
        reason: reason || `${type} reward`
      }
    })

    // Update user balance
    await db.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } }
    })

    // Check if user should level up
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { balance: true, level: true }
    })

    if (user) {
      let newLevel = user.level
      if (user.balance >= 100001 && user.level !== 'PLATINUM') {
        newLevel = 'PLATINUM'
      } else if (user.balance >= 10001 && user.level !== 'GOLD') {
        newLevel = 'GOLD'
      } else if (user.balance >= 1001 && user.level !== 'SILVER') {
        newLevel = 'SILVER'
      }

      if (newLevel !== user.level) {
        await db.user.update({
          where: { id: userId },
          data: { level: newLevel }
        })
      }
    }

    return NextResponse.json(reward, { status: 201 })
  } catch (error) {
    console.error('Error creating reward:', error)
    return NextResponse.json(
      { error: 'Failed to create reward' },
      { status: 500 }
    )
  }
}