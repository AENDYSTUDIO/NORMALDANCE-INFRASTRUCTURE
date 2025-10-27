/**
 * Тесты обратной совместимости для модулей безопасности:
 * - Легаси точки импорта input-sanitizer.ts и input-validator.ts
 * - Алиасы имён функций в индексном экспорте
 * - Мягкие предупреждения о депрекеейте (при включении)
 */

import { describe, expect, it, jest } from "@jest/globals";
import * as Security from "../../src/lib/security";
import {
  isValidEmail,
  isValidEthereumAddress,
  isValidIPFSCID,
  isValidSolanaAddress,
  isValidTONAddress,
  sanitizeFilename as legacySanitizeFilename,
  sanitizeHTML as legacySanitizeHTML,
  sanitizeSQL as legacySanitizeSQL,
  sanitizeURL as legacySanitizeURL,
  stripHTML as legacyStripHTML,
} from "../../src/lib/security/input-sanitizer";
import { InputValidator } from "../../src/lib/security/input-validator";

describe("Security legacy modules backward compatibility", () => {
  it("index alias exports map to modern implementations", () => {
    const html = '<b>bold & "quote"</b>';

    // escapeHtml алиас для escapeHTML
    const sanitizedNew = Security.escapeHTML(html);
    const sanitizedAlias = Security.escapeHtml(html);
    expect(sanitizedAlias).toBe(sanitizedNew);

    // stripHtml алиас для stripDangerousHtml
    const strippedNew = Security.stripDangerousHtml(html);
    const strippedAlias = Security.stripHtml(html);
    expect(strippedAlias).toBe(strippedNew);

    // sanitizeUrl алиас для sanitizeURL
    const url = "http://example.com";
    const urlAlias = Security.sanitizeUrl(url);
    const urlNew = Security.sanitizeURL(url);
    expect(urlAlias).toBe(urlNew);

    // sanitizeSql алиас для sanitizeSQL (легаси реализация)
    const sql = "O'Hara; DROP TABLE users;";
    const sqlAlias = Security.sanitizeSql(sql);
    const sqlNew = legacySanitizeSQL(sql);
    expect(sqlAlias).toBe(sqlNew);
  });

  it("legacy input-sanitizer functions remain available and functional", () => {
    expect(typeof legacySanitizeHTML).toBe("function");
    expect(typeof legacyStripHTML).toBe("function");
    expect(typeof legacySanitizeURL).toBe("function");
    expect(typeof legacySanitizeFilename).toBe("function");
    expect(typeof legacySanitizeSQL).toBe("function");
    expect(typeof isValidEmail).toBe("function");
    expect(typeof isValidSolanaAddress).toBe("function");
    expect(typeof isValidTONAddress).toBe("function");
    expect(typeof isValidEthereumAddress).toBe("function");
    expect(typeof isValidIPFSCID).toBe("function");

    const malicious = '<script>alert("xss")</script>';
    const s1 = legacySanitizeHTML(malicious);
    expect(typeof s1).toBe("string");

    const stripped = legacyStripHTML(malicious);
    expect(typeof stripped).toBe("string");

    const safeUrl = legacySanitizeURL("ipfs://Qm123");
    expect(safeUrl === null || typeof safeUrl === "string").toBe(true);

    const filename = legacySanitizeFilename("../etc/passwd");
    expect(typeof filename).toBe("string");

    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("bad@")).toBe(false);
  });

  it("legacy InputValidator class exposes alias methods", () => {
    const html = "<i>italic</i>";
    expect(InputValidator.sanitizeHTML(html)).toBe(
      InputValidator.sanitizeHtml(html)
    );
    expect(InputValidator.sanitizeSQL("a'b")).toBe(
      InputValidator.escapeSql("a'b")
    );

    const jsonOk = InputValidator.validateJSON('{"a":1}');
    expect(jsonOk.isValid).toBe(true);

    const jsonBad = InputValidator.validateJSON("{bad}");
    expect(jsonBad.isValid).toBe(false);
  });

  it("deprecation warnings emit once per module when enabled", () => {
    const originalEnv = { ...process.env };
    jest.resetModules();
    (process.env as any).SECURITY_LEGACY_WARNINGS = "force";
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    // Перезагрузка модулей для триггера IIFE предупреждений
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("../../src/lib/security/input-sanitizer");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("../../src/lib/security/input-validator");

    expect(warnSpy.mock.calls.length).toBeGreaterThanOrEqual(1);

    warnSpy.mockRestore();
    process.env = originalEnv;
  });
});
