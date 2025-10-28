/**
 * 🔗 Chainalysis Service - Blockchain Analytics Integration
 *
 * Сервис для интеграции с Chainalysis API для анализа блокчейн-транзакций
 * и адресов в рамках AML/KYC комплаенса
 */

import {
  ChainalysisAddressAnalysis,
  ChainalysisAddressAnalysisRequest,
  ChainalysisApiError,
  ChainalysisApiResponse,
  ChainalysisAsset,
  ChainalysisConfig,
  ChainalysisMonitoringEvent,
  ChainalysisMonitoringRule,
  ChainalysisReport,
  ChainalysisRiskLevel,
  ChainalysisTransactionAnalysis,
  ChainalysisTransactionAnalysisRequest,
  ChainalysisPortfolioAnalysisRequest,
  ChainalysisAMLIntegration,
  ChainalysisRiskFactor,
} from "./chainalysis-types";

import {
  getChainalysisConfig,
  getChainalysisApiUrl,
  validateChainalysisConfig,
  mapChainalysisRiskToAML,
  getCategoryRiskWeight,
  getCategoryRiskLevel,
  DEFAULT_CHAINALYSIS_MONITORING_RULES,
} from "./chainalysis-config";

import { AMLRiskLevel } from "./types";

// Импортируем глобальный экземпляр Prisma
import { db } from "../../lib/db";

export class ChainalysisService {
  private config: ChainalysisConfig;
  private monitoringRules: Map<string, ChainalysisMonitoringRule> = new Map();

  constructor(config?: ChainalysisConfig) {
    this.config = config || getChainalysisConfig();
    
    // Валидация конфигурации
    const validation = validateChainalysisConfig(this.config);
    if (!validation.isValid) {
      throw new Error(`Invalid Chainalysis configuration: ${validation.errors.join(", ")}`);
    }

    // Инициализация правил мониторинга по умолчанию
    this.initializeDefaultMonitoringRules();
  }

