import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { advancedAnalyticsSystem } from '@/lib/advanced-analytics'
import { volatilityProtectionSystem } from '@/lib/volatility-protection'
import { smartLimitOrderSystem } from '@/lib/smart-limit-orders'

// GET /api/analytics/dashboard - Get comprehensive dashboard data
export async function GET() {
  try {
    const session = (await getServerSession(authOptions as any)) as any
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Получаем данные от всех систем
    const [
      analyticsData,
      protectionStats,
      orderStats
    ] = await Promise.all([
      advancedAnalyticsSystem.getFullAnalytics(),
      volatilityProtectionSystem.getProtectionStats(),
      smartLimitOrderSystem.getOrderStats(session.user.id)
    ])

    // Формируем полный ответ dashboard
    const dashboardData = {
      // Основные аналитические данные
      market: analyticsData.market,
      liquidity: analyticsData.liquidity,
      trading: analyticsData.trading,
      risk: analyticsData.risk,
      predictions: analyticsData.predictions,
      arbitrage: analyticsData.arbitrage,
      
      // Данные защиты от волатильности
      protection: {
        stabilityReserve: protectionStats.stabilityReserve,
        mechanisms: protectionStats.mechanisms,
        interventions: protectionStats.interventions,
        currentMetrics: protectionStats.currentMetrics
      },
      
      // Данные умных ордеров
      orders: {
        stats: orderStats,
        userOrders: smartLimitOrderSystem.getUserOrders(session.user.id)
      },
      
      // ИИ-рекомендации
      recommendations: advancedAnalyticsSystem.getOptimizationRecommendations(),
      
      // Метаданные
      timestamp: Date.now(),
      version: '2025.1.0',
      features: [
        'hybrid_amm',
        'volatility_protection',
        'smart_limit_orders',
        'ml_predictions',
        'advanced_analytics'
      ]
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
