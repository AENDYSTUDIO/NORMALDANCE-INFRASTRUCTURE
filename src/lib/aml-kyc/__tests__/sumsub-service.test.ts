/**
 * 🧪 Sumsub Service Tests
 *
 * Тесты для сервиса интеграции с Sumsub
 */

import { KYCSumsubService, SumsubKYCRequest } from "../kyc-sumsub-service";
import { SumsubConfig, SumsubService } from "../sumsub-service";

// Моковые данные для тестов
const mockConfig: SumsubConfig = {
  apiKey: "test-api-key",
  secret: "test-secret",
  appId: "test-app-id",
  apiUrl: "https://test-api.sumsub.com",
  webHookSecret: "test-webhook-secret",
};

const mockPersonalData = {
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: "1990-01-01",
  placeOfBirth: "New York",
  nationality: "US",
  taxResidence: ["US"],
};

const mockKYCRequest: SumsubKYCRequest = {
  userId: "test-user-123",
  walletAddress: "9WzDXwBbmkg8JTt2pLQG",
  verificationLevel: "basic",
  useSumsub: true,
  personalData: mockPersonalData,
  addresses: [
    {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "US",
      isPrimary: true,
      addressType: "RESIDENTIAL",
    },
  ],
  documents: [
    {
      type: "PASSPORT",
      number: "123456789",
      issueDate: "2020-01-01",
      expiryDate: "2030-01-01",
      issuingCountry: "US",
      issuingAuthority: "U.S. Department of State",
      frontImageHash: "ipfs://mock-front-image",
      backImageHash: "ipfs://mock-back-image",
    },
  ],
};

describe("SumsubService", () => {
  let sumsubService: SumsubService;

  beforeEach(() => {
    sumsubService = new SumsubService(mockConfig);
  });

  describe("createApplicant", () => {
    it("should create applicant successfully", async () => {
      // Мокаем fetch
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "test-applicant-id" }),
      } as Response);

      const result = await sumsubService.createApplicant(
        "test-user-123",
        "john.doe@example.com",
        "+1234567890",
        mockPersonalData
      );

      expect(result.success).toBe(true);
      expect(result.applicantId).toBe("test-applicant-id");
      expect(result.message).toBe("Applicant created successfully");
    });

    it("should handle API errors", async () => {
      // Мокаем fetch с ошибкой
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Request",
        text: async () => "Invalid API key",
      } as Response);

      const result = await sumsubService.createApplicant(
        "test-user-123",
        "john.doe@example.com",
        "+1234567890",
        mockPersonalData
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("Sumsub API error");
    });
  });

  describe("generateAccessToken", () => {
    it("should generate access token successfully", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "test-access-token" }),
      } as Response);

      const result = await sumsubService.generateAccessToken(
        "test-applicant-id",
        "basic-kyc"
      );

      expect(result.success).toBe(true);
      expect(result.token).toBe("test-access-token");
    });

    it("should handle token generation errors", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        statusText: "Unauthorized",
        text: async () => "Invalid applicant ID",
      } as Response);

      const result = await sumsubService.generateAccessToken(
        "invalid-applicant-id",
        "basic-kyc"
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("Sumsub API error");
    });
  });

  describe("getApplicantInfo", () => {
    it("should get applicant info successfully", async () => {
      const mockApplicant = {
        id: "test-applicant-id",
        externalUserId: "test-user-123",
        createdAt: "2023-01-01T00:00:00Z",
        firstName: "John",
        lastName: "Doe",
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockApplicant,
      } as Response);

      const result = await sumsubService.getApplicantInfo("test-applicant-id");

      expect(result).toEqual(mockApplicant);
    });

    it("should handle applicant not found", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
        text: async () => "Applicant not found",
      } as Response);

      const result = await sumsubService.getApplicantInfo(
        "invalid-applicant-id"
      );

      expect(result).toBeNull();
    });
  });

  describe("getApplicantChecks", () => {
    it("should get applicant checks successfully", async () => {
      const mockChecks = [
        {
          id: "check-1",
          status: "completed",
          reviewResult: {
            reviewAnswer: "GREEN",
            moderationComment: "All good",
          },
          checkType: "IDENTITY",
          createdAt: "2023-01-01T00:00:00Z",
        },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockChecks,
      } as Response);

      const result = await sumsubService.getApplicantChecks(
        "test-applicant-id"
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("completed");
      expect(result[0].reviewResult?.reviewAnswer).toBe("GREEN");
    });

    it("should handle empty checks", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await sumsubService.getApplicantChecks(
        "test-applicant-id"
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("submitDocument", () => {
    it("should submit document successfully", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ imageId: "test-image-id" }),
      } as Response);

      const fileBuffer = Buffer.from("test file content");
      const result = await sumsubService.submitDocument(
        "test-applicant-id",
        "PASSPORT",
        fileBuffer,
        "passport.jpg"
      );

      expect(result.success).toBe(true);
      expect(result.imageId).toBe("test-image-id");
      expect(result.message).toBe("Document submitted successfully");
    });

    it("should handle document submission errors", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Request",
        text: async () => "Invalid file format",
      } as Response);

      const fileBuffer = Buffer.from("test file content");
      const result = await sumsubService.submitDocument(
        "test-applicant-id",
        "PASSPORT",
        fileBuffer,
        "passport.jpg"
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("Sumsub API error");
    });
  });

  describe("handleWebhook", () => {
    it("should handle verification completed webhook", async () => {
      const mockPayload = {
        type: "applicant.reviewResultChanged",
        applicantId: "test-applicant-id",
        reviewResult: {
          reviewAnswer: "GREEN",
          moderationComment: "Verification completed successfully",
        },
      };

      const result = await sumsubService.handleWebhook(
        mockPayload,
        "test-signature"
      );

      expect(result).toBe(true);
    });

    it("should handle verification rejected webhook", async () => {
      const mockPayload = {
        type: "applicant.reviewResultChanged",
        applicantId: "test-applicant-id",
        reviewResult: {
          reviewAnswer: "RED",
          moderationComment: "Document appears to be fake",
        },
      };

      const result = await sumsubService.handleWebhook(
        mockPayload,
        "test-signature"
      );

      expect(result).toBe(true);
    });

    it("should handle invalid webhook payload", async () => {
      const mockPayload = {
        type: "unknown.type",
        applicantId: "test-applicant-id",
      };

      const result = await sumsubService.handleWebhook(
        mockPayload,
        "test-signature"
      );

      expect(result).toBe(true); // Возвращает true даже для неизвестных типов
    });
  });
});

describe("KYCSumsubService", () => {
  let kycSumsubService: KYCSumsubService;

  beforeEach(() => {
    kycSumsubService = new KYCSumsubService(mockConfig);
  });

  describe("createKYCProfileWithSumsub", () => {
    it("should create KYC profile with Sumsub integration", async () => {
      // Мокаем Sumsub сервис
      jest
        .spyOn(kycSumsubService["sumsubService"], "createApplicant")
        .mockResolvedValueOnce({
          success: true,
          applicantId: "test-applicant-id",
        });

      jest
        .spyOn(kycSumsubService["sumsubService"], "generateAccessToken")
        .mockResolvedValueOnce({
          success: true,
          token: "test-access-token",
        });

      jest
        .spyOn(kycSumsubService["kycService"], "createKYCProfile")
        .mockResolvedValueOnce({
          success: true,
          profileId: "test-profile-id",
          status: "PENDING",
          level: "BASIC",
        });

      const result = await kycSumsubService.createKYCProfileWithSumsub(
        mockKYCRequest
      );

      expect(result.success).toBe(true);
      expect(result.profileId).toBe("test-profile-id");
      expect(result.sumsubApplicantId).toBe("test-applicant-id");
      expect(result.sumsubAccessToken).toBe("test-access-token");
      expect(result.verificationLevel).toBe("basic");
      expect(result.nextSteps).toContain("Upload required documents");
    });

    it("should handle validation errors", async () => {
      const invalidRequest = {
        ...mockKYCRequest,
        userId: "", // Invalid empty user ID
      };

      const result = await kycSumsubService.createKYCProfileWithSumsub(
        invalidRequest
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain("User ID is required");
    });

    it("should handle existing profile", async () => {
      jest
        .spyOn(kycSumsubService["kycService"], "getKYCProfileByUserId")
        .mockResolvedValueOnce({
          id: "existing-profile-id",
          status: "VERIFIED",
          level: "STANDARD",
        });

      const result = await kycSumsubService.createKYCProfileWithSumsub(
        mockKYCRequest
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("KYC profile already exists");
    });
  });

  describe("processSumsubVerificationResult", () => {
    it("should process successful verification", async () => {
      const mockProfile = {
        id: "test-profile-id",
        userId: "test-user-123",
        level: "BASIC",
        status: "PENDING",
        additionalData: {
          verificationLevel: "basic",
          sumsubApplicantId: "test-applicant-id",
        },
      };

      // Мокаем поиск профиля
      jest
        .spyOn(kycSumsubService as any, "findKYCProfileByApplicantId")
        .mockResolvedValueOnce(mockProfile);

      jest
        .spyOn(kycSumsubService["kycService"], "updateKYCStatus")
        .mockResolvedValueOnce({
          success: true,
        });

      const result = await kycSumsubService.processSumsubVerificationResult(
        "test-applicant-id",
        { reviewAnswer: "GREEN" }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("KYC status updated to VERIFIED");
    });

    it("should process rejected verification", async () => {
      const mockProfile = {
        id: "test-profile-id",
        userId: "test-user-123",
        level: "BASIC",
        status: "PENDING",
        additionalData: {
          verificationLevel: "basic",
          sumsubApplicantId: "test-applicant-id",
        },
      };

      jest
        .spyOn(kycSumsubService as any, "findKYCProfileByApplicantId")
        .mockResolvedValueOnce(mockProfile);

      jest
        .spyOn(kycSumsubService["kycService"], "updateKYCStatus")
        .mockResolvedValueOnce({
          success: true,
        });

      const result = await kycSumsubService.processSumsubVerificationResult(
        "test-applicant-id",
        { reviewAnswer: "RED" }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("KYC status updated to REJECTED");
    });
  });

  describe("upgradeVerificationLevel", () => {
    it("should upgrade verification level successfully", async () => {
      const mockProfile = {
        id: "test-profile-id",
        userId: "test-user-123",
        level: "BASIC",
        additionalData: {
          verificationLevel: "basic",
          sumsubApplicantId: "test-applicant-id",
        },
      };

      jest
        .spyOn(kycSumsubService["kycService"], "getKYCProfileByUserId")
        .mockResolvedValueOnce(mockProfile);

      jest
        .spyOn(kycSumsubService["sumsubService"], "generateAccessToken")
        .mockResolvedValueOnce({
          success: true,
          token: "new-access-token",
        });

      const result = await kycSumsubService.upgradeVerificationLevel(
        "test-user-123",
        "standard"
      );

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe("new-access-token");
      expect(result.message).toContain(
        "Verification level upgrade initiated to standard"
      );
    });

    it("should handle same level upgrade request", async () => {
      const mockProfile = {
        id: "test-profile-id",
        userId: "test-user-123",
        level: "BASIC",
        additionalData: {
          verificationLevel: "basic",
          sumsubApplicantId: "test-applicant-id",
        },
      };

      jest
        .spyOn(kycSumsubService["kycService"], "getKYCProfileByUserId")
        .mockResolvedValueOnce(mockProfile);

      const result = await kycSumsubService.upgradeVerificationLevel(
        "test-user-123",
        "basic"
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain(
        "User already has this verification level"
      );
    });
  });

  describe("getAvailableVerificationLevels", () => {
    it("should return all available verification levels", () => {
      const levels = kycSumsubService.getAvailableVerificationLevels();

      expect(levels).toHaveLength(4);
      expect(levels[0].levelName).toBe("basic");
      expect(levels[1].levelName).toBe("standard");
      expect(levels[2].levelName).toBe("enhanced");
      expect(levels[3].levelName).toBe("enterprise");
    });

    it("should include required documents for each level", () => {
      const levels = kycSumsubService.getAvailableVerificationLevels();

      const basicLevel = levels.find((l) => l.levelName === "basic");
      expect(basicLevel?.requiredDocuments).toContain("SELFIE");

      const standardLevel = levels.find((l) => l.levelName === "standard");
      expect(standardLevel?.requiredDocuments).toContain("PASSPORT");
      expect(standardLevel?.requiredDocuments).toContain("SELFIE");

      const enterpriseLevel = levels.find((l) => l.levelName === "enterprise");
      expect(enterpriseLevel?.requiredDocuments).toContain("PASSPORT");
      expect(enterpriseLevel?.requiredDocuments).toContain("UTILITY_BILL");
      expect(enterpriseLevel?.requiredDocuments).toContain("BANK_STATEMENT");
    });
  });

  describe("getVerificationLevel", () => {
    it("should return specific verification level", () => {
      const level = kycSumsubService.getVerificationLevel("basic");

      expect(level).not.toBeNull();
      expect(level?.levelName).toBe("basic");
      expect(level?.displayName).toBe("Базовая верификация");
    });

    it("should return null for invalid level", () => {
      const level = kycSumsubService.getVerificationLevel("invalid-level");

      expect(level).toBeNull();
    });
  });
});

// Глобальные моки для тестов
global.fetch = jest.fn();
global.FormData = jest.fn().mockImplementation(() => ({
  append: jest.fn(),
}));

// Очистка после каждого теста
afterEach(() => {
  jest.clearAllMocks();
});
