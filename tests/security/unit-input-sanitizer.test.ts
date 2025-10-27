/**
 * Модульные тесты для функций input-sanitizer из src/lib/security/input-sanitizer.ts
 * Покрывает: sanitizeSQL, isValidEmail, isValidSolanaAddress, isValidEthereumAddress, isValidTONAddress, isValidIPFSCID
 */

import {
  isValidEmail,
  isValidEthereumAddress,
  isValidIPFSCID,
  isValidSolanaAddress,
  isValidTONAddress,
  sanitizeSQL,
} from "@/lib/security/input-sanitizer";

describe("Функции input-sanitizer", () => {
  describe("sanitizeSQL", () => {
    it("должна экранировать одинарные кавычки", () => {
      expect(sanitizeSQL("O'Reilly")).toBe("O''Reilly");
    });

    it("должна удалять SQL-комментарии", () => {
      expect(sanitizeSQL("SELECT * FROM users -- comment")).toBe(
        "SELECT * FROM users "
      );
      expect(sanitizeSQL("SELECT * FROM users /* comment */")).toBe(
        "SELECT * FROM users "
      );
    });

    it("должна обрабатывать подозрительные паттерны", () => {
      expect(sanitizeSQL("'; DROP TABLE users; --")).toBe(
        "''; DROP TABLE users; "
      );
      expect(sanitizeSQL(" OR 1=1")).toBe(" OR 1=1"); // не должна изменять безопасные строки
    });

    it("должна возвращать пустую строку для нестроковых значений", () => {
      expect(sanitizeSQL(null as any)).toBe("");
      expect(sanitizeSQL(undefined as any)).toBe("");
      expect(sanitizeSQL(123 as any)).toBe("");
    });
  });

  describe("isValidEmail", () => {
    it("должна валидировать корректные email", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("user.name@example.com")).toBe(true);
      expect(isValidEmail("user+tag@example.co.uk")).toBe(true);
      expect(isValidEmail("user123@test-domain.org")).toBe(true);
    });

    it("должна отклонять некорректные email", () => {
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("user.example.com")).toBe(false);
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail(null as any)).toBe(false);
      expect(isValidEmail(undefined as any)).toBe(false);
    });
  });

  describe("isValidSolanaAddress", () => {
    it("должна валидировать корректные Solana адреса", () => {
      // Валидный Solana адрес (Base58)
      expect(
        isValidSolanaAddress("5xoBq7f733X7s7mBKMdRyZnYf53S62WrZjfkKcFZc6qf")
      ).toBe(true);
      // Валидный системный адрес
      expect(isValidSolanaAddress("1111111111")).toBe(true);
    });

    it("должна отклонять некорректные Solana адреса", () => {
      expect(isValidSolanaAddress("invalid-address")).toBe(false);
      expect(isValidSolanaAddress("")).toBe(false);
      expect(isValidSolanaAddress("too-short")).toBe(false);
      expect(
        isValidSolanaAddress(
          "1234567890123456789012345678901234567890123456789012345"
        )
      ).toBe(false); // слишком длинный
      expect(isValidSolanaAddress(null as any)).toBe(false);
      expect(isValidSolanaAddress(undefined as any)).toBe(false);
    });
  });

  describe("isValidEthereumAddress", () => {
    it("должна валидировать корректные Ethereum адреса", () => {
      expect(
        isValidEthereumAddress("0x742d35Cc6634C0532925a3b844Bc454e4438f4e")
      ).toBe(true);
      expect(
        isValidEthereumAddress("0x742d35cc6634c0532925a3b844bc454e4438f44e")
      ).toBe(true); // lowercase
      expect(
        isValidEthereumAddress("0X742D35CC6634C0532925A3B844BC454E438F44E")
      ).toBe(true); // uppercase
    });

    it("должна отклонять некорректные Ethereum адреса", () => {
      expect(isValidEthereumAddress("invalid-address")).toBe(false);
      expect(isValidEthereumAddress("0x123")).toBe(false); // слишком короткий
      expect(isValidEthereumAddress("0x" + "1".repeat(41))).toBe(false); // слишком длинный
      expect(isValidEthereumAddress("0xZZZZZZZZZZZZZZZZZZZZZZ")).toBe(false); // недопустимые символы
      expect(isValidEthereumAddress("")).toBe(false);
      expect(isValidEthereumAddress(null as any)).toBe(false);
      expect(isValidEthereumAddress(undefined as any)).toBe(false);
    });
  });

  describe("isValidTONAddress", () => {
    it("должна валидировать корректные TON адреса", () => {
      expect(
        isValidTONAddress("EQCD39SOfsr6DANawC_qPv_0Ph8V1Sd6e48nf7btg3OhdCBa")
      ).toBe(true);
      expect(
        isValidTONAddress("UQCD39SOfsr6DANawC_qPv_0Ph8V1Sd6e48nf7btg3OhdP1v")
      ).toBe(true);
    });

    it("должна отклонять некорректные TON адреса", () => {
      expect(isValidTONAddress("invalid-address")).toBe(false);
      expect(isValidTONAddress("")).toBe(false);
      expect(isValidTONAddress("too-short")).toBe(false);
      expect(isValidTONAddress("EQ" + "A".repeat(100))).toBe(false); // слишком длинный
      expect(isValidTONAddress(null as any)).toBe(false);
      expect(isValidTONAddress(undefined as any)).toBe(false);
    });
  });

  describe("isValidIPFSCID", () => {
    it("должна валидировать корректные IPFS CID", () => {
      // v0
      expect(
        isValidIPFSCID("QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79oj8gePhQ")
      ).toBe(true);
      // v1
      expect(
        isValidIPFSCID(
          "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55nthrq"
        )
      ).toBe(true);
      expect(
        isValidIPFSCID("zb2rhk6GMPQ8eNCg63VfmrVw5Y69F7f9w5i5qK2c74Cq3x7pM")
      ).toBe(true);
    });

    it("должна отклонять некорректные IPFS CID", () => {
      expect(isValidIPFSCID("invalid-cid")).toBe(false);
      expect(isValidIPFSCID("")).toBe(false);
      expect(isValidIPFSCID("QmInvalid")).toBe(false);
      expect(isValidIPFSCID("bafInvalid")).toBe(false);
      expect(isValidIPFSCID(null as any)).toBe(false);
      expect(isValidIPFSCID(undefined as any)).toBe(false);
    });
  });
});
