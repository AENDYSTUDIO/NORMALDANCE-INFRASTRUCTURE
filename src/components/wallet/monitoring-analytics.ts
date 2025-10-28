import { logger } from "@/lib/utils/logger";
import { InvisibleWalletConfig } from "./invisible-wallet-adapter";

/**
 * Тип события для аналитики
 */
export type AnalyticsEventType =
  | "wallet_connect"
  | "wallet_disconnect"
  | "transaction_created"
  | "transaction_sent"
  | "transaction_confirmed"
  | "transaction_failed"
  | "balance_change"
  | "error"
  | "security_event"
  | "migration_started"
  | "migration_completed"
  | "biometric_auth"
  | "social_recovery_setup";

/**
 * Данные события аналитики
 */
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  data: Record<string, any>;
  metadata: {
    userAgent: string;
    platform: string;
    version: string;
    network: string;
  };
}

/**
 * Метрики производительности
 */
export interface PerformanceMetrics {
  transactionTime: number;
  confirmationTime: number;
  balanceUpdateTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
}

/**
 * Данные об ошибке
 */
export interface ErrorData {
  type: string;
  message: string;
  stack?: string;
  context: Record<string, any>;
  userId?: string;
  timestamp: number;
  severity: "low" | "medium" | "high" | "critical";
}

/**
 * Метрики использования
 */
export interface UsageMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  totalTransactions: number;
  totalVolume: number;
  averageTransactionSize: number;
  topTokens: Array<{ symbol: string; volume: number }>;
  errorRate: number;
  successRate: number;
}

/**
 * Система мониторинга и аналитики для невидимого кошелька
 *
 * Ответственности:
 * - Сбор событий и метрик
 * - Отправка данных в аналитику
 * - Мониторинг производительности
 * - Отслеживание ошибок
 * - Генерация отчетов
 */
export class MonitoringAnalytics {
  private _config: InvisibleWalletConfig;
  private _eventQueue: AnalyticsEvent[] = [];
  private _performanceMetrics: PerformanceMetrics;
  private _isOnline: boolean = true;
  private _sessionId: string;
  private _userId?: string;
  private _batchSize: number = 50;
  private _batchTimeout: number = 30000; // 30 секунд
  private _batchTimer: NodeJS.Timeout | null = null;

  constructor(config: InvisibleWalletConfig) {
    this._config = config;
    this._sessionId = this._generateSessionId();
    this._userId = config.telegramUserId;
    this._performanceMetrics = this._initializePerformanceMetrics();
    this._setupNetworkListeners();
    this._startBatchProcessor();
  }

  /**
   * Отслеживание события
   */
  trackEvent(type: AnalyticsEventType, data: Record<string, any> = {}): void {
    try {
      const event: AnalyticsEvent = {
        type,
        timestamp: Date.now(),
        userId: this._userId,
        sessionId: this._sessionId,
        data,
        metadata: this._getEventMetadata(),
      };

      this._eventQueue.push(event);

      // Немедленная отправка критических событий
      if (this._isCriticalEvent(type)) {
        this._sendImmediateEvent(event);
      }

      logger.debug("Event tracked", { type, data });
    } catch (error) {
      logger.error("Failed to track event", error);
    }
  }

  /**
   * Отслеживание транзакции
   */
  trackTransaction(
    transactionId: string,
    type: "created" | "sent" | "confirmed" | "failed",
    data: Record<string, any> = {}
  ): void {
    const eventType = `transaction_${type}` as AnalyticsEventType;

    this.trackEvent(eventType, {
      transactionId,
      ...data,
    });
  }

  /**
   * Отслеживание ошибки
   */
  trackError(
    error: Error,
    context: Record<string, any> = {},
    severity: "low" | "medium" | "high" | "critical" = "medium"
  ): void {
    const errorData: ErrorData = {
      type: error.name || "Unknown",
      message: error.message,
      stack: error.stack,
      context,
      userId: this._userId,
      timestamp: Date.now(),
      severity,
    };

    this.trackEvent("error", errorData);

    // Дополнительное логирование критических ошибок
    if (severity === "critical") {
      logger.error("Critical error occurred", errorData);
    }
  }

