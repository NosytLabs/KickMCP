/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts'],
  collectCoverage: true,
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
};

module.exports = config;