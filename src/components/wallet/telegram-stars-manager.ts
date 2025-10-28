import { logger } from "@/lib/utils/logger";
import { InvisibleWalletConfig } from "./invisible-wallet-adapter";

/**
 * Результат покупки за Stars
 */
export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  starsAmount?: number;
  convertedAmount?: number;
}

/**
 * Результат конвертации
 */
export interface ConversionResult {
  success: boolean;
  fromAmount: number;
  toAmount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  fee: number;
  error?: string;
}

/**
 * Курс конвертации
 */
export interface ConversionRate {
  from: string;
  to: string;
  rate: number;
  fee: number;
  timestamp: number;
  source: string;
}

/**
 * Данные о балансе Stars
 */
export interface StarsBalance {
  amount: number;
  lastUpdated: number;
  currency: "stars";
}

/**
 * Менеджер Telegram Stars
 *
 * Ответственности:
 * - Интеграция с Telegram Payments API
 * - Конвертация Stars в криптовалюту
 * - Управление балансом Stars
 * - Кэширование курсов конвертации
 */
export class TelegramStarsManager {
  private _config: InvisibleWalletConfig;
  private _conversionRates: Map<string, ConversionRate> = new Map();
  private _balanceCache: StarsBalance | null = null;
  private _isTelegramWebApp: boolean = false;

  constructor(config: InvisibleWalletConfig) {
    this._config = config;
    this._isTelegramWebApp = this._checkTelegramWebApp();
    this._initializeConversionRates();
  }

  /**
   * Покупка за Stars
   */
  async purchaseWithStars(
    amount: number,
    description: string
  ): Promise<PurchaseResult> {
    try {
      if (!this._isTelegramWebApp) {
        return {
          success: false,
          error: "Not in Telegram WebApp environment",
        };
      }

      // 1. Проверка баланса Stars
      const balance = await this.getStarsBalance();
      if (balance < amount) {
        return {
          success: false,
          error: "Insufficient Stars balance",
        };
      }

      // 2. Создание инвойса через Telegram Payments API
      const invoiceResult = await this._createInvoice(amount, description);
      if (!invoiceResult.success) {
        return {
          success: false,
          error: invoiceResult.error,
        };
      }

      // 3. Обработка платежа
      const paymentResult = await this._processPayment(
        invoiceResult.invoiceId!
      );
      if (!paymentResult.success) {
        return {
          success: false,
          error: paymentResult.error,
        };
      }

      // 4. Конвертация Stars в SOL/NDT
      const conversionResult = await this.convertStarsToSol(amount);
      if (!conversionResult.success) {
        return {
          success: false,
          error: `Payment successful but conversion failed: ${conversionResult.error}`,
        };
      }

      // 5. Обновление баланса
      await this._updateBalance(-amount);

      logger.info("Stars purchase completed", {
        amount,
        description,
        transactionId: paymentResult.transactionId,
        convertedAmount: conversionResult.toAmount,
      });

      return {
        success: true,
        transactionId: paymentResult.transactionId,
        starsAmount: amount,
        convertedAmount: conversionResult.toAmount,
      };
    } catch (error) {
      logger.error("Stars purchase failed", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Purchase failed",
      };
    }
  }

  /**
   * Конвертация Stars в SOL
   */
  async convertStarsToSol(starsAmount: number): Promise<ConversionResult> {
    try {
      const rate = await this._getConversionRate("stars", "sol");
      if (!rate) {
        return {
          success: false,
          fromAmount: starsAmount,
          toAmount: 0,
          fromCurrency: "stars",
          toCurrency: "sol",
          rate: 0,
          fee: 0,
          error: "Conversion rate not available",
        };
      }

      const fee = starsAmount * rate.fee;
      const netAmount = starsAmount - fee;
      const convertedAmount = netAmount * rate.rate;

      return {
        success: true,
        fromAmount: starsAmount,
        toAmount: convertedAmount,
        fromCurrency: "stars",
        toCurrency: "sol",
        rate: rate.rate,
        fee,
      };
    } catch (error) {
      logger.error("Stars to SOL conversion failed", error);
      return {
        success: false,
        fromAmount: starsAmount,
        toAmount: 0,
        fromCurrency: "stars",
        toCurrency: "sol",
        rate: 0,
        fee: 0,
        error: error instanceof Error ? error.message : "Conversion failed",
      };
    }
  }

