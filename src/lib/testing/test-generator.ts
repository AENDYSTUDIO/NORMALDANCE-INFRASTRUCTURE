import {
  DifficultyLevel,
  Question,
  Test,
  TestFormat,
} from "@/types/test-system";

/**
 * Система генерации случайных версий тестов
 */
export class TestGenerator {
  /**
   * Генерирует случайную версию теста на основе заданных параметров
   */
  static generateRandomTest(
    allQuestions: Question[],
    params: {
      title: string;
      description: string;
      questionCount?: number;
      difficultyDistribution?: { [level in DifficultyLevel]?: number };
      formatDistribution?: { [format in TestFormat]?: number };
      timeLimit?: number;
      randomizeQuestions?: boolean;
      randomizeOptions?: boolean;
      category?: string;
      tags?: string[];
    }
  ): Test {
    // Фильтрация вопросов по критериям
    let filteredQuestions = [...allQuestions];

    // Применение распределения по сложности, если указано
    if (params.difficultyDistribution) {
      filteredQuestions = this.filterByDifficultyDistribution(
        filteredQuestions,
        params.difficultyDistribution
      );
    }

    // Применение распределения по формату, если указано
    if (params.formatDistribution) {
      filteredQuestions = this.filterByFormatDistribution(
        filteredQuestions,
        params.formatDistribution
      );
    }

    // Определение количества вопросов
    const questionCount =
      params.questionCount || Math.min(20, filteredQuestions.length); // по умолчанию 20 или все доступные

    // Выбор случайных вопросов
    const selectedQuestions = this.selectRandomQuestions(
      filteredQuestions,
      questionCount
    );

    // Рандомизация порядка вопросов, если нужно
    let finalQuestions = selectedQuestions;
    if (params.randomizeQuestions !== false) {
      // по умолчанию true
      finalQuestions = this.shuffleArray([...selectedQuestions]);
    }

    // Создание теста
    const totalPoints = finalQuestions.reduce((sum, q) => sum + q.points, 0);

    const test: Test = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: params.title,
      description: params.description,
      questions: finalQuestions,
      totalPoints,
      timeLimit: params.timeLimit,
      difficulty: this.calculateOverallDifficulty(finalQuestions),
      category: params.category || "General",
      tags: params.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      author: "system",
      isActive: true,
      isAdaptive: false, // по умолчанию не адаптивный
      randomizeQuestions: params.randomizeQuestions !== false,
      randomizeOptions: params.randomizeOptions === true,
    };

