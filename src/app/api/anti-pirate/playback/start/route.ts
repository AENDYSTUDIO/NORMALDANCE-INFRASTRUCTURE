import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions, getSessionUser } from '@/lib/auth'

// POST /api/anti-pirate/playback/start - Start playback session
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
    const { trackId, deviceId, walletAddress, isBackground, isOffline } = body

    if (!trackId || !deviceId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user has active passes
    const now = new Date()
    const activePasses = await db.nFTPass.findMany({
      where: {
        userId: sessionUser.id,
        isActive: true,
        expiresAt: {
          gt: now
        }
      }
    })

    // Check if user has used 7 free tracks in the last 24 hours
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const freeTracksUsed = await db.playbackSession.count({
      where: {
        deviceId,
        walletAddress,
        isFree: true,
        startTime: {
          gte: twentyFourHoursAgo
        }
      }
    })

    const isFree = freeTracksUsed < 7
    const hasLicense = activePasses.length > 0

    // If user is trying to play in background without license, deny
    if (isBackground && !hasLicense) {
      return NextResponse.json(
        { error: 'Background playback requires NFT pass' },
        { status: 403 }
      )
    }

    // If user is trying to play offline without license, deny
    if (isOffline && !hasLicense) {
      return NextResponse.json(
        { error: 'Offline playback requires NFT pass' },
        { status: 403 }
      )
    }

    // Create playback session
    const playbackSession = await db.playbackSession.create({
      data: {
        userId: sessionUser.id,
        trackId,
        deviceId,
        walletAddress,
        startTime: now,
        isFree,
        isBackground: isBackground || false,
        isOffline: isOffline || false,
        hasLicense,
        metadata: {
          activePasses: activePasses.map(pass => ({
            id: pass.id,
            type: pass.type,
            name: pass.name
          }))
        }
      }
    })

    // If this is a free track, increment the counter
    if (isFree) {
      // Update track play count
      await db.track.update({
        where: { id: trackId },
        data: { playCount: { increment: 1 } }
      })

      // Award listening reward
      await db.reward.create({
        data: {
          userId: sessionUser.id,
          type: 'LISTENING',
          amount: 1,
          reason: 'Free track listening reward'
        }
      })
    }

    return NextResponse.json({
      success: true,
      session: {
        id: playbackSession.id,
        trackId: playbackSession.trackId,
        startTime: playbackSession.startTime.getTime(),
        isFree: playbackSession.isFree,
        isBackground: playbackSession.isBackground,
        isOffline: playbackSession.isOffline,
        hasLicense: playbackSession.hasLicense,
        metadata: playbackSession.metadata
      }
    })

  } catch (error) {
    console.error('Error starting playback session:', error)
    return NextResponse.json(
      { error: 'Failed to start playback session' },
      { status: 500 }
    )
  }
}