  /**
   * Конвертация SOL в NDT
   */
  async convertSolToNdt(solAmount: number): Promise<ConversionResult> {
    try {
      const rate = await this.getConversionRate("sol", "ndt");
      if (!rate) {
        return {
          success: false,
          fromAmount: solAmount,
          toAmount: 0,
          fromCurrency: "sol",
          toCurrency: "ndt",
          rate: 0,
          fee: 0,
          error: "Conversion rate not available",
        };
      }

      const fee = solAmount * rate.fee;
      const netAmount = solAmount - fee;
      const convertedAmount = netAmount * rate.rate;

      return {
        success: true,
        fromAmount: solAmount,
        toAmount: convertedAmount,
        fromCurrency: "sol",
        toCurrency: "ndt",
        rate: rate.rate,
        fee,
      };
    } catch (error) {
      logger.error("SOL to NDT conversion failed", error);
      return {
        success: false,
        fromAmount: solAmount,
        toAmount: 0,
        fromCurrency: "sol",
        toCurrency: "ndt",
        rate: 0,
        fee: 0,
        error: error instanceof Error ? error.message : "Conversion failed",
      };
    }
  }

  /**
   * Получение баланса Stars
   */
  async getStarsBalance(): Promise<number> {
    try {
      // Проверка кэша
      if (this._balanceCache) {
        const cacheAge = Date.now() - this._balanceCache.lastUpdated;
        if (cacheAge < 60000) {
          // 1 минута кэш
          return this._balanceCache.amount;
        }
      }

      if (!this._isTelegramWebApp) {
        // Mock баланс для демонстрации
        const mockBalance = 1000;
        this._balanceCache = {
          amount: mockBalance,
          lastUpdated: Date.now(),
          currency: "stars",
        };
        return mockBalance;
      }

      // Получение баланса через Telegram WebApp API
      const balance = await this._getTelegramBalance();

      this._balanceCache = {
        amount: balance,
        lastUpdated: Date.now(),
        currency: "stars",
      };

      return balance;
    } catch (error) {
      logger.error("Failed to get Stars balance", error);
      return this._balanceCache?.amount || 0;
    }
  }

  /**
   * Получение курса конвертации
   */
  async getConversionRate(
    from: string,
    to: string
  ): Promise<ConversionRate | null> {
    const key = `${from}_${to}`;
    const cached = this._conversionRates.get(key);

    if (cached && Date.now() - cached.timestamp < 300000) {
      // 5 минут кэш
      return cached;
    }

    // Запрос свежего курса
    const freshRate = await this._fetchConversionRate(from, to);
    if (freshRate) {
      this._conversionRates.set(key, freshRate);
    }

    return freshRate;
  }

  /**
   * Обновление курсов конвертации
   */
  async updateConversionRates(): Promise<void> {
    try {
      const pairs = [
        ["stars", "sol"],
        ["sol", "ndt"],
        ["stars", "ndt"],
      ];

      for (const [from, to] of pairs) {
        const rate = await this._fetchConversionRate(from, to);
        if (rate) {
          this._conversionRates.set(`${from}_${to}`, rate);
        }
      }

      logger.info("Conversion rates updated");
    } catch (error) {
      logger.error("Failed to update conversion rates", error);
    }
  }

  /**
   * Проверка доступности Stars
   */
  isStarsAvailable(): boolean {
    return this._isTelegramWebApp;
  }

  /**
   * Получение истории транзакций Stars
   */
  async getStarsHistory(limit: number = 50): Promise<any[]> {
    try {
      if (!this._isTelegramWebApp) {
        return [];
      }

      // В реальной реализации здесь должен быть запрос к Telegram API
      return [];
    } catch (error) {
      logger.error("Failed to get Stars history", error);
      return [];
    }
  }

  // Приватные методы

  private _checkTelegramWebApp(): boolean {
    return (
      typeof window !== "undefined" &&
      "Telegram" in window &&
      "WebApp" in (window as any).Telegram
    );
  }

