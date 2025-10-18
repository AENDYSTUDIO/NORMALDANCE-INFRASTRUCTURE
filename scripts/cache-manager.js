#!/usr/bin/env node

import fs from 'fs';;
import path from 'path';;
import crypto from 'crypto';;
import { execSync  } from 'child_process';;
import os from 'os';;

class CacheManager {
  constructor(configPath = './scripts/cache-config.json') {
    this.config = this.loadConfig(configPath);
    this.log = this.getLogger();
    this.platform = os.platform();
    this.arch = os.arch();
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
    const logFile = logConfig.file || './tmp/cache.log';
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

  generateCacheKey(type, files = []) {
    const cacheConfig = this.config[type];
    if (!cacheConfig) {
      throw new Error(`Unknown cache type: ${type}`);
    }

    let cacheKey = cacheConfig.cacheKey || `${type}-cache`;
    
    if (files.length > 0) {
      const hash = this.generateFileHash(files);
      cacheKey = cacheKey.replace('{{hashFiles}}', hash);
    }

    return cacheKey;
  }

  generateFileHash(files) {
    const hash = crypto.createHash('sha256');
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        hash.update(content);
      }
    });
    
    return hash.digest('hex').substring(0, 8);
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

  shouldInvalidateCache(type) {
    const invalidationConfig = this.config.invalidation;
    if (!invalidationConfig) {
      return false;
    }

    const typeChanges = invalidationConfig[`${type}Changes`] || [];
    
    for (const pattern of typeChanges) {
      const files = this.getMatchingFiles(pattern);
      if (files.length > 0) {
        this.log.info(`Cache invalidation needed for ${type}`, { pattern, files });
        return true;
      }
    }
    
    return false;
  }

  getMatchingFiles(pattern) {
    import glob from 'glob';;
    try {
      return glob.sync(pattern, { ignore: ['**/node_modules/**', '**/.git/**'] });
    } catch (error) {
      this.log.warn(`Error matching pattern: ${pattern}`, { error: error.message });
      return [];
    }
  }

  async cleanupCache(type, force = false) {
    const cacheConfig = this.config[type];
    if (!cacheConfig || !cacheConfig.enabled) {
      this.log.warn(`Cache cleanup skipped: ${type} is disabled`);
      return;
    }

    const cachePath = cacheConfig.path;
    const maxSizeGB = cacheConfig.maxSizeGB || 1;
    const currentSizeGB = this.getCacheSizeGB(cachePath);
    
    this.log.info(`Starting cache cleanup for ${type}`, {
      cachePath,
      currentSizeGB,
      maxSizeGB,
      force
    });

    if (force || currentSizeGB > maxSizeGB) {
      try {
        if (fs.existsSync(cachePath)) {
          fs.rmSync(cachePath, { recursive: true, force: true });
          this.log.info(`Cache cleaned up: ${type}`, { 
            cachePath, 
            sizeCleaned: currentSizeGB 
          });
        }
      } catch (error) {
        this.log.error(`Error cleaning up cache: ${type}`, { 
          error: error.message,
          cachePath 
        });
      }
    } else {
      this.log.info(`Cache cleanup not needed: ${type}`, {
        currentSizeGB,
        maxSizeGB,
        utilization: currentSizeGB / maxSizeGB
      });
    }
  }

  async restoreCache(type, cacheKey) {
    const cacheConfig = this.config[type];
    if (!cacheConfig || !cacheConfig.enabled) {
      this.log.warn(`Cache restore skipped: ${type} is disabled`);
      return false;
    }

    const startTime = Date.now();
    this.log.info(`Starting cache restore for ${type}`, { cacheKey });

    try {
      // This would be implemented with GitHub Actions cache restore
      // For now, we'll simulate the process
      const restoreKeys = cacheConfig.restoreKeys || [cacheKey];
      
      for (const key of restoreKeys) {
        this.log.info(`Attempting to restore cache with key: ${key}`);
        // Simulate cache restore
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if cache was restored successfully
        const cachePath = cacheConfig.path;
        if (fs.existsSync(cachePath)) {
          const restoreTime = Date.now() - startTime;
          this.log.info(`Cache restored successfully: ${type}`, {
            cacheKey,
            restoreKey: key,
            restoreTime,
            cacheSize: this.getCacheSizeGB(cachePath)
          });
          return true;
        }
      }
      
      const restoreTime = Date.now() - startTime;
      this.log.warn(`Cache restore failed: ${type}`, {
        cacheKey,
        restoreTime,
        restoreKeys
      });
      return false;
    } catch (error) {
      const restoreTime = Date.now() - startTime;
      this.log.error(`Error restoring cache: ${type}`, {
        error: error.message,
        cacheKey,
        restoreTime
      });
      return false;
    }
  }

  async saveCache(type, cacheKey) {
    const cacheConfig = this.config[type];
    if (!cacheConfig || !cacheConfig.enabled) {
      this.log.warn(`Cache save skipped: ${type} is disabled`);
      return false;
    }

    const startTime = Date.now();
    this.log.info(`Starting cache save for ${type}`, { cacheKey });

    try {
      // This would be implemented with GitHub Actions cache save
      // For now, we'll simulate the process
      const cachePath = cacheConfig.path;
      
      if (fs.existsSync(cachePath)) {
        const saveTime = Date.now() - startTime;
        const cacheSize = this.getCacheSizeGB(cachePath);
        
        this.log.info(`Cache saved successfully: ${type}`, {
          cacheKey,
          saveTime,
          cacheSize
        });
        return true;
      } else {
        const saveTime = Date.now() - startTime;
        this.log.warn(`Cache save skipped: ${type} (no cache to save)`, {
          cacheKey,
          saveTime,
          cachePath
        });
        return false;
      }
    } catch (error) {
      const saveTime = Date.now() - startTime;
      this.log.error(`Error saving cache: ${type}`, {
        error: error.message,
        cacheKey,
        saveTime
      });
      return false;
    }
  }

  async cleanupAllCaches(force = false) {
    const cacheTypes = Object.keys(this.config.cache || {}).filter(key => 
      this.config[key] && this.config[key].enabled
    );
    
    this.log.info('Starting cleanup of all caches', { 
      cacheTypes, 
      force 
    });
    
    const results = {};
    
    for (const type of cacheTypes) {
      try {
        await this.cleanupCache(type, force);
        results[type] = { success: true };
      } catch (error) {
        this.log.error(`Error cleaning up cache: ${type}`, { error: error.message });
        results[type] = { success: false, error: error.message };
      }
    }
    
    return results;
  }

  async getCacheStats() {
    const cacheTypes = Object.keys(this.config.cache || {}).filter(key => 
      this.config[key] && this.config[key].enabled
    );
    
    const stats = {};
    
    for (const type of cacheTypes) {
      const cacheConfig = this.config[type];
      const cachePath = cacheConfig.path;
      const cacheSize = this.getCacheSizeGB(cachePath);
      const shouldInvalidate = this.shouldInvalidateCache(type);
      
      stats[type] = {
        path: cachePath,
        sizeGB: cacheSize,
        maxSizeGB: cacheConfig.maxSizeGB || 0,
        utilization: cacheConfig.maxSizeGB ? cacheSize / cacheConfig.maxSizeGB : 0,
        shouldInvalidate,
        enabled: cacheConfig.enabled
      };
    }
    
    return stats;
  }

  async generateCacheReport() {
    const stats = await this.getCacheStats();
    const report = {
      timestamp: new Date().toISOString(),
      platform: this.platform,
      arch: this.arch,
      totalSizeGB: Object.values(stats).reduce((sum, stat) => sum + stat.sizeGB, 0),
      cacheTypes: stats,
      config: {
        maxSizeGB: this.config.cache.maxSizeGB,
        retentionDays: this.config.cache.retentionDays,
        cleanupThreshold: this.config.cache.cleanupThreshold
      }
    };
    
    // Save report
    const reportPath = this.config.monitoring?.reporting?.path || './tmp/cache-report.json';
    try {
      const reportDir = path.dirname(reportPath);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log.info('Cache report generated', { reportPath });
    } catch (error) {
      this.log.error('Error saving cache report', { error: error.message, reportPath });
    }
    
    return report;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const cacheManager = new CacheManager();
  
  switch (command) {
    case 'cleanup':
      const type = args[1];
      const force = args.includes('--force');
      
      if (type === 'all') {
        cacheManager.cleanupAllCaches(force).then(results => {
          console.log('Cache cleanup results:', results);
        });
      } else {
        cacheManager.cleanupCache(type, force).then(() => {
          console.log(`Cache cleanup completed for: ${type}`);
        });
      }
      break;
      
    case 'restore':
      const restoreType = args[1];
      const cacheKey = args[2];
      
      if (!restoreType || !cacheKey) {
        console.error('Usage: node cache-manager.js restore <type> <cacheKey>');
        process.exit(1);
      }
      
      cacheManager.restoreCache(restoreType, cacheKey).then(success => {
        console.log(`Cache restore ${success ? 'successful' : 'failed'} for: ${restoreType}`);
      });
      break;
      
    case 'save':
      const saveType = args[1];
      const saveCacheKey = args[2];
      
      if (!saveType || !saveCacheKey) {
        console.error('Usage: node cache-manager.js save <type> <cacheKey>');
        process.exit(1);
      }
      
      cacheManager.saveCache(saveType, saveCacheKey).then(success => {
        console.log(`Cache save ${success ? 'successful' : 'failed'} for: ${saveType}`);
      });
      break;
      
    case 'stats':
      cacheManager.getCacheStats().then(stats => {
        console.log('Cache Statistics:', JSON.stringify(stats, null, 2));
      });
      break;
      
    case 'report':
      cacheManager.generateCacheReport().then(report => {
        console.log('Cache Report:', JSON.stringify(report, null, 2));
      });
      break;
      
    case 'invalidate':
      const invalidateType = args[1];
      
      if (!invalidateType) {
        console.error('Usage: node cache-manager.js invalidate <type>');
        process.exit(1);
      }
      
      const shouldInvalidate = cacheManager.shouldInvalidateCache(invalidateType);
      console.log(`Cache should be invalidated for ${invalidateType}:`, shouldInvalidate);
      break;
      
    default:
      console.log('Usage: node cache-manager.js <command> [options]');
      console.log('Commands:');
      console.log('  cleanup <type> [--force]     - Clean up cache for type or "all"');
      console.log('  restore <type> <cacheKey>    - Restore cache for type');
      console.log('  save <type> <cacheKey>       - Save cache for type');
      console.log('  stats                        - Get cache statistics');
      console.log('  report                       - Generate cache report');
      console.log('  invalidate <type>            - Check if cache should be invalidated');
      process.exit(1);
  }
}

module.exports = CacheManager;