  /**
   * Отслеживание производительности
   */
  trackPerformance(metric: keyof PerformanceMetrics, value: number): void {
    this._performanceMetrics[metric] = value;

    this.trackEvent("performance", {
      metric,
      value,
      allMetrics: this._performanceMetrics,
    });
  }

  /**
   * Отслеживание безопасности
   */
  trackSecurityEvent(
    eventType: string,
    severity: "low" | "medium" | "high" | "critical",
    data: Record<string, any> = {}
  ): void {
    this.trackEvent("security_event", {
      eventType,
      severity,
      ...data,
    });
  }

  /**
   * Отслеживание пользовательского поведения
   */
  trackUserAction(action: string, data: Record<string, any> = {}): void {
    this.trackEvent("user_action", {
      action,
      ...data,
    });
  }

  /**
   * Получение метрик использования
   */
  async getUsageMetrics(
    period: "day" | "week" | "month" = "day"
  ): Promise<UsageMetrics> {
    try {
      // В реальной реализации здесь должен быть запрос к аналитическому API
      const mockMetrics: UsageMetrics = {
        dailyActiveUsers: 1000,
        weeklyActiveUsers: 5000,
        monthlyActiveUsers: 20000,
        totalTransactions: 50000,
        totalVolume: 1000000,
        averageTransactionSize: 20,
        topTokens: [
          { symbol: "NDT", volume: 500000 },
          { symbol: "SOL", volume: 300000 },
          { symbol: "USDC", volume: 200000 },
        ],
        errorRate: 0.02,
        successRate: 0.98,
      };

      return mockMetrics;
    } catch (error) {
      logger.error("Failed to get usage metrics", error);
      throw error;
    }
  }

  /**
   * Получение отчета о производительности
   */
  getPerformanceReport(): {
    metrics: PerformanceMetrics;
    health: "excellent" | "good" | "poor" | "critical";
    recommendations: string[];
  } {
    const metrics = this._performanceMetrics;
    const health = this._calculateHealthScore(metrics);
    const recommendations = this._generatePerformanceRecommendations(metrics);

    return {
      metrics,
      health,
      recommendations,
    };
  }

  /**
   * Создание отчета об ошибках
   */
  async getErrorReport(period: "hour" | "day" | "week" = "day"): Promise<{
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    topErrors: ErrorData[];
  }> {
    try {
      // В реальной реализации здесь должен быть запрос к аналитическому API
      const mockReport = {
        totalErrors: 50,
        errorsByType: {
          NetworkError: 20,
          ValidationError: 15,
          TimeoutError: 10,
          SecurityError: 5,
        },
        errorsBySeverity: {
          low: 10,
          medium: 25,
          high: 12,
          critical: 3,
        },
        topErrors: [
          {
            type: "NetworkError",
            message: "Connection timeout",
            context: { endpoint: "solana-rpc" },
            timestamp: Date.now() - 3600000,
            severity: "medium",
          },
        ],
      };

      return mockReport;
    } catch (error) {
      logger.error("Failed to get error report", error);
      throw error;
    }
  }

  /**
   * Отправка событий пачкой
   */
  async flushEvents(): Promise<void> {
    if (this._eventQueue.length === 0) {
      return;
    }

    try {
      const eventsToSend = this._eventQueue.splice(0, this._batchSize);

      await this._sendEventsBatch(eventsToSend);

      logger.debug("Events batch sent", { count: eventsToSend.length });
    } catch (error) {
      logger.error("Failed to send events batch", error);

      // Возвращаем события в очередь при ошибке
      this._eventQueue.unshift(...eventsToSend);
    }
  }

  /**
   * Очистка данных
   */
  clearData(): void {
    this._eventQueue = [];
    this._performanceMetrics = this._initializePerformanceMetrics();

    logger.info("Monitoring data cleared");
  }

