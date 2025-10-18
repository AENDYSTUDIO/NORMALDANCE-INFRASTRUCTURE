#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Исправление ошибок линтера...');

// Функция для исправления require() на import
function fixRequireImports(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Замена require() на import для CommonJS модулей
  const requireRegex = /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g;
  content = content.replace(requireRegex, (match, varName, moduleName) => {
    modified = true;
    return `import ${varName} from '${moduleName}';`;
  });

  // Замена деструктуризации require
  const destructureRegex = /const\s*\{\s*([^}]+)\s*\}\s*=\s*require\(['"]([^'"]+)['"]\)/g;
  content = content.replace(destructureRegex, (match, destructured, moduleName) => {
    modified = true;
    return `import { ${destructured} } from '${moduleName}';`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Исправлен: ${filePath}`);
  }
}

// Функция для исправления типов {} на object
function fixEmptyObjectTypes(filePath) {
  if (!fs.existsSync(filePath) || !filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Замена {} на Record<string, unknown>
  const emptyObjectRegex = /:\s*\{\}/g;
  content = content.replace(emptyObjectRegex, ': Record<string, unknown>');
  
  // Замена Function на (...args: unknown[]) => unknown
  const functionTypeRegex = /:\s*Function/g;
  content = content.replace(functionTypeRegex, ': (...args: unknown[]) => unknown');

  if (content !== fs.readFileSync(filePath, 'utf8')) {
    modified = true;
    fs.writeFileSync(filePath, content);
    console.log(`✅ Исправлены типы: ${filePath}`);
  }
}

// Функция для исправления hasOwnProperty
function fixHasOwnProperty(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Замена obj.hasOwnProperty на Object.prototype.hasOwnProperty.call(obj, prop)
  const hasOwnPropRegex = /(\w+)\.hasOwnProperty\(([^)]+)\)/g;
  content = content.replace(hasOwnPropRegex, (match, obj, prop) => {
    modified = true;
    return `Object.prototype.hasOwnProperty.call(${obj}, ${prop})`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Исправлен hasOwnProperty: ${filePath}`);
  }
}

// Рекурсивный обход директорий
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Пропускаем определенные директории
      if (['node_modules', '.next', '.git', 'coverage'].includes(file)) {
        continue;
      }
      walkDir(filePath, callback);
    } else if (stat.isFile()) {
      callback(filePath);
    }
  }
}

// Основная функция
function main() {
  const projectRoot = path.resolve(__dirname, '..');
  
  console.log(`📁 Сканирование проекта: ${projectRoot}`);
  
  let fileCount = 0;
  
  walkDir(projectRoot, (filePath) => {
    const ext = path.extname(filePath);
    
    // Обрабатываем только нужные файлы
    if (['.js', '.ts', '.tsx', '.jsx'].includes(ext)) {
      fileCount++;
      
      // Исправляем require imports только в .js файлах
      if (ext === '.js') {
        fixRequireImports(filePath);
        fixHasOwnProperty(filePath);
      }
      
      // Исправляем типы в TypeScript файлах
      if (['.ts', '.tsx'].includes(ext)) {
        fixEmptyObjectTypes(filePath);
      }
    }
  });
  
  console.log(`\n🎉 Обработано файлов: ${fileCount}`);
  console.log('✨ Исправление завершено!');
  console.log('\n📋 Рекомендации:');
  console.log('1. Запустите: npm run lint');
  console.log('2. Проверьте: npm run type-check');
  console.log('3. Запустите тесты: npm test');
}

main();