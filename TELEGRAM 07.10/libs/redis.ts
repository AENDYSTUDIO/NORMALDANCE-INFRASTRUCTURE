// libs/redis.ts
import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing Upstash Redis configuration')
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Кеширование данных
export class CacheManager {
  private redis = redis
  private defaultTTL = parseInt(process.env.REDIS_CACHE_TTL || '3600')

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key)
      return data ? JSON.parse(data as string) : null
    } catch (error) {
      console.error('Redis cache get error:', error)
      return null
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.redis.set(
        key,
        JSON.stringify(value),
        { ex: ttl || this.defaultTTL }
      )
    } catch (error) {
      console.error('Redis cache set error:', error)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error('Redis cache delete error:', error)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis cache exists error:', error)
      return false
    }
  }
}

// Управление сессиями
export class SessionManager {
  private redis = redis
  private sessionTTL = parseInt(process.env.REDIS_SESSION_TTL || '86400')

  async createSession(sessionId: string, data: any): Promise<void> {
    await this.redis.set(
      `session:${sessionId}`,
      JSON.stringify(data),
      { ex: this.sessionTTL }
    )
  }

  async getSession(sessionId: string): Promise<any | null> {
    try {
      const data = await this.redis.get(`session:${sessionId}`)
      return data ? JSON.parse(data as string) : null
    } catch (error) {
      console.error('Redis session get error:', error)
      return null
    }
  }

  async updateSession(sessionId: string, data: any): Promise<void> {
    await this.createSession(sessionId, data)
  }

  async destroySession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`)
  }
}

// Rate limiting
export class RateLimiter {
  private redis = redis
  private windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000')
  private maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '100')

  async checkLimit(key: string): Promise<{ allowed: boolean; remaining: number }> {
    const windowKey = `${key}:${Math.floor(Date.now() / this.windowMs)}`

    try {
      const current = await this.redis.incr(windowKey)

      if (current === 1) {
        await this.redis.expire(windowKey, Math.ceil(this.windowMs / 1000))
      }

      const remaining = Math.max(0, this.maxRequests - current)
      return { allowed: current <= this.maxRequests, remaining }
    } catch (error) {
      console.error('Redis rate limiter error:', error)
      return { allowed: false, remaining: 0 }
    }
  }
}

// Экспорт инстансов для использования в приложении
export const cacheManager = new CacheManager()
export const sessionManager = new SessionManager()
export const rateLimiter = new RateLimiter()
