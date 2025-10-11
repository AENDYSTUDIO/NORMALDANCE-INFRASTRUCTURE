import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions, getSessionUser } from '@/lib/auth'

// POST /api/unified/balance - Update user balance
export async function POST(request: NextRequest) {
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
    const { currency, amount, operation = 'set' } = body

    if (!currency || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['NDT', 'TON'].includes(currency)) {
      return NextResponse.json(
        { error: 'Invalid currency' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: { 
        balance: true, 
        tonBalance: true 
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let newBalance: number
    const currentBalance = currency === 'NDT' ? user.balance : user.tonBalance

    switch (operation) {
      case 'set':
        newBalance = amount
        break
      case 'add':
        newBalance = currentBalance + amount
        break
      case 'subtract':
        newBalance = currentBalance - amount
        if (newBalance < 0) {
          return NextResponse.json(
            { error: 'Insufficient balance' },
            { status: 400 }
          )
        }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        )
    }

    // Update user balance
    const updateData = currency === 'NDT' 
      ? { balance: newBalance }
      : { tonBalance: newBalance }

    const updatedUser = await db.user.update({
      where: { id: sessionUser.id },
      data: updateData
    })

    // Create balance change record
    await db.balanceChange.create({
      data: {
        userId: sessionUser.id,
        currency,
        amount: newBalance - currentBalance,
        operation,
        previousBalance: currentBalance,
        newBalance,
        reason: 'Manual balance update'
      }
    })

    return NextResponse.json({
      success: true,
      balance: {
        currency,
        amount: newBalance,
        previousAmount: currentBalance,
        change: newBalance - currentBalance
      }
    })

  } catch (error) {
    console.error('Error updating balance:', error)
    return NextResponse.json(
      { error: 'Failed to update balance' },
      { status: 500 }
    )
  }
}

// GET /api/unified/balance - Get user balance
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = getSessionUser(session)
    
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: { 
        balance: true, 
        tonBalance: true 
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      balance: {
        NDT: user.balance,
        TON: user.tonBalance || 0
      }
    })

  } catch (error) {
    console.error('Error getting balance:', error)
    return NextResponse.json(
      { error: 'Failed to get balance' },
      { status: 500 }
    )
  }
}
