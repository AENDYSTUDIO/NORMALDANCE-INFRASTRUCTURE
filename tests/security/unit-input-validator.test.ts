/**
 * Модульные тесты для InputValidator из src/lib/security/input-validator.ts
 * Покрывает: валидацию различных типов данных
 */

import { InputValidator } from "@/lib/security/input-validator";

describe("InputValidator", () => {
  describe("валидация HTML", () => {
    it("должна санитизировать HTML", () => {
      expect(InputValidator.sanitizeHtml('<script>alert("xss")</script>')).toBe(
        '<script>alert("xss")<&#x2F;script>'
      );
      expect(InputValidator.sanitizeHtml("Safe text")).toBe("Safe text");
    });

    it("должна обрабатывать нестроковые значения", () => {
      expect(InputValidator.sanitizeHtml(null as any)).toBe("");
      expect(InputValidator.sanitizeHtml(undefined as any)).toBe("");
      expect(InputValidator.sanitizeHtml(123 as any)).toBe("");
    });
  });

  describe("валидация текста", () => {
    it("должна валидировать корректный текст", () => {
      expect(InputValidator.validateText("Valid text", 100)).toEqual({
        isValid: true,
        sanitized: "Valid text",
      });
    });

    it("должна отклонять пустой текст", () => {
      expect(InputValidator.validateText("", 100)).toEqual({
        isValid: false,
        errors: ["Input must be a non-empty string"],
      });
      expect(InputValidator.validateText(null as any, 100)).toEqual({
        isValid: false,
        errors: ["Input must be a non-empty string"],
      });
    });

    it("должна проверять максимальную длину", () => {
      expect(InputValidator.validateText("Too long text", 5)).toEqual({
        isValid: false,
        errors: ["Input exceeds maximum length of 5"],
      });
      expect(InputValidator.validateText("Short", 10)).toEqual({
        isValid: true,
        sanitized: "Short",
      });
    });

    it("должна санитизировать текст", () => {
      expect(
        InputValidator.validateText('<script>alert("xss")</script>', 100)
      ).toEqual({
        isValid: true,
        sanitized: '<script>alert("xss")</script>', // stripDangerousHtml удаляет теги, но не экранирует
      });
    });
  });

  describe("валидация email", () => {
    it("должна валидировать корректные email", () => {
      expect(InputValidator.validateEmail("user@example.com")).toEqual({
        isValid: true,
        sanitized: "user@example.com",
      });
      expect(
        InputValidator.validateEmail("TEST.USER+TAG@DOMAIN.CO.UK")
      ).toEqual({
        isValid: true,
        sanitized: "test.user+tag@domain.co.uk",
      });
    });

    it("должна отклонять некорректные email", () => {
      expect(InputValidator.validateEmail("invalid-email")).toEqual({
        isValid: false,
        errors: ["Invalid email format"],
      });
      expect(InputValidator.validateEmail("@example.com")).toEqual({
        isValid: false,
        errors: ["Invalid email format"],
      });
      expect(InputValidator.validateEmail("")).toEqual({
        isValid: false,
        errors: ["Email is required"],
      });
      expect(InputValidator.validateEmail(null as any)).toEqual({
        isValid: false,
        errors: ["Email is required"],
      });
    });
  });

  describe("валидация адреса кошелька", () => {
    it("должна валидировать корректные адреса", () => {
      // Валидный Solana адрес
      expect(
        InputValidator.validateWalletAddress(
          "5xoBq7f73X7s7mBKMdRyZnYf53S62WrZjfkKcFZc6qf"
        )
      ).toEqual({
        isValid: true,
        sanitized: "5xoBq7f733X7s7mBKMdRyZnYf53S62WrZjfkKcFZc6qf",
      });
    });

    it("должна отклонять некорректные адреса", () => {
      expect(InputValidator.validateWalletAddress("invalid-address")).toEqual({
        isValid: false,
        errors: ["Invalid wallet address format"],
      });
      expect(InputValidator.validateWalletAddress("")).toEqual({
        isValid: false,
        errors: ["Wallet address is required"],
      });
      expect(InputValidator.validateWalletAddress(null as any)).toEqual({
        isValid: false,
        errors: ["Wallet address is required"],
      });
    });
  });

  describe("валидация чисел", () => {
    it("должна валидировать корректные числа", () => {
      expect(InputValidator.validateNumber(42)).toEqual({
        isValid: true,
        sanitized: "42",
      });
      expect(InputValidator.validateNumber("123")).toEqual({
        isValid: true,
        sanitized: "123",
      });
      expect(InputValidator.validateNumber(3.14)).toEqual({
        isValid: true,
        sanitized: "3.14",
      });
    });

    it("должна отклонять некорректные числа", () => {
      expect(InputValidator.validateNumber("not-a-number")).toEqual({
        isValid: false,
        errors: ["Input must be a valid number"],
      });
      expect(InputValidator.validateNumber(NaN)).toEqual({
        isValid: false,
        errors: ["Input must be a valid number"],
      });
      expect(InputValidator.validateNumber(null)).toEqual({
        isValid: false,
        errors: ["Input must be a valid number"],
      });
    });

    it("должна проверять диапазон", () => {
      expect(InputValidator.validateNumber(5, 1, 10)).toEqual({
        isValid: true,
        sanitized: "5",
      });
      expect(InputValidator.validateNumber(0, 1, 10)).toEqual({
        isValid: false,
        errors: ["Number must be at least 1"],
      });
      expect(InputValidator.validateNumber(15, 1, 10)).toEqual({
        isValid: false,
        errors: ["Number must not exceed 10"],
      });
    });
  });

  describe("валидация файлов", () => {
    it("должна валидировать корректные файлы", () => {
      // Создаем mock объект файла
      const mockFile = {
        type: "image/png",
        size: 1000,
      } as File;

      expect(InputValidator.validateFile(mockFile, ["image/png"], 200)).toEqual(
        {
          isValid: true,
        }
      );
    });

    it("должна отклонять файлы с недопустимым типом", () => {
      const mockFile = {
        type: "application/exe",
        size: 1000,
      } as File;

      expect(
        InputValidator.validateFile(mockFile, ["image/png", "image/jpg"], 2000)
      ).toEqual({
        isValid: false,
        errors: ["File type application/exe is not allowed"],
      });
    });

    it("должна отклонять файлы с превышением размера", () => {
      const mockFile = {
        type: "image/png",
        size: 3000,
      } as File;

      expect(
        InputValidator.validateFile(mockFile, ["image/png"], 2000)
      ).toEqual({
        isValid: false,
        errors: ["File size exceeds 2000 bytes"],
      });
    });

    it("должна отклонять отсутствующие файлы", () => {
      expect(
        InputValidator.validateFile(null as any, ["image/png"], 2000)
      ).toEqual({
        isValid: false,
        errors: ["File is required"],
      });
    });
  });

  describe("SQL экранирование", () => {
    it("должно экранировать специальные символы", () => {
      expect(InputValidator.escapeSql("O'Reilly")).toBe("O''Reilly");
      expect(InputValidator.escapeSql("'; DROP TABLE users; --")).toBe(
        "''; DROP TABLE users; --"
      );
    });
  });

  describe("валидация JSON", () => {
    it("должна валидировать корректный JSON", () => {
      expect(
        InputValidator.validateJson('{"name": "John", "age": 30}')
      ).toEqual({
        isValid: true,
        sanitized: '{"name":"John","age":30}',
      });
    });

    it("должна отклонять некорректный JSON", () => {
      expect(InputValidator.validateJson('{"name": "John", "age":}')).toEqual({
        isValid: false,
        errors: ["Invalid JSON format"],
      });
      expect(InputValidator.validateJson("not json")).toEqual({
        isValid: false,
        errors: ["Invalid JSON format"],
      });
    });
  });

  describe("алиасы методов", () => {
    it("должен предоставлять алиас sanitizeHTML", () => {
      expect(InputValidator.sanitizeHTML('<script>alert("xss")</script>')).toBe(
        InputValidator.sanitizeHtml('<script>alert("xss")</script>')
      );
    });

    it("должен предоставлять алиас sanitizeSQL", () => {
      expect(InputValidator.sanitizeSQL("O'Reilly")).toBe(
        InputValidator.escapeSql("O'Reilly")
      );
    });

    it("должен предоставлять алиас validateJSON", () => {
      expect(InputValidator.validateJSON('{"test": true}')).toEqual(
        InputValidator.validateJson('{"test": true}')
      );
    });
  });
});
