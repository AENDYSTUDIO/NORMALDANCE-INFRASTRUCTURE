#!/usr/bin/env node

/**
 * Скрипт проверки готовности проекта к развертыванию
 * Проверяет наличие всех необходимых файлов, конфигураций и зависимостей
 */

import fs from 'fs';
import path from 'path';

// Цвета для консоли
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function readJsonFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    return null;
  }
}

function checkEnvVariables() {
  log("\n📋 Проверка переменных окружения...", "cyan");

  const requiredVars = [
    "NEXT_PUBLIC_APP_URL",
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "PINATA_JWT",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "TELEGRAM_BOT_TOKEN",
  ];

  const optionalVars = [
    "SENTRY_DSN",
    "NEXT_PUBLIC_SENTRY_DSN",
    "MIXPANEL_TOKEN",
  ];

  let allPresent = true;

  // Проверка .env.example
  if (checkFileExists(".env.example")) {
    log("  ✅ .env.example найден", "green");
  } else {
    log("  ❌ .env.example не найден", "red");
    allPresent = false;
  }

  // Проверка .env.local
  if (checkFileExists(".env.local")) {
    log("  ✅ .env.local найден (для локальной разработки)", "green");
  } else {
    log(
      "  ⚠️  .env.local не найден (создайте для локального тестирования)",
      "yellow"
    );
  }

  log("\n  Обязательные переменные для production:", "blue");
  requiredVars.forEach((varName) => {
    log(`    • ${varName}`, "cyan");
  });

  log("\n  Опциональные переменные:", "blue");
  optionalVars.forEach((varName) => {
    log(`    • ${varName}`, "cyan");
  });

  return allPresent;
}

function checkPackageJson() {
  log("\n📦 Проверка package.json...", "cyan");

  const pkg = readJsonFile("package.json");
  if (!pkg) {
    log("  ❌ package.json не найден или поврежден", "red");
    return false;
  }

  log("  ✅ package.json найден", "green");

  // Проверка необходимых скриптов
  const requiredScripts = ["dev", "build", "start"];
  const missingScripts = requiredScripts.filter(
    (script) => !pkg.scripts || !pkg.scripts[script]
  );

  if (missingScripts.length === 0) {
    log("  ✅ Все необходимые скрипты присутствуют", "green");
  } else {
    log(`  ❌ Отсутствуют скрипты: ${missingScripts.join(", ")}`, "red");
    return false;
  }

  // Проверка критических зависимостей
  const criticalDeps = ["next", "react", "react-dom"];
  const missingDeps = criticalDeps.filter(
    (dep) => !pkg.dependencies || !pkg.dependencies[dep]
  );

  if (missingDeps.length === 0) {
    log("  ✅ Все критические зависимости установлены", "green");
  } else {
    log(`  ❌ Отсутствуют зависимости: ${missingDeps.join(", ")}`, "red");
    return false;
  }

  return true;
}

function checkNextConfig() {
  log("\n⚙️  Проверка конфигурации Next.js...", "cyan");

  const configFiles = ["next.config.ts", "next.config.js", "next.config.mjs"];
  const foundConfig = configFiles.find((file) => checkFileExists(file));

  if (foundConfig) {
    log(`  ✅ Найден ${foundConfig}`, "green");
    return true;
  } else {
    log("  ❌ Конфигурационный файл Next.js не найден", "red");
    return false;
  }
}

function checkVercelConfig() {
  log("\n🔷 Проверка конфигурации Vercel...", "cyan");

  if (checkFileExists("vercel.json")) {
    log("  ✅ vercel.json найден", "green");

    const config = readJsonFile("vercel.json");
    if (config) {
      if (config.buildCommand) {
        log(`  ✅ Build command: ${config.buildCommand}`, "green");
      }
      if (config.framework) {
        log(`  ✅ Framework: ${config.framework}`, "green");
      }
    }
    return true;
  } else {
    log(
      "  ⚠️  vercel.json не найден (будут использованы настройки по умолчанию)",
      "yellow"
    );
    return true;
  }
}

function checkGitIgnore() {
  log("\n📝 Проверка .gitignore...", "cyan");

  if (checkFileExists(".gitignore")) {
    log("  ✅ .gitignore найден", "green");

    const gitignore = fs.readFileSync(
      path.join(process.cwd(), ".gitignore"),
      "utf8"
    );
    const criticalEntries = [".env.local", ".env*.local", "node_modules"];
    const missingEntries = criticalEntries.filter(
      (entry) => !gitignore.includes(entry)
    );

    if (missingEntries.length === 0) {
      log("  ✅ Все критические записи присутствуют", "green");
    } else {
      log(
        `  ⚠️  Рекомендуется добавить: ${missingEntries.join(", ")}`,
        "yellow"
      );
    }
    return true;
  } else {
    log("  ❌ .gitignore не найден", "red");
    return false;
  }
}

