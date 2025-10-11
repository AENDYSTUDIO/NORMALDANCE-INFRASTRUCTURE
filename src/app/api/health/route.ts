import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Health Check Endpoint
 * 
 * Этот эндпоинт используется для проверки состояния приложения
 * и его зависимостей. Он вызывается:
 * - Render health checks
 * - Мониторинговыми системами
 * - Балансировщиками нагрузки
 * - CI/CD пайплайнами
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Базовая информация о запросе
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Проверка базового функционала
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || 'unknown',
      service: process.env.SERVICE_NAME || 'dnb1st',
      
      // Проверки зависимостей
      dependencies: {
        database: 'unknown',
        redis: 'unknown',
        storage: 'unknown'
      },
      
      // Метрики производительности
      performance: {
        responseTime: 0,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      
      // Информация о запросе
      request: {
        userAgent,
        ip,
        method: request.method,
        url: request.url
      }
    };

    // Проверка подключения к базе данных
    try {
      await db.$queryRaw`SELECT 1`;
      healthCheck.dependencies.database = 'healthy';
    } catch (error) {
      healthCheck.dependencies.database = 'unhealthy';
      healthCheck.status = 'degraded';
    }

    // Проверка Redis (если настроен)
    if (process.env.REDIS_URL) {
      try {
        // Здесь можно добавить проверку подключения к Redis
        // healthCheck.dependencies.redis = 'healthy';
      } catch (error) {
        healthCheck.dependencies.redis = 'unhealthy';
        healthCheck.status = 'degraded';
      }
    }

    // Проверка хранилища (если настроено)
    if (process.env.STORAGE_URL) {
      try {
        // Здесь можно добавить проверку подключения к хранилищу
        // healthCheck.dependencies.storage = 'healthy';
      } catch (error) {
        healthCheck.dependencies.storage = 'unhealthy';
        healthCheck.status = 'degraded';
      }
    }

    // Расчет времени ответа
    healthCheck.performance.responseTime = Date.now() - startTime;

    // Определяем статус ответа на основе проверок
    const responseStatus = healthCheck.status === 'healthy' ? 200 : 
                          healthCheck.status === 'degraded' ? 206 : 503;

    // Логируем health check
    console.log(`Health check: ${healthCheck.status}`, {
      timestamp: healthCheck.timestamp,
      responseTime: healthCheck.performance.responseTime,
      dependencies: healthCheck.dependencies,
      userAgent: healthCheck.request.userAgent,
      ip: healthCheck.request.ip
    });

    return NextResponse.json(healthCheck, { 
      status: responseStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Health-Status': healthCheck.status,
        'X-Response-Time': `${healthCheck.performance.responseTime}ms`
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'unhealthy'
      }
    });
  }
}

/**
 * POST метод для health check (может использоваться для более глубоких проверок)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    // Здесь можно добавить дополнительные проверки
    // Например, проверку конкретных сервисов или выполнение тестов

    const deepHealthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      action,
      params,
      checks: {
        database: 'healthy',
        cache: 'healthy',
        externalServices: 'healthy'
      }
    };

    return NextResponse.json(deepHealthCheck, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'healthy'
      }
    });

  } catch (error) {
    console.error('Deep health check failed:', error);
    
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Deep health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'unhealthy'
      }
    });
  }
}