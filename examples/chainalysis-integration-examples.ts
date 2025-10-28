/**
 * 🔗 Chainalysis Integration Examples
 *
 * Примеры использования интеграции Chainalysis с AML системой
 */

import { ChainalysisService } from "../src/lib/aml-kyc/chainalysis-service";
import { ChainalysisAMLIntegration } from "../src/lib/aml-kyc/chainalysis-aml-integration";
import { ChainalysisAsset } from "../src/lib/aml-kyc/chainalysis-types";
import { MonitoredTransaction, TransactionType } from "../src/lib/aml-kyc/types";

// ============================================================================
// Пример 1: Анализ адреса через Chainalysis
// ============================================================================

export async function analyzeAddressExample() {
  console.log("🔗 Анализ адреса через Chainalysis");
  
  const chainalysisService = new ChainalysisService();
  
  try {
    const result = await chainalysisService.analyzeAddress({
      address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDs8",
      asset: "SOL",
      includeTransactions: true,
      includeExposure: true,
      includeIdentifications: true,
    });

    if (result.success && result.data) {
      console.log("✅ Анализ завершен успешно:");
      console.log(`   Адрес: ${result.data.address}`);
      console.log(`   Уровень риска: ${result.data.risk}`);
      console.log(`   Уверенность: ${result.data.confidence}%`);
      console.log(`   Категории: ${result.data.categories.join(", ")}`);
      console.log(`   Экспозиция риска: ${result.data.exposure.total}%`);
      console.log(`   Количество транзакций: ${result.data.transactionCount}`);
      console.log(`   Общий полученный объем: ${result.data.totalReceived}`);
      console.log(`   Баланс: ${result.data.balance}`);
      
      // Проверяем на высокий риск
      if (result.data.risk === "HIGH" || result.data.risk === "SEVERE") {
        console.log("⚠️ Обнаружен высокий уровень риска!");
        console.log("Рекомендуется:");
        console.log("   - Ручная проверка транзакции");
        console.log("   - Усиленный мониторинг адреса");
        console.log("   - Рассмотрение блокировки");
      }
    } else {
      console.log("❌ Ошибка анализа:", result.error?.message);
    }
  } catch (error) {
    console.error("💥 Критическая ошибка:", error);
  }
}

// ============================================================================
// Пример 2: Комплексный анализ транзакции с AML + Chainalysis
// ============================================================================

export async function analyzeTransactionWithAMLExample() {
  console.log("🔗 Комплексный анализ транзакции");
  
  const integration = new ChainalysisAMLIntegration();
  
  // Создаем тестовую транзакцию
  const transaction: Omit<MonitoredTransaction, "id" | "riskScore" | "riskLevel" | "monitoringStatus"> = {
    transactionHash: "5j7s8L9K2B4H6R9N3K1m3A9c1K3o8s9J2sW9",
    userId: "user-123",
    walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDs8",
    type: "TRANSFER" as TransactionType,
    amount: 5000,
    currency: "SOL",
    fromAddress: "7xKXtg2CW87d97TXJSDpbD5BXgkU8",
    toAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDs8",
    timestamp: "2023-12-01T12:00:00Z",
    blockNumber: 12345,
    additionalData: {
      description: "Transfer between user wallets",
      category: "peer-to-peer",
    },
  };

  try {
    const analyzedTransaction = await integration.analyzeTransactionWithChainalysis(transaction);
    
    console.log("✅ Анализ транзакции завершен:");
    console.log(`   Хеш: ${analyzedTransaction.transactionHash}`);
    console.log(`   Общий риск: ${analyzedTransaction.riskScore}/100`);
    console.log(`   Уровень риска: ${analyzedTransaction.riskLevel}`);
    console.log(`   Статус мониторинга: ${analyzedTransaction.monitoringStatus}`);
    
    if (analyzedTransaction.flaggedReasons && analyzedTransaction.flaggedReasons.length > 0) {
      console.log("⚠️ Причины флагирования:");
      analyzedTransaction.flaggedReasons.forEach(reason => {
        console.log(`   - ${reason}`);
      });
    }
    
    // Проверяем данные Chainalysis
    const chainalysisData = analyzedTransaction.additionalData?.chainalysisIntegration;
    if (chainalysisData) {
      console.log("🔗 Данные Chainalysis:");
      console.log(`   Риск Chainalysis: ${chainalysisData.riskScore}/100`);
      console.log(`   Уровень: ${chainalysisData.riskLevel}`);
      console.log(`   Требует ручной проверки: ${chainalysisData.requiresManualReview}`);
      console.log(`   Следует заблокировать: ${chainalysisData.shouldBlock}`);
      console.log(`   Следует отчетить: ${chainalysisData.shouldReport}`);
      
      if (chainalysisData.recommendations.length > 0) {
        console.log("   Рекомендации:");
        chainalysisData.recommendations.forEach(rec => {
          console.log(`     - ${rec}`);
        });
      }
    }
  } catch (error) {
    console.error("💥 Критическая ошибка:", error);
  }
}

