import {
  DetailedQuestionResult,
  Question,
  TestFormat,
  UserAnswer,
} from "@/types/test-system";

/**
 * Система оценки для различных форматов заданий
 */
export class GradingSystem {
  /**
   * Оценка ответа пользователя на основе вопроса и предоставленного ответа
   */
  static gradeAnswer(
    question: Question,
    userAnswer: UserAnswer
  ): DetailedQuestionResult {
    let earnedPoints = 0;
    let isCorrect = false;
    let feedback = "";

    switch (question.format) {
      case TestFormat.MULTIPLE_CHOICE_SINGLE:
        ({ earnedPoints, isCorrect, feedback } = this.gradeMultipleChoiceSingle(
          question as any,
          userAnswer
        ));
        break;

      case TestFormat.MULTIPLE_CHOICE_MULTIPLE:
        ({ earnedPoints, isCorrect, feedback } =
          this.gradeMultipleChoiceMultiple(question as any, userAnswer));
        break;

      case TestFormat.MATCHING:
        ({ earnedPoints, isCorrect, feedback } = this.gradeMatching(
          question as any,
          userAnswer
        ));
        break;

      case TestFormat.ORDERING:
        ({ earnedPoints, isCorrect, feedback } = this.gradeOrdering(
          question as Question & { format: TestFormat.ORDERING },
          userAnswer
        ));
        break;

      case TestFormat.SHORT_ANSWER:
        ({ earnedPoints, isCorrect, feedback } = this.gradeShortAnswer(
          question as Question & { format: TestFormat.SHORT_ANSWER },
          userAnswer
        ));
        break;

      case TestFormat.ESSAY:
        // Для эссе оценка производится вручную или с помощью сложных алгоритмов
        ({ earnedPoints, isCorrect, feedback } = this.gradeEssay(
          question as Question & { format: TestFormat.ESSAY },
          userAnswer
        ));
        break;

      case TestFormat.PRACTICAL_TASK:
        ({ earnedPoints, isCorrect, feedback } = this.gradePracticalTask(
          question as Question & { format: TestFormat.PRACTICAL_TASK },
          userAnswer
        ));
        break;

      case TestFormat.CASE_STUDY:
        ({ earnedPoints, isCorrect, feedback } = this.gradeCaseStudy(
          question as Question & { format: TestFormat.CASE_STUDY },
          userAnswer
        ));
        break;

      default:
        const _exhaustiveCheck: never = question;
        throw new Error(
          `Неизвестный формат вопроса: ${(question as any).format}`
        );
    }

    return {
      questionId: question.id,
      questionTitle: question.title,
      questionFormat: question.format,
      earnedPoints,
      maxPoints: question.points,
      isCorrect,
      feedback,
      timeSpent: userAnswer.timeSpent,
    };
  }

  /**
   * Оценка задания с одним правильным вариантом
   */
  private static gradeMultipleChoiceSingle(
    question: Question & { format: TestFormat.MULTIPLE_CHOICE_SINGLE },
    userAnswer: UserAnswer
  ): { earnedPoints: number; isCorrect: boolean; feedback: string } {
    const userSelectedId = userAnswer.answer as string;
    const correctOption = question.options.find((opt) => opt.isCorrect);

    if (!correctOption) {
      throw new Error(
        "Нет правильного варианта в вопросе с множественным выбором"
      );
    }

    const isCorrect = userSelectedId === correctOption.id;
    const earnedPoints = isCorrect ? question.points : 0;
    const feedback = isCorrect
      ? "Правильный ответ!"
      : `Неправильно. Правильный ответ: ${correctOption.text}`;

    return { earnedPoints, isCorrect, feedback };
  }

