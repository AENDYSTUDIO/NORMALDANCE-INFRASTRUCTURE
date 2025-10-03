import {
  DetailedQuestionResult,
  DifficultyLevel,
  TestResult,
} from "@/types/test-system";

/**
 * Сервис аналитики и отслеживания прогресса
 */
export class AnalyticsService {
  /**
   * Генерирует подробный отчет о результатах теста
   */
  static generateTestReport(testResult: TestResult): TestReport {
    const {
      score,
      maxScore,
      percentage,
      detailedResults,
      knowledgeGaps,
      recommendations,
    } = testResult;

    // Агрегированные данные по форматам вопросов
    const formatBreakdown = this.analyzeByFormat(detailedResults);

    // Агрегированные данные по уровням сложности
    const difficultyBreakdown = this.analyzeByDifficulty(detailedResults);

    // Временные характеристики
    const timeAnalysis = this.analyzeTimeSpent(
      detailedResults,
      testResult.timeSpent
    );

    return {
      testId: testResult.testId,
      testName: testResult.testName,
      userId: testResult.userId,
      score,
      maxScore,
      percentage,
      knowledgeGaps,
      recommendations,
      formatBreakdown,
      difficultyBreakdown,
      timeAnalysis,
      strengths: this.identifyStrengths(detailedResults),
      improvementAreas: this.identifyImprovementAreas(detailedResults),
      completionDate: testResult.completedAt,
    };
  }

  /**
   * Генерирует отчет по прогрессу пользователя за определенный период
   */
  static generateProgressReport(
    userTests: TestResult[],
    startDate?: Date,
    endDate?: Date
  ): ProgressReport {
    // Фильтрация тестов по дате, если указаны
    const filteredTests =
      startDate && endDate
        ? userTests.filter(
            (test) =>
              test.completedAt >= startDate && test.completedAt <= endDate
          )
        : userTests;

    if (filteredTests.length === 0) {
      return {
        userId: userTests.length > 0 ? userTests[0].userId : "",
        periodStart: startDate || new Date(0),
        periodEnd: endDate || new Date(),
        testsTaken: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        totalScore: 0,
        completedTests: 0,
        improvementTrend: 0,
        skillDevelopment: {},
        knowledgeGapTrends: [],
      };
    }

    // Подсчет основных метрик
    const scores = filteredTests.map((test) => test.percentage);
    const averageScore =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);
    const totalScore = scores.reduce((sum, score) => sum + score, 0);

    // Определение тренда улучшения
    let improvementTrend = 0;
    if (filteredTests.length >= 2) {
      const firstScore = filteredTests[0].percentage;
      const lastScore = filteredTests[filteredTests.length - 1].percentage;
      improvementTrend = lastScore - firstScore;
    }

    // Анализ развития навыков
    const skillDevelopment = this.analyzeSkillDevelopment(filteredTests);

    // Анализ тенденций в пробелах знаний
    const knowledgeGapTrends = this.analyzeKnowledgeGapTrends(filteredTests);

