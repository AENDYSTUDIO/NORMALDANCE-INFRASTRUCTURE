/**
 * Unit tests for input sanitization and validation utilities
 * Tests XSS prevention, address validation, and suspicious pattern detection
 */

import {
  sanitizeHTML,
  stripHTML,
  sanitizeURL,
  sanitizeFilename,
  isValidSolanaAddress,
  isValidTONAddress,
  isValidEthereumAddress,
  isValidIPFSCID,
  validateNumber,
  isRateLimited,
  detectSuspiciousPatterns
} from '../../../lib/security/input-sanitizer';

describe('Input Sanitizer', () => {
  describe('sanitizeHTML', () => {
    test('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
      
      expect(sanitizeHTML(input)).toBe(expected);
    });
    
    test('should escape all dangerous characters', () => {
      expect(sanitizeHTML('<')).toBe('&lt;');
      expect(sanitizeHTML('>')).toBe('&gt;');
      expect(sanitizeHTML('&')).toBe('&amp;');
      expect(sanitizeHTML('"')).toBe('&quot;');
      expect(sanitizeHTML("'")).toBe('&#x27;');
      expect(sanitizeHTML('/')).toBe('&#x2F;');
    });
    
    test('should handle empty string', () => {
      expect(sanitizeHTML('')).toBe('');
    });
    
    test('should handle non-string input', () => {
      expect(sanitizeHTML(null as any)).toBe('');
      expect(sanitizeHTML(undefined as any)).toBe('');
      expect(sanitizeHTML(123 as any)).toBe('');
    });
    
    test('should preserve safe text', () => {
      const safeText = 'Hello, world! This is safe text.';
      expect(sanitizeHTML(safeText)).toBe(safeText);
    });
    
    test('should handle mixed content', () => {
      const input = 'Hello <b>world</b> & "friends"';
      const expected = 'Hello &lt;b&gt;world&lt;&#x2F;b&gt; &amp; &quot;friends&quot;';
      
      expect(sanitizeHTML(input)).toBe(expected);
    });
  });
  
  describe('stripHTML', () => {
    test('should remove all HTML tags', () => {
      const input = '<p>Hello <b>world</b></p>';
      expect(stripHTML(input)).toBe('Hello world');
    });
    
    test('should handle nested tags', () => {
      const input = '<div><span><a href="#">Link</a></span></div>';
      expect(stripHTML(input)).toBe('Link');
    });
    
    test('should decode HTML entities', () => {
      const input = 'Hello&nbsp;&amp;&lt;&gt;';
      expect(stripHTML(input)).toBe('Hello &<>');
    });
    
    test('should handle self-closing tags', () => {
      const input = 'Text <br/> more text';
      expect(stripHTML(input)).toBe('Text  more text');
    });
  });
  
  describe('sanitizeURL', () => {
    test('should accept valid HTTPS URLs', () => {
      const url = 'https://example.com/path';
      expect(sanitizeURL(url)).toBe(url);
    });
    
    test('should accept valid HTTP URLs', () => {
      const url = 'http://example.com/path';
      expect(sanitizeURL(url)).toBe(url);
    });
    
    test('should accept valid IPFS URLs', () => {
      const url = 'ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
      expect(sanitizeURL(url, ['ipfs'])).toBe(url);
    });
    
    test('should reject javascript: protocol', () => {
      const url = 'javascript:alert(1)';
      expect(sanitizeURL(url)).toBeNull();
    });
    
    test('should reject data: protocol', () => {
      const url = 'data:text/html,<script>alert(1)</script>';
      expect(sanitizeURL(url)).toBeNull();
    });
    
    test('should reject vbscript: protocol', () => {
      const url = 'vbscript:msgbox(1)';
      expect(sanitizeURL(url)).toBeNull();
    });
    
    test('should reject invalid URLs', () => {
      expect(sanitizeURL('not a url')).toBeNull();
      expect(sanitizeURL('')).toBeNull();
      expect(sanitizeURL('//example.com')).toBeNull();
    });
    
    test('should respect allowedProtocols parameter', () => {
      const ftpUrl = 'ftp://example.com/file.txt';
      
      // FTP not allowed by default
      expect(sanitizeURL(ftpUrl)).toBeNull();
      
      // FTP allowed explicitly
      expect(sanitizeURL(ftpUrl, ['ftp'])).toBe(ftpUrl);
    });
  });
  
  describe('sanitizeFilename', () => {
    test('should remove path traversal sequences', () => {
      const input = '../../etc/passwd';
      expect(sanitizeFilename(input)).toBe('etc-passwd');
    });
    
    test('should replace slashes with dashes', () => {
      const input = 'path/to/file.txt';
      expect(sanitizeFilename(input)).toBe('path-to-file.txt');
    });
    
    test('should remove special characters', () => {
      const input = 'file<name>*.txt';
      expect(sanitizeFilename(input)).toBe('file_name_.txt'); // Collapses multiple underscores
    });
    
    test('should remove leading dots', () => {
      const input = '...hidden.txt';
      expect(sanitizeFilename(input)).toBe('hidden.txt');
    });
    
    test('should limit length to 255 characters', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(longName);
      
      expect(result.length).toBeLessThanOrEqual(255);
    });
    
    test('should handle Windows path separators', () => {
      const input = 'C:\\Windows\\System32\\file.txt';
      expect(sanitizeFilename(input)).toBe('C-Windows-System32-file.txt');
    });
  });
  
  describe('isValidSolanaAddress', () => {
    test('should accept valid Solana addresses', () => {
      const validAddress = 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy';
      expect(isValidSolanaAddress(validAddress)).toBe(true);
    });
    
    test('should reject invalid Solana addresses', () => {
      expect(isValidSolanaAddress('invalid')).toBe(false);
      expect(isValidSolanaAddress('0x1234567890')).toBe(false);
      expect(isValidSolanaAddress('')).toBe(false);
      expect(isValidSolanaAddress('a'.repeat(100))).toBe(false);
    });
    
    test('should reject addresses with invalid characters', () => {
      const invalidChars = 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21h!'; // ! is invalid
      expect(isValidSolanaAddress(invalidChars)).toBe(false);
    });
    
    test('should reject addresses with wrong length', () => {
      expect(isValidSolanaAddress('DRpbCBMx')).toBe(false); // Too short
      expect(isValidSolanaAddress('a'.repeat(45))).toBe(false); // Too long
    });
    
    test('should handle non-string input', () => {
      expect(isValidSolanaAddress(null as any)).toBe(false);
      expect(isValidSolanaAddress(undefined as any)).toBe(false);
      expect(isValidSolanaAddress(123 as any)).toBe(false);
    });
  });
  
  describe('isValidTONAddress', () => {
    test('should accept valid TON addresses (bounceable)', () => {
      const validAddress = 'EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales';
      expect(isValidTONAddress(validAddress)).toBe(true);
    });
    
    test('should accept valid TON addresses (non-bounceable)', () => {
      const validAddress = 'UQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales';
      expect(isValidTONAddress(validAddress)).toBe(true);
    });
    
    test('should reject invalid TON addresses', () => {
      expect(isValidTONAddress('invalid')).toBe(false);
      expect(isValidTONAddress('0x1234567890')).toBe(false);
      expect(isValidTONAddress('')).toBe(false);
    });
    
    test('should reject addresses with wrong prefix', () => {
      const wrongPrefix = 'ABCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales';
      expect(isValidTONAddress(wrongPrefix)).toBe(false);
    });
    
    test('should reject addresses with wrong length', () => {
      expect(isValidTONAddress('EQshort')).toBe(false);
      expect(isValidTONAddress('EQ' + 'a'.repeat(100))).toBe(false);
    });
  });
  
  describe('isValidEthereumAddress', () => {
    test('should accept valid Ethereum addresses', () => {
      const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'; // 40 hex chars
      expect(isValidEthereumAddress(validAddress)).toBe(true);
    });
    
    test('should accept addresses with lowercase', () => {
      const lowercaseAddress = '0xabcdef1234567890abcdef1234567890abcdef12';
      expect(isValidEthereumAddress(lowercaseAddress)).toBe(true);
    });
    
    test('should accept addresses with uppercase', () => {
      const uppercaseAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
      expect(isValidEthereumAddress(uppercaseAddress)).toBe(true);
    });
    
    test('should reject invalid Ethereum addresses', () => {
      expect(isValidEthereumAddress('invalid')).toBe(false);
      expect(isValidEthereumAddress('0x123')).toBe(false); // Too short
      expect(isValidEthereumAddress('742d35Cc6634C0532')).toBe(false); // Missing 0x
      expect(isValidEthereumAddress('')).toBe(false);
    });
    
    test('should reject addresses with invalid characters', () => {
      const invalidChars = '0xGGGGGG1234567890abcdef1234567890abcdef12';
      expect(isValidEthereumAddress(invalidChars)).toBe(false);
    });
  });
  
  describe('isValidIPFSCID', () => {
    test('should accept valid CIDv0', () => {
      const validCID = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      expect(isValidIPFSCID(validCID)).toBe(true);
    });
    
    test('should accept valid CIDv1', () => {
      const validCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      expect(isValidIPFSCID(validCID)).toBe(true);
    });
    
    test('should reject invalid CIDs', () => {
      expect(isValidIPFSCID('invalid')).toBe(false);
      expect(isValidIPFSCID('Qm123')).toBe(false); // Too short
      expect(isValidIPFSCID('')).toBe(false);
    });
    
    test('should reject CIDs with invalid characters', () => {
      const invalidCID = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbd!'; // ! invalid
      expect(isValidIPFSCID(invalidCID)).toBe(false);
    });
  });
  
  describe('validateNumber', () => {
    test('should accept valid numbers', () => {
      expect(validateNumber(42)).toBe(42);
      expect(validateNumber(0)).toBe(0);
      expect(validateNumber(-5)).toBe(-5);
      expect(validateNumber(3.14)).toBe(3.14);
    });
    
    test('should accept numbers as strings', () => {
      expect(validateNumber('42')).toBe(42);
      expect(validateNumber('3.14')).toBe(3.14);
    });
    
    test('should reject invalid numbers', () => {
      expect(validateNumber('invalid')).toBeNull();
      expect(validateNumber(NaN)).toBeNull();
      expect(validateNumber(Infinity)).toBeNull();
      expect(validateNumber(-Infinity)).toBeNull();
    });
    
    test('should enforce minimum value', () => {
      expect(validateNumber(5, 10)).toBeNull(); // 5 < 10
      expect(validateNumber(10, 10)).toBe(10); // 10 >= 10
      expect(validateNumber(15, 10)).toBe(15); // 15 >= 10
    });
    
    test('should enforce maximum value', () => {
      expect(validateNumber(15, undefined, 10)).toBeNull(); // 15 > 10
      expect(validateNumber(10, undefined, 10)).toBe(10); // 10 <= 10
      expect(validateNumber(5, undefined, 10)).toBe(5); // 5 <= 10
    });
    
    test('should enforce both min and max', () => {
      expect(validateNumber(5, 10, 20)).toBeNull(); // 5 < 10
      expect(validateNumber(10, 10, 20)).toBe(10); // Within range
      expect(validateNumber(15, 10, 20)).toBe(15); // Within range
      expect(validateNumber(20, 10, 20)).toBe(20); // Within range
      expect(validateNumber(25, 10, 20)).toBeNull(); // 25 > 20
    });
  });
  
  describe('isRateLimited', () => {
    beforeEach(() => {
      // Clear rate limit store before each test
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    test('should allow first request', () => {
      expect(isRateLimited('test-key', 5, 60000)).toBe(false);
    });
    
    test('should allow requests within limit', () => {
      const key = 'test-key-2';
      const maxActions = 5;
      const windowMs = 60000;
      
      for (let i = 0; i < maxActions; i++) {
        expect(isRateLimited(key, maxActions, windowMs)).toBe(false);
      }
    });
    
    test('should block requests exceeding limit', () => {
      const key = 'test-key-3';
      const maxActions = 3;
      const windowMs = 60000;
      
      // First 3 should pass
      for (let i = 0; i < maxActions; i++) {
        expect(isRateLimited(key, maxActions, windowMs)).toBe(false);
      }
      
      // 4th should be blocked
      expect(isRateLimited(key, maxActions, windowMs)).toBe(true);
    });
    
    test('should reset after time window', () => {
      const key = 'test-key-4';
      const maxActions = 2;
      const windowMs = 60000;
      
      // Use up the limit
      expect(isRateLimited(key, maxActions, windowMs)).toBe(false);
      expect(isRateLimited(key, maxActions, windowMs)).toBe(false);
      expect(isRateLimited(key, maxActions, windowMs)).toBe(true);
      
      // Fast forward past the window
      jest.advanceTimersByTime(windowMs + 1000);
      
      // Should be allowed again
      expect(isRateLimited(key, maxActions, windowMs)).toBe(false);
    });
  });
  
  describe('detectSuspiciousPatterns', () => {
    test('should detect script tags', () => {
      const input = '<script>alert("xss")</script>';
      const warnings = detectSuspiciousPatterns(input);
      
      expect(warnings).toContain('Script tag detected');
    });
    
    test('should detect event handlers', () => {
      const input = '<div onclick="alert(1)">Click</div>';
      const warnings = detectSuspiciousPatterns(input);
      
      expect(warnings).toContain('Event handler detected');
    });
    
    test('should detect javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const warnings = detectSuspiciousPatterns(input);
      
      expect(warnings).toContain('JavaScript protocol detected');
    });
    
    test('should detect SQL injection patterns', () => {
      const input = "' OR '1'='1";
      const warnings = detectSuspiciousPatterns(input);
      
      expect(warnings).toContain('Possible SQL injection pattern');
    });
    
    test('should detect path traversal', () => {
      const input = '../../etc/passwd';
      const warnings = detectSuspiciousPatterns(input);
      
      expect(warnings).toContain('Path traversal pattern detected');
    });
    
    test('should detect command injection characters', () => {
      const input = '`cat /etc/passwd`';
      const warnings = detectSuspiciousPatterns(input);
      
      expect(warnings).toContain('Command injection characters detected');
    });
    
    test('should return empty array for safe input', () => {
      const safeInput = 'This is a normal, safe string with no dangerous patterns.';
      const warnings = detectSuspiciousPatterns(safeInput);
      
      expect(warnings).toEqual([]);
    });
    
    test('should detect multiple patterns', () => {
      const input = '<script>alert(1)</script> OR 1=1 AND onclick="test"';
      const warnings = detectSuspiciousPatterns(input);
      
      expect(warnings.length).toBeGreaterThan(1);
      expect(warnings).toContain('Script tag detected');
      expect(warnings).toContain('Event handler detected');
    });
  });
});
