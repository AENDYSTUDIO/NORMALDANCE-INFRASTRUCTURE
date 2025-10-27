import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userSchema, userQuerySchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

// GET /api/users - Get all users (with pagination)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const { page, limit, search, artist: isArtist } = userQuerySchema.parse(query)

    const skip = (page - 1) * limit

    const where = {
      AND: [
        search ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { displayName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ]
<<<<<<< HEAD
        } : Record<string, unknown>,
        isArtist !== null ? { isArtist } : Record<string, unknown>,
=======
        } : {},
        isArtist !== undefined ? { isArtist } : {},
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
        { isActive: true }
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
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
          _count: {
            select: {
              tracks: true,
              followers: true,
              following: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = userSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      )
    }

    const user = await db.user.create({
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
        createdAt: true,
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}