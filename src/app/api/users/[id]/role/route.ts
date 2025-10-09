import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    // Только администраторы могут изменять роли
    if ((session?.user as any)?.level !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await request.json()
    
    // Валидация роли
    const validRoles = ['LISTENER', 'ARTIST', 'CURATOR', 'ADMIN']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Обновляем роль пользователя
    const updatedUser = await db.user.update({
      where: { id },
      data: { level: role }
    })

    return NextResponse.json({
      message: 'User role updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        level: updatedUser.level
      }
    })

  } catch (error) {
    console.error('Role update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    // Только администраторы могут просматривать роли
    if ((session?.user as any)?.level !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        level: true,
        isArtist: true,
        wallet: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error('Role fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}