import {
  SessionManager,
  SessionManagerConfig,
  Session,
  SessionMetadata,
  SessionManagerError,
  StorageAdapter,
  InvisibleWalletError
} from "@/types/wallet";
import { CryptoUtils, StorageUtils, DeviceUtils, TelegramUtils, ErrorUtils } from "./utils";
import { logger } from "@/lib/utils/logger";
import { OfflineTransactionManager } from "./offline-transaction-manager";
import { CacheManager } from "./cache-manager";
import { FallbackStateManager } from "./fallback-state-manager";

/**
 * Реализация менеджера сессий для Invisible Wallet
 */
export class SessionManagerImpl implements SessionManager {
  private config: SessionManagerConfig;
  private storage: StorageAdapter;
  private crypto: CryptoUtils;
  private currentSession: Session | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  constructor(config: SessionManagerConfig, storage?: StorageAdapter) {
    this.config = config;
    this.storage = storage || this.createStorageAdapter();
    this.crypto = new CryptoUtils({
      encryptionAlgorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2',
      storageType: config.storageType,
      backupEnabled: false,
      rotationInterval: 30
    });
  }
  
  /**
   * Инициализация менеджера сессий
   */
  async initialize(): Promise<void> {
    try {
      logger.info("Initializing SessionManager");
      
      // Инициализация хранилища
      if ('initialize' in this.storage && typeof this.storage.initialize === 'function') {
        await this.storage.initialize();
      }
      
      // Загрузка существующей сессии
      await this.loadExistingSession();
      
      // Запуск таймеров
      this.startTimers();
      
      // Очистка истекших сессий
      await this.cleanupExpiredSessions();
      
      // Установка обработчиков сетевого статуса
      this.setupNetworkStatusHandlers();
      
      logger.info("SessionManager initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize SessionManager", error as Error);
      throw new SessionManagerError("Failed to initialize SessionManager", { error });
    }
  }
  
  /**
   * Создание новой сессии
   */
  async createSession(publicKey: string, metadata?: Partial<SessionMetadata>): Promise<Session> {
    try {
      logger.info("Creating new session", { publicKey });
      
      const deviceId = await DeviceUtils.getDeviceId();
      const now = Date.now();
      
      // Оценка доверия устройства
      const trustScore = await this.calculateTrustScore(deviceId, metadata);
      
      // Создание метаданных сессии
      const sessionMetadata: SessionMetadata = {
        userAgent: navigator.userAgent,
        ipAddress: await this.getClientIP(),
        platform: navigator.platform,
        version: '1.0.0',
        trustScore,
        ...metadata
      };
      
      // Создание сессии
      const session: Session = {
        id: await this.generateSessionId(),
        publicKey,
        createdAt: now,
        expiresAt: now + this.config.sessionTimeout,
        lastActivity: now,
        deviceId,
        metadata: sessionMetadata
      };
      
      // Валидация сессии
      if (!this.isValidSession(session)) {
        throw new SessionManagerError("Invalid session created");
      }
      
      // Сохранение сессии
      await this.storeSession(session);
      this.currentSession = session;
      
      // Запуск таймера обновления
      this.scheduleRefresh(session);
      
      logger.info("Session created successfully", { 
        sessionId: session.id,
        publicKey,
        trustScore 
      });
      
      return session;
    } catch (error) {
      logger.error("Failed to create session", error as Error);
      throw new SessionManagerError("Failed to create session", { error });
    }
  }
  
  /**
   * Получение текущей сессии
   */
  async getCurrentSession(): Promise<Session | null> {
    try {
      if (this.currentSession && !this.isSessionExpired(this.currentSession)) {
        return this.currentSession;
      }
      
      // Попытка загрузить из хранилища
      const sessionId = await this.getCurrentSessionId();
      if (!sessionId) {
        return null;
      }
      
      const session = await this.retrieveSession(sessionId);
      if (session && !this.isSessionExpired(session)) {
        this.currentSession = session;
        return session;
      }
      
      return null;
    } catch (error) {
      logger.error("Failed to get current session", error as Error);
      return null;
    }
  }
  
