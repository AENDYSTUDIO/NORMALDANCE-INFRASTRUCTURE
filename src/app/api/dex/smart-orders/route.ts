import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { smartLimitOrderSystem } from '@/lib/smart-limit-orders'
import { dexSmartOrdersPostSchema, dexSmartOrdersGetSchema, dexSmartOrdersDeleteSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

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
      timeDecay,
      expiresAt,
      aiOptimization
    } = dexSmartOrdersPostSchema.parse(body)

    // Create smart limit order
    const order = await smartLimitOrderSystem.createOrder({
      userId: session.user.id,
      type,
      from,
      to,
      amount,
      targetRate,
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
    return handleApiError(error)
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
    const query = Object.fromEntries(searchParams.entries())
    const { status, type } = dexSmartOrdersGetSchema.parse(query)

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
    return handleApiError(error)
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
    const query = Object.fromEntries(searchParams.entries())
    const { orderId } = dexSmartOrdersDeleteSchema.parse(query)

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
    return handleApiError(error)
  }
}
