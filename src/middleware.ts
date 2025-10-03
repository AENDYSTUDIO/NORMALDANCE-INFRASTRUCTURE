import { NextResponse } from 'next/server';

// Define allowed origins
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
 'https://normaldance.com',
  'https://www.normaldance.com',
  'https://*.vercel.app', // For preview URLs
  'https://t.me',
  'https://web.telegram.org',
];

// Check if the origin is allowed
function isOriginAllowed(origin: string): boolean {
  return allowedOrigins.some(allowedOrigin => {
    if (allowedOrigin.startsWith('https://*.')) {
      // Handle wildcard subdomain matching
      const domain = allowedOrigin.substring(11); // Remove 'https://*.'
      return origin.includes(domain);
    }
    return origin === allowedOrigin;
  });
}

// Rate limiting logic (simplified for now - would use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): { success: boolean; limit: number; remaining: number; reset: number } {
  const windowMs = 10 * 1000; // 10 seconds
  const maxRequests = 10;
  
  const now = Date.now();
  const record = rateLimitStore.get(identifier) || { count: 0, resetTime: now + windowMs };
  
  if (now > record.resetTime) {
    // Reset the window
    record.count = 0;
    record.resetTime = now + windowMs;
  }
  
  record.count++;
  rateLimitStore.set(identifier, record);
  
 const success = record.count <= maxRequests;
  const remaining = Math.max(maxRequests - record.count, 0);
  
  return {
    success,
    limit: maxRequests,
    remaining,
    reset: record.resetTime,
  };
}

export async function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const url = request.nextUrl;
  const ip = request.ip || 'unknown';
  
  // Extract endpoint from URL path
  const pathParts = url.pathname.split('/');
  const endpoint = pathParts[1] ? pathParts[1] : 'root'; // e.g., 'api', 'tracks', 'auth'
  
  // Rate limiting
  const rateLimitIdentifier = `${endpoint}_${ip}`;
  const { success, limit, remaining, reset } = checkRateLimit(rateLimitIdentifier);
  
  if (!success) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    });
  }
  
  // CORS handling
 const response = NextResponse.next();
  
  if (origin) {
    const isAllowed = isOriginAllowed(origin);
    
    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
      // For non-allowed origins, don't set the header or set a default
      response.headers.set('Access-Control-Allow-Origin', '');
    }
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
 if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: response.headers,
    });
 }
  
  // For non-OPTIONS requests, return the response with CORS headers
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};