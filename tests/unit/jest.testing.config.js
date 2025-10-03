module.exports = {
  testEnvironment: "jsdom", // изменяем на jsdom для тестирования UI компонентов
  rootDir: "../..", // указывает на корень проекта
  roots: ["<rootDir>/tests/unit"], // указывает на папку с тестами
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "babel-jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: [], // использовать пустой массив, чтобы избежать проблем с setup файлом
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
  modulePaths: ["<rootDir>/src"],
  // Автоматически импортировать React в каждый тест
  setupFiles: ["<rootDir>/tests/unit/setupTests.js"],
};
