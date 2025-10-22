import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { trackProgressSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

// GET /api/tracks/[id]/progress - Get secret progress data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    // Find the track
    const track = await db.track.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        artistId: true,
        progressTarget: true, // Hidden target amount
        progressCurrent: true, // Current progress
        progressContributors: true, // Number of contributors
        progressPhase: true, // Current phase
        progressStartTime: true,
        progressEndTime: true,
        isProgressComplete: true,
        artist: {
          select: {
            name: true,
            avatar: true
          }
        }
      }
    })

    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      )
    }

    // Get recent contributors (last 10)
    const recentContributors = await db.progressContribution.findMany({
      where: { trackId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        user: {
          select: {
            name: true,
            avatar: true
          }
        },
        amount: true,
        createdAt: true
      }
    })

    // Calculate progress percentage (hidden from users)
    const percentage = Math.min(
      Math.round((track.progressCurrent / track.progressTarget) * 100), 
      100
    )

    // Determine current phase based on percentage
    const phases = [
      { min: 0, max: 25, name: 'Искры', emoji: '🩸', color: 'text-red-500' },
      { min: 25, max: 50, name: 'Пламя', emoji: '🔥', color: 'text-orange-500' },
      { min: 50, max: 75, name: 'Ускорение', emoji: '⚡', color: 'text-yellow-500' },
      { min: 75, max: 99, name: 'Почти there', emoji: '💥', color: 'text-purple-500' },
      { min: 100, max: 100, name: 'Релиз активирован', emoji: '🚀', color: 'text-green-500' }
    ]

    const currentPhase = phases.find(phase => 
      percentage >= phase.min && percentage <= phase.max
    ) || phases[0]

    // Calculate time remaining
    let timeRemaining: number | undefined
    if (track.progressEndTime) {
      const now = new Date()
      const endTime = new Date(track.progressEndTime)
      timeRemaining = Math.max(0, endTime.getTime() - now.getTime())
    }

    // Format recent contributors
    const formattedContributors = recentContributors.map(contributor => ({
      name: contributor.user.name || 'Аноним',
      amount: contributor.amount,
      timestamp: contributor.createdAt.getTime(),
      avatar: contributor.user.avatar
    }))

    const progressData = {
      current: track.progressCurrent,
      target: track.progressTarget, // This is hidden from frontend
      phase: {
        ...currentPhase,
        description: getPhaseDescription(currentPhase.name),
        motivation: getPhaseMotivation(currentPhase.name, percentage)
      },
      contributors: track.progressContributors,
      recentContributors: formattedContributors,
      timeRemaining,
      isComplete: track.isProgressComplete || percentage >= 100
    }

    return NextResponse.json({
      success: true,
      data: progressData
    })

  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/tracks/[id]/progress/contribute - Contribute to progress
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

    const body = await request.json()
    const { amount } = trackProgressSchema.parse(body)

    // Find the track
    const track = await db.track.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        progressTarget: true,
        progressCurrent: true,
        progressContributors: true,
        isProgressComplete: true
      }
    })

    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      )
    }

    if (track.isProgressComplete) {
      return NextResponse.json(
        { error: 'Progress already complete' },
        { status: 400 }
      )
    }

    // Check if user has enough balance
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true }
    })

    if (!user || user.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Update track progress
    const updatedTrack = await db.track.update({
      where: { id },
      data: {
        progressCurrent: { increment: amount },
        progressContributors: { increment: 1 },
        isProgressComplete: track.progressCurrent + amount >= track.progressTarget
      }
    })

    // Record contribution
    await db.progressContribution.create({
      data: {
        trackId: id,
        userId: session.user.id,
        amount: amount
      }
    })

    // Deduct from user balance
    await db.user.update({
      where: { id: session.user.id },
      data: { balance: { decrement: amount } }
    })

    // Add reward for contribution
    await db.reward.create({
      data: {
        userId: session.user.id,
        type: 'CONTRIBUTION',
        amount: Math.floor(amount * 0.1), // 10% reward
        reason: `Contribution reward for track ${track.title}`
      }
    })

    // Update user balance with reward
    await db.user.update({
      where: { id: session.user.id },
      data: { balance: { increment: Math.floor(amount * 0.1) } }
    })

    // Check if progress is complete
    if (updatedTrack.isProgressComplete) {
      // Trigger completion rewards and notifications
      await triggerProgressCompletion(id, session.user.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Contribution recorded successfully',
      newProgress: updatedTrack.progressCurrent,
      isComplete: updatedTrack.isProgressComplete
    })

  } catch (error) {
    return handleApiError(error)
  }
}

// Helper functions
function getPhaseDescription(phaseName: string): string {
  const descriptions = {
    'Искры': 'Первые искры творчества',
    'Пламя': 'Огонь уже горит',
    'Ускорение': 'Момент истины близок',
    'Почти there': 'Осталось совсем чуть-чуть',
    'Релиз активирован': 'Миссия выполнена!'
  }
  return descriptions[phaseName] || 'Прогресс в процессе'
}

function getPhaseMotivation(phaseName: string, percentage: number): string {
  const motivations = {
    'Искры': 'Ты можешь быть тем, кто зажжёт огонь!',
    'Пламя': 'Каждый вклад разжигает пламя сильнее!',
    'Ускорение': 'Мы на финишной прямой!',
    'Почти there': 'Кто добьёт последний процент?',
    'Релиз активирован': 'Сообщество победило!'
  }
  return motivations[phaseName] || 'Продолжайте в том же духе!'
}

async function triggerProgressCompletion(trackId: string, userId: string) {
  try {
    // Get all contributors
    const contributors = await db.progressContribution.findMany({
      where: { trackId },
      select: { userId: true, amount: true }
    })

    // Calculate total contributions
    const totalContributions = contributors.reduce((sum, c) => sum + c.amount, 0)

    // Distribute completion rewards
    for (const contributor of contributors) {
      const rewardAmount = Math.floor(contributor.amount * 0.2) // 20% bonus
      
      await db.reward.create({
        data: {
          userId: contributor.userId,
          type: 'COMPLETION_BONUS',
          amount: rewardAmount,
          reason: `Completion bonus for track ${trackId}`
        }
      })

      await db.user.update({
        where: { id: contributor.userId },
        data: { balance: { increment: rewardAmount } }
      })
    }

    // Create completion notification
    await db.notification.create({
      data: {
        userId: userId,
        type: 'PROGRESS_COMPLETE',
        title: 'Релиз активирован!',
        message: 'Сообщество собрало достаточно средств для релиза трека!',
        data: { trackId }
      }
    })

    // Update track status
    await db.track.update({
      where: { id: trackId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    })

  } catch (error) {
    handleApiError(error)
  }
}
