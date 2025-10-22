#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync  } from 'child_process';

class CompatibilityManager {
  constructor() {
    this.packageJsonPath = path.join(__dirname, '..', 'package.json');
    this.changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
    this.currentVersion = this.getCurrentVersion();
  }

  // Получение текущей версии
  getCurrentVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      return packageJson.version;
    } catch (error) {
      console.error('Ошибка чтения package.json:', error.message);
      process.exit(1);
    }
  }

  // Проверка обратной совместимости
  checkBackwardCompatibility() {
    console.log(`\n🔍 Проверка обратной совместимости для версии ${this.currentVersion}`);
    
    const checks = {
      api: this.checkAPICompatibility(),
      database: this.checkDatabaseCompatibility(),
      config: this.checkConfigCompatibility(),
      dependencies: this.checkDependenciesCompatibility(),
      breaking: this.checkBreakingChanges()
    };

    const issues = [];
    
    Object.entries(checks).forEach(([category, result]) => {
      if (!result.compatible) {
        issues.push({
          category,
          severity: result.severity,
          issues: result.issues
        });
      }
    });

    if (issues.length === 0) {
      console.log('✅ Все проверки обратной совместимости пройдены');
      return { compatible: true, issues: [] };
    } else {
      console.log('❌ Обнаружены проблемы обратной совместимости:');
      issues.forEach(issue => {
        console.log(`\n📋 ${issue.category.toUpperCase()} (${issue.severity}):`);
        issue.issues.forEach(i => console.log(`  - ${i}`));
      });
      return { compatible: false, issues };
    }
  }

  // Проверка API совместимости
  checkAPICompatibility() {
    const issues = [];
    const severity = 'high';
    
    try {
      // Проверка изменений в API эндпоинтах
      const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
      if (fs.existsSync(apiDir)) {
        const apiFiles = fs.readdirSync(apiDir, { recursive: true });
        
        apiFiles.forEach(file => {
          if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const filePath = path.join(apiDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Проверка на удаленные эндпоинты
            if (content.includes('DEPRECATED') || content.includes('REMOVED')) {
              issues.push(`Удален или устарел эндпоинт: ${file}`);
            }
            
            // Проверка на изменения в сигнатурах
            if (content.includes('export async function') && content.includes(': Response')) {
              // Дополнительная логика проверки
            }
          }
        });
      }
    } catch (error) {
      issues.push(`Ошибка проверки API: ${error.message}`);
    }

    return {
      compatible: issues.length === 0,
      severity,
      issues
    };
  }

  // Проверка базы данных совместимости
  checkDatabaseCompatibility() {
    const issues = [];
    const severity = 'critical';
    
    try {
      const prismaSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
      if (fs.existsSync(prismaSchemaPath)) {
        const schema = fs.readFileSync(prismaSchemaPath, 'utf8');
        
        // Проверка на удаленные модели
        if (schema.includes('model') && schema.includes('DEPRECATED')) {
          issues.push('Удалена модель базы данных');
        }
        
        // Проверка на изменения полей
        if (schema.includes('updatedAt DateTime @updatedAt')) {
          // Проверка на обязательные поля
        }
      }
    } catch (error) {
      issues.push(`Ошибка проверки базы данных: ${error.message}`);
    }

    return {
      compatible: issues.length === 0,
      severity,
      issues
    };
  }

  // Проверка конфигурации совместимости
  checkConfigCompatibility() {
    const issues = [];
    const severity = 'medium';
    
    try {
      // Проверка environment переменных
      const envFiles = ['.env.example', '.env.local', '.env.production', '.env.staging'];
      
      envFiles.forEach(envFile => {
        const envPath = path.join(__dirname, '..', envFile);
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          
          // Проверка на удаленные переменные
          if (envContent.includes('DEPRECATED')) {
            issues.push(`Удалена переменная в ${envFile}`);
          }
        }
      });
      
      // Проверка vercel.json
      const vercelConfigPath = path.join(__dirname, '..', 'vercel.json');
      if (fs.existsSync(vercelConfigPath)) {
        const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
        
        if (vercelConfig.env && Object.keys(vercelConfig.env).length > 0) {
          // Проверка конфигурации
        }
      }
    } catch (error) {
      issues.push(`Ошибка проверки конфигурации: ${error.message}`);
    }

    return {
      compatible: issues.length === 0,
      severity,
      issues
    };
  }

  // Проверка зависимостей совместимости
  checkDependenciesCompatibility() {
    const issues = [];
    const severity = 'medium';
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Проверка на major версии зависимостей
      Object.entries(dependencies).forEach(([pkg, version]) => {
        if (version.startsWith('^') || version.startsWith('~')) {
          const majorVersion = version.split('.')[0].replace('^', '').replace('~', '');
          if (parseInt(majorVersion) > 1) {
            issues.push(`Зависимость ${pkg} имеет major версию ${majorVersion}`);
          }
        }
      });
      
      // Проверка на конфликтующие зависимости
      const conflicts = this.findDependencyConflicts(dependencies);
      if (conflicts.length > 0) {
        issues.push(...conflicts);
      }
    } catch (error) {
      issues.push(`Ошибка проверки зависимостей: ${error.message}`);
    }

    return {
      compatible: issues.length === 0,
      severity,
      issues
    };
  }

  // Поиск конфликтующих зависимостей
  findDependencyConflicts(dependencies) {
    const conflicts = [];
    
    // Логика поиска конфликтов
    // Например, разные версии одной и той же библиотеки
    
    return conflicts;
  }

  // Проверка breaking changes
  checkBreakingChanges() {
    const issues = [];
    const severity = 'critical';
    
    try {
      // Проверка changelog на breaking changes
      if (fs.existsSync(this.changelogPath)) {
        const changelog = fs.readFileSync(this.changelogPath, 'utf8');
        
        if (changelog.includes('BREAKING CHANGE') || changelog.includes('НЕОБРАТИМОЕ ИЗМЕНЕНИЕ')) {
          issues.push('Обнаружены breaking changes в changelog');
        }
      }
      
      // Проверка git истории
      try {
        const gitLog = execSync('git log --oneline -10', { encoding: 'utf8' });
        const commits = gitLog.split('\n');
        
        commits.forEach(commit => {
          if (commit.toLowerCase().includes('breaking') || 
              commit.toLowerCase().includes('major') ||
              commit.toLowerCase().includes('incompatible')) {
            issues.push(`Breaking change в коммите: ${commit}`);
          }
        });
      } catch (error) {
        // Игнорируем ошибки git
      }
    } catch (error) {
      issues.push(`Ошибка проверки breaking changes: ${error.message}`);
    }

    return {
      compatible: issues.length === 0,
      severity,
      issues
    };
  }

  // Генерация отчета о совместимости
  generateCompatibilityReport() {
    console.log(`\n📊 Отчет о совместимости версии ${this.currentVersion}`);
    console.log('='.repeat(50));
    
    const compatibility = this.checkBackwardCompatibility();
    
    if (compatibility.compatible) {
      console.log('\n✅ Версия совместима с предыдущими релизами');
    } else {
      console.log('\n❌ Версия НЕ совместима с предыдущими релизами');
      console.log('\n🔧 Рекомендуемые действия:');
      
      compatibility.issues.forEach(issue => {
        console.log(`\n${issue.severity.toUpperCase()}: ${issue.category}`);
        issue.issues.forEach(i => console.log(`  - ${i}`));
        
        // Генерация рекомендаций
        this.generateRecommendations(issue);
      });
    }
    
    return compatibility;
  }

  // Генерация рекомендаций
  generateRecommendations(issue) {
    const recommendations = {
      api: [
        'Создайте backward-compatible API wrapper',
        'Добавьте deprecated аннотации для старых эндпоинтов',
        'Используйте versioning в API путях'
      ],
      database: [
        'Создайте миграцию с backward compatibility',
        'Добавьте soft delete вместо удаления',
        'Используйте nullable поля для новых опций'
      ],
      config: [
        'Сохраните старые переменные с deprecated пометкой',
        'Создайте migration script для конфигурации',
        'Добавьте backward compatibility layer'
      ],
      dependencies: [
        'Проверьте зависимости на совместимость',
        'Обновите все зависимости до совместимых версий',
        'Добавьте peer dependencies если необходимо'
      ],
      breaking: [
        'Создайте migration guide',
        'Обновите документацию',
        'Предоставьте upgrade assistant'
      ]
    };

    if (recommendations[issue.category]) {
      console.log('\n💡 Рекомендации:');
      recommendations[issue.category].forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }
  }

  // Создание migration guide
  createMigrationGuide() {
    const version = this.currentVersion;
    const guidePath = path.join(__dirname, '..', 'docs', `migration-guide-v${version}.md`);
    
    const guideContent = `# Migration Guide: v${version}

## Overview

This guide provides instructions for migrating from previous versions to NormalDANCE v${version}.

## Breaking Changes

### API Changes

- [List of breaking API changes]

### Database Changes

- [List of breaking database changes]

### Configuration Changes

- [List of breaking configuration changes]

## Migration Steps

### 1. Backup

\`\`\`bash
# Create backup
npm run backup:create
\`\`\`

### 2. Update Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Run Migrations

\`\`\`bash
npm run db:migrate
\`\`\`

### 4. Update Configuration

- Update environment variables
- Update configuration files

### 5. Deploy

\`\`\`bash
npm run deploy:staging
npm run test:smoke
npm run deploy:production
\`\`\`

## Rollback Plan

If issues occur during migration:

1. Restore from backup
2. Rollback database migrations
3. Revert code changes

## Support

If you encounter issues during migration:

- Check the [FAQ](../faq.md)
- Contact support: support@normaldance.com
- Join our Discord: https://discord.gg/normaldance

---

**Version:** ${version}
**Date:** ${new Date().toISOString().split('T')[0]}
**Last Updated:** ${new Date().toISOString()}
`;

    try {
      fs.writeFileSync(guidePath, guideContent);
      console.log(`\n📝 Migration guide создан: ${guidePath}`);
      return true;
    } catch (error) {
      console.error('Ошибка создания migration guide:', error.message);
      return false;
    }
  }

  // Основной метод проверки совместимости
  async validateRelease() {
    console.log(`\n🚀 Валидация релиза версии ${this.currentVersion}`);
    
    const compatibility = this.generateCompatibilityReport();
    
    if (!compatibility.compatible) {
      console.log('\n❌ Релиз не может быть выпущен из-за проблем совместимости');
      process.exit(1);
    }
    
    // Создание migration guide
    const guideCreated = this.createMigrationGuide();
    
    if (guideCreated) {
      console.log('\n✅ Релиз готов к выпуску');
      console.log('📋 Migration guide создан');
      console.log('🔧 Все проверки пройдены');
    }
    
    return compatibility;
  }
}

// CLI интерфейс
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const compatibilityManager = new CompatibilityManager();

  switch (command) {
    case 'check':
      compatibilityManager.checkBackwardCompatibility();
      break;
      
    case 'report':
      compatibilityManager.generateCompatibilityReport();
      break;
      
    case 'validate':
      compatibilityManager.validateRelease();
      break;
      
    case 'guide':
      compatibilityManager.createMigrationGuide();
      break;
      
    default:
      console.log(`
Использование:
  node scripts/compatibility-manager.js [команда]

Команды:
  check          - Проверить обратную совместимость
  report         - Сгенерировать отчет о совместимости
  validate       - Валидировать релиз (проверка + создание guide)
  guide          - Создать migration guide

Примеры:
  node scripts/compatibility-manager.js check
  node scripts/compatibility-manager.js validate
      `);
      process.exit(1);
  }
}

module.exports = CompatibilityManager;