  /**
   * Обновление сессии
   */
  async refreshSession(sessionId?: string): Promise<Session> {
    try {
      const targetSessionId = sessionId || this.currentSession?.id;
      if (!targetSessionId) {
        throw new SessionManagerError("No session to refresh");
      }
      
      logger.info("Refreshing session", { sessionId: targetSessionId });
      
      const session = await this.retrieveSession(targetSessionId);
      if (!session) {
        throw new SessionManagerError("Session not found", { sessionId: targetSessionId });
      }
      
      if (this.isSessionExpired(session)) {
        throw new SessionManagerError("Session expired", { sessionId: targetSessionId });
      }
      
      // Обновление времени активности и истечения
      const now = Date.now();
      session.lastActivity = now;
      session.expiresAt = now + this.config.sessionTimeout;
      
      // Обновление оценки доверия
      session.metadata.trustScore = await this.calculateTrustScore(session.deviceId, session.metadata);
      
      // Сохранение обновленной сессии
      await this.storeSession(session);
      
      if (this.currentSession?.id === targetSessionId) {
        this.currentSession = session;
      }
      
      // Планирование следующего обновления
      this.scheduleRefresh(session);
      
      logger.info("Session refreshed successfully", { sessionId: targetSessionId });
      return session;
    } catch (error) {
      logger.error("Failed to refresh session", error as Error);
      throw new SessionManagerError("Failed to refresh session", { error });
    }
  }
  
  /**
   * Завершение сессии
   */
  async expireSession(sessionId?: string): Promise<void> {
    try {
      const targetSessionId = sessionId || this.currentSession?.id;
      if (!targetSessionId) {
        throw new SessionManagerError("No session to expire");
      }
      
      logger.info("Expiring session", { sessionId: targetSessionId });
      
      // Удаление сессии из хранилища
      await this.removeSession(targetSessionId);
      
      // Очистка текущей сессии
      if (this.currentSession?.id === targetSessionId) {
        this.currentSession = null;
      }
      
      // Очистка таймеров
      this.clearRefreshTimer();
      
      logger.info("Session expired successfully", { sessionId: targetSessionId });
    } catch (error) {
      logger.error("Failed to expire session", error as Error);
      throw new SessionManagerError("Failed to expire session", { error });
    }
  }
  
  /**
   * Валидация сессии
   */
  async validateSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.retrieveSession(sessionId);
      if (!session) {
        return false;
      }
      
