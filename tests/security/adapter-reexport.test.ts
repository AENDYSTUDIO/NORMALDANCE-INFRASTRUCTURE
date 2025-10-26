/**
 * Тесты для адаптеров и реэкспортов безопасности
 * Проверяет, что все публичные экспорты работают корректно и совместимы
 */

import * as securityModule from "@/lib/security";
import {
  // Реэкспорты из xss-csrf
  buildSetCookieHeader,
  escapeAttribute,
  escapeHTML,
  extractCsrfFromRequestLike,
  generateCsrfToken,
  issueCsrfForResponse,
  normalizeCsrfConfig,
  parseCookiesHeader,
  safeAttr,
  safeHtmlText,
  safeUrl,
  sanitizeFilename,
  sanitizeObjectForContext,
  sanitizeString,
  sanitizeURL,
  stripDangerousHtml,
  verifyCsrfDoubleSubmit,
  verifyCsrfToken,
  xssCsrf,
} from "@/lib/security";
import {
  isValidEmail,
  isValidEthereumAddress,
  isValidIPFSCID,
  isValidSolanaAddress,
  isValidTONAddress,
  sanitizeSQL,
} from "@/lib/security/input-sanitizer";
import { InputValidator } from "@/lib/security/input-validator";
import {
  detectSuspiciousPatterns,
  validateNumber,
} from "@/lib/security/security-utils";

