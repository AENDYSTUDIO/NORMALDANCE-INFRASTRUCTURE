import { MobileService } from './mobileService';

// Типы для MobileStarsIntegration
export interface MobileStarsConfig {
  enabled: boolean;
  minAmount: number;
  maxAmount: number;
  commissionRate: number;
  conversionRate: number;
}

export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  starsAmount?: number;
  solAmount?: number;
  ndtAmount?: number;
  error?: string;
}

export interface ConversionResult {
  success: boolean;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  error?: string;
}

export interface StarsTransaction {
  id: string;
  type: 'purchase' | 'conversion';
  amount: number;
  fromCurrency: 'stars' | 'sol' | 'ndt';
  toCurrency: 'stars' | 'sol' | 'ndt';
  rate: number;
  fee: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}

export class MobileStarsIntegration {
  private config: MobileStarsConfig;
  private mobileService: MobileService;
  private conversionCache: Map<string, { rate: number; timestamp: number }>;
 private processingQueue: StarsTransaction[];

  constructor(config: MobileStarsConfig) {
    this.config = config;
    this.mobileService = new MobileService(); // Используем существующий сервис
    this.conversionCache = new Map();
    this.processingQueue = [];
  }

 async initialize(): Promise<void> {
    // Загрузка текущих курсов
    await this.updateConversionRates();
    
    // Запуск периодического обновления курсов
    setInterval(() => this.updateConversionRates(), 60000); // Каждую минуту
  }

  async purchaseWithStars(amount: number, description: string): Promise<PurchaseResult> {
    try {
      // 1. Валидация
      if (!this.config.enabled) {
        return {
          success: false,
          error: 'Stars purchases are disabled'
        };
      }

      if (amount < this.config.minAmount || amount > this.config.maxAmount) {
        return {
          success: false,
          error: `Amount must be between ${this.config.minAmount} and ${this.config.maxAmount}`
        };
      }

      // 2. Проверка баланса Stars через мобильный сервис
      const starsBalance = await this.getStarsBalance();
      if (starsBalance < amount) {
        return {
          success: false,
          error: 'Insufficient Stars balance'
        };
      }

      // 3. Создание инвойса через мобильный сервис
      const purchaseResult = await this.mobileService.purchaseWithStars(amount, description);
      
      if (!purchaseResult.success) {
        return {
          success: false,
          error: purchaseResult.error || 'Purchase with Stars failed'
        };
      }

      // 4. Конвертация Stars в SOL (используем внутреннюю логику)
      const conversionResult = await this.convertStarsToSol(amount);
      
      if (!conversionResult.success) {
        return {
          success: false,
          error: conversionResult.error
        };
      }

      // 5. Конвертация SOL в NDT (внутренняя логика)
      const ndtConversionResult = await this.convertSolToNdt(conversionResult.toAmount);
      
      if (!ndtConversionResult.success) {
        return {
          success: false,
          error: ndtConversionResult.error
        };
      }

      // 6. Логирование транзакции
      const transaction: StarsTransaction = {
        id: this.generateTransactionId(),
        type: 'purchase',
        amount,
        fromCurrency: 'stars',
        toCurrency: 'ndt',
        rate: ndtConversionResult.rate,
        fee: amount * this.config.commissionRate,
        timestamp: Date.now(),
        status: 'completed'
      };

      this.processingQueue.push(transaction);

      return {
        success: true,
        transactionId: purchaseResult.transactionId,
        starsAmount: amount,
        solAmount: conversionResult.toAmount,
        ndtAmount: ndtConversionResult.toAmount
      };

    } catch (error) {
      console.error('Stars purchase failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during Stars purchase'
      };
    }
 }

  async convertStarsToSol(starsAmount: number): Promise<ConversionResult> {
    try {
      const rate = await this.getConversionRate('stars', 'sol');
      const fee = starsAmount * this.config.commissionRate;
      const netAmount = starsAmount - fee;
      const solAmount = netAmount * rate;

      return {
        success: true,
        fromAmount: starsAmount,
        toAmount: solAmount,
        rate,
        fee
      };
    } catch (error) {
      console.error('Stars to SOL conversion failed:', error);
      return {
        success: false,
        fromAmount: starsAmount,
        toAmount: 0,
        rate: 0,
        fee: 0,
        error: error instanceof Error ? error.message : 'Conversion failed'
      };
    }
  }

