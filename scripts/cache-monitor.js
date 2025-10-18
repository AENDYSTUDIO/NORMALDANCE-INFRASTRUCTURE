#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync  } from 'child_process';
import os from 'os';
import { performance  } from 'perf_hooks';

class CacheMonitor {
  constructor(configPath = './scripts/cache-config.json') {
    this.config = this.loadConfig(configPath);
    this.log = this.getLogger();
    this.platform = os.platform();
    this.arch = os.arch();
    this.metrics = {
      cache_hit_rate: 0,
      cache_size: 0,
      cache_restore_time: 0,
      cache_save_time: 0,
      cache_eviction_count: 0,
      last_updated: new Date().toISOString()
    };
    this.alerts = [];
    this.history = [];
  }

  loadConfig(configPath) {
    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Error loading cache config:', error.message);
      process.exit(1);
    }
  }

  getLogger() {
    const logConfig = this.config.logging || {};
    const logLevel = logConfig.level || 'info';
    const logFile = logConfig.file || './tmp/cache-monitor.log';
    const logConsole = logConfig.console !== false;
    const logFormat = logConfig.format || 'json';

    return {
      info: (message, data = {}) => {
        const logEntry = {
          timestamp: new Date().toISOString(),
          level: 'info',
          message,
          data,
          platform: this.platform,
          arch: this.arch
        };
        
        if (logConsole) {
          if (logFormat === 'json') {
            console.log(JSON.stringify(logEntry));
          } else {
            console.log(`[${logEntry.timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`);
          }
        }
        
        if (logFile) {
          this.writeLogFile(logFile, logEntry);
        }
      },
      warn: (message, data = {}) => {
        const logEntry = {
          timestamp: new Date().toISOString(),
          level: 'warn',
          message,
          data,
          platform: this.platform,
          arch: this.arch
        };
        
        if (logConsole) {
          if (logFormat === 'json') {
            console.warn(JSON.stringify(logEntry));
          } else {
            console.warn(`[${logEntry.timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`);
          }
        }
        
        if (logFile) {
          this.writeLogFile(logFile, logEntry);
        }
      },
      error: (message, data = {}) => {
        const logEntry = {
          timestamp: new Date().toISOString(),
          level: 'error',
          message,
          data,
          platform: this.platform,
          arch: this.arch
        };
        
        if (logConsole) {
          if (logFormat === 'json') {
            console.error(JSON.stringify(logEntry));
          } else {
            console.error(`[${logEntry.timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`);
          }
        }
        
        if (logFile) {
          this.writeLogFile(logFile, logEntry);
        }
      }
    };
  }

  writeLogFile(logFile, logEntry) {
    try {
      const logDir = path.dirname(logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Error writing to log file:', error.message);
    }
  }

  getCacheSizeGB(cachePath) {
    try {
      if (!fs.existsSync(cachePath)) {
        return 0;
      }
      
      let totalSize = 0;
      const files = this.getAllFiles(cachePath);
      
      files.forEach(file => {
        try {
          const stats = fs.statSync(file);
          totalSize += stats.size;
        } catch (error) {
          this.log.warn(`Error getting file size: ${file}`, { error: error.message });
        }
      });
      
      return totalSize / (1024 * 1024 * 1024); // Convert to GB
    } catch (error) {
      this.log.error(`Error calculating cache size: ${cachePath}`, { error: error.message });
      return 0;
    }
  }

  getAllFiles(dir) {
    let results = [];
    
    if (!fs.existsSync(dir)) {
      return results;
    }
    
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      
      if (stat && stat.isDirectory()) {
        results = results.concat(this.getAllFiles(file));
      } else {
        results.push(file);
      }
    });
    
    return results;
  }

  async collectMetrics() {
    const startTime = performance.now();
    this.log.info('Starting metrics collection');
    
    const cacheTypes = Object.keys(this.config.cache || {}).filter(key => 
      this.config[key] && this.config[key].enabled
    );
    
    let totalSize = 0;
    const cacheStats = {};
    
    for (const type of cacheTypes) {
      const cacheConfig = this.config[type];
      const cachePath = cacheConfig.path;
      const sizeGB = this.getCacheSizeGB(cachePath);
      
      cacheStats[type] = {
        path: cachePath,
        sizeGB: sizeGB,
        maxSizeGB: cacheConfig.maxSizeGB || 0,
        utilization: cacheConfig.maxSizeGB ? sizeGB / cacheConfig.maxSizeGB : 0,
        fileCount: this.getFileCount(cachePath)
      };
      
      totalSize += sizeGB;
    }
    
    // Simulate cache hit rate calculation
    const cacheHitRate = this.calculateCacheHitRate();
    
    const endTime = performance.now();
    const collectionTime = endTime - startTime;
    
    this.metrics = {
      cache_hit_rate: cacheHitRate,
      cache_size: totalSize,
      cache_restore_time: this.metrics.cache_restore_time,
      cache_save_time: this.metrics.cache_save_time,
      cache_eviction_count: this.metrics.cache_eviction_count,
      last_updated: new Date().toISOString(),
      collection_time: collectionTime,
      cache_stats: cacheStats
    };
    
    this.log.info('Metrics collection completed', {
      totalSize: totalSize,
      cacheHitRate: cacheHitRate,
      collectionTime: collectionTime
    });
    
    return this.metrics;
  }

  getFileCount(cachePath) {
    try {
      if (!fs.existsSync(cachePath)) {
        return 0;
      }
      
      return this.getAllFiles(cachePath).length;
    } catch (error) {
      this.log.error(`Error getting file count: ${cachePath}`, { error: error.message });
      return 0;
    }
  }

  calculateCacheHitRate() {
    // Simulate cache hit rate calculation
    // In a real implementation, this would track actual cache hits and misses
    const baseRate = 0.75; // 75% base hit rate
    const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
    return Math.max(0, Math.min(1, baseRate + variation));
  }

  checkAlerts() {
    const alertsConfig = this.config.monitoring?.alerts || {};
    const metrics = this.metrics;
    
    const checks = [
      {
        name: 'cache_hit_rate',
        value: metrics.cache_hit_rate,
        threshold: alertsConfig.cache_hit_rate_threshold || 0.7,
        message: `Cache hit rate is below threshold: ${metrics.cache_hit_rate}`
      },
      {
        name: 'cache_size',
        value: metrics.cache_size,
        threshold: alertsConfig.cache_size_threshold_gb || 8,
        message: `Cache size is above threshold: ${metrics.cache_size}GB`
      },
      {
        name: 'cache_restore_time',
        value: metrics.cache_restore_time,
        threshold: alertsConfig.cache_restore_time_threshold_ms || 30000,
        message: `Cache restore time is above threshold: ${metrics.cache_restore_time}ms`
      },
      {
        name: 'cache_save_time',
        value: metrics.cache_save_time,
        threshold: alertsConfig.cache_save_time_threshold_ms || 60000,
        message: `Cache save time is above threshold: ${metrics.cache_save_time}ms`
      }
    ];
    
    const newAlerts = [];
    
    checks.forEach(check => {
      if (check.value > check.threshold) {
        const alert = {
          id: this.generateAlertId(),
          timestamp: new Date().toISOString(),
          type: check.name,
          severity: 'warning',
          message: check.message,
          value: check.value,
          threshold: check.threshold,
          resolved: false
        };
        
        newAlerts.push(alert);
        this.alerts.push(alert);
        this.log.warn(check.message, { 
          value: check.value, 
          threshold: check.threshold 
        });
      }
    });
    
    return newAlerts;
  }

  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async generateReport() {
    const startTime = performance.now();
    this.log.info('Starting report generation');
    
    // Collect current metrics
    await this.collectMetrics();
    
    // Check for alerts
    const newAlerts = this.checkAlerts();
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      platform: this.platform,
      arch: this.arch,
      metrics: this.metrics,
      alerts: this.alerts,
      new_alerts: newAlerts,
      summary: {
        total_cache_size_gb: this.metrics.cache_size,
        cache_hit_rate_percentage: (this.metrics.cache_hit_rate * 100).toFixed(2),
        active_alerts: this.alerts.filter(a => !a.resolved).length,
        total_alerts: this.alerts.length,
        cache_types_count: Object.keys(this.metrics.cache_stats || {}).length
      },
      recommendations: this.generateRecommendations()
    };
    
    // Save report
    const reportPath = this.config.monitoring?.reporting?.path || './tmp/cache-monitor-report.json';
    try {
      const reportDir = path.dirname(reportPath);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log.info('Cache monitor report generated', { reportPath });
    } catch (error) {
      this.log.error('Error saving cache monitor report', { error: error.message, reportPath });
    }
    
    // Add to history
    this.history.push(report);
    
    // Clean up old history
    this.cleanupHistory();
    
    const endTime = performance.now();
    const reportTime = endTime - startTime;
    
    this.log.info('Report generation completed', { 
      reportTime, 
      newAlertsCount: newAlerts.length 
    });
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    const metrics = this.metrics;
    const cacheStats = metrics.cache_stats || {};
    
    // Check cache hit rate
    if (metrics.cache_hit_rate < 0.7) {
      recommendations.push({
        type: 'cache_hit_rate',
        priority: 'high',
        message: 'Cache hit rate is low. Consider optimizing cache keys or increasing cache size.',
        action: 'Increase cache size or review cache key strategy'
      });
    }
    
    // Check cache size
    if (metrics.cache_size > (this.config.cache.maxSizeGB || 10) * 0.8) {
      recommendations.push({
        type: 'cache_size',
        priority: 'medium',
        message: 'Cache size is approaching limit. Consider cleanup or increasing cache size.',
        action: 'Run cache cleanup or increase cache size limit'
      });
    }
    
    // Check individual cache types
    Object.entries(cacheStats).forEach(([type, stats]) => {
      if (stats.utilization > 0.9) {
        recommendations.push({
          type: `cache_${type}`,
          priority: 'high',
          message: `${type} cache is nearly full. Consider cleanup or optimization.`,
          action: `Run cleanup for ${type} cache`
        });
      }
      
      if (stats.utilization < 0.1 && stats.sizeGB > 0.1) {
        recommendations.push({
          type: `cache_${type}`,
          priority: 'low',
          message: `${type} cache utilization is low. Consider reducing cache size.`,
          action: `Consider reducing cache size for ${type}`
        });
      }
    });
    
    return recommendations;
  }

  cleanupHistory() {
    const retentionDays = this.config.monitoring?.reporting?.retentionDays || 30;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    this.history = this.history.filter(report => 
      new Date(report.timestamp) > cutoffDate
    );
    
    this.log.info('History cleanup completed', { 
      retentionDays,
      remainingReports: this.history.length
    });
  }

  async sendNotifications() {
    const notificationsConfig = this.config.monitoring?.notifications || {};
    if (!notificationsConfig.enabled) {
      this.log.info('Notifications are disabled');
      return;
    }
    
    const newAlerts = this.checkAlerts();
    if (newAlerts.length === 0) {
      this.log.info('No new alerts to notify');
      return;
    }
    
    const notificationData = {
      timestamp: new Date().toISOString(),
      platform: this.platform,
      arch: this.arch,
      alerts: newAlerts,
      metrics: this.metrics,
      summary: {
        total_alerts: this.alerts.length,
        active_alerts: this.alerts.filter(a => !a.resolved).length,
        new_alerts: newAlerts.length
      }
    };
    
    // Send Slack notification
    if (notificationsConfig.channels?.includes('slack')) {
      await this.sendSlackNotification(notificationData);
    }
    
    // Send GitHub notification
    if (notificationsConfig.channels?.includes('github')) {
      await this.sendGitHubNotification(notificationData);
    }
    
    this.log.info('Notifications sent', { 
      alertsCount: newAlerts.length,
      channels: notificationsConfig.channels
    });
  }

  async sendSlackNotification(data) {
    const slackConfig = this.config.monitoring?.notifications?.slack || {};
    const webhook = slackConfig.webhook;
    
    if (!webhook) {
      this.log.warn('Slack webhook not configured');
      return;
    }
    
    const payload = {
      text: '🚨 Cache Alert Notification',
      attachments: [
        {
          color: 'danger',
          title: 'Cache Monitoring Alert',
          fields: [
            {
              title: 'Platform',
              value: data.platform,
              short: true
            },
            {
              title: 'Architecture',
              value: data.arch,
              short: true
            },
            {
              title: 'Total Alerts',
              value: data.summary.total_alerts.toString(),
              short: true
            },
            {
              title: 'Active Alerts',
              value: data.summary.active_alerts.toString(),
              short: true
            }
          ],
          timestamp: data.timestamp
        }
      ]
    };
    
    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Slack notification failed: ${response.status}`);
      }
      
      this.log.info('Slack notification sent successfully');
    } catch (error) {
      this.log.error('Error sending Slack notification', { error: error.message });
    }
  }

  async sendGitHubNotification(data) {
    const githubConfig = this.config.monitoring?.notifications?.github || {};
    const repo = githubConfig.repository;
    const token = githubConfig.token;
    
    if (!repo || !token) {
      this.log.warn('GitHub repository or token not configured');
      return;
    }
    
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          title: 'Cache Monitoring Alert',
          body: `Cache monitoring has detected ${data.summary.new_alerts} new alerts.\n\n` +
                `**Platform:** ${data.platform}\n` +
                `**Architecture:** ${data.arch}\n` +
                `**Total Alerts:** ${data.summary.total_alerts}\n` +
                `**Active Alerts:** ${data.summary.active_alerts}\n\n` +
                `**Alert Details:**\n` +
                data.alerts.map(alert => `- ${alert.type}: ${alert.message}`).join('\n')
        })
      });
      
      if (!response.ok) {
        throw new Error(`GitHub notification failed: ${response.status}`);
      }
      
      this.log.info('GitHub notification sent successfully');
    } catch (error) {
      this.log.error('Error sending GitHub notification', { error: error.message });
    }
  }

  async runMonitoringCycle() {
    const startTime = performance.now();
    this.log.info('Starting monitoring cycle');
    
    try {
      // Generate report
      const report = await this.generateReport();
      
      // Send notifications
      await this.sendNotifications();
      
      const endTime = performance.now();
      const cycleTime = endTime - startTime;
      
      this.log.info('Monitoring cycle completed', { 
        cycleTime,
        alertsCount: report.alerts.length,
        newAlertsCount: report.new_alerts.length
      });
      
      return report;
    } catch (error) {
      this.log.error('Error in monitoring cycle', { error: error.message });
      throw error;
    }
  }

  async startMonitoring(intervalMinutes = 5) {
    this.log.info('Starting continuous monitoring', { intervalMinutes });
    
    const intervalMs = intervalMinutes * 60 * 1000;
    
    const runCycle = async () => {
      try {
        await this.runMonitoringCycle();
      } catch (error) {
        this.log.error('Error in monitoring cycle', { error: error.message });
      }
      
      setTimeout(runCycle, intervalMs);
    };
    
    // Run first cycle immediately
    await runCycle();
    
    // Keep the process alive
    setInterval(() => {
      // This prevents the process from exiting
    }, 1000);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const monitor = new CacheMonitor();
  
  switch (command) {
    case 'metrics':
      monitor.collectMetrics().then(metrics => {
        console.log('Cache Metrics:', JSON.stringify(metrics, null, 2));
      });
      break;
      
    case 'report':
      monitor.generateReport().then(report => {
        console.log('Cache Monitor Report:', JSON.stringify(report, null, 2));
      });
      break;
      
    case 'alerts':
      monitor.checkAlerts().then(alerts => {
        console.log('Current Alerts:', JSON.stringify(alerts, null, 2));
      });
      break;
      
    case 'monitor':
      const interval = parseInt(args[1]) || 5;
      console.log(`Starting monitoring with ${interval} minute intervals...`);
      monitor.startMonitoring(interval);
      break;
      
    case 'recommendations':
      monitor.generateRecommendations().then(recommendations => {
        console.log('Cache Recommendations:', JSON.stringify(recommendations, null, 2));
      });
      break;
      
    default:
      console.log('Usage: node cache-monitor.js <command> [options]');
      console.log('Commands:');
      console.log('  metrics              - Collect current cache metrics');
      console.log('  report              - Generate cache monitoring report');
      console.log('  alerts              - Check for cache alerts');
      console.log('  monitor [minutes]   - Start continuous monitoring');
      console.log('  recommendations     - Generate cache optimization recommendations');
      process.exit(1);
  }
}

module.exports = CacheMonitor;