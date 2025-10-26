/**
 * Input Validation and Sanitization
 * Prevents injection attacks and validates user input
 */

<<<<<<< HEAD
import {
  isValidEmail as isValidEmailLegacy,
  isValidSolanaAddress as isValidSolanaAddressLegacy,
  sanitizeSQL as sanitizeSQLLegacy,
} from "./input-sanitizer";
import { escapeHTML, stripDangerousHtml } from "./sanitize";

/**
 * Депрекейт: модуль 'src/lib/security/input-validator.ts' будет переведён в режим совместимости.
 * Сроки миграции: предупреждение активно с 2025-10-26, удаление легаси-реализаций планируется на 2026-03-31 (v2.0.0).
 * Рекомендации по миграции:
 * - Импортируйте валидаторы и санитайзеры из "@/lib/security" (index.ts), а не напрямую из этого файла.
 * - Используйте BaseValidator/SecurityManager для современных сценариев валидации и CSRF/XSS потоков.
 * - Алиасы для старых имён методов добавлены ниже для совместимости.
 */
const LEGACY_SECURITY_MODULE_IV = "src/lib/security/input-validator.ts";
let __legacyInputValidatorWarned = false;
function __warnLegacyInputValidator(): void {
  // tslint:disable-next-line:no-console
  console.warn(
    "[NORMALDANCE][SECURITY] Используется легаси-модуль 'src/lib/security/input-validator.ts'. " +
      "Легаси-реализации будут удалены в v2.0.0 (2026-03-31). " +
      "Переходите на импорты из '@/lib/security' и новые API BaseValidator/SecurityManager."
  );
}
(() => {
  const env: Record<string, string | undefined> =
    typeof process !== "undefined" && (process as any).env
      ? ((process as any).env as Record<string, string | undefined>)
      : {};
  const NODE_ENV = env["NODE_ENV"];
  const LEGACY_WARN = env["SECURITY_LEGACY_WARNINGS"];
  if (NODE_ENV !== "test" && LEGACY_WARN !== "off") {
    if (!__legacyInputValidatorWarned) {
      __legacyInputValidatorWarned = true;
      __warnLegacyInputValidator();
    }
  }
})();
=======
import DOMPurify from 'isomorphic-dompurify';
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337

export interface ValidationResult {
  isValid: boolean;
  sanitized?: string;
  errors?: string[];
}

export class InputValidator {
  // Sanitize HTML content to prevent XSS
  static sanitizeHtml(input: string): string {
<<<<<<< HEAD
    if (typeof input !== "string") return "";
    return escapeHTML(stripDangerousHtml(input));
  }

  // Validate and sanitize text input
  static validateText(
    input: string,
    maxLength: number = 1000
  ): ValidationResult {
    if (!input || typeof input !== "string") {
      return { isValid: false, errors: ["Input must be a non-empty string"] };
    }

    const cleaned = stripDangerousHtml(input).trim();

    if (cleaned.length > maxLength) {
      return {
        isValid: false,
        errors: [`Input exceeds maximum length of ${maxLength}`],
      };
    }

    return { isValid: true, sanitized: cleaned };
=======
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }

  // Validate and sanitize text input
  static validateText(input: string, maxLength: number = 1000): ValidationResult {
    if (!input || typeof input !== 'string') {
      return { isValid: false, errors: ['Input must be a non-empty string'] };
    }

    if (input.length > maxLength) {
      return { isValid: false, errors: [`Input exceeds maximum length of ${maxLength}`] };
    }

    // Remove potential script tags and dangerous characters
    const sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();

    return { isValid: true, sanitized };
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
  }

  // Validate email format
  static validateEmail(email: string): ValidationResult {
<<<<<<< HEAD
    if (!email || typeof email !== "string") {
      return { isValid: false, errors: ["Email is required"] };
    }

    if (!isValidEmailLegacy(email)) {
      return { isValid: false, errors: ["Invalid email format"] };
=======
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || typeof email !== 'string') {
      return { isValid: false, errors: ['Email is required'] };
    }

    if (!emailRegex.test(email)) {
      return { isValid: false, errors: ['Invalid email format'] };
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
    }

    return { isValid: true, sanitized: email.toLowerCase().trim() };
  }

