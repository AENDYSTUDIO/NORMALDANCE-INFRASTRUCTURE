import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TestInterface from "../../src/components/testing/TestInterface";
import { DifficultyLevel, Test, TestFormat } from "../../src/types/test-system";

// Мок для TestTimer
jest.mock("../../src/components/testing/TestTimer", () => ({
  __esModule: true,
  default: (props) => (
    <div data-testid="test-timer">Time: {props.initialTime}</div>
  ),
}));

// Мок для TestProgress
jest.mock("../../src/components/testing/TestProgress", () => ({
  __esModule: true,
  default: (props) => (
    <div data-testid="test-progress">
      Question {props.currentQuestionIndex + 1} of {props.totalQuestions},
      Answered: {props.answeredQuestions.length}
    </div>
  ),
}));

// Мок для QuestionRenderer
jest.mock("../../src/components/testing/QuestionRenderer", () => ({
  __esModule: true,
  default: (props) => (
    <div data-testid="question-renderer">
      <div>{props.question.title}</div>
      <button
        data-testid="answer-btn"
        onClick={() =>
          props.onAnswer({
            questionId: props.question.id,
            answer: "test",
            timeSpent: 30,
            submittedAt: new Date(),
          })
        }
      >
        Answer
      </button>
    </div>
  ),
}));

describe("TestInterface Component", () => {
  const mockTest: Test = {
    id: "test1",
    title: "Sample Test",
    description: "A sample test for demonstration",
    questions: [
      {
        id: "q1",
        title: "Question 1",
        description: "First question",
        format: TestFormat.MULTIPLE_CHOICE_SINGLE,
        difficulty: DifficultyLevel.BEGINNER,
        points: 10,
        tags: ["tag1"],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: "author",
        isActive: true,
        options: [
          { id: "a1", text: "Option 1", isCorrect: true },
          { id: "a2", text: "Option 2", isCorrect: false },
        ],
      },
      {
        id: "q2",
        title: "Question 2",
        description: "Second question",
        format: TestFormat.MULTIPLE_CHOICE_SINGLE,
        difficulty: DifficultyLevel.INTERMEDIATE,
        points: 15,
        tags: ["tag2"],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: "author",
        isActive: true,
        options: [
          { id: "b1", text: "Option 1", isCorrect: true },
          { id: "b2", text: "Option 2", isCorrect: false },
        ],
      },
    ],
    totalPoints: 25,
    timeLimit: 1800,
    difficulty: DifficultyLevel.BEGINNER,
    category: "Category",
    tags: ["tag1", "tag2"],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: "author",
    isActive: true,
    isAdaptive: false,
    randomizeQuestions: false,
    randomizeOptions: false,
  };

  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with initial test data", () => {
    render(
      <TestInterface
        test={mockTest}
        userId="user123"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Sample Test")).toBeInTheDocument();
    expect(screen.getByTestId("test-timer")).toBeInTheDocument();
    expect(screen.getByTestId("test-progress")).toBeInTheDocument();
    expect(screen.getByTestId("question-renderer")).toBeInTheDocument();
    expect(screen.getByText("Question 1")).toBeInTheDocument();
  });

  it("allows navigation between questions", async () => {
    render(
      <TestInterface
        test={mockTest}
        userId="user123"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Check initial question
    expect(screen.getByText("Question 1")).toBeInTheDocument();

    // Go to next question
    const nextButton = screen.getByText("Следующий вопрос");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Question 2")).toBeInTheDocument();
    });

    // Go back to previous question
    const backButton = screen.getByText("Назад");
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.getByText("Question 1")).toBeInTheDocument();
    });
  });

  it("completes test when finish button is clicked", async () => {
    render(
      <TestInterface
        test={mockTest}
        userId="user123"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Answer the first question
    fireEvent.click(screen.getByTestId("answer-btn"));

    // Finish the test
    const finishButton = screen.getByText("Завершить тест");
    fireEvent.click(finishButton);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it("cancels test when cancel button is clicked", async () => {
    render(
      <TestInterface
        test={mockTest}
        userId="user123"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText("Отмена");
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
});
