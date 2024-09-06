/* eslint-disable unicorn/prefer-module */

module.exports = {
  preset: 'ts-jest',
  automock: false,
  verbose: true,
  runner: 'groups',
  collectCoverageFrom: [
    '**/*.{js,jsx,ts, tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  moduleNameMapper: {

    /* App shortcut paths */
    '^~/(.*)$': '<rootDir>/$1',
    '^~tests-utils/(.*)$': '<rootDir>/__tests__/testUtils/$1',
    '^~types/(.*)$': '<rootDir>/interfaces/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  transformIgnorePatterns: [
    '/node_modules/'
  ]
};
