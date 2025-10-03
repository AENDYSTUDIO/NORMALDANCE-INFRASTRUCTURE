// Типы данных для комплексной системы тестирования

// Основные перечисления
export enum TestFormat {
  MULTIPLE_CHOICE_SINGLE = "multiple_choice_single", // Множественный выбор (один правильный)
  MULTIPLE_CHOICE_MULTIPLE = "multiple_choice_multiple", // Множественный выбор (несколько правильных)
  MATCHING = "matching", // Сопоставление
  ORDERING = "ordering", // Упорядочивание
  SHORT_ANSWER = "short_answer", // Краткий ответ
  ESSAY = "essay", // Развернутый ответ
  PRACTICAL_TASK = "practical_task", // Практическое задание
  CASE_STUDY = "case_study", // Ситуационный кейс
}

export enum DifficultyLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
  EXPERT = "expert",
}

export enum AnswerType {
  TEXT = "text",
  NUMBER = "number",
  BOOLEAN = "boolean",
  FILE = "file",
  AUDIO = "audio",
  VIDEO = "video",
}

// Основные интерфейсы

// Базовый интерфейс для всех заданий
export interface BaseQuestion {
  id: string;
  title: string;
  description?: string;
  format: TestFormat;
  difficulty: DifficultyLevel;
  points: number;
  timeLimit?: number; // Время на выполнение в секундах
  tags: string[]; // Теги для категоризации
  createdAt: Date;
  updatedAt: Date;
  author: string;
  isActive: boolean;
}

// Интерфейс для задания с множественным выбором (один правильный вариант)
export interface MultipleChoiceSingleQuestion extends BaseQuestion {
  format: TestFormat.MULTIPLE_CHOICE_SINGLE;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

// Интерфейс для задания с множественным выбором (несколько правильных вариантов)
export interface MultipleChoiceMultipleQuestion extends BaseQuestion {
  format: TestFormat.MULTIPLE_CHOICE_MULTIPLE;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

// Интерфейс для задания на сопоставление
export interface MatchingQuestion extends BaseQuestion {
  format: TestFormat.MATCHING;
  pairs: {
    left: string;
    right: string;
  }[];
  // Правильные сопоставления хранятся в pairs, пользователь должен сопоставить их
}

// Интерфейс для задания на упорядочивание
export interface OrderingQuestion extends BaseQuestion {
  format: TestFormat.ORDERING;
  items: {
    id: string;
    text: string;
  }[];
  correctOrder: string[]; // Массив ID в правильном порядке
}

// Интерфейс для задания с кратким ответом
export interface ShortAnswerQuestion extends BaseQuestion {
  format: TestFormat.SHORT_ANSWER;
  answerType: AnswerType;
  correctAnswer: string | number | boolean; // Ожидаемый ответ
  caseSensitive?: boolean; // Учитывать регистр
  tolerance?: number; // Допустимая погрешность для чисел
}

// Интерфейс для задания с развернутым ответом
export interface EssayQuestion extends BaseQuestion {
  format: TestFormat.ESSAY;
  answerType: AnswerType.TEXT;
  minLength?: number; // Минимальная длина ответа
  maxLength?: number; // Максимальная длина ответа
  evaluationCriteria: EssayEvaluationCriteria[]; // Критерии оценки
}

// Интерфейс для практического задания
export interface PracticalTaskQuestion extends BaseQuestion {
  format: TestFormat.PRACTICAL_TASK;
  taskDescription: string;
  submissionType: AnswerType;
  evaluationMethod: "automated" | "manual" | "hybrid";
  automatedTests?: string[]; // Описание автоматических тестов
  manualCriteria?: ManualEvaluationCriteria[]; // Ручные критерии оценки
}

// Интерфейс для ситуационного кейса
export interface CaseStudyQuestion extends BaseQuestion {
  format: TestFormat.CASE_STUDY;
  scenario: string; // Описание ситуации
  questions: (ShortAnswerQuestion | EssayQuestion)[]; // Подвопросы кейса
}

// Критерии оценки для эссе
export interface EssayEvaluationCriteria {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  weight: number; // Вес критерия в общей оценке (0-1)
}

// Ручные критерии оценки
export interface ManualEvaluationCriteria {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
}

// Объединенный тип для всех форматов заданий
export type Question =
  | MultipleChoiceSingleQuestion
  | MultipleChoiceMultipleQuestion
  | MatchingQuestion
  | OrderingQuestion
  | ShortAnswerQuestion
  | EssayQuestion
  | PracticalTaskQuestion
  | CaseStudyQuestion;

// Интерфейс для теста
export interface Test {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  totalPoints: number;
  timeLimit?: number; // Общее время на выполнение теста
  difficulty: DifficultyLevel;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  author: string;
  isActive: boolean;
  isAdaptive: boolean; // Адаптивный тест или нет
  randomizeQuestions: boolean; // Рандомизировать порядок вопросов
  randomizeOptions: boolean; // Рандомизировать порядок вариантов ответов
}

// Интерфейс для ответа пользователя на вопрос
export interface UserAnswer {
  questionId: string;
  answer: string | number | boolean | string[] | { [key: string]: string }; // Зависит от формата вопроса
  timeSpent: number; // Время, затраченное на ответ в секундах
  submittedAt: Date;
}

// Интерфейс для результата теста
export interface TestResult {
  id: string;
  userId: string;
  testId: string;
  testName: string;
  answers: UserAnswer[];
  score: number; // Набранные баллы
  maxScore: number; // Максимально возможные баллы
  percentage: number; // Процент правильных ответов
  timeSpent: number; // Общее время выполнения
  completedAt: Date;
  feedback?: string; // Общий комментарий по результатам
  detailedResults: DetailedQuestionResult[]; // Результаты по каждому вопросу
  knowledgeGaps: string[]; // Выявленные пробелы в знаниях
  recommendations: string[]; // Персонализированные рекомендации
}

// Интерфейс для результата по отдельному вопросу
export interface DetailedQuestionResult {
  questionId: string;
  questionTitle: string;
  questionFormat: TestFormat;
  earnedPoints: number;
  maxPoints: number;
  isCorrect: boolean;
  feedback?: string; // Комментарий к ответу
  timeSpent: number;
}

// Интерфейс для профиля пользователя в системе тестирования
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currentLevel: DifficultyLevel;
  skills: string[]; // Навыки пользователя
  testHistory: TestResult[];
  overallScore: number; // Средний балл
  completedTests: number; // Количество пройденных тестов
  lastTestDate: Date;
  learningPath: string[]; // Рекомендуемый путь обучения
}

// Интерфейс для настройки адаптивного тестирования
export interface AdaptiveSettings {
  initialDifficulty: DifficultyLevel;
  difficultyAdjustment: "linear" | "exponential"; // Метод изменения сложности
  adjustmentFactor: number; // Коэффициент изменения сложности
  minQuestions: number; // Минимальное количество вопросов
  maxQuestions: number; // Максимальное количество вопросов
  accuracyThreshold: number; // Порог точности для изменения сложности
}

// Интерфейс для настройки теста
export interface TestSettings {
  allowNavigation: boolean; // Разрешить переход между вопросами
  allowBack: boolean; // Разрешить возвращаться к предыдущим вопросам
  showResults: "immediately" | "after_completion" | "later"; // Показывать результаты
  feedbackMode: "detailed" | "basic" | "none"; // Режим обратной связи
  certificateOnCompletion: boolean; // Выдавать сертификат по завершении
}
