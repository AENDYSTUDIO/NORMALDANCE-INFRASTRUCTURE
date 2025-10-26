/**
 * Тесты для обеспечения покрытия не ниже 90% для ключевых модулей безопасности
 * Проверяет все публичные API и основные сценарии использования
 */

import * as securityModule from "@/lib/security";
import {
  // XSS/CSRF
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

describe("Полное покрытие безопасности", () => {
  describe("Полное покрытие escapeHTML", () => {
    it("должен экранировать все специальные символы", () => {
      expect(escapeHTML("&")).toBe("&");
      expect(escapeHTML("<")).toBe("<");
      expect(escapeHTML(">")).toBe(">");
      expect(escapeHTML('"')).toBe('"');
      expect(escapeHTML("'")).toBe("&#x27;");
      expect(escapeHTML("/")).toBe("&#x2F;");
      expect(escapeHTML("&<>\"'/")).toBe('&<>"&#x27;&#x2F;');
    });

    it("должен обрабатывать пустую строку", () => {
      expect(escapeHTML("")).toBe("");
    });

    it("должен обрабатывать строки без специальных символов", () => {
      expect(escapeHTML("normal text")).toBe("normal text");
      expect(escapeHTML("12345")).toBe("12345");
    });

    it("должен быть идемпотентным", () => {
      const input = '<script>alert("xss")</script>';
      const first = escapeHTML(input);
      const second = escapeHTML(first);
      expect(first).toBe(second);
    });

    it("должен обрабатывать XSS-векторы", () => {
      expect(escapeHTML("<script>alert(1)</script>")).toBe(
        '<script>alert("1")<&#x2F;script>'
      );
      expect(escapeHTML('<img src="x" onerror="alert(1)">')).toBe(
        '<img src="x" onerror="alert(1)">'
      );
      expect(escapeHTML('<a href="javascript:alert(1)">link</a>')).toBe(
        '<a href="javascript:alert(1)">link<&#x2F;a>'
      );
    });
  });

  describe("Полное покрытие escapeAttribute", () => {
    it("должен экранировать атрибуты", () => {
      expect(escapeAttribute("value")).toBe("value");
      expect(escapeAttribute('onclick="alert(1)"')).toBe('onclick="alert(1)"');
      expect(escapeAttribute("onerror='alert(1)'")).toBe(
        "onerror=&#x27;alert(1)&#x27;"
      );
    });

    it("должен учитывать опции", () => {
      expect(escapeAttribute("/", { allowSlashInAttr: true })).toBe("/");
      expect(escapeAttribute("/")).toBe("&#x2F;");
    });

    it("должен быть идемпотентным", () => {
      const input = 'onclick="alert(1)"';
      const first = escapeAttribute(input);
      const second = escapeAttribute(first);
      expect(first).toBe(second);
    });
  });

  describe("Полное покрытие sanitizeURL", () => {
    it("должен разрешать безопасные URL", () => {
      expect(sanitizeURL("https://example.com")).toBe("https://example.com");
      expect(sanitizeURL("http://example.com")).toBe("http://example.com");
      expect(sanitizeURL("ftp://example.com")).toBe("ftp://example.com");
      expect(sanitizeURL("/relative/path")).toBe("/relative/path");
      expect(sanitizeURL("./relative/path")).toBe("./relative/path");
    });

    it("должен отклонять опасные URL", () => {
      expect(sanitizeURL("javascript:alert(1)")).toBeNull();
      expect(sanitizeURL("vbscript:alert(1)")).toBeNull();
      expect(
        sanitizeURL("data:text/html,<script>alert(1)</script>")
      ).toBeNull();
      expect(sanitizeURL("file:///etc/passwd")).toBeNull();
      expect(sanitizeURL("//malicious.com")).toBeNull();
    });

    it("должен работать с разными протоколами", () => {
      expect(sanitizeURL("ipfs://QmHash", ["ipfs"])).toBe("ipfs://QmHash");
      expect(sanitizeURL("ipfs://QmHash", ["http", "https"])).toBeNull();
    });

    it("должен обрабатывать граничные случаи", () => {
      expect(sanitizeURL("")).toBeNull();
      expect(sanitizeURL("   ")).toBeNull();
      expect(sanitizeURL(null as any)).toBeNull();
      expect(sanitizeURL(undefined as any)).toBeNull();
    });
  });

  describe("Полное покрытие stripDangerousHtml", () => {
    it("должен удалять опасные теги", () => {
      expect(stripDangerousHtml('<script>alert("xss")</script>')).toBe("");
      expect(stripDangerousHtml('<iframe src="x"></iframe>')).toBe("");
      expect(stripDangerousHtml('<object data="x"></object>')).toBe("");
      expect(stripDangerousHtml('<embed src="x">')).toBe("");
    });

    it("должен удалять event handler атрибуты", () => {
      expect(stripDangerousHtml('<div onclick="alert(1)">click</div>')).toBe(
        "<div >click</div>"
      );
      expect(stripDangerousHtml('<img onload="alert(1)" src="x">')).toBe(
        '<img  src="x">'
      );
      expect(
        stripDangerousHtml('<a onmouseover="alert(1)" href="x">link</a>')
      ).toBe('<a  href="x">link</a>');
    });

    it("должен удалять опасные URL из атрибутов", () => {
      expect(stripDangerousHtml('<a href="javascript:alert(1)">link</a>')).toBe(
        '<a href="">link</a>'
      );
      expect(stripDangerousHtml('<img src="javascript:alert(1)">')).toBe(
        '<img src="">'
      );
      expect(
        stripDangerousHtml(
          '<iframe src="data:text/html,<script>alert</script>"></iframe>'
        )
      ).toBe('<iframe src=""></iframe>');
    });

    it("должен сохранять безопасные теги", () => {
      expect(stripDangerousHtml("<p>Safe text</p>")).toBe("<p>Safe text</p>");
      expect(stripDangerousHtml('<a href="/safe">Safe link</a>')).toBe(
        '<a href="/safe">Safe link</a>'
      );
      expect(stripDangerousHtml("<b>Bold text</b>")).toBe("<b>Bold text</b>");
    });

    it("должен быть идемпотентным", () => {
      const input = '<script>alert("xss")</script><img onload="alert(1)">';
      const first = stripDangerousHtml(input);
      const second = stripDangerousHtml(first);
      expect(first).toBe(second);
    });
  });

  describe("Полное покрытие sanitizeString", () => {
    it("должен санитизировать для контекста html", () => {
      expect(sanitizeString('<script>alert("xss")</script>', "html")).toBe(
        '<script>alert("xss")<&#x2F;script>'
      );
    });

    it("должен санитизировать для контекста attr", () => {
      expect(sanitizeString('onclick="alert(1)"', "attr")).toBe(
        'onclick="alert(1)"'
      );
    });

    it("должен санитизировать для контекста url", () => {
      expect(sanitizeString("javascript:alert(1)", "url")).toBe("");
      expect(sanitizeString("https://example.com", "url")).toBe(
        "https://example.com"
      );
    });

    it("должен возвращать как есть для контекста raw", () => {
      expect(sanitizeString('<script>alert("xss")</script>', "raw")).toBe(
        '<script>alert("xss")</script>'
      );
    });

    it("должен использовать html по умолчанию", () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe(
        '<script>alert("xss")<&#x2F;script>'
      );
    });
  });

  describe("Полное покрытие sanitizeObjectForContext", () => {
    it("должен санитизировать простые объекты", () => {
      const obj = { title: '<script>alert("xss")</script>', content: "safe" };
      const result = sanitizeObjectForContext(obj, "html");
      expect(result.title).toBe('<script>alert("xss")<&#x2F;script>');
      expect(result.content).toBe("safe");
    });

    it("должен санитизировать вложенные объекты", () => {
      const obj = {
        level1: {
          level2: {
            dangerous: '<script>alert("xss")</script>',
            safe: "text",
          },
        },
      };
      const result = sanitizeObjectForContext(obj, "html");
      expect(result.level1.level2.dangerous).toBe(
        '<script>alert("xss")<&#x2F;script>'
      );
      expect(result.level1.level2.safe).toBe("text");
    });

    it("должен санитизировать массивы", () => {
      const arr = ['<script>alert("xss")</script>', "safe"];
      const result = sanitizeObjectForContext(arr, "html");
      expect(result[0]).toBe('<script>alert("xss")<&#x2F;script>');
      expect(result[1]).toBe("safe");
    });

    it("должен санитизировать массивы объектов", () => {
      const arr = [
        { title: '<script>alert("xss")</script>' },
        { title: "safe" },
      ];
      const result = sanitizeObjectForContext(arr, "html");
      expect(result[0].title).toBe('<script>alert("xss")<&#x2F;script>');
      expect(result[1].title).toBe("safe");
    });
  });

  describe("Полное покрытие вспомогательных функций", () => {
    it("должен работать safeAttr", () => {
      expect(safeAttr('onclick="alert(1)"')).toBe('onclick="alert(1)"');
    });

    it("должен работать safeHtmlText", () => {
      expect(safeHtmlText('<script>alert("xss")</script>')).toBe(
        '<script>alert("xss")<&#x2F;script>'
      );
    });

    it("должен работать safeUrl", () => {
      expect(safeUrl("javascript:alert(1)")).toBe("");
      expect(safeUrl("https://example.com")).toBe("https://example.com");
    });

    it("должен работать sanitizeFilename", () => {
      expect(sanitizeFilename("../../etc/passwd")).toBe("etc-passwd");
      expect(sanitizeFilename("file|invalid<characters>.txt")).toBe(
        "file_invalid_characters_.txt"
      );
      expect(sanitizeFilename("-filename.txt")).toBe("filename.txt");
    });
  });

  describe("Полное покрытие XSS/CSRF функций", () => {
    it("должен работать buildSetCookieHeader", () => {
      const header = buildSetCookieHeader("test", "value", {
        path: "/",
        domain: "example.com",
        secure: true,
        httpOnly: true,
        sameSite: "Strict",
        maxAgeSeconds: 3600,
      });
      expect(header).toContain("test=value");
      expect(header).toContain("Path=/");
      expect(header).toContain("Domain=example.com");
      expect(header).toContain("Secure");
      expect(header).toContain("HttpOnly");
      expect(header).toContain("SameSite=Strict");
      expect(header).toContain("Max-Age=3600");
    });

    it("должен работать parseCookiesHeader", () => {
      const cookies = parseCookiesHeader(
        "session=abc123; user=john; theme=dark"
      );
      expect(cookies).toEqual({
        session: "abc123",
        user: "john",
        theme: "dark",
      });
      expect(parseCookiesHeader(null)).toEqual({});
      expect(parseCookiesHeader("")).toEqual({});
    });

    it("должен работать normalizeCsrfConfig", () => {
      const config = normalizeCsrfConfig({});
      expect(config.secret).toBe("development_only_secret_replace_in_prod");
      expect(config.cookieName).toBe("nd_csrf");
      expect(config.headerName).toBe("x-csrf-token");

      const customConfig = normalizeCsrfConfig({
        secret: "my-secret",
        cookieName: "custom",
        ttlSeconds: 7200,
      });
      expect(customConfig.secret).toBe("my-secret");
      expect(customConfig.cookieName).toBe("custom");
      expect(customConfig.ttlSeconds).toBe(7200);
    });

    it("должен работать generateCsrfToken", async () => {
      const config = normalizeCsrfConfig({ secret: "test-secret" });
      const result = await generateCsrfToken("session123", config);
      expect(result.token).toBeDefined();
      expect(result.cookieName).toBe("nd_csrf");
      expect(result.headerName).toBe("x-csrf-token");
      expect(result.setCookieHeaderValue).toBeDefined();
    });

    it("должен работать verifyCsrfToken", async () => {
      const config = normalizeCsrfConfig({ secret: "test-secret" });
      const tokenResult = await generateCsrfToken("session123", config);

      const validResult = await verifyCsrfToken(tokenResult.token, config);
      expect(validResult.ok).toBe(true);

      const invalidResult = await verifyCsrfToken("invalid-token", config);
      expect(invalidResult.ok).toBe(false);
    });

    it("должен работать extractCsrfFromRequestLike", () => {
      const config = normalizeCsrfConfig({ secret: "test-secret" });

      // С заголовками
      const headers = new Headers();
      headers.set("x-csrf-token", "test-token");
      headers.set("cookie", "nd_csrf=cookie-token");

      const result1 = extractCsrfFromRequestLike(headers, config);
      expect(result1.headerToken).toBe("test-token");
      expect(result1.cookieToken).toBe("cookie-token");

      // С объектом
      const objHeaders = {
        "x-csrf-token": "test-token",
        cookie: "nd_csrf=cookie-token",
      };

      const result2 = extractCsrfFromRequestLike(objHeaders, config);
      expect(result2.headerToken).toBe("test-token");
      expect(result2.cookieToken).toBe("cookie-token");
    });

    it("должен работать verifyCsrfDoubleSubmit", async () => {
      const config = normalizeCsrfConfig({ secret: "test-secret" });
      const tokenResult = await generateCsrfToken("session123", config);

      const validResult = await verifyCsrfDoubleSubmit(
        {
          headerToken: tokenResult.token,
          cookieToken: tokenResult.token,
        },
        config
      );
      expect(validResult.ok).toBe(true);

      const invalidResult = await verifyCsrfDoubleSubmit(
        {
          headerToken: tokenResult.token,
          cookieToken: "different-token",
        },
        config
      );
      expect(invalidResult.ok).toBe(false);
    });

    it("должен работать issueCsrfForResponse", async () => {
      const config = normalizeCsrfConfig({ secret: "test-secret" });
      const result = await issueCsrfForResponse("session123", config);
      expect(result.token).toBeDefined();
    });
  });

  describe("Полное покрытие xssCsrf объекта", () => {
    it("должен содержать все ожидаемые функции", () => {
      expect(xssCsrf.escapeHTML).toBe(escapeHTML);
      expect(xssCsrf.escapeAttribute).toBe(escapeAttribute);
      expect(xssCsrf.sanitizeURL).toBe(sanitizeURL);
      expect(xssCsrf.sanitizeString).toBe(sanitizeString);
      expect(xssCsrf.stripDangerousHtml).toBe(stripDangerousHtml);
      expect(xssCsrf.sanitizeForContext).toBeDefined();
      expect(xssCsrf.sanitizeObjectForContext).toBe(sanitizeObjectForContext);
      expect(xssCsrf.safeAttr).toBe(safeAttr);
      expect(xssCsrf.safeHtmlText).toBe(safeHtmlText);
      expect(xssCsrf.safeUrl).toBe(safeUrl);
      expect(xssCsrf.buildSetCookieHeader).toBe(buildSetCookieHeader);
      expect(xssCsrf.parseCookiesHeader).toBe(parseCookiesHeader);
      expect(xssCsrf.issueCsrfForResponse).toBe(issueCsrfForResponse);
      expect(xssCsrf.generateCsrfToken).toBe(generateCsrfToken);
      expect(xssCsrf.extractCsrfFromRequestLike).toBe(
        extractCsrfFromRequestLike
      );
      expect(xssCsrf.verifyCsrfToken).toBe(verifyCsrfToken);
      expect(xssCsrf.verifyCsrfDoubleSubmit).toBe(verifyCsrfDoubleSubmit);
      expect(xssCsrf.normalizeCsrfConfig).toBe(normalizeCsrfConfig);
    });
  });

  describe("Полное покрытие InputValidator", () => {
    it("должен работать sanitizeHtml", () => {
      expect(InputValidator.sanitizeHtml('<script>alert("xss")</script>')).toBe(
        '<script>alert("xss")<&#x2F;script>'
      );
    });

    it("должен работать validateText", () => {
      const result = InputValidator.validateText("Safe text", 100);
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.sanitized).toBe("Safe text");
      }

      const invalidResult = InputValidator.validateText("x".repeat(150), 100);
      expect(invalidResult.isValid).toBe(false);
    });

    it("должен работать validateEmail", () => {
      const validResult = InputValidator.validateEmail("test@example.com");
      expect(validResult.isValid).toBe(true);
      if (validResult.isValid) {
        expect(validResult.sanitized).toBe("test@example.com");
      }

      const invalidResult = InputValidator.validateEmail("invalid-email");
      expect(invalidResult.isValid).toBe(false);
    });

    it("должен работать validateWalletAddress", () => {
      const validResult = InputValidator.validateWalletAddress(
        "5xoBq7f733X7s7mBKMdRyZnYf53S62WrZjfkKcFZc6qf"
      );
      expect(validResult.isValid).toBe(true);

      const invalidResult =
        InputValidator.validateWalletAddress("invalid-address");
      expect(invalidResult.isValid).toBe(false);
    });

    it("должен работать validateNumber", () => {
      const validResult = InputValidator.validateNumber(42);
      expect(validResult.isValid).toBe(true);
      if (validResult.isValid) {
        expect(validResult.sanitized).toBe("42");
      }

      const invalidResult = InputValidator.validateNumber("not-a-number");
      expect(invalidResult.isValid).toBe(false);
    });

    it("должен работать escapeSql", () => {
      expect(InputValidator.escapeSql("O'Reilly")).toBe("O''Reilly");
    });

    it("должен работать validateJson", () => {
      const validResult = InputValidator.validateJson('{"name": "John"}');
      expect(validResult.isValid).toBe(true);

      const invalidResult = InputValidator.validateJson('{"name":}');
      expect(invalidResult.isValid).toBe(false);
    });

    it("должен работать алиасы", () => {
      expect(InputValidator.sanitizeHTML).toBe(InputValidator.sanitizeHtml);
      expect(InputValidator.sanitizeSQL).toBe(InputValidator.escapeSql);
      expect(InputValidator.validateJSON).toBe(InputValidator.validateJson);
    });
  });

  describe("Полное покрытие security-utils", () => {
    it("должен работать validateNumber", () => {
      expect(validateNumber(42, 1, 100)).toBe(42);
      expect(validateNumber(0, 1, 100)).toBeNull();
      expect(validateNumber(150, 1, 100)).toBeNull();
    });

    it("должен работать detectSuspiciousPatterns", () => {
      expect(detectSuspiciousPatterns("Safe text")).toEqual([]);
      expect(detectSuspiciousPatterns("SELECT * FROM users")).not.toEqual([]);
      expect(
        detectSuspiciousPatterns('<script>alert("xss")</script>')
      ).not.toEqual([]);
      expect(detectSuspiciousPatterns("javascript:alert(1)")).not.toEqual([]);
    });
  });

  describe("Полное покрытие input-sanitizer", () => {
    it("должен работать isValidEmail", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("invalid-email")).toBe(false);
    });

    it("должен работать isValidSolanaAddress", () => {
      expect(
        isValidSolanaAddress("5xoBq7f733X7s7mBKMdRyZnYf53S62WrZjfkKcFZc6qf")
      ).toBe(true);
      expect(isValidSolanaAddress("invalid-address")).toBe(false);
    });

    it("должен работать isValidEthereumAddress", () => {
      expect(
        isValidEthereumAddress("0x742d35Cc6634C0532925a3b844Bc454e4438f4e")
      ).toBe(true);
      expect(isValidEthereumAddress("invalid-address")).toBe(false);
    });

    it("должен работать isValidTONAddress", () => {
      expect(
        isValidTONAddress("EQCD39SOfsr6DANawC_qPv_0Ph8V1Sd6e48nf7btg3OhdCBa")
      ).toBe(true);
      expect(isValidTONAddress("invalid-address")).toBe(false);
    });

    it("должен работать isValidIPFSCID", () => {
      expect(
        isValidIPFSCID("QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79oj8gePhQ")
      ).toBe(true);
      expect(isValidIPFSCID("invalid-cid")).toBe(false);
    });

    it("должен работать sanitizeSQL", () => {
      expect(sanitizeSQL("O'Reilly")).toBe("O''Reilly");
    });
  });

  describe("Полное покрытие основного экспортного модуля", () => {
    it("должен экспортировать все основные функции", () => {
      expect(securityModule.escapeHTML).toBe(escapeHTML);
      expect(securityModule.escapeAttribute).toBe(escapeAttribute);
      expect(securityModule.sanitizeURL).toBe(sanitizeURL);
      expect(securityModule.stripDangerousHtml).toBe(stripDangerousHtml);
      expect(securityModule.sanitizeString).toBe(sanitizeString);
      expect(securityModule.sanitizeObjectForContext).toBe(
        sanitizeObjectForContext
      );
      expect(securityModule.safeAttr).toBe(safeAttr);
      expect(securityModule.safeHtmlText).toBe(safeHtmlText);
      expect(securityModule.safeUrl).toBe(safeUrl);
      expect(securityModule.sanitizeFilename).toBe(sanitizeFilename);

      // XSS/CSRF
      expect(securityModule.buildSetCookieHeader).toBe(buildSetCookieHeader);
      expect(securityModule.extractCsrfFromRequestLike).toBe(
        extractCsrfFromRequestLike
      );
      expect(securityModule.generateCsrfToken).toBe(generateCsrfToken);
      expect(securityModule.issueCsrfForResponse).toBe(issueCsrfForResponse);
      expect(securityModule.normalizeCsrfConfig).toBe(normalizeCsrfConfig);
      expect(securityModule.parseCookiesHeader).toBe(parseCookiesHeader);
      expect(securityModule.verifyCsrfDoubleSubmit).toBe(
        verifyCsrfDoubleSubmit
      );
      expect(securityModule.verifyCsrfToken).toBe(verifyCsrfToken);
      expect(securityModule.xssCsrf).toBe(xssCsrf);

      // Валидаторы
      expect(securityModule.InputValidator).toBe(InputValidator);
      expect(securityModule.validateNumber).toBe(validateNumber);
      expect(securityModule.detectSuspiciousPatterns).toBe(
        detectSuspiciousPatterns
      );
      expect(securityModule.isValidEmail).toBe(isValidEmail);
      expect(securityModule.isValidSolanaAddress).toBe(isValidSolanaAddress);
      expect(securityModule.isValidEthereumAddress).toBe(
        isValidEthereumAddress
      );
      expect(securityModule.isValidTONAddress).toBe(isValidTONAddress);
      expect(securityModule.isValidIPFSCID).toBe(isValidIPFSCID);
      expect(securityModule.sanitizeSQL).toBe(sanitizeSQL);
    });

    it("должен экспортировать алиасы", () => {
      expect(securityModule.escapeHtml).toBe(escapeHTML);
      expect(securityModule.sanitizeHTML).toBe(escapeHTML);
      expect(securityModule.stripHTML).toBe(stripDangerousHtml);
      expect(securityModule.stripHtml).toBe(stripDangerousHtml);
      expect(securityModule.sanitizeUrl).toBe(sanitizeURL);
      expect(securityModule.sanitizeSql).toBe(sanitizeSQL);
    });
  });

  describe("Полное покрытие граничных условий", () => {
    it("должен обрабатывать все граничные условия", () => {
      // escapeHTML
      expect(escapeHTML(null as any)).toBe("");
      expect(escapeHTML(undefined as any)).toBe("");
      expect(escapeHTML(123 as any)).toBe("");

      // sanitizeURL
      expect(sanitizeURL(null as any)).toBeNull();
      expect(sanitizeURL(undefined as any)).toBeNull();
      expect(sanitizeURL(123 as any)).toBeNull();

      // sanitizeObjectForContext
      expect(sanitizeObjectForContext(null as any, "html")).toBeNull();
      expect(sanitizeObjectForContext(123 as any, "html")).toBe(123);
      expect(sanitizeObjectForContext("string" as any, "html")).toBe("string");

      // sanitizeFilename
      expect(sanitizeFilename(null as any)).toBe("");
      expect(sanitizeFilename(undefined as any)).toBe("");
      expect(sanitizeFilename(123 as any)).toBe("");
    });
  });
});
