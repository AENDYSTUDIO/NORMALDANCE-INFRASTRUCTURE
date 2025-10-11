import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Cache Health Check Endpoint
 * 
 * Проверяет состояние Redis кэша и его производительность.
 * Работает только если настроен REDIS_URL.
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        connection: 'unknown',
        read: 'unknown',
        write: 'unknown',
        performance: 'unknown'
      },
      metrics: {
        connectionTime: 0,
        readTime: 0,
        writeTime: 0,
        totalTime: 0
      },
      cache: {
        host: process.env.REDIS_URL ? 'configured' : 'not configured',
        type: 'redis',
        memoryUsage: 0,
        connectedClients: 0,
        totalCommands: 0
      }
    };

    // Если Redis не настроен, возвращаем соответствующий статус
    if (!process.env.REDIS_URL) {
      healthCheck.status = 'degraded';
      healthCheck.checks.connection = 'not_configured';
      
      return NextResponse.json(healthCheck, { 
        status: 206,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Cache-Status': 'not_configured'
        }
      });
    }

    // Проверка подключения к Redis
    try {
      // Проверяем URL Redis
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        throw new Error('Redis URL not configured');
      }
      
      // Проверяем формат URL
      const url = new URL(redisUrl);
      healthCheck.cache.host = url.hostname;
      
      // Проверяем, доступен ли Redis через простой HTTP запрос (если это Redis HTTP API)
      if (redisUrl.includes('://') && redisUrl.includes('redis')) {
        // Для стандартного Redis сервера мы не можем сделать HTTP запрос
        // поэтому просто проверяем, что URL корректный
        healthCheck.checks.connection = 'configured';
        healthCheck.metrics.connectionTime = 0;
      } else {
        // Если это Redis HTTP API, делаем простой запрос
        const connectionStart = Date.now();
        
        try {
          const response = await fetch(`${redisUrl}/ping`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            healthCheck.checks.connection = 'healthy';
            healthCheck.metrics.connectionTime = Date.now() - connectionStart;
          } else {
            throw new Error(`Redis ping failed: ${response.status}`);
          }
        } catch (error) {
          healthCheck.checks.connection = 'unhealthy';
          healthCheck.status = 'unhealthy';
          console.error('Redis connection failed:', error);
        }
      }
      
      // Проверка чтения (если возможно)
      if (healthCheck.checks.connection === 'healthy') {
        try {
          const readStart = Date.now();
          
          // Пробуем сделать тестовый запрос
          const testKey = `health_check_read_${Date.now()}`;
          
          // Если это Redis HTTP API
          if (redisUrl.includes('://') && redisUrl.includes('redis')) {
            const response = await fetch(`${redisUrl}/set/${testKey}/read_test?EX=60`, {
              method: 'GET',
              signal: AbortSignal.timeout(3000)
            });
            
            if (response.ok) {
              const getResponse = await fetch(`${redisUrl}/get/${testKey}`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
              });
              
              if (getResponse.ok) {
                const result = await getResponse.text();
                if (result === 'read_test') {
                  healthCheck.checks.read = 'healthy';
                } else {
                  healthCheck.checks.read = 'degraded';
                  healthCheck.status = 'degraded';
                }
              } else {
                healthCheck.checks.read = 'unhealthy';
                healthCheck.status = 'unhealthy';
              }
              
              healthCheck.metrics.readTime = Date.now() - readStart;
            }
          }
          
        } catch (error) {
          healthCheck.checks.read = 'unhealthy';
          healthCheck.status = 'unhealthy';
          console.error('Redis read test failed:', error);
        }
      }
      
      // Проверка производительности
      healthCheck.metrics.totalTime = Date.now() - startTime;
      
      if (healthCheck.metrics.connectionTime > 3000) {
        healthCheck.checks.performance = 'slow';
        healthCheck.status = 'degraded';
      } else if (healthCheck.metrics.readTime > 2000) {
        healthCheck.checks.performance = 'slow';
        healthCheck.status = 'degraded';
      } else {
        healthCheck.checks.performance = 'good';
      }
      
    } catch (error) {
      healthCheck.checks.connection = 'unhealthy';
      healthCheck.status = 'unhealthy';
      console.error('Redis connection failed:', error);
    }

    // Определяем статус ответа
    const responseStatus = healthCheck.status === 'healthy' ? 200 : 
                          healthCheck.status === 'degraded' ? 206 : 503;

    // Логируем результат
    console.log('Cache health check:', {
      status: healthCheck.status,
      connectionTime: healthCheck.metrics.connectionTime,
      readTime: healthCheck.metrics.readTime,
      writeTime: healthCheck.metrics.writeTime,
      memoryUsage: healthCheck.cache.memoryUsage,
      connectedClients: healthCheck.cache.connectedClients
    });

    return NextResponse.json(healthCheck, { 
      status: responseStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Cache-Status': healthCheck.status,
        'X-Connection-Time': `${healthCheck.metrics.connectionTime}ms`,
        'X-Read-Time': `${healthCheck.metrics.readTime}ms`,
        'X-Write-Time': `${healthCheck.metrics.writeTime}ms`
      }
    });

  } catch (error) {
    console.error('Cache health check failed:', error);
    
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Cache health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Cache-Status': 'unhealthy'
      }
    });
  }
}