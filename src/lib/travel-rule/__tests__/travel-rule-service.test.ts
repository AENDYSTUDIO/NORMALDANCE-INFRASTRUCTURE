/**
 * 🧪 Travel Rule Service Tests
 *
 * Тесты для Travel Rule сервиса в соответствии с требованиями FATF
 */

import { TravelRuleService } from "../travel-rule-service";
import { TravelRuleConfig, VASPInfo, CATMessage, OFACMessage } from "../types";
import { VASPRegistryService } from "../vasp-registry-service";

// Моковые данные для тестов
const mockVASPInfo: VASPInfo = {
  id: "TEST-VASP-001",
  name: "Test VASP",
  type: "EXCHANGE",
  registrationNumber: "TEST-001",
  jurisdiction: "US",
  address: {
    street: "123 Test Street",
    city: "Test City",
    state: "CA",
    postalCode: "90210",
    country: "US",
  },
  contact: {
    email: "test@vasp.com",
    phone: "+1-555-0123",
    website: "https://testvasp.com",
  },
  regulatoryStatus: {
    isRegistered: true,
    licenseNumber: "TEST-LICENSE-001",
    regulatorName: "Test Regulator",
    registrationDate: "2023-01-01",
  },
};

const mockTravelRuleConfig: TravelRuleConfig = {
  vaspInfo: mockVASPInfo,
  protocols: {
    ivms101: {
      enabled: false,
      endpoint: "",
      version: "1.0",
    },
    cat: {
      enabled: true,
      endpoint: "https://testvasp.com/api/cat",
      version: "1.0",
    },
    ofac: {
      enabled: true,
      endpoint: "https://testvasp.com/api/ofac",
      updateInterval: 24,
    },
  },
  security: {
    encryption: {
      algorithm: "AES-256-GCM",
      keyRotationInterval: 30,
    },
    signature: {
      algorithm: "ECDSA",
      keyId: "test-signing-key",
    },
  },
  compliance: {
    autoScreening: true,
    screeningThreshold: 70,
    reportingThreshold: 10000,
    retentionPeriod: 2555,
  },
  timeouts: {
    messageExpiry: 24,
    responseTimeout: 30,
    retryAttempts: 3,
  },
};

