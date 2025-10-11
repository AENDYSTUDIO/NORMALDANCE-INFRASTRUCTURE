/**
 * Security Middleware
 * Applies security headers and protections
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimiter } from '@/lib/security/rate-limiter';

export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // HSTS for HTTPS
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // CSP for XSS protection
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://telegram.org",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.ipfs.io https://*.ipfs.dweb.link",
    "connect-src 'self' https://api.mainnet-beta.solana.com https://ton.org wss://api.mainnet-beta.solana.com",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResult = apiRateLimiter.check(request);
    
    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
  }

  return response;
}