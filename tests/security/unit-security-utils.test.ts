/**
 * Модульные тесты для функций безопасности из src/lib/security/security-utils.ts
 * Покрывает: validateNumber, detectSuspiciousPatterns
 */

import {
  detectSuspiciousPatterns,
  validateNumber,
} from "@/lib/security/security-utils";

describe("Функции security-utils", () => {
  describe("validateNumber", () => {
    it("должна валидировать корректные числа", () => {
      expect(validateNumber(42)).toBe(42);
      expect(validateNumber(0)).toBe(0);
      expect(validateNumber(-42)).toBe(-42);
      expect(validateNumber(3.14)).toBe(3.14);
    });

    it("должна отклонять некорректные значения", () => {
      expect(validateNumber(NaN)).toBeNull();
      expect(validateNumber(Infinity)).toBeNull();
      expect(validateNumber(-Infinity)).toBeNull();
    });

    it("должна проверять диапазон", () => {
      expect(validateNumber(5, 1, 10)).toBe(5);
      expect(validateNumber(0, 1, 10)).toBeNull();
      expect(validateNumber(15, 1, 10)).toBeNull();
    });
  });

  describe("detectSuspiciousPatterns", () => {
    it("должна обнаруживать подозрительные паттерны", () => {
      // Проверка на SQL-инъекции
      expect(
        detectSuspiciousPatterns("SELECT * FROM users WHERE id='1' OR '1'='1'")
          .length
      ).toBeGreaterThan(0);
      expect(
        detectSuspiciousPatterns("DROP TABLE users").length
      ).toBeGreaterThan(0);
      expect(detectSuspiciousPatterns("UNION SELECT").length).toBeGreaterThan(
        0
      );

      // Проверка на XSS
      expect(
        detectSuspiciousPatterns("<script>alert('xss')</script>").length
      ).toBeGreaterThan(0);
      expect(
        detectSuspiciousPatterns("javascript:alert(1)").length
      ).toBeGreaterThan(0);
      expect(
        detectSuspiciousPatterns("onload=alert(1)").length
      ).toBeGreaterThan(0);

      // Проверка на командные инъекции
      expect(detectSuspiciousPatterns("rm -rf /").length).toBeGreaterThan(0);
      expect(
        detectSuspiciousPatterns("cat /etc/passwd").length
      ).toBeGreaterThan(0);
      expect(
        detectSuspiciousPatterns("exec('malicious code')").length
      ).toBeGreaterThan(0);
    });

    it("должна возвращать пустой массив для безопасных строк", () => {
      expect(detectSuspiciousPatterns("Hello, world!")).toEqual([]);
      expect(detectSuspiciousPatterns("This is a normal text")).toEqual([]);
      expect(detectSuspiciousPatterns("User: john_doe, age: 30")).toEqual([]);
      expect(detectSuspiciousPatterns("Product ID: 12345")).toEqual([]);
      expect(detectSuspiciousPatterns("Email: user@example.com")).toEqual([]);
    });

    it("должна быть чувствительна к регистру для некоторых паттернов", () => {
      // Должна обнаруживать независимо от регистра
      expect(
        detectSuspiciousPatterns("select * from users").length
      ).toBeGreaterThan(0);
      expect(
        detectSuspiciousPatterns("SELECT * FROM USERS").length
      ).toBeGreaterThan(0);
      expect(
        detectSuspiciousPatterns("Select * From Users").length
      ).toBeGreaterThan(0);
    });

    it("должна обнаруживать паттерны с пробелами и символами", () => {
      expect(
        detectSuspiciousPatterns("SELECT/**/*FROM users").length
      ).toBeGreaterThan(0);
      expect(
        detectSuspiciousPatterns("SELECT%0A*%0AFROM users").length
      ).toBeGreaterThan(0);
      expect(
        detectSuspiciousPatterns("SELECT\t*\tFROM users").length
      ).toBeGreaterThan(0);
    });
  });
});
