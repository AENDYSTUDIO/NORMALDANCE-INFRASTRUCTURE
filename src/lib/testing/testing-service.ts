import {
  AdaptiveSettings,
  Question,
  Test,
  TestResult,
  UserProfile,
} from "@/types/test-system";
import { AdaptiveEngine } from "./adaptive-engine";
import { AnalyticsService } from "./analytics-service";
import { GradingSystem } from "./grading-system";
import { LMSIntegration } from "./lms-integration";
import { TestGenerator } from "./test-generator";

/**
 * Главный сервис системы тестирования
 * Объединяет все компоненты в единую систему
 */
export class TestingService {
  private lmsIntegration?: LMSIntegration;

  constructor(lmsConfig?: { apiUrl: string; apiKey: string; [key: string]: unknown }) {
    if (lmsConfig) {
      this.lmsIntegration = new LMSIntegration(lmsConfig);
    }
  }

  /**
   * Создание нового теста
   */
  createTest(
    questions: Question[],
    params: {
      title: string;
      description: string;
      category: string;
      tags?: string[];
      timeLimit?: number;
      isAdaptive?: boolean;
      randomizeQuestions?: boolean;
      randomizeOptions?: boolean;
    }
  ): Test {
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    const test: Test = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: params.title,
      description: params.description,
      questions,
      totalPoints,
      timeLimit: params.timeLimit,
      difficulty: this.estimateTestDifficulty(questions),
      category: params.category,
      tags: params.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      author: "system",
      isActive: true,
      isAdaptive: params.isAdaptive || false,
      randomizeQuestions: params.randomizeQuestions !== false,
      randomizeOptions: params.randomizeOptions === true,
    };

