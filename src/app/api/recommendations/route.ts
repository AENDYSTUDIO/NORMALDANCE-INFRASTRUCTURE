import { NextRequest, NextResponse } from 'next/server';
import { getAIRecommendationEngine } from '@/lib/ai-recommendations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, count = 10, type = 'all', filters, exclude } = body as {
      userId?: string;
      count?: number;
      type?: 'personal' | 'trending' | 'discovery' | 'social' | 'all';
      filters?: {
        genre?: string[];
        artist?: string[];
        minRating?: number;
        minDuration?: number;
        maxDuration?: number;
      };
      exclude?: {
        liked?: boolean;
        skipped?: boolean;
      };
    };

    if (!userId) {
      return new Response(JSON.stringify({
        error: 'userId is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const engine = getAIRecommendationEngine();
    const recommendations = await engine.getRecommendations(userId, {
      count,
      type,
      filters,
      exclude,
    });

    // Track recommendation for analytics
    if (recommendations.length > 0) {
      // Implementation would log to analytics service
      console.log(`Generated ${recommendations.length} recommendations for user ${userId}`);
    }

    return new Response(JSON.stringify({
      success: true,
      data: recommendations.map(rec => ({
        id: rec.track.id,
        title: rec.track.title,
        artist: rec.track.artist,
        genre: rec.track.genre,
        subgenre: rec.track.subgenre,
        duration: rec.track.duration,
        score: Math.round(rec.score * 100) / 100,
        confidence: Math.round(rec.confidence * 100),
        type: rec.type,
        explanations: rec.explanations,
        audioFeatures: rec.track.audioFeatures,
        socialFeatures: rec.track.socialFeatures,
      })),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate recommendations',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(req: NextRequest, res: NextResponse) {
  const { search } = req.query as { search?: string };

  if (!search) {
    return new Response(JSON.stringify({
      error: 'Search query is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Implementation would search tracks
    const results = []; // Search implementation would go here

    return new Response(JSON.stringify({
      success: true,
      data: results,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({
      error: 'Search failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
