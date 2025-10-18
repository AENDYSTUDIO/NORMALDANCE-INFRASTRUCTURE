#!/usr/bin/env node

/**
 * Error Handling and Retry System for NORMALDANCE Preview Deployments
 * 
 * This system handles errors during the deployment process and implements
 * intelligent retry logic with exponential backoff.
 * 
 * Features:
 * - Error classification and categorization
 * - Exponential backoff retry strategy
 * - Circuit breaker pattern
 * - Error aggregation and reporting
 * - Automatic recovery mechanisms
 */

import fs from 'fs';.promises;
import path from 'path';;
import { EventEmitter  } from 'events';;

class ErrorHandler extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxRetries: config.maxRetries || 3,
      baseDelay: config.baseDelay || 5000, // 5 seconds
      maxDelay: config.maxDelay || 300000, // 5 minutes
      retryableErrors: config.retryableErrors || [
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ECONNREFUSED',
        'VERCEL_DEPLOYMENT_FAILED',
        'GITHUB_API_ERROR',
        'GITLAB_API_ERROR',
        'DOCKER_BUILD_FAILED',
        'DEPENDENCY_INSTALL_FAILED'
      ],
      nonRetryableErrors: config.nonRetryableErrors || [
        'INVALID_CREDENTIALS',
        'PERMISSION_DENIED',
        'INVALID_CONFIGURATION',
        'SECURITY_VIOLATION',
        'RESOURCE_LIMIT_EXCEEDED'
      ],
      circuitBreaker: {
        enabled: config.circuitBreaker?.enabled !== false,
        failureThreshold: config.circuitBreaker?.failureThreshold || 5,
        resetTimeout: config.circuitBreaker?.resetTimeout || 60000, // 1 minute
        monitoringWindow: config.circuitBreaker?.monitoringWindow || 300000 // 5 minutes
      },
      errorAggregation: {
        enabled: config.errorAggregation?.enabled !== false,
        windowSize: config.errorAggregation?.windowSize || 300000, // 5 minutes
        maxAggregatedErrors: config.errorAggregation?.maxAggregatedErrors || 10
      },
      notifications: {
        enabled: config.notifications?.enabled !== false,
        slackWebhook: config.notifications?.slackWebhook || process.env.SLACK_WEBHOOK,
        emailConfig: config.notifications?.emailConfig || null
      },
      storagePath: config.storagePath || path.join(__dirname, '../data/error-handler'),
      ...config
    };

    this.errorHistory = [];
    this.circuitBreakerState = {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: 0,
      lastResetTime: Date.now()
    };
    this.retryQueue = new Map();
    this.errorAggregates = new Map();
    
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
   * Initialize the error handler
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
      this.logger.info('Error handler initialized');
      
      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize error handler', error);
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
      
      this.errorHistory = state.errorHistory || [];
      this.circuitBreakerState = { ...this.circuitBreakerState, ...state.circuitBreakerState };
      this.retryQueue = new Map(state.retryQueue || []);
      this.errorAggregates = new Map(state.errorAggregates || []);
      
      this.logger.debug('Loaded existing error handler state');
    } catch (error) {
      this.logger.warn('Failed to load error handler state, starting fresh', error.message);
    }
  }

  /**
   * Save current state to storage
   */
  async saveState() {
    try {
      const stateFile = path.join(this.config.storagePath, 'state.json');
      const state = {
        errorHistory: this.errorHistory,
        circuitBreakerState: this.circuitBreakerState,
        retryQueue: Array.from(this.retryQueue.entries()),
        errorAggregates: Array.from(this.errorAggregates.entries()),
        timestamp: new Date().toISOString()
      };
      
      await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      this.logger.error('Failed to save error handler state', error);
    }
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanup();
    }, 300000); // 5 minutes
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
   * Classify error type
   */
  classifyError(error) {
    const errorMessage = error.message || error.toString();
    const errorCode = error.code || '';
    
    // Check for non-retryable errors
    for (const nonRetryable of this.config.nonRetryableErrors) {
      if (errorMessage.includes(nonRetryable) || errorCode.includes(nonRetryable)) {
        return {
          type: 'non_retryable',
          category: nonRetryable,
          severity: 'high'
        };
      }
    }
    
    // Check for retryable errors
    for (const retryable of this.config.retryableErrors) {
      if (errorMessage.includes(retryable) || errorCode.includes(retryable)) {
        return {
          type: 'retryable',
          category: retryable,
          severity: 'medium'
        };
      }
    }
    
    // Default classification
    return {
      type: 'unknown',
      category: 'unknown_error',
      severity: 'medium'
    };
  }

  /**
   * Check if circuit breaker is open
   */
  isCircuitBreakerOpen() {
    if (!this.config.circuitBreaker.enabled) {
      return false;
    }
    
    const now = Date.now();
    
    // Check if reset timeout has passed
    if (this.circuitBreakerState.isOpen && 
        now - this.circuitBreakerState.lastFailureTime > this.config.circuitBreaker.resetTimeout) {
      this.resetCircuitBreaker();
      return false;
    }
    
    return this.circuitBreakerState.isOpen;
  }

  /**
   * Update circuit breaker state
   */
  updateCircuitBreaker(error) {
    if (!this.config.circuitBreaker.enabled) {
      return;
    }
    
    const now = Date.now();
    const errorType = this.classifyError(error);
    
    // Only count failures for retryable errors
    if (errorType.type === 'retryable') {
      this.circuitBreakerState.failureCount++;
      this.circuitBreakerState.lastFailureTime = now;
      
      // Check if threshold is reached
      if (this.circuitBreakerState.failureCount >= this.config.circuitBreaker.failureThreshold) {
        this.circuitBreakerState.isOpen = true;
        this.logger.warn('Circuit breaker opened', {
          failureCount: this.circuitBreakerState.failureCount,
          threshold: this.config.circuitBreaker.failureThreshold
        });
        
        this.emit('circuit_breaker_opened', {
          failureCount: this.circuitBreakerState.failureCount,
          lastFailureTime: this.circuitBreakerState.lastFailureTime
        });
      }
    }
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker() {
    this.circuitBreakerState = {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: 0,
      lastResetTime: Date.now()
    };
    
    this.logger.info('Circuit breaker reset');
    this.emit('circuit_breaker_reset');
  }

  /**
   * Record error
   */
  async recordError(error, context = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const errorType = this.classifyError(error);
    const now = Date.now();
    
    const errorRecord = {
      id: this.generateErrorId(),
      timestamp: now,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        type: error.constructor.name
      },
      context,
      classification: errorType,
      retryCount: context.retryCount || 0,
      deploymentId: context.deploymentId,
      source: context.source,
      environment: context.environment
    };
    
    // Add to history
    this.errorHistory.push(errorRecord);
    
    // Limit history size
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-1000);
    }
    
    // Update circuit breaker
    this.updateCircuitBreaker(error);
    
    // Aggregate error
    this.aggregateError(errorRecord);
    
    // Log error
    this.logger.error('Error recorded', {
      id: errorRecord.id,
      type: errorType.type,
      category: errorType.category,
      severity: errorType.severity,
      source: context.source,
      environment: context.environment
    });
    
    // Send notifications
    await this.sendErrorNotification(errorRecord);
    
    // Save state
    await this.saveState();
    
    this.emit('error_recorded', errorRecord);
    
    return errorRecord;
  }

  /**
   * Generate error ID
   */
  generateErrorId() {
    return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Aggregate similar errors
   */
  aggregateError(errorRecord) {
    if (!this.config.errorAggregation.enabled) {
      return;
    }
    
    const key = `${errorRecord.classification.category}_${errorRecord.source}_${errorRecord.environment}`;
    const now = Date.now();
    const windowStart = now - this.config.errorAggregation.windowSize;
    
    if (!this.errorAggregates.has(key)) {
      this.errorAggregates.set(key, {
        key,
        firstOccurrence: now,
        lastOccurrence: now,
        count: 0,
        errors: []
      });
    }
    
    const aggregate = this.errorAggregates.get(key);
    
    // Check if error is within aggregation window
    if (aggregate.lastOccurrence < windowStart) {
      // Reset aggregate
      aggregate.firstOccurrence = now;
      aggregate.lastOccurrence = now;
      aggregate.count = 0;
      aggregate.errors = [];
    }
    
    aggregate.count++;
    aggregate.lastOccurrence = now;
    aggregate.errors.push(errorRecord);
    
    // Limit aggregated errors
    if (aggregate.errors.length > this.config.errorAggregation.maxAggregatedErrors) {
      aggregate.errors = aggregate.errors.slice(-this.config.errorAggregation.maxAggregatedErrors);
    }
    
    // Check if this is a critical error pattern
    if (aggregate.count >= this.config.errorAggregation.maxAggregatedErrors) {
      this.logger.warn('Critical error pattern detected', {
        key,
        count: aggregate.count,
        window: this.config.errorAggregation.windowSize
      });
      
      this.emit('critical_error_pattern', {
        key,
        count: aggregate.count,
        errors: aggregate.errors
      });
    }
  }

  /**
   * Send error notification
   */
  async sendErrorNotification(errorRecord) {
    if (!this.config.notifications.enabled) {
      return;
    }
    
    try {
      // Send Slack notification
      if (this.config.notifications.slackWebhook) {
        await this.sendSlackNotification(errorRecord);
      }
      
      // Send email notification
      if (this.config.notifications.emailConfig) {
        await this.sendEmailNotification(errorRecord);
      }
    } catch (error) {
      this.logger.error('Failed to send error notification', error);
    }
  }

  /**
   * Send Slack notification
   */
  async sendSlackNotification(errorRecord) {
    const { classification, context, error } = errorRecord;
    
    const message = {
      text: '🚨 Deployment Error Detected',
      attachments: [{
        color: classification.severity === 'high' ? 'danger' : 'warning',
        fields: [
          {
            title: 'Error ID',
            value: errorRecord.id,
            short: true
          },
          {
            title: 'Type',
            value: classification.type,
            short: true
          },
          {
            title: 'Category',
            value: classification.category,
            short: true
          },
          {
            title: 'Source',
            value: context.source || 'unknown',
            short: true
          },
          {
            title: 'Environment',
            value: context.environment || 'unknown',
            short: true
          },
          {
            title: 'Retry Count',
            value: errorRecord.retryCount.toString(),
            short: true
          },
          {
            title: 'Timestamp',
            value: new Date(errorRecord.timestamp).toISOString(),
            short: false
          },
          {
            title: 'Error Message',
            value: error.message,
            short: false
          }
        ]
      }]
    };
    
    const response = await fetch(this.config.notifications.slackWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(errorRecord) {
    // Implementation for email notifications
    // This would require an email service configuration
    this.logger.debug('Email notification not implemented');
  }

  /**
   * Should retry operation
   */
  shouldRetry(error, context = {}) {
    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      return false;
    }
    
    // Classify error
    const errorType = this.classifyError(error);
    
    // Non-retryable errors should not be retried
    if (errorType.type === 'non_retryable') {
      return false;
    }
    
    // Check retry count
    if (context.retryCount >= this.config.maxRetries) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(retryCount) {
    const delay = Math.min(
      this.config.baseDelay * Math.pow(2, retryCount),
      this.config.maxDelay
    );
    
    // Add jitter to avoid thundering herd
    const jitter = delay * 0.1 * (Math.random() - 0.5);
    
    return Math.max(delay + jitter, 1000); // Minimum 1 second
  }

  /**
   * Retry operation with exponential backoff
   */
  async retryOperation(operation, context = {}) {
    const { maxRetries = this.config.maxRetries, baseDelay = this.config.baseDelay } = context;
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error;
        
        // Record error
        await this.recordError(error, {
          ...context,
          retryCount: attempt
        });
        
        // Check if we should retry
        if (!this.shouldRetry(error, { ...context, retryCount: attempt })) {
          break;
        }
        
        // Calculate delay
        const delay = this.calculateRetryDelay(attempt);
        
        this.logger.info(`Operation failed, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries,
          error: error.message
        });
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Execute operation with error handling
   */
  async executeWithHandling(operation, context = {}) {
    try {
      return await operation();
    } catch (error) {
      // Record error
      await this.recordError(error, context);
      
      // Check if we should retry
      if (this.shouldRetry(error, context)) {
        return this.retryOperation(operation, context);
      }
      
      // Re-throw non-retryable errors
      throw error;
    }
  }

  /**
   * Get error history
   */
  getErrorHistory(filters = {}) {
    let history = [...this.errorHistory];
    
    if (filters.source) {
      history = history.filter(h => h.source === filters.source);
    }
    
    if (filters.environment) {
      history = history.filter(h => h.environment === filters.environment);
    }
    
    if (filters.type) {
      history = history.filter(h => h.classification.type === filters.type);
    }
    
    if (filters.category) {
      history = history.filter(h => h.classification.category === filters.category);
    }
    
    if (filters.severity) {
      history = history.filter(h => h.classification.severity === filters.severity);
    }
    
    if (filters.limit) {
      history = history.slice(-filters.limit);
    }
    
    return history.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get error aggregates
   */
  getErrorAggregates() {
    return Array.from(this.errorAggregates.values()).sort((a, b) => b.lastOccurrence - a.lastOccurrence);
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    return {
      isOpen: this.circuitBreakerState.isOpen,
      failureCount: this.circuitBreakerState.failureCount,
      lastFailureTime: this.circuitBreakerState.lastFailureTime,
      lastResetTime: this.circuitBreakerState.lastResetTime,
      resetTimeout: this.config.circuitBreaker.resetTimeout
    };
  }

  /**
   * Reset error aggregates
   */
  resetErrorAggregates() {
    this.errorAggregates.clear();
    this.logger.info('Error aggregates reset');
    this.emit('error_aggregates_reset');
  }

  /**
   * Cleanup old errors and aggregates
   */
  async cleanup() {
    const now = Date.now();
    const cutoffTime = now - this.config.errorAggregation.windowSize;
    
    try {
      // Clean up old error history
      const initialHistorySize = this.errorHistory.length;
      this.errorHistory = this.errorHistory.filter(h => h.timestamp > cutoffTime);
      
      // Clean up old aggregates
      const initialAggregatesSize = this.errorAggregates.size;
      for (const [key, aggregate] of this.errorAggregates) {
        if (aggregate.lastOccurrence < cutoffTime) {
          this.errorAggregates.delete(key);
        }
      }
      
      if (this.errorHistory.length < initialHistorySize || this.errorAggregates.size < initialAggregatesSize) {
        this.logger.info('Cleaned up old error data', {
          history: initialHistorySize - this.errorHistory.length,
          aggregates: initialAggregatesSize - this.errorAggregates.size
        });
      }
      
      // Save state
      await this.saveState();
      
      this.emit('cleanup', {
        cleanedHistory: initialHistorySize - this.errorHistory.length,
        cleanedAggregates: initialAggregatesSize - this.errorAggregates.size
      });
    } catch (error) {
      this.logger.error('Cleanup failed', error);
    }
  }

  /**
   * Shutdown the error handler
   */
  async shutdown() {
    this.logger.info('Shutting down error handler');
    
    // Stop cleanup timer
    this.stopCleanupTimer();
    
    // Save final state
    await this.saveState();
    
    this.initialized = false;
    this.logger.info('Error handler shutdown complete');
    
    this.emit('shutdown');
  }
}

// Helper functions for common error scenarios
class ErrorHelper {
  constructor(errorHandler) {
    this.errorHandler = errorHandler;
  }

  /**
   * Handle deployment error
   */
  async handleDeploymentError(error, deployment) {
    const context = {
      source: deployment.source,
      environment: deployment.environment,
      deploymentId: deployment.id,
      prNumber: deployment.prNumber,
      branch: deployment.branch
    };
    
    const errorRecord = await this.errorHandler.recordError(error, context);
    
    // Return error record with recovery suggestions
    return {
      ...errorRecord,
      recoverySuggestions: this.getRecoverySuggestions(error, deployment)
    };
  }

  /**
   * Get recovery suggestions for error
   */
  getRecoverySuggestions(error, deployment) {
    const errorType = this.errorHandler.classifyError(error);
    const suggestions = [];
    
    switch (errorType.category) {
      case 'VERCEL_DEPLOYMENT_FAILED':
        suggestions.push('Check Vercel build logs for specific errors');
        suggestions.push('Verify environment variables are set correctly');
        suggestions.push('Check for syntax errors in the code');
        break;
        
      case 'GITHUB_API_ERROR':
        suggestions.push('Check GitHub API rate limits');
        suggestions.push('Verify GitHub token permissions');
        suggestions.push('Check repository access');
        break;
        
      case 'GITLAB_API_ERROR':
        suggestions.push('Check GitLab API rate limits');
        suggestions.push('Verify GitLab token permissions');
        suggestions.push('Check project access');
        break;
        
      case 'DOCKER_BUILD_FAILED':
        suggestions.push('Check Docker build logs');
        suggestions.push('Verify Dockerfile syntax');
        suggestions.push('Check base image availability');
        break;
        
      case 'DEPENDENCY_INSTALL_FAILED':
        suggestions.push('Clear npm cache and try again');
        suggestions.push('Check package.json syntax');
        suggestions.push('Verify Node.js version compatibility');
        break;
        
      default:
        suggestions.push('Check deployment logs for more details');
        suggestions.push('Verify all prerequisites are met');
        break;
    }
    
    return suggestions;
  }

  /**
   * Handle retryable deployment
   */
  async handleRetryableDeployment(deployment, operation) {
    const context = {
      source: deployment.source,
      environment: deployment.environment,
      deploymentId: deployment.id,
      prNumber: deployment.prNumber,
      branch: deployment.branch
    };
    
    return this.errorHandler.retryOperation(operation, {
      ...context,
      maxRetries: this.errorHandler.config.maxRetries,
      baseDelay: this.errorHandler.config.baseDelay
    });
  }
}

// Main execution
if (require.main === module) {
  const config = {
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    baseDelay: parseInt(process.env.BASE_DELAY) || 5000,
    maxDelay: parseInt(process.env.MAX_DELAY) || 300000,
    retryableErrors: process.env.RETRYABLE_ERRORS?.split(',') || [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'VERCEL_DEPLOYMENT_FAILED',
      'GITHUB_API_ERROR',
      'GITLAB_API_ERROR'
    ],
    nonRetryableErrors: process.env.NON_RETRYABLE_ERRORS?.split(',') || [
      'INVALID_CREDENTIALS',
      'PERMISSION_DENIED',
      'INVALID_CONFIGURATION',
      'SECURITY_VIOLATION'
    ],
    circuitBreaker: {
      enabled: process.env.CIRCUIT_BREAKER_ENABLED !== 'false',
      failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD) || 5,
      resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT) || 60000
    },
    notifications: {
      enabled: process.env.NOTIFICATIONS_ENABLED !== 'false',
      slackWebhook: process.env.SLACK_WEBHOOK
    },
    debug: process.env.DEBUG === 'true'
  };
  
  const errorHandler = new ErrorHandler(config);
  const errorHelper = new ErrorHelper(errorHandler);
  
  // Handle command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--status')) {
    errorHandler.initialize().then(() => {
      console.log(JSON.stringify({
        circuitBreaker: errorHandler.getCircuitBreakerStatus(),
        errorHistory: errorHandler.getErrorHistory().length,
        errorAggregates: errorHandler.getErrorAggregates().length
      }, null, 2));
      process.exit(0);
    }).catch(error => {
      console.error('Failed to get status:', error);
      process.exit(1);
    });
  } else if (args.includes('--reset-circuit-breaker')) {
    errorHandler.initialize().then(() => {
      errorHandler.resetCircuitBreaker();
      console.log('Circuit breaker reset');
      process.exit(0);
    }).catch(error => {
      console.error('Failed to reset circuit breaker:', error);
      process.exit(1);
    });
  } else if (args.includes('--reset-aggregates')) {
    errorHandler.initialize().then(() => {
      errorHandler.resetErrorAggregates();
      console.log('Error aggregates reset');
      process.exit(0);
    }).catch(error => {
      console.error('Failed to reset error aggregates:', error);
      process.exit(1);
    });
  } else if (args.includes('--test-error')) {
    errorHandler.initialize().then(() => {
      const testError = new Error('Test error for error handling system');
      testError.code = 'TEST_ERROR';
      
      return errorHandler.recordError(testError, {
        source: 'test',
        environment: 'test',
        deploymentId: 'test-deployment'
      });
    }).then(errorRecord => {
      console.log('Test error recorded:', errorRecord.id);
      process.exit(0);
    }).catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
  } else {
    console.log('Usage:');
    console.log('  node error-handler.js --status');
    console.log('  node error-handler.js --reset-circuit-breaker');
    console.log('  node error-handler.js --reset-aggregates');
    console.log('  node error-handler.js --test-error');
    process.exit(1);
  }
}

module.exports = { ErrorHandler, ErrorHelper };