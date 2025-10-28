import {
  SecurityManager,
  SecurityConfig,
  SecurityAlert,
  AnomalyDetection,
  StorageAdapter,
  InvisibleWalletError,
  SecurityError
} from "@/types/wallet";
import { Transaction } from "@solana/web3.js";
import { CryptoUtils, StorageUtils, DeviceUtils, TelegramUtils, ErrorUtils } from "./utils";
import { logger } from "@/lib/utils/logger";

/**
 * Типы событий безопасности
 */
export enum SecurityEventType {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  TRANSACTION_CREATED = 'transaction_created',
  TRANSACTION_SENT = 'transaction_sent',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DEVICE_CHANGE = 'device_change',
  LOCATION_CHANGE = 'location_change',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  ANOMALY_DETECTED = 'anomaly_detected',
  PHISHING_ATTEMPT = 'phishing_attempt',
  UNAUTHORIZED_ACCESS = 'unauthorized_access'
}

/**
 * Метаданные события безопасности
 */
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  timestamp: number;
  userId: string;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

/**
 * Правило rate limiting
 */
export interface RateLimitRule {
  id: string;
  type: SecurityEventType;
  maxAttempts: number;
  windowMs: number; // окно в миллисекундах
  blockDurationMs: number; // длительность блокировки
}

/**
 * Паттерн аномалии
 */
export interface AnomalyPattern {
  id: string;
  name: string;
  description: string;
  threshold: number;
  windowMs: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

/**
 * Реализация менеджера безопасности для Invisible Wallet
 */
export class SecurityManagerImpl implements SecurityManager, AnomalyDetection {
  private config: SecurityConfig;
  private storage: StorageAdapter;
  private crypto: CryptoUtils;
  private rateLimitRules: Map<string, RateLimitRule> = new Map();
  private anomalyPatterns: Map<string, AnomalyPattern> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private blockedIPs: Set<string> = new Set();
  private blockedDevices: Set<string> = new Set();
  
  constructor(config: SecurityConfig, storage?: StorageAdapter) {
    this.config = config;
    this.storage = storage || this.createStorageAdapter();
    this.crypto = new CryptoUtils({
      encryptionAlgorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2',
      storageType: 'indexeddb',
      backupEnabled: false,
      rotationInterval: 30
    });
    
    this.initializeRateLimitRules();
    this.initializeAnomalyPatterns();
  }
  
  /**
   * Инициализация менеджера безопасности
   */
  async initialize(): Promise<void> {
    try {
      logger.info("Initializing SecurityManager");
      
      // Инициализация хранилища
      if ('initialize' in this.storage && typeof this.storage.initialize === 'function') {
        await this.storage.initialize();
      }
      
      // Загрузка заблокированных IP и устройств
      await this.loadBlockedLists();
      
      // Загрузка событий безопасности
      await this.loadSecurityEvents();
      
      // Очистка старых событий
      await this.cleanupOldEvents();
      
      logger.info("SecurityManager initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize SecurityManager", error as Error);
      throw new SecurityError("Failed to initialize SecurityManager", { error });
    }
  }
  
  /**
   * Валидация транзакции
   */
  async validateTransaction(transaction: Transaction, userId: string): Promise<boolean> {
    try {
      logger.info("Validating transaction", { userId });
      
      // Проверка rate limiting
      const isRateLimited = await this.checkRateLimit(SecurityEventType.TRANSACTION_SENT, userId);
      if (isRateLimited) {
        await this.createSecurityAlert(
          'suspicious_transaction',
          'high',
          'Transaction rate limit exceeded',
          { userId, transactionHash: this.getTransactionHash(transaction) }
        );
        return false;
      }
      
      // Проверка суммы транзакции
      const amount = this.getTransactionAmount(transaction);
      if (amount > this.config.maxAmountPerTransaction) {
        await this.createSecurityAlert(
          'suspicious_transaction',
          'high',
          'Transaction amount exceeds limit',
          { userId, amount, maxAmount: this.config.maxAmountPerTransaction }
        );
        return false;
      }
      
      // Детекция аномалий
      if (this.config.anomalyDetection) {
        const isAnomalous = await this.detectAnomaly(transaction, userId);
        if (isAnomalous) {
          await this.createSecurityAlert(
            'unusual_activity',
            'medium',
            'Anomalous transaction detected',
            { userId, transactionHash: this.getTransactionHash(transaction) }
          );
          // Не блокируем транзакцию, а только логируем
        }
      }
      
      // Запись события
      await this.recordSecurityEvent(SecurityEventType.TRANSACTION_CREATED, userId, {
        transactionHash: this.getTransactionHash(transaction),
        amount
      });
      
      logger.info("Transaction validated successfully", { userId });
      return true;
    } catch (error) {
      logger.error("Failed to validate transaction", error as Error);
      return false;
    }
  }
  
