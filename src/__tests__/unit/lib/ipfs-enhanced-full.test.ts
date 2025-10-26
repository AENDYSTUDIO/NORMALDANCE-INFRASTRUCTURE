import {
  checkFileAvailabilityOnMultipleGateways,
  cleanupCache,
  generateCDNUrl,
  getCachedData,
  getFileFromBestGateway,
  IPFSTrackMetadata,
  monitorFileHealth,
  setCachedData,
  uploadWithReplication,
} from "@/lib/ipfs-enhanced";

// Mock external dependencies
jest.mock("fs");
jest.mock("node-fetch", () => jest.fn());
jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock the unified IPFS API
jest.mock("@/lib/ipfs", () => ({
  uploadToIPFS: jest.fn(),
  pinFile: jest.fn(),
}));

// Mock file-type and mime-types
jest.mock("file-type", () => ({
  fromFile: jest.fn(),
  fromBuffer: jest.fn(),
}));

jest.mock("mime-types", () => ({
  lookup: jest.fn(),
}));

// Mock AbortSignal
Object.defineProperty(global, "AbortSignal", {
  value: {
    timeout: jest.fn((ms) => ({
      aborted: false,
      reason: undefined,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })) as any,
    abort: jest.fn(),
    any: jest.fn(),
  },
  writable: true,
});

