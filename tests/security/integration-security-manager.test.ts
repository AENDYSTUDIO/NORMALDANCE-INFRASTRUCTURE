/**
 * Интеграционные тесты для SecurityManager из src/lib/security/SecurityManager.ts
 * Проверяет взаимодействие компонентов безопасности
 */

import {
  AuditInput,
  AuditReport,
  CSRFToken,
  CSRFVerification,
  HeadersResult,
  PoliciesCheck,
  SanitizationOptions,
  SecurityConfig,
  SecurityContext,
  ValidatorRegistration,
} from "@/lib/security/ISecurityService";
import { SecurityManager } from "@/lib/security/SecurityManager";

// Вспомогательные функции для создания результатов
function ResultOk<T>(value: T): { ok: true; value: T } {
  return { ok: true, value };
}

function ResultErr<T>(error: any): { ok: false; errors: any[] } {
  return { ok: false, errors: [error] };
}

describe("SecurityManager интеграционные тесты", () => {
  let securityManager: SecurityManager;
  let config: SecurityConfig;

  beforeEach(() => {
    config = {
      csrf: {
        cookieName: "nd_csrf",
        headerName: "x-csrf-token",
        ttlSeconds: 3600,
        sameSite: "lax",
        secure: false,
        path: "/",
      },
      headers: {
        contentSecurityPolicy: "default-src 'self'",
        hsts: {
          enabled: true,
          maxAgeSeconds: 31536000,
          includeSubDomains: true,
          preload: false,
        },
        xContentTypeOptions: "nosniff",
        xFrameOptions: "DENY",
        referrerPolicy: "strict-origin-when-cross-origin",
        permissionsPolicy: {
          camera: "()",
          microphone: "()",
          geolocation: "()",
        },
        additional: {},
      },
    };

    securityManager = new SecurityManager(config);
  });

  describe("регистрация и валидация валидаторов", () => {
    it("должна регистрировать использовать валидаторы", () => {
      // Регистрация валидатора email
      const emailValidator: ValidatorRegistration<string, string> = {
        name: "email",
        fn: (input: string) => {
          if (typeof input !== "string" || !input.includes("@")) {
            return ResultErr({
              code: "VALIDATION_ERROR",
              message: "Invalid email format",
              path: [],
              meta: { input },
            });
          }
          return ResultOk(input.toLowerCase());
        },
      };

      securityManager.registerValidator(emailValidator);

      // Использование валидатора
      const result = securityManager.validate("email", "TEST@EXAMPLE.COM");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("test@example.com");
      }
    });

    it("должна возвращать ошибку при отсутствии валидатора", () => {
      const result = securityManager.validate("nonexistent", "input");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0].code).toBe("VALIDATION_ERROR");
        expect(result.errors[0].message).toContain("Validator not found");
      }
    });

    it("должна обрабатывать ошибки валидатора", () => {
      const failingValidator: ValidatorRegistration<string, string> = {
        name: "failing",
        fn: () => {
          throw new Error("Validation failed");
        },
      };

      securityManager.registerValidator(failingValidator);

      const result = securityManager.validate("failing", "input");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0].code).toBe("VALIDATION_ERROR");
        expect(result.errors[0].message).toContain("Validation failed");
      }
    });
  });

  describe("санитизация строк", () => {
    const ctx: SecurityContext = { runtime: "server" };

    it("должна санитизировать HTML контекст", () => {
      const input = '<script>alert("xss")</script>';
      const opts: SanitizationOptions = { kind: "html" };
      const result = securityManager.sanitizeString(input, ctx, opts);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('<script>alert("xss")<&#x2F;script>');
      }
    });

    it("должна санитизировать URL контекст", () => {
      const input = "javascript:alert(1)";
      const opts: SanitizationOptions = { kind: "url" };
      const result = securityManager.sanitizeString(input, ctx, opts);
      expect(result.ok).toBe(false); // Ожидаем ошибку, так как URL недействителен

      const safeInput = "https://example.com";
      const safeResult = securityManager.sanitizeString(safeInput, ctx, opts);
      expect(safeResult.ok).toBe(true);
      if (safeResult.ok) {
        expect(safeResult.value).toBe("https://example.com");
      }
    });

    it("должна санитизировать FILENAME контекст", () => {
      const input = "../../etc/passwd";
      const opts: SanitizationOptions = { kind: "filename" };
      const result = securityManager.sanitizeString(input, ctx, opts);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("etc-passwd");
      }
    });

    it("должна санитизировать ATTRIBUTE контекст", () => {
      const input = '<script>alert("xss")</script>';
      const opts: SanitizationOptions = { kind: "attr" };
      const result = securityManager.sanitizeString(input, ctx, opts);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('<script>alert("xss")<&#x2F;script>');
      }
    });
  });

  describe("санитизация объектов", () => {
    const ctx: SecurityContext = { runtime: "server" };

    it("должна санитизировать объект в HTML контексте", () => {
      const input = {
        title: '<script>alert("xss")</script>',
        description: "Safe description",
        nested: {
          content: '<img src="x" onerror="alert(1)">',
        },
      };

      const opts: SanitizationOptions = { kind: "html" };
      const result = securityManager.sanitizeObject(input, ctx, opts);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({
          title: '<script>alert("xss")<&#x2F;script>',
          description: "Safe description",
          nested: {
            content: '<img src="x" >',
          },
        });
      }
    });
  });

  describe("CSRF функции", () => {
    const ctx: SecurityContext = {
      runtime: "server",
      sessionId: "test-session",
    };

    it("должна генерировать CSRF-токены", () => {
      const csrfResult: CSRFToken = securityManager.generateCsrfToken(ctx);

      // Проверка структуры результата
      expect(csrfResult.token).toBeDefined();
      expect(typeof csrfResult.token).toBe("string");
      expect(csrfResult.token.length).toBeGreaterThan(0);
      expect(csrfResult.expiresAt).toBeGreaterThan(Date.now());
    });

    it("должна проверять CSRF-токены", () => {
      const mockHeaders = new Headers();
      mockHeaders.set("x-csrf-token", "valid-token");

      const verifyResult: CSRFVerification = securityManager.verifyCsrfToken(
        ctx,
        mockHeaders
      );
      expect(verifyResult.valid).toBe(true);

      // Проверка без токена
      const emptyHeaders = new Headers();
      const invalidVerifyResult: CSRFVerification =
        securityManager.verifyCsrfToken(ctx, emptyHeaders);
      expect(invalidVerifyResult.valid).toBe(false);
      expect(invalidVerifyResult.reason).toBe("Missing CSRF token");
    });
  });

  describe("заголовки безопасности", () => {
    const ctx: SecurityContext = { runtime: "server" };

    it("должна формировать заголовки безопасности", () => {
      const headersResult: HeadersResult =
        securityManager.buildSecurityHeaders(ctx);
      expect(headersResult.headers).toBeDefined();
      expect(headersResult.headers["X-Content-Type-Options"]).toBe("nosniff");
      expect(headersResult.headers["X-Frame-Options"]).toBe("DENY");
      expect(headersResult.headers["Referrer-Policy"]).toBe(
        "strict-origin-when-cross-origin"
      );
    });
  });

  describe("проверка политик", () => {
    const ctx: SecurityContext = { runtime: "server" };

    it("должна проверять политики безопасности", () => {
      const result: PoliciesCheck = securityManager.checkPolicies(ctx);
      expect(result.ok).toBe(true);
    });
  });

  describe("аудит безопасности", () => {
    it("должна выполнять аудит", () => {
      const auditInput: AuditInput = {
        context: {
          runtime: "server",
          userId: "user123",
          sessionId: "session456",
        },
      };

      const report: AuditReport = securityManager.audit(auditInput);
      expect(report.timestamp).toBeDefined();
      expect(report.timestamp).toBeLessThanOrEqual(Date.now());
      expect(report.context).toBe(auditInput.context);
      expect(report.headers).toBeDefined();
      expect(report.results).toBeDefined();
      expect(report.results.sanitization).toEqual([]);
      expect(report.results.validation).toEqual([]);
      expect(report.results.csrf).toEqual([]);
      expect(report.results.policies).toEqual([]);
    });
  });

  describe("вспомогательные функции экранирования", () => {
    it("должна экранировать HTML", () => {
      const input = '<script>alert("xss")</script>';
      const result = securityManager.escapeHTML(input);
      expect(result).toBe('<script>alert("xss")<&#x2F;script>');
    });

    it("должна экранировать атрибуты", () => {
      const input = '<script>alert("xss")</script>';
      const result = securityManager.escapeAttribute(input);
      expect(result).toBe('<script>alert("xss")<&#x2F;script>');
    });

    it("должна санитизировать URL", () => {
      const result = securityManager.sanitizeURL("javascript:alert(1)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }

      const safeResult = securityManager.sanitizeURL("https://example.com");
      expect(safeResult.ok).toBe(true);
      if (safeResult.ok) {
        expect(safeResult.value).toBe("https://example.com");
      }
    });

    it("должна санитизировать имена файлов", () => {
      const result = securityManager.sanitizeFilename("../../etc/passwd");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("etc-passwd");
      }
    });

    it("должна экранировать SQL", () => {
      const result = securityManager.escapeSql("O'Reilly");
      expect(result).toBe("O''Reilly");
    });
  });

  describe("интеграция компонентов", () => {
    it("должна использовать санитизацию валидаторов", () => {
      // Регистрируем валидатор, который санитизирует ввод
      const sanitizeValidator: ValidatorRegistration<string, string> = {
        name: "sanitize-html",
        fn: (input: string) => {
          if (typeof input !== "string") {
            return ResultErr({
              code: "VALIDATION_ERROR",
              message: "Input must be string",
              path: [],
              meta: { input },
            });
          }

          // Используем внутреннюю санитизацию
          const sanitizationResult = securityManager.sanitizeString(
            input,
            { runtime: "server" },
            { kind: "html" }
          );
          if (sanitizationResult.ok) {
            return ResultOk(sanitizationResult.value);
          } else {
            return ResultErr({
              code: "SANITIZATION_APPLIED",
              message: "Sanitization failed",
              path: [],
              meta: { input },
            });
          }
        },
      };

      securityManager.registerValidator(sanitizeValidator);

      const maliciousInput = '<script>alert("xss")</script>';
      const result = securityManager.validate("sanitize-html", maliciousInput);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('<script>alert("xss")<&#x2F;script>');
      }
    });

    it("должна комбинировать санитизацию и валидацию", () => {
      // Регистрируем валидатор, который сначала санитизирует, потом валидирует
      const validateSanitizeValidator: ValidatorRegistration<string, string> = {
        name: "validate-sanitize-email",
        fn: (input: string) => {
          if (typeof input !== "string") {
            return ResultErr({
              code: "VALIDATION_ERROR",
              message: "Input must be string",
              path: [],
              meta: { input },
            });
          }

          // Санитизация
          const sanitizationResult = securityManager.sanitizeString(
            input,
            { runtime: "server" },
            { kind: "html" }
          );
          if (!sanitizationResult.ok) {
            return ResultErr({
              code: "SANITIZATION_APPLIED",
              message: "Sanitization failed",
              path: [],
              meta: { input },
            });
          }

          const sanitized = sanitizationResult.value.trim();

          // Валидация
          if (!sanitized.includes("@") || !sanitized.includes(".")) {
            return ResultErr({
              code: "VALIDATION_ERROR",
              message: "Invalid email format after sanitization",
              path: [],
              meta: { sanitized },
            });
          }

          return ResultOk(sanitized.toLowerCase());
        },
      };

      securityManager.registerValidator(validateSanitizeValidator);

      const result = securityManager.validate(
        "validate-sanitize-email",
        "<b>TEST@EXAMPLE.COM</b>"
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("<b>test@example.com</b>");
      }
    });
  });
});
