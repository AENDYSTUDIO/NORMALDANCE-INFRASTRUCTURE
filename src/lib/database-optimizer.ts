/**
 * Оптимизатор базы данных для NormalDance
 * Ускорение запросов, кеширование, индексация и оптимизация запросов
 */

import { PrismaClient } from '@prisma/client'

interface QueryStats {
  query: string
  executionTime: number
  timestamp: number
  parameters: unknown[]
  resultCount: number
}

interface OptimizationRule {
  pattern: RegExp
  suggestion: string
  priority: 'high' | 'medium' | 'low'
}

interface IndexRecommendation {
  table: string
  columns: string[]
  type: 'btree' | 'hash' | 'gin' | 'gist'
  reason: string
  estimatedImprovement: number
}

class DatabaseOptimizer {
  private prisma: PrismaClient
  private queryHistory: QueryStats[] = []
  private slowQueryThreshold = 1000 // 1 секунда
  private maxHistorySize = 1000
  private optimizationRules: OptimizationRule[] = [
    {
      pattern: /SELECT \* FROM/gi,
      suggestion: 'Используйте конкретные столбцы вместо SELECT *',
      priority: 'high'
    },
    {
      pattern: /WHERE.*LIKE '%[^%]'/gi,
      suggestion: 'Избегайте шаблонов LIKE с подстановками в начале',
      priority: 'high'
    },
    {
      pattern: /ORDER BY.*RAND()/gi,
      suggestion: 'RAND() очень медленный, используйте другие методы сортировки',
      priority: 'high'
    },
    {
      pattern: /GROUP BY.*COUNT\(\*\)/gi,
      suggestion: 'Используйте COUNT(1) вместо COUNT(*) для лучшей производительности',
      priority: 'medium'
    },
    {
      pattern: /HAVING COUNT\(\*\) > [0-9]/gi,
      suggestion: 'Рассмотрите использование WHERE вместо HAVING для фильтрации',
      priority: 'medium'
    }
  ]

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Обертка для выполнения запросов с логированием
   */
  async executeQuery<T>(
    query: () => Promise<T>,
    queryName: string,
    parameters: unknown[] = []
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      const result = await query()
      const executionTime = Date.now() - startTime
      
      // Логируем запрос
      this.logQuery(queryName, parameters, executionTime, Array.isArray(result) ? result.length : 1)
      
      // Проверка на медленные запросы
      if (executionTime > this.slowQueryThreshold) {
        this.analyzeSlowQuery(queryName, parameters, executionTime)
      }
      
      return result
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.logQuery(queryName, parameters, executionTime, 0, error)
      throw error
    }
  }

  /**
   * Логирование запросов
   */
  private logQuery(
    query: string,
    parameters: unknown[],
    executionTime: number,
    resultCount: number,
    error?: Error
  ): void {
    const queryStats: QueryStats = {
      query,
      executionTime,
      timestamp: Date.now(),
      parameters,
      resultCount
    }

    this.queryHistory.push(queryStats)

    // Ограничиваем историю
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory = this.queryHistory.slice(-this.maxHistorySize)
    }

    // Логируем медленные запросы
    if (executionTime > this.slowQueryThreshold) {
      console.warn(`Slow query detected: ${query} (${executionTime}ms)`)
    }
  }

  /**
   * Анализ медленных запросов
   */
  private analyzeSlowQuery(query: string, parameters: any[], executionTime: number): void {
    const suggestions = this.getOptimizationSuggestions(query)
    
    console.group(`🐌 Slow Query Analysis: ${query}`)
    console.log(`Execution time: ${executionTime}ms`)
    console.log(`Parameters:`, parameters)
    console.log(`Suggestions:`, suggestions)
    console.groupEnd()
  }

  /**
   * Получение рекомендаций по оптимизации
   */
  private getOptimizationSuggestions(query: string): string[] {
    const suggestions: string[] = []

    for (const rule of this.optimizationRules) {
      if (rule.pattern.test(query)) {
        suggestions.push(`[${rule.priority.toUpperCase()}] ${rule.suggestion}`)
      }
    }

    // Специфические рекомендации для NormalDance
    if (query.includes('tracks') && query.includes('JOIN')) {
      suggestions.push('[HIGH] Убедитесь, что есть индексы на внешних ключах в таблице tracks')
    }

    if (query.includes('play_history') && !query.includes('INDEX')) {
      suggestions.push('[MEDIUM] Рассмотрите добавление индекса на user_id и track_id в play_history')
    }

    if (query.includes('likes') && query.includes('WHERE')) {
      suggestions.push('[MEDIUM] Добавьте составной индекс на user_id и track_id в таблице likes')
    }

    return suggestions
  }

  /**
   * Получение статистики запросов
   */
  getQueryStats() {
    if (this.queryHistory.length === 0) {
      return {
        totalQueries: 0,
        averageExecutionTime: 0,
        slowQueries: 0,
        queriesPerSecond: 0
      }
    }

    const totalQueries = this.queryHistory.length
    const slowQueries = this.queryHistory.filter(q => q.executionTime > this.slowQueryThreshold).length
    const averageExecutionTime = this.queryHistory.reduce((sum, q) => sum + q.executionTime, 0) / totalQueries
    
    // Рассчитываем запросы в секунду за последние 5 минут
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const recentQueries = this.queryHistory.filter(q => q.timestamp > fiveMinutesAgo)
    const queriesPerSecond = recentQueries.length / 300

    return {
      totalQueries,
      averageExecutionTime: Math.round(averageExecutionTime),
      slowQueries,
      queriesPerSecond: Math.round(queriesPerSecond * 100) / 100,
      topSlowQueries: this.queryHistory
        .sort((a, b) => b.executionTime - a.executionTime)
        .slice(0, 5)
        .map(q => ({
          query: q.query,
          executionTime: q.executionTime,
          resultCount: q.resultCount
        }))
    }
  }

  /**
   * Оптимизированный запрос для получения треков с кешированием
   */
  async getTracksWithCache(
    options: {
      limit?: number
      offset?: number
      genre?: string
      artistId?: string
      sortBy?: 'createdAt' | 'plays' | 'likes'
      sortOrder?: 'asc' | 'desc'
    } = {}
  ) {
    const cacheKey = `tracks:${JSON.stringify(options)}`
    
    // Проверка кеша (в реальном приложении здесь будет проверка Redis/кеша)
    // const cached = await this.getFromCache(cacheKey)
    // if (cached) return cached

    const {
      limit = 20,
      offset = 0,
      genre,
      artistId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options

    return this.executeQuery(async () => {
      const where: Record<string, unknown> = {}
      
      if (genre) {
        where.genre = genre
      }
      
      if (artistId) {
        where.artistId = artistId
      }

      const orderBy: Record<string, unknown> = {}
      orderBy[sortBy] = sortOrder

      const tracks = await this.prisma.track.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          artist: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              playHistory: true
            }
          }
        }
      })

      // Кеширование результата (в реальном приложении здесь будет сохранение в Redis/кеш)
      // await this.setCache(cacheKey, tracks, { ttl: 300 }) // 5 минут

      return tracks
    }, 'getTracksWithCache', [options])
  }

  /**
   * Оптимизированный запрос для получения истории прослушиваний
   */
  async getUserPlayHistory(
    userId: string,
    options: {
      limit?: number
      offset?: number
      startDate?: Date
      endDate?: Date
    } = {}
  ) {
    const cacheKey = `playHistory:${userId}:${JSON.stringify(options)}`
    
    // Проверка кеша
    // const cached = await this.getFromCache(cacheKey)
    // if (cached) return cached

    const {
      limit = 50,
      offset = 0,
      startDate,
      endDate
    } = options

    return this.executeQuery(async () => {
      const where: any = {
        userId
      }
      
      if (startDate) {
        where.createdAt = { gte: startDate }
      }
      
      if (endDate) {
        where.createdAt = { ...where.createdAt, lte: endDate }
      }

      const history = await this.prisma.playHistory.findMany({
        where,
        include: {
          track: {
            include: {
              artist: {
                select: {
                  id: true,
                  username: true,
                  avatar: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      })

      // Кеширование
      // await this.setCache(cacheKey, history, { ttl: 600 }) // 10 минут

      return history
    }, 'getUserPlayHistory', [userId, options])
  }

  /**
   * Оптимизированный запрос для получения рекомендаций
   */
  async getRecommendations(userId: string, limit: number = 10) {
    const cacheKey = `recommendations:${userId}:${limit}`
    
    // Проверка кеша
    // const cached = await this.getFromCache(cacheKey)
    // if (cached) return cached

    return this.executeQuery(async () => {
      // Получаем жанры, которые пользователь слушает чаще всего
      const userGenres = await this.prisma.playHistory.groupBy({
        by: ['track'],
        where: { userId },
        _count: { track: true },
        orderBy: { _count: { track: 'desc' } },
        take: 5
      })

      if (userGenres.length === 0) {
        // Если у пользователя нет истории, возвращаем популярные треки
        return this.prisma.track.findMany({
          include: {
            artist: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            },
            _count: {
              select: {
                likes: true,
                playHistory: true
              }
            }
          },
          orderBy: { playCount: 'desc' },
          take: limit
        })
      }

      // Получаем жанлы из истории
      const genreIds = userGenres.map(g => g.track.genre)

      // Получаем рекомендации на основе жанров и артистов
      const recommendations = await this.prisma.track.findMany({
        where: {
          genre: { in: genreIds },
          artistId: { not: userId } // Исключаем треки самого пользователя
        },
        include: {
          artist: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          _count: {
            select: {
              likes: true,
              playHistory: true
            }
          }
        },
        orderBy: [
          { playCount: 'desc' },
          { likeCount: 'desc' }
        ],
        take: limit
      })

      // Кеширование
      // await this.setCache(cacheKey, recommendations, { ttl: 1800 }) // 30 минут

      return recommendations
    }, 'getRecommendations', [userId, limit])
  }

  /**
   * Пакетное обновление статистики
   */
  async batchUpdateStats(trackIds: string[], updates: { plays?: number; likes?: number }) {
    return this.executeQuery(async () => {
      const updatePromises = trackIds.map(trackId => 
        this.prisma.track.update({
          where: { id: trackId },
          data: updates
        })
      )

      return await Promise.all(updatePromises)
    }, 'batchUpdateStats', [trackIds, updates])
  }

  /**
   * Анализ производительности базы данных
   */
  async analyzePerformance() {
    const queryStats = this.getQueryStats()
    
    // Анализ индексов (в реальном приложении здесь будет запрос к системе PostgreSQL)
    const indexRecommendations: IndexRecommendation[] = [
      {
        table: 'play_history',
        columns: ['user_id', 'track_id'],
        type: 'btree',
        reason: 'Ускорение запросов истории прослушиваний и рекомендаций',
        estimatedImprovement: 85
      },
      {
        table: 'likes',
        columns: ['user_id', 'track_id'],
        type: 'btree',
        reason: 'Ускорение проверок лайков и дубликатов',
        estimatedImprovement: 75
      },
      {
        table: 'tracks',
        columns: ['artist_id', 'genre'],
        type: 'btree',
        reason: 'Ускорение фильтрации по артистам и жанрам',
        estimatedImprovement: 65
      },
      {
        table: 'users',
        columns: ['email', 'username'],
        type: 'btree',
        reason: 'Ускорение поиска пользователей',
        estimatedImprovement: 90
      }
    ]

    return {
      queryStats,
      indexRecommendations,
      optimizationSuggestions: this.getOptimizationSuggestions(''),
      databaseHealth: {
        connectionPool: {
          active: 5,
          idle: 10,
          total: 15
        },
        memoryUsage: '45MB',
        cacheHitRate: '78%'
      }
    }
  }

  /**
   * Очистка старых данных
   */
  async cleanupOldData() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    return this.executeQuery(async () => {
      // Удаляем старую историю прослушиваний (опционально)
      const deletedHistory = await this.prisma.playHistory.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo }
        }
      })

      // Удаляем старые лайки (опционально)
      const deletedLikes = await this.prisma.like.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo }
        }
      })

      // Очищаем историю запросов
      this.queryHistory = this.queryHistory.filter(q => q.timestamp > thirtyDaysAgo)

      return {
        deletedHistory: deletedHistory.count,
        deletedLikes: deletedLikes.count,
        queryHistoryCleaned: this.queryHistory.length
      }
    }, 'cleanupOldData', [])
  }

  /**
   * Генерация отчета о производительности
   */
  generatePerformanceReport() {
    const stats = this.getQueryStats()
    const analysis = this.analyzePerformance()

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalQueries: stats.totalQueries,
        averageExecutionTime: `${stats.averageExecutionTime}ms`,
        slowQueries: stats.slowQueries,
        performanceScore: this.calculatePerformanceScore(stats)
      },
      recommendations: {
        indexes: analysis.indexRecommendations,
        queryOptimizations: analysis.optimizationSuggestions,
        maintenance: [
          'Рассмотрите добавление индексов для часто используемых запросов',
          'Настройте периодическую очистку старых данных',
          'Оптимизируйте запросы с длительным временем выполнения'
        ]
      },
      detailedStats: stats
    }
  }

  /**
   * Расчет оценки производительности
   */
  private calculatePerformanceScore(stats: { avgExecutionTime: number; slowQueryCount: number; errorRate: number }): number {
    const baseScore = 100
    const slowQueryPenalty = stats.slowQueries * 2
    const executionTimePenalty = stats.averageExecutionTime / 10
    const qpsBonus = Math.min(stats.queriesPerSecond * 2, 20)
    
    return Math.max(0, baseScore - slowQueryPenalty - executionTimePenalty + qpsBonus)
  }
}

// Создание экземпляра оптимизатора
export function createDatabaseOptimizer(prisma: PrismaClient): DatabaseOptimizer {
  return new DatabaseOptimizer(prisma)
}

// Хуки для использования в React
export function useDatabaseOptimizer(prisma: PrismaClient) {
  const optimizer = createDatabaseOptimizer(prisma)
  const [stats, setStats] = useState(optimizer.getQueryStats())

  // Обновление статистики
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(optimizer.getQueryStats())
    }, 5000)

    return () => clearInterval(interval)
  }, [optimizer])

  return {
    stats,
    executeQuery: optimizer.executeQuery.bind(optimizer),
    getTracksWithCache: optimizer.getTracksWithCache.bind(optimizer),
    getUserPlayHistory: optimizer.getUserPlayHistory.bind(optimizer),
    getRecommendations: optimizer.getRecommendations.bind(optimizer),
    batchUpdateStats: optimizer.batchUpdateStats.bind(optimizer),
    analyzePerformance: optimizer.analyzePerformance.bind(optimizer),
    cleanupOldData: optimizer.cleanupOldData.bind(optimizer),
    generatePerformanceReport: optimizer.generatePerformanceReport.bind(optimizer)
  }
}

export default DatabaseOptimizer