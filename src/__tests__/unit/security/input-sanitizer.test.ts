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
  sanitizeSQL,
  isRateLimited,
  detectSuspiciousPatterns,
  validateNumber
} from '@/lib/security';

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

  });

  describe('stripHTML', () => {
    test('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const expected = 'Hello World';
      
      expect(stripHTML(input)).toBe(expected);
    });
    
    test('should remove event handlers', () => {
      const input = '<div onclick="alert(1)">Click</div>';
      const expected = '<div>Click</div>';
      
      expect(stripHTML(input)).toBe(expected);
    });
    
    test('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const expected = '<a href="">Link</a>';
      
      expect(stripHTML(input)).toBe(expected);
    });
    
    test('should handle nested tags', () => {
      const input = '<div><script>alert("xss")</script><p>Text</p></div>';
      const expected = '<div><p>Text</p></div>';
      
      expect(stripHTML(input)).toBe(expected);
    });
  });

  describe('sanitizeURL', () => {
    test('should allow valid HTTP URLs', () => {
      const input = 'http://example.com';
      expect(sanitizeURL(input)).toBe('http://example.com/');
    });
    
    test('should allow valid HTTPS URLs', () => {
      const input = 'https://example.com';
      expect(sanitizeURL(input)).toBe('https://example.com/');
    });
    
    test('should allow IPFS URLs', () => {
      const input = 'ipfs://QmHash';
      expect(sanitizeURL(input, ['http', 'https', 'ipfs'])).toBe('ipfs://QmHash');
    });
    
    test('should block javascript: URLs', () => {
      const input = 'javascript:alert(1)';
      expect(sanitizeURL(input)).toBeNull();
    });
    
    test('should block data: URLs', () => {
      const input = 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==';
      expect(sanitizeURL(input)).toBeNull();
    });
    
    test('should block protocol-relative URLs', () => {
      const input = '//example.com';
      expect(sanitizeURL(input)).toBeNull();
    });
    
    test('should handle relative URLs', () => {
      const input = '/path/to/resource';
      expect(sanitizeURL(input)).toBe('/path/to/resource');
    });
  });

  describe('sanitizeFilename', () => {
    test('should replace dangerous characters', () => {
      expect(sanitizeFilename('test<file>.txt')).toBe('test_file_.txt');
      expect(sanitizeFilename('test:file.txt')).toBe('test-file.txt');
    });
    
    test('should remove directory traversal', () => {
      expect(sanitizeFilename('../etc/passwd')).toBe('etc-passwd');
      expect(sanitizeFilename('..\\windows\\system32')).toBe('windows-system32');
    });
    
    test('should limit length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(longName);
      expect(result.length).toBe(255);
    });
    
    test('should remove leading special characters', () => {
      expect(sanitizeFilename('...file.txt')).toBe('file.txt');
      expect(sanitizeFilename('-file.txt')).toBe('file.txt');
      expect(sanitizeFilename('_file.txt')).toBe('file.txt');
    });
  });

  describe('isValidSolanaAddress', () => {
    test('should validate correct Solana address', () => {
      const address = '7vEjuwu86TvLSnWTPYiWrkKQ9N8j3ouyJxqVJ4nke6qP';
      expect(isValidSolanaAddress(address)).toBe(true);
    });
    
    test('should reject invalid Solana address', () => {
      const address = 'invalid_address';
      expect(isValidSolanaAddress(address)).toBe(false);
    });
  });

  describe('isValidTONAddress', () => {
    test('should validate correct TON address', () => {
      const address = 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N';
      expect(isValidTONAddress(address)).toBe(true);
    });
    
    test('should reject invalid TON address', () => {
      const address = 'invalid_address';
      expect(isValidTONAddress(address)).toBe(false);
    });
  });

  describe('isValidEthereumAddress', () => {
    test('should validate correct Ethereum address', () => {
      const address = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
      expect(isValidEthereumAddress(address)).toBe(true);
    });
    
    test('should reject invalid Ethereum address', () => {
      const address = 'invalid_address';
      expect(isValidEthereumAddress(address)).toBe(false);
    });
  });

  describe('isValidIPFSCID', () => {
    test('should validate correct IPFS CIDv0', () => {
      const cid = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
      expect(isValidIPFSCID(cid)).toBe(true);
    });
    
    test('should validate correct IPFS CIDv1', () => {
      const cid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      expect(isValidIPFSCID(cid)).toBe(true);
    });
    
    test('should reject invalid IPFS CID', () => {
      const cid = 'invalid_cid';
      expect(isValidIPFSCID(cid)).toBe(false);
    });
  });

  describe('sanitizeSQL', () => {
    test('should properly escape single quotes', () => {
      const input = "O'Reilly";
      const expected = "O''Reilly";
      expect(sanitizeSQL(input)).toBe(expected);
      
      // Test multiple quotes
      expect(sanitizeSQL("John's Book")).toBe("John''s Book");
      // Test consecutive quotes
      expect(sanitizeSQL("O''Reilly")).toBe("O''''Reilly");
    });
    
    test('should remove SQL comments completely', () => {
      const input = "SELECT * FROM users; -- This is a comment";
      const expected = "SELECT * FROM users";
      expect(sanitizeSQL(input)).toBe(expected);
      
      // Test different comment styles
      expect(sanitizeSQL("SELECT * FROM /* comment */ users")).toBe("SELECT * FROM  users");
      expect(sanitizeSQL("// comment\nSELECT * FROM users")).toBe("SELECT * FROM users");
    });
    
    test('should remove dangerous SQL keywords', () => {
      const input = "DROP TABLE users; SELECT * FROM admin";
      const expected = "TABLE users;  FROM admin";
      expect(sanitizeSQL(input)).toBe(expected);
      
      // Test various dangerous keywords
      expect(sanitizeSQL("UNION SELECT * FROM")).toBe("UNION  FROM");
      expect(sanitizeSQL("INSERT INTO users")).toBe("INTO users");
      expect(sanitizeSQL("UPDATE users SET")).toBe("users SET");
      expect(sanitizeSQL("DELETE FROM users")).toBe("FROM users");
    });
    
    test('should handle SQL injection attempts', () => {
      expect(sanitizeSQL("' OR '1'='1")).toBe(" OR 1=1");
      expect(sanitizeSQL("1; DROP TABLE")).toBe("1;  TABLE");
      expect(sanitizeSQL("admin'--")).toBe("admin");
      expect(sanitizeSQL("test@domain.com; EXEC xp_cmdshell('dir')")).toBe("test@domain.com;  xp_cmdshell('dir')");
    });
    
    test('should handle edge cases', () => {
      expect(sanitizeSQL('')).toBe('');
      expect(sanitizeSQL(null as any)).toBe('');
      expect(sanitizeSQL(undefined as any)).toBe('');
      expect(sanitizeSQL(123 as any)).toBe('123');
    });
  });

  describe('validateNumber', () => {
    test('should validate minimum value', () => {
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
  });
});