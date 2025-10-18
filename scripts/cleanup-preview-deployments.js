#!/usr/bin/env node

/**
 * Скрипт для автоматического удаления старых preview деплоев
 * 
 * Функции:
 * - Анализирует age, статус PR и другие метаданные
 * - Определяет, какие деплои нужно удалить
 * - Учитывает исключения для важных деплоев
 * - Генерирует отчет о результатах
 * - Поддерживает dry run режим
 */

import fs from 'fs';
import path from 'path';

class CleanupPreviewDeployments {
  constructor(options = {}) {
    this.deployments = options.deployments || [];
    this.dryRun = options.dryRun || false;
    this.maxAgeDays = options.maxAgeDays || 7;
    this.cleanupThreshold = options.cleanupThreshold || 7;
    this.forceCleanup = options.forceCleanup || false;
    this.outputJson = options.outputJson || false;
    this.protectedPatterns = options.protectedPatterns || [
      'important',
      'critical',
      'production',
      'staging',
      'main',
      'develop',
      'release'
    ];
    this.notificationDays = options.notificationDays || 3;
    
    // Результаты
    this.results = {
      deployments_to_delete: [],
      deployments_to_keep: [],
      protected_deployments: [],
      notifications_needed: [],
      summary: {
        total: 0,
        to_delete: 0,
        to_keep: 0,
        protected: 0,
        notifications: 0
      }
    };
  }

  /**
   * Основной метод запуска очистки
   */
  async cleanup() {
    console.log('🧹 Starting preview deployments cleanup...');
    console.log(`📋 Configuration:`);
    console.log(`  - Dry Run: ${this.dryRun}`);
    console.log(`  - Max Age Days: ${this.maxAgeDays}`);
    console.log(`  - Cleanup Threshold: ${this.cleanupThreshold}`);
    console.log(`  - Force Cleanup: ${this.forceCleanup}`);
    console.log(`  - Total Deployments: ${this.deployments.length}`);

    // Парсим JSON если передана строка
    if (typeof this.deployments === 'string') {
      try {
        this.deployments = JSON.parse(this.deployments);
      } catch (error) {
        console.error('❌ Failed to parse deployments JSON:', error.message);
        return this.results;
      }
    }

    // Анализируем каждый деплой
    this.deployments.forEach(deployment => {
      this.analyzeDeployment(deployment);
    });

    // Применяем стратегию очистки
    this.applyCleanupStrategy();

    // Генерируем уведомления
    this.generateNotifications();

    // Выводим результаты
    this.printResults();

    // Сохраняем результаты в файл если нужно
    if (this.outputJson) {
      this.saveResults();
    }

    return this.results;
  }

  /**
   * Анализирует отдельный деплой
   */
  analyzeDeployment(deployment) {
    this.results.summary.total++;

    const analysis = {
      ...deployment,
      age_days: this.calculateAgeInDays(deployment.createdAt),
      is_protected: this.isProtectedDeployment(deployment),
      should_delete: false,
      reason: '',
      pr_status: this.getPRStatus(deployment),
      is_active: this.isActiveDeployment(deployment)
    };

    // Определяем, нужно ли удалять деплой
    if (this.shouldDeleteDeployment(analysis)) {
      analysis.should_delete = true;
      analysis.reason = this.getDeletionReason(analysis);
      this.results.deployments_to_delete.push(analysis);
      this.results.summary.to_delete++;
    } else {
      this.results.deployments_to_keep.push(analysis);
      this.results.summary.to_keep++;
    }

    // Проверяем, является ли деплой защищенным
    if (analysis.is_protected) {
      this.results.protected_deployments.push(analysis);
      this.results.summary.protected++;
    }
  }

  /**
   * Определяет, нужно ли удалять деплой
   */
  shouldDeleteDeployment(analysis) {
    // Если включен force cleanup, удаляем все кроме защищенных
    if (this.forceCleanup && !analysis.is_protected) {
      return true;
    }

    // Всегда сохраняем активные деплои
    if (analysis.is_active) {
      return false;
    }

    // Всегда сохраняем защищенные деплои
    if (analysis.is_protected) {
      return false;
    }

    // Проверяем возраст
    if (analysis.age_days > this.maxAgeDays) {
      return true;
    }

    // Проверяем порог очистки
    if (analysis.age_days > this.cleanupThreshold) {
      return true;
    }

    // Проверяем статус PR
    if (analysis.pr_status === 'merged' || analysis.pr_status === 'closed') {
      return true;
    }

    return false;
  }

  /**
   * Определяет причину удаления
   */
  getDeletionReason(analysis) {
    if (analysis.is_protected) {
      return 'protected';
    }

    if (analysis.age_days > this.maxAgeDays) {
      return `too_old_${analysis.age_days}_days`;
    }

    if (analysis.age_days > this.cleanupThreshold) {
      return `above_threshold_${analysis.age_days}_days`;
    }

    if (analysis.pr_status === 'merged') {
      return 'pr_merged';
    }

    if (analysis.pr_status === 'closed') {
      return 'pr_closed';
    }

    if (analysis.is_active) {
      return 'active';
    }

    return 'unknown';
  }

  /**
   * Применяет стратегию очистки
   */
  applyCleanupStrategy() {
    // Если включен dry run, ничего не удаляем
    if (this.dryRun) {
      this.results.deployments_to_delete = [];
      this.results.summary.to_delete = 0;
      return;
    }

    // Применяем дополнительные правила очистки
    this.applyAdditionalRules();
  }

