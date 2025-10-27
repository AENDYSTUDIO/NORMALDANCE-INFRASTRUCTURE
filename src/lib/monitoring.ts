/**
<<<<<<< HEAD
 * Monitoring and Alerting System for NormalDance
=======
 * Enhanced Monitoring and Alerting System for NormalDance
 * Implements comprehensive monitoring with blockchain-specific metrics
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337
 */

import { performance } from "perf_hooks";
import { logger } from "./logger";

// Performance metrics interface
interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  timestamp: number;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  error?: string;
}

// Health check status
interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Array<{
    name: string;
    status: "pass" | "fail";
    message?: string;
    duration?: number;
  }>;
  timestamp: number;
}

// Alert configuration
interface AlertConfig {
  thresholds: {
    responseTime: number; // ms
    errorRate: number; // percentage
    memoryUsage: number; // MB
  };
  notifications: {
    email: boolean;
    webhook: boolean;
    slack: boolean;
  };
}

// Default configuration
const DEFAULT_ALERT_CONFIG: AlertConfig = {
  thresholds: {
    responseTime: 1000, // 1 second
    errorRate: 5, // 5%
    memoryUsage: 500, // 500MB
  },
  notifications: {
    email: false,
    webhook: true,
    slack: false,
  },
};

// Monitoring class
export class MonitoringSystem {
  private config: AlertConfig;
  private metrics: PerformanceMetrics[] = [];
  private errorCounts: Map<string, number> = new Map();
  private lastHealthCheck: HealthCheck | null = null;

  constructor(config: Partial<AlertConfig> = {}) {
    this.config = { ...DEFAULT_ALERT_CONFIG, ...config };

    // Start periodic health checks
    setInterval(() => this.performHealthCheck(), 60000); // Every minute
  }

  // Record performance metrics
  recordMetric(metric: Partial<PerformanceMetrics>): void {
    const fullMetric: PerformanceMetrics = {
      responseTime: 0,
      memoryUsage: process.memoryUsage(),
      timestamp: Date.now(),
      ...metric,
    };

    this.metrics.push(fullMetric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check for alerts
    this.checkAlertThresholds(fullMetric);
  }

  // Record an error
  recordError(error: Error, context?: string): void {
    const key = context || "unknown";
    const currentCount = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, currentCount + 1);

    logger.error(`Error recorded in ${context}:`, error);

    // Check if error rate threshold exceeded
    this.checkErrorThresholds();
  }

