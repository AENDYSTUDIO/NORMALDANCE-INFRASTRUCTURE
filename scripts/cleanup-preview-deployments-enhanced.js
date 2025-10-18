#!/usr/bin/env node

/**
 * Улучшенная версия скрипта для автоматического удаления старых preview деплоев
 * 
 * Новые функции:
 * - Загрузка конфигурации из JSON файла
 * - Поддержка переменных окружения
 * - Расширенная логика определения важных деплоев
 * - Умные уведомления
 * - Подробное логирование
 */

import fs from 'fs';
import path from 'path';

class EnhancedCleanupPreviewDeployments {
  constructor(options = {}) {
    this.config = this.loadConfig();
    this.deployments = options.deployments || [];
    this.dryRun = options.dryRun || this.config.cleanup.dryRun;
    this.maxAgeDays = options.maxAgeDays || this.config.cleanup.defaultMaxAgeDays;
    this.cleanupThreshold = options.cleanupThreshold || this.config.cleanup.cleanupThreshold;
    this.forceCleanup = options.forceCleanup || this.config.cleanup.forceCleanup;
    this.outputJson = options.outputJson || true;
    this.protectedPatterns = this.config.protectedPatterns;
    this.notificationDays = options.notificationDays || this.config.cleanup.notificationDays;
    
    // Инициализация логирования
    this.logger = this.initLogger();
    
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
      },
      metadata: {
        timestamp: new Date().toISOString(),
        config: this.config,
        dry_run: this.dryRun,
        max_age_days: this.maxAgeDays,
        cleanup_threshold: this.cleanupThreshold
      }
    };
  }

  /**
   * Загружает конфигурацию из файла
   */
  loadConfig() {
    const configPath = path.join(__dirname, 'cleanup-config.json');
    
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Подстановка переменных окружения
        return this.substituteEnvVars(config);
      } else {
        console.warn('⚠️  Config file not found, using defaults');
        return this.getDefaultConfig();
      }
    } catch (error) {
      console.error('❌ Failed to load config:', error.message);
      return this.getDefaultConfig();
    }
  }

  /**
   * Подставляет переменные окружения в конфигурацию
   */
  substituteEnvVars(config) {
    const stringifier = (obj) => {
      if (typeof obj === 'string') {
        return obj.replace(/\${(\w+)}/g, (match, varName) => {
          return process.env[varName] || match;
        });
      }
      
      if (Array.isArray(obj)) {
        return obj.map(stringifier);
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = stringifier(value);
        }
        return result;
      }
      
      return obj;
    };
    
    return stringifier(config);
  }

  /**
   * Возвращает конфигурацию по умолчанию
   */
  getDefaultConfig() {
    return {
      cleanup: {
        defaultMaxAgeDays: 7,
        cleanupThreshold: 7,
        notificationDays: 3,
        maxDeployments: 20,
        forceCleanup: false,
        dryRun: false
      },
      protectedPatterns: [
        "important",
        "critical",
        "production",
        "staging",
        "main",
        "develop",
        "release",
        "hotfix",
        "emergency",
        "security",
        "performance"
      ],
      exclusions: {
        activeUsersThreshold: 0,
        requestsThreshold: 100,
        recentActivityDays: 1
      },
      notifications: {
        enabled: true,
        channels: ["slack", "github"],
        slack: {
          webhook: process.env.SLACK_WEBHOOK,
          channel: "#deployments",
          username: "Cleanup Bot"
        },
        github: {
          repository: process.env.GITHUB_REPOSITORY,
          token: process.env.GITHUB_TOKEN
        }
      },
      vercel: {
        orgId: process.env.VERCEL_ORG_ID,
        projectId: process.env.VERCEL_PROJECT_ID,
        token: process.env.VERCEL_TOKEN
      },
      scheduling: {
        cron: "0 3 * * *",
        timezone: "UTC",
        enabled: true
      },
      logging: {
        level: "info",
        file: "/tmp/cleanup.log",
        console: true
      },
      reporting: {
        enabled: true,
        format: "json",
        path: "/tmp/cleanup-report.json",
        retentionDays: 30
      }
    };
  }

  /**
   * Инициализирует логирование
   */
  initLogger() {
    const logLevel = this.config.logging.level;
    const logToConsole = this.config.logging.console;
    
    return {
      info: (message) => {
        if (logToConsole) console.log(`ℹ️  ${message}`);
        if (this.config.logging.file) {
          this.ensureDirectoryExists(this.config.logging.file);
          fs.appendFileSync(this.config.logging.file, `[${new Date().toISOString()}] INFO: ${message}\n`);
        }
      },
      warn: (message) => {
        if (logToConsole) console.warn(`⚠️  ${message}`);
        if (this.config.logging.file) {
          this.ensureDirectoryExists(this.config.logging.file);
          fs.appendFileSync(this.config.logging.file, `[${new Date().toISOString()}] WARN: ${message}\n`);
        }
      },
      error: (message) => {
        if (logToConsole) console.error(`❌ ${message}`);
        if (this.config.logging.file) {
          this.ensureDirectoryExists(this.config.logging.file);
          fs.appendFileSync(this.config.logging.file, `[${new Date().toISOString()}] ERROR: ${message}\n`);
        }
      },
      debug: (message) => {
        if (logLevel === 'debug' && logToConsole) console.log(`🔍 ${message}`);
        if (logLevel === 'debug' && this.config.logging.file) {
          this.ensureDirectoryExists(this.config.logging.file);
          fs.appendFileSync(this.config.logging.file, `[${new Date().toISOString()}] DEBUG: ${message}\n`);
        }
      }
    };
  }

  /**
   * Убеждается, что директория существует
   */
  ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Основной метод запуска очистки
   */
  async cleanup() {
    this.logger.info('🧹 Starting enhanced preview deployments cleanup...');
    this.logger.info(`📋 Configuration loaded:`);
    this.logger.info(`  - Dry Run: ${this.dryRun}`);
    this.logger.info(`  - Max Age Days: ${this.maxAgeDays}`);
    this.logger.info(`  - Cleanup Threshold: ${this.cleanupThreshold}`);
    this.logger.info(`  - Force Cleanup: ${this.forceCleanup}`);
    this.logger.info(`  - Total Deployments: ${this.deployments.length}`);

    // Парсим JSON если передана строка
    if (typeof this.deployments === 'string') {
      try {
        this.deployments = JSON.parse(this.deployments);
      } catch (error) {
        this.logger.error(`Failed to parse deployments JSON: ${error.message}`);
        return this.results;
      }
    }

    // Анализируем каждый деплой
    this.deployments.forEach((deployment, index) => {
      this.logger.debug(`Analyzing deployment ${index + 1}/${this.deployments.length}: ${deployment.name}`);
      this.analyzeDeployment(deployment);
    });

    // Применяем стратегию очистки
    this.applyCleanupStrategy();

    // Генерируем уведомления
    this.generateNotifications();

    // Отправляем уведомления
    if (this.config.notifications.enabled) {
      await this.sendNotifications();
    }

    // Выводим результаты
    this.printResults();

    // Сохраняем отчет
    if (this.config.reporting.enabled) {
      this.saveReport();
    }

    return this.results;
  }

  /**
   * Анализирует отдельный деплой с расширенной логикой
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
      is_active: this.isActiveDeployment(deployment),
      importance_score: this.calculateImportanceScore(deployment),
      is_recently_accessed: this.isRecentlyAccessed(deployment),
      has_comments: this.hasRecentComments(deployment),
      belongs_to_important_pr: this.belongsToImportantPR(deployment)
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
   * Рассчитывает важность деплоя
   */
  calculateImportanceScore(deployment) {
    let score = 0;
    
    // Базовые очки
    score += deployment.age_days * -1; // Чем старше, тем менее важен
    
    // Очки за активность
    if (deployment.usage?.users > 0) score += 10;
    if (deployment.usage?.requests > 1000) score += 20;
    if (deployment.usage?.bandwidth > 1000) score += 15;
    
    // Очки за важность PR
    if (deployment.payload?.pr_labels?.includes('critical')) score += 30;
    if (deployment.payload?.pr_labels?.includes('important')) score += 20;
    if (deployment.payload?.pr_labels?.includes('bug')) score += 10;
    
    // Очки за недавнюю активность
    if (this.isRecentlyAccessed(deployment)) score += 25;
    if (this.hasRecentComments(deployment)) score += 15;
    
    return Math.max(0, score);
  }

  /**
   * Проверяет, был ли деплой недавно активен
   */
  isRecentlyAccessed(deployment) {
    if (!deployment.lastAccessed) return false;
    
    const lastAccessed = new Date(deployment.lastAccessed);
    const now = new Date();
    const diffHours = (now - lastAccessed) / (1000 * 60 * 60);
    
    return diffHours < this.config.exclusions.recentActivityDays * 24;
  }

  /**
   * Проверяет, есть ли недавние комментарии
   */
  hasRecentComments(deployment) {
    if (!deployment.payload?.pr_comments) return false;
    
    const comments = deployment.payload.pr_comments;
    const now = new Date();
    const recentComments = comments.filter(comment => {
      const commentDate = new Date(comment.createdAt);
      const diffHours = (now - commentDate) / (1000 * 60 * 60);
      return diffHours < 24; // Комментарии за последние 24 часа
    });
    
    return recentComments.length > 0;
  }

  /**
   * Проверяет, принадлежит ли PR к важным категориям
   */
  belongsToImportantPR(deployment) {
    if (!deployment.payload?.pr_labels) return false;
    
    const importantLabels = ['critical', 'important', 'security', 'performance', 'bug'];
    return deployment.payload.pr_labels.some(label => 
      importantLabels.includes(label.toLowerCase())
    );
  }

  /**
   * Определяет, нужно ли удалять деплой с расширенной логикой
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

    // Сохраняем деплои с высокой важностью
    if (analysis.importance_score > 50) {
      return false;
    }

    // Сохраняем деплои с недавней активностью
    if (analysis.is_recently_accessed) {
      return false;
    }

    // Сохраняем деплои с недавними комментариями
    if (analysis.has_comments) {
      return false;
    }

    // Сохраняем деплои важных PR
    if (analysis.belongs_to_important_pr) {
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
   * Определяет причину удаления с расширенной логикой
   */
  getDeletionReason(analysis) {
    if (analysis.is_protected) {
      return 'protected';
    }

    if (analysis.importance_score > 50) {
      return 'high_importance';
    }

    if (analysis.is_recently_accessed) {
      return 'recently_accessed';
    }

    if (analysis.has_comments) {
      return 'has_comments';
    }

    if (analysis.belongs_to_important_pr) {
      return 'important_pr';
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
   * Применяет стратегию очистки с расширенной логикой
   */
  applyCleanupStrategy() {
    // Если включен dry run, ничего не удаляем
    if (this.dryRun) {
      this.results.deployments_to_delete = [];
      this.results.summary.to_delete = 0;
      this.logger.info('🔍 Dry run mode - no actual deletions will be performed');
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
            new Date(deployment.createdAt) < new Date(prDeployments[prNumber].createdAt)) {
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

    // Правило 3: Удаляем деплои с низкой важностью
    this.removeLowImportanceDeployments();
  }

  /**
   * Удаляет деплои с низкой важностью
   */
  removeLowImportanceDeployments() {
    const lowImportanceThreshold = 10;
    
    this.results.deployments_to_delete = this.results.deployments_to_delete.filter(deployment => {
      if (deployment.importance_score < lowImportanceThreshold) {
        this.logger.debug(`Removing low importance deployment: ${deployment.name} (score: ${deployment.importance_score})`);
        return false;
      }
      return true;
    });
  }

  /**
   * Ограничивает количество деплоев
   */
  limitDeployments() {
    const maxDeployments = this.config.cleanup.maxDeployments;
    
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
      
      this.logger.info(`Limited deployments to ${maxDeployments}, removed ${toRemove.length} old deployments`);
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
   * Отправляет уведомления
   */
  async sendNotifications() {
    const notifications = this.results.notifications_needed;
    
    if (notifications.length === 0) {
      this.logger.info('📢 No notifications needed');
      return;
    }

    this.logger.info(`📢 Sending ${notifications.length} notifications...`);

    // Отправка в Slack
    if (this.config.notifications.channels.includes('slack')) {
      await this.sendSlackNotification(notifications);
    }

    // Отправка в GitHub
    if (this.config.notifications.channels.includes('github')) {
      await this.sendGitHubNotification(notifications);
    }
  }

  /**
   * Отправляет уведомление в Slack
   */
  async sendSlackNotification(notifications) {
    if (!this.config.notifications.slack.webhook) {
      this.logger.warn('⚠️  Slack webhook not configured');
      return;
    }

    const message = {
      text: '🧹 Preview Deployments Cleanup Notification',
      attachments: [
        {
          color: 'warning',
          title: 'Upcoming Preview Deployments Cleanup',
          text: `The following ${notifications.length} preview deployments will be cleaned up soon:`,
          fields: notifications.map(deployment => ({
            title: deployment.name,
            value: `Age: ${deployment.age_days} days | Reason: ${deployment.reason}`,
            short: true
          }))
        }
      ]
    };

    try {
      const response = await fetch(this.config.notifications.slack.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        this.logger.info('✅ Slack notification sent successfully');
      } else {
        this.logger.error(`❌ Slack notification failed: ${response.status}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to send Slack notification: ${error.message}`);
    }
  }

  /**
   * Отправляет уведомление в GitHub
   */
  async sendGitHubNotification(notifications) {
    if (!this.config.notifications.github.token) {
      this.logger.warn('⚠️  GitHub token not configured');
      return;
    }

    // Здесь можно добавить логику отправки уведомлений в GitHub
    // Например, создание issue или комментария
    this.logger.info('🔧 GitHub notifications would be sent here');
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
    if (deployment.usage?.users > this.config.exclusions.activeUsersThreshold) {
      return true;
    }
    
    // Проверяем, есть ли недавние запросы
    if (deployment.usage?.requests > this.config.exclusions.requestsThreshold) {
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
    console.log('\n📊 Enhanced Cleanup Results:');
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
   * Сохраняет отчет
   */
  saveReport() {
    const reportPath = this.config.reporting.path;
    
    // Создаем директорию если не существует
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    this.logger.info(`💾 Report saved to: ${reportPath}`);
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
  const cleaner = new EnhancedCleanupPreviewDeployments(options);
  cleaner.cleanup().catch(console.error);
}

module.exports = EnhancedCleanupPreviewDeployments;