/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/integration/**/*.integration.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  globalSetup: '<rootDir>/src/__tests__/integration/globalSetup.js',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/integration/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__tests__/**',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage-integration',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  clearMocks: true,
  // Serialize test suites — parallel runs would truncate each other's data
  maxWorkers: 1,
  // bcrypt cost 12 + real DB operations need more time
  testTimeout: 30000,
};
