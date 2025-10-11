import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const verified = searchParams.get('verified')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let whereClause: any = {}
    
    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' }
    }
    
    if (verified !== null) {
      whereClause.verified = verified === 'true'
    }

    const artists = await db.artist.findMany({
      where: whereClause,
      include: {
        tracks: {
          select: {
            id: true,
            title: true,
            playCount: true
          },
          orderBy: { playCount: 'desc' },
          take: 5
        },
        albums: {
          select: {
            id: true,
            title: true,
            coverUrl: true
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        _count: {
          select: {
            tracks: true,
            albums: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await db.artist.count({ where: whereClause })

    return NextResponse.json({
      artists,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching artists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch artists' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, bio, avatar, verified } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      )
    }

    const artist = await db.artist.create({
      data: {
        name,
        bio,
        avatar,
        verified: verified || false
      }
    })

    return NextResponse.json(artist, { status: 201 })
  } catch (error) {
    console.error('Error creating artist:', error)
    return NextResponse.json(
      { error: 'Failed to create artist' },
      { status: 500 }
    )
  }
}