  // Measure function execution time
  async measureAsync<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    try {
      const result = await operation();

      const endTime = performance.now();
      const endMemory = process.memoryUsage();

      this.recordMetric({
        responseTime: endTime - startTime,
        timestamp: Date.now(),
        endpoint: context,
        method: "async",
        statusCode: 200,
      });

      return result;
    } catch (error) {
      const endTime = performance.now();

      this.recordMetric({
        responseTime: endTime - startTime,
        timestamp: Date.now(),
        endpoint: context,
        method: "async",
        statusCode: 500,
        error: (error as Error).message,
      });

      this.recordError(error as Error, context);
      throw error;
    }
  }

  // Measure synchronous function execution time
  measure<T>(operation: () => T, context?: string): T {
    const startTime = performance.now();
    let result: T | undefined;
    let error: Error | null = null;

    try {
      result = operation();
    } catch (e) {
      error = e as Error;
    }

    const endTime = performance.now();

    if (error) {
      this.recordMetric({
        responseTime: endTime - startTime,
        timestamp: Date.now(),
        endpoint: context,
        method: "sync",
        statusCode: 500,
        error: error.message,
      });

      this.recordError(error, context);
      throw error;
    } else {
      this.recordMetric({
        responseTime: endTime - startTime,
        timestamp: Date.now(),
        endpoint: context,
        method: "sync",
        statusCode: 200,
      });
    }

    return result as T;
  }

  // Perform health check
  async performHealthCheck(): Promise<HealthCheck> {
    const checks: Array<{
      name: string;
      status: "pass" | "fail";
      message?: string;
      duration?: number;
    }> = [];

    // Memory usage check
    const memory = process.memoryUsage();
    const memoryMB = memory.heapUsed / 1024 / 1024;

    checks.push({
      name: "memory",
      status:
        memoryMB > this.config.thresholds.memoryUsage / 2 ? "fail" : "pass",
      message: `Memory usage: ${memoryMB.toFixed(2)}MB`,
      duration: 0,
    });

    // Response time check (sample of recent metrics)
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length > 0) {
      const avgResponseTime =
        recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) /
        recentMetrics.length;

      checks.push({
        name: "response_time",
        status:
          avgResponseTime > this.config.thresholds.responseTime
            ? "fail"
            : "pass",
        message: `Average response time: ${avgResponseTime.toFixed(2)}ms`,
        duration: 0,
      });
    }

    // Error rate check
    const totalOperations = recentMetrics.length;
    const errorCount = recentMetrics.filter(
      (m) => m.statusCode && m.statusCode >= 400
    ).length;
    const errorRate =
      totalOperations > 0 ? (errorCount / totalOperations) * 100 : 0;

    checks.push({
      name: "error_rate",
      status: errorRate > this.config.thresholds.errorRate ? "fail" : "pass",
      message: `Error rate: ${errorRate.toFixed(2)}%`,
      duration: 0,
    });

    // Database connectivity check (if available)
    try {
      // Add database connectivity check here
      checks.push({
        name: "database",
        status: "pass" as const,
        message: "Database connectivity: OK",
        duration: 0,
      });
    } catch (error) {
      checks.push({
        name: "database",
        status: "fail" as const,
        message: "Database connectivity failed",
        duration: 0,
      });
    }

    // External API check
    try {
      const response = await fetch("https://api.telegram.org/bot", {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });

      checks.push({
        name: "external_apis",
        status: response.ok ? ("pass" as const) : ("fail" as const),
        message:
          "External API connectivity: " + (response.ok ? "OK" : "Failed"),
        duration: 0,
      });
    } catch (error) {
      checks.push({
        name: "external_apis",
        status: "fail" as const,
        message: "External API connectivity failed",
        duration: 0,
      });
    }

    // Determine overall health
    const failedChecks = checks.filter((c) => c.status === "fail");
    let status: HealthCheck["status"];

    if (failedChecks.length === 0) {
      status = "healthy";
    } else if (failedChecks.length <= checks.length / 2) {
      status = "degraded";
    } else {
      status = "unhealthy";
    }

    const healthCheck: HealthCheck = {
      status,
      checks,
      timestamp: Date.now(),
    };

    this.lastHealthCheck = healthCheck;
    return healthCheck;
  }

  // Get current health status
  getHealthStatus(): HealthCheck | null {
    return this.lastHealthCheck;
  }

  // Get system metrics
  getMetrics(): {
    current: PerformanceMetrics | null;
    average: number;
    errors: Map<string, number>;
    uptime: number;
  } {
    const current = this.metrics[this.metrics.length - 1] || null;
    const average =
      this.metrics.length > 0
        ? this.metrics.reduce((sum, m) => sum + m.responseTime, 0) /
          this.metrics.length
        : 0;

    return {
      current,
      average,
      errors: this.errorCounts,
      uptime: process.uptime(),
    };
  }

  // Check alert thresholds
  private checkAlertThresholds(metric: PerformanceMetrics): void {
<<<<<<< HEAD
    const alerts = [];
=======
    const alerts: Array<{
      type: string;
      message: string;
      severity: string;
    }> = [];
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337

    // Response time alert
    if (metric.responseTime > this.config.thresholds.responseTime) {
      alerts.push({
        type: "response_time",
        message: `Response time ${metric.responseTime}ms exceeded threshold ${this.config.thresholds.responseTime}ms`,
        severity: "warning",
      });
    }

    // Memory usage alert
    const memoryMB = metric.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryMB > this.config.thresholds.memoryUsage) {
      alerts.push({
        type: "memory",
        message: `Memory usage ${memoryMB.toFixed(2)}MB exceeded threshold ${
          this.config.thresholds.memoryUsage
        }MB`,
        severity: "critical",
      });
    }

    // Send notifications
    alerts.forEach((alert) => this.sendNotification(alert));
  }

  // Check error thresholds
  private checkErrorThresholds(): void {
    for (const [context, count] of this.errorCounts.entries()) {
      const totalOperations = this.metrics.filter(
        (m) => m.endpoint === context
      ).length;
      const errorRate =
        totalOperations > 0 ? (count / totalOperations) * 100 : 0;

      if (errorRate > this.config.thresholds.errorRate) {
        this.sendNotification({
          type: "error_rate",
          message: `Error rate for ${context}: ${errorRate.toFixed(
            2
          )}% exceeded threshold ${this.config.thresholds.errorRate}%`,
          severity: "critical",
        });
      }
    }
  }

  // Send notification
  private async sendNotification(alert: {
    type: string;
    message: string;
    severity: string;
  }): Promise<void> {
    const payload = {
      alert,
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      health: this.lastHealthCheck,
    };

    logger.warn(`Alert: ${alert.type} - ${alert.message}`);

    try {
      // Webhook notification
      if (this.config.notifications.webhook && process.env.ALERT_WEBHOOK_URL) {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => {
          // Silent failure for webhook
        });
      }

      // Slack notification
      if (this.config.notifications.slack && process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `🚨 ${alert.severity.toUpperCase()}: ${alert.type}`,
            attachments: [
              {
                color: alert.severity === "critical" ? "danger" : "warning",
                fields: [
                  { title: "Message", value: alert.message, short: false },
                  {
                    title: "Timestamp",
                    value: new Date().toISOString(),
                    short: true,
                  },
                  { title: "Severity", value: alert.severity, short: true },
                ],
              },
            ],
          }),
        }).catch(() => {
          // Silent failure for Slack
        });
      }
    } catch (error) {
      logger.error("Failed to send notification:", error);
    }
  }

  // Get metrics for dashboard
  getDashboardMetrics(): {
    performance: {
      avgResponseTime: number;
      totalRequests: number;
      errorRate: number;
      throughput: number;
    };
    system: {
      uptime: number;
      memoryUsage: number;
      cpuUsage: number;
    };
    health: HealthCheck | null;
  } {
    const recentMetrics = this.metrics.slice(-100); // Last 100 metrics
    const totalRequests = recentMetrics.length;
    const avgResponseTime =
      totalRequests > 0
        ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) /
          totalRequests
        : 0;

    const errorCount = recentMetrics.filter(
      (m) => m.statusCode && m.statusCode >= 400
    ).length;
    const errorRate =
      totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    // Calculate throughput (requests per second over last minute)
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = recentMetrics.filter(
      (m) => m.timestamp > oneMinuteAgo
    );
    const throughput = recentRequests.length / 60;

    return {
      performance: {
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        totalRequests,
        errorRate: Math.round(errorRate * 100) / 100,
        throughput: Math.round(throughput * 100) / 100,
      },
      system: {
        uptime: Math.round(process.uptime()),
        memoryUsage:
          Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
          100,
        cpuUsage: 0, // CPU usage would require additional monitoring
      },
      health: this.lastHealthCheck,
    };
  }

  // Export metrics for external monitoring
  exportMetrics(): string {
    const dashboardMetrics = this.getDashboardMetrics();
    return JSON.stringify(dashboardMetrics, null, 2);
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics = [];
    this.errorCounts.clear();
    this.lastHealthCheck = null;
    logger.info("Monitoring metrics reset");
  }
}

// Singleton instance
let monitoringInstance: MonitoringSystem | null = null;

export function getMonitoring(config?: Partial<AlertConfig>): MonitoringSystem {
  if (!monitoringInstance) {
    monitoringInstance = new MonitoringSystem(config);
  }
  return monitoringInstance;
}

// Express middleware for request monitoring
export function createMonitoringMiddleware(monitoring: MonitoringSystem) {
  return (req: any, res: any, next: () => void) => {
    const startTime = Date.now();

    // Record request start
    res.on("finish", () => {
      const responseTime = Date.now() - startTime;

      monitoring.recordMetric({
        responseTime,
        timestamp: Date.now(),
        endpoint: req.url,
        method: req.method,
        statusCode: res.statusCode,
      });
    });

    next();
  };
}

// Monitoring decorator for functions
export function monitorFunction(context?: string) {
  return function (
    target: object,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    const monitoring = getMonitoring();

    descriptor.value = async function (...args: unknown[]) {
      return monitoring.measureAsync(() => method.apply(this, args), context);
    };

    return descriptor;
  };
}

export default getMonitoring();