    return {
      userId: filteredTests[0].userId,
      periodStart:
        startDate ||
        new Date(
          Math.min(...filteredTests.map((t) => t.completedAt.getTime()))
        ),
      periodEnd:
        endDate ||
        new Date(
          Math.max(...filteredTests.map((t) => t.completedAt.getTime()))
        ),
      testsTaken: filteredTests.length,
      averageScore,
      bestScore,
      worstScore,
      totalScore,
      completedTests: filteredTests.length,
      improvementTrend,
      skillDevelopment,
      knowledgeGapTrends,
    };
  }

  /**
   * Анализ результатов по форматам вопросов
   */
  private static analyzeByFormat(
    results: DetailedQuestionResult[]
  ): FormatBreakdown[] {
    const formatMap = new Map<
      string,
      {
        count: number;
        correct: number;
        pointsEarned: number;
        maxPoints: number;
      }
    >();

    for (const result of results) {
      const format = result.questionFormat;
      const key = format;

      if (!formatMap.has(key)) {
        formatMap.set(key, {
          count: 0,
          correct: 0,
          pointsEarned: 0,
          maxPoints: 0,
        });
      }

      const formatData = formatMap.get(key)!;
      formatData.count++;
      formatData.pointsEarned += result.earnedPoints;
      formatData.maxPoints += result.maxPoints;

      if (result.isCorrect) {
        formatData.correct++;
      }
    }

    const breakdown: FormatBreakdown[] = [];
    for (const [format, data] of formatMap.entries()) {
      breakdown.push({
        format: format as any,
        count: data.count,
        correct: data.correct,
        percentage: data.count > 0 ? (data.correct / data.count) * 100 : 0,
        pointsEarned: data.pointsEarned,
        maxPoints: data.maxPoints,
        efficiency:
          data.maxPoints > 0 ? (data.pointsEarned / data.maxPoints) * 100 : 0,
      });
    }

    return breakdown;
  }

  /**
   * Анализ результатов по уровням сложности
   */
  private static analyzeByDifficulty(
    results: DetailedQuestionResult[]
  ): DifficultyBreakdown[] {
    const difficultyMap = new Map<
      string,
      {
        count: number;
        correct: number;
        pointsEarned: number;
        maxPoints: number;
      }
    >();

    for (const result of results) {
      const difficulty = result.questionFormat; // Временное решение, в реальности нужно брать из вопроса
      // Получаем уровень сложности из исходного вопроса, но у нас только результат
      // В реальной системе это будет получено из оригинального вопроса

      // Для примера, мы создадим карту с агрегированными данными
      // В реальной системе нужно будет иметь доступ к оригинальным вопросам
      const questionDifficulty = this.estimateDifficultyFromResult(result);
      const key = questionDifficulty;

      if (!difficultyMap.has(key)) {
        difficultyMap.set(key, {
          count: 0,
          correct: 0,
          pointsEarned: 0,
          maxPoints: 0,
        });
      }

      const difficultyData = difficultyMap.get(key)!;
      difficultyData.count++;
      difficultyData.pointsEarned += result.earnedPoints;
      difficultyData.maxPoints += result.maxPoints;

      if (result.isCorrect) {
        difficultyData.correct++;
      }
    }

    const breakdown: DifficultyBreakdown[] = [];
    for (const [difficulty, data] of difficultyMap.entries()) {
      breakdown.push({
        difficulty: difficulty as DifficultyLevel,
        count: data.count,
        correct: data.correct,
        percentage: data.count > 0 ? (data.correct / data.count) * 100 : 0,
        pointsEarned: data.pointsEarned,
        maxPoints: data.maxPoints,
        efficiency:
          data.maxPoints > 0 ? (data.pointsEarned / data.maxPoints) * 100 : 0,
      });
    }

    return breakdown;
  }

  /**
   * Оценка сложности на основе результата
   * (вспомогательный метод, в реальной системе уровень сложности будет из оригинального вопроса)
   */
  private static estimateDifficultyFromResult(
    result: DetailedQuestionResult
  ): string {
    // Простая эвристика: если результат близок к максимальному, вопрос был легким для пользователя
    if (result.earnedPoints / result.maxPoints >= 0.9)
      return DifficultyLevel.BEGINNER;
    if (result.earnedPoints / result.maxPoints >= 0.7)
      return DifficultyLevel.INTERMEDIATE;
    if (result.earnedPoints / result.maxPoints >= 0.5)
      return DifficultyLevel.ADVANCED;
    return DifficultyLevel.EXPERT;
  }

  /**
   * Анализ временных затрат
   */
  private static analyzeTimeSpent(
    results: DetailedQuestionResult[],
    totalTime: number
  ): TimeAnalysis {
    const timePerQuestion = results.map((r) => r.timeSpent);
    const totalTimeSpent = timePerQuestion.reduce((sum, time) => sum + time, 0);
    const avgTimePerQuestion =
      timePerQuestion.length > 0 ? totalTimeSpent / timePerQuestion.length : 0;

    // Находим вопросы, на которые потрачено аномально много времени
    const outliers = this.findTimeOutliers(timePerQuestion);

    return {
      totalTimeSpent,
      avgTimePerQuestion,
      timePerQuestion,
      outliers,
      timeEfficiency: totalTime > 0 ? (totalTimeSpent / totalTime) * 100 : 0,
    };
  }

  /**
   * Поиск аномалий во временных затратах
   */
  private static findTimeOutliers(timeArray: number[]): number[] {
    if (timeArray.length < 2) return [];

    // Вычисляем квартили
    const sorted = [...timeArray].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return sorted.filter((time) => time < lowerBound || time > upperBound);
  }

  /**
   * Определение сильных сторон
   */
  private static identifyStrengths(
    results: DetailedQuestionResult[]
  ): string[] {
    // Группируем результаты по формату вопросов
    const formatGroups = new Map<string, DetailedQuestionResult[]>();
    for (const result of results) {
      const format = result.questionFormat;
      if (!formatGroups.has(format)) {
        formatGroups.set(format, []);
      }
      formatGroups.get(format)!.push(result);
    }

    const strengths: string[] = [];
    for (const [format, formatResults] of formatGroups.entries()) {
      const accuracy =
        formatResults.filter((r) => r.isCorrect).length / formatResults.length;

      // Если точность по формату > 80%, считаем это сильной стороной
      if (accuracy > 0.8) {
        strengths.push(
          `Высокая точность в вопросах формата "${format}" (${(
            accuracy * 100
          ).toFixed(1)}%)`
        );
      }
    }

    return strengths;
  }

  /**
   * Определение областей для улучшения
   */
  private static identifyImprovementAreas(
    results: DetailedQuestionResult[]
  ): string[] {
    // Группируем результаты по формату вопросов
    const formatGroups = new Map<string, DetailedQuestionResult[]>();
    for (const result of results) {
      const format = result.questionFormat;
      if (!formatGroups.has(format)) {
        formatGroups.set(format, []);
      }
      formatGroups.get(format)!.push(result);
    }

    const improvementAreas: string[] = [];
    for (const [format, formatResults] of formatGroups.entries()) {
      const accuracy =
        formatResults.filter((r) => r.isCorrect).length / formatResults.length;

      // Если точность по формату < 60%, считаем это областью для улучшения
      if (accuracy < 0.6) {
        improvementAreas.push(
          `Низкая точность вопросах формата "${format}" (${(
            accuracy * 100
          ).toFixed(1)}%)`
        );
      }
    }

    return improvementAreas;
  }

  /**
   * Анализ развития навыков
   */
  private static analyzeSkillDevelopment(
    testResults: TestResult[]
  ): SkillDevelopment {
    // В реальной системе здесь будет анализ развития навыков по результатам нескольких тестов
    // Для упрощения возвращаем пустой объект, но в реальности тут будет сложная логика

    // Агрегируем все результаты из всех тестов
    const allResults = testResults.flatMap((test) => test.detailedResults);

    // Группируем по тегам/навыкам
    const skillMap = new Map<
      string,
      {
        tests: number;
        totalCorrect: number;
        totalQuestions: number;
        scores: number[];
      }
    >();

    // В реальной системе навыки были бы связаны с вопросами через теги
    // Пока возвращаем заглушку

    return {};
  }

  /**
   * Анализ тенденций в пробелах знаний
   */
  private static analyzeKnowledgeGapTrends(
    testResults: TestResult[]
  ): KnowledgeGapTrend[] {
    // Подсчитываем, какие пробелы в знаниях встречаются чаще всего
    const gapFrequency = new Map<string, number>();

    for (const test of testResults) {
      for (const gap of test.knowledgeGaps) {
        gapFrequency.set(gap, (gapFrequency.get(gap) || 0) + 1);
      }
    }

    // Сортируем по частоте
    const sortedGaps = Array.from(gapFrequency.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    return sortedGaps.map(([gap, frequency]) => ({
      knowledgeArea: gap,
      frequency,
      trend: "persistent", // В реальной системе тут будет анализ тренда
    }));
  }

  /**
   * Генерирует рекомендации на основе анализа
   */
  static generateRecommendations(report: TestReport): string[] {
    const recommendations: string[] = [];

    // Рекомендации на основе пробелов в знаниях
    if (report.knowledgeGaps.length > 0) {
      recommendations.push(
        `Рекомендуется уделить особое внимание следующим темам: ${report.knowledgeGaps
          .slice(0, 3)
          .join(", ")}.`
      );
    }

    // Рекомендации на основе областей для улучшения
    if (report.improvementAreas.length > 0) {
      recommendations.push(
        `Стоит поработать над следующими аспектами: ${report.improvementAreas
          .slice(0, 2)
          .join(", ")}.`
      );
    }

    // Рекомендации на основе временного анализа
    if (report.timeAnalysis.outliers.length > 0) {
      recommendations.push(
        `Обратите внимание на вопросы, на которые вы тратите неоправданно много времени.`
      );
    }

    // Если результат высокий, добавляем поощрение и рекомендации для дальнейшего развития
    if (report.percentage >= 85) {
      recommendations.push(
        "Отличный результат! Рассмотрите возможность перехода к более сложным материалам."
      );
    } else if (report.percentage >= 70) {
      recommendations.push(
        "Хороший результат, но есть возможности для улучшения. Сфокусируйтесь на рекомендованных областях."
      );
    } else {
      recommendations.push(
        "Рекомендуется дополнительно изучить отмеченные области и повторить тест через некоторое время."
      );
    }

    return recommendations;
  }
}