function checkPrismaSetup() {
  log("\n🗄️  Проверка настройки Prisma...", "cyan");

  if (checkFileExists("prisma/schema.prisma")) {
    log("  ✅ prisma/schema.prisma найден", "green");
    return true;
  } else {
    log("  ⚠️  prisma/schema.prisma не найден (если используете БД)", "yellow");
    return true;
  }
}

function checkPublicFolder() {
  log("\n🌐 Проверка публичных файлов...", "cyan");

  if (checkFileExists("public")) {
    log("  ✅ Папка public найдена", "green");

    const importantFiles = ["favicon.ico", "robots.txt"];
    importantFiles.forEach((file) => {
      if (checkFileExists(`public/${file}`)) {
        log(`  ✅ public/${file} найден`, "green");
      } else {
        log(
          `  ⚠️  public/${file} не найден (рекомендуется добавить)`,
          "yellow"
        );
      }
    });
    return true;
  } else {
    log("  ❌ Папка public не найдена", "red");
    return false;
  }
}

function checkSrcStructure() {
  log("\n📁 Проверка структуры src...", "cyan");

  if (checkFileExists("src")) {
    log("  ✅ Папка src найдена", "green");

    const importantDirs = ["app", "components", "lib"];
    importantDirs.forEach((dir) => {
      if (checkFileExists(`src/${dir}`)) {
        log(`  ✅ src/${dir} найдена`, "green");
      } else {
        log(`  ⚠️  src/${dir} не найдена`, "yellow");
      }
    });
    return true;
  } else {
    log(
      "  ⚠️  Папка src не найдена (возможно используется структура без src)",
      "yellow"
    );
    return true;
  }
}

function checkDocumentation() {
  log("\n📚 Проверка документации...", "cyan");

  const docs = ["README.md", "DEPLOYMENT_STEP_BY_STEP_COMPLETE.md"];
  let allPresent = true;

  docs.forEach((doc) => {
    if (checkFileExists(doc)) {
      log(`  ✅ ${doc} найден`, "green");
    } else {
      log(`  ⚠️  ${doc} не найден`, "yellow");
      allPresent = false;
    }
  });

  return allPresent;
}

function generateReport(results) {
  log("\n" + "=".repeat(60), "blue");
  log("📊 ИТОГОВЫЙ ОТЧЕТ", "blue");
  log("=".repeat(60), "blue");

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  log(`\nПройдено проверок: ${passed}/${total} (${percentage}%)`, "cyan");

  if (percentage === 100) {
    log("\n✅ Проект ПОЛНОСТЬЮ ГОТОВ к развертыванию!", "green");
    log("\nСледующие шаги:", "cyan");
    log("  1. Зарегистрируйтесь на Vercel (https://vercel.com)", "blue");
    log(
      "  2. Получите необходимые API ключи (Pinata, Upstash, Telegram)",
      "blue"
    );
    log(
      "  3. Следуйте инструкциям в DEPLOYMENT_STEP_BY_STEP_COMPLETE.md",
      "blue"
    );
  } else if (percentage >= 80) {
    log("\n⚠️  Проект ПОЧТИ ГОТОВ к развертыванию", "yellow");
    log(
      "\nИсправьте предупреждения выше для оптимального результата",
      "yellow"
    );
  } else {
    log("\n❌ Проект НЕ ГОТОВ к развертыванию", "red");
    log("\nИсправьте критические ошибки выше перед развертыванием", "red");
  }

  log("\n" + "=".repeat(60) + "\n", "blue");
}

function main() {
  log("\n🚀 ПРОВЕРКА ГОТОВНОСТИ К РАЗВЕРТЫВАНИЮ NORMALDANCE", "cyan");
  log("=".repeat(60) + "\n", "cyan");

  const results = [
    { name: "Переменные окружения", passed: checkEnvVariables() },
    { name: "package.json", passed: checkPackageJson() },
    { name: "Next.js конфигурация", passed: checkNextConfig() },
    { name: "Vercel конфигурация", passed: checkVercelConfig() },
    { name: ".gitignore", passed: checkGitIgnore() },
    { name: "Prisma настройка", passed: checkPrismaSetup() },
    { name: "Публичные файлы", passed: checkPublicFolder() },
    { name: "Структура src", passed: checkSrcStructure() },
    { name: "Документация", passed: checkDocumentation() },
  ];

  generateReport(results);

  // Возвращаем код выхода
  const allPassed = results.every((r) => r.passed);
  process.exit(allPassed ? 0 : 1);
}

// Запуск скрипта
main();
