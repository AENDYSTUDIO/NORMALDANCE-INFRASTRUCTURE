/**
 * 🧪 Chainalysis AML Integration Tests
 *
 * Тесты для интеграции Chainalysis с AML системой
 */

import { ChainalysisAMLIntegration } from "../chainalysis-aml-integration";
import { MonitoredTransaction, TransactionType } from "../types";

// Мокаем Prisma
jest.mock("../../../lib/db", () => ({
  db: {
    monitoredTransaction: {
      findMany: jest.fn(),
    },
    chainalysisResult: {
      create: jest.fn(),
    },
    userChainalysisResult: {
      create: jest.fn(),
    },
    chainalysisMonitoringEvent: {
      findFirst: jest.fn(),
    },
  },
}));

// Мокаем сервисы
jest.mock("../aml-service", () => ({
  AMLService: jest.fn().mockImplementation(() => ({
    monitorTransaction: jest.fn(),
    runUserRiskAssessment: jest.fn(),
  })),
}));

jest.mock("../chainalysis-service", () => ({
  ChainalysisService: jest.fn().mockImplementation(() => ({
    integrateWithAML: jest.fn(),
    createMonitoringRule: jest.fn(),
  })),
}));

jest.mock("../compliance-service", () => ({
  ComplianceService: jest.fn().mockImplementation(() => ({
    createSuspiciousActivityReport: jest.fn(),
    createUserRiskAssessment: jest.fn(),
  })),
}));

import { db } from "../../../lib/db";

