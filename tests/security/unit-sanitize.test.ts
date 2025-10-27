/**
 * Модульные тесты для функций санитизации из src/lib/security/sanitize.ts
 * Покрывает: escapeHTML, escapeAttribute, sanitizeURL, stripDangerousHtml, sanitizeString
 */

import {
  escapeAttribute,
  escapeHTML,
  safeAttr,
  safeHtmlText,
  safeUrl,
  sanitizeFilename,
  sanitizeForContext,
  sanitizeObjectForContext,
  sanitizeString,
  sanitizeURL,
  stripDangerousHtml,
} from "@/lib/security";

describe("Функции санитизации", () => {
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

    it("должна возвращать пустую строку для нестроковых значений", () => {
      expect(escapeHTML(null as any)).toBe("");
      expect(escapeHTML(undefined as any)).toBe("");
      expect(escapeHTML(123 as any)).toBe("");
    });

    it("должна обрабатывать пустую строку", () => {
      expect(escapeHTML("")).toBe("");
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

    it("должна возвращать пустую строку для нестроковых значений", () => {
      expect(escapeAttribute(null as any)).toBe("");
      expect(escapeAttribute(undefined as any)).toBe("");
      expect(escapeAttribute(123 as any)).toBe("");
    });
  });

  describe("sanitizeURL", () => {
    it("должна разрешать безопасные URL", () => {
      expect(sanitizeURL("https://example.com")).toBe("https://example.com");
      expect(sanitizeURL("http://example.com")).toBe("http://example.com");
      expect(sanitizeURL("ipfs://QmHash")).toBe("ipfs://QmHash");
    });

    it("должна отклонять опасные URL", () => {
      expect(sanitizeURL("javascript:alert(1)")).toBeNull();
      expect(
        sanitizeURL("data:text/html,<script>alert(1)</script>")
      ).toBeNull();
      expect(sanitizeURL("vbscript:alert(1)")).toBeNull();
      expect(sanitizeURL("//malicious.com")).toBeNull();
    });

    it("должна разрешать только указанные схемы", () => {
      expect(sanitizeURL("ftp://example.com", ["ftp"])).toBe(
        "ftp://example.com"
      );
      expect(sanitizeURL("ftp://example.com", ["http", "https"])).toBeNull();
    });

    it("должна обрабатывать относительные URL", () => {
      expect(sanitizeURL("/path/to/resource")).toBe("/path/to/resource");
      expect(sanitizeURL("./path/to/resource")).toBe("./path/to/resource");
    });

    it("должна возвращать null для нестроковых значений", () => {
      expect(sanitizeURL(null as any)).toBeNull();
      expect(sanitizeURL(undefined as any)).toBeNull();
      expect(sanitizeURL(123 as any)).toBeNull();
    });

    it("должна возвращать null для пустой строки", () => {
      expect(sanitizeURL("")).toBeNull();
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

    it("должна возвращать пустую строку для нестроковых значений", () => {
      expect(stripDangerousHtml(null as any)).toBe("");
      expect(stripDangerousHtml(undefined as any)).toBe("");
      expect(stripDangerousHtml(123 as any)).toBe("");
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

    it("должна возвращать пустую строку для нестроковых значений", () => {
      expect(sanitizeString(null as any)).toBe("");
      expect(sanitizeString(undefined as any)).toBe("");
      expect(sanitizeString(123 as any)).toBe("");
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

    it("должна возвращать объект как есть для необъектных значений", () => {
      expect(sanitizeObjectForContext(null as any, "html")).toBeNull();
      expect(sanitizeObjectForContext(123 as any, "html")).toBe(123);
      expect(sanitizeObjectForContext("string" as any, "html")).toBe("string");
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

  describe("sanitizeFilename", () => {
    it("должна удалять traversal-последовательности", () => {
      expect(sanitizeFilename("../../etc/passwd")).toBe("etc-passwd");
      expect(sanitizeFilename("..\\..\\windows\\system32")).toBe(
        "windows-system32"
      );
    });

    it("должна заменять недопустимые символы", () => {
      expect(sanitizeFilename("file:with|invalid<characters>.txt")).toBe(
        "file-with_invalid_characters_.txt"
      );
    });

    it("должна удалять начальные тире", () => {
      expect(sanitizeFilename("-filename.txt")).toBe("filename.txt");
      expect(sanitizeFilename("--filename.txt")).toBe("-filename.txt");
    });

    it("должна ограничивать длину", () => {
      const longName = "a".repeat(300) + ".txt";
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
    });

    it("должна возвращать пустую строку для нестроковых значений", () => {
      expect(sanitizeFilename(null as any)).toBe("");
      expect(sanitizeFilename(undefined as any)).toBe("");
      expect(sanitizeFilename(123 as any)).toBe("");
    });
  });
});
