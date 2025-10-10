interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// In-memory rate limiter для development
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMITS = {
  auth: { requests: 5, window: 60000 }, // 5 req/min
  tracks: { requests: 30, window: 60000 }, // 30 req/min
  upload: { requests: 3, window: 60000 }, // 3 req/min
  nft: { requests: 10, window: 60000 }, // 10 req/min
  general: { requests: 100, window: 60000 }, // 100 req/min
}

export async function checkRateLimit(
  identifier: string,
  endpoint: string = 'general'
): Promise<RateLimitResult> {
  const limit = RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS] || RATE_LIMITS.general
  const now = Date.now()
  const key = `${endpoint}:${identifier}`
  
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    // Reset or first request
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + limit.window
    })
    
    return {
      success: true,
      limit: limit.requests,
      remaining: limit.requests - 1,
      reset: now + limit.window
    }
  }
  
  if (current.count >= limit.requests) {
    return {
      success: false,
      limit: limit.requests,
      remaining: 0,
      reset: current.resetTime
    }
  }
  
  current.count++
  rateLimitStore.set(key, current)
  
  return {
    success: true,
    limit: limit.requests,
    remaining: limit.requests - current.count,
    reset: current.resetTime
  }
}