    return test;
  }

  /**
   * Генерирует несколько случайных версий одного и того же теста
   */
  static generateMultipleTestVersions(
    allQuestions: Question[],
    baseParams: {
      title: string;
      description: string;
      questionCount?: number;
      difficultyDistribution?: { [level in DifficultyLevel]?: number };
      formatDistribution?: { [format in TestFormat]?: number };
      timeLimit?: number;
      randomizeQuestions?: boolean;
      randomizeOptions?: boolean;
      category?: string;
      tags?: string[];
    },
    numberOfVersions: number
  ): Test[] {
    const versions: Test[] = [];

    for (let i = 0; i < numberOfVersions; i++) {
      const versionParams = {
        ...baseParams,
        title: `${baseParams.title} (Версия ${i + 1})`,
      };

      const test = this.generateRandomTest(allQuestions, versionParams);
      versions.push(test);
    }

    return versions;
  }

  /**
   * Фильтрация вопросов по распределению сложности
   */
  private static filterByDifficultyDistribution(
    questions: Question[],
    distribution: { [level in DifficultyLevel]?: number }
  ): Question[] {
    const result: Question[] = [];

    for (const [difficulty, count] of Object.entries(distribution) as [
      DifficultyLevel,
      number
    ][]) {
      const difficultyQuestions = questions.filter(
        (q) => q.difficulty === difficulty
      );
      const selected = this.selectRandomQuestions(difficultyQuestions, count);
      result.push(...selected);
    }

    return result;
  }

  /**
   * Фильтрация вопросов по распределению форматов
   */
  private static filterByFormatDistribution(
    questions: Question[],
    distribution: { [format in TestFormat]?: number }
  ): Question[] {
    const result: Question[] = [];

    for (const [format, count] of Object.entries(distribution) as [
      TestFormat,
      number
    ][]) {
      const formatQuestions = questions.filter((q) => q.format === format);
      const selected = this.selectRandomQuestions(formatQuestions, count);
      result.push(...selected);
    }

    return result;
  }

  /**
   * Выбор случайных вопросов из массива
   */
  private static selectRandomQuestions(
    questions: Question[],
    count: number
  ): Question[] {
    if (count >= questions.length) {
      return [...questions]; // Возвращаем все вопросы, если запрошено больше, чем есть
    }

    const shuffled = this.shuffleArray([...questions]);
    return shuffled.slice(0, count);
  }

  /**
   * Перемешивание массива (алгоритм Фишера-Йетса)
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  /**
   * Расчет общей сложности теста на основе сложности вопросов
   */
  private static calculateOverallDifficulty(
    questions: Question[]
  ): DifficultyLevel {
    if (questions.length === 0) {
      return DifficultyLevel.BEGINNER;
    }

    // Подсчет количества вопросов каждого уровня сложности
    const difficultyCounts: { [level in DifficultyLevel]: number } = {
      [DifficultyLevel.BEGINNER]: 0,
      [DifficultyLevel.INTERMEDIATE]: 0,
      [DifficultyLevel.ADVANCED]: 0,
      [DifficultyLevel.EXPERT]: 0,
    };

    for (const question of questions) {
      difficultyCounts[question.difficulty]++;
    }

    // Находим уровень с наибольшим количеством вопросов
    let maxCount = 0;
    let overallDifficulty: DifficultyLevel = DifficultyLevel.BEGINNER;

    for (const [level, count] of Object.entries(difficultyCounts) as [
      DifficultyLevel,
      number
    ][]) {
      if (count > maxCount) {
        maxCount = count;
        overallDifficulty = level;
      }
    }

    return overallDifficulty;
  }

  /**
   * Генерирует индивидуальную версию теста для конкретного пользователя
   */
  static generateIndividualTest(
    allQuestions: Question[],
    userId: string,
    userProfile: {
      currentLevel: DifficultyLevel;
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
    let filteredQuestions = [...allQuestions];

    // Если нужно, фокусируемся на слабых местах пользователя
    if (
      params.focusOnWeakAreas &&
      userProfile.weakAreas &&
      userProfile.weakAreas.length > 0
    ) {
      // Повышаем вероятность выбора вопросов по слабым темам
      const weakAreaQuestions = filteredQuestions.filter((q) =>
        q.tags.some((tag) => userProfile.weakAreas?.includes(tag))
      );

      // Добавляем больше вопросов по слабым темам
      const additionalQuestions = this.selectRandomQuestions(
        weakAreaQuestions,
        Math.ceil((params.questionCount || 20) * 0.4) // 40% вопросов по слабым темам
      );

      // Добавляем остальные вопросы
      const otherQuestions = filteredQuestions.filter(
        (q) => !additionalQuestions.includes(q)
      );

      const otherSelected = this.selectRandomQuestions(
        otherQuestions,
        (params.questionCount || 20) - additionalQuestions.length
      );

      filteredQuestions = [...additionalQuestions, ...otherSelected];
    } else {
      // Фильтрация по уровню сложности пользователя
      filteredQuestions = filteredQuestions.filter((q) =>
        this.isAppropriateDifficulty(q.difficulty, userProfile.currentLevel)
      );
    }

    // Определение количества вопросов
    const questionCount =
      params.questionCount || Math.min(20, filteredQuestions.length);

    // Выбор случайных вопросов
    const selectedQuestions = this.selectRandomQuestions(
      filteredQuestions,
      questionCount
    );

    // Создание теста
    const totalPoints = selectedQuestions.reduce((sum, q) => sum + q.points, 0);

    const test: Test = {
      id: `test_${userId}_${Date.now()}`,
      title: params.title,
      description: params.description,
      questions: selectedQuestions,
      totalPoints,
      timeLimit: params.timeLimit,
      difficulty: userProfile.currentLevel,
      category: "Individual",
      tags: userProfile.skills,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: userId,
      isActive: true,
      isAdaptive: false,
      randomizeQuestions: true,
      randomizeOptions: true,
    };

    return test;
  }

  /**
   * Проверяет, соответствует ли уровень сложности вопроса уровню пользователя
   */
  private static isAppropriateDifficulty(
    questionLevel: DifficultyLevel,
    userLevel: DifficultyLevel
  ): boolean {
    // Вопрос подходит, если его сложность не отличается более чем на один уровень от уровня пользователя
    const levelValues: { [key in DifficultyLevel]: number } = {
      [DifficultyLevel.BEGINNER]: 1,
      [DifficultyLevel.INTERMEDIATE]: 2,
      [DifficultyLevel.ADVANCED]: 3,
      [DifficultyLevel.EXPERT]: 4,
    };

    const questionValue = levelValues[questionLevel];
    const userValue = levelValues[userLevel];

    return Math.abs(questionValue - userValue) <= 1;
  }

  /**
   * Создает шаблон теста, который можно использовать для генерации случайных версий
   */
  static createTestTemplate(
    name: string,
    description: string,
    params: {
      questionCount: number;
      difficultyDistribution?: { [level in DifficultyLevel]?: number };
      formatDistribution?: { [format in TestFormat]?: number };
      timeLimit?: number;
      randomizeQuestions?: boolean;
      randomizeOptions?: boolean;
      category?: string;
      tags?: string[];
    }
  ): {
    id: string;
    name: string;
    description: string;
    params: typeof params;
    createdAt: Date;
  } {
    return {
      id: `template_${Date.now()}`,
      name,
      description,
      params,
      createdAt: new Date(),
    };
  }
}
