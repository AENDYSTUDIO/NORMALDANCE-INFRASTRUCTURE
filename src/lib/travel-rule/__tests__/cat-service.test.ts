/**
 * 🐱 CAT Service Tests
 *
 * Тесты для CAT (Common Address Transaction) сервиса
 */

import { CATService } from "../cat-service";
import { CATMessage, VASPRegistryEntry } from "../types";

// Моковые данные для тестов
const mockVASPInfo = {
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

const mockRecipientVASP: VASPRegistryEntry = {
  id: "test-vasp-001",
  vaspInfo: {
    id: "RECIPIENT-VASP-001",
    name: "Recipient VASP",
    type: "WALLET_PROVIDER",
    registrationNumber: "REC-001",
    jurisdiction: "GB",
    address: {
      street: "456 Recipient Street",
      city: "London",
      postalCode: "EC1A 1BB",
      country: "GB",
    },
    contact: {
      email: "recipient@vasp.com",
      phone: "+44-20-7123-4567",
      website: "https://recipientvasp.com",
    },
    regulatoryStatus: {
      isRegistered: true,
      licenseNumber: "FCA-87654321",
      regulatorName: "FCA",
      registrationDate: "2023-03-01",
    },
  },
  technicalEndpoints: {
    travelRuleEndpoint: "https://recipientvasp.com/api/travel-rule",
    catEndpoint: "https://recipientvasp.com/api/cat",
    ofacEndpoint: "https://recipientvasp.com/api/ofac",
  },
  supportedProtocols: ["CAT"],
  supportedFormats: ["JSON"],
  encryptionKeys: [
    {
      keyId: "enc_key_001",
      algorithm: "AES-256-GCM",
      publicKey: "mock_public_key_001",
      validFrom: "2023-01-01T00:00:00Z",
    },
  ],
  status: "ACTIVE",
  lastVerified: new Date().toISOString(),
  reputation: {
    score: 85,
    reviews: 100,
  },
};

const mockCATMessage: CATMessage = {
  header: {
    version: "1.0",
    messageId: "test-cat-message-001",
    timestamp: new Date().toISOString(),
    sender: {
      vaspId: "SENDER-VASP-001",
      name: "Sender VASP",
      endpoint: "https://sendervasp.com/api/cat",
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
      nationality: "GB",
      address: "456 Recipient Ave, London, GB",
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

describe("CATService", () => {
  let catService: CATService;

  beforeEach(() => {
    catService = new CATService({
      enabled: true,
      endpoint: "https://testvasp.com/api/cat",
      version: "1.0",
      timeout: 5000,
      retryAttempts: 3,
    });
  });

  describe("createCATMessage", () => {
    it("should create valid CAT message", async () => {
      const message = await catService.createCATMessage({
        transactionId: "test-tx-001",
        blockchain: "SOLANA",
        asset: "SOL",
        amount: 1.5,
        fromAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsY",
        toAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
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
          nationality: "GB",
          address: "456 Recipient Ave, London, GB",
          identificationNumber: "PASS789012",
        },
        purpose: "Personal expenses",
        sourceOfFunds: "Salary",
        senderVasp: mockVASPInfo,
        recipientVasp: mockRecipientVASP.vaspInfo,
      });

      expect(message).toBeDefined();
      expect(message.header.version).toBe("1.0");
      expect(message.header.messageId).toBeDefined();
      expect(message.header.sender.vaspId).toBe(mockVASPInfo.id);
      expect(message.header.recipient.vaspId).toBe(mockRecipientVASP.vaspInfo.id);
      expect(message.payload.transaction.id).toBe("test-tx-001");
      expect(message.payload.originator.name).toBe("John Doe");
      expect(message.payload.beneficiary.name).toBe("Jane Smith");
      expect(message.security.signature).toBeDefined();
      expect(message.security.publicKey).toBeDefined();
    });

    it("should create CAT message for legal person", async () => {
      const message = await catService.createCATMessage({
        transactionId: "test-tx-002",
        blockchain: "SOLANA",
        asset: "SOL",
        amount: 1000,
        fromAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsY",
        toAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        originator: {
          type: "LEGAL",
          name: "Test Company Ltd",
          identificationNumber: "REG123456",
        },
        beneficiary: {
          type: "LEGAL",
          name: "Recipient Company Ltd",
          identificationNumber: "REG789012",
        },
        senderVasp: mockVASPInfo,
        recipientVasp: mockRecipientVASP.vaspInfo,
      });

      expect(message.payload.originator.type).toBe("LEGAL");
      expect(message.payload.beneficiary.type).toBe("LEGAL");
    });
  });

  describe("sendMessage", () => {
    it("should successfully send CAT message", async () => {
      // Мокирование успешной отправки
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("Success"),
      });
      global.fetch = mockFetch;

      const result = await catService.sendMessage(mockCATMessage, mockRecipientVASP);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://recipientvasp.com/api/cat",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-CAT-Version": "1.0",
          }),
          body: JSON.stringify(mockCATMessage),
        })
      );
    });

    it("should fail when recipient VASP has no CAT endpoint", async () => {
      const recipientWithoutEndpoint = {
        ...mockRecipientVASP,
        technicalEndpoints: {
          travelRuleEndpoint: "https://recipientvasp.com/api/travel-rule",
          ofacEndpoint: "https://recipientvasp.com/api/ofac",
        },
      };

      const result = await catService.sendMessage(mockCATMessage, recipientWithoutEndpoint);

      expect(result.success).toBe(false);
      expect(result.error).toContain("does not have CAT endpoint");
    });

    it("should fail when message validation fails", async () => {
      const invalidMessage = {
        ...mockCATMessage,
        header: {
          ...mockCATMessage.header,
          messageId: "", // Пустой ID
        },
      };

      const result = await catService.sendMessage(invalidMessage, mockRecipientVASP);

      expect(result.success).toBe(false);
      expect(result.error).toContain("messageId is required");
    });

    it("should handle network errors", async () => {
      // Мокирование сетевой ошибки
      const mockFetch = jest.fn().mockRejectedValue(new Error("Network error"));
      global.fetch = mockFetch;

      const result = await catService.sendMessage(mockCATMessage, mockRecipientVASP);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });
  });

  describe("validateCATMessage", () => {
    it("should validate correct CAT message", () => {
      const validationError = catService["validateCATMessage"](mockCATMessage);

      expect(validationError).toBeNull();
    });

    it("should detect missing messageId", () => {
      const invalidMessage = { ...mockCATMessage };
      delete invalidMessage.header.messageId;

      const validationError = catService["validateCATMessage"](invalidMessage);

      expect(validationError).toBe("CAT message missing messageId");
    });

    it("should detect missing transaction ID", () => {
      const invalidMessage = { ...mockCATMessage };
      delete invalidMessage.payload.transaction.id;

      const validationError = catService["validateCATMessage"](invalidMessage);

      expect(validationError).toBe("CAT message missing transaction ID");
    });

    it("should detect missing originator name", () => {
      const invalidMessage = { ...mockCATMessage };
      delete invalidMessage.payload.originator.name;

      const validationError = catService["validateCATMessage"](invalidMessage);

      expect(validationError).toBe("CAT message missing originator name");
    });

    it("should detect missing beneficiary name", () => {
      const invalidMessage = { ...mockCATMessage };
      delete invalidMessage.payload.beneficiary.name;

      const validationError = catService["validateCATMessage"](invalidMessage);

      expect(validationError).toBe("CAT message missing beneficiary name");
    });
  });

  describe("convertCATToTravelRule", () => {
    it("should convert CAT message to Travel Rule format", () => {
      const travelRuleMessage = catService["convertCATToTravelRule"](mockCATMessage);

      expect(travelRuleMessage).toBeDefined();
      expect(travelRuleMessage.id).toBe(mockCATMessage.header.messageId);
      expect(travelRuleMessage.version).toBe(mockCATMessage.header.version);
      expect(travelRuleMessage.transactionId).toBe(mockCATMessage.payload.transaction.id);
      expect(travelRuleMessage.virtualAsset.type).toBe(mockCATMessage.payload.transaction.asset);
      expect(travelRuleMessage.virtualAsset.amount).toBe(mockCATMessage.payload.transaction.amount);
      expect(travelRuleMessage.originatingVASP.vaspInfo.id).toBe(mockCATMessage.header.sender.vaspId);
      expect(travelRuleMessage.benefitingVASP.vaspInfo.id).toBe(mockCATMessage.header.recipient.vaspId);
      expect(travelRuleMessage.originatingVASP.customerInfo.naturalPerson.name.firstName).toBe("John");
      expect(travelRuleMessage.originatingVASP.customerInfo.naturalPerson.name.lastName).toBe("Doe");
      expect(travelRuleMessage.benefitingVASP.customerInfo.naturalPerson.name.firstName).toBe("Jane");
      expect(travelRuleMessage.benefitingVASP.customerInfo.naturalPerson.name.lastName).toBe("Smith");
    });

    it("should convert legal person CAT message", () => {
      const legalCATMessage = {
        ...mockCATMessage,
        payload: {
          ...mockCATMessage.payload,
          originator: {
            type: "LEGAL",
            name: "Test Company Ltd",
            identificationNumber: "REG123456",
          },
          beneficiary: {
            type: "LEGAL",
            name: "Recipient Company Ltd",
            identificationNumber: "REG789012",
          },
        },
      };

      const travelRuleMessage = catService["convertCATToTravelRule"](legalCATMessage);

      expect(travelRuleMessage.originatingVASP.customerInfo.legalPerson.name).toBe("Test Company Ltd");
      expect(travelRuleMessage.originatingVASP.customerInfo.legalPerson.registrationNumber).toBe("REG123456");
      expect(travelRuleMessage.benefitingVASP.customerInfo.legalPerson.name).toBe("Recipient Company Ltd");
      expect(travelRuleMessage.benefitingVASP.customerInfo.legalPerson.registrationNumber).toBe("REG789012");
    });
  });

  describe("convertTravelRuleToCAT", () => {
    it("should convert Travel Rule message to CAT format", () => {
      const mockTravelRuleMessage = {
        id: "test-tr-001",
        version: "1.0",
        timestamp: new Date().toISOString(),
        transactionId: "test-tx-001",
        virtualAsset: {
          type: "SOL",
          amount: 1.5,
        },
        originatingVASP: {
          vaspInfo: {
            id: "SENDER-VASP-001",
            name: "Sender VASP",
          },
          customerInfo: {
            naturalPerson: {
              name: {
                firstName: "John",
                lastName: "Doe",
              },
              dateOfBirth: "1990-01-01",
              nationality: "US",
              addresses: [{
                street: "123 Test Street",
                city: "Test City",
                country: "US",
                isPrimary: true,
                addressType: "RESIDENTIAL",
              }],
              identificationDocuments: [{
                type: "PASSPORT",
                number: "PASS123456",
                issuingCountry: "US",
                issueDate: "2020-01-01",
              }],
            },
          },
          walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsY",
          verificationLevel: "STANDARD",
        },
        benefitingVASP: {
          vaspInfo: {
            id: "RECIPIENT-VASP-001",
            name: "Recipient VASP",
          },
          customerInfo: {
            naturalPerson: {
              name: {
                firstName: "Jane",
                lastName: "Smith",
              },
              dateOfBirth: "1992-05-15",
              nationality: "GB",
              addresses: [{
                street: "456 Recipient Ave",
                city: "London",
                country: "GB",
                isPrimary: true,
                addressType: "RESIDENTIAL",
              }],
              identificationDocuments: [{
                type: "PASSPORT",
                number: "PASS789012",
                issuingCountry: "GB",
                issueDate: "2020-01-01",
              }],
            },
          },
          walletAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          verificationLevel: "STANDARD",
        },
      };

      const catMessage = catService["convertTravelRuleToCAT"](mockTravelRuleMessage);

      expect(catMessage).toBeDefined();
      expect(catMessage.header.version).toBe("1.0");
      expect(catMessage.header.messageId).toBe(mockTravelRuleMessage.id);
      expect(catMessage.header.sender.vaspId).toBe(mockTravelRuleMessage.originatingVASP.vaspInfo.id);
      expect(catMessage.header.recipient.vaspId).toBe(mockTravelRuleMessage.benefitingVASP.vaspInfo.id);
      expect(catMessage.payload.transaction.id).toBe(mockTravelRuleMessage.transactionId);
      expect(catMessage.payload.originator.type).toBe("NATURAL");
      expect(catMessage.payload.originator.name).toBe("John Doe");
      expect(catMessage.payload.beneficiary.type).toBe("NATURAL");
      expect(catMessage.payload.beneficiary.name).toBe("Jane Smith");
    });
  });
});