// ============================================================================
// Пример 3: Мониторинг адреса в реальном времени
// ============================================================================

export async function monitorAddressExample() {
  console.log("🔗 Мониторинг адреса в реальном времени");
  
  const integration = new ChainalysisAMLIntegration();
  const address = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDs8";
  
  try {
    const monitoringResult = await integration.monitorAddress(address, "SOL");
    
    console.log("✅ Мониторинг настроен:");
    console.log(`   Адрес: ${address}`);
    console.log(`   Уровень риска: ${monitoringResult.riskLevel}`);
    console.log(`   Требует действий: ${monitoringResult.requiresAction}`);
    
    if (monitoringResult.recommendations.length > 0) {
      console.log("   Рекомендации:");
      monitoringResult.recommendations.forEach(rec => {
        console.log(`     - ${rec}`);
      });
    }
    
    // Если требуются действия - выполняем их
    if (monitoringResult.requiresAction) {
      console.log("🚨 Требуются немедленные действия!");
      
      if (monitoringResult.riskLevel === "CRITICAL") {
        console.log("   БЛОКИРОВКА: Критический риск - блокируем транзакции");
        // await blockTransactionsForAddress(address);
      } else if (monitoringResult.riskLevel === "HIGH") {
        console.log("   ПРОВЕРКА: Высокий риск - требуем ручную проверку");
        // await createManualReviewTicket(address);
      }
      
      // Отправляем уведомление
      // await sendSecurityAlert({
      //   address,
      //   riskLevel: monitoringResult.riskLevel,
      //   recommendations: monitoringResult.recommendations,
      // });
    }
  } catch (error) {
    console.error("💥 Критическая ошибка:", error);
  }
}

// ============================================================================
// Пример 4: Анализ рисков портфеля
// ============================================================================

export async function analyzePortfolioRiskExample() {
  console.log("🔗 Анализ рисков портфеля");
  
  const integration = new ChainalysisAMLIntegration();
  
  // Адреса для анализа портфеля
  const portfolioAddresses = [
    "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDs8",
    "7xKXtg2CW87d97TXJSDpbD5BXgkU8",
    "5KQwrPbwdL6PhJuDJWEbRq9pKzW",
    "3HCqJZQhUvX7XeQqNqW8XKq8XqNqW8",
  ];
  
  try {
    const portfolioReport = await integration.getPortfolioRiskReport(portfolioAddresses, "SOL");
    
    if (portfolioReport.success) {
      console.log("✅ Анализ портфеля завершен:");
      console.log(`   Общий риск: ${portfolioReport.overallRisk}`);
      console.log(`   Оценка риска: ${portfolioReport.riskScore}/100`);
      console.log(`   Количество адресов: ${portfolioAddresses.length}`);
      
      if (portfolioReport.highRiskAddresses.length > 0) {
        console.log(`   Высокорисковые адреса (${portfolioReport.highRiskAddresses.length}):`);
        portfolioReport.highRiskAddresses.forEach(addr => {
          console.log(`     - ${addr}`);
        });
      }
      
      if (portfolioReport.recommendations.length > 0) {
        console.log("   Рекомендации по портфелю:");
        portfolioReport.recommendations.forEach(rec => {
          console.log(`     - ${rec}`);
        });
      }
      
      // Генерируем отчет
      if (portfolioReport.reportId) {
        console.log(`   ID отчета: ${portfolioReport.reportId}`);
        console.log("   Отчет сохранен в системе");
      }
      
      // Принимаем решения на основе анализа
      if (portfolioReport.overallRisk === "CRITICAL") {
        console.log("🚨 КРИТИЧЕСКИЙ РИСК ПОРТФЕЛЯ!");
        console.log("   Рекомендуется:");
        console.log("     - Немедленная ребалансировка портфеля");
        console.log("     - Вывод средств из высокорисковых активов");
        console.log("     - Создание отчета для регулятора");
      } else if (portfolioReport.overallRisk === "HIGH") {
        console.log("⚠️ ВЫСОКИЙ РИСК ПОРТФЕЛЯ");
        console.log("   Рекомендуется:");
        console.log("     - Постепенная диверсификация");
        console.log("     - Усиленный мониторинг");
        console.log("     - Рассмотрение хеджирования");
      }
    } else {
      console.log("❌ Ошибка анализа портфеля:", portfolioReport);
    }
  } catch (error) {
    console.error("💥 Критическая ошибка:", error);
  }
}