  /**
   * Оценка задания с несколькими правильными вариантами
   */
  private static gradeMultipleChoiceMultiple(
    question: Question & { format: TestFormat.MULTIPLE_CHOICE_MULTIPLE },
    userAnswer: UserAnswer
  ): { earnedPoints: number; isCorrect: boolean; feedback: string } {
    const userSelectedIds = userAnswer.answer as string[];
    const correctOptions = question.options.filter((opt) => opt.isCorrect);
    const userCorrectOptions = question.options.filter(
      (opt) => userSelectedIds.includes(opt.id) && opt.isCorrect
    );
    const userIncorrectOptions = question.options.filter(
      (opt) => userSelectedIds.includes(opt.id) && !opt.isCorrect
    );

    // Оценка может быть частичной - за каждый правильный выбор начисляются баллы,
    // но за неправильные - вычитаются
    const correctPoints =
      (userCorrectOptions.length / correctOptions.length) * question.points;
    const incorrectPenalty =
      (userIncorrectOptions.length / question.options.length) * question.points;
    let earnedPoints = Math.max(0, correctPoints - incorrectPenalty);

    // Округляем до 2 знаков после запятой
    earnedPoints = Math.round(earnedPoints * 100) / 100;

    const isCorrect =
      userCorrectOptions.length === correctOptions.length &&
      userIncorrectOptions.length === 0;

    const feedback = isCorrect
      ? "Все правильные варианты выбраны!"
      : `Выбрано правильно ${userCorrectOptions.length} из ${correctOptions.length} правильных вариантов`;

    return { earnedPoints, isCorrect, feedback };
  }

  /**
   * Оценка задания на сопоставление
   */
  private static gradeMatching(
    question: Question & { format: TestFormat.MATCHING },
    userAnswer: UserAnswer
  ): { earnedPoints: number; isCorrect: boolean; feedback: string } {
    const userMatches = userAnswer.answer as { [key: string]: string };
    let correctMatches = 0;
    const totalPairs = question.pairs.length;

    for (const pair of question.pairs) {
      if (userMatches[pair.left] === pair.right) {
        correctMatches++;
      }
    }

    const earnedPoints = (correctMatches / totalPairs) * question.points;
    const isCorrect = correctMatches === totalPairs;
    const feedback = `Правильно сопоставлено ${correctMatches} из ${totalPairs} пар`;

    return { earnedPoints, isCorrect, feedback };
  }

  /**
   * Оценка задания на упорядочивание
   */
  private static gradeOrdering(
    question: Question & { format: TestFormat.ORDERING },
    userAnswer: UserAnswer
  ): { earnedPoints: number; isCorrect: boolean; feedback: string } {
    const userOrder = userAnswer.answer as string[];
    const correctOrder = (question as any).correctOrder as string[];

    if (userOrder.length !== correctOrder.length) {
      return {
        earnedPoints: 0,
        isCorrect: false,
        feedback: "Количество элементов не совпадает с ожидаемым",
      };
    }

    // Подсчет правильных позиций
    let correctPositions = 0;
    for (let i = 0; i < correctOrder.length; i++) {
      if (userOrder[i] === correctOrder[i]) {
        correctPositions++;
      }
    }

    const earnedPoints =
      (correctPositions / correctOrder.length) * question.points;
    const isCorrect = correctPositions === correctOrder.length;
    const feedback = `Правильно упорядочено ${correctPositions} из ${correctOrder.length} элементов`;

    return { earnedPoints, isCorrect, feedback };
  }

  /**
   * Оценка задания с кратким ответом
   */
  private static gradeShortAnswer(
    question: Question & { format: TestFormat.SHORT_ANSWER },
    userAnswer: UserAnswer
  ): { earnedPoints: number; isCorrect: boolean; feedback: string } {
    const userText = userAnswer.answer as string;
    const correctAnswer = question.correctAnswer;

    // Проверка типа ответа
    if (question.answerType === "number") {
      const userNum = parseFloat(userText);
      const correctNum = parseFloat(correctAnswer as string);

      if (isNaN(userNum) || isNaN(correctNum)) {
        return {
          earnedPoints: 0,
          isCorrect: false,
          feedback: "Ответ должен быть числовым значением",
        };
      }

      let isCorrect = false;
      let earnedPoints = 0;
      let feedback = "";

      if (question.tolerance !== undefined) {
        isCorrect = Math.abs(userNum - correctNum) <= question.tolerance;
        earnedPoints = isCorrect ? question.points : 0;
        feedback = isCorrect
          ? "Правильный числовой ответ!"
          : `Неправильно. Правильный ответ: ${correctNum} (с допустимой погрешностью ±${question.tolerance})`;
      } else {
        isCorrect = userNum === correctNum;
        earnedPoints = isCorrect ? question.points : 0;
        feedback = isCorrect
          ? "Правильный числовой ответ!"
          : `Неправильно. Правильный ответ: ${correctNum}`;
      }

      return { earnedPoints, isCorrect, feedback };
    } else {
      // Текстовый ответ
      const userTextProcessed = question.caseSensitive
        ? userText
        : userText.toLowerCase();
      const correctTextProcessed = question.caseSensitive
        ? (correctAnswer as string)
        : (correctAnswer as string).toLowerCase();

      const isCorrect = userTextProcessed === correctTextProcessed;
      const earnedPoints = isCorrect ? question.points : 0;
      const feedback = isCorrect
        ? "Правильный ответ!"
        : `Неправильно. Правильный ответ: ${correctAnswer as string}`;

      return { earnedPoints, isCorrect, feedback };
    }
  }