const mockCATMessage: CATMessage = {
  header: {
    version: "1.0",
    messageId: "test-cat-message-001",
    timestamp: new Date().toISOString(),
    sender: {
      vaspId: "TEST-VASP-001",
      name: "Test VASP",
      endpoint: "https://testvasp.com/api/cat",
    },
    recipient: {
      vaspId: "RECIPIENT-VASP-001",
      name: "Recipient VASP",
      endpoint: "https://recipientvasp.com/api/cat",
    },
  },
  payload: {
    transaction: {
      id: "test-tx-001",
      blockchain: "SOLANA",
      asset: "SOL",
      amount: 1.5,
      fromAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsY",
      toAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      timestamp: new Date().toISOString(),
    },
    originator: {
      type: "NATURAL",
      name: "John Doe",
      dateOfBirth: "1990-01-01",
      nationality: "US",
      address: "123 Test Street, Test City, US",
      identificationNumber: "PASS123456",
    },
    beneficiary: {
      type: "NATURAL",
      name: "Jane Smith",
      dateOfBirth: "1992-05-15",
      nationality: "US",
      address: "456 Recipient Ave, Recipient City, US",
      identificationNumber: "PASS789012",
    },
    purpose: "Personal expenses",
    sourceOfFunds: "Salary",
  },
  security: {
    signature: "test-signature",
    publicKey: "test-public-key",
    algorithm: "ECDSA",
  },
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

describe("TravelRuleService", () => {
  let travelRuleService: TravelRuleService;
  let vaspRegistryService: VASPRegistryService;

  beforeEach(() => {
    travelRuleService = new TravelRuleService(mockTravelRuleConfig);
    vaspRegistryService = new VASPRegistryService();
  });

  describe("sendTravelRuleMessage", () => {
    it("should successfully send CAT message", async () => {
      // Мокирование VASP реестра
      jest.spyOn(vaspRegistryService, "getVASPInfo").mockResolvedValue({
        id: "RECIPIENT-VASP-001",
        vaspInfo: {
          id: "RECIPIENT-VASP-001",
          name: "Recipient VASP",
          type: "EXCHANGE",
        },
        technicalEndpoints: {
          catEndpoint: "https://recipientvasp.com/api/cat",
        },
        supportedProtocols: ["CAT"],
        supportedFormats: ["JSON"],
        encryptionKeys: [],
        status: "ACTIVE",
        lastVerified: new Date().toISOString(),
        reputation: {
          score: 80,
          reviews: 100,
        },
      });

      const result = await travelRuleService.sendTravelRuleMessage({
        transactionId: "test-tx-001",
        recipientVaspId: "RECIPIENT-VASP-001",
        protocol: "CAT",
        message: mockCATMessage,
        priority: "MEDIUM",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.status).toBe("SENT");
    });

    it("should fail when recipient VASP not found", async () => {
      // Мокирование отсутствия VASP
      jest.spyOn(vaspRegistryService, "getVASPInfo").mockResolvedValue(null);

      const result = await travelRuleService.sendTravelRuleMessage({
        transactionId: "test-tx-001",
        recipientVaspId: "NONEXISTENT-VASP",
        protocol: "CAT",
        message: mockCATMessage,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("VASP_NOT_FOUND");
    });

    it("should fail when protocol not supported", async () => {
      // Мокирование VASP с неподдерживаемым протоколом
      jest.spyOn(vaspRegistryService, "getVASPInfo").mockResolvedValue({
        id: "RECIPIENT-VASP-001",
        vaspInfo: {
          id: "RECIPIENT-VASP-001",
          name: "Recipient VASP",
          type: "EXCHANGE",
        },
        technicalEndpoints: {
          catEndpoint: "https://recipientvasp.com/api/cat",
        },
        supportedProtocols: ["IVMS101"], // CAT не поддерживается
        supportedFormats: ["JSON"],
        encryptionKeys: [],
        status: "ACTIVE",
        lastVerified: new Date().toISOString(),
        reputation: {
          score: 80,
          reviews: 100,
        },
      });

      const result = await travelRuleService.sendTravelRuleMessage({
        transactionId: "test-tx-001",
        recipientVaspId: "RECIPIENT-VASP-001",
        protocol: "CAT",
        message: mockCATMessage,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("PROTOCOL_NOT_SUPPORTED");
    });

    it("should validate request parameters", async () => {
      const result = await travelRuleService.sendTravelRuleMessage({
        transactionId: "", // Пустой ID
        recipientVaspId: "RECIPIENT-VASP-001",
        protocol: "CAT",
        message: mockCATMessage,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("receiveTravelRuleMessages", () => {
    it("should successfully receive messages", async () => {
      const result = await travelRuleService.receiveTravelRuleMessages({
        limit: 10,
        offset: 0,
      });

      expect(result.success).toBe(true);
      expect(result.messages).toBeDefined();
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.totalCount).toBeDefined();
      expect(typeof result.totalCount).toBe("number");
    });

    it("should filter messages by status", async () => {
      const result = await travelRuleService.receiveTravelRuleMessages({
        status: "SENT",
        limit: 10,
        offset: 0,
      });

      expect(result.success).toBe(true);
      expect(result.messages).toBeDefined();
    });

    it("should filter messages by date range", async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const result = await travelRuleService.receiveTravelRuleMessages({
        dateFrom: yesterday.toISOString(),
        dateTo: now.toISOString(),
        limit: 10,
        offset: 0,
      });

      expect(result.success).toBe(true);
      expect(result.messages).toBeDefined();
    });
  });

  describe("processIncomingMessage", () => {
    it("should successfully process incoming CAT message", async () => {
      // Мокирование сохранения сообщения в базу данных
      const mockSaveMessage = jest.fn().mockResolvedValue(undefined);
      travelRuleService["saveTravelRuleMessage"] = mockSaveMessage;

      // Мокирование расшифровки
      const mockDecryptMessage = jest.fn().mockResolvedValue(mockCATMessage);
      travelRuleService["crypto"]["decryptMessage"] = mockDecryptMessage;

      // Мокирование валидации
      const mockValidateMessage = jest.fn().mockReturnValue(null);
      travelRuleService["validateIncomingMessage"] = mockValidateMessage;

      // Мокирование скрининга
      const mockPerformScreening = jest.fn().mockResolvedValue({
        requiresBlocking: false,
        requiresReview: false,
      });
      travelRuleService["performScreening"] = mockPerformScreening;

      const result = await travelRuleService.processIncomingMessage("test-message-001", "CAT");

      expect(result.success).toBe(true);
      expect(result.status).toBe("ACKNOWLEDGED");
    });

    it("should reject message with invalid format", async () => {
      // Мокирование сохранения сообщения в базу данных
      const mockSaveMessage = jest.fn().mockResolvedValue(undefined);
      travelRuleService["saveTravelRuleMessage"] = mockSaveMessage;

      // Мокирование расшифровки
      const mockDecryptMessage = jest.fn().mockResolvedValue(mockCATMessage);
      travelRuleService["crypto"]["decryptMessage"] = mockDecryptMessage;

      // Мокирование валидации с ошибкой
      const mockValidateMessage = jest.fn().mockReturnValue("Invalid message format");
      travelRuleService["validateIncomingMessage"] = mockValidateMessage;

      const result = await travelRuleService.processIncomingMessage("test-message-001", "CAT");

      expect(result.success).toBe(false);
      expect(result.status).toBe("REJECTED");
      expect(result.error).toBe("Invalid message format");
    });

    it("should block message with screening issues", async () => {
      // Мокирование сохранения сообщения в базу данных
      const mockSaveMessage = jest.fn().mockResolvedValue(undefined);
      travelRuleService["saveTravelRuleMessage"] = mockSaveMessage;

      // Мокирование расшифровки
      const mockDecryptMessage = jest.fn().mockResolvedValue(mockCATMessage);
      travelRuleService["crypto"]["decryptMessage"] = mockDecryptMessage;

      // Мокирование валидации
      const mockValidateMessage = jest.fn().mockReturnValue(null);
      travelRuleService["validateIncomingMessage"] = mockValidateMessage;

      // Мокирование скрининга с блокировкой
      const mockPerformScreening = jest.fn().mockResolvedValue({
        requiresBlocking: true,
        requiresReview: true,
      });
      travelRuleService["performScreening"] = mockPerformScreening;

      const result = await travelRuleService.processIncomingMessage("test-message-001", "CAT");

      expect(result.success).toBe(false);
      expect(result.status).toBe("REJECTED");
      expect(result.error).toBe("Message blocked due to screening results");
    });
  });

  describe("acknowledgeMessage", () => {
    it("should successfully acknowledge message", async () => {
      // Мокирование получения сообщения
      const mockGetMessage = jest.fn().mockResolvedValue({
        id: "test-message-001",
        status: "ACKNOWLEDGED",
      });
      jest.spyOn(travelRuleService as any, "getMessage").mockImplementation(mockGetMessage);

      const result = await travelRuleService.acknowledgeMessage("test-message-001");

      expect(result.success).toBe(true);
    });

    it("should fail when message not found", async () => {
      // Мокирование отсутствия сообщения
      const mockGetMessage = jest.fn().mockResolvedValue(null);
      jest.spyOn(travelRuleService as any, "getMessage").mockImplementation(mockGetMessage);

      const result = await travelRuleService.acknowledgeMessage("nonexistent-message");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Message not found");
    });

    it("should fail when message status is not ACKNOWLEDGED", async () => {
      // Мокирование сообщения с неверным статусом
      const mockGetMessage = jest.fn().mockResolvedValue({
        id: "test-message-001",
        status: "PENDING",
      });
      jest.spyOn(travelRuleService as any, "getMessage").mockImplementation(mockGetMessage);

      const result = await travelRuleService.acknowledgeMessage("test-message-001");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot acknowledge message with status");
    });
  });

  describe("getStatistics", () => {
    it("should return Travel Rule statistics", async () => {
      const result = await travelRuleService.getStatistics();

      expect(result).toBeDefined();
      expect(typeof result.totalMessages).toBe("number");
      expect(typeof result.sentMessages).toBe("number");
      expect(typeof result.receivedMessages).toBe("number");
      expect(typeof result.completedMessages).toBe("number");
      expect(typeof result.failedMessages).toBe("number");
      expect(typeof result.averageProcessingTime).toBe("number");
    });
  });
});

describe("CAT Message Validation", () => {
  it("should validate correct CAT message", () => {
    const travelRuleService = new TravelRuleService(mockTravelRuleConfig);
    const validationError = travelRuleService["validateCATMessage"](mockCATMessage);

    expect(validationError).toBeNull();
  });

  it("should detect missing messageId", () => {
    const travelRuleService = new TravelRuleService(mockTravelRuleConfig);
    const invalidMessage = { ...mockCATMessage };
    delete invalidMessage.header.messageId;

    const validationError = travelRuleService["validateCATMessage"](invalidMessage);

    expect(validationError).toBe("CAT message missing messageId");
  });

  it("should detect missing transaction ID", () => {
    const travelRuleService = new TravelRuleService(mockTravelRuleConfig);
    const invalidMessage = { ...mockCATMessage };
    delete invalidMessage.payload.transaction.id;

    const validationError = travelRuleService["validateCATMessage"](invalidMessage);

    expect(validationError).toBe("CAT message missing transaction ID");
  });

  it("should detect missing originator name", () => {
    const travelRuleService = new TravelRuleService(mockTravelRuleConfig);
    const invalidMessage = { ...mockCATMessage };
    delete invalidMessage.payload.originator.name;

    const validationError = travelRuleService["validateCATMessage"](invalidMessage);

    expect(validationError).toBe("CAT message missing originator name");
  });

  it("should detect missing beneficiary name", () => {
    const travelRuleService = new TravelRuleService(mockTravelRuleConfig);
    const invalidMessage = { ...mockCATMessage };
    delete invalidMessage.payload.beneficiary.name;

    const validationError = travelRuleService["validateCATMessage"](invalidMessage);

    expect(validationError).toBe("CAT message missing beneficiary name");
  });
});

describe("OFAC Message Validation", () => {
  it("should validate correct OFAC message", () => {
    const travelRuleService = new TravelRuleService(mockTravelRuleConfig);
    const validationError = travelRuleService["validateOFACMessage"](mockOFACMessage);

    expect(validationError).toBeNull();
  });

  it("should detect missing messageId", () => {
    const travelRuleService = new TravelRuleService(mockTravelRuleConfig);
    const invalidMessage = { ...mockOFACMessage };
    delete invalidMessage.header.messageId;

    const validationError = travelRuleService["validateOFACMessage"](invalidMessage);

    expect(validationError).toBe("OFAC message missing messageId");
  });

  it("should detect missing entities", () => {
    const travelRuleService = new TravelRuleService(mockTravelRuleConfig);
    const invalidMessage = { ...mockOFACMessage };
    invalidMessage.screeningRequest.entities = [];

    const validationError = travelRuleService["validateOFACMessage"](invalidMessage);

    expect(validationError).toBe("OFAC message missing entities to screen");
  });

  it("should detect missing transaction ID", () => {
    const travelRuleService = new TravelRuleService(mockTravelRuleConfig);
    const invalidMessage = { ...mockOFACMessage };
    delete invalidMessage.screeningRequest.transaction.id;

    const validationError = travelRuleService["validateOFACMessage"](invalidMessage);

    expect(validationError).toBe("OFAC message missing transaction ID");
  });
});