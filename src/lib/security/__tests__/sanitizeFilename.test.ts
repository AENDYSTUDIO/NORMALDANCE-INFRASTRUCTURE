/**
 * Тесты для sanitizeFilename в NORMALDANCE.
 * Проверяет централизованную реализацию sanitizeFilename в [TypeScript.sanitize.ts](src/lib/security/sanitize.ts:1)
 * и её интеграцию через [TypeScript.index.ts](src/lib/security/index.ts:1).
 */

import { sanitizeFilename } from "../sanitize";

describe("sanitizeFilename", () => {
  test("should sanitize dangerous paths", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("etc-passwd");
    expect(sanitizeFilename("../../../windows/system32")).toBe(
      "windows-system32"
    );
    expect(sanitizeFilename("..\\..\\secret.txt")).toBe("secret-txt");
  });

  test("should handle special characters", () => {
    expect(sanitizeFilename("file<>.txt")).toBe("file__.txt");
    expect(sanitizeFilename("test|*?.log")).toBe("test___log");
    expect(sanitizeFilename("file:with:colons.txt")).toBe(
      "file-with-colons-txt"
    );
  });

  test("should prevent CLI option confusion", () => {
    expect(sanitizeFilename("-file.txt")).toBe("file.txt");
    expect(sanitizeFilename("--malicious.txt")).toBe("malicious.txt");
    expect(sanitizeFilename("-flag=value.txt")).toBe("flag=value-txt");
  });

  test("should preserve valid filenames", () => {
    expect(sanitizeFilename("valid-file_123.txt")).toBe("valid-file_123.txt");
    expect(sanitizeFilename("file.with.dots.pdf")).toBe("file.with.dots.pdf");
    expect(sanitizeFilename("underscore_test.doc")).toBe("underscore_test.doc");
  });

  test("should limit length", () => {
    const longName = "a".repeat(300) + ".txt";
    const sanitized = sanitizeFilename(longName);
    expect(sanitized.length).toBeLessThanOrEqual(255);
    expect(sanitized.endsWith(".txt")).toBe(true);
  });

  test("should handle edge cases", () => {
    expect(sanitizeFilename("")).toBe("");
    expect(sanitizeFilename("...")).toBe("");
    expect(sanitizeFilename("/")).toBe("-");
    expect(sanitizeFilename("\\")).toBe("-");
  });
});
