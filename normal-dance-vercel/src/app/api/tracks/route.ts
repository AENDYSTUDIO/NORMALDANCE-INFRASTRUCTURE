import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const genre = searchParams.get('genre')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let whereClause: any = {}
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { artist: { name: { contains: search, mode: 'insensitive' } } },
        { album: { title: { contains: search, mode: 'insensitive' } } }
      ]
    }
    
    if (genre) {
      whereClause.genre = { contains: genre, mode: 'insensitive' }
    }

    const tracks = await db.track.findMany({
      where: whereClause,
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            avatar: true,
            verified: true
          }
        },
        album: {
          select: {
            id: true,
            title: true,
            coverUrl: true
          }
        }
      },
      orderBy: [
        { playCount: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    const total = await db.track.count({ where: whereClause })

    return NextResponse.json({
      tracks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, duration, audioUrl, coverUrl, genre, artistId, albumId } = body

    if (!title || !duration || !audioUrl || !artistId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, duration, audioUrl, artistId' },
        { status: 400 }
      )
    }

    // Verify artist exists
    const artist = await db.artist.findUnique({
      where: { id: artistId }
    })

    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      )
    }

    // If albumId is provided, verify it exists
    if (albumId) {
      const album = await db.album.findUnique({
        where: { id: albumId }
      })

      if (!album) {
        return NextResponse.json(
          { error: 'Album not found' },
          { status: 404 }
        )
      }
    }

    const track = await db.track.create({
      data: {
        title,
        duration,
        audioUrl,
        coverUrl,
        genre,
        artistId,
        albumId
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            avatar: true,
            verified: true
          }
        },
        album: {
          select: {
            id: true,
            title: true,
            coverUrl: true
          }
        }
      }
    })

    return NextResponse.json(track, { status: 201 })
  } catch (error) {
    console.error('Error creating track:', error)
    return NextResponse.json(
      { error: 'Failed to create track' },
      { status: 500 }
    )
  }
}