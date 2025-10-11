import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for creating/updating NFTs
const nftSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  artistName: z.string().min(1).max(50),
  genre: z.string().min(1).max(30),
  imageUrl: z.string().min(1),
  audioUrl: z.string().min(1),
  metadata: z.object({}).optional(),
  price: z.number().min(0).optional(),
  royaltyPercentage: z.number().min(0).max(100).default(10),
  supply: z.number().min(1).default(1),
  isExplicit: z.boolean().default(false),
  isPublished: z.boolean().default(false),
})

// GET /api/nft - Get all NFTs (with pagination and filtering)
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
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined

    const skip = (page - 1) * limit

    const where: any = {
      AND: [
        search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { artistName: { contains: search, mode: 'insensitive' as const } },
          ]
        } : {},
        genre ? { genre: { contains: genre, mode: 'insensitive' as const } } : {},
        artistId ? { artistId: artistId } : {},
        minPrice ? { price: { gte: minPrice } } : {},
        maxPrice ? { price: { lte: maxPrice } } : {},
        { isPublished: true }
      ]
    }

    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    const [nfts, total] = await Promise.all([
      db.nft.findMany({
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
              owners: true,
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.nft.count({ where })
    ])

    return NextResponse.json({
      nfts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching NFTs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NFTs' },
      { status: 500 }
    )
  }
}

// POST /api/nft - Create a new NFT
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = nftSchema.parse(body)

    // For now, use a default artist ID - in real app this would come from auth context
    const defaultArtistId = 'default-artist-id'
    
    // Apply deflationary model for NFT creation reward (2% burn)
    const burnAmount = Math.floor(50 * 0.02) // 2% burn
    const rewardAmount = 50 - burnAmount

    const nft = await db.nft.create({
      data: {
        ...validatedData,
        artistId: defaultArtistId,
        mintedAt: new Date(),
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

    // Award NFT creation reward to artist
    await db.reward.create({
      data: {
        userId: defaultArtistId,
        type: 'NFT',
        amount: rewardAmount, // $NDT tokens for NFT creation with deflation
        reason: `NFT creation reward: ${nft.title}`
      }
    })

    // Update user balance
    await db.user.update({
      where: { id: defaultArtistId },
      data: { balance: { increment: rewardAmount } }
    })

    return NextResponse.json(nft, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating NFT:', error)
    return NextResponse.json(
      { error: 'Failed to create NFT' },
      { status: 500 }
    )
  }
}