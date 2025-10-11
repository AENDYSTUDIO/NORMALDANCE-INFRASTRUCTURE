# Security Enhancements Improvement Plan

## Overview

This document outlines a comprehensive plan to enhance the security posture of the NORMALDANCE platform. The current implementation has a solid foundation with middleware security, rate limiting, input sanitization, and Telegram validation, but several areas can be improved to meet modern security standards and protect against evolving threats.

## Current Security Status

The platform currently implements:

- Basic middleware security with CORS and security headers
- Rate limiting for different API endpoints
- Input sanitization for HTML, SQL, URLs, and filenames
- Telegram Web App initData validation
- Environment variable validation
- Dependency security checks

## Improvement Areas

### 1. Advanced Authentication & Authorization

#### Current State

- Web3 authentication via Solana wallets using SIWE
- OAuth providers (Spotify, Apple)
- Basic user level system (BRONZE, SILVER, GOLD, PLATINUM)

#### Proposed Improvements

**Multi-Factor Authentication (MFA)**

```typescript
// Implementation example for TOTP-based MFA
import { authenticator } from "otplib";
import { toDataURL } from "qrcode";

export class MFAService {
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  generateQRCode(secret: string, email: string): Promise<string> {
    const otpauth = authenticator.keyuri(email, "NORMALDANCE", secret);
    return toDataURL(otpauth);
  }

  verifyToken(secret: string, token: string): boolean {
    return authenticator.check(token, secret);
  }
}
```

**Session Management**

```typescript
// Enhanced session management with rotation and invalidation
export class SessionManager {
  async createSession(userId: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    const refreshToken = crypto.randomBytes(64).toString("hex");

    await db.session.create({
      data: {
        id: sessionId,
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
      },
    });

    return sessionId;
  }

  async refreshSession(refreshToken: string): Promise<string | null> {
    const session = await db.session.findFirst({
      where: {
        refreshToken,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) return null;

    // Rotate refresh token
    const newRefreshToken = crypto.randomBytes(64).toString("hex");
    await db.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return session.id;
  }
}
```

**Role-Based Access Control (RBAC)**

```typescript
// Enhanced RBAC system
export class RBACService {
  async checkPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { permissions: true } } },
    });

    if (!user) return false;

    // Check direct permissions
    for (const role of user.roles) {
      for (const permission of role.permissions) {
        if (permission.resource === resource && permission.action === action) {
          return true;
        }
      }
    }

    return false;
  }
}
```

### 2. Input Validation & Sanitization

#### Current State

- Basic input sanitization functions
- Validation for email, Solana addresses, etc.

#### Proposed Improvements

**Enhanced Validation Schema**

```typescript
// Using Zod for comprehensive validation
import { z } from "zod";

const trackUploadSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  description: z.string().max(1000).optional(),
  genre: z.string().min(1).max(50),
  tags: z.array(z.string().min(1).max(30)).max(10),
  price: z.number().min(0).max(1000),
  file: z.instanceof(File).refine(
    (file) => file.size <= 100 * 1024 * 1024, // 100MB limit
    "File size must be less than 100MB"
  ),
  coverImage: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024, // 5MB limit
      "Cover image must be less than 5MB"
    ),
});

export function validateTrackUpload(data: any) {
  try {
    return { success: true, data: trackUploadSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      };
    }
    return { success: false, errors: [{ message: "Validation failed" }] };
  }
}
```

**Advanced Sanitization**

```typescript
// Enhanced sanitization with DOMPurify
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

export class ContentSanitizer {
  private purify: typeof DOMPurify;

  constructor() {
    const window = new JSDOM("").window as any;
    this.purify = DOMPurify(window);
  }

  sanitizeHTML(input: string): string {
    return this.purify.sanitize(input, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li"],
      ALLOWED_ATTR: [],
      FORBID_TAGS: ["script", "object", "embed", "iframe", "form"],
      FORBID_ATTR: ["onload", "onerror", "onclick", "onmouseover"],
    });
  }

  sanitizeJSON(input: any): any {
    if (typeof input === "string") {
      return this.sanitizeHTML(input);
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitizeJSON(item));
    }

    if (typeof input === "object" && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeHTML(key)] = this.sanitizeJSON(value);
      }
      return sanitized;
    }

    return input;
  }
}
```

