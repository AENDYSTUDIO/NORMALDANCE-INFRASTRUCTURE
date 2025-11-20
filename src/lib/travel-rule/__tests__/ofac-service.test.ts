/**
 * 🛡️ OFAC Service Tests
 *
 * Тесты для OFAC сервиса и проверки санкционных списков
 */

import { OFACService, OFACScreeningResult } from "../ofac-service";
import { OFACMessage } from "../types";

// Моковые данные для тестов
const mockOFACConfig = {
  enabled: true,
  endpoint: "https://test-ofac.com/api",
  apiKey: "test-api-key",
  updateInterval: 24,
  timeout: 5000,
  retryAttempts: 3,
};

const mockOFACMessage: OFACMessage = {
  header: {
    version: "1.0",
    timestamp: new Date().toISOString(),
    messageId: "test-ofac-message-001",
    priority: "MEDIUM",
  },
  screeningRequest: {
    entities: [
      {
        type: "INDIVIDUAL",
        name: "John Doe",
        aliases: ["J. Doe", "Johnny Doe"],
        dateOfBirth: "1990-01-01",
        nationality: "US",
        addresses: ["123 Test Street, Test City, US"],
        identificationNumbers: ["PASS123456"],
      },
      {
        type: "ENTITY",
        name: "Test Company Ltd",
        aliases: ["Test Corp", "Testing Company"],
        identificationNumbers: ["REG789012"],
      },
    ],
    transaction: {
      id: "test-tx-001",
      amount: 1500,
      currency: "USD",
      date: new Date().toISOString().split('T')[0],
      parties: [
        {
          type: "ORIGINATOR",
          name: "John Doe",
          address: "123 Test Street, Test City, US",
          accountNumber: "ACC123456",
        },
        {
          type: "BENEFICIARY",
          name: "Jane Smith",
          address: "456 Recipient Ave, Recipient City, US",
          accountNumber: "ACC789012",
        },
      ],
    },
  },
};

const mockSanctionsList = {
  "OFAC_SDN": {
    entries: [
      {
        name: "John Doe",
        type: "INDIVIDUAL",
        aliases: ["J. Doe", "Johnny Doe"],
        identificationNumbers: ["PASS123456"],
      },
      {
        name: "Evil Corp",
        type: "ENTITY",
        aliases: ["Evil Corporation"],
        identificationNumbers: ["REG789012"],
      },
    ],
  },
  "EU_SANCTIONS": {
    entries: [
      {
        name: "Jane Smith",
        type: "INDIVIDUAL",
        aliases: ["J. Smith"],
        identificationNumbers: ["ID987654"],
      },
    ],
  },
};