  /**
   * Детекция аномалии
   */
  async detectAnomaly(transaction: Transaction, userId: string): Promise<boolean> {
    try {
      if (!this.config.anomalyDetection) {
        return false;
      }
      
      const anomalyScore = await this.getAnomalyScore(transaction, userId);
      const threshold = 0.7; // Порог аномалии
      
      return anomalyScore > threshold;
    } catch (error) {
      logger.error("Failed to detect anomaly", error as Error);
      return false;
    }
  }
  
  /**
   * Получение оценки аномалии
   */
  async getAnomalyScore(transaction: Transaction, userId: string): Promise<number> {
    try {
      let score = 0;
      
      // Анализ частоты транзакций
      const frequencyScore = await this.analyzeTransactionFrequency(userId);
      score += frequencyScore * 0.3;
      
      // Анализ суммы транзакции
      const amountScore = await this.analyzeTransactionAmount(transaction, userId);
      score += amountScore * 0.4;
      
      // Анализ времени транзакции
      const timeScore = await this.analyzeTransactionTime(userId);
      score += timeScore * 0.2;
      
      // Анализ получателей
      const recipientScore = await this.analyzeTransactionRecipients(transaction, userId);
      score += recipientScore * 0.1;
      
      return Math.min(score, 1.0);
    } catch (error) {
      logger.error("Failed to get anomaly score", error as Error);
      return 0.5;
    }
  }
  
  /**
   * Проверка rate limiting
   */
  async checkRateLimit(eventType: SecurityEventType, userId: string): Promise<boolean> {
    try {
      const rule = this.rateLimitRules.get(eventType);
      if (!rule) {
        return false;
      }
      
      const now = Date.now();
      const windowStart = now - rule.windowMs;
      
      // Получение событий в окне
      const recentEvents = this.securityEvents.filter(event =>
        event.type === eventType &&
        event.userId === userId &&
        event.timestamp >= windowStart
      );
      
      // Проверка превышения лимита
      if (recentEvents.length >= rule.maxAttempts) {
        // Блокировка пользователя
        await this.blockUser(userId, rule.blockDurationMs);
        
        await this.createSecurityAlert(
          'rate_limit_exceeded',
          'medium',
          `Rate limit exceeded for ${eventType}`,
          { userId, eventType, attempts: recentEvents.length }
        );
        
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error("Failed to check rate limit", error as Error);
      return false;
    }
  }
  
  /**
   * Блокировка пользователя
   */
  async blockUser(userId: string, durationMs: number): Promise<void> {
    try {
      logger.info("Blocking user", { userId, durationMs });
      
      const blockData = {
        userId,
        blockedAt: Date.now(),
        expiresAt: Date.now() + durationMs,
        reason: 'Rate limit exceeded'
      };
      
      await this.storage.set(`invisible_wallet_block_${userId}`, blockData);
      
      logger.info("User blocked successfully", { userId, durationMs });
    } catch (error) {
      logger.error("Failed to block user", error as Error);
      throw new SecurityError("Failed to block user", { error });
    }
  }
  
  /**
   * Проверка заблокирован ли пользователь
   */
  async isUserBlocked(userId: string): Promise<boolean> {
    try {
      const blockData = await this.storage.get(`invisible_wallet_block_${userId}`);
      if (!blockData) {
        return false;
      }
      
      // Проверка истечения блокировки
      if (Date.now() > blockData.expiresAt) {
        await this.storage.remove(`invisible_wallet_block_${userId}`);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error("Failed to check user block status", error as Error);
      return false;
    }
  }
  
  /**
   * Создание оповещения безопасности
   */
  async createSecurityAlert(
    type: SecurityAlert['type'],
    severity: SecurityAlert['severity'],
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const alert: SecurityAlert = {
        type,
        severity,
        message,
        details: details || {},
        timestamp: Date.now()
      };
      
      // Сохранение оповещения
      await this.storage.set(`invisible_wallet_alert_${alert.timestamp}`, alert);
      
      // Запись события безопасности
      await this.recordSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, 'system', {
        alertType: type,
        severity,
        message
      });
      
      logger.warn("Security alert created", { type, severity, message });
      
      // В реальной реализации здесь может быть отправка уведомления
      if (severity === 'high' || severity === 'critical') {
        await this.sendCriticalAlert(alert);
      }
    } catch (error) {
      logger.error("Failed to create security alert", error as Error);
      throw new SecurityError("Failed to create security alert", { error });
    }
  }
  