### 3. CSRF Protection

#### Current State

- No explicit CSRF protection implemented

#### Proposed Implementation

**CSRF Token Generation**

```typescript
// CSRF protection middleware
import { createHash } from "crypto";

export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;

  static generateToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(16).toString("hex");
    const data = `${sessionId}${timestamp}${random}`;

    return createHash("sha256").update(data).digest("hex");
  }

  static validateToken(token: string, sessionId: string): boolean {
    // In production, store tokens in secure storage and validate against it
    // This is a simplified example
    return token.length === 64 && /^[a-f0-9]+$/.test(token);
  }
}

// Middleware implementation
export async function csrfMiddleware(request: NextRequest) {
  // Skip for GET requests
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return NextResponse.next();
  }

  const token = request.headers.get("x-csrf-token");
  const sessionId = request.cookies.get("session-id")?.value;

  if (!token || !sessionId) {
    return new NextResponse("CSRF token missing", { status: 403 });
  }

  if (!CSRFProtection.validateToken(token, sessionId)) {
    return new NextResponse("Invalid CSRF token", { status: 403 });
  }

  return NextResponse.next();
}
```

### 4. Advanced Rate Limiting

#### Current State

- Basic in-memory rate limiter with different limits per endpoint

#### Proposed Improvements

**Distributed Rate Limiter**

```typescript
// Redis-based distributed rate limiter
import { Redis } from "ioredis";

export class DistributedRateLimiter {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<{ success: boolean; reset: number; remaining: number }> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);

    // Get current count
    const currentCount = await this.redis.zcard(key);

    if (currentCount >= limit) {
      const reset = await this.redis.zrange(key, 0, 0, "WITHSCORES");
      return {
        success: false,
        reset: parseInt(reset[1]) + windowMs,
        remaining: 0,
      };
    }

    // Add current request
    await this.redis.zadd(key, now, `${now}-${Math.random()}`);
    await this.redis.expire(key, Math.ceil(windowMs / 1000));

    return {
      success: true,
      reset: now + windowMs,
      remaining: limit - currentCount - 1,
    };
  }
}
```

**Adaptive Rate Limiting**

```typescript
// Adaptive rate limiting based on user behavior
export class AdaptiveRateLimiter {
  private baseLimiter: DistributedRateLimiter;

  constructor(redisUrl: string) {
    this.baseLimiter = new DistributedRateLimiter(redisUrl);
  }

  async checkAdaptiveRateLimit(
    userId: string,
    endpoint: string,
    ip: string
  ): Promise<{ success: boolean; reset: number; remaining: number }> {
    // Get user risk score
    const riskScore = await this.calculateRiskScore(userId, ip);

    // Adjust limits based on risk
    const baseLimit = 100;
    const adjustedLimit = Math.max(10, baseLimit - riskScore * 10);

    const key = `rate_limit:${userId}:${endpoint}`;
    return this.baseLimiter.checkRateLimit(key, adjustedLimit, 60000);
  }

  private async calculateRiskScore(
    userId: string,
    ip: string
  ): Promise<number> {
    let score = 0;

    // Check for suspicious activity
    const failedLogins = await db.failedLogin.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (failedLogins > 5) score += 2;
    if (failedLogins > 10) score += 3;

    // Check IP reputation
    const ipReputation = await this.checkIPReputation(ip);
    if (ipReputation === "bad") score += 3;
    if (ipReputation === "suspicious") score += 1;

    return Math.min(10, score);
  }

  private async checkIPReputation(
    ip: string
  ): Promise<"good" | "suspicious" | "bad"> {
    // Integration with IP reputation services
    // Simplified implementation
    const blockedIPs = await db.blockedIP.findMany({
      where: { ip, blockedUntil: { gt: new Date() } },
    });

    if (blockedIPs.length > 0) return "bad";

    const suspiciousActivities = await db.suspiciousActivity.count({
      where: {
        ip,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    if (suspiciousActivities > 10) return "suspicious";
    return "good";
  }
}
```

