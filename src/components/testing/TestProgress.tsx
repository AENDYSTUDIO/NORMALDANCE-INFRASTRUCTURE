"use client";

import { Progress } from "@/components/ui/progress";
import React from "react";

interface TestProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredQuestions: string[]; // Изменили тип на string[]
}

const TestProgress: React.FC<TestProgressProps> = ({
  currentQuestionIndex,
  totalQuestions,
  answeredQuestions,
}) => {
  const progressPercentage = Math.round(
    ((currentQuestionIndex + 1) / totalQuestions) * 100
  );
  const answeredPercentage = Math.round(
    (answeredQuestions.length / totalQuestions) * 100
  );

  // Подсчет количества отвеченных вопросов из общего числа
  const answeredCount = answeredQuestions.length;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm">
        <span>
          Вопрос {currentQuestionIndex + 1} из {totalQuestions}
        </span>
        <span>
          Отвечено: {answeredCount} из {totalQuestions}
        </span>
      </div>

      <Progress value={progressPercentage} className="h-2" />

      <div className="flex justify-between text-xs text-gray-500">
        <span>Прогресс теста: {progressPercentage}%</span>
        <span>Выполнено: {answeredPercentage}%</span>
      </div>
    </div>
  );
};

export default TestProgress;