  /**
   * Получение статистики в реальном времени
   */
  getRealTimeStats(): {
    activeUsers: number;
    pendingTransactions: number;
    networkStatus: "online" | "offline" | "degraded";
    averageResponseTime: number;
  } {
    return {
      activeUsers: 150,
      pendingTransactions: 25,
      networkStatus: this._isOnline ? "online" : "offline",
      averageResponseTime: this._performanceMetrics.apiResponseTime,
    };
  }

  // Приватные методы

  private _initializePerformanceMetrics(): PerformanceMetrics {
    return {
      transactionTime: 0,
      confirmationTime: 0,
      balanceUpdateTime: 0,
      apiResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: 0,
    };
  }

  private _setupNetworkListeners(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this._isOnline = true;
        this.trackEvent("network_status_change", { status: "online" });
      });

      window.addEventListener("offline", () => {
        this._isOnline = false;
        this.trackEvent("network_status_change", { status: "offline" });
      });

      this._isOnline = navigator.onLine;
    }
  }

  private _startBatchProcessor(): void {
    if (this._batchTimer) {
      clearInterval(this._batchTimer);
    }

    this._batchTimer = setInterval(() => {
      this.flushEvents();
    }, this._batchTimeout);
  }

  private _getEventMetadata(): AnalyticsEvent["metadata"] {
    return {
      userAgent: navigator.userAgent,
      platform: this._detectPlatform(),
      version: "1.0.0", // Версия кошелька
      network: this._isOnline ? "online" : "offline",
    };
  }

  private _isCriticalEvent(type: AnalyticsEventType): boolean {
    const criticalEvents = ["error", "security_event", "transaction_failed"];

    return criticalEvents.includes(type);
  }

  private async _sendImmediateEvent(event: AnalyticsEvent): Promise<void> {
    try {
      if (this._config.analyticsEndpoint) {
        await fetch(`${this._config.analyticsEndpoint}/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([event]),
        });
      }
    } catch (error) {
      logger.error("Failed to send immediate event", error);
    }
  }

  private async _sendEventsBatch(events: AnalyticsEvent[]): Promise<void> {
    if (!this._config.analyticsEndpoint || events.length === 0) {
      return;
    }

    try {
      const response = await fetch(
        `${this._config.analyticsEndpoint}/events/batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            events,
            sessionId: this._sessionId,
            userId: this._userId,
            timestamp: Date.now(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      logger.error("Failed to send events batch", error);
      throw error;
    }
  }

  private _calculateHealthScore(
    metrics: PerformanceMetrics
  ): "excellent" | "good" | "poor" | "critical" {
    let score = 100;

    // Время транзакции
    if (metrics.transactionTime > 5000) score -= 20;
    else if (metrics.transactionTime > 2000) score -= 10;

    // Время подтверждения
    if (metrics.confirmationTime > 60000) score -= 20;
    else if (metrics.confirmationTime > 30000) score -= 10;

    // Время ответа API
    if (metrics.apiResponseTime > 1000) score -= 15;
    else if (metrics.apiResponseTime > 500) score -= 5;

    // Использование памяти
    if (metrics.memoryUsage > 80) score -= 15;
    else if (metrics.memoryUsage > 60) score -= 5;

    if (score >= 90) return "excellent";
    if (score >= 70) return "good";
    if (score >= 50) return "poor";
    return "critical";
  }

  private _generatePerformanceRecommendations(
    metrics: PerformanceMetrics
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.transactionTime > 2000) {
      recommendations.push("Оптимизируйте время обработки транзакций");
    }

    if (metrics.confirmationTime > 30000) {
      recommendations.push("Рассмотрите использование более быстрой сети");
    }

    if (metrics.apiResponseTime > 500) {
      recommendations.push("Оптимизируйте производительность API");
    }

    if (metrics.memoryUsage > 60) {
      recommendations.push("Оптимизируйте использование памяти");
    }

    if (metrics.networkLatency > 1000) {
      recommendations.push("Проверьте сетевое соединение");
    }

    return recommendations;
  }

  private _detectPlatform(): string {
    const userAgent = navigator.userAgent;

    if (userAgent.includes("Telegram")) return "telegram";
    if (userAgent.includes("Mobile")) return "mobile";
    if (userAgent.includes("Tablet")) return "tablet";
    if (userAgent.includes("Windows")) return "desktop";
    if (userAgent.includes("Mac")) return "desktop";
    if (userAgent.includes("Linux")) return "desktop";

    return "unknown";
  }

  private _generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Утилиты для мониторинга и аналитики
 */
export class MonitoringUtils {
  /**
   * Создание дашборда метрик
   */
  static createDashboard(metrics: UsageMetrics): {
    overview: Record<string, any>;
    charts: Record<string, any>;
    alerts: Array<{ type: string; message: string; severity: string }>;
  } {
    const alerts = [];

    if (metrics.errorRate > 0.05) {
      alerts.push({
        type: "high_error_rate",
        message: "Высокий уровень ошибок",
        severity: "warning",
      });
    }

    if (metrics.successRate < 0.95) {
      alerts.push({
        type: "low_success_rate",
        message: "Низкий уровень успешности транзакций",
        severity: "error",
      });
    }

    return {
      overview: {
        totalUsers: metrics.monthlyActiveUsers,
        totalTransactions: metrics.totalTransactions,
        totalVolume: metrics.totalVolume,
        averageTransactionSize: metrics.averageTransactionSize,
        errorRate: metrics.errorRate,
        successRate: metrics.successRate,
      },
      charts: {
        transactions: {
          labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
          data: [100, 150, 120, 180, 200, 160, 140],
        },
        volume: {
          labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
          data: [10000, 15000, 12000, 18000, 20000, 16000, 14000],
        },
        tokens: metrics.topTokens,
      },
      alerts,
    };
  }

  /**
   * Расчет метрик производительности
   */
  static calculatePerformanceMetrics(
    events: AnalyticsEvent[]
  ): PerformanceMetrics {
    const transactionEvents = events.filter(
      (e) => e.type === "transaction_sent" || e.type === "transaction_confirmed"
    );

    const performanceEvents = events.filter((e) => e.type === "performance");

    // Среднее время транзакции
    const transactionTimes = transactionEvents
      .filter((e) => e.data.transactionTime)
      .map((e) => e.data.transactionTime);

    const avgTransactionTime =
      transactionTimes.length > 0
        ? transactionTimes.reduce((a, b) => a + b, 0) / transactionTimes.length
        : 0;

    // Среднее время подтверждения
    const confirmationTimes = transactionEvents
      .filter((e) => e.data.confirmationTime)
      .map((e) => e.data.confirmationTime);

    const avgConfirmationTime =
      confirmationTimes.length > 0
        ? confirmationTimes.reduce((a, b) => a + b, 0) /
          confirmationTimes.length
        : 0;

    // Среднее время ответа API
    const apiResponseTimes = performanceEvents
      .filter((e) => e.data.metric === "apiResponseTime")
      .map((e) => e.data.value);

    const avgApiResponseTime =
      apiResponseTimes.length > 0
        ? apiResponseTimes.reduce((a, b) => a + b, 0) / apiResponseTimes.length
        : 0;

    return {
      transactionTime: avgTransactionTime,
      confirmationTime: avgConfirmationTime,
      balanceUpdateTime: 0,
      apiResponseTime: avgApiResponseTime,
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: 0,
    };
  }

  /**
   * Генерация отчета
   */
  static generateReport(
    events: AnalyticsEvent[],
    period: "day" | "week" | "month"
  ): string {
    const report = {
      period,
      generatedAt: new Date().toISOString(),
      totalEvents: events.length,
      eventsByType: this._groupEventsByType(events),
      performanceMetrics: this.calculatePerformanceMetrics(events),
      topErrors: this._getTopErrors(events),
    };

    return JSON.stringify(report, null, 2);
  }

  private static _groupEventsByType(
    events: AnalyticsEvent[]
  ): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const event of events) {
      grouped[event.type] = (grouped[event.type] || 0) + 1;
    }

    return grouped;
  }

  private static _getTopErrors(events: AnalyticsEvent[]): ErrorData[] {
    const errorEvents = events
      .filter((e) => e.type === "error")
      .map((e) => e.data as ErrorData);

    return errorEvents.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  }
}
