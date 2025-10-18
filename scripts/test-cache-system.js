#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync  } from 'child_process';
import CacheManager from './cache-manager';
import CacheMonitor from './cache-monitor';
import CacheInvalidator from './cache-invalidator';

class CacheSystemTester {
  constructor() {
    this.testResults = [];
    this.testDir = './tmp/cache-test';
    this.log = this.getLogger();
  }

  getLogger() {
    return {
      info: (message, data = {}) => {
        console.log(`[TEST] ${message}`, data);
      },
      warn: (message, data = {}) => {
        console.warn(`[TEST] ${message}`, data);
      },
      error: (message, data = {}) => {
        console.error(`[TEST] ${message}`, data);
      }
    };
  }

  async runAllTests() {
    this.log.info('Starting cache system tests');
    
    try {
      // Create test directory
      await this.createTestDirectory();
      
      // Run individual tests
      await this.testCacheManager();
      await this.testCacheMonitor();
      await this.testCacheInvalidator();
      await this.testGitHubActionsWorkflow();
      await this.testIntegration();
      
      // Generate test report
      await this.generateTestReport();
      
      this.log.info('All tests completed');
      return this.testResults;
    } catch (error) {
      this.log.error('Error running tests', { error: error.message });
      throw error;
    }
  }

  async createTestDirectory() {
    try {
      if (!fs.existsSync(this.testDir)) {
        fs.mkdirSync(this.testDir, { recursive: true });
      }
      
      // Create test files
      const testFiles = [
        { path: `${this.testDir}/package.json`, content: JSON.stringify({ name: 'test-app' }) },
        { path: `${this.testDir}/package-lock.json`, content: '{}' },
        { path: `${this.testDir}/next.config.js`, content: 'module.exports = {}' },
        { path: `${this.testDir}/prisma/schema.prisma`, content: 'generator client { provider = "prisma-client-js" }' }
      ];
      
      testFiles.forEach(file => {
        const dir = path.dirname(file.path);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(file.path, file.content);
      });
      
      this.log.info('Test directory created', { testDir: this.testDir });
    } catch (error) {
      this.log.error('Error creating test directory', { error: error.message });
      throw error;
    }
  }

  async testCacheManager() {
    this.log.info('Testing Cache Manager');
    
    try {
      const cacheManager = new CacheManager();
      
      // Test cache key generation
      const cacheKey = cacheManager.generateCacheKey('nodeModules', ['package.json']);
      this.addTestResult('cache-manager-key-generation', true, `Cache key generated: ${cacheKey}`);
      
      // Test cache size calculation
      const cacheSize = cacheManager.getCacheSizeGB('./node_modules');
      this.addTestResult('cache-manager-size-calculation', true, `Cache size calculated: ${cacheSize}GB`);
      
      // Test cache cleanup
      await cacheManager.cleanupCache('nodeModules', true);
      this.addTestResult('cache-manager-cleanup', true, 'Cache cleanup completed');
      
      // Test cache statistics
      const stats = await cacheManager.getCacheStats();
      this.addTestResult('cache-manager-stats', true, `Cache stats generated: ${Object.keys(stats).length} types`);
      
      // Test cache report generation
      const report = await cacheManager.generateCacheReport();
      this.addTestResult('cache-manager-report', true, 'Cache report generated');
      
    } catch (error) {
      this.addTestResult('cache-manager', false, error.message);
    }
  }

  async testCacheMonitor() {
    this.log.info('Testing Cache Monitor');
    
    try {
      const cacheMonitor = new CacheMonitor();
      
      // Test metrics collection
      const metrics = await cacheMonitor.collectMetrics();
      this.addTestResult('cache-monitor-metrics', true, `Metrics collected: ${Object.keys(metrics).length} metrics`);
      
      // Test alert checking
      const alerts = cacheMonitor.checkAlerts();
      this.addTestResult('cache-monitor-alerts', true, `Alerts checked: ${alerts.length} alerts`);
      
      // Test report generation
      const report = await cacheMonitor.generateReport();
      this.addTestResult('cache-monitor-report', true, 'Monitor report generated');
      
      // Test recommendations
      const recommendations = cacheMonitor.generateRecommendations();
      this.addTestResult('cache-monitor-recommendations', true, `Recommendations generated: ${recommendations.length} items`);
      
    } catch (error) {
      this.addTestResult('cache-monitor', false, error.message);
    }
  }