  /**
   * Применяет дополнительные правила очистки
   */
  applyAdditionalRules() {
    // Правило 1: Оставляем самые свежие деплои для каждого PR
    const prDeployments = {};
    this.results.deployments_to_delete.forEach(deployment => {
      const prNumber = deployment.payload?.pr_number || deployment.name?.match(/pr-(\d+)/)?.[1];
      if (prNumber) {
        if (!prDeployments[prNumber] || 
            new Date(deployment.createdAt) > new Date(prDeployments[prNumber].createdAt)) {
          prDeployments[prNumber] = deployment;
        }
      }
    });

    // Удаляем старые деплои для тех же PR, оставляя только самые свежие
    Object.keys(prDeployments).forEach(prNumber => {
      const latestDeployment = prDeployments[prNumber];
      this.results.deployments_to_delete = this.results.deployments_to_delete.filter(deployment => {
        const deploymentPrNumber = deployment.payload?.pr_number || deployment.name?.match(/pr-(\d+)/)?.[1];
        return deploymentPrNumber !== prNumber || deployment.id === latestDeployment.id;
      });
    });

    // Правило 2: Ограничиваем количество деплоев
    this.limitDeployments();
  }

  /**
   * Ограничивает количество деплоев
   */
  limitDeployments() {
    const maxDeployments = 20;
    
    if (this.results.deployments_to_delete.length > maxDeployments) {
      // Сортируем по возрасту (самые старые удаляем первыми)
      this.results.deployments_to_delete.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      // Удаляем самые старые
      const toRemove = this.results.deployments_to_delete.splice(maxDeployments);
      toRemove.forEach(deployment => {
        this.results.deployments_to_keep.push(deployment);
        this.results.summary.to_keep++;
        this.results.summary.to_delete--;
      });
    }
  }

  /**
   * Генерирует уведомления
   */
  generateNotifications() {
    this.results.deployments_to_delete.forEach(deployment => {
      if (deployment.age_days <= this.notificationDays) {
        this.results.notifications_needed.push(deployment);
        this.results.summary.notifications++;
      }
    });
  }

  /**
   * Проверяет, является ли деплой защищенным
   */
  isProtectedDeployment(deployment) {
    const name = deployment.name?.toLowerCase() || '';
    const url = deployment.url?.toLowerCase() || '';
    
    // Проверяем по имени
    for (const pattern of this.protectedPatterns) {
      if (name.includes(pattern) || url.includes(pattern)) {
        return true;
      }
    }
    
    // Проверяем по тегам
    if (deployment.tags) {
      for (const tag of deployment.tags) {
        if (this.protectedPatterns.includes(tag.toLowerCase())) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Проверяет, является ли деплой активным
   */
  isActiveDeployment(deployment) {
    // Проверяем, есть ли активные пользователи
    if (deployment.usage?.users > 0) {
      return true;
    }
    
    // Проверяем, есть ли недавние запросы
    if (deployment.usage?.requests > 100) {
      return true;
    }
    
    return false;
  }

  /**
   * Получает статус PR
   */
  getPRStatus(deployment) {
    if (deployment.payload?.pr_state) {
      return deployment.payload.pr_state;
    }
    
    if (deployment.name?.includes('merged')) {
      return 'merged';
    }
    
    if (deployment.name?.includes('closed')) {
      return 'closed';
    }
    
    return 'open';
  }

  /**
   * Рассчитывает возраст деплоя в днях
   */
  calculateAgeInDays(createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Выводит результаты
   */
  printResults() {
    console.log('\n📊 Cleanup Results:');
    console.log(`  Total Deployments: ${this.results.summary.total}`);
    console.log(`  To Delete: ${this.results.summary.to_delete}`);
    console.log(`  To Keep: ${this.results.summary.to_keep}`);
    console.log(`  Protected: ${this.results.summary.protected}`);
    console.log(`  Notifications Needed: ${this.results.summary.notifications}`);

    if (this.results.deployments_to_delete.length > 0) {
      console.log('\n🗑️  Deployments to Delete:');
      this.results.deployments_to_delete.forEach(deployment => {
        console.log(`  - ${deployment.name} (${deployment.age_days} days old) - ${deployment.reason}`);
      });
    }

    if (this.results.protected_deployments.length > 0) {
      console.log('\n🛡️  Protected Deployments:');
      this.results.protected_deployments.forEach(deployment => {
        console.log(`  - ${deployment.name} (${deployment.age_days} days old)`);
      });
    }

    if (this.results.notifications_needed.length > 0) {
      console.log('\n📢 Notifications Needed:');
      this.results.notifications_needed.forEach(deployment => {
        console.log(`  - ${deployment.name} (${deployment.age_days} days old)`);
      });
    }
  }

  /**
   * Сохраняет результаты в файл
   */
  saveResults() {
    const resultsPath = path.join(__dirname, '../tmp/cleanup-results.json');
    
    // Создаем директорию если не существует
    const tmpDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);
  }
}

// CLI интерфейс
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Парсинг аргументов
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('--')) {
        options[key] = nextArg;
        i++;
      } else {
        options[key] = true;
      }
    }
  }
  
  // Запуск очистки
  const cleaner = new CleanupPreviewDeployments(options);
  cleaner.cleanup().catch(console.error);
}

module.exports = CleanupPreviewDeployments;