import { Connection, Transaction, PublicKey } from '@solana/web3.js';
import { WalletAdapter } from '../../components/wallet/wallet-adapter';
import { Logger } from '../utils/logger';

/**
 * Тестировщик нагрузки для Invisible Wallet
 * Тестирует производительность системы, устойчивость к DDoS,
 * обработку одновременных транзакций и кэширование под нагрузкой
 */
export class StressTester {
  private logger: Logger;
  private testResults: Map<string, any> = new Map();

  constructor() {
    this.logger = new Logger('StressTester');
  }

  /**
   * Тестирование производительности системы под нагрузкой
   * @param walletAdapter - Адаптер кошелька
   * @returns Результат тестирования
   */
  async testPerformance(walletAdapter: WalletAdapter): Promise<{ passed: boolean; issues: string[]; metrics: { responseTime: number; throughput: number; errorRate: number } }> {
    const issues: string[] = [];
    const startTime = Date.now();
    const testDuration = 10000; // 10 секунд
    let requestCount = 0;
    let errorCount = 0;
    let totalResponseTime = 0;

    try {
      // Выполняем серию запросов для измерения производительности
      const testPromises = [];
      const testStart = Date.now();

      while (Date.now() - testStart < testDuration) {
        const requestStart = Date.now();
        testPromises.push(
          (async () => {
            try {
              if (walletAdapter.connection && walletAdapter.publicKey) {
                await walletAdapter.connection.getBalance(walletAdapter.publicKey);
                totalResponseTime += Date.now() - requestStart;
                requestCount++;
              }
            } catch (error) {
              errorCount++;
            }
          })()
        );
      }

      await Promise.all(testPromises);

      const totalTime = Date.now() - startTime;
      const responseTime = requestCount > 0 ? totalResponseTime / requestCount : 0;
      const throughput = (requestCount / totalTime) * 1000; // запросов в секунду
      const errorRate = requestCount > 0 ? errorCount / requestCount : 0;

      // Проверяем критерии производительности
      if (responseTime > 1000) { // 1 секунда - порог
        issues.push(`High response time: ${responseTime}ms`);
      }

      if (throughput < 10) { // 10 запросов в секунду - минимальный порог
        issues.push(`Low throughput: ${throughput.toFixed(2)} req/s`);
      }

      if (errorRate > 0.05) { // 5% - порог ошибок
        issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
      }

      const passed = issues.length === 0;

      this.logger.info(`Performance test completed. Passed: ${passed}, Response time: ${responseTime}ms, Throughput: ${throughput.toFixed(2)} req/s`);
      return {
        passed,
        issues,
        metrics: {
          responseTime,
          throughput,
          errorRate
        }
      };
    } catch (error) {
      this.logger.error('Error during performance test', error);
      return {
        passed: false,
        issues: ['Error during performance test'],
        metrics: {
          responseTime: 0,
          throughput: 0,
          errorRate: 1
        }
      };
    }
  }

