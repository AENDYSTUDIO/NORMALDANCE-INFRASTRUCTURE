import { NextRequest, NextResponse } from 'next/server';
import { getMonitoring } from '@/lib/monitoring';

export async function GET(req: NextRequest) {
  try {
    const monitoring = getMonitoring();
    const healthCheck = await monitoring.performHealthCheck();
    
    // Set CORS headers
    const origin = req.headers.get('origin');
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Return health status
    return new Response(JSON.stringify(healthCheck, null, 2), {
      status: healthCheck.status === 'healthy' ? 200 : 
               healthCheck.status === 'degraded' ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error.message,
      timestamp: Date.now(),
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