  /**
   * Оценка эссе (пока базовая реализация, в реальности потребуется сложная логика)
   */
  private static gradeEssay(
    question: Question & { format: TestFormat.ESSAY },
    userAnswer: UserAnswer
  ): { earnedPoints: number; isCorrect: boolean; feedback: string } {
    const userText = userAnswer.answer as string;

    // Проверка минимальной длины
    if (question.minLength && userText.length < question.minLength) {
      return {
        earnedPoints: 0,
        isCorrect: false,
        feedback: `Ответ слишком короткий. Минимальная длина: ${question.minLength} символов.`,
      };
    }

    // Проверка максимальной длины
    if (question.maxLength && userText.length > question.maxLength) {
      return {
        earnedPoints: 0,
        isCorrect: false,
        feedback: `Ответ слишком длинный. Максимальная длина: ${question.maxLength} символов.`,
      };
    }

    // В реальной системе здесь будет сложная логика оценки эссе
    // включая анализ содержания, грамматики, структуры и т.д.
    // Пока возвращаем 0 баллов, так как эссе требует ручной проверки
    return {
      earnedPoints: 0,
      isCorrect: false,
      feedback: "Эссе требует ручной проверки преподавателем.",
    };
  }

  /**
   * Оценка практического задания
   */
  private static gradePracticalTask(
    question: Question & { format: TestFormat.PRACTICAL_TASK },
    userAnswer: UserAnswer
  ): { earnedPoints: number; isCorrect: boolean; feedback: string } {
    // Практические задания могут иметь автоматическую или ручную проверку
    if (question.evaluationMethod === "automated") {
      // В реальной системе здесь будет запуск автоматических тестов
      // Пока возвращаем 0 баллов
      return {
        earnedPoints: 0,
        isCorrect: false,
        feedback: "Практическое задание требует автоматической проверки.",
      };
    } else if (question.evaluationMethod === "manual") {
      return {
        earnedPoints: 0,
        isCorrect: false,
        feedback:
          "Практическое задание требует ручной проверки преподавателем.",
      };
    } else {
      // hybrid
      return {
        earnedPoints: 0,
        isCorrect: false,
        feedback: "Практическое задание требует комбинированной проверки.",
      };
    }
  }

  /**
   * Оценка ситуационного кейса
   */
  private static gradeCaseStudy(
    question: Question & { format: TestFormat.CASE_STUDY },
    userAnswer: UserAnswer
  ): { earnedPoints: number; isCorrect: boolean; feedback: string } {
    const userAnswers = userAnswer.answer as { [key: string]: string };
    let totalEarnedPoints = 0;
    let totalMaxPoints = 0;
    let allCorrect = true;
    const feedbackParts: string[] = [];

    for (const subQuestion of question.questions) {
      totalMaxPoints += subQuestion.points;

      if (!userAnswers[subQuestion.id]) {
        allCorrect = false;
        feedbackParts.push(`Подвопрос "${subQuestion.title}" не отвечен`);
        continue;
      }

      // Временный ответ для подвопроса
      const tempUserAnswer: UserAnswer = {
        questionId: subQuestion.id,
        answer: userAnswers[subQuestion.id],
        timeSpent: 0, // Время не учитывается для подвопросов
        submittedAt: new Date(),
      };

      // Рекурсивно оцениваем подвопрос
      const subResult = this.gradeAnswer(subQuestion, tempUserAnswer);
      totalEarnedPoints += subResult.earnedPoints;

      if (!subResult.isCorrect) {
        allCorrect = false;
      }

      feedbackParts.push(subResult.feedback || "");
    }

    const earnedPoints = totalEarnedPoints;
    const isCorrect = allCorrect && totalEarnedPoints === totalMaxPoints;
    const feedback = feedbackParts.join("; ");

    return { earnedPoints, isCorrect, feedback };
  }

