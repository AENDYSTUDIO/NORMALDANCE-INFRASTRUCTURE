import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for creating/updating tracks
const trackSchema = z.object({
  title: z.string().min(1).max(100),
  artistName: z.string().min(1).max(50),
  genre: z.string().min(1).max(30),
  duration: z.number().min(1),
  ipfsHash: z.string().min(1),
  metadata: z.object({}).optional(),
  price: z.number().min(0).optional(),
  isExplicit: z.boolean().default(false),
  isPublished: z.boolean().default(false),
})

// GET /api/tracks - Get all tracks (with pagination and filtering)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const genre = searchParams.get('genre') || ''
    const artistId = searchParams.get('artistId') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where = {
      AND: [
        search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { artistName: { contains: search, mode: 'insensitive' as const } },
          ]
        } : {},
        genre ? { genre: { contains: genre, mode: 'insensitive' as const } } : {},
        artistId ? { artistId: artistId } : {},
        { isPublished: true }
      ]
    }

    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    const [tracks, total] = await Promise.all([
      db.track.findMany({
        where,
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
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.track.count({ where })
    ])

    return NextResponse.json({
      tracks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching tracks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    )
  }
}

// POST /api/tracks - Create a new track
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = trackSchema.parse(body)

    // For now, use a default artist ID - in real app this would come from auth context
    const defaultArtistId = 'default-artist-id'

    const track = await db.track.create({
      data: {
        ...validatedData,
        artistId: defaultArtistId,
      },
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

    // Award upload reward to artist
    await db.reward.create({
      data: {
        userId: defaultArtistId,
        type: 'UPLOAD',
        amount: 20, // 20 $NDT tokens for upload
        reason: `Track upload reward: ${track.title}`
      }
    })

    // Update user balance
    await db.user.update({
      where: { id: defaultArtistId },
      data: { balance: { increment: 20 } }
    })

    return NextResponse.json(track, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating track:', error)
    return NextResponse.json(
      { error: 'Failed to create track' },
      { status: 500 }
    )
  }
}