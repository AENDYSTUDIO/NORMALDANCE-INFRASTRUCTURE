import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { updateUserLevel } from '@/lib/auth'
import { logger } from '@/lib/utils/logger'

// Validation schema for user registration
const signupSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores'
  }),
  email: z.string().email().optional(),
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  isArtist: z.boolean().default(false),
  artistName: z.string().optional(),
  genre: z.string().optional(),
  wallet: z.string().min(32).max(44), // Solana address validation
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    // Check if username already exists
    const existingUserByUsername = await db.user.findFirst({
      where: { username: validatedData.username }
    })

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Check if wallet already exists
    const existingUserByWallet = await db.user.findFirst({
      where: { wallet: validatedData.wallet }
    })

    if (existingUserByWallet) {
      return NextResponse.json(
        { error: 'Wallet address already registered' },
        { status: 400 }
      )
    }

    // Create user
    const userData: {
      username: string
      wallet: string
      isArtist: boolean
      level: string
      email?: string
      displayName?: string
      bio?: string
      artistName?: string
      genre?: string
    } = {
      username: validatedData.username,
      wallet: validatedData.wallet,
      isArtist: validatedData.isArtist,
      level: 'BRONZE',
    }

    // Add optional fields if provided
    if (validatedData.email) {
      userData.email = validatedData.email
    }

    if (validatedData.displayName) {
      userData.displayName = validatedData.displayName
    }

    if (validatedData.bio) {
      userData.bio = validatedData.bio
    }

    if (validatedData.isArtist) {
      userData.artistName = validatedData.artistName
      userData.genre = validatedData.genre
    }

    const user = await db.user.create({
      data: userData,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        wallet: true,
        isArtist: true,
        level: true,
        bio: true,
        createdAt: true,
      }
    })

    // Award welcome reward
    await db.reward.create({
      data: {
        userId: user.id,
        type: 'DAILY_BONUS',
        amount: 10, // 10 $NDT tokens for signup
        reason: 'Welcome bonus for new user'
      }
    })

    // Update user balance
    await db.user.update({
      where: { id: user.id },
      data: { balance: { increment: 10 } }
    })

    // Update user level based on initial data
    await updateUserLevel(user.id)

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        wallet: user.wallet,
        isArtist: user.isArtist,
        level: user.level,
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('Signup error:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}