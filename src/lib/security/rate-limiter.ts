/**
 * Rate Limiting Implementation
 * Prevents abuse and DDoS attacks
 */

import type { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

<<<<<<< HEAD
// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Every minute

/**
 * Check if an action is rate limited
 * @param key Unique identifier for the rate limit (e.g. IP address, user ID)
 * @param maxActions Maximum number of actions allowed in the time window
 * @param windowMs Time window in milliseconds
 * @returns true if the action is rate limited, false otherwise
 */
export function isRateLimited(key: string, maxActions: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  // If no entry exists or the window has expired, create a new one
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return false;
  }
  
  // If we're at the limit, return true (rate limited)
  if (entry.count >= maxActions) {
    return true;
  }
  
  // Otherwise, increment the count and return false (not rate limited)
  rateLimitStore.set(key, {
    count: entry.count + 1,
    resetTime: entry.resetTime
  });
  return false;
}

=======
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  private getKey(req: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }
    
    // Default: use IP address
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
    return ip;
  }

  check(req: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    const key = this.getKey(req);
    const now = Date.now();
    const resetTime = now + this.config.windowMs;

    let entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetTime
      };
      this.store.set(key, entry);
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime
      };
    }

    entry.count++;
    
    if (entry.count > this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }
}

// Pre-configured rate limiters
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 requests per 15 minutes
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5 // 5 auth attempts per 15 minutes
});

export const uploadRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10 // 10 uploads per hour
});

// Middleware function for Next.js API routes
export function withRateLimit(limiter: RateLimiter) {
  return (handler: (...args: unknown[]) => unknown) => {
    return async (req: NextRequest, ...args: unknown[]) => {
      const result = limiter.check(req);
      
      if (!result.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            resetTime: result.resetTime
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': limiter.config.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
            }
          }
        );
      }

      // Add rate limit headers to successful responses
      const response = await handler(req, ...args);
      
      if (response instanceof Response) {
        response.headers.set('X-RateLimit-Limit', limiter.config.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
      }

      return response;
    };
  };
}