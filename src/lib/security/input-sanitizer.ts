/**
 * Input Sanitization & Validation Utilities
 * Prevents XSS, SQL injection, and other input-based attacks
 */

/**
 * Sanitize user input to prevent XSS
 * Escapes HTML special characters
 *
 * @param input - Raw user input
 * @returns Sanitized string safe for display
 *
 * @example
 * ```typescript
 * const userMessage = sanitizeHTML("<script>alert('xss')</script>");
 * // Returns: "<script>alert('xss')</script>"
 * ```
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Remove all HTML tags from string
 * More aggressive than sanitizeHTML
 *
 * @param input - HTML string
 * @returns Plain text without tags
 *
 * @example
 * ```typescript
 * const clean = stripHTML("<p>Hello <b>world</b></p>");
 * // Returns: "Hello world"
 * ```
 */
export function stripHTML(input: string): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .trim();
}

/**
 * Sanitize for SQL-like queries (for search, etc.)
 * Removes SQL injection patterns
 *
 * @param input - User search query
 * @returns Safe query string
 *
 * @example
 * ```typescript
 * const query = sanitizeSQL("admin' OR '1'='1");
 * // Returns: "admin OR 1=1" (escaped quotes)
 * ```
 */
export function sanitizeSQL(input: string): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/--/g, "") // Remove SQL comments
    .replace(/;/g, "") // Remove statement terminators
    .replace(/\/\*/g, "") // Remove multiline comment start
    .replace(/\*\//g, "") // Remove multiline comment end
    .replace(/xp_/gi, "") // Remove dangerous stored procs
    .replace(/exec/gi, "")
    .replace(/execute/gi, "")
    .replace(/union/gi, "")
    .replace(/select/gi, "")
    .replace(/insert/gi, "")
    .replace(/update/gi, "")
    .replace(/delete/gi, "")
    .replace(/drop/gi, "")
    .replace(/create/gi, "")
    .replace(/alter/gi, "")
    .trim();
}

/**
 * Validate and sanitize URL
 * Prevents javascript: protocol and other dangerous schemes
 *
 * @param input - URL string
 * @param allowedProtocols - Allowed URL protocols
 * @returns Safe URL or null if invalid
 *
 * @example
 * ```typescript
 * const url = sanitizeURL("javascript:alert(1)");
 * // Returns: null
 *
 * const safe = sanitizeURL("https://example.com");
 * // Returns: "https://example.com"
 * ```
 */
export function sanitizeURL(
  input: string,
  allowedProtocols: string[] = ["http", "https", "ipfs"]
): string | null {
  if (typeof input !== "string") return null;

  try {
    const url = new URL(input);

    // Check protocol
    const protocol = url.protocol.replace(":", "").toLowerCase();
    if (!allowedProtocols.includes(protocol)) {
      return null;
    }

    // Remove javascript: and data: protocols
    if (
      url.href.toLowerCase().startsWith("javascript:") ||
      url.href.toLowerCase().startsWith("data:") ||
      url.href.toLowerCase().startsWith("vbscript:")
    ) {
      return null;
    }

    return url.href;
  } catch {
    return null; // Invalid URL
  }
}

/**
 * Sanitize filename for safe file system operations
 * Prevents path traversal attacks
 *
 * @param filename - User-provided filename
 * @returns Safe filename without path traversal
 *
 * @example
 * ```typescript
 * const safe = sanitizeFilename("../../etc/passwd");
 * // Returns: "etc-passwd"
 * ```
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== "string") return "";

  return filename
    .replace(/\.\./g, "") // Remove parent directory references
    .replace(/\//g, "-") // Replace forward slashes
    .replace(/\\/g, "-") // Replace backslashes
    .replace(/:/g, "-") // Replace colons (Windows drive letters)
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Remove special chars
    .replace(/[-_]+/g, (match) => match[0]) // Collapse multiple dashes/underscores to single
    .replace(/^[\-_\.]+/, "") // Remove leading dashes, underscores, and dots
    .substring(0, 255); // Limit length
}

/**
 * Validate email address format
 *
 * @param email - Email string
 * @returns true if valid email format
 *
 * @example
 * ```typescript
 * isValidEmail("user@example.com"); // true
 * isValidEmail("invalid.email"); // false
 * ```
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate Solana address format
 *
 * @param address - Solana public key string
 * @returns true if valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  if (typeof address !== "string") return false;

  // Solana addresses are base58 encoded, 32-44 characters
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return solanaRegex.test(address);
}

/**
 * Validate TON address format
 *
 * @param address - TON address string
 * @returns true if valid TON address
 */