  /**
   * Получение оповещений безопасности
   */
  async getSecurityAlerts(limit?: number): Promise<SecurityAlert[]> {
    try {
      const keys = await this.storage.keys();
      const alertKeys = keys.filter(key => key.startsWith('invisible_wallet_alert_'));
      
      const alerts: SecurityAlert[] = [];
      for (const key of alertKeys) {
        const alert = await this.storage.get(key);
        if (alert) {
          alerts.push(alert);
        }
      }
      
      // Сортировка по времени (убывание)
      alerts.sort((a, b) => b.timestamp - a.timestamp);
      
      return limit ? alerts.slice(0, limit) : alerts;
    } catch (error) {
      logger.error("Failed to get security alerts", error as Error);
      return [];
    }
  }
  
  /**
   * Проверка на phishing
   */
  async checkPhishing(url: string): Promise<boolean> {
    try {
      logger.info("Checking for phishing", { url });
      
      // Базовые проверки
      const suspiciousPatterns = [
        /bitly\.|t\.co|tinyurl\./, // Сокращатели URL
        /free|bonus|giveaway|airdrop/i, // Подозрительные слова
        /login|signin|wallet|connect/i, // Слова связанные с входом
        /[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/ // IP адреса
      ];
      
      let suspiciousScore = 0;
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(url)) {
          suspiciousScore++;
        }
      }
      
      // Проверка домена
      const domain = new URL(url).hostname;
      const knownDomains = ['normaldance.com', 't.me', 'telegram.org'];
      
      if (!knownDomains.some(known => domain.includes(known))) {
        suspiciousScore++;
      }
      
      const isPhishing = suspiciousScore >= 2;
      
      if (isPhishing) {
        await this.createSecurityAlert(
          'phishing_attempt',
          'high',
          'Phishing attempt detected',
          { url, suspiciousScore }
        );
      }
      
      return isPhishing;
    } catch (error) {
      logger.error("Failed to check phishing", error as Error);
      return false;
    }
  }
  
