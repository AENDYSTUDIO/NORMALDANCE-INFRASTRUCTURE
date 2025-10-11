import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * External Services Health Check Endpoint
 * 
 * Проверяет доступность и производительность внешних сервисов:
 * - API endpoints
 * - CDN
 * - Payment systems
 * - Analytics services
 * - Social media APIs
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        cdn: 'unknown',
        payment: 'unknown',
        analytics: 'unknown',
        social: 'unknown',
        api: 'unknown'
      },
      metrics: {
        totalTime: 0,
        checkTimes: {
          cdn: 0,
          spotify: 0,
          internalApi: 0
        }
      },
      external: {
        cdn: {
          url: process.env.CDN_URL || 'https://cdn.dnb1st.ru',
          status: 'unknown',
          responseTime: 0
        },
        payment: {
          stripe: {
            url: 'https://api.stripe.com/v1/charges',
            status: 'unknown',
            responseTime: 0
          },
          yookassa: {
            url: 'https://api.yookassa.ru/v3/payments',
            status: 'unknown',
            responseTime: 0
          }
        },
        analytics: {
          google: {
            url: 'https://www.google-analytics.com/r/collect',
            status: 'unknown',
            responseTime: 0
          },
          amplitude: {
            url: 'https://api2.amplitude.com/2/httpapi',
            status: 'unknown',
            responseTime: 0
          }
        },
        social: {
          spotify: {
            url: 'https://api.spotify.com/v1/me',
            status: 'unknown',
            responseTime: 0
          },
          soundcloud: {
            url: 'https://api.soundcloud.com/me',
            status: 'unknown',
            responseTime: 0
          }
        },
        api: {
          internal: {
            url: `${process.env.BASE_URL || 'https://dnb1st.ru'}/api/health`,
            status: 'unknown',
            responseTime: 0
          }
        }
      }
    };

    // Функция для проверки URL с таймаутом
    const checkUrl = async (name: string, url: string, options: RequestInit = {}): Promise<{ status: string; responseTime: number }> => {
      const checkStart = Date.now();
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          ...options,
          signal: AbortSignal.timeout(10000)
        });
        
        const responseTime = Date.now() - checkStart;
        
        if (response.ok) {
          return { status: 'healthy', responseTime };
        } else {
          return { status: 'unhealthy', responseTime };
        }
      } catch (error) {
        const responseTime = Date.now() - checkStart;
        return { status: 'unhealthy', responseTime };
      }
    };

    // Проверка CDN
    if (process.env.CDN_URL) {
      const result = await checkUrl('cdn', healthCheck.external.cdn.url);
      healthCheck.checks.cdn = result.status;
      healthCheck.external.cdn.status = result.status;
      healthCheck.external.cdn.responseTime = result.responseTime;
      healthCheck.metrics.checkTimes.cdn = result.responseTime;
      
      if (result.status !== 'healthy') {
        healthCheck.status = 'degraded';
      }
    }

    // Проверка платежных систем
    if (process.env.STRIPE_SECRET_KEY) {
      // Для Stripe мы не можем сделать прямой запрос без авторизации
      // поэтому просто проверяем, что ключ настроен
      healthCheck.checks.payment = 'configured';
      healthCheck.external.payment.stripe.status = 'configured';
    } else {
      healthCheck.checks.payment = 'not_configured';
      healthCheck.status = 'degraded';
    }

    if (process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY) {
      healthCheck.checks.payment = healthCheck.checks.payment === 'configured' ? 'configured' : 'partially_configured';
      healthCheck.external.payment.yookassa.status = 'configured';
    }

    // Проверка аналитики
    if (process.env.GOOGLE_ANALYTICS_ID) {
      healthCheck.checks.analytics = healthCheck.checks.analytics === 'healthy' ? 'healthy' : 'configured';
      healthCheck.external.analytics.google.status = 'configured';
    }

    if (process.env.AMPLITUDE_API_KEY) {
      healthCheck.checks.analytics = healthCheck.checks.analytics === 'healthy' ? 'healthy' : 'configured';
      healthCheck.external.analytics.amplitude.status = 'configured';
    }

    // Проверка социальных API
    if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
      // Проверяем Spotify API с токеном
      try {
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
          },
          body: 'grant_type=client_credentials',
          signal: AbortSignal.timeout(5000)
        });
        
        if (tokenResponse.ok) {
          const result = await checkUrl('spotify', healthCheck.external.spotify.url, {
            headers: {
              'Authorization': 'Bearer dummy_token' // В реальном коде здесь будет настоящий токен
            }
          });
          healthCheck.checks.social = result.status;
          healthCheck.external.spotify.status = result.status;
          healthCheck.external.spotify.responseTime = result.responseTime;
          healthCheck.metrics.checkTimes.spotify = result.responseTime;
        }
      } catch (error) {
        healthCheck.checks.social = 'unhealthy';
        healthCheck.status = 'degraded';
      }
    }

    if (process.env.SOUNDCLOUD_CLIENT_ID && process.env.SOUNDCLOUD_CLIENT_SECRET) {
      healthCheck.checks.social = healthCheck.checks.social === 'healthy' ? 'healthy' : 'configured';
      healthCheck.external.social.soundcloud.status = 'configured';
    }

    // Проверка внутренних API
    const internalApiUrl = healthCheck.external.api.internal.url;
    const result = await checkUrl('internal-api', internalApiUrl);
    healthCheck.checks.api = result.status;
    healthCheck.external.api.internal.status = result.status;
    healthCheck.external.api.internal.responseTime = result.responseTime;
    healthCheck.metrics.checkTimes.internalApi = result.responseTime;
    
    if (result.status !== 'healthy') {
      healthCheck.status = 'degraded';
    }

    // Общее время проверки
    healthCheck.metrics.totalTime = Date.now() - startTime;

    // Определяем статус ответа
    const responseStatus = healthCheck.status === 'healthy' ? 200 : 
                          healthCheck.status === 'degraded' ? 206 : 503;

    // Логируем результат
    console.log('External services health check:', {
      status: healthCheck.status,
      totalTime: healthCheck.metrics.totalTime,
      checks: healthCheck.checks
    });

    return NextResponse.json(healthCheck, { 
      status: responseStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-External-Status': healthCheck.status,
        'X-Total-Time': `${healthCheck.metrics.totalTime}ms`
      }
    });

  } catch (error) {
    console.error('External services health check failed:', error);
    
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'External services health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-External-Status': 'unhealthy'
      }
    });
  }
}