/**
 * Кастомная обёртка окружения Jest для Node.
 * Исправляет ошибку "TestEnvironment is not a constructor" в смешанных ESM/CJS сборках.
 * Используйте вместе с [JavaScript.module.exports](tests/jest.config.js:2) testEnvironment: '<rootDir>/tests/jest.node.env.js'
 */
const NodeEnvironment = require("jest-environment-node");

class CustomNodeEnvironment extends NodeEnvironment {}

module.exports = CustomNodeEnvironment;
