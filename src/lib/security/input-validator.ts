/**
 * Input Validation and Sanitization
 * Prevents injection attacks and validates user input
 */

import DOMPurify from "isomorphic-dompurify";

export interface ValidationResult {
  isValid: boolean;
  sanitized?: string;
  errors?: string[];
}

export class InputValidator {
  // Sanitize HTML content to prevent XSS
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
      ALLOWED_ATTR: [],
    });
  }

  // Validate and sanitize text input
  static validateText(
    input: string,
    maxLength: number = 1000
  ): ValidationResult {
    if (!input || typeof input !== "string") {
      return { isValid: false, errors: ["Input must be a non-empty string"] };
    }

    if (input.length > maxLength) {
      return {
        isValid: false,
        errors: [`Input exceeds maximum length of ${maxLength}`],
      };
    }

    // Remove potential script tags and dangerous characters
    const sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .trim();

    return { isValid: true, sanitized };
  }

  // Validate email format
  static validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || typeof email !== "string") {
      return { isValid: false, errors: ["Email is required"] };
    }

    if (!emailRegex.test(email)) {
      return { isValid: false, errors: ["Invalid email format"] };
    }

    return { isValid: true, sanitized: email.toLowerCase().trim() };
  }

  // Validate wallet address
  static validateWalletAddress(address: string): ValidationResult {
    if (!address || typeof address !== "string") {
      return { isValid: false, errors: ["Wallet address is required"] };
    }

    // Basic Solana address validation (base58, 32-44 chars)
    const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

    if (!solanaRegex.test(address)) {
      return { isValid: false, errors: ["Invalid wallet address format"] };
    }

    return { isValid: true, sanitized: address.trim() };
  }

  // Validate numeric input
  static validateNumber(
    input: unknown,
    min?: number,
    max?: number
  ): ValidationResult {
    const num = Number(input);

    if (isNaN(num)) {
      return { isValid: false, errors: ["Input must be a valid number"] };
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
    }

    if (file.size > maxSize) {
      return { isValid: false, errors: [`File size exceeds ${maxSize} bytes`] };
    }

    return { isValid: true };
  }

  // Prevent SQL injection by escaping special characters
  static escapeSql(input: string): string {
    return input.replace(/'/g, "''").replace(/;/g, "\\;");
  }

  // Validate JSON input
  static validateJson(input: string): ValidationResult {
    try {
      const parsed = JSON.parse(input);
      return { isValid: true, sanitized: JSON.stringify(parsed) };
    } catch (error) {
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
