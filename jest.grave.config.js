module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/grave/**/*.test.js'],
  collectCoverageFrom: [
    'src/app/api/grave/**/*.ts',
    'src/components/grave/**/*.tsx',
    'src/lib/grave-*.ts'
  ],
  setupFilesAfterEnv: [],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 10000
};