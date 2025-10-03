"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestingService } from "@/lib/testing/testing-service";
import {
  AnswerType,
  DifficultyLevel,
  Question,
  Test,
  TestFormat,
  TestResult,
  UserProfile,
} from "@/types/test-system";
import React, { useState } from "react";
import TestInterface from "./TestInterface";

// Демонстрация работы системы тестирования
const TestingSystemDemo: React.FC = () => {
  const [currentView, setCurrentView] = useState<"menu" | "test" | "results">(
    "menu"
  );
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: "demo-user-1",
    name: "Демонстрационный пользователь",
    email: "demo@example.com",
    currentLevel: DifficultyLevel.INTERMEDIATE,
    skills: ["JavaScript", "TypeScript", "React"],
    testHistory: [],
    overallScore: 0,
    completedTests: 0,
    lastTestDate: new Date(),
    learningPath: [],
  });

  // Создание демонстрационных вопросов
  const demoQuestions: Question[] = [
    {
      id: "q1",
      title: "Вопрос с множественным выбором",
      description: "Выберите правильный вариант ответа",
      format: TestFormat.MULTIPLE_CHOICE_SINGLE,
      difficulty: DifficultyLevel.BEGINNER,
      points: 10,
      tags: ["JavaScript"],
      createdAt: new Date(),
      updatedAt: new Date(),
      author: "system",
      isActive: true,
      options: [
        { id: "a1", text: "Вариант 1", isCorrect: false },
        { id: "a2", text: "Вариант 2", isCorrect: true },
        { id: "a3", text: "Вариант 3", isCorrect: false },
        { id: "a4", text: "Вариант 4", isCorrect: false },
      ],
    },
    {
      id: "q2",
      title: "Вопрос на сопоставление",
      description: "Сопоставьте элементы левого столбца с правым",
      format: TestFormat.MATCHING,
      difficulty: DifficultyLevel.INTERMEDIATE,
      points: 15,
      tags: ["React"],
      createdAt: new Date(),
      updatedAt: new Date(),
      author: "system",
      isActive: true,
      pairs: [
        { left: "Component", right: "Компонент" },
        { left: "Props", right: "Свойства" },
        { left: "State", right: "Состояние" },
      ],
    },
    {
      id: "q3",
      title: "Практическое задание",
      description: "Опишите, как работает замыкание в JavaScript",
      format: TestFormat.ESSAY,
      difficulty: DifficultyLevel.ADVANCED,
      points: 20,
      tags: ["JavaScript"],
      createdAt: new Date(),
      updatedAt: new Date(),
      author: "system",
      isActive: true,
      answerType: AnswerType.TEXT,
      minLength: 100,
      maxLength: 1000,
      evaluationCriteria: [
        {
          id: "c1",
          name: "Понимание концепции",
          description: "Правильное объяснение замыкания",
          maxPoints: 10,
          weight: 0.5,
        },
        {
          id: "c2",
          name: "Примеры",
          description: "Наличие примеров использования",
          maxPoints: 10,
          weight: 0.5,
        },
      ],
    },
  ];

  const testingService = new TestingService();

  const startDemoTest = () => {
    // Создаем тест из демонстрационных вопросов
    const test = testingService.createTest(demoQuestions, {
      title: "Демонстрационный тест",
      description: "Тест для демонстрации возможностей системы",
      category: "Programming",
      tags: ["JavaScript", "React"],
      timeLimit: 1800, // 30 минут
    });

    setCurrentTest(test);
    setCurrentView("test");
  };

  const startAdaptiveTest = () => {
    // Генерируем адаптивный тест на основе профиля пользователя
    const adaptiveTest = testingService.generateAdaptiveTest(
      demoQuestions,
      userProfile,
      {
        initialDifficulty: userProfile.currentLevel,
        difficultyAdjustment: "linear",
        adjustmentFactor: 1,
        minQuestions: 5,
        maxQuestions: 10,
        accuracyThreshold: 70,
      }
    );

    setCurrentTest(adaptiveTest);
    setCurrentView("test");
  };

  const handleTestComplete = (result: TestResult) => {
    setTestResult(result);
    setCurrentView("results");

    // Обновляем профиль пользователя
    const updatedProfile = testingService.updateProfileWithTestResult(
      userProfile,
      result
    );
    setUserProfile(updatedProfile);
  };

  const generateRandomTest = () => {
    const randomTest = testingService.generateRandomTest(demoQuestions, {
      title: "Случайный тест",
      description: "Тест, сгенерированный случайным образом",
      category: "Programming",
      questionCount: 5,
      timeLimit: 1200, // 20 минут
    });

    setCurrentTest(randomTest);
    setCurrentView("test");
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Демонстрация системы тестирования
      </h1>

      {currentView === "menu" && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Выберите тип теста</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={startDemoTest} className="w-full">
              Стандартный тест
            </Button>

            <Button
              onClick={startAdaptiveTest}
              variant="outline"
              className="w-full"
            >
              Адаптивный тест
            </Button>

            <Button
              onClick={generateRandomTest}
              variant="secondary"
              className="w-full"
            >
              Случайный тест
            </Button>
          </CardContent>
        </Card>
      )}

      {currentView === "test" && currentTest && (
        <TestInterface
          test={currentTest}
          userId={userProfile.id}
          onComplete={handleTestComplete}
          onCancel={() => setCurrentView("menu")}
        />
      )}

      {currentView === "results" && testResult && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Результаты теста</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-100 p-4 rounded">
                  <h3 className="font-semibold">Общий результат</h3>
                  <p>
                    Баллы: {testResult.score} из {testResult.maxScore}
                  </p>
                  <p>Процент: {testResult.percentage.toFixed(2)}%</p>
                </div>

                <div className="bg-gray-100 p-4 rounded">
                  <h3 className="font-semibold">Время выполнения</h3>
                  <p>
                    {Math.floor(testResult.timeSpent / 60)} мин{" "}
                    {testResult.timeSpent % 60} сек
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-2">Рекомендации:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {testResult.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-2">Пробелы в знаниях:</h3>
                {testResult.knowledgeGaps.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {testResult.knowledgeGaps.map((gap, index) => (
                      <li key={index}>{gap}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Пробелов в знаниях не выявлено</p>
                )}
              </div>

              <div className="flex justify-center mt-6">
                <Button onClick={() => setCurrentView("menu")}>
                  Вернуться в меню
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestingSystemDemo;
