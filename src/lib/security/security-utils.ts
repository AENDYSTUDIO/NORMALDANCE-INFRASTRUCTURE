/**
 * Security utility functions
 * Provides various security-related utilities that were previously in input-sanitizer
 */

/**
 * Validate a number against minimum and maximum values
 * @param value The number to validate
 * @param min Minimum allowed value (inclusive)
 * @param max Maximum allowed value (inclusive)
 * @returns The validated number if it's within range, null otherwise
 */
export function validateNumber(value: number, min?: number, max?: number): number | null {
  if (typeof value !== 'number' || isNaN(value)) {
    return null;
  }

  if (min !== undefined && value < min) {
    return null;
  }

  if (max !== undefined && value > max) {
    return null;
  }

  return value;
}

/**
 * Detect suspicious patterns in user input that might indicate attacks
 * @param input User input to check
 * @returns Array of warning messages for detected patterns
 */
export function detectSuspiciousPatterns(input: string): string[] {
  if (typeof input !== 'string') {
    return ['Invalid input type'];
  }

  const warnings: string[] = [];

  // Check for script tags
  if (/<\s*script[^>]*>.*?<\s*\/\s*script\s*>/gi.test(input)) {
    warnings.push('Script tag detected');
  }

  // Check for event handlers
  if (/on\w+\s*=\s*["'][^"']*["']/gi.test(input)) {
    warnings.push('Event handler detected');
  }

  // Check for javascript: protocol
  if (/javascript\s*:/gi.test(input)) {
    warnings.push('JavaScript protocol detected');
  }

  // Check for common SQL injection patterns (fixed regex)
  if (/(union\s+select|insert\s+into|update\s+\w+\s+set|delete\s+from|drop\s+table|create\s+table|'\s*(or|and)\s*'?\d*'?\s*=\s*'?\d*'?)/gi.test(input)) {
    warnings.push('Possible SQL injection pattern');
  }

  // Check for path traversal
  if (/(\.\.\/|\.\.\\)/gi.test(input)) {
    warnings.push('Path traversal pattern detected');
  }

  // Check for command injection characters
  if (/[`|;&<>$]/.test(input)) {
    warnings.push('Command injection characters detected');
  }

  return warnings;
}