import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions, getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { userRoleSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const sessionUser = getSessionUser(session)

    // Только администраторы могут изменять роли
    if (sessionUser?.level !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { role } = userRoleSchema.parse(body)

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
    return handleApiError(error)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const sessionUser = getSessionUser(session)

    // Только администраторы могут просматривать роли
    if (sessionUser?.level !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetUser = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        level: true,
        isArtist: true,
        wallet: true
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user: targetUser })

  } catch (error) {
    return handleApiError(error)
  }
}