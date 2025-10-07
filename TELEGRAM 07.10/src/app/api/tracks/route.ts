import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const genre = searchParams.get('genre')
    const blockchain = searchParams.get('blockchain')
    const artist = searchParams.get('artist')

    const tracks = await db.track.findMany({
      where: {
        ...(genre && genre !== 'all' && { genre }),
        ...(blockchain && blockchain !== 'all' && { currency: blockchain === 'solana' ? 'SOL' : 'TON' }),
        ...(artist && { artist: { contains: artist, mode: 'insensitive' } })
      },
      include: {
        artist: true,
        nfts: true,
        purchases: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(tracks)
  } catch (error) {
    console.error('Error fetching tracks:', error)
    return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, genre, description, price, currency, artistId, audioUrl, coverArt, ipfsHash } = body

    if (!title || !genre || !price || !artistId || !audioUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const track = await db.track.create({
      data: {
        title,
        genre,
        description,
        price: parseFloat(price),
        currency,
        artistId,
        audioUrl,
        coverArt,
        ipfsHash
      },
      include: {
        artist: true
      }
    })

    return NextResponse.json(track, { status: 201 })
  } catch (error) {
    console.error('Error creating track:', error)
    return NextResponse.json({ error: 'Failed to create track' }, { status: 500 })
  }
}