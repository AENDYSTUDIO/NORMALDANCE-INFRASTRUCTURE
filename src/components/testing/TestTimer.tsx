"use client";

import React, { useEffect, useState } from "react";

interface TestTimerProps {
  initialTime: number; // Время в секундах
  onTimeUp: () => void;
  onTick?: (remainingTime: number) => void;
}

const TestTimer: React.FC<TestTimerProps> = ({
  initialTime,
  onTimeUp,
  onTick,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerId);
          onTimeUp();
          return 0;
        }
        const newTime = prevTime - 1;
        onTick?.(newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, onTimeUp, onTick]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timeLeft < 60) return "text-red-600"; // Меньше минуты
    if (timeLeft < 300) return "text-yellow-600"; // Меньше 5 минут
    return "text-green-600";
  };

  return (
    <div className={`text-xl font-bold ${getTimerColor()}`}>
      {formatTime(timeLeft)}
    </div>
  );
};

export default TestTimer;
