import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { musicAnalyticsSystem } from '@/lib/music-analytics'

// GET /api/music/analytics - Get music analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Получаем все музыкальные данные
    const [
      marketData,
      topTracks,
      topArtists,
      genreAnalytics,
      predictions,
      platformStats
    ] = await Promise.all([
      musicAnalyticsSystem.getMarketData(),
      musicAnalyticsSystem.getTopTracks(10),
      musicAnalyticsSystem.getTopArtists(10),
      musicAnalyticsSystem.getGenreAnalytics(),
      musicAnalyticsSystem.getPredictions(),
      musicAnalyticsSystem.getPlatformStats()
    ])

    // Формируем полный ответ
    const musicData = {
      marketData,
      topTracks,
      topArtists,
      genreAnalytics,
      predictions: Object.fromEntries(predictions),
      platformStats,
      timestamp: Date.now(),
      version: '2025.1.0',
      features: [
        'track_analytics',
        'artist_analytics',
        'genre_analytics',
        'nft_pricing',
        'royalty_tracking',
        'ml_predictions'
      ]
    }

    return NextResponse.json(musicData)

  } catch (error) {
    console.error('Error fetching music analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch music analytics' },
      { status: 500 }
    )
  }
}
