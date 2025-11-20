// Менеджер платежей через Telegram Stars

import { PaymentSession, StarsTransaction } from '@/types/wallet';
import { CURRENT_CONFIG } from './config';
import { TelegramStarsBridge } from './telegram-stars-bridge';
import { logger } from '@/lib/logger';
import { EventEmitter } from 'events';

export class StarsPaymentManager {
  private sessions: Map<string, PaymentSession> = new Map();
  private bridge: TelegramStarsBridge;
  private emitter: EventEmitter;

  constructor(bridge: TelegramStarsBridge) {
    this.bridge = bridge;
    this.emitter = new EventEmitter();
    logger.info('StarsPaymentManager initialized');
  }

  /**
   * Создать новую платежную сессию
   */
  async createPaymentSession(userId: string, starsAmount: number, ndtAmount: number, callbackUrl?: string): Promise<PaymentSession> {
    logger.info('Creating payment session', { userId, starsAmount, ndtAmount, callbackUrl });

    // Проверяем минимальную сумму покупки
    if (starsAmount < CURRENT_CONFIG.TELEGRAM_STARS.MIN_PURCHASE_AMOUNT) {
      throw new Error(`Minimum purchase amount is ${CURRENT_CONFIG.TELEGRAM_STARS.MIN_PURCHASE_AMOUNT} Stars`);
    }

    // Проверяем максимальную сумму покупки
    if (starsAmount > CURRENT_CONFIG.TELEGRAM_STARS.MAX_PURCHASE_AMOUNT) {
      throw new Error(`Maximum purchase amount is ${CURRENT_CONFIG.TELEGRAM_STARS.MAX_PURCHASE_AMOUNT} Stars`);
    }

    // Генерируем ID сессии
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Вычисляем время истечения
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + CURRENT_CONFIG.TELEGRAM_STARS.PAYMENT_SESSION.EXPIRATION_TIME);

    // Создаем сессию
    const session: PaymentSession = {
      id: sessionId,
      userId,
      starsAmount,
      ndtAmount,
      status: 'created',
      createdAt,
      expiresAt,
      callbackUrl,
    };

    // Сохраняем сессию
    this.sessions.set(sessionId, session);
    
    logger.info('Payment session created', { sessionId, userId });

    // Устанавливаем таймер для автоматической отмены истекшей сессии
    setTimeout(() => {
      if (this.sessions.has(sessionId)) {
        const currentSession = this.sessions.get(sessionId)!;
        if (currentSession.status === 'created') {
          this.cancelPaymentSession(sessionId);
        }
      }
    }, CURRENT_CONFIG.TELEGRAM_STARS.PAYMENT_SESSION.EXPIRATION_TIME);