  async testCacheInvalidator() {
    this.log.info('Testing Cache Invalidator');
    
    try {
      const cacheInvalidator = new CacheInvalidator();
      
      // Test change analysis
      const changes = await cacheInvalidator.analyzeChanges();
      this.addTestResult('cache-invalidator-changes', true, `Changes analyzed: ${Object.keys(changes).length} change types`);
      
      // Test cache health
      const health = await cacheInvalidator.getCacheHealth();
      this.addTestResult('cache-invalidator-health', true, `Cache health: ${health.overall}`);
      
      // Test invalidation report
      const report = await cacheInvalidator.generateInvalidationReport();
      this.addTestResult('cache-invalidator-report', true, 'Invalidation report generated');
      
      // Test cache state
      const state = cacheInvalidator.cacheState;
      this.addTestResult('cache-invalidator-state', true, `Cache state loaded: ${Object.keys(state).length} properties`);
      
    } catch (error) {
      this.addTestResult('cache-invalidator', false, error.message);
    }
  }

  async testGitHubActionsWorkflow() {
    this.log.info('Testing GitHub Actions Workflow');
    
    try {
      // Check if workflow file exists
      const workflowPath = '.github/workflows/preview-deployments-cached.yml';
      if (fs.existsSync(workflowPath)) {
        const workflowContent = fs.readFileSync(workflowPath, 'utf8');
        
        // Check for required components
        const requiredComponents = [
          'cache-analysis',
          'setup-and-restore',
          'install-dependencies',
          'generate-prisma',
          'run-tests',
          'build-app',
          'save-build-cache',
          'deploy-to-vercel',
          'cache-monitoring',
          'cleanup-preview',
          'pr-cleanup',
          'status-check'
        ];
        
        const missingComponents = requiredComponents.filter(component => 
          !workflowContent.includes(`${component}:`)
        );
        
        if (missingComponents.length === 0) {
          this.addTestResult('github-actions-workflow', true, 'All required components found');
        } else {
          this.addTestResult('github-actions-workflow', false, `Missing components: ${missingComponents.join(', ')}`);
        }
        
        // Check for cache configuration
        const cacheConfigChecks = [
          'actions/cache@v4',
          'restore-keys',
          'path:',
          'key:'
        ];
        
        const missingConfig = cacheConfigChecks.filter(check => 
          !workflowContent.includes(check)
        );
        
        if (missingConfig.length === 0) {
          this.addTestResult('github-actions-cache-config', true, 'Cache configuration found');
        } else {
          this.addTestResult('github-actions-cache-config', false, `Missing config: ${missingConfig.join(', ')}`);
        }
        
      } else {
        this.addTestResult('github-actions-workflow', false, 'Workflow file not found');
      }
      
    } catch (error) {
      this.addTestResult('github-actions', false, error.message);
    }
  }

  async testIntegration() {
    this.log.info('Testing Integration');
    
    try {
      // Test configuration files
      const configFiles = [
        'scripts/cache-config.json',
        'scripts/cache-monitoring-config.json'
      ];
      
      const missingConfigs = configFiles.filter(file => !fs.existsSync(file));
      if (missingConfigs.length === 0) {
        this.addTestResult('integration-config-files', true, 'All config files found');
      } else {
        this.addTestResult('integration-config-files', false, `Missing configs: ${missingConfigs.join(', ')}`);
      }
      
      // Test script files
      const scriptFiles = [
        'scripts/cache-manager.js',
        'scripts/cache-monitor.js',
        'scripts/cache-invalidator.js'
      ];
      
      const missingScripts = scriptFiles.filter(file => !fs.existsSync(file));
      if (missingScripts.length === 0) {
        this.addTestResult('integration-script-files', true, 'All script files found');
      } else {
        this.addTestResult('integration-script-files', false, `Missing scripts: ${missingScripts.join(', ')}`);
      }
      
      // Test CLI interfaces
      const cliTests = [
        { script: 'scripts/cache-manager.js', command: 'stats' },
        { script: 'scripts/cache-monitor.js', command: 'metrics' },
        { script: 'scripts/cache-invalidator.js', command: 'health' }
      ];
      
      for (const test of cliTests) {
        try {
          const result = execSync(`node ${test.script} ${test.command}`, { 
            encoding: 'utf8',
            timeout: 10000 
          });
          
          if (result && result.trim()) {
            this.addTestResult(`integration-cli-${test.command}`, true, 'CLI command executed successfully');
          } else {
            this.addTestResult(`integration-cli-${test.command}`, false, 'CLI command returned empty result');
          }
        } catch (error) {
          this.addTestResult(`integration-cli-${test.command}`, false, error.message);
        }
      }
      
    } catch (error) {
      this.addTestResult('integration', false, error.message);
    }
  }

