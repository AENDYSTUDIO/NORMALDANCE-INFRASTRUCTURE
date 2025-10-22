import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userUpdateSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

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
    return handleApiError(error)
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
    const validatedData = userUpdateSchema.parse(body)

    const user = await db.user.update({
      where: { id },
      data: validatedData,
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
    return handleApiError(error)
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
    return handleApiError(error)
  }
}