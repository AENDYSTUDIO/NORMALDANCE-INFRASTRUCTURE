/**
 * Unit tests for input sanitization and validation utilities
 * Tests XSS prevention, address validation, and suspicious pattern detection
 */

<<<<<<< HEAD
import { 
=======
import {
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
  sanitizeHTML,
  stripHTML,
  sanitizeURL,
  sanitizeFilename,
  isValidSolanaAddress,
  isValidTONAddress,
  isValidEthereumAddress,
  isValidIPFSCID,
<<<<<<< HEAD
  sanitizeSQL,
  isRateLimited,
  detectSuspiciousPatterns,
  validateNumber
} from '@/lib/security';
=======
  validateNumber,
  isRateLimited,
  detectSuspiciousPatterns
} from '../../../lib/security/input-sanitizer';
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337

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
<<<<<<< HEAD

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
=======
    
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
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
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
<<<<<<< HEAD
  });
});
=======
    
    test('should detect multiple patterns', () => {
      const input = '<script>alert(1)</script> OR 1=1 AND onclick="test"';
      const warnings = detectSuspiciousPatterns(input);
      
      expect(warnings.length).toBeGreaterThan(1);
      expect(warnings).toContain('Script tag detected');
      expect(warnings).toContain('Event handler detected');
    });
  });
});
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
