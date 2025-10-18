import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for creating/updating users
const userSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  banner: z.string().optional(),
  wallet: z.string().optional(),
  isArtist: z.boolean().default(false),
})

// GET /api/users - Get all users (with pagination)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const isArtist = searchParams.get('artist') === 'true'

    const skip = (page - 1) * limit

    const where = {
      AND: [
        search ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { displayName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ]
        } : Record<string, unknown>,
        isArtist !== null ? { isArtist } : Record<string, unknown>,
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
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}