  private async _initializeConversionRates(): Promise<void> {
    // Инициализация mock курсов для демонстрации
    const mockRates: ConversionRate[] = [
      {
        from: "stars",
        to: "sol",
        rate: 0.00001, // 1 STAR = 0.00001 SOL
        fee: 0.02, // 2% комиссия
        timestamp: Date.now(),
        source: "mock",
      },
      {
        from: "sol",
        to: "ndt",
        rate: 1000, // 1 SOL = 1000 NDT
        fee: 0.01, // 1% комиссия
        timestamp: Date.now(),
        source: "mock",
      },
    ];

    for (const rate of mockRates) {
      this._conversionRates.set(`${rate.from}_${rate.to}`, rate);
    }
  }

  private async _createInvoice(
    amount: number,
    description: string
  ): Promise<{
    success: boolean;
    invoiceId?: string;
    error?: string;
  }> {
    try {
      if (!this._isTelegramWebApp) {
        return {
          success: false,
          error: "Telegram WebApp not available",
        };
      }

      // В реальной реализации здесь должен быть запрос к Telegram Payments API
      const invoiceId = `invoice_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      return {
        success: true,
        invoiceId,
      };
    } catch (error) {
      logger.error("Failed to create invoice", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Invoice creation failed",
      };
    }
  }

  private async _processPayment(invoiceId: string): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    try {
      // В реальной реализации здесь должна быть обработка платежа
      // через Telegram Payments API

      const transactionId = `tx_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      return {
        success: true,
        transactionId,
      };
    } catch (error) {
      logger.error("Failed to process payment", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Payment processing failed",
      };
    }
  }

  private async _getTelegramBalance(): Promise<number> {
    try {
      // В реальной реализации здесь должен быть запрос к Telegram WebApp API
      // Для демонстрации возвращаем mock значение
      return 1000;
    } catch (error) {
      logger.error("Failed to get Telegram balance", error);
      return 0;
    }
  }

  private async _updateBalance(delta: number): Promise<void> {
    if (this._balanceCache) {
      this._balanceCache.amount += delta;
      this._balanceCache.lastUpdated = Date.now();
    }
  }

  private async _fetchConversionRate(
    from: string,
    to: string
  ): Promise<ConversionRate | null> {
    try {
      // В реальной реализации здесь должен быть запрос к API курса
      // Для демонстрации возвращаем mock данные

      const mockRates: Record<string, ConversionRate> = {
        stars_sol: {
          from: "stars",
          to: "sol",
          rate: 0.00001,
          fee: 0.02,
          timestamp: Date.now(),
          source: "api",
        },
        sol_ndt: {
          from: "sol",
          to: "ndt",
          rate: 1000,
          fee: 0.01,
          timestamp: Date.now(),
          source: "api",
        },
        stars_ndt: {
          from: "stars",
          to: "ndt",
          rate: 0.01,
          fee: 0.025,
          timestamp: Date.now(),
          source: "api",
        },
      };

      return mockRates[`${from}_${to}`] || null;
    } catch (error) {
      logger.error("Failed to fetch conversion rate", error);
      return null;
    }
  }
}

/**
 * Утилиты для работы с Telegram Stars
 */
export class TelegramStarsUtils {
  /**
   * Форматирование суммы Stars
   */
  static formatStars(amount: number): string {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "XTR", // Код Telegram Stars
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Расчет комиссии за конвертацию
   */
  static calculateConversionFee(amount: number, feePercent: number): number {
    return amount * feePercent;
  }

  /**
   * Расчет чистой суммы после комиссии
   */
  static calculateNetAmount(amount: number, feePercent: number): number {
    const fee = this.calculateConversionFee(amount, feePercent);
    return amount - fee;
  }

  /**
   * Проверка лимитов транзакций
   */
  static checkTransactionLimits(amount: number): {
    withinLimits: boolean;
    minLimit: number;
    maxLimit: number;
  } {
    const minLimit = 1; // Минимум 1 STAR
    const maxLimit = 10000; // Максимум 10000 Stars

    return {
      withinLimits: amount >= minLimit && amount <= maxLimit,
      minLimit,
      maxLimit,
    };
  }

  /**
   * Получение описания транзакции
   */
  static getTransactionDescription(type: string, amount: number): string {
    const descriptions: Record<string, string> = {
      purchase: `Покупка за ${this.formatStars(amount)}`,
      conversion: `Конвертация ${this.formatStars(amount)}`,
      donation: `Донат ${this.formatStars(amount)}`,
      subscription: `Подписка ${this.formatStars(amount)}`,
    };

    return descriptions[type] || `Транзакция ${this.formatStars(amount)}`;
  }
}