      return this.isValidSession(session) && !this.isSessionExpired(session);
    } catch (error) {
      logger.error("Failed to validate session", error as Error);
      return false;
    }
  }
  
  /**
   * Получение всех активных сессий
   */
  async getActiveSessions(): Promise<Session[]> {
    try {
      const sessions = await this.getAllSessions();
      return sessions.filter(session => !this.isSessionExpired(session));
    } catch (error) {
      logger.error("Failed to get active sessions", error as Error);
      return [];
    }
  }
  
  /**
   * Очистка истекших сессий
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      logger.info("Cleaning up expired sessions");
      
      const sessions = await this.getAllSessions();
      const expiredSessions = sessions.filter(session => this.isSessionExpired(session));
      
      for (const session of expiredSessions) {
        await this.removeSession(session.id);
      }
      
      logger.info("Cleaned up expired sessions", { count: expiredSessions.length });
    } catch (error) {
      logger.error("Failed to cleanup expired sessions", error as Error);
      // Не выбрасываем ошибку, так как это не критичная операция
    }
  }
  
  /**
   * Обновление активности сессии
   */
  async updateActivity(sessionId?: string): Promise<void> {
    try {
      const targetSessionId = sessionId || this.currentSession?.id;
      if (!targetSessionId) {
        return;
      }
      
      const session = await this.retrieveSession(targetSessionId);
      if (!session) {
        return;
      }
      
      session.lastActivity = Date.now();
      await this.storeSession(session);
      
      if (this.currentSession?.id === targetSessionId) {
        this.currentSession = session;
      }
    } catch (error) {
      logger.error("Failed to update activity", error as Error);
      // Не выбрасываем ошибку, так как это не критичная операция
    }
  }
  
  /**
   * Получение метаданных устройства
   */
  async getDeviceMetadata(): Promise<Partial<SessionMetadata>> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      ipAddress: await this.getClientIP(),
      version: '1.0.0'
    };
  }
  
  /**
   * Проверка необходимости многофакторной аутентификации
   */
  async requiresMFA(sessionId?: string): Promise<boolean> {
    try {
      const session = sessionId ? await this.retrieveSession(sessionId) : this.currentSession;
      if (!session) {
        return true;
      }
      
      // Требуем MFA для низкой оценки доверия
      if (session.metadata.trustScore < 0.5) {
        return true;
      }
      
      // Требуем MFA для новых устройств
      const sessionAge = Date.now() - session.createdAt;
      if (sessionAge < 24 * 60 * 60 * 1000) { // 24 часа
        return true;
      }
      
      // Требуем MFA для подозрительной активности
      return await this.detectSuspiciousActivity(session);
    } catch (error) {
      logger.error("Failed to check MFA requirement", error as Error);
      return true; // В случае ошибки требуем MFA
    }
  }
  
  /**
   * Создание адаптера хранилища
   */
  private createStorageAdapter(): StorageAdapter {
    const storageType = this.config.storageType;
    
    switch (storageType) {
      case 'indexeddb':
        return new IndexedDBStorageAdapter();
      case 'localStorage':
        return new LocalStorageAdapter();
      case 'memory':
        return new MemoryStorageAdapter();
      default:
        return new MemoryStorageAdapter();
    }
  }
  
  /**
   * Генерация ID сессии
   */
  private async generateSessionId(): Promise<string> {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Расчет оценки доверия устройства
   */
  private async calculateTrustScore(deviceId: string, metadata?: Partial<SessionMetadata>): Promise<number> {
    try {
      let score = 0.5; // Базовая оценка
      
      // Проверка существующих сессий для этого устройства
      const existingSessions = await this.getSessionsByDevice(deviceId);
      if (existingSessions.length > 0) {
        score += 0.3; // Увеличиваем доверие для известных устройств
      }
      
      // Проверка нахождения в Telegram
      if (TelegramUtils.isTelegramWebApp()) {
        score += 0.2; // Увеличиваем доверие для Telegram
      }
      
      // Проверка user agent
      if (metadata?.userAgent) {
        const knownUserAgents = await this.getKnownUserAgents();
        if (knownUserAgents.includes(metadata.userAgent)) {
          score += 0.1;
        }
      }
      
      // Проверка IP адреса
      if (metadata?.ipAddress) {
        const knownIPs = await this.getKnownIPs();
        if (knownIPs.includes(metadata.ipAddress)) {
          score += 0.1;
        }
      }
      
      return Math.min(score, 1.0);
    } catch (error) {
      logger.error("Failed to calculate trust score", error as Error);
      return 0.5;
    }
  }
  
  /**
   * Получение IP адреса клиента
   */
  private async getClientIP(): Promise<string> {
    try {
      // В реальной реализации здесь будет запрос к сервису определения IP
      // Для демонстрации возвращаем заглушку
      return '127.0.0.1';
    } catch (error) {
      return 'unknown';
    }
  }
  
  /**
   * Валидация сессии
   */
  private isValidSession(session: Session): boolean {
    return (
      session.id.length > 0 &&
      session.publicKey.length > 0 &&
      session.createdAt > 0 &&
      session.expiresAt > 0 &&
      session.lastActivity > 0 &&
      session.deviceId.length > 0 &&
      session.metadata !== null
    );
  }
  
  /**
   * Проверка истечения сессии
   */
  private isSessionExpired(session: Session): boolean {
    return Date.now() > session.expiresAt;
  }
  
  /**
   * Сохранение сессии
   */
  private async storeSession(session: Session): Promise<void> {
    try {
      const storageKey = StorageUtils.generateStorageKey('session', session.id);
      
      if (this.config.encryptionEnabled) {
        // Шифрование сессии
        const sessionData = JSON.stringify(session);
        const encryptionKey = await this.getEncryptionKey();
        const encryptedData = await this.crypto.encrypt(new TextEncoder().encode(sessionData), encryptionKey);
        
        await this.storage.set(storageKey, {
          encrypted: true,
          data: Array.from(encryptedData)
        });
      } else {
        await this.storage.set(storageKey, session);
      }
      
      // Обновление текущей сессии
      await this.storage.set('invisible_wallet_current_session', session.id);
    } catch (error) {
      logger.error("Failed to store session", error as Error);
      throw new SessionManagerError("Failed to store session", { error });
    }
  }
  
  /**
   * Получение сессии
   */
  private async retrieveSession(sessionId: string): Promise<Session | null> {
    try {
      const storageKey = StorageUtils.generateStorageKey('session', sessionId);
      const storedData = await this.storage.get(storageKey);
      
      if (!storedData) {
        return null;
      }
      
      if (storedData.encrypted) {
        // Расшифровка сессии
        const encryptionKey = await this.getEncryptionKey();
        const decryptedData = await this.crypto.decrypt(new Uint8Array(storedData.data), encryptionKey);
        return JSON.parse(new TextDecoder().decode(decryptedData));
      } else {
        return storedData;
      }
    } catch (error) {
      logger.error("Failed to retrieve session", error as Error);
      return null;
    }
  }
  
  /**
   * Удаление сессии
   */
  private async removeSession(sessionId: string): Promise<void> {
    try {
      const storageKey = StorageUtils.generateStorageKey('session', sessionId);
      await this.storage.remove(storageKey);
    } catch (error) {
      logger.error("Failed to remove session", error as Error);
      throw new SessionManagerError("Failed to remove session", { error });
    }
  }
  
  /**
   * Получение ID текущей сессии
   */
  private async getCurrentSessionId(): Promise<string | null> {
    try {
      return await this.storage.get('invisible_wallet_current_session');
    } catch (error) {
      logger.error("Failed to get current session ID", error as Error);
      return null;
    }
  }
  
  /**
   * Получение всех сессий
   */
  private async getAllSessions(): Promise<Session[]> {
    try {
      const keys = await this.storage.keys();
      const sessionKeys = keys.filter(key => key.startsWith('invisible_wallet_session_'));
      
      const sessions: Session[] = [];
      for (const key of sessionKeys) {
        const sessionId = key.replace('invisible_wallet_session_', '');
        const session = await this.retrieveSession(sessionId);
        if (session) {
          sessions.push(session);
        }
      }
      
      return sessions;
    } catch (error) {
      logger.error("Failed to get all sessions", error as Error);
      return [];
    }
  }
  
  /**
   * Получение сессий по устройству
   */
  private async getSessionsByDevice(deviceId: string): Promise<Session[]> {
    try {
      const sessions = await this.getAllSessions();
      return sessions.filter(session => session.deviceId === deviceId);
    } catch (error) {
      logger.error("Failed to get sessions by device", error as Error);
      return [];
    }
  }
  
  /**
   * Получение известных user agents
   */
  private async getKnownUserAgents(): Promise<string[]> {
    try {
      return await this.storage.get('invisible_wallet_known_user_agents') || [];
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Получение известных IP адресов
   */
  private async getKnownIPs(): Promise<string[]> {
    try {
      return await this.storage.get('invisible_wallet_known_ips') || [];
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Получение ключа шифрования
   */
  private async getEncryptionKey(): Promise<CryptoKey> {
    try {
      const deviceId = await DeviceUtils.getDeviceId();
      const password = `session_${deviceId}_${Date.now()}`;
      const salt = new TextEncoder().encode('invisible_wallet_session_salt');
      
      return await this.crypto.deriveEncryptionKey(password, salt);
    } catch (error) {
      logger.error("Failed to get encryption key", error as Error);
      throw new SessionManagerError("Failed to get encryption key", { error });
    }
  }
  
  /**
   * Загрузка существующей сессии
   */
  private async loadExistingSession(): Promise<void> {
    try {
      const sessionId = await this.getCurrentSessionId();
      if (!sessionId) {
        return;
      }
      
      const session = await this.retrieveSession(sessionId);
      if (session && !this.isSessionExpired(session)) {
        this.currentSession = session;
        this.scheduleRefresh(session);
        logger.info("Existing session loaded", { sessionId });
      } else {
        // Удаление истекшей сессии
        await this.removeSession(sessionId);
        await this.storage.remove('invisible_wallet_current_session');
      }
    } catch (error) {
      logger.error("Failed to load existing session", error as Error);
    }
  }
  
  /**
   * Запуск таймеров
   */
  private startTimers(): void {
    // Таймер для очистки истекших сессий
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions().catch(console.error);
    }, 60 * 60 * 1000); // Каждый час
  }
  
  /**
   * Планирование обновления сессии
   */
  private scheduleRefresh(session: Session): void {
    this.clearRefreshTimer();
    
    const refreshTime = this.config.refreshThreshold;
    this.refreshTimer = setTimeout(() => {
      this.refreshSession(session.id).catch(console.error);
    }, refreshTime);
  }
  
  /**
   * Очистка таймера обновления
   */
  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
  
  /**
   * Детекция подозрительной активности
   */
  private async detectSuspiciousActivity(session: Session): Promise<boolean> {
    try {
      // Проверка частоты запросов
      const recentActivity = Date.now() - session.lastActivity;
      if (recentActivity < 1000) { // Меньше 1 секунды
        return true;
      }
      
      // Проверка геолокации (если доступна)
      // В реальной реализации здесь будет проверка геолокации
      
      return false;
    } catch (error) {
      logger.error("Failed to detect suspicious activity", error as Error);
      return true;
    }
  }
}

/**
 * Адаптеры хранилища (переиспользуем из KeyManager)
 */
class IndexedDBStorageAdapter implements StorageAdapter {
  private dbName = 'InvisibleWalletSessionDB';
  private storeName = 'sessionStore';
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

class LocalStorageAdapter implements StorageAdapter {
  async initialize(): Promise<void> {
    // localStorage не требует инициализации
  }
  
  async get(key: string): Promise<any> {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }
  
  async set(key: string, value: any): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      throw new Error(`Failed to set item in localStorage: ${error}`);
    }
  }
  
  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
  
  async clear(): Promise<void> {
    localStorage.clear();
  }
  
  async keys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    return keys;
  }
}

