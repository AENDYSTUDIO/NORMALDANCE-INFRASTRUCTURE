import { TestingService } from "../../src/lib/testing/testing-service";
import { DifficultyLevel, TestFormat } from "../../src/types/test-system";

describe("TestingService", () => {
  let testingService: TestingService;

  beforeEach(() => {
    testingService = new TestingService();
  });

  describe("createTest", () => {
    it("should create a test with provided parameters", () => {
      const questions = [
        {
          id: "q1",
          title: "Test question",
          description: "Test description",
          format: TestFormat.MULTIPLE_CHOICE_SINGLE,
          difficulty: DifficultyLevel.BEGINNER,
          points: 10,
          tags: ["tag1"],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: "author",
          isActive: true,
          options: [
            { id: "a1", text: "Option 1", isCorrect: true },
            { id: "a2", text: "Option 2", isCorrect: false },
          ],
        },
      ];

      const test = testingService.createTest(questions, {
        title: "Sample Test",
        description: "Sample Description",
        category: "Category",
        tags: ["tag1", "tag2"],
        timeLimit: 1800,
      });

      expect(test.title).toBe("Sample Test");
      expect(test.description).toBe("Sample Description");
      expect(test.questions).toHaveLength(1);
      expect(test.totalPoints).toBe(10);
      expect(test.category).toBe("Category");
      expect(test.timeLimit).toBe(1800);
    });
  });

  describe("gradeTest", () => {
    it("should grade a test and return results", () => {
      const questions = [
        {
          id: "q1",
          title: "Test question",
          description: "Test description",
          format: TestFormat.MULTIPLE_CHOICE_SINGLE,
          difficulty: DifficultyLevel.BEGINNER,
          points: 10,
          tags: ["tag1"],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: "author",
          isActive: true,
          options: [
            { id: "a1", text: "Option 1", isCorrect: true },
            { id: "a2", text: "Option 2", isCorrect: false },
          ],
        },
      ];

      const test = testingService.createTest(questions, {
        title: "Sample Test",
        description: "Sample Description",
        category: "Category",
        tags: ["tag1", "tag2"],
      });

      const userAnswers = [
        {
          questionId: "q1",
          answer: "a1", // Correct answer
          timeSpent: 30,
          submittedAt: new Date(),
        },
      ];

      const result = testingService.gradeTest(test, "user123", userAnswers);

      expect(result.userId).toBe("user123");
      expect(result.testId).toBe(test.id);
      expect(result.score).toBe(10); // Full points for correct answer
      expect(result.maxScore).toBe(10);
      expect(result.percentage).toBe(100);
      expect(result.detailedResults).toHaveLength(1);
      expect(result.detailedResults[0].isCorrect).toBe(true);
      expect(result.detailedResults[0].earnedPoints).toBe(10);
    });

    it("should handle incorrect answers", () => {
      const questions = [
        {
          id: "q1",
          title: "Test question",
          description: "Test description",
          format: TestFormat.MULTIPLE_CHOICE_SINGLE,
          difficulty: DifficultyLevel.BEGINNER,
          points: 10,
          tags: ["tag1"],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: "author",
          isActive: true,
          options: [
            { id: "a1", text: "Option 1", isCorrect: true },
            { id: "a2", text: "Option 2", isCorrect: false },
          ],
        },
      ];

      const test = testingService.createTest(questions, {
        title: "Sample Test",
        description: "Sample Description",
        category: "Category",
        tags: ["tag1", "tag2"],
      });

      const userAnswers = [
        {
          questionId: "q1",
          answer: "a2", // Incorrect answer
          timeSpent: 30,
          submittedAt: new Date(),
        },
      ];

      const result = testingService.gradeTest(test, "user123", userAnswers);

      expect(result.score).toBe(0); // No points for incorrect answer
      expect(result.maxScore).toBe(10);
      expect(result.percentage).toBe(0);
      expect(result.detailedResults[0].isCorrect).toBe(false);
      expect(result.detailedResults[0].earnedPoints).toBe(0);
    });
  });

  describe("generateRandomTest", () => {
    it("should generate a random test with specified parameters", () => {
      const questions = [
        {
          id: "q1",
          title: "Test question 1",
          description: "Test description 1",
          format: TestFormat.MULTIPLE_CHOICE_SINGLE,
          difficulty: DifficultyLevel.BEGINNER,
          points: 10,
          tags: ["tag1"],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: "author",
          isActive: true,
          options: [
            { id: "a1", text: "Option 1", isCorrect: true },
            { id: "a2", text: "Option 2", isCorrect: false },
          ],
        },
        {
          id: "q2",
          title: "Test question 2",
          description: "Test description 2",
          format: TestFormat.MULTIPLE_CHOICE_SINGLE,
          difficulty: DifficultyLevel.INTERMEDIATE,
          points: 15,
          tags: ["tag2"],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: "author",
          isActive: true,
          options: [
            { id: "b1", text: "Option 1", isCorrect: true },
            { id: "b2", text: "Option 2", isCorrect: false },
          ],
        },
      ];

      const randomTest = testingService.generateRandomTest(questions, {
        title: "Random Test",
        description: "Random Description",
        category: "Category",
        questionCount: 1,
        timeLimit: 1200,
      });

      expect(randomTest.title).toBe("Random Test");
      expect(randomTest.description).toBe("Random Description");
      expect(randomTest.questions).toHaveLength(1);
      expect(randomTest.timeLimit).toBe(1200);
    });
  });
});
