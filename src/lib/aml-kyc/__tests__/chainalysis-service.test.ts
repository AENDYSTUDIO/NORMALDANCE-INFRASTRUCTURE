/**
 * 🧪 Chainalysis Service Tests
 *
 * Тесты для сервиса интеграции с Chainalysis API
 */

import { ChainalysisService } from "../chainalysis-service";
import { ChainalysisAddressAnalysisRequest, ChainalysisAsset } from "../chainalysis-types";

// Мокаем fetch для тестов
global.fetch = jest.fn();

describe("ChainalysisService", () => {
  let chainalysisService: ChainalysisService;

  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    (fetch as jest.Mock).mockClear();
    
    // Создаем экземпляр сервиса с тестовой конфигурацией
    chainalysisService = new ChainalysisService({
      apiKey: "test-api-key",
      apiSecret: "test-api-secret",
      apiUrl: "https://api.test.chainalysis.com",
      environment: "SANDBOX",
      timeout: 5000,
      retryAttempts: 1,
      retryDelay: 100,
      monitoringEnabled: true,
      riskThresholds: {
        LOW: 25,
        MEDIUM: 50,
        HIGH: 75,
        SEVERE: 90,
      },
    });
  });

  describe("analyzeAddress", () => {
    it("should successfully analyze an address", async () => {
      // Мокаем успешный ответ API
      const mockResponse = {
        success: true,
        data: {
          address: "test-address",
          asset: "SOL",
          risk: "LOW",
          confidence: 85,
          categories: ["WALLET"],
          identifications: [],
          exposure: {
            direct: 5,
            indirect: 10,
            total: 15,
            breakdown: [],
          },
          firstSeen: "2023-01-01T00:00:00Z",
          lastSeen: "2023-12-31T23:59:59Z",
          totalReceived: 1000,
          totalSent: 800,
          balance: 200,
          transactionCount: 50,
          labels: [],
          metadata: {},
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse.data,
      });

      const request: ChainalysisAddressAnalysisRequest = {
        address: "test-address",
        asset: "SOL",
        includeTransactions: true,
        includeExposure: true,
        includeIdentifications: true,
      };

      const result = await chainalysisService.analyzeAddress(request);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.test.chainalysis.com/api/kyt/v2/address",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-API-Key": "test-api-key",
            "X-API-Secret": "test-api-secret",
          }),
          body: JSON.stringify(request),
        })
      );
    });

    it("should handle API errors gracefully", async () => {
      // Мокаем ошибку API
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Internal server error" }),
      });

      const request: ChainalysisAddressAnalysisRequest = {
        address: "test-address",
        asset: "SOL",
      };

      const result = await chainalysisService.analyzeAddress(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe("ANALYSIS_ERROR");
    });

    it("should validate request parameters", async () => {
      const request = {
        address: "", // Пустой адрес
        asset: "SOL" as ChainalysisAsset,
      };

      const result = await chainalysisService.analyzeAddress(request);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("Invalid");
    });
  });

  describe("getAddressRisk", () => {
    it("should return risk assessment for an address", async () => {
      // Мокаем успешный ответ API
      const mockResponse = {
        risk: "MEDIUM",
        score: 55,
        confidence: 75,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await chainalysisService.getAddressRisk("test-address", "SOL");

      expect(result.risk).toBe("MEDIUM");
      expect(result.score).toBe(55);
      expect(result.confidence).toBe(75);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.test.chainalysis.com/api/kyt/v2/address/risk?address=test-address&asset=SOL",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "X-API-Key": "test-api-key",
            "X-API-Secret": "test-api-secret",
          }),
        })
      );
    });

    it("should return default values on API error", async () => {
      // Мокаем ошибку API
      (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const result = await chainalysisService.getAddressRisk("test-address", "SOL");

      expect(result.risk).toBe("MEDIUM");
      expect(result.score).toBe(50);
      expect(result.confidence).toBe(0);
    });
  });

  describe("integrateWithAML", () => {
    it("should integrate address analysis with AML", async () => {
      // Мокаем ответы API
      const mockAddressResponse = {
        success: true,
        data: {
          address: "test-address",
          asset: "SOL",
          risk: "HIGH",
          confidence: 90,
          categories: ["MIXER"],
          identifications: [
            {
              entity: "Test Mixer",
              category: "MIXER",
              confidence: 95,
              description: "Mixer service",
              source: "Chainalysis",
            },
          ],
          exposure: {
            direct: 60,
            indirect: 20,
            total: 80,
            breakdown: [
              {
                category: "MIXER",
                amount: 500,
                percentage: 80,
              },
            ],
          },
          firstSeen: "2023-01-01T00:00:00Z",
          lastSeen: "2023-12-31T23:59:59Z",
          totalReceived: 10000,
          totalSent: 8000,
          balance: 2000,
          transactionCount: 100,
          labels: ["mixer"],
          metadata: {},
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAddressResponse.data,
      });

      const result = await chainalysisService.integrateWithAML("test-address", undefined, "SOL");

      expect(result.riskScore).toBeGreaterThan(70);
      expect(result.riskLevel).toBe("HIGH");
      expect(result.requiresManualReview).toBe(true);
      expect(result.shouldBlock).toBe(false);
      expect(result.shouldReport).toBe(true);
      expect(result.factors.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("should integrate transaction analysis with AML", async () => {
      // Мокаем ответы API
      const mockTransactionResponse = {
        success: true,
        data: {
          transactionHash: "test-tx-hash",
          asset: "SOL",
          timestamp: "2023-12-01T12:00:00Z",
          blockNumber: 12345,
          fromAddress: "sender-address",
          toAddress: "receiver-address",
          amount: 5000,
          risk: "SEVERE",
          confidence: 95,
          categories: ["ILLEGAL"],
          identifications: [
            {
              entity: "Illegal Service",
              category: "ILLEGAL",
              confidence: 98,
              description: "Illegal activity detected",
              source: "Chainalysis",
            },
          ],
          exposure: {
            direct: 90,
            indirect: 10,
            total: 100,
            breakdown: [
              {
                category: "ILLEGAL",
                amount: 5000,
                percentage: 100,
              },
            ],
          },
          inputs: [
            {
              address: "sender-address",
              amount: 5000,
              risk: "SEVERE",
              categories: ["ILLEGAL"],
              identifications: [],
            },
          ],
          outputs: [
            {
              address: "receiver-address",
              amount: 5000,
              risk: "SEVERE",
              categories: ["ILLEGAL"],
              identifications: [],
            },
          ],
          labels: ["illegal"],
          metadata: {},
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransactionResponse.data,
      });

      const result = await chainalysisService.integrateWithAML(
        undefined,
        "test-tx-hash",
        "SOL"
      );

      expect(result.riskScore).toBeGreaterThan(80);
      expect(result.riskLevel).toBe("CRITICAL");
      expect(result.requiresManualReview).toBe(true);
      expect(result.shouldBlock).toBe(true);
      expect(result.shouldReport).toBe(true);
      expect(result.factors.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("should handle integration errors gracefully", async () => {
      // Мокаем ошибку API
      (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const result = await chainalysisService.integrateWithAML("test-address", undefined, "SOL");

      expect(result.riskScore).toBe(50);
      expect(result.riskLevel).toBe("MEDIUM");
      expect(result.factors).toEqual([]);
      expect(result.recommendations).toContain("Ошибка при анализе Chainalysis");
      expect(result.requiresManualReview).toBe(true);
      expect(result.shouldBlock).toBe(false);
      expect(result.shouldReport).toBe(false);
    });
  });

  describe("createMonitoringRule", () => {
    it("should successfully create a monitoring rule", async () => {
      // Мокаем успешный ответ API
      const mockResponse = {
        success: true,
        data: {
          id: "rule-123",
          name: "Test Rule",
          description: "Test monitoring rule",
          isActive: true,
          conditions: [
            {
              field: "risk",
              operator: "GREATER_THAN",
              value: 75,
              weight: 100,
            },
          ],
          actions: [
            {
              type: "ALERT",
              parameters: { priority: "HIGH" },
            },
          ],
          createdAt: "2023-12-01T12:00:00Z",
          updatedAt: "2023-12-01T12:00:00Z",
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse.data,
      });

      const ruleRequest = {
        name: "Test Rule",
        description: "Test monitoring rule",
        isActive: true,
        conditions: [
          {
            field: "risk" as const,
            operator: "GREATER_THAN" as const,
            value: 75,
            weight: 100,
          },
        ],
        actions: [
          {
            type: "ALERT" as const,
            parameters: { priority: "HIGH" },
          },
        ],
      };

      const result = await chainalysisService.createMonitoringRule(ruleRequest);

      expect(result.success).toBe(true);
      expect(result.ruleId).toBeDefined();
      expect(result.message).toBe("Monitoring rule created successfully");
      expect(fetch).toHaveBeenCalledWith(
        "https://api.test.chainalysis.com/api/kyt/v2/rules",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-API-Key": "test-api-key",
            "X-API-Secret": "test-api-secret",
          }),
        })
      );
    });

    it("should handle rule creation errors", async () => {
      // Мокаем ошибку API
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Invalid rule configuration" }),
      });

      const ruleRequest = {
        name: "Invalid Rule",
        description: "Invalid monitoring rule",
        isActive: true,
        conditions: [],
        actions: [],
      };

      const result = await chainalysisService.createMonitoringRule(ruleRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to create monitoring rule");
    });
  });

  describe("createReport", () => {
    it("should successfully create a report", async () => {
      // Мокаем успешный ответ API
      const mockResponse = {
        success: true,
        data: {
          id: "report-123",
          type: "ADDRESS_ANALYSIS",
          title: "Test Report",
          description: "Test report description",
          generatedAt: "2023-12-01T12:00:00Z",
          generatedBy: "ChainalysisService",
          period: {
            startDate: "2023-11-01T00:00:00Z",
            endDate: "2023-12-01T00:00:00Z",
          },
          data: {
            addresses: [],
            transactions: [],
            summary: {
              totalAddresses: 0,
              totalTransactions: 0,
              riskDistribution: {
                LOW: 0,
                MEDIUM: 0,
                HIGH: 0,
                SEVERE: 0,
              },
              categoryDistribution: {},
              averageRiskScore: 0,
              highRiskAddresses: [],
              highRiskTransactions: [],
            },
          },
          metadata: {},
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse.data,
      });

      const result = await chainalysisService.createReport(
        "ADDRESS_ANALYSIS",
        "Test Report",
        "Test report description",
        { test: "data" }
      );

      expect(result.success).toBe(true);
      expect(result.reportId).toBeDefined();
      expect(result.message).toBe("Report created successfully");
      expect(fetch).toHaveBeenCalledWith(
        "https://api.test.chainalysis.com/api/kyt/v2/reports",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-API-Key": "test-api-key",
            "X-API-Secret": "test-api-secret",
          }),
        })
      );
    });
  });

  describe("getMonitoringEvents", () => {
    it("should fetch monitoring events with filters", async () => {
      // Мокаем успешный ответ API
      const mockResponse = {
        success: true,
        data: [
          {
            id: "event-123",
            ruleId: "rule-123",
            ruleName: "Test Rule",
            address: "test-address",
            asset: "SOL",
            risk: "HIGH",
            confidence: 85,
            timestamp: "2023-12-01T12:00:00Z",
            data: { test: "data" },
            processed: false,
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse.data,
      });

      const result = await chainalysisService.getMonitoringEvents({
        address: "test-address",
        asset: "SOL",
        risk: "HIGH",
        limit: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe("test-address");
      expect(result[0].risk).toBe("HIGH");
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("api.test.chainalysis.com/api/kyt/v2/events"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "X-API-Key": "test-api-key",
            "X-API-Secret": "test-api-secret",
          }),
        })
      );
    });

    it("should return empty array on API error", async () => {
      // Мокаем ошибку API
      (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const result = await chainalysisService.getMonitoringEvents();

      expect(result).toEqual([]);
    });
  });
});