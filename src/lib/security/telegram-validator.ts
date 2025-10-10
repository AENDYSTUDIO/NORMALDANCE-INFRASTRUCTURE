/**
 * Telegram Mini App Security Validator
 * Validates initData HMAC signature to prevent user impersonation
 * 
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
 */

import crypto from 'crypto';

export interface ValidationResult {
  valid: boolean;
  userId?: string;
  username?: string;
  error?: string;
  timestamp?: number;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

/**
 * Validates Telegram Web App initData
 * 
 * @param initData - Raw initData string from Telegram.WebApp.initData
 * @param botToken - Your Telegram bot token (keep secret!)
 * @param maxAge - Maximum age of initData in seconds (default: 3600 = 1 hour)
 * @returns ValidationResult with userId if valid
 * 
 * @example
 * ```typescript
 * const result = validateTelegramInitData(
 *   request.headers.get('x-telegram-init-data'),
 *   process.env.TELEGRAM_BOT_TOKEN!,
 *   3600
 * );
 * 
 * if (!result.valid) {
 *   return Response.json({ error: result.error }, { status: 401 });
 * }
 * 
 * // User is authenticated
 * console.log('User ID:', result.userId);
 * ```
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAge: number = 3600
): ValidationResult {
  try {
    // Parse URLSearchParams
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    const authDate = params.get('auth_date');
    
    if (!hash) {
      return { 
        valid: false, 
        error: 'Missing hash parameter' 
      };
    }
    
    if (!authDate) {
      return { 
        valid: false, 
        error: 'Missing auth_date parameter' 
      };
    }
    
    // Check timestamp (prevent replay attacks)
    const authTimestamp = parseInt(authDate);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    if (isNaN(authTimestamp)) {
      return { 
        valid: false, 
        error: 'Invalid auth_date format' 
      };
    }
    
    if (currentTimestamp - authTimestamp > maxAge) {
      return { 
        valid: false, 
        error: `initData expired (older than ${maxAge}s)` 
      };
    }
    
    // Remove hash from params and sort alphabetically
    params.delete('hash');
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b));
    
    // Create data check string
    const dataCheckString = sortedParams
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Compute HMAC-SHA256
    // Step 1: Create secret key from bot token
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    
    // Step 2: Create hash from data check string
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    // Step 3: Compare hashes (constant-time comparison)
    // First check if hashes have same length (timingSafeEqual requirement)
    const hashBuffer = Buffer.from(hash, 'hex');
    const computedHashBuffer = Buffer.from(computedHash, 'hex');
    
    if (hashBuffer.length !== computedHashBuffer.length) {
      return { 
        valid: false, 
        error: 'Invalid signature - possible tampering detected' 
      };
    }
    
    if (!crypto.timingSafeEqual(hashBuffer, computedHashBuffer)) {
      return { 
        valid: false, 
        error: 'Invalid signature - possible tampering detected' 
      };
    }
    
    // Extract user information
    const userParam = params.get('user');
    if (!userParam) {
      return { 
        valid: true, 
        userId: undefined,
        timestamp: authTimestamp
      };
    }
    
    try {
      const user: TelegramUser = JSON.parse(userParam);
      return { 
        valid: true, 
        userId: user.id.toString(),
        username: user.username,
        timestamp: authTimestamp
      };
    } catch {
      return { 
        valid: true, 
        userId: undefined,
        timestamp: authTimestamp
      };
    }
    
  } catch (error) {
    console.error('[TelegramValidator] Unexpected error:', error);
    return { 
      valid: false, 
      error: 'Validation failed due to internal error' 
    };
  }
}

/**
 * Middleware-style validator for API routes
 * 
 * @example
 * ```typescript
 * // In API route
 * export async function POST(request: Request) {
 *   const validation = await validateTelegramRequest(request);
 *   if (!validation.valid) {
 *     return Response.json({ error: validation.error }, { status: 401 });
 *   }
 *   
 *   // User authenticated, proceed...
 *   const userId = validation.userId;
 * }
 * ```
 */
export async function validateTelegramRequest(
  request: Request
): Promise<ValidationResult> {
  const initData = request.headers.get('x-telegram-init-data');
  
  if (!initData) {
    return { 
      valid: false, 
      error: 'Missing x-telegram-init-data header' 
    };
  }
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.error('[TelegramValidator] TELEGRAM_BOT_TOKEN not configured!');
    return { 
      valid: false, 
      error: 'Server configuration error' 
    };
  }
  
  return validateTelegramInitData(initData, botToken);
}

/**
 * Extract user ID from initData without full validation
 * WARNING: Use only after validation! Do not trust without validateTelegramInitData
 * 
 * @param initData - initData string
 * @returns userId or null
 */
export function extractUserId(initData: string): string | null {
  try {
    const params = new URLSearchParams(initData);
    const userParam = params.get('user');
    if (!userParam) return null;
    
    const user = JSON.parse(userParam);
    return user.id?.toString() || null;
  } catch {
    return null;
  }
}

/**
 * Check if initData is expired
 * 
 * @param initData - initData string
 * @param maxAge - max age in seconds
 * @returns true if expired
 */
export function isInitDataExpired(
  initData: string,
  maxAge: number = 3600
): boolean {
  try {
    const params = new URLSearchParams(initData);
    const authDate = params.get('auth_date');
    if (!authDate) return true;
    
    const authTimestamp = parseInt(authDate);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    return currentTimestamp - authTimestamp > maxAge;
  } catch {
    return true;
  }
}
