/**
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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Проверка формата адреса Solana (легаси).
 *
 * @param address Публичный ключ Solana в base58
 * @returns true если формат корректный
 */
export function isValidSolanaAddress(address: string): boolean {
  if (typeof address !== "string") return false;
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return solanaRegex.test(address);
}

/**
 * Проверка формата адреса TON (легаси).
 *
 * @param address Адрес TON (EQ/UQ + base64url)
 * @returns true если формат корректный
 */
export function isValidTONAddress(address: string): boolean {
  if (typeof address !== "string") return false;
  const tonRegex = /^(EQ|UQ)[A-Za-z0-9_-]{46}$/;
  return tonRegex.test(address);
}

/**
 * Проверка формата адреса Ethereum (легаси).
 *
 * @param address Адрес Ethereum (0x + 40 hex)
 * @returns true если формат корректный
 */
export function isValidEthereumAddress(address: string): boolean {
  if (typeof address !== "string") return false;
  const ethRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethRegex.test(address);
}

/**
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
  return cidV0Regex.test(cid) || cidV1Regex.test(cid);
}

/**
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