export function isValidTONAddress(address: string): boolean {
  if (typeof address !== "string") return false;

  // TON addresses start with EQ or UQ (bounceable/non-bounceable)
  // followed by base64url encoded 44 characters
  const tonRegex = /^(EQ|UQ)[A-Za-z0-9_-]{46}$/;
  return tonRegex.test(address);
}

/**
 * Validate Ethereum address format
 *
 * @param address - Ethereum address string
 * @returns true if valid Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  if (typeof address !== "string") return false;

  // Ethereum addresses are 0x followed by 40 hex characters
  const ethRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethRegex.test(address);
}

/**
 * Validate IPFS CID format
 *
 * @param cid - IPFS Content Identifier
 * @returns true if valid CID
 */
export function isValidIPFSCID(cid: string): boolean {
  if (typeof cid !== "string") return false;

  // CIDv0 starts with Qm (46 characters base58)
  // CIDv1 starts with b (variable length base32/base58)
  const cidV0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  const cidV1Regex = /^b[a-z2-7]{58,}$/;

  return cidV0Regex.test(cid) || cidV1Regex.test(cid);
}

/**
 * Rate limiting helper (client-side)
 * Prevents abuse by tracking action frequency
 *
 * @param key - Unique key for action
 * @param maxActions - Max actions allowed in time window
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limit exceeded
 *
 * @example
 * ```typescript
 * if (isRateLimited('donate-action', 5, 60000)) {
 *   toast.error('Too many requests. Please wait.');
 *   return;
 * }
 *
 * // Proceed with action
 * ```
 */
const rateLimitStore = new Map<string, number[]>();

export function isRateLimited(
  key: string,
  maxActions: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const timestamps = rateLimitStore.get(key) || [];

  // Filter out old timestamps
  const recentTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (recentTimestamps.length >= maxActions) {
    return true; // Rate limit exceeded
  }

  // Add current timestamp
  recentTimestamps.push(now);
  rateLimitStore.set(key, recentTimestamps);

  return false;
}

/**
 * Validate numeric input with range
 *
 * @param value - Input value
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Validated number or null if invalid
 *
 * @example
 * ```typescript
 * const amount = validateNumber(userInput, 0.01, 1000);
 * if (amount === null) {
 *   return res.status(400).json({ error: 'Invalid amount' });
 * }
 * ```
 */
export function validateNumber(
  value: unknown,
  min?: number,
  max?: number
): number | null {
  const num = Number(value);

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  if (min !== undefined && num < min) {
    return null;
  }

  if (max !== undefined && num > max) {
    return null;
  }

  return num;
}

/**
 * Validate string length
 *
 * @param value - String value
 * @param minLength - Minimum length
 * @param maxLength - Maximum length
 * @returns true if valid
 */
export function validateStringLength(
  value: string,
  minLength: number,
  maxLength: number
): boolean {
  if (typeof value !== "string") return false;
  return value.length >= minLength && value.length <= maxLength;
}

/**
 * Detect suspicious patterns in user input
 * Returns warnings for potentially malicious content
 *
 * @param input - User input string
 * @returns Array of warnings, empty if safe
 */
export function detectSuspiciousPatterns(input: string): string[] {
  const warnings: string[] = [];

  if (typeof input !== "string") return ["Invalid input type"];

  // Check for script tags
  if (/<script[\s\S]*?>/i.test(input)) {
    warnings.push("Script tag detected");
  }

  // Check for event handlers
  if (/on\w+\s*=/i.test(input)) {
    warnings.push("Event handler detected");
  }

  // Check for javascript: protocol
  if (/javascript:/i.test(input)) {
    warnings.push("JavaScript protocol detected");
  }

  // Check for SQL injection patterns
  if (/(\bor\b|\band\b).*=.*('|")/i.test(input)) {
    warnings.push("Possible SQL injection pattern");
  }

  // Check for path traversal
  if (/\.\.[\/\\]/.test(input)) {
    warnings.push("Path traversal pattern detected");
  }

  // Check for command injection
  if (/[;&|`$(){}[\]]/.test(input)) {
    warnings.push("Command injection characters detected");
  }

  return warnings;
}

// Legacy aliases for backward compatibility
export const escapeHtml = sanitizeHTML;
export const stripHtml = stripHTML;
export const sanitizeUrl = sanitizeURL;
export const sanitizeSql = sanitizeSQL;
