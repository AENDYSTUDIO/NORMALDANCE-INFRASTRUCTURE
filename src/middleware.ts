import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkRateLimit as rateLimiterCheck } from "./middleware/rate-limiter";
import { logger } from "./lib/utils/logger";

// Enhanced security middleware for NORMALDANCE

// Define allowed origins
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  "https://normaldance.com",
  "https://www.normaldance.com",
  "https://*.vercel.app", // For preview URLs
  "https://t.me",
  "https://web.telegram.org",
];

// Check if the origin is allowed
function isOriginAllowed(origin: string): boolean {
  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin.startsWith("https://*.")) {
      // Handle wildcard subdomain matching
      const domain = allowedOrigin.substring(11); // Remove 'https://*.'
      return origin.includes(domain);
    }
    return origin === allowedOrigin;
  });
}

// Enhanced security headers
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

// Check suspicious patterns in request
interface SecurityCheck {
  isSuspicious: boolean
  reason?: string
}

function checkSuspiciousRequest(request: NextRequest): SecurityCheck {
  const userAgent = request.headers.get("user-agent") || "";
  const url = request.url;
  
  // Check for common bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
  ];
  
  const isBot = botPatterns.some(pattern => pattern.test(userAgent));
  
  // Check for suspicious URL patterns
  const suspiciousPatterns = [
    /\.\./,
    /<script/i,
    /javascript:/i,
    /data:text/i,
  ];
  
  const isSuspiciousUrl = suspiciousPatterns.some(pattern => pattern.test(url));
  
  return {
    isSuspicious: isBot && isSuspiciousUrl,
    reason: isBot ? "Bot with suspicious patterns detected" : undefined,
  };
}

export async function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const url = request.nextUrl;
  const ip = request.ip || "unknown";

  // Check for suspicious requests
  const securityCheck = checkSuspiciousRequest(request);
  if (securityCheck.isSuspicious) {
    logger.warn(`Suspicious request blocked: ${securityCheck.reason}`, { 
      ip, 
      url: url.pathname,
      userAgent: request.headers.get("user-agent") 
    });
    return new Response("Request blocked", { status: 403 });
  }

  // Extract endpoint from URL path
  const pathParts = url.pathname.split("/");
  let endpoint = pathParts[1] ? pathParts[1] : "root"; // e.g., 'api', 'tracks', 'auth'

  // Map specific API routes to appropriate rate limiting categories
  if (endpoint === "api") {
    const subEndpoint = pathParts[2] ? pathParts[2] : "general";
    if (["auth", "login", "register"].includes(subEndpoint)) {
      endpoint = "auth";
    } else if (["tracks", "upload", "download"].includes(subEndpoint)) {
      endpoint = "tracks";
    } else if (["nft", "mint", "transfer"].includes(subEndpoint)) {
      endpoint = "nft";
    } else {
      endpoint = "general";
    }
  }

  // Rate limiting using the centralized rate limiter
  const rateLimitIdentifier = `${endpoint}_${ip}`;
  const rateLimitResult = await rateLimiterCheck(rateLimitIdentifier, endpoint);

  if (!rateLimitResult.success) {
    return new Response("Rate limit exceeded", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": rateLimitResult.reset.toString(),
      },
    });
  }

  // CORS handling with enhanced security
  const response = NextResponse.next();

  if (origin) {
    const isAllowed = isOriginAllowed(origin);

    if (isAllowed) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    } else {
      // For non-allowed origins, don't set the header
      response.headers.set("Access-Control-Allow-Origin", "");
    }
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-Requested-With"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: response.headers,
    });
  }

  // Set Content Security Policy for Telegram Mini App
  // Don't use unsafe-inline or unsafe-eval as required by Telegram
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' https://telegram.org https://web.telegram.org https://*.telegram.org; " +
      "style-src 'self' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "connect-src 'self' https://api.telegram.org https://*.normaldance.com wss://*.normaldance.com; " +
      "img-src 'self' data: https:; " +
      "media-src 'self' data: https:; " +
      "frame-src 'self' https://t.me https://*.t.me; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
  );

  // For non-OPTIONS requests, return the response with CORS headers and CSP
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
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
