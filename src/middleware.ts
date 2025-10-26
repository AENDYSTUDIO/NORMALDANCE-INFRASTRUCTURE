import { NextResponse } from "next/server";
import { DEFAULT_HEADERS_CONFIG } from "./lib/security/ISecurityService";
import { SecurityManager } from "./lib/security/SecurityManager";
import { logger } from "./lib/utils/logger";
import { checkRateLimit as rateLimiterCheck } from "./middleware/rate-limiter";

// Initialize SecurityManager with default configuration
const securityManager = new SecurityManager({
  csrf: {
    cookieName: "nd_csrf",
    headerName: "x-csrf-token",
    ttlSeconds: 3600,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
  headers: DEFAULT_HEADERS_CONFIG,
});

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

// Legacy security headers removed; all security headers are now provided by SecurityManager via config/csp.ts

// Check suspicious patterns in request
interface SecurityCheck {
  isSuspicious: boolean;
  reason?: string;
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

  const isBot = botPatterns.some((pattern) => pattern.test(userAgent));

  // Check for suspicious URL patterns
  const suspiciousPatterns = [/\.\./, /<script/i, /javascript:/i, /data:text/i];

  const isSuspiciousUrl = suspiciousPatterns.some((pattern) =>
    pattern.test(url)
  );

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
      userAgent: request.headers.get("user-agent"),
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

  // Get security headers from SecurityManager
  const { headers } = securityManager.getSecurityHeaders();

  // Add security headers from SecurityManager first
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: response.headers,
    });
  }

  // For non-OPTIONS requests, return the response with all security headers
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
