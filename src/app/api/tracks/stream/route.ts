<<<<<<< HEAD
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
=======
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
import { db } from '@/lib/db'
import { readFileSync, existsSync, createReadStream } from 'fs'
import { join } from 'path'
import { trackStreamQuerySchema, trackStreamPostSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

// GET /api/tracks/stream - Stream audio track
export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const { id } = trackStreamQuerySchema.parse(query)

    const track = await db.track.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        artistName: true,
        audioUrl: true,
        duration: true,
        genre: true,
      }
    })

    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      )
    }

    // Extract filename from audioUrl
    const audioPath = track.audioUrl.replace('/uploads/audio/', '')
    const fullPath = join(process.cwd(), 'uploads', 'audio', audioPath)

    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'Audio file not found' },
        { status: 404 }
      )
    }

    // Get file stats
    const stats = readFileSync(fullPath, { flag: 'r' })
    const fileSize = stats.length

    // Parse range header for partial content
    const range = request.headers.get('range')
    const start = range ? parseInt(range.replace(/\D/g, '')) : 0
    const end = Math.min(start + 1024 * 1024, fileSize - 1) // 1MB chunks

    const chunkSize = end - start + 1

    // Create read stream for the chunk
    const fileStream = createReadStream(fullPath, { start, end })

    // Set appropriate headers for streaming
    const headers = new Headers()
    headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`)
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Content-Length', chunkSize.toString())
    headers.set('Content-Type', 'audio/mpeg')
    headers.set('Content-Disposition', `inline; filename="${track.title}.mp3"`)

    return new NextResponse(fileStream as any, {
      status: range ? 206 : 200,
      headers,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/tracks/stream - Track play count and user listening
export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json()
    const { id, userId, duration, completed, position } = trackStreamPostSchema.parse(body)

    // Find the track
    const track = await db.track.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        artistId: true,
        playCount: true,
      }
    })

    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      )
    }

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
          position: position || 0,
        }
      })

      // Award listening reward
      if (completed && duration && duration > 30) { // Only reward if listened for more than 30 seconds
        await db.reward.create({
          data: {
            userId,
            type: 'LISTENING',
            amount: 1, // 1 $NDT token per completed listen
            reason: `Listening reward for track ${track.title}`
          }
        })

        // Update user balance
        await db.user.update({
          where: { id: userId },
          data: { balance: { increment: 1 } }
        })
      }
    }

    return NextResponse.json({
      message: 'Play recorded successfully',
      trackId: id,
      playCount: track.playCount + 1,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// HEAD /api/tracks/stream - Get track info without streaming
export async function HEAD(
  request: NextRequest
) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const { id } = trackStreamQuerySchema.parse(query)

    const track = await db.track.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        artistName: true,
        audioUrl: true,
        duration: true,
        genre: true,
      }
    })

    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      )
    }

    // Extract filename from audioUrl
    const audioPath = track.audioUrl.replace('/uploads/audio/', '')
    const fullPath = join(process.cwd(), 'uploads', 'audio', audioPath)

    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'Audio file not found' },
        { status: 404 }
      )
    }

    // Get file stats
    const stats = readFileSync(fullPath, { flag: 'r' })
    const fileSize = stats.length

    const headers = new Headers()
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Content-Length', fileSize.toString())
    headers.set('Content-Type', 'audio/mpeg')
    headers.set('Content-Disposition', `inline; filename="${track.title}.mp3"`)

    return new NextResponse(null, {
      status: 200,
      headers,
    })
  } catch (error) {
    return handleApiError(error)
  }
}