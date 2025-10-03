// Минимальные тесты для IPFS Helia адаптера
import { afterEach, beforeEach, describe, expect, it, vi } from "@jest/globals";

// Мокаем Helia и его зависимости
vi.mock("helia", () => ({
  createHelia: vi.fn(),
}));

vi.mock("@helia/unixfs", () => ({
  unixfs: vi.fn(),
}));

// Импортируем функции для тестирования
import {
  checkFileAvailabilityHelia,
  getFileFromIPFSHelia,
  getMetadataFromIPFSHelia,
  pinFileHelia,
  unpinFileHelia,
  uploadToIPFSHelia,
} from "../../src/lib/ipfs-helia-adapter";

describe("IPFS Helia Adapter Tests", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("uploadToIPFSHelia", () => {
    it("should be defined", () => {
      expect(uploadToIPFSHelia).toBeDefined();
    });

    it("should be a function", () => {
      expect(typeof uploadToIPFSHelia).toBe("function");
    });
  });

  describe("getFileFromIPFSHelia", () => {
    it("should be defined", () => {
      expect(getFileFromIPFSHelia).toBeDefined();
    });

    it("should be a function", () => {
      expect(typeof getFileFromIPFSHelia).toBe("function");
    });
  });

  describe("getMetadataFromIPFSHelia", () => {
    it("should be defined", () => {
      expect(getMetadataFromIPFSHelia).toBeDefined();
    });

    it("should be a function", () => {
      expect(typeof getMetadataFromIPFSHelia).toBe("function");
    });
  });

  describe("pinFileHelia", () => {
    it("should be defined", () => {
      expect(pinFileHelia).toBeDefined();
    });

    it("should be a function", () => {
      expect(typeof pinFileHelia).toBe("function");
    });
  });

  describe("unpinFileHelia", () => {
    it("should be defined", () => {
      expect(unpinFileHelia).toBeDefined();
    });

    it("should be a function", () => {
      expect(typeof unpinFileHelia).toBe("function");
    });
  });

  describe("checkFileAvailabilityHelia", () => {
    it("should be defined", () => {
      expect(checkFileAvailabilityHelia).toBeDefined();
    });

    it("should be a function", () => {
      expect(typeof checkFileAvailabilityHelia).toBe("function");
    });
  });
});
