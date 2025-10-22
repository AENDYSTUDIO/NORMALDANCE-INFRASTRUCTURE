import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAIRecommendationEngine } from '@/lib/ai-recommendations';
import { recommendationsGetSchema, recommendationsPostSchema } from '@/lib/schemas';
import { handleApiError } from '@/lib/errors/errorHandler';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, count, type, filters, exclude } = recommendationsPostSchema.parse(body);

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
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    const { userId, limit, type } = recommendationsGetSchema.parse(query);

    const engine = getAIRecommendationEngine();
    const recommendations = await engine.getRecommendations(userId, {
      count: limit,
      type,
    });

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
    return handleApiError(error);
  }
}
