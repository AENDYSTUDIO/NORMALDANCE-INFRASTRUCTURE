import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create a global instance of Redis client
const redis = Redis.fromEnv();

// Create rate limiters for different endpoints
const rateLimiters = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute for auth
    analytics: true,
  }),
  tracks: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute for tracks
    analytics: true,
  }),
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 m'), // 3 requests per minute for upload
    analytics: true,
  }),
  nft: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute for NFT
    analytics: true,
 }),
  general: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds for general endpoints
    analytics: true,
  }),
};

// Function to check rate limit for a given identifier
export async function checkRateLimit(identifier: string, endpoint: string = 'general') {
  let limiter = rateLimiters.general;
  
  switch (endpoint) {
    case 'auth':
      limiter = rateLimiters.auth;
      break;
    case 'tracks':
      limiter = rateLimiters.tracks;
      break;
    case 'upload':
      limiter = rateLimiters.upload;
      break;
    case 'nft':
      limiter = rateLimiters.nft;
      break;
    default:
      limiter = rateLimiters.general;
  }

  const result = await limiter.limit(`${endpoint}_${identifier}`);
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export { rateLimiters };
