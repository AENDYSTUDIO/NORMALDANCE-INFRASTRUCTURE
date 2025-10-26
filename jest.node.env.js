/**
 * Кастомное окружение Jest (Node).
 * Экспортируем базовое окружение без наследования, чтобы избежать ошибок "Class extends value ..." и "TestEnvironment is not a constructor".
 * Используется в [JavaScript.module.exports](tests/jest.config.js:1) через testEnvironment: '<rootDir>/jest.node.env.js'
 */
module.exports = require("jest-environment-node");
