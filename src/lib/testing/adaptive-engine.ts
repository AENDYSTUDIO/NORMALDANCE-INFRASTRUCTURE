import {
  AdaptiveSettings,
  DifficultyLevel,
  Question,
  TestResult,
  UserProfile,
} from "@/types/test-system";

/**
 * Движок адаптивного тестирования
 * Реализует алгоритм подбора вопросов на основе текущего уровня подготовки пользователя
 */
export class AdaptiveEngine {
  /**
   * Выбор следующего вопроса на основе профиля пользователя и настроек адаптации
   */
  static selectNextQuestion(
    availableQuestions: Question[],
    userProfile: UserProfile,
    testResults: TestResult[],
    adaptiveSettings: AdaptiveSettings
  ): Question | null {
    // Если это первый вопрос, выбираем на основе начального уровня сложности
    if (testResults.length === 0) {
      const initialQuestions = availableQuestions.filter(
        (q) => q.difficulty === adaptiveSettings.initialDifficulty
      );

      return initialQuestions.length > 0
        ? this.getRandomQuestion(initialQuestions)
        : this.getRandomQuestion(availableQuestions);
    }

    // Рассчитываем текущий уровень пользователя на основе последних результатов
    const currentLevel = this.calculateCurrentLevel(
      userProfile,
      testResults,
      adaptiveSettings
    );

    // Фильтруем вопросы по уровню сложности
    const filteredQuestions = availableQuestions.filter((q) =>
      this.isLevelAppropriate(q.difficulty, currentLevel)
    );

    // Исключаем уже заданные вопросы
    const remainingQuestions = filteredQuestions.filter(
      (q) =>
        !testResults.some((result) =>
          result.answers.some((answer) => answer.questionId === q.id)
        )
    );

    // Если подходящих вопросов нет, расширяем диапазон сложности
    if (remainingQuestions.length === 0) {
      const expandedQuestions = availableQuestions.filter(
        (q) =>
          !testResults.some((result) =>
            result.answers.some((answer) => answer.questionId === q.id)
          )
      );

      return expandedQuestions.length > 0
        ? this.getRandomQuestion(expandedQuestions)
        : null;
    }

    return this.getRandomQuestion(remainingQuestions);
  }

  /**
   * Рассчитывает текущий уровень сложности для пользователя
   */
  private static calculateCurrentLevel(
    userProfile: UserProfile,
    testResults: TestResult[],
    adaptiveSettings: AdaptiveSettings
  ): DifficultyLevel {
    // Базовый уровень из профиля пользователя
    const baseLevel = userProfile.currentLevel;

    // Если нет результатов тестов, возвращаем базовый уровень
    if (testResults.length === 0) {
      return baseLevel;
    }

    // Рассчитываем среднюю точность по последним тестам
    const recentResults = testResults.slice(-3); // Берем последние 3 теста
    const totalScore = recentResults.reduce(
      (sum, result) => sum + result.percentage,
      0
    );
    const averageScore = totalScore / recentResults.length;

    // Определяем корректировку уровня сложности
    let levelAdjustment = 0;

    // В зависимости от настроек адаптации, определяем, как изменить уровень
    if (adaptiveSettings.difficultyAdjustment === "linear") {
      levelAdjustment = this.calculateLinearAdjustment(
        averageScore,
        adaptiveSettings
      );
    } else if (adaptiveSettings.difficultyAdjustment === "exponential") {
      levelAdjustment = this.calculateExponentialAdjustment(
        averageScore,
        adaptiveSettings
      );
    }

    // Применяем корректировку к базовому уровню
    return this.adjustDifficultyLevel(baseLevel, levelAdjustment);
  }

  /**
   * Линейная корректировка уровня сложности
   */
  private static calculateLinearAdjustment(
    averageScore: number,
    adaptiveSettings: AdaptiveSettings
  ): number {
    const threshold = adaptiveSettings.accuracyThreshold;
    const factor = adaptiveSettings.adjustmentFactor;

    if (averageScore >= threshold) {
      // Уровень повышается
      return factor;
    } else if (averageScore < threshold * 0.7) {
      // Уровень понижается при низкой точности
      return -factor;
    } else {
      // Небольшая корректировка при средней точности
      return 0;
    }
  }