// Типы для аналитики

export interface TestReport {
  testId: string;
  testName: string;
  userId: string;
  score: number;
  maxScore: number;
  percentage: number;
  knowledgeGaps: string[];
  recommendations: string[];
  formatBreakdown: FormatBreakdown[];
  difficultyBreakdown: DifficultyBreakdown[];
  timeAnalysis: TimeAnalysis;
  strengths: string[];
  improvementAreas: string[];
  completionDate: Date;
}

export interface FormatBreakdown {
  format: string;
  count: number;
  correct: number;
  percentage: number;
  pointsEarned: number;
  maxPoints: number;
  efficiency: number;
}

export interface DifficultyBreakdown {
  difficulty: DifficultyLevel;
  count: number;
  correct: number;
  percentage: number;
  pointsEarned: number;
  maxPoints: number;
  efficiency: number;
}

export interface TimeAnalysis {
  totalTimeSpent: number;
  avgTimePerQuestion: number;
  timePerQuestion: number[];
  outliers: number[];
  timeEfficiency: number;
}

export interface ProgressReport {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  testsTaken: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  totalScore: number;
  completedTests: number;
  improvementTrend: number;
  skillDevelopment: SkillDevelopment;
  knowledgeGapTrends: KnowledgeGapTrend[];
}

export interface SkillDevelopment {
  [skill: string]: {
    currentLevel: number;
    improvement: number;
    lastTested: Date;
  };
}

export interface KnowledgeGapTrend {
  knowledgeArea: string;
  frequency: number;
  trend: "improving" | "deteriorating" | "persistent";
}
