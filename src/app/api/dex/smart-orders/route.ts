import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { smartLimitOrderSystem } from '@/lib/smart-limit-orders'

// POST /api/dex/smart-orders - Create smart limit order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      type,
      from,
      to,
      amount,
      targetRate,
      triggerCondition,
      executionType,
      timeDecay = false,
      expiresAt,
      aiOptimization = {
        enabled: true,
        riskTolerance: 'medium',
        marketAnalysis: true,
        gasOptimization: true,
        slippageProtection: true,
        dynamicAdjustment: true
      }
    } = body

    // Validate required fields
    if (!type || !from || !to || !amount || !targetRate || !triggerCondition || !executionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create smart limit order
    const order = await smartLimitOrderSystem.createOrder({
      userId: session.user.id,
      type,
      from,
      to,
      amount: parseFloat(amount),
      targetRate: parseFloat(targetRate),
      triggerCondition,
      executionType,
      timeDecay,
      expiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined,
      aiOptimization,
      status: 'pending'
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        type: order.type,
        from: order.from,
        to: order.to,
        amount: order.amount,
        targetRate: order.targetRate,
        triggerCondition: order.triggerCondition,
        executionType: order.executionType,
        timeDecay: order.timeDecay,
        status: order.status,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt,
        aiOptimization: order.aiOptimization
      }
    })

  } catch (error) {
    console.error('Error creating smart limit order:', error)
    return NextResponse.json(
      { error: 'Failed to create smart limit order' },
      { status: 500 }
    )
  }
}

// GET /api/dex/smart-orders - Get user's smart limit orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // Get user orders
    let orders = smartLimitOrderSystem.getUserOrders(session.user.id)

    // Filter by status if provided
    if (status) {
      orders = orders.filter(order => order.status === status)
    }

    // Filter by type if provided
    if (type) {
      orders = orders.filter(order => order.type === type)
    }

    // Get order statistics
    const stats = smartLimitOrderSystem.getOrderStats(session.user.id)

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        id: order.id,
        type: order.type,
        from: order.from,
        to: order.to,
        amount: order.amount,
        targetRate: order.targetRate,
        triggerCondition: order.triggerCondition,
        executionType: order.executionType,
        timeDecay: order.timeDecay,
        status: order.status,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt,
        executedAt: order.executedAt,
        partialExecutions: order.partialExecutions,
        aiOptimization: order.aiOptimization
      })),
      stats
    })

  } catch (error) {
    console.error('Error fetching smart limit orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch smart limit orders' },
      { status: 500 }
    )
  }
}

// DELETE /api/dex/smart-orders - Cancel smart limit order
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Cancel the order
    const success = await smartLimitOrderSystem.cancelOrder(orderId, session.user.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cancel order or order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully'
    })

  } catch (error) {
    console.error('Error cancelling smart limit order:', error)
    return NextResponse.json(
      { error: 'Failed to cancel smart limit order' },
      { status: 500 }
    )
  }
}
