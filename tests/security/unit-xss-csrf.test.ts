/**
 * Модульные тесты для функций XSS/CSRF из src/lib/security/xss-csrf.ts
 * Покрывает: escapeHTML, escapeAttribute, sanitizeURL, stripDangerousHtml, sanitizeString,
 * CSRF-токены, cookie/заголовки, и другие функции
 */

import {
  CsrfConfig,
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
  sanitizeForContext,
  sanitizeObjectForContext,
  sanitizeString,
  sanitizeURL,
  stripDangerousHtml,
  verifyCsrfDoubleSubmit,
  verifyCsrfToken,
} from "@/lib/security/xss-csrf";

describe("XSS/CSRF функции", () => {
  describe("escapeHTML", () => {
    it("должна экранировать основные HTML-сущности", () => {
      expect(escapeHTML('<script>alert("xss")</script>')).toBe(
        '<script>alert("xss")<&#x2F;script>'
      );
      expect(escapeHTML("& < > \" ' /")).toBe('& < > " &#x27; &#x2F;');
    });

    it("должна быть идемпотентной", () => {
      const input = '<script>alert("xss")</script>';
      const firstEscape = escapeHTML(input);
      const secondEscape = escapeHTML(firstEscape);
      expect(firstEscape).toBe(secondEscape);
    });

    it("должна не экранировать уже экранированные сущности", () => {
      const escaped = escapeHTML("<script>");
      expect(escaped).toBe("&lt;script&gt;");
    });
  });

  describe("escapeAttribute", () => {
    it("должна экранировать HTML-атрибуты", () => {
      expect(escapeAttribute('<script>alert("xss")</script>')).toBe(
        '<script>alert("xss")<&#x2F;script>'
      );
      expect(escapeAttribute("& < > \" ' /")).toBe('& < > " &#x27; &#x2F;');
    });

    it("должна учитывать опцию allowSlashInAttr", () => {
      expect(escapeAttribute("/", { allowSlashInAttr: true })).toBe("/");
      expect(escapeAttribute("/")).toBe("&#x2F;");
    });

    it("должна быть идемпотентной", () => {
      const input = '<script>alert("xss")</script>';
      const firstEscape = escapeAttribute(input);
      const secondEscape = escapeAttribute(firstEscape);
      expect(firstEscape).toBe(secondEscape);
    });
  });

  describe("sanitizeURL", () => {
    it("должна разрешать безопасные URL", () => {
      expect(sanitizeURL("https://example.com")).toBe("https://example.com");
      expect(sanitizeURL("http://example.com")).toBe("http://example.com");
    });

    it("должна отклонять опасные URL", () => {
      expect(sanitizeURL("javascript:alert(1)")).toBe("");
      expect(sanitizeURL("data:text/html,<script>alert(1)</script>")).toBe("");
      expect(sanitizeURL("vbscript:alert(1)")).toBe("");
      expect(sanitizeURL("//malicious.com")).toBe("");
    });

    it("должна обрабатывать относительные URL", () => {
      expect(sanitizeURL("/path/to/resource")).toBe("/path/to/resource");
      expect(sanitizeURL("./path/to/resource")).toBe("./path/to/resource");
    });

    it("должна обрабатывать URL с параметрами", () => {
      expect(sanitizeURL("https://example.com?param=value&other=test")).toBe(
        "https://example.com?param=value&other=test"
      );
    });
  });

  describe("stripDangerousHtml", () => {
    it("должна удалять <script> теги", () => {
      expect(stripDangerousHtml('<script>alert("xss")</script>')).toBe("");
      expect(
        stripDangerousHtml('before <script>alert("xss")</script> after')
      ).toBe("before  after");
    });

    it("должна удалять event handler атрибуты", () => {
      expect(stripDangerousHtml('<div onclick="alert(1)">click me</div>')).toBe(
        "<div >click me</div>"
      );
      expect(stripDangerousHtml('<img onload="alert(1)" src="x">')).toBe(
        '<img  src="x">'
      );
    });

    it("должна удалять javascript: URL в href/src", () => {
      expect(
        stripDangerousHtml('<a href="javascript:alert(1)">click</a>')
      ).toBe('<a href="">click</a>');
      expect(stripDangerousHtml('<img src="javascript:alert(1)">')).toBe(
        '<img src="">'
      );
    });

    it("должна удалять data: и vbscript: URL", () => {
      expect(
        stripDangerousHtml(
          '<a href="data:text/html,<script>alert</script>">click</a>'
        )
      ).toBe('<a href="">click</a>');
      expect(stripDangerousHtml('<a href="vbscript:alert(1)">click</a>')).toBe(
        '<a href="">click</a>'
      );
    });

    it("должна сохранять безопасные теги и атрибуты", () => {
      expect(stripDangerousHtml('<p class="text">Safe content</p>')).toBe(
        '<p class="text">Safe content</p>'
      );
      expect(stripDangerousHtml('<a href="/safe">Safe link</a>')).toBe(
        '<a href="/safe">Safe link</a>'
      );
    });

    it("должна быть идемпотентной", () => {
      const input = '<script>alert("xss")</script><img onload="alert(1)">';
      const firstStrip = stripDangerousHtml(input);
      const secondStrip = stripDangerousHtml(firstStrip);
      expect(firstStrip).toBe(secondStrip);
    });
  });

  describe("sanitizeString", () => {
    it("должна санитизировать для контекста html", () => {
      expect(sanitizeString('<script>alert("xss")</script>', "html")).toBe(
        '<script>alert("xss")<&#x2F;script>'
      );
    });

    it("должна санитизировать для контекста attr", () => {
      expect(sanitizeString('<script>alert("xss")</script>', "attr")).toBe(
        '<script>alert("xss")<&#x2F;script>'
      );
    });

    it("должна санитизировать для контекста url", () => {
      expect(sanitizeString("javascript:alert(1)", "url")).toBe("");
      expect(sanitizeString("https://example.com", "url")).toBe(
        "https://example.com"
      );
    });

    it("должна возвращать как есть для контекста raw", () => {
      expect(sanitizeString('<script>alert("xss")</script>', "raw")).toBe(
        '<script>alert("xss")</script>'
      );
    });

    it("должна использовать html как контекст по умолчанию", () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe(
        '<script>alert("xss")<&#x2F;script>'
      );
    });
  });

  describe("sanitizeForContext", () => {
    it("должна делегировать sanitizeString", () => {
      expect(sanitizeForContext('<script>alert("xss")</script>', "html")).toBe(
        '<script>alert("xss")<&#x2F;script>'
      );
      expect(sanitizeForContext("javascript:alert(1)", "url")).toBe("");
    });
  });

  describe("sanitizeObjectForContext", () => {
    it("должна санитизировать строковые значения в объекте для контекста html", () => {
      const input = {
        title: '<script>alert("xss")</script>',
        description: "Safe description",
        nested: {
          content: '<img src="x" onerror="alert(1)">',
        },
      };

      const expected = {
        title: '<script>alert("xss")<&#x2F;script>',
        description: "Safe description",
        nested: {
          content: '<img src="x" >',
        },
      };

      expect(sanitizeObjectForContext(input, "html")).toEqual(expected);
    });

    it("должна санитизировать строковые значения в массиве для контекста html", () => {
      const input = [
        '<script>alert("xss")</script>',
        "Safe text",
        { content: '<img src="x" onload="alert(1)">' },
      ];

      const expected = [
        '<script>alert("xss")<&#x2F;script>',
        "Safe text",
        { content: '<img src="x" >' },
      ];

      expect(sanitizeObjectForContext(input, "html")).toEqual(expected);
    });

    it("должна санитизировать для разных контекстов", () => {
      const input = {
        url: "javascript:alert(1)",
        html: '<script>alert("xss")</script>',
      };

      expect(sanitizeObjectForContext(input, "url")).toEqual({
        url: "",
        html: '<script>alert("xss")</script>',
      });

      expect(sanitizeObjectForContext(input, "html")).toEqual({
        url: "javascript:alert(1)",
        html: '<script>alert("xss")<&#x2F;script>',
      });
    });
  });

  describe("safeAttr", () => {
    it("должна создавать безопасное значение атрибута", () => {
      expect(safeAttr('<script>alert("xss")</script>')).toBe(
        '<script>alert("xss")<&#x2F;script>'
      );
      expect(safeAttr("normal attribute")).toBe("normal attribute");
    });
  });

  describe("safeHtmlText", () => {
    it("должна создавать безопасный HTML-текст", () => {
      expect(safeHtmlText('<script>alert("xss")</script>')).toBe(
        '<script>alert("xss")<&#x2F;script>'
      );
      expect(safeHtmlText("normal text")).toBe("normal text");
    });
  });

  describe("safeUrl", () => {
    it("должна создавать безопасный URL", () => {
      expect(safeUrl("javascript:alert(1)")).toBe("");
      expect(safeUrl("https://example.com")).toBe("https://example.com");
    });
  });

  describe("buildSetCookieHeader", () => {
    it("должна формировать корректный заголовок Set-Cookie", () => {
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

    it("должна формировать минимальный заголовок", () => {
      const header = buildSetCookieHeader("test", "value");
      expect(header).toBe("test=value; Path=/");
    });
  });

  describe("parseCookiesHeader", () => {
    it("должна парсить заголовок Cookie", () => {
      const cookies = parseCookiesHeader(
        "session=abc123; user=john; theme=dark"
      );
      expect(cookies).toEqual({
        session: "abc123",
        user: "john",
        theme: "dark",
      });
    });

    it("должна обрабатывать null/undefined", () => {
      expect(parseCookiesHeader(null)).toEqual({});
      expect(parseCookiesHeader(undefined)).toEqual({});
      expect(parseCookiesHeader("")).toEqual({});
    });

    it("должна обрабатывать лишние пробелы", () => {
      const cookies = parseCookiesHeader("  session=abc123  ;  user=john  ");
      expect(cookies).toEqual({
        session: "abc123",
        user: "john",
      });
    });
  });

  describe("normalizeCsrfConfig", () => {
    it("должна нормализовать конфигурацию CSRF с значениями по умолчанию", () => {
      const config = normalizeCsrfConfig({});
      expect(config).toEqual({
        secret: "development_only_secret_replace_in_prod",
        cookieName: "nd_csrf",
        headerName: "x-csrf-token",
        ttlSeconds: 3600,
        cookie: {
          path: "/",
          domain: undefined,
          secure: true,
          httpOnly: false,
          sameSite: "Lax",
          maxAgeSeconds: 3600,
        },
        version: "v1",
      });
    });

    it("должна использовать предоставленные значения", () => {
      const config = normalizeCsrfConfig({
        secret: "my-secret",
        cookieName: "custom_csrf",
        headerName: "x-custom-token",
        ttlSeconds: 7200,
        cookie: {
          path: "/api",
          domain: "example.com",
          secure: false,
          httpOnly: true,
          sameSite: "Strict",
          maxAgeSeconds: 7200,
        },
        version: "v1",
      });

      expect(config.secret).toBe("my-secret");
      expect(config.cookieName).toBe("custom_csrf");
      expect(config.headerName).toBe("x-custom-token");
      expect(config.ttlSeconds).toBe(7200);
    });
  });

  describe("CSRF функции", () => {
    const config: CsrfConfig = {
      secret: "test-secret",
      cookieName: "test_csrf",
      headerName: "x-test-token",
      ttlSeconds: 3600,
      cookie: {
        path: "/",
        secure: false,
        httpOnly: false,
        sameSite: "Lax",
      },
      version: "v1",
    };

    it("должна генерировать CSRF-токен", async () => {
      const result = await generateCsrfToken("session123", config);
      expect(result.token).toBeDefined();
      expect(result.cookieName).toBe("test_csrf");
      expect(result.headerName).toBe("x-test-token");
      expect(result.setCookieHeaderValue).toBeDefined();
    });

    it("должна извлекать CSRF из Headers", () => {
      const headers = new Headers();
      headers.set("x-test-token", "test-token-value");
      headers.set("cookie", "test_csrf=cookie-token-value");

      const result = extractCsrfFromRequestLike(headers, config);
      expect(result.headerToken).toBe("test-token-value");
      expect(result.cookieToken).toBe("cookie-token-value");
    });

    it("должна извлекать CSRF из объекта заголовков", () => {
      const headers = {
        "x-test-token": "test-token-value",
        cookie: "test_csrf=cookie-token-value",
      };

      const result = extractCsrfFromRequestLike(headers, config);
      expect(result.headerToken).toBe("test-token-value");
      expect(result.cookieToken).toBe("cookie-token-value");
    });

    it("должна верифицировать корректный CSRF-токен", async () => {
      const tokenResult = await generateCsrfToken("session123", config);
      const result = await verifyCsrfToken(tokenResult.token, config);
      expect(result.ok).toBe(true);
      expect(result.code).toBe("OK");
    });

    it("должна отклонять некорректный CSRF-токен", async () => {
      const result = await verifyCsrfToken("invalid-token", config);
      expect(result.ok).toBe(false);
      expect(result.code).not.toBe("OK");
    });

    it("должна отклонять отсутствующий CSRF-токен", async () => {
      const result = await verifyCsrfToken(null, config);
      expect(result.ok).toBe(false);
      expect(result.code).toBe("TOKEN_MISSING");
    });

    it("должна верифицировать CSRF double-submit", async () => {
      const tokenResult = await generateCsrfToken("session123", config);
      const result = await verifyCsrfDoubleSubmit(
        {
          headerToken: tokenResult.token,
          cookieToken: tokenResult.token,
        },
        config
      );
      expect(result.ok).toBe(true);
      expect(result.code).toBe("OK");
    });

    it("должна отклонять CSRF с несовпадающими токенами", async () => {
      const tokenResult = await generateCsrfToken("session123", config);
      const result = await verifyCsrfDoubleSubmit(
        {
          headerToken: tokenResult.token,
          cookieToken: "different-token",
        },
        config
      );
      expect(result.ok).toBe(false);
      expect(result.code).toBe("MISMATCH");
    });

    it("должна отклонять CSRF с отсутствующим cookie", async () => {
      const tokenResult = await generateCsrfToken("session123", config);
      const result = await verifyCsrfDoubleSubmit(
        {
          headerToken: tokenResult.token,
          cookieToken: null,
        },
        config
      );
      expect(result.ok).toBe(false);
      expect(result.code).toBe("COOKIE_MISSING");
    });

    it("должна отклонять CSRF с отсутствующим заголовком", async () => {
      const tokenResult = await generateCsrfToken("session123", config);
      const result = await verifyCsrfDoubleSubmit(
        {
          headerToken: null,
          cookieToken: tokenResult.token,
        },
        config
      );
      expect(result.ok).toBe(false);
      expect(result.code).toBe("TOKEN_MISSING");
    });
  });

  describe("issueCsrfForResponse", () => {
    it("должна генерировать CSRF-токен как generateCsrfToken", async () => {
      const config: CsrfConfig = {
        secret: "test-secret",
        cookieName: "test_csrf",
        headerName: "x-test-token",
        ttlSeconds: 3600,
        cookie: {
          path: "/",
          secure: false,
          httpOnly: false,
          sameSite: "Lax",
        },
        version: "v1",
      };

      const issueResult = await issueCsrfForResponse("session123", config);
      const generateResult = await generateCsrfToken("session123", config);

      expect(issueResult.token).toBe(generateResult.token);
      expect(issueResult.cookieName).toBe(generateResult.cookieName);
      expect(issueResult.headerName).toBe(generateResult.headerName);
    });
  });
});
