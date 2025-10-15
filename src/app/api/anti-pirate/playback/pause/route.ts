import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions, getSessionUser } from '@/lib/auth'
import { playbackPauseSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

// POST /api/anti-pirate/playback/pause - Pause playback session
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
    const { sessionId, pausedTime, reason } = playbackPauseSchema.parse(body)

    // Find the playback session
    const playbackSession = await db.playbackSession.findUnique({
      where: { id: sessionId }
    })

    if (!playbackSession) {
      return NextResponse.json(
        { error: 'Playback session not found' },
        { status: 404 }
      )
    }

    // Check if user owns this session
    if (playbackSession.userId !== sessionUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update the session with pause information
    const updatedSession = await db.playbackSession.update({
      where: { id: sessionId },
      data: {
        pausedTime: new Date(pausedTime),
        endTime: new Date(pausedTime),
        isActive: false,
        metadata: {
          previous: playbackSession.metadata as any,
          pauseReason: reason || 'user_pause',
          pausedAt: new Date(pausedTime).toISOString()
        } as any
      }
    })

    // Calculate listening duration
    const duration = pausedTime - playbackSession.startTime.getTime()
    const durationMinutes = Math.floor(duration / (1000 * 60))

    // If user listened for more than 30 seconds, count as a completed listen
    if (duration > 30000) {
      // Update track play count
      await db.track.update({
        where: { id: playbackSession.trackId },
        data: { playCount: { increment: 1 } }
      })

      // Award listening reward
      await db.reward.create({
        data: {
          userId: sessionUser.id,
          type: 'LISTENING',
          amount: 1,
          reason: `Completed listen (${durationMinutes} minutes)`
        }
      })
    }

    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        trackId: updatedSession.trackId,
        startTime: updatedSession.startTime.getTime(),
        pausedTime: updatedSession.pausedTime?.getTime(),
        endTime: updatedSession.endTime?.getTime(),
        duration: duration,
        durationMinutes: durationMinutes,
        isActive: updatedSession.isActive,
        metadata: updatedSession.metadata
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}
