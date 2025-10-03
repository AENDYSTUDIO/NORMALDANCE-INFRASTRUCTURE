// Минимальные тесты для IPFS адаптера
import { describe, expect, it } from "@jest/globals";

// Импортируем функции для тестирования
import {
  checkFileAvailabilityHelia,
  getFileFromIPFSHelia,
  getMetadataFromIPFSHelia,
  pinFileHelia,
  unpinFileHelia,
  uploadToIPFSHelia,
} from "../../src/lib/ipfs-helia-adapter";

describe("IPFS Adapter Minimal Tests", () => {
  // Проверяем, что все функции определены
  it("should have all adapter functions defined", () => {
    expect(uploadToIPFSHelia).toBeDefined();
    expect(getFileFromIPFSHelia).toBeDefined();
    expect(getMetadataFromIPFSHelia).toBeDefined();
    expect(pinFileHelia).toBeDefined();
    expect(unpinFileHelia).toBeDefined();
    expect(checkFileAvailabilityHelia).toBeDefined();
  });

  // Проверяем, что все функции являются функциями
  it("should have all adapter functions as functions", () => {
    expect(typeof uploadToIPFSHelia).toBe("function");
    expect(typeof getFileFromIPFSHelia).toBe("function");
    expect(typeof getMetadataFromIPFSHelia).toBe("function");
    expect(typeof pinFileHelia).toBe("function");
    expect(typeof unpinFileHelia).toBe("function");
    expect(typeof checkFileAvailabilityHelia).toBe("function");
  });
});
