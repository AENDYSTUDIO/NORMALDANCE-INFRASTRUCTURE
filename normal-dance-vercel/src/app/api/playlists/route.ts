import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isPublic = searchParams.get('public')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let whereClause: any = {}
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (isPublic !== null) {
      whereClause.isPublic = isPublic === 'true'
    }

    const playlists = await db.playlist.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        tracks: {
          include: {
            track: {
              include: {
                artist: {
                  select: {
                    id: true,
                    name: true,
                    verified: true
                  }
                }
              }
            }
          },
          orderBy: {
            position: 'asc'
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await db.playlist.count({ where: whereClause })

    return NextResponse.json({
      playlists,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching playlists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, coverUrl, isPublic, ownerId } = body

    if (!name || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, ownerId' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: ownerId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const playlist = await db.playlist.create({
      data: {
        name,
        description,
        coverUrl,
        isPublic: isPublic !== undefined ? isPublic : true,
        ownerId
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json(playlist, { status: 201 })
  } catch (error) {
    console.error('Error creating playlist:', error)
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    )
  }
}