  /**
   * Запись события безопасности
   */
  async recordSecurityEvent(
    type: SecurityEventType,
    userId: string,
    details: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<void> {
    try {
      const event: SecurityEvent = {
        id: await this.generateEventId(),
        type,
        timestamp: Date.now(),
        userId,
        deviceId: await DeviceUtils.getDeviceId(),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        details,
        severity,
        resolved: false
      };
      
      // Добавление в память
      this.securityEvents.push(event);
      
      // Ограничение размера массива
      if (this.securityEvents.length > 1000) {
        this.securityEvents = this.securityEvents.slice(-500);
      }
      
      // Сохранение в хранилище
      await this.storage.set(`invisible_wallet_security_event_${event.id}`, event);
      
      logger.info("Security event recorded", { type, userId, severity });
    } catch (error) {
      logger.error("Failed to record security event", error as Error);
    }
  }
  
  /**
   * Получение событий безопасности
   */
  async getSecurityEvents(
    userId?: string,
    eventType?: SecurityEventType,
    limit?: number
  ): Promise<SecurityEvent[]> {
    try {
      let events = [...this.securityEvents];
      
      // Фильтрация
      if (userId) {
        events = events.filter(event => event.userId === userId);
      }
      
      if (eventType) {
        events = events.filter(event => event.type === eventType);
      }
      
      // Сортировка по времени (убывание)
      events.sort((a, b) => b.timestamp - a.timestamp);
      
      return limit ? events.slice(0, limit) : events;
    } catch (error) {
      logger.error("Failed to get security events", error as Error);
      return [];
    }
  }
  
  /**
   * Очистка старых событий
   */
  async cleanupOldEvents(): Promise<void> {
    try {
      logger.info("Cleaning up old security events");
      
      const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 дней
      const keys = await this.storage.keys();
      const eventKeys = keys.filter(key => key.startsWith('invisible_wallet_security_event_'));
      
      let cleanedCount = 0;
      for (const key of eventKeys) {
        const event = await this.storage.get(key);
        if (event && event.timestamp < cutoffTime) {
          await this.storage.remove(key);
          cleanedCount++;
        }
      }
      
      // Очистка памяти
      this.securityEvents = this.securityEvents.filter(event => event.timestamp >= cutoffTime);
      
      logger.info("Old security events cleaned up", { count: cleanedCount });
    } catch (error) {
      logger.error("Failed to cleanup old events", error as Error);
    }
  }
  
  /**
   * Создание адаптера хранилища
   */
  private createStorageAdapter(): StorageAdapter {
    return new IndexedDBStorageAdapter();
  }
  
  /**
   * Инициализация правил rate limiting
   */
  private initializeRateLimitRules(): void {
    this.rateLimitRules.set(SecurityEventType.LOGIN_ATTEMPT, {
      id: 'login_attempts',
      type: SecurityEventType.LOGIN_ATTEMPT,
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 минут
      blockDurationMs: 30 * 60 * 1000 // 30 минут
    });
    
    this.rateLimitRules.set(SecurityEventType.TRANSACTION_SENT, {
      id: 'transaction_attempts',
      type: SecurityEventType.TRANSACTION_SENT,
      maxAttempts: this.config.maxTransactionsPerHour,
      windowMs: 60 * 60 * 1000, // 1 час
      blockDurationMs: 60 * 60 * 1000 // 1 час
    });
    
    this.rateLimitRules.set(SecurityEventType.LOGIN_FAILURE, {
      id: 'login_failures',
      type: SecurityEventType.LOGIN_FAILURE,
      maxAttempts: 3,
      windowMs: 5 * 60 * 1000, // 5 минут
      blockDurationMs: 15 * 60 * 1000 // 15 минут
    });
  }
  
  /**
   * Инициализация паттернов аномалий
   */
  private initializeAnomalyPatterns(): void {
    this.anomalyPatterns.set('high_frequency', {
      id: 'high_frequency',
      name: 'High Transaction Frequency',
      description: 'Unusually high number of transactions in short time',
      threshold: 0.8,
      windowMs: 60 * 60 * 1000, // 1 час
      severity: 'medium',
      enabled: true
    });
    
    this.anomalyPatterns.set('large_amount', {
      id: 'large_amount',
      name: 'Large Transaction Amount',
      description: 'Transaction amount significantly higher than usual',
      threshold: 0.9,
      windowMs: 24 * 60 * 60 * 1000, // 24 часа
      severity: 'high',
      enabled: true
    });
    
    this.anomalyPatterns.set('unusual_time', {
      id: 'unusual_time',
      name: 'Unusual Transaction Time',
      description: 'Transactions at unusual hours',
      threshold: 0.6,
      windowMs: 24 * 60 * 60 * 1000, // 24 часа
      severity: 'low',
      enabled: true
    });
  }
  
  /**
   * Загрузка заблокированных списков
   */
  private async loadBlockedLists(): Promise<void> {
    try {
      const blockedIPs = await this.storage.get('invisible_wallet_blocked_ips') || [];
      this.blockedIPs = new Set(blockedIPs);
      
      const blockedDevices = await this.storage.get('invisible_wallet_blocked_devices') || [];
      this.blockedDevices = new Set(blockedDevices);
    } catch (error) {
      logger.error("Failed to load blocked lists", error as Error);
    }
  }
  
  /**
   * Загрузка событий безопасности
   */
  private async loadSecurityEvents(): Promise<void> {
    try {
      const keys = await this.storage.keys();
      const eventKeys = keys.filter(key => key.startsWith('invisible_wallet_security_event_'));
      
      const events: SecurityEvent[] = [];
      for (const key of eventKeys) {
        const event = await this.storage.get(key);
        if (event) {
          events.push(event);
        }
      }
      
      // Сортировка и ограничение
      events.sort((a, b) => b.timestamp - a.timestamp);
      this.securityEvents = events.slice(0, 500);
    } catch (error) {
      logger.error("Failed to load security events", error as Error);
    }
  }
  
  /**
   * Генерация ID события
   */
  private async generateEventId(): Promise<string> {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Получение хеша транзакции
   */
  private getTransactionHash(transaction: Transaction): string {
    try {
      return Buffer.from(transaction.serialize()).toString('base64').slice(0, 16);
    } catch (error) {
      return 'unknown';
    }
  }
  
  /**
   * Получение суммы транзакции
   */
  private getTransactionAmount(transaction: Transaction): number {
    try {
      // В реальной реализации здесь будет анализ инструкций транзакции
      // Для демонстрации возвращаем 0
      return 0;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Анализ частоты транзакций
   */
  private async analyzeTransactionFrequency(userId: string): Promise<number> {
    try {
      const now = Date.now();
      const windowStart = now - (60 * 60 * 1000); // 1 час
      
      const recentTransactions = this.securityEvents.filter(event =>
        event.type === SecurityEventType.TRANSACTION_SENT &&
        event.userId === userId &&
        event.timestamp >= windowStart
      );
      
      const frequency = recentTransactions.length;
      const maxFrequency = this.config.maxTransactionsPerHour;
      
      return Math.min(frequency / maxFrequency, 1.0);
    } catch (error) {
      logger.error("Failed to analyze transaction frequency", error as Error);
      return 0;
    }
  }
  
  /**
   * Анализ суммы транзакции
   */
  private async analyzeTransactionAmount(transaction: Transaction, userId: string): Promise<number> {
    try {
      const amount = this.getTransactionAmount(transaction);
      
      if (amount === 0) {
        return 0;
      }
      
      // Сравнение с максимальной разрешенной суммой
      const maxAmount = this.config.maxAmountPerTransaction;
      return Math.min(amount / maxAmount, 1.0);
    } catch (error) {
      logger.error("Failed to analyze transaction amount", error as Error);
      return 0;
    }
  }
  
  /**
   * Анализ времени транзакции
   */
  private async analyzeTransactionTime(userId: string): Promise<number> {
    try {
      const now = Date.now();
      const hour = new Date(now).getHours();
      
      // Подозрительные часы (ночь)
      const suspiciousHours = [0, 1, 2, 3, 4, 5, 22, 23];
      
      return suspiciousHours.includes(hour) ? 0.7 : 0.1;
    } catch (error) {
      logger.error("Failed to analyze transaction time", error as Error);
      return 0;
    }
  }
  
  /**
   * Анализ получателей транзакции
   */
  private async analyzeTransactionRecipients(transaction: Transaction, userId: string): Promise<number> {
    try {
      // В реальной реализации здесь будет анализ получателей
      // Для демонстрации возвращаем низкий риск
      return 0.1;
    } catch (error) {
      logger.error("Failed to analyze transaction recipients", error as Error);
      return 0;
    }
  }
  
  /**
   * Получение IP адреса клиента
   */
  private async getClientIP(): Promise<string> {
    try {
      // В реальной реализации здесь будет запрос к сервису определения IP
      return '127.0.0.1';
    } catch (error) {
      return 'unknown';
    }
  }
  
  /**
   * Отправка критического оповещения
   */
  private async sendCriticalAlert(alert: SecurityAlert): Promise<void> {
    try {
      // В реальной реализации здесь будет отправка уведомления
      logger.error("CRITICAL SECURITY ALERT", alert);
    } catch (error) {
      logger.error("Failed to send critical alert", error as Error);
    }
  }
}

/**
 * Адаптер IndexedDB для хранения данных безопасности
 */
class IndexedDBStorageAdapter implements StorageAdapter {
  private dbName = 'InvisibleWalletSecurityDB';
  private storeName = 'securityStore';
  private db: IDBDatabase | null = null;
  
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }
  
  async get(key: string): Promise<any> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
  
  async set(key: string, value: any): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async remove(key: string): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async clear(): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async keys(): Promise<string[]> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}