class MemoryStorageAdapter implements StorageAdapter {
  private storage: Map<string, any> = new Map();
  
  async initialize(): Promise<void> {
    // Memory storage не требует инициализации
  }
  
  async get(key: string): Promise<any> {
    return this.storage.get(key) || null;
  }
  
  async set(key: string, value: any): Promise<void> {
    this.storage.set(key, value);
  }
  
  async remove(key: string): Promise<void> {
    this.storage.delete(key);
  }
  
  async clear(): Promise<void> {
    this.storage.clear();
  }
  
  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }
}

/**
 * Расширение класса SessionManagerImpl для добавления оффлайн функциональности
 */

// Extend the SessionManagerImpl class with offline functionality
declare module "./session-manager" {
  interface SessionManagerImpl {
    networkOnlineHandler?: () => void;
    networkOfflineHandler?: () => void;
    setupNetworkStatusHandlers(): void;
    handleNetworkChange(isOnline: boolean): void;
  }
}

/**
 * Установка обработчиков сетевого статуса
 */
SessionManagerImpl.prototype.setupNetworkStatusHandlers = function(this: SessionManagerImpl) {
  if (typeof window === 'undefined') return;
  
  const handleOnline = () => {
    this.handleNetworkChange(true);
  };
  
  const handleOffline = () => {
    this.handleNetworkChange(false);
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Сохраняем обработчики для возможной очистки
  (this as any).networkOnlineHandler = handleOnline;
  (this as any).networkOfflineHandler = handleOffline;
};

/**
 * Обработка изменения сетевого статуса
 */
SessionManagerImpl.prototype.handleNetworkChange = async function(this: SessionManagerImpl, isOnline: boolean) {
  logger.info(`Network status changed: ${isOnline ? 'online' : 'offline'}`);
  
  if (isOnline) {
    // При возвращении в онлайн, синхронизируем оффлайн транзакции
    try {
      const offlineManager = OfflineTransactionManager.getInstance();
      await offlineManager.syncPendingTransactions();
      
      // Обновляем сессию при возвращении в онлайн
      if (this.currentSession) {
        await this.refreshSession(this.currentSession.id);
      }
    } catch (error) {
      logger.error("Failed to sync offline transactions after network change", error as Error);
    }
  }
};

/**
 * Обновление сессии с поддержкой оффлайн режима
 */
SessionManagerImpl.prototype.refreshSession = async function(this: SessionManagerImpl, sessionId?: string): Promise<Session> {
  try {
    const targetSessionId = sessionId || this.currentSession?.id;
    if (!targetSessionId) {
      throw new SessionManagerError("No session to refresh");
    }
    
    logger.info("Refreshing session", { sessionId: targetSessionId });
    
    const session = await this.retrieveSession(targetSessionId);
    if (!session) {
      throw new SessionManagerError("Session not found", { sessionId: targetSessionId });
    }
    
    if (this.isSessionExpired(session)) {
      throw new SessionManagerError("Session expired", { sessionId: targetSessionId });
    }
    
    // Обновление времени активности и истечения
    const now = Date.now();
    session.lastActivity = now;
    
    // Если онлайн, обновляем время истечения и синхронизируем с сетью
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      session.expiresAt = now + this.config.sessionTimeout;
      
      // Обновление оценки доверия
      session.metadata.trustScore = await this.calculateTrustScore(session.deviceId, session.metadata);
      
      // Сохранение обновленной сессии
      await this.storeSession(session);
    } else {
      // В оффлайн режиме продляем сессию локально на короткий срок
      session.expiresAt = now + 300000; // 5 минут в оффлайн режиме
      
      // Сохраняем в локальное хранилище
      await this.storeSession(session);
    }
    
    if (this.currentSession?.id === targetSessionId) {
      this.currentSession = session;
    }
    
    // Планирование следующего обновления
    this.scheduleRefresh(session);
    
    logger.info("Session refreshed successfully", { sessionId: targetSessionId });
    return session;
 } catch (error) {
    logger.error("Failed to refresh session", error as Error);
    throw new SessionManagerError("Failed to refresh session", { error });
  }
};

/**
 * Обновление активности сессии с поддержкой оффлайн режима
 */
SessionManagerImpl.prototype.updateActivity = async function(this: SessionManagerImpl, sessionId?: string): Promise<void> {
  try {
    const targetSessionId = sessionId || this.currentSession?.id;
    if (!targetSessionId) {
      return;
    }
    
    const session = await this.retrieveSession(targetSessionId);
    if (!session) {
      return;
    }
    
    session.lastActivity = Date.now();
    
    // Если онлайн, обновляем в сети, иначе только локально
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      await this.storeSession(session);
    } else {
      // В оффлайн режиме сохраняем только локально
      await this.storeSession(session);
    }
    
    if (this.currentSession?.id === targetSessionId) {
      this.currentSession = session;
    }
  } catch (error) {
    logger.error("Failed to update activity", error as Error);
    // Не выбрасываем ошибку, так как это не критичная операция
  }
};