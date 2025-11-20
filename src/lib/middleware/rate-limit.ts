// Rate limiting middleware for NORMAL DANCE API
// Implements multiple tiers of rate limiting based on endpoint sensitivity

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Initialize Redis connection
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limit configurations for different endpoint types
const rateLimits = {
  // Authentication endpoints - strict limits
  auth: {
    window: "15m",
    max: 5, // 5 attempts per 15 minutes
    identifier: "auth",
  },

  // API endpoints - moderate limits
  api: {
    window: "1m",
    max: 60, // 60 requests per minute
    identifier: "api",
  },

  // File upload endpoints - restrictive
  upload: {
    window: "1h",
    max: 10, // 10 uploads per hour
    identifier: "upload",
  },

  // NFT operations - moderate limits
  nft: {
    window: "1m",
    max: 30, // 30 NFT operations per minute
    identifier: "nft",
  },

  // WebSocket connections - high limits for real-time features
  websocket: {
    window: "1m",
    max: 120, // 120 connections per minute
    identifier: "ws",
  },

  // General endpoints - generous limits
  general: {
    window: "1m",
    max: 120, // 120 requests per minute
    identifier: "general",
  },
};

// Initialize rate limiters with Redis
const rateLimiters = new Map<string, Ratelimit>();

// Create rate limiter instances
Object.entries(rateLimits).forEach(([key, config]) => {
  rateLimiters.set(
    key,
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.max, config.window as any),
      analytics: true,
      prefix: `ratelimit:${config.identifier}`,
    })
  );
});

// Get client identifier (IP + User ID if authenticated)
function getClientIdentifier(request: any): string {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // In production, you might want to include user ID for authenticated requests
  // const userId = await getUserIdFromToken(request);
  // return userId ? `${userId}:${ip}` : ip;

  return ip;
}

// Determine rate limit tier based on pathname
function getRateLimitTier(pathname: string): keyof typeof rateLimits {
  if (pathname.startsWith("/api/auth/")) return "auth";
  if (pathname.startsWith("/api/upload/")) return "upload";
  if (pathname.startsWith("/api/nft/")) return "nft";
  if (pathname.startsWith("/api/socketio")) return "websocket";
  if (pathname.startsWith("/api/")) return "api";
  return "general";
}

// Rate limiting middleware
export async function rateLimitMiddleware(
  request: any
): Promise<NextResponse | null> {
  try {
    const pathname = request.nextUrl.pathname;
    const clientId = getClientIdentifier(request);
    const tier = getRateLimitTier(pathname);

    const limiter = rateLimiters.get(tier);
    if (!limiter) {
      console.warn(`No rate limiter found for tier: ${tier}`);
      return null;
    }

    const { success, limit, reset, remaining } = await limiter.limit(clientId);

    // Add rate limit headers to response
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());

    if (!success) {
      // Rate limit exceeded
      const resetTime = new Date(reset).toISOString();

      return new NextResponse(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: `Too many requests. Try again after ${resetTime}`,
          retryAfter: reset,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": reset.toString(),
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }

    return response;
  } catch (error) {
    console.error("Rate limiting error:", error);
    // Don't block requests if rate limiting fails
    return null;
  }
}

// Export for use in API routes
export { getClientIdentifier, getRateLimitTier, rateLimits };