  /**
   * Анализ адреса
   */
  async analyzeAddress(
    request: ChainalysisAddressAnalysisRequest
  ): Promise<ChainalysisApiResponse<ChainalysisAddressAnalysis>> {
    try {
      const response = await this.makeApiRequest<ChainalysisAddressAnalysis>(
        "POST",
        getChainalysisApiUrl("ADDRESS_ANALYSIS"),
        request
      );

      if (response.success && response.data) {
        // Сохраняем результат анализа в базу данных
        await this.saveAddressAnalysis(response.data);
      }

      return response;
    } catch (error) {
      console.error("Error analyzing address:", error);
      return {
        success: false,
        error: {
          code: "ANALYSIS_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Анализ транзакции
   */
  async analyzeTransaction(
    request: ChainalysisTransactionAnalysisRequest
  ): Promise<ChainalysisApiResponse<ChainalysisTransactionAnalysis>> {
    try {
      const response = await this.makeApiRequest<ChainalysisTransactionAnalysis>(
        "POST",
        getChainalysisApiUrl("TRANSACTION_ANALYSIS"),
        request
      );

      if (response.success && response.data) {
        // Сохраняем результат анализа в базу данных
        await this.saveTransactionAnalysis(response.data);
      }

      return response;
    } catch (error) {
      console.error("Error analyzing transaction:", error);
      return {
        success: false,
        error: {
          code: "ANALYSIS_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Анализ портфеля адресов
   */
  async analyzePortfolio(
    request: ChainalysisPortfolioAnalysisRequest
  ): Promise<ChainalysisApiResponse<{ addresses: ChainalysisAddressAnalysis[] }>> {
    try {
      const response = await this.makeApiRequest<{ addresses: ChainalysisAddressAnalysis[] }>(
        "POST",
        getChainalysisApiUrl("PORTFOLIO_ANALYSIS"),
        request
      );

      if (response.success && response.data) {
        // Сохраняем результаты анализа в базу данных
        for (const addressAnalysis of response.data.addresses) {
          await this.saveAddressAnalysis(addressAnalysis);
        }
      }

      return response;
    } catch (error) {
      console.error("Error analyzing portfolio:", error);
      return {
        success: false,
        error: {
          code: "ANALYSIS_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Получение оценки риска адреса
   */
  async getAddressRisk(address: string, asset: ChainalysisAsset): Promise<{
    risk: ChainalysisRiskLevel;
    score: number;
    confidence: number;
  }> {
    try {
      const response = await this.makeApiRequest<{
        risk: ChainalysisRiskLevel;
        score: number;
        confidence: number;
      }>(
        "GET",
        `${getChainalysisApiUrl("ADDRESS_RISK")}?address=${address}&asset=${asset}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      // Возвращаем значения по умолчанию в случае ошибки
      return {
        risk: "MEDIUM",
        score: 50,
        confidence: 0,
      };
    } catch (error) {
      console.error("Error getting address risk:", error);
      return {
        risk: "MEDIUM",
        score: 50,
        confidence: 0,
      };
    }
  }

  /**
   * Интеграция с AML системой
   */
  async integrateWithAML(
    address?: string,
    transactionHash?: string,
    asset: ChainalysisAsset = "SOL"
  ): Promise<ChainalysisAMLIntegration> {
    try {
      let addressAnalysis: ChainalysisAddressAnalysis | null = null;
      let transactionAnalysis: ChainalysisTransactionAnalysis | null = null;

      // Анализируем адрес если предоставлен
      if (address) {
        const addressResponse = await this.analyzeAddress({
          address,
          asset,
          includeTransactions: true,
          includeExposure: true,
          includeIdentifications: true,
        });

        if (addressResponse.success && addressResponse.data) {
          addressAnalysis = addressResponse.data;
        }
      }

      // Анализируем транзакцию если предоставлена
      if (transactionHash) {
        const transactionResponse = await this.analyzeTransaction({
          transactionHash,
          asset,
          includeInputs: true,
          includeOutputs: true,
          includeExposure: true,
          includeIdentifications: true,
        });

        if (transactionResponse.success && transactionResponse.data) {
          transactionAnalysis = transactionResponse.data;
        }
      }

      // Рассчитываем факторы риска
      const riskFactors = this.calculateRiskFactors(addressAnalysis, transactionAnalysis);

      // Рассчитываем общий риск
      const riskScore = this.calculateOverallRiskScore(riskFactors);
      const riskLevel = this.getRiskLevelFromScore(riskScore);

      // Генерируем рекомендации
      const recommendations = this.generateRecommendations(riskFactors, riskLevel);

      return {
        addressAnalysisId: addressAnalysis?.id,
        transactionAnalysisId: transactionAnalysis?.transactionHash,
        riskScore,
        riskLevel: mapChainalysisRiskToAML(riskLevel),
        factors: riskFactors,
        recommendations,
        requiresManualReview: riskScore >= 60,
        shouldBlock: riskScore >= 80,
        shouldReport: riskScore >= 70,
      };
    } catch (error) {
      console.error("Error integrating with AML:", error);
      return {
        riskScore: 50,
        riskLevel: "MEDIUM",
        factors: [],
        recommendations: ["Ошибка при анализе Chainalysis"],
        requiresManualReview: true,
        shouldBlock: false,
        shouldReport: false,
      };
    }
  }

  /**
   * Создание правила мониторинга
   */
  async createMonitoringRule(
    rule: Omit<ChainalysisMonitoringRule, "id" | "createdAt" | "updatedAt">
  ): Promise<{ success: boolean; ruleId?: string; message?: string }> {
    try {
      const newRule: ChainalysisMonitoringRule = {
        ...rule,
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Сохраняем правило в локальном кэше
      this.monitoringRules.set(newRule.id, newRule);

      // Отправляем правило в Chainalysis API
      const response = await this.makeApiRequest<ChainalysisMonitoringRule>(
        "POST",
        getChainalysisApiUrl("MONITORING_RULES"),
        newRule
      );

      if (response.success) {
        return {
          success: true,
          ruleId: newRule.id,
          message: "Monitoring rule created successfully",
        };
      } else {
        // Удаляем из кэша если API вернул ошибку
        this.monitoringRules.delete(newRule.id);
        return {
          success: false,
          message: response.error?.message || "Failed to create monitoring rule",
        };
      }
    } catch (error) {
      console.error("Error creating monitoring rule:", error);
      return {
        success: false,
        message: `Failed to create monitoring rule: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Получение событий мониторинга
   */
  async getMonitoringEvents(
    filters: {
      address?: string;
      transactionHash?: string;
      asset?: ChainalysisAsset;
      risk?: ChainalysisRiskLevel;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ChainalysisMonitoringEvent[]> {
    try {
      const queryParams = new URLSearchParams();

      if (filters.address) queryParams.append("address", filters.address);
      if (filters.transactionHash) queryParams.append("transactionHash", filters.transactionHash);
      if (filters.asset) queryParams.append("asset", filters.asset);
      if (filters.risk) queryParams.append("risk", filters.risk);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.limit) queryParams.append("limit", filters.limit.toString());
      if (filters.offset) queryParams.append("offset", filters.offset.toString());

      const response = await this.makeApiRequest<ChainalysisMonitoringEvent[]>(
        "GET",
        `${getChainalysisApiUrl("MONITORING_EVENTS")}?${queryParams.toString()}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error("Error getting monitoring events:", error);
      return [];
    }
  }

  /**
   * Создание отчета
   */
  async createReport(
    type: "ADDRESS_ANALYSIS" | "TRANSACTION_ANALYSIS" | "PORTFOLIO_RISK" | "COMPLIANCE_SUMMARY",
    title: string,
    description: string,
    data: any
  ): Promise<{ success: boolean; reportId?: string; message?: string }> {
    try {
      const report: ChainalysisReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        title,
        description,
        generatedAt: new Date().toISOString(),
        generatedBy: "ChainalysisService",
        period: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 дней назад
          endDate: new Date().toISOString(),
        },
        data,
        metadata: {
          version: "1.0",
          source: "Chainalysis API",
        },
      };

      const response = await this.makeApiRequest<ChainalysisReport>(
        "POST",
        getChainalysisApiUrl("REPORTS"),
        report
      );

      if (response.success) {
        return {
          success: true,
          reportId: report.id,
          message: "Report created successfully",
        };
      } else {
        return {
          success: false,
          message: response.error?.message || "Failed to create report",
        };
      }
    } catch (error) {
      console.error("Error creating report:", error);
      return {
        success: false,
        message: `Failed to create report: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  // Приватные методы

  /**
   * Выполнение API запроса
   */
  private async makeApiRequest<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string,
    data?: any
  ): Promise<ChainalysisApiResponse<T>> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      const headers = {
        "Content-Type": "application/json",
        "X-API-Key": this.config.apiKey,
        "X-API-Secret": this.config.apiSecret,
        "X-Request-ID": requestId,
      };

      const fetchOptions: RequestInit = {
        method,
        headers,
      };

      if (data && method !== "GET") {
        fetchOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const responseData = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: responseData,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime,
        },
      };
    }
  }

  /**
   * Инициализация правил мониторинга по умолчанию
   */
  private initializeDefaultMonitoringRules(): void {
    for (const rule of DEFAULT_CHAINALYSIS_MONITORING_RULES) {
      const ruleWithId: ChainalysisMonitoringRule = {
        ...rule,
        id: `default_${rule.name.toLowerCase().replace(/\s+/g, "_")}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      this.monitoringRules.set(ruleWithId.id, ruleWithId);
    }
  }

  /**
   * Расчет факторов риска
   */
  private calculateRiskFactors(
    addressAnalysis: ChainalysisAddressAnalysis | null,
    transactionAnalysis: ChainalysisTransactionAnalysis | null
  ): ChainalysisRiskFactor[] {
    const factors: ChainalysisRiskFactor[] = [];

    // Факторы на основе анализа адреса
    if (addressAnalysis) {
      // Риск на основе уровня риска адреса
      factors.push({
        category: "EXPOSURE",
        name: "Address Risk Level",
        description: `Риск на основе уровня риска адреса: ${addressAnalysis.risk}`,
        score: this.getRiskScoreFromLevel(addressAnalysis.risk),
        weight: 30,
        details: { risk: addressAnalysis.risk, confidence: addressAnalysis.confidence },
      });

      // Риск на основе категорий
      for (const category of addressAnalysis.categories) {
        factors.push({
          category: "IDENTIFICATION",
          name: `Category Risk: ${category}`,
          description: `Риск на основе категории адреса: ${category}`,
          score: getCategoryRiskWeight(category),
          weight: 20,
          details: { category, riskLevel: getCategoryRiskLevel(category) },
        });
      }

      // Риск на основе экспозиции
      factors.push({
        category: "EXPOSURE",
        name: "Risk Exposure",
        description: `Общая экспозиция риска: ${addressAnalysis.exposure.total}%`,
        score: Math.min(100, addressAnalysis.exposure.total * 2),
        weight: 25,
        details: addressAnalysis.exposure,
      });

      // Риск на основе объема транзакций
      if (addressAnalysis.transactionCount > 0) {
        const volumeRisk = Math.min(100, Math.log10(addressAnalysis.totalReceived + 1) * 10);
        factors.push({
          category: "VOLUME",
          name: "Transaction Volume",
          description: `Риск на основе объема транзакций: ${addressAnalysis.totalReceived}`,
          score: volumeRisk,
          weight: 15,
          details: {
            totalReceived: addressAnalysis.totalReceived,
            totalSent: addressAnalysis.totalSent,
            transactionCount: addressAnalysis.transactionCount,
          },
        });
      }
    }

    // Факторы на основе анализа транзакции
    if (transactionAnalysis) {
      // Риск на основе уровня риска транзакции
      factors.push({
        category: "BEHAVIOR",
        name: "Transaction Risk Level",
        description: `Риск на основе уровня риска транзакции: ${transactionAnalysis.risk}`,
        score: this.getRiskScoreFromLevel(transactionAnalysis.risk),
        weight: 35,
        details: { risk: transactionAnalysis.risk, confidence: transactionAnalysis.confidence },
      });

      // Риск на основе входов/выходов
      const inputAddresses = transactionAnalysis.inputs.map(input => input.address);
      const outputAddresses = transactionAnalysis.outputs.map(output => output.address);
      const uniqueAddresses = new Set([...inputAddresses, ...outputAddresses]).size;

      if (uniqueAddresses > 1) {
        factors.push({
          category: "NETWORK",
          name: "Network Complexity",
          description: `Риск на основе сложности сети: ${uniqueAddresses} уникальных адресов`,
          score: Math.min(100, uniqueAddresses * 10),
          weight: 20,
          details: { uniqueAddresses, inputAddresses, outputAddresses },
        });
      }
    }

    return factors;
  }

  /**
   * Расчет общего показателя риска
   */
  private calculateOverallRiskScore(factors: ChainalysisRiskFactor[]): number {
    if (factors.length === 0) return 50;

    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
    const weightedScore = factors.reduce(
      (sum, factor) => sum + factor.score * factor.weight,
      0
    );

    return Math.round(weightedScore / totalWeight);
  }

  /**
   * Получение уровня риска на основе оценки
   */
  private getRiskLevelFromScore(score: number): ChainalysisRiskLevel {
    if (score >= 80) return "SEVERE";
    if (score >= 60) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }

  /**
   * Получение оценки риска на основе уровня
   */
  private getRiskScoreFromLevel(level: ChainalysisRiskLevel): number {
    switch (level) {
      case "LOW": return 15;
      case "MEDIUM": return 45;
      case "HIGH": return 75;
      case "SEVERE": return 95;
      default: return 50;
    }
  }

  /**
   * Генерация рекомендаций
   */
  private generateRecommendations(
    factors: ChainalysisRiskFactor[],
    riskLevel: ChainalysisRiskLevel
  ): string[] {
    const recommendations: string[] = [];

    // Рекомендации на основе факторов риска
    for (const factor of factors) {
      if (factor.score >= 70) {
        switch (factor.category) {
          case "EXPOSURE":
            recommendations.push("Рекомендуется дополнительная проверка источника средств");
            break;
          case "IDENTIFICATION":
            recommendations.push("Рекомендуется верификация личности владельца адреса");
            break;
          case "BEHAVIOR":
            recommendations.push("Рекомендуется мониторинг будущих транзакций");
            break;
          case "NETWORK":
            recommendations.push("Рекомендуется анализ связанных адресов");
            break;
          case "VOLUME":
            recommendations.push("Рекомендуется проверка законности крупных транзакций");
            break;
        }
      }
    }

    // Рекомендации на основе общего уровня риска
    switch (riskLevel) {
      case "SEVERE":
        recommendations.push("БЛОКИРОВКА: Высокий риск требует немедленных действий");
        recommendations.push("СОЗДАНИЕ ОТЧЕТА: Необходимо создать SAR отчет");
        break;
      case "HIGH":
        recommendations.push("РУЧНАЯ ПРОВЕРКА: Требуется ручная проверка оператором");
        recommendations.push("МОНИТОРИНГ: Усиленный мониторинг транзакций");
        break;
      case "MEDIUM":
        recommendations.push("ВНИМАНИЕ: Повышенный риск требует внимания");
        break;
      case "LOW":
        recommendations.push("СТАНДАРТ: Риск в пределах нормы");
        break;
    }

    return recommendations;
  }

  /**
   * Сохранение анализа адреса в базу данных
   */
  private async saveAddressAnalysis(analysis: ChainalysisAddressAnalysis): Promise<void> {
    try {
      await db.chainalysisAddressAnalysis.upsert({
        where: { address: analysis.address },
        update: {
          asset: analysis.asset,
          risk: analysis.risk,
          confidence: analysis.confidence,
          categories: analysis.categories,
          identifications: analysis.identifications as any,
          exposure: analysis.exposure as any,
          firstSeen: new Date(analysis.firstSeen),
          lastSeen: new Date(analysis.lastSeen),
          totalReceived: analysis.totalReceived,
          totalSent: analysis.totalSent,
          balance: analysis.balance,
          transactionCount: analysis.transactionCount,
          labels: analysis.labels,
          metadata: analysis.metadata,
          updatedAt: new Date(),
        },
        create: {
          address: analysis.address,
          asset: analysis.asset,
          risk: analysis.risk,
          confidence: analysis.confidence,
          categories: analysis.categories,
          identifications: analysis.identifications as any,
          exposure: analysis.exposure as any,
          firstSeen: new Date(analysis.firstSeen),
          lastSeen: new Date(analysis.lastSeen),
          totalReceived: analysis.totalReceived,
          totalSent: analysis.totalSent,
          balance: analysis.balance,
          transactionCount: analysis.transactionCount,
          labels: analysis.labels,
          metadata: analysis.metadata,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error saving address analysis:", error);
    }
  }

  /**
   * Сохранение анализа транзакции в базу данных
   */
  private async saveTransactionAnalysis(analysis: ChainalysisTransactionAnalysis): Promise<void> {
    try {
      await db.chainalysisTransactionAnalysis.upsert({
        where: { transactionHash: analysis.transactionHash },
        update: {
          asset: analysis.asset,
          timestamp: new Date(analysis.timestamp),
          blockNumber: analysis.blockNumber,
          fromAddress: analysis.fromAddress,
          toAddress: analysis.toAddress,
          amount: analysis.amount,
          risk: analysis.risk,
          confidence: analysis.confidence,
          categories: analysis.categories,
          identifications: analysis.identifications as any,
          exposure: analysis.exposure as any,
          inputs: analysis.inputs as any,
          outputs: analysis.outputs as any,
          labels: analysis.labels,
          metadata: analysis.metadata,
          updatedAt: new Date(),
        },
        create: {
          transactionHash: analysis.transactionHash,
          asset: analysis.asset,
          timestamp: new Date(analysis.timestamp),
          blockNumber: analysis.blockNumber,
          fromAddress: analysis.fromAddress,
          toAddress: analysis.toAddress,
          amount: analysis.amount,
          risk: analysis.risk,
          confidence: analysis.confidence,
          categories: analysis.categories,
          identifications: analysis.identifications as any,
          exposure: analysis.exposure as any,
          inputs: analysis.inputs as any,
          outputs: analysis.outputs as any,
          labels: analysis.labels,
          metadata: analysis.metadata,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error saving transaction analysis:", error);
    }
  }
}

// Экспорт сервиса
export { ChainalysisService };