// ============================================================================
// Пример 5: Оценка риска пользователя с Chainalysis
// ============================================================================

export async function assessUserRiskExample() {
  console.log("🔗 Оценка риска пользователя с Chainalysis");
  
  const integration = new ChainalysisAMLIntegration();
  const userId = "user-123";
  
  try {
    const riskAssessment = await integration.assessUserRiskWithChainalysis(userId, "system");
    
    if (riskAssessment) {
      console.log("✅ Оценка риска пользователя завершена:");
      console.log(`   ID пользователя: ${riskAssessment.userId}`);
      console.log(`   Кошелек: ${riskAssessment.walletAddress}`);
      console.log(`   Общий риск: ${riskAssessment.overallRiskScore}/100`);
      console.log(`   Уровень риска: ${riskAssessment.riskLevel}`);
      console.log(`   Дата оценки: ${riskAssessment.lastAssessed}`);
      console.log(`   Следующая проверка: ${riskAssessment.nextReviewDate}`);
      
      // Анализируем факторы риска
      console.log("   Факторы риска:");
      riskAssessment.factors.forEach(factor => {
        console.log(`     - ${factor.name}: ${factor.score}/100 (вес: ${factor.weight})`);
        console.log(`       ${factor.description}`);
      });
      
      // Проверяем данные Chainalysis
      const chainalysisResults = riskAssessment.additionalData?.chainalysisResults;
      if (chainalysisResults && chainalysisResults.length > 0) {
        console.log("   Результаты Chainalysis по адресам:");
        chainalysisResults.forEach(result => {
          console.log(`     - ${result.address}: риск ${result.riskScore}/100 (${result.riskLevel})`);
        });
      }
      
      // Принимаем решения на основе оценки
      if (riskAssessment.riskLevel === "CRITICAL") {
        console.log("🚨 КРИТИЧЕСКИЙ РИСК ПОЛЬЗОВАТЕЛЯ!");
        console.log("   Рекомендуется:");
        console.log("     - Приостановка всех операций");
        console.log("     - Немедленная верификация документов");
        console.log("     - Создание отчета для регулятора");
      } else if (riskAssessment.riskLevel === "HIGH") {
        console.log("⚠️ ВЫСОКИЙ РИСК ПОЛЬЗОВАТЕЛЯ");
        console.log("   Рекомендуется:");
        console.log("     - Ограничение лимитов");
        console.log("     - Дополнительная верификация");
        console.log("     - Усиленный мониторинг");
      }
    } else {
      console.log("❌ Ошибка оценки риска пользователя");
    }
  } catch (error) {
    console.error("💥 Критическая ошибка:", error);
  }
}

// ============================================================================
// Пример 6: Создание правил мониторинга
// ============================================================================

