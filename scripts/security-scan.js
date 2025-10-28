#!/usr/bin/env node

/**
 * Скрипт для автоматического сканирования секретов в CI/CD
 * Использует различные паттерны для обнаружения потенциальных утечек
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Паттерны для поиска секретов
const SECRET_PATTERNS = [
  // Приватные ключи
  {
    name: "RSA Private Key",
    pattern:
      /-----BEGIN RSA PRIVATE KEY-----[\s\S]*?-----END RSA PRIVATE KEY-----/g,
    severity: "critical",
  },
  {
    name: "EC Private Key",
    pattern:
      /-----BEGIN EC PRIVATE KEY-----[\s\S]*?-----END EC PRIVATE KEY-----/g,
    severity: "critical",
  },
  {
    name: "OpenSSH Private Key",
    pattern:
      /-----BEGIN OPENSSH PRIVATE KEY-----[\s\S]*?-----END OPENSSH PRIVATE KEY-----/g,
    severity: "critical",
  },
  {
    name: "DSA Private Key",
    pattern:
      /-----BEGIN DSA PRIVATE KEY-----[\s\S]*?-----END DSA PRIVATE KEY-----/g,
    severity: "critical",
  },
  {
    name: "PKCS8 Private Key",
    pattern: /-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g,
    severity: "critical",
  },

  // API ключи и токены
  {
    name: "AWS Access Key",
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: "high",
  },
  {
    name: "AWS Secret Key",
    pattern: /[0-9a-zA-Z/+]{40}/g,
    severity: "high",
  },
  {
    name: "GitHub Token",
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    severity: "high",
  },
  {
    name: "GitHub OAuth",
    pattern: /gho_[a-zA-Z0-9]{36}/g,
    severity: "high",
  },
  {
    name: "GitHub App Token",
    pattern: /ghu_[a-zA-Z0-9]{36}/g,
    severity: "high",
  },
  {
    name: "GitHub Refresh Token",
    pattern: /ghr_[a-zA-Z0-9]{36}/g,
    severity: "high",
  },
  {
    name: "GitHub Token Classic",
    pattern: /ghs_[a-zA-Z0-9]{36}/g,
    severity: "high",
  },
  {
    name: "GitHub Token User-to-Server",
    pattern: /ghu_[a-zA-Z0-9]{36}/g,
    severity: "high",
  },
  {
    name: "GitHub Token Server-to-Server",
    pattern: /ghs_[a-zA-Z0-9]{36}/g,
    severity: "high",
  },

  // База данных
  {
    name: "Database URL",
    pattern: /(mongodb|mysql|postgresql):\/\/[^:]+:[^@]+@[^\/]+/g,
    severity: "high",
  },

  // JWT токены
  {
    name: "JWT Token",
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    severity: "medium",
  },

  // Solana ключи
  {
    name: "Solana Private Key",
    pattern: /[1-9A-HJ-NP-Za-km-z]{87,88}/g,
    severity: "critical",
  },
  {
    name: "Solana Program ID",
    pattern: /[1-9A-HJ-NP-Za-km-z]{32,44}/g,
    severity: "medium",
  },

  // IPFS хеши
  {
    name: "IPFS Hash",
    pattern: /Qm[1-9A-HJ-NP-Za-km-z]{44,}/g,
    severity: "low",
  },

  // Общие паттерны
  {
    name: "API Key",
    pattern: /api[_-]?key['"\s]*[:=]['"\s]*[a-zA-Z0-9_-]{10,}/gi,
    severity: "medium",
  },
  {
    name: "Secret Key",
    pattern: /secret[_-]?key['"\s]*[:=]['"\s]*[a-zA-Z0-9_-]{10,}/gi,
    severity: "medium",
  },
  {
    name: "Password",
    pattern: /password['"\s]*[:=]['"\s]*[a-zA-Z0-9_-]{6,}/gi,
    severity: "medium",
  },
  {
    name: "Token",
    pattern: /token['"\s]*[:=]['"\s]*[a-zA-Z0-9_-]{10,}/gi,
    severity: "medium",
  },
];

// Файлы и директории для исключения
const EXCLUDE_PATTERNS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  "package-lock.json",
  "yarn.lock",
  ".env.example",
  "*.min.js",
  "*.min.css",
  "SECURITY_AUDIT_REPORT.md",
  "SECRET_MANAGEMENT_PLAN.md",
];

// Типы файлов для сканирования
const INCLUDE_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".vue",
  ".py",
  ".php",
  ".rb",
  ".go",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".swift",
  ".kt",
  ".scala",
  ".rs",
  ".sh",
  ".bash",
  ".zsh",
  ".fish",
  ".ps1",
  ".bat",
  ".cmd",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".cfg",
  ".conf",
  ".md",
  ".txt",
  ".sql",
  ".html",
  ".css",
  ".scss",
  ".less",
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
];

class SecurityScanner {
  constructor(options = {}) {
    this.options = {
      directory: options.directory || process.cwd(),
      verbose: options.verbose || false,
      exitOnError: options.exitOnError !== false,
      ...options,
    };
    this.issues = [];
    this.scannedFiles = 0;
  }

  async scan() {
    console.log("🔍 Запуск сканирования безопасности...");
    console.log(`📁 Директория: ${this.options.directory}`);

    const files = this.getFilesToScan();
    console.log(`📄 Найдено файлов для сканирования: ${files.length}`);

    for (const file of files) {
      await this.scanFile(file);
    }

    this.generateReport();

    if (this.options.exitOnError && this.hasCriticalIssues()) {
      console.log("\n❌ Обнаружены критические проблемы безопасности!");
      process.exit(1);
    }
  }

  getFilesToScan() {
    const files = [];

    const walkDir = (dir) => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Проверяем исключения
          if (!this.isExcluded(fullPath)) {
            walkDir(fullPath);
          }
        } else if (stat.isFile()) {
          // Проверяем расширение файла
          if (this.shouldIncludeFile(fullPath)) {
            files.push(fullPath);
          }
        }
      }
    };

    walkDir(this.options.directory);
    return files;
  }

  isExcluded(filePath) {
    const relativePath = path.relative(this.options.directory, filePath);
    return EXCLUDE_PATTERNS.some(
      (pattern) =>
        relativePath.includes(pattern) ||
        filePath.includes(pattern) ||
        relativePath.match(new RegExp(pattern.replace("*", ".*")))
    );
  }

  shouldIncludeFile(filePath) {
    const ext = path.extname(filePath);
    return INCLUDE_EXTENSIONS.includes(ext);
  }

  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      this.scannedFiles++;

      for (const pattern of SECRET_PATTERNS) {
        const matches = content.match(pattern.pattern);
        if (matches) {
          for (const match of matches) {
            // Получаем номер строки
            const lines = content.split("\n");
            let lineNumber = 0;
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(match)) {
                lineNumber = i + 1;
                break;
              }
            }

            this.issues.push({
              file: filePath,
              line: lineNumber,
              type: pattern.name,
              severity: pattern.severity,
              match: this.truncateMatch(match),
              context: this.getContext(lines, lineNumber),
            });
          }
        }
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn(
          `⚠️  Не удалось прочитать файл ${filePath}: ${error.message}`
        );
      }
    }
  }

  truncateMatch(match, maxLength = 50) {
    if (match.length <= maxLength) return match;
    return match.substring(0, maxLength) + "...";
  }

  getContext(lines, lineNumber, contextLines = 2) {
    const start = Math.max(0, lineNumber - contextLines - 1);
    const end = Math.min(lines.length, lineNumber + contextLines);

    return lines
      .slice(start, end)
      .map((line, index) => {
        const currentLine = start + index + 1;
        const prefix = currentLine === lineNumber ? ">>> " : "    ";
        return `${prefix}${currentLine}: ${line}`;
      })
      .join("\n");
  }

  hasCriticalIssues() {
    return this.issues.some((issue) => issue.severity === "critical");
  }

  generateReport() {
    console.log("\n📊 Отчет о сканировании безопасности");
    console.log("=".repeat(50));

    // Сортируем по критичности
    const sortedIssues = this.issues.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    // Группируем по типу
    const groupedIssues = {};
    for (const issue of sortedIssues) {
      if (!groupedIssues[issue.type]) {
        groupedIssues[issue.type] = [];
      }
      groupedIssues[issue.type].push(issue);
    }

    // Выводим результаты
    for (const [type, issues] of Object.entries(groupedIssues)) {
      const severity = issues[0].severity;
      const icon = this.getSeverityIcon(severity);

      console.log(`\n${icon} ${type} (${issues.length} найдено)`);

      for (const issue of issues) {
        const relativePath = path.relative(this.options.directory, issue.file);
        console.log(`   📁 ${relativePath}:${issue.line}`);
        console.log(`   🔍 ${issue.match}`);

        if (this.options.verbose) {
          console.log(`   📝 Контекст:`);
          console.log(`   ${issue.context.replace(/\n/g, "\n   ")}`);
        }
      }
    }

    // Статистика
    console.log("\n📈 Статистика:");
    console.log(`   📁 Просканировано файлов: ${this.scannedFiles}`);
    console.log(`   🔍 Найдено проблем: ${this.issues.length}`);

    const severityCount = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const issue of this.issues) {
      severityCount[issue.severity]++;
    }

    for (const [severity, count] of Object.entries(severityCount)) {
      if (count > 0) {
        const icon = this.getSeverityIcon(severity);
        console.log(`   ${icon} ${severity}: ${count}`);
      }
    }

    // Рекомендации
    if (this.issues.length > 0) {
      console.log("\n💡 Рекомендации:");

      if (severityCount.critical > 0) {
        console.log("   🔴 НЕМЕДЛЕННО устраните критические проблемы!");
      }

      if (severityCount.high > 0) {
        console.log("   🟠 Срочно устраните высокоприоритетные проблемы");
      }

      console.log("   🔐 Используйте переменные окружения для секретов");
      console.log("   📝 Добавьте .env файлы в .gitignore");
      console.log("   🔍 Настройте pre-commit хуки для проверки");
      console.log(
        "   🛡️  Используйте хранилища секретов (Vault, AWS Secrets Manager)"
      );
    } else {
      console.log("\n✅ Секретов не обнаружено!");
    }
  }

  getSeverityIcon(severity) {
    const icons = {
      critical: "🔴",
      high: "🟠",
      medium: "🟡",
      low: "🟢",
    };
    return icons[severity] || "⚪";
  }
}

// CLI интерфейс
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--no-exit") {
      options.exitOnError = false;
    } else if (arg === "--directory" || arg === "-d") {
      options.directory = args[++i];
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Использование: node security-scan.js [опции]

Опции:
  -d, --directory <path>  Директория для сканирования (по умолчанию: текущая)
  -v, --verbose         Подробный вывод
  --no-exit            Не выходить с ошибкой при обнаружении проблем
  -h, --help            Показать эту справку

Примеры:
  node security-scan.js
  node security-scan.js --directory ./src --verbose
  node security-scan.js --no-exit
      `);
      process.exit(0);
    }
  }

  const scanner = new SecurityScanner(options);
  scanner.scan().catch((error) => {
    console.error("❌ Ошибка при сканировании:", error.message);
    process.exit(1);
  });
}

export default SecurityScanner;