### 5. Security Headers Enhancement

#### Current State

- Basic security headers in middleware and next.config.ts

#### Proposed Improvements

**Enhanced Security Headers**

```typescript
// Enhanced security headers configuration
const enhancedSecurityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'wasm-unsafe-eval' https://telegram.org https://vercel.live",
      "style-src 'self' 'unsafe-inline'", // Required for Tailwind
      "img-src 'self' data: blob: https://*.ipfs.io https://*.ipfs.dweb.link https://ipfs.io https://gateway.pinata.cloud https://cloudflare-ipfs.com",
      "connect-src 'self' https://api.mainnet-beta.solana.com https://ton.org https://tonapi.io wss://api.mainnet-beta.solana.com https://*.sentry.io",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
      "report-uri /api/security/csp-report",
    ].join("; "),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "geolocation=(), microphone=(), camera=(), payment=(self)",
  },
  {
    key: "Cross-Origin-Embedder-Policy",
    value: "require-corp",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
];

// CSP violation reporting
export async function cspReportHandler(request: NextRequest) {
  const report = await request.json();

  // Log the violation
  console.warn("CSP Violation:", JSON.stringify(report, null, 2));

  // In production, send to security monitoring service
  await db.cspViolation.create({
    data: {
      documentUri: report["csp-report"]?.["document-uri"],
      violatedDirective: report["csp-report"]?.["violated-directive"],
      effectiveDirective: report["csp-report"]?.["effective-directive"],
      originalPolicy: report["csp-report"]?.["original-policy"],
      blockedUri: report["csp-report"]?.["blocked-uri"],
      sourceFile: report["csp-report"]?.["source-file"],
      lineNumber: report["csp-report"]?.["line-number"],
      columnNumber: report["csp-report"]?.["column-number"],
      statusCode: report["csp-report"]?.["status-code"],
    },
  });

  return new NextResponse(null, { status: 204 });
}
```

### 6. Secret Management

#### Current State

- Basic environment variable validation
- Security check script for hardcoded secrets

#### Proposed Improvements

**Enhanced Secret Management**

```typescript
// Enhanced secret management with rotation and validation
export class SecretManager {
  static async getSecret(name: string): Promise<string | null> {
    // Try environment variable first
    const envValue = process.env[name];
    if (envValue) return envValue;

    // Try secure storage (e.g., AWS Secrets Manager, HashiCorp Vault)
    try {
      // Implementation would depend on chosen secret management service
      // This is a placeholder
      return await this.fetchFromSecureStorage(name);
    } catch (error) {
      console.error(`Failed to fetch secret ${name}:`, error);
      return null;
    }
  }

  static async rotateSecret(name: string): Promise<void> {
    // Generate new secret
    const newSecret = crypto.randomBytes(64).toString("hex");

    // Store in secure storage
    await this.storeInSecureStorage(name, newSecret);

    // Update environment or configuration
    // In production, this would trigger a deployment
    process.env[name] = newSecret;
  }

  private static async fetchFromSecureStorage(name: string): Promise<string> {
    // Implementation for your chosen secret management service
    // Placeholder implementation
    throw new Error("Not implemented");
  }

  private static async storeInSecureStorage(
    name: string,
    value: string
  ): Promise<void> {
    // Implementation for your chosen secret management service
    // Placeholder implementation
    throw new Error("Not implemented");
  }
}
```

### 7. Security Monitoring & Logging

#### Current State

- Basic error reporting with Sentry
- Simple logging

#### Proposed Improvements

**Advanced Security Monitoring**

