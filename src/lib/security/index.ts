/**
 * Единая точка входа для модулей безопасности NORMALDANCE.
 * Публичные экспорты: санитизация, XSS/CSRF, интерфейсы, менеджер, валидаторы, rate-limiter, телеграм-валидатор.
 *
 * Мягкие рекомендации по миграции:
 * - Используйте [TypeScript.SecurityManager](src/lib/security/SecurityManager.ts:1) для интеграции заголовков и CSRF-потоков.
 * - Санитизация: [TypeScript.sanitize](src/lib/security/sanitize.ts:1) и [TypeScript.xssCsrf](src/lib/security/xss-csrf.ts:611).
 * - Интерфейсы и базовые классы: [TypeScript.ISecurityService](src/lib/security/ISecurityService.ts:1), [TypeScript.BaseValidator<TInput,TOutput>](src/lib/security/BaseValidator.ts:69).
 */

// Санитизация и XSS/CSRF
export * from "./sanitize";
// Явные экспорты из xss-csrf для избежания конфликта имён с sanitize
export {
  buildSetCookieHeader,
  extractCsrfFromRequestLike,
  generateCsrfToken,
  issueCsrfForResponse,
  normalizeCsrfConfig,
  parseCookiesHeader,
  verifyCsrfDoubleSubmit,
  verifyCsrfToken,
  xssCsrf,
} from "./xss-csrf";

export type {
  CsrfConfig,
  CsrfGenerateResult,
  CsrfVerifyCode,
  CsrfVerifyInput,
  CsrfVerifyResult,
  EscapeOptions,
  SameSiteOption,
  XssContext,
} from "./xss-csrf";

// Интерфейсы и типы
export * from "./ISecurityService";

// Менеджер и базовый валидатор
export { BaseValidator } from "./BaseValidator";
/**
 * TODO: Экспорт SecurityManager временно отключён до завершения реализации класса в
 * [TypeScript.SecurityManager.ts](src/lib/security/SecurityManager.ts:1).
 * Индекс остаётся единой точкой входа для остальных модулей безопасности.
 */
// export { SecurityManager } from "./SecurityManager";

// Лимиты и телеграм-валидатор
export * from "./rate-limiter";
export * from "./telegram-validator";

// Дополнительные утилиты безопасности
export { validateNumber, detectSuspiciousPatterns } from "./security-utils";

// Легаси-реэкспорты для обратной совместимости:
// - sanitizeHTML: алиас для escapeHTML
// - stripHTML: алиас для stripDangerousHtml
export {
  escapeHTML as escapeHtml,
  escapeHTML as sanitizeHTML,
} from "./sanitize";
export {
  stripDangerousHtml as stripHTML,
  stripDangerousHtml as stripHtml,
} from "./xss-csrf";
// Дополнительные алиасы для старых имён функций (camelCase)
export { sanitizeSQL as sanitizeSql } from "./input-sanitizer";
export { sanitizeURL as sanitizeUrl } from "./sanitize";

// Легаси-класс и утилиты без конфликтов имён:
// - InputValidator: упрощённый валидатор без внешних зависимостей
export { InputValidator } from "./input-validator";
// - Проверки форматов кошельков/emails/CID и SQL-эскейп
export {
  isValidEmail,
  isValidEthereumAddress,
  isValidIPFSCID,
  isValidSolanaAddress,
  isValidTONAddress,
  sanitizeSQL,
} from "./input-sanitizer";
// Алиас типа, чтобы избежать конфликта с ValidationResult из telegram-validator
export type { ValidationResult as InputValidationResult } from "./input-validator";

/**
 * ВНИМАНИЕ: легаси пути импорта.
 * Если вы ранее импортировали из отдельных файлов (например, input-sanitizer.ts),
 * рекомендуется перейти на импорты из этого индекса.
 *
 * Примеры:
 * - import { sanitize, xssCsrf, SecurityManager } from '@/lib/security';
 * - import { ISecurityService, BaseValidator } from '@/lib/security';
 *
 * Депрекейт-план:
 * - Предупреждения активны: с 2025-10-26.
 * - Удаление легаси-реализаций: v2.0.0, плановая дата 2026-03-31.
 *
 * Шаги миграции:
 * 1) Замените импорты из 'src/lib/security/input-sanitizer.ts' и 'src/lib/security/input-validator.ts'
 *    на импорты из '@/lib/security'.
 * 2) Замены имён функций:
 *    - sanitizeHTML -> escapeHTML (также доступен алиас escapeHtml)
 *    - stripHTML -> stripDangerousHtml (также доступен алиас stripHtml)
 *    - sanitizeURL -> sanitizeURL (также доступен алиас sanitizeUrl)
 *    - sanitizeSQL -> sanitizeSQL (также доступен алиас sanitizeSql)
 * 3) Для продвинутой валидации используйте [TypeScript.BaseValidator<TInput,TOutput>](src/lib/security/BaseValidator.ts:69)
 *    и менеджер [TypeScript.SecurityManager](src/lib/security/SecurityManager.ts:1).
 *
 * @deprecated since v1.5.0 - Используйте импорты из '@/lib/security' вместо прямых импортов из файлов
 */
export const LEGACY_IMPORT_WARNING = "Используйте импорты из '@/lib/security' вместо прямых импортов из файлов";

console.warn("[NORMALDANCE][SECURITY] Использование прямых импортов из файлов безопасности устарело. Используйте '@/lib/security' вместо этого.");