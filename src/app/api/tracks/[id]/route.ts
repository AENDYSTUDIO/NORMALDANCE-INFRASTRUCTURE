import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdmin } from '@/lib/rbac'
import { trackUpdateSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

// GET /api/tracks/[id] - Get a specific track
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const track = await db.track.findUnique({
      where: { id },
      include: {
        artist: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
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

    return NextResponse.json(track)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/tracks/[id] - Update a track
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()
    
    const validatedData = trackUpdateSchema.parse(body)

    const track = await db.track.update({
      where: { id },
      data: validatedData,
      include: {
        artist: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          }
        }
      }
    })

    return NextResponse.json(track)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/tracks/[id] - Delete a track
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    await db.track.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Track deleted successfully' })
  } catch (error) {
    console.error('Error deleting track:', error)
    return NextResponse.json(
      { error: 'Failed to delete track' },
      { status: 500 }
    )
  }
}

// POST /api/tracks/[id]/play - Record a play
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, duration, completed } = body

    // Increment play count
    await db.track.update({
      where: { id },
      data: { playCount: { increment: 1 } }
    })

    // Record play history if user is provided
    if (userId) {
      await db.playHistory.create({
        data: {
          userId,
          trackId: id,
          duration: duration || 0,
          completed: completed || false,
        }
      })

      // Award listening reward
      if (completed && duration > 30) {
        await db.reward.create({
          data: {
            userId,
            type: 'LISTENING',
            amount: 1,
            reason: `Listening reward for track ${id}`
          }
        })

        await db.user.update({
          where: { id: userId },
          data: { balance: { increment: 1 } }
        })
      }
    }

    return NextResponse.json({ message: 'Play recorded successfully' })
  } catch (error) {
    console.error('Error recording play:', error)
    return NextResponse.json(
      { error: 'Failed to record play' },
      { status: 500 }
    )
  }
}