    return test;
  }

  /**
   * Генерация адаптивного теста для пользователя
   */
  generateAdaptiveTest(
    allQuestions: Question[],
    userProfile: UserProfile,
    adaptiveSettings: AdaptiveSettings
  ): Test {
    const selectedQuestions = AdaptiveEngine.generateAdaptiveTest(
      allQuestions,
      userProfile,
      adaptiveSettings
    );

    return this.createTest(selectedQuestions, {
      title: `Адаптивный тест для ${userProfile.name}`,
      description: "Тест, адаптированный под ваш текущий уровень подготовки",
      category: userProfile.skills.join(", ") || "General",
      isAdaptive: true,
    });
  }

  /**
   * Генерация случайной версии теста
   */
  generateRandomTest(
    allQuestions: Question[],
    params: {
      title: string;
      description: string;
      questionCount?: number;
      category: string;
      tags?: string[];
      timeLimit?: number;
      randomizeQuestions?: boolean;
      randomizeOptions?: boolean;
    }
  ): Test {
    return TestGenerator.generateRandomTest(allQuestions, {
      title: params.title,
      description: params.description,
      questionCount: params.questionCount,
      timeLimit: params.timeLimit,
      randomizeQuestions: params.randomizeQuestions,
      randomizeOptions: params.randomizeOptions,
      category: params.category,
      tags: params.tags,
    });
  }

  /**
   * Генерация индивидуального теста для пользователя
   */
  generateIndividualTest(
    allQuestions: Question[],
    userId: string,
    userProfile: {
      currentLevel: string | number;
      skills: string[];
      weakAreas?: string[];
    },
    params: {
      title: string;
      description: string;
      questionCount?: number;
      timeLimit?: number;
      focusOnWeakAreas?: boolean;
    }
  ): Test {
    return TestGenerator.generateIndividualTest(
      allQuestions,
      userId,
      userProfile,
      params
    );
  }

  /**
   * Оценка ответов пользователя и формирование результата теста
   */
  gradeTest(test: Test, userId: string, userAnswers: Array<{ questionId: string; answer: string | string[] }>): TestResult {
    // Создание объектов UserAnswer из предоставленных ответов
    const answers = userAnswers.map((answer) => ({
      questionId: answer.questionId,
      answer: answer.answer,
      timeSpent: answer.timeSpent || 0,
      submittedAt: answer.submittedAt || new Date(),
    }));

    // Оценка каждого ответа
    const detailedResults = test.questions.map((question) => {
      const userAnswer = answers.find((a) => a.questionId === question.id);

      if (userAnswer) {
        return GradingSystem.gradeAnswer(question, userAnswer);
      } else {
        // Если на вопрос не был дан ответ
        return {
          questionId: question.id,
          questionTitle: question.title,
          questionFormat: question.format,
          earnedPoints: 0,
          maxPoints: question.points,
          isCorrect: false,
          feedback: "Вопрос не отвечен",
          timeSpent: 0,
        };
      }
    });

    // Подсчет общего результата
    const totalEarnedPoints = detailedResults.reduce(
      (sum, result) => sum + result.earnedPoints,
      0
    );
    const totalMaxPoints = detailedResults.reduce(
      (sum, result) => sum + result.maxPoints,
      0
    );
    const percentage =
      totalMaxPoints > 0 ? (totalEarnedPoints / totalMaxPoints) * 100 : 0;

    // Подсчет общего времени выполнения
    const totalTimeSpent = detailedResults.reduce(
      (sum, result) => sum + result.timeSpent,
      0
    );

    // Определение пробелов в знаниях
    const knowledgeGaps = detailedResults
      .filter((result) => !result.isCorrect)
      .map((result) => result.questionTitle);

    // Генерация рекомендаций
    const recommendations = this.generateRecommendations(detailedResults);

    const result: TestResult = {
      id: `result_${Date.now()}`,
      userId,
      testId: test.id,
      testName: test.title,
      answers,
      score: totalEarnedPoints,
      maxScore: totalMaxPoints,
      percentage,
      timeSpent: totalTimeSpent,
      completedAt: new Date(),
      detailedResults,
      knowledgeGaps,
      recommendations,
    };

    return result;
  }

  /**
   * Обновление профиля пользователя на основе результата теста
   */
  updateProfileWithTestResult(
    userProfile: UserProfile,
    testResult: TestResult
  ): UserProfile {
    return AdaptiveEngine.updateProfileWithTestResult(userProfile, testResult);
  }

  /**
   * Генерация аналитического отчета по результатам теста
   */
  generateTestReport(testResult: TestResult): Record<string, unknown> {
    return AnalyticsService.generateTestReport(testResult);
  }

  /**
   * Генерация отчета о прогрессе пользователя
   */
  generateProgressReport(
    userTests: TestResult[],
    startDate?: Date,
    endDate?: Date
  ): Record<string, unknown> {
    return AnalyticsService.generateProgressReport(
      userTests,
      startDate,
      endDate
    );
  }

  /**
   * Генерация персонализированных рекомендаций
   */
  generateRecommendations(detailedResults: Array<{ isCorrect: boolean; questionTitle: string }>): string[] {
    // Определение пробелов в знаниях
    const knowledgeGaps = detailedResults
      .filter((result) => !result.isCorrect)
      .map((result) => result.questionTitle);

    const recommendations: string[] = [];

    if (knowledgeGaps.length > 0) {
      recommendations.push(
        `Рекомендуется уделить внимание следующим темам: ${knowledgeGaps
          .slice(0, 3)
          .join(", ")}.`
      );
    }

    // Определение форматов, в которых пользователь показал слабые результаты
    const formatMap = new Map<string, { correct: number; total: number }>();

    for (const result of detailedResults) {
      const format = result.questionFormat;
      if (!formatMap.has(format)) {
        formatMap.set(format, { correct: 0, total: 0 });
      }

      const formatData = formatMap.get(format)!;
      formatData.total++;
      if (result.isCorrect) {
        formatData.correct++;
      }
    }

    for (const [format, data] of formatMap.entries()) {
      const accuracy = data.correct / data.total;
      if (accuracy < 0.6) {
        recommendations.push(
          `Потренируйтесь в формате "${format}" - ваша точность составляет ${(
            accuracy * 100
          ).toFixed(1)}%.`
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push("Отличная работа! Продолжайте в том же духе.");
    }

    return recommendations;
  }

  /**
   * Отправка результата теста в LMS
   */
  async sendResultToLMS(testResult: TestResult): Promise<boolean> {
    if (!this.lmsIntegration) {
      console.warn("LMS интеграция не настроена");
      return false;
    }

    return await this.lmsIntegration.sendTestResultToLMS(testResult);
  }

  /**
   * Получение тестов из LMS
   */
  async getTestsFromLMS(userId: string): Promise<Test[]> {
    if (!this.lmsIntegration) {
      console.warn("LMS интеграция не настроена");
      return [];
    }

    return await this.lmsIntegration.getTestsFromLMS(userId);
  }

  /**
   * Синхронизация профиля пользователя с LMS
   */
  async syncUserProfile(userProfile: UserProfile): Promise<UserProfile> {
    if (!this.lmsIntegration) {
      console.warn("LMS интеграция не настроена");
      return userProfile;
    }

    return await this.lmsIntegration.syncUserProfile(userProfile);
  }

  /**
   * Оценка общей сложности теста на основе сложности вопросов
   */
  private estimateTestDifficulty(questions: Question[]): { level: string; score: number } {
    if (questions.length === 0) {
      return "beginner";
    }

    // Подсчет количества вопросов каждого уровня сложности
    const difficultyCounts: { [key: string]: number } = {};

    for (const question of questions) {
      const difficulty = question.difficulty;
      difficultyCounts[difficulty] = (difficultyCounts[difficulty] || 0) + 1;
    }

    // Находим уровень с наибольшим количеством вопросов
    let maxCount = 0;
    let overallDifficulty = "beginner";

    for (const [level, count] of Object.entries(difficultyCounts)) {
      if (count > maxCount) {
        maxCount = count;
        overallDifficulty = level;
      }
    }

    return overallDifficulty;
  }

  /**
   * Генерация нескольких версий одного и того же теста
   */
  generateMultipleTestVersions(
    allQuestions: Question[],
    baseParams: {
      title: string;
      description: string;
      questionCount?: number;
      category: string;
      tags?: string[];
      timeLimit?: number;
      randomizeQuestions?: boolean;
      randomizeOptions?: boolean;
    },
    numberOfVersions: number
  ): Test[] {
    return TestGenerator.generateMultipleTestVersions(
      allQuestions,
      {
        title: baseParams.title,
        description: baseParams.description,
        questionCount: baseParams.questionCount,
        timeLimit: baseParams.timeLimit,
        randomizeQuestions: baseParams.randomizeQuestions,
        randomizeOptions: baseParams.randomizeOptions,
        category: baseParams.category,
        tags: baseParams.tags,
      },
      numberOfVersions
    );
  }
}