    return session;
  }

  /**
   * Получить информацию о платежной сессии
   */
  getPaymentSession(sessionId: string): PaymentSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Проверяем, не истекла ли сессия
    if (new Date() > session.expiresAt && session.status !== 'completed' && session.status !== 'cancelled' && session.status !== 'failed') {
      this.cancelPaymentSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Подтвердить платеж
   */
  async approvePaymentSession(sessionId: string): Promise<boolean> {
    logger.info('Approving payment session', { sessionId });

    const session = this.getPaymentSession(sessionId);
    if (!session) {
      logger.error('Payment session not found or expired', { sessionId });
      return false;
    }

    if (session.status !== 'created') {
      logger.error('Payment session is not in created state', { sessionId, status: session.status });
      return false;
    }

    // Обновляем статус сессии
    session.status = 'approved';
    this.sessions.set(sessionId, session);
    
    logger.info('Payment session approved', { sessionId });

    try {
      // Выполняем покупку NDT с помощью моста
      const transaction = await this.bridge.purchaseNdtWithStars(session.starsAmount, session.userId);
      
      // Обновляем статус сессии в зависимости от результата транзакции
      session.status = transaction.status === 'confirmed' ? 'completed' : 'failed';
      this.sessions.set(sessionId, session);
      
      logger.info('Payment session completed', { sessionId, transactionId: transaction.id });
      
      // Вызываем коллбэк, если он указан
      if (session.callbackUrl) {
        await this.executeCallback(session, transaction);
      }
      
      // Вызываем событие завершения платежа
      this.emitter.emit('paymentCompleted', { sessionId, transaction });
      
      return true;
    } catch (error) {
      logger.error('Error processing payment session', { error, sessionId });
      
      // Обновляем статус сессии как неудачную
      session.status = 'failed';
      this.sessions.set(sessionId, session);
      
      // Вызываем событие ошибки платежа
      this.emitter.emit('paymentFailed', { sessionId, error });
      
      return false;
    }
  }

  /**
   * Отменить платежную сессию
   */
  async cancelPaymentSession(sessionId: string): Promise<boolean> {
    logger.info('Cancelling payment session', { sessionId });

    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.error('Payment session not found', { sessionId });
      return false;
    }

    if (session.status === 'completed' || session.status === 'failed') {
      logger.warn('Cannot cancel already completed or failed session', { sessionId, status: session.status });
      return false;
    }

    session.status = 'cancelled';
    this.sessions.set(sessionId, session);
    
    logger.info('Payment session cancelled', { sessionId });
    
    // Вызываем событие отмены платежа
    this.emitter.emit('paymentCancelled', { sessionId });
    
    return true;
  }

  /**
   * Отследить статус транзакции
   */
  async trackTransactionStatus(transactionId: string): Promise<StarsTransaction> {
    logger.info('Tracking transaction status', { transactionId });

    // В реальном приложении здесь будет вызов API для проверки статуса транзакции в блокчейне
    // Для демонстрации возвращаем транзакцию с фиксированным статусом

    // Временная транзакция для демонстрации
    const transaction: StarsTransaction = {
      id: transactionId,
      userId: 'temp_user_id',
      starsAmount: 0,
      solAmount: 0,
      ndtAmount: 0,
      timestamp: new Date(),
      status: 'confirmed', // В реальном приложении это будет динамически обновляться
    };

    logger.info('Transaction status tracked', { transactionId, status: transaction.status });
    
    return transaction;
  }

  /**
   * Обработать коллбэк от Telegram
   */
  async handleTelegramCallback(telegramData: any): Promise<boolean> {
    logger.info('Handling Telegram callback', { telegramData });

    try {
      // В реальном приложении:
      // 1. Проверить подпись данных от Telegram
      // 2. Извлечь ID транзакции и статус
      // 3. Обновить статус соответствующей сессии
      // 4. Вызвать соответствующие обработчики

      // Извлекаем данные из коллбэка
      const { 
        id: telegramTransactionId, 
        status, 
        stars_amount: starsAmount,
        user_id: userId 
      } = telegramData;

      // Находим сессию по ID пользователя и сумме (в реальном приложении может быть другой способ сопоставления)
      let targetSession: PaymentSession | null = null;
      for (const session of this.sessions.values()) {
        if (session.userId === userId && session.starsAmount === starsAmount && 
            (session.status === 'created' || session.status === 'approved')) {
          targetSession = session;
          break;
        }
      }

      if (!targetSession) {
        logger.error('No matching payment session found for callback', { telegramTransactionId, userId, starsAmount });
        return false;
      }

      // Обновляем статус сессии в зависимости от статуса от Telegram
      if (status === 'completed') {
        targetSession.status = 'completed';
      } else if (status === 'failed' || status === 'cancelled') {
        targetSession.status = status;
      }

      this.sessions.set(targetSession.id, targetSession);
      
      logger.info('Payment session status updated from Telegram callback', { 
        sessionId: targetSession.id, 
        status: targetSession.status,
        telegramTransactionId 
      });

      // Вызываем соответствующее событие
      if (targetSession.status === 'completed') {
        this.emitter.emit('paymentCompleted', { 
          sessionId: targetSession.id, 
          telegramTransactionId 
        });
      } else if (targetSession.status === 'failed') {
        this.emitter.emit('paymentFailed', { 
          sessionId: targetSession.id, 
          telegramTransactionId 
        });
      } else if (targetSession.status === 'cancelled') {
        this.emitter.emit('paymentCancelled', { 
          sessionId: targetSession.id, 
          telegramTransactionId 
        });
      }

      return true;
    } catch (error) {
      logger.error('Error handling Telegram callback', { error, telegramData });
      return false;
    }
  }

  /**
   * Выполнить коллбэк после завершения платежа
   */
  private async executeCallback(session: PaymentSession, transaction: StarsTransaction): Promise<void> {
    if (!session.callbackUrl) {
      return;
    }

    try {
      // В реальном приложении здесь будет HTTP-запрос к указанному URL
      // с информацией о завершенной транзакции
      
      logger.info('Executing payment callback', { 
        callbackUrl: session.callbackUrl, 
        sessionId: session.id, 
        transactionId: transaction.id 
      });
      
      // Пример: await fetch(session.callbackUrl, { method: 'POST', body: JSON.stringify({ session, transaction }) });
    } catch (error) {
      logger.error('Error executing payment callback', { error, callbackUrl: session.callbackUrl });
    }
  }

  /**
   * Подписаться на событие платежа
   */
  on(event: 'paymentCompleted' | 'paymentFailed' | 'paymentCancelled', listener: (data: any) => void): void {
    this.emitter.on(event, listener);
  }

  /**
   * Отписаться от события платежа
   */
  off(event: 'paymentCompleted' | 'paymentFailed' | 'paymentCancelled', listener: (data: any) => void): void {
    this.emitter.off(event, listener);
  }
}