import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatar: true,
        banner: true,
        wallet: true,
        level: true,
        balance: true,
        isArtist: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tracks: true,
            playlists: true,
            followers: true,
            following: true,
            likes: true,
            comments: true,
            rewards: true,
          }
        },
        tracks: {
          select: {
            id: true,
            title: true,
            artistName: true,
            genre: true,
            duration: true,
            playCount: true,
            likeCount: true,
            coverImage: true,
            isPublished: true,
            createdAt: true,
          },
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          take: 6, // Limit to 6 recent tracks
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Only allow updating certain fields
    const updateData = {
      ...(body.displayName && { displayName: body.displayName }),
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.avatar !== undefined && { avatar: body.avatar }),
      ...(body.banner !== undefined && { banner: body.banner }),
      ...(body.wallet !== undefined && { wallet: body.wallet }),
      ...(body.isArtist !== undefined && { isArtist: body.isArtist }),
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatar: true,
        banner: true,
        wallet: true,
        level: true,
        balance: true,
        isArtist: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete a user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.user.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}