  async convertSolToNdt(solAmount: number): Promise<ConversionResult> {
    try {
      const rate = await this.getConversionRate('sol', 'ndt');
      const fee = solAmount * this.config.commissionRate;
      const netAmount = solAmount - fee;
      const ndtAmount = netAmount * rate;

      return {
        success: true,
        fromAmount: solAmount,
        toAmount: ndtAmount,
        rate,
        fee
      };
    } catch (error) {
      console.error('SOL to NDT conversion failed:', error);
      return {
        success: false,
        fromAmount: solAmount,
        toAmount: 0,
        rate: 0,
        fee: 0,
        error: error instanceof Error ? error.message : 'Conversion failed'
      };
    }
  }

  async getConversionRate(from: 'stars' | 'sol' | 'ndt', to: 'stars' | 'sol' | 'ndt'): Promise<number> {
    const cacheKey = `${from}-${to}`;
    const cached = this.conversionCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 60000) { // 1 минута
      return cached.rate;
    }

    // Запрос свежего курса
    const rate = await this.fetchConversionRate(from, to);

    this.conversionCache.set(cacheKey, {
      rate,
      timestamp: Date.now()
    });

    return rate;
  }

  private async fetchConversionRate(from: string, to: string): Promise<number> {
    // В реальной реализации здесь будет запрос к API
    // Для демонстрации используем фиксированные курсы
    const rates: Record<string, number> = {
      'stars-sol': 0.0001,    // 1 Star = 0.0001 SOL
      'sol-stars': 100,     // 1 SOL = 10000 Stars
      'sol-ndt': 1000,        // 1 SOL = 1000 NDT
      'ndt-sol': 0.001        // 1 NDT = 0.01 SOL
    };

    return rates[`${from}-${to}`] || 0;
  }

  async getStarsBalance(): Promise<number> {
    try {
      // Получение баланса Stars через мобильный сервис
      return await this.mobileService.getStarsBalance();
    } catch (error) {
      console.error('Failed to get Stars balance:', error);
      return 0;
    }
  }

 async getPurchaseHistory(limit: number = 10): Promise<StarsTransaction[]> {
    try {
      // Возвращаем последние транзакции из очереди
      return this.processingQueue
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get purchase history:', error);
      return [];
    }
  }

 private async updateConversionRates(): Promise<void> {
    try {
      // Обновление курсов валют
      await this.fetchConversionRate('stars', 'sol');
      await this.fetchConversionRate('sol', 'ndt');
      await this.fetchConversionRate('stars', 'ndt');
    } catch (error) {
      console.error('Failed to update conversion rates:', error);
    }
  }

 private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

 async processError(error: any, context: string): Promise<void> {
    console.error(`MobileStarsIntegration error in ${context}:`, error);
    // В реальной реализации здесь может быть логирование ошибок
    // и уведомление пользователя о проблемах
  }

  async checkStarsPaymentStatus(transactionId: string): Promise<any> {
    try {
      // Проверка статуса платежа через мобильный сервис
      return await this.mobileService.checkStarsPaymentStatus(transactionId);
    } catch (error) {
      console.error('Failed to check payment status:', error);
      throw error;
    }
  }

  async batchProcess(purchases: Array<{ amount: number; description: string }>): Promise<PurchaseResult[]> {
    const results: PurchaseResult[] = [];
    
    for (const purchase of purchases) {
      const result = await this.purchaseWithStars(purchase.amount, purchase.description);
      results.push(result);
    }
    
    return results;
 }

  // Метод для обработки мобильных специфичных ошибок
  async handleMobileSpecificError(error: any): Promise<PurchaseResult> {
    // Обработка ошибок, специфичных для мобильной среды
    if (error.code === 'E_USER_CANCELLED') {
      return {
        success: false,
        error: 'User cancelled the Stars purchase'
      };
    } else if (error.code === 'E_NETWORK_ERROR') {
      return {
        success: false,
        error: 'Network error during Stars purchase. Please check your connection.'
      };
    } else if (error.code === 'E_INSUFFICIENT_BALANCE') {
      return {
        success: false,
        error: 'Insufficient Stars balance for this purchase'
      };
    } else {
      return {
        success: false,
        error: error.message || 'Unknown error occurred during Stars purchase'
      };
    }
  }
}