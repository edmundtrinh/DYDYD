const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // NOTE: This overrides jest-expo's default transformIgnorePatterns.
  // In a monorepo, node_modules live at the root, so the pattern must
  // reference ../../node_modules. If tests fail on transforms after the
  // Expo 53 upgrade, try removing this override to use jest-expo's defaults
  // and see if the monorepo resolution still works.
  transformIgnorePatterns: [
    '<rootDir>/../../node_modules/(?!(react-native|@react-native|@react-navigation|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-vector-icons|@react-native-async-storage|@react-native-community|react-redux|@reduxjs/toolkit|expo|expo-modules-core)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@dydyd/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  moduleDirectories: ['node_modules', path.resolve(__dirname, '../../node_modules')],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  clearMocks: true,
  testTimeout: 10000,
};