  /**
   * Экспоненциальная корректировка уровня сложности
   */
  private static calculateExponentialAdjustment(
    averageScore: number,
    adaptiveSettings: AdaptiveSettings
  ): number {
    const threshold = adaptiveSettings.accuracyThreshold;
    const factor = adaptiveSettings.adjustmentFactor;

    if (averageScore >= threshold) {
      // Более агрессивное повышение при высокой точности
      const excess = (averageScore - threshold) / (100 - threshold);
      return Math.min(factor * excess * excess * 2, factor);
    } else {
      // Более агрессивное понижение при низкой точности
      const deficit = (threshold - averageScore) / threshold;
      return Math.max(-factor * deficit * deficit * 2, -factor);
    }
  }

  /**
   * Корректировка уровня сложности
   */
  private static adjustDifficultyLevel(
    currentLevel: DifficultyLevel,
    adjustment: number
  ): DifficultyLevel {
    // Преобразуем уровень сложности в числовое значение
    const levelValues: { [key in DifficultyLevel]: number } = {
      [DifficultyLevel.BEGINNER]: 1,
      [DifficultyLevel.INTERMEDIATE]: 2,
      [DifficultyLevel.ADVANCED]: 3,
      [DifficultyLevel.EXPERT]: 4,
    };

    const levelKeys: { [key: number]: DifficultyLevel } = {
      1: DifficultyLevel.BEGINNER,
      2: DifficultyLevel.INTERMEDIATE,
      3: DifficultyLevel.ADVANCED,
      4: DifficultyLevel.EXPERT,
    };

    // Получаем текущее числовое значение уровня
    let currentLevelValue = levelValues[currentLevel];

    // Применяем корректировку
    currentLevelValue += adjustment;

    // Ограничиваем значение в пределах допустимого диапазона
    currentLevelValue = Math.max(1, Math.min(4, currentLevelValue));

    // Возвращаем соответствующий уровень сложности
    return levelKeys[Math.round(currentLevelValue)];
  }

  /**
   * Проверяет, соответствует ли уровень сложности вопроса текущему уровню пользователя
   */
  private static isLevelAppropriate(
    questionLevel: DifficultyLevel,
    currentLevel: DifficultyLevel
  ): boolean {
    // Возвращаем true, если уровень вопроса соответствует или немного отличается от текущего уровня
    const levelValues: { [key in DifficultyLevel]: number } = {
      [DifficultyLevel.BEGINNER]: 1,
      [DifficultyLevel.INTERMEDIATE]: 2,
      [DifficultyLevel.ADVANCED]: 3,
      [DifficultyLevel.EXPERT]: 4,
    };

    const questionValue = levelValues[questionLevel];
    const currentValue = levelValues[currentLevel];

    // Вопрос подходит, если его сложность не отличается более чем на 1 уровень от текущего
    return Math.abs(questionValue - currentValue) <= 1;
  }

  /**
   * Возвращает случайный вопрос из массива
   */
  private static getRandomQuestion(questions: Question[]): Question {
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }

  /**
   * Генерирует адаптивный тест на основе профиля пользователя
   */
  static generateAdaptiveTest(
    allQuestions: Question[],
    userProfile: UserProfile,
    adaptiveSettings: AdaptiveSettings
  ): Question[] {
    const selectedQuestions: Question[] = [];
    let availableQuestions = [...allQuestions];

    // Определяем количество вопросов в тесте
    const questionCount = Math.min(
      adaptiveSettings.maxQuestions,
      Math.max(adaptiveSettings.minQuestions, allQuestions.length)
    );

    // Выбираем первый вопрос
    const firstQuestion = this.selectNextQuestion(
      availableQuestions,
      userProfile,
      [],
      adaptiveSettings
    );

    if (firstQuestion) {
      selectedQuestions.push(firstQuestion);
      availableQuestions = availableQuestions.filter(
        (q) => q.id !== firstQuestion.id
      );
    }

    // Для каждого последующего вопроса используем предыдущие результаты
    for (let i = 1; i < questionCount; i++) {
      // Создаем фиктивный результат для предыдущего вопроса
      const mockResults = this.createMockResults(
        selectedQuestions,
        userProfile
      );

      const nextQuestion = this.selectNextQuestion(
        availableQuestions,
        userProfile,
        mockResults,
        adaptiveSettings
      );

      if (nextQuestion) {
        selectedQuestions.push(nextQuestion);
        availableQuestions = availableQuestions.filter(
          (q) => q.id !== nextQuestion.id
        );
      } else {
        // Если не удалось найти подходящий вопрос, выходим из цикла
        break;
      }
    }

    return selectedQuestions;
  }

  /**
   * Создает фиктивные результаты теста для симуляции адаптивного подбора
   */
  private static createMockResults(
    selectedQuestions: Question[],
    userProfile: UserProfile
  ): TestResult[] {
    // В реальной системе здесь использовались бы реальные результаты
    // В упрощенной версии возвращаем пустой массив или результаты на основе профиля
    return [];
  }

  /**
   * Обновляет профиль пользователя на основе результатов теста
   */
  static updateProfileWithTestResult(
    userProfile: UserProfile,
    testResult: TestResult
  ): UserProfile {
    const updatedProfile = { ...userProfile };

    // Обновляем историю тестов
    updatedProfile.testHistory = [...userProfile.testHistory, testResult];

    // Обновляем дату последнего теста
    updatedProfile.lastTestDate = new Date();

    // Обновляем количество пройденных тестов
    updatedProfile.completedTests = userProfile.completedTests + 1;

    // Пересчитываем средний балл
    const totalScore = userProfile.testHistory.reduce(
      (sum, result) => sum + result.percentage,
      testResult.percentage
    );
    updatedProfile.overallScore =
      totalScore / updatedProfile.testHistory.length;

    // Обновляем текущий уровень сложности на основе результата
    updatedProfile.currentLevel = this.determineLevelFromPerformance(
      testResult.percentage,
      userProfile.currentLevel
    );

    return updatedProfile;
  }

  /**
   * Определяет уровень сложности на основе результата теста
   */
  private static determineLevelFromPerformance(
    percentage: number,
    currentLevel: DifficultyLevel
  ): DifficultyLevel {
    // Если пользователь получил высокий балл, возможно повышение уровня
    if (percentage >= 90) {
      switch (currentLevel) {
        case DifficultyLevel.BEGINNER:
          return Math.random() > 0.5
            ? DifficultyLevel.INTERMEDIATE
            : DifficultyLevel.BEGINNER;
        case DifficultyLevel.INTERMEDIATE:
          return Math.random() > 0.7
            ? DifficultyLevel.ADVANCED
            : DifficultyLevel.INTERMEDIATE;
        case DifficultyLevel.ADVANCED:
          return Math.random() > 0.8
            ? DifficultyLevel.EXPERT
            : DifficultyLevel.ADVANCED;
        default:
          return currentLevel;
      }
    }
    // Если пользователь получил низкий балл, возможно понижение уровня
    else if (percentage < 50) {
      switch (currentLevel) {
        case DifficultyLevel.EXPERT:
          return Math.random() > 0.5
            ? DifficultyLevel.ADVANCED
            : DifficultyLevel.EXPERT;
        case DifficultyLevel.ADVANCED:
          return Math.random() > 0.7
            ? DifficultyLevel.INTERMEDIATE
            : DifficultyLevel.ADVANCED;
        case DifficultyLevel.INTERMEDIATE:
          return Math.random() > 0.8
            ? DifficultyLevel.BEGINNER
            : DifficultyLevel.INTERMEDIATE;
        default:
          return currentLevel;
      }
    }

    // В остальных случаях оставляем уровень без изменений
    return currentLevel;
  }
}
