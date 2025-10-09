import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const blockchain = searchParams.get('blockchain')
    const owner = searchParams.get('owner')

    const nfts = await db.nft.findMany({
      where: {
        ...(blockchain && blockchain !== 'all' && { blockchain }),
        ...(owner && { ownerAddress: owner })
      },
      include: {
        track: {
          include: {
            artist: true
          }
        },
        purchases: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(nfts)
  } catch (error) {
    console.error('Error fetching NFTs:', error)
    return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackId, blockchain, mintAddress, ownerAddress, price, currency, metadata } = body

    if (!trackId || !blockchain || !mintAddress || !ownerAddress || !price || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const nft = await db.nft.create({
      data: {
        trackId,
        blockchain,
        mintAddress,
        ownerAddress,
        price: parseFloat(price),
        currency,
        metadata
      },
      include: {
        track: {
          include: {
            artist: true
          }
        }
      }
    })

    // Update track as minted
    await db.track.update({
      where: { id: trackId },
      data: { isMinted: true, mintAddress }
    })

    return NextResponse.json(nft, { status: 201 })
  } catch (error) {
    console.error('Error creating NFT:', error)
    return NextResponse.json({ error: 'Failed to create NFT' }, { status: 500 })
  }
}