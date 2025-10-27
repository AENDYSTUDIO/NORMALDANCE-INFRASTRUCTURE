/**
<<<<<<< HEAD
 * Легаси-утилиты санитизации ввода (совместимость).
 * Этот модуль преобразован в тонкие обёртки над актуальными реализациями из sanitize.ts/xss-csrf.ts,
 * чтобы устранить дублирование кода. Некоторые функции оставлены как легаси-валидаторы
 * для обратной совместимости (email/wallet/IPFS).
 *
 * Рекомендация: используйте импорт из "@/lib/security" (index.ts), а не из этого файла напрямую.
 * Современные API:
 * - escapeHTML / stripDangerousHtml / sanitizeURL / sanitizeFilename — из [TypeScript.sanitize](src/lib/security/sanitize.ts:1)
 * - XSS/CSRF — из [TypeScript.xssCsrf](src/lib/security/xss-csrf.ts:1)
 * - Базовая валидация — [TypeScript.BaseValidator<TInput,TOutput>](src/lib/security/BaseValidator.ts:69)
 */

import {
  escapeHTML as escapeHTMLNew,
  sanitizeFilename as sanitizeFilenameNew,
  sanitizeURL as sanitizeURLNew,
  stripDangerousHtml as stripDangerousHtmlNew,
} from "./sanitize";

/**
 * Мягкое предупреждение о депрекеейте (одноразово).
 * Легаси-модуль input-sanitizer.ts будет удалён в версии v2.0.0.
 * Сроки: предупреждение активировано с 2025-10-26, удаление планируется на 2026-03-31.
 * Шаги миграции:
 * - Замените прямые импорты из "src/lib/security/input-sanitizer.ts" на импорт из "@/lib/security".
 * - Функции: sanitizeHTML -> escapeHTML, stripHTML -> stripDangerousHtml, sanitizeURL -> sanitizeURL, sanitizeSQL -> sanitizeSQL.
 * - Валидации переносите на новый API (BaseValidator, SecurityManager) из "@/lib/security".
 */
const LEGACY_SECURITY_MODULE = "src/lib/security/input-sanitizer.ts";
let __legacySecurityWarned = false;
function __warnLegacySecurityUsage(): void {
  // tslint:disable-next-line:no-console
  console.warn(
    "[NORMALDANCE][SECURITY] Используется легаси-модуль 'src/lib/security/input-sanitizer.ts'. " +
      "Модуль будет удалён в релизе v2.0.0 (2026-03-31). " +
      "Переходите на импорты из '@/lib/security' и новые функции из sanitize.ts/xss-csrf.ts."
  );
}
(() => {
  const env: Record<string, string | undefined> =
    typeof process !== "undefined" && (process as any).env
      ? ((process as any).env as Record<string, string | undefined>)
      : {};
  const NODE_ENV = env["NODE_ENV"];
  const LEGACY_WARN = env["SECURITY_LEGACY_WARNINGS"];
  const FORCE = LEGACY_WARN === "on" || LEGACY_WARN === "force";
  // В тестах предупреждения отключены, но могут быть принудительно включены переменной SECURITY_LEGACY_WARNINGS=on|force
  if ((NODE_ENV !== "test" || FORCE) && LEGACY_WARN !== "off") {
    if (!__legacySecurityWarned) {
      __legacySecurityWarned = true;
      __warnLegacySecurityUsage();
    }
  }
})();

/**
 * Санитайзер HTML (легаси-алиас).
 * Делегирует в актуальную функцию escapeHTML.
 *
 * @param input Строка пользовательского ввода
 * @returns Экранированный HTML-текст
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== "string") return "";
  return escapeHTMLNew(input);
}

/**
 * Удаление опасных HTML-фрагментов (легаси-алиас).
 * Делегирует в актуальную функцию stripDangerousHtml.
 *
 * @param input HTML-строка
 * @returns Строка без опасных конструкций
 */
export function stripHTML(input: string): string {
  if (typeof input !== "string") return "";
  return stripDangerousHtmlNew(input);
}

/**
 * Санитизация для SQL-подобных строк (ЛЕГАСИ).
 * Предназначено только для пользовательского ввода в логах/сообщениях и т.п.
 * НЕ применять для реальных SQL — используйте параметризацию ORM/Prepared Statements.
 *
 * @param input Ввод пользователя
 * @returns Строка с экранированными опасными символами
 */
