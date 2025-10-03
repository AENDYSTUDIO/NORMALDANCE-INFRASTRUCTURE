"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Question, TestFormat, UserAnswer } from "@/types/test-system";
import React, { useState } from "react";

interface QuestionRendererProps {
  question: Question;
  onAnswer: (answer: UserAnswer) => void;
  currentAnswer?: UserAnswer;
  timeRemaining?: number;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  onAnswer,
  currentAnswer,
  timeRemaining,
}) => {
  const [answer, setAnswer] = useState<any>(
    currentAnswer?.answer || getInitialAnswer()
  );

  function getInitialAnswer() {
    switch (question.format) {
      case TestFormat.MULTIPLE_CHOICE_SINGLE:
        return "";
      case TestFormat.MULTIPLE_CHOICE_MULTIPLE:
        return [];
      case TestFormat.MATCHING:
        return {};
      case TestFormat.ORDERING:
        return [...(question as any).items.map((item: any) => item.id)];
      case TestFormat.SHORT_ANSWER:
        return "";
      case TestFormat.ESSAY:
        return "";
      case TestFormat.PRACTICAL_TASK:
        return "";
      case TestFormat.CASE_STUDY:
        return {};
      default:
        return "";
    }
  }

  const handleSubmit = () => {
    onAnswer({
      questionId: question.id,
      answer: answer,
      timeSpent: question.timeLimit
        ? question.timeLimit - (timeRemaining || 0)
        : 0,
      submittedAt: new Date(),
    });
  };

  const renderQuestionContent = () => {
    switch (question.format) {
      case TestFormat.MULTIPLE_CHOICE_SINGLE:
        return renderMultipleChoiceSingle();
      case TestFormat.MULTIPLE_CHOICE_MULTIPLE:
        return renderMultipleChoiceMultiple();
      case TestFormat.MATCHING:
        return renderMatching();
      case TestFormat.ORDERING:
        return renderOrdering();
      case TestFormat.SHORT_ANSWER:
        return renderShortAnswer();
      case TestFormat.ESSAY:
        return renderEssay();
      case TestFormat.PRACTICAL_TASK:
        return renderPracticalTask();
      case TestFormat.CASE_STUDY:
        return renderCaseStudy();
      default:
        return <div>Неизвестный формат вопроса</div>;
    }
  };

  const renderMultipleChoiceSingle = () => {
    const q = question as Question & {
      format: TestFormat.MULTIPLE_CHOICE_SINGLE;
    };

    return (
      <RadioGroup
        value={answer as string}
        onValueChange={(value) => setAnswer(value)}
        className="space-y-2"
      >
        {q.options.map((option) => (
          <div
            key={option.id}
            className="flex items-center space-x-2 p-2 border rounded"
          >
            <RadioGroupItem value={option.id} id={option.id} />
            <Label htmlFor={option.id}>{option.text}</Label>
          </div>
        ))}
      </RadioGroup>
    );
  };

  const renderMultipleChoiceMultiple = () => {
    const q = question as Question & {
      format: TestFormat.MULTIPLE_CHOICE_MULTIPLE;
    };
    const selectedOptions = answer as string[];

    const handleOptionToggle = (optionId: string) => {
      if (selectedOptions.includes(optionId)) {
        setAnswer(selectedOptions.filter((id) => id !== optionId));
      } else {
        setAnswer([...selectedOptions, optionId]);
      }
    };

    return (
      <div className="space-y-2">
        {q.options.map((option) => (
          <div
            key={option.id}
            className="flex items-center space-x-2 p-2 border rounded"
          >
            <Checkbox
              id={option.id}
              checked={selectedOptions.includes(option.id)}
              onCheckedChange={() => handleOptionToggle(option.id)}
            />
            <Label htmlFor={option.id}>{option.text}</Label>
          </div>
        ))}
      </div>
    );
  };

  const renderMatching = () => {
    const q = question as Question & { format: TestFormat.MATCHING };
    const currentMatches = answer as { [key: string]: string };

    return (
      <div className="space-y-4">
        {q.pairs.map((pair, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 border rounded"
          >
            <div className="font-medium">{pair.left}</div>
            <div className="text-center">→</div>
            <select
              className="border rounded p-2 w-full sm:w-auto"
              value={currentMatches[pair.left] || ""}
              onChange={(e) => {
                const newMatches = {
                  ...currentMatches,
                  [pair.left]: e.target.value,
                };
                setAnswer(newMatches);
              }}
            >
              <option value="">Выберите соответствующий элемент</option>
              {q.pairs.map((p, idx) => (
                <option key={idx} value={p.right}>
                  {p.right}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  };

  const renderOrdering = () => {
    const q = question as Question & { format: TestFormat.ORDERING };
    const orderedItems = answer as string[];

    const moveItem = (fromIndex: number, toIndex: number) => {
      const newOrder = [...orderedItems];
      const [movedItem] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, movedItem);
      setAnswer(newOrder);
    };

    return (
      <div className="space-y-2">
        {orderedItems.map((itemId, index) => {
          const item = q.items.find((i) => i.id === itemId);
          return (
            <div
              key={itemId}
              className="flex items-center justify-between p-2 border rounded bg-gray-50"
            >
              <span>
                {index + 1}. {item?.text}
              </span>
              <div className="flex space-x-1">
                {index > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => moveItem(index, index - 1)}
                  >
                    ↑
                  </Button>
                )}
                {index < orderedItems.length - 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => moveItem(index, index + 1)}
                  >
                    ↓
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderShortAnswer = () => {
    const q = question as Question & { format: TestFormat.SHORT_ANSWER };

    return (
      <Input
        type={q.answerType === "number" ? "number" : "text"}
        value={answer as string}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Введите ваш ответ"
      />
    );
  };

  const renderEssay = () => {
    const q = question as Question & { format: TestFormat.ESSAY };

    return (
      <div className="space-y-2">
        {q.minLength && (
          <div className="text-sm text-gray-500">
            Минимум {q.minLength} символов
          </div>
        )}
        <Textarea
          value={answer as string}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Введите ваш развернутый ответ"
          rows={6}
          className={
            q.maxLength && (answer as string).length > q.maxLength
              ? "border-red-500"
              : ""
          }
        />
        {q.maxLength && (
          <div
            className={`text-sm ${
              answer.length > q.maxLength ? "text-red-500" : "text-gray-500"
            }`}
          >
            {answer.length}/{q.maxLength} символов
          </div>
        )}
      </div>
    );
  };

  const renderPracticalTask = () => {
    const q = question as Question & { format: TestFormat.PRACTICAL_TASK };

    if (q.submissionType === "file") {
      return (
        <div className="space-y-2">
          <Label htmlFor="file-upload">Загрузите ваше решение</Label>
          <Input
            id="file-upload"
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // В реальной реализации здесь будет обработка файла
                setAnswer(file.name);
              }
            }}
          />
        </div>
      );
    } else if (q.submissionType === "text") {
      return (
        <Textarea
          value={answer as string}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Опишите ваше решение практической задачи"
          rows={6}
        />
      );
    } else {
      return (
        <Input
          value={answer as string}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Введите ваше решение"
        />
      );
    }
  };

  const renderCaseStudy = () => {
    const q = question as Question & { format: TestFormat.CASE_STUDY };
    const caseAnswers = answer as { [key: string]: string };

    return (
      <div className="space-y-6">
        <div className="prose max-w-none p-4 bg-gray-50 rounded">
          <h4 className="font-bold">Ситуация:</h4>
          <p>{q.scenario}</p>
        </div>

        <div className="space-y-4">
          {q.questions.map((subQuestion) => (
            <Card key={subQuestion.id}>
              <CardHeader>
                <CardTitle className="text-base">{subQuestion.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {subQuestion.format === TestFormat.SHORT_ANSWER ? (
                  <Input
                    value={caseAnswers[subQuestion.id] || ""}
                    onChange={(e) =>
                      setAnswer({
                        ...caseAnswers,
                        [subQuestion.id]: e.target.value,
                      })
                    }
                    placeholder="Введите краткий ответ"
                  />
                ) : (
                  <Textarea
                    value={caseAnswers[subQuestion.id] || ""}
                    onChange={(e) =>
                      setAnswer({
                        ...caseAnswers,
                        [subQuestion.id]: e.target.value,
                      })
                    }
                    placeholder="Введите развернутый ответ"
                    rows={4}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{question.title}</h3>
        {question.description && (
          <p className="text-gray-600 mt-1">{question.description}</p>
        )}
        {timeRemaining !== undefined && (
          <div className="text-sm text-gray-500 mt-2">
            Оставшееся время: {Math.floor(timeRemaining / 60)}:
            {(timeRemaining % 60).toString().padStart(2, "0")}
          </div>
        )}
      </div>

      <div className="mb-4">{renderQuestionContent()}</div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit}>Сохранить ответ</Button>
      </div>
    </div>
  );
};

export default QuestionRenderer;