describe("OFACService", () => {
  let ofacService: OFACService;

  beforeEach(() => {
    ofacService = new OFACService(mockOFACConfig);
    // Мокирование кэша санкционных списков
    ofacService["sanctionsCache"] = new Map();
    ofacService["sanctionsCache"].set("OFAC_SDN", mockSanctionsList["OFAC_SDN"]);
    ofacService["sanctionsCache"].set("EU_SANCTIONS", mockSanctionsList["EU_SANCTIONS"]);
  });

  describe("createOFACMessage", () => {
    it("should create valid OFAC message", async () => {
      const message = await ofacService.createOFACMessage({
        transactionId: "test-tx-001",
        amount: 1500,
        currency: "USD",
        date: "2023-12-01",
        entities: [
          {
            type: "INDIVIDUAL",
            name: "John Doe",
            aliases: ["J. Doe"],
            dateOfBirth: "1990-01-01",
            nationality: "US",
            addresses: ["123 Test Street, Test City, US"],
            identificationNumbers: ["PASS123456"],
          },
        ],
        parties: [
          {
            type: "ORIGINATOR",
            name: "John Doe",
            address: "123 Test Street, Test City, US",
            accountNumber: "ACC123456",
          },
          {
            type: "BENEFICIARY",
            name: "Jane Smith",
            address: "456 Recipient Ave, Recipient City, US",
            accountNumber: "ACC789012",
          },
        ],
        priority: "MEDIUM",
      });

      expect(message).toBeDefined();
      expect(message.header.version).toBe("1.0");
      expect(message.header.messageId).toBeDefined();
      expect(message.header.priority).toBe("MEDIUM");
      expect(message.screeningRequest.entities).toHaveLength(1);
      expect(message.screeningRequest.transaction.id).toBe("test-tx-001");
      expect(message.screeningRequest.transaction.amount).toBe(1500);
      expect(message.screeningRequest.transaction.currency).toBe("USD");
      expect(message.screeningRequest.transaction.parties).toHaveLength(2);
    });

    it("should create OFAC message with high priority", async () => {
      const message = await ofacService.createOFACMessage({
        transactionId: "test-tx-002",
        amount: 50000,
        currency: "USD",
        date: "2023-12-01",
        entities: [
          {
            type: "INDIVIDUAL",
            name: "High Risk User",
          },
        ],
        parties: [
          {
            type: "ORIGINATOR",
            name: "High Risk User",
          },
        ],
        priority: "HIGH",
      });

      expect(message.header.priority).toBe("HIGH");
    });

    it("should create OFAC message with multiple entities", async () => {
      const message = await ofacService.createOFACMessage({
        transactionId: "test-tx-003",
        amount: 2500,
        currency: "EUR",
        date: "2023-12-01",
        entities: [
          {
            type: "INDIVIDUAL",
            name: "Person One",
          },
          {
            type: "ENTITY",
            name: "Company One",
          },
          {
            type: "INDIVIDUAL",
            name: "Person Two",
          },
        ],
        parties: [
          {
            type: "ORIGINATOR",
            name: "Person One",
          },
        ],
      });

      expect(message.screeningRequest.entities).toHaveLength(3);
      expect(message.screeningRequest.entities[0].type).toBe("INDIVIDUAL");
      expect(message.screeningRequest.entities[1].type).toBe("ENTITY");
      expect(message.screeningRequest.entities[2].type).toBe("INDIVIDUAL");
    });
  });

  describe("performOFACScreening", () => {
    it("should detect exact name match", async () => {
      const result = await ofacService.performOFACScreening(mockOFACMessage);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].entity.name).toBe("John Doe");
      expect(result.matches[0].entity.type).toBe("INDIVIDUAL");
      expect(result.matches[0].entity.list).toBe("OFAC_SDN");
      expect(result.matches[0].confidence).toBe(100);
      expect(result.recommendation).toBe("BLOCK");
      expect(result.requiresBlocking).toBe(true);
      expect(result.requiresReview).toBe(true);
    });

    it("should detect alias match", async () => {
      const messageWithAlias = {
        ...mockOFACMessage,
        screeningRequest: {
          ...mockOFACMessage.screeningRequest,
          entities: [
            {
              type: "INDIVIDUAL",
              name: "Johnny Doe", // Псевдоним из санкционного списка
              dateOfBirth: "1990-01-01",
              nationality: "US",
            },
          ],
        },
      };

      const result = await ofacService.performOFACScreening(messageWithAlias);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].entity.name).toBe("John Doe");
      expect(result.matches[0].entity.list).toBe("OFAC_SDN");
      expect(result.matches[0].confidence).toBe(85);
      expect(result.recommendation).toBe("REVIEW");
      expect(result.requiresBlocking).toBe(false);
      expect(result.requiresReview).toBe(true);
    });

    it("should detect identification number match", async () => {
      const messageWithId = {
        ...mockOFACMessage,
        screeningRequest: {
          ...mockOFACMessage.screeningRequest,
          entities: [
            {
              type: "INDIVIDUAL",
              name: "Different Name",
              identificationNumbers: ["PASS123456"], // ID из санкционного списка
              dateOfBirth: "1990-01-01",
              nationality: "US",
            },
          ],
        },
      };

      const result = await ofacService.performOFACScreening(messageWithId);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].entity.name).toBe("John Doe");
      expect(result.matches[0].entity.list).toBe("OFAC_SDN");
      expect(result.matches[0].confidence).toBe(95);
      expect(result.recommendation).toBe("BLOCK");
      expect(result.requiresBlocking).toBe(true);
    });

    it("should detect multiple matches", async () => {
      const messageWithMultiple = {
        ...mockOFACMessage,
        screeningRequest: {
          ...mockOFACMessage.screeningRequest,
          entities: [
            {
              type: "INDIVIDUAL",
              name: "John Doe", // Из OFAC списка
              dateOfBirth: "1990-01-01",
              nationality: "US",
            },
            {
              type: "INDIVIDUAL",
              name: "Jane Smith", // Из EU списка
              dateOfBirth: "1992-05-15",
              nationality: "GB",
            },
          ],
        },
      };

      const result = await ofacService.performOFACScreening(messageWithMultiple);

      expect(result.matches).toHaveLength(2);
      expect(result.matches[0].entity.name).toBe("John Doe");
      expect(result.matches[0].entity.list).toBe("OFAC_SDN");
      expect(result.matches[1].entity.name).toBe("Jane Smith");
      expect(result.matches[1].entity.list).toBe("EU_SANCTIONS");
      expect(result.recommendation).toBe("BLOCK");
      expect(result.requiresBlocking).toBe(true);
    });

    it("should return no matches for clean entity", async () => {
      const cleanMessage = {
        ...mockOFACMessage,
        screeningRequest: {
          ...mockOFACMessage.screeningRequest,
          entities: [
            {
              type: "INDIVIDUAL",
              name: "Clean User",
              dateOfBirth: "1990-01-01",
              nationality: "CA",
              addresses: ["123 Clean Street, Clean City, CA"],
              identificationNumbers: ["CLEAN123456"],
            },
          ],
        },
      };

      const result = await ofacService.performOFACScreening(cleanMessage);

      expect(result.matches).toHaveLength(0);
      expect(result.recommendation).toBe("APPROVE");
      expect(result.requiresBlocking).toBe(false);
      expect(result.requiresReview).toBe(false);
    });

    it("should handle high risk nationality", async () => {
      const highRiskMessage = {
        ...mockOFACMessage,
        screeningRequest: {
          ...mockOFACMessage.screeningRequest,
          entities: [
            {
              type: "INDIVIDUAL",
              name: "High Risk User",
              dateOfBirth: "1990-01-01",
              nationality: "IR", // Высокорисковая страна
            },
          ],
        },
      };

      const result = await ofacService.performOFACScreening(highRiskMessage);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].entity.name).toBe("Country: IR");
      expect(result.matches[0].entity.type).toBe("COUNTRY");
      expect(result.matches[0].entity.list).toBe("GEOGRAPHIC_SANCTIONS");
      expect(result.matches[0].confidence).toBe(100);
      expect(result.recommendation).toBe("BLOCK");
      expect(result.requiresBlocking).toBe(true);
    });
  });

  describe("sendMessage", () => {
    it("should successfully send OFAC message", async () => {
      // Мокирование успешной отправки
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("Success"),
      });
      global.fetch = mockFetch;

      const result = await ofacService.sendMessage(mockOFACMessage, {
        id: "test-vasp-001",
        technicalEndpoints: {
          ofacEndpoint: "https://testvasp.com/api/ofac",
        },
        supportedProtocols: ["OFAC"],
        supportedFormats: ["JSON"],
        encryptionKeys: [],
        status: "ACTIVE",
        lastVerified: new Date().toISOString(),
        reputation: {
          score: 80,
          reviews: 100,
        },
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://testvasp.com/api/ofac",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-OFAC-Version": "1.0",
            "Authorization": "Bearer test-api-key",
          }),
          body: JSON.stringify(expect.objectContaining({
            header: expect.any(Object),
            screeningRequest: expect.any(Object),
            response: expect.any(Object),
          })),
        })
      );
    });

    it("should fail when recipient has no OFAC endpoint", async () => {
      const recipientWithoutEndpoint = {
        id: "test-vasp-001",
        technicalEndpoints: {
          travelRuleEndpoint: "https://testvasp.com/api/travel-rule",
          catEndpoint: "https://testvasp.com/api/cat",
        },
        supportedProtocols: ["CAT"], // OFAC не поддерживается
        supportedFormats: ["JSON"],
        encryptionKeys: [],
        status: "ACTIVE",
        lastVerified: new Date().toISOString(),
        reputation: {
          score: 80,
          reviews: 100,
        },
      };

      const result = await ofacService.sendMessage(mockOFACMessage, recipientWithoutEndpoint);

      expect(result.success).toBe(false);
      expect(result.error).toContain("does not have OFAC endpoint");
    });

    it("should handle network errors", async () => {
      // Мокирование сетевой ошибки
      const mockFetch = jest.fn().mockRejectedValue(new Error("Network error"));
      global.fetch = mockFetch;

      const result = await ofacService.sendMessage(mockOFACMessage, {
        id: "test-vasp-001",
        technicalEndpoints: {
          ofacEndpoint: "https://testvasp.com/api/ofac",
        },
        supportedProtocols: ["OFAC"],
        supportedFormats: ["JSON"],
        encryptionKeys: [],
        status: "ACTIVE",
        lastVerified: new Date().toISOString(),
        reputation: {
          score: 80,
          reviews: 100,
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    it("should block message when screening fails", async () => {
      // Мокирование проверки с блокировкой
      const mockPerformScreening = jest.fn().mockResolvedValue({
        matches: [
          {
            entity: {
              name: "Blocked Entity",
              type: "INDIVIDUAL",
              list: "OFAC_SDN",
              score: 100,
            },
            confidence: 100,
            details: "Direct match",
          },
        ],
        recommendation: "BLOCK",
        processedAt: new Date().toISOString(),
        requiresBlocking: true,
        requiresReview: true,
      });
      ofacService["performOFACScreening"] = mockPerformScreening;

      const result = await ofacService.sendMessage(mockOFACMessage, {
        id: "test-vasp-001",
        technicalEndpoints: {
          ofacEndpoint: "https://testvasp.com/api/ofac",
        },
        supportedProtocols: ["OFAC"],
        supportedFormats: ["JSON"],
        encryptionKeys: [],
        status: "ACTIVE",
        lastVerified: new Date().toISOString(),
        reputation: {
          score: 80,
          reviews: 100,
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("blocked due to OFAC screening");
    });
  });

  describe("validateOFACMessage", () => {
    it("should validate correct OFAC message", () => {
      const validationError = ofacService["validateOFACMessage"](mockOFACMessage);

      expect(validationError).toBeNull();
    });

    it("should detect missing messageId", () => {
      const invalidMessage = { ...mockOFACMessage };
      delete invalidMessage.header.messageId;

      const validationError = ofacService["validateOFACMessage"](invalidMessage);

      expect(validationError).toBe("OFAC message missing messageId");
    });

    it("should detect missing entities", () => {
      const invalidMessage = { ...mockOFACMessage };
      invalidMessage.screeningRequest.entities = [];

      const validationError = ofacService["validateOFACMessage"](invalidMessage);

      expect(validationError).toBe("OFAC message missing entities to screen");
    });

    it("should detect missing transaction ID", () => {
      const invalidMessage = { ...mockOFACMessage };
      delete invalidMessage.screeningRequest.transaction.id;

      const validationError = ofacService["validateOFACMessage"](invalidMessage);

      expect(validationError).toBe("OFAC message missing transaction ID");
    });

    it("should detect invalid transaction amount", () => {
      const invalidMessage = { ...mockOFACMessage };
      invalidMessage.screeningRequest.transaction.amount = -100;

      const validationError = ofacService["validateOFACMessage"](invalidMessage);

      expect(validationError).toBe("OFAC transaction amount must be positive");
    });

    it("should detect missing transaction currency", () => {
      const invalidMessage = { ...mockOFACMessage };
      delete invalidMessage.screeningRequest.transaction.currency;

      const validationError = ofacService["validateOFACMessage"](invalidMessage);

      expect(validationError).toBe("OFAC transaction currency is required");
    });
  });

  describe("calculateMatchScore", () => {
    it("should return 100 for exact match", () => {
      const score = ofacService["calculateMatchScore"]("John Doe", "John Doe");

      expect(score).toBe(100);
    });

    it("should return 85 for partial match", () => {
      const score = ofacService["calculateMatchScore"]("John", "John Doe");

      expect(score).toBe(85);
    });

    it("should return 85 for contains match", () => {
      const score = ofacService["calculateMatchScore"]("John Doe", "Big John Doe");

      expect(score).toBe(85);
    });

    it("should return low score for partial match", () => {
      const score = ofacService["calculateMatchScore"]("Jhn", "John Doe");

      expect(score).toBeLessThan(50);
    });

    it("should return 0 for no match", () => {
      const score = ofacService["calculateMatchScore"]("Jane Smith", "John Doe");

      expect(score).toBe(0);
    });
  });

  describe("calculateConfidence", () => {
    it("should return 95 for score >= 95", () => {
      const confidence = ofacService["calculateConfidence"]("John Doe", "John Doe");

      expect(confidence).toBe(95);
    });

    it("should return 80 for score >= 85", () => {
      const confidence = ofacService["calculateConfidence"]("John", "John Doe");

      expect(confidence).toBe(80);
    });

    it("should return 60 for score >= 70", () => {
      const confidence = ofacService["calculateConfidence"]("Jhn", "John Doe");

      expect(confidence).toBe(60);
    });

    it("should return 40 for score >= 50", () => {
      const confidence = ofacService["calculateConfidence"]("J", "John Doe");

      expect(confidence).toBe(40);
    });

    it("should return 20 for score < 50", () => {
      const confidence = ofacService["calculateConfidence"]("X", "John Doe");

      expect(confidence).toBe(20);
    });
  });

  describe("determineRecommendation", () => {
    it("should return BLOCK for high confidence matches", () => {
      const matches = [
        {
          entity: { name: "Test", type: "INDIVIDUAL", list: "OFAC_SDN", score: 100 },
          confidence: 95,
          details: "High confidence match",
        },
      ];

      const recommendation = ofacService["determineRecommendation"](matches);

      expect(recommendation).toBe("BLOCK");
    });

    it("should return REVIEW for medium confidence matches", () => {
      const matches = [
        {
          entity: { name: "Test", type: "INDIVIDUAL", list: "OFAC_SDN", score: 85 },
          confidence: 80,
          details: "Medium confidence match",
        },
      ];

      const recommendation = ofacService["determineRecommendation"](matches);

      expect(recommendation).toBe("REVIEW");
    });

    it("should return APPROVE for no matches", () => {
      const matches: any[] = [];

      const recommendation = ofacService["determineRecommendation"](matches);

      expect(recommendation).toBe("APPROVE");
    });

    it("should return REVIEW for low confidence matches", () => {
      const matches = [
        {
          entity: { name: "Test", type: "INDIVIDUAL", list: "OFAC_SDN", score: 60 },
          confidence: 40,
          details: "Low confidence match",
        },
      ];

      const recommendation = ofacService["determineRecommendation"](matches);

      expect(recommendation).toBe("REVIEW");
    });
  });
});