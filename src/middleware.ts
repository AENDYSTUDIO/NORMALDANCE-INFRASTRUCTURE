import { NextResponse } from "next/server";
import { checkRateLimit as rateLimiterCheck } from "./middleware/rate-limiter";

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

export async function middleware(request: any) {
  const origin = request.headers.get("origin");
  const url = request.nextUrl;
  const ip = request.ip || "unknown";

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

  // CORS handling
  const response = NextResponse.next();

  if (origin) {
    const isAllowed = isOriginAllowed(origin);

    if (isAllowed) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    } else {
      // For non-allowed origins, don't set the header or set a default
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