  addTestResult(testName, success, message) {
    const result = {
      name: testName,
      success,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    if (success) {
      this.log.info(`Test passed: ${testName}`, { message });
    } else {
      this.log.error(`Test failed: ${testName}`, { message });
    }
  }

  async generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.testResults.length,
        passedTests: this.testResults.filter(r => r.success).length,
        failedTests: this.testResults.filter(r => !r.success).length,
        successRate: (this.testResults.filter(r => r.success).length / this.testResults.length * 100).toFixed(2) + '%'
      },
      results: this.testResults,
      recommendations: this.generateTestRecommendations()
    };
    
    // Save report
    const reportPath = './tmp/cache-system-test-report.json';
    try {
      const reportDir = path.dirname(reportPath);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log.info('Test report generated', { reportPath });
    } catch (error) {
      this.log.error('Error saving test report', { error: error.message, reportPath });
    }
    
    return report;
  }

  generateTestRecommendations() {
    const recommendations = [];
    const failedTests = this.testResults.filter(r => !r.success);
    
    if (failedTests.length > 0) {
      recommendations.push({
        type: 'critical',
        message: `${failedTests.length} tests failed. Please review the test results.`,
        action: 'Fix failing tests before deploying'
      });
    }
    
    const missingConfigs = this.testResults.filter(r => 
      r.name.includes('config') && !r.success
    );
    
    if (missingConfigs.length > 0) {
      recommendations.push({
        type: 'high',
        message: 'Configuration files are missing or incomplete',
        action: 'Ensure all configuration files are present and properly configured'
      });
    }
    
    const missingScripts = this.testResults.filter(r => 
      r.name.includes('script') && !r.success
    );
    
    if (missingScripts.length > 0) {
      recommendations.push({
        type: 'medium',
        message: 'Script files are missing or incomplete',
        action: 'Ensure all script files are present and executable'
      });
    }
    
    const cliFailures = this.testResults.filter(r => 
      r.name.includes('cli') && !r.success
    );
    
    if (cliFailures.length > 0) {
      recommendations.push({
        type: 'medium',
        message: 'CLI commands are failing',
        action: 'Check script dependencies and execution permissions'
      });
    }
    
    return recommendations;
  }

  async printSummary() {
    const report = await this.generateTestReport();
    
    console.log('\n' + '='.repeat(50));
    console.log('CACHE SYSTEM TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passedTests}`);
    console.log(`Failed: ${report.summary.failedTests}`);
    console.log(`Success Rate: ${report.summary.successRate}`);
    console.log('='.repeat(50));
    
    if (report.recommendations.length > 0) {
      console.log('\nRECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.type.toUpperCase()}] ${rec.message}`);
        console.log(`   Action: ${rec.action}`);
      });
    }
    
    console.log('\nDetailed report saved to: ./tmp/cache-system-test-report.json');
    console.log('='.repeat(50));
    
    return report;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const tester = new CacheSystemTester();
  
  switch (command) {
    case 'test':
      tester.runAllTests().then(report => {
        tester.printSummary().then(() => {
          process.exit(report.summary.failedTests > 0 ? 1 : 0);
        });
      }).catch(error => {
        console.error('Test execution failed:', error.message);
        process.exit(1);
      });
      break;
      
    case 'summary':
      tester.runAllTests().then(report => {
        tester.printSummary();
      }).catch(error => {
        console.error('Summary generation failed:', error.message);
        process.exit(1);
      });
      break;
      
    default:
      console.log('Usage: node test-cache-system.js <command>');
      console.log('Commands:');
      console.log('  test        - Run all tests and generate report');
      console.log('  summary     - Run tests and display summary');
      process.exit(1);
  }
}

module.exports = CacheSystemTester;