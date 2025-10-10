#!/usr/bin/env node

/**
 * Скрипт для анализа размера бандла
 * Помогает оптимизировать производительность и уменьшить размер бандла
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Функция для запуска анализа бандла
function analyzeBundle() {
  console.log("🚀 Начинаем анализ размера бандла...");

  try {
    // Устанавливаем переменную окружения для включения анализатора
    process.env.ANALYZE = "true";

    // Запускаем сборку с анализом
    console.log("🔨 Запускаем сборку с анализом бандла...");
    execSync("npm run build", { stdio: "inherit" });

    console.log("✅ Анализ бандла завершен успешно!");
    console.log("📊 Результаты анализа доступны в директории .next/analyze/");

    // Проверяем наличие файлов отчета
    const analyzeDir = path.join(process.cwd(), ".next", "analyze");
    if (fs.existsSync(analyzeDir)) {
      const files = fs.readdirSync(analyzeDir);
      console.log("\nФайлы отчета:");
      files.forEach((file) => {
        console.log(`  - ${file}`);
      });
    }
  } catch (error) {
    console.error("❌ Ошибка при анализе бандла:", error.message);
    process.exit(1);
  }
}

// Функция для оптимизации импортов
function optimizeImports() {
  console.log("🔧 Оптимизация импортов...");

  // Список тяжелых библиотек, которые можно оптимизировать
  const heavyLibraries = [
    "@solana/web3.js",
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-wallets",
    "lucide-react",
    "@radix-ui/react-icons",
  ];

  console.log("Тяжелые библиотеки для оптимизации:");
  heavyLibraries.forEach((lib) => {
    console.log(`  - ${lib}`);
  });

  console.log("\n💡 Рекомендации по оптимизации:");
  console.log("1. Используйте динамический импорт для тяжелых компонентов");
  console.log(
    "2. Применяйте tree shaking для библиотек с множеством экспортов"
  );
  console.log("3. Разделяйте код на чанки для ленивой загрузки");
  console.log(
    "4. Минимизируйте использование тяжелых библиотек в критическом пути"
  );
}

// Функция для проверки дублирования зависимостей
function checkDuplicateDependencies() {
  console.log("🔍 Проверка дублирования зависимостей...");

  try {
    const result = execSync("npm ls --depth=0", { encoding: "utf8" });
    console.log("Дерево зависимостей:");
    console.log(result);
  } catch (error) {
    console.log("Не удалось получить дерево зависимостей");
  }
}

// Основная функция
function main() {
  console.log("=== Анализ и оптимизация размера бандла ===\n");

  // Проверяем дублирование зависимостей
  checkDuplicateDependencies();

  // Оптимизируем импорты
  optimizeImports();

  // Анализируем бандл
  analyzeBundle();

  console.log("\n=== Завершено ===");
}

// Запускаем скрипт
if (require.main === module) {
  main();
}