export function sanitizeSQL(input: string): string {
  // Handle non-string inputs
  if (typeof input !== "string") {
    if (input === null || input === undefined) {
      return "";
    }
    return String(input);
  }

  let result = input;
  
  // First escape single quotes
  result = result.replace(/'/g, "''");
  
  // Remove SQL comments
  result = result.replace(/--.*$/gm, ""); // -- style comments
  result = result.replace(/\/\*.*?\*\//gs, ""); // /* */ style comments
  
  // Remove dangerous keywords but preserve non-keyword content
  result = result.replace(/\bDROP\b/gi, "");
  result = result.replace(/\bEXEC\b/gi, "");
  result = result.replace(/\bEXECUTE\b/gi, "");
  result = result.replace(/\bUNION\b/gi, "");
  result = result.replace(/\bSELECT\b/gi, "");
  result = result.replace(/\bINSERT\b/gi, "");
  result = result.replace(/\bINTO\b/gi, "");
  result = result.replace(/\bUPDATE\b/gi, "");
  result = result.replace(/\bSET\b/gi, "");
  result = result.replace(/\bDELETE\b/gi, "");
  result = result.replace(/\bFROM\b/gi, "");
  result = result.replace(/\bCREATE\b/gi, "");
  result = result.replace(/\bALTER\b/gi, "");
  
  // Handle special cases for SQL injection attempts
  result = result.replace(/''\s+(OR|AND)\s+''/gi, " $1 "); // "' OR '" -> " OR "
  result = result.replace(/''--/g, ""); // "'--" -> ""
  
  // Clean up extra spaces and trim
  result = result.replace(/\s+/g, " ").trim();
  result = result.replace(/\s*;\s*/g, "; "); // Normalize semicolons
  result = result.replace(/;\s*$/g, ""); // Remove trailing semicolon
  
  return result;
}

/**
 * Санитизация URL (легаси-алиас).
 * Делегирует в актуальную sanitizeURL с whitelist протоколов.
 *
 * @param input URL-строка
 * @param allowedProtocols Разрешённые протоколы (по умолчанию: http/https/ipfs)
 * @returns Безопасный URL или null
 */
export function sanitizeURL(
  input: string,
  allowedProtocols: string[] = ["http", "https", "ipfs"]
): string | null {
  return sanitizeURLNew(input, allowedProtocols);
}

/**
 * Санитизация имени файла (легаси-алиас).
 * Делегирует в актуальную реализацию sanitizeFilename.
 *
 * @param filename Имя файла от пользователя
 * @returns Безопасное имя файла
 */
export function sanitizeFilename(filename: string): string {
  return sanitizeFilenameNew(filename);
}

/**
 * Проверка формата email (легаси).
 *
 * @param email Email-строка
 * @returns true если формат корректный
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false;
=======
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
 * // Returns: "&lt;script&gt;alert('xss')&lt;/script&gt;"
 * ```
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
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
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
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
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/;/g, '') // Remove statement terminators
    .replace(/\/\*/g, '') // Remove multiline comment start
    .replace(/\*\//g, '') // Remove multiline comment end
    .replace(/xp_/gi, '') // Remove dangerous stored procs
    .replace(/exec/gi, '')
    .replace(/execute/gi, '')
    .replace(/union/gi, '')
    .replace(/select/gi, '')
    .replace(/insert/gi, '')
    .replace(/update/gi, '')
    .replace(/delete/gi, '')
    .replace(/drop/gi, '')
    .replace(/create/gi, '')
    .replace(/alter/gi, '')
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
  allowedProtocols: string[] = ['http', 'https', 'ipfs']
): string | null {
  if (typeof input !== 'string') return null;
  
  try {
    const url = new URL(input);
    
    // Check protocol
    const protocol = url.protocol.replace(':', '').toLowerCase();
    if (!allowedProtocols.includes(protocol)) {
      return null;
    }
    
    // Remove javascript: and data: protocols
    if (
      url.href.toLowerCase().startsWith('javascript:') ||
      url.href.toLowerCase().startsWith('data:') ||
      url.href.toLowerCase().startsWith('vbscript:')
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
  if (typeof filename !== 'string') return '';
  
  return filename
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/\//g, '-') // Replace forward slashes
    .replace(/\\/g, '-') // Replace backslashes  
    .replace(/:/g, '-') // Replace colons (Windows drive letters)
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Remove special chars
    .replace(/[-_]+/g, (match) => match[0]) // Collapse multiple dashes/underscores to single
    .replace(/^[\-_\.]+/, '') // Remove leading dashes, underscores, and dots
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
  if (typeof email !== 'string') return false;
  
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
<<<<<<< HEAD
 * Проверка формата адреса Solana (легаси).
 *
 * @param address Публичный ключ Solana в base58
 * @returns true если формат корректный
 */
export function isValidSolanaAddress(address: string): boolean {
  if (typeof address !== "string") return false;
=======
 * Validate Solana address format
 * 
 * @param address - Solana public key string
 * @returns true if valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  if (typeof address !== 'string') return false;
  
  // Solana addresses are base58 encoded, 32-44 characters
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return solanaRegex.test(address);
}

/**
<<<<<<< HEAD
 * Проверка формата адреса TON (легаси).
 *
 * @param address Адрес TON (EQ/UQ + base64url)
 * @returns true если формат корректный
 */
export function isValidTONAddress(address: string): boolean {
  if (typeof address !== "string") return false;
=======
 * Validate TON address format
 * 
 * @param address - TON address string
 * @returns true if valid TON address
 */
export function isValidTONAddress(address: string): boolean {
  if (typeof address !== 'string') return false;
  
  // TON addresses start with EQ or UQ (bounceable/non-bounceable)
  // followed by base64url encoded 44 characters
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
  const tonRegex = /^(EQ|UQ)[A-Za-z0-9_-]{46}$/;
  return tonRegex.test(address);
}

/**
<<<<<<< HEAD
 * Проверка формата адреса Ethereum (легаси).
 *
 * @param address Адрес Ethereum (0x + 40 hex)
 * @returns true если формат корректный
 */
export function isValidEthereumAddress(address: string): boolean {
  if (typeof address !== "string") return false;
=======
 * Validate Ethereum address format
 * 
 * @param address - Ethereum address string
 * @returns true if valid Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  if (typeof address !== 'string') return false;
  
  // Ethereum addresses are 0x followed by 40 hex characters
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
  const ethRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethRegex.test(address);
}

/**
<<<<<<< HEAD
 * Проверка формата IPFS CID (легаси).
 * CIDv0: Qm... (base58, 46 символов)
 * CIDv1: b... (base32/base58, переменная длина)
 *
 * @param cid Content Identifier
 * @returns true если формат корректный
 */
export function isValidIPFSCID(cid: string): boolean {
  if (typeof cid !== "string") return false;
  const cidV0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  const cidV1Regex = /^b[a-z2-7]{58,}$/;
=======
 * Validate IPFS CID format
 * 
 * @param cid - IPFS Content Identifier
 * @returns true if valid CID
 */
export function isValidIPFSCID(cid: string): boolean {
  if (typeof cid !== 'string') return false;
  
  // CIDv0 starts with Qm (46 characters base58)
  // CIDv1 starts with b (variable length base32/base58)
  const cidV0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  const cidV1Regex = /^b[a-z2-7]{58,}$/;
  
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
  return cidV0Regex.test(cid) || cidV1Regex.test(cid);
}

/**
<<<<<<< HEAD
 * ВНИМАНИЕ: функции client-side rate limiting, validateNumber, validateStringLength,
 * detectSuspiciousPatterns удалены для устранения дублирования.
 * Используйте:
 * - Rate limiting: [TypeScript.rate-limiter](src/lib/security/rate-limiter.ts:1)
 * - Валидацию чисел и строк: адаптируйте через BaseValidator или InputValidator (легаси).
 */

// Легаси алиасы имён (camelCase) для обратной совместимости.
// Рекомендуется переходить на новые имена из "@/lib/security".
export const escapeHtml = sanitizeHTML;
export const stripHtml = stripHTML;
export const sanitizeUrl = sanitizeURL;
export const sanitizeSql = sanitizeSQL;
=======
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
  const recentTimestamps = timestamps.filter(t => now - t < windowMs);
  
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
  if (typeof value !== 'string') return false;
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
  
  if (typeof input !== 'string') return ['Invalid input type'];
  
  // Check for script tags
  if (/<script[\s\S]*?>/i.test(input)) {
    warnings.push('Script tag detected');
  }
  
  // Check for event handlers
  if (/on\w+\s*=/i.test(input)) {
    warnings.push('Event handler detected');
  }
  
  // Check for javascript: protocol
  if (/javascript:/i.test(input)) {
    warnings.push('JavaScript protocol detected');
  }
  
  // Check for SQL injection patterns
  if (/(\bor\b|\band\b).*=.*('|")/i.test(input)) {
    warnings.push('Possible SQL injection pattern');
  }
  
  // Check for path traversal
  if (/\.\.[\/\\]/.test(input)) {
    warnings.push('Path traversal pattern detected');
  }
  
  // Check for command injection
  if (/[;&|`$(){}[\]]/.test(input)) {
    warnings.push('Command injection characters detected');
  }
  
  return warnings;
}
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
