#!/usr/bin/env node

/**
 * Deployment Deduplication System for NORMALDANCE
 * 
 * This system prevents duplicate deployments and manages deployment queues
 * to avoid overwhelming the CI/CD pipeline with concurrent builds.
 * 
 * Features:
 * - Duplicate detection based on PR/branch and commit hash
 * - Queue management for concurrent deployments
 * - Rate limiting and cooldown periods
 * - Persistent state storage
 * - Monitoring and metrics
 */

import fs from 'fs';.promises;
import path from 'path';;
import crypto from 'crypto';;
import { EventEmitter  } from 'events';;

class DeduplicationSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      storagePath: config.storagePath || path.join(__dirname, '../data/deduplication'),
      maxConcurrentDeployments: config.maxConcurrentDeployments || 3,
      maxDeploymentsPerPR: config.maxDeploymentsPerPR || 5,
      deploymentCooldown: config.deploymentCooldown || 300000, // 5 minutes
      duplicateDetectionWindow: config.duplicateDetectionWindow || 600000, // 10 minutes
      cleanupInterval: config.cleanupInterval || 3600000, // 1 hour
      maxHistorySize: config.maxHistorySize || 1000,
      enableMetrics: config.enableMetrics !== false,
      ...config
    };

    this.activeDeployments = new Map();
    this.deploymentQueue = [];
    this.deploymentHistory = [];
    this.metrics = {
      totalDeployments: 0,
      duplicatesPrevented: 0,
      queueProcessed: 0,
      errors: 0
    };

    this.initialized = false;
    this.cleanupTimer = null;
    
    this.logger = this.createLogger();
  }

  /**
   * Create logger instance
   */
  createLogger() {
    return {
      info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
      warn: (message, ...args) => console.log(`[WARN] ${message}`, ...args),
      error: (message, ...args) => console.log(`[ERROR] ${message}`, ...args),
      debug: (message, ...args) => {
        if (this.config.debug) {
          console.log(`[DEBUG] ${message}`, ...args);
        }
      }
    };
  }

  /**
   * Initialize the deduplication system
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Create storage directory
      await fs.mkdir(this.config.storagePath, { recursive: true });
      
      // Load existing state
      await this.loadState();
      
      // Start cleanup timer
      this.startCleanupTimer();
      
      this.initialized = true;
      this.logger.info('Deduplication system initialized');
      
      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize deduplication system', error);
      throw error;
    }
  }

  /**
   * Load existing state from storage
   */
  async loadState() {
    try {
      const stateFile = path.join(this.config.storagePath, 'state.json');
      const data = await fs.readFile(stateFile, 'utf8');
      const state = JSON.parse(data);
      
      this.activeDeployments = new Map(state.activeDeployments || []);
      this.deploymentHistory = state.deploymentHistory || [];
      this.metrics = { ...this.metrics, ...state.metrics };
      
      this.logger.debug('Loaded existing state', {
        activeDeployments: this.activeDeployments.size,
        historySize: this.deploymentHistory.length,
        metrics: this.metrics
      });
    } catch (error) {
      this.logger.warn('Failed to load state, starting with fresh state', error.message);
      // Continue with empty state
    }
  }

  /**
   * Save current state to storage
   */
  async saveState() {
    try {
      const stateFile = path.join(this.config.storagePath, 'state.json');
      const state = {
        activeDeployments: Array.from(this.activeDeployments.entries()),
        deploymentHistory: this.deploymentHistory,
        metrics: this.metrics,
        timestamp: new Date().toISOString()
      };
      
      await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      this.logger.error('Failed to save state', error);
    }
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Create deployment key
   */
  createDeploymentKey(deployment) {
    const { source, prNumber, branch, commitHash, environment } = deployment;
    const key = `${source}:${prNumber || branch}:${commitHash}:${environment}`;
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Check if deployment is a duplicate
   */
  isDuplicate(deployment) {
    const key = this.createDeploymentKey(deployment);
    const now = Date.now();
    const windowStart = now - this.config.duplicateDetectionWindow;
    
    // Check active deployments
    for (const [activeKey, activeDeployment] of this.activeDeployments) {
      if (activeKey === key) {
        return true;
      }
      
      // Check if same PR/branch and recent
      if (this.isSameDeployment(deployment, activeDeployment) && 
          now - activeDeployment.timestamp < this.config.duplicateDetectionWindow) {
        return true;
      }
    }
    
    // Check deployment history
    const recentHistory = this.deploymentHistory.filter(h => h.timestamp > windowStart);
    for (const historyItem of recentHistory) {
      if (historyItem.key === key) {
        return true;
      }
      
      if (this.isSameDeployment(deployment, historyItem) && 
          now - historyItem.timestamp < this.config.duplicateDetectionWindow) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if two deployments are for the same source
   */
  isSameDeployment(deployment1, deployment2) {
    return (
      deployment1.source === deployment2.source &&
      ((deployment1.prNumber && deployment1.prNumber === deployment2.prNumber) ||
       (deployment1.branch && deployment1.branch === deployment2.branch)) &&
      deployment1.environment === deployment2.environment
    );
  }

  /**
   * Check if deployment can start (queue and concurrency limits)
   */
  canStartDeployment(deployment) {
    const now = Date.now();
    
    // Check concurrent deployment limit
    if (this.activeDeployments.size >= this.config.maxConcurrentDeployments) {
      return { canStart: false, reason: 'max_concurrent' };
    }
    
    // Check PR-specific deployment limit
    if (deployment.prNumber) {
      const prDeployments = Array.from(this.activeDeployments.values())
        .filter(d => d.prNumber === deployment.prNumber);
      
      if (prDeployments.length >= this.config.maxDeploymentsPerPR) {
        return { canStart: false, reason: 'max_per_pr' };
      }
    }
    
    // Check cooldown period
    const cooldownKey = `${deployment.source}:${deployment.prNumber || deployment.branch}`;
    const lastDeployment = this.deploymentHistory
      .filter(h => h.source === deployment.source && 
                  (h.prNumber === deployment.prNumber || h.branch === deployment.branch))
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (lastDeployment && now - lastDeployment.timestamp < this.config.deploymentCooldown) {
      return { canStart: false, reason: 'cooldown' };
    }
    
    return { canStart: true };
  }

  /**
   * Add deployment to queue
   */
  async queueDeployment(deployment) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const deploymentKey = this.createDeploymentKey(deployment);
    const queuedDeployment = {
      ...deployment,
      key: deploymentKey,
      timestamp: Date.now(),
      status: 'queued',
      attempts: 0
    };
    
    // Check for duplicates
    if (this.isDuplicate(deployment)) {
      this.metrics.duplicatesPrevented++;
      this.logger.warn('Duplicate deployment detected, skipping', deployment);
      this.emit('duplicate', deployment);
      return { status: 'duplicate', deployment };
    }
    
    // Check if deployment can start immediately
    const canStart = this.canStartDeployment(deployment);
    if (canStart.canStart) {
      return await this.startDeployment(queuedDeployment);
    }
    
    // Add to queue
    this.deploymentQueue.push(queuedDeployment);
    this.logger.info('Deployment queued', {
      source: deployment.source,
      prNumber: deployment.prNumber,
      branch: deployment.branch,
      queuePosition: this.deploymentQueue.length,
      reason: canStart.reason
    });
    
    this.emit('queued', queuedDeployment);
    
    // Try to process queue
    setImmediate(() => this.processQueue());
    
    return { status: 'queued', deployment: queuedDeployment };
  }

  /**
   * Start a deployment
   */
  async startDeployment(deployment) {
    const deploymentKey = this.createDeploymentKey(deployment);
    
    // Add to active deployments
    this.activeDeployments.set(deploymentKey, {
      ...deployment,
      status: 'running',
      startTime: Date.now()
    });
    
    this.metrics.totalDeployments++;
    
    this.logger.info('Deployment started', {
      source: deployment.source,
      prNumber: deployment.prNumber,
      branch: deployment.branch,
      environment: deployment.environment,
      key: deploymentKey
    });
    
    this.emit('started', deployment);
    
    // Save state
    await this.saveState();
    
    return { status: 'started', deployment, key: deploymentKey };
  }

  /**
   * Complete a deployment
   */
  async completeDeployment(key, result = {}) {
    const deployment = this.activeDeployments.get(key);
    if (!deployment) {
      this.logger.warn('Attempted to complete non-existent deployment', { key });
      return;
    }
    
    const now = Date.now();
    const duration = now - deployment.startTime;
    
    // Remove from active deployments
    this.activeDeployments.delete(key);
    
    // Add to history
    const historyItem = {
      ...deployment,
      ...result,
      duration,
      timestamp: now
    };
    
    this.deploymentHistory.push(historyItem);
    
    // Limit history size
    if (this.deploymentHistory.length > this.config.maxHistorySize) {
      this.deploymentHistory = this.deploymentHistory.slice(-this.config.maxHistorySize);
    }
    
    this.logger.info('Deployment completed', {
      source: deployment.source,
      prNumber: deployment.prNumber,
      branch: deployment.branch,
      environment: deployment.environment,
      status: result.status,
      duration,
      key
    });
    
    this.emit('completed', historyItem);
    
    // Update metrics
    if (result.status === 'failed') {
      this.metrics.errors++;
    }
    
    // Save state
    await this.saveState();
    
    // Process queue
    setImmediate(() => this.processQueue());
  }

  /**
   * Fail a deployment
   */
  async failDeployment(key, error) {
    await this.completeDeployment(key, {
      status: 'failed',
      error: error.message || error
    });
  }

  /**
   * Process deployment queue
   */
  async processQueue() {
    if (this.deploymentQueue.length === 0) {
      return;
    }
    
    const now = Date.now();
    const availableSlots = this.config.maxConcurrentDeployments - this.activeDeployments.size;
    
    if (availableSlots <= 0) {
      return;
    }
    
    const deploymentsToStart = Math.min(availableSlots, this.deploymentQueue.length);
    const startedDeployments = [];
    
    for (let i = 0; i < deploymentsToStart; i++) {
      const deployment = this.deploymentQueue.shift();
      
      try {
        const result = await this.startDeployment(deployment);
        startedDeployments.push(result);
        this.metrics.queueProcessed++;
      } catch (error) {
        this.logger.error('Failed to start deployment from queue', error);
        this.metrics.errors++;
        
        // Add to history as failed
        this.deploymentHistory.push({
          ...deployment,
          status: 'failed',
          error: error.message,
          timestamp: now
        });
      }
    }
    
    if (startedDeployments.length > 0) {
      this.logger.info(`Started ${startedDeployments.length} deployments from queue`);
    }
  }

  /**
   * Cleanup old deployments and history
   */
  async cleanup() {
    const now = Date.now();
    const cutoffTime = now - this.config.duplicateDetectionWindow;
    
    try {
      // Clean up active deployments that have been running too long
      const longRunningDeployments = Array.from(this.activeDeployments.entries())
        .filter(([key, deployment]) => now - deployment.startTime > 1800000); // 30 minutes
      
      for (const [key, deployment] of longRunningDeployments) {
        this.logger.warn('Terminating long-running deployment', {
          key,
          source: deployment.source,
          prNumber: deployment.prNumber,
          branch: deployment.branch,
          duration: now - deployment.startTime
        });
        
        await this.failDeployment(key, new Error('Deployment timeout'));
      }
      
      // Clean up old history
      const initialHistorySize = this.deploymentHistory.length;
      this.deploymentHistory = this.deploymentHistory.filter(h => h.timestamp > cutoffTime);
      
      if (this.deploymentHistory.length < initialHistorySize) {
        this.logger.info(`Cleaned up ${initialHistorySize - this.deploymentHistory.length} old history items`);
      }
      
      // Save state
      await this.saveState();
      
      this.emit('cleanup', {
        cleanedHistory: initialHistorySize - this.deploymentHistory.length,
        activeDeployments: this.activeDeployments.size
      });
    } catch (error) {
      this.logger.error('Cleanup failed', error);
    }
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      activeDeployments: this.activeDeployments.size,
      deploymentQueue: this.deploymentQueue.length,
      deploymentHistory: this.deploymentHistory.length,
      metrics: this.metrics,
      config: this.config
    };
  }

  /**
   * Get deployment history
   */
  getDeploymentHistory(filters = {}) {
    let history = [...this.deploymentHistory];
    
    if (filters.source) {
      history = history.filter(h => h.source === filters.source);
    }
    
    if (filters.prNumber) {
      history = history.filter(h => h.prNumber === filters.prNumber);
    }
    
    if (filters.branch) {
      history = history.filter(h => h.branch === filters.branch);
    }
    
    if (filters.environment) {
      history = history.filter(h => h.environment === filters.environment);
    }
    
    if (filters.status) {
      history = history.filter(h => h.status === filters.status);
    }
    
    if (filters.limit) {
      history = history.slice(-filters.limit);
    }
    
    return history.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get active deployments
   */
  getActiveDeployments() {
    return Array.from(this.activeDeployments.values()).sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Get deployment queue
   */
  getDeploymentQueue() {
    return [...this.deploymentQueue].sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Force cleanup of all deployments
   */
  async forceCleanup() {
    this.logger.info('Force cleanup initiated');
    
    // Cancel all active deployments
    const activeDeployments = Array.from(this.activeDeployments.keys());
    for (const key of activeDeployments) {
      await this.failDeployment(key, new Error('Force cleanup'));
    }
    
    // Clear queue
    this.deploymentQueue = [];
    
    // Clear history
    this.deploymentHistory = [];
    
    // Save state
    await this.saveState();
    
    this.logger.info('Force cleanup completed');
    this.emit('forceCleanup');
  }

  /**
   * Shutdown the deduplication system
   */
  async shutdown() {
    this.logger.info('Shutting down deduplication system');
    
    // Stop cleanup timer
    this.stopCleanupTimer();
    
    // Save final state
    await this.saveState();
    
    this.initialized = false;
    this.logger.info('Deduplication system shutdown complete');
    
    this.emit('shutdown');
  }
}

// Helper functions for common deployment scenarios
class DeploymentHelper {
  constructor(deduplicationSystem) {
    this.deduplication = deduplicationSystem;
  }

  /**
   * Queue a GitHub deployment
   */
  async queueGitHubDeployment(options) {
    const { action, prNumber, prHead, prBase, repository, environment = 'preview', skipTests = false, forceDeploy = false } = options;
    
    const deployment = {
      source: 'github',
      action,
      prNumber,
      branch: prHead,
      commitHash: options.commitHash || await this.getLatestCommitHash(repository, prHead),
      repository,
      environment,
      skipTests,
      forceDeploy,
      timestamp: Date.now()
    };
    
    return await this.deduplication.queueDeployment(deployment);
  }

  /**
   * Queue a GitLab deployment
   */
  async queueGitLabDeployment(options) {
    const { action, mrNumber, sourceBranch, targetBranch, project, environment = 'preview', skipTests = false, forceDeploy = false } = options;
    
    const deployment = {
      source: 'gitlab',
      action,
      prNumber: mrNumber,
      branch: sourceBranch,
      commitHash: options.commitHash || await this.getLatestCommitHash(project, sourceBranch),
      repository: project,
      environment,
      skipTests,
      forceDeploy,
      timestamp: Date.now()
    };
    
    return await this.deduplication.queueDeployment(deployment);
  }

  /**
   * Get latest commit hash for a repository/branch
   */
  async getLatestCommitHash(repository, branch) {
    try {
      if (repository.includes('/')) {
        // GitHub
        const response = await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/${branch}`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.object.sha;
        }
      } else {
        // GitLab (simplified)
        const response = await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(repository)}/repository/branches/${branch}`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.commit.id;
        }
      }
      
      throw new Error('Failed to fetch commit hash');
    } catch (error) {
      this.deduplication.logger.warn('Failed to get commit hash', { repository, branch, error: error.message });
      return 'unknown';
    }
  }
}

// Main execution
if (require.main === module) {
  const config = {
    storagePath: process.env.DEDUPLICATION_STORAGE_PATH || path.join(__dirname, '../data/deduplication'),
    maxConcurrentDeployments: parseInt(process.env.MAX_CONCURRENT_DEPLOYMENTS) || 3,
    maxDeploymentsPerPR: parseInt(process.env.MAX_DEPLOYMENTS_PER_PR) || 5,
    deploymentCooldown: parseInt(process.env.DEPLOYMENT_COOLDOWN) || 300000,
    duplicateDetectionWindow: parseInt(process.env.DUPLICATE_DETECTION_WINDOW) || 600000,
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL) || 3600000,
    maxHistorySize: parseInt(process.env.MAX_HISTORY_SIZE) || 1000,
    debug: process.env.DEBUG === 'true'
  };
  
  const deduplicationSystem = new DeduplicationSystem(config);
  const helper = new DeploymentHelper(deduplicationSystem);
  
  // Handle command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--status')) {
    deduplicationSystem.initialize().then(() => {
      console.log(JSON.stringify(deduplicationSystem.getStatus(), null, 2));
      process.exit(0);
    }).catch(error => {
      console.error('Failed to get status:', error);
      process.exit(1);
    });
  } else if (args.includes('--cleanup')) {
    deduplicationSystem.initialize().then(() => {
      return deduplicationSystem.forceCleanup();
    }).then(() => {
      console.log('Force cleanup completed');
      process.exit(0);
    }).catch(error => {
      console.error('Force cleanup failed:', error);
      process.exit(1);
    });
  } else if (args.includes('--server')) {
    // Start as a server
    import http from 'http';;
    
    deduplicationSystem.initialize().then(() => {
      const server = http.createServer((req, res) => {
        if (req.method === 'GET' && req.url === '/status') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(deduplicationSystem.getStatus(), null, 2));
        } else if (req.method === 'POST' && req.url === '/deploy') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const deployment = JSON.parse(body);
              deduplicationSystem.queueDeployment(deployment).then(result => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result, null, 2));
              }).catch(error => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }, null, 2));
              });
            } catch (error) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON' }, null, 2));
            }
          });
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }, null, 2));
        }
      });
      
      const port = process.env.PORT || 3001;
      server.listen(port, () => {
        console.log(`Deduplication server running on port ${port}`);
      });
    }).catch(error => {
      console.error('Failed to start deduplication server:', error);
      process.exit(1);
    });
  } else {
    console.log('Usage:');
    console.log('  node deduplication.js --status');
    console.log('  node deduplication.js --cleanup');
    console.log('  node deduplication.js --server');
    process.exit(1);
  }
}

module.exports = { DeduplicationSystem, DeploymentHelper };