describe("ChainalysisAMLIntegration", () => {
  let chainalysisAMLIntegration: ChainalysisAMLIntegration;

  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    jest.clearAllMocks();
    
    // Создаем экземпляр интеграции
    chainalysisAMLIntegration = new ChainalysisAMLIntegration();
  });

  describe("analyzeTransactionWithChainalysis", () => {
    it("should successfully analyze transaction with Chainalysis integration", async () => {
      // Мокаем AML анализ
      const mockAMLTransaction: MonitoredTransaction = {
        id: "tx-123",
        transactionHash: "test-tx-hash",
        userId: "user-123",
        walletAddress: "test-wallet",
        type: "TRANSFER" as TransactionType,
        amount: 1000,
        currency: "SOL",
        fromAddress: "sender-address",
        toAddress: "receiver-address",
        timestamp: "2023-12-01T12:00:00Z",
        blockNumber: 12345,
        riskScore: 30,
        riskLevel: "LOW",
        monitoringStatus: "CLEARED",
        flaggedReasons: [],
        additionalData: {},
      };

      const { AMLService } = require("../aml-service");
      const mockAMLService = new AMLService();
      mockAMLService.monitorTransaction.mockResolvedValue(mockAMLTransaction);

      // Мокаем Chainalysis интеграцию
      const mockChainalysisIntegration = {
        riskScore: 75,
        riskLevel: "HIGH",
        factors: [
          {
            category: "EXPOSURE",
            name: "High Risk Exposure",
            description: "High risk exposure detected",
            score: 80,
            weight: 50,
            details: {},
          },
        ],
        recommendations: ["Manual review required", "Enhanced monitoring needed"],
        requiresManualReview: true,
        shouldBlock: false,
        shouldReport: true,
      };

      const { ChainalysisService } = require("../chainalysis-service");
      const mockChainalysisService = new ChainalysisService();
      mockChainalysisService.integrateWithAML.mockResolvedValue(mockChainalysisIntegration);

      // Мокаем сохранение результатов
      (db.chainalysisResult.create as jest.Mock).mockResolvedValue({});

      // Мокаем создание SAR отчета
      const { ComplianceService } = require("../compliance-service");
      const mockComplianceService = new ComplianceService();
      mockComplianceService.createSuspiciousActivityReport.mockResolvedValue({
        success: true,
        reportId: "sar-123",
      });

      const transaction = {
        transactionHash: "test-tx-hash",
        userId: "user-123",
        walletAddress: "test-wallet",
        type: "TRANSFER" as TransactionType,
        amount: 1000,
        currency: "SOL",
        fromAddress: "sender-address",
        toAddress: "receiver-address",
        timestamp: "2023-12-01T12:00:00Z",
        blockNumber: 12345,
        additionalData: {},
      };

      const result = await chainalysisAMLIntegration.analyzeTransactionWithChainalysis(transaction);

      // Проверяем, что AML анализ был вызван
      expect(mockAMLService.monitorTransaction).toHaveBeenCalledWith(transaction);

      // Проверяем, что Chainalysis интеграция была вызвана
      expect(mockChainalysisService.integrateWithAML).toHaveBeenCalledWith(
        transaction.fromAddress,
        transaction.transactionHash,
        "SOL"
      );

      // Проверяем, что результаты были сохранены
      expect(db.chainalysisResult.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          transactionHash: "test-tx-hash",
          riskScore: 75,
          riskLevel: "HIGH",
          requiresManualReview: true,
          shouldBlock: false,
          shouldReport: true,
        }),
      });

      // Проверяем, что SAR отчет был создан
      expect(mockComplianceService.createSuspiciousActivityReport).toHaveBeenCalledWith({
        userId: "user-123",
        walletAddress: "test-wallet",
        suspiciousTransactions: ["tx-123"],
        reasons: expect.arrayContaining([
          "Manual review required",
          "Enhanced monitoring needed",
        ]),
        riskLevel: expect.any(String),
        reportedBy: "ChainalysisAMLIntegration",
      });

      // Проверяем объединенный результат
      expect(result.riskScore).toBeGreaterThan(30); // Должен быть выше, чем AML результат
      expect(result.monitoringStatus).toBe("UNDER_REVIEW");
      expect(result.flaggedReasons).toContain("Chainalysis: Manual review required");
    });

    it("should handle Chainalysis analysis errors gracefully", async () => {
      // Мокаем AML анализ
      const mockAMLTransaction: MonitoredTransaction = {
        id: "tx-123",
        transactionHash: "test-tx-hash",
        userId: "user-123",
        walletAddress: "test-wallet",
        type: "TRANSFER" as TransactionType,
        amount: 1000,
        currency: "SOL",
        fromAddress: "sender-address",
        toAddress: "receiver-address",
        timestamp: "2023-12-01T12:00:00Z",
        blockNumber: 12345,
        riskScore: 30,
        riskLevel: "LOW",
        monitoringStatus: "CLEARED",
        flaggedReasons: [],
        additionalData: {},
      };

      const { AMLService } = require("../aml-service");
      const mockAMLService = new AMLService();
      mockAMLService.monitorTransaction.mockResolvedValue(mockAMLTransaction);

      // Мокаем ошибку Chainalysis
      const { ChainalysisService } = require("../chainalysis-service");
      const mockChainalysisService = new ChainalysisService();
      mockChainalysisService.integrateWithAML.mockRejectedValue(new Error("Chainalysis API error"));

      const transaction = {
        transactionHash: "test-tx-hash",
        userId: "user-123",
        walletAddress: "test-wallet",
        type: "TRANSFER" as TransactionType,
        amount: 1000,
        currency: "SOL",
        fromAddress: "sender-address",
        toAddress: "receiver-address",
        timestamp: "2023-12-01T12:00:00Z",
        blockNumber: 12345,
        additionalData: {},
      };

      const result = await chainalysisAMLIntegration.analyzeTransactionWithChainalysis(transaction);

      // Проверяем, что возвращается только AML результат
      expect(result).toEqual(mockAMLTransaction);
      expect(mockAMLService.monitorTransaction).toHaveBeenCalledWith(transaction);
      expect(mockChainalysisService.integrateWithAML).toHaveBeenCalled();
    });
  });

  describe("assessUserRiskWithChainalysis", () => {
    it("should successfully assess user risk with Chainalysis integration", async () => {
      // Мокаем AML оценку
      const mockAMLAssessment = {
        id: "assessment-123",
        userId: "user-123",
        walletAddress: "test-wallet",
        overallRiskScore: 40,
        riskLevel: "MEDIUM",
        factors: [
          {
            category: "TRANSACTIONAL",
            name: "Average Transaction Risk",
            description: "Average risk score of user transactions",
            score: 35,
            weight: 30,
          },
        ],
        lastAssessed: "2023-12-01T12:00:00Z",
        nextReviewDate: "2024-03-01T12:00:00Z",
        assessedBy: "system",
      };

      const { AMLService } = require("../aml-service");
      const mockAMLService = new AMLService();
      mockAMLService.runUserRiskAssessment.mockResolvedValue(mockAMLAssessment);

      // Мокаем транзакции пользователя
      const mockTransactions = [
        {
          fromAddress: "address-1",
          toAddress: "address-2",
        },
        {
          fromAddress: "address-3",
          toAddress: "address-4",
        },
      ];

      (db.monitoredTransaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);

      // Мокаем Chainalysis интеграцию для каждого адреса
      const { ChainalysisService } = require("../chainalysis-service");
      const mockChainalysisService = new ChainalysisService();
      mockChainalysisService.integrateWithAML
        .mockResolvedValueOnce({
          riskScore: 60,
          riskLevel: "HIGH",
          factors: [],
          recommendations: ["Enhanced monitoring"],
          requiresManualReview: true,
          shouldBlock: false,
          shouldReport: true,
        })
        .mockResolvedValueOnce({
          riskScore: 30,
          riskLevel: "MEDIUM",
          factors: [],
          recommendations: ["Standard monitoring"],
          requiresManualReview: false,
          shouldBlock: false,
          shouldReport: false,
        });

      // Мокаем сохранение результатов
      (db.userChainalysisResult.create as jest.Mock).mockResolvedValue({});

      // Мокаем создание оценки риска
      const { ComplianceService } = require("../compliance-service");
      const mockComplianceService = new ComplianceService();
      mockComplianceService.createUserRiskAssessment.mockResolvedValue({
        success: true,
        assessmentId: "new-assessment-123",
      });

      const result = await chainalysisAMLIntegration.assessUserRiskWithChainalysis(
        "user-123",
        "system"
      );

      // Проверяем, что AML оценка была вызвана
      expect(mockAMLService.runUserRiskAssessment).toHaveBeenCalledWith("user-123", "system");

      // Проверяем, что транзакции пользователя были получены
      expect(db.monitoredTransaction.findMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        distinct: ["fromAddress", "toAddress"],
      });

      // Проверяем, что Chainalysis интеграция была вызвана для уникальных адресов
      expect(mockChainalysisService.integrateWithAML).toHaveBeenCalledTimes(4); // 4 уникальных адреса

      // Проверяем, что результаты были сохранены
      expect(db.userChainalysisResult.create).toHaveBeenCalledTimes(4);

      // Проверяем, что новая оценка риска была создана
      expect(mockComplianceService.createUserRiskAssessment).toHaveBeenCalledWith({
        userId: "user-123",
        walletAddress: "test-wallet",
        factors: expect.any(Array),
        assessedBy: "system",
      });

      // Проверяем, что результат содержит объединенные данные
      expect(result.userId).toBe("user-123");
      expect(result.factors.length).toBeGreaterThan(mockAMLAssessment.factors.length);
    });

    it("should handle user risk assessment errors gracefully", async () => {
      // Мокаем ошибку AML оценки
      const { AMLService } = require("../aml-service");
      const mockAMLService = new AMLService();
      mockAMLService.runUserRiskAssessment.mockResolvedValue(null);

      const result = await chainalysisAMLIntegration.assessUserRiskWithChainalysis(
        "user-123",
        "system"
      );

      expect(result).toBeNull();
      expect(mockAMLService.runUserRiskAssessment).toHaveBeenCalledWith("user-123", "system");
    });
  });

  describe("monitorAddress", () => {
    it("should successfully monitor an address", async () => {
      // Мокаем Chainalysis интеграцию
      const mockChainalysisIntegration = {
        riskScore: 80,
        riskLevel: "HIGH",
        factors: [],
        recommendations: ["Immediate action required"],
        requiresManualReview: true,
        shouldBlock: true,
        shouldReport: true,
      };

      const { ChainalysisService } = require("../chainalysis-service");
      const mockChainalysisService = new ChainalysisService();
      mockChainalysisService.integrateWithAML.mockResolvedValue(mockChainalysisIntegration);
      mockChainalysisService.createMonitoringRule.mockResolvedValue({
        success: true,
        ruleId: "rule-123",
      });

      // Мокаем отсутствие существующего мониторинга
      (db.chainalysisMonitoringEvent.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await chainalysisAMLIntegration.monitorAddress("test-address", "SOL");

      // Проверяем, что Chainalysis интеграция была вызвана
      expect(mockChainalysisService.integrateWithAML).toHaveBeenCalledWith(
        "test-address",
        undefined,
        "SOL"
      );

      // Проверяем, что было проверено наличие существующего мониторинга
      expect(db.chainalysisMonitoringEvent.findFirst).toHaveBeenCalledWith({
        where: {
          address: "test-address",
          processed: false,
        },
      });

      // Проверяем, что правило мониторинга было создано
      expect(mockChainalysisService.createMonitoringRule).toHaveBeenCalledWith({
        name: "Address Monitoring: test-address",
        description: "Мониторинг адреса test-address с высоким риском",
        isActive: true,
        conditions: [
          {
            field: "risk",
            operator: "GREATER_THAN",
            value: 60,
            weight: 100,
          },
        ],
        actions: expect.arrayContaining([
          {
            type: "ALERT",
            parameters: { priority: "HIGH" },
          },
          {
            type: "BLOCK",
          },
        ]),
      });

      // Проверяем результат
      expect(result.success).toBe(true);
      expect(result.riskLevel).toBe("HIGH");
      expect(result.recommendations).toContain("Immediate action required");
      expect(result.requiresAction).toBe(true);
    });

    it("should return existing monitoring status", async () => {
      // Мокаем существующий мониторинг
      (db.chainalysisMonitoringEvent.findFirst as jest.Mock).mockResolvedValue({
        id: "event-123",
        address: "test-address",
        processed: false,
      });

      const result = await chainalysisAMLIntegration.monitorAddress("test-address", "SOL");

      // Проверяем, что было проверено наличие существующего мониторинга
      expect(db.chainalysisMonitoringEvent.findFirst).toHaveBeenCalledWith({
        where: {
          address: "test-address",
          processed: false,
        },
      });

      // Проверяем результат
      expect(result.success).toBe(true);
      expect(result.requiresAction).toBe(true);
    });

    it("should handle monitoring errors gracefully", async () => {
      // Мокаем ошибку Chainalysis
      const { ChainalysisService } = require("../chainalysis-service");
      const mockChainalysisService = new ChainalysisService();
      mockChainalysisService.integrateWithAML.mockRejectedValue(new Error("Chainalysis API error"));

      // Мокаем отсутствие существующего мониторинга
      (db.chainalysisMonitoringEvent.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await chainalysisAMLIntegration.monitorAddress("test-address", "SOL");

      // Проверяем результат
      expect(result.success).toBe(false);
      expect(result.riskLevel).toBe("MEDIUM");
      expect(result.recommendations).toContain("Ошибка при мониторинге адреса");
      expect(result.requiresAction).toBe(true);
    });
  });

  describe("getPortfolioRiskReport", () => {
    it("should successfully generate portfolio risk report", async () => {
      // Мокаем анализ портфеля
      const mockPortfolioResponse = {
        success: true,
        data: {
          addresses: [
            {
              address: "address-1",
              risk: "LOW",
              confidence: 90,
            },
            {
              address: "address-2",
              risk: "HIGH",
              confidence: 85,
            },
          ],
        },
      };

      const { ChainalysisService } = require("../chainalysis-service");
      const mockChainalysisService = new ChainalysisService();
      mockChainalysisService.analyzePortfolio.mockResolvedValue(mockPortfolioResponse);
      mockChainalysisService.integrateWithAML
        .mockResolvedValueOnce({
          riskScore: 20,
          riskLevel: "LOW",
          factors: [],
          recommendations: [],
          requiresManualReview: false,
          shouldBlock: false,
          shouldReport: false,
        })
        .mockResolvedValueOnce({
          riskScore: 80,
          riskLevel: "HIGH",
          factors: [],
          recommendations: ["Enhanced monitoring"],
          requiresManualReview: true,
          shouldBlock: false,
          shouldReport: true,
        });

      // Мокаем создание отчета
      mockChainalysisService.createReport.mockResolvedValue({
        success: true,
        reportId: "report-123",
      });

      const result = await chainalysisAMLIntegration.getPortfolioRiskReport(
        ["address-1", "address-2"],
        "SOL"
      );

      // Проверяем, что анализ портфеля был вызван
      expect(mockChainalysisService.analyzePortfolio).toHaveBeenCalledWith({
        addresses: ["address-1", "address-2"],
        asset: "SOL",
        includeTransactions: true,
        includeExposure: true,
        includeIdentifications: true,
      });

      // Проверяем, что интеграция была вызвана для каждого адреса
      expect(mockChainalysisService.integrateWithAML).toHaveBeenCalledTimes(2);

      // Проверяем, что отчет был создан
      expect(mockChainalysisService.createReport).toHaveBeenCalledWith(
        "PORTFOLIO_RISK",
        "Portfolio Risk Report - 2 addresses",
        "Комплексный анализ рисков портфеля из 2 адресов",
        expect.objectContaining({
          addresses: mockPortfolioResponse.data.addresses,
          overallRiskScore: expect.any(Number),
          overallRiskLevel: expect.any(String),
          highRiskAddresses: expect.arrayContaining(["address-2"]),
        })
      );

      // Проверяем результат
      expect(result.success).toBe(true);
      expect(result.reportId).toBe("report-123");
      expect(result.overallRisk).toBe("MEDIUM"); // Средний между LOW и HIGH
      expect(result.riskScore).toBe(50); // Средний между 20 и 80
      expect(result.highRiskAddresses).toContain("address-2");
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("should handle portfolio analysis errors gracefully", async () => {
      // Мокаем ошибку анализа портфеля
      const { ChainalysisService } = require("../chainalysis-service");
      const mockChainalysisService = new ChainalysisService();
      mockChainalysisService.analyzePortfolio.mockResolvedValue({
        success: false,
        error: { message: "Portfolio analysis failed" },
      });

      const result = await chainalysisAMLIntegration.getPortfolioRiskReport(
        ["address-1", "address-2"],
        "SOL"
      );

      // Проверяем результат
      expect(result.success).toBe(false);
      expect(result.overallRisk).toBe("MEDIUM");
      expect(result.riskScore).toBe(50);
      expect(result.highRiskAddresses).toEqual([]);
      expect(result.recommendations).toContain("Ошибка при анализе портфеля");
    });
  });
});