  // Validate wallet address
  static validateWalletAddress(address: string): ValidationResult {
<<<<<<< HEAD
    if (!address || typeof address !== "string") {
      return { isValid: false, errors: ["Wallet address is required"] };
    }

    if (!isValidSolanaAddressLegacy(address)) {
      return { isValid: false, errors: ["Invalid wallet address format"] };
=======
    if (!address || typeof address !== 'string') {
      return { isValid: false, errors: ['Wallet address is required'] };
    }

    // Basic Solana address validation (base58, 32-44 chars)
    const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    
    if (!solanaRegex.test(address)) {
      return { isValid: false, errors: ['Invalid wallet address format'] };
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
    }

    return { isValid: true, sanitized: address.trim() };
  }

  // Validate numeric input
<<<<<<< HEAD
  static validateNumber(
    input: unknown,
    min?: number,
    max?: number
  ): ValidationResult {
    const num = Number(input);

    if (isNaN(num)) {
      return { isValid: false, errors: ["Input must be a valid number"] };
=======
  static validateNumber(input: unknown, min?: number, max?: number): ValidationResult {
    const num = Number(input);
    
    if (isNaN(num)) {
      return { isValid: false, errors: ['Input must be a valid number'] };
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
    }

    if (min !== undefined && num < min) {
      return { isValid: false, errors: [`Number must be at least ${min}`] };
    }

    if (max !== undefined && num > max) {
      return { isValid: false, errors: [`Number must not exceed ${max}`] };
    }

    return { isValid: true, sanitized: num.toString() };
  }

  // Validate file upload
<<<<<<< HEAD
  static validateFile(
    file: File,
    allowedTypes: string[],
    maxSize: number
  ): ValidationResult {
    if (!file) {
      return { isValid: false, errors: ["File is required"] };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        errors: [`File type ${file.type} is not allowed`],
      };
=======
  static validateFile(file: File, allowedTypes: string[], maxSize: number): ValidationResult {
    if (!file) {
      return { isValid: false, errors: ['File is required'] };
    }

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, errors: [`File type ${file.type} is not allowed`] };
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
    }

    if (file.size > maxSize) {
      return { isValid: false, errors: [`File size exceeds ${maxSize} bytes`] };
    }

    return { isValid: true };
  }

  // Prevent SQL injection by escaping special characters
  static escapeSql(input: string): string {
<<<<<<< HEAD
    return sanitizeSQLLegacy(input);
=======
    return input.replace(/'/g, "''").replace(/;/g, '\\;');
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
  }

  // Validate JSON input
  static validateJson(input: string): ValidationResult {
    try {
      const parsed = JSON.parse(input);
      return { isValid: true, sanitized: JSON.stringify(parsed) };
    } catch (error) {
<<<<<<< HEAD
      return { isValid: false, errors: ["Invalid JSON format"] };
    }
  }

  // ---- ЛЕГАСИ АЛИАСЫ МЕТОДОВ (для обратной совместимости) ----
  /**
   * Алиас старого имени: sanitizeHTML -> sanitizeHtml
   */
  static sanitizeHTML(input: string): string {
    return InputValidator.sanitizeHtml(input);
  }

  /**
   * Алиас старого имени: sanitizeSQL -> escapeSql
   */
  static sanitizeSQL(input: string): string {
    return InputValidator.escapeSql(input);
  }

  /**
   * Алиас старого имени: validateJSON -> validateJson
   */
  static validateJSON(input: string): ValidationResult {
    return InputValidator.validateJson(input);
  }
}
=======
      return { isValid: false, errors: ['Invalid JSON format'] };
    }
  }
}
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
