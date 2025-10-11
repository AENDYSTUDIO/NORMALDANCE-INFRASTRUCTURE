import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdmin } from '@/lib/rbac'

// GET /api/nft/[id] - Get a specific NFT
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const nft = await db.nft.findUnique({
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
            owners: true,
          }
        }
      }
    })

    if (!nft) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(nft)
  } catch (error) {
    console.error('Error fetching NFT:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NFT' },
      { status: 500 }
    )
  }
}

// PUT /api/nft/[id] - Update an NFT
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
    
    // Only allow updating certain fields
    const updateData = {
      ...(body.title && { title: body.title }),
      ...(body.description && { description: body.description }),
      ...(body.artistName && { artistName: body.artistName }),
      ...(body.genre && { genre: body.genre }),
      ...(body.imageUrl && { imageUrl: body.imageUrl }),
      ...(body.audioUrl && { audioUrl: body.audioUrl }),
      ...(body.metadata !== undefined && { metadata: body.metadata }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.royaltyPercentage !== undefined && { royaltyPercentage: body.royaltyPercentage }),
      ...(body.supply !== undefined && { supply: body.supply }),
      ...(body.isExplicit !== undefined && { isExplicit: body.isExplicit }),
      ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
    }

    const nft = await db.nft.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(nft)
  } catch (error) {
    console.error('Error updating NFT:', error)
    return NextResponse.json(
      { error: 'Failed to update NFT' },
      { status: 500 }
    )
  }
}

// DELETE /api/nft/[id] - Delete an NFT
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    await db.nft.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'NFT deleted successfully' })
  } catch (error) {
    console.error('Error deleting NFT:', error)
    return NextResponse.json(
      { error: 'Failed to delete NFT' },
      { status: 500 }
    )
  }
}

// POST /api/nft/[id]/purchase - Purchase an NFT
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, price } = body

    // Get the NFT first
    const nft = await db.nft.findUnique({
      where: { id }
    })

    if (!nft) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      )
    }

    if (!nft.isPublished) {
      return NextResponse.json(
        { error: 'NFT is not available for purchase' },
        { status: 400 }
      )
    }

    // Record the purchase (in a real app, this would involve blockchain transaction)
    const purchase = await db.nftPurchase.create({
      data: {
        nftId: id,
        buyerId: userId,
        sellerId: nft.artistId,
        price: price || nft.price || 0,
        purchaseDate: new Date(),
      }
    })

    // Update NFT ownership (in a real app, this would be handled by blockchain)
    await db.nft.update({
      where: { id },
      data: {
        ownerId: userId,
        isPublished: false, // Mark as sold
      }
    })

    // Award purchase rewards
    await db.reward.create({
      data: {
        userId: nft.artistId,
        type: 'NFT_SALE',
        amount: Math.floor((price || nft.price || 0) * 0.1), // 10% royalty
        reason: `NFT sale reward: ${nft.title}`
      }
    })

    // Update buyer balance (deduct purchase price)
    await db.user.update({
      where: { id: userId },
      data: { balance: { decrement: price || nft.price || 0 } }
    })

    // Update seller balance (add purchase price minus royalty)
    await db.user.update({
      where: { id: nft.artistId },
      data: { balance: { increment: Math.floor((price || nft.price || 0) * 0.9) } }
    })

    return NextResponse.json({
      message: 'NFT purchased successfully',
      purchase,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}` // Mock transaction hash
    })
  } catch (error) {
    console.error('Error purchasing NFT:', error)
    return NextResponse.json(
      { error: 'Failed to purchase NFT' },
      { status: 500 }
    )
  }
}