export async function createMonitoringRulesExample() {
  console.log("🔗 Создание правил мониторинга");
  
  const chainalysisService = new ChainalysisService();
  
  try {
    // Правило 1: Обнаружение крупных транзакций
    const largeTransactionRule = await chainalysisService.createMonitoringRule({
      name: "Large Transaction Detection",
      description: "Обнаружение транзакций с суммой более $50,000",
      isActive: true,
      conditions: [
        {
          field: "amount",
          operator: "GREATER_THAN",
          value: 50000,
          weight: 100,
        },
      ],
      actions: [
        {
          type: "ALERT",
          parameters: { priority: "HIGH" },
        },
        {
          type: "FLAG",
        },
        {
          type: "REQUIRE_MANUAL_REVIEW",
        },
      ],
    });
    
    if (largeTransactionRule.success) {
      console.log("✅ Правило крупных транзакций создано:", largeTransactionRule.ruleId);
    }
    
    // Правило 2: Обнаружение миксеров
    const mixerRule = await chainalysisService.createMonitoringRule({
      name: "Mixer Detection",
      description: "Обнаружение транзакций через миксеры",
      isActive: true,
      conditions: [
        {
          field: "category",
          operator: "CONTAINS",
          value: "MIXER",
          weight: 100,
        },
      ],
      actions: [
        {
          type: "ALERT",
          parameters: { priority: "CRITICAL" },
        },
        {
          type: "BLOCK",
        },
        {
          type: "REPORT",
        },
      ],
    });
    
    if (mixerRule.success) {
      console.log("✅ Правило обнаружения миксеров создано:", mixerRule.ruleId);
    }
    
    // Правило 3: Обнаружение незаконной деятельности
    const illegalActivityRule = await chainalysisService.createMonitoringRule({
      name: "Illegal Activity Detection",
      description: "Обнаружение связей с незаконной деятельностью",
      isActive: true,
      conditions: [
        {
          field: "category",
          operator: "CONTAINS",
          value: "ILLEGAL",
          weight: 100,
        },
      ],
      actions: [
        {
          type: "ALERT",
          parameters: { priority: "CRITICAL" },
        },
        {
          type: "BLOCK",
        },
        {
          type: "REPORT",
        },
      ],
    });
    
    if (illegalActivityRule.success) {
      console.log("✅ Правило обнаружения незаконной деятельности создано:", illegalActivityRule.ruleId);
    }
    
    console.log("🎯 Все правила мониторинга успешно созданы");
  } catch (error) {
    console.error("💥 Критическая ошибка:", error);
  }
}

// ============================================================================
// Пример 7: Генерация отчетов
// ============================================================================

export async function generateReportsExample() {
  console.log("🔗 Генерация отчетов");
  
  const chainalysisService = new ChainalysisService();
  
  try {
    // Отчет 1: Анализ адреса
    const addressReport = await chainalysisService.createReport(
      "ADDRESS_ANALYSIS",
      "Address Analysis Report - High Risk Address",
      "Детальный анализ высокорискового адреса",
      {
        address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDs8",
        asset: "SOL",
        riskLevel: "HIGH",
        riskScore: 85,
        categories: ["MIXER", "HIGH_RISK"],
        recommendations: [
          "Блокировать транзакции",
          "Создать SAR отчет",
          "Уведомить команду безопасности",
        ],
      }
    );
    
    if (addressReport.success) {
      console.log("✅ Отчет анализа адреса создан:", addressReport.reportId);
    }
    
    // Отчет 2: Сводка комплаенса
    const complianceReport = await chainalysisService.createReport(
      "COMPLIANCE_SUMMARY",
      "Monthly Compliance Summary",
      "Ежемесячная сводка по комплаенсу",
      {
        period: "2023-12",
        totalTransactions: 15420,
        flaggedTransactions: 127,
        blockedTransactions: 23,
        averageRiskScore: 35,
        highRiskAddresses: 8,
        recommendations: [
          "Усилить мониторинг высокорисковых адресов",
          "Пересмотреть пороги риска",
          "Обновить правила комплаенса",
        ],
      }
    );
    
    if (complianceReport.success) {
      console.log("✅ Отчет сводки комплаенса создан:", complianceReport.reportId);
    }
    
    console.log("📊 Все отчеты успешно сгенерированы");
  } catch (error) {
    console.error("💥 Критическая ошибка:", error);
  }
}

