import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const blockchain = searchParams.get('blockchain')
    const type = searchParams.get('type')

    const transactions = await db.transaction.findMany({
      where: {
        ...(userId && { userId }),
        ...(blockchain && blockchain !== 'all' && { blockchain }),
        ...(type && type !== 'all' && { type })
      },
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, blockchain, hash, amount, currency, status, metadata } = body

    if (!userId || !type || !blockchain || !hash || !amount || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const transaction = await db.transaction.create({
      data: {
        userId,
        type,
        blockchain,
        hash,
        amount: parseFloat(amount),
        currency,
        status: status || 'PENDING',
        metadata
      },
      include: {
        user: true
      }
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}