describe("IPFS Enhanced - Full Unit Tests", () => {
  let mockFile: File;
  let mockMetadata: IPFSTrackMetadata;

  beforeEach(() => {
    mockFile = new File(["test content"], "test.mp3", { type: "audio/mpeg" });
    mockMetadata = {
      title: "Test Track",
      artist: "Test Artist",
      genre: "Electronic",
      duration: 180,
      albumArt: "test.jpg",
      description: "A test track",
      releaseDate: "2023-01-01",
      bpm: 128,
      key: "C",
      isExplicit: false,
      fileSize: 1000000,
      mimeType: "audio/mpeg",
    };
  });

  describe("uploadWithReplication", () => {
    it("should upload file with replication to multiple gateways", async () => {
      const mockUploadResult = {
        cid: "QmTestCID123",
        size: 1000000,
        timestamp: new Date(),
        metadata: mockMetadata,
      };

      (require("@/lib/ipfs").uploadToIPFS as jest.Mock).mockResolvedValue({
        cid: "QmTestCID123",
        size: 1000000,
      });

      (require("@/lib/ipfs").pinFile as jest.Mock).mockResolvedValue(true);

      const result = await uploadWithReplication(mockFile, mockMetadata);

      expect(result).toEqual({
        ...mockUploadResult,
        gateways: expect.any(Array),
        replicationStatus: expect.objectContaining({
          success: expect.any(Boolean),
          failedNodes: expect.any(Array),
        }),
      });
    });

    it("should handle upload errors gracefully", async () => {
      (require("@/lib/ipfs").uploadToIPFS as jest.Mock).mockRejectedValue(
        new Error("Upload failed")
      );

      await expect(
        uploadWithReplication(mockFile, mockMetadata)
      ).rejects.toThrow(
        "Failed to upload file with replication: Error: Upload failed"
      );
    });

    it("should enable Filecoin integration when option is provided", async () => {
      const mockUploadResult = {
        cid: "QmTestCID123",
        size: 1000000,
        timestamp: new Date(),
        metadata: mockMetadata,
      };

      (require("@/lib/ipfs").uploadToIPFS as jest.Mock).mockResolvedValue({
        cid: "QmTestCID123",
        size: 1000000,
      });

      (require("@/lib/ipfs").pinFile as jest.Mock).mockResolvedValue(true);

      const result = await uploadWithReplication(mockFile, mockMetadata, {
        enableFilecoin: true,
      });

      expect(result).toEqual({
        ...mockUploadResult,
        gateways: expect.any(Array),
        replicationStatus: expect.objectContaining({
          success: expect.any(Boolean),
          failedNodes: expect.any(Array),
        }),
      });
    });

    it("should use custom chunk size when provided", async () => {
      const mockUploadResult = {
        cid: "QmTestCID123",
        size: 1000000,
        timestamp: new Date(),
        metadata: mockMetadata,
      };

      (require("@/lib/ipfs").uploadToIPFS as jest.Mock).mockResolvedValue({
        cid: "QmTestCID123",
        size: 1000000,
      });

      (require("@/lib/ipfs").pinFile as jest.Mock).mockResolvedValue(true);

      const result = await uploadWithReplication(mockFile, mockMetadata, {
        chunkSize: 5 * 1024 * 1024, // 5MB chunks instead of default 10MB
      });

      expect(result).toEqual({
        ...mockUploadResult,
        gateways: expect.any(Array),
        replicationStatus: expect.objectContaining({
          success: expect.any(Boolean),
          failedNodes: expect.any(Array),
        }),
      });
    });
  });

  describe("uploadLargeFileToIPFS", () => {
    it("should validate file type before upload", async () => {
      const invalidFile = new File(["test"], "test.exe", {
        type: "application/x-executable",
      });

      await expect(
        uploadWithReplication(invalidFile, mockMetadata)
      ).rejects.toThrow("File type not allowed: application/x-executable");
    });

    it("should validate file size before upload", async () => {
      const largeFile = new File(
        [new ArrayBuffer(101 * 1024 * 1024)],
        "large.mp3",
        { type: "audio/mpeg" }
      ); // 101MB

      await expect(
        uploadWithReplication(largeFile, mockMetadata)
      ).rejects.toThrow("File too large: 1065353216 bytes, max: 104857600");
    });

    it("should validate file name for security", async () => {
      const maliciousFile = new File(["test"], "../test.mp3", {
        type: "audio/mpeg",
      });

      await expect(
        uploadWithReplication(maliciousFile, mockMetadata)
      ).rejects.toThrow("Invalid file name");
    });

    it("should validate file extension for security", async () => {
      const dangerousFile = new File(["test"], "test.bat", {
        type: "application/x-bat",
      });

      await expect(
        uploadWithReplication(dangerousFile, mockMetadata)
      ).rejects.toThrow("Dangerous file extension: .bat");
    });

    it("should handle files smaller than chunk size normally", async () => {
      const smallFile = new File(["small content"], "small.mp3", {
        type: "audio/mpeg",
      });

      const mockUploadResult = {
        cid: "QmSmallCID123",
        size: 13,
        timestamp: new Date(),
        metadata: mockMetadata,
      };

      (require("@/lib/ipfs").uploadToIPFS as jest.Mock).mockResolvedValue({
        cid: "QmSmallCID123",
        size: 13,
      });

      (require("@/lib/ipfs").pinFile as jest.Mock).mockResolvedValue(true);

      const result = await uploadWithReplication(smallFile, mockMetadata);

      expect(result).toEqual({
        ...mockUploadResult,
        gateways: expect.any(Array),
        replicationStatus: expect.objectContaining({
          success: expect.any(Boolean),
          failedNodes: expect.any(Array),
        }),
      });
    });
  });

  describe("checkFileAvailabilityOnMultipleGateways", () => {
    it("should check file availability on multiple gateways", async () => {
      const mockFetch = require("node-fetch");
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({}),
      });

      const result = await checkFileAvailabilityOnMultipleGateways(
        "QmTestCID123"
      );

      expect(result.available).toBe(true);
      expect(result.availableGateways).toBeInstanceOf(Array);
      expect(result.unavailableGateways).toBeInstanceOf(Array);
    });

    it("should handle unavailable gateways", async () => {
      const mockFetch = require("node-fetch");
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue({}),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: jest.fn().mockResolvedValue({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue({}),
        });

      const result = await checkFileAvailabilityOnMultipleGateways(
        "QmTestCID123"
      );

      expect(result.available).toBe(true);
      expect(result.availableGateways.length).toBeGreaterThan(0);
      expect(result.unavailableGateways.length).toBeGreaterThan(0);
    });

    it("should handle network errors", async () => {
      const mockFetch = require("node-fetch");
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await checkFileAvailabilityOnMultipleGateways(
        "QmTestCID123"
      );

      expect(result.available).toBe(false);
      expect(result.availableGateways.length).toBe(0);
      expect(result.unavailableGateways.length).toBeGreaterThan(0);
    });
  });

  describe("getFileFromBestGateway", () => {
    it("should get file from best available gateway", async () => {
      const mockFetch = require("node-fetch");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({}),
      });

      const result = await getFileFromBestGateway("QmTestCID123");

      expect(result).toBeDefined();
    });

    it("should throw error if file is not available on any gateway", async () => {
      const mockFetch = require("node-fetch");
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(getFileFromBestGateway("QmTestCID123")).rejects.toThrow(
        "File not available on any gateway"
      );
    });

    it("should retry failed requests", async () => {
      const mockFetch = require("node-fetch");
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue({}),
        });

      const result = await getFileFromBestGateway("QmTestCID123");

      expect(result).toBeDefined();
    });
  });

  describe("generateCDNUrl", () => {
    it("should generate Cloudflare CDN URL by default", () => {
      const url = generateCDNUrl("QmTestCID123");
      expect(url).toBe("https://normaldance.pages.dev/ipfs/QmTestCID123");
    });

    it("should generate Pinata CDN URL when specified", () => {
      process.env.CDN_PROVIDER = "pinata";
      const url = generateCDNUrl("QmTestCID123");
      expect(url).toBe("https://gateway.pinata.cloud/ipfs/QmTestCID123");
      delete process.env.CDN_PROVIDER;
    });

    it("should generate default IPFS URL when provider is unknown", () => {
      process.env.CDN_PROVIDER = "unknown";
      const url = generateCDNUrl("QmTestCID123");
      expect(url).toBe("https://ipfs.io/ipfs/QmTestCID123");
      delete process.env.CDN_PROVIDER;
    });
  });

  describe("monitorFileHealth", () => {
    it("should return healthy status when file is available on multiple gateways", async () => {
      const mockFetch = require("node-fetch");
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        });

      const result = await monitorFileHealth("QmTestCID123");

      expect(result.health).toBe("healthy");
      expect(result.replicationFactor).toBeGreaterThan(1);
      expect(result.lastChecked).toBeInstanceOf(Date);
    });

    it("should return degraded status when file is available only one gateway", async () => {
      const mockFetch = require("node-fetch");
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      const result = await monitorFileHealth("QmTestCID123");

      expect(result.health).toBe("degraded");
      expect(result.replicationFactor).toBe(1);
      expect(result.lastChecked).toBeInstanceOf(Date);
    });

    it("should return unhealthy status when file is not available on any gateway", async () => {
      const mockFetch = require("node-fetch");
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      const result = await monitorFileHealth("QmTestCID123");

      expect(result.health).toBe("unhealthy");
      expect(result.replicationFactor).toBe(0);
      expect(result.lastChecked).toBeInstanceOf(Date);
    });
  });

  describe("Cache Functions", () => {
    beforeEach(() => {
      cleanupCache(); // Clean cache before each test
    });

    it("should set and get cached data", () => {
      const key = "test-key";
      const data = { test: "data" };
      const ttl = 300000; // 5 minutes

      setCachedData(key, data, ttl);

      const result = getCachedData(key, ttl);
      expect(result).toEqual(data);
    });

    it("should return null for expired cache entries", () => {
      const key = "test-key";
      const data = { test: "data" };
      const ttl = 10; // 10ms

      setCachedData(key, data, ttl);

      // Wait for TTL to expire
      jest.advanceTimersByTime(15);

      const result = getCachedData(key, ttl);
      expect(result).toBeNull();
    });

    it("should return null for non-existent cache entries", () => {
      const result = getCachedData("non-existent-key");
      expect(result).toBeNull();
    });

    it("should clean up expired cache entries", () => {
      const key1 = "test-key-1";
      const key2 = "test-key-2";
      const data1 = { test: "data1" };
      const data2 = { test: "data2" };
      const ttl = 10; // 10ms

      setCachedData(key1, data1, ttl);
      setCachedData(key2, data2, ttl);

      // Wait for TTL to expire
      jest.advanceTimersByTime(15);

      cleanupCache();

      const result1 = getCachedData(key1, ttl);
      const result2 = getCachedData(key2, ttl);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it("should not clean up non-expired cache entries", () => {
      const key1 = "test-key-1";
      const key2 = "test-key-2";
      const data1 = { test: "data1" };
      const data2 = { test: "data2" };
      const ttl = 1000; // 1 second

      setCachedData(key1, data1, ttl);
      setCachedData(key2, data2, ttl);

      // Wait for less than TTL
      jest.advanceTimersByTime(5);

      cleanupCache();

      const result1 = getCachedData(key1, ttl);
      const result2 = getCachedData(key2, ttl);

      expect(result1).toEqual(data1);
      expect(result2).toEqual(data2);
    });
  });

  describe("Security Validation", () => {
    it("should sanitize metadata to prevent injection attacks", async () => {
      const maliciousMetadata = {
        ...mockMetadata,
        title: 'Test <script>alert("xss")</script>',
        artist: 'Test " onclick="alert(\'xss\')"',
        description: 'Description <img src=x onerror=alert("xss")>',
      };

      const mockUploadResult = {
        cid: "QmTestCID123",
        size: 1000000,
        timestamp: new Date(),
        metadata: {
          ...mockMetadata,
          title: "Test ",
          artist: 'Test " onclick="alert(\'xss\')"',
          description: 'Description <img src=x onerror=alert("xss")>',
        },
      };

      (require("@/lib/ipfs").uploadToIPFS as jest.Mock).mockResolvedValue({
        cid: "QmTestCID123",
        size: 1000000,
      });

      (require("@/lib/ipfs").pinFile as jest.Mock).mockResolvedValue(true);

      const result = await uploadWithReplication(mockFile, maliciousMetadata);

      // The sanitized metadata should have dangerous characters removed
      expect(result.metadata.title).not.toContain("<script>");
      expect(result.metadata.artist).not.toContain("onclick");
      expect(result.metadata.description).not.toContain("onerror");
    });
  });

  describe("Error Handling", () => {
    it("should handle errors during replication", async () => {
      const mockFetch = require("node-fetch");
      mockFetch.mockRejectedValue(new Error("Network error"));

      const mockUploadResult = {
        cid: "QmTestCID123",
        size: 1000000,
        timestamp: new Date(),
        metadata: mockMetadata,
      };

      (require("@/lib/ipfs").uploadToIPFS as jest.Mock).mockResolvedValue({
        cid: "QmTestCID123",
        size: 1000000,
      });

      (require("@/lib/ipfs").pinFile as jest.Mock).mockResolvedValue(true);

      const result = await uploadWithReplication(mockFile, mockMetadata);

      expect(result.replicationStatus.success).toBe(false);
      expect(result.replicationStatus.failedNodes.length).toBeGreaterThan(0);
    });

    it("should handle pinning errors gracefully", async () => {
      const mockUploadResult = {
        cid: "QmTestCID123",
        size: 1000000,
        timestamp: new Date(),
        metadata: mockMetadata,
      };

      (require("@/lib/ipfs").uploadToIPFS as jest.Mock).mockResolvedValue({
        cid: "QmTestCID123",
        size: 1000000,
      });

      (require("@/lib/ipfs").pinFile as jest.Mock).mockRejectedValue(
        new Error("Pinning failed")
      );

      const result = await uploadWithReplication(mockFile, mockMetadata);

      // Should still succeed even if pinning fails
      expect(result.cid).toBe("QmTestCID123");
    });
  });
});