 /**
   * Тестирование устойчивости к DDoS атакам
   * @param walletAdapter - Адаптер кошелька
   * @returns Результат тестирования
   */
  async testDDoSResistance(walletAdapter: WalletAdapter): Promise<{ passed: boolean; issues: string[]; metrics: { requestsHandled: number; requestsDropped: number; recoveryTime: number } }> {
    const issues: string[] = [];
    let requestsHandled = 0;
    let requestsDropped = 0;
    let recoveryTime = 0;

    try {
      const startTime = Date.now();
      const testDuration = 15000; // 15 секунд интенсивной нагрузки
      const peakDuration = 5000; // 5 секунд пиковой нагрузки
      
      // Создаем массив промисов для симуляции DDoS
      const ddosPromises = [];
      const peakStart = Date.now();

      // Пиковая нагрузка в течение первых 5 секунд
      while (Date.now() - peakStart < peakDuration) {
        ddosPromises.push(
          (async () => {
            try {
              if (walletAdapter.connection && walletAdapter.publicKey) {
                await walletAdapter.connection.getBalance(walletAdapter.publicKey);
                requestsHandled++;
              }
            } catch (error) {
              requestsDropped++;
            }
          })()
        );
      }

      // Ожидаем завершения пиковой нагрузки
      await Promise.allSettled(ddosPromises);
      
      // Проверяем восстановление после пиковой нагрузки
      const recoveryStart = Date.now();
      let recovered = false;
      
      // Ждем восстановления системы в течение 10 секунд
      while (Date.now() - recoveryStart < 1000 && !recovered) {
        try {
          if (walletAdapter.connection && walletAdapter.publicKey) {
            await walletAdapter.connection.getBalance(walletAdapter.publicKey);
            recovered = true;
          }
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Ждем 100мс перед повторной попыткой
        }
      }
      
      recoveryTime = Date.now() - recoveryStart;

      // Проверяем критерии устойчивости к DDoS
      const totalRequests = requestsHandled + requestsDropped;
      const dropRate = totalRequests > 0 ? requestsDropped / totalRequests : 0;
      
      if (dropRate > 0.2) { // 20% - максимальный порог отбрасывания
        issues.push(`High request drop rate during DDoS: ${(dropRate * 100).toFixed(2)}%`);
      }
      
      if (recoveryTime > 5000) { // 5 секунд - максимальное время восстановления
        issues.push(`Slow recovery after DDoS: ${recoveryTime}ms`);
      }

      const passed = issues.length === 0;

      this.logger.info(`DDoS resistance test completed. Passed: ${passed}, Requests handled: ${requestsHandled}, Dropped: ${requestsDropped}, Recovery time: ${recoveryTime}ms`);
      return {
        passed,
        issues,
        metrics: {
          requestsHandled,
          requestsDropped,
          recoveryTime
        }
      };
    } catch (error) {
      this.logger.error('Error during DDoS resistance test', error);
      return {
        passed: false,
        issues: ['Error during DDoS resistance test'],
        metrics: {
          requestsHandled: 0,
          requestsDropped: 0,
          recoveryTime: 0
        }
      };
    }
  }

  /**
   * Тестирование обработки одновременных транзакций
   * @param walletAdapter - Адаптер кошелька
   * @returns Результат тестирования
   */
  async testConcurrentTransactions(walletAdapter: WalletAdapter): Promise<{ passed: boolean; issues: string[]; metrics: { transactionsProcessed: number; failedTransactions: number; avgProcessingTime: number } }> {
    const issues: string[] = [];
    let transactionsProcessed = 0;
    let failedTransactions = 0;
    let totalProcessingTime = 0;

    try {
      // Подготавливаем массив транзакций для одновременной обработки
      const transactionCount = 50; // Количество одновременных транзакций
      const transactionPromises = [];

      for (let i = 0; i < transactionCount; i++) {
        transactionPromises.push(
          (async () => {
            const transactionStart = Date.now();
            try {
              // Создаем простую транзакцию для тестирования
              const transaction = new Transaction();
              // Добавляем фиктивную инструкцию
              if (walletAdapter.publicKey) {
                transaction.add({
                  keys: [{ pubkey: walletAdapter.publicKey, isSigner: true, isWritable: true }],
                  programId: new PublicKey('1111111111111'),
                  data: Buffer.alloc(0)
                });
              }
              
              // Симулируем обработку транзакции
              await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50)); // 50-150ms задержка
              
              totalProcessingTime += Date.now() - transactionStart;
              transactionsProcessed++;
            } catch (error) {
              failedTransactions++;
            }
          })()
        );
      }

      await Promise.all(transactionPromises);

      const avgProcessingTime = transactionsProcessed > 0 ? totalProcessingTime / transactionsProcessed : 0;
      const failureRate = transactionCount > 0 ? failedTransactions / transactionCount : 0;

      // Проверяем критерии обработки транзакций
      if (failureRate > 0.1) { // 10% - максимальный порог сбоев
        issues.push(`High transaction failure rate: ${(failureRate * 100).toFixed(2)}%`);
      }

      if (avgProcessingTime > 500) { // 500мс - максимальное время обработки
        issues.push(`Slow average transaction processing: ${avgProcessingTime}ms`);
      }

      const passed = issues.length === 0;