describe("Тесты адаптеров и реэкспортов безопасности", () => {
  describe("Проверка реэкспортов из основного модуля", () => {
    it("должен экспортировать escapeHTML", () => {
      expect(securityModule.escapeHTML).toBeDefined();
      expect(typeof securityModule.escapeHTML).toBe("function");
      expect(escapeHTML).toBeDefined();
      expect(typeof escapeHTML).toBe("function");
      expect(escapeHTML('<script>alert("xss")</script>')).toBe(
        '<script>alert("xss")<&#x2F;script>'
      );
    });

    it("должен экспортировать escapeAttribute", () => {
      expect(securityModule.escapeAttribute).toBeDefined();
      expect(typeof securityModule.escapeAttribute).toBe("function");
      expect(escapeAttribute).toBeDefined();
      expect(typeof escapeAttribute).toBe("function");
    });

    it("должен экспортировать sanitizeURL", () => {
      expect(securityModule.sanitizeURL).toBeDefined();
      expect(typeof securityModule.sanitizeURL).toBe("function");
      expect(sanitizeURL).toBeDefined();
      expect(typeof sanitizeURL).toBe("function");
    });

    it("должен экспортировать stripDangerousHtml", () => {
      expect(securityModule.stripDangerousHtml).toBeDefined();
      expect(typeof securityModule.stripDangerousHtml).toBe("function");
      expect(stripDangerousHtml).toBeDefined();
      expect(typeof stripDangerousHtml).toBe("function");
    });

    it("должен экспортировать sanitizeString", () => {
      expect(securityModule.sanitizeString).toBeDefined();
      expect(typeof securityModule.sanitizeString).toBe("function");
      expect(sanitizeString).toBeDefined();
      expect(typeof sanitizeString).toBe("function");
    });

    it("должен экспортировать sanitizeObjectForContext", () => {
      expect(securityModule.sanitizeObjectForContext).toBeDefined();
      expect(typeof securityModule.sanitizeObjectForContext).toBe("function");
      expect(sanitizeObjectForContext).toBeDefined();
      expect(typeof sanitizeObjectForContext).toBe("function");
    });

    it("должен экспортировать вспомогательные функции", () => {
      expect(securityModule.safeAttr).toBeDefined();
      expect(securityModule.safeHtmlText).toBeDefined();
      expect(securityModule.safeUrl).toBeDefined();
      expect(securityModule.sanitizeFilename).toBeDefined();

      expect(safeAttr).toBeDefined();
      expect(safeHtmlText).toBeDefined();
      expect(safeUrl).toBeDefined();
      expect(sanitizeFilename).toBeDefined();
    });
  });

  describe("Проверка реэкспортов из xss-csrf", () => {
    it("должен экспортировать CSRF функции", () => {
      expect(securityModule.generateCsrfToken).toBeDefined();
      expect(securityModule.verifyCsrfToken).toBeDefined();
      expect(securityModule.verifyCsrfDoubleSubmit).toBeDefined();
      expect(securityModule.normalizeCsrfConfig).toBeDefined();
      expect(securityModule.issueCsrfForResponse).toBeDefined();
      expect(securityModule.extractCsrfFromRequestLike).toBeDefined();

      expect(generateCsrfToken).toBeDefined();
      expect(verifyCsrfToken).toBeDefined();
      expect(verifyCsrfDoubleSubmit).toBeDefined();
      expect(normalizeCsrfConfig).toBeDefined();
      expect(issueCsrfForResponse).toBeDefined();
      expect(extractCsrfFromRequestLike).toBeDefined();
    });

    it("должен экспортировать cookie/заголовочные функции", () => {
      expect(securityModule.buildSetCookieHeader).toBeDefined();
      expect(securityModule.parseCookiesHeader).toBeDefined();

      expect(buildSetCookieHeader).toBeDefined();
      expect(parseCookiesHeader).toBeDefined();
    });

    it("должен экспортировать весь xssCsrf объект", () => {
      expect(securityModule.xssCsrf).toBeDefined();
      expect(xssCsrf).toBeDefined();
      expect(typeof xssCsrf).toBe("object");
      expect(xssCsrf.escapeHTML).toBeDefined();
      expect(xssCsrf.escapeAttribute).toBeDefined();
      expect(xssCsrf.sanitizeURL).toBeDefined();
    });
  });

  describe("Проверка легаси-алиасов", () => {
    it("должен предоставлять алиасы для совместимости", () => {
      // Проверяем, что алиасы определены
      expect(securityModule.escapeHtml).toBeDefined();
      expect(securityModule.sanitizeHTML).toBeDefined();
      expect(securityModule.stripHTML).toBeDefined();
      expect(securityModule.stripHtml).toBeDefined();
      expect(securityModule.sanitizeUrl).toBeDefined();
      expect(securityModule.sanitizeSql).toBeDefined();

      // Проверяем, что алиасы работают как оригинальные функции
      expect(securityModule.escapeHtml('<script>alert("xss")</script>')).toBe(
        escapeHTML('<script>alert("xss")</script>')
      );
      expect(securityModule.sanitizeHTML('<script>alert("xss")</script>')).toBe(
        escapeHTML('<script>alert("xss")</script>')
      );
      expect(securityModule.stripHTML('<script>alert("xss")</script>')).toBe(
        stripDangerousHtml('<script>alert("xss")</script>')
      );
      expect(securityModule.stripHtml('<script>alert("xss")</script>')).toBe(
        stripDangerousHtml('<script>alert("xss")</script>')
      );
      expect(securityModule.sanitizeUrl("https://example.com")).toBe(
        sanitizeURL("https://example.com")
      );
      expect(securityModule.sanitizeSql("O'Reilly")).toBe(
        sanitizeSQL("O'Reilly")
      );
    });
  });

  describe("Проверка InputValidator", () => {
    it("должен экспортировать InputValidator", () => {
      expect(securityModule.InputValidator).toBeDefined();
      expect(InputValidator).toBeDefined();
      expect(InputValidator).toBe(securityModule.InputValidator);

      // Проверяем, что InputValidator работает
      expect(InputValidator.sanitizeHtml("Safe text")).toBe("Safe text");
    });
  });

  describe("Проверка функций из security-utils", () => {
    it("должен экспортировать validateNumber", () => {
      expect(securityModule.validateNumber).toBeDefined();
      expect(validateNumber).toBeDefined();
      expect(validateNumber).toBe(securityModule.validateNumber);

      // Проверяем, что функция работает
      expect(validateNumber(42, 1, 100)).toBe(42);
      expect(validateNumber(0, 1, 100)).toBeNull();
    });

    it("должен экспортировать detectSuspiciousPatterns", () => {
      expect(securityModule.detectSuspiciousPatterns).toBeDefined();
      expect(detectSuspiciousPatterns).toBeDefined();
      expect(detectSuspiciousPatterns).toBe(
        securityModule.detectSuspiciousPatterns
      );

      // Проверяем, что функция работает
      expect(detectSuspiciousPatterns("Safe text")).toEqual([]);
      expect(detectSuspiciousPatterns("SELECT * FROM users")).not.toEqual([]);
    });
  });

  describe("Проверка функций из input-sanitizer", () => {
    it("должен экспортировать валидаторы адресов", () => {
      expect(securityModule.isValidEmail).toBeDefined();
      expect(securityModule.isValidSolanaAddress).toBeDefined();
      expect(securityModule.isValidEthereumAddress).toBeDefined();
      expect(securityModule.isValidTONAddress).toBeDefined();
      expect(securityModule.isValidIPFSCID).toBeDefined();

      expect(isValidEmail).toBeDefined();
      expect(isValidSolanaAddress).toBeDefined();
      expect(isValidEthereumAddress).toBeDefined();
      expect(isValidTONAddress).toBeDefined();
      expect(isValidIPFSCID).toBeDefined();

      // Проверяем, что функции работают
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(
        isValidSolanaAddress("5xoBq7f733X7s7mBKMdRyZnYf53S62WrZjfkKcFZc6qf")
      ).toBe(true);
    });

    it("должен экспортировать sanitizeSQL", () => {
      expect(securityModule.sanitizeSQL).toBeDefined();
      expect(sanitizeSQL).toBeDefined();
      expect(sanitizeSQL).toBe(securityModule.sanitizeSQL);

      // Проверяем, что функция работает
      expect(sanitizeSQL("O'Reilly")).toBe("O''Reilly");
    });
  });

  describe("Проверка InputValidationResult", () => {
    it("должен экспортировать InputValidationResult", () => {
      expect(securityModule.InputValidationResult).toBeDefined();
    });
  });

  describe("Проверка конфигурации CSRF", () => {
    it("должен экспортировать типы CSRF", () => {
      // Проверяем, что типы определены в пространстве имен модуля
      expect(securityModule.CsrfConfig).toBeUndefined(); // Это тип, не значение

      // Но должны быть доступны функции, использующие эти типы
      expect(typeof normalizeCsrfConfig).toBe("function");
      expect(typeof generateCsrfToken).toBe("function");
    });
  });

  describe("Проверка обратной совместимости", () => {
    it("все основные функции должны быть доступны через основной экспорт", () => {
      // Проверяем, что все функции, которые мы ожидаем, доступны
      const expectedFunctions = [
        "escapeHTML",
        "escapeAttribute",
        "sanitizeURL",
        "stripDangerousHtml",
        "sanitizeString",
        "sanitizeObjectForContext",
        "safeAttr",
        "safeHtmlText",
        "safeUrl",
        "sanitizeFilename",
        "buildSetCookieHeader",
        "extractCsrfFromRequestLike",
        "generateCsrfToken",
        "issueCsrfForResponse",
        "normalizeCsrfConfig",
        "parseCookiesHeader",
        "verifyCsrfDoubleSubmit",
        "verifyCsrfToken",
        "xssCsrf",
        "InputValidator",
        "validateNumber",
        "detectSuspiciousPatterns",
        "isValidEmail",
        "isValidSolanaAddress",
        "isValidEthereumAddress",
        "isValidTONAddress",
        "isValidIPFSCID",
        "sanitizeSQL",
        "escapeHtml",
        "sanitizeHTML",
        "stripHTML",
        "stripHtml",
        "sanitizeUrl",
        "sanitizeSql",
      ];

      expectedFunctions.forEach((fnName) => {
        expect(securityModule[fnName]).toBeDefined();
      });
    });
  });

  describe("Проверка алиасов типов", () => {
    it("должен экспортировать ValidationResult как InputValidationResult", () => {
      // Это проверка типа, не значение
      expect(securityModule.InputValidationResult).toBeDefined();
    });
  });

  describe("Проверка легаси-предупреждений", () => {
    it("должен содержать информацию о легаси-путих", () => {
      // Проверяем, что модуль содержит предупреждения о легаси-путях
      expect(securityModule.LEGACY_IMPORT_WARNING).toBeDefined();
      expect(typeof securityModule.LEGACY_IMPORT_WARNING).toBe("string");
    });
  });
});
