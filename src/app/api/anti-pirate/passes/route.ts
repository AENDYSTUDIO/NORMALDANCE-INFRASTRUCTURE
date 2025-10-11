import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions, getSessionUser } from '@/lib/auth'

// GET /api/anti-pirate/passes - Get user's NFT passes
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = getSessionUser(session)
    
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()

    // Get all passes for the user
    const passes = await db.nFTPass.findMany({
      where: {
        userId: sessionUser.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter active passes (not expired)
    const activePasses = passes.filter(pass => 
      pass.isActive && (!pass.expiresAt || pass.expiresAt > now)
    )

    // Format passes for response
    const formattedPasses = passes.map(pass => ({
      id: pass.id,
      type: pass.type,
      name: pass.name,
      price: pass.price,
      duration: pass.duration,
      description: pass.description,
      benefits: pass.benefits,
      icon: pass.icon,
      color: pass.color,
      isActive: pass.isActive && (!pass.expiresAt || pass.expiresAt > now),
      expiresAt: pass.expiresAt?.getTime(),
      createdAt: pass.createdAt.getTime(),
      metadata: pass.metadata
    }))

    return NextResponse.json({
      success: true,
      passes: formattedPasses,
      activePasses: formattedPasses.filter(pass => pass.isActive)
    })

  } catch (error) {
    console.error('Error getting NFT passes:', error)
    return NextResponse.json(
      { error: 'Failed to get NFT passes' },
      { status: 500 }
    )
  }
}

// POST /api/anti-pirate/passes - Create new NFT pass
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = getSessionUser(session)
    
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, name, price, duration, description, benefits, icon, color, metadata } = body

    if (!type || !name || !price || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate pass type
    const validTypes = ['day', 'track', 'club', 'genre', 'olympic']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid pass type' },
        { status: 400 }
      )
    }

    // Create NFT pass
    const pass = await db.nFTPass.create({
      data: {
        userId: sessionUser.id,
        type,
        name,
        price,
        duration,
        description: description || '',
        benefits: benefits || [],
        icon: icon || '🎵',
        color: color || 'text-blue-400',
        isActive: true,
        expiresAt: new Date(Date.now() + duration * 60 * 60 * 1000),
        metadata: metadata || {}
      }
    })

    return NextResponse.json({
      success: true,
      pass: {
        id: pass.id,
        type: pass.type,
        name: pass.name,
        price: pass.price,
        duration: pass.duration,
        description: pass.description,
        benefits: pass.benefits,
        icon: pass.icon,
        color: pass.color,
        isActive: pass.isActive,
        expiresAt: pass.expiresAt?.getTime(),
        createdAt: pass.createdAt.getTime(),
        metadata: pass.metadata
      }
    })

  } catch (error) {
    console.error('Error creating NFT pass:', error)
    return NextResponse.json(
      { error: 'Failed to create NFT pass' },
      { status: 500 }
    )
  }
}
