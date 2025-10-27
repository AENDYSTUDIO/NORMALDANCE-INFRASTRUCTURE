/**
 * Производительные тесты для горячих функций санитизации
 * Проверяет время выполнения и потребление памяти для ключевых санитайзеров
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

describe("Производительные тесты для санитайзеров", () => {
  // Вспомогательная функция для измерения времени выполнения
  const measureTime = (fn: () => any): number => {
    const start = process.hrtime.bigint();
    fn();
    const end = process.hrtime.bigint();
    return Number(end - start) / 1000000; // в миллисекундах
  };

  // Вспомогательная функция для измерения потребления памяти
  const measureMemory = (fn: () => any): number => {
    const startMem = process.memoryUsage().heapUsed;
    fn();
    const endMem = process.memoryUsage().heapUsed;
    return endMem - startMem;
  };

  // Создаем большие тестовые данные
  const createLargeString = (size: number): string => {
    return (
      "a".repeat(size) + '<script>alert("xss")</script>' + "b".repeat(size)
    );
  };

  const createLargeObject = (depth: number, width: number): any => {
    if (depth <= 0) return "safe string";

    const obj: any = {};
    for (let i = 0; i < width; i++) {
      obj[`key${i}`] = createLargeObject(depth - 1, width);
    }
    return obj;
  };

  describe("escapeHTML", () => {
    it("должна обрабатывать короткие строки быстро", () => {
      const input = '<script>alert("xss")</script>';
      const time = measureTime(() => escapeHTML(input));
      expect(time).toBeLessThan(1); // менее 1мс
    });

    it("должна обрабатывать средние строки быстро", () => {
      const input = createLargeString(1000); // 200+ символов
      const time = measureTime(() => escapeHTML(input));
      expect(time).toBeLessThan(5); // менее 5мс
    });

    it("должна обрабатывать длинные строки быстро", () => {
      const input = createLargeString(10000); // 20000+ символов
      const time = measureTime(() => escapeHTML(input));
      expect(time).toBeLessThan(50); // менее 50мс
    });

    it("должна эффективно использовать память", () => {
      const input = createLargeString(5000);
      const memory = measureMemory(() => escapeHTML(input));
      expect(memory).toBeLessThan(input.length * 2); // результат не должен быть намного больше исходника
    });

    it("должна обрабатывать 1000 вызовов быстро", () => {
      const input = "<b>test</b>";
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        escapeHTML(input);
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(50); // менее 50мс для 1000 вызовов
    });
  });

  describe("escapeAttribute", () => {
    it("должна обрабатывать короткие строки быстро", () => {
      const input = 'onclick="alert(1)"';
      const time = measureTime(() => escapeAttribute(input));
      expect(time).toBeLessThan(1);
    });

    it("должна обрабатывать длинные строки быстро", () => {
      const input = createLargeString(10000);
      const time = measureTime(() => escapeAttribute(input));
      expect(time).toBeLessThan(50);
    });

    it("должна эффективно использовать память", () => {
      const input = createLargeString(5000);
      const memory = measureMemory(() => escapeAttribute(input));
      expect(memory).toBeLessThan(input.length * 2);
    });

    it("должна обрабатывать 1000 вызовов быстро", () => {
      const input = 'title="test"';
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        escapeAttribute(input);
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(50);
    });
  });

  describe("sanitizeURL", () => {
    it("должна обрабатывать короткие URL быстро", () => {
      const input = "https://example.com";
      const time = measureTime(() => sanitizeURL(input));
      expect(time).toBeLessThan(1);
    });

    it("должна обрабатывать сложные URL быстро", () => {
      const input = "https://example.com/path?param=value&other=test#fragment";
      const time = measureTime(() => sanitizeURL(input));
      expect(time).toBeLessThan(2);
    });

    it("должна обрабатывать опасные URL быстро", () => {
      const input = "javascript:alert(1)";
      const time = measureTime(() => sanitizeURL(input));
      expect(time).toBeLessThan(2);
    });

    it("должна обрабатывать 1000 вызовов быстро", () => {
      const inputs = [
        "https://example.com",
        "javascript:alert(1)",
        "data:text/html,<script>alert(1)</script>",
        "/relative/path",
        "ftp://example.com",
      ];

      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        sanitizeURL(inputs[i % inputs.length]);
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe("stripDangerousHtml", () => {
    it("должна обрабатывать короткие строки быстро", () => {
      const input = '<script>alert("xss")</script>';
      const time = measureTime(() => stripDangerousHtml(input));
      expect(time).toBeLessThan(2);
    });

    it("должна обрабатывать средние строки быстро", () => {
      const input = createLargeString(5000);
      const time = measureTime(() => stripDangerousHtml(input));
      expect(time).toBeLessThan(20);
    });

    it("должна обрабатывать длинные строки с множеством тегов быстро", () => {
      const input =
        '<div><p><span><script>alert("xss")</script></span></p></div>'.repeat(
          100
        );
      const time = measureTime(() => stripDangerousHtml(input));
      expect(time).toBeLessThan(100);
    });

    it("должна обрабатывать 1000 вызовов быстро", () => {
      const input = "<p>Safe text</p>";
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        stripDangerousHtml(input);
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe("sanitizeString", () => {
    it("должна обрабатывать контекст html быстро", () => {
      const input = '<script>alert("xss")</script>';
      const time = measureTime(() => sanitizeString(input, "html"));
      expect(time).toBeLessThan(2);
    });

    it("должна обрабатывать контекст attr быстро", () => {
      const input = 'onclick="alert(1)"';
      const time = measureTime(() => sanitizeString(input, "attr"));
      expect(time).toBeLessThan(2);
    });

    it("должна обрабатывать контекст url быстро", () => {
      const input = "javascript:alert(1)";
      const time = measureTime(() => sanitizeString(input, "url"));
      expect(time).toBeLessThan(2);
    });

    it("должна обрабатывать 1000 вызовов в разных контекстах быстро", () => {
      const inputs = [
        '<script>alert("xss")</script>',
        "javascript:alert(1)",
        "normal text",
      ];
      const contexts: Array<"html" | "attr" | "url" | "raw"> = [
        "html",
        "attr",
        "url",
        "raw",
      ];

      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        const input = inputs[i % inputs.length];
        const context = contexts[i % contexts.length];
        sanitizeString(input, context);
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(150);
    });
  });

  describe("sanitizeObjectForContext", () => {
    it("должна обрабатывать простые объекты быстро", () => {
      const input = {
        title: '<script>alert("xss")</script>',
        content: "safe text",
      };
      const time = measureTime(() => sanitizeObjectForContext(input, "html"));
      expect(time).toBeLessThan(5);
    });

    it("должна обрабатывать вложенные объекты быстро", () => {
      const input = {
        level1: {
          level2: {
            dangerous: '<script>alert("xss")</script>',
            safe: "text",
          },
        },
      };
      const time = measureTime(() => sanitizeObjectForContext(input, "html"));
      expect(time).toBeLessThan(10);
    });

    it("должна обрабатывать массивы объектов быстро", () => {
      const input = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: i,
          content: `<script>alert(${i})</script>`,
        }));
      const time = measureTime(() => sanitizeObjectForContext(input, "html"));
      expect(time).toBeLessThan(50);
    });

    it("должна обрабатывать 100 вызовов быстро", () => {
      const input = { content: "<b>test</b>" };
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        sanitizeObjectForContext(input, "html");
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe("safeAttr", () => {
    it("должна обрабатывать короткие строки быстро", () => {
      const input = 'onclick="alert(1)"';
      const time = measureTime(() => safeAttr(input));
      expect(time).toBeLessThan(2);
    });

    it("должна обрабатывать длинные строки быстро", () => {
      const input = createLargeString(5000);
      const time = measureTime(() => safeAttr(input));
      expect(time).toBeLessThan(30);
    });

    it("должна обрабатывать 1000 вызовов быстро", () => {
      const input = 'class="test"';
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        safeAttr(input);
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe("safeHtmlText", () => {
    it("должна обрабатывать короткие строки быстро", () => {
      const input = '<script>alert("xss")</script>';
      const time = measureTime(() => safeHtmlText(input));
      expect(time).toBeLessThan(2);
    });

    it("должна обрабатывать длинные строки быстро", () => {
      const input = createLargeString(5000);
      const time = measureTime(() => safeHtmlText(input));
      expect(time).toBeLessThan(30);
    });

    it("должна обрабатывать 100 вызовов быстро", () => {
      const input = "Safe text";
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        safeHtmlText(input);
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe("safeUrl", () => {
    it("должна обрабатывать короткие URL быстро", () => {
      const input = "https://example.com";
      const time = measureTime(() => safeUrl(input));
      expect(time).toBeLessThan(1);
    });

    it("должна обрабатывать опасные URL быстро", () => {
      const input = "javascript:alert(1)";
      const time = measureTime(() => safeUrl(input));
      expect(time).toBeLessThan(2);
    });

    it("должна обрабатывать 1000 вызовов быстро", () => {
      const inputs = ["https://example.com", "javascript:alert(1)", "/path"];
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        safeUrl(inputs[i % inputs.length]);
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe("sanitizeFilename", () => {
    it("должна обрабатывать короткие имена быстро", () => {
      const input = "../../etc/passwd";
      const time = measureTime(() => sanitizeFilename(input));
      expect(time).toBeLessThan(1);
    });

    it("должна обрабатывать длинные имена быстро", () => {
      const input = "../".repeat(100) + "filename.txt";
      const time = measureTime(() => sanitizeFilename(input));
      expect(time).toBeLessThan(10);
    });

    it("должна обрабатывать 1000 вызовов быстро", () => {
      const inputs = [
        "file.txt",
        "../../etc/passwd",
        "normal-file.txt",
        "file|with>invalid<chars",
      ];
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        sanitizeFilename(inputs[i % inputs.length]);
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(50);
    });
  });

  describe("Стресс-тесты", () => {
    it("должна обрабатывать очень длинные строки без переполнения стека", () => {
      const veryLongString = createLargeString(100000); // 200,000+ символов
      expect(() => escapeHTML(veryLongString)).not.toThrow();
      expect(() => stripDangerousHtml(veryLongString)).not.toThrow();
    });

    it("должна обрабатывать глубоко вложенные объекты", () => {
      const deepObject = createLargeObject(5, 3); // глубина 5, ширина 3
      expect(() => sanitizeObjectForContext(deepObject, "html")).not.toThrow();
    });

    it("должна эффективно обрабатывать повторяющиеся вызовы (каскадная нагрузка)", () => {
      const inputs = [
        '<script>alert("xss")</script>',
        "javascript:alert(1)",
        "../../etc/passwd",
        "normal text",
        '<img src="x" onerror="alert(1)">',
      ];

      const startTime = Date.now();

      // Выполняем череду вызовов разных функций
      for (let i = 0; i < 500; i++) {
        const input = inputs[i % inputs.length];
        escapeHTML(input);
        escapeAttribute(input);
        sanitizeURL(input);
        stripDangerousHtml(input);
        sanitizeString(input);
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(500); // менее 500мс для 2500 вызовов
    });
  });
});