// ============================================================================
// Пример 8: Обработка событий мониторинга
// ============================================================================

export async function handleMonitoringEventsExample() {
  console.log("🔗 Обработка событий мониторинга");
  
  const chainalysisService = new ChainalysisService();
  
  try {
    // Получаем события мониторинга за последние 24 часа
    const events = await chainalysisService.getMonitoringEvents({
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      limit: 50,
    });
    
    console.log(`📋 Получено ${events.length} событий мониторинга`);
    
    // Группируем события по уровню риска
    const eventsByRisk = events.reduce((acc, event) => {
      const risk = event.risk;
      if (!acc[risk]) acc[risk] = [];
      acc[risk].push(event);
      return acc;
    }, {} as Record<string, typeof events>);
    
    // Обрабатываем события
    Object.entries(eventsByRisk).forEach(([risk, riskEvents]) => {
      console.log(`⚠️ События с риском ${risk} (${riskEvents.length}):`);
      
      riskEvents.forEach(event => {
        console.log(`   - ${event.timestamp}: ${event.ruleName}`);
        console.log(`     Адрес: ${event.address || "N/A"}`);
        console.log(`     Транзакция: ${event.transactionHash || "N/A"}`);
        console.log(`     Актив: ${event.asset}`);
        
        if (!event.processed) {
          console.log(`     🔄 Требует обработки`);
          
          // Обрабатываем событие
          switch (risk) {
            case "SEVERE":
              console.log("       🚨 НЕМЕДЛЕННЫЕ ДЕЙСТВИЯ: Блокировка");
              // await processSevereEvent(event);
              break;
            case "HIGH":
              console.log("       ⚠️ СРОЧНАЯ ПРОВЕРКА: Ручная проверка");
              // await processHighEvent(event);
              break;
            case "MEDIUM":
              console.log("       📋 ВНИМАНИЕ: Усиленный мониторинг");
              // await processMediumEvent(event);
              break;
            default:
              console.log("       📝 ЛОГИРОВАНИЕ: Стандартная обработка");
              // await processLowEvent(event);
          }
        }
      });
    });
    
    console.log("✅ Обработка событий мониторинга завершена");
  } catch (error) {
    console.error("💥 Критическая ошибка:", error);
  }
}

// ============================================================================
// Главный пример - запуск всех функций
// ============================================================================

export async function runAllChainalysisExamples() {
  console.log("🚀 Запуск всех примеров интеграции Chainalysis");
  console.log("=" .repeat(60));
  
  try {
    // 1. Анализ адреса
    await analyzeAddressExample();
    console.log();
    
    // 2. Анализ транзакции
    await analyzeTransactionWithAMLExample();
    console.log();
    
    // 3. Мониторинг адреса
    await monitorAddressExample();
    console.log();
    
    // 4. Анализ портфеля
    await analyzePortfolioRiskExample();
    console.log();
    
    // 5. Оценка риска пользователя
    await assessUserRiskExample();
    console.log();
    
    // 6. Создание правил мониторинга
    await createMonitoringRulesExample();
    console.log();
    
    // 7. Генерация отчетов
    await generateReportsExample();
    console.log();
    
    // 8. Обработка событий мониторинга
    await handleMonitoringEventsExample();
    console.log();
    
    console.log("✅ Все примеры успешно выполнены!");
  } catch (error) {
    console.error("💥 Ошибка при выполнении примеров:", error);
  }
}

// ============================================================================
// Экспорт функций для использования
// ============================================================================

export {
  analyzeAddressExample,
  analyzeTransactionWithAMLExample,
  monitorAddressExample,
  analyzePortfolioRiskExample,
  assessUserRiskExample,
  createMonitoringRulesExample,
  generateReportsExample,
  handleMonitoringEventsExample,
  runAllChainalysisExamples,
};