#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync  } from 'child_process';
import CacheManager from './cache-manager';

class CacheInvalidator extends CacheManager {
  constructor(configPath = './scripts/cache-config.json') {
    super(configPath);
    this.invalidationRules = this.config.invalidation || {};
    this.cacheState = this.loadCacheState();
  }

  loadCacheState() {
    const stateFile = './tmp/cache-state.json';
    try {
      if (fs.existsSync(stateFile)) {
        return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      }
    } catch (error) {
      this.log.warn('Error loading cache state', { error: error.message });
    }
    
    return {
      lastInvalidation: {},
      invalidatedTypes: [],
      cacheKeys: {},
      timestamps: {}
    };
  }

  saveCacheState() {
    const stateFile = './tmp/cache-state.json';
    try {
      const stateDir = path.dirname(stateFile);
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }
      
      fs.writeFileSync(stateFile, JSON.stringify(this.cacheState, null, 2));
      this.log.info('Cache state saved', { stateFile });
    } catch (error) {
      this.log.error('Error saving cache state', { error: error.message, stateFile });
    }
  }

  async analyzeChanges() {
    const changes = {
      dependencies: false,
      sourceCode: false,
      prismaSchema: false,
      mobileApp: false,
      configFiles: false
    };

    try {
      // Get git diff information
      const gitDiffOutput = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' });
      const changedFiles = gitDiffOutput.split('\n').filter(file => file.trim() !== '');
      
      this.log.info('Analyzing changes', { changedFiles });
      
      // Check for dependency changes
      const dependencyPatterns = [
        'package.json',
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml'
      ];
      
      changes.dependencies = changedFiles.some(file => 
        dependencyPatterns.some(pattern => file.includes(pattern))
      );
      
      // Check for source code changes
      const sourceCodePatterns = [
        '*.{js,jsx,ts,tsx}',
        '*.json',
        '*.md',
        '*.yml',
        '*.yaml',
        '*.toml',
        '*.lock'
      ];
      
      changes.sourceCode = changedFiles.some(file => {
        return sourceCodePatterns.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(file);
        });
      });
      
      // Check for Prisma schema changes
      changes.prismaSchema = changedFiles.some(file => 
        file.includes('prisma/schema.prisma') || 
        file.includes('prisma/migrations')
      );
      
      // Check for mobile app changes
      changes.mobileApp = changedFiles.some(file => 
        file.startsWith('mobile-app/') && 
        !file.includes('mobile-app/node_modules')
      );
      
      // Check for config file changes
      changes.configFiles = changedFiles.some(file => 
        file.includes('next.config.') || 
        file.includes('tsconfig.json') || 
        file.includes('jest.config.') ||
        file.includes('tailwind.config.')
      );
      
      this.log.info('Change analysis completed', { changes });
      
      return changes;
    } catch (error) {
      this.log.error('Error analyzing changes', { error: error.message });
      return changes;
    }
  }

  shouldInvalidateCache(type, changes) {
    const invalidationRules = this.invalidationRules[`${type}Changes`] || [];
    
    // Check if any of the changed files match the invalidation rules
    for (const pattern of invalidationRules) {
      const changedFiles = Object.entries(changes)
        .filter(([_, changed]) => changed)
        .flatMap(([_, __]) => this.getMatchingFiles(pattern));
      
      if (changedFiles.length > 0) {
        this.log.info('Cache invalidation required', { 
          type, 
          pattern, 
          changedFiles 
        });
        return true;
      }
    }
    
    // Check time-based invalidation
    const lastInvalidation = this.cacheState.lastInvalidation[type];
    if (lastInvalidation) {
      const timeSinceLastInvalidation = Date.now() - new Date(lastInvalidation).getTime();
      const maxAge = this.getMaxAgeForType(type);
      
      if (timeSinceLastInvalidation > maxAge) {
        this.log.info('Cache invalidation required (time-based)', { 
          type, 
          timeSinceLastInvalidation, 
          maxAge 
        });
        return true;
      }
    }
    
    return false;
  }

  getMaxAgeForType(type) {
    const maxAges = {
      'nodeModules': 7 * 24 * 60 * 60 * 1000, // 7 days
      'nextCache': 1 * 24 * 60 * 60 * 1000,   // 1 day
      'prismaClient': 30 * 24 * 60 * 60 * 1000, // 30 days
      'mobileApp': 7 * 24 * 60 * 60 * 1000,   // 7 days
      'testArtifacts': 1 * 24 * 60 * 60 * 1000  // 1 day
    };
    
    return maxAges[type] || 24 * 60 * 60 * 1000; // Default 1 day
  }

  async invalidateCache(types = [], force = false) {
    const results = {};
    
    for (const type of types) {
      try {
        const cacheConfig = this.config[type];
        if (!cacheConfig || !cacheConfig.enabled) {
          this.log.warn(`Cache invalidation skipped: ${type} is disabled`);
          results[type] = { success: false, reason: 'disabled' };
          continue;
        }
        
        // Check if cache should be invalidated
        const shouldInvalidate = force || this.shouldInvalidateCache(type, {});
        
        if (shouldInvalidate) {
          this.log.info(`Invalidating cache: ${type}`);
          
          // Clean up cache
          await this.cleanupCache(type, true);
          
          // Update cache state
          this.cacheState.lastInvalidation[type] = new Date().toISOString();
          this.cacheState.invalidatedTypes.push(type);
          this.cacheState.timestamps[type] = Date.now();
          
          // Generate new cache key
          const cacheKey = this.generateCacheKey(type);
          this.cacheState.cacheKeys[type] = cacheKey;
          
          results[type] = { 
            success: true, 
            invalidated: true, 
            cacheKey,
            timestamp: this.cacheState.timestamps[type]
          };
          
          this.log.info(`Cache invalidated: ${type}`, { 
            cacheKey, 
            timestamp: this.cacheState.timestamps[type] 
          });
        } else {
          results[type] = { success: true, invalidated: false };
          this.log.info(`Cache not invalidated: ${type}`);
        }
      } catch (error) {
        this.log.error(`Error invalidating cache: ${type}`, { error: error.message });
        results[type] = { success: false, error: error.message };
      }
    }
    
    // Save cache state
    this.saveCacheState();
    
    return results;
  }

  async autoInvalidate(changes) {
    const typesToInvalidate = [];
    
    // Determine which caches need invalidation
    if (changes.dependencies) {
      typesToInvalidate.push('nodeModules', 'prismaClient', 'mobileApp');
    }
    
    if (changes.sourceCode || changes.configFiles) {
      typesToInvalidate.push('nextCache');
    }
    
    if (changes.prismaSchema) {
      typesToInvalidate.push('prismaClient');
    }
    
    if (changes.mobileApp) {
      typesToInvalidate.push('mobileApp');
    }
    
    // Remove duplicates
    const uniqueTypes = [...new Set(typesToInvalidate)];
    
    if (uniqueTypes.length > 0) {
      this.log.info('Auto-invalidating caches', { types: uniqueTypes });
      return await this.invalidateCache(uniqueTypes, false);
    }
    
    return {};
  }

  async getCacheHealth() {
    const health = {
      overall: 'healthy',
      types: {},
      recommendations: []
    };
    
    const cacheTypes = Object.keys(this.config.cache || {}).filter(key => 
      this.config[key] && this.config[key].enabled
    );
    
    let hasIssues = false;
    
    for (const type of cacheTypes) {
      const cacheConfig = this.config[type];
      const cachePath = cacheConfig.path;
      const cacheSize = this.getCacheSizeGB(cachePath);
      const maxSize = cacheConfig.maxSizeGB || 1;
      const utilization = cacheSize / maxSize;
      
      const typeHealth = {
        type,
        sizeGB: cacheSize,
        maxSizeGB: maxSize,
        utilization: utilization,
        status: 'healthy',
        lastInvalidated: this.cacheState.lastInvalidation[type] || 'never'
      };
      
      // Check for issues
      if (utilization > 0.9) {
        typeHealth.status = 'warning';
        typeHealth.message = 'Cache size is approaching limit';
        hasIssues = true;
      } else if (utilization > 0.8) {
        typeHealth.status = 'caution';
        typeHealth.message = 'Cache size is high';
      }
      
      // Check if cache is stale
      const lastInvalidation = this.cacheState.lastInvalidation[type];
      if (lastInvalidation) {
        const timeSinceInvalidation = Date.now() - new Date(lastInvalidation).getTime();
        const maxAge = this.getMaxAgeForType(type);
        
        if (timeSinceInvalidation > maxAge * 2) {
          typeHealth.status = 'warning';
          typeHealth.message = 'Cache is stale';
          hasIssues = true;
        }
      }
      
      health.types[type] = typeHealth;
    }
    
    // Set overall health status
    if (hasIssues) {
      health.overall = 'warning';
    }
    
    // Generate recommendations
    health.recommendations = this.generateHealthRecommendations(health.types);
    
    return health;
  }

  generateHealthRecommendations(cacheTypes) {
    const recommendations = [];
    
    Object.entries(cacheTypes).forEach(([type, health]) => {
      if (health.status === 'warning') {
        recommendations.push({
          type: 'cache_size',
          priority: 'high',
          message: `${type} cache size is high (${health.utilization * 100}%)`,
          action: 'Consider running cache cleanup'
        });
      }
      
      if (health.status === 'caution') {
        recommendations.push({
          type: 'cache_size',
          priority: 'medium',
          message: `${type} cache utilization is moderate (${health.utilization * 100}%)`,
          action: 'Monitor cache size'
        });
      }
      
      if (health.lastInvalidated === 'never') {
        recommendations.push({
          type: 'cache_freshness',
          priority: 'medium',
          message: `${type} cache has never been invalidated`,
          action: 'Consider invalidating cache'
        });
      }
    });
    
    return recommendations;
  }

  async generateInvalidationReport() {
    const changes = await this.analyzeChanges();
    const health = await this.getCacheHealth();
    const invalidationResults = await this.autoInvalidate(changes);
    
    const report = {
      timestamp: new Date().toISOString(),
      platform: this.platform,
      arch: this.arch,
      changes,
      health,
      invalidation: invalidationResults,
      cacheState: this.cacheState,
      recommendations: health.recommendations
    };
    
    // Save report
    const reportPath = './tmp/cache-invalidation-report.json';
    try {
      const reportDir = path.dirname(reportPath);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log.info('Cache invalidation report generated', { reportPath });
    } catch (error) {
      this.log.error('Error saving cache invalidation report', { error: error.message, reportPath });
    }
    
    return report;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const invalidator = new CacheInvalidator();
  
  switch (command) {
    case 'analyze':
      invalidator.analyzeChanges().then(changes => {
        console.log('Change Analysis:', JSON.stringify(changes, null, 2));
      });
      break;
      
    case 'invalidate':
      const types = args[1] ? args[1].split(',') : [];
      const force = args.includes('--force');
      
      invalidator.invalidateCache(types, force).then(results => {
        console.log('Cache Invalidation Results:', JSON.stringify(results, null, 2));
      });
      break;
      
    case 'auto':
      invalidator.analyzeChanges().then(changes => {
        return invalidator.autoInvalidate(changes);
      }).then(results => {
        console.log('Auto Invalidation Results:', JSON.stringify(results, null, 2));
      });
      break;
      
    case 'health':
      invalidator.getCacheHealth().then(health => {
        console.log('Cache Health:', JSON.stringify(health, null, 2));
      });
      break;
      
    case 'report':
      invalidator.generateInvalidationReport().then(report => {
        console.log('Cache Invalidation Report:', JSON.stringify(report, null, 2));
      });
      break;
      
    case 'state':
      console.log('Cache State:', JSON.stringify(invalidator.cacheState, null, 2));
      break;
      
    default:
      console.log('Usage: node cache-invalidator.js <command> [options]');
      console.log('Commands:');
      console.log('  analyze              - Analyze recent changes');
      console.log('  invalidate [types] [--force]  - Invalidate specific cache types');
      console.log('  auto                 - Auto-invalidate based on changes');
      console.log('  health               - Get cache health status');
      console.log('  report               - Generate invalidation report');
      console.log('  state                - Show current cache state');
      process.exit(1);
  }
}

module.exports = CacheInvalidator;