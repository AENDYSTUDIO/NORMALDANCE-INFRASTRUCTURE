"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradingSystem } from "@/lib/testing/grading-system";
import {
  DetailedQuestionResult,
  Test,
  TestResult,
  UserAnswer,
} from "@/types/test-system";
import React, { useEffect, useState } from "react";
import QuestionRenderer from "./QuestionRenderer";
import TestProgress from "./TestProgress";
import TestTimer from "./TestTimer";

interface TestInterfaceProps {
  test: Test;
  userId: string;
  onComplete: (result: TestResult) => void;
  onCancel?: () => void;
}

const TestInterface: React.FC<TestInterfaceProps> = ({
  test,
  userId,
  onComplete,
  onCancel,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(test.timeLimit || 0);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [isTestCancelled, setIsTestCancelled] = useState(false);

  // Инициализация ответов - изначально массив пустой, так как пользователь еще не отвечал
  useEffect(() => {
    setAnswers([]);
  }, [test.questions]);

  const handleAnswer = (answer: UserAnswer) => {
    setAnswers((prev) => {
      const existingAnswerIndex = prev.findIndex(
        (a) => a.questionId === answer.questionId
      );

      if (existingAnswerIndex !== -1) {
        const updated = [...prev];
        updated[existingAnswerIndex] = answer;
        return updated;
      } else {
        return [...prev, answer];
      }
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleTimeUp = () => {
    // Автоматически завершить тест по истечении времени
    finishTest();
  };

  const handleFinishTest = () => {
    finishTest();
  };

  const finishTest = () => {
    setIsTestCompleted(true);

    // Подсчет результатов
    const detailedResults: DetailedQuestionResult[] = test.questions.map(
      (question) => {
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
      }
    );

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
    const recommendations = generateRecommendations(detailedResults);

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

    onComplete(result);
  };

  const generateRecommendations = (
    detailedResults: DetailedQuestionResult[]
  ): string[] => {
    const recommendations: string[] = [];

    // Определение слабых тем на основе результатов
    const incorrectResults = detailedResults.filter((r) => !r.isCorrect);
    const weakAreas = [
      ...new Set(incorrectResults.map((r) => r.questionTitle)),
    ];

    if (weakAreas.length > 0) {
      recommendations.push(
        `Рекомендуется повторить следующие темы: ${weakAreas
          .slice(0, 3)
          .join(", ")}.`
      );
    }

    // Добавление рекомендаций на основе формата вопросов
    const questionFormats = [
      ...new Set(incorrectResults.map((r) => r.questionFormat)),
    ];

    if (questionFormats.includes("essay")) {
      recommendations.push(
        "Практикуйтесь в написании развернутых ответов, уделяя внимание структуре и аргументации."
      );
    }

    if (questionFormats.includes("practical_task")) {
      recommendations.push(
        "Уделите больше внимания практическому применению знаний."
      );
    }

    if (questionFormats.includes("case_study")) {
      recommendations.push(
        "Развивайте навыки анализа ситуаций и принятия решений в нестандартных ситуациях."
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Отличная работа! Продолжайте изучать материал для дальнейшего развития."
      );
    }

    return recommendations;
  };

  const handleCancel = () => {
    setIsTestCancelled(true);
    onCancel?.();
  };

  const currentQuestion = test.questions[currentQuestionIndex];
  const currentAnswer = answers.find(
    (a) => a.questionId === currentQuestion.id
  );
  // Изменяем тип answeredQuestions с number[] на string[]
  const answeredQuestionIds = answers
    .filter((a) => a.answer !== null)
    .map((a) => a.questionId);

  if (isTestCancelled) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Тест отменен</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Вы отменили прохождение теста.</p>
          {onCancel && (
            <Button onClick={onCancel} className="mt-4">
              Вернуться к списку тестов
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isTestCompleted) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Тест завершен!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Спасибо за прохождение теста. Ваши результаты обрабатываются.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{test.title}</CardTitle>
        {test.timeLimit && (
          <div className="flex items-center space-x-2">
            <span>Время:</span>
            <TestTimer
              initialTime={timeRemaining}
              onTimeUp={handleTimeUp}
              onTick={setTimeRemaining}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6">
        <div className="mb-6">
          <TestProgress
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={test.questions.length}
            answeredQuestions={answeredQuestionIds}
          />
        </div>

        <div className="mb-6">
          <QuestionRenderer
            question={currentQuestion}
            onAnswer={handleAnswer}
            currentAnswer={currentAnswer}
            timeRemaining={currentQuestion.timeLimit}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <Button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              variant="outline"
            >
              Назад
            </Button>
          </div>

          <div className="flex space-x-2">
            {onCancel && (
              <Button onClick={handleCancel} variant="secondary">
                Отмена
              </Button>
            )}

            {currentQuestionIndex < test.questions.length - 1 ? (
              <Button onClick={handleNextQuestion}>Следующий вопрос</Button>
            ) : (
              <Button onClick={handleFinishTest}>Завершить тест</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestInterface;