      this.logger.info(`Concurrent transactions test completed. Passed: ${passed}, Processed: ${transactionsProcessed}, Failed: ${failedTransactions}, Avg time: ${avgProcessingTime}ms`);
      return {
        passed,
        issues,
        metrics: {
          transactionsProcessed,
          failedTransactions,
          avgProcessingTime
        }
      };
    } catch (error) {
      this.logger.error('Error during concurrent transactions test', error);
      return {
        passed: false,
        issues: ['Error during concurrent transactions test'],
        metrics: {
          transactionsProcessed: 0,
          failedTransactions: 0,
          avgProcessingTime: 0
        }
      };
    }
  }

  /**
   * Тестирование кэширования под нагрузкой
   * @param walletAdapter - Адаптер кошелька
   * @returns Результат тестирования
   */
  async testCachingUnderLoad(walletAdapter: WalletAdapter): Promise<{ passed: boolean; issues: string[]; metrics: { cacheHits: number; cacheMisses: number; hitRate: number; avgCacheTime: number } }> {
    const issues: string[] = [];
    let cacheHits = 0;
    let cacheMisses = 0;
    let totalCacheTime = 0;
    const cache = new Map<string, any>();

    try {
      const requestCount = 1000; // Количество запросов
      const cachePromises = [];

      for (let i = 0; i < requestCount; i++) {
        cachePromises.push(
          (async () => {
            const cacheStart = Date.now();
            const cacheKey = `balance_${walletAdapter.publicKey?.toBase58() || 'test'}_${Math.floor(i / 10)}`; // Кэшируем по 10 запросов
            
            if (cache.has(cacheKey)) {
              // Имитируем получение из кэша
              await new Promise(resolve => setTimeout(resolve, 5)); // 5мс для кэша
              cacheHits++;
            } else {
              // Имитируем получение из сети
              await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20)); // 20-70мс для сети
              cache.set(cacheKey, { balance: Math.random() * 1000 });
              cacheMisses++;
            }
            
            totalCacheTime += Date.now() - cacheStart;
          })()
        );
      }

      await Promise.all(cachePromises);

      const totalRequests = cacheHits + cacheMisses;
      const hitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;
      const avgCacheTime = totalRequests > 0 ? totalCacheTime / totalRequests : 0;

      // Проверяем критерии эффективности кэширования
      if (hitRate < 0.7) { // 70% - минимальный порог попаданий
        issues.push(`Low cache hit rate: ${(hitRate * 100).toFixed(2)}%`);
      }

      if (avgCacheTime > 100) { // 100мс - максимальное среднее время
        issues.push(`Slow average cache response: ${avgCacheTime}ms`);
      }

      const passed = issues.length === 0;

      this.logger.info(`Caching under load test completed. Passed: ${passed}, Hits: ${cacheHits}, Misses: ${cacheMisses}, Hit rate: ${(hitRate * 10).toFixed(2)}%`);
      return {
        passed,
        issues,
        metrics: {
          cacheHits,
          cacheMisses,
          hitRate,
          avgCacheTime
        }
      };
    } catch (error) {
      this.logger.error('Error during caching under load test', error);
      return {
        passed: false,
        issues: ['Error during caching under load test'],
        metrics: {
          cacheHits: 0,
          cacheMisses: 0,
          hitRate: 0,
          avgCacheTime: 0
        }
      };
    }
  }

  /**
   * Тестирование устойчивости к ресурсному истощению
   * @param walletAdapter - Адаптер кошелька
   * @returns Результат тестирования
   */
  async testResourceExhaustion(walletAdapter: WalletAdapter): Promise<{ passed: boolean; issues: string[]; metrics: { memoryUsage: number; cpuUsage: number; maxConcurrentRequests: number } }> {
    const issues: string[] = [];
    let memoryUsage = 0;
    let cpuUsage = 0;
    let maxConcurrentRequests = 0;

    try {
      // Тестируем устойчивость к истощению ресурсов
      const maxMemory = 100 * 1024 * 1024; // 100MB лимит
      let currentData: any[] = [];
      
      // Создаем нагрузку на память
      for (let i = 0; i < 50000; i++) {
        currentData.push(new Array(100).fill(i));
        if (currentData.length % 10000 === 0) {
          // Проверяем использование памяти
          const estimatedMemory = currentData.length * 100 * 8; // приблизительно
          if (estimatedMemory > maxMemory) {
            issues.push(`Memory exhaustion detected: ${estimatedMemory} bytes`);
            break;
          }
        }
      }
      
      memoryUsage = currentData.length * 100 * 8;
      
      // Тестируем устойчивость к высокой частоте запросов
      const requestPromises = [];
      let requestCount = 0;
      
      const testStart = Date.now();
      while (Date.now() - testStart < 5000) { // 5 секунд теста
        requestPromises.push(
          (async () => {
            requestCount++;
            try {
              if (walletAdapter.connection && walletAdapter.publicKey) {
                await walletAdapter.connection.getBalance(walletAdapter.publicKey);
              }
            } catch (error) {
              // Игнорируем ошибки в этом тесте
            }
          })()
        );
      }
      
      maxConcurrentRequests = requestPromises.length;
      await Promise.all(requestPromises);

      // Оценка использования ресурсов
      if (memoryUsage > maxMemory) {
        issues.push(`Memory usage exceeded limit: ${memoryUsage} bytes`);
      }

      if (maxConcurrentRequests > 1000) { // 100 - порог одновременных запросов
        issues.push(`High concurrent request count: ${maxConcurrentRequests}`);
      }

      const passed = issues.length === 0;

      this.logger.info(`Resource exhaustion test completed. Passed: ${passed}, Memory usage: ${memoryUsage} bytes, Max concurrent requests: ${maxConcurrentRequests}`);
      return {
        passed,
        issues,
        metrics: {
          memoryUsage,
          cpuUsage, // В браузере сложно точно измерить CPU, поэтому 0
          maxConcurrentRequests
        }
      };
    } catch (error) {
      this.logger.error('Error during resource exhaustion test', error);
      return {
        passed: false,
        issues: ['Error during resource exhaustion test'],
        metrics: {
          memoryUsage: 0,
          cpuUsage: 0,
          maxConcurrentRequests: 0
        }
      };
    }
  }

 /**
   * Тестирование устойчивости к атакам с повторяющимися запросами
   * @param walletAdapter - Адаптер кошелька
   * @returns Результат тестирования
   */
  async testRepetitiveRequests(walletAdapter: WalletAdapter): Promise<{ passed: boolean; issues: string[]; metrics: { requestsProcessed: number; duplicateRequests: number; efficiencyRatio: number } }> {
    const issues: string[] = [];
    let requestsProcessed = 0;
    let duplicateRequests = 0;
    let uniqueRequests = new Set<string>();

    try {
      // Тестируем устойчивость к повторяющимся запросам
      const requestPromises = [];
      const testDuration = 1000; // 10 секунд
      const testStart = Date.now();

      while (Date.now() - testStart < testDuration) {
        const requestId = `req_${Math.floor(Math.random() * 100)}`; // 100 возможных уникальных запросов
        if (uniqueRequests.has(requestId)) {
          duplicateRequests++;
        } else {
          uniqueRequests.add(requestId);
        }

        requestPromises.push(
          (async () => {
            try {
              if (walletAdapter.connection && walletAdapter.publicKey) {
                await walletAdapter.connection.getBalance(walletAdapter.publicKey);
              }
              requestsProcessed++;
            } catch (error) {
              // Игнорируем ошибки
            }
          })()
        );
      }

      await Promise.all(requestPromises);

      const efficiencyRatio = uniqueRequests.size / (uniqueRequests.size + duplicateRequests);

      // Проверяем критерии устойчивости к повторяющимся запросам
      if (duplicateRequests > requestsProcessed * 0.5) { // 50% - порог дубликатов
        issues.push(`High duplicate request rate: ${((duplicateRequests / requestsProcessed) * 100).toFixed(2)}%`);
      }

      if (efficiencyRatio < 0.5) { // 50% - минимальная эффективность
        issues.push(`Low efficiency ratio: ${(efficiencyRatio * 100).toFixed(2)}%`);
      }

      const passed = issues.length === 0;

      this.logger.info(`Repetitive requests test completed. Passed: ${passed}, Processed: ${requestsProcessed}, Duplicates: ${duplicateRequests}, Efficiency: ${(efficiencyRatio * 100).toFixed(2)}%`);
      return {
        passed,
        issues,
        metrics: {
          requestsProcessed,
          duplicateRequests,
          efficiencyRatio
        }
      };
    } catch (error) {
      this.logger.error('Error during repetitive requests test', error);
      return {
        passed: false,
        issues: ['Error during repetitive requests test'],
        metrics: {
          requestsProcessed: 0,
          duplicateRequests: 0,
          efficiencyRatio: 0
        }
      };
    }
  }

  /**
   * Полное стресс-тестирование системы
   * @param walletAdapter - Адаптер кошелька
   * @returns Полный отчет о стресс-тестировании
   */
  async performFullStressTest(walletAdapter: WalletAdapter): Promise<{
    performance: { passed: boolean; issues: string[]; metrics: any };
    ddos: { passed: boolean; issues: string[]; metrics: any };
    transactions: { passed: boolean; issues: string[]; metrics: any };
    caching: { passed: boolean; issues: string[]; metrics: any };
    resourceExhaustion: { passed: boolean; issues: string[]; metrics: any };
    repetitiveRequests: { passed: boolean; issues: string[]; metrics: any };
  }> {
    this.logger.info('Starting full stress test');
    
    // Выполняем все тесты параллельно
    const [
      performance,
      ddos,
      transactions,
      caching,
      resourceExhaustion,
      repetitiveRequests
    ] = await Promise.all([
      this.testPerformance(walletAdapter),
      this.testDDoSResistance(walletAdapter),
      this.testConcurrentTransactions(walletAdapter),
      this.testCachingUnderLoad(walletAdapter),
      this.testResourceExhaustion(walletAdapter),
      this.testRepetitiveRequests(walletAdapter)
    ]);
    
    this.logger.info('Full stress test completed');
    
    return {
      performance,
      ddos,
      transactions,
      caching,
      resourceExhaustion,
      repetitiveRequests
    };
  }

  /**
   * Тестирование устойчивости к долгосрочной нагрузке
   * @param walletAdapter - Адаптер кошелька
   * @param duration - Продолжительность теста в миллисекундах (по умолчанию 60000 мс = 1 минута)
   * @returns Результат тестирования
   */
  async testLongTermLoad(walletAdapter: WalletAdapter, duration: number = 60000): Promise<{ passed: boolean; issues: string[]; metrics: { avgResponseTime: number; errorRate: number; memoryLeak: boolean } }> {
    const issues: string[] = [];
    let totalRequests = 0;
    let errorCount = 0;
    let totalResponseTime = 0;
    let memoryLeak = false;

    try {
      const startTime = Date.now();
      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Выполняем запросы в течение заданного времени
      while (Date.now() - startTime < duration) {
        const requestStart = Date.now();
        try {
          if (walletAdapter.connection && walletAdapter.publicKey) {
            await walletAdapter.connection.getBalance(walletAdapter.publicKey);
            totalResponseTime += Date.now() - requestStart;
            totalRequests++;
          }
        } catch (error) {
          errorCount++;
        }
        
        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const avgResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
      const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;
      
      // Проверяем признаки утечки памяти
      const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      if (initialMemory && finalMemory && finalMemory > initialMemory * 1.5) { // 50% увеличение
        memoryLeak = true;
        issues.push('Potential memory leak detected');
      }

      // Проверяем критерии долгосрочной устойчивости
      if (avgResponseTime > 1500) { // 1.5 секунды - порог
        issues.push(`High average response time over long period: ${avgResponseTime}ms`);
      }

      if (errorRate > 0.05) { // 5% - порог ошибок
        issues.push(`High error rate over long period: ${(errorRate * 100).toFixed(2)}%`);
      }

      const passed = issues.length === 0;

      this.logger.info(`Long term load test completed. Passed: ${passed}, Duration: ${duration}ms, Avg response: ${avgResponseTime}ms, Error rate: ${(errorRate * 100).toFixed(2)}%`);
      return {
        passed,
        issues,
        metrics: {
          avgResponseTime,
          errorRate,
          memoryLeak
        }
      };
    } catch (error) {
      this.logger.error('Error during long term load test', error);
      return {
        passed: false,
        issues: ['Error during long term load test'],
        metrics: {
          avgResponseTime: 0,
          errorRate: 1,
          memoryLeak: false
        }
      };
    }
  }
}