import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Database Health Check Endpoint
 * 
 * Проводит глубокую проверку подключения к базе данных
 * и выполняет тестовые запросы для проверки производительности.
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        connection: 'unknown',
        query: 'unknown',
        performance: 'unknown'
      },
      metrics: {
        connectionTime: 0,
        queryTime: 0,
        totalTime: 0
      },
      database: {
        host: process.env.DATABASE_URL ? 'configured' : 'not configured',
        type: 'postgresql',
        maxConnections: 0,
        activeConnections: 0
      }
    };

    // Проверка подключения к базе данных
    try {
      const connectionStart = Date.now();
      await db.$connect();
      healthCheck.checks.connection = 'healthy';
      healthCheck.metrics.connectionTime = Date.now() - connectionStart;
      
      // Получаем информацию о подключениях
      try {
        const connectionInfo = await db.$queryRaw`
          SELECT 
            count(*) as active_connections,
            setting as max_connections
          FROM pg_stat_activity 
          JOIN pg_settings ON pg_settings.name = 'max_connections'
          WHERE state = 'active'
        `;
        
        if (Array.isArray(connectionInfo) && connectionInfo.length > 0) {
          healthCheck.database.activeConnections = Number(connectionInfo[0].active_connections);
          healthCheck.database.maxConnections = Number(connectionInfo[0].max_connections);
        }
      } catch (error) {
        console.warn('Could not get connection info:', error);
      }
      
    } catch (error) {
      healthCheck.checks.connection = 'unhealthy';
      healthCheck.status = 'unhealthy';
      console.error('Database connection failed:', error);
    }

    // Проверка выполнения запросов
    if (healthCheck.checks.connection === 'healthy') {
      try {
        const queryStart = Date.now();
        
        // Выполняем тестовый запрос
        const result = await db.$queryRaw`
          SELECT 
            NOW() as current_time,
            1 as test_value,
            'database_health_check' as test_string
        `;
        
        healthCheck.checks.query = 'healthy';
        healthCheck.metrics.queryTime = Date.now() - queryStart;
        
        // Проверяем результат запроса
        if (Array.isArray(result) && result.length > 0) {
          const testResult = result[0];
          if (testResult.test_value === 1 && testResult.test_string === 'database_health_check') {
            healthCheck.checks.query = 'healthy';
          } else {
            healthCheck.checks.query = 'degraded';
            healthCheck.status = 'degraded';
          }
        }
        
      } catch (error) {
        healthCheck.checks.query = 'unhealthy';
        healthCheck.status = 'unhealthy';
        console.error('Database query failed:', error);
      }
    }

    // Проверка производительности
    healthCheck.metrics.totalTime = Date.now() - startTime;
    
    if (healthCheck.metrics.connectionTime > 5000) {
      healthCheck.checks.performance = 'slow';
      healthCheck.status = 'degraded';
    } else if (healthCheck.metrics.queryTime > 3000) {
      healthCheck.checks.performance = 'slow';
      healthCheck.status = 'degraded';
    } else {
      healthCheck.checks.performance = 'good';
    }

    // Определяем статус ответа
    const responseStatus = healthCheck.status === 'healthy' ? 200 : 
                          healthCheck.status === 'degraded' ? 206 : 503;

    // Логируем результат
    console.log('Database health check:', {
      status: healthCheck.status,
      connectionTime: healthCheck.metrics.connectionTime,
      queryTime: healthCheck.metrics.queryTime,
      activeConnections: healthCheck.database.activeConnections,
      maxConnections: healthCheck.database.maxConnections
    });

    return NextResponse.json(healthCheck, { 
      status: responseStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Database-Status': healthCheck.status,
        'X-Connection-Time': `${healthCheck.metrics.connectionTime}ms`,
        'X-Query-Time': `${healthCheck.metrics.queryTime}ms`
      }
    });

  } catch (error) {
    console.error('Database health check failed:', error);
    
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Database-Status': 'unhealthy'
      }
    });
  }
}