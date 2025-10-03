import { jest } from "@jest/globals";
import codeEmbeddings from "../../src/lib/code-embeddings";
import kiloCodeService from "../../src/lib/kilocode-service";
import qdrantClient from "../../src/lib/qdrant-config";
import qdrantService from "../../src/lib/qdrant-service";
import rooCodeService from "../../src/lib/roocode-service";

// Мок для QdrantClient
jest.mock("../../src/lib/qdrant-config", () => ({
  __esModule: true,
  default: {
    getCollections: jest.fn(),
    createCollection: jest.fn(),
    upsert: jest.fn(),
    search: jest.fn(),
  },
}));

// Мок для RooCodeService
jest.mock("../../src/lib/roocode-service", () => ({
  __esModule: true,
  default: {
    analyzeCode: jest.fn(),
  },
}));

// Мок для KiloCodeService
jest.mock("../../src/lib/kilocode-service", () => ({
  __esModule: true,
  default: {
    analyzeMetrics: jest.fn(),
  },
}));

describe("Интеграция с Qdrant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("qdrantService", () => {
    test("должен инициализировать коллекцию", async () => {
      (
        qdrantClient.getCollections as jest.MockedFunction<any>
      ).mockResolvedValue({
        collections: [],
      });

      (
        qdrantClient.createCollection as jest.MockedFunction<any>
      ).mockResolvedValue(undefined);

      await qdrantService.initCollection();

      expect(qdrantClient.createCollection).toHaveBeenCalledWith("codedocs", {
        vectors: {
          size: 512,
          distance: "Cosine",
        },
      });
    });

    test("должен добавлять документ в Qdrant", async () => {
      (qdrantClient.upsert as jest.MockedFunction<any>).mockResolvedValue(
        undefined
      );

      const document = {
        id: "test-id",
        content: "test content",
        metadata: { filePath: "test.ts" },
        vector: Array(512).fill(0.1),
      };

      await qdrantService.addDocument(document);

      expect(qdrantClient.upsert).toHaveBeenCalledWith("codedocs", {
        points: [
          {
            id: "test-id",
            vector: Array(512).fill(0.1),
            payload: {
              content: "test content",
              metadata: { filePath: "test.ts" },
            },
          },
        ],
      });
    });

    test("должен выполнять поиск документов", async () => {
      const mockResults = [
        {
          id: "test-id",
          score: 0.9,
          payload: {
            content: "test content",
            metadata: { filePath: "test.ts" },
          },
        },
      ];

      (qdrantClient.search as jest.MockedFunction<any>).mockResolvedValue(
        mockResults
      );

      const results = await qdrantService.searchDocuments([0.1, 0.2, 0.3], 5);

      expect(qdrantClient.search).toHaveBeenCalledWith("codedocs", {
        vector: [0.1, 0.2, 0.3],
        limit: 5,
        with_payload: true,
      });

      expect(results).toEqual(mockResults);
    });
  });

  describe("codeEmbeddings", () => {
    test("должен извлекать функции из TypeScript файла", () => {
      const content = `
        export function testFunction() {
          return 'hello';
        }
        
        const arrowFunction = () => {
          return 'world';
        }
      `;

      const functions = (codeEmbeddings as any).extractFunctions(
        content,
        "typescript"
      );

      expect(functions).toContain("testFunction");
      expect(functions).toContain("arrowFunction");
    });

    test("должен извлекать классы из TypeScript файла", () => {
      const content = `
        export class TestClass {
          method() {}
        }
      `;

      const classes = (codeEmbeddings as any).extractClasses(
        content,
        "typescript"
      );

      expect(classes).toContain("TestClass");
    });

    test("должен извлекать комментарии", () => {
      const content = `
        // Это комментарий
        /* Это многострочный
           комментарий */
        const x = 1;
      `;

      const comments = (codeEmbeddings as any).extractComments(content);

      expect(comments).toContain("Это комментарий");
      expect(comments).toContain(
        "/* Это многострочный\n           комментарий */"
      );
    });

    test("должен анализировать код с помощью RooCode", async () => {
      const mockRooCodeResult = {
        id: "test-id",
        code: "console.log('hello');",
        language: "javascript",
        patterns: ["Strategy"],
        functions: ["testFunction"],
        complexity: 2,
      };

      (
        rooCodeService.analyzeCode as jest.MockedFunction<any>
      ).mockResolvedValue(mockRooCodeResult);

      const content = "console.log('hello');";
      const result = await (codeEmbeddings as any).analyzeCodeFile("test.ts");

      expect(rooCodeService.analyzeCode).toHaveBeenCalledWith(
        content,
        "typescript"
      );
      expect(result.rooCodeAnalysis).toEqual(mockRooCodeResult);
    });

    test("должен анализировать метрики кода с помощью KiloCode", async () => {
      const mockKiloCodeResult = {
        id: "test-id",
        loc: 10,
        sloc: 5,
        cloc: 2,
        complexity: 3,
        maintainability: 80,
        bugsEstimate: 1,
      };

      (
        kiloCodeService.analyzeMetrics as jest.MockedFunction<any>
      ).mockResolvedValue(mockKiloCodeResult);

      const content = "console.log('hello');";
      const result = await (codeEmbeddings as any).analyzeCodeFile("test.ts");

      expect(kiloCodeService.analyzeMetrics).toHaveBeenCalledWith(content);
      expect(result.kiloCodeMetrics).toEqual(mockKiloCodeResult);
    });
  });
});
