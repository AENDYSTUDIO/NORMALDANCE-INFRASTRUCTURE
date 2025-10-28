#!/usr/bin/env node

/**
 * Pre-commit хук для проверки секретов и других проблем безопасности
 * Запускается автоматически перед каждым коммитом
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import SecurityScanner from "./security-scan.js";

class PreCommitHook {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  async run() {
    console.log("🔍 Pre-commit проверка безопасности...\n");

    try {
      // 1. Проверяем измененные файлы
      await this.checkStagedFiles();

      // 2. Проверяем на секреты
      await this.checkForSecrets();

      // 3. Проверяем .env файлы
      this.checkEnvFiles();

      // 4. Проверяем merge конфликты
      this.checkMergeConflicts();

      // 5. Проверяем размер файлов
      this.checkFileSize();

      // 6. Проверяем права доступа
      this.checkFilePermissions();

      // Выводим результаты
      this.printResults();

      // Если есть ошибки, блокируем коммит
      if (this.errors.length > 0) {
        console.log("\n❌ Обнаружены ошибки. Коммит заблокирован.");
        process.exit(1);
      }

      if (this.warnings.length > 0) {
        console.log(
          "\n⚠️  Обнаружены предупреждения. Рекомендуется исправить перед коммитом."
        );
      }

      console.log("\n✅ Проверка пройдена. Можно коммитить.");
    } catch (error) {
      console.error("❌ Ошибка при выполнении pre-commit хука:", error.message);
      process.exit(1);
    }
  }

  async checkStagedFiles() {
    try {
      // Получаем список измененных файлов
      const stagedFiles = execSync("git diff --cached --name-only", {
        encoding: "utf8",
      })
        .trim()
        .split("\n")
        .filter((file) => file.length > 0);

      if (stagedFiles.length === 0) {
        console.log("📝 Нет измененных файлов для проверки.");
        return;
      }

      console.log(`📁 Проверяем ${stagedFiles.length} измененных файлов...`);

      // Создаем временную директорию для проверки
      const tempDir = fs.mkdtempSync("pre-commit-");

      try {
        // Копируем измененные файлы во временную директорию
        for (const file of stagedFiles) {
          try {
            const content = execSync(`git show :${file}`, { encoding: "utf8" });
            const filePath = path.join(tempDir, file);

            // Создаем директорию если нужно
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, content);
          } catch (error) {
            // Пропускаем файлы которые не являются текстовыми
            console.warn(`⚠️  Не удалось проверить файл: ${file}`);
          }
        }

        // Запускаем сканер безопасности
        const scanner = new SecurityScanner({
          directory: tempDir,
          verbose: false,
          exitOnError: false,
        });

        await scanner.scan();

        // Сохраняем результаты
        this.errors.push(
          ...scanner.issues.filter(
            (issue) =>
              issue.severity === "critical" || issue.severity === "high"
          )
        );

        this.warnings.push(
          ...scanner.issues.filter(
            (issue) => issue.severity === "medium" || issue.severity === "low"
          )
        );
      } finally {
        // Удаляем временную директорию
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      this.errors.push({
        type: "Git Error",
        message: `Не удалось получить измененные файлы: ${error.message}`,
        severity: "high",
      });
    }
  }

  async checkForSecrets() {
    console.log("🔍 Проверка на секреты в измененных файлах...");

    try {
      // Получаем измененные файлы
      const stagedFiles = execSync("git diff --cached --name-only", {
        encoding: "utf8",
      })
        .trim()
        .split("\n")
        .filter((file) => file.length > 0);

      // Проверяем каждый файл на наличие секретов
      for (const file of stagedFiles) {
        try {
          const content = execSync(`git show :${file}`, { encoding: "utf8" });

          // Проверяем на приватные ключи
          if (
            content.includes("-----BEGIN") &&
            content.includes("PRIVATE KEY-----")
          ) {
            this.errors.push({
              type: "Private Key",
              file,
              message: "Обнаружен приватный ключ в файле",
              severity: "critical",
            });
          }

          // Проверяем на API ключи
          const apiKeyPatterns = [
            /api[_-]?key['"\s]*[:=]['"\s]*[a-zA-Z0-9_-]{10,}/gi,
            /secret[_-]?key['"\s]*[:=]['"\s]*[a-zA-Z0-9_-]{10,}/gi,
            /password['"\s]*[:=]['"\s]*[a-zA-Z0-9_-]{6,}/gi,
          ];

          for (const pattern of apiKeyPatterns) {
            if (pattern.test(content)) {
              this.errors.push({
                type: "API Key",
                file,
                message: "Обнаружен потенциальный API ключ или пароль",
                severity: "high",
              });
              break;
            }
          }

          // Проверяем на JWT токены
          if (
            /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/.test(content)
          ) {
            this.warnings.push({
              type: "JWT Token",
              file,
              message: "Обнаружен JWT токен",
              severity: "medium",
            });
          }
        } catch (error) {
          // Пропускаем бинарные файлы
        }
      }
    } catch (error) {
      this.warnings.push({
        type: "Secret Check",
        message: `Не удалось проверить секреты: ${error.message}`,
        severity: "low",
      });
    }
  }

  checkEnvFiles() {
    console.log("🔍 Проверка .env файлов...");

    try {
      // Получаем измененные файлы
      const stagedFiles = execSync("git diff --cached --name-only", {
        encoding: "utf8",
      })
        .trim()
        .split("\n")
        .filter((file) => file.length > 0);

      // Проверяем на .env файлы
      const envFiles = stagedFiles.filter(
        (file) => file.startsWith(".env") || file.includes(".env.")
      );

      for (const file of envFiles) {
        this.errors.push({
          type: "Environment File",
          file,
          message: ".env файлы не должны добавляться в репозиторий",
          severity: "critical",
        });
      }

      // Проверяем .gitignore на наличие .env
      try {
        const gitignore = fs.readFileSync(".gitignore", "utf8");
        if (!gitignore.includes(".env")) {
          this.warnings.push({
            type: "Gitignore",
            message: ".gitignore не содержит .env файлы",
            severity: "medium",
          });
        }
      } catch (error) {
        this.warnings.push({
          type: "Gitignore",
          message: ".gitignore файл не найден",
          severity: "medium",
        });
      }
    } catch (error) {
      this.warnings.push({
        type: "Environment Check",
        message: `Не удалось проверить .env файлы: ${error.message}`,
        severity: "low",
      });
    }
  }

  checkMergeConflicts() {
    console.log("🔍 Проверка merge конфликтов...");

    try {
      // Получаем измененные файлы
      const stagedFiles = execSync("git diff --cached --name-only", {
        encoding: "utf8",
      })
        .trim()
        .split("\n")
        .filter((file) => file.length > 0);

      // Проверяем на маркеры merge конфликтов
      for (const file of stagedFiles) {
        try {
          const content = execSync(`git show :${file}`, { encoding: "utf8" });

          if (
            content.includes("<<<<<<<") ||
            content.includes(">>>>>>>") ||
            content.includes("=======")
          ) {
            this.errors.push({
              type: "Merge Conflict",
              file,
              message: "Обнаружены неразрешенные merge конфликты",
              severity: "high",
            });
          }
        } catch (error) {
          // Пропускаем бинарные файлы
        }
      }
    } catch (error) {
      this.warnings.push({
        type: "Merge Conflict Check",
        message: `Не удалось проверить merge конфликты: ${error.message}`,
        severity: "low",
      });
    }
  }

  checkFileSize() {
    console.log("🔍 Проверка размера файлов...");

    try {
      // Получаем измененные файлы
      const stagedFiles = execSync("git diff --cached --name-only", {
        encoding: "utf8",
      })
        .trim()
        .split("\n")
        .filter((file) => file.length > 0);

      // Проверяем размер файлов
      for (const file of stagedFiles) {
        try {
          const stats = execSync(`git ls-files -s ${file}`, {
            encoding: "utf8",
          });
          const size = parseInt(stats.split(" ")[1], 16) * 1024; // Размер в байтах
          const sizeMB = size / (1024 * 1024);

          if (sizeMB > 10) {
            this.warnings.push({
              type: "File Size",
              file,
              message: `Большой файл: ${sizeMB.toFixed(
                2
              )}MB (рекомендуется < 10MB)`,
              severity: "medium",
            });
          }

          if (sizeMB > 50) {
            this.errors.push({
              type: "File Size",
              file,
              message: `Слишком большой файл: ${sizeMB.toFixed(
                2
              )}MB (максимум 50MB)`,
              severity: "high",
            });
          }
        } catch (error) {
          // Пропускаем файлы которые не удалось проверить
        }
      }
    } catch (error) {
      this.warnings.push({
        type: "File Size Check",
        message: `Не удалось проверить размер файлов: ${error.message}`,
        severity: "low",
      });
    }
  }

  checkFilePermissions() {
    console.log("🔍 Проверка прав доступа...");

    try {
      // Получаем измененные файлы
      const stagedFiles = execSync("git diff --cached --name-only", {
        encoding: "utf8",
      })
        .trim()
        .split("\n")
        .filter((file) => file.length > 0);

      // Проверяем права доступа к исполняемым файлам
      for (const file of stagedFiles) {
        try {
          const stats = execSync(`git ls-files -s ${file}`, {
            encoding: "utf8",
          });
          const mode = parseInt(stats.split(" ")[0], 8);

          // Проверяем на исполняемые права для не-скриптов
          if (mode & 0o111 && !this.isScript(file)) {
            this.warnings.push({
              type: "File Permissions",
              file,
              message: "Файл имеет исполняемые права, но не является скриптом",
              severity: "low",
            });
          }
        } catch (error) {
          // Пропускаем файлы которые не удалось проверить
        }
      }
    } catch (error) {
      this.warnings.push({
        type: "File Permissions Check",
        message: `Не удалось проверить права доступа: ${error.message}`,
        severity: "low",
      });
    }
  }

  isScript(file) {
    const scriptExtensions = [
      ".sh",
      ".bash",
      ".zsh",
      ".fish",
      ".ps1",
      ".bat",
      ".cmd",
      ".py",
      ".js",
      ".rb",
      ".php",
      ".pl",
    ];
    const scriptNames = ["Makefile", "Rakefile", "Dockerfile"];

    return (
      scriptExtensions.some((ext) => file.endsWith(ext)) ||
      scriptNames.some((name) => file.includes(name))
    );
  }

  printResults() {
    console.log("\n📊 Результаты проверки:");
    console.log("=".repeat(50));

    // Выводим ошибки
    if (this.errors.length > 0) {
      console.log("\n🔴 ОШИБКИ:");
      for (const error of this.errors) {
        console.log(`   ❌ ${error.type}: ${error.message}`);
        if (error.file) {
          console.log(`      📁 Файл: ${error.file}`);
        }
      }
    }

    // Выводим предупреждения
    if (this.warnings.length > 0) {
      console.log("\n🟡 ПРЕДУПРЕЖДЕНИЯ:");
      for (const warning of this.warnings) {
        console.log(`   ⚠️  ${warning.type}: ${warning.message}`);
        if (warning.file) {
          console.log(`      📁 Файл: ${warning.file}`);
        }
      }
    }

    // Статистика
    console.log("\n📈 Статистика:");
    console.log(`   🔴 Ошибок: ${this.errors.length}`);
    console.log(`   🟡 Предупреждений: ${this.warnings.length}`);

    // Рекомендации
    if (this.errors.length > 0 || this.warnings.length > 0) {
      console.log("\n💡 Рекомендации:");

      if (this.errors.some((e) => e.type === "Private Key")) {
        console.log(
          "   🔐 Используйте хранилища секретов для приватных ключей"
        );
      }

      if (this.errors.some((e) => e.type === "Environment File")) {
        console.log("   🔐 Добавьте .env файлы в .gitignore");
        console.log("   🔐 Используйте .env.example как шаблон");
      }

      if (this.errors.some((e) => e.type === "Merge Conflict")) {
        console.log("   🔀 Разрешите все merge конфликты перед коммитом");
      }

      if (this.warnings.some((w) => w.type === "File Size")) {
        console.log("   📦 Используйте Git LFS для больших файлов");
      }
    }
  }
}

// Запускаем хук
if (import.meta.url === `file://${process.argv[1]}`) {
  const hook = new PreCommitHook();
  hook.run();
}

export default PreCommitHook;
