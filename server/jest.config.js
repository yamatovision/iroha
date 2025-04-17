/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/index.ts',
    '!src/types/**',
    '!src/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
  verbose: true,
  // テストのタイムアウト値を増やす（バッチテスト用）
  testTimeout: 30000,
  // MongoDBへの接続などが必要なフックのタイムアウト値
  // Jest 28以降はsetupTimeoutがサポートされていないので削除
};