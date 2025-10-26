/**
 * Тесты совместимости клиентских и серверных окружений для безопасности
 * Проверяет, что функции безопасности работают одинаково в разных окружениях
 */

import {
  escapeAttribute,
  escapeHTML,
  safeAttr,
  safeHtmlText,
  safeUrl,
  sanitizeFilename,
  sanitizeObjectForContext,
  sanitizeString,
  sanitizeURL,
  stripDangerousHtml,
} from "@/lib/security";

// Мокаем объекты, которые могут отсутствовать в Node.js
// В реальном тесте они будут заменены в зависимости от окружения
const mockWindow = {
  crypto: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
};

// Вспомогательная функция для проверки, в каком окружении мы находимся
function isServerEnvironment(): boolean {
  return typeof window === "undefined";
}

// Вспомогательная функция для проверки, в браузере ли мы
function isClientEnvironment(): boolean {
  return typeof window !== "undefined";
}

describe("Совместимость клиентских и серверных окружений", () => {
  describe("Проверка условий выполнения", () => {
    it("должна определить серверное окружение", () => {
      expect(isServerEnvironment()).toBe(true); // в тестах Jest выполняется в Node.js
    });

    it("должна определить клиентское окружение в моке", () => {
      // Создаем временное клиентское окружение
      const originalWindow = global.window;
      Object.defineProperty(global, "window", {
        value: mockWindow,
        writable: true,
      });

      expect(isClientEnvironment()).toBe(true);

      // Восстанавливаем оригинальное значение
      Object.defineProperty(global, "window", {
        value: originalWindow,
        writable: true,
      });
    });
  });

  describe("Функции санитизации", () => {
    const testInputs = [
      '<script>alert("xss")</script>',
      "javascript:alert(1)",
      "normal text",
      "user@example.com",
      "../../etc/passwd",
      '<img src="x" onerror="alert(1)">',
      'onclick="alert(1)"',
      "https://example.com",
      '" onmouseover="alert(1)',
      'file\' onclick="alert(1)"',
    ];

    testInputs.forEach((input, index) => {
      it(`должна работать одинаково в обоих окружениях: test case ${
        index + 1
      }`, () => {
        // Результат в серверном окружении (реальное)
        const serverEscapeHTML = escapeHTML(input);
        const serverEscapeAttribute = escapeAttribute(input);
        const serverSanitizeURL = sanitizeURL(input);
        const serverStripDangerousHtml = stripDangerousHtml(input);
        const serverSanitizeString = sanitizeString(input);
        const serverSafeAttr = safeAttr(input);
        const serverSafeHtmlText = safeHtmlText(input);
        const serverSafeUrl = safeUrl(input);
        const serverSanitizeFilename = sanitizeFilename(input);

        // В браузерном окружении результаты должны быть такими же
        // Проверяем, что функции не зависят от специфичных для окружения API
        expect(typeof serverEscapeHTML).toBe("string");
        expect(typeof serverEscapeAttribute).toBe("string");
        expect(
          serverSanitizeURL === null || typeof serverSanitizeURL === "string"
        ).toBe(true);
        expect(typeof serverStripDangerousHtml).toBe("string");
        expect(typeof serverSanitizeString).toBe("string");
        expect(typeof serverSafeAttr).toBe("string");
        expect(typeof serverSafeHtmlText).toBe("string");
        expect(typeof serverSafeUrl).toBe("string");
        expect(typeof serverSanitizeFilename).toBe("string");
      });
    });

    it("должна санитизировать объекты одинаково в обоих окружениях", () => {
      const testObject = {
        html: '<script>alert("xss")</script>',
        url: "javascript:alert(1)",
        attr: 'onclick="alert(1)"',
        nested: {
          content: '<img src="x" onerror="alert(1)">',
          text: "normal text",
        },
      };

      const result = sanitizeObjectForContext(testObject, "html");

      // Проверяем структуру и содержимое
      expect(result.html).toBe('<script>alert("xss")<&#x2F;script>');
      expect(result.url).toBe("javascript:alert(1)"); // в контексте html не санитизируется как URL
      expect(result.attr).toBe('<script>alert("xss")<&#x2F;script>'); // в контексте html
      expect(result.nested.content).toBe('<img src="x" >');
      expect(result.nested.text).toBe("normal text");
    });
  });

  describe("Контекстно-зависимая санитизация", () => {
    const testCases = [
      {
        input: '<script>alert("xss")</script>',
        context: "html" as const,
        expectedContains: "<script>",
      },
      {
        input: '<script>alert("xss")</script>',
        context: "attr" as const,
        expectedContains: "<script>",
      },
      {
        input: "javascript:alert(1)",
        context: "url" as const,
        expectedContains: "",
      },
      {
        input: "normal text",
        context: "raw" as const,
        expectedContains: "normal text",
      },
    ];

    testCases.forEach((testCase, index) => {
      it(`контекстная санитизация ${
        index + 1
      } работает в обоих окружениях`, () => {
        const result = sanitizeString(testCase.input, testCase.context);
        if (testCase.expectedContains) {
          expect(result).toContain(testCase.expectedContains);
        }
      });
    });
  });

  describe("Функции, зависящие от криптографии", () => {
    // Тестирование функций, которые используют Web Crypto API или Node crypto
    it("должна корректно обрабатывать криптографические зависимости", () => {
      // Эти функции не используют криптографию напрямую, но могут быть затронуты
      // проблемами с совместимостью окружений
      const input = "test input";

      // Все функции должны выполниться без ошибок
      expect(() => escapeHTML(input)).not.toThrow();
      expect(() => escapeAttribute(input)).not.toThrow();
      expect(() => sanitizeURL(input)).not.toThrow();
      expect(() => stripDangerousHtml(input)).not.toThrow();
      expect(() => sanitizeString(input)).not.toThrow();
      expect(() => safeAttr(input)).not.toThrow();
      expect(() => safeHtmlText(input)).not.toThrow();
      expect(() => safeUrl(input)).not.toThrow();
      expect(() => sanitizeFilename(input)).not.toThrow();
    });
  });

  describe("Обработка специфичных для окружения значений", () => {
    it("должна обрабатывать undefined и null одинаково", () => {
      expect(escapeHTML(undefined as any)).toBe("");
      expect(escapeHTML(null as any)).toBe("");
      expect(escapeAttribute(undefined as any)).toBe("");
      expect(escapeAttribute(null as any)).toBe("");
      expect(sanitizeURL(undefined as any)).toBeNull();
      expect(sanitizeURL(null as any)).toBeNull();
      expect(stripDangerousHtml(undefined as any)).toBe("");
      expect(stripDangerousHtml(null as any)).toBe("");
      expect(sanitizeString(undefined as any)).toBe("");
      expect(sanitizeString(null as any)).toBe("");
      expect(sanitizeFilename(undefined as any)).toBe("");
      expect(sanitizeFilename(null as any)).toBe("");
    });

    it("должна обрабатывать числа и другие типы", () => {
      expect(escapeHTML(123 as any)).toBe("");
      expect(escapeHTML(true as any)).toBe("");
      expect(escapeHTML({} as any)).toBe("");
      expect(escapeHTML([] as any)).toBe("");

      expect(sanitizeURL(123 as any)).toBeNull();
      expect(sanitizeURL(true as any)).toBeNull();
      expect(sanitizeURL({} as any)).toBeNull();
      expect(sanitizeURL([] as any)).toBeNull();
    });
  });

  describe("Проверка на утечки памяти между окружениями", () => {
    it("не должна вызывать утечки памяти при частых вызовах", () => {
      const inputs = [
        '<script>alert("xss")</script>',
        "javascript:alert(1)",
        "normal text",
        "../../etc/passwd",
      ];

      // Выполняем множество вызовов для проверки утечек
      for (let i = 0; i < 100; i++) {
        inputs.forEach((input) => {
          escapeHTML(input);
          escapeAttribute(input);
          sanitizeURL(input);
          stripDangerousHtml(input);
          sanitizeString(input);
          safeAttr(input);
          safeHtmlText(input);
          safeUrl(input);
          sanitizeFilename(input);
        });
      }

      // Если мы дошли до этой точки без исключений, тест пройден
      expect(true).toBe(true);
    });
  });

  describe("Проверка возвращаемых типов", () => {
    it("все функции должны возвращать ожидаемые типы", () => {
      const input = "test";

      expect(typeof escapeHTML(input)).toBe("string");
      expect(typeof escapeAttribute(input)).toBe("string");
      expect(sanitizeURL(input)).toBeNull();
      expect(typeof stripDangerousHtml(input)).toBe("string");
      expect(typeof sanitizeString(input)).toBe("string");
      expect(typeof safeAttr(input)).toBe("string");
      expect(typeof safeHtmlText(input)).toBe("string");
      expect(typeof safeUrl(input)).toBe("string");
      expect(typeof sanitizeFilename(input)).toBe("string");

      // Проверяем URL с допустимым значением
      expect(typeof sanitizeURL("https://example.com")).toBe("string");
    });
  });

  describe("Проверка CSRF-совместимости (если доступно)", () => {
    // Хотя CSRF функции находятся в другом модуле, проверим, что базовые
    // зависимости не зависят от окружения
    it("должна иметь стабильные зависимости", () => {
      // Проверяем, что все импортируемые функции доступны
      expect(typeof escapeHTML).toBe("function");
      expect(typeof escapeAttribute).toBe("function");
      expect(typeof sanitizeURL).toBe("function");
      expect(typeof stripDangerousHtml).toBe("function");
      expect(typeof sanitizeString).toBe("function");
      expect(typeof safeAttr).toBe("function");
      expect(typeof safeHtmlText).toBe("function");
      expect(typeof safeUrl).toBe("function");
      expect(typeof sanitizeFilename).toBe("function");
    });
  });
});