```typescript
// Security event monitoring and alerting
export class SecurityMonitor {
  static async logSecurityEvent(
    eventType: string,
    userId: string | null,
    details: any
  ): Promise<void> {
    await db.securityEvent.create({
      data: {
        eventType,
        userId,
        details: JSON.stringify(details),
        ipAddress: details.ip,
        userAgent: details.userAgent,
        timestamp: new Date(),
      },
    });

    // Send alerts for critical events
    if (this.isCriticalEvent(eventType)) {
      await this.sendAlert(eventType, userId, details);
    }
  }

  private static isCriticalEvent(eventType: string): boolean {
    const criticalEvents = [
      "failed_login",
      "suspicious_activity",
      "unauthorized_access",
      "data_exfiltration_attempt",
    ];

    return criticalEvents.includes(eventType);
  }

  private static async sendAlert(
    eventType: string,
    userId: string | null,
    details: any
  ): Promise<void> {
    // Integration with alerting systems (Slack, Email, SMS, etc.)
    console.error(`CRITICAL SECURITY EVENT: ${eventType}`, { userId, details });

    // In production, send to monitoring service
    // await sendSlackAlert(eventType, userId, details);
  }
}

// Security middleware with monitoring
export async function securityMiddleware(request: NextRequest) {
  const ip = request.ip || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Log request
  await SecurityMonitor.logSecurityEvent("request", null, {
    ip,
    userAgent,
    method: request.method,
    url: request.url,
    timestamp: new Date(),
  });

  // Continue with other middleware
  return NextResponse.next();
}
```

### 8. Penetration Testing & Security Audits

#### Proposed Implementation

**Automated Security Testing**

```typescript
// Integration with security testing tools
export class SecurityTester {
  static async runOWASPTop10Tests(): Promise<void> {
    // Integration with OWASP ZAP or similar tools
    console.log("Running OWASP Top 10 tests...");

    // 1. Injection testing
    await this.testInjection();

    // 2. Broken authentication testing
    await this.testAuthentication();

    // 3. Sensitive data exposure testing
    await this.testDataExposure();

    // 4. XXE testing
    await this.testXXE();

    // 5. Broken access control testing
    await this.testAccessControl();

    // 6. Security misconfiguration testing
    await this.testMisconfigurations();

    // 7. XSS testing
    await this.testXSS();

    // 8. Insecure deserialization testing
    await this.testDeserialization();

    // 9. Using components with known vulnerabilities testing
    await this.testVulnerableComponents();

    // 10. Insufficient logging & monitoring testing
    await this.testLogging();
  }

  private static async testInjection(): Promise<void> {
    // Test SQL injection, NoSQL injection, OS command injection
    console.log("Testing for injection vulnerabilities...");
  }

  private static async testAuthentication(): Promise<void> {
    // Test for weak authentication, session management issues
    console.log("Testing authentication mechanisms...");
  }

  // Other test methods would be implemented similarly
}
```

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)

- Implement enhanced authentication with MFA and session management
- Deploy improved input validation and sanitization
- Add CSRF protection middleware

### Phase 2: Infrastructure (Weeks 3-4)

- Replace in-memory rate limiter with distributed Redis-based solution
- Implement adaptive rate limiting
- Enhance security headers and add CSP reporting

### Phase 3: Monitoring (Weeks 5-6)

- Deploy security monitoring and alerting system
- Implement advanced secret management
- Set up automated security testing

### Phase 4: Testing & Audit (Weeks 7-8)

- Conduct penetration testing
- Perform security code reviews
- Implement findings from security audits

## Security Best Practices

1. **Principle of Least Privilege**: Ensure all services and users have minimal necessary permissions
2. **Defense in Depth**: Implement multiple layers of security controls
3. **Regular Security Updates**: Keep all dependencies updated and patched
4. **Security Training**: Provide regular security awareness training for developers
5. **Incident Response Plan**: Maintain and regularly test an incident response plan
6. **Data Encryption**: Encrypt sensitive data at rest and in transit
7. **Secure Coding Practices**: Follow secure coding guidelines and perform code reviews
8. **Regular Audits**: Conduct regular security audits and penetration testing

## Conclusion

This security enhancement plan provides a comprehensive roadmap for strengthening the NORMALDANCE platform's security posture. By implementing these improvements systematically, the platform will be better protected against current and emerging security threats while maintaining a positive user experience.

The plan addresses all major areas of concern identified in the current implementation and aligns with industry best practices and security standards including OWASP Top 10, NIST guidelines, and ISO 27001 principles.
