import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { musicAnalyticsSystem } from '@/lib/music-analytics'
import { musicAnalyticsGetSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

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

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const { timeframe, genre, artistId } = musicAnalyticsGetSchema.parse(query)

    // Получаем все музыкальные данные
    const [
      marketData,
      topTracks,
      topArtists,
      genreAnalytics,
      predictions,
      platformStats
    ] = await Promise.all([
      musicAnalyticsSystem.getMarketData(timeframe), // Pass timeframe
      musicAnalyticsSystem.getTopTracks(10, genre, artistId), // Pass genre and artistId
      musicAnalyticsSystem.getTopArtists(10, genre), // Pass genre
      musicAnalyticsSystem.getGenreAnalytics(timeframe), // Pass timeframe
      musicAnalyticsSystem.getPredictions(timeframe), // Pass timeframe
      musicAnalyticsSystem.getPlatformStats(timeframe) // Pass timeframe
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
    return handleApiError(error)
  }
}
