#!/usr/bin/env node

/**
 * Скрипт для безопасной ротации секретов в проекте
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class SecretsRotator {
  constructor() {
    this.envFilePath = ".env";
    this.envExamplePath = ".env.example";
    this.backupDir = "backups";
  }

  /**
   * Генерирует безопасный секрет
   */
  generateSecret(length = 64) {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Генерирует JWT секрет
   */
  generateJWTSecret() {
    return crypto.randomBytes(32).toString("base64");
  }

  /**
   * Создает резервную копию .env файла
   */
  createBackup() {
    if (!fs.existsSync(this.envFilePath)) {
      console.log(
        "⚠️  .env файл не найден, создание резервной копии пропущено"
      );
      return null;
    }

    // Создаем директорию для бэкапов если ее нет
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(this.backupDir, `env-backup-${timestamp}.env`);

    fs.copyFileSync(this.envFilePath, backupPath);
    console.log(`✅ Резервная копия создана: ${backupPath}`);

    return backupPath;
  }

  /**
   * Читает .env файл и возвращает объект с переменными
   */
  readEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return {};
    }

    const content = fs.readFileSync(filePath, "utf8");
    const vars = {};

    content.split("\n").forEach((line) => {
      line = line.trim();
      if (line && !line.startsWith("#") && line.includes("=")) {
        const [key, ...valueParts] = line.split("=");
        vars[key.trim()] = valueParts
          .join("=")
          .trim()
          .replace(/^["']|["']$/g, "");
      }
    });

    return vars;
  }

  /**
   * Записывает переменные в .env файл
   */
  writeEnvFile(filePath, vars) {
    const lines = [];

    // Читаем оригинальный файл для сохранения комментариев и структуры
    if (fs.existsSync(filePath)) {
      const originalLines = fs.readFileSync(filePath, "utf8").split("\n");
      let currentSection = "";

      originalLines.forEach((line) => {
        line = line.trimEnd();

        if (line.startsWith("#") || line === "") {
          lines.push(line);
        } else if (line.includes("=")) {
          const [key, ...valueParts] = line.split("=");
          const keyTrimmed = key.trim();

          if (Object.prototype.hasOwnProperty.call(vars, keyTrimmed)) {
            const value = vars[keyTrimmed];
            // Сохраняем оригинальные кавычки если они были
            const quote = line.includes('"')
              ? '"'
              : line.includes("'")
              ? "'"
              : "";
            lines.push(`${keyTrimmed}=${quote}${value}${quote}`);
          } else {
            lines.push(line);
          }
        } else {
          lines.push(line);
        }
      });
    } else {
      // Если файла нет, создаем его из .env.example
      const exampleVars = this.readEnvFile(this.envExamplePath);
      Object.keys(exampleVars).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(vars, key)) {
          lines.push(`${key}="${vars[key]}"`);
        } else {
          lines.push(`${key}="${exampleVars[key]}"`);
        }
      });
    }

    fs.writeFileSync(filePath, lines.join("\n") + "\n");
  }

  /**
   * Определяет, какие секреты нужно ротировать
   */
  getSecretsToRotate() {
    return [
      { key: "NEXTAUTH_SECRET", generator: () => this.generateSecret() },
      { key: "JWT_SECRET", generator: () => this.generateJWTSecret() },
      {
        key: "UPSTASH_REDIS_REST_TOKEN",
        generator: () => this.generateSecret(32),
      },
      // Добавьте другие секреты по необходимости
    ];
  }

  /**
   * Ротирует секреты
   */
  rotate() {
    console.log("🔄 Начало ротации секретов...");

    try {
      // Создаем резервную копию
      const backupPath = this.createBackup();

      // Читаем текущие переменные
      const currentVars = this.readEnvFile(this.envFilePath);

      // Получаем список секретов для ротации
      const secretsToRotate = this.getSecretsToRotate();

      // Ротируем секреты
      let rotatedCount = 0;
      secretsToRotate.forEach(({ key, generator }) => {
        if (Object.prototype.hasOwnProperty.call(currentVars, key)) {
          const oldValue = currentVars[key];
          const newValue = generator();
          currentVars[key] = newValue;

          console.log(`🔄 ${key}: ***ROTATED***`);
          rotatedCount++;
        }
      });

      if (rotatedCount === 0) {
        console.log("ℹ️  Нет секретов для ротации");
        return;
      }

      // Записываем обновленные переменные
      this.writeEnvFile(this.envFilePath, currentVars);

      console.log(`✅ Успешно ротировано ${rotatedCount} секретов`);
      console.log(
        "⚠️  Не забудьте обновить секреты во всех средах развертывания"
      );

      return true;
    } catch (error) {
      console.error("❌ Ошибка при ротации секретов:", error.message);
      return false;
    }
  }

  /**
   * Проверяет текущие секреты на безопасность
   */
  validate() {
    console.log("🔒 Проверка секретов на безопасность...");

    try {
      const currentVars = this.readEnvFile(this.envFilePath);
      const issues = [];

      // Проверяем длину секретов
      const secretKeys = [
        "NEXTAUTH_SECRET",
        "JWT_SECRET",
        "UPSTASH_REDIS_REST_TOKEN",
      ];

      secretKeys.forEach((key) => {
        if (currentVars[key]) {
          const secret = currentVars[key];
          if (secret.length < 32) {
            issues.push(
              `${key}: Секрет слишком короткий (${secret.length} символов)`
            );
          }

          // Проверяем на слабые значения
          if (
            secret.includes("your-") ||
            secret.includes("secret") ||
            secret.includes("key")
          ) {
            issues.push(`${key}: Секрет содержит фиктивное значение`);
          }

          // Проверяем на повторяющиеся символы
          if (/^1+$|^0+$|^a+$|^f+$/i.test(secret)) {
            issues.push(`${key}: Секрет состоит из повторяющихся символов`);
          }
        }
      });

      if (issues.length > 0) {
        console.log("⚠️  Найдены проблемы с секретами:");
        issues.forEach((issue) => console.log(`   - ${issue}`));
        return false;
      } else {
        console.log("✅ Все секреты прошли проверку");
        return true;
      }
    } catch (error) {
      console.error("❌ Ошибка при проверке секретов:", error.message);
      return false;
    }
  }
}

// Запуск скрипта
if (require.main === module) {
  const rotator = new SecretsRotator();

  const args = process.argv.slice(2);

  if (args.includes("--validate") || args.includes("-v")) {
    rotator.validate();
  } else if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Использование: node scripts/rotate-secrets.js [опции]

Опции:
  --rotate, -r    Ротировать секреты (по умолчанию)
  --validate, -v  Проверить секреты на безопасность
  --help, -h      Показать эту справку

Примеры:
  node scripts/rotate-secrets.js          # Ротировать секреты
  node scripts/rotate-secrets.js --validate  # Проверить секреты
    `);
  } else {
    rotator.rotate();
  }
}

module.exports = SecretsRotator;
