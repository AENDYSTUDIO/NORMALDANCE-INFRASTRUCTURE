import fs from 'fs';
import path from 'path';

/**
 * Скрипт для проверки наличия потенциальных утечек секретов в файлах проекта
 */
class SecretsChecker {
  constructor() {
    // Паттерны, которые могут указывать на наличие секретов
    this.secretPatterns = [
      // API ключи
      /["'](?:api[_-]?key|secret|token|password|pwd|auth|bearer|jwt|access[_-]?token|refresh[_-]?token)["']\s*[:=]\s*["'][^"']{20,}["']/gi,
      // JWT токены
      /eyJ[a-zA-Z0-9_=-]+\.[a-zA-Z0-9_=-]+\.[a-zA-Z0-9_=-]*/g,
      // Приватные ключи
      /-----BEGIN (?:RSA |EC |PGP |)?PRIVATE KEY-----/g,
      // Solana ключи
      /[1-9A-HJ-NP-Za-km-z]{43,}/g,
      // PINATA ключи (обычно 32-40 символов)
      /[a-f0-9]{32,40}/g,
      // Длинные хеши/токены
      /[a-fA-F0-9]{64,}/g,
    ];

    // Файлы и директории для исключения из проверки
    this.excludePatterns = [
      ".git",
      "node_modules",
      ".next",
      "build",
      "dist",
      "out",
      ".env.example",
      ".env.local",
      "package-lock.json",
      "yarn.lock",
      "*.log",
      "coverage",
      "__tests__",
      "__mocks__",
      ".mypy_cache",
      ".pytest_cache",
      ".vscode",
      ".idea",
      ".nyc_output",
      "logs",
      "tmp",
      "temp",
      ".husky",
      ".roo",
      ".agents",
      ".amazonq",
      ".continue",
      ".gigaide",
      ".qodo",
      "db/*.db",
      "db/*.db-*",
      "*.sqlite3",
      "public/vercel.svg",
      "mobile-app/node_modules",
      "tesseract/*",
      "contracts/artifacts",
      "contracts/cache",
      ".github",
      ".storybook",
      "k8s",
      "helm",
      "monitoring",
      "scout-demo-service",
      "grants",
      "docs-sale",
      "policy",
      "examples",
      "types",
      "k8s",
      "helm",
      "legal",
      "prisma/migrations",
    ];
  }

  /**
   * Проверяет, должен ли файл быть исключен из проверки
   */
  shouldExclude(filePath) {
    const normalizedPath = path.normalize(filePath).replace(/\\/g, "/");
    return this.excludePatterns.some((pattern) => {
      if (pattern.startsWith(".") || pattern.startsWith("/")) {
        return normalizedPath.includes(pattern);
      } else if (pattern.endsWith("*")) {
        return normalizedPath.endsWith(pattern.slice(0, -1));
      } else {
        return (
          normalizedPath.includes(pattern) ||
          path.basename(normalizedPath) === pattern
        );
      }
    });
  }

  /**
   * Проверяет отдельный файл на наличие потенциальных секретов
   */
  checkFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const results = [];
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        for (let j = 0; j < this.secretPatterns.length; j++) {
          const pattern = this.secretPatterns[j];
          let match;

          // Сброс позиции регулярного выражения
          pattern.lastIndex = 0;

          while ((match = pattern.exec(line)) !== null) {
            // Проверяем, не является ли это фиктивным значением
            if (!this.isLikelyPlaceholder(match[0])) {
              results.push({
                file: filePath,
                line: lineNumber,
                column: match.index + 1,
                match: match[0],
                patternIndex: j,
              });
            }
          }
        }
      }

      return results;
    } catch (error) {
      console.warn(`Ошибка при чтении файла ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Проверяет, является ли строка фиктивным значением
   */
  isLikelyPlaceholder(str) {
    const placeholders = [
      /your-.*-here/i,
      /your-.*-key/i,
      /your-.*-token/i,
      /secret-key-here/i,
      /api-key-here/i,
      /token-here/i,
      /example/i,
      /placeholder/i,
      /fake/i,
      /dummy/i,
      /test/i,
      /1{32,}/, // строка из одних единиц
      /0{32,}/, // строка из одних нулей
    ];

    return placeholders.some((placeholder) => placeholder.test(str));
  }

  /**
   * Рекурсивно сканирует директорию на наличие файлов с потенциальными секретами
   */
  scanDirectory(dirPath) {
    let allResults = [];

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (this.shouldExclude(fullPath)) {
        continue;
      }

      if (stat.isDirectory()) {
        allResults = allResults.concat(this.scanDirectory(fullPath));
      } else if (stat.isFile() && this.isTextFile(fullPath)) {
        const results = this.checkFile(fullPath);
        if (results.length > 0) {
          allResults = allResults.concat(results);
        }
      }
    }

    return allResults;
  }

  /**
   * Проверяет, является ли файл текстовым
   */
  isTextFile(filePath) {
    const textExtensions = [
      ".js",
      ".ts",
      ".jsx",
      ".tsx",
      ".json",
      ".yaml",
      ".yml",
      ".env",
      ".config",
      ".conf",
      ".txt",
      ".md",
      ".html",
      ".htm",
      ".css",
      ".scss",
      ".sass",
      ".less",
      ".xml",
      ".csv",
      ".sql",
      ".py",
      ".rb",
      ".go",
      ".java",
      ".sh",
      ".bash",
      ".zsh",
      ".ps1",
    ];

    const ext = path.extname(filePath).toLowerCase();
    return textExtensions.includes(ext);
  }

  /**
   * Запускает проверку и возвращает результаты
   */
  run() {
    console.log("Проверка на наличие потенциальных утечек секретов...\n");

    const results = this.scanDirectory(".");

    if (results.length === 0) {
      console.log("✅ Утечек секретов не обнаружено.");
    } else {
      console.log(
        `⚠️  Обнаружено ${results.length} потенциальных утечек секретов:\n`
      );

      results.forEach((result, index) => {
        console.log(`${index + 1}. Файл: ${result.file}`);
        console.log(`   Строка: ${result.line}, Колонка: ${result.column}`);
        console.log(
          `   Совпадение: ${result.match.substring(0, 100)}${
            result.match.length > 100 ? "..." : ""
          }`
        );
        console.log("");
      });

      console.log(
        "⚠️  ВНИМАНИЕ: Пожалуйста, проверьте эти файлы и убедитесь, что"
      );
      console.log(
        "    чувствительные данные не попали в репозиторий случайно.\n"
      );

      // Возвращаем ненулевой код выхода, если найдены потенциальные утечки
      process.exitCode = 1;
    }

    return results;
  }
}

// Запуск скрипта, если он вызывается напрямую
if (require.main === module) {
  const checker = new SecretsChecker();
  checker.run();
}

module.exports = SecretsChecker;
