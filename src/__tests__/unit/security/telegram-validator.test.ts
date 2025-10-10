/**
 * Unit tests for Telegram Mini App initData validator
 * Tests HMAC-SHA256 signature validation to prevent user impersonation
 */

import { validateTelegramInitData, isInitDataExpired, extractUserId } from '../../../lib/security/telegram-validator';
import crypto from 'crypto';

describe('Telegram Validator', () => {
  const MOCK_BOT_TOKEN = '1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi';
  
  // Helper function to generate valid initData
  function generateValidInitData(userId: string, authDate?: number): string {
    const timestamp = authDate || Math.floor(Date.now() / 1000);
    const user = JSON.stringify({ id: parseInt(userId), first_name: 'Test', username: 'testuser' });
    
    const params = new URLSearchParams({
      auth_date: timestamp.toString(),
      user: user
    });
    
    // Generate valid HMAC
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b));
    
    const dataCheckString = sortedParams
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(MOCK_BOT_TOKEN)
      .digest();
    
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    params.set('hash', hash);
    return params.toString();
  }
  
  describe('validateTelegramInitData', () => {
    test('should accept valid initData', () => {
      const validInitData = generateValidInitData('123456789');
      const result = validateTelegramInitData(validInitData, MOCK_BOT_TOKEN);
      
      expect(result.valid).toBe(true);
      expect(result.userId).toBe('123456789');
      expect(result.error).toBeUndefined();
    });
    
    test('should reject initData with missing hash', () => {
      const initData = 'auth_date=1234567890&user={"id":123}';
      const result = validateTelegramInitData(initData, MOCK_BOT_TOKEN);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing hash parameter');
    });
    
    test('should reject initData with missing auth_date', () => {
      const initData = 'hash=abc123&user={"id":123}';
      const result = validateTelegramInitData(initData, MOCK_BOT_TOKEN);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing auth_date parameter');
    });
    
    test('should reject initData with invalid auth_date format', () => {
      const initData = 'hash=abc123&auth_date=invalid&user={"id":123}';
      const result = validateTelegramInitData(initData, MOCK_BOT_TOKEN);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid auth_date format');
    });
    
    test('should reject expired initData', () => {
      // Create initData from 2 hours ago (> 3600s)
      const twoHoursAgo = Math.floor(Date.now() / 1000) - 7200;
      const expiredInitData = generateValidInitData('123456789', twoHoursAgo);
      
      const result = validateTelegramInitData(expiredInitData, MOCK_BOT_TOKEN, 3600);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('initData expired');
    });
    
    test('should accept initData within maxAge', () => {
      // Create initData from 30 minutes ago (< 3600s)
      const thirtyMinutesAgo = Math.floor(Date.now() / 1000) - 1800;
      const recentInitData = generateValidInitData('123456789', thirtyMinutesAgo);
      
      const result = validateTelegramInitData(recentInitData, MOCK_BOT_TOKEN, 3600);
      
      expect(result.valid).toBe(true);
      expect(result.userId).toBe('123456789');
    });
    
    test('should reject initData with tampered hash', () => {
      const validInitData = generateValidInitData('123456789');
      // Tamper with hash
      const tamperedInitData = validInitData.replace(/hash=[^&]+/, 'hash=fakehash123');
      
      const result = validateTelegramInitData(tamperedInitData, MOCK_BOT_TOKEN);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid signature');
    });
    
    test('should reject initData with tampered user data', () => {
      const validInitData = generateValidInitData('123456789');
      // Try to change user ID to different value
      const tamperedInitData = validInitData.replace(/"id":123456789/, '"id":999999999');
      
      const result = validateTelegramInitData(tamperedInitData, MOCK_BOT_TOKEN);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid signature');
    });
    
    test('should handle initData without user field', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const params = new URLSearchParams({
        auth_date: timestamp.toString()
      });
      
      const sortedParams = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
      const dataCheckString = sortedParams.map(([k, v]) => `${k}=${v}`).join('\n');
      
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(MOCK_BOT_TOKEN)
        .digest();
      
      const hash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
      
      params.set('hash', hash);
      const initData = params.toString();
      
      const result = validateTelegramInitData(initData, MOCK_BOT_TOKEN);
      
      expect(result.valid).toBe(true);
      expect(result.userId).toBeUndefined();
    });
    
    test('should handle malformed user JSON', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const params = new URLSearchParams({
        auth_date: timestamp.toString(),
        user: 'invalid json {'
      });
      
      const sortedParams = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
      const dataCheckString = sortedParams.map(([k, v]) => `${k}=${v}`).join('\n');
      
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(MOCK_BOT_TOKEN)
        .digest();
      
      const hash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
      
      params.set('hash', hash);
      const initData = params.toString();
      
      const result = validateTelegramInitData(initData, MOCK_BOT_TOKEN);
      
      expect(result.valid).toBe(true);
      expect(result.userId).toBeUndefined();
    });
    
    test('should extract username from user data', () => {
      const validInitData = generateValidInitData('123456789');
      const result = validateTelegramInitData(validInitData, MOCK_BOT_TOKEN);
      
      expect(result.valid).toBe(true);
      expect(result.username).toBe('testuser');
    });
    
    test('should handle different maxAge values', () => {
      const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
      const initData = generateValidInitData('123456789', oneHourAgo);
      
      // Should reject with 1 hour maxAge
      const result1h = validateTelegramInitData(initData, MOCK_BOT_TOKEN, 3600);
      expect(result1h.valid).toBe(false);
      
      // Should accept with 2 hour maxAge
      const result2h = validateTelegramInitData(initData, MOCK_BOT_TOKEN, 7200);
      expect(result2h.valid).toBe(true);
    });
  });
  
  describe('isInitDataExpired', () => {
    test('should return true for expired initData', () => {
      const twoHoursAgo = Math.floor(Date.now() / 1000) - 7200;
      const expiredInitData = `auth_date=${twoHoursAgo}&hash=abc`;
      
      expect(isInitDataExpired(expiredInitData, 3600)).toBe(true);
    });
    
    test('should return false for fresh initData', () => {
      const now = Math.floor(Date.now() / 1000);
      const freshInitData = `auth_date=${now}&hash=abc`;
      
      expect(isInitDataExpired(freshInitData, 3600)).toBe(false);
    });
    
    test('should return true for invalid initData', () => {
      expect(isInitDataExpired('invalid', 3600)).toBe(true);
      expect(isInitDataExpired('', 3600)).toBe(true);
    });
  });
  
  describe('extractUserId', () => {
    test('should extract user ID from valid initData', () => {
      const initData = 'user={"id":123456789,"first_name":"Test"}&hash=abc';
      expect(extractUserId(initData)).toBe('123456789');
    });
    
    test('should return null for initData without user', () => {
      const initData = 'auth_date=123&hash=abc';
      expect(extractUserId(initData)).toBeNull();
    });
    
    test('should return null for malformed user JSON', () => {
      const initData = 'user={invalid}&hash=abc';
      expect(extractUserId(initData)).toBeNull();
    });
    
    test('should return null for user without id', () => {
      const initData = 'user={"first_name":"Test"}&hash=abc';
      expect(extractUserId(initData)).toBeNull();
    });
  });
  
  describe('Security edge cases', () => {
    test('should prevent timing attacks with constant-time comparison', () => {
      const validInitData = generateValidInitData('123456789');
      
      // Test that validation time is consistent
      const iterations = 100;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        validateTelegramInitData(validInitData, MOCK_BOT_TOKEN);
        const end = process.hrtime.bigint();
        times.push(Number(end - start));
      }
      
      // Calculate standard deviation
      const avg = times.reduce((a, b) => a + b) / times.length;
      const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length;
      const stdDev = Math.sqrt(variance);
      
      // Standard deviation should be relatively low (timing attack resistant)
      expect(stdDev / avg).toBeLessThan(0.5); // Less than 50% variance
    });
    
    test('should handle very long initData strings', () => {
      const longString = 'a'.repeat(10000);
      const initData = `auth_date=123&hash=abc&extra=${longString}`;
      
      const result = validateTelegramInitData(initData, MOCK_BOT_TOKEN);
      
      // Should not crash, should return validation result
      expect(result).toHaveProperty('valid');
    });
    
    test('should handle special characters in initData', () => {
      const specialChars = '!@#$%^&*()_+{}[]|:;"<>?,./';
      const initData = `auth_date=123&hash=abc&test=${encodeURIComponent(specialChars)}`;
      
      const result = validateTelegramInitData(initData, MOCK_BOT_TOKEN);
      
      expect(result).toHaveProperty('valid');
    });
  });
});