  /**
   * Оценка эссе по критериям (для ручной проверки преподавателем)
   */
  static gradeEssayByCriteria(
    question: Question & { format: TestFormat.ESSAY },
    userAnswer: UserAnswer,
    criteriaScores: { [criteriaId: string]: number }
  ): DetailedQuestionResult {
    const userText = userAnswer.answer as string;

    // Проверка минимальной длины
    if (question.minLength && userText.length < question.minLength) {
      return {
        questionId: question.id,
        questionTitle: question.title,
        questionFormat: question.format,
        earnedPoints: 0,
        maxPoints: question.points,
        isCorrect: false,
        feedback: `Ответ слишком короткий. Минимальная длина: ${question.minLength} символов.`,
        timeSpent: userAnswer.timeSpent,
      };
    }

    // Проверка максимальной длины
    if (question.maxLength && userText.length > question.maxLength) {
      return {
        questionId: question.id,
        questionTitle: question.title,
        questionFormat: question.format,
        earnedPoints: 0,
        maxPoints: question.points,
        isCorrect: false,
        feedback: `Ответ слишком длинный. Максимальная длина: ${question.maxLength} символов.`,
        timeSpent: userAnswer.timeSpent,
      };
    }

    // Подсчет баллов по критериям
    let totalEarnedPoints = 0;
    let maxPossiblePoints = 0;

    for (const criteria of question.evaluationCriteria) {
      const score = criteriaScores[criteria.id] || 0;
      totalEarnedPoints += score;
      maxPossiblePoints += criteria.maxPoints;
    }

    // Нормализуем баллы к максимальным баллам за вопрос
    const earnedPoints =
      maxPossiblePoints > 0
        ? (totalEarnedPoints / maxPossiblePoints) * question.points
        : 0;

    // Округляем до 2 знаков после запятой
    const roundedEarnedPoints = Math.round(earnedPoints * 100) / 100;

    const isCorrect = roundedEarnedPoints === question.points;
    const feedback = `Оценено по ${question.evaluationCriteria.length} критериям. Набрано ${roundedEarnedPoints} из ${question.points} баллов.`;

    return {
      questionId: question.id,
      questionTitle: question.title,
      questionFormat: question.format,
      earnedPoints: roundedEarnedPoints,
      maxPoints: question.points,
      isCorrect,
      feedback,
      timeSpent: userAnswer.timeSpent,
    };
  }

  /**
   * Оценка практического задания по критериям (для ручной проверки)
   */
  static gradePracticalTaskByCriteria(
    question: Question & { format: TestFormat.PRACTICAL_TASK },
    userAnswer: UserAnswer,
    criteriaScores: { [criteriaId: string]: number }
  ): DetailedQuestionResult {
    // Подсчет баллов по критериям
    let totalEarnedPoints = 0;
    let maxPossiblePoints = 0;

    if (question.manualCriteria) {
      for (const criteria of question.manualCriteria) {
        const score = criteriaScores[criteria.id] || 0;
        totalEarnedPoints += score;
        maxPossiblePoints += criteria.maxPoints;
      }
    }

    // Нормализуем баллы к максимальным баллам за вопрос
    const earnedPoints =
      maxPossiblePoints > 0
        ? (totalEarnedPoints / maxPossiblePoints) * question.points
        : 0;

    // Округляем до 2 знаков после запятой
    const roundedEarnedPoints = Math.round(earnedPoints * 100) / 10;

    const isCorrect = roundedEarnedPoints === question.points;
    const feedback = `Практическое задание оценено. Набрано ${roundedEarnedPoints} из ${question.points} баллов.`;

    return {
      questionId: question.id,
      questionTitle: question.title,
      questionFormat: question.format,
      earnedPoints: roundedEarnedPoints,
      maxPoints: question.points,
      isCorrect,
      feedback,
      timeSpent: userAnswer.timeSpent,
    };
  }
}
