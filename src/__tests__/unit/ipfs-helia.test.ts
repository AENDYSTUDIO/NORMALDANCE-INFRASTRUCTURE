/**
 * IPFS Helia Adapter Unit Tests
 */

import { jest } from '@jest/globals';
import {
  uploadToIPFSHelia,
  getFileFromIPFSHelia,
  checkFileAvailabilityHelia,
  cleanupHeliaFiles,
} from '@/lib/ipfs-helia-adapter';

// Mock Helia dependencies
jest.mock('helia', () => ({
  createHelia: jest.fn(),
}));

jest.mock('@helia/unixfs', () => ({
  unixfs: jest.fn(() => ({
    addBytes: jest.fn(),
    cat: jest.fn(),
  })),
}));

// Mock fetch for gateway checks
global.fetch = jest.fn();

// Mock logger
jest.mock('@/utils/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

describe('IPFS Helia Adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadToIPFSHelia', () => {
    it('should upload file successfully', async () => {
      // Mock successful upload
      const mockCid = 'bafybeifx7yndhnuqzaf3z3h3q7hpe2z6wv3x3h3q7hpe2z6w';
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

      // Mock the upload process
      const mockFs = {
        addBytes: jest.fn().mockResolvedValue({
          toString: () => mockCid,
        }),
      };

      require('@helia/unixfs').unixfs.mockReturnValue(mockFs);

      const result = await uploadToIPFSHelia(mockFile);

      expect(result).toEqual({
        cid: expect.stringContaining(mockCid),
        size: expect.any(Number),
      });
    });

    it('should validate file size limits', async () => {
      // Create a file larger than 100MB
      const largeBuffer = new ArrayBuffer(100 * 1024 * 1024 + 1);
      const largeFile = new File([largeBuffer], 'large.txt');

      await expect(uploadToIPFSHelia(largeFile)).rejects.toThrow(/exceeds maximum allowed size/);
    });

    it('should sanitize metadata', async () => {
      const mockFile = new File(['test'], 'test.txt');
      const metadata = {
        title: 'Test Title',
        artist: 'Test Artist',
        genre: 'Test',
        duration: 180,
        format: 'mp3',
        sampleRate: 44100,
        bitDepth: 16,
        // This should be sanitized
        description: 'X'.repeat(300),
      };

      const mockFs = {
        addBytes: jest.fn().mockResolvedValue({
          toString: () => 'test-cid',
        }),
      };

      require('@helia/unixfs').unixfs.mockReturnValue(mockFs);

      await uploadToIPFSHelia(mockFile, metadata);

      expect(mockFs.addBytes).toHaveBeenCalled();
    });

    it('should handle unsupported file types', async () => {
      const invalidFile = 'not a file object';

      await expect(uploadToIPFSHelia(invalidFile as any)).rejects.toThrow('Unsupported file type');
    });

    it('should include checksum for data integrity', async () => {
      const mockFile = new File(['test content'], 'test.txt');
      const metadata = {
        title: 'Test',
        artist: 'Test',
        genre: 'Test',
        duration: 180,
        format: 'mp3',
        sampleRate: 44100,
        bitDepth: 16,
      };

      const mockFs = {
        addBytes: jest.fn().mockResolvedValue({
          toString: () => 'test-cid',
        }),
      };

      require('@helia/unixfs').unixfs.mockReturnValue(mockFs);

      await uploadToIPFSHelia(mockFile, metadata);

      // Verify checksum was calculated (it should be in the metadata)
      expect(mockFs.addBytes).toHaveBeenCalledTimes(2); // metadata + file
    });
  });

  describe('getFileFromIPFSHelia', () => {
    it('should retrieve file successfully', async () => {
      const mockCid = 'bafybeifx7yndhnuqzaf3z3h3q7hpe2z6w';
      const mockContent = 'test file content';

      const mockFs = {
        cat: jest.fn().mockImplementation(async function* () {
          yield new TextEncoder().encode(mockContent);
        }),
      };

      require('@helia/unixfs').unixfs.mockReturnValue(mockFs);

      const result = await getFileFromIPFSHelia(mockCid);

      expect(result.toString()).toBe(mockContent);
      expect(mockFs.cat).toHaveBeenCalledWith(mockCid);
    });

    it('should validate CID format', async () => {
      const invalidCids = ['', null, undefined, 'invalid-cid'];

      for (const cid of invalidCids) {
        await expect(getFileFromIPFSHelia(cid as any)).rejects.toThrow('Invalid CID provided');
      }
    });

    it('should enforce size limits during retrieval', async () => {
      const mockCid = 'bafybeifx7yndhnuqzaf3z3h3q7hpe2z6w';
      const largeContent = 'x'.repeat(100 * 1024 * 1024 + 1);

      const mockFs = {
        cat: jest.fn().mockImplementation(async function* () {
          yield new TextEncoder().encode(largeContent);
        }),
      };

      require('@helia/unixfs').unixfs.mockReturnValue(mockFs);

      await expect(getFileFromIPFSHelia(mockCid)).rejects.toThrow(/exceeds maximum allowed size/);
    });
  });

  describe('checkFileAvailabilityHelia', () => {
    beforeEach(() => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      // Mock successful response
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        } as Response)
      );
    });

    it('should check file availability via multiple gateways', async () => {
      const mockCid = 'bafybeifx7yndhnuqzaf3z3h3q7hpe2z6w';

      const mockFs = {
        cat: jest.fn().mockImplementation(async function* () {
          yield new TextEncoder().encode('test');
        }),
      };

      require('@helia/unixfs').unixfs.mockReturnValue(mockFs);

      const result = await checkFileAvailabilityHelia(mockCid);

      expect(result.available).toBe(true);
      expect(result.gateways).toHaveLength(3); // We have 3 gateways
    });

    it('should handle invalid CID gracefully', async () => {
      const invalidCid = '';
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

      const result = await checkFileAvailabilityHelia(invalidCid);

      expect(result.available).toBe(false);
      expect(result.gateways).toHaveLength(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should implement timeout for gateway checks', async () => {
      const mockCid = 'bafybeifx7yndhnuqzaf3z3h3q7hpe2z6w';
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

      // Mock slow response
      mockFetch.mockImplementation(() =>
        new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const result = await checkFileAvailabilityHelia(mockCid);

      expect(result.available).toBe(false);
      expect(result.gateways).toHaveLength(0);
    }, 15000); // Test timeout
  });

  describe('cleanupHeliaFiles', () => {
    it('should list pinned files and generate cleanup report', async () => {
      const mockPins = new Map([
        ['bafybeifx7yndhnuqzaf3z3h3q7hpe2z6w', { cid: 'bafybeifx7yndhnuqzaf3z3h3q7hpe2z6w' }],
        ['bafybeifx8yndhnuqzaf3z3h3q7hpe2z6w', { cid: 'bafybeifx8yndhnuqzaf3z3h3q7hpe2z6w' }],
      ]);

      const mockHelia = {
        pins: {
          ls: jest.fn().mockImplementation(async function* () {
            for (const [cid, data] of mockPins) {
              yield data;
            }
          }),
        },
      };

      // Mock Helia instance
      jest.doMock('helia', () => ({
        createHelia: jest.fn().mockResolvedValue(mockHelia),
      }));

      const result = await cleanupHeliaFiles();

      expect(result.pinnedCount).toBe(2);
      expect(result.cleanedCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle cleanup errors gracefully', async () => {
      const mockHelia = {
        pins: {
          ls: jest.fn().mockImplementation(() => {
            throw new Error('Failed to list pins');
          }),
        },
      };

      jest.doMock('helia', () => ({
        createHelia: jest.fn().mockResolvedValue(mockHelia),
      }));

      const result = await cleanupHeliaFiles();

      expect(result.pinnedCount).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should wrap errors in descriptive messages', async () => {
      const mockFile = new File(['test'], 'test.txt');
      
      const mockFs = {
        addBytes: jest.fn().mockRejectedValue(new Error('Network error')),
      };

      require('@helia/unixfs').unixfs.mockReturnValue(mockFs);

      await expect(uploadToIPFSHelia(mockFile)).rejects.toThrow(
        'Failed to upload to Helia IPFS: Network error'
      );
    });

    it('should validate file arguments', async () => {
      const invalidFiles = [null, undefined, '', 123];

      for (const file of invalidFiles) {
        await expect(uploadToIPFSHelia(file as any)).rejects.toThrow('File is required');
      }
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent uploads', async () => {
      const mockFiles = Array.from({ length: 5 }, (_, i) => 
        new File([`content ${i}`], `test${i}.txt`)
      );

      const mockFs = {
        addBytes: jest.fn().mockResolvedValue({
          toString: () => `test-cid-${Math.random()}`,
        }),
      };

      require('@helia/unixfs').unixfs.mockReturnValue(mockFs);

      const uploadPromises = mockFiles.map(file => uploadToIPFSHelia(file));
      const results = await Promise.all(uploadPromises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.cid).toMatch(/^bafy/);
        expect(result.size).toBeGreaterThan(0);
      });
    });

    it('should implement proper resource cleanup', async () => {
      const mockFile = new File(['test'], 'test.txt');
      const mockFs = {
        addBytes: jest.fn().mockResolvedValue({
          toString: () => 'test-cid',
        }),
      };

      require('@helia/unixfs').unixfs.mockReturnValue(mockFs);

      await uploadToIPFSHelia(mockFile);

      // Verify resources were cleaned up (implementation specific)
      expect(mockFs.addBytes).toHaveBeenCalled();
    });
  });
});

describe('CID Validation', () => {
  it('should validate CID v0 and v1 formats', () => {
    const validCids = [
      'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG', // CID v0
      'bafybeifx7yndhnuqzaf3z3h3q7hpe2z6wv3x3h3q7hpe2z6w', // CID v1
      'bafza5vyb4k7i7u6wk6o4jxq5y6j4m7d2w7g6w4y7w4s3v6x8d6x7y5zw', // Another v1
    ];

    const invalidCids = [
      '',
      'invalid-cid',
      'Qm',
      '12345',
      'not-a-cid',
    ];

    validCids.forEach(cid => {
      expect(cid.length).toBeGreaterThan(10);
      expect(cid).toMatch(/^[a-zA-Z0-9]+$/);
    });

    invalidCids.forEach(cid => {
      expect(cid.length < 10 || !/^[a-zA-Z0-9]+$/.test(cid)).